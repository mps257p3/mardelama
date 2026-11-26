import { db, type Referencia } from '../db/schema'
import { cabecalhoLogin } from './login'
import { iaAutomaticaLigada, registrarGasto } from './gastoIA'
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

export async function chamar<T>(corpo: Record<string, unknown>, ms = 90000): Promise<T> {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), ms)
  try {
    const r = await fetch('/api/ia', { method: 'POST', headers: { 'content-type': 'application/json', ...(await cabecalhoLogin()) }, body: JSON.stringify(corpo), signal: c.signal })
    const j = await r.json().catch(() => ({ erro: `A IA não respondeu (HTTP ${r.status})` }))
    registrarGasto(String(corpo.acao ?? ''), j.uso, !r.ok || !j.resultado).catch(() => undefined)
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
/** Leitura de uma busca já feita antes (sem chamar a IA de novo). */
export async function leituraEmCache(pedido: string): Promise<LeituraBusca | undefined> {
  return (await db.ajustes.get('ia.busca2.' + pedido.trim().toLowerCase()))?.valor as LeituraBusca | undefined
}

export async function interpretarBusca(pedido: string): Promise<LeituraBusca> {
  const k = 'ia.busca2.' + pedido.trim().toLowerCase()
  const ja = await db.ajustes.get(k)
  if (ja?.valor) return ja.valor as LeituraBusca
  const perfil = await lerPerfil()
  const out = montarLeitura(await chamar<RespostaBusca>({ acao: 'buscar', pedido, universos: Object.keys(UNIVERSOS), gosto: topo(perfil.termos, 20) }, 45000))
  await db.ajustes.put({ chave: k, valor: out })
  return out
}

type RespostaBusca = LeituraBusca & { outras_linguas?: { lingua: string; q: string }[] }
function montarLeitura(r: RespostaBusca): LeituraBusca {
  const universo = r.consultas[0]?.universo ?? ''
  const locais = (r.outras_linguas ?? []).flatMap((o) => (ACERVO_DA_LINGUA[o.lingua] ?? []).map((fonte) => ({ q: o.q, universo, fonte, lingua: o.lingua })))
  return { leitura: r.leitura, consultas: [...r.consultas.slice(0, 6), ...locais.slice(0, 10)] }
}

/** Busca por foto: a IA olha a imagem (reduzida a 1024 px) e monta as consultas. A foto não fica guardada em lugar nenhum. */
export async function buscarPorFoto(foto: Blob, nota?: string): Promise<LeituraBusca> {
  const perfil = await lerPerfil()
  return montarLeitura(await chamar<RespostaBusca>({ acao: 'foto', imagem: { base64: await paraBase64(foto), tipo: 'image/jpeg' }, nota, universos: Object.keys(UNIVERSOS), gosto: topo(perfil.termos, 20) }, 60000))
}

export interface TemaCurtidas { nome: string; descricao: string; ids: string[]; consulta: string }
export interface TemasCurtidas { quando: number; n: number; temas: TemaCurtidas[] }
/** Agrupa as curtidas em temas. Guardado no aparelho; refeito quando há curtidas novas ou a pedido. */
export async function agruparCurtidas(forcar = false): Promise<TemasCurtidas> {
  const perfil = await lerPerfil()
  const itens = (perfil.curtidasItens ?? []).slice(-200)
  const ja = (await db.ajustes.get('ia.temasCurtidas'))?.valor as TemasCurtidas | undefined
  if (ja && !forcar && ja.n === itens.length) return ja
  const r = await chamar<{ temasCurtidas: TemaCurtidas[] }>({ acao: 'agrupar', curtidas: itens.map((x) => ({ id: x.id, titulo: x.titulo, autor: x.autor, termos: x.termos.slice(0, 5) })) }, 90000)
  const validos = new Set(itens.map((x) => x.id))
  const temas = r.temasCurtidas.map((t) => ({ ...t, ids: t.ids.filter((id) => validos.has(id)) })).filter((t) => t.ids.length > 0)
  const out = { quando: Date.now(), n: itens.length, temas }
  await db.ajustes.put({ chave: 'ia.temasCurtidas', valor: out })
  return out
}

/** Reduz a imagem a 1024 px em JPEG e devolve em base64 (cabe no limite do servidor e custa menos). */
export async function paraBase64(b: Blob) {
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
  if (!forcar && !(await iaAutomaticaLigada())) return g
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

export interface InspiracaoAcervo { quando: number; n: number; leitura: string; consultas: { q: string; universo: string; pasta: string; porque: string }[] }
export const CHAVE_INSPIRA = 'ia.acervoInspira'

/**
 * As pastas (Pinterest, Instagram, grupos) e referências viram consultas para o Descobrir.
 * Manda o nome de cada pasta, alguns exemplos e até 12 imagens de amostra. Refeito a cada 1 a 3 dias, ou quando o acervo cresce.
 */
export async function inspirarDoAcervo(forcar = false): Promise<InspiracaoAcervo | undefined> {
  const ja = (await db.ajustes.get(CHAVE_INSPIRA))?.valor as InspiracaoAcervo | undefined
  const refs = (await db.referencias.filter((r) => !r.excluido && !r.origem?.startsWith('descobrir:')).toArray())
  if (refs.length < 5) return ja
  const idade = ja ? Date.now() - ja.quando : Infinity
  const nArt = await db.artistas.count()
  if (!forcar && ja && (idade < 24 * 3600000 || (idade < 72 * 3600000 && Math.abs(refs.length + nArt - ja.n) < 10))) return ja
  if (!forcar && !(await iaAutomaticaLigada())) return ja
  if (!(await iaConfigurada())) return ja
  const grupos = (await db.grupos.toArray()).filter((g) => !g.excluido)
  const porGrupo = new Map<string, Referencia[]>()
  for (const r of refs) for (const g of r.grupos) { const l = porGrupo.get(g) ?? []; l.push(r); porGrupo.set(g, l) }
  const resumo = (r: Referencia) => [r.titulo !== 'Pin' ? r.titulo : '', r.autor, r.tags.slice(0, 4).join(', '), (r.descricao ?? '').split('\n')[0].slice(0, 80)].filter(Boolean).join(' · ').slice(0, 140)
  const sorteia = <T,>(xs: T[], n: number) => [...xs].sort(() => Math.random() - .5).slice(0, n)
  const ordem = grupos.map((g) => ({ g, rs: porGrupo.get(g.id) ?? [] })).filter((x) => x.rs.length).sort((a, b) => b.rs.length - a.rs.length).slice(0, 30)
  const pastas = ordem.map(({ g, rs }) => ({ nome: g.nome, descricao: g.descricao?.slice(0, 80), itens: rs.length, exemplos: sorteia(rs, 6).map(resumo).filter(Boolean) }))
  const soltas = refs.filter((r) => !r.grupos.length)
  if (soltas.length) pastas.push({ nome: 'acervo', descricao: 'referências sem pasta', itens: soltas.length, exemplos: sorteia(soltas, 10).map(resumo).filter(Boolean) })
  // estudos de artistas da Biblioteca: nomes e linguagens entram como mais uma "pasta" (favoritos primeiro)
  const artistas = (await db.artistas.toArray()).filter((a) => !a.excluido).sort((a, b) => Number(!!b.favorito) - Number(!!a.favorito)).slice(0, 25)
  if (artistas.length) pastas.push({ nome: 'estudos de artistas', descricao: 'artistas que a pessoa estuda na Biblioteca', itens: artistas.length,
    exemplos: artistas.map((a) => [a.nome, a.pais.join('/'), [...a.tecnicas, ...a.esteticas, ...a.tags].slice(0, 5).join(', ')].filter(Boolean).join(' · ').slice(0, 140)) })
  const imagens = ordem.slice(0, 12).map(({ rs }) => sorteia(rs.filter((r) => /^https:\/\//.test(r.imagemExterna ?? '')), 1)[0]?.imagemExterna).filter((u): u is string => !!u)
  const corpo = { acao: 'acervo', universos: Object.keys(UNIVERSOS), pastas, recentes: (ja?.consultas ?? []).map((c) => c.q) }
  // se alguma imagem não abrir do lado da IA, tenta só com o texto
  const r = await chamar<Omit<InspiracaoAcervo, 'quando' | 'n'>>({ ...corpo, imagens }, 90000).catch(() => chamar<Omit<InspiracaoAcervo, 'quando' | 'n'>>(corpo, 90000))
  const out: InspiracaoAcervo = { quando: Date.now(), n: refs.length + nArt, leitura: r.leitura, consultas: r.consultas.filter((c) => c.q && UNIVERSOS[c.universo]) }
  await db.ajustes.put({ chave: CHAVE_INSPIRA, valor: out })
  return out
}

/** Artistas na mesma linha dos estudos (Biblioteca), mas fora deles. Renovado quando os estudos mudam ou a cada 7 dias. */
export interface Afim { nome: string; consulta: string; perto_de: string; porque: string }
interface AfinsSalvos { quando: number; base: string; afins: Afim[] }
const CHAVE_AFINS = 'ia.afins'
export async function artistasNaMesmaLinha(forcar = false): Promise<Afim[]> {
  const estudos = (await db.artistas.toArray()).filter((a) => !a.excluido)
  const base = estudos.map((a) => a.id).sort().join(',')
  const ja = (await db.ajustes.get(CHAVE_AFINS))?.valor as AfinsSalvos | undefined
  if (!forcar && ja && ja.base === base && Date.now() - ja.quando < 7 * 24 * 3600000) return ja.afins
  if (!forcar && !(await iaAutomaticaLigada())) return ja?.afins ?? []
  if (!estudos.length || !(await iaConfigurada())) return ja?.afins ?? []
  const conhecidos = [...new Set([...estudos.map((a) => a.nome), ...(await db.referencias.toArray()).map((r) => r.autor).filter(Boolean) as string[]])]
  const r = await chamar<{ afins: Afim[] }>({
    acao: 'afins', conhecidos,
    estudos: estudos.slice(0, 40).map((a) => ({ nome: a.nome, pais: a.pais, tecnicas: a.tecnicas.slice(0, 5), esteticas: a.esteticas.slice(0, 5), linguagem: a.linguagem?.slice(0, 200) })),
  }, 90000)
  const nomes = new Set(conhecidos.map((n) => n.toLowerCase()))
  const afins = (r.afins ?? []).filter((x) => x.nome && x.consulta && !nomes.has(x.nome.toLowerCase()))
  await db.ajustes.put({ chave: CHAVE_AFINS, valor: { quando: Date.now(), base, afins } satisfies AfinsSalvos })
  return afins
}
