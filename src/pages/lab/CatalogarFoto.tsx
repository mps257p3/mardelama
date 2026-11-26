import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Images, Sparkles, X } from 'lucide-react'
import { Sheet } from '../../ui/Sheet'
import { useToast } from '../../ui/toast'
import { catalogarEsmalte } from '../../lib/comercial'

const MAX = 4

/**
 * Esmaltaria › + › Catalogar esmalte por foto. Junta até 4 fotos (frente do rótulo, verso, placa),
 * tiradas uma a uma com a câmera ou escolhidas na galeria, e manda tudo junto para a IA.
 */
export function CatalogarFoto({ familia, onClose }: { familia?: string; onClose: () => void }) {
  const nav = useNavigate()
  const toast = useToast()
  const galeria = useRef<HTMLInputElement>(null)
  const camera = useRef<HTMLInputElement>(null)
  const [fotos, setFotos] = useState<File[]>([])
  const [lendo, setLendo] = useState(false)
  const urls = useMemo(() => fotos.map((f) => URL.createObjectURL(f)), [fotos])
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls])
  // copia já: o FileList do input se esvazia quando o campo é limpo, antes de o React aplicar a mudança
  const juntar = (fs: FileList | null) => { const novas = [...(fs ?? [])]; if (novas.length) setFotos((x) => [...x, ...novas].slice(0, MAX)) }

  async function catalogar() {
    setLendo(true)
    try { const id = await catalogarEsmalte(fotos, familia ? [familia] : []); toast('Esmalte catalogado. Confira as informações.'); nav(`/esmaltes/${id}`, { replace: false }) }
    catch (e) { toast((e as Error).message); setLendo(false) }
  }

  return (
    <Sheet label="Catalogar esmalte por foto" onClose={onClose}>
      <h3>Catalogar esmalte por foto</h3>
      <input ref={galeria} type="file" accept="image/*" multiple hidden onChange={(e) => { juntar(e.target.files); e.target.value = '' }} />
      <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { juntar(e.target.files); e.target.value = '' }} />
      {lendo ? <p className="recebido-lendo" style={{ marginTop: 14 }}><Sparkles size={15} />Identificando o esmalte e procurando a ficha e as fotos do fabricante… deixe o app aberto na tela, leva 1 ou 2 minutos.</p> : <>
        <p className="muted" style={{ margin: '6px 0 14px', fontSize: 14 }}>Até {MAX} fotos do mesmo esmalte: a frente do rótulo (marca, nome, código), o verso (cone, temperatura, avisos de louça) e, se tiver, uma placa queimada.</p>
        {fotos.length > 0 && <div className="cat-fotos">
          {urls.map((u, i) => <div key={u} className="cat-foto"><img src={u} alt={`Foto ${i + 1}`} /><button aria-label="Tirar esta foto" onClick={() => setFotos(fotos.filter((_, j) => j !== i))}><X size={14} /></button></div>)}
        </div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button className="btn" disabled={fotos.length >= MAX} onClick={() => camera.current?.click()}><Camera size={17} />{fotos.length ? 'Mais uma foto' : 'Tirar foto'}</button>
          <button className="btn" disabled={fotos.length >= MAX} onClick={() => galeria.current?.click()}><Images size={17} />Da galeria</button>
        </div>
        <button className="btn primary" style={{ width: '100%', marginTop: 12 }} disabled={!fotos.length} onClick={catalogar}>
          <Sparkles size={16} />{fotos.length ? `Catalogar com ${fotos.length} ${fotos.length === 1 ? 'foto' : 'fotos'}` : 'Catalogar'}
        </button>
      </>}
    </Sheet>
  )
}
