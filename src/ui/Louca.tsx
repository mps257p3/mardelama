import { Utensils, UtensilsCrossed, FlaskConical } from 'lucide-react'
import type { Louca } from '../db/schema'
import { Menu } from './Menu'

const NAO = /(não|nao)\s+(é|e|recomend\w*|indicad\w*|serve|usar)[^.;\n]{0,40}(louça|loucas|alimento|utilit)|só decorativ|apenas decorativ|uso decorativo|not food safe|non[- ]food/i
const SIM = /(próprio|propri[oa]|indicado|segur[oa])s?\s+para\s+(louça|alimento|utilit)|food[- ]safe|dinnerware[- ]safe/i

/** Lê nos textos de um estudo se o fabricante libera para louça. Sem menção: undefined. */
export function loucaDoTexto(textos: (string | undefined)[]): Louca | undefined {
  const t = textos.filter(Boolean).join('\n')
  if (NAO.test(t)) return 'nao'
  if (SIM.test(t)) return 'sim'
  return undefined
}

const ROTULO: Record<Louca, string> = { sim: 'Pode ir à louça', nao: 'Não usar em louça', testar: 'Louça só após teste' }

/**
 * Selo ao lado da temperatura: o esmalte pode ser usado em pratos, canecas e outros utilitários?
 * `origem` muda a frase de apoio (declarado pelo fabricante x testado por você). Toque para mudar.
 */
export function SeloLouca({ valor, origem, onChange }: { valor?: Louca; origem: 'fabricante' | 'proprio'; onChange: (v: Louca) => unknown }) {
  const v = valor ?? 'testar'
  const sub = v === 'sim' ? (origem === 'fabricante' ? 'declarado pelo fabricante' : 'aprovado em teste de lixiviação')
    : v === 'nao' ? 'só peças decorativas'
    : origem === 'fabricante' ? 'o fabricante não declara' : 'precisa de teste de lixiviação'
  const Ic = v === 'sim' ? Utensils : v === 'nao' ? UtensilsCrossed : FlaskConical
  return (
    <Menu esquerda rotulo="Uso em louça" botao={<span className={'selo-louca ' + v}><Ic size={14} /><b>{ROTULO[v]}</b><span>{sub}</span></span>} itens={[
      { l: 'Pode ir à louça', icon: <Utensils size={16} />, on: v === 'sim', onClick: () => onChange('sim') },
      { l: 'Não usar em louça (decorativo)', icon: <UtensilsCrossed size={16} />, on: v === 'nao', onClick: () => onChange('nao') },
      { l: 'Louça só após teste', icon: <FlaskConical size={16} />, on: v === 'testar', onClick: () => onChange('testar') },
    ]} />
  )
}
