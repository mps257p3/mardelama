import { db, type Referencia } from '../db/schema'
import { FONTE, FONTES, type FonteId, type ItemDescoberta } from './fontes'

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
}

export const PESOS_PADRAO: Record<Interacao, number> = { curtir: 1, salvar: 2, painel: 3, semelhantes: 1.5, pesquisar: 0.6, recusar: -2 }
export const PERFIL_VAZIO: Perfil = {
  termos: {}, universos: {}, artistas: {}, temporario: {}, pesos: PESOS_PADRAO,
  mistura: { proximo: 60, adjacente: 25, experimental: 15 }, fontes: { aic: true, met: true, wm: true, cma: true, vam: true, smk: true, rijks: true, eu: true },
  vistos: [], recusados: [], curtidos: [], historico: [],
}
const CHAVE = 'descobrir.perfil'

export async function lerPerfil(): Promise<Perfil> {
  const a = await db.ajustes.get(CHAVE)
  const p = { ...PERFIL_VAZIO, ...(a?.valor as Partial<Perfil> ?? {}) }
  p.pesos = { ...PESOS_PADRAO, ...p.pesos }; p.fontes = { ...PERFIL_VAZIO.fontes, ...p.fontes }
  return p
}
export const salvarPerfil = (p: Perfil) => db.ajustes.put({ chave: CHAVE, valor: p })

/** Universos criativos: a curadoria é transversal, não só cerâmica. Consultas em inglês (as fontes indexam em inglês). */
export const UNIVERSOS: Record<string, { nome: string; consultas: string[]; vizinhos: string[] }> = {
  ceramica: { nome: 'Cerâmica', consultas: ['ceramic vessel', 'stoneware jar', 'glazed earthenware', 'porcelain figure', 'ceramic sculpture', 'tea bowl', 'terracotta figure', 'slipware'], vizinhos: ['escultura', 'objetos', 'design-produto'] },
  escultura: { nome: 'Escultura', consultas: ['sculpture animal', 'carved figure', 'bronze figure', 'wood sculpture', 'grotesque sculpture', 'small figurine'], vizinhos: ['ceramica', 'arte-popular', 'objetos'] },
  ilustracao: { nome: 'Ilustração', consultas: ['book illustration', 'fantastic creature drawing', 'grotesque drawing', 'caricature', 'children book illustration'], vizinhos: ['gravura', 'literatura-visual', 'pintura'] },
  pintura: { nome: 'Pintura', consultas: ['naive painting', 'surreal painting', 'folk painting animals', 'miniature painting', 'fresco fragment'], vizinhos: ['ilustracao', 'arte-popular', 'textil'] },
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
  objetos: { nome: 'Objetos e artefatos', consultas: ['amulet', 'ritual mask', 'vessel', 'reliquary', 'figural vessel', 'toy'], vizinhos: ['ceramica', 'arte-popular', 'escultura'] },
}

const MODO_CONSULTAS: Partial<Record<Modo, string[]>> = {
  'cores-texturas': ['glaze surface', 'crackle glaze', 'celadon', 'lusterware', 'iridescent', 'patina bronze', 'lichen', 'mineral specimen', 'textile weave', 'enamel', 'lacquer', 'mosaic'],
  'formas-volumes': ['vessel form', 'biomorphic', 'seed pod', 'shell', 'skull', 'figural vessel', 'gourd', 'sculpture abstract form', 'architectural model', 'coral'],
}

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

interface Pedido { q: string; universo?: string; tipo: 'proximo' | 'adjacente' | 'experimental' | 'busca' | 'semelhantes' }

/** Monta as consultas de um lote conforme o modo e a mistura 60/25/15 (ajustável). */
export async function planejar(perfil: Perfil, modo: Modo, n = 8): Promise<Pedido[]> {
  let { proximo, adjacente, experimental } = perfil.mistura
  if (modo === 'fora-da-curva') { proximo = 0; adjacente = 30; experimental = 70 }
  const tot = proximo + adjacente + experimental || 1
  const nP = Math.round((n * proximo) / tot), nA = Math.round((n * adjacente) / tot), nE = Math.max(0, n - nP - nA)
  const agora = Date.now()
  const temp = Object.entries(perfil.temporario).filter(([, v]) => v.ate > agora).map(([k, v]) => [k, v.p * 1.5] as [string, number])
  let termos = [...topo(perfil.termos, 14), ...temp]
  if (termos.length < 4) termos = [...termos, ...(await sementesDoAcervo())]
  const univFav = topo(perfil.universos, 3).map(([u]) => u)
  const favs = univFav.length ? univFav : ['ceramica', 'escultura', 'ilustracao']
  const pedidos: Pedido[] = []
  const extras = MODO_CONSULTAS[modo]
  for (let i = 0; i < nP; i++) {
    if (extras) { pedidos.push({ q: sorteio(extras), tipo: 'proximo' }); continue }
    const t = sortearPonderado(termos); const u = sorteio(favs)
    pedidos.push({ q: t ? (Math.random() < .5 ? t : `${t} ${sorteio(UNIVERSOS[u].consultas).split(' ')[0]}`) : sorteio(UNIVERSOS[u].consultas), universo: u, tipo: 'proximo' })
  }
  for (let i = 0; i < nA; i++) {
    const viz = [...new Set(favs.flatMap((u) => UNIVERSOS[u]?.vizinhos ?? []))].filter((u) => !favs.includes(u))
    const u = sorteio(viz.length ? viz : Object.keys(UNIVERSOS)); const t = sortearPonderado(termos)
    const base = extras ? sorteio(extras) : sorteio(UNIVERSOS[u].consultas)
    pedidos.push({ q: t && Math.random() < .5 ? `${t} ${base.split(' ').slice(-1)[0]}` : base, universo: u, tipo: 'adjacente' })
  }
  for (let i = 0; i < nE; i++) {
    const u = sorteio(Object.keys(UNIVERSOS).filter((x) => !favs.includes(x)))
    pedidos.push({ q: sorteio(UNIVERSOS[u].consultas), universo: u, tipo: 'experimental' })
  }
  return pedidos
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
export async function buscarLote(perfil: Perfil, pedidos: Pedido[], conhecidos: Set<string>, porConsulta = 6) {
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
  const res = await Promise.all(pedidos.map(async (p, i) => {
    const inicio = i + Math.floor(Math.random() * ligadas.length)
    const pagina = p.tipo === 'busca' || p.tipo === 'semelhantes' ? 1 + Math.floor(i / ligadas.length) : 1 + Math.floor(Math.random() * 3)
    for (let k = 0; k < ligadas.length; k++) {
      const f = ligadas[(inicio + k) % ligadas.length]
      if (falhou.has(f.id)) continue
      try {
        const xs = await f.buscar(p.q, porConsulta, pagina)
        estados.set(f.id, { id: f.id, ok: true, quando: Date.now() })
        return xs.map((x) => ({ ...x, universo: p.universo, consulta: p.q }))
      } catch (e) {
        const erro = (e as Error).name === 'AbortError' ? 'Demorou demais para responder' : (e as Error).message
        falhou.add(f.id)
        if (recusaDura(erro)) pausar(f.id, erro)
        if (!estados.get(f.id)?.ok) estados.set(f.id, { id: f.id, ok: false, erro, quando: Date.now(), pausada: recusaDura(erro) })
      }
    }
    return []
  }))
  const vistos = new Set<string>()
  const itens: ItemDescoberta[] = []
  // intercala os resultados das consultas para o mural não ficar em blocos
  const max = Math.max(0, ...res.map((r) => r.length))
  for (let k = 0; k < max; k++) for (const r of res) { const x = r[k]; if (x && !vistos.has(x.id) && !rec.has(x.id) && !conhecidos.has(x.id)) { vistos.add(x.id); itens.push(x) } }
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
  if (item && tipo === 'curtir') p.curtidos = p.curtidos.includes(item.id) ? p.curtidos : [...p.curtidos.slice(-1500), item.id]
  if (!temporario && termos.length && w > 0) p.historico = [...p.historico.slice(-500), { quando: Date.now(), termos: termos.slice(0, 4) }]
  // limpa temporários vencidos
  for (const [k, v] of Object.entries(p.temporario)) if (v.ate < Date.now()) delete p.temporario[k]
  await salvarPerfil(p)
  return p
}

export async function descurtir(item: ItemDescoberta) {
  const p = await lerPerfil()
  p.curtidos = p.curtidos.filter((x) => x !== item.id)
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
