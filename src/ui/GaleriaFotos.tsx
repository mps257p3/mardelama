import { useFecharComVoltar } from './voltarFecha'
import { travarRolagem } from './rolagem'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, ImagePlus, Trash2, X } from 'lucide-react'
import { salvarArquivo } from '../db/files'
import { Foto } from './form'

/** Botão que abre o seletor de fotos (câmera ou galeria) e devolve os ids salvos. */
function useEscolherFotos(aoSalvar: (ids: string[]) => unknown) {
  const ref = useRef<HTMLInputElement>(null)
  const [salvando, setSalvando] = useState(false)
  const input = <input ref={ref} type="file" accept="image/*" multiple hidden onChange={async (e) => {
    const fs = Array.from(e.target.files ?? []); e.target.value = ''
    if (!fs.length) return
    setSalvando(true)
    const ids: string[] = []
    for (const f of fs) { try { ids.push(await salvarArquivo(f)) } catch { /* ignora a que falhar */ } }
    setSalvando(false)
    if (ids.length) await aoSalvar(ids)
  }} />
  return { abrir: () => ref.current?.click(), salvando, input }
}

/** Visualizador em tela cheia: deslizar ou setas para trocar, Esc para fechar. */
export function Visor({ fotos, inicio, onClose, onRemover, legenda }: {
  fotos: string[]; inicio: number; onClose: () => void; onRemover?: (id: string) => unknown; legenda?: string
}) {
  useFecharComVoltar(onClose)
  const [i, setI] = useState(inicio)
  const toque = useRef<number | undefined>(undefined)
  const n = fotos.length
  const ir = (d: number) => setI((x) => (x + d + n) % n)
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); if (e.key === 'ArrowLeft') ir(-1); if (e.key === 'ArrowRight') ir(1) }
    window.addEventListener('keydown', k)
    const soltar = travarRolagem()
    return () => { window.removeEventListener('keydown', k); soltar() }
  })
  useEffect(() => { if (i >= n) setI(Math.max(0, n - 1)); if (!n) onClose() }, [n, i, onClose])
  if (!n) return null
  return createPortal(
    <div className="visor" role="dialog" aria-label="Foto ampliada" onClick={onClose}
      onTouchStart={(e) => { toque.current = e.touches[0].clientX }}
      onTouchEnd={(e) => { if (toque.current == null) return; const d = e.changedTouches[0].clientX - toque.current; toque.current = undefined; if (Math.abs(d) > 50 && n > 1) ir(d < 0 ? 1 : -1) }}>
      <div className="visor-topo" onClick={(e) => e.stopPropagation()}>
        <span>{n > 1 ? `${i + 1} de ${n}` : ''}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {onRemover && <button className="visor-btn" aria-label="Remover foto" onClick={async () => { if (confirm('Remover esta foto?')) await onRemover(fotos[i]) }}><Trash2 size={18} /></button>}
          <button className="visor-btn" aria-label="Fechar" onClick={onClose}><X size={20} /></button>
        </div>
      </div>
      <div className="visor-img" onClick={(e) => e.stopPropagation()}><Foto id={fotos[i]} alt={legenda} style={{ objectFit: 'contain' }} /></div>
      {legenda && <p className="visor-legenda">{legenda}</p>}
      {n > 1 && <>
        <button className="visor-btn visor-ant" aria-label="Anterior" onClick={(e) => { e.stopPropagation(); ir(-1) }}><ChevronLeft size={24} /></button>
        <button className="visor-btn visor-prox" aria-label="Próxima" onClick={(e) => { e.stopPropagation(); ir(1) }}><ChevronRight size={24} /></button>
      </>}
    </div>, document.body)
}

/** Foto principal em destaque, com miniaturas e botão para adicionar. */
export function CapaFotos({ fotos, onChange, alt, vazio, rotuloAdd = 'Adicionar foto' }: {
  fotos: string[]; onChange: (v: string[]) => unknown; alt?: string; vazio?: ReactNode; rotuloAdd?: string
}) {
  const [atual, setAtual] = useState(0)
  const [visor, setVisor] = useState<number>()
  const esc = useEscolherFotos((ids) => { onChange([...fotos, ...ids]); setAtual(fotos.length) })
  const id = fotos[Math.min(atual, fotos.length - 1)]
  return (
    <div>
      <div className="capa capa-grande">
        {id ? <button className="capa-btn" onClick={() => setVisor(fotos.indexOf(id))} aria-label="Ampliar foto"><Foto id={id} alt={alt} /></button>
          : <button className="capa-vazia" onClick={esc.abrir} disabled={esc.salvando}>
              {vazio}
              <span className="capa-add"><ImagePlus size={18} strokeWidth={1.4} />{esc.salvando ? 'Salvando…' : rotuloAdd}</span>
            </button>}
      </div>
      {fotos.length > 0 && (
        <div className="thumbs">
          {fotos.length > 1 && fotos.map((f, i) => <button key={f} className={f === id ? 'on' : ''} onClick={() => setAtual(i)} aria-label={`Foto ${i + 1}`}><Foto id={f} /></button>)}
          <button className="thumb-add" onClick={esc.abrir} disabled={esc.salvando} aria-label={rotuloAdd}>{esc.salvando ? '…' : <ImagePlus size={18} strokeWidth={1.4} />}</button>
        </div>
      )}
      {esc.input}
      {visor != null && <Visor fotos={fotos} inicio={visor} legenda={alt} onClose={() => setVisor(undefined)}
        onRemover={(r) => { onChange(fotos.filter((x) => x !== r)); setAtual(0) }} />}
    </div>
  )
}

/** Galeria de peças feitas com o esmalte: grade de fotos grandes + adicionar. */
export function GaleriaPecas({ fotos, onChange, titulo = 'Peças' }: { fotos: string[]; onChange: (v: string[]) => unknown; titulo?: string }) {
  const [visor, setVisor] = useState<number>()
  const esc = useEscolherFotos((ids) => onChange([...fotos, ...ids]))
  return (
    <section className="pecas-sec">
      <div className="section-head" style={{ marginBottom: 12 }}>
        <h3>{titulo}</h3>
        {fotos.length > 0 && <span className="faint" style={{ fontSize: 12.5 }}>{fotos.length} {fotos.length === 1 ? 'foto' : 'fotos'}</span>}
      </div>
      <div className="pecas-grade">
        {fotos.map((f, i) => <button key={f} className="peca-foto" onClick={() => setVisor(i)} aria-label="Ampliar foto"><Foto id={f} /></button>)}
        <button className="peca-foto peca-add" onClick={esc.abrir} disabled={esc.salvando}>
          <ImagePlus size={20} strokeWidth={1.3} /><span>{esc.salvando ? 'Salvando…' : fotos.length ? 'Adicionar' : 'Adicionar fotos de peças'}</span>
        </button>
      </div>
      {esc.input}
      {visor != null && <Visor fotos={fotos} inicio={visor} legenda={titulo} onClose={() => setVisor(undefined)}
        onRemover={(r) => onChange(fotos.filter((x) => x !== r))} />}
    </section>
  )
}

/** Envolve a foto de capa de uma página: tocar abre o visor em tela cheia. */
export function CapaAmpliavel({ fotos, inicio, legenda, children }: { fotos: string[]; inicio: number; legenda?: string; children: ReactNode }) {
  const [visor, setVisor] = useState<number>()
  if (!fotos[inicio]) return <>{children}</>
  return (
    <>
      <button className="capa-btn" onClick={() => setVisor(inicio)} aria-label="Ampliar foto">{children}</button>
      {visor != null && <Visor fotos={fotos} inicio={visor} legenda={legenda} onClose={() => setVisor(undefined)} />}
    </>
  )
}
