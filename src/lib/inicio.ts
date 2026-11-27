import { useAjuste } from '../db/settings'

/** Seções dinâmicas da tela inicial — podem ser reordenadas e ocultadas em Ajustes. */
export const SECOES_INICIO = [
  { id: 'bancada', nome: 'Sobre a bancada' },
  { id: 'agenda', nome: 'Exposições em São Paulo' },
] as const
export type SecaoId = (typeof SECOES_INICIO)[number]['id']
export interface SecaoCfg { id: SecaoId; on: boolean }

export function mesclarSecoes(salvo?: SecaoCfg[]): SecaoCfg[] {
  const validos = new Set<string>(SECOES_INICIO.map((s) => s.id))
  const out = (salvo ?? []).filter((s) => validos.has(s.id))
  // seção nova entra na posição padrão dela, sem mexer na ordem que a pessoa escolheu
  SECOES_INICIO.forEach((s, i) => { if (!out.some((o) => o.id === s.id)) out.splice(Math.min(i, out.length), 0, { id: s.id, on: true }) })
  return out
}
export const useSecoesInicio = () => mesclarSecoes(useAjuste<SecaoCfg[] | undefined>('inicio.secoes', undefined))

export interface DestaqueCfg { x: number; y: number; zoom?: number; credito?: string; tituloSobre?: boolean; tituloClaro?: boolean }
export const DESTAQUE_PADRAO: DestaqueCfg = { x: 50, y: 35, tituloSobre: false, tituloClaro: true }
export const useDestaqueCfg = () => ({ ...DESTAQUE_PADRAO, ...useAjuste<Partial<DestaqueCfg>>('destaque.cfg', {}) })
