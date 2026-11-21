import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { FolderHeart, Heart, LayoutGrid, List, Plus, Search, SlidersHorizontal, X } from 'lucide-react'
import { db, type Artista, type Obra } from '../../../db/schema'
import { secaoPorSlug } from '../../../lib/biblioteca'
import { FILTROS, valoresFiltro, vivos, type ChaveFiltro } from '../../../lib/artistas'
import { normaliza, textoBusca } from '../../../lib/filtros'
import { useAjuste, definirAjuste } from '../../../db/settings'
import { Menu } from '../../../ui/Menu'
import { Sheet } from '../../../ui/Sheet'
import { HeroSecao } from '../SecaoBiblioteca'
import { ImgObra } from './ImgObra'

type Filtros = Partial<Record<ChaveFiltro, string>>

export function obraDeCapa(a: Artista, obras: Obra[]) {
  const minhas = obras.filter((o) => o.artistaId === a.id)
  return minhas.find((o) => o.id === a.capa) ?? minhas.find((o) => o.arquivo || o.imagem)
}

function CardArtista({ a, capa, lista }: { a: Artista; capa?: Obra; lista: boolean }) {
  return (
    <Link to={`/biblioteca/artistas/${a.id}`} className={lista ? 'art-linha' : 'art-card'}>
      <span className="ph"><ImgObra o={capa} alt={capa?.titulo ?? a.nome} /></span>
      <span className="txt">
        <span className="nome">{a.nome}{a.favorito ? <Heart size={13} fill="currentColor" className="fav" aria-label="Favorito" /> : null}</span>
        <span className="pais">{a.pais.join(' / ') || 'País não documentado'}</span>
        {a.caracteristicas.length > 0 && <span className="tracos">{a.caracteristicas.slice(0, lista ? 3 : 2).join(' · ')}</span>}
      </span>
    </Link>
  )
}

export default function Artistas() {
  const s = secaoPorSlug('artistas')!
  const artistas = useLiveQuery(async () => vivos(await db.artistas.toArray()), [], undefined)
  const obras = useLiveQuery(async () => vivos(await db.obras.toArray()), [], [])
  const lista = useAjuste<boolean>('artistas.lista', false)
  const [q, setQ] = useState('')
  const [f, setF] = useState<Filtros>({})
  const [fav, setFav] = useState(false)
  const [painel, setPainel] = useState(false)

  const ordenados = useMemo(() => [...(artistas ?? [])].sort((a, b) => (a.origem === 'curadoria' && b.origem === 'curadoria' ? a.criadoEm - b.criadoEm : b.criadoEm - a.criadoEm)), [artistas])
  const vis = useMemo(() => ordenados.filter((a) => (!fav || a.favorito) &&
    (!q || textoBusca(a.nome, a.nomeOriginal, a.especialidade, a.tags, a.caracteristicas).includes(normaliza(q))) &&
    FILTROS.every(({ k }) => !f[k] || ((a[k] as string[]) ?? []).includes(f[k]!))), [ordenados, q, f, fav])
  const ativos = Object.entries(f).filter(([, v]) => v) as [ChaveFiltro, string][]

  return (
    <div className="page bib">
      <HeroSecao s={s} />
      <div className="toolbar" style={{ marginTop: 18 }}>
        <div className="search"><Search size={16} /><input className="input" placeholder="Buscar artista" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <button className={'iconbtn' + (painel || ativos.length ? ' on' : '')} aria-label="Filtros" onClick={() => setPainel(true)}><SlidersHorizontal size={18} /></button>
        <button className="iconbtn" aria-label={lista ? 'Ver em grade' : 'Ver em lista'} onClick={() => definirAjuste('artistas.lista', !lista)}>{lista ? <LayoutGrid size={18} /> : <List size={18} />}</button>
        <Menu itens={[
          { l: 'Adicionar artista', icon: <Plus size={16} />, to: '/biblioteca/artistas/novo' },
          { l: 'Só favoritos', icon: <Heart size={16} />, on: fav, onClick: () => setFav(!fav) },
          { l: 'Coleções pessoais', icon: <FolderHeart size={16} />, to: '/biblioteca/colecoes' },
        ]} />
      </div>
      {(ativos.length > 0 || fav) && <div className="chips" style={{ marginBottom: 12 }}>
        {fav && <button className="chip on" onClick={() => setFav(false)}><Heart size={12} />Favoritos <X size={12} /></button>}
        {ativos.map(([k, v]) => <button key={k} className="chip on" onClick={() => setF({ ...f, [k]: undefined })}>{v} <X size={12} /></button>)}
      </div>}

      {artistas && artistas.length === 0 && <div className="empty"><span className="serif">Preparando o catálogo…</span><span>Os perfis iniciais aparecem em instantes.</span></div>}
      <div className={lista ? 'art-lista' : 'art-feed'}>
        {vis.map((a) => <CardArtista key={a.id} a={a} capa={obraDeCapa(a, obras)} lista={lista} />)}
      </div>
      {artistas && artistas.length > 0 && vis.length === 0 && <p className="muted" style={{ marginTop: 16 }}>Nenhum artista com esses filtros.</p>}
      <Link to="/biblioteca/artistas/novo" className="art-add"><Plus size={16} />Adicionar artista</Link>

      {painel && <Sheet onClose={() => setPainel(false)} label="Filtros" alto>
        <div className="section-head"><h3>Filtrar artistas</h3>{ativos.length > 0 && <button className="btn sm ghost" onClick={() => setF({})}>Limpar</button>}</div>
        {FILTROS.map(({ k, l }) => { const vs = valoresFiltro(artistas ?? [], k); return vs.length ? (
          <div key={k} style={{ marginTop: 14 }}>
            <p className="eyebrow" style={{ marginBottom: 8 }}>{l}</p>
            <div className="chips" style={{ flexWrap: 'wrap' }}>{vs.map(([v, n]) => <button key={v} className={'chip' + (f[k] === v ? ' on' : '')} onClick={() => setF({ ...f, [k]: f[k] === v ? undefined : v })}>{v}<span style={{ opacity: .55 }}>{n}</span></button>)}</div>
          </div>) : null })}
        <button className="btn primary" style={{ width: '100%', marginTop: 20 }} onClick={() => setPainel(false)}>Ver {vis.length} {vis.length === 1 ? 'artista' : 'artistas'}</button>
      </Sheet>}
    </div>
  )
}
