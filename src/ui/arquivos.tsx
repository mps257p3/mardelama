import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { FileText, FileUp, Mic, Square, X } from 'lucide-react'
import { db } from '../db/schema'
import { salvarArquivo, useArquivoUrl } from '../db/files'

const kb = (n: number) => (n > 1e6 ? (n / 1e6).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1e3)) + ' KB')

export function ArquivoLink({ id, onRemove }: { id: string; onRemove?: () => void }) {
  const a = useLiveQuery(() => db.arquivos.get(id), [id])
  const url = useArquivoUrl(id)
  if (!a) return null
  return (
    <span className="chip" style={{ height: 'auto', padding: '6px 12px' }}>
      <FileText size={14} />
      <a href={url} target="_blank" rel="noreferrer" download={a.mime === 'application/pdf' ? undefined : a.nome} style={{ textDecoration: 'underline' }}>{a.nome}</a>
      <span className="faint">{kb(a.tamanho)}</span>
      {onRemove && <button type="button" aria-label="Remover" onClick={onRemove} style={{ border: 0, background: 'none', padding: 0, display: 'flex' }}><X size={12} /></button>}
    </span>
  )
}

export function Arquivos({ value, onChange, aceitar = '*/*' }: { value: string[]; onChange: (v: string[]) => void; aceitar?: string }) {
  const ref = useRef<HTMLInputElement>(null)
  return <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
    {value.map((id) => <ArquivoLink key={id} id={id} onRemove={() => onChange(value.filter((x) => x !== id))} />)}
    <button type="button" className="btn sm" onClick={() => ref.current?.click()}><FileUp size={14} />Anexar arquivo</button>
    <input ref={ref} type="file" multiple accept={aceitar} hidden onChange={async (e) => {
      const ids: string[] = []; for (const f of Array.from(e.target.files ?? [])) ids.push(await salvarArquivo(f))
      onChange([...value, ...ids]); e.target.value = ''
    }} />
  </div>
}

export function Audio({ id, onRemove }: { id: string; onRemove?: () => void }) {
  const url = useArquivoUrl(id)
  return <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{url && <audio controls src={url} style={{ height: 36, maxWidth: '100%' }} />}{onRemove && <button type="button" className="iconbtn" aria-label="Remover áudio" onClick={onRemove}><X size={14} /></button>}</div>
}

export function Gravador({ onPronto }: { onPronto: (id: string) => void }) {
  const [gravando, setGravando] = useState<MediaRecorder>()
  const [seg, setSeg] = useState(0)
  const [erro, setErro] = useState<string>()
  async function iniciar() {
    setErro(undefined)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec = new MediaRecorder(stream); const partes: Blob[] = []
      rec.ondataavailable = (e) => partes.push(e.data)
      const t0 = Date.now(); const timer = setInterval(() => setSeg(Math.round((Date.now() - t0) / 1000)), 500)
      rec.onstop = async () => {
        clearInterval(timer); stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(partes, { type: rec.mimeType || 'audio/webm' })
        const ext = blob.type.includes('mp4') ? 'm4a' : 'webm'
        onPronto(await salvarArquivo(new File([blob], `audio-${new Date().toISOString().slice(0, 16).replace(':', 'h')}.${ext}`, { type: blob.type })))
        setGravando(undefined); setSeg(0)
      }
      rec.start(); setGravando(rec)
    } catch { setErro('Não foi possível acessar o microfone.') }
  }
  return <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
    {gravando ? <button type="button" className="btn sm primary" onClick={() => gravando.stop()}><Square size={13} />Parar ({seg}s)</button>
      : <button type="button" className="btn sm" onClick={iniciar}><Mic size={14} />Gravar áudio</button>}
    {erro && <span className="faint" style={{ fontSize: 12.5 }}>{erro}</span>}
  </div>
}
