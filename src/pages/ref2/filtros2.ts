import { useSyncExternalStore } from 'react'
import { FILTROS2_VAZIO, type Filtros2 } from '../../lib/ref2'

/** Filtros avançados do Descobrir de Referências 2: vivem na sessão, separados dos da versão original. */
const CHAVE = 'ref2.filtros'
let filtros: Filtros2 = (() => { try { const s = sessionStorage.getItem(CHAVE); if (s) return { ...FILTROS2_VAZIO, ...JSON.parse(s) } } catch { /* sem sessão */ } return FILTROS2_VAZIO })()
const ouvintes = new Set<() => void>()
export function mudarFiltros2(p: Partial<Filtros2>) {
  filtros = { ...filtros, ...p }
  try { sessionStorage.setItem(CHAVE, JSON.stringify(filtros)) } catch { /* ignora */ }
  ouvintes.forEach((f) => f())
}
export const filtrosAtuais = () => filtros
export const useFiltros2 = () => useSyncExternalStore((f) => { ouvintes.add(f); return () => ouvintes.delete(f) }, () => filtros)
export const ROT_INTERACAO: Record<Filtros2['interacao'], string> = { todas: 'Todas', curtidas: 'Curtidas', 'nao-vistas': 'Ainda não vistas', salvas: 'Salvas', ocultadas: 'Ocultadas' }
