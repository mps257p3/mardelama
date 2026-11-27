import { useId, type ReactNode } from 'react'
import { PICTOGRAMAS } from '../../../lib/esmalteFicha'

/**
 * Ilustrações técnicas da Esmaltaria: uma pequena placa cerâmica em perspectiva, sempre no mesmo enquadramento.
 * Massa em argila (aparece na borda), esmalte em tons minerais dessaturados. São esquemas, não resultados de teste.
 */
const COR = {
  massa: '#CBAB8F', massaClara: '#E2D3BF', borda: '#8A6E58', traco: '#594334',
  esmalte: '#8E9FA1', esmalteEsc: '#5F7378', esmalte2: '#C0896B', claro: '#F2EDE4', escuro: '#3E3A36',
}
// topo e frente da placa: bordas levemente irregulares, como uma amostra cortada à mão
const TOPO = 'M8 16C18 13 37 11 51 10.5c1.5 0 2.2.6 2.6 1.6L58.5 28c.3 1.2-.4 1.8-1.6 1.9-13 .9-28 2.4-41.5 4.3-1.2.2-1.9-.3-2.2-1.3L7 17.6c-.3-.9.1-1.4 1-1.6z'
const FRENTE = 'M13.2 32.9c.3 1 1 1.5 2.2 1.3 13.5-1.9 28.5-3.4 41.5-4.3 1.2-.1 1.9-.7 1.6-1.9l.2 5.6c.2 1.1-.4 1.7-1.6 1.8-13 1-28 2.5-41.5 4.4-1.2.2-1.9-.3-2.1-1.3z'

type Arte = (id: string) => ReactNode

/** Base comum: frente da placa em argila, topo em massa clara; `topo` desenha o esmalte recortado pelo topo. */
function Placa({ id, topo, frente, fora }: { id: string; topo?: ReactNode; frente?: ReactNode; fora?: ReactNode }) {
  return <>
    <defs>
      <clipPath id={id + 't'}><path d={TOPO} /></clipPath>
      <clipPath id={id + 'f'}><path d={FRENTE} /></clipPath>
    </defs>
    <ellipse cx="34" cy="42.5" rx="24" ry="2.2" fill={COR.traco} opacity="0.08" />
    <path d={FRENTE} fill={COR.massa} />
    <g clipPath={`url(#${id}f)`}>{frente}</g>
    <path d={TOPO} fill={COR.massaClara} />
    <g clipPath={`url(#${id}t)`}>{topo}</g>
    {fora}
    <path d={TOPO} fill="none" stroke={COR.borda} strokeWidth="0.6" strokeLinejoin="round" />
    <path d={FRENTE} fill="none" stroke={COR.borda} strokeWidth="0.6" strokeLinejoin="round" />
  </>
}
const cobertura = (cor = COR.esmalte, op = 0.9) => <path d={TOPO} fill={cor} opacity={op} />

const ARTES: Record<string, Arte> = {
  escorrimento: (id) => <Placa id={id} topo={cobertura()}
    frente={<g fill={COR.esmalte} opacity="0.95"><path d="M10 28h50v3.6H10z" />
      {[[19, 38.5], [27, 37], [35.5, 39], [44, 36.5], [51.5, 38]].map(([x, y], i) => <path key={i} d={`M${x - 1.6} 30v${y - 32}a1.6 1.6 0 0 0 3.2 0V30z`} />)}</g>}
    fora={<g fill={COR.esmalte} opacity="0.95"><ellipse cx="27" cy="41.6" rx="1.5" ry="1.1" /><ellipse cx="44" cy="40.8" rx="1.2" ry="0.9" /></g>} />,
  verticalEstavel: (id) => <Placa id={id} topo={cobertura()} frente={<path fill={COR.esmalte} opacity="0.9" d="M12 31h48v2.2H12z" />} />,
  acumulo: (id) => <Placa id={id} topo={<>{cobertura(COR.esmalte, 0.55)}
    <path d="M14 24c9-2 22-4 38-5" stroke={COR.esmalteEsc} strokeWidth="3.2" strokeLinecap="round" fill="none" />
    <path d="M14 24c9-2 22-4 38-5" stroke={COR.traco} strokeWidth="0.5" strokeLinecap="round" fill="none" opacity="0.5" /></>} />,
  afinaArestas: (id) => <Placa id={id} topo={<>{cobertura()}<path d={TOPO} fill="none" stroke={COR.massaClara} strokeWidth="2.4" opacity="0.9" /></>}
    frente={<path fill={COR.esmalte} opacity="0.5" d="M12 31h48v.8H12z" />} />,
  realcaRelevo: (id) => <Placa id={id} topo={<>{cobertura(COR.esmalteEsc, 0.85)}
    <g fill="none" strokeLinecap="round"><path d="M13 20c9-2 22-4 39-6M14.5 25c9-2 22-4 39-6M16 30c9-2 22-4 39-6" stroke={COR.claro} strokeWidth="1.6" opacity="0.8" /></g></>} />,
  cobreRelevo: (id) => <Placa id={id} topo={<>{cobertura()}
    <g fill="none" strokeLinecap="round" stroke={COR.esmalteEsc} strokeWidth="0.8" opacity="0.25"><path d="M13 20c9-2 22-4 39-6M14.5 25c9-2 22-4 39-6M16 30c9-2 22-4 39-6" /></g></>} />,
  sobreposicao: (id) => <Placa id={id} topo={<>
    <path d="M0 0h40l-6 40H0z" fill={COR.esmalte} opacity="0.85" />
    <path d="M26 0h40v40H20z" fill={COR.esmalte2} opacity="0.75" />
    <path d="M26 0h14l-6 40H20z" fill={COR.escuro} opacity="0.28" /></>} />,
  transparencia: (id) => <Placa id={id} topo={<>
    <g stroke={COR.esmalte2} strokeWidth="2.2" strokeLinecap="round" opacity="0.85"><path d="M18 16l4 14M27 14l4 15M36 13l4 15M45 12l4 15" /></g>
    {cobertura(COR.esmalte, 0.28)}<path d="M10 17c12-3 30-5 42-5.5" stroke={COR.claro} strokeWidth="1.2" opacity="0.7" fill="none" /></>} />,
  craquele: (id) => <Placa id={id} topo={<>{cobertura(COR.claro, 1)}
    <path fill="none" stroke={COR.traco} strokeWidth="0.45" opacity="0.65" d="M8 21l8 1 5-6 7 3 6-6 9 2 8-4M16 22l-1 9M21 16l6 9 9-2 4-8M27 25l-2 8M36 23l9 2 6-7M45 25l2 6M40 15l3-4" /></>} />,
  cristalizacao: (id) => <Placa id={id} topo={<>{cobertura(COR.esmalteEsc, 0.85)}
    <g stroke={COR.claro} strokeWidth="0.6" strokeLinecap="round" opacity="0.9">
      <path d="M24 16v9M19.5 20.5h9M20.8 17.3l6.4 6.4M27.2 17.3l-6.4 6.4" />
      <path d="M42 20v6M39 23h6M39.9 20.9l4.2 4.2M44.1 20.9l-4.2 4.2" />
      <path d="M34 13.5v3M32.5 15h3" /><path d="M48 14v3M46.5 15.5h3" />
    </g></>} />,
  reticulacao: (id) => <Placa id={id} topo={<path fill={COR.esmalte} opacity="0.9"
    d="M9 17c4-2 9-1 9 2s-3 4-6 4-4-4-3-6zM20 15c5-2 11-1 11 2s-4 5-8 4-4-4-3-6zM34 13c5-1 10 0 10 3s-4 4-7 4-5-5-3-7zM46 11.5c4 0 6 1 6 3s-2 4-5 3-3-5-1-6zM12 25c4-2 9 0 9 3s-3 5-6 4-5-5-3-7zM24 23c4-2 10-1 10 2s-3 5-7 5-5-5-3-7zM37 21c4-1 9 0 9 3s-3 4-6 4-5-6-3-7zM48 19c3 0 6 1 6 4s-3 4-5 3-3-6-1-7zM18 31c3-1 8-1 8 1s-4 2-7 2-2-2-1-3zM31 29c4-1 8 0 8 2s-3 2-6 2-4-3-2-4z" />} />,
  revelaMassa: (id) => <Placa id={id} topo={<>{cobertura(COR.esmalte, 0.45)}
    <g fill={COR.massa} opacity="0.75"><circle cx="20" cy="22" r="2.6" /><circle cx="33" cy="19" r="3.2" /><circle cx="44" cy="23" r="2.2" /><circle cx="27" cy="28" r="2" /></g></>} />,
  crawling: (id) => <Placa id={id} topo={<path fill={COR.claro} stroke={COR.borda} strokeWidth="0.4"
    d="M8 16c8-2 16-3 22-3 2 3 0 6-3 7s-4 4-8 4-6 2-9 3zM33 12c8-1 14-1.5 18-1.5l3 9c-4 1-7 0-9-2s-6-1-9-2-4-2-3-3.5zM20 31c3-3 8-4 13-4s8-2 12-2 8-1 12 0l1 3c-12 1-27 2.5-37 4z" />} />,
  reatividade: (id) => <Placa id={id} topo={<>
    {cobertura(COR.esmalte, 0.9)}
    <path fill={COR.esmalte2} opacity="0.75" d="M30 0c-2 6 3 9 1 14s-6 6-4 11 6 6 5 15h40V0z" />
    <g fill="none" stroke={COR.claro} strokeWidth="0.7" opacity="0.8" strokeLinecap="round"><path d="M29 12c3 1 5 3 9 2M26 22c3 0 6 2 10 1M30 30c4-1 7 0 10-1" /></g></>} />,
  variacaoEspessura: (id) => <Placa id={id} topo={<>
    <defs><linearGradient id={id + 'g'} x1="0" x2="1" y1="0" y2="0"><stop offset="0" stopColor={COR.esmalte} stopOpacity="0.3" /><stop offset="1" stopColor={COR.esmalteEsc} stopOpacity="1" /></linearGradient></defs>
    <path d={TOPO} fill={`url(#${id}g)`} /></>} />,
  separacaoFases: (id) => <Placa id={id} topo={<>{cobertura(COR.esmalteEsc, 0.8)}
    <g fill="none" stroke={COR.claro} strokeLinecap="round" opacity="0.75"><path d="M11 20c5-3 9 2 14-1s8-4 13-2 9-2 14-4" strokeWidth="1.4" /><path d="M13 27c6-2 10 1 15-1s9-3 14-2 7-2 11-3" strokeWidth="1" /><path d="M20 23c3 1 5 0 7-1M38 20c3 1 5 0 8-1" strokeWidth="0.6" /></g></>} />,
  manchas: (id) => <Placa id={id} topo={<>{cobertura(COR.claro, 1)}
    <g fill={COR.traco} opacity="0.7"><circle cx="16" cy="20" r="0.9" /><circle cx="22" cy="25" r="0.6" /><circle cx="27" cy="18" r="1.2" /><circle cx="33" cy="24" r="0.7" /><circle cx="38" cy="16" r="0.8" /><circle cx="43" cy="22" r="1.1" /><circle cx="48" cy="15" r="0.6" /><circle cx="29" cy="29" r="0.8" /><circle cx="50" cy="24" r="0.7" /><circle cx="19" cy="29" r="0.5" /></g>
    <g fill={COR.esmalte2} opacity="0.45"><ellipse cx="25" cy="22" rx="3" ry="1.6" /><ellipse cx="44" cy="18" rx="2.4" ry="1.3" /></g></>} />,
  metalico: (id) => <Placa id={id} topo={<>
    <defs><linearGradient id={id + 'm'} x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor={COR.escuro} /><stop offset="0.45" stopColor="#7C6F62" /><stop offset="0.55" stopColor="#B4A896" /><stop offset="0.7" stopColor={COR.escuro} /></linearGradient></defs>
    <path d={TOPO} fill={`url(#${id}m)`} /></>} />,
  textura: (id) => <Placa id={id} topo={<>{cobertura(COR.esmalte, 0.8)}
    <g fill={COR.esmalteEsc} opacity="0.55">{[[14, 20], [20, 24], [26, 18], [31, 26], [36, 20], [41, 25], [46, 16], [50, 22], [22, 30], [37, 29], [17, 17], [30, 15]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={0.9 + (i % 3) * 0.35} />)}</g>
    <g fill={COR.claro} opacity="0.6">{[[15, 19.4], [27, 17.3], [36.4, 19.4], [46.4, 15.4], [31.4, 25.4]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="0.45" />)}</g></>} />,
}

export function Pictograma({ tipo, tamanho = 72 }: { tipo: string; tamanho?: number }) {
  const id = 'px' + useId().replace(/[^a-zA-Z0-9]/g, '')
  const arte = ARTES[tipo]
  if (!arte) return null
  return <svg width={tamanho} height={tamanho * 48 / 66} viewBox="0 0 66 48" aria-hidden>{arte(id)}</svg>
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
