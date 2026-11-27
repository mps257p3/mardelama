import type { ReactNode } from 'react'
import { PICTOGRAMAS } from '../../../lib/esmalteFicha'

/**
 * Ilustrações técnicas da Esmaltaria: cortes e vistas de uma superfície cerâmica, em traço fino.
 * Massa em argila, esmalte em azul mineral translúcido, segundo esmalte em terracota. Esquemas, não resultados de teste.
 */
const MASSA = { fill: 'var(--argila)', fillOpacity: 0.55, stroke: 'var(--marrom)', strokeWidth: 0.8 } as const
const ESM = { fill: 'var(--azul)', fillOpacity: 0.55, stroke: 'none' } as const
const ESM2 = { fill: 'var(--terracota)', fillOpacity: 0.55, stroke: 'none' } as const
const LINHA = { fill: 'none', stroke: 'var(--marrom)', strokeWidth: 0.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const
const ONDA_TOPO = 'M3 30c4-10 7-10 11 0s7 10 11 0 7-10 11 0 7 10 11 0 4-5 6-5'
const ONDA = ONDA_TOPO + 'v20H3z'
const PLACA = <path {...LINHA} d="M3 45h50" strokeDasharray="2 2" />

const DESENHOS: Record<string, ReactNode> = {
  // peça em pé: o esmalte desce pela face e forma gotas perto do pé
  escorrimento: <>
    <rect {...MASSA} x="14" y="5" width="12" height="38" rx="1" />
    <path {...ESM} d="M26 5h4v20c0 5 1 9 0 12-1 3-3 3-3.5 0-.5-2 .5-4-.5-7V5z" />
    <path {...ESM} d="M30 18c2 2 2.5 7 1.5 10s-2.5 2-2.5-1" />
    <ellipse {...ESM} cx="28.5" cy="42" rx="2" ry="1.4" />
    {PLACA}
  </>,
  // peça em pé: faixa uniforme que termina antes do pé
  verticalEstavel: <>
    <rect {...MASSA} x="14" y="5" width="12" height="38" rx="1" />
    <path {...ESM} d="M26 5h3.5v31h-3.5z" />
    <path {...LINHA} d="M34 10v24M32 12l2-2 2 2M32 32l2 2 2-2" strokeDasharray="0" opacity="0.6" />
    {PLACA}
  </>,
  // corte com depressão: fino nas partes planas, espesso no fundo
  acumulo: <>
    <path {...MASSA} d="M3 22h17l8 13 8-13h17v20H3z" />
    <path {...ESM} d="M3 20.5h17l1 1.5H3zM36 20.5h17v1.5H35z" />
    <path {...ESM} fillOpacity={0.8} d="M20.5 22h15L28 34z" />
  </>,
  // corte de uma aresta: o esmalte afina no canto e deixa a massa aparecer
  afinaArestas: <>
    <path {...MASSA} d="M8 47V16h40v31z" />
    <path {...ESM} d="M12 14.5h36V16H12.5zM6.5 22V47H8V22z" />
    <path {...ESM} fillOpacity={0.3} d="M8.5 16h3.5l-.2.6H8.5zM6.6 19.5H8V22H6.6z" />
    <circle cx="8" cy="16" r="1.6" fill="none" stroke="var(--terracota)" strokeWidth="0.8" />
  </>,
  // relevo ondulado: o esmalte junta nos vales e fica fino nos picos
  realcaRelevo: <>
    <rect {...ESM} fillOpacity={0.8} x="3" y="33" width="50" height="10" />
    <path fill="var(--bg)" d={ONDA} /><path {...MASSA} d={ONDA} />
    <path d={ONDA_TOPO} fill="none" stroke="var(--azul)" strokeOpacity={0.45} strokeWidth={1.4} transform="translate(0 -0.9)" />
  </>,
  // relevo coberto: camada espessa nivela a superfície
  cobreRelevo: <>
    <rect {...ESM} x="3" y="18" width="50" height="25" />
    <path fill="var(--bg)" d={ONDA} /><path {...MASSA} d={ONDA} />
    <path {...LINHA} d="M3 18h50" />
  </>,
  // dois esmaltes em camadas, com a zona de mistura
  sobreposicao: <>
    <rect {...MASSA} x="3" y="32" width="50" height="13" />
    <path {...ESM} d="M3 27h32v5H3z" />
    <path {...ESM2} d="M20 23h33v9H35v-5H20z" />
    <path fill="var(--marrom)" fillOpacity={0.35} d="M20 27h15v5H20z" />
  </>,
  // esmalte translúcido sobre decoração: o desenho aparece
  transparencia: <>
    <rect {...MASSA} x="3" y="28" width="50" height="17" />
    <path fill="var(--terracota)" fillOpacity={0.75} d="M9 28h5v3H9zM21 28h5v3h-5zM33 28h5v3h-5zM45 28h5v3h-5z" />
    <rect fill="var(--azul)" fillOpacity={0.15} x="3" y="20" width="50" height="8" />
    <path {...LINHA} d="M3 20h50" opacity="0.6" />
  </>,
  // vista de cima: rede de fissuras finas no vidrado
  craquele: <>
    <rect fill="var(--azul)" fillOpacity={0.35} stroke="var(--marrom)" strokeWidth={0.8} x="5" y="5" width="46" height="40" rx="2" />
    <path {...LINHA} d="M5 18l10 3 6-9 9 4 9-6 12 3M15 21l-3 12-7 3M15 21l11 7 2 17M26 28l10-4 15 4M36 24l3-8M28 45l8-9 15 1" />
  </>,
  // vista de cima: cristais em roseta sobre o vidrado
  cristalizacao: <>
    <rect fill="var(--azul)" fillOpacity={0.45} stroke="var(--marrom)" strokeWidth={0.8} x="5" y="5" width="46" height="40" rx="2" />
    <g stroke="var(--marfim)" strokeWidth="0.9" strokeLinecap="round">
      <path d="M20 14v16M12 22h16M14.3 16.3l11.4 11.4M25.7 16.3 14.3 27.7" />
      <path d="M38 29v10M33 34h10M34.5 30.5l7 7M41.5 30.5l-7 7" />
      <path d="M40 11v5M37.5 13.5h5" />
    </g>
  </>,
  // vista de cima: o esmalte se retrai em ilhas e a massa aparece entre elas
  reticulacao: <>
    <rect {...MASSA} x="5" y="5" width="46" height="40" rx="2" />
    <path {...ESM} fillOpacity={0.7} d="M9 10c5-3 11-1 11 4s-4 7-8 6-6-7-3-10zM24 9c6-2 13 0 13 5s-5 6-9 6-7-3-6-7 1-3 2-4zM40 10c4-1 8 2 8 6s-3 6-6 5-5-4-4-7zM10 26c4-2 10 0 10 5s-3 9-7 9-7-3-6-8 1-5 3-6zM24 25c5-2 12 1 12 6s-4 9-8 9-7-4-6-9 0-4 2-6zM40 27c4-1 8 2 8 6s-2 8-5 8-6-3-6-7 1-6 3-7z" />
  </>,
  // corte: camada fina e interrompida deixa a massa à vista
  revelaMassa: <>
    <rect {...MASSA} x="3" y="26" width="50" height="19" />
    <g fill="var(--marrom)" fillOpacity={0.5}><circle cx="12" cy="34" r="0.8" /><circle cx="24" cy="38" r="0.7" /><circle cx="37" cy="33" r="0.8" /><circle cx="46" cy="40" r="0.7" /><circle cx="18" cy="41" r="0.6" /></g>
    <path {...ESM} d="M3 23h14v3H3zM24 24h9v2h-9zM40 23h13v3H40z" />
  </>,
}

export function Pictograma({ tipo, tamanho = 56 }: { tipo: string; tamanho?: number }) {
  const d = DESENHOS[tipo]
  if (!d) return null
  return <svg width={tamanho} height={tamanho * 50 / 56} viewBox="0 0 56 50" aria-hidden>{d}</svg>
}

/** Ilustrações dos efeitos identificados, com rótulo. */
export function Pictogramas({ tipos }: { tipos: string[] }) {
  if (!tipos.length) return null
  const rot = new Map(PICTOGRAMAS)
  return (
    <ul className="fx-pictos">
      {tipos.map((t) => <li key={t}><Pictograma tipo={t} /><span>{rot.get(t)}</span></li>)}
    </ul>
  )
}
