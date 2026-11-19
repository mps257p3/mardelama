import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link2, Plus, Search, X } from 'lucide-react'
import { db, uid, type Tipo } from '../db/schema'
import { buscarTodos, resumo, ROTULO, type Resumo } from '../lib/entidades'
import { Sheet } from './Sheet'
import { Foto } from './form'

/** Painel de conexões: qualquer conteúdo pode se ligar a qualquer outro, nos dois sentidos. */
export function Relacoes({ tipo, id, extras = [] }: { tipo: Tipo; id: string; extras?: Resumo[] }) {
  const [add, setAdd] = useState(false)
  const itens = useLiveQuery(async () => {
    const [a, b] = await Promise.all([
      db.relacoes.where('[aTipo+aId]').equals([tipo, id]).toArray(),
      db.relacoes.where('[bTipo+bId]').equals([tipo, id]).toArray(),
    ])
    const vivas = (xs: typeof a) => xs.filter((r) => !r.excluido)
    const alvos = [...vivas(a).map((r) => ({ rel: r.id, t: r.bTipo, i: r.bId })), ...vivas(b).map((r) => ({ rel: r.id, t: r.aTipo, i: r.aId }))]
    const res = await Promise.all(alvos.map(async (x) => ({ rel: x.rel, r: await resumo(x.t, x.i) })))
    return res.filter((x) => x.r) as { rel: string; r: Resumo }[]
  }, [tipo, id])

  const todos = [...extras.map((r) => ({ rel: '', r })), ...(itens ?? [])]
  return (
    <section>
      <div className="section-head"><h3>Conexões</h3><button className="btn sm" onClick={() => setAdd(true)}><Plus size={14} />Conectar</button></div>
      {todos.length === 0 ? <p className="faint" style={{ fontSize: 13.5 }}>Ligue este item a esmaltes, materiais, testes, anotações, referências ou conteúdos da biblioteca.</p> : (
        <div className="lista">
          {todos.map(({ rel, r }) => (
            <div className="row" key={r.tipo + r.id + rel}>
              <div className="mini">{r.foto ? <Foto id={r.foto} /> : <Link2 size={18} strokeWidth={1.3} />}</div>
              <Link to={r.to}><div className="t" style={{ fontSize: 18 }}>{r.titulo}</div><div className="s">{ROTULO[r.tipo]} · {r.sub}</div></Link>
              {rel ? <button className="iconbtn" aria-label="Desconectar" onClick={() => db.relacoes.update(rel, { excluido: 1, atualizadoEm: Date.now() })}><X size={15} /></button> : <span className="faint" style={{ fontSize: 11 }}>automática</span>}
            </div>
          ))}
        </div>
      )}
      {add && <Conectar onClose={() => setAdd(false)} onPick={async (r) => {
        if (r.tipo === tipo && r.id === id) return
        await db.relacoes.add({ id: uid(), aTipo: tipo, aId: id, bTipo: r.tipo, bId: r.id, criadoEm: Date.now(), atualizadoEm: Date.now(), excluido: 0 })
        setAdd(false)
      }} />}
    </section>
  )
}

function Conectar({ onClose, onPick }: { onClose: () => void; onPick: (r: Resumo) => void }) {
  const [q, setQ] = useState('')
  const [rs, setRs] = useState<Resumo[]>([])
  useEffect(() => { let vivo = true; buscarTodos(q).then((x) => vivo && setRs(x)); return () => { vivo = false } }, [q])
  return (
    <Sheet onClose={onClose} label="Conectar">
      <h3>Conectar a…</h3>
      <div className="search" style={{ margin: '16px 0' }}><Search size={16} style={{ position: 'absolute', left: 14, top: 15 }} /><input autoFocus className="input" style={{ paddingLeft: 40, borderRadius: 999 }} placeholder="Buscar em todo o ateliê" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="lista">
        {rs.map((r) => (
          <button key={r.tipo + r.id} className="row" style={{ background: 'none', border: 0, borderBottom: '1px solid var(--line)', textAlign: 'left', width: '100%' }} onClick={() => onPick(r)}>
            <div className="mini">{r.foto ? <Foto id={r.foto} /> : <Link2 size={18} strokeWidth={1.3} />}</div>
            <div><div className="t" style={{ fontSize: 18 }}>{r.titulo}</div><div className="s">{ROTULO[r.tipo]} · {r.sub}</div></div>
            <Plus size={16} />
          </button>
        ))}
        {rs.length === 0 && <p className="faint">Nada encontrado.</p>}
      </div>
    </Sheet>
  )
}
