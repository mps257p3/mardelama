import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, ExternalLink, Plus, Trash2 } from 'lucide-react'
import { db, novo, type Compra, type Fornecedor } from '../../db/schema'
import { brl, fmt } from '../../lib/opcoes'
import { Numero } from '../../ui/form'
import { useToast } from '../../ui/toast'

const vivos = <T extends { excluido?: 0 | 1 }>(xs: T[]) => xs.filter((x) => !x.excluido)
type Filtro = 'planejada' | 'comprada' | 'todas'

export default function Compras() {
  const toast = useToast()
  const compras = useLiveQuery(async () => vivos(await db.compras.toArray()), [], [])
  const fornecedores = useLiveQuery(async () => vivos(await db.fornecedores.toArray()).sort((a, b) => a.nome.localeCompare(b.nome)), [], [])
  const materiais = useLiveQuery(async () => new Map(vivos(await db.materiais.toArray()).map((m) => [m.id, m])), [], new Map())
  const [filtro, setFiltro] = useState<Filtro>('planejada')
  const [nova, setNova] = useState({ nome: '', categoria: '', quantidade: '' })

  const grupos = useMemo(() => {
    const m = new Map<string, Compra[]>()
    for (const c of compras.filter((c) => filtro === 'todas' || c.status === filtro).sort((a, b) => a.nome.localeCompare(b.nome))) m.set(c.categoria, [...(m.get(c.categoria) ?? []), c])
    return [...m.entries()].sort(([a], [b]) => (a === 'Equipamentos' ? 1 : b === 'Equipamentos' ? -1 : a.localeCompare(b)))
  }, [compras, filtro])
  const total = (s: Compra['status']) => compras.filter((c) => c.status === s).reduce((t, c) => t + (c.valorEstimado ?? 0), 0)
  const salvar = (c: Compra, d: Partial<Compra>) => db.compras.update(c.id, { ...d, atualizadoEm: Date.now() })

  async function alternar(c: Compra) {
    if (c.status === 'comprada') return salvar(c, { status: 'planejada' })
    await salvar(c, { status: 'comprada' })
    const m = c.materialId ? materiais.get(c.materialId) : undefined
    if (m && c.qtdKg && confirm(`Adicionar ${fmt(c.qtdKg, 2)} kg ao estoque de ${m.nome}?`)) {
      await db.materiais.update(m.id, { estoqueKg: (m.estoqueKg ?? 0) + c.qtdKg, atualizadoEm: Date.now() })
      toast(`Estoque de ${m.nome}: ${fmt((m.estoqueKg ?? 0) + c.qtdKg, 2)} kg`)
    }
  }

  return (
    <div className="page" style={{ maxWidth: 860 }}>
      <Link to="/laboratorio" className="back"><ArrowLeft size={15} />Esmaltaria</Link>
      <h1>Compras e fornecedores</h1>
      <p className="muted" style={{ marginTop: 10 }}>Lista planejada com valores estimados. Os preços mudam: confira no fornecedor antes de comprar.</p>
      <p style={{ marginTop: 14, fontSize: 14.5 }}>A comprar: <b>{brl(total('planejada'))}</b> <span className="faint">· já comprado: {brl(total('comprada'))}</span></p>

      <div className="chips" style={{ marginTop: 16 }}>
        {([['planejada', 'A comprar'], ['comprada', 'Compradas'], ['todas', 'Todas']] as const).map(([v, l]) => <button key={v} type="button" className={'chip' + (filtro === v ? ' on' : '')} onClick={() => setFiltro(v)}>{l}</button>)}
      </div>

      {grupos.map(([cat, itens]) => (
        <section key={cat} style={{ marginTop: 24 }}>
          <h3>{cat} <span className="faint" style={{ fontSize: 14 }}>{brl(itens.reduce((t, c) => t + (c.valorEstimado ?? 0), 0))}</span></h3>
          <div className="lista" style={{ marginTop: 6 }}>
            {itens.map((c) => (
              <div key={c.id} className="row" style={{ gridTemplateColumns: '32px 1fr 84px', alignItems: 'center' }}>
                <input type="checkbox" checked={c.status === 'comprada'} onChange={() => alternar(c)} aria-label={`Marcar ${c.nome} como comprado`} style={{ width: 22, height: 22 }} />
                <div style={{ minWidth: 0 }}>
                  <div className="t" style={{ textDecoration: c.status === 'comprada' ? 'line-through' : undefined }}>
                    {c.materialId && materiais.get(c.materialId) ? <Link to={`/materiais/${c.materialId}`}>{c.nome}</Link> : c.nome}
                  </div>
                  <div className="s" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span>{c.quantidade}</span>
                    <select value={c.fornecedorId ?? ''} onChange={(e) => salvar(c, { fornecedorId: e.target.value || undefined })} aria-label={`Fornecedor de ${c.nome}`} style={{ border: 0, background: 'none', color: 'var(--ink-2)', fontSize: 12.5, padding: 0, maxWidth: 170 }}>
                      <option value="">fornecedor…</option>
                      {fornecedores.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
                    </select>
                    {c.link && <a href={c.link} target="_blank" rel="noreferrer" aria-label="Abrir produto"><ExternalLink size={13} /></a>}
                  </div>
                </div>
                <Numero value={c.valorEstimado} onChange={(v) => salvar(c, { valorEstimado: v })} aria-label={`Valor estimado de ${c.nome}`} placeholder="R$" />
              </div>
            ))}
          </div>
        </section>
      ))}
      {!grupos.length && <p className="faint" style={{ marginTop: 20 }}>Nada aqui.</p>}

      <form style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, marginTop: 24 }} onSubmit={async (e) => {
        e.preventDefault(); if (!nova.nome.trim()) return
        await db.compras.add(novo({ nome: nova.nome.trim(), categoria: nova.categoria.trim() || 'Outros', quantidade: nova.quantidade.trim() || '1', status: 'planejada' as const }))
        setNova({ nome: '', categoria: nova.categoria, quantidade: '' }); setFiltro('planejada')
      }}>
        <h3>Adicionar à lista</h3>
        <input className="input" placeholder="O que comprar" value={nova.nome} onChange={(e) => setNova({ ...nova, nome: e.target.value })} />
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="input" placeholder="Quantidade" value={nova.quantidade} onChange={(e) => setNova({ ...nova, quantidade: e.target.value })} />
          <input className="input" list="cats-compra" placeholder="Categoria" value={nova.categoria} onChange={(e) => setNova({ ...nova, categoria: e.target.value })} />
          <datalist id="cats-compra">{[...new Set(compras.map((c) => c.categoria))].map((c) => <option key={c} value={c} />)}</datalist>
        </div>
        <div><button className="btn sm primary"><Plus size={14} />Adicionar</button></div>
      </form>

      <h2 style={{ marginTop: 40 }}>Fornecedores</h2>
      <div className="lista" style={{ marginTop: 8 }}>
        {fornecedores.map((f) => <LinhaFornecedor key={f.id} f={f} n={compras.filter((c) => c.fornecedorId === f.id && c.status === 'planejada').length} />)}
      </div>
      <button type="button" className="btn sm" style={{ marginTop: 12 }} onClick={async () => { const nome = prompt('Nome do fornecedor'); if (nome?.trim()) await db.fornecedores.add(novo({ nome: nome.trim() })) }}><Plus size={14} />Fornecedor</button>
    </div>
  )
}

function LinhaFornecedor({ f, n }: { f: Fornecedor; n: number }) {
  const salvar = (d: Partial<Fornecedor>) => db.fornecedores.update(f.id, { ...d, atualizadoEm: Date.now() })
  return (
    <div className="row" style={{ gridTemplateColumns: '1fr auto', alignItems: 'center' }}>
      <div style={{ minWidth: 0 }}>
        <div className="t">{f.url ? <a href={f.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>{f.nome}</a> : f.nome}</div>
        <div className="s" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span>Consultado em</span>
          <input type="date" value={f.ultimaConsulta ?? ''} onChange={(e) => salvar({ ultimaConsulta: e.target.value || undefined })} aria-label={`Data da última consulta a ${f.nome}`} style={{ border: 0, background: 'none', color: 'var(--ink-2)', fontSize: 12.5, padding: 0 }} />
          {n > 0 && <span>· {n} {n === 1 ? 'item' : 'itens'} a comprar</span>}
        </div>
      </div>
      <button type="button" className="iconbtn" aria-label={`Excluir ${f.nome}`} onClick={() => { if (confirm(`Excluir o fornecedor ${f.nome}?`)) salvar({ excluido: 1 }) }}><Trash2 size={15} /></button>
    </div>
  )
}
