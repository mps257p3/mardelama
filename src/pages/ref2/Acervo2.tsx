import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { AtSign, CloudOff, Columns3, Compass, FolderInput, FolderPlus, Heart, ImageOff, LayoutDashboard, ListChecks, Pin, Plus, Search, Shuffle, SlidersHorizontal, Sparkles, Tags as TagsIcon, Trash2, X } from 'lucide-react'
import { importarPasta } from '../../lib/importarPasta'
import { useToast } from '../../ui/toast'
import { alternarFavorito, excluir, useGrupos, useReferencias } from '../../db/hooks'
import { db, type Referencia } from '../../db/schema'
import { TIPOS_REF } from '../../lib/refs'
import { ehSalvoInstagram, pendenteInstagram } from '../../lib/instagram'
import { useAjuste, definirAjuste } from '../../db/settings'
import { useArquivoUrl } from '../../db/files'
import { aplicarFiltro, filtrosAtivos, FILTRO_VAZIO, ORDENS, ORIGENS_REF, PERIODOS, type FiltroRefs } from '../../lib/filtroRefs'
import { Menu } from '../../ui/Menu'
import { Sheet } from '../../ui/Sheet'
import { VisorRefs } from '../ref/VisorRefs'
import { EscolherGrupos, EscolherPainel } from '../ref/acoesRefs'
import { BASE2, Topo2 } from './Topo2'
import { mudarFiltroAcervo2 as mudar, useFiltroAcervo2 } from './filtroAcervo2'

const celular = () => typeof window !== 'undefined' && window.innerWidth < 700
const LOTE = 48

/** Acervo de Referências 2: o mesmo acervo da versão atual, com filtros, colunas e menu próprios. */
export default function Acervo2() {
  const refs = useReferencias()
  const grupos = useGrupos()
  const f = useFiltroAcervo2()
  const toast = useToast()
  const [sp, setSp] = useSearchParams()
  const nomeG = useMemo(() => new Map(grupos.map((g) => [g.id, g.nome])), [grupos])
  const colM = useAjuste<number>('ref2.col.m', 2)
  const colD = useAjuste<number>('ref2.col.d', 0)
  const [pequeno, setPequeno] = useState(celular())
  useEffect(() => { const h = () => setPequeno(celular()); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h) }, [])
  const cols = pequeno ? colM : colD || (window.innerWidth >= 1300 ? 5 : window.innerWidth >= 1000 ? 4 : 3)
  const [filtros, setFiltros] = useState(false)
  const [visor, setVisor] = useState<number>()
  const [sel, setSel] = useState<string[] | null>(null)
  const [acao, setAcao] = useState<'grupos' | 'painel'>()
  const [mostrar, setMostrar] = useState(LOTE)
  const fim = useRef<HTMLDivElement>(null)
  const pasta = useRef<HTMLInputElement>(null)
  const [imp, setImp] = useState<string>()

  // vindo de uma coleção: abre o acervo filtrado por ela
  useEffect(() => { const g = sp.get('colecao'); if (g) { mudar({ ...FILTRO_VAZIO, grupos: [g], op: f.op }); setSp({}, { replace: true }) } }, [sp, setSp, f.op])

  const soImagem = useAjuste<boolean>('ref2.soImagem', true)
  const lista = useMemo(() => aplicarFiltro((refs ?? []).filter((r) => !soImagem || f.q || f.grupos.length || f.origens?.length || !pendenteInstagram(r)), f, nomeG), [refs, f, nomeG, soImagem])
  useEffect(() => setMostrar(LOTE), [f])
  useEffect(() => {
    const el = fim.current; if (!el) return
    const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) setMostrar((m) => m + LOTE) }, { rootMargin: '800px' })
    io.observe(el); return () => io.disconnect()
  }, [lista.length])

  async function importar(fs: FileList | null) {
    if (!fs?.length) return
    setImp('Preparando…')
    try {
      const r = await importarPasta(Array.from(fs), (a, b) => setImp(`Importando ${a} de ${b}…`))
      toast(`${r.novos} referências importadas` + (r.repetidos ? `, ${r.repetidos} já existiam` : '') + (r.falhas ? `, ${r.falhas} não puderam ser lidas` : ''))
    } catch (e) { toast((e as Error).message) } finally { setImp(undefined) }
  }

  const visiveis = lista.slice(0, mostrar)
  const colunas: { r: Referencia; i: number }[][] = Array.from({ length: cols }, () => [])
  visiveis.forEach((r, i) => colunas[i % cols].push({ r, i }))
  const nAtivos = filtrosAtivos(f)
  const opcoesCol = pequeno ? [1, 2, 3] : [3, 4, 5, 6]

  return (
    <div className="page acervo ref2">
      <Topo2 aba="acervo" icones={<>
        <Link className="iconbtn" aria-label="Redescobrir meu acervo" title="Redescobrir" to={`${BASE2}/acervo/redescobrir`}><Compass size={19} /></Link>
        <button className={'iconbtn' + (f.fav ? ' on' : '')} aria-label="Só favoritas" onClick={() => mudar({ fav: !f.fav })}><Heart size={19} fill={f.fav ? 'currentColor' : 'none'} /></button>
        <Menu itens={[
          { l: 'Organizar', secao: true },
          { l: 'Selecionar várias', icon: <ListChecks size={16} />, onClick: () => setSel([]) },
          { l: 'Gerenciar coleções', icon: <TagsIcon size={16} />, to: `${BASE2}/colecoes/gerenciar` },
          { l: 'Redescobrir meu acervo', icon: <Compass size={16} />, to: `${BASE2}/acervo/redescobrir` },
          { l: 'Meu repertório estético', icon: <Sparkles size={16} />, to: '/referencias/repertorio' },
          { l: 'Visualização', secao: true },
          { l: f.inspira ? 'Sair do modo inspiração' : 'Modo inspiração', icon: <Shuffle size={16} />, on: f.inspira, onClick: () => mudar({ inspira: !f.inspira, semente: Date.now() % 100000 }) },
          { l: soImagem ? 'Mostrar posts sem imagem' : 'Esconder posts sem imagem', icon: <AtSign size={16} />, on: soImagem, onClick: () => definirAjuste('ref2.soImagem', !soImagem) },
          ...opcoesCol.map((c) => ({ l: `${c} ${c === 1 ? 'coluna' : 'colunas'}`, icon: <Columns3 size={16} />, on: cols === c, onClick: () => definirAjuste(pequeno ? 'ref2.col.m' : 'ref2.col.d', c) })),
          { l: 'Adicionar e importar', secao: true },
          { l: 'Nova referência', icon: <Plus size={16} />, to: `${BASE2}/nova` },
          { l: imp ?? 'Importar pasta', icon: <FolderInput size={16} />, disabled: !!imp, onClick: () => pasta.current?.click() },
          { l: 'Importar do Instagram', icon: <AtSign size={16} />, to: '/referencias/instagram' },
          { l: 'Pinterest', icon: <Pin size={16} />, to: '/referencias/pinterest' },
        ]} />
      </>}>
        <div className="ref2-busca">
          <div className="busca-c"><Search size={16} /><input className="input" placeholder="Buscar no acervo..." value={f.q} onChange={(e) => mudar({ q: e.target.value })} />
            {f.q && <button className="limpar-busca" aria-label="Limpar busca" onClick={() => mudar({ q: '' })}><X size={15} /></button>}</div>
          <button className={'iconbtn ref2-filtro-btn' + (nAtivos ? ' on' : '')} aria-label="Filtros" onClick={() => setFiltros(true)}><SlidersHorizontal size={18} />{nAtivos > 0 && <span className="badge">{nAtivos}</span>}</button>
        </div>
      </Topo2>
      <input ref={pasta} type="file" multiple hidden {...{ webkitdirectory: '', directory: '' }} onChange={(e) => { importar(e.target.files); e.target.value = '' }} />

      {(nAtivos > 0 || f.inspira) && <div className="chips ativos">
        {f.inspira && <button className="chip on" onClick={() => mudar({ semente: Date.now() % 100000 })}><Shuffle size={13} />Embaralhar</button>}
        {(f.origens ?? []).map((o) => <button key={o} className="chip" onClick={() => mudar({ origens: (f.origens ?? []).filter((x) => x !== o) })}>{ORIGENS_REF.find((x) => x.v === o)?.l}<X size={12} /></button>)}
        {f.grupos.map((g, k) => <button key={g} className="chip" onClick={() => mudar({ grupos: f.grupos.filter((x) => x !== g) })}>{k > 0 && <b className="op-mini">{f.op}</b>}{nomeG.get(g) ?? 'coleção'}<X size={12} /></button>)}
        {f.tipos.map((t) => <button key={t} className="chip" onClick={() => mudar({ tipos: f.tipos.filter((x) => x !== t) })}>{t}<X size={12} /></button>)}
        {f.artistas.map((t) => <button key={t} className="chip" onClick={() => mudar({ artistas: f.artistas.filter((x) => x !== t) })}>{t}<X size={12} /></button>)}
        {f.tags.map((t) => <button key={t} className="chip" onClick={() => mudar({ tags: f.tags.filter((x) => x !== t) })}>#{t}<X size={12} /></button>)}
        {f.fav && <button className="chip" onClick={() => mudar({ fav: false })}>Favoritas<X size={12} /></button>}
        {f.periodo && <button className="chip" onClick={() => mudar({ periodo: '' })}>{PERIODOS.find((p) => p.v === f.periodo)?.l}<X size={12} /></button>}
        {f.ordem !== 'recentes' && <button className="chip" onClick={() => mudar({ ordem: 'recentes' })}>{ORDENS.find((o) => o.v === f.ordem)?.l}<X size={12} /></button>}
        {nAtivos > 1 && <button className="chip limpar" onClick={() => mudar({ ...FILTRO_VAZIO, q: f.q, op: f.op, inspira: f.inspira, semente: f.semente })}>Limpar</button>}
      </div>}

      {refs && refs.length === 0 ? (
        <div className="empty"><span className="serif">Seu repertório visual começa aqui.</span>
          <span>Guarde imagens, artistas, texturas e formas. Uma mesma referência pode estar em várias coleções.</span>
          <Link className="btn sm primary" to={`${BASE2}/nova`}><Plus size={15} />Adicionar referência</Link></div>
      ) : lista.length === 0 && refs ? <div className="empty"><span className="serif">Nada encontrado.</span><button className="btn sm" onClick={() => mudar({ ...FILTRO_VAZIO, op: f.op })}>Limpar busca e filtros</button></div> : (
        <div className="masonry" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {colunas.map((c, k) => <div key={k} className="masonry-col">
            {c.map(({ r, i }) => <Tile2 key={r.id} r={r} sel={sel} onAbrir={() => setVisor(i)}
              onSelecionar={() => setSel((s) => { const b = s ?? []; return b.includes(r.id) ? b.filter((x) => x !== r.id) : [...b, r.id] })} />)}
          </div>)}
        </div>
      )}
      <div ref={fim} style={{ height: 1 }} />

      {sel && <div className="barra-sel">
        <button className="iconbtn" aria-label="Cancelar seleção" onClick={() => setSel(null)}><X size={18} /></button>
        <span className="n">{sel.length} {sel.length === 1 ? 'selecionada' : 'selecionadas'}</span>
        <button className="iconbtn" disabled={!sel.length} aria-label="Favoritar" onClick={async () => { const rs = (refs ?? []).filter((r) => sel.includes(r.id)); const todas = rs.every((r) => r.favorito); await Promise.all(rs.map((r) => alternarFavorito('referencias', r.id, todas ? 1 : 0))); toast(todas ? 'Favoritas removidas' : 'Favoritadas') }}><Heart size={18} /></button>
        <button className="iconbtn" disabled={!sel.length} aria-label="Coleções" onClick={() => setAcao('grupos')}><FolderPlus size={18} /></button>
        <button className="iconbtn" disabled={!sel.length} aria-label="Levar a um painel" onClick={() => setAcao('painel')}><LayoutDashboard size={18} /></button>
        <button className="iconbtn" disabled={!sel.length} aria-label="Excluir" onClick={async () => { if (!confirm(`Excluir ${sel.length} referência(s)?`)) return; await Promise.all(sel.map((id) => excluir('referencias', id))); toast('Excluídas'); setSel(null) }}><Trash2 size={18} /></button>
      </div>}

      {visor != null && <VisorRefs lista={lista} inicio={visor} onClose={() => setVisor(undefined)} base={BASE2} />}
      {acao === 'grupos' && sel && <EscolherGrupos ids={sel} onClose={() => setAcao(undefined)} />}
      {acao === 'painel' && sel && <EscolherPainel ids={sel} onClose={() => { setAcao(undefined); setSel(null) }} />}
      {filtros && <PainelFiltros2 f={f} refs={refs ?? []} onClose={() => setFiltros(false)} />}
    </div>
  )
}

/** Post salvo do Instagram (a exportação não traz a imagem): @, trecho da legenda e o tipo. */
function CartaoInstagram({ r }: { r: Referencia }) {
  const usuario = r.autor?.match(/@[\w.]+/)?.[0]
  const texto = (r.descricao ?? r.titulo).replace(/#\S+/g, '').replace(/\s+/g, ' ').trim()
  return <div className="tile-ig">
    {usuario && <span className="ig-user">{usuario}</span>}
    <p>{texto.length > 150 ? texto.slice(0, 148).replace(/\s+\S*$/, '') + '…' : texto || 'Post sem legenda'}</p>
    <span className="ig-tipo">Instagram · {r.url?.includes('/reel/') ? 'reel' : 'post'}</span>
  </div>
}

/**
 * Imagem do mural com quatro estados visíveis, para nunca sobrar um quadro vazio:
 * carregando (fundo pulsando), aguardando sincronização (o arquivo ainda não chegou neste aparelho),
 * indisponível (a imagem da fonte não abriu) e sem imagem (só texto ou paleta).
 */
function ImagemTile({ r }: { r: Referencia }) {
  const id = r.imagens[0]
  const arq = useLiveQuery(async () => (id ? (await db.arquivos.get(id)) ?? null : undefined), [id])
  const url = useArquivoUrl(id && arq ? id : undefined)
  const [estado, setEstado] = useState<'carregando' | 'ok' | 'erro'>('carregando')
  const [externa, setExterna] = useState(false)
  const semArquivo = !!id && (arq === null || (arq && !arq.blob?.size))
  // arquivo ainda não chegou: se a referência tem imagem na fonte, mostra a da fonte enquanto isso
  const src = id && !semArquivo ? url : (r.imagemExterna && (!id || semArquivo) ? r.imagemExterna : undefined)
  useEffect(() => { setEstado('carregando'); setExterna(!!src && src === r.imagemExterna) }, [src, r.imagemExterna])
  if (semArquivo && !r.imagemExterna) return <div className="tile-estado"><CloudOff size={18} strokeWidth={1.3} /><span>Aguardando sincronização</span><small>{r.titulo}</small></div>
  if (!src) return <div className="tile-estado carregando" />
  if (estado === 'erro') return <div className="tile-estado"><ImageOff size={18} strokeWidth={1.3} /><span>Imagem indisponível</span><small>{r.titulo}</small></div>
  return <>
    {estado === 'carregando' && <div className="tile-estado carregando abs" />}
    <img src={src} alt={r.titulo} loading="lazy" referrerPolicy={externa ? 'no-referrer' : undefined} style={{ width: '100%', height: 'auto', display: 'block', opacity: estado === 'ok' ? 1 : 0 }}
      onLoad={() => setEstado('ok')} onError={() => setEstado('erro')} />
  </>
}

function Tile2({ r, sel, onAbrir, onSelecionar }: { r: Referencia; sel: string[] | null; onAbrir: () => void; onSelecionar: () => void }) {
  const t = useRef<{ h: number; x: number; y: number; longo: boolean } | undefined>(undefined)
  const on = !!sel?.includes(r.id)
  const temImg = !!(r.imagens[0] || r.imagemExterna)
  return (
    <button className={'tile' + (on ? ' on' : '')} aria-label={r.titulo}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={(e) => { const h = window.setTimeout(() => { if (t.current) { t.current.longo = true; navigator.vibrate?.(15); onSelecionar() } }, 450); t.current = { h, x: e.clientX, y: e.clientY, longo: false } }}
      onPointerMove={(e) => { if (t.current && Math.hypot(e.clientX - t.current.x, e.clientY - t.current.y) > 10) { clearTimeout(t.current.h); t.current = undefined } }}
      onPointerUp={() => { if (t.current) clearTimeout(t.current.h) }}
      onPointerCancel={() => { if (t.current) clearTimeout(t.current.h); t.current = undefined }}
      onClick={() => { const longo = t.current?.longo; t.current = undefined; if (longo) return; if (sel) onSelecionar(); else onAbrir() }}>
      {temImg ? <ImagemTile r={r} />
        : r.paleta?.length ? <div className="paleta" style={{ height: 90, borderRadius: 0 }}>{r.paleta.map((c) => <span key={c} style={{ background: c }} />)}</div>
        : ehSalvoInstagram(r) ? <CartaoInstagram r={r} />
        : <div className="tile-txt"><span className="tile-sem">Sem imagem</span>{r.titulo}</div>}
      {!!r.favorito && !sel && <Heart className="tile-fav" size={13} fill="currentColor" />}
      {sel && <span className="tile-check" />}
    </button>
  )
}

function PainelFiltros2({ f, refs, onClose }: { f: FiltroRefs; refs: Referencia[]; onClose: () => void }) {
  const grupos = useGrupos()
  const conta = useMemo(() => { const m = new Map<string, number>(); refs.forEach((r) => r.grupos.forEach((g) => m.set(g, (m.get(g) ?? 0) + 1))); return m }, [refs])
  const artistas = useMemo(() => [...new Set(refs.map((r) => r.autor?.trim()).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, 'pt-BR')), [refs])
  const tags = useMemo(() => { const m = new Map<string, number>(); refs.forEach((r) => r.tags.forEach((t) => m.set(t, (m.get(t) ?? 0) + 1))); return [...m].sort((a, b) => b[1] - a[1]).slice(0, 40).map(([t]) => t) }, [refs])
  const tog = (k: 'grupos' | 'tipos' | 'artistas' | 'tags' | 'origens', v: string) => { const a = (f[k] ?? []) as string[]; mudar({ [k]: a.includes(v) ? a.filter((x) => x !== v) : [...a, v] }) }
  return <Sheet label="Filtros" onClose={onClose}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h3>Filtros</h3>
      <button className="btn sm ghost" onClick={() => mudar({ ...FILTRO_VAZIO, q: f.q, op: f.op })}>Limpar tudo</button>
    </div>
    <div className="filtro-sec"><div className="filtro-tit"><span>Origem</span></div>
      <div className="chips wrap">{ORIGENS_REF.map((o) => <button key={o.v} className={'chip' + (f.origens?.includes(o.v) ? ' on' : '')} onClick={() => tog('origens', o.v)}>{o.l}</button>)}</div></div>
    <div className="filtro-sec">
      <div className="filtro-tit"><span>Coleções</span>
        <div className="op" title="E: em todas as coleções escolhidas · OU: em qualquer uma">
          <button className={f.op === 'E' ? 'on' : ''} onClick={() => mudar({ op: 'E' })}>E</button>
          <button className={f.op === 'OU' ? 'on' : ''} onClick={() => mudar({ op: 'OU' })}>OU</button>
        </div>
      </div>
      {f.grupos.length > 1 && <p className="faint" style={{ fontSize: 12, margin: '-4px 0 8px' }}>{f.op === 'E' ? 'Imagens que estão em todas as coleções escolhidas' : 'Imagens que estão em qualquer uma delas'}</p>}
      <div className="chips wrap">{grupos.filter((g) => conta.get(g.id)).map((g) => <button key={g.id} className={'chip' + (f.grupos.includes(g.id) ? ' on' : '')} onClick={() => tog('grupos', g.id)}>{g.nome}<span style={{ opacity: .6 }}>{conta.get(g.id)}</span></button>)}</div>
    </div>
    <div className="filtro-sec"><div className="filtro-tit"><span>Tipo</span></div>
      <div className="chips wrap">{TIPOS_REF.map((t) => <button key={t} className={'chip' + (f.tipos.includes(t) ? ' on' : '')} onClick={() => tog('tipos', t)}>{t}</button>)}</div></div>
    <div className="filtro-sec"><div className="filtro-tit"><span>Favoritas</span></div>
      <div className="chips"><button className={'chip' + (f.fav ? ' on' : '')} onClick={() => mudar({ fav: !f.fav })}><Heart size={13} />Só favoritas</button></div></div>
    {artistas.length > 0 && <div className="filtro-sec"><div className="filtro-tit"><span>Autores</span></div>
      <div className="chips wrap">{artistas.map((a) => <button key={a} className={'chip' + (f.artistas.includes(a) ? ' on' : '')} onClick={() => tog('artistas', a)}>{a}</button>)}</div></div>}
    {tags.length > 0 && <div className="filtro-sec"><div className="filtro-tit"><span>Tags</span></div>
      <div className="chips wrap">{tags.map((t) => <button key={t} className={'chip' + (f.tags.includes(t) ? ' on' : '')} onClick={() => tog('tags', t)}>#{t}</button>)}</div></div>}
    <div className="filtro-sec"><div className="filtro-tit"><span>Incluídas</span></div>
      <div className="chips wrap">{PERIODOS.map((p) => <button key={p.v} className={'chip' + (f.periodo === p.v ? ' on' : '')} onClick={() => mudar({ periodo: p.v })}>{p.l}</button>)}</div></div>
    <div className="filtro-sec"><div className="filtro-tit"><span>Ordem</span></div>
      <div className="chips wrap">{ORDENS.map((o) => <button key={o.v} className={'chip' + (f.ordem === o.v && !f.inspira ? ' on' : '')} onClick={() => mudar({ ordem: o.v, inspira: false })}>{o.l}</button>)}
        <button className={'chip' + (f.inspira ? ' on' : '')} onClick={() => mudar({ inspira: !f.inspira, semente: Date.now() % 100000 })}><Sparkles size={13} />Inspiração (aleatória)</button></div></div>
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}><button className="btn primary" onClick={onClose}>Ver imagens</button></div>
  </Sheet>
}
