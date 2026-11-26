import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Check, Plus } from 'lucide-react'
import { db, novo, uid } from '../../db/schema'
import { useGrupos, usePaineis } from '../../db/hooks'
import { Sheet } from '../../ui/Sheet'
import { useToast } from '../../ui/toast'

/** Marca/desmarca grupos para uma ou várias referências (sem duplicar arquivos). */
export function EscolherGrupos({ ids, onClose }: { ids: string[]; onClose: () => void }) {
  const grupos = useGrupos()
  const refs = useLiveQuery(() => db.referencias.bulkGet(ids), [ids.join()], [])
  const [novoG, setNovoG] = useState('')
  const toast = useToast()
  const vivos = refs.filter(Boolean) as NonNullable<(typeof refs)[number]>[]
  const estado = (g: string) => { const n = vivos.filter((r) => r.grupos.includes(g)).length; return n === 0 ? 0 : n === vivos.length ? 2 : 1 }
  async function alternar(g: string) {
    const tirar = estado(g) === 2
    await Promise.all(vivos.map((r) => db.referencias.update(r.id, { grupos: tirar ? r.grupos.filter((x) => x !== g) : [...new Set([...r.grupos, g])], atualizadoEm: Date.now() })))
  }
  return <Sheet label="Grupos" alto onClose={onClose}>
    <h3>{ids.length > 1 ? `Grupos de ${ids.length} referências` : 'Grupos'}</h3>
    <p className="faint" style={{ fontSize: 13, margin: '4px 0 14px' }}>Uma referência pode estar em vários grupos ao mesmo tempo.</p>
    <div className="chips" style={{ flexWrap: 'wrap' }}>
      {grupos.map((g) => { const e = estado(g.id); return <button key={g.id} className={'chip' + (e === 2 ? ' on' : '')} style={e === 1 ? { borderStyle: 'dashed', color: 'var(--ink)' } : undefined} onClick={() => alternar(g.id)}>{e === 2 && <Check size={13} />}{g.nome}</button> })}
    </div>
    <form style={{ display: 'flex', gap: 8, marginTop: 16 }} onSubmit={async (e) => {
      e.preventDefault(); const nome = novoG.trim(); if (!nome) return
      const g = novo({ nome }); await db.grupos.add(g); setNovoG('')
      await Promise.all(vivos.map((r) => db.referencias.update(r.id, { grupos: [...new Set([...r.grupos, g.id])], atualizadoEm: Date.now() })))
      toast(`Grupo "${nome}" criado`)
    }}>
      <input className="input" placeholder="Novo grupo" value={novoG} onChange={(e) => setNovoG(e.target.value)} />
      <button className="btn sm primary"><Plus size={14} />Criar</button>
    </form>
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}><button className="btn sm" onClick={onClose}>Pronto</button></div>
  </Sheet>
}

/** Leva uma ou várias referências a um painel. */
export function EscolherPainel({ ids, onClose }: { ids: string[]; onClose: () => void }) {
  const paineis = usePaineis()
  const toast = useToast()
  async function levar(pid: string) {
    const p = await db.paineis.get(pid); if (!p) return
    let z = Math.max(0, ...p.itens.map((i) => i.z))
    const itens = ids.map((refId, k) => { z++; return { id: uid(), tipo: 'referencia' as const, refId, x: 80 + ((z + k) % 6) * 60, y: 80 + ((z + k) % 5) * 50, w: 320, h: 380, z } })
    await db.paineis.update(pid, { itens: [...p.itens, ...itens], atualizadoEm: Date.now() })
    toast(`${ids.length > 1 ? ids.length + ' referências levadas' : 'Levada'} a "${p.nome}"`); onClose()
  }
  return <Sheet label="Levar a um painel" alto onClose={onClose}>
    <h3>Levar a um painel</h3>
    <div className="lista" style={{ marginTop: 10 }}>
      {(paineis ?? []).map((p) => (
        <button key={p.id} className="row" style={{ gridTemplateColumns: '1fr auto', background: 'none', border: 0, borderBottom: '1px solid var(--line)', width: '100%', textAlign: 'left' }} onClick={() => levar(p.id)}>
          <span className="t" style={{ fontSize: 17 }}>{p.nome}</span><span className="faint">{p.itens.length} itens</span>
        </button>
      ))}
    </div>
    <button className="btn sm" style={{ marginTop: 14 }} onClick={async () => { const p = novo({ nome: 'Novo painel', itens: [] }); await db.paineis.add(p); await levar(p.id) }}><Plus size={14} />Novo painel com {ids.length > 1 ? 'elas' : 'ela'}</button>
    {!paineis?.length && <p className="faint" style={{ marginTop: 10 }}>Ou veja os <Link to="/paineis" style={{ textDecoration: 'underline' }}>painéis</Link>.</p>}
  </Sheet>
}

/**
 * Leva referências para uma obra que vai acontecer (Minhas obras). Uma obra pode juntar várias referências;
 * a ligação fica em Conexões e aparece em "Referências" na página da obra.
 */
export function EscolherObra({ ids, onClose }: { ids: string[]; onClose: () => void }) {
  const toast = useToast()
  const [nome, setNome] = useState('')
  const pecas = useLiveQuery(async () => (await db.entrada.toArray())
    .filter((p) => !p.excluido && p.etapa !== 'pronta')
    .sort((a, b) => (a.etapa === 'ideia' ? 0 : 1) - (b.etapa === 'ideia' ? 0 : 1) || b.atualizadoEm - a.atualizadoEm), [], [])
  async function levar(pid: string, titulo: string) {
    const ja = await db.relacoes.where('[bTipo+bId]').equals(['entrada', pid]).toArray()
    const novos = ids.filter((rid) => !ja.some((x) => !x.excluido && x.aTipo === 'referencia' && x.aId === rid))
    const agora = Date.now()
    await db.relacoes.bulkAdd(novos.map((rid) => ({ id: uid(), aTipo: 'referencia' as const, aId: rid, bTipo: 'entrada' as const, bId: pid, criadoEm: agora, atualizadoEm: agora, excluido: 0 as const })))
    await db.entrada.update(pid, { atualizadoEm: agora })
    toast(`Levada a "${titulo || 'obra sem título'}". Está em Minhas obras.`)
    onClose()
  }
  async function criar() {
    const titulo = nome.trim(); if (!titulo) return
    const { novaPeca } = await import('../obras/comum')
    await levar(await novaPeca({ titulo }), titulo)
  }
  return <Sheet label="Levar a uma obra" alto onClose={onClose}>
    <h3>Levar a uma obra</h3>
    <p className="faint" style={{ fontSize: 13.5, marginTop: 4 }}>Junte referências para uma peça que ainda vai acontecer. Uma obra pode ter várias.</p>
    <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
      <input className="input" placeholder="Nova obra (ex.: Vaso de muitas bocas)" value={nome} onChange={(e) => setNome(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void criar() }} />
      <button className="btn primary" disabled={!nome.trim()} onClick={criar}><Plus size={15} />Criar</button>
    </div>
    {pecas.length > 0 && <p className="eyebrow" style={{ marginTop: 18 }}>Obras em andamento</p>}
    <div className="lista" style={{ marginTop: 6 }}>
      {pecas.map((p) => (
        <button key={p.id} className="row" style={{ gridTemplateColumns: '1fr auto', background: 'none', border: 0, borderBottom: '1px solid var(--line)', width: '100%', textAlign: 'left' }} onClick={() => levar(p.id, p.titulo)}>
          <span className="t" style={{ fontSize: 17 }}>{p.titulo || 'Sem título'}</span><span className="faint">{p.etapa === 'ideia' ? 'Ideia' : 'Em processo'}</span>
        </button>
      ))}
    </div>
  </Sheet>
}
