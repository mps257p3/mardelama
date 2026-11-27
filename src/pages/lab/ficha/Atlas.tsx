import { useId, type ReactNode } from 'react'

/**
 * Atlas de superfícies cerâmicas: uma ilustração por fenômeno, cada uma com composição própria
 * (parede vertical, corte, vista de cima, detalhe ampliado). SVG com gradientes, máscaras e grão mineral sutil.
 * As cores explicam o fenômeno; não são as cores do esmalte cadastrado. Geometria determinística (mesma semente, mesmo desenho).
 */

const C = {
  terracota: '#B46E4B', massa: '#C9957A', massaClara: '#DDBDA2', areia: '#E7DCCD', marfim: '#F5F0E8',
  azul: '#3D5965', azulMedio: '#5F7C89', azulClaro: '#9DB1B8', verde: '#8E9C8A', verdeClaro: '#B9C2B0',
  grafite: '#3A3836', ocre: '#B8873A', bronze: '#9C7A55',
}

type Pt = [number, number]

function rng(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const f = (n: number) => Math.round(n * 100) / 100

/** Curva suave (Catmull-Rom) passando pelos pontos. */
function suave(p: Pt[], fechado = true): string {
  const n = p.length
  const at = (i: number) => (fechado ? p[(i + n) % n] : p[Math.max(0, Math.min(n - 1, i))])
  let d = `M${f(p[0][0])},${f(p[0][1])}`
  for (let i = 0; i < (fechado ? n : n - 1); i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)]
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`
  }
  return fechado ? d + 'Z' : d
}

/** Contorno orgânico em torno de um centro. */
function blob(cx: number, cy: number, rx: number, ry: number, n: number, j: number, r: () => number, giro = 0): Pt[] {
  return Array.from({ length: n }, (_, i) => {
    const a = giro + (i / n) * Math.PI * 2
    const k = 1 + (r() - 0.5) * 2 * j
    return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k] as Pt
  })
}

/** Fragmento cerâmico: retângulo de bordas irregulares, cantos suaves. */
function caco(x0: number, y0: number, x1: number, y1: number, j: number, r: () => number): Pt[] {
  const pts: Pt[] = []
  const lado = (ax: number, ay: number, bx: number, by: number, n: number) => {
    for (let i = 0; i < n; i++) {
      const t = i / n
      const nx = -(by - ay), ny = bx - ax, L = Math.hypot(nx, ny)
      const d = (r() - 0.5) * 2 * j
      pts.push([ax + (bx - ax) * t + (nx / L) * d, ay + (by - ay) * t + (ny / L) * d])
    }
  }
  lado(x0, y0, x1, y0, 6); lado(x1, y0, x1, y1, 4); lado(x1, y1, x0, y1, 6); lado(x0, y1, x0, y0, 4)
  return pts
}

/** Disco (prova redonda) com borda levemente irregular. */
const disco = (cx: number, cy: number, rx: number, ry: number, r: () => number) => suave(blob(cx, cy, rx, ry, 16, 0.025, r))
/** Círculo exato, para as lentes de aumento. */
const circulo = (cx: number, cy: number, R: number) => `M${cx - R},${cy}a${R},${R} 0 1,0 ${2 * R},0a${R},${R} 0 1,0 ${-2 * R},0Z`
/** Fragmento quebrado: arestas retas de fratura. */
const fratura = (p: Pt[]) => 'M' + p.map(([x, y]) => `${f(x)},${f(y)}`).join('L') + 'Z'
/** Anel fino de lente de aumento, como nos atlas. */
const Lente = ({ cx, cy, R }: { cx: number; cy: number; R: number }) => (
  <g fill="none" stroke={C.grafite} strokeOpacity="0.4">
    <circle cx={cx} cy={cy} r={R + 2.4} strokeWidth="0.4" />
    <circle cx={cx} cy={cy} r={R} strokeWidth="0.3" strokeOpacity="0.25" />
  </g>
)

/** Filtros e gradientes comuns, com prefixo único por ilustração. */
function Base({ u, children }: { u: string; children?: ReactNode }) {
  return (
    <defs>
      <filter id={u + 'grao'} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="1.35" numOctaves="2" seed="7" />
        <feColorMatrix values="0 0 0 0 0.24  0 0 0 0 0.2  0 0 0 0 0.17  1.9 0 0 0 -0.98" />
      </filter>
      <filter id={u + 'mineral'} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.09 0.12" numOctaves="3" seed="3" />
        <feColorMatrix values="0 0 0 0 0.96  0 0 0 0 0.94  0 0 0 0 0.9  0 1.4 0 0 -0.62" />
      </filter>
      <clipPath id={u + 'sec'}><path d="M9,0 L151,0 L149,40 L154,70 L150,96 L153,115 L112,112 L72,116 L32,113 L7,115 L10,90 L5,62 L9,32 Z" /></clipPath>
      <filter id={u + 'des'}><feGaussianBlur stdDeviation="0.7" /></filter>
      <filter id={u + 'des2'}><feGaussianBlur stdDeviation="2.2" /></filter>
      <pattern id={u + 'hach'} width="2.4" height="2.4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="2.4" stroke={C.grafite} strokeWidth="0.35" strokeOpacity="0.45" />
      </pattern>
      {children}
    </defs>
  )
}
/** Grão mineral recortado por um caminho. */
const hash = (s: string) => { let h = 5381; for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i); return (h >>> 0).toString(36) }
const Grao = ({ u, d, o = 0.5 }: { u: string; d: string; o?: number }) => {
  const id = u + 'cg' + hash(d)
  return <>
    <defs><clipPath id={id}><path d={d} /></clipPath></defs>
    <g clipPath={`url(#${id})`}><rect width="160" height="120" filter={`url(#${u}grao)`} opacity={o} /></g>
  </>
}
/** Véu mineral (variação suave de tom) recortado por um caminho. */
const Veu = ({ u, d, o = 0.35 }: { u: string; d: string; o?: number }) => {
  const id = u + 'cv' + hash(d)
  return <>
    <defs><clipPath id={id}><path d={d} /></clipPath></defs>
    <g clipPath={`url(#${id})`}><rect width="160" height="120" filter={`url(#${u}mineral)`} opacity={o} /></g>
  </>
}
const Gravidade = ({ x = 150, y0 = 22, y1 = 98 }: { x?: number; y0?: number; y1?: number }) => (
  <g stroke={C.grafite} strokeOpacity="0.45" strokeWidth="0.5" fill="none" strokeLinecap="round">
    <line x1={x} y1={y0} x2={x} y2={y1} />
    <path d={`M${x - 2.2},${y1 - 3.6} L${x},${y1} L${x + 2.2},${y1 - 3.6}`} />
    <circle cx={x} cy={y0 - 2} r="1" fill={C.grafite} fillOpacity="0.45" stroke="none" />
  </g>
)

/** Prova em L, como a usada para testar escorrimento: parede vertical e base. */
function ProvaL({ u, r }: { u: string; r: () => number }) {
  const pe = suave(caco(30, 98, 130, 114, 1, r))
  return <>
    <path d={pe} fill={C.massa} />
    <Grao u={u} d={pe} o={0.6} />
    <path d={pe} fill="none" stroke={C.terracota} strokeOpacity="0.4" strokeWidth="0.5" />
  </>
}

/* ——— 1. Escorrimento: parede vertical, fluxos descendentes de comprimentos e espessuras diferentes ——— */
function Escorrimento({ u }: { u: string }) {
  const r = rng(11)
  const parede = suave(caco(44, 4, 116, 100, 1.4, r))
  const xs = [50, 59, 67, 76, 86, 95, 103, 111]
  const comp = [26, 56, 30, 66, 40, 59, 24, 44]
  const larg = [3.4, 5.4, 3, 6.6, 4.2, 5.8, 3, 4.6]
  const base = 30
  const topo: Pt[] = [[40, 0], [120, 0], [120, base - 2]]
  for (let i = xs.length - 1; i >= 0; i--) {
    const x = xs[i], w = larg[i], y = base + comp[i]
    topo.push([x + w + 2, base + (r() - 0.5) * 3])
    topo.push([x + w * 0.5, base + comp[i] * 0.45])
    topo.push([x + w * 0.62, y - w * 0.6])
    topo.push([x, y + w * 0.55])
    topo.push([x - w * 0.62, y - w * 0.6])
    topo.push([x - w * 0.5, base + comp[i] * 0.45])
  }
  topo.push([40, base + 1])
  const esm = suave(topo)
  return (
    <>
      <Base u={u}>
        <linearGradient id={u + 'e'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.azulClaro} stopOpacity="0.8" />
          <stop offset="0.3" stopColor={C.azulMedio} stopOpacity="0.9" />
          <stop offset="1" stopColor={C.azul} />
        </linearGradient>
        <clipPath id={u + 'p'}><path d={parede} /></clipPath>
      </Base>
      <ProvaL u={u} r={r} />
      <ellipse cx="76" cy="103" rx="9" ry="2.6" fill={C.azul} opacity="0.75" />
      <ellipse cx="95" cy="103.4" rx="5" ry="1.8" fill={C.azul} opacity="0.6" />
      <path d={parede} fill={C.massaClara} />
      <Grao u={u} d={parede} o={0.55} />
      <g clipPath={`url(#${u}p)`}>
        <path d={esm} fill={`url(#${u}e)`} />
        <Veu u={u} d={esm} o={0.22} />
        {xs.map((x, i) => <ellipse key={i} cx={x} cy={base + comp[i] - larg[i] * 0.05} rx={larg[i] * 0.62} ry={larg[i] * 0.72} fill={C.azul} opacity="0.55" />)}
        {xs.map((x, i) => <path key={'l' + i} d={`M${x - larg[i] * 0.15},${base - 6} Q${x - larg[i] * 0.25},${base + comp[i] * 0.5} ${x - larg[i] * 0.2},${base + comp[i] - larg[i] * 0.5}`} stroke={C.marfim} strokeOpacity="0.45" strokeWidth="0.45" fill="none" />)}
        <path d="M40,9 C60,7 90,12 120,8" stroke={C.marfim} strokeOpacity="0.35" strokeWidth="0.6" fill="none" />
      </g>
      <path d={parede} fill="none" stroke={C.terracota} strokeOpacity="0.35" strokeWidth="0.5" />
      <Gravidade x={140} y0={14} y1={86} />
    </>
  )
}

function Sobreposicao({ u }: { u: string }) {
  const r = rng(23)
  const placa = disco(80, 60, 66, 52, r)
  const a = suave(blob(64, 56, 38, 30, 11, 0.12, r, 0.3))
  const b = suave(blob(97, 64, 36, 30, 11, 0.12, r, 1.1))
  return (
    <>
      <Base u={u}><clipPath id={u + 'a'}><path d={a} /></clipPath></Base>
      <path d={placa} fill={C.massaClara} />
      <Grao u={u} d={placa} o={0.5} />
      <path d={a} fill={C.azulMedio} opacity="0.9" />
      <Veu u={u} d={a} o={0.25} />
      <path d={b} fill={C.verdeClaro} opacity="0.82" />
      <Veu u={u} d={b} o={0.2} />
      <g clipPath={`url(#${u}a)`}>
        <path d={b} fill={C.verde} opacity="0.35" />
        <path d={b} fill={`url(#${u}hach)`} />
      </g>
      <path d={a} fill="none" stroke={C.azul} strokeWidth="0.5" strokeOpacity="0.7" />
      <path d={b} fill="none" stroke={C.grafite} strokeWidth="0.45" strokeOpacity="0.55" />
      <path d={b} fill="none" stroke={C.marfim} strokeWidth="0.5" strokeOpacity="0.55" transform="translate(-0.7,-0.6)" />
    </>
  )
}

/* ——— 3. Reatividade: no contato, os esmaltes se transformam — halos, células e transições difusas ——— */
function Reatividade({ u }: { u: string }) {
  const r = rng(37)
  const placa = suave(blob(80, 60, 74, 52, 18, 0.07, r))
  const lim: Pt[] = [[80, 0], [74, 24], [86, 46], [76, 70], [88, 94], [80, 120]]
  const esq = suave([[0, 0], ...lim, [0, 120]])
  const halos = Array.from({ length: 11 }, (_, i) => {
    const y = 12 + i * 9.5 + (r() - 0.5) * 8
    const x = 81 + Math.sin(i * 1.3) * 5 + (r() - 0.5) * 22
    return { x, y, rr: 1.2 + r() * r() * 6 }
  })
  return (
    <>
      <Base u={u}>
        <clipPath id={u + 'p'}><path d={placa} /></clipPath>
        <radialGradient id={u + 'h'}>
          <stop offset="0" stopColor={C.marfim} stopOpacity="0.95" />
          <stop offset="0.45" stopColor={C.ocre} stopOpacity="0.55" />
          <stop offset="0.75" stopColor={C.azulMedio} stopOpacity="0.4" />
          <stop offset="1" stopColor={C.azul} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={u + 'z'} x1="0" x2="1">
          <stop offset="0" stopColor={C.azul} stopOpacity="0" />
          <stop offset="0.5" stopColor={C.ocre} stopOpacity="0.55" />
          <stop offset="1" stopColor={C.terracota} stopOpacity="0" />
        </linearGradient>
      </Base>
      <path d={placa} fill={C.massaClara} />
      <g clipPath={`url(#${u}p)`}>
        <rect width="160" height="120" fill={C.terracota} opacity="0.85" />
        <path d={esq} fill={C.azul} opacity="0.92" />
        <Veu u={u} d={placa} o={0.3} />
        <rect x="58" y="0" width="48" height="120" fill={`url(#${u}z)`} filter={`url(#${u}des2)`} />
        {halos.map((h, i) => <g key={i}>
          <circle cx={h.x} cy={h.y} r={h.rr * 1.9} fill={`url(#${u}h)`} />
          <circle cx={h.x} cy={h.y} r={h.rr * 1.25} fill="none" stroke={C.marfim} strokeOpacity="0.5" strokeWidth="0.45" />
          <circle cx={h.x} cy={h.y} r={h.rr * 0.45} fill={C.grafite} opacity="0.35" />
        </g>)}
        {Array.from({ length: 14 }, (_, i) => {
          const y = 4 + i * 8.4
          return <path key={i} d={`M${66 + r() * 6},${y} q${8 + r() * 6},${(r() - 0.5) * 6} ${16 + r() * 8},${(r() - 0.5) * 3}`} stroke={i % 2 ? C.marfim : C.ocre} strokeOpacity="0.4" strokeWidth="0.45" fill="none" />
        })}
        <Grao u={u} d={placa} o={0.35} />
      </g>
      <path d={placa} fill="none" stroke={C.terracota} strokeOpacity="0.35" strokeWidth="0.5" />
    </>
  )
}

/* ——— 4. Cristalização: rosetas radiais e ramificadas sobre a superfície vítrea ——— */
function Cristalizacao({ u }: { u: string }) {
  const r = rng(41)
  const placa = disco(80, 60, 72, 54, r)
  const rosetas = [[48, 44, 30], [112, 70, 36], [70, 98, 18], [132, 22, 14], [26, 92, 11]]
  return (
    <>
      <Base u={u}>
        <clipPath id={u + 'p'}><path d={placa} /></clipPath>
        <radialGradient id={u + 'f'} cx="0.4" cy="0.35" r="0.8">
          <stop offset="0" stopColor={C.azulMedio} />
          <stop offset="1" stopColor={C.azul} />
        </radialGradient>
        <radialGradient id={u + 'c'}>
          <stop offset="0" stopColor={C.marfim} stopOpacity="0.55" />
          <stop offset="0.7" stopColor={C.azulClaro} stopOpacity="0.22" />
          <stop offset="1" stopColor={C.azulClaro} stopOpacity="0" />
        </radialGradient>
      </Base>
      <path d={placa} fill={`url(#${u}f)`} />
      <g clipPath={`url(#${u}p)`}>
        <Veu u={u} d={placa} o={0.25} />
        {rosetas.map(([cx, cy, R], k) => {
          const n = Math.round(18 + R * 0.6)
          return <g key={k}>
            <circle cx={cx} cy={cy} r={R} fill={`url(#${u}c)`} />
            <g stroke={C.marfim} strokeLinecap="round" fill="none">
              {Array.from({ length: n }, (_, i) => {
                const a = (i / n) * Math.PI * 2 + (r() - 0.5) * 0.12
                const L = R * (0.72 + r() * 0.3)
                const ex = cx + Math.cos(a) * L, ey = cy + Math.sin(a) * L
                const ramos = [0.42, 0.68].map((t, j) => {
                  const bx = cx + Math.cos(a) * L * t, by = cy + Math.sin(a) * L * t
                  const s = j % 2 ? 1 : -1, b = a + s * (0.42 + r() * 0.2), l = R * (0.12 + r() * 0.1)
                  return `M${f(bx)},${f(by)}L${f(bx + Math.cos(b) * l)},${f(by + Math.sin(b) * l)}`
                }).join('')
                return <g key={i}>
                  <path d={`M${f(cx)},${f(cy)}L${f(ex)},${f(ey)}`} strokeWidth={0.5} strokeOpacity={0.75} />
                  {R > 16 && <path d={ramos} strokeWidth={0.32} strokeOpacity={0.55} />}
                </g>
              })}
            </g>
            <circle cx={cx} cy={cy} r={0.9 + R * 0.03} fill={C.marfim} opacity="0.9" />
          </g>
        })}
        {Array.from({ length: 22 }, (_, i) => <circle key={i} cx={10 + r() * 140} cy={10 + r() * 100} r={0.35 + r() * 0.5} fill={C.marfim} opacity={0.4 + r() * 0.4} />)}
        <Grao u={u} d={placa} o={0.25} />
      </g>
      <path d={placa} fill="none" stroke={C.azul} strokeOpacity="0.5" strokeWidth="0.5" />
      <path d={disco(80, 60, 66, 49, rng(2))} fill="none" stroke={C.marfim} strokeOpacity="0.35" strokeWidth="0.45" />
    </>
  )
}

/* ——— 5. Craquelamento: rede delicada e irregular de fissuras na superfície ——— */
function Craquele({ u }: { u: string }) {
  const r = rng(53)
  const R = 50, cx = 80, cy = 60
  const lente = circulo(cx, cy, R)
  const nx = 13, ny = 11
  const P: Pt[][] = Array.from({ length: ny }, (_, j) => Array.from({ length: nx }, (_, i) => [cx - 60 + i * 10 + (r() - 0.5) * 8, cy - 50 + j * 10 + (r() - 0.5) * 8] as Pt))
  const seg = (a: Pt, b: Pt) => {
    const k1x = a[0] + (b[0] - a[0]) * 0.33 + (r() - 0.5) * 2.6, k1y = a[1] + (b[1] - a[1]) * 0.33 + (r() - 0.5) * 2.6
    const k2x = a[0] + (b[0] - a[0]) * 0.66 + (r() - 0.5) * 2.6, k2y = a[1] + (b[1] - a[1]) * 0.66 + (r() - 0.5) * 2.6
    return `M${f(a[0])},${f(a[1])}L${f(k1x)},${f(k1y)}L${f(k2x)},${f(k2y)}L${f(b[0])},${f(b[1])}`
  }
  let fortes = '', finas = ''
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    if (i < nx - 1) { if (r() < 0.7) fortes += seg(P[j][i], P[j][i + 1]); else if (r() < 0.5) finas += seg(P[j][i], P[j][i + 1]) }
    if (j < ny - 1) { if (r() < 0.7) fortes += seg(P[j][i], P[j + 1][i]); else if (r() < 0.5) finas += seg(P[j][i], P[j + 1][i]) }
  }
  return (
    <>
      <Base u={u}>
        <clipPath id={u + 'p'}><path d={lente} /></clipPath>
        <radialGradient id={u + 'g'} cx="0.38" cy="0.32" r="0.8">
          <stop offset="0" stopColor={C.marfim} />
          <stop offset="1" stopColor={C.areia} />
        </radialGradient>
      </Base>
      <path d={lente} fill={`url(#${u}g)`} />
      <g clipPath={`url(#${u}p)`}>
        <Veu u={u} d={lente} o={0.35} />
        <path d={fortes} stroke={C.ocre} strokeWidth="1.2" strokeOpacity="0.18" fill="none" />
        <path d={fortes} stroke={C.grafite} strokeWidth="0.38" strokeOpacity="0.7" fill="none" strokeLinejoin="round" />
        <path d={finas} stroke={C.grafite} strokeWidth="0.25" strokeOpacity="0.32" fill="none" />
        <Grao u={u} d={lente} o={0.2} />
      </g>
      <Lente cx={cx} cy={cy} R={R} />
    </>
  )
}

function Crawling({ u }: { u: string }) {
  const r = rng(61)
  const placa = suave(blob(80, 60, 74, 54, 14, 0.06, r))
  const ilhas: [number, number, number, number][] = [[38, 34, 24, 19], [92, 26, 22, 15], [134, 44, 14, 20], [58, 80, 26, 20], [110, 86, 22, 18], [20, 86, 9, 12], [80, 52, 7, 5], [140, 98, 8, 7]]
  return (
    <>
      <Base u={u}>
        <radialGradient id={u + 'i'} cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stopColor={C.marfim} />
          <stop offset="0.8" stopColor={C.areia} />
          <stop offset="1" stopColor={C.verdeClaro} />
        </radialGradient>
      </Base>
      <path d={placa} fill={C.massa} />
      <Veu u={u} d={placa} o={0.18} />
      <Grao u={u} d={placa} o={0.7} />
      {ilhas.map(([cx, cy, rx, ry], i) => {
        const d = suave(blob(cx, cy, rx, ry, 10, 0.2, r, r() * 3))
        return <g key={i}>
          <path d={d} fill="none" stroke={C.grafite} strokeOpacity="0.18" strokeWidth="1.6" transform="translate(0.5,0.8)" />
          <path d={d} fill={`url(#${u}i)`} />
          <path d={d} fill="none" stroke={C.areia} strokeWidth="1.3" />
          <path d={d} fill="none" stroke={C.marfim} strokeOpacity="0.9" strokeWidth="0.45" transform="translate(-0.4,-0.5)" />
        </g>
      })}
      {Array.from({ length: 16 }, (_, i) => <circle key={i} cx={12 + r() * 136} cy={12 + r() * 96} r={0.5 + r() * 0.9} fill={C.marfim} opacity="0.85" />)}
      <path d={placa} fill="none" stroke={C.terracota} strokeOpacity="0.4" strokeWidth="0.5" />
    </>
  )
}

/** Perfil de relevo para os cortes. */
const perfil = (y: number, amp: number, r: () => number): Pt[] => Array.from({ length: 13 }, (_, i) => [i * 13.3 - 0, y + Math.sin(i * 1.15) * amp + (r() - 0.5) * amp * 0.4] as Pt)
/** Corte técnico: massa hachurada, esmalte por cima. */
function Corte({ u, massa, esmalte }: { u: string; massa: string; esmalte: string }) {
  return <g clipPath={`url(#${u}sec)`}>
    <path d={massa} fill={C.massaClara} />
    <path d={massa} fill={`url(#${u}hach)`} />
    <path d={esmalte} fill={`url(#${u}es)`} />
    <path d={esmalte} fill="none" stroke={C.azul} strokeWidth="0.4" strokeOpacity="0.6" />
  </g>
}
const gradEsmalte = (u: string) => (
  <linearGradient id={u + 'es'} x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stopColor={C.azulMedio} stopOpacity="0.85" />
    <stop offset="1" stopColor={C.azul} />
  </linearGradient>
)
const Guia = ({ x, y0, y1 }: { x: number; y0: number; y1: number }) => <line x1={x} y1={y0} x2={x} y2={y1} stroke={C.grafite} strokeOpacity="0.35" strokeWidth="0.35" strokeDasharray="1 1.6" />

/* ——— 7. Acúmulo em relevos: vista de cima e corte alinhados; mais esmalte nas depressões ——— */
function Acumulo({ u }: { u: string }) {
  const r = rng(71)
  const sup = perfil(84, 7, r)
  const massa = suave([...sup, [168, 120], [-8, 120]].map(([x, y]) => [x, y] as Pt), true)
  const topoEsm = sup.map(([x, y]) => [x, 78 + (y - 84) * 0.25] as Pt)
  const esm = suave([...topoEsm, ...[...sup].reverse()], true)
  const vales = sup.filter((_, i) => Math.sin(i * 1.15) > 0.5).map(([x]) => x)
  const faixa = suave(caco(6, 10, 154, 52, 2, r))
  return (
    <>
      <Base u={u}>
        {gradEsmalte(u)}
        <linearGradient id={u + 't'} x1="0" x2="1">
          {sup.map(([x, y], i) => <stop key={i} offset={Math.max(0, Math.min(1, x / 160))} stopColor={y > 86 ? C.azul : y > 82 ? C.azulMedio : C.azulClaro} />)}
        </linearGradient>
        <clipPath id={u + 'f'}><path d={faixa} /></clipPath>
      </Base>
      <path d={faixa} fill={`url(#${u}t)`} />
      <g clipPath={`url(#${u}f)`}>
        <Veu u={u} d={faixa} o={0.25} />
        {vales.map((x, i) => <path key={i} d={`M${x},8 C${x + 2},24 ${x - 2},38 ${x + 1},56`} stroke={C.azul} strokeOpacity="0.45" strokeWidth="3.2" fill="none" filter={`url(#${u}des)`} />)}
        <Grao u={u} d={faixa} o={0.25} />
      </g>
      {vales.map((x, i) => <Guia key={i} x={x} y0={56} y1={76} />)}
      <Corte u={u} massa={massa} esmalte={esm} />
      <g clipPath={`url(#${u}sec)`}><path d={suave(topoEsm, false)} stroke={C.marfim} strokeOpacity="0.6" strokeWidth="0.5" fill="none" /></g>
    </>
  )
}

/* ——— 8. Variação por espessura: da camada fina (massa aparente) à espessa, com o corte em cunha ——— */
function VariacaoEspessura({ u }: { u: string }) {
  const r = rng(83)
  const faixa = suave(caco(8, 10, 152, 66, 1.4, r))
  return (
    <>
      <Base u={u}>
        <linearGradient id={u + 'v'} x1="0" x2="1">
          <stop offset="0" stopColor={C.azulClaro} stopOpacity="0.25" />
          <stop offset="0.35" stopColor={C.azulClaro} stopOpacity="0.7" />
          <stop offset="0.7" stopColor={C.azulMedio} />
          <stop offset="1" stopColor={C.azul} />
        </linearGradient>
        <linearGradient id={u + 'w'} x1="0" x2="1">
          <stop offset="0" stopColor={C.azulClaro} stopOpacity="0.5" />
          <stop offset="1" stopColor={C.azul} />
        </linearGradient>
      </Base>
      <path d={faixa} fill={C.massaClara} />
      <Grao u={u} d={faixa} o={0.6} />
      <path d={faixa} fill={`url(#${u}v)`} />
      <Veu u={u} d={faixa} o={0.25} />
      <g clipPath={`url(#${u}sec)`}>
        <path d="M0,98 L160,98 L160,112 L0,112 Z" fill={C.massaClara} />
        <path d="M0,98 L160,98 L160,112 L0,112 Z" fill={`url(#${u}hach)`} />
        <path d="M0,98 L0,96.8 C50,95 100,91 160,85.5 L160,98 Z" fill={`url(#${u}w)`} />
      </g>
      {[20, 56, 92, 128].map((x) => <Guia key={x} x={x} y0={68} y1={92} />)}
      <g stroke={C.grafite} strokeOpacity="0.45" strokeWidth="0.4">
        <line x1="12" y1="116" x2="148" y2="116" />
        <path d="M144,114 L148,116 L144,118" fill="none" />
      </g>
    </>
  )
}

/* ——— 9. Separação de fases: regiões vítreas distintas, em gotículas e veios, numa mesma superfície ——— */
function SeparacaoFases({ u }: { u: string }) {
  const r = rng(97)
  const placa = circulo(80, 60, 50)
  const gotas = Array.from({ length: 70 }, () => {
    const veio = r() < 0.55
    const t = r()
    const x = veio ? 14 + t * 132 : 10 + r() * 140
    const y = veio ? 38 + Math.sin(t * 5) * 14 + (r() - 0.5) * 16 + (r() < 0.5 ? 0 : 36) : 10 + r() * 100
    return { x, y, rx: 1 + r() * (veio ? 3.6 : 2.2), ry: 0.8 + r() * 2.2, o: 0.35 + r() * 0.5, giro: r() * 180 }
  })
  return (
    <>
      <Base u={u}>
        <clipPath id={u + 'p'}><path d={placa} /></clipPath>
        <radialGradient id={u + 'f'} cx="0.35" cy="0.3" r="0.9">
          <stop offset="0" stopColor={C.azulMedio} />
          <stop offset="1" stopColor={C.azul} />
        </radialGradient>
      </Base>
      <path d={placa} fill={`url(#${u}f)`} />
      <g clipPath={`url(#${u}p)`}>
        <path d="M0,40 C40,22 70,58 110,36 S150,30 170,44 L170,58 C130,52 110,70 70,62 S20,52 0,60 Z" fill={C.verde} opacity="0.45" filter={`url(#${u}des2)`} />
        <path d="M0,86 C30,74 60,98 100,82 S150,80 170,90 L170,100 C120,96 100,108 60,100 S10,96 0,104 Z" fill={C.verdeClaro} opacity="0.4" filter={`url(#${u}des2)`} />
        <g filter={`url(#${u}des)`}>
          {gotas.map((g, i) => <ellipse key={i} cx={g.x} cy={g.y} rx={g.rx} ry={g.ry} transform={`rotate(${f(g.giro)} ${f(g.x)} ${f(g.y)})`} fill={C.marfim} opacity={g.o} />)}
        </g>
        <Veu u={u} d={placa} o={0.2} />
      </g>
      <Lente cx={80} cy={60} R={50} />
    </>
  )
}

/* ——— 10. Pontilhados e manchas: concentrações irregulares de cor, algumas com halo ——— */
function Manchas({ u }: { u: string }) {
  const r = rng(101)
  const placa = disco(80, 60, 56, 52, r)
  const cores = [C.grafite, C.terracota, C.ocre, C.grafite, C.bronze]
  return (
    <>
      <Base u={u}>
        <clipPath id={u + 'p'}><path d={placa} /></clipPath>
        <radialGradient id={u + 'h'}>
          <stop offset="0" stopColor={C.ocre} stopOpacity="0.55" />
          <stop offset="1" stopColor={C.ocre} stopOpacity="0" />
        </radialGradient>
      </Base>
      <path d={placa} fill={C.areia} />
      <g clipPath={`url(#${u}p)`}>
        <Veu u={u} d={placa} o={0.5} />
        {Array.from({ length: 9 }, (_, i) => <circle key={'h' + i} cx={14 + r() * 132} cy={14 + r() * 92} r={4 + r() * 5} fill={`url(#${u}h)`} />)}
        {Array.from({ length: 130 }, (_, i) => {
          const grande = r() < 0.12
          const x = 10 + r() * 140, y = 10 + r() * 100, rr = grande ? 1.4 + r() * 1.6 : 0.3 + r() * 0.8
          return grande
            ? <path key={i} d={suave(blob(x, y, rr, rr * (0.7 + r() * 0.4), 7, 0.3, r))} fill={cores[i % cores.length]} opacity={0.55 + r() * 0.3} />
            : <circle key={i} cx={x} cy={y} r={rr} fill={cores[i % cores.length]} opacity={0.35 + r() * 0.5} />
        })}
        <Grao u={u} d={placa} o={0.3} />
      </g>
      <path d={placa} fill="none" stroke={C.terracota} strokeOpacity="0.35" strokeWidth="0.5" />
    </>
  )
}

/* ——— 11. Metálico: superfície escura com variações sutis de reflexo ——— */
function Metalico({ u }: { u: string }) {
  // ombro de um vaso: a curvatura deixa ver as faixas de reflexo
  const vaso = 'M30,118 C18,88 22,58 46,40 C58,31 62,22 60,8 L100,8 C98,22 102,31 114,40 C138,58 142,88 130,118 Z'
  return (
    <>
      <Base u={u}>
        <clipPath id={u + 'p'}><path d={vaso} /></clipPath>
        <linearGradient id={u + 'm'} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2E2C2A" />
          <stop offset="0.22" stopColor="#4A4540" />
          <stop offset="0.34" stopColor={C.bronze} />
          <stop offset="0.4" stopColor="#D2CCC0" />
          <stop offset="0.47" stopColor="#5A524A" />
          <stop offset="0.7" stopColor={C.grafite} />
          <stop offset="0.86" stopColor="#6E665C" />
          <stop offset="1" stopColor="#2E2C2A" />
        </linearGradient>
        <radialGradient id={u + 'i'}>
          <stop offset="0" stopColor={C.azulClaro} stopOpacity="0.45" />
          <stop offset="0.6" stopColor={C.terracota} stopOpacity="0.22" />
          <stop offset="1" stopColor={C.terracota} stopOpacity="0" />
        </radialGradient>
      </Base>
      <path d={vaso} fill={`url(#${u}m)`} />
      <g clipPath={`url(#${u}p)`}>
        <ellipse cx="96" cy="78" rx="20" ry="26" fill={`url(#${u}i)`} />
        <g stroke={C.marfim} strokeOpacity="0.1" strokeWidth="0.3" fill="none">
          {Array.from({ length: 18 }, (_, i) => <path key={i} d={`M${10 + i * 8},120 C${20 + i * 7},80 ${40 + i * 5},50 ${60 + i * 2.4},0`} />)}
        </g>
        <Veu u={u} d={vaso} o={0.1} />
        <Grao u={u} d={vaso} o={0.25} />
      </g>
      <path d="M60,8 L100,8" stroke={C.massa} strokeWidth="1.6" />
      <path d={vaso} fill="none" stroke={C.grafite} strokeWidth="0.5" />
    </>
  )
}

function Transparencia({ u }: { u: string }) {
  const r = rng(127)
  void r
  const placa = fratura([[10, 26], [44, 10], [92, 16], [128, 6], [152, 34], [146, 78], [156, 104], [104, 112], [62, 106], [20, 112], [6, 70]])
  const vidro = suave([[52, 0], [48, 30], [56, 60], [46, 90], [52, 124], [170, 124], [170, 0]])
  const marcas = 'M18,28 C46,18 80,40 120,26 S150,30 158,24 M14,58 C40,50 70,70 108,56 S146,58 160,52 M18,90 C50,80 84,100 122,86 S150,90 160,84'
  return (
    <>
      <Base u={u}>
        <clipPath id={u + 'p'}><path d={placa} /></clipPath>
        <clipPath id={u + 'v'}><path d={vidro} /></clipPath>
        <linearGradient id={u + 'b'} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={C.marfim} stopOpacity="0.5" />
          <stop offset="0.3" stopColor={C.marfim} stopOpacity="0" />
          <stop offset="0.7" stopColor={C.marfim} stopOpacity="0" />
          <stop offset="0.8" stopColor={C.marfim} stopOpacity="0.35" />
          <stop offset="1" stopColor={C.marfim} stopOpacity="0" />
        </linearGradient>
      </Base>
      <path d={placa} fill={C.massa} transform="translate(0.8,2.2)" />
      <path d={placa} fill={C.massaClara} />
      <g clipPath={`url(#${u}p)`}>
        <Grao u={u} d={placa} o={0.6} />
        <path d={marcas} stroke={C.terracota} strokeWidth="2.2" strokeOpacity="0.55" fill="none" strokeLinecap="round" />
        {Array.from({ length: 10 }, (_, i) => <circle key={i} cx={24 + i * 13.5} cy={74 + Math.sin(i) * 3} r="1.4" fill={C.terracota} opacity="0.55" />)}
        <g clipPath={`url(#${u}v)`}>
          <rect width="160" height="120" fill={C.terracota} opacity="0.32" />
          <path d={marcas} stroke="#8C4F33" strokeWidth="2.2" strokeOpacity="0.6" fill="none" strokeLinecap="round" />
          <rect width="160" height="120" fill={C.verdeClaro} opacity="0.32" />
          <rect width="160" height="120" fill={`url(#${u}b)`} />
          <Veu u={u} d={vidro} o={0.15} />
        </g>
        <path d={suave([[52, 0], [48, 30], [56, 60], [46, 90], [52, 124]], false)} fill="none" stroke={C.marfim} strokeWidth="1.4" strokeOpacity="0.75" />
        <path d={suave([[52, 0], [48, 30], [56, 60], [46, 90], [52, 124]], false)} fill="none" stroke={C.verde} strokeWidth="0.4" strokeOpacity="0.8" transform="translate(0.9,0)" />
      </g>
      <path d={placa} fill="none" stroke={C.terracota} strokeOpacity="0.35" strokeWidth="0.5" />
    </>
  )
}

/* ——— 13. Textura: rugosidade tátil em vista de cima, com o perfil irregular em corte ——— */
function Textura({ u }: { u: string }) {
  const r = rng(131)
  const placa = fratura([[10, 18], [52, 8], [96, 14], [150, 8], [146, 46], [152, 86], [100, 90], [54, 84], [8, 90], [14, 52]])
  const prof = Array.from({ length: 66 }, (_, i) => [i * 2.44, 104 - r() * 4 - (i % 3 === 0 ? r() * 3 : 0)] as Pt)
  return (
    <>
      <Base u={u}>
        <clipPath id={u + 'p'}><path d={placa} /></clipPath>
        <radialGradient id={u + 'g'} cx="0.35" cy="0.3" r="0.75">
          <stop offset="0" stopColor={C.marfim} />
          <stop offset="0.7" stopColor={C.areia} />
          <stop offset="1" stopColor={C.verde} stopOpacity="0.8" />
        </radialGradient>
      </Base>
      <path d={placa} fill={C.areia} />
      <g clipPath={`url(#${u}p)`}>
        <Veu u={u} d={placa} o={0.45} />
        {Array.from({ length: 95 }, (_, i) => {
          const x = 8 + r() * 144, y = 8 + r() * 82, rr = 1.2 + r() * 2.8
          return <ellipse key={i} cx={x} cy={y} rx={rr} ry={rr * (0.7 + r() * 0.3)} fill={`url(#${u}g)`} opacity={0.8} />
        })}
        {Array.from({ length: 40 }, (_, i) => <circle key={'f' + i} cx={8 + r() * 144} cy={8 + r() * 82} r={0.4 + r() * 0.6} fill={C.grafite} opacity="0.45" />)}
        <Grao u={u} d={placa} o={0.4} />
      </g>
      <path d={placa} fill="none" stroke={C.terracota} strokeOpacity="0.35" strokeWidth="0.5" />
      <g clipPath={`url(#${u}sec)`}>
        <path d={`${suave(prof, false)}L160,116L0,116Z`} fill={C.massaClara} />
        <path d={`${suave(prof, false)}L160,116L0,116Z`} fill={`url(#${u}hach)`} />
        <path d={suave(prof, false)} fill="none" stroke={C.grafite} strokeOpacity="0.6" strokeWidth="0.45" />
      </g>
    </>
  )
}

/* ——— Complementares: comportamentos de superfície ——— */
function VerticalEstavel({ u }: { u: string }) {
  const r = rng(139)
  const parede = suave(caco(44, 4, 116, 100, 1.4, r))
  const esm = suave([[40, 0], [120, 0], [120, 70], [100, 71.2], [80, 70.2], [60, 71], [40, 70]])
  return (
    <>
      <Base u={u}>
        <clipPath id={u + 'p'}><path d={parede} /></clipPath>
        <linearGradient id={u + 'e'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.verdeClaro} /><stop offset="1" stopColor={C.verde} /></linearGradient>
      </Base>
      <ProvaL u={u} r={r} />
      <path d={parede} fill={C.massaClara} />
      <Grao u={u} d={parede} o={0.55} />
      <g clipPath={`url(#${u}p)`}>
        <path d={esm} fill={`url(#${u}e)`} />
        <Veu u={u} d={esm} o={0.25} />
        <path d="M40,70.6 C60,71.4 84,70.2 120,70.6" stroke={C.marfim} strokeOpacity="0.6" strokeWidth="0.6" fill="none" />
      </g>
      <path d={parede} fill="none" stroke={C.terracota} strokeOpacity="0.35" strokeWidth="0.5" />
      <Gravidade x={140} y0={14} y1={86} />
      <line x1="122" y1="70.6" x2="134" y2="70.6" stroke={C.grafite} strokeOpacity="0.45" strokeWidth="0.45" strokeDasharray="1 1.4" />
    </>
  )
}

function AfinaArestas({ u }: { u: string }) {
  const massa = 'M0,120 L0,84 L40,84 C46,84 48,82 50,76 L58,52 C60,46 62,44 68,44 L92,44 C98,44 100,46 102,52 L110,76 C112,82 114,84 120,84 L160,84 L160,120 Z'
  const esm = 'M0,84 L0,76 L38,76.5 C44,77 46,74 48,70 L56,48 C58,42.5 61,42 68,41.6 L92,41.6 C99,42 102,42.5 104,48 L112,70 C114,74 116,77 122,76.5 L160,76 L160,84 L120,84 C114,84 112,82 110,76 L102,52 C100,46 98,44 92,44 L68,44 C62,44 60,46 58,52 L50,76 C48,82 46,84 40,84 Z'
  return (
    <>
      <Base u={u}>{gradEsmalte(u)}</Base>
      <path d={suave(caco(6, 10, 154, 30, 1.4, rng(9)))} fill={C.azulMedio} opacity="0.9" />
      <Veu u={u} d={suave(caco(6, 10, 154, 30, 1.4, rng(9)))} o={0.25} />
      {[50, 58, 102, 110].map((x) => <rect key={x} x={x - 1.2} y="10" width="2.4" height="20" fill={C.massaClara} opacity="0.85" filter={`url(#${u}des)`} />)}
      {[50, 58, 102, 110].map((x) => <Guia key={'g' + x} x={x} y0={31} y1={46} />)}
      <Corte u={u} massa={massa} esmalte={esm} />
    </>
  )
}

function RealcaRelevo({ u }: { u: string }) {
  const r = rng(151)
  const placa = suave(blob(80, 60, 72, 54, 16, 0.04, r))
  const linhas = Array.from({ length: 9 }, (_, i) => suave(blob(78, 60, 10 + i * 9, 6 + i * 6.4, 14, 0.05, r, 0.2), true))
  return (
    <>
      <Base u={u}><clipPath id={u + 'p'}><path d={placa} /></clipPath></Base>
      <path d={placa} fill={C.verdeClaro} />
      <g clipPath={`url(#${u}p)`}>
        <Veu u={u} d={placa} o={0.35} />
        {linhas.map((d, i) => <g key={i}>
          <path d={d} fill="none" stroke={C.azul} strokeOpacity="0.55" strokeWidth="2.6" filter={`url(#${u}des)`} />
          <path d={d} fill="none" stroke={C.marfim} strokeOpacity="0.7" strokeWidth="0.5" transform="translate(-1.6,-1.4)" />
        </g>)}
        <Grao u={u} d={placa} o={0.3} />
      </g>
      <path d={placa} fill="none" stroke={C.verde} strokeWidth="0.5" />
    </>
  )
}

function CobreRelevo({ u }: { u: string }) {
  const r = rng(163)
  const sup = perfil(86, 8, r)
  const massa = suave([...sup, [168, 120], [-8, 120]], true)
  const esm = `M-8,72 C40,71 120,73 168,72 L168,120 L-8,120 Z`
  return (
    <>
      <Base u={u}>{gradEsmalte(u)}<clipPath id={u + 'm'}><path d={massa} /></clipPath></Base>
      <path d={suave(caco(6, 10, 154, 46, 1.6, rng(8)))} fill={C.azulMedio} />
      <Veu u={u} d={suave(caco(6, 10, 154, 46, 1.6, rng(8)))} o={0.3} />
      <g clipPath={`url(#${u}sec)`}>
        <path d={esm} fill={`url(#${u}es)`} />
        <path d={massa} fill={C.massaClara} />
        <path d={massa} fill={`url(#${u}hach)`} />
        <path d={suave(sup, false)} fill="none" stroke={C.azul} strokeOpacity="0.5" strokeWidth="0.4" />
        <path d="M-8,72 C40,71 120,73 168,72" stroke={C.marfim} strokeOpacity="0.6" strokeWidth="0.6" fill="none" />
      </g>
      {[30, 80, 130].map((x) => <Guia key={x} x={x} y0={49} y1={70} />)}
    </>
  )
}

function Reticulacao({ u }: { u: string }) {
  const r = rng(173)
  const placa = fratura([[12, 20], [56, 8], [104, 14], [150, 6], [146, 64], [154, 108], [96, 112], [40, 104], [8, 110], [16, 62]])
  const furos: string[] = []
  for (let j = 0; j < 7; j++) for (let i = 0; i < 9; i++) {
    const cx = 6 + i * 19 + (j % 2) * 9 + (r() - 0.5) * 6, cy = 6 + j * 18 + (r() - 0.5) * 6
    furos.push(suave(blob(cx, cy, 7.8 + r() * 2.4, 6.8 + r() * 2.4, 10, 0.22, r, r() * 3)))
  }
  return (
    <>
      <Base u={u}>
        <clipPath id={u + 'p'}><path d={placa} /></clipPath>
        <mask id={u + 'k'}><rect width="160" height="120" fill="white" />{furos.map((d, i) => <path key={i} d={d} fill="black" />)}</mask>
      </Base>
      <path d={placa} fill={C.areia} transform="translate(1.2,2.4)" opacity="0.9" />
      <path d={placa} fill={C.massa} transform="translate(0.6,1.6)" />
      <path d={placa} fill={C.marfim} />
      <g clipPath={`url(#${u}p)`}>
        <Veu u={u} d={placa} o={0.45} />
        <g mask={`url(#${u}k)`}>
          <rect width="160" height="120" fill={C.azulMedio} />
          <Veu u={u} d="M0,0H160V120H0Z" o={0.3} />
        </g>
        {furos.map((d, i) => <path key={i} d={d} fill="none" stroke={C.azul} strokeWidth="0.5" strokeOpacity="0.6" />)}
        <Grao u={u} d={placa} o={0.25} />
      </g>
      <path d={placa} fill="none" stroke={C.grafite} strokeOpacity="0.35" strokeWidth="0.45" />
    </>
  )
}

function RevelaMassa({ u }: { u: string }) {
  const r = rng(181)
  const tigela = suave(blob(80, 60, 70, 52, 20, 0.015, r))
  const aneis = Array.from({ length: 9 }, (_, i) => 8 + i * 6.6)
  return (
    <>
      <Base u={u}>
        <clipPath id={u + 'p'}><path d={tigela} /></clipPath>
        <mask id={u + 'k'}>
          <rect width="160" height="120" fill="white" />
          <g filter={`url(#${u}des)`}>{aneis.map((k, i) => <ellipse key={i} cx={80} cy={60} rx={k * 1.32} ry={k} fill="none" stroke="black" strokeWidth={0.9 + r() * 1.3} strokeDasharray={`${6 + r() * 16} ${4 + r() * 9}`} />)}</g>
        </mask>
        <radialGradient id={u + 'v'} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={C.verde} />
          <stop offset="1" stopColor={C.verdeClaro} />
        </radialGradient>
      </Base>
      <path d={tigela} fill={C.massa} />
      <g clipPath={`url(#${u}p)`}>
        <Grao u={u} d={tigela} o={0.6} />
        <g mask={`url(#${u}k)`}>
          <rect width="160" height="120" fill={`url(#${u}v)`} opacity="0.95" />
          <Veu u={u} d="M0,0H160V120H0Z" o={0.3} />
        </g>
        {aneis.map((k, i) => <ellipse key={i} cx={80.5} cy={60.6} rx={k * 1.32} ry={k} fill="none" stroke={C.marfim} strokeOpacity="0.3" strokeWidth="0.35" />)}
      </g>
      <path d={tigela} fill="none" stroke={C.terracota} strokeOpacity="0.45" strokeWidth="0.6" />
      <path d={suave(blob(80, 60, 64, 47, 20, 0.015, rng(3)))} fill="none" stroke={C.marfim} strokeOpacity="0.4" strokeWidth="0.4" />
    </>
  )
}

const ARTES: Record<string, (p: { u: string }) => ReactNode> = {
  escorrimento: Escorrimento, sobreposicao: Sobreposicao, reatividade: Reatividade, cristalizacao: Cristalizacao, craquele: Craquele,
  crawling: Crawling, acumulo: Acumulo, variacaoEspessura: VariacaoEspessura, separacaoFases: SeparacaoFases, manchas: Manchas,
  metalico: Metalico, transparencia: Transparencia, textura: Textura,
  verticalEstavel: VerticalEstavel, afinaArestas: AfinaArestas, realcaRelevo: RealcaRelevo, cobreRelevo: CobreRelevo,
  reticulacao: Reticulacao, revelaMassa: RevelaMassa,
}
export const temIlustracao = (tipo: string) => tipo in ARTES

/** Uma ilustração do atlas. Ocupa a largura do contêiner, proporção 4:3. */
export function Ilustracao({ tipo, titulo }: { tipo: string; titulo?: string }) {
  const u = 'a' + useId().replace(/[^a-zA-Z0-9]/g, '')
  const Arte = ARTES[tipo]
  if (!Arte) return null
  return (
    <svg className="fx-atlas-svg" viewBox="0 0 160 120" role="img" aria-label={titulo} preserveAspectRatio="xMidYMid meet">
      <Arte u={u} />
    </svg>
  )
}
