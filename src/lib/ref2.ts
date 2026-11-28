import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Referencia } from '../db/schema'
import { FONTE, FONTES, anoDe, type FonteId, type ItemDescoberta } from './fontes'
import {
  EPOCAS, TEMAS, UNIVERSOS, consultasDoTema, lerPerfil, nomesDoEstudo, pesosDoGosto, planejar, salvarPerfil, traduz,
  type Epoca, type Pedido, type Perfil,
} from './curadoria'
import { CHAVE_INSPIRA, type InspiracaoAcervo } from './iaRepertorio'
import { imagemDaRef, imagemDeArquivo, imagemDeUrl, type Imagem } from './visao'

/**
 * Referências 2 (versão experimental). Usa o mesmo acervo (referências, grupos, artistas, obras, painéis, arquivos)
 * e as mesmas fontes, mas guarda à parte tudo o que é preferência: perfil de gosto, configuração da curadoria,
 * relevância das fontes e histórico. Nada aqui escreve no perfil do Descobrir original.
 */

export const PERFIL2 = 'ref2.perfil'
export const CONFIG2 = 'ref2.config'
const STATS2 = 'ref2.fontes'
const PINS_CONHECIDOS = 'ref2.pins.conhecidos'
export const LEITURA_PINTEREST = 'ref2.pinterest.leitura'

/* ---------------- níveis de influência ---------------- */
export type Nivel = 0 | 1 | 2 | 3
export const NIVEIS: [Nivel, string][] = [[0, 'Nenhuma'], [1, 'Baixa'], [2, 'Média'], [3, 'Alta']]
export const FATOR_NIVEL = [0, 0.5, 1, 1.8]

/* ---------------- categorias de fonte ---------------- */
export type Categoria = 'pinterest' | 'artistas' | 'revistas' | 'arena' | 'contemporaneos' | 'museus' | 'abertas'
export const CATEGORIAS: Record<Categoria, { nome: string; desc: string; fontes: FonteId[] }> = {
  pinterest: { nome: 'Pinterest', desc: 'Pins novos das pastas que você acompanha (conta conectada e RSS). Eles já entram no seu Acervo.', fontes: [] },
  artistas: { nome: 'Artistas da Biblioteca', desc: 'Busca pelos artistas que você estuda (favoritos primeiro) nos museus e nas revistas. Só fica o que cita o artista.', fontes: [] },
  revistas: { nome: 'Revistas de arte', desc: 'Colossal, Ceramics Now, Juxtapoz e as outras revistas do painel de fontes. Produção atual.', fontes: ['rev'] },
  arena: { nome: 'Are.na', desc: 'Canais públicos montados por artistas e designers. Material atual, sem data.', fontes: ['arena'] },
  contemporaneos: { nome: 'Acervos com arte moderna e contemporânea', desc: 'Art Institute of Chicago, SMK, Minneapolis e Cleveland: museus com coleções fortes do século 20 e 21.', fontes: ['aic', 'smk', 'mia', 'cma'] },
  museus: { nome: 'Museus históricos', desc: 'The Met, Rijksmuseum, V&A, Smithsonian, Library of Congress, National Gallery e Europeana.', fontes: ['met', 'rijks', 'vam', 'si', 'loc', 'nga', 'eu'] },
  abertas: { nome: 'Imagens abertas', desc: 'Wikimedia Commons e Openverse: fotos com licença livre.', fontes: ['wm', 'ov'] },
}
export const HIERARQUIA_PADRAO: Categoria[] = ['pinterest', 'artistas', 'revistas', 'arena', 'contemporaneos', 'museus', 'abertas']
export const categoriaDaFonte = (f: string): Categoria | undefined => (Object.keys(CATEGORIAS) as Categoria[]).find((c) => CATEGORIAS[c].fontes.includes(f as FonteId))

/* ---------------- época (filtro) ---------------- */
export type Epoca2 = 'todas' | 'contemporanea' | 'moderna' | 'vanguardas' | 'historica' | 'precolombiana'
export const EPOCAS2: [Epoca2, string][] = [['todas', 'Todas'], ['contemporanea', 'Contemporânea'], ['moderna', 'Moderna'], ['vanguardas', 'Vanguardas'], ['historica', 'Histórica'], ['precolombiana', 'Pré-colombiana']]
/**
 * Cada época da nova versão usa os mesmos critérios de data da original (nada é reclassificado):
 * Contemporânea = desde 1960, Moderna = 1880 a 1979, Histórica = até 1879 (a "Antiga" da original).
 * Vanguardas usa a faixa Moderna com as consultas do tema Vanguardas; Pré-colombiana usa o tema Pré-colombiana, sem corte de data.
 */
export function epocaBase(e: Epoca2): { epoca: Epoca; tema?: string } {
  if (e === 'contemporanea') return { epoca: 'contemporanea' }
  if (e === 'moderna') return { epoca: 'moderna' }
  if (e === 'vanguardas') return { epoca: 'moderna', tema: 'vanguardas' }
  if (e === 'historica') return { epoca: 'antiga' }
  if (e === 'precolombiana') return { epoca: 'todas', tema: 'precolombiana' }
  return { epoca: 'todas' }
}

/* ---------------- linguagens ---------------- */
export const LINGUAGENS: { id: string; nome: string; universos: string[] }[] = [
  { id: 'ceramica', nome: 'Cerâmica', universos: ['ceramica'] },
  { id: 'escultura', nome: 'Escultura', universos: ['escultura'] },
  { id: 'ilustracao', nome: 'Ilustração', universos: ['ilustracao'] },
  { id: 'pintura', nome: 'Pintura', universos: ['pintura'] },
  { id: 'fotografia', nome: 'Fotografia', universos: ['fotografia'] },
  { id: 'design', nome: 'Design', universos: ['design-produto', 'design-grafico'] },
  { id: 'contemporanea', nome: 'Arte contemporânea', universos: ['contemporanea'] },
  { id: 'gravura', nome: 'Gravura', universos: ['gravura'] },
  { id: 'textil', nome: 'Arte têxtil', universos: ['textil'] },
  { id: 'arte-popular', nome: 'Arte popular', universos: ['arte-popular'] },
  { id: 'arquitetura', nome: 'Arquitetura', universos: ['arquitetura'] },
  { id: 'historia-natural', nome: 'História natural', universos: ['historia-natural'] },
  { id: 'objetos', nome: 'Objetos e artefatos', universos: ['objetos'] },
]

/* ---------------- temas ---------------- */
export interface Tema2 { id: string; nome: string; consultas: string[]; universo?: string; pessoal?: boolean }
/** Sugestões de temas pessoais (um toque para adicionar). As consultas vão em inglês, como os acervos indexam. */
export const SUGESTOES_TEMA: Tema2[] = [
  { id: 'p:mascaras', nome: 'Máscaras', universo: 'objetos', consultas: ['mask sculpture', 'ritual mask', 'ceramic mask', 'carnival mask', 'theatre mask'] },
  { id: 'p:texturas', nome: 'Texturas', universo: 'ceramica', consultas: ['textured surface', 'crawl glaze', 'carved surface ceramic', 'relief texture', 'lichen texture'] },
  { id: 'p:grafismos', nome: 'Grafismos', universo: 'design-grafico', consultas: ['graphic pattern', 'sgraffito', 'linear decoration ceramic', 'ornament pattern', 'mark making'] },
  { id: 'p:organicas', nome: 'Formas orgânicas', universo: 'escultura', consultas: ['organic form sculpture', 'biomorphic sculpture', 'seed pod form', 'organic vessel'] },
  { id: 'p:surrealismo', nome: 'Surrealismo', universo: 'pintura', consultas: ['surrealism', 'surrealist sculpture', 'surreal object', 'dreamlike painting'] },
  { id: 'p:atelie', nome: 'Ateliê', universo: 'fotografia', consultas: ['artist studio', 'ceramic studio', 'pottery workshop', 'studio interior artist'] },
  { id: 'p:figurativa', nome: 'Arte figurativa', universo: 'pintura', consultas: ['figurative sculpture', 'figurative painting', 'figurative ceramics'] },
  { id: 'p:abstracao', nome: 'Abstração', universo: 'contemporanea', consultas: ['abstract sculpture', 'abstract ceramic', 'abstract painting', 'geometric abstraction'] },
]
export function todosOsTemas(cfg: Config2): Tema2[] {
  const base: Tema2[] = TEMAS.map((t) => ({ id: t.id, nome: t.nome, consultas: t.consultas, universo: t.universo }))
  return [...base, ...cfg.temasPessoais.map((t) => ({ ...t, pessoal: true }))]
}
export function consultasDoTema2(id: string, cfg: Config2, epoca: Epoca): { consultas: string[]; universo?: string } {
  const t = TEMAS.find((x) => x.id === id)
  if (t) return { consultas: consultasDoTema(t, epoca), universo: t.universo }
  const p = cfg.temasPessoais.find((x) => x.id === id)
  return { consultas: p?.consultas ?? [], universo: p?.universo }
}

/* ---------------- configuração ---------------- */
export type Fonte2 = Categoria
export interface Influencias { colecoes: Nivel; acervo: Nivel; pinterest: Nivel; artistas: Nivel; curtidas: Nivel; paineis: Nivel }
export interface Direcao { interesses: { termo: string; ate?: number }[]; temas: string[]; epocas: Epoca2[] }
export interface Config2 {
  atualizadoEm?: number
  prioridade: Categoria[]
  desligadas: Categoria[]
  fontesOff: FonteId[]
  adaptativo: boolean
  exploracao: number            // % do lote que vai para fontes menos usadas
  influencia: Influencias
  colecoes: Record<string, Nivel> // influência de cada coleção (id do grupo); ausente = média
  direcao: Direcao
  temasPessoais: Tema2[]
  capas: Record<string, string[]> // capa escolhida de cada coleção (ids de referências)
  visual: boolean
}
export const CONFIG2_PADRAO: Config2 = {
  prioridade: HIERARQUIA_PADRAO, desligadas: [], fontesOff: [], adaptativo: true, exploracao: 15,
  influencia: { colecoes: 2, acervo: 2, pinterest: 3, artistas: 2, curtidas: 2, paineis: 2 },
  colecoes: {}, direcao: { interesses: [], temas: [], epocas: [] }, temasPessoais: [], capas: {}, visual: true,
}
function completar(v?: Partial<Config2>): Config2 {
  const c = { ...CONFIG2_PADRAO, ...(v ?? {}) }
  c.influencia = { ...CONFIG2_PADRAO.influencia, ...(v?.influencia ?? {}) }
  c.direcao = { ...CONFIG2_PADRAO.direcao, ...(v?.direcao ?? {}) }
  // categorias novas (de versões futuras) entram no fim da ordem
  c.prioridade = [...(c.prioridade ?? []).filter((x) => CATEGORIAS[x]), ...HIERARQUIA_PADRAO.filter((x) => !(c.prioridade ?? []).includes(x))]
  return c
}
export async function lerConfig2(): Promise<Config2> { return completar((await db.ajustes.get(CONFIG2))?.valor as Partial<Config2> | undefined) }
export async function salvarConfig2(mud: Partial<Config2>) {
  const atual = await lerConfig2()
  await db.ajustes.put({ chave: CONFIG2, valor: { ...atual, ...mud, atualizadoEm: Date.now() } })
}
export function useConfig2(): Config2 {
  const v = useLiveQuery(() => db.ajustes.get(CONFIG2), [])
  return completar(v?.valor as Partial<Config2> | undefined)
}
export const nivelDaColecao = (cfg: Config2, id: string): Nivel => cfg.colecoes[id] ?? 2

/* ---------------- perfil experimental ---------------- */
export type Perfil2 = Perfil & {
  ocultados?: string[]
  ocultadosItens?: ItemDescoberta[]
  salvosItens?: ItemDescoberta[]
  abertos?: string[]
  escondidosVisual?: { quando: number; itens: ItemDescoberta[] }
}
/**
 * Perfil de gosto de Referências 2. Na primeira vez começa como uma cópia do perfil do Descobrir original
 * (para não perder o que já foi aprendido); depois os dois seguem separados.
 */
export async function lerPerfil2(): Promise<Perfil2> {
  const ja = await db.ajustes.get(PERFIL2)
  if (!ja) {
    const orig = await lerPerfil()
    const copia: Perfil2 = { ...orig, gostoIA: orig.gostoIA, ocultados: [], ocultadosItens: [], salvosItens: [], abertos: [] }
    await salvarPerfil(copia, PERFIL2)
    return copia
  }
  return lerPerfil(PERFIL2) as Promise<Perfil2>
}
export const salvarPerfil2 = (p: Perfil2) => salvarPerfil(p, PERFIL2)
/** Recomeça só o perfil experimental (o do Descobrir original não muda). */
export async function redefinirPerfil2() {
  const { PERFIL_VAZIO } = await import('./curadoria')
  await salvarPerfil({ ...PERFIL_VAZIO, ocultados: [], ocultadosItens: [], salvosItens: [], abertos: [] } as Perfil2, PERFIL2)
}

/* ---------------- relevância das fontes ---------------- */
export interface Stat {
  mostrados: number; curtir: number; salvar: number; painel: number; semelhantes: number; recusar: number; ocultar: number
  visSoma: number; visN: number; visEscondidas: number
  consultas: number; resultados: number; ok: number; falhas: number; ultimoOk?: number; ultimaFalha?: number; erro?: string
  contemporaneas: number; historicas: number; semData: number
}
const STAT_VAZIO: Stat = { mostrados: 0, curtir: 0, salvar: 0, painel: 0, semelhantes: 0, recusar: 0, ocultar: 0, visSoma: 0, visN: 0, visEscondidas: 0, consultas: 0, resultados: 0, ok: 0, falhas: 0, contemporaneas: 0, historicas: 0, semData: 0 }
export type Stats = Record<string, Stat>
let statsMem: Stats | undefined
let gravarT: ReturnType<typeof setTimeout> | undefined
async function stats(): Promise<Stats> {
  statsMem ??= ((await db.ajustes.get(STATS2))?.valor as Stats | undefined) ?? {}
  return statsMem
}
export async function lerStats(): Promise<Stats> { return { ...(await stats()) } }
export async function zerarStats() { statsMem = {}; await db.ajustes.put({ chave: STATS2, valor: {} }) }
/** Soma contadores na categoria ('c:pinterest') e na fonte ('f:aic'). Grava em lote, sem travar a tela. */
export async function contar(chaves: string[], mud: Partial<Record<keyof Stat, number>>, extra?: Partial<Stat>) {
  const s = await stats()
  for (const k of chaves) {
    const a = { ...STAT_VAZIO, ...(s[k] ?? {}) }
    for (const [c, n] of Object.entries(mud)) (a as unknown as Record<string, number>)[c] = ((a as unknown as Record<string, number>)[c] ?? 0) + (n ?? 0)
    s[k] = { ...a, ...(extra ?? {}) }
  }
  clearTimeout(gravarT)
  gravarT = setTimeout(() => { db.ajustes.put({ chave: STATS2, valor: s }).catch(() => undefined) }, 1500)
}
export const chavesDoItem = (x: Pick<ItemDescoberta, 'fonte' | 'cat'>) => {
  const cat = x.cat ?? categoriaDaFonte(x.fonte)
  return [...(cat ? ['c:' + cat] : []), 'f:' + x.fonte]
}
/** Registra que estas obras apareceram no feed (base para normalizar a relevância pelo volume). */
export function contarMostrados(xs: ItemDescoberta[]) {
  const por = new Map<string, ItemDescoberta[]>()
  for (const x of xs) for (const k of chavesDoItem(x)) por.set(k, [...(por.get(k) ?? []), x])
  for (const [k, l] of por) {
    const anos = l.map((x) => (x.fonte === 'wm' ? undefined : anoDe(x.data)))
    contar([k], { mostrados: l.length, contemporaneas: anos.filter((a) => a != null && a >= 1960).length, historicas: anos.filter((a) => a != null && a < 1880).length, semData: anos.filter((a) => a == null).length })
  }
}
export const PESO_GESTO: Record<string, number> = { curtir: 1, salvar: 2, painel: 3, semelhantes: 1.5, recusar: -2, ocultar: -1 }
/**
 * Fator de relevância de uma categoria ou fonte, entre 0,35 e 2,5. É uma taxa: gestos positivos menos negativos,
 * dividido pelo número de imagens mostradas (com uma "prior" de 40 imagens a 5%), para uma fonte não ganhar só por volume.
 * A afinidade visual média com o seu acervo (quando o Olhar do app está ligado) mexe até 45% para cima ou para baixo.
 */
export function relevancia(s?: Stat) {
  if (!s) return 1
  const pos = s.curtir + 2 * s.salvar + 3 * s.painel + 1.5 * s.semelhantes
  const neg = 2 * s.recusar + s.ocultar
  const taxa = (pos - neg + 2) / (s.mostrados + 40)
  const vis = s.visN >= 8 ? Math.max(-0.15, Math.min(0.15, s.visSoma / s.visN)) : 0
  return Math.max(0.35, Math.min(2.5, (taxa / 0.05) * (1 + vis * 3)))
}
/** Peso de cada categoria: posição na hierarquia (que você ordena) vezes a relevância aprendida. */
export function pesosDasCategorias(cfg: Config2, st: Stats, permitidas?: Categoria[]) {
  const ativas = cfg.prioridade.filter((c) => !cfg.desligadas.includes(c) && (!permitidas?.length || permitidas.includes(c)) && (CATEGORIAS[c].fontes.length === 0 || CATEGORIAS[c].fontes.some((f) => !cfg.fontesOff.includes(f))))
  return ativas.map((c) => {
    const pos = cfg.prioridade.indexOf(c)
    const base = Math.pow(0.8, pos)
    return { c, base, fator: cfg.adaptativo ? relevancia(st['c:' + c]) : 1, peso: base * (cfg.adaptativo ? relevancia(st['c:' + c]) : 1) }
  })
}

/* ---------------- repertório (o que define o gosto) ---------------- */
const RUIDO = /^(whatsapp|img|pin$|screenshot|dsc|pxl|\d)/i
/**
 * Termos do seu repertório, com a influência de cada parte: coleções (uma a uma), acervo, Pinterest, painéis.
 * Coleção com influência "Nenhuma" fica de fora; as referências dela que também estão em outra coleção contam pela outra.
 */
export async function termosDoRepertorio(cfg: Config2, n = 24): Promise<[string, number][]> {
  const [refs, grupos, paineis] = await Promise.all([db.referencias.toArray(), db.grupos.toArray(), db.paineis.toArray()])
  const nomeG = new Map(grupos.filter((g) => !g.excluido).map((g) => [g.id, g.nome]))
  const emPainel = new Set(paineis.filter((p) => !p.excluido).flatMap((p) => p.itens.map((i) => i.refId).filter(Boolean) as string[]))
  const I = cfg.influencia
  const c = new Map<string, number>()
  const soma = (t: string | undefined, p: number) => { if (!t || p <= 0) return; const k = traduz(t.trim().toLowerCase()); if (k.length > 2 && k.length < 40 && !RUIDO.test(k)) c.set(k, (c.get(k) ?? 0) + p) }
  for (const r of refs) {
    if (r.excluido || r.origem?.startsWith('descobrir:')) continue
    const w = pesoDaRef(r, cfg, emPainel)
    if (w <= 0) continue
    for (const g of r.grupos) if (nomeG.has(g)) soma(nomeG.get(g), w * FATOR_NIVEL[I.colecoes] * FATOR_NIVEL[nivelDaColecao(cfg, g)])
    r.tags.forEach((t) => soma(t, w * 1.5))
    if (r.autor && !/^@/.test(r.autor)) soma(r.autor, w * 2)
  }
  return [...c].sort((a, b) => b[1] - a[1]).slice(0, n)
}
/** Quanto uma referência pesa no repertório (0 = não conta). */
export function pesoDaRef(r: Referencia, cfg: Config2, emPainel?: Set<string>) {
  const I = cfg.influencia
  const daPasta = r.grupos.length ? Math.max(...r.grupos.map((g) => FATOR_NIVEL[nivelDaColecao(cfg, g)])) : 1
  if (daPasta <= 0) return 0
  const origem = r.origem?.startsWith('pinterest:') ? FATOR_NIVEL[I.pinterest] : FATOR_NIVEL[I.acervo]
  const painel = emPainel?.has(r.id) ? 1 + FATOR_NIVEL[I.paineis] : 1
  return daPasta * origem * painel * (r.favorito ? 1.5 : 1)
}

/** Imagens que representam o seu repertório para o Olhar do app (MobileCLIP), sorteadas pelo peso de cada referência. */
export async function imagensDoRepertorio(cfg: Config2, limite = 140): Promise<Imagem[]> {
  const [refs, obras, paineis, perfil] = await Promise.all([db.referencias.toArray(), db.obras.toArray(), db.paineis.toArray(), lerPerfil2()])
  const emPainel = new Set(paineis.filter((p) => !p.excluido).flatMap((p) => p.itens.map((i) => i.refId).filter(Boolean) as string[]))
  const pesadas = refs.filter((r) => !r.excluido).map((r) => ({ r, w: pesoDaRef(r, cfg, emPainel) * (0.6 + Math.random() * 0.8) })).filter((x) => x.w > 0).sort((a, b) => b.w - a.w)
  const rs = pesadas.map((x) => imagemDaRef(x.r)).filter((x): x is Imagem => !!x)
  const fA = FATOR_NIVEL[cfg.influencia.artistas], fC = FATOR_NIVEL[cfg.influencia.curtidas]
  const os = fA > 0 ? obras.filter((o) => !o.excluido && o.favorito).concat(obras.filter((o) => !o.excluido && !o.favorito)).map((o) => (o.arquivo ? imagemDeArquivo(o.arquivo) : o.imagem ? imagemDeUrl(o.imagem) : undefined)).filter((x): x is Imagem => !!x) : []
  const cs = fC > 0 ? [...(perfil.curtidasItens ?? [])].reverse().map((x) => imagemDeUrl(x.imagem)) : []
  // proporção: acervo leva a maior parte; obras dos artistas e curtidas entram conforme a influência
  const nO = Math.round(limite * 0.15 * fA), nC = Math.round(limite * 0.15 * fC)
  const saida: Imagem[] = []; const vistas = new Set<string>()
  const por = (xs: Imagem[], n: number) => { for (const x of xs) { if (n <= 0) break; if (!vistas.has(x.chave)) { vistas.add(x.chave); saida.push(x); n-- } } }
  por(os, nO); por(cs, nC); por(rs, limite - saida.length)
  return saida
}

/* ---------------- Pinterest ---------------- */
export const ehPin = (r: Pick<Referencia, 'origem'>) => !!r.origem?.startsWith('pinterest:')
async function conhecidos(): Promise<Set<string> | undefined> {
  const v = (await db.ajustes.get(PINS_CONHECIDOS))?.valor as string[] | undefined
  return v ? new Set(v) : undefined
}
/**
 * Pins que chegaram e você ainda não viu em Referências 2. Na primeira vez, tudo o que chegou há mais de 7 dias
 * conta como já visto: pins antigos nunca aparecem como novidade.
 */
export async function pinsNovos(limite = 80): Promise<Referencia[]> {
  const pins = (await db.referencias.filter((r) => ehPin(r) && !r.excluido).toArray())
  let ja = await conhecidos()
  if (!ja) {
    const corte = Date.now() - 7 * 86400000
    ja = new Set(pins.filter((p) => Math.max(p.atualizadoEm, p.criadoEm) < corte).map((p) => p.id))
    await db.ajustes.put({ chave: PINS_CONHECIDOS, valor: [...ja] })
  }
  return pins.filter((p) => !ja!.has(p.id) && (p.imagemExterna || p.imagens.length)).sort((a, b) => b.atualizadoEm - a.atualizadoEm).slice(0, limite)
}
export async function marcarPinsVistos(ids: string[]) {
  if (!ids.length) return
  const ja = (await conhecidos()) ?? new Set<string>()
  ids.forEach((i) => ja.add(i))
  await db.ajustes.put({ chave: PINS_CONHECIDOS, valor: [...ja].slice(-20000) })
}
/** Um pin do Acervo no formato do feed. Marcado como "do seu Pinterest": não é descoberta externa. */
export function itemDoPin(r: Referencia, url?: string): ItemDescoberta & { pin: string } {
  const img = r.imagemExterna ?? url ?? ''
  const link = r.url ?? (r.descricao?.match(/Pin: (\S+)/)?.[1]) ?? ''
  return {
    id: 'pin:' + r.id, pin: r.id, fonte: 'pinterest' as FonteId, titulo: r.titulo === 'Pin' ? 'Pin sem título' : r.titulo, autor: r.autor, imagem: img, imagemGrande: img,
    link, licenca: 'Do seu Pinterest · já está no seu Acervo', termos: r.tags.slice(0, 6), motivo: 'Novo nas suas pastas do Pinterest', cat: 'pinterest',
  }
}
export const ehItemPin = (x: ItemDescoberta): x is ItemDescoberta & { pin: string } => x.id.startsWith('pin:')
export const nomeDaFonte = (x: Pick<ItemDescoberta, 'fonte'>) => ((x.fonte as string) === 'pinterest' ? 'Seu Pinterest' : FONTE[x.fonte]?.nome ?? x.fonte)

/** Leitura estética das pastas do Pinterest (IA), guardada para não pagar de novo. */
export interface LeituraEstetica {
  quando: number; n: number; resumo: string
  caracteristicas: { linguagens: string[]; materialidade: string[]; formas: string[]; paletas: string[]; texturas: string[]; grafismos: string[]; composicao: string[]; abstracao: string; escultorico: string[]; temas: string[] }
  consultas: { q: string; universo: string; traco: string; porque: string }[]
}
export async function lerLeituraPinterest() { return (await db.ajustes.get(LEITURA_PINTEREST))?.valor as LeituraEstetica | undefined }
/** Manda à IA as pastas do Pinterest (com o peso de cada uma) e até 16 pins de amostra. Só roda quando você pede. */
export async function lerEsteticaDoPinterest(): Promise<LeituraEstetica> {
  const { chamar, iaConfigurada } = await import('./iaRepertorio')
  if (!(await iaConfigurada())) throw new Error('A IA não está configurada (falta a chave na Vercel).')
  const cfg = await lerConfig2()
  const [pins, grupos] = await Promise.all([db.referencias.filter((r) => ehPin(r) && !r.excluido).toArray(), db.grupos.toArray()])
  if (pins.length < 5) throw new Error('Ainda há poucos pins no Acervo para ler.')
  const porG = new Map<string, Referencia[]>()
  for (const r of pins) for (const g of r.grupos) porG.set(g, [...(porG.get(g) ?? []), r])
  const sorteia = <T,>(xs: T[], n: number) => [...xs].sort(() => Math.random() - .5).slice(0, n)
  const pastas = grupos.filter((g) => !g.excluido && porG.get(g.id)?.length && nivelDaColecao(cfg, g.id) > 0)
    .map((g) => ({ g, rs: porG.get(g.id)!, peso: nivelDaColecao(cfg, g.id) }))
    .sort((a, b) => b.peso - a.peso || b.rs.length - a.rs.length).slice(0, 30)
  const resumo = (r: Referencia) => [r.titulo !== 'Pin' ? r.titulo : '', r.tags.slice(0, 4).join(', '), (r.descricao ?? '').split('\n')[0].slice(0, 80)].filter(Boolean).join(' · ').slice(0, 140)
  // imagens: mais amostras das pastas de peso alto
  const imagens: string[] = []
  for (const p of pastas) { const k = p.peso >= 3 ? 2 : 1; for (const r of sorteia(p.rs.filter((x) => /^https:\/\//.test(x.imagemExterna ?? '')), k)) if (imagens.length < 16) imagens.push(r.imagemExterna!) }
  const corpo = { acao: 'estetica', universos: Object.keys(UNIVERSOS), pastas: pastas.map((p) => ({ nome: p.g.nome, peso: p.peso, itens: p.rs.length, exemplos: sorteia(p.rs, 6).map(resumo).filter(Boolean) })) }
  const r = await chamar<Omit<LeituraEstetica, 'quando' | 'n'>>({ ...corpo, imagens }, 120000).catch(() => chamar<Omit<LeituraEstetica, 'quando' | 'n'>>(corpo, 120000))
  const out: LeituraEstetica = { ...r, consultas: (r.consultas ?? []).filter((c) => c.q && UNIVERSOS[c.universo]), quando: Date.now(), n: pins.length }
  await db.ajustes.put({ chave: LEITURA_PINTEREST, valor: out })
  return out
}
/** Sem IA: termos tirados das pastas do Pinterest (nome da pasta, tags, títulos), com o peso de cada pasta. */
export async function termosDoPinterest(cfg: Config2, n = 16): Promise<[string, number][]> {
  const [pins, grupos] = await Promise.all([db.referencias.filter((r) => ehPin(r) && !r.excluido).toArray(), db.grupos.toArray()])
  const nomeG = new Map(grupos.map((g) => [g.id, g.nome]))
  const c = new Map<string, number>()
  const soma = (t: string | undefined, p: number) => { if (!t || p <= 0) return; const k = traduz(t.trim().toLowerCase()); if (k.length > 2 && k.length < 40 && !RUIDO.test(k)) c.set(k, (c.get(k) ?? 0) + p) }
  for (const r of pins) {
    const w = pesoDaRef(r, cfg); if (w <= 0) continue
    r.grupos.forEach((g) => soma(nomeG.get(g), w * FATOR_NIVEL[nivelDaColecao(cfg, g)]))
    r.tags.forEach((t) => soma(t, w))
  }
  return [...c].sort((a, b) => b[1] - a[1]).slice(0, n)
}

/* ---------------- planejamento dos lotes ---------------- */
export type Modo2 = 'para-voce' | 'pinterest' | 'artistas' | 'explorar'
export const MODOS2: [Modo2, string][] = [['para-voce', 'Para você'], ['pinterest', 'Pinterest'], ['artistas', 'Artistas'], ['explorar', 'Explorar']]
export interface Filtros2 { fontes: Categoria[]; epoca: Epoca2; linguagens: string[]; temas: string[]; interacao: 'todas' | 'curtidas' | 'nao-vistas' | 'salvas' | 'ocultadas' }
export const FILTROS2_VAZIO: Filtros2 = { fontes: [], epoca: 'todas', linguagens: [], temas: [], interacao: 'todas' }
export const nFiltros2 = (f: Filtros2) => f.fontes.length + (f.epoca !== 'todas' ? 1 : 0) + f.linguagens.length + f.temas.length + (f.interacao !== 'todas' ? 1 : 0)

const sorteio = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)]
const embaralha = <T,>(xs: T[]) => [...xs].sort(() => Math.random() - .5)
function sortearPeso<T>(xs: { v: T; p: number }[]): T | undefined {
  const pos = xs.filter((x) => x.p > 0); if (!pos.length) return undefined
  let r = Math.random() * pos.reduce((t, x) => t + x.p, 0)
  for (const x of pos) { r -= x.p; if (r <= 0) return x.v }
  return pos[0].v
}
/** Fontes de uma categoria (embaralhadas) e, depois, as das outras ativas: se a primeira falhar, a consulta tenta a próxima. */
function fontesPara(cat: Categoria, cfg: Config2, ativas: Categoria[]): FonteId[] {
  const ok = (f: FonteId) => !cfg.fontesOff.includes(f)
  const daCat = cat === 'artistas' ? embaralha(['rev', ...CATEGORIAS.contemporaneos.fontes, ...CATEGORIAS.museus.fontes, 'arena'] as FonteId[]) : embaralha(CATEGORIAS[cat].fontes)
  const outras = embaralha(ativas.filter((c) => c !== cat).flatMap((c) => CATEGORIAS[c].fontes))
  return [...new Set([...daCat, ...outras])].filter(ok)
}
/** Perfil que vai para a busca: só as fontes ligadas na nova versão, e os ocultados contam como recusados (não voltam). */
export function perfilDeBusca(p: Perfil2, cfg: Config2): Perfil {
  const fontes = Object.fromEntries(FONTES.map((f) => [f.id, !cfg.fontesOff.includes(f.id) && !cfg.desligadas.includes(categoriaDaFonte(f.id) ?? 'museus')])) as Perfil['fontes']
  return { ...p, fontes, recusados: [...p.recusados, ...(p.ocultados ?? [])] }
}

export interface Plano { pedidos: Pedido[]; vagasPinterest: number; epoca: Epoca }

/**
 * Lote de "Para você". Duas escolhas separadas para cada consulta:
 * 1) o que buscar (o eixo estético: 60% perto do gosto, 25% vizinho, 15% experimental, ou a direção escolhida nos filtros);
 * 2) onde buscar (a categoria de fonte, sorteada pelo peso da hierarquia × relevância, com uma parte reservada à exploração).
 */
export async function planejar2(perfil: Perfil2, cfg: Config2, filtros: Filtros2, modo: Modo2, n = 10): Promise<Plano> {
  const eb = epocaBase(filtros.epoca)
  const st = await stats()
  const permit = filtros.fontes.length ? filtros.fontes : undefined
  const pesos = pesosDasCategorias(cfg, st, permit)
  const ativas = pesos.map((x) => x.c)
  if (modo === 'artistas') throw new Error('use planejarArtistas')

  // direção desta busca: tema da época, temas e linguagens dos filtros
  const direcao: { q: string; universo?: string; motivo: string }[] = []
  const temas = [...filtros.temas, ...(eb.tema ? [eb.tema] : [])]
  for (const t of temas) { const d = consultasDoTema2(t, cfg, eb.epoca); for (const q of d.consultas) direcao.push({ q, universo: d.universo, motivo: `Tema: ${todosOsTemas(cfg).find((x) => x.id === t)?.nome ?? t}` }) }
  for (const l of filtros.linguagens) { const L = LINGUAGENS.find((x) => x.id === l); for (const u of L?.universos ?? []) for (const q of UNIVERSOS[u]?.consultas ?? []) direcao.push({ q, universo: u, motivo: `Linguagem: ${L!.nome}` }) }

  // eixo estético
  const fC = FATOR_NIVEL[cfg.influencia.curtidas]
  const aprendidos = Object.entries(pesosDoGosto(perfil)).filter(([, v]) => v > 0).map(([k, v]) => [k, v * fC] as [string, number])
  const doRepertorio = await termosDoRepertorio(cfg, 20)
  const doPinterest = FATOR_NIVEL[cfg.influencia.pinterest] > 0 ? (await lerLeituraPinterest())?.consultas ?? [] : []
  const inspira = ((await db.ajustes.get(CHAVE_INSPIRA))?.valor as InspiracaoAcervo | undefined)?.consultas ?? []
  const agora = Date.now()
  const interesses = cfg.direcao.interesses.filter((i) => !i.ate || i.ate > agora).map((i) => traduz(i.termo))
  const temasDir = cfg.direcao.temas.flatMap((t) => consultasDoTema2(t, cfg, eb.epoca).consultas.map((q) => ({ q, t })))
  const termos = [...aprendidos, ...doRepertorio].sort((a, b) => b[1] - a[1]).slice(0, 24)
  const univFav = Object.entries(perfil.universos).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([u]) => u)
  const favs = univFav.length ? univFav : ['ceramica', 'escultura', 'ilustracao']

  const explorar = modo === 'explorar'
  const { proximo, adjacente, experimental } = explorar ? { proximo: 0, adjacente: 40, experimental: 60 } : perfil.mistura
  const tot = proximo + adjacente + experimental || 1

  const pedidos: Pedido[] = []
  let vagasPinterest = 0
  const nExpl = explorar ? n : Math.round(n * (cfg.exploracao / 100))
  // onde: exploração vai para as categorias menos mostradas; o resto pelo peso
  const menosVistas = [...ativas].filter((c) => c !== 'pinterest').sort((a, b) => (st['c:' + a]?.mostrados ?? 0) - (st['c:' + b]?.mostrados ?? 0))
  for (let i = 0; i < n; i++) {
    let cat: Categoria | undefined = i < nExpl ? (explorar ? sorteio(ativas.filter((c) => c !== 'pinterest' && c !== 'artistas')) : menosVistas[i % Math.max(1, menosVistas.length)]) : sortearPeso(pesos.map((x) => ({ v: x.c, p: x.peso })))
    if (!cat) cat = ativas.find((c) => c !== 'pinterest') ?? 'museus'
    // Pinterest vira vaga para pins novos do Acervo (não há busca no Pinterest inteiro); com direção escolhida, não entra
    if (cat === 'pinterest') { if (!direcao.length && !explorar) { vagasPinterest++; continue } cat = ativas.find((c) => c !== 'pinterest') ?? 'revistas' }
    const fontes = fontesPara(cat, cfg, ativas.filter((c) => c !== 'pinterest'))
    if (cat === 'artistas' && !direcao.length && !explorar) {
      const a = await artistaDaVez(cfg)
      if (a) { pedidos.push({ q: nomesDoEstudo(a)[0], nome: a, universo: 'ceramica', tipo: 'proximo', motivo: `Dos seus artistas: ${a}`, cat, fontes }); continue }
    }
    // o quê
    if (direcao.length) { const d = sorteio(direcao); pedidos.push({ q: d.q, universo: d.universo, tipo: 'adjacente', motivo: d.motivo, cat, fontes }); continue }
    const r = Math.random() * tot
    if (!explorar && interesses.length && Math.random() < 0.3) { pedidos.push({ q: sorteio(interesses), universo: 'ceramica', tipo: 'proximo', motivo: 'Direção da pesquisa', cat, fontes }); continue }
    if (!explorar && temasDir.length && Math.random() < 0.25) { const d = sorteio(temasDir); pedidos.push({ q: d.q, tipo: 'proximo', motivo: 'Tema prioritário', cat, fontes }); continue }
    if (r < proximo) {
      const roleta = Math.random()
      if (doPinterest.length && roleta < 0.4 * FATOR_NIVEL[cfg.influencia.pinterest] / 1.8) { const c = sorteio(doPinterest); pedidos.push({ q: c.q, universo: c.universo, tipo: 'proximo', motivo: `Do seu Pinterest: ${c.traco}`, cat, fontes }); continue }
      if (inspira.length && roleta < 0.6) { const c = sorteio(inspira); pedidos.push({ q: c.q, universo: c.universo, tipo: 'proximo', motivo: `Da sua pasta: ${c.pasta}`, cat, fontes }); continue }
      if (perfil.gostoIA?.consultas.length && roleta < 0.75) { const c = sorteio(perfil.gostoIA.consultas); pedidos.push({ q: c.q, universo: c.universo, tipo: 'proximo', motivo: c.porque, cat, fontes }); continue }
      const t = sortearPeso(termos.map(([v, p]) => ({ v, p }))) ?? sorteio(UNIVERSOS[sorteio(favs)].consultas)
      pedidos.push({ q: t, universo: sorteio(favs), tipo: 'proximo', motivo: `Perto do seu repertório: ${t}`, cat, fontes })
    } else if (r < proximo + adjacente) {
      const viz = [...new Set(favs.flatMap((u) => UNIVERSOS[u]?.vizinhos ?? []))].filter((u) => !favs.includes(u))
      const u = sorteio(viz.length ? viz : Object.keys(UNIVERSOS)); const t = sortearPeso(termos.map(([v, p]) => ({ v, p })))
      const base = sorteio(UNIVERSOS[u].consultas)
      pedidos.push({ q: t && Math.random() < .5 ? `${t} ${base.split(' ').slice(-1)[0]}` : base, universo: u, tipo: 'adjacente', motivo: `Vizinho do que você gosta: ${UNIVERSOS[u].nome}`, cat, fontes })
    } else {
      const u = sorteio(Object.keys(UNIVERSOS).filter((x) => !favs.includes(x)))
      pedidos.push({ q: sorteio(UNIVERSOS[u].consultas), universo: u, tipo: 'experimental', motivo: `Para sair da curva: ${UNIVERSOS[u].nome}`, cat, fontes })
    }
  }
  // época escolhida: parte do lote com as consultas daquela época (os mesmos critérios da versão original)
  const ep = EPOCAS[eb.epoca]
  if (eb.epoca !== 'todas' && ep.consultas.length && !direcao.length) {
    const lista = embaralha(ep.consultas)
    for (let k = 0; k < Math.min(Math.ceil(pedidos.length * .4), lista.length, pedidos.length); k++) pedidos[pedidos.length - 1 - k] = { ...pedidos[pedidos.length - 1 - k], q: lista[k], motivo: `Época: ${EPOCAS2.find((e) => e[0] === filtros.epoca)?.[1]}` }
  }
  // épocas preferidas da Direção da pesquisa: sem filtro de época, ~20% do lote puxa para elas (o resto segue livre)
  if (filtros.epoca === 'todas' && cfg.direcao.epocas.length && !direcao.length) {
    const prefs = cfg.direcao.epocas.map((e) => epocaBase(e)).filter((b) => b.epoca !== 'todas' && EPOCAS[b.epoca].consultas.length)
    const k = Math.min(Math.round(pedidos.length * .2), pedidos.length)
    for (let i = 0; i < k && prefs.length; i++) {
      const b = prefs[i % prefs.length], qs = EPOCAS[b.epoca].consultas
      pedidos[i * 3 % pedidos.length] = { ...pedidos[i * 3 % pedidos.length], q: qs[Math.floor(Math.random() * qs.length)], motivo: 'Direção da pesquisa: época preferida' }
    }
  }
  return { pedidos, vagasPinterest, epoca: eb.epoca }
}

let filaArtistas: string[] = []
/** Próximo artista da Biblioteca (favoritos aparecem mais; todos passam antes de repetir). */
async function artistaDaVez(cfg: Config2): Promise<string | undefined> {
  if (FATOR_NIVEL[cfg.influencia.artistas] <= 0) return undefined
  if (!filaArtistas.length) {
    const es = (await db.artistas.toArray()).filter((a) => !a.excluido)
    filaArtistas = [...es.filter((a) => a.favorito), ...es.filter((a) => a.favorito), ...es].sort(() => Math.random() - .5).map((a) => a.nome)
  }
  return filaArtistas.shift()
}

/** Artistas: Seus artistas (Biblioteca, favoritos primeiro) ou Novos artistas (a função "Na mesma linha"). */
export async function planejarArtistas(perfil: Perfil2, cfg: Config2, sub: 'seus' | 'novos', filtros: Filtros2, n = 8): Promise<Plano> {
  const eb = epocaBase(filtros.epoca)
  const ps = await planejar(perfil, sub === 'seus' ? 'seus-artistas' : 'mesma-linha', n, eb.epoca)
  const ativas = pesosDasCategorias(cfg, await stats(), filtros.fontes.length ? filtros.fontes : undefined).map((x) => x.c).filter((c) => c !== 'pinterest' && c !== 'artistas')
  return {
    pedidos: ps.map((p) => ({
      ...p, cat: 'artistas',
      fontes: p.fonte ? undefined : fontesPara('artistas', cfg, ativas).filter((f) => !filtros.fontes.length || ativas.some((c) => CATEGORIAS[c].fontes.includes(f))),
      motivo: sub === 'novos' ? `Artista sugerido por afinidade (${p.motivo?.replace(/^Na linha de /, 'perto de ') ?? 'IA'}). A obra é do autor informado pela fonte.` : p.motivo,
    })),
    vagasPinterest: 0, epoca: eb.epoca,
  }
}

/** Pinterest: consultas tiradas do seu Pinterest para buscar fora dele (rotuladas como tal). */
export async function planejarDoPinterest(cfg: Config2, filtros: Filtros2, n = 8): Promise<Plano> {
  const eb = epocaBase(filtros.epoca)
  const st = await stats()
  const pesos = pesosDasCategorias(cfg, st, filtros.fontes.length ? filtros.fontes : undefined).filter((x) => x.c !== 'pinterest' && x.c !== 'artistas')
  const ativas = pesos.map((x) => x.c)
  const leitura = await lerLeituraPinterest()
  const termos = await termosDoPinterest(cfg, 16)
  const pedidos: Pedido[] = []
  for (let i = 0; i < n; i++) {
    const cat = sortearPeso(pesos.map((x) => ({ v: x.c, p: x.peso }))) ?? 'revistas'
    const fontes = fontesPara(cat, cfg, ativas)
    if (leitura?.consultas.length && (i % 3 !== 2 || !termos.length)) { const c = sorteio(leitura.consultas); pedidos.push({ q: c.q, universo: c.universo, tipo: 'proximo', motivo: `Fora do Pinterest, na linha de: ${c.traco}`, cat, fontes }); continue }
    const t = sortearPeso(termos.map(([v, p]) => ({ v, p })))
    if (t) pedidos.push({ q: t, universo: 'ceramica', tipo: 'proximo', motivo: `Fora do Pinterest, na linha da pasta: ${t}`, cat, fontes })
  }
  return { pedidos, vagasPinterest: 0, epoca: eb.epoca }
}
