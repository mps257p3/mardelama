import { db, uid, novo, type Artista, type Obra, type Referencia } from '../db/schema'

export const vivos = <T extends { excluido?: 0 | 1 }>(xs: T[]) => xs.filter((x) => !x.excluido)

/** Temas fixos do bloco "Técnicas e processos": o que não tiver registro aparece como "Não documentado". */
export const TEMAS_PROCESSO = ['Modelagem', 'Torneamento', 'Construção manual', 'Argila', 'Engobes', 'Esmaltes', 'Aplicação de camadas', 'Queima', 'Atmosfera do forno', 'Acabamentos'] as const

export const CERTEZA = {
  verificado: { rotulo: 'Verificado', desc: 'Documentado em fonte' },
  interpretacao: { rotulo: 'Leitura visual', desc: 'Interpretação a partir das imagens' },
  hipotese: { rotulo: 'Hipótese técnica', desc: 'Não confirmado' },
} as const

export const ANALISE = [
  ['formas', 'Formas recorrentes'], ['paleta', 'Paleta cromática'], ['texturas', 'Texturas'], ['composicao', 'Composição'],
  ['materiais', 'Materiais'], ['superficieVolume', 'Superfície e volume'], ['reconhecivel', 'O que torna a obra reconhecível'],
] as const

/** Filtros recolhidos do Estudos de artistas. Cada filtro junta um ou mais campos do perfil. */
export const FILTROS = [
  { k: 'pais', l: 'País', ks: ['pais'] },
  { k: 'linguagem', l: 'Linguagem artística', ks: ['esteticas'] },
  { k: 'tecmat', l: 'Técnicas e materiais', ks: ['tecnicas', 'materiais', 'esmaltes'] },
  { k: 'queimas', l: 'Queima', ks: ['queimas'] },
  { k: 'tiposObra', l: 'Tipo de obra', ks: ['tiposObra'] },
] as const
export type ChaveFiltro = (typeof FILTROS)[number]['k']
type CampoLista = 'pais' | 'esteticas' | 'tecnicas' | 'materiais' | 'esmaltes' | 'queimas' | 'tiposObra'
const filtro = (k: ChaveFiltro) => FILTROS.find((x) => x.k === k)!
export const valoresDe = (a: Artista, k: ChaveFiltro) => [...new Set((filtro(k).ks as readonly CampoLista[]).flatMap((c) => a[c] ?? []))]

export function valoresFiltro(as: Artista[], k: ChaveFiltro) {
  const m = new Map<string, number>()
  as.forEach((a) => valoresDe(a, k).forEach((v) => m.set(v, (m.get(v) ?? 0) + 1)))
  return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
}

/** Até três etiquetas principais para o card: as etiquetas do estudo, senão as características. */
export const etiquetasPrincipais = (a: Artista) => (a.tags.length ? a.tags : a.caracteristicas).slice(0, 3)

/** Imagem de uma obra: a foto guardada no aparelho ou a da fonte original. */
export const temImagemObra = (o?: Pick<Obra, 'arquivo' | 'imagem'>) => !!(o?.arquivo || o?.imagem)

const traços = (a: Artista) => [
  ...a.tecnicas.map((x) => 't:' + x), ...a.esmaltes.map((x) => 'e:' + x), ...a.queimas.map((x) => 'q:' + x),
  ...a.esteticas.map((x) => 's:' + x), ...a.materiais.map((x) => 'm:' + x), ...a.tiposObra.map((x) => 'o:' + x),
  ...a.tags.map((x) => 'g:' + x.toLowerCase()),
]
const PESO: Record<string, number> = { e: 3, t: 2.5, q: 2.5, s: 2, m: 1.5, o: 1, g: 1 }

export interface Sugestao { a: Artista; nota: number; motivos: string[] }
const NOME_TRACO: Record<string, string> = { e: 'esmaltes', t: 'técnica', q: 'queima', s: 'estética', m: 'materiais', o: 'tipo de obra', g: 'etiquetas' }

/**
 * "Você também pode gostar de": semelhança de esmaltes, técnicas, queimas, estética, materiais e formas.
 * Melhora com o uso: traços de artistas e obras favoritados e das referências ligadas pesam mais.
 */
export function recomendar(alvo: Artista, todos: Artista[], gosto: Map<string, number>, n = 4): Sugestao[] {
  const meus = new Set(traços(alvo))
  return todos.filter((b) => b.id !== alvo.id).map((b) => {
    let nota = alvo.relacionados.includes(b.id) || b.relacionados.includes(alvo.id) ? 4 : 0
    const comuns = new Map<string, string[]>()
    for (const t of new Set(traços(b))) {
      if (!meus.has(t)) continue
      const tipo = t[0]
      nota += (PESO[tipo] ?? 1) * (1 + (gosto.get(t) ?? 0) * 0.25)
      comuns.set(tipo, [...(comuns.get(tipo) ?? []), t.slice(2)])
    }
    if (b.favorito) nota += 1.5
    const motivos = [...comuns.entries()].sort((x, y) => (PESO[y[0]] ?? 1) - (PESO[x[0]] ?? 1)).slice(0, 2).map(([k, v]) => `${NOME_TRACO[k]}: ${v.slice(0, 2).join(', ')}`)
    return { a: b, nota, motivos }
  }).filter((s) => s.nota > 0).sort((x, y) => y.nota - x.nota).slice(0, n)
}

/** Gosto aprendido: quantas vezes cada traço aparece em artistas favoritos e em artistas com obras favoritas ou referências ligadas. */
export async function gostoDosArtistas(todos: Artista[]) {
  const obrasFav = vivos(await db.obras.toArray()).filter((o) => o.favorito)
  const rels = vivos(await db.relacoes.toArray()).filter((r) => r.aTipo === 'artista' || r.bTipo === 'artista' || r.aTipo === 'obra' || r.bTipo === 'obra')
  const peso = new Map<string, number>()
  todos.forEach((a) => peso.set(a.id, (a.favorito ? 2 : 0) + obrasFav.filter((o) => o.artistaId === a.id).length + rels.filter((r) => r.aId === a.id || r.bId === a.id).length * 0.5))
  const g = new Map<string, number>()
  todos.forEach((a) => { const p = peso.get(a.id) ?? 0; if (p) traços(a).forEach((t) => g.set(t, (g.get(t) ?? 0) + p)) })
  return g
}

/**
 * Salva uma obra no Acervo de Referências sem duplicar: se já houver uma referência com a mesma imagem
 * ou ligada a esta obra, reaproveita. A ligação obra ↔ referência fica nos dois sentidos.
 */
export async function salvarObraComoReferencia(o: Obra, artista?: Artista): Promise<string> {
  const ligadas = vivos(await db.relacoes.where('[aTipo+aId]').equals(['obra', o.id]).toArray()).filter((r) => r.bTipo === 'referencia')
  for (const r of ligadas) { const ref = await db.referencias.get(r.bId); if (ref && !ref.excluido) return ref.id }
  const mesma = o.imagem ? (await db.referencias.toArray()).find((r) => !r.excluido && (r.imagemExterna === o.imagem || (o.fonte && r.url === o.fonte))) : undefined
  let id = mesma?.id
  if (!id) {
    const ref: Referencia = novo({
      titulo: [o.titulo || o.serie || 'Obra', o.ano].filter(Boolean).join(', '), tipo: 'Cerâmica', imagens: o.arquivo ? [o.arquivo] : [],
      imagemExterna: o.arquivo ? undefined : o.imagem, autor: artista?.nome, fonte: o.credito, url: o.fonte,
      descricao: [o.materiais, o.dimensoes, o.esmaltacao, o.queima].filter(Boolean).join(' · ') || undefined,
      tags: [...o.tags], grupos: [], licenca: 'Uso pessoal · direitos do autor',
    })
    await db.referencias.add(ref); id = ref.id
  }
  const t = Date.now()
  await db.relacoes.add({ id: uid(), aTipo: 'obra', aId: o.id, bTipo: 'referencia', bId: id, criadoEm: t, atualizadoEm: t, excluido: 0 })
  return id
}

export const listaParaTexto = (xs?: string[]) => (xs ?? []).join('\n')
export const textoParaLista = (s: string) => s.split(/\n+/).map((x) => x.trim()).filter(Boolean)
