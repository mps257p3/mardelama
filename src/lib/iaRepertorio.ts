import { db, type Referencia } from '../db/schema'
import { lerPerfil, salvarPerfil, UNIVERSOS, type GostoIA } from './curadoria'
import type { FonteId, ItemDescoberta } from './fontes'
import { FONTE, viaPonte } from './fontes'

/**
 * IA do Repertório. Tudo passa pela função /api/ia no servidor; a chave nunca chega ao aparelho.
 * Sem chave configurada, o app mostra esse estado e segue funcionando sem IA.
 */

export interface Consulta { q: string; universo: string; fonte?: FonteId; lingua?: string }
export interface LeituraBusca { leitura: string; consultas: Consulta[] }
export interface SugestaoCatalogo {
  titulo: string; descricao: string; tipo: string; tags: string[]; grupos: string[]; paleta: string[]; aplicacoes: string[]
  atribuicao: { autor: string; certeza: 'informada' | 'desconhecida'; nota: string }
}
export interface Repertorio {
  sintese: string; paleta: string[]; temas: string[]; linguagens: string[]; formas: string[]; texturas: string[]
  artistas: string[]; tendencias: string[]; evolucao: string; proximos: string[]
}
export interface RepertorioSalvo { r: Repertorio; quando: number; base: number }
/** Correções: itens que você tirou e observações livres; vão junto na próxima síntese. */
export interface Correcoes { removidos: string[]; nota: string }

let estado: Promise<boolean> | undefined
export function iaConfigurada(): Promise<boolean> {
  estado ??= fetch('/api/ia').then((r) => (r.ok ? r.json() : { configurada: false })).then((j) => !!j.configurada).catch(() => false)
  return estado
}

async function chamar<T>(corpo: Record<string, unknown>, ms = 90000): Promise<T> {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), ms)
  try {
    const r = await fetch('/api/ia', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(corpo), signal: c.signal })
    const j = await r.json().catch(() => ({ erro: `A IA não respondeu (HTTP ${r.status})` }))
    if (!r.ok || !j.resultado) throw new Error(j.erro ?? `HTTP ${r.status}`)
    return j.resultado as T
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw new Error('A IA demorou demais para responder')
    throw e
  } finally { clearTimeout(t) }
}

const topo = (o: Record<string, number>, n: number) => Object.entries(o).filter(([, p]) => p > 0).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => k)

/** Em que acervo cada idioma rende: o Rijks cataloga em holandês, o SMK em dinamarquês, a Europeana e a Wikimedia em várias línguas. */
const ACERVO_DA_LINGUA: Record<string, FonteId[]> = { nl: ['rijks', 'eu'], da: ['smk'], fr: ['eu'], de: ['eu'], it: ['eu'], es: ['eu', 'wm'], pt: ['eu', 'wm'] }

/** Busca em qualquer idioma: vira consultas em inglês para todos os acervos e traduções para os acervos europeus.
 *  Guardada no aparelho para não pagar a mesma busca duas vezes. */
export async function interpretarBusca(pedido: string): Promise<LeituraBusca> {
  const k = 'ia.busca2.' + pedido.trim().toLowerCase()
  const ja = await db.ajustes.get(k)
  if (ja?.valor) return ja.valor as LeituraBusca
  const perfil = await lerPerfil()
  const r = await chamar<LeituraBusca & { outras_linguas?: { lingua: string; q: string }[] }>({ acao: 'buscar', pedido, universos: Object.keys(UNIVERSOS), gosto: topo(perfil.termos, 20) }, 45000)
  const universo = r.consultas[0]?.universo ?? ''
  const locais = (r.outras_linguas ?? []).flatMap((o) => (ACERVO_DA_LINGUA[o.lingua] ?? []).map((fonte) => ({ q: o.q, universo, fonte, lingua: o.lingua })))
  const out: LeituraBusca = { leitura: r.leitura, consultas: [...r.consultas.slice(0, 6), ...locais.slice(0, 10)] }
  await db.ajustes.put({ chave: k, valor: out })
  return out
}

/** Reduz a imagem a 1024 px em JPEG e devolve em base64 (cabe no limite do servidor e custa menos). */
async function paraBase64(b: Blob) {
  const bmp = await createImageBitmap(b)
  const k = Math.min(1, 1024 / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k)
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height)
  return c.toDataURL('image/jpeg', 0.85).split(',')[1]
}

async function imagemDa(r: Referencia): Promise<{ base64: string; tipo: string } | { url: string }> {
  const arq = r.imagens[0] ? await db.arquivos.get(r.imagens[0]) : undefined
  if (arq?.blob) return { base64: await paraBase64(arq.blob), tipo: 'image/jpeg' }
  if (r.imagemExterna) {
    try { const res = await fetch(viaPonte(r.imagemExterna)); if (res.ok) return { base64: await paraBase64(await res.blob()), tipo: 'image/jpeg' } } catch { /* tenta pelo link */ }
    return { url: r.imagemExterna }
  }
  throw new Error('Esta referência não tem imagem para analisar')
}

/** Sugere título, descrição, tipo, tags, grupos, paleta e aplicações. Nada é gravado sem revisão. */
export async function sugerirCatalogo(r: Referencia): Promise<SugestaoCatalogo> {
  const grupos = (await db.grupos.toArray()).filter((g) => !g.excluido).map((g) => g.nome)
  return chamar<SugestaoCatalogo>({
    acao: 'catalogar', imagem: await imagemDa(r), grupos,
    titulo: r.titulo, autor: r.autor, fonte: [r.fonte, r.url].filter(Boolean).join(' · '), descricao: r.descricao, tags: r.tags,
  })
}

const CHAVE_REP = 'repertorio.ia'
const CHAVE_COR = 'repertorio.correcoes'
export async function lerRepertorio() { return (await db.ajustes.get(CHAVE_REP))?.valor as RepertorioSalvo | undefined }
export async function lerCorrecoes(): Promise<Correcoes> { return { removidos: [], nota: '', ...((await db.ajustes.get(CHAVE_COR))?.valor as Partial<Correcoes> ?? {}) } }
export const salvarCorrecoes = (c: Correcoes) => db.ajustes.put({ chave: CHAVE_COR, valor: c })
export const salvarRepertorio = (s: RepertorioSalvo) => db.ajustes.put({ chave: CHAVE_REP, valor: s })

/** Resumo enxuto do acervo e das interações (contagens, não imagens): é o que a IA lê para o perfil. */
export async function resumoDoAcervo() {
  const refs = (await db.referencias.toArray()).filter((r) => !r.excluido).sort((a, b) => a.criadoEm - b.criadoEm)
  const grupos = new Map((await db.grupos.toArray()).map((g) => [g.id, g.nome]))
  const perfil = await lerPerfil()
  const conta = (xs: (string | undefined)[]) => { const m: Record<string, number> = {}; xs.forEach((x) => { if (x) m[x] = (m[x] ?? 0) + 1 }); return Object.fromEntries(Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 40)) }
  const fatia = (rs: Referencia[]) => ({ tags: conta(rs.flatMap((r) => r.tags)), grupos: conta(rs.flatMap((r) => r.grupos.map((g) => grupos.get(g)))), tipos: conta(rs.map((r) => r.tipo)) })
  const meio = Math.floor(refs.length / 2)
  return {
    total: refs.length, favoritas: refs.filter((r) => r.favorito).length,
    titulos: refs.filter((r) => !/^(whatsapp image|img[_ -]?\d|screenshot|pxl_|dsc_?\d)/i.test(r.titulo)).slice(-60).map((r) => r.titulo),
    autores: conta(refs.map((r) => r.autor)), paletas: conta(refs.flatMap((r) => r.paleta ?? [])),
    geral: fatia(refs), maisAntigas: fatia(refs.slice(0, meio)), maisRecentes: fatia(refs.slice(meio)),
    descobrir: { termos: topo(perfil.termos, 30), universos: topo(perfil.universos, 10), artistas: topo(perfil.artistas, 15), interessesDoMomento: Object.keys(perfil.temporario).slice(0, 10) },
  }
}

export async function gerarRepertorio(): Promise<RepertorioSalvo> {
  const [resumo, correcoes] = await Promise.all([resumoDoAcervo(), lerCorrecoes()])
  const r = await chamar<Repertorio>({ acao: 'perfil', resumo, correcoes })
  const s = { r, quando: Date.now(), base: resumo.total }
  await salvarRepertorio(s)
  return s
}

export interface Explicacao { oque: string; tecnica: string; origem: string; olhar: string[]; ideias: string[] }

/** Explica uma obra do Descobrir (técnica, origem, o que observar, ideias para o ateliê). Guardada no aparelho para não pagar duas vezes. */
export async function explicarObra(x: ItemDescoberta): Promise<Explicacao> {
  const k = 'ia.explica.' + x.id
  const ja = await db.ajustes.get(k)
  if (ja?.valor) return ja.valor as Explicacao
  let imagem: { base64: string; tipo: string } | { url: string } = { url: x.imagemGrande }
  try { const res = await fetch(viaPonte(x.imagem)); if (res.ok) { const b = await res.blob(); if (b.size > 1000) imagem = { base64: await paraBase64(b), tipo: 'image/jpeg' } } } catch { /* manda o link */ }
  const perfil = await lerPerfil()
  const r = await chamar<Explicacao>({ acao: 'explicar', imagem, titulo: x.titulo, autor: x.autor, data: x.data, fonte: FONTE[x.fonte]?.nome, termos: x.termos, gosto: topo(perfil.termos, 15) }, 60000)
  await db.ajustes.put({ chave: k, valor: r })
  return r
}

/**
 * Leitura do gosto pela IA: lê curtidas, salvas, recusas e o acervo e devolve um resumo e novas consultas.
 * Para economizar, só roda com pelo menos 3 curtidas/salvas novas desde a última leitura e no máximo a cada 12 horas
 * (ou quando você pede em Ajustar curadoria).
 */
export async function atualizarGostoIA(forcar = false): Promise<GostoIA | undefined> {
  const perfil = await lerPerfil()
  const g = perfil.gostoIA
  const base = perfil.historico.length
  const novos = perfil.historico.filter((h) => h.quando > (g?.quando ?? 0)).length
  if (!forcar && (novos < 3 || (g && Date.now() - g.quando < 12 * 3600000))) return g
  if (!(await iaConfigurada())) return g
  const curta = (x: { titulo: string; autor?: string; termos: string[]; data?: string }) => ({ t: x.titulo.slice(0, 80), a: x.autor, d: x.data, termos: x.termos.slice(0, 6) })
  const salvasRefs = (await db.referencias.filter((r) => !r.excluido && !!r.origem?.startsWith('descobrir:')).toArray()).slice(-40)
  const refs = (await db.referencias.filter((r) => !r.excluido && !r.origem?.startsWith('descobrir:')).toArray()).slice(-60)
  const negativos = Object.entries(perfil.termos).filter(([, v]) => v < 0).sort((a, b) => a[1] - b[1]).slice(0, 15).map(([k]) => k)
  const r = await chamar<Omit<GostoIA, 'quando' | 'base'>>({
    acao: 'gosto', universos: Object.keys(UNIVERSOS),
    curtidas: (perfil.curtidasItens ?? []).slice(-50).map(curta),
    salvas: salvasRefs.map((x) => ({ t: x.titulo.slice(0, 80), a: x.autor, tags: x.tags.slice(0, 6) })),
    recusadas: negativos,
    termos: topo(perfil.termos, 25),
    referencias: refs.map((x) => ({ t: x.titulo.slice(0, 60), tags: x.tags.slice(0, 5) })),
  }, 60000)
  const novo: GostoIA = { ...r, consultas: r.consultas.filter((c) => c.q && UNIVERSOS[c.universo]).slice(0, 16), quando: Date.now(), base }
  const atual = await lerPerfil()
  await salvarPerfil({ ...atual, gostoIA: novo })
  return novo
}
