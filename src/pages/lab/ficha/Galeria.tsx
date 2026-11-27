import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { FlaskConical } from 'lucide-react'
import { db, type Esmalte } from '../../../db/schema'
import { Foto } from '../../../ui/form'
import { Visor } from '../../../ui/GaleriaFotos'

/**
 * Galeria da ficha: foto principal 4:3 e miniaturas em linha.
 * Cada foto tem a sua origem discreta: Fabricante (baixada do site da marca), Sua foto, Teste ou Obra.
 */
export type FotoFicha = { id: string; tipo: string }

export function useFotosFicha(e: Esmalte, testesFotos: string[]): FotoFicha[] | undefined {
  return useLiveQuery(async () => {
    const arqs = await db.arquivos.bulkGet(e.fotos)
    const proprias = e.fotos.map((id, i) => ({ id, tipo: arqs[i]?.donoTipo === 'esmalte' && e.origem === 'comercial' ? 'Fabricante' : e.origem === 'comercial' ? 'Sua foto' : 'Amostra' }))
    const fluidez = (e.fluidezQueima?.imagens ?? []).map((id) => ({ id, tipo: 'Fabricante · fluidez' }))
    return [...proprias, ...fluidez, ...testesFotos.map((id) => ({ id, tipo: 'Teste' })), ...(e.pecas ?? []).map((id) => ({ id, tipo: 'Obra' }))]
  }, [e.fotos, e.pecas, e.fluidezQueima?.imagens, testesFotos.join(), e.origem])
}

export function Galeria({ fotos, nome, corHex }: { fotos: FotoFicha[]; nome: string; corHex?: string }) {
  const [i, setI] = useState(0)
  const [visor, setVisor] = useState<number>()
  useEffect(() => { if (i >= fotos.length) setI(0) }, [fotos.length, i])
  const atual = fotos[i]
  return (
    <div className="fx-galeria">
      <div className="fx-foto">
        {atual ? <button onClick={() => setVisor(i)} aria-label="Ampliar foto"><Foto id={atual.id} alt={nome} /></button>
          : corHex ? <div className="fx-swatch" style={{ background: corHex }} /> : <FlaskConical size={40} strokeWidth={1} />}
        {atual && <span className="fx-foto-tipo">{atual.tipo}</span>}
      </div>
      {fotos.length > 1 && <div className="fx-thumbs">
        {fotos.map((f, j) => <button key={f.id + j} className={j === i ? 'on' : ''} onClick={() => setI(j)} aria-label={`Foto ${j + 1}: ${f.tipo}`}><Foto id={f.id} /></button>)}
      </div>}
      {visor != null && <Visor fotos={fotos.map((f) => f.id)} inicio={visor} legenda={`${nome} · ${fotos[visor]?.tipo ?? ''}`} onClose={() => setVisor(undefined)} />}
    </div>
  )
}
