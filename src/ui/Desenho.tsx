import { useEffect, useRef, useState } from 'react'
import { Eraser, Undo2 } from 'lucide-react'
import { Sheet } from './Sheet'

const CORES = ['#1E1C19', '#594334', '#B46E4B', '#3D5965', '#CBAB8F', '#F5F0E8']

/** Bloco de desenho à mão livre (dedo, caneta ou mouse). Devolve um PNG. */
export function Desenho({ onClose, onSalvar }: { onClose: () => void; onSalvar: (f: File) => void }) {
  const cv = useRef<HTMLCanvasElement>(null)
  const [cor, setCor] = useState(CORES[0])
  const [esp, setEsp] = useState(3)
  const hist = useRef<ImageData[]>([])
  useEffect(() => {
    const c = cv.current!; const r = c.getBoundingClientRect(); const dpr = window.devicePixelRatio || 1
    c.width = r.width * dpr; c.height = r.height * dpr
    const ctx = c.getContext('2d')!; ctx.scale(dpr, dpr); ctx.fillStyle = '#FBF8F3'; ctx.fillRect(0, 0, r.width, r.height)
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  }, [])
  function down(e: React.PointerEvent) {
    const c = cv.current!; const ctx = c.getContext('2d')!; c.setPointerCapture(e.pointerId)
    hist.current.push(ctx.getImageData(0, 0, c.width, c.height)); if (hist.current.length > 30) hist.current.shift()
    const r = c.getBoundingClientRect(); ctx.strokeStyle = cor; ctx.beginPath(); ctx.moveTo(e.clientX - r.left, e.clientY - r.top)
    const move = (ev: PointerEvent) => { ctx.lineWidth = esp * (ev.pressure && ev.pointerType === 'pen' ? ev.pressure * 2 : 1); ctx.lineTo(ev.clientX - r.left, ev.clientY - r.top); ctx.stroke(); ctx.beginPath(); ctx.moveTo(ev.clientX - r.left, ev.clientY - r.top) }
    const up = () => { c.removeEventListener('pointermove', move); c.removeEventListener('pointerup', up) }
    c.addEventListener('pointermove', move); c.addEventListener('pointerup', up)
  }
  return (
    <Sheet label="Desenho" onClose={onClose}>
      <h3>Desenho</h3>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '12px 0', flexWrap: 'wrap' }}>
        {CORES.map((c) => <button key={c} type="button" aria-label={c} onClick={() => setCor(c)} style={{ width: 28, height: 28, borderRadius: 14, background: c, border: cor === c ? '2px solid var(--ink)' : '1px solid var(--line-strong)' }} />)}
        <input type="range" min={1} max={14} value={esp} onChange={(e) => setEsp(+e.target.value)} aria-label="Espessura" />
        <button type="button" className="iconbtn" aria-label="Desfazer" onClick={() => { const d = hist.current.pop(); if (d) cv.current!.getContext('2d')!.putImageData(d, 0, 0) }}><Undo2 size={16} /></button>
        <button type="button" className="iconbtn" aria-label="Borracha" onClick={() => setCor('#FBF8F3')}><Eraser size={16} /></button>
      </div>
      <canvas ref={cv} onPointerDown={down} style={{ width: '100%', height: 360, borderRadius: 12, border: '1px solid var(--line)', touchAction: 'none', display: 'block' }} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
        <button className="btn primary" onClick={() => cv.current!.toBlob((b) => b && onSalvar(new File([b], `desenho-${Date.now()}.png`, { type: 'image/png' })), 'image/png')}>Guardar desenho</button>
      </div>
    </Sheet>
  )
}
