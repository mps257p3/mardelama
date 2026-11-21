import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, ExternalLink, Heart, Pencil, Trash2 } from 'lucide-react'
import { db } from '../../db/schema'
import { alternarFavorito, excluir } from '../../db/hooks'
import { Prosa } from '../../ui/rich'
import { ArquivoLink } from '../../ui/arquivos'
import { Relacoes } from '../../ui/Relacoes'
import { secaoDaCategoria } from '../../lib/biblioteca'

export default function ConteudoDetalhe() {
  const { id } = useParams()
  const nav = useNavigate()
  const c = useLiveQuery(() => db.conteudos.get(id!), [id])
  if (c === undefined) return null
  if (!c || c.excluido) return <div className="page"><p>Conteúdo não encontrado.</p></div>
  return (
    <div className="page">
      <Link to={`/biblioteca/${secaoDaCategoria(c.categoria).slug}`} className="back"><ArrowLeft size={15} />{secaoDaCategoria(c.categoria).nome}</Link>
      <div className="detalhe" style={{ gridTemplateColumns: undefined }}>
        <article className="leitura">
          <p className="eyebrow">{c.categoria}</p>
          <h1 style={{ marginTop: 8 }}>{c.titulo}</h1>
          {c.autor && <p className="serif" style={{ fontSize: 20, fontStyle: 'italic', marginTop: 8 }}>{c.autor}</p>}
          <div style={{ display: 'flex', gap: 8, margin: '20px 0 28px', flexWrap: 'wrap' }}>
            <Link className="btn sm primary" to={`/biblioteca/${c.id}/editar`}><Pencil size={14} />Editar</Link>
            <button className="btn sm" onClick={() => alternarFavorito('conteudos', c.id, c.favorito)}><Heart size={14} fill={c.favorito ? 'currentColor' : 'none'} />{c.favorito ? 'Favorito' : 'Favoritar'}</button>
            {c.url && <a className="btn sm" href={c.url} target="_blank" rel="noreferrer"><ExternalLink size={14} />Abrir link</a>}
            <button className="btn sm ghost" onClick={async () => { if (confirm('Excluir este conteúdo?')) { await excluir('conteudos', c.id); nav('/biblioteca') } }}><Trash2 size={14} />Excluir</button>
          </div>
          {c.corpo && <Prosa html={c.corpo} />}
          {c.arquivos.length > 0 && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 20 }}>{c.arquivos.map((a) => <ArquivoLink key={a} id={a} />)}</div>}
          {c.tags.length > 0 && <div className="pills" style={{ marginTop: 20 }}>{c.tags.map((t) => <span key={t} className="chip">#{t}</span>)}</div>}
        </article>
        <aside><Relacoes tipo="conteudo" id={c.id} /></aside>
      </div>
    </div>
  )
}
