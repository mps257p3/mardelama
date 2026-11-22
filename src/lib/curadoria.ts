import { db, type Referencia } from '../db/schema'
import { anoDe, FONTE, FONTES, type FonteId, type ItemDescoberta, type Periodo } from './fontes'

/**
 * Curadoria do Descobrir: perfil de gosto persistente, pesos ajustáveis
 * e mistura entre o que você já gosta, universos vizinhos e o inesperado.
 */

export type Interacao = 'curtir' | 'salvar' | 'painel' | 'semelhantes' | 'pesquisar' | 'recusar'
export type Modo = 'para-voce' | 'fora-da-curva' | 'novos-artistas' | 'cores-texturas' | 'formas-volumes'

export interface Perfil {
  termos: Record<string, number>        // preferências consolidadas
  universos: Record<string, number>
  artistas: Record<string, number>
  temporario: Record<string, { p: number; ate: number }>  // interesses de pesquisa/projeto (expiram)
  pesos: Record<Interacao, number>
  mistura: { proximo: number; adjacente: number; experimental: number }
  fontes: Record<FonteId, boolean>
  vistos: string[]
  recusados: string[]
  curtidos: string[]
  historico: { quando: number; termos: string[] }[]  // para ver a evolução no tempo
  curtidasItens: ItemDescoberta[]  // as obras curtidas, para rever na aba Curtidas e inspirar o feed
  atualizadoEm?: number            // para sincronizar entre aparelhos
  gostoIA?: GostoIA                // leitura do gosto feita pela IA (renovada só quando há curtidas novas)
}
export interface GostoIA { resumo: string; consultas: { q: string; universo: string; porque: string }[]; evitar: string[]; quando: number; base: number }

export const PESOS_PADRAO: Record<Interacao, number> = { curtir: 1, salvar: 2, painel: 3, semelhantes: 1.5, pesquisar: 0.6, recusar: -2 }
export const PERFIL_VAZIO: Perfil = {
  termos: {}, universos: {}, artistas: {}, temporario: {}, pesos: PESOS_PADRAO,
  mistura: { proximo: 60, adjacente: 25, experimental: 15 }, fontes: { aic: true, met: true, wm: true, cma: true, vam: true, smk: true, rijks: true, eu: true, mia: true, si: true, ov: true, loc: true, rev: true },
  vistos: [], recusados: [], curtidos: [], historico: [], curtidasItens: [],
}
const CHAVE = 'descobrir.perfil'

export async function lerPerfil(): Promise<Perfil> {
  const a = await db.ajustes.get(CHAVE)
  const p = { ...PERFIL_VAZIO, ...(a?.valor as Partial<Perfil> ?? {}) }
  p.pesos = { ...PESOS_PADRAO, ...p.pesos }; p.fontes = { ...PERFIL_VAZIO.fontes, ...p.fontes }
  return p
}
export const salvarPerfil = (p: Perfil) => db.ajustes.put({ chave: CHAVE, valor: { ...p, atualizadoEm: Date.now() } })

/** Universos criativos: a curadoria é transversal, não só cerâmica. Consultas em inglês (as fontes indexam em inglês). */
export const UNIVERSOS: Record<string, { nome: string; consultas: string[]; vizinhos: string[] }> = {
  ceramica: { nome: 'Cerâmica', consultas: ['ceramic vessel', 'stoneware jar', 'glazed earthenware', 'porcelain figure', 'ceramic sculpture', 'tea bowl', 'terracotta figure', 'slipware'], vizinhos: ['escultura', 'objetos', 'design-produto'] },
  escultura: { nome: 'Escultura', consultas: ['sculpture animal', 'carved figure', 'bronze figure', 'wood sculpture', 'grotesque sculpture', 'small figurine'], vizinhos: ['ceramica', 'arte-popular', 'objetos'] },
  ilustracao: { nome: 'Ilustração', consultas: ['book illustration', 'fantastic creature drawing', 'grotesque drawing', 'caricature', 'children book illustration', 'Grandville', 'Gustave Dore', 'Arthur Rackham', 'Ernst Haeckel', 'Aubrey Beardsley', 'Ivan Bilibin', 'Kay Nielsen', 'Edward Lear', 'Kawanabe Kyosai', 'Hokusai manga', 'Maria Sibylla Merian', 'John Tenniel', 'Walter Crane', 'Winsor McCay', 'Art Nouveau poster', 'Alphonse Mucha', 'Jose Guadalupe Posada'], vizinhos: ['gravura', 'literatura-visual', 'pintura'] },
  pintura: { nome: 'Pintura', consultas: ['naive painting', 'surreal painting', 'folk painting animals', 'miniature painting', 'fresco fragment', 'Hieronymus Bosch', 'Pieter Bruegel', 'Odilon Redon', 'Henri Rousseau', 'Albert Eckhout', 'Frans Post', 'Jean-Baptiste Debret', 'Rugendas', 'Paul Klee', 'Hilma af Klint', 'Utagawa Kuniyoshi', 'Ito Jakuchu', 'Franz Marc', 'Giorgio Morandi'], vizinhos: ['ilustracao', 'arte-popular', 'textil'] },
  fotografia: { nome: 'Fotografia', consultas: ['photograph texture', 'photograph rock formation', 'photograph object still life', 'botanical photograph'], vizinhos: ['historia-natural', 'arquitetura'] },
  'design-produto': { nome: 'Design de produto', consultas: ['vase design', 'decorative object', 'lamp design', 'tableware'], vizinhos: ['ceramica', 'arquitetura'] },
  'design-grafico': { nome: 'Design gráfico', consultas: ['poster', 'ornament pattern', 'typography print', 'label design'], vizinhos: ['gravura', 'textil'] },
  arquitetura: { nome: 'Arquitetura', consultas: ['architectural ornament', 'tile panel', 'gargoyle', 'facade relief'], vizinhos: ['escultura', 'design-produto'] },
  'arte-popular': { nome: 'Arte popular', consultas: ['folk art', 'ex-voto', 'mexican folk art', 'toy figure', 'carnival mask', 'votive figure'], vizinhos: ['escultura', 'textil', 'objetos'] },
  gravura: { nome: 'Gravura', consultas: ['woodcut', 'etching animal', 'engraving monster', 'linocut', 'chapbook woodcut'], vizinhos: ['ilustracao', 'design-grafico'] },
  textil: { nome: 'Arte têxtil', consultas: ['textile pattern', 'embroidery', 'tapestry animals', 'woven textile', 'quilt'], vizinhos: ['arte-popular', 'design-grafico', 'pintura'] },
  contemporanea: { nome: 'Arte contemporânea', consultas: ['contemporary sculpture', 'installation object', 'assemblage', 'biomorphic sculpture'], vizinhos: ['escultura', 'design-produto'] },
  'literatura-visual': { nome: 'Literatura visual', consultas: ['illuminated manuscript', 'bestiary', 'marginalia', 'emblem book', 'book of hours'], vizinhos: ['ilustracao', 'gravura'] },
  'historia-natural': { nome: 'História natural', consultas: ['natural history illustration', 'shell', 'seed pod', 'mineral specimen', 'fossil', 'coral', 'insect specimen'], vizinhos: ['fotografia', 'ilustracao', 'ceramica'] },
  americas: { nome: 'Américas', consultas: ['pre-columbian ceramic', 'moche vessel', 'marajoara', 'nazca pottery', 'maya vessel', 'aztec sculpture', 'pueblo pottery', 'mexican folk art', 'brazilian folk art', 'andean textile', 'tlatilco figure', 'colima dog', 'amazonian ceramic', 'santeria figure'], vizinhos: ['ceramica', 'arte-popular', 'objetos'] },
  objetos: { nome: 'Objetos e artefatos', consultas: ['amulet', 'ritual mask', 'vessel', 'reliquary', 'figural vessel', 'toy'], vizinhos: ['ceramica', 'arte-popular', 'escultura'] },
}

const MODO_CONSULTAS: Partial<Record<Modo, string[]>> = {
  'cores-texturas': ['glaze surface', 'crackle glaze', 'celadon', 'lusterware', 'iridescent', 'patina bronze', 'lichen', 'mineral specimen', 'textile weave', 'enamel', 'lacquer', 'mosaic'],
  'formas-volumes': ['vessel form', 'biomorphic', 'seed pod', 'shell', 'skull', 'figural vessel', 'gourd', 'sculpture abstract form', 'architectural model', 'coral'],
}

/** Temas rápidos do Descobrir: atalhos de cerâmica com várias consultas cada. */
/** Filtro de época do Descobrir. "Todas" ainda dá preferência ao que é recente. */
export type Epoca = 'todas' | 'contemporanea' | 'moderna' | 'antiga'
export const EPOCAS: Record<Epoca, { nome: string; periodo?: Periodo; consultas: string[] }> = {
  todas: { nome: 'Todas as épocas', consultas: [] },
  contemporanea: { nome: 'Contemporânea', periodo: { de: 1960 }, consultas: ['contemporary ceramics', 'contemporary sculpture', 'studio pottery', 'contemporary art installation', 'ceramic sculpture', 'contemporary glaze', 'contemporary craft', 'biomorphic sculpture', 'Takuro Kuwata', 'Ken Price', 'Betty Woodman', 'Ron Nagle', 'Magdalene Odundo', 'Jun Kaneko', 'Toshiko Takaezu', 'Akio Takamori', 'Grayson Perry', 'Edmund de Waal', 'Kristen Morgin', 'Shio Kusaka'] },
  moderna: { nome: 'Moderna e vanguardas', periodo: { de: 1880, ate: 1979 }, consultas: ['Bauhaus', 'Art Deco', 'Art Nouveau', 'Surrealism', 'Dada', 'Futurism', 'Constructivism', 'Wiener Werkstatte', 'Arts and Crafts pottery', 'Mingei', 'Peter Voulkos', 'Lucie Rie', 'Hans Coper', 'Picasso ceramic', 'Joan Miro ceramic', 'Lucio Fontana ceramic', 'Rookwood', 'Shoji Hamada', 'Beatrice Wood', 'abstract expressionism'] },
  antiga: { nome: 'Antiga', periodo: { ate: 1879 }, consultas: [] },
}
const dentro = (ano: number, p: Periodo) => (p.de == null || ano >= p.de) && (p.ate == null || ano <= p.ate)
/** O Descobrir é um feed só de imagens de obras: páginas de livro, folhas de texto, documentos e PDFs nunca entram. */
const PAGINA_LIVRO = /\b(page|pages|p\.\s?\d+|folio|fol\.\s?\d+|frontispiece|title[- ]page|book cover|text page|leaf \d+|plate \d+|pl\.\s?\d+|printed book|printed matter|book|books|codex|manuscript|página|livro|document|documents|letter|letters|deed|certificate|receipt|ticket|newspaper|periodical|magazine|pamphlet|broadside|sheet music|typescript|handwritten)\b|\.(pdf|djvu)\b/i
const ehPaginaDeLivro = (x: ItemDescoberta) => PAGINA_LIVRO.test(x.titulo + ' | ' + x.termos.join(' | '))
/** O que costuma deixar o feed sem graça (moedas, fragmentos, documentos…) perde pontos, a não ser que você goste. */
const SEM_GRACA = /\b(coin|medal|token|sherd|shard|fragment|potsherd|document|letter|manuscript leaf|leaf from|page from|map of|postage stamp|stamp|banknote|seal impression|negative|glass plate|lantern slide|specimen sheet|button|bead|weight|label|trade card|ticket|receipt|deed|certificate|bookplate|playing card|textile sample|sample book|wallpaper sample)\b/i
const semGraca = (x: ItemDescoberta, pesos: Record<string, number>) => SEM_GRACA.test(x.titulo + ' ' + x.termos.join(' ')) && !x.termos.some((t) => (pesos[t] ?? 0) > 2) ? 5 : 0
/** Variedade no topo: no máximo 2 obras do mesmo autor e ~1/3 do lote de uma mesma fonte; o excedente vai para o fim. */
const ehAntiga = (x: ItemDescoberta) => { const a = x.fonte === 'wm' ? undefined : anoDe(x.data); return a != null && a < 1880 }
/** `tetoAntigas`: em "Todas as épocas", no máximo ~1/4 do topo é acervo anterior a 1880 (o resto vai para o fim do lote). */
function variar(xs: ItemDescoberta[], tetoAntigas = false) {
  const porAutor = new Map<string, number>(); const porFonte = new Map<string, number>()
  const tetoFonte = Math.max(3, Math.ceil(xs.length * .34))
  const tetoAnt = Math.max(2, Math.ceil(xs.length * .25)); let nAnt = 0
  const topo: ItemDescoberta[] = [], fim: ItemDescoberta[] = []
  for (const x of xs) {
    const a = (x.autor ?? '').toLowerCase(); const na = a && !/unknown|anonymous|desconhecid/.test(a) ? (porAutor.get(a) ?? 0) : 0; const nf = porFonte.get(x.fonte) ?? 0
    const ant = tetoAntigas && ehAntiga(x)
    if (na >= 2 || nf >= tetoFonte || (ant && nAnt >= tetoAnt)) { fim.push(x); continue }
    if (a) porAutor.set(a, na + 1); porFonte.set(x.fonte, nf + 1); if (ant) nAnt++; topo.push(x)
  }
  return [...topo, ...fim]
}
/** Peso da data quando a época é "todas": o recente sobe e o acervo antigo de museu desce, para o feed não ficar no passado. */
const bonusRecente = (x: ItemDescoberta) => { const a = x.fonte === 'wm' ? undefined : anoDe(x.data); return a == null ? (x.fonte === 'ov' || x.fonte === 'rev' ? 3 : 0) : a >= 1960 ? 4 : a >= 1880 ? 2 : a >= 1600 ? -2 : -4 }
/** Consultas que o feed manda às revistas de arte (Colossal, Artaxis, Illustration Age…): produção atual. */
const REVISTAS_FEED = ['ceramics', 'ceramic sculpture', 'clay', 'porcelain', 'illustration', 'drawing', 'sculpture', 'painting', 'installation', 'textile', 'printmaking', 'animal sculpture']

/** Tema do Descobrir. `exige`: o que o resultado precisa ser (pelo título e classificação) para entrar; `porEpoca`: nomes do tema que cabem na época escolhida. */
export interface Tema { id: string; nome: string; universo: string; consultas: string[]; exige?: RegExp; porEpoca?: Partial<Record<Epoca, string[]>>; revistas?: string[] }
const EH_DESENHO = /\b(drawing|drawings|illustration|illustrations|illustrator|print|prints|woodcut|wood engraving|etching|engraving|lithograph|lithography|screenprint|serigraph|linocut|watercolou?r|gouache|ink|pen and ink|graphite|pencil|charcoal|chalk|pastel|poster|comic|cartoon|caricature|sketch|sketchbook|book illustration|design for|desenho|ilustração|gravura|tekening|prent|tegning|dessin|zeichnung|grafik)\b/i
const EH_PINTURA = /\b(painting|paintings|oil on|tempera|acrylic|watercolou?r|gouache|fresco|on canvas|on panel|pintura|schilderij|maleri|peinture|gemälde)\b/i
export const TEMAS: Tema[] = [
  { id: 'contemporaneos', nome: 'Artistas contemporâneos', universo: 'contemporanea', consultas: EPOCAS.contemporanea.consultas.slice(8), revistas: ['sculpture', 'installation', 'ceramics', 'illustration', 'painting', 'textile', 'artist', 'exhibition'] },
  { id: 'vanguardas', nome: 'Vanguardas', universo: 'contemporanea', consultas: EPOCAS.moderna.consultas },
  { id: 'esmaltes', nome: 'Esmaltes', universo: 'ceramica', consultas: ['crackle glaze', 'celadon', 'ash glaze', 'tenmoku', 'copper red glaze', 'lusterware', 'salt glaze stoneware', 'drip glaze'] },
  { id: 'animal', nome: 'Escultura animal', universo: 'escultura', consultas: ['animal sculpture', 'ceramic animal', 'animal figure terracotta', 'bird figure', 'animal head sculpture', 'zoomorphic vessel'] },
  { id: 'vasos', nome: 'Vasos', universo: 'ceramica', consultas: ['vase', 'storage jar', 'bottle vase', 'amphora', 'ceramic vessel', 'lidded jar'] },
  { id: 'ilustradores', nome: 'Ilustradores', universo: 'ilustracao', consultas: ['Grandville', 'Gustave Dore', 'Arthur Rackham', 'Ernst Haeckel', 'Aubrey Beardsley', 'Ivan Bilibin', 'Kay Nielsen', 'Edward Lear', 'Kawanabe Kyosai', 'Maria Sibylla Merian', 'John Tenniel', 'Walter Crane', 'Hokusai manga', 'bestiary illustration'], exige: EH_DESENHO,
    revistas: ['illustration', 'illustrator', 'drawing', 'drawings', 'picture book', 'zine', 'risograph', 'editorial illustration', 'comics', 'printmaking', 'sketchbook', 'ink drawing', 'animals illustration', 'surreal illustration'],
    porEpoca: {
      contemporanea: ['Saul Steinberg', 'Edward Gorey', 'Tomi Ungerer', 'Roland Topor', 'Maurice Sendak', 'Ralph Steadman', 'Quentin Blake', 'Jean-Michel Folon', 'Robert Crumb', 'Raymond Pettibon', 'Kiki Smith print', 'William Kentridge', 'Shaun Tan', 'contemporary illustration', 'contemporary drawing', 'screenprint'],
      moderna: ['Kay Nielsen', 'Edmund Dulac', 'Arthur Rackham', 'Aubrey Beardsley', 'Ivan Bilibin', 'Winsor McCay', 'Alphonse Mucha', 'Walter Crane', 'Kawanabe Kyosai', 'Jose Guadalupe Posada', 'Edward Gorey', 'Saul Steinberg', 'Jean de Brunhoff', 'Art Nouveau poster'],
    } },
  { id: 'pintores', nome: 'Pintores', universo: 'pintura', consultas: ['Hieronymus Bosch', 'Pieter Bruegel', 'Odilon Redon', 'Henri Rousseau', 'Albert Eckhout', 'Frans Post', 'Jean-Baptiste Debret', 'Rugendas', 'Paul Klee', 'Utagawa Kuniyoshi', 'Ito Jakuchu', 'Franz Marc', 'Giorgio Morandi', 'Hilma af Klint'], exige: EH_PINTURA,
    revistas: ['painting', 'paintings', 'painter', 'oil painting', 'gouache', 'figurative painting'],
    porEpoca: {
      contemporanea: ['David Hockney', 'Paula Rego', 'Beatriz Milhazes', 'Peter Doig', 'Marlene Dumas', 'Alice Neel', 'Philip Guston', 'Gerhard Richter', 'Joan Mitchell', 'Bhupen Khakhar', 'Kerry James Marshall', 'Amy Sillman', 'contemporary painting'],
      moderna: ['Paul Klee', 'Franz Marc', 'Giorgio Morandi', 'Hilma af Klint', 'Henri Rousseau', 'Odilon Redon', 'Tarsila do Amaral', 'Joan Miro', 'Marc Chagall', 'Henri Matisse', 'Wassily Kandinsky', 'Leonora Carrington', 'Remedios Varo'],
    } },
  { id: 'contemporanea', nome: 'Cerâmica contemporânea', universo: 'ceramica', consultas: ['contemporary ceramics', 'ceramic artist studio', 'ceramic sculpture exhibition', 'studio pottery', 'ceramic installation', 'raku firing', 'wood fired pottery'],
    revistas: ['ceramics', 'ceramic sculpture', 'clay', 'porcelain', 'stoneware', 'glaze', 'pottery', 'vessel', 'ceramic artist'] },
  { id: 'precolombiana', nome: 'Pré-colombiana', universo: 'americas', consultas: ['pre-columbian ceramic', 'moche vessel', 'maya vessel', 'nazca pottery', 'colima figure', 'marajoara', 'olmec figure'] },
]

/** Consultas de um tema na época escolhida: se o tema tem nomes daquela época, usa só eles (Doré não aparece em "contemporânea"). */
export function consultasDoTema(t: Tema, epoca: Epoca) { return epoca !== 'todas' && t.porEpoca?.[epoca] ? t.porEpoca[epoca]! : t.consultas }
/** Consultas que o tema manda direto às revistas de arte (Colossal, Illustration Age…): metade do tema em "Contemporânea", algumas em "Todas". */
export function revistasDoTema(t: Tema, epoca: Epoca) { return !t.revistas || epoca === 'antiga' || epoca === 'moderna' ? [] : [...t.revistas].sort(() => Math.random() - .5).slice(0, epoca === 'contemporanea' ? 8 : 4) }

/** Algumas palavras em português do acervo traduzidas para buscar nas fontes. */
const PT_EN: Record<string, string> = {
  animais: 'animals', animal: 'animal', pinturas: 'painting', desenhos: 'drawing', pintura: 'painting', desenho: 'drawing', escultura: 'sculpture', ceramica: 'ceramic', cerâmica: 'ceramic',
  ilustração: 'illustration', ilustracao: 'illustration', gravura: 'woodcut', textura: 'texture', forma: 'form', objeto: 'object', fotografia: 'photograph', monstros: 'monster', monstro: 'monster',
  criaturas: 'creature', máscaras: 'mask', mascaras: 'mask', vasos: 'vase', vaso: 'vase', pássaros: 'bird', passaros: 'bird', peixes: 'fish', flores: 'flower', rostos: 'face', cabeças: 'head',
  esmaltes: 'glaze', esmalte: 'glaze', azul: 'blue', vermelho: 'red', dourado: 'gold', terracota: 'terracotta', humor: 'humorous', surreal: 'surreal',
}
export const traduz = (s: string) => s.toLowerCase().split(/\s+/).map((w) => PT_EN[w] ?? w).join(' ')

const sorteio = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)]
function sortearPonderado(pares: [string, number][]) {
  const pos = pares.filter(([, p]) => p > 0); if (!pos.length) return undefined
  const tot = pos.reduce((t, [, p]) => t + p, 0); let r = Math.random() * tot
  for (const [k, p] of pos) { r -= p; if (r <= 0) return k }
  return pos[0][0]
}
const topo = (o: Record<string, number>, n: number) => Object.entries(o).filter(([, p]) => p > 0).sort((a, b) => b[1] - a[1]).slice(0, n)

/** Sementes vindas do próprio acervo (início frio: ainda não há interações). */
export async function sementesDoAcervo() {
  const refs = (await db.referencias.toArray()).filter((r) => !r.excluido)
  const grupos = new Map((await db.grupos.toArray()).map((g) => [g.id, g.nome]))
  const c = new Map<string, number>()
  const soma = (t?: string, p = 1) => { if (!t) return; const k = traduz(t.trim()); if (k.length > 2 && !/^whatsapp|^img|^\d/.test(k)) c.set(k, (c.get(k) ?? 0) + p) }
  refs.forEach((r) => { r.grupos.forEach((g) => soma(grupos.get(g), 1)); r.tags.forEach((t) => soma(t, 1.5)); if (r.autor) soma(r.autor, 2) })
  return [...c].sort((a, b) => b[1] - a[1]).slice(0, 12)
}

export interface Pedido { q: string; universo?: string; fonte?: FonteId; tema?: string; tipo: 'proximo' | 'adjacente' | 'experimental' | 'busca' | 'semelhantes'; motivo?: string }

/** Termos com peso: o aprendido + um reforço para o que foi curtido/salvo recentemente (meia-vida de 14 dias). */
export function pesosDoGosto(perfil: Perfil) {
  const agora = Date.now(); const meiaVida = 14 * 86400000
  const pesos: Record<string, number> = { ...perfil.termos }
  for (const h of perfil.historico.slice(-200)) {
    const f = Math.pow(0.5, (agora - h.quando) / meiaVida) * 2
    for (const t of h.termos) pesos[t] = (pesos[t] ?? 0) + f
  }
  for (const [k, v] of Object.entries(perfil.temporario)) if (v.ate > agora) pesos[k] = (pesos[k] ?? 0) + v.p * 1.5
  return pesos
}

const nomeU = (u?: string) => (u ? UNIVERSOS[u]?.nome ?? u : '')

/** Monta as consultas de um lote conforme o modo e a mistura 60/25/15 (ajustável). Cada pedido leva o motivo, mostrado no visor. */
export async function planejar(perfil: Perfil, modo: Modo, n = 8, epoca: Epoca = 'todas'): Promise<Pedido[]> {
  let { proximo, adjacente, experimental } = perfil.mistura
  if (modo === 'fora-da-curva') { proximo = 0; adjacente = 30; experimental = 70 }
  const tot = proximo + adjacente + experimental || 1
  const nP = Math.round((n * proximo) / tot), nA = Math.round((n * adjacente) / tot), nE = Math.max(0, n - nP - nA)
  let termos = topo(pesosDoGosto(perfil), 16)
  if (termos.length < 4) termos = [...termos, ...(await sementesDoAcervo())]
  const univFav = topo(perfil.universos, 3).map(([u]) => u)
  const favs = univFav.length ? univFav : ['ceramica', 'escultura', 'ilustracao']
  const pedidos: Pedido[] = []
  const extras = MODO_CONSULTAS[modo]
  const ia = perfil.gostoIA?.consultas ?? []
  // o que você curtiu por último aparece logo no lote seguinte: obras do mesmo autor ou com os mesmos termos
  let usados = 0
  if (modo === 'para-voce' && perfil.curtidasItens?.length) {
    const recentes = perfil.curtidasItens.slice(-12)
    for (let k = 0; k < Math.min(2, nP); k++) {
      const it = sorteio(recentes)
      const autor = it.autor && !/unknown|anonymous|desconhecido|anônimo|artist$/i.test(it.autor) ? it.autor : undefined
      const q = autor && Math.random() < .5 ? autor : it.termos.slice(0, 2).join(' ') || it.consulta
      if (q) { pedidos.push({ q, universo: it.universo, tipo: 'proximo', motivo: `Porque você curtiu “${it.titulo.slice(0, 60)}”` }); usados++ }
    }
  }
  // artistas dos seus estudos (Biblioteca): o nome, ou um esmalte/queima/técnica dele, entra em todo lote
  if (modo === 'para-voce' || modo === 'novos-artistas' || modo === 'fora-da-curva') {
    const estudos = (await db.artistas.toArray()).filter((a) => !a.excluido)
    const k = Math.min(estudos.length, modo === 'para-voce' ? 2 : 1)
    for (const a of [...estudos].sort((x, y) => Number(!!y.favorito) - Number(!!x.favorito) + Math.random() - .5).slice(0, k)) {
      const tecnicas = [...(a.esmaltes ?? []), ...(a.queimas ?? []), ...(a.tecnicas ?? [])].filter((t) => /^[\x20-\x7e]+$/.test(t) && t.length < 30)
      const q = modo !== 'novos-artistas' && tecnicas.length && Math.random() < .4 ? sorteio(tecnicas) : a.nome
      pedidos.push({ q, universo: 'ceramica', tipo: 'proximo', motivo: q === a.nome ? `Dos seus estudos de artistas: ${a.nome}` : `Dos seus estudos: ${q}, como em ${a.nome}` })
      if (modo === 'para-voce') usados++
    }
  }
  // suas pastas e referências (Pinterest, Instagram, grupos) lidas pela IA: até metade do que sobra
  if (modo === 'para-voce' || modo === 'fora-da-curva') {
    const insp = ((await db.ajustes.get('ia.acervoInspira'))?.valor as { consultas: { q: string; universo: string; pasta: string; porque: string }[] } | undefined)?.consultas ?? []
    const vagas = modo === 'fora-da-curva' ? 2 : Math.max(1, Math.ceil((nP - usados) / 2))
    for (const c of [...insp].sort(() => Math.random() - .5).slice(0, vagas)) {
      pedidos.push({ q: c.q, universo: c.universo, tipo: 'proximo', motivo: c.pasta === 'estudos de artistas' ? `Dos seus estudos de artistas: ${c.porque}` : c.pasta && c.pasta !== 'acervo' ? `Da sua pasta “${c.pasta}”` : `Do seu acervo: ${c.porque}` })
      if (modo === 'para-voce') usados++
    }
  }
  // ideias da IA a partir do seu gosto: até metade do que é "perto do que você gosta"
  if (modo === 'para-voce' && ia.length) {
    const k = Math.min(ia.length, Math.ceil((nP - usados) / 2))
    for (const c of [...ia].sort(() => Math.random() - .5).slice(0, k)) { pedidos.push({ q: c.q, universo: c.universo, tipo: 'proximo', motivo: `Leitura do seu gosto: ${c.porque}` }); usados++ }
  }
  for (let i = usados; i < nP; i++) {
    if (extras) { pedidos.push({ q: sorteio(extras), tipo: 'proximo', motivo: 'Do modo escolhido' }); continue }
    const t = sortearPonderado(termos); const u = sorteio(favs)
    pedidos.push({ q: t ? (Math.random() < .5 ? t : `${t} ${sorteio(UNIVERSOS[u].consultas).split(' ')[0]}`) : sorteio(UNIVERSOS[u].consultas), universo: u, tipo: 'proximo',
      motivo: t ? `Você costuma curtir “${t}”` : `Você gosta de ${nomeU(u)}` })
  }
  for (let i = 0; i < nA; i++) {
    const viz = [...new Set(favs.flatMap((u) => UNIVERSOS[u]?.vizinhos ?? []))].filter((u) => !favs.includes(u))
    const u = sorteio(viz.length ? viz : Object.keys(UNIVERSOS)); const t = sortearPonderado(termos)
    const base = extras ? sorteio(extras) : sorteio(UNIVERSOS[u].consultas)
    pedidos.push({ q: t && Math.random() < .5 ? `${t} ${base.split(' ').slice(-1)[0]}` : base, universo: u, tipo: 'adjacente', motivo: `Vizinho do que você gosta: ${nomeU(u)}` })
  }
  for (let i = 0; i < nE; i++) {
    const u = sorteio(Object.keys(UNIVERSOS).filter((x) => !favs.includes(x)))
    pedidos.push({ q: sorteio(UNIVERSOS[u].consultas), universo: u, tipo: 'experimental', motivo: `Para sair da curva: ${nomeU(u)}` })
  }
  // época escolhida (ou, em "todas", um pouco de contemporâneo): troca parte do lote por consultas daquela época
  const ep = EPOCAS[epoca]
  const daEpoca = epoca === 'todas' ? EPOCAS.contemporanea.consultas : ep.consultas
  const trocar = epoca === 'todas' ? Math.ceil(n * .3) : epoca === 'antiga' ? 0 : Math.ceil(n * .4)
  const lista = [...daEpoca].sort(() => Math.random() - .5)
  for (let k = 0; k < Math.min(trocar, lista.length, pedidos.length); k++) pedidos[pedidos.length - 1 - k] = { q: lista[k], universo: 'contemporanea', tipo: 'adjacente', motivo: epoca === 'todas' ? 'Para o feed não ficar só no passado' : `Época: ${ep.nome}` }
  // em "Todas" e "Contemporânea", duas consultas a mais vão direto às revistas de arte (o que se produz hoje)
  if (epoca === 'todas' || epoca === 'contemporanea') {
    const dosTermos = Object.entries(perfil.termos).filter(([k, v]) => v > 1 && /^[a-z][a-z ]{2,30}$/.test(k)).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k]) => k)
    const qs = [...dosTermos, ...REVISTAS_FEED].sort(() => Math.random() - .5).slice(0, 2)
    for (const q of qs) pedidos.push({ q, fonte: 'rev', tipo: 'adjacente', motivo: 'De uma revista de arte atual' })
  }
  return pedidos
}

/** Nota de uma obra para o seu gosto: termos e artista curtidos somam; termos recusados e o que a IA mandou evitar subtraem. */
export function notaDoGosto(x: ItemDescoberta, pesos: Record<string, number>, perfil: Perfil) {
  let n = 0
  for (const t of x.termos) n += Math.max(-6, Math.min(12, pesos[t] ?? 0))
  if (x.autor) n += Math.min(10, (perfil.artistas[x.autor] ?? 0) * 1.5)
  const txt = (x.titulo + ' ' + x.termos.join(' ')).toLowerCase()
  for (const e of perfil.gostoIA?.evitar ?? []) if (e && txt.includes(e.toLowerCase())) n -= 4
  return n
}

export interface EstadoFonte { id: FonteId; ok: boolean; erro?: string; quando: number; pausada?: boolean }

/** Fonte que recusou de vez (403/404/410/429) fica de fora por algumas horas, sem travar o feed. */
const PAUSA_MS = 6 * 3600 * 1000
const chavePausa = (id: FonteId) => 'descobrir.pausa.' + id
export function pausaDaFonte(id: FonteId): { ate: number; erro: string } | undefined {
  try { const x = JSON.parse(localStorage.getItem(chavePausa(id)) || 'null'); return x && x.ate > Date.now() ? x : undefined } catch { return undefined }
}
export function retomarFonte(id: FonteId) { try { localStorage.removeItem(chavePausa(id)) } catch { /* sem armazenamento */ } }
const pausar = (id: FonteId, erro: string) => { try { localStorage.setItem(chavePausa(id), JSON.stringify({ ate: Date.now() + PAUSA_MS, erro })) } catch { /* sem armazenamento */ } }
const recusaDura = (msg: string) => /HTTP (403|404|410|429)/.test(msg)

/** Executa as consultas nas fontes ligadas, remove repetidos, vistos e recusados. Se uma fonte falha, a consulta tenta a próxima. */
export async function buscarLote(perfil: Perfil, pedidos: Pedido[], conhecidos: Set<string>, porConsulta = 6, rodada = 0, epoca: Epoca = 'todas') {
  const periodo = EPOCAS[epoca].periodo
  const estados = new Map<FonteId, EstadoFonte>()
  const ligadas = FONTES.filter((f) => {
    if (!perfil.fontes[f.id]) return false
    const pz = pausaDaFonte(f.id)
    if (pz) estados.set(f.id, { id: f.id, ok: false, erro: pz.erro, quando: Date.now(), pausada: true })
    return !pz
  })
  if (!ligadas.length) return { itens: [] as ItemDescoberta[], estados: [...estados.values()] }
  const rec = new Set(perfil.recusados)
  const falhou = new Set<FonteId>()
  // o lote não espera fonte lenta: o que chegar em 15 s aparece; o resto termina em segundo plano e fica no cache da ponte
  const prazo = new Promise<ItemDescoberta[]>((r) => setTimeout(() => r([]), 15000))
  const res = await Promise.all(pedidos.map((p, i) => Promise.race([prazo, (async () => {
    const inicio = i + Math.floor(Math.random() * ligadas.length)
    // no feed, cada atualização sorteia páginas mais fundas dos acervos (material novo); busca segue em ordem
    const pagina = p.tipo === 'busca' || p.tipo === 'semelhantes' ? 1 + rodada * 2 + Math.floor(i / ligadas.length) : 1 + Math.floor(Math.random() * 8)
    // consulta num idioma específico vai só para o acervo daquele idioma
    const exige = p.tema ? TEMAS.find((t) => t.id === p.tema)?.exige : undefined
    const ordem = p.fonte ? ligadas.filter((f) => f.id === p.fonte) : ligadas.map((_, k) => ligadas[(inicio + k) % ligadas.length])
    for (const f of ordem) {
      if (falhou.has(f.id)) continue
      try {
        let xs = await f.buscar(p.q, periodo || exige ? porConsulta * 2 : porConsulta, pagina, periodo, p.universo)
        xs = xs.filter((x) => x.fonte === 'rev' || !ehPaginaDeLivro(x))
        // tema com tipo definido (ex.: Ilustradores só desenho/gravura): o que não é daquele tipo sai, mesmo que o nome bata
        if (exige) xs = xs.filter((x) => exige.test(x.titulo + ' | ' + x.termos.join(' | ')))
        // fora da época pedida sai; sem data só fica o Openverse (fotos atuais) no filtro contemporâneo
        // na Wikimedia a data é a da fotografia, não a da obra: não serve para o filtro de época
        if (periodo) xs = xs.filter((x) => { const a = x.fonte === 'wm' ? undefined : anoDe(x.data); return a == null ? epoca === 'contemporanea' && x.fonte === 'ov' : dentro(a, periodo) }).slice(0, porConsulta)
        // acervo pequeno para essa consulta: a página sorteada veio vazia, volta para uma das primeiras
        if (!xs.length && pagina > 1 && !periodo) xs = await f.buscar(p.q, porConsulta, 1 + Math.floor(Math.random() * Math.min(2, pagina - 1)))
        estados.set(f.id, { id: f.id, ok: true, quando: Date.now() })
        return xs.map((x) => ({ ...x, universo: p.universo, consulta: p.q, motivo: p.motivo }))
      } catch (e) {
        const erro = (e as Error).name === 'AbortError' ? 'Demorou demais para responder' : (e as Error).message
        falhou.add(f.id)
        if (recusaDura(erro)) pausar(f.id, erro)
        if (!estados.get(f.id)?.ok) estados.set(f.id, { id: f.id, ok: false, erro, quando: Date.now(), pausada: recusaDura(erro) })
      }
    }
    return [] as ItemDescoberta[]
  })()])))
  const vistos = new Set<string>()
  const itens: ItemDescoberta[] = []
  // intercala os resultados das consultas para o mural não ficar em blocos
  const max = Math.max(0, ...res.map((r) => r.length))
  for (let k = 0; k < max; k++) for (const r of res) { const x = r[k]; if (x && !vistos.has(x.id) && !rec.has(x.id) && !conhecidos.has(x.id)) { vistos.add(x.id); itens.push(x) } }
  // no feed, reordena pelo gosto: o que mais combina sobe, o que bate com recusas cai ou sai.
  // um sorteio na nota e as obras "para sair da curva" preservam espaço para o inesperado.
  if (pedidos.some((p) => p.tipo === 'proximo' || p.tipo === 'adjacente')) {
    const pesos = pesosDoGosto(perfil)
    const estudados = new Set((await db.artistas.toArray()).filter((a) => !a.excluido).map((a) => a.nome.toLowerCase()))
    const comNota = itens.map((x) => ({ x, n: notaDoGosto(x, pesos, perfil) + (epoca === 'todas' ? bonusRecente(x) : 0) - semGraca(x, pesos) + (/^(Da sua pasta|Do seu acervo|Dos seus estudos)/.test(x.motivo ?? '') ? 3 : 0) + (x.autor && estudados.has(x.autor.toLowerCase()) ? 6 : 0) }))
      .filter(({ x, n }) => n > -8 || x.motivo?.startsWith('Para sair'))
      .map(({ x, n }) => ({ x, ordem: x.motivo?.startsWith('Para sair') ? 4 + Math.random() * 6 : Math.max(-5, Math.min(15, n)) + Math.random() * 6 }))
    return { itens: variar(comNota.sort((a, b) => b.ordem - a.ordem).map(({ x }) => x), epoca === 'todas'), estados: [...estados.values()] }
  }
  return { itens, estados: [...estados.values()] }
}

/** Registra uma interação e atualiza o perfil (permanente ou temporário). */
export async function registrar(item: ItemDescoberta | null, tipo: Interacao, termosExtras: string[] = []) {
  const p = await lerPerfil()
  const w = p.pesos[tipo]
  const termos = [...(item?.termos ?? []).slice(0, 6), ...termosExtras]
  const temporario = tipo === 'pesquisar' || tipo === 'semelhantes'
  for (const t of termos) {
    if (temporario) p.temporario[t] = { p: (p.temporario[t]?.p ?? 0) + Math.abs(w), ate: Date.now() + 7 * 86400000 }
    else p.termos[t] = Math.max(-10, Math.min(50, (p.termos[t] ?? 0) + w))
  }
  if (item?.universo) p.universos[item.universo] = Math.max(-10, Math.min(50, (p.universos[item.universo] ?? 0) + w))
  if (item?.autor && !temporario) p.artistas[item.autor] = (p.artistas[item.autor] ?? 0) + w
  if (item && tipo === 'recusar') p.recusados = [...p.recusados.slice(-1500), item.id]
  if (item && tipo === 'curtir') {
    p.curtidos = p.curtidos.includes(item.id) ? p.curtidos : [...p.curtidos.slice(-1500), item.id]
    p.curtidasItens = [...(p.curtidasItens ?? []).filter((x) => x.id !== item.id).slice(-499), item]
  }
  if (!temporario && termos.length && w > 0) p.historico = [...p.historico.slice(-500), { quando: Date.now(), termos: termos.slice(0, 4) }]
  // limpa temporários vencidos
  for (const [k, v] of Object.entries(p.temporario)) if (v.ate < Date.now()) delete p.temporario[k]
  await salvarPerfil(p)
  return p
}

export async function descurtir(item: ItemDescoberta) {
  const p = await lerPerfil()
  p.curtidos = p.curtidos.filter((x) => x !== item.id)
  p.curtidasItens = (p.curtidasItens ?? []).filter((x) => x.id !== item.id)
  for (const t of item.termos.slice(0, 6)) p.termos[t] = (p.termos[t] ?? 0) - p.pesos.curtir
  await salvarPerfil(p)
}

const TIPO_POR_TERMO: [RegExp, string][] = [
  [/sculpt|figure|figurine|bronze|carv/, 'Escultura'], [/ceramic|porcelain|stoneware|earthenware|terracotta|pottery|vessel|jar|bowl/, 'Objeto'],
  [/photograph/, 'Fotografia'], [/print|woodcut|etching|engraving|lithograph|drawing|illustration|manuscript/, 'Ilustração'],
  [/painting|oil|tempera|watercolor|fresco/, 'Pintura'], [/textile|embroider|tapestry|weav|quilt/, 'Textura'],
]

/** Salva no Acervo com atribuição e link; tenta baixar a imagem (algumas fontes não permitem). */
export async function salvarNoAcervo(item: ItemDescoberta, grupos: string[] = []): Promise<string> {
  const ja = await db.referencias.filter((r) => r.origem === 'descobrir:' + item.id).first()
  if (ja && !ja.excluido) { if (grupos.length) await db.referencias.update(ja.id, { grupos: [...new Set([...ja.grupos, ...grupos])], atualizadoEm: Date.now() }); return ja.id }
  const { salvarArquivoDeUrl } = await import('../db/files')
  const arq = await salvarArquivoDeUrl(item.imagemGrande, item.titulo).catch(() => salvarArquivoDeUrl(item.imagem, item.titulo)).catch(() => undefined)
  const termos = item.termos.join(' ')
  const tipo = TIPO_POR_TERMO.find(([re]) => re.test(termos))?.[1] ?? 'Obra de arte'
  const { novo } = await import('../db/schema')
  const r = novo({
    titulo: item.titulo, tipo, imagens: arq ? [arq] : [], imagemExterna: arq ? undefined : item.imagemGrande,
    autor: item.autor, fonte: `${FONTE[item.fonte].nome}${item.data ? ' · ' + item.data : ''}`, url: item.link, licenca: item.licenca,
    descricao: undefined, tags: item.termos.slice(0, 6), grupos, origem: 'descobrir:' + item.id,
  }) as Referencia
  await db.referencias.add(r)
  return r.id
}
