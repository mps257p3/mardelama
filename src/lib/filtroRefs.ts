import { useSyncExternalStore } from 'react'
import type { Referencia } from '../db/schema'
import { normaliza, textoBusca } from './filtros'

/** Filtros do Acervo: vivem durante a sessão (voltar de uma imagem não perde a busca). */
export interface FiltroRefs {
  q: string
  grupos: string[]
  op: 'E' | 'OU'
  tipos: string[]
  fav: boolean
  artistas: string[]
  tags: string[]
  ordem: 'recentes' | 'antigas' | 'titulo' | 'atualizadas'
  periodo: '' | '7' | '30' | '365'
  inspira: boolean
  semente: number
  /** origem da referência (só em Referências 2): pinterest, instagram, descobrir, pasta, manual */
  origens?: string[]
}

export const FILTRO_VAZIO: FiltroRefs = { q: '', grupos: [], op: 'E', tipos: [], fav: false, artistas: [], tags: [], ordem: 'recentes', periodo: '', inspira: false, semente: 1 }

/**
 * Cria um conjunto de filtros independente, guardado na sessão com a chave dada.
 * O Acervo original usa 'refs.filtro'; Referências 2 tem o seu próprio, para as duas versões não se misturarem.
 */
export function criarFiltroRefs(chave: string, chaveOp: string) {
  let estado: FiltroRefs = (() => {
    try { const s = sessionStorage.getItem(chave); if (s) return { ...FILTRO_VAZIO, ...JSON.parse(s) } } catch { /* sem sessão */ }
    try { const op = localStorage.getItem(chaveOp); if (op === 'OU') return { ...FILTRO_VAZIO, op: 'OU' } } catch { /* idem */ }
    return FILTRO_VAZIO
  })()
  const ouvintes = new Set<() => void>()
  const mudar = (p: Partial<FiltroRefs>) => {
    estado = { ...estado, ...p }
    try { sessionStorage.setItem(chave, JSON.stringify(estado)); localStorage.setItem(chaveOp, estado.op) } catch { /* ignora */ }
    ouvintes.forEach((f) => f())
  }
  const assinar = (f: () => void) => { ouvintes.add(f); return () => { ouvintes.delete(f) } }
  const ler = () => estado
  return { mudar, assinar, ler }
}

const original = criarFiltroRefs('refs.filtro', 'refs.op')
export const mudarFiltro = original.mudar
export function useFiltroRefs() { return useSyncExternalStore(original.assinar, original.ler) }

/** Quantos filtros (além da busca) estão ativos. */
export function filtrosAtivos(f: FiltroRefs) {
  return (f.origens?.length ?? 0) + f.grupos.length + f.tipos.length + f.artistas.length + f.tags.length + (f.fav ? 1 : 0) + (f.periodo ? 1 : 0) + (f.ordem !== 'recentes' ? 1 : 0)
}

/** Embaralhamento estável para uma semente (o modo inspiração não muda a cada render). */
function embaralhar<T>(xs: T[], semente: number) {
  const a = xs.slice(); let s = semente * 9301 + 49297
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280 }
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}

export function aplicarFiltro(refs: Referencia[], f: FiltroRefs, nomeGrupo: Map<string, string>) {
  const limite = f.periodo ? Date.now() - Number(f.periodo) * 86400000 : 0
  const q = normaliza(f.q)
  let r = refs.filter((x) => {
    if (f.grupos.length && !(f.op === 'E' ? f.grupos.every((g) => x.grupos.includes(g)) : f.grupos.some((g) => x.grupos.includes(g)))) return false
    if (f.tipos.length && !f.tipos.includes(x.tipo)) return false
    if (f.origens?.length && !f.origens.includes(origemDaRef(x))) return false
    if (f.fav && !x.favorito) return false
    if (f.artistas.length && !(x.autor && f.artistas.includes(x.autor.trim()))) return false
    if (f.tags.length && !f.tags.some((t) => x.tags.includes(t))) return false
    if (limite && x.criadoEm < limite) return false
    if (q && !textoBusca(x.titulo, x.autor, x.fonte, x.descricao, x.comentarios, x.tipo, x.tags, x.grupos.map((g) => nomeGrupo.get(g) ?? '')).includes(q)) return false
    return true
  })
  if (f.inspira) return embaralhar(r, f.semente)
  r = r.slice()
  if (f.ordem === 'antigas') r.sort((a, b) => a.criadoEm - b.criadoEm)
  else if (f.ordem === 'titulo') r.sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'))
  else if (f.ordem === 'atualizadas') r.sort((a, b) => b.atualizadoEm - a.atualizadoEm)
  else r.sort((a, b) => b.criadoEm - a.criadoEm)
  return r
}

export const ORDENS: { v: FiltroRefs['ordem']; l: string }[] = [
  { v: 'recentes', l: 'Mais recentes' }, { v: 'antigas', l: 'Mais antigas' }, { v: 'atualizadas', l: 'Editadas por último' }, { v: 'titulo', l: 'Título (A–Z)' },
]
export const PERIODOS: { v: FiltroRefs['periodo']; l: string }[] = [
  { v: '', l: 'Qualquer data' }, { v: '7', l: 'Última semana' }, { v: '30', l: 'Último mês' }, { v: '365', l: 'Último ano' },
]

/** De onde veio a referência, pelo campo `origem`. */
export type OrigemRef = 'pinterest' | 'instagram' | 'descobrir' | 'pasta' | 'manual'
export function origemDaRef(r: Pick<Referencia, 'origem'>): OrigemRef {
  const o = r.origem ?? ''
  if (o.startsWith('pinterest:')) return 'pinterest'
  if (o.startsWith('instagram:')) return 'instagram'
  if (o.startsWith('descobrir:')) return 'descobrir'
  if (o.startsWith('sha1:') || o.includes('|')) return 'pasta'
  return 'manual'
}
export const ORIGENS_REF: { v: OrigemRef; l: string }[] = [
  { v: 'pinterest', l: 'Pinterest' }, { v: 'instagram', l: 'Instagram' }, { v: 'pasta', l: 'Pastas do computador' }, { v: 'descobrir', l: 'Descobrir' }, { v: 'manual', l: 'Adicionadas à mão e compartilhadas' },
]
