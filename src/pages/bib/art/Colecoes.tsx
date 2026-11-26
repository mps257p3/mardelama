import { Voltar } from '../../../ui/Voltar'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Check, FolderHeart, Plus, Trash2, X } from 'lucide-react'
import { db, novo, type Colecao, type Tipo } from '../../../db/schema'
import { excluir } from '../../../db/hooks'
import { resumo, ROTULO, type Resumo } from '../../../lib/entidades'
import { vivos } from '../../../lib/artistas'
import { Sheet } from '../../../ui/Sheet'
import { Foto } from '../../../ui/form'
import { TextoEditavel } from '../../../ui/editavel'

type Item = { tipo: Tipo; id: string }

/** Escolher (ou criar) uma coleção pessoal para guardar um artista, uma obra ou qualquer item. */
export function AdicionarAColecao({ item, onClose }: { item: Item; onClose: () => void }) {
  const cols = useLiveQuery(async () => vivos(await db.colecoes.orderBy('nome').toArray()), [], [])
  const [nome, setNome] = useState('')
  const tem = (c: Colecao) => c.itens.some((x) => x.tipo === item.tipo && x.id === item.id)
  const alternar = (c: Colecao) => db.colecoes.update(c.id, { itens: tem(c) ? c.itens.filter((x) => !(x.tipo === item.tipo && x.id === item.id)) : [...c.itens, item], atualizadoEm: Date.now() })
  return (
    <Sheet onClose={onClose} label="Coleções">
      <h3>Guardar em coleção</h3>
      <div className="lista" style={{ margin: '12px 0' }}>
        {cols.map((c) => (
          <button key={c.id} className="row" style={{ background: 'none', border: 0, borderBottom: '1px solid var(--line)', width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0' }} onClick={() => alternar(c)}>
            <FolderHeart size={18} strokeWidth={1.4} /><span style={{ flex: 1 }}>{c.nome}<span className="faint" style={{ fontSize: 12 }}> · {c.itens.length}</span></span>{tem(c) && <Check size={16} />}
          </button>
        ))}
        {cols.length === 0 && <p className="faint">Nenhuma coleção ainda.</p>}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input className="input" placeholder="Nova coleção (ex.: Verdes de cobre)" value={nome} onChange={(e) => setNome(e.target.value)} />
        <button className="btn sm primary" disabled={!nome.trim()} onClick={async () => { await db.colecoes.add(novo({ nome: nome.trim(), itens: [item] })); setNome('') }}><Plus size={14} />Criar</button>
      </div>
    </Sheet>
  )
}

export function ColecoesLista() {
  const cols = useLiveQuery(async () => vivos(await db.colecoes.orderBy('nome').toArray()), [], [])
  const nav = useNavigate()
  return (
    <div className="page bib" style={{ maxWidth: 900 }}>
      <Voltar to="/biblioteca/artistas">Artistas</Voltar>
      <h1 className="titulo-pagina">Coleções pessoais</h1>
      <p className="muted" style={{ marginTop: 6 }}>Agrupe artistas, obras, referências e estudos por tema de pesquisa.</p>
      <div className="lista" style={{ marginTop: 18 }}>
        {cols.map((c) => <Link key={c.id} to={`/biblioteca/colecoes/${c.id}`}><div className="mini"><FolderHeart size={20} strokeWidth={1.2} /></div><div><div className="t">{c.nome}</div><div className="s">{c.itens.length} itens{c.descricao ? ` · ${c.descricao}` : ''}</div></div><span /></Link>)}
        {cols.length === 0 && <div className="empty"><span className="serif">Nenhuma coleção ainda.</span><span>No perfil de um artista ou numa obra, use ⋯ › Adicionar à coleção.</span></div>}
      </div>
      <button className="btn" style={{ marginTop: 16 }} onClick={async () => { const nome = prompt('Nome da coleção'); if (nome?.trim()) { const c = novo({ nome: nome.trim(), itens: [] as Item[] }); await db.colecoes.add(c); nav(`/biblioteca/colecoes/${c.id}`) } }}><Plus size={15} />Nova coleção</button>
    </div>
  )
}

export function ColecaoDetalhe() {
  const { id } = useParams()
  const nav = useNavigate()
  const c = useLiveQuery(() => db.colecoes.get(id!), [id])
  const itens = useLiveQuery(async () => c ? (await Promise.all(c.itens.map((x) => resumo(x.tipo, x.id)))).filter(Boolean) as Resumo[] : [], [c], [])
  if (c === undefined) return null
  if (!c || c.excluido) return <div className="page"><p>Coleção não encontrada.</p></div>
  return (
    <div className="page bib" style={{ maxWidth: 1000 }}>
      <Voltar to="/biblioteca/colecoes">Coleções</Voltar>
      <div className="head"><h1 className="titulo-pagina">{c.nome}</h1>
        <button className="iconbtn" aria-label="Excluir coleção" onClick={async () => { if (confirm('Excluir esta coleção? Os itens continuam na Biblioteca.')) { await excluir('colecoes', c.id); nav('/biblioteca/colecoes') } }}><Trash2 size={17} /></button></div>
      <div style={{ margin: '10px 0 18px' }}><TextoEditavel valor={c.descricao} rotulo="descrição" vazio="Sem descrição." onSalvar={(v) => db.colecoes.update(c.id, { descricao: v, atualizadoEm: Date.now() })} /></div>
      <div className="obras-mural">
        {itens.map((r) => (
          <div key={r.tipo + r.id} className="obra-card" style={{ position: 'relative' }}>
            <Link to={r.to} className="ph" style={{ display: 'block' }}>{r.foto ? <Foto id={r.foto} /> : r.fotoUrl ? <img src={r.fotoUrl} alt="" referrerPolicy="no-referrer" loading="lazy" /> : <span className="obra-sem"><FolderHeart size={18} /></span>}</Link>
            <Link to={r.to} className="t">{r.titulo}</Link><span className="s">{ROTULO[r.tipo]} · {r.sub}</span>
            <button className="iconbtn tirar" aria-label="Tirar da coleção" onClick={() => db.colecoes.update(c.id, { itens: c.itens.filter((x) => !(x.tipo === r.tipo && x.id === r.id)), atualizadoEm: Date.now() })}><X size={14} /></button>
          </div>
        ))}
      </div>
      {itens.length === 0 && <p className="faint">Coleção vazia.</p>}
    </div>
  )
}
