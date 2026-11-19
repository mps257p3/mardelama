import type { PontoCurva } from '../lib/curva'
import { duracaoTexto } from '../lib/curva'

/** Gráfico temperatura × tempo. Linha contínua = curva planejada; tracejada = leituras reais (quando houver). */
export function GraficoCurva({ planejada, real, altura = 240 }: { planejada: PontoCurva[]; real?: PontoCurva[]; altura?: number }) {
  const todos = [...planejada, ...(real ?? [])]
  if (planejada.length < 2 && !(real && real.length > 1)) return <p className="faint">Sem rampas cadastradas ainda.</p>
  const W = 640, H = altura, m = { l: 44, r: 12, t: 12, b: 28 }
  const maxT = Math.max(...todos.map((p) => p.min), 1)
  const maxC = Math.ceil(Math.max(...todos.map((p) => p.temp), 100) / 100) * 100
  const x = (min: number) => m.l + (min / maxT) * (W - m.l - m.r)
  const y = (c: number) => H - m.b - (c / maxC) * (H - m.t - m.b)
  const linha = (ps: PontoCurva[]) => ps.map((p, i) => `${i ? 'L' : 'M'}${x(p.min).toFixed(1)},${y(p.temp).toFixed(1)}`).join(' ')
  const passoC = maxC > 800 ? 200 : 100
  const passoH = Math.max(1, Math.ceil(maxT / 60 / 8))
  return (
    <figure style={{ margin: 0 }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Curva de queima até ${Math.max(...planejada.map((p) => p.temp))} °C em ${duracaoTexto(maxT)}`} style={{ display: 'block', fontFamily: 'var(--sans)' }}>
        {Array.from({ length: maxC / passoC + 1 }, (_, i) => i * passoC).map((c) => (
          <g key={c}><line x1={m.l} x2={W - m.r} y1={y(c)} y2={y(c)} stroke="var(--line)" /><text x={m.l - 6} y={y(c) + 4} textAnchor="end" fontSize="11" fill="var(--ink-3)">{c}°</text></g>
        ))}
        {Array.from({ length: Math.floor(maxT / 60 / passoH) + 1 }, (_, i) => i * passoH).map((h) => (
          <text key={h} x={x(h * 60)} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--ink-3)">{h}h</text>
        ))}
        <path d={linha(planejada)} fill="none" stroke="var(--terracota)" strokeWidth="2.5" strokeLinejoin="round" />
        {planejada.map((p, i) => <circle key={i} cx={x(p.min)} cy={y(p.temp)} r="3" fill="var(--terracota)" />)}
        {real && real.length > 1 && <path d={linha(real)} fill="none" stroke="var(--azul)" strokeWidth="2" strokeDasharray="5 4" />}
      </svg>
      <figcaption className="faint" style={{ fontSize: 12, display: 'flex', gap: 16, marginTop: 4 }}>
        <span><span style={{ display: 'inline-block', width: 14, height: 3, background: 'var(--terracota)', verticalAlign: 'middle', marginRight: 6 }} />Planejada</span>
        {real && real.length > 1 && <span><span style={{ display: 'inline-block', width: 14, height: 0, borderTop: '2px dashed var(--azul)', verticalAlign: 'middle', marginRight: 6 }} />Real</span>}
      </figcaption>
    </figure>
  )
}
