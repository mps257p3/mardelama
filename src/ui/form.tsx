import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Star, X, ImagePlus } from 'lucide-react'
import { salvarArquivo, useArquivoUrl } from '../db/files'

export function Campo({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return <div className="field" style={wide ? { gridColumn: '1 / -1' } : undefined}><label>{label}</label>{children}</div>
}

export function Texto({ value, onChange, ...p }: { value?: string | number; onChange: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return <input className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...p} />
}

const paraTexto = (n?: number) => (n == null ? '' : String(n).replace('.', ','))
/** Campo numérico em formato brasileiro (vírgula decimal), preservando o que está sendo digitado. */
export function Numero({ value, onChange, ...p }: { value?: number; onChange: (v: number | undefined) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  const [txt, setTxt] = useState(paraTexto(value))
  useEffect(() => {
    const atual = txt.trim() === '' ? undefined : Number(txt.replace(',', '.'))
    if (atual !== value && !(Number.isNaN(atual) && value == null)) setTxt(paraTexto(value))
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps
  return <input className="input" inputMode="decimal" value={txt} onChange={(e) => {
    const t = e.target.value
    setTxt(t)
    const n = t.trim() === '' ? undefined : Number(t.replace(',', '.'))
    onChange(n == null || Number.isFinite(n) ? n : value)
  }} {...p} />
}

export function AreaTexto({ value, onChange, rows }: { value?: string; onChange: (v: string) => void; rows?: number }) {
  return <textarea className="input" rows={rows} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
}

/** Campo com sugestões (datalist) — aceita valor livre. */
export function Sugestao({ value, onChange, opcoes, id }: { value?: string; onChange: (v: string) => void; opcoes: readonly string[]; id: string }) {
  return <>
    <input className="input" list={id} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
    <datalist id={id}>{opcoes.map((o) => <option key={o} value={o} />)}</datalist>
  </>
}

export function Escolha<T extends string>({ value, onChange, opcoes }: { value?: T; onChange: (v: T) => void; opcoes: readonly { v: T; l: string }[] }) {
  return <div className="chips" style={{ flexWrap: 'wrap' }}>
    {opcoes.map((o) => <button type="button" key={o.v} className={'chip' + (value === o.v ? ' on' : '')} onClick={() => onChange(o.v)}>{o.l}</button>)}
  </div>
}

export function Multi({ value, onChange, opcoes }: { value: string[]; onChange: (v: string[]) => void; opcoes: { v: string; l: string }[] }) {
  return <div className="chips" style={{ flexWrap: 'wrap' }}>
    {opcoes.map((o) => {
      const on = value.includes(o.v)
      return <button type="button" key={o.v} className={'chip' + (on ? ' on' : '')} onClick={() => onChange(on ? value.filter((x) => x !== o.v) : [...value, o.v])}>{o.l}</button>
    })}
  </div>
}

export function Estrelas({ value = 0, onChange, tamanho = 20 }: { value?: number; onChange?: (v: number) => void; tamanho?: number }) {
  return <div style={{ display: 'flex', gap: 2 }} aria-label={`Avaliação ${value} de 5`}>
    {[1, 2, 3, 4, 5].map((i) => (
      <button type="button" key={i} disabled={!onChange} onClick={() => onChange?.(i === value ? 0 : i)}
        style={{ background: 'none', border: 0, padding: 2, cursor: onChange ? 'pointer' : 'default', color: i <= value ? 'var(--terracota)' : 'var(--line-strong)' }}>
        <Star size={tamanho} strokeWidth={1.3} fill={i <= value ? 'currentColor' : 'none'} />
      </button>
    ))}
  </div>
}

export function Tags({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [t, setT] = useState('')
  const add = () => { const x = t.trim().toLowerCase(); if (x && !value.includes(x)) onChange([...value, x]); setT('') }
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    {value.length > 0 && <div className="chips" style={{ flexWrap: 'wrap' }}>
      {value.map((x) => <button type="button" key={x} className="chip" onClick={() => onChange(value.filter((y) => y !== x))}>#{x} <X size={12} /></button>)}
    </div>}
    <input className="input" placeholder="Adicionar tag e Enter" value={t} onChange={(e) => setT(e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() } }} onBlur={add} />
  </div>
}

function Miniatura({ id, onRemove }: { id: string; onRemove: () => void }) {
  const url = useArquivoUrl(id)
  return <div style={{ position: 'relative', width: 96, height: 96, borderRadius: 10, overflow: 'hidden', background: 'var(--surface-2)' }}>
    {url && <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
    <button type="button" className="iconbtn" aria-label="Remover foto" onClick={onRemove}
      style={{ position: 'absolute', top: 4, right: 4, width: 26, height: 26, background: 'rgba(245,240,232,.9)' }}><X size={14} /></button>
  </div>
}

export function Fotos({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const [enviando, setEnviando] = useState(false)
  async function add(files: FileList | null) {
    if (!files?.length) return
    setEnviando(true)
    const ids: string[] = []
    for (const f of Array.from(files)) ids.push(await salvarArquivo(f))
    onChange([...value, ...ids]); setEnviando(false)
  }
  return <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
    {value.map((id) => <Miniatura key={id} id={id} onRemove={() => onChange(value.filter((x) => x !== id))} />)}
    <button type="button" onClick={() => ref.current?.click()} disabled={enviando}
      style={{ width: 96, height: 96, borderRadius: 10, border: '1px dashed var(--line-strong)', background: 'none', display: 'grid', placeItems: 'center', color: 'var(--ink-3)' }}>
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontSize: 11 }}><ImagePlus size={20} strokeWidth={1.3} />{enviando ? 'Salvando…' : 'Foto'}</span>
    </button>
    <input ref={ref} type="file" accept="image/*" multiple hidden onChange={(e) => { add(e.target.files); e.target.value = '' }} />
  </div>
}

export function Foto({ id, alt = '', style, className }: { id?: string; alt?: string; style?: React.CSSProperties; className?: string }) {
  const url = useArquivoUrl(id)
  return url ? <img src={url} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover', ...style }} className={className} /> : null
}
