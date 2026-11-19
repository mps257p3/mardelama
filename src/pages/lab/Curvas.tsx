import { Link, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, Plus } from 'lucide-react'
import { db, novo, type Curva } from '../../db/schema'
import { pontosDaCurva, duracaoTexto } from '../../lib/curva'

export default function Curvas() {
  const nav = useNavigate()
  const curvas = useLiveQuery(async () => (await db.curvas.toArray()).filter((c) => !c.excluido).sort((a, b) => a.codigo.localeCompare(b.codigo)), [], [])
  async function nova() {
    const n = curvas.length + 1
    const c: Curva = novo({ nome: 'Nova curva', codigo: `CQ-${String(n).padStart(3, '0')}`, tempInicial: 25, segmentos: [], atmosfera: 'Oxidação', resfriamentoNatural: 1 as const })
    await db.curvas.add(c); nav(`/curvas/${c.id}`)
  }
  return (
    <div className="page" style={{ maxWidth: 860 }}>
      <Link to="/laboratorio" className="back"><ArrowLeft size={15} />Laboratório</Link>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
        <h1>Curvas de queima</h1>
        <button className="btn primary" onClick={nova}><Plus size={16} />Nova curva</button>
      </div>
      <p className="muted" style={{ marginTop: 10 }}>Rampas em °C por hora e patamares em minutos. Toda curva de terceiros deve ser adaptada ao seu forno.</p>
      <div className="lista" style={{ marginTop: 20 }}>
        {curvas.map((c) => {
          const pts = pontosDaCurva(c.tempInicial, c.segmentos)
          const max = Math.max(...pts.map((p) => p.temp))
          return (
            <Link key={c.id} to={`/curvas/${c.id}`} style={{ gridTemplateColumns: '1fr auto' }}>
              <span><span className="t">{c.nome}</span><br /><span className="s">{[c.codigo, c.cone && `cone ${c.cone}`, c.atmosfera].filter(Boolean).join(' · ')}</span></span>
              <span className="r">{c.segmentos.length ? <>{max} °C<br />{duracaoTexto(pts[pts.length - 1].min)}</> : 'a definir'}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
