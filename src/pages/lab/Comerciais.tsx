import { Link, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, Plus } from 'lucide-react'
import { db, novo, type Comercial } from '../../db/schema'
import { Foto } from '../../ui/form'

export default function Comerciais() {
  const nav = useNavigate()
  const itens = useLiveQuery(async () => (await db.comerciais.toArray()).filter((c) => !c.excluido).sort((a, b) => (a.observacoes ?? '').localeCompare(b.observacoes ?? '') || a.nome.localeCompare(b.nome)), [], [])
  async function novoItem() {
    const c: Comercial = novo({ fabricante: 'Fabricante', nome: 'Novo esmalte estudado', familias: [], fotos: [], declarados: [], hipoteses: [], fontes: [] })
    await db.comerciais.add(c); nav(`/engenharia-reversa/${c.id}`)
  }
  return (
    <div className="page" style={{ maxWidth: 860 }}>
      <Link to="/laboratorio" className="back"><ArrowLeft size={15} />Laboratório</Link>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
        <h1>Engenharia reversa</h1>
        <button className="btn primary" onClick={novoItem}><Plus size={16} />Novo estudo</button>
      </div>
      <p className="muted" style={{ marginTop: 10 }}>Esmaltes comerciais estudados como referência. Cada ficha separa o que o fabricante declara, o que vem da documentação, as hipóteses e o que já foi confirmado em teste.</p>
      <div className="lista" style={{ marginTop: 20 }}>
        {itens.map((c) => (
          <Link key={c.id} to={`/engenharia-reversa/${c.id}`}>
            <span className="mini">{c.fotos[0] ? <Foto id={c.fotos[0]} /> : <span style={{ fontSize: 11 }}>{(c.observacoes?.match(/ER-\d+/) ?? [''])[0]}</span>}</span>
            <span><span className="t">{c.fabricante} {c.nome}</span><br /><span className="s">{[c.codigo, c.serie].filter(Boolean).join(' · ')}</span></span>
            <span className="r">{c.confirmado ? 'com teste' : 'em estudo'}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
