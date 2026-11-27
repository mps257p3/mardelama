import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useEstadoDaTela } from '../../../ui/memoriaRolagem'
import { BookOpen, FolderHeart, Heart, Trash2, LayoutGrid, List, Pencil, Plus, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react'
import { db, type Artista, type Obra } from '../../../db/schema'
import { secaoPorSlug } from '../../../lib/biblioteca'
import { FILTROS, etiquetasPrincipais, valoresDe, valoresFiltro, vivos, type ChaveFiltro } from '../../../lib/artistas'
import { normaliza, textoBusca } from '../../../lib/filtros'
import { useAjuste, definirAjuste } from '../../../db/settings'
import { Menu } from '../../../ui/Menu'
import { Sheet } from '../../../ui/Sheet'
import { HeroSecao } from '../SecaoBiblioteca'
import { ImgObra } from './ImgObra'
import { estiloRecorte } from '../../../ui/Recorte'
import { PesquisaIA } from './PesquisaIA'
import { alternarFavorito, excluir } from '../../../db/hooks'
import { ignorarSugestao, sugerirArtistas, type SugestaoArtista } from '../../../lib/sugestaoArtistas'

type Filtros = Partial<Record<ChaveFiltro, string>>

export function obraDeCapa(a: Artista, obras: Obra[]) {
  const minhas = obras.filter((o) => o.artistaId === a.id)
  const temImg = (o: Obra) => !!(o.arquivo || o.imagem)
  const escolhida = minhas.find((o) => o.id === a.capa)
  return (escolhida && temImg(escolhida) ? escolhida : undefined) ?? minhas.find(temImg) ?? escolhida
}

function CardArtista({ a, capa, lista, onMenu }: { a: Artista; capa?: Obra; lista: boolean; onMenu: (a: Artista) => void }) {
  const etq = etiquetasPrincipais(a)
  // manter o dedo apertado (ou clique direito) abre as opções do estudo
  const timer = useRef<number | undefined>(undefined)
  const abriu = useRef(false)
  const pos = useRef<[number, number]>([0, 0])
  const parar = () => { clearTimeout(timer.current); timer.current = undefined }
  return (
    <Link to={`/biblioteca/artistas/${a.id}`} className={(lista ? 'art-linha' : 'art-card') + ' segurar'}
      onTouchStart={(e) => { abriu.current = false; pos.current = [e.touches[0].clientX, e.touches[0].clientY]; parar(); timer.current = window.setTimeout(() => { abriu.current = true; navigator.vibrate?.(10); onMenu(a) }, 500) }}
      onTouchMove={(e) => { if (Math.hypot(e.touches[0].clientX - pos.current[0], e.touches[0].clientY - pos.current[1]) > 10) parar() }}
      // depois de abrir as opções, o soltar do dedo não vira clique (não fecha a folha nem abre o estudo)
      onTouchEnd={(e) => { parar(); if (abriu.current) e.preventDefault() }} onTouchCancel={parar}
      onContextMenu={(e) => { e.preventDefault(); if (!abriu.current) { parar(); onMenu(a) } }}
      onClick={(e) => { if (abriu.current) { e.preventDefault(); abriu.current = false } }}>
      <span className="ph"><ImgObra o={capa} alt={capa?.titulo ?? a.nome} style={!lista && capa && capa.id === a.capa ? estiloRecorte(a.capaRecorte) : undefined} /></span>
      <span className="txt">
        <span className="pais">{a.pais.join(' / ') || 'País não documentado'}</span>
        <span className="nome">{a.nome}{a.favorito ? <Heart size={13} fill="currentColor" className="fav" aria-label="Favorito" /> : null}</span>
        {a.linguagem && <span className="ling">{a.linguagem}</span>}
        {etq.length > 0 && <span className="etq">{etq.map((t) => <span key={t}>{t}</span>)}</span>}
      </span>
    </Link>
  )
}

type Ordem = 'alfabetica' | 'recentes' | 'curadoria'
const ORDENS: { v: Ordem; l: string }[] = [{ v: 'curadoria', l: 'Ordem do acervo' }, { v: 'alfabetica', l: 'Alfabética' }, { v: 'recentes', l: 'Incluídos por último' }]

export default function Artistas() {
  const s = secaoPorSlug('artistas')!
  const artistas = useLiveQuery(async () => vivos(await db.artistas.toArray()), [], undefined)
  const obras = useLiveQuery(async () => vivos(await db.obras.toArray()), [], [])
  // estudos antigos guardados como conteúdo da categoria "Artistas" continuam aqui
  const estudos = useLiveQuery(async () => (await db.conteudos.where('categoria').equals('Artistas').toArray()).filter((c) => !c.excluido).sort((a, b) => b.atualizadoEm - a.atualizadoEm), [], [])
  const lista = useAjuste<boolean>('artistas.lista', false)
  const ordem = useAjuste<Ordem>('artistas.ordem', 'curadoria')
  const [q, setQ] = useEstadoDaTela('artistas.q', '')
  const [f, setF] = useEstadoDaTela<Filtros>('artistas.f', {})
  const [fav, setFav] = useEstadoDaTela('artistas.fav', false)
  const [painel, setPainel] = useState(false)
  const [ia, setIa] = useState<false | true | string>(false)
  const [sugestoes, setSugestoes] = useState<SugestaoArtista[]>([])
  const [verSug, setVerSug] = useState(false)
  const [opcoes, setOpcoes] = useState<Artista>()
  const nav = useNavigate()
  useEffect(() => { if (!artistas) return; let vivo = true; sugerirArtistas(artistas).then((x) => vivo && setSugestoes(x)).catch(() => undefined); return () => { vivo = false } }, [artistas])

  const ordenados = useMemo(() => [...(artistas ?? [])].sort((a, b) =>
    ordem === 'alfabetica' ? a.nome.localeCompare(b.nome, 'pt-BR') :
    ordem === 'recentes' ? b.criadoEm - a.criadoEm :
    (a.origem === 'curadoria' && b.origem === 'curadoria' ? a.criadoEm - b.criadoEm : b.criadoEm - a.criadoEm)), [artistas, ordem])
  const vis = useMemo(() => ordenados.filter((a) => (!fav || a.favorito) &&
    (!q || textoBusca(a.nome, a.nomeOriginal).includes(normaliza(q))) &&
    FILTROS.every(({ k }) => !f[k] || valoresDe(a, k).includes(f[k]!))), [ordenados, q, f, fav])
  const ativos = Object.entries(f).filter(([, v]) => v) as [ChaveFiltro, string][]
  const nFiltros = ativos.length + (fav ? 1 : 0) + (ordem !== 'curadoria' ? 1 : 0)

  return (
    <div className="page bib">
      <HeroSecao s={s} />
      <div className="secao-head" style={{ marginTop: 26 }}>
        <h2>Estudos de artistas</h2>
        <Menu rotulo="Novo estudo" botao={<span className="btn sm"><Plus size={14} />Novo</span>} itens={[
          { l: 'Estudo em branco', icon: <Pencil size={16} />, to: '/biblioteca/artistas/novo' },
          { l: 'Pesquisar com IA (nome ou link)', icon: <Sparkles size={16} />, onClick: () => setIa(true) },
        ]} />
      </div>
      <div className="toolbar" style={{ marginTop: 4 }}>
        <div className="search"><Search size={16} /><input className="input" placeholder="Buscar pelo nome do artista" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <button className={'iconbtn' + (nFiltros ? ' on' : '')} aria-label="Filtros e ordem" onClick={() => setPainel(true)}><SlidersHorizontal size={18} /></button>
        <button className="iconbtn" aria-label={lista ? 'Ver em grade' : 'Ver em lista'} onClick={() => definirAjuste('artistas.lista', !lista)}>{lista ? <LayoutGrid size={18} /> : <List size={18} />}</button>
        <Menu itens={[
          { l: 'Só favoritos', icon: <Heart size={16} />, on: fav, onClick: () => setFav(!fav) },
          { l: 'Coleções pessoais', icon: <FolderHeart size={16} />, to: '/biblioteca/colecoes' },
        ]} />
      </div>
      {nFiltros > 0 && <div className="chips" style={{ marginBottom: 12 }}>
        {fav && <button className="chip on" onClick={() => setFav(false)}><Heart size={12} />Favoritos <X size={12} /></button>}
        {ordem !== 'curadoria' && <button className="chip on" onClick={() => definirAjuste('artistas.ordem', 'curadoria')}>{ORDENS.find((o) => o.v === ordem)?.l} <X size={12} /></button>}
        {ativos.map(([k, v]) => <button key={k} className="chip on" onClick={() => setF({ ...f, [k]: undefined })}>{v} <X size={12} /></button>)}
      </div>}

      {sugestoes.length > 0 && !q && !nFiltros && <button className="art-sug-btn" onClick={() => setVerSug(true)}>
        <Sparkles size={15} /><span><b>{sugestoes.length} {sugestoes.length === 1 ? 'sugestão' : 'sugestões'} de estudo</b> a partir das suas curtidas</span>
      </button>}
      {verSug && <Sheet onClose={() => setVerSug(false)} label="Sugestões de estudo" alto>
        <h3>Sugestões de estudo</h3>
        <p className="faint" style={{ fontSize: 13.5, margin: '4px 0 12px' }}>Artistas que você curtiu ou salvou várias vezes e que ainda não têm estudo.</p>
        {sugestoes.length === 0 && <p className="muted">Nenhuma sugestão agora.</p>}
        <section className="art-sugestoes" aria-label="Sugestões de estudo">
        {sugestoes.map((x) => (
          <div key={x.nome} className="art-sugestao">
            {x.imagens.length > 0 && <div className="fotos">{x.imagens.map((u) => <img key={u} src={u} alt="" referrerPolicy="no-referrer" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none' }} />)}</div>}
            <div className="txt">
              <p>Você curtiu ou salvou <b>{x.vezes} obras</b> de <b>{x.nome}</b>.</p>
              <div className="acoes">
                <button className="btn sm primary" onClick={() => { setVerSug(false); setIa(x.nome) }}><Sparkles size={14} />Criar estudo</button>
                <button className="btn sm ghost" onClick={async () => { await ignorarSugestao(x.nome); setSugestoes(sugestoes.filter((y) => y !== x)) }}>Agora não</button>
              </div>
            </div>
          </div>
        ))}
        </section>
      </Sheet>}
      {artistas && artistas.length === 0 && <div className="empty"><span className="serif">Preparando o acervo…</span><span>Os estudos iniciais aparecem em instantes.</span></div>}
      <div className={lista ? 'art-lista' : 'art-feed'}>
        {vis.map((a) => <CardArtista key={a.id} a={a} capa={obraDeCapa(a, obras)} lista={lista} onMenu={setOpcoes} />)}
      </div>
      {artistas && artistas.length > 0 && vis.length === 0 && <p className="muted" style={{ marginTop: 16 }}>Nenhum artista com esses filtros.</p>}
      <Link to="/biblioteca/artistas/novo" className="art-add"><Plus size={16} />Adicionar estudo de artista</Link>

      {estudos.length > 0 && <section style={{ marginTop: 32 }}>
        <div className="secao-head"><h2 style={{ fontSize: 22 }}>Outros estudos e anotações</h2></div>
        <div className="lista">
          {estudos.map((c) => <Link key={c.id} to={`/biblioteca/${c.id}`}><div className="mini"><BookOpen size={20} strokeWidth={1.2} /></div><div><div className="t">{c.titulo}</div><div className="s">{c.autor || 'Estudo'}</div></div><span /></Link>)}
        </div>
      </section>}

      {painel && <Sheet onClose={() => setPainel(false)} label="Filtros" alto>
        <div className="section-head"><h3>Filtrar e ordenar</h3>{nFiltros > 0 && <button className="btn sm ghost" onClick={() => { setF({}); setFav(false); definirAjuste('artistas.ordem', 'curadoria') }}>Limpar</button>}</div>
        <p className="eyebrow" style={{ margin: '14px 0 8px' }}>Ordem</p>
        <div className="chips" style={{ flexWrap: 'wrap' }}>{ORDENS.map((o) => <button key={o.v} className={'chip' + (ordem === o.v ? ' on' : '')} onClick={() => definirAjuste('artistas.ordem', o.v)}>{o.l}</button>)}
          <button className={'chip' + (fav ? ' on' : '')} onClick={() => setFav(!fav)}><Heart size={12} />Só favoritos</button></div>
        {FILTROS.map(({ k, l }) => { const vs = valoresFiltro(artistas ?? [], k); return vs.length ? (
          <div key={k} style={{ marginTop: 16 }}>
            <p className="eyebrow" style={{ marginBottom: 8 }}>{l}</p>
            <div className="chips" style={{ flexWrap: 'wrap' }}>{vs.map(([v, n]) => <button key={v} className={'chip' + (f[k] === v ? ' on' : '')} onClick={() => setF({ ...f, [k]: f[k] === v ? undefined : v })}>{v}<span style={{ opacity: .55 }}>{n}</span></button>)}</div>
          </div>) : null })}
        <button className="btn primary" style={{ width: '100%', marginTop: 20 }} onClick={() => setPainel(false)}>Ver {vis.length} {vis.length === 1 ? 'artista' : 'artistas'}</button>
      </Sheet>}
      {opcoes && <Sheet onClose={() => setOpcoes(undefined)} label={opcoes.nome}>
        <h3>{opcoes.nome}</h3>
        <div className="lista-opcoes" style={{ display: 'grid', gap: 8, marginTop: 12 }}>
          <button className="btn" onClick={() => { alternarFavorito('artistas', opcoes.id, opcoes.favorito); setOpcoes(undefined) }}><Heart size={16} fill={opcoes.favorito ? 'currentColor' : 'none'} />{opcoes.favorito ? 'Remover dos favoritos' : 'Favoritar'}</button>
          <button className="btn" onClick={() => { const id = opcoes.id; setOpcoes(undefined); nav(`/biblioteca/artistas/${id}/editar`) }}><Pencil size={16} />Editar perfil</button>
          <button className="btn" style={{ color: 'var(--terracota)' }} onClick={async () => { if (confirm(`Excluir ${opcoes.nome} da Biblioteca?`)) { await excluir('artistas', opcoes.id); setOpcoes(undefined) } }}><Trash2 size={16} />Excluir artista</button>
        </div>
      </Sheet>}
      {ia && <PesquisaIA nomeInicial={typeof ia === 'string' ? ia : undefined} onClose={() => setIa(false)} />}
    </div>
  )
}
