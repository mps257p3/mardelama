import type { ReactNode } from 'react'
import { PICTOGRAMAS } from '../../../lib/esmalteFicha'

/**
 * Pictogramas da Esmaltaria: corte esquemático de uma superfície cerâmica, traço fino, sem cor própria.
 * A massa é a linha de base; o esmalte é a faixa preenchida em tom claro. São esquemas, não resultados de teste.
 */
const ESMALTE = { fill: 'currentColor', fillOpacity: 0.22, stroke: 'none' } as const

const DESENHOS: Record<string, ReactNode> = {
  escorrimento: <>
    <path d="M12 5v30" />
    <path {...ESMALTE} d="M12 5h5v14c0 4-1 7-2.5 7S12 23 12 19z" />
    <path d="M17 5v14c0 4-1 7-2.5 7M17 12c0 3 1.5 6 3 6s1.5-3 1.5-6V5" />
    <circle cx="14.5" cy="31" r="1.3" fill="currentColor" stroke="none" />
  </>,
  verticalEstavel: <>
    <path d="M12 5v30" />
    <path {...ESMALTE} d="M12 7h4v24h-4z" />
    <path d="M16 7v24" />
    <path d="M23 13h8M23 19h8M23 25h8" strokeDasharray="1.5 2.5" />
  </>,
  acumulo: <>
    <path d="M4 15h11l5 10 5-10h11" />
    <path {...ESMALTE} d="M15 15h10l-5 10z" />
    <path d="M4 13h11M25 13h11M15.5 15.5h9" />
  </>,
  afinaArestas: <>
    <path d="M8 35V13h26" />
    <path {...ESMALTE} d="M8 35V13h26v4H12v18z" />
    <path d="M12 35V20M15 17h19" />
    <circle cx="8" cy="13" r="1.6" fill="var(--bg)" />
  </>,
  realcaRelevo: <>
    <path d="M4 22c3-7 5-7 8 0s5 7 8 0 5-7 8 0 5 7 8 0" />
    <ellipse {...ESMALTE} cx="12" cy="25" rx="2.6" ry="2" />
    <ellipse {...ESMALTE} cx="28" cy="25" rx="2.6" ry="2" />
    <path d="M9.6 25.4c1.6 1.2 3.2 1.2 4.8 0M25.6 25.4c1.6 1.2 3.2 1.2 4.8 0" />
  </>,
  cobreRelevo: <>
    <path d="M4 26c3-7 5-7 8 0s5 7 8 0 5-7 8 0 5 7 8 0" />
    <path {...ESMALTE} d="M4 15h32v11c-3 7-5 7-8 0s-5-7-8 0-5 7-8 0-5-7-8 0z" />
    <path d="M4 15h32" />
  </>,
  sobreposicao: <>
    <rect x="6" y="9" width="19" height="14" />
    <rect {...ESMALTE} x="15" y="17" width="19" height="14" />
    <rect x="15" y="17" width="19" height="14" />
    <rect x="15" y="17" width="10" height="6" fill="currentColor" fillOpacity="0.3" stroke="none" />
  </>,
  transparencia: <>
    <path d="M6 30h28" />
    <path d="M9 30l4-5M15 30l4-5M21 30l4-5M27 30l4-5" />
    <rect x="6" y="11" width="28" height="12" fill="currentColor" fillOpacity="0.06" />
  </>,
  craquele: <>
    <rect x="6" y="6" width="28" height="28" />
    <path d="M6 17l9 2 4-7 7 3 8-4M15 19l-2 9-7 2M15 19l9 5 2 10M24 24l10-3M19 12l-1-6" />
  </>,
  cristalizacao: <>
    <rect x="6" y="6" width="28" height="28" />
    <path d="M17 13v10M12 18h10M13.5 14.5l7 7M20.5 14.5l-7 7" />
    <path d="M27 25v5M24.5 27.5h5" />
    <circle cx="27" cy="12" r="0.9" fill="currentColor" stroke="none" />
  </>,
  reticulacao: <>
    <rect x="6" y="6" width="28" height="28" />
    <path {...ESMALTE} d="M9 10c3-2 7 0 7 3s-3 5-6 4-3-5-1-7zM21 9c4-1 9 1 9 5s-4 4-7 4-5-2-4-5 1-3 2-4zM10 22c3-1 7 1 7 4s-2 5-5 5-5-2-4-5 1-3 2-4zM22 22c4-1 8 1 8 4s-3 5-6 5-4-3-4-5 1-3 2-4z" />
  </>,
  revelaMassa: <>
    <path d="M4 27h32" />
    <path d="M7 27l3-3M13 27l3-3M19 27l3-3M25 27l3-3M31 27l3-3" />
    <path {...ESMALTE} d="M4 18h10v6H4zM22 18h14v6H22z" />
    <path d="M4 18h10M22 18h14" />
  </>,
}

export function Pictograma({ tipo, tamanho = 40 }: { tipo: string; tamanho?: number }) {
  const d = DESENHOS[tipo]
  if (!d) return null
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {d}
    </svg>
  )
}

/** Faixa de pictogramas com rótulo. Só os comportamentos identificados. */
export function Pictogramas({ tipos }: { tipos: string[] }) {
  if (!tipos.length) return null
  const rot = new Map(PICTOGRAMAS)
  return (
    <ul className="fx-pictos">
      {tipos.map((t) => <li key={t}><Pictograma tipo={t} /><span>{rot.get(t)}</span></li>)}
    </ul>
  )
}
