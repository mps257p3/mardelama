import { Voltar } from '../../ui/Voltar'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowUpRight, BookOpen, FileText, Heart, Link2, Plus, Search, Video } from 'lucide-react'
import { db } from '../../db/schema'
import { secaoDaCategoria, secaoPorSlug, type SecaoBib } from '../../lib/biblioteca'
import { normaliza, textoBusca } from '../../lib/filtros'
import { Foto } from '../../ui/form'
import { ImgRef, temImagem } from '../ref/ImgRef'
import { CapaImg } from './Biblioteca'

const ICONE = { texto: BookOpen, link: Link2, arquivo: FileText, livro: BookOpen, artigo: FileText, video: Video }
export const semHtml = (h?: string) => (h ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

/** Cabeçalho fotográfico de uma seção da Biblioteca. */
export function HeroSecao({ s, children }: { s: SecaoBib; children?: React.ReactNode }) {
  return (
    <>
      <Voltar to="/biblioteca">Biblioteca</Voltar>
      <figure className="bib-hero">
        <CapaImg s={s} />
        <span className="bib-veu" />
        <figcaption><h1>{s.nome}</h1><p>{s.desc}</p></figcaption>
      </figure>
      {children}
    </>
  )
}

/** Partes do ateliê ligadas a esta seção (o laboratório, o acervo…), com uma amostra visual quando houver fotos. */
function Vitrine({ s }: { s: SecaoBib }) {
  const amostra = useLiveQuery(async () => {
    const vivos = <T extends { excluido?: 0 | 1 }>(xs: T[]) => xs.filter((x) => !x.excluido)
    if (s.slug === 'esmaltes') return vivos(await db.esmaltes.orderBy('atualizadoEm').reverse().toArray()).filter((e) => e.fotos[0]).slice(0, 12).map((e) => ({ id: e.id, to: `/esmaltes/${e.id}`, t: e.nome, foto: e.fotos[0] as string | undefined, el: undefined as React.ReactNode }))
    if (s.slug === 'materiais') return vivos(await db.materiais.orderBy('nome').toArray()).filter((m) => m.fotos?.[0]).slice(0, 12).map((m) => ({ id: m.id, to: `/materiais/${m.id}`, t: m.nome, foto: m.fotos[0] as string | undefined, el: undefined as React.ReactNode }))
    if (s.slug === 'referencias') return vivos(await db.referencias.orderBy('criadoEm').reverse().limit(60).toArray()).filter(temImagem).slice(0, 12).map((r) => ({ id: r.id, to: `/referencias/${r.id}`, t: r.titulo, foto: undefined, el: <ImgRef r={r} /> as React.ReactNode }))
    return []
  }, [s.slug], [])
  if (!s.atalhos.length && !amostra.length) return null
  return (
    <section className="bib-vitrine">
      {s.atalhos.length > 0 && <div className="bib-atalhos">
        {s.atalhos.map((a) => <Link key={a.to} to={a.to} className="bib-atalho"><span className="t">{a.nome}</span><span className="s">{a.desc}</span><ArrowUpRight size={16} strokeWidth={1.4} /></Link>)}
      </div>}
      {amostra.length > 0 && <div className="trilho" style={{ marginTop: 14 }}>
        {amostra.map((p) => <Link key={p.id} to={p.to} className="peca-mini"><span className="ph">{p.foto ? <Foto id={p.foto} /> : p.el}</span><span className="t">{p.t}</span></Link>)}
      </div>}
    </section>
  )
}

export default function SecaoBiblioteca({ slug: slugFixo }: { slug?: string }) {
  const p = useParams()
  const s = secaoPorSlug(slugFixo ?? p.slug)!
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<string>()
  const [fav, setFav] = useState(false)
  const itens = useLiveQuery(async () => (await db.conteudos.orderBy('atualizadoEm').reverse().toArray()).filter((x) => !x.excluido && secaoDaCategoria(x.categoria).slug === s.slug), [s.slug])
  const cats = useMemo(() => { const m = new Map<string, number>(); (itens ?? []).forEach((c) => m.set(c.categoria, (m.get(c.categoria) ?? 0) + 1)); return [...m.entries()] }, [itens])
  const lista = useMemo(() => (itens ?? []).filter((c) => (!cat || c.categoria === cat) && (!fav || c.favorito) &&
    (!q || textoBusca(c.titulo, c.autor, c.tags, semHtml(c.corpo), c.url).includes(normaliza(q)))), [itens, q, cat, fav])
  const catNova = cat ?? s.cats[0]

  return (
    <div className="page bib">
      <HeroSecao s={s} />
      <Vitrine s={s} />
      <div className="secao-head" style={{ marginTop: 28 }}>
        <h2>Estudos e anotações</h2>
        <Link to={`/biblioteca/novo?categoria=${encodeURIComponent(catNova)}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Plus size={14} />Novo</Link>
      </div>
      {(itens?.length ?? 0) > 4 && <div className="toolbar" style={{ marginTop: 4 }}>
        <div className="search"><Search size={16} /><input className="input" placeholder={`Buscar em ${s.nome.toLowerCase()}`} value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <button className={'chip' + (fav ? ' on' : '')} onClick={() => setFav(!fav)}><Heart size={13} />Favoritos</button>
      </div>}
      {cats.length > 1 && <div className="chips" style={{ marginBottom: 12 }}>
        <button className={'chip' + (!cat ? ' on' : '')} onClick={() => setCat(undefined)}>Tudo</button>
        {cats.map(([c, n]) => <button key={c} className={'chip' + (cat === c ? ' on' : '')} onClick={() => setCat(cat === c ? undefined : c)}>{c}<span style={{ opacity: .6 }}>{n}</span></button>)}
      </div>}
      <div className="lista">
        {lista.map((c) => { const I = ICONE[c.formato] ?? BookOpen; return (
          <Link key={c.id} to={`/biblioteca/${c.id}`}>
            <div className="mini"><I size={20} strokeWidth={1.2} /></div>
            <div><div className="t">{c.titulo}</div><div className="s">{[c.categoria, c.autor].filter(Boolean).join(' · ')}</div>
              {c.corpo && <div className="s" style={{ marginTop: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{semHtml(c.corpo).slice(0, 220)}</div>}</div>
            <div className="r">{c.favorito ? <Heart size={13} fill="currentColor" /> : c.arquivos.length ? `${c.arquivos.length} arq.` : ''}</div>
          </Link>) })}
        {itens && lista.length === 0 && <div className="empty"><span className="serif">Nada por aqui ainda.</span><span>Guarde textos, links, livros, vídeos e PDFs sobre {s.nome.toLowerCase()}.</span></div>}
      </div>
    </div>
  )
}
