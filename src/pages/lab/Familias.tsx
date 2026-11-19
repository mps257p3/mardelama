import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { db, novo } from '../../db/schema'
import { excluir, useFamilias } from '../../db/hooks'

export default function Familias() {
  const familias = useFamilias()
  const contagem = useLiveQuery(async () => {
    const m = new Map<string, number>()
    for (const e of await db.esmaltes.toArray()) if (!e.excluido) e.familias.forEach((f) => m.set(f, (m.get(f) ?? 0) + 1))
    return m
  }, [], new Map())
  const [novaF, setNovaF] = useState('')
  const [edit, setEdit] = useState<{ id: string; nome: string }>()

  return (
    <div className="page" style={{ maxWidth: 720 }}>
      <Link to="/esmaltes" className="back"><ArrowLeft size={15} />Esmaltes</Link>
      <h1>Famílias de esmaltes</h1>
      <p className="muted" style={{ marginTop: 10 }}>Um esmalte pode pertencer a várias famílias ao mesmo tempo.</p>
      <form style={{ display: 'flex', gap: 8, margin: '24px 0' }} onSubmit={async (ev) => {
        ev.preventDefault(); if (!novaF.trim()) return
        await db.familias.add(novo({ nome: novaF.trim(), ordem: familias.length })); setNovaF('')
      }}>
        <input className="input" placeholder="Nova família" value={novaF} onChange={(e) => setNovaF(e.target.value)} />
        <button className="btn primary"><Plus size={15} />Criar</button>
      </form>
      <div className="lista">
        {familias.map((f) => (
          <div key={f.id} className="row" style={{ gridTemplateColumns: '1fr auto' }}>
            {edit?.id === f.id ? (
              <form style={{ display: 'flex', gap: 6 }} onSubmit={async (ev) => { ev.preventDefault(); await db.familias.update(f.id, { nome: edit.nome, atualizadoEm: Date.now() }); setEdit(undefined) }}>
                <input autoFocus className="input" value={edit.nome} onChange={(e) => setEdit({ ...edit, nome: e.target.value })} />
                <button className="iconbtn" aria-label="Salvar"><Check size={16} /></button>
                <button type="button" className="iconbtn" aria-label="Cancelar" onClick={() => setEdit(undefined)}><X size={16} /></button>
              </form>
            ) : <div><div className="t">{f.nome}</div><div className="s">{contagem.get(f.id) ?? 0} esmaltes</div></div>}
            <div style={{ display: 'flex' }}>
              <button className="iconbtn" aria-label="Renomear" onClick={() => setEdit({ id: f.id, nome: f.nome })}><Pencil size={15} /></button>
              <button className="iconbtn" aria-label="Excluir" onClick={async () => {
                if (!confirm(`Excluir a família "${f.nome}"? Os esmaltes continuam existindo.`)) return
                await excluir('familias', f.id)
                const es = await db.esmaltes.where('familias').equals(f.id).toArray()
                await Promise.all(es.map((e) => db.esmaltes.update(e.id, { familias: e.familias.filter((x) => x !== f.id) })))
              }}><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
