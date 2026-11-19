import { Link, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { LayoutDashboard, Plus } from 'lucide-react'
import { TopoRef } from './Topo'
import { db, novo } from '../../db/schema'
import { usePaineis } from '../../db/hooks'
import { Foto } from '../../ui/form'
import { ImgRef } from './ImgRef'

function Capa({ refId, arquivoId }: { refId?: string; arquivoId?: string }) {
  const r = useLiveQuery(() => (refId ? db.referencias.get(refId) : undefined), [refId])
  return arquivoId ? <Foto id={arquivoId} /> : r ? <ImgRef r={r} /> : null
}

export default function Paineis() {
  const paineis = usePaineis()
  const nav = useNavigate()
  return (
    <div className="page">
      <TopoRef aba="paineis" icones={<button className="iconbtn mais" aria-label="Novo painel" onClick={async () => { const p = novo({ nome: 'Novo painel', itens: [] }); await db.paineis.add(p); nav(`/paineis/${p.id}`) }}><Plus size={19} /></button>} />
      {paineis && paineis.length === 0 ? (
        <div className="empty" style={{ marginTop: 8 }}><span className="serif">Nenhum painel ainda.</span><span>Reúna referências, imagens, textos e cores numa composição livre.</span></div>
      ) : (
        <div className="galeria" style={{ marginTop: 8 }}>
          {(paineis ?? []).map((p) => {
            const vis = p.itens.filter((i) => i.tipo === 'referencia' || i.tipo === 'imagem').slice(0, 4)
            return (
              <Link key={p.id} to={`/paineis/${p.id}`} className="peca">
                <div className="ph" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, placeItems: 'stretch' }}>
                  {vis.length ? vis.map((i) => <div key={i.id} style={{ overflow: 'hidden' }}><Capa refId={i.refId} arquivoId={i.arquivoId} /></div>)
                    : <LayoutDashboard size={30} strokeWidth={1.1} style={{ gridColumn: '1 / -1', alignSelf: 'center', justifySelf: 'center' }} />}
                </div>
                <div><div className="t">{p.nome}</div><div className="s">{p.itens.length} itens</div></div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
