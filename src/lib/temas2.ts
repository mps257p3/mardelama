import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Grupo, type Referencia } from '../db/schema'
import { normaliza, textoBusca } from './filtros'
import { traduz, UNIVERSOS, type Pedido } from './curadoria'
import { CATEGORIAS, lerConfig2, pesosDasCategorias, lerStats, ehPin, type Categoria } from './ref2'
import type { ItemDescoberta } from './fontes'

/**
 * Temas de Referências 2: pesquisa artística direcionada a partir das pastas do Pinterest.
 * Um tema só aponta para coleções (grupos) que já existem: nada é copiado, e mexer num tema
 * (renomear, ocultar, combinar, apagar) nunca altera nem apaga as coleções ou as referências.
 */
export const TEMAS2 = 'ref2.temas'
const LEITURA = (id: string) => `ref2.tema.leitura.${id}`

export interface Tema {
  id: string
  nome: string
  /** coleções (ids de grupos) que alimentam o tema */
  colecoes: string[]
  /** assunto reconhecido pelo nome das pastas (dá as palavras-âncora da busca) */
  assunto?: string
  /** referência escolhida à mão para a capa */
  capa?: string
  oculto?: boolean
  /** palavras extras que você deu ao tema (em português ou inglês) */
  termos?: string[]
  criadoEm: number
}
export interface EstadoTemas { atualizadoEm?: number; lista: Tema[]; /** coleções do Pinterest já consideradas (para não voltarem sozinhas depois de tiradas) */ vistas: string[] }
const VAZIO: EstadoTemas = { lista: [], vistas: [] }

export async function lerTemas(): Promise<EstadoTemas> { return { ...VAZIO, ...((await db.ajustes.get(TEMAS2))?.valor as EstadoTemas | undefined) } }
/** Guarda com a data (é o que a sincronização usa para saber qual versão vale). */
export async function salvarTemas(e: EstadoTemas) { await db.ajustes.put({ chave: TEMAS2, valor: { lista: e.lista, vistas: e.vistas, atualizadoEm: Date.now() } }) }
export function useTemas(): EstadoTemas | undefined {
  return useLiveQuery(async () => ({ ...VAZIO, ...((await db.ajustes.get(TEMAS2))?.valor as EstadoTemas | undefined) }), [])
}
export async function mudarTemas(f: (e: EstadoTemas) => EstadoTemas | void) {
  const e = await lerTemas(); const n = f(e) ?? e; await salvarTemas({ ...n, lista: [...n.lista] })
}
const idNovo = () => 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

/* ---------------- assuntos: reconhecem pastas pelo nome e ancoram a busca no assunto ---------------- */
export interface Assunto { id: string; nome: string; padrao: RegExp; ancoras: string[]; consultas: string[]; universo?: string }
export const ASSUNTOS: Assunto[] = [
  { id: 'esculturas', nome: 'Esculturas', padrao: /escult|sculpt|estatu|statue|figura/, ancoras: ['sculpture', 'escultura', 'sculptural', 'statue', 'figure', 'figurine', 'estatueta'], consultas: ['ceramic sculpture', 'contemporary ceramic sculpture', 'figurative ceramic sculpture', 'stoneware sculpture'], universo: 'escultura' },
  { id: 'luminarias', nome: 'Luminárias', padrao: /lumin|lampa|lamp|luz\b|light|abajur|pendente|arandela|sconce/, ancoras: ['lamp', 'light', 'lighting', 'luminaria', 'luminária', 'sconce', 'pendant', 'lantern', 'chandelier', 'abajur', 'candle'], consultas: ['ceramic lamp', 'ceramic pendant light', 'ceramic table lamp', 'sculptural lamp design', 'ceramic lantern'], universo: 'objetos' },
  { id: 'objetos', nome: 'Objetos decorativos', padrao: /decor|objet|object|enfeite/, ancoras: ['object', 'objeto', 'decorative', 'decorativo', 'ornament', 'ornamento'], consultas: ['decorative ceramic object', 'ceramic object design', 'contemporary ceramic objects'], universo: 'objetos' },
  { id: 'mascaras', nome: 'Máscaras', padrao: /mascar|máscar|mask/, ancoras: ['mask', 'máscara', 'mascara', 'masque'], consultas: ['ceramic mask', 'mask sculpture', 'ritual mask', 'contemporary mask art'], universo: 'escultura' },
  { id: 'vasos', nome: 'Vasos', padrao: /vas[oe]s?\b|vase|jarr|vessel|potes?\b|pots?\b|moring|ânfor|anfor/, ancoras: ['vase', 'vaso', 'vessel', 'jar', 'jarra', 'pot', 'pote', 'urn', 'amphora', 'bottle', 'moringa'], consultas: ['ceramic vase', 'stoneware vessel', 'contemporary ceramic vessel', 'sculptural vase'], universo: 'ceramica' },
  { id: 'ilustracao', nome: 'Ilustração', padrao: /ilustr|illustr|desenh|drawing|sketch|gravur|print/, ancoras: ['illustration', 'ilustração', 'ilustracao', 'drawing', 'desenho', 'sketch', 'print', 'gravura', 'woodcut', 'etching'], consultas: ['illustration', 'ink drawing', 'woodcut print', 'contemporary illustration'], universo: 'ilustracao' },
  { id: 'superficies', nome: 'Superfícies', padrao: /superf|textur|esmalt|glaze|surface|padr[aã]o|pattern|acabament/, ancoras: ['glaze', 'esmalte', 'texture', 'textura', 'surface', 'superfície', 'superficie', 'pattern', 'padrão', 'padrao', 'crackle', 'slip'], consultas: ['ceramic glaze surface', 'ceramic texture', 'textured stoneware', 'glaze detail'], universo: 'ceramica' },
  { id: 'atelie', nome: 'Ateliê', padrao: /atel|studio|estudio|estúdio|oficina|workshop|workspace/, ancoras: ['studio', 'ateliê', 'atelie', 'atelier', 'workshop', 'oficina', 'workspace', 'kiln', 'forno'], consultas: ['ceramic studio', 'potter studio', 'artist studio interior', 'ceramics workshop'], universo: 'ceramica' },
  { id: 'animais', nome: 'Animais', padrao: /anima|bicho|passar|pássar|bird|peix|fish|fauna|creature|criatur/, ancoras: ['animal', 'bird', 'pássaro', 'fish', 'peixe', 'creature', 'criatura', 'bicho', 'fauna'], consultas: ['ceramic animal sculpture', 'ceramic bird', 'animal figure'], universo: 'escultura' },
  { id: 'azulejos', nome: 'Azulejos', padrao: /azulej|tile|ladrilh/, ancoras: ['tile', 'azulejo', 'ladrilho', 'tiles'], consultas: ['ceramic tile', 'hand painted tile', 'tile panel'], universo: 'ceramica' },
  { id: 'mesa', nome: 'Mesa e utilitários', padrao: /prato|mesa|tableware|xícar|xicar|caneca|mug|cup|tigela|bowl|utilit/, ancoras: ['tableware', 'plate', 'prato', 'bowl', 'tigela', 'cup', 'xícara', 'mug', 'caneca', 'teapot'], consultas: ['handmade ceramic tableware', 'ceramic bowl', 'stoneware cup'], universo: 'ceramica' },
  { id: 'personagens', nome: 'Personagens', padrao: /personag|character|monstr|boneco|doll|toy/, ancoras: ['character', 'personagem', 'monster', 'monstro', 'doll', 'boneco', 'toy', 'creature'], consultas: ['ceramic character sculpture', 'art toy ceramic', 'whimsical ceramic figure'], universo: 'escultura' },
]
export const assuntoDe = (nome: string) => { const n = normaliza(nome); return ASSUNTOS.find((a) => a.padrao.test(n)) }

/* ---------------- coleções do Pinterest ---------------- */
/** Uma coleção é do Pinterest quando é pasta acompanhada (RSS), painel importado pela conta ou é feita sobretudo de pins. */
export function colecoesDoPinterest(grupos: Grupo[], refs: Referencia[]) {
  const n = new Map<string, { pins: number; tot: number }>()
  for (const r of refs) { if (r.excluido) continue; for (const g of r.grupos) { const c = n.get(g) ?? { pins: 0, tot: 0 }; c.tot++; if (ehPin(r)) c.pins++; n.set(g, c) } }
  return grupos.filter((g) => {
    if (g.excluido) return false
    const c = n.get(g.id); if (!c?.tot) return false
    return !!g.rss || /pinterest/i.test(g.descricao ?? '') || c.pins / c.tot >= 0.5
  })
}

/**
 * Primeira vez (e sempre que chega uma pasta nova do Pinterest): cada pasta entra num tema.
 * Pastas do mesmo assunto ("Esculturas", "Esculturas pequenas") vão para o mesmo tema; as outras viram um tema com o nome da pasta.
 * Pastas que você tirou de um tema não voltam sozinhas.
 */
export async function sincronizarTemas() {
  const [grupos, refs, e] = await Promise.all([db.grupos.toArray(), db.referencias.toArray(), lerTemas()])
  const vistas = new Set(e.vistas)
  const novas = colecoesDoPinterest(grupos, refs).filter((g) => !vistas.has(g.id))
  if (!novas.length) return 0
  const lista = [...e.lista]
  for (const g of novas) {
    vistas.add(g.id)
    if (lista.some((t) => t.colecoes.includes(g.id))) continue
    const a = assuntoDe(g.nome)
    const t = a ? lista.find((x) => x.assunto === a.id) : undefined
    if (t) t.colecoes = [...t.colecoes, g.id]
    else lista.push({ id: idNovo(), nome: a?.nome ?? g.nome, colecoes: [g.id], assunto: a?.id, criadoEm: Date.now() })
  }
  await salvarTemas({ lista, vistas: [...vistas] })
  return novas.length
}

/* ---------------- edição (nunca toca nas coleções) ---------------- */
export const criarTema = (nome: string, colecoes: string[]) => mudarTemas((e) => {
  const a = assuntoDe(nome)
  e.lista.push({ id: idNovo(), nome: nome.trim(), colecoes, assunto: a?.id, criadoEm: Date.now() })
})
export const editarTema = (id: string, mud: Partial<Tema>) => mudarTemas((e) => {
  e.lista = e.lista.map((t) => (t.id === id ? { ...t, ...mud, ...(mud.nome && !t.assunto ? { assunto: assuntoDe(mud.nome)?.id } : {}) } : t))
})
export const moverTema = (id: string, d: -1 | 1) => mudarTemas((e) => {
  const i = e.lista.findIndex((t) => t.id === id), j = i + d
  if (i < 0 || j < 0 || j >= e.lista.length) return
  const l = [...e.lista]; [l[i], l[j]] = [l[j], l[i]]; e.lista = l
})
/** Junta `de` em `em`: as coleções e palavras de um passam para o outro; `de` deixa de existir (as coleções continuam intactas). */
export const combinarTemas = (em: string, de: string) => mudarTemas((e) => {
  const a = e.lista.find((t) => t.id === em), b = e.lista.find((t) => t.id === de)
  if (!a || !b || a === b) return
  a.colecoes = [...new Set([...a.colecoes, ...b.colecoes])]
  a.termos = [...new Set([...(a.termos ?? []), ...(b.termos ?? [])])]
  e.lista = e.lista.filter((t) => t.id !== de)
})
export const apagarTema = (id: string) => mudarTemas((e) => { e.lista = e.lista.filter((t) => t.id !== id) })

/* ---------------- o que é do tema ---------------- */
/** Palavras que dizem do que o tema trata (assunto, nome, palavras extras), já normalizadas. */
export function ancorasDoTema(t: Tema, nomesColecoes: string[] = []) {
  const a = ASSUNTOS.find((x) => x.id === t.assunto)
  const extra = [t.nome, ...(t.termos ?? []), ...nomesColecoes].flatMap((s) => [s, traduz(s)]).flatMap((s) => normaliza(s).split(/[^a-z0-9]+/)).filter((w) => w.length > 3 && !PALAVRA_VAZIA.has(w))
  return [...new Set([...(a?.ancoras ?? []).map(normaliza), ...extra])]
}
const PALAVRA_VAZIA = new Set(['ceramica', 'ceramic', 'ceramics', 'pinterest', 'pasta', 'ideias', 'ideas', 'inspiracao', 'inspiration', 'referencias', 'board', 'coisas', 'outros', 'misc', 'arte', 'with', 'para', 'from'])
/** A palavra aparece como palavra (ou começo de palavra) no texto: "lamp" casa com "lamps", não com "clamp". */
export const citaAlguma = (texto: string, ancoras: string[]) => ancoras.some((a) => new RegExp('(^|[^a-z0-9])' + a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(texto))

/** Referências do Acervo ligadas ao tema: as das coleções do tema e as que falam do assunto (título, tags, descrição). */
export function refsDoTema(t: Tema, refs: Referencia[], ancoras: string[]) {
  const cols = new Set(t.colecoes)
  const daColecao: Referencia[] = [], doAssunto: Referencia[] = []
  for (const r of refs) {
    if (r.excluido) continue
    if (r.grupos.some((g) => cols.has(g))) daColecao.push(r)
    else if (citaAlguma(textoBusca(r.titulo, r.tags, r.descricao, r.tipo), ancoras)) doAssunto.push(r)
  }
  return { daColecao, doAssunto }
}

/* ---------------- leitura do tema com IA (só quando você pede; guardada) ---------------- */
export interface LeituraTema { quando: number; resumo: string; consultas: { q: string; universo: string; traco?: string; porque?: string }[] }
export async function lerLeituraTema(id: string) { return (await db.ajustes.get(LEITURA(id)))?.valor as LeituraTema | undefined }
export async function lerTemaComIA(t: Tema): Promise<LeituraTema> {
  const { chamar, iaConfigurada } = await import('./iaRepertorio')
  if (!(await iaConfigurada())) throw new Error('A IA não está configurada (falta a chave na Vercel).')
  const [grupos, refs] = await Promise.all([db.grupos.toArray(), db.referencias.toArray()])
  const cols = grupos.filter((g) => t.colecoes.includes(g.id))
  const { daColecao } = refsDoTema(t, refs, [])
  if (daColecao.length < 3) throw new Error('O tema ainda tem poucas referências para ler.')
  const sorteia = <T,>(xs: T[], n: number) => [...xs].sort(() => Math.random() - .5).slice(0, n)
  const resumo = (r: Referencia) => [r.titulo !== 'Pin' ? r.titulo : '', r.tags.slice(0, 4).join(', '), (r.descricao ?? '').split('\n')[0].slice(0, 80)].filter(Boolean).join(' · ').slice(0, 140)
  const imagens = sorteia(daColecao.filter((r) => /^https:\/\//.test(r.imagemExterna ?? '')), 12).map((r) => r.imagemExterna!)
  const pastas = cols.map((g) => { const rs = daColecao.filter((r) => r.grupos.includes(g.id)); return { nome: g.nome, peso: 3, itens: rs.length, exemplos: sorteia(rs, 8).map(resumo).filter(Boolean) } })
  const corpo = { acao: 'estetica', tema: t.nome, universos: Object.keys(UNIVERSOS), pastas }
  const r = await chamar<{ resumo: string; consultas: LeituraTema['consultas'] }>({ ...corpo, imagens }, 120000).catch(() => chamar<{ resumo: string; consultas: LeituraTema['consultas'] }>(corpo, 120000))
  const out: LeituraTema = { quando: Date.now(), resumo: r.resumo, consultas: (r.consultas ?? []).filter((c) => c.q && UNIVERSOS[c.universo]) }
  await db.ajustes.put({ chave: LEITURA(t.id), valor: out })
  return out
}

/* ---------------- plano de busca do tema ---------------- */
const RUIDO = /^(whatsapp|img|pin$|screenshot|dsc|pxl|\d|http)/i
/** Palavras mais frequentes nas referências do tema (tags e títulos), traduzidas para buscar. Sem IA. */
export function termosDasRefs(rs: Referencia[], ancoras: string[], n = 12): string[] {
  const c = new Map<string, number>()
  const soma = (s?: string, p = 1) => { if (!s) return; const k = traduz(s.trim().toLowerCase()); if (k.length > 2 && k.length < 32 && !RUIDO.test(k) && !ancoras.includes(normaliza(k)) && !PALAVRA_VAZIA.has(normaliza(k))) c.set(k, (c.get(k) ?? 0) + p) }
  for (const r of rs) { r.tags.forEach((t) => soma(t, 2)); if (r.titulo && r.titulo !== 'Pin' && r.titulo.split(/\s+/).length <= 4) soma(r.titulo, 1) }
  return [...c].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => k)
}

/**
 * Consultas do tema. Toda consulta carrega o assunto (a âncora), para a busca nunca trazer só "algo da mesma cor":
 * 1) as consultas do assunto; 2) o que é frequente nas suas pastas + o assunto; 3) a leitura do tema pela IA, se você pediu.
 * A fonte de cada consulta sai da hierarquia de Referências 2 (peso × relevância), sem o Pinterest, que não tem busca.
 */
export async function planejarTema(t: Tema, rs: Referencia[], ancoras: string[], n = 10, livre?: string | string[]): Promise<Pedido[]> {
  const a = ASSUNTOS.find((x) => x.id === t.assunto)
  const baseEn = a ? a.ancoras[0] : traduz(t.nome)
  const ancoraQ = (q: string) => (citaAlguma(normaliza(q), ancoras) ? q : `${q} ${baseEn}`)
  const leitura = await lerLeituraTema(t.id)
  const termos = termosDasRefs(rs, ancoras)
  const cfg = await lerConfig2(); const st = await lerStats()
  const pesos = pesosDasCategorias(cfg, st).filter((x) => CATEGORIAS[x.c].fontes.length)
  const somaP = pesos.reduce((s, x) => s + x.peso, 0) || 1
  const sorteiaCat = (): Categoria => { let r = Math.random() * somaP; for (const x of pesos) { r -= x.peso; if (r <= 0) return x.c } return pesos[0]?.c ?? 'museus' }
  const sorteio = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)]
  const base = a?.consultas.length ? a.consultas : [traduz(t.nome)]
  const out: Pedido[] = []
  for (let i = 0; i < n; i++) {
    let q: string, motivo: string, universo = a?.universo
    if (Array.isArray(livre) && livre.length) { q = ancoraQ(livre[i % livre.length]); motivo = `Tema ${t.nome}: parecido com a sua imagem` }
    else if (typeof livre === 'string' && livre) { q = ancoraQ(traduz(livre)); motivo = `Tema ${t.nome}: “${livre}”` }
    else {
      const r = Math.random()
      if (leitura?.consultas.length && r < .35) { const c = sorteio(leitura.consultas); q = ancoraQ(c.q); universo = c.universo; motivo = `Tema ${t.nome}: ${c.traco ?? 'leitura das pastas'}` }
      else if (termos.length && r < .75) { const k = sorteio(termos); q = ancoraQ(`${k} ${baseEn}`); motivo = `Tema ${t.nome}: “${k}” aparece nas suas pastas` }
      else { q = sorteio(base); motivo = `Tema ${t.nome}` }
    }
    const cat = sorteiaCat()
    out.push({ q, universo, tipo: 'adjacente', motivo, cat, fontes: [...CATEGORIAS[cat].fontes].sort(() => Math.random() - .5) })
  }
  return out
}

/** Relação de sentido com o tema: o título ou a classificação da obra citam o assunto. */
export const falaDoTema = (x: ItemDescoberta, ancoras: string[]) => citaAlguma(textoBusca(x.titulo, x.termos), ancoras)
