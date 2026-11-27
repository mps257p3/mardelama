import { useRef, useState, type CSSProperties } from 'react'
import { useAjuste, definirAjuste } from '../db/settings'
import { Sheet } from './Sheet'

/**
 * Enquadramento de uma foto dentro da área de corte: ponto central (0–1) e zoom (1–4).
 * A foto em si não muda: só a posição e a ampliação na hora de mostrar.
 */
export interface Recorte { x: number; y: number; zoom: number }
export const RECORTE_PADRAO: Recorte = { x: 0.5, y: 0.5, zoom: 1 }

export const estiloRecorte = (r?: Partial<Recorte>): CSSProperties => {
  if (!r) return {}
  const x = (r.x ?? 0.5) * 100, y = (r.y ?? 0.5) * 100, z = r.zoom ?? 1
  return { objectFit: 'cover', objectPosition: `${x}% ${y}%`, ...(z !== 1 ? { transform: `scale(${z})`, transformOrigin: `${x}% ${y}%` } : {}) }
}

/** Enquadramento guardado em Ajustes, ao lado da foto (chave da foto + ".recorte"). */
export const useRecorteAjuste = (chave: string) => useAjuste<Recorte | undefined>(`${chave}.recorte`, undefined)
export const salvarRecorteAjuste = (chave: string, r?: Recorte) => definirAjuste(`${chave}.recorte`, r)

const limitar = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

/**
 * Editor de enquadramento: arraste para mover (horizontal e vertical), dois dedos ou o controle para ampliar.
 * `aspecto` é a proporção largura/altura da área onde a foto aparece.
 */
export function EditorRecorte({ src, aspecto, valor, titulo = 'Reenquadrar foto', onSalvar, onClose }: {
  src?: string; aspecto: number; valor?: Recorte; titulo?: string; onSalvar: (r: Recorte) => unknown; onClose: () => void
}) {
  const [r, setR] = useState<Recorte>({ ...RECORTE_PADRAO, ...valor })
  const caixa = useRef<HTMLDivElement>(null)
  const dedos = useRef(new Map<number, { x: number; y: number }>())
  const inicio = useRef<{ r: Recorte; px: number; py: number; dist?: number } | undefined>(undefined)
  const distancia = () => { const [a, b] = [...dedos.current.values()]; return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : undefined }
  const centro = () => { const xs = [...dedos.current.values()]; return { x: xs.reduce((s, p) => s + p.x, 0) / xs.length, y: xs.reduce((s, p) => s + p.y, 0) / xs.length } }
  const recomeca = () => { const c = centro(); inicio.current = dedos.current.size ? { r, px: c.x, py: c.y, dist: distancia() } : undefined }

  return (
    <Sheet onClose={onClose} label={titulo}>
      <h3>{titulo}</h3>
      <div ref={caixa} className="recorte-caixa" style={{ aspectRatio: String(aspecto) }} aria-label="Arraste para mover a foto; use dois dedos para ampliar"
        onPointerDown={(ev) => { (ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId); dedos.current.set(ev.pointerId, { x: ev.clientX, y: ev.clientY }); recomeca() }}
        onPointerMove={(ev) => {
          if (!dedos.current.has(ev.pointerId) || !inicio.current || !caixa.current) return
          dedos.current.set(ev.pointerId, { x: ev.clientX, y: ev.clientY })
          const i = inicio.current, c = centro(), d = distancia()
          const zoom = i.dist && d ? limitar(i.r.zoom * (d / i.dist), 1, 4) : i.r.zoom
          const k = caixa.current.clientWidth * zoom
          setR({ zoom, x: limitar(i.r.x - (c.x - i.px) / k, 0, 1), y: limitar(i.r.y - (c.y - i.py) / k, 0, 1) })
        }}
        onPointerUp={(ev) => { dedos.current.delete(ev.pointerId); recomeca() }}
        onPointerCancel={(ev) => { dedos.current.delete(ev.pointerId); recomeca() }}
        onWheel={(ev) => setR((x) => ({ ...x, zoom: limitar(x.zoom * (ev.deltaY < 0 ? 1.08 : 1 / 1.08), 1, 4) }))}>
        {src && <img src={src} alt="" draggable={false} referrerPolicy="no-referrer" style={estiloRecorte(r)} />}
        <span className="recorte-grade" aria-hidden />
      </div>
      <label className="recorte-zoom">Ampliar<input type="range" min={1} max={4} step={0.01} value={r.zoom} onChange={(ev) => setR({ ...r, zoom: Number(ev.target.value) })} /></label>
      <p className="faint" style={{ fontSize: 13, margin: '6px 0 0' }}>Arraste para mover na horizontal e na vertical. Amplie com dois dedos ou com o controle. A foto original não é alterada.</p>
      <div className="recorte-acoes">
        <button className="btn sm" onClick={() => setR(RECORTE_PADRAO)}>Centralizar</button>
        <span style={{ flex: 1 }} />
        <button className="btn sm" onClick={onClose}>Cancelar</button>
        <button className="btn sm primary" onClick={async () => { await onSalvar(r); onClose() }}>Salvar enquadramento</button>
      </div>
    </Sheet>
  )
}
