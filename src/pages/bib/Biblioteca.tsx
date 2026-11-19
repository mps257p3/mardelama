import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { BookOpen, FileText, Link2, Plus, Search, Video, Heart } from 'lucide-react'
import { db } from '../../db/schema'
import { CATEGORIAS_BIB } from '../../lib/biblioteca'
import { normaliza, textoBusca } from '../../lib/filtros'

const ICONE = { texto: BookOpen, link: Link2, arquivo: FileText, livro: BookOpen, artigo: FileText, video: Video }
const semHtml = (h?: string) => (h ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

export default function Biblioteca() {
  const itens = useLiveQuery(async () => (await db.conteudos.orderBy('atualizadoEm').reverse().toArray()).filter((x) => !x.excluido))
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<string>()
  const [fav, setFav] = useState(false)
  const lista = useMemo(() => (itens ?? []).filter((c) => (!cat || c.categoria === cat) && (!fav || c.favorito) &&
    (!q || textoBusca(c.titulo, c.autor, c.tags, semHtml(c.corpo), c.url).includes(normaliza(q)))), [itens, q, cat, fav])
  const porCat = useMemo(() => { const m = new Map<string, number>(); (itens ?? []).forEach((c) => m.set(c.categoria, (m.get(c.categoria) ?? 0) + 1)); return m }, [itens])

  return (
    <div className="page">
      <div className="head">
        <div><p className="eyebrow">Conhecimento</p><h1 style={{ marginTop: 8 }}>Biblioteca</h1></div>
        <div className="acts"><Link className="btn primary" to="/biblioteca/novo"><Plus size={16} />Novo conteúdo</Link></div>
      </div>
      <div className="toolbar">
        <div className="search"><Search size={16} /><input className="input" placeholder="Buscar em títulos, textos, autores, tags…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <button className={'chip' + (fav ? ' on' : '')} onClick={() => setFav(!fav)}><Heart size={13} />Favoritos</button>
      </div>
      <div className="chips" style={{ flexWrap: 'wrap', marginBottom: 24 }}>
        <button className={'chip' + (!cat ? ' on' : '')} onClick={() => setCat(undefined)}>Tudo</button>
        {CATEGORIAS_BIB.map((c) => <button key={c} className={'chip' + (cat === c ? ' on' : '')} onClick={() => setCat(cat === c ? undefined : c)}>{c}{porCat.get(c) ? <span style={{ opacity: .6 }}>{porCat.get(c)}</span> : null}</button>)}
      </div>
      <div className="lista">
        {lista.map((c) => { const I = ICONE[c.formato] ?? BookOpen; return (
          <Link key={c.id} to={`/biblioteca/${c.id}`}>
            <div className="mini"><I size={20} strokeWidth={1.2} /></div>
            <div><div className="t">{c.titulo}</div><div className="s">{[c.categoria, c.autor].filter(Boolean).join(' · ')}</div>
              {c.corpo && <div className="s" style={{ marginTop: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{semHtml(c.corpo).slice(0, 220)}</div>}</div>
            <div className="r">{c.arquivos.length ? `${c.arquivos.length} arq.` : ''}</div>
          </Link>) })}
        {itens && lista.length === 0 && <div className="empty"><span className="serif">Nada por aqui ainda.</span><span>Guarde técnicas, estudos, links, livros, vídeos e PDFs.</span></div>}
      </div>
    </div>
  )
}
