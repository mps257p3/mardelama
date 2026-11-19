import { db, type Referencia } from '../db/schema'
import { lerPerfil, UNIVERSOS } from './curadoria'
import { viaPonte } from './fontes'

/**
 * IA do Repertório. Tudo passa pela função /api/ia no servidor; a chave nunca chega ao aparelho.
 * Sem chave configurada, o app mostra esse estado e segue funcionando sem IA.
 */

export interface Consulta { q: string; universo: string }
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

/** Busca em linguagem natural: vira consultas em inglês para os acervos. Guardado na sessão para não pagar duas vezes. */
export async function interpretarBusca(pedido: string): Promise<LeituraBusca> {
  const k = 'ia.busca.' + pedido.trim().toLowerCase()
  try { const c = sessionStorage.getItem(k); if (c) return JSON.parse(c) } catch { /* sem armazenamento */ }
  const perfil = await lerPerfil()
  const r = await chamar<LeituraBusca>({ acao: 'buscar', pedido, universos: Object.keys(UNIVERSOS), gosto: topo(perfil.termos, 20) }, 45000)
  try { sessionStorage.setItem(k, JSON.stringify(r)) } catch { /* cheio */ }
  return r
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
