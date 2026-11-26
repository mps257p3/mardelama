import { Voltar } from '../../ui/Voltar'
import { useState } from 'react'

import { Check, Merge, Pencil, Plus, Trash2, X } from 'lucide-react'
import { db, novo } from '../../db/schema'
import { excluir, useGrupos, useReferencias } from '../../db/hooks'
import { Sheet } from '../../ui/Sheet'
import { useToast } from '../../ui/toast'

export default function Grupos() {
  const grupos = useGrupos()
  const refs = useReferencias()
  const toast = useToast()
  const [novoG, setNovoG] = useState('')
  const [edit, setEdit] = useState<{ id: string; nome: string }>()
  const [fundir, setFundir] = useState<string>()
  const conta = (id: string) => (refs ?? []).filter((r) => r.grupos.includes(id)).length

  async function combinar(origem: string, destino: string) {
    const rs = await db.referencias.where('grupos').equals(origem).toArray()
    await Promise.all(rs.map((r) => db.referencias.update(r.id, { grupos: [...new Set(r.grupos.map((g) => (g === origem ? destino : g)))], atualizadoEm: Date.now() })))
    await excluir('grupos', origem)
    setFundir(undefined); toast('Grupos combinados')
  }

  return (
    <div className="page" style={{ maxWidth: 720 }}>
      <Voltar to="/referencias/grupos">Grupos</Voltar>
      <h1>Gerenciar grupos</h1>
      <p className="muted" style={{ marginTop: 10 }}>Grupos não são pastas: uma referência pode estar em quantos grupos você quiser, sem duplicar nada.</p>
      <form style={{ display: 'flex', gap: 8, margin: '24px 0' }} onSubmit={async (e) => { e.preventDefault(); if (novoG.trim()) { await db.grupos.add(novo({ nome: novoG.trim() })); setNovoG('') } }}>
        <input className="input" placeholder="Novo grupo" value={novoG} onChange={(e) => setNovoG(e.target.value)} />
        <button className="btn primary"><Plus size={15} />Criar</button>
      </form>
      <div className="lista">
        {grupos.map((g) => (
          <div key={g.id} className="row" style={{ gridTemplateColumns: '1fr auto' }}>
            {edit?.id === g.id ? (
              <form style={{ display: 'flex', gap: 6 }} onSubmit={async (e) => { e.preventDefault(); await db.grupos.update(g.id, { nome: edit.nome, atualizadoEm: Date.now() }); setEdit(undefined) }}>
                <input autoFocus className="input" value={edit.nome} onChange={(e) => setEdit({ ...edit, nome: e.target.value })} />
                <button className="iconbtn" aria-label="Salvar"><Check size={16} /></button>
                <button type="button" className="iconbtn" aria-label="Cancelar" onClick={() => setEdit(undefined)}><X size={16} /></button>
              </form>
            ) : <div><div className="t">{g.nome}</div><div className="s">{conta(g.id)} referências</div></div>}
            <div style={{ display: 'flex' }}>
              <button className="iconbtn" aria-label="Renomear" onClick={() => setEdit({ id: g.id, nome: g.nome })}><Pencil size={15} /></button>
              <button className="iconbtn" aria-label="Combinar com outro grupo" onClick={() => setFundir(g.id)}><Merge size={15} /></button>
              <button className="iconbtn" aria-label="Excluir" onClick={async () => {
                if (!confirm(`Excluir o grupo "${g.nome}"? As referências continuam existindo.`)) return
                const rs = await db.referencias.where('grupos').equals(g.id).toArray()
                await Promise.all(rs.map((r) => db.referencias.update(r.id, { grupos: r.grupos.filter((x) => x !== g.id) })))
                await excluir('grupos', g.id)
              }}><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
      </div>
      {fundir && <Sheet label="Combinar grupos" onClose={() => setFundir(undefined)}>
        <h3>Combinar "{grupos.find((g) => g.id === fundir)?.nome}" com…</h3>
        <p className="muted" style={{ margin: '8px 0 14px' }}>As referências passam para o grupo escolhido e este grupo deixa de existir.</p>
        <div className="chips" style={{ flexWrap: 'wrap' }}>{grupos.filter((g) => g.id !== fundir).map((g) => <button key={g.id} className="chip" onClick={() => combinar(fundir, g.id)}>{g.nome}</button>)}</div>
      </Sheet>}
    </div>
  )
}
