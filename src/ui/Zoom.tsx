import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Área com zoom: pinça com dois dedos, toque duplo (ou clique duplo) para ampliar e voltar,
 * roda do mouse, e arrastar para andar pela imagem ampliada.
 * Use `key` para voltar ao tamanho normal ao trocar de imagem.
 * `onZoom` avisa quando está ampliado (para o visor não trocar de obra ao arrastar).
 */
export function Zoom({ children, onZoom, onToque }: { children: ReactNode; onZoom?: (ampliado: boolean) => void; onToque?: () => void }) {
  const [t, setT] = useState({ s: 1, x: 0, y: 0 })
  const ref = useRef<HTMLDivElement>(null)
  const g = useRef<{ d0?: number; s0: number; x0: number; y0: number; px?: number; py?: number; moveu: boolean; ultimoToque: number; toqueTimer?: number }>({ s0: 1, x0: 0, y0: 0, moveu: false, ultimoToque: 0 })
  const ampliado = t.s > 1.01

  useEffect(() => { onZoom?.(ampliado) }, [ampliado, onZoom])

  const limitar = (s: number, x: number, y: number) => {
    const el = ref.current; if (!el || s <= 1) return { s: 1, x: 0, y: 0 }
    const mx = (el.clientWidth * (s - 1)) / 2, my = (el.clientHeight * (s - 1)) / 2
    return { s: Math.min(s, 6), x: Math.max(-mx, Math.min(mx, x)), y: Math.max(-my, Math.min(my, y)) }
  }
  /** Amplia para `s` mantendo o ponto (cx, cy) da tela no lugar. */
  const ampliarEm = (s: number, cx: number, cy: number, base = t) => {
    const el = ref.current; if (!el) return
    const r = el.getBoundingClientRect()
    const ox = cx - r.left - r.width / 2, oy = cy - r.top - r.height / 2
    const k = s / base.s
    setT(limitar(s, ox - (ox - base.x) * k, oy - (oy - base.y) * k))
  }
  const alternar = (cx: number, cy: number) => (ampliado ? setT({ s: 1, x: 0, y: 0 }) : ampliarEm(2.5, cx, cy))

  useEffect(() => {
    const el = ref.current; if (!el) return
    // roda do mouse amplia (sem rolar a página)
    const roda = (e: WheelEvent) => { e.preventDefault(); setT((b) => { const s = Math.max(1, Math.min(6, b.s * (e.deltaY < 0 ? 1.15 : 1 / 1.15))); const r = el.getBoundingClientRect(); const ox = e.clientX - r.left - r.width / 2, oy = e.clientY - r.top - r.height / 2; const k = s / b.s; return limitar(s, ox - (ox - b.x) * k, oy - (oy - b.y) * k) }) }
    el.addEventListener('wheel', roda, { passive: false })
    return () => el.removeEventListener('wheel', roda)
  })

  return (
    <div ref={ref} className="zoom" style={{ cursor: ampliado ? 'grab' : 'zoom-in' }}
      onTouchStart={(e) => {
        const q = g.current
        if (e.touches.length === 2) {
          const [a, b] = [e.touches[0], e.touches[1]]
          q.d0 = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); q.s0 = t.s; q.x0 = t.x; q.y0 = t.y; q.moveu = true
        } else if (e.touches.length === 1) {
          q.px = e.touches[0].clientX; q.py = e.touches[0].clientY; q.x0 = t.x; q.y0 = t.y; q.moveu = false
        }
        if (ampliado || e.touches.length === 2) e.stopPropagation()
      }}
      onTouchMove={(e) => {
        const q = g.current
        if (e.touches.length === 2 && q.d0) {
          const [a, b] = [e.touches[0], e.touches[1]]
          const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
          ampliarEm(Math.max(1, Math.min(6, q.s0 * (d / q.d0))), (a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2, { s: q.s0, x: q.x0, y: q.y0 })
          e.stopPropagation()
        } else if (e.touches.length === 1 && q.px != null) {
          const dx = e.touches[0].clientX - q.px, dy = e.touches[0].clientY - q.py!
          if (Math.abs(dx) + Math.abs(dy) > 6) q.moveu = true
          if (ampliado) { setT((b) => limitar(b.s, q.x0 + dx, q.y0 + dy)); e.stopPropagation() }
        }
      }}
      onTouchEnd={(e) => {
        const q = g.current
        if (e.touches.length < 2) q.d0 = undefined
        if (ampliado) e.stopPropagation()
        if (e.touches.length || q.moveu) return
        // toque simples ou duplo
        const agora = Date.now(), p = e.changedTouches[0]
        if (agora - q.ultimoToque < 300) { clearTimeout(q.toqueTimer); q.ultimoToque = 0; alternar(p.clientX, p.clientY) }
        else { q.ultimoToque = agora; q.toqueTimer = window.setTimeout(() => onToque?.(), 300) }
        e.preventDefault()
      }}
      onDoubleClick={(e) => alternar(e.clientX, e.clientY)}
      onClick={(e) => { if (e.detail === 1 && !matchMedia('(pointer: coarse)').matches) { const q = g.current; clearTimeout(q.toqueTimer); q.toqueTimer = window.setTimeout(() => onToque?.(), 250) } else if (e.detail === 2) clearTimeout(g.current.toqueTimer) }}
      onMouseDown={(e) => {
        if (!ampliado) return
        const x0 = e.clientX, y0 = e.clientY, b = t
        const mover = (m: MouseEvent) => setT(limitar(b.s, b.x + m.clientX - x0, b.y + m.clientY - y0))
        const soltar = () => { window.removeEventListener('mousemove', mover); window.removeEventListener('mouseup', soltar) }
        window.addEventListener('mousemove', mover); window.addEventListener('mouseup', soltar)
        e.preventDefault()
      }}>
      <div className="zoom-conteudo" style={{ transform: `translate(${t.x}px, ${t.y}px) scale(${t.s})` }}>{children}</div>
    </div>
  )
}
