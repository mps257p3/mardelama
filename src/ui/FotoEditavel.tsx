import { useEffect, useRef, useState } from 'react'
import { Crop, ImagePlus, RotateCcw } from 'lucide-react'
import { useFotoEsm, trocarFotoEsm, restaurarFotoEsm, fotoDaArea, type FotoEsm } from '../lib/esmaltaria'
import { EditorRecorte, salvarRecorteAjuste } from './Recorte'
import { Sheet } from './Sheet'
import { useToast } from './toast'

/** Imagem com enquadramento e reserva local quando a externa não carrega. */
export function ImgFoto({ f }: { f: FotoEsm }) {
  const { src, reserva, estilo } = useFotoEsm(f)
  const [falhou, setFalhou] = useState(false)
  useEffect(() => setFalhou(false), [src])
  return <img src={falhou && reserva ? reserva : src} alt="" loading="lazy" referrerPolicy="no-referrer" style={estilo} onError={() => setFalhou(true)} />
}

/** Linha de troca de foto: miniatura, Trocar (galeria), Reenquadrar e Voltar à padrão. */
export function LinhaFoto({ f }: { f: FotoEsm }) {
  const foto = useFotoEsm(f)
  const ref = useRef<HTMLInputElement>(null)
  const [editar, setEditar] = useState(false)
  const toast = useToast()
  return (
    <div className="bib-capa-linha">
      <span className="ph"><ImgFoto f={f} /></span>
      <span className="t">{f.nome}<span className="s">{foto.propria ? 'Foto sua' : f.credito ? `Padrão · ${f.credito}` : 'Padrão'}</span></span>
      <span style={{ display: 'flex', gap: 4 }}>
        {foto.propria && <button className="iconbtn" aria-label="Reenquadrar foto" onClick={() => setEditar(true)}><Crop size={16} /></button>}
        {foto.propria && <button className="iconbtn" aria-label="Voltar à foto padrão" onClick={() => restaurarFotoEsm(f, foto.id)}><RotateCcw size={16} /></button>}
        <button className="btn sm" onClick={() => ref.current?.click()}><ImagePlus size={14} />Trocar</button>
      </span>
      <input ref={ref} type="file" accept="image/*" hidden onChange={async (e) => {
        const arq = e.target.files?.[0]; e.target.value = ''
        if (!arq) return
        try { await trocarFotoEsm(f, arq, foto.id); setEditar(true) } catch { toast('Não consegui salvar essa foto.') }
      }} />
      {editar && <EditorRecorte src={foto.src} aspecto={f.aspecto} valor={foto.recorte} titulo={`Reenquadrar · ${f.nome}`}
        onSalvar={(r) => salvarRecorteAjuste(f.chave, r)} onClose={() => setEditar(false)} />}
    </div>
  )
}

/**
 * Capa panorâmica de uma área: a mesma foto (e o mesmo enquadramento) do card da área na tela inicial.
 * Trocar aqui troca lá também.
 */
export function CapaArea({ slug, nome, onEditar, className }: { slug: string; nome: string; onEditar?: () => void; className?: string }) {
  const f = fotoDaArea(slug, nome)
  const [aberto, setAberto] = useState(false)
  return (
    <>
      <figure className={'destaque esm-capa' + (className ? ' ' + className : '')}>
        <ImgFoto f={f} />
        <button className="editar" aria-label={`Trocar a foto de capa de ${nome}`} onClick={() => (onEditar ? onEditar() : setAberto(true))}><ImagePlus size={13} strokeWidth={1.5} /></button>
      </figure>
      {aberto && (
        <Sheet onClose={() => setAberto(false)} label={`Capa de ${nome}`}>
          <h3>Capa de {nome}</h3>
          <p className="faint" style={{ fontSize: 13.5, margin: '6px 0 14px' }}>É a mesma foto do card na tela inicial: trocar aqui troca lá também.</p>
          <LinhaFoto f={f} />
        </Sheet>
      )}
    </>
  )
}
