import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Bookmark, BookmarkCheck, Compass, ExternalLink, EyeOff, FolderPlus, Heart, LayoutDashboard, RefreshCw, Search, SlidersHorizontal, Sparkles, Plug, X, ScanSearch } from 'lucide-react'
import { db } from '../../db/schema'
import { FONTES, FONTES_PENDENTES, FONTE, type ItemDescoberta } from '../../lib/fontes'
import { buscarLote, descurtir, lerPerfil, PERFIL_VAZIO, PESOS_PADRAO, planejar, registrar, salvarNoAcervo, salvarPerfil, traduz, UNIVERSOS, type EstadoFonte, type Interacao, type Modo, type Perfil } from '../../lib/curadoria'
import { useAjuste, definirAjuste } from '../../db/settings'
import { Menu } from '../../ui/Menu'
import { Sheet } from '../../ui/Sheet'
import { useToast } from '../../ui/toast'
import { TopoRef } from './Topo'
import { EscolherGrupos, EscolherPainel } from './acoesRefs'

const MODOS: [Modo, string][] = [['para-voce', 'Para você'], ['fora-da-curva', 'Fora da curva'], ['novos-artistas', 'Novos artistas'], ['cores-texturas', 'Cores e texturas'], ['formas-volumes', 'Formas e volumes']]
const VALIDADE = 6 * 3600000   // o feed se renova sozinho a cada 6 horas
type Contexto = { tipo: 'feed' } | { tipo: 'busca'; q: string } | { tipo: 'semelhantes'; item: ItemDescoberta }
interface Cache { itens: ItemDescoberta[]; quando: number; modo: Modo; ctx: Contexto }
const lerCache = (): Cache | undefined => { try { return JSON.parse(sessionStorage.getItem('descobrir.feed') ?? 'null') ?? undefined } catch { return undefined } }
const gravarCache = (c: Cache) => { try { sessionStorage.setItem('descobrir.feed', JSON.stringify({ ...c, itens: c.itens.slice(-300) })) } catch { /* cheio */ } }

export default function Descobrir() {
  const toast = useToast()
  const modo = useAjuste<Modo>('descobrir.modo', 'para-voce')
  const cache = useRef(lerCache())
  const [ctx, setCtx] = useState<Contexto>(cache.current?.ctx ?? { tipo: 'feed' })
  const [itens, setItens] = useState<ItemDescoberta[]>(cache.current?.itens ?? [])
  const [carregando, setCarregando] = useState(false)
  const [estados, setEstados] = useState<EstadoFonte[]>([])
  const [q, setQ] = useState(ctx.tipo === 'busca' ? ctx.q : '')
  const [visor, setVisor] = useState<number>()
  const [painel, setPainel] = useState<'ajustes' | 'fontes'>()
  const [curtidos, setCurtidos] = useState<Set<string>>(new Set())
  const fim = useRef<HTMLDivElement>(null)
  const ocupado = useRef(false)
  const salvos = useLiveQuery(async () => new Map((await db.referencias.filter((r) => !!r.origem?.startsWith('descobrir:') && !r.excluido).toArray()).map((r) => [r.origem!.slice(10), r.id])), [], new Map<string, string>())

  useEffect(() => { lerPerfil().then((p) => setCurtidos(new Set(p.curtidos))) }, [])

  const carregar = useCallback(async (novo: boolean, c: Contexto = ctx, m: Modo = modo) => {
    if (ocupado.current) return
    ocupado.current = true; setCarregando(true)
    try {
      const perfil = await lerPerfil()
      const conhecidos = new Set([...(novo ? [] : itens.map((i) => i.id)), ...(c.tipo === 'feed' ? perfil.vistos.slice(-800) : [])])
      let pedidos
      if (c.tipo === 'busca') { const t = traduz(c.q); pedidos = FONTES.map(() => ({ q: t, tipo: 'busca' as const })).concat(FONTES.map(() => ({ q: t, tipo: 'busca' as const }))) }
      else if (c.tipo === 'semelhantes') { const it = c.item; const base = [it.autor, ...it.termos.slice(0, 3)].filter(Boolean) as string[]; pedidos = base.flatMap((b) => [{ q: b, universo: it.universo, tipo: 'semelhantes' as const }]).slice(0, 6) }
      else pedidos = await planejar(perfil, m, 8)
      let { itens: novos, estados: es } = await buscarLote(perfil, pedidos, conhecidos)
      if (m === 'novos-artistas' && c.tipo === 'feed') {
        const conhecidosArt = new Set([...Object.keys(perfil.artistas), ...(await db.referencias.toArray()).map((r) => r.autor).filter(Boolean) as string[]])
        novos = novos.filter((x) => !x.autor || !conhecidosArt.has(x.autor))
      }
      setEstados(es)
      const lista = novo ? novos : [...itens, ...novos]
      setItens(lista)
      gravarCache({ itens: lista, quando: Date.now(), modo: m, ctx: c })
      if (c.tipo === 'feed' && novos.length) { perfil.vistos = [...perfil.vistos.slice(-1500), ...novos.map((x) => x.id)]; await salvarPerfil(perfil) }
      if (!novos.length && es.length && es.every((e) => !e.ok)) toast('As fontes não responderam agora. Tente de novo em instantes.')
    } finally { ocupado.current = false; setCarregando(false) }
  }, [ctx, modo, itens, toast])

  // primeira abertura, troca de modo ou feed vencido: busca novo lote
  useEffect(() => {
    const c = cache.current
    if (!c || !c.itens.length || c.modo !== modo || (c.ctx.tipo === 'feed' && Date.now() - c.quando > VALIDADE)) carregar(true, ctx, modo)
    cache.current = { itens: [], quando: 0, modo, ctx }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modo])

  useEffect(() => {
    const el = fim.current; if (!el) return
    const io = new IntersectionObserver((es) => { if (es[0].isIntersecting && itens.length) carregar(false) }, { rootMargin: '900px' })
    io.observe(el); return () => io.disconnect()
  }, [carregar, itens.length])

  async function agir(item: ItemDescoberta, tipo: Interacao) {
    if (tipo === 'curtir') {
      if (curtidos.has(item.id)) { await descurtir(item); setCurtidos((s) => { const n = new Set(s); n.delete(item.id); return n }); return }
      await registrar(item, 'curtir'); setCurtidos((s) => new Set(s).add(item.id)); return
    }
    if (tipo === 'recusar') { await registrar(item, 'recusar'); setItens((xs) => xs.filter((x) => x.id !== item.id)); setVisor(undefined); toast('Entendido. Menos coisas assim.'); return }
    if (tipo === 'salvar') { if (salvos.has(item.id)) { toast('Já está no seu acervo'); return } await salvarNoAcervo(item); await registrar(item, 'salvar'); toast('Salvo no acervo'); return }
    if (tipo === 'semelhantes') { await registrar(item, 'semelhantes'); const c: Contexto = { tipo: 'semelhantes', item }; setCtx(c); setVisor(undefined); setItens([]); window.scrollTo(0, 0); carregar(true, c) }
  }
  function buscar(e: React.FormEvent) {
    e.preventDefault(); const t = q.trim()
    if (!t) { voltarAoFeed(); return }
    registrar(null, 'pesquisar', traduz(t).split(/\s+/).filter((w) => w.length > 3))
    const c: Contexto = { tipo: 'busca', q: t }; setCtx(c); setItens([]); carregar(true, c)
  }
  function voltarAoFeed() { const c: Contexto = { tipo: 'feed' }; setQ(''); setCtx(c); setItens([]); carregar(true, c) }

  const falhas = estados.filter((e) => !e.ok)
  return (
    <div className="page acervo">
      <TopoRef aba="descobrir" icones={<>
        <button className={'iconbtn' + (carregando ? ' girando' : '')} aria-label="Novas recomendações" title="Novas recomendações" onClick={() => { setItens([]); carregar(true) }}><RefreshCw size={18} className={carregando ? 'gira' : ''} /></button>
        <Menu itens={[
          { l: 'Novas recomendações', icon: <RefreshCw size={16} />, onClick: () => { setItens([]); carregar(true) } },
          { l: 'Ajustar curadoria', icon: <SlidersHorizontal size={16} />, onClick: () => setPainel('ajustes') },
          { l: 'Fontes', icon: <Plug size={16} />, onClick: () => setPainel('fontes') },
        ]} />
      </>}>
        <form className="busca-c" onSubmit={buscar}><Search size={16} />
          <input className="input" placeholder="Pesquisar nos acervos" value={q} onChange={(e) => setQ(e.target.value)} enterKeyHint="search" />
          {q && <button type="button" className="limpar-busca" aria-label="Limpar" onClick={voltarAoFeed}><X size={15} /></button>}
        </form>
      </TopoRef>

      {ctx.tipo === 'feed' ? (
        <div className="chips" style={{ marginBottom: 10 }}>
          {MODOS.map(([k, l]) => <button key={k} className={'chip' + (modo === k ? ' on' : '')} onClick={() => { if (modo !== k) { setItens([]); definirAjuste('descobrir.modo', k) } }}>{l}</button>)}
        </div>
      ) : (
        <div className="contexto-desc">
          <span>{ctx.tipo === 'busca' ? <>Resultados para <b>“{ctx.q}”</b></> : <>Semelhantes a <b>{ctx.item.titulo}</b></>}</span>
          <button className="btn sm ghost" onClick={voltarAoFeed}>Voltar ao feed</button>
        </div>
      )}

      {falhas.length > 0 && !carregando && <p className="aviso-fonte">{falhas.map((f) => FONTE[f.id].nome).join(', ')} não {falhas.length > 1 ? 'responderam' : 'respondeu'} agora ({falhas[0].erro}). As outras seguem normalmente.</p>}

      {itens.length === 0 && !carregando ? (
        <div className="empty"><Compass size={26} strokeWidth={1.1} style={{ color: 'var(--argila)' }} />
          <span className="serif">{estados.length && estados.every((e) => !e.ok) ? 'As fontes não responderam.' : 'Nada por aqui ainda.'}</span>
          <span>{estados.length && estados.every((e) => !e.ok) ? 'Confira a internet e toque em atualizar.' : 'Toque em atualizar para buscar novas referências.'}</span>
          <button className="btn sm" onClick={() => carregar(true)}><RefreshCw size={14} />Atualizar</button></div>
      ) : <MuralDescobrir itens={itens} curtidos={curtidos} salvos={salvos} onAbrir={setVisor} onAgir={agir} />}
      {carregando && <div className="carregando-desc"><RefreshCw size={16} className="gira" />Buscando nos acervos…</div>}
      <div ref={fim} style={{ height: 1 }} />

      {visor != null && itens[visor] && <VisorDescobrir itens={itens} inicio={visor} curtidos={curtidos} salvos={salvos} onClose={() => setVisor(undefined)} onAgir={agir} />}
      {painel === 'ajustes' && <AjustesCuradoria onClose={() => setPainel(undefined)} />}
      {painel === 'fontes' && <PainelFontes estados={estados} onClose={() => setPainel(undefined)} />}
    </div>
  )
}

function MuralDescobrir({ itens, curtidos, salvos, onAbrir, onAgir }: { itens: ItemDescoberta[]; curtidos: Set<string>; salvos: Map<string, string>; onAbrir: (i: number) => void; onAgir: (x: ItemDescoberta, t: Interacao) => void }) {
  const [cols, setCols] = useState(window.innerWidth < 700 ? 2 : window.innerWidth >= 1300 ? 5 : window.innerWidth >= 1000 ? 4 : 3)
  useEffect(() => { const h = () => setCols(window.innerWidth < 700 ? 2 : window.innerWidth >= 1300 ? 5 : window.innerWidth >= 1000 ? 4 : 3); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h) }, [])
  const colunas = useMemo(() => { const c: { x: ItemDescoberta; i: number }[][] = Array.from({ length: cols }, () => []); itens.forEach((x, i) => c[i % cols].push({ x, i })); return c }, [itens, cols])
  return <div className="masonry" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
    {colunas.map((c, k) => <div key={k} className="masonry-col">{c.map(({ x, i }) => (
      <div key={x.id} className="tile tile-desc">
        <button className="tile-abrir" aria-label={x.titulo} onClick={() => onAbrir(i)}><img src={x.imagem} alt={x.titulo} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={(e) => { (e.currentTarget.closest('.tile') as HTMLElement).style.display = 'none' }} /></button>
        <div className="tile-acoes">
          <button aria-label={curtidos.has(x.id) ? 'Descurtir' : 'Curtir'} className={curtidos.has(x.id) ? 'on' : ''} onClick={() => onAgir(x, 'curtir')}><Heart size={15} fill={curtidos.has(x.id) ? 'currentColor' : 'none'} /></button>
          <button aria-label="Salvar no acervo" className={salvos.has(x.id) ? 'on' : ''} onClick={() => onAgir(x, 'salvar')}>{salvos.has(x.id) ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}</button>
        </div>
      </div>))}</div>)}
  </div>
}

function VisorDescobrir({ itens, inicio, curtidos, salvos, onClose, onAgir }: { itens: ItemDescoberta[]; inicio: number; curtidos: Set<string>; salvos: Map<string, string>; onClose: () => void; onAgir: (x: ItemDescoberta, t: Interacao) => unknown }) {
  const [i, setI] = useState(inicio)
  const [acao, setAcao] = useState<{ tipo: 'grupos' | 'painel'; ref: string }>()
  const toque = useRef<{ x: number; y: number } | undefined>(undefined)
  const toast = useToast()
  const n = itens.length; const x = itens[Math.min(i, n - 1)]
  const ir = (d: number) => setI((v) => (v + d + n) % n)
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (acao) return; if (e.key === 'Escape') onClose(); if (e.key === 'ArrowLeft') ir(-1); if (e.key === 'ArrowRight') ir(1) }
    window.addEventListener('keydown', k); const o = document.body.style.overflow; document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = o }
  })
  if (!x) return null
  async function levar(tipo: 'grupos' | 'painel') {
    const ref = salvos.get(x.id) ?? await salvarNoAcervo(x)
    if (!salvos.has(x.id)) { await registrar(x, tipo === 'painel' ? 'painel' : 'salvar'); toast('Salvo no acervo') } else if (tipo === 'painel') await registrar(x, 'painel')
    setAcao({ tipo, ref })
  }
  return createPortal(
    <div className="visor visor-ref" role="dialog" aria-label={x.titulo}
      onTouchStart={(e) => { toque.current = { x: e.touches[0].clientX, y: e.touches[0].clientY } }}
      onTouchEnd={(e) => { const t = toque.current; toque.current = undefined; if (!t) return; const dx = e.changedTouches[0].clientX - t.x, dy = e.changedTouches[0].clientY - t.y; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) ir(dx < 0 ? 1 : -1); else if (dy > 100 && Math.abs(dy) > Math.abs(dx)) onClose() }}>
      <div className="visor-topo"><span>{FONTE[x.fonte].nome}</span><button className="visor-btn" aria-label="Fechar" onClick={onClose}><X size={20} /></button></div>
      <div className="visor-img"><img key={x.id} src={x.imagemGrande} alt={x.titulo} referrerPolicy="no-referrer" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /></div>
      <div className="desc-info">
        <p className="t">{x.titulo}</p>
        <p className="s">{[x.autor, x.data].filter(Boolean).join(' · ')}</p>
        <p className="l">{x.licenca}{x.universo ? ' · ' + (UNIVERSOS[x.universo]?.nome ?? '') : ''}</p>
      </div>
      <div className="visor-acoes desc">
        <button className={'visor-btn' + (curtidos.has(x.id) ? ' on' : '')} aria-label="Curtir" onClick={() => onAgir(x, 'curtir')}><Heart size={18} fill={curtidos.has(x.id) ? 'currentColor' : 'none'} /></button>
        <button className={'visor-btn' + (salvos.has(x.id) ? ' on' : '')} aria-label="Salvar no acervo" onClick={() => onAgir(x, 'salvar')}>{salvos.has(x.id) ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}</button>
        <button className="visor-btn" aria-label="Adicionar a um grupo" onClick={() => levar('grupos')}><FolderPlus size={18} /></button>
        <button className="visor-btn" aria-label="Adicionar a um painel" onClick={() => levar('painel')}><LayoutDashboard size={18} /></button>
        <button className="visor-btn" aria-label="Encontrar semelhantes" onClick={() => onAgir(x, 'semelhantes')}><ScanSearch size={18} /></button>
        <button className="visor-btn" aria-label="Não tenho interesse" onClick={() => onAgir(x, 'recusar')}><EyeOff size={18} /></button>
        <a className="visor-btn" aria-label="Fonte original" href={x.link} target="_blank" rel="noreferrer"><ExternalLink size={17} /></a>
      </div>
      {n > 1 && <><button className="visor-btn visor-ant" aria-label="Anterior" onClick={() => ir(-1)}>‹</button><button className="visor-btn visor-prox" aria-label="Próxima" onClick={() => ir(1)}>›</button></>}
      {acao?.tipo === 'grupos' && <EscolherGrupos ids={[acao.ref]} onClose={() => setAcao(undefined)} />}
      {acao?.tipo === 'painel' && <EscolherPainel ids={[acao.ref]} onClose={() => setAcao(undefined)} />}
    </div>, document.body)
}

const ROT_PESO: Record<Interacao, string> = { curtir: 'Curtir', salvar: 'Salvar', painel: 'Levar a um painel', semelhantes: 'Encontrar semelhantes', pesquisar: 'Pesquisar', recusar: 'Não tenho interesse' }

/** Mistura, pesos e as preferências aprendidas (que você pode corrigir). */
function AjustesCuradoria({ onClose }: { onClose: () => void }) {
  const [p, setP] = useState<Perfil>()
  const toast = useToast()
  useEffect(() => { lerPerfil().then(setP) }, [])
  if (!p) return null
  const mudar = (np: Perfil) => { setP(np); salvarPerfil(np) }
  const top = Object.entries(p.termos).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 24)
  const univ = Object.entries(p.universos).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])
  const temp = Object.entries(p.temporario).filter(([, v]) => v.ate > Date.now())
  const mx = p.mistura
  return <Sheet label="Ajustar curadoria" onClose={onClose}>
    <h3>Ajustar curadoria</h3>
    <div className="filtro-sec"><div className="filtro-tit"><span>Mistura do feed</span></div>
      {([['proximo', 'Perto do que você já gosta'], ['adjacente', 'Universos vizinhos'], ['experimental', 'Inesperado']] as const).map(([k, l]) => (
        <label key={k} className="faixa"><span>{l}</span><input type="range" min={0} max={100} step={5} value={mx[k]} onChange={(e) => mudar({ ...p, mistura: { ...mx, [k]: Number(e.target.value) } })} /><b>{Math.round((mx[k] / (mx.proximo + mx.adjacente + mx.experimental || 1)) * 100)}%</b></label>))}
      <button className="btn sm ghost" onClick={() => mudar({ ...p, mistura: PERFIL_VAZIO.mistura })}>Voltar a 60 / 25 / 15</button>
    </div>
    <div className="filtro-sec"><div className="filtro-tit"><span>Peso de cada gesto</span></div>
      {(Object.keys(ROT_PESO) as Interacao[]).map((k) => (
        <label key={k} className="faixa"><span>{ROT_PESO[k]}</span><input type="range" min={k === 'recusar' ? -5 : 0} max={k === 'recusar' ? 0 : 5} step={0.5} value={p.pesos[k]} onChange={(e) => mudar({ ...p, pesos: { ...p.pesos, [k]: Number(e.target.value) } })} /><b>{p.pesos[k] > 0 ? '+' : ''}{p.pesos[k]}</b></label>))}
      <button className="btn sm ghost" onClick={() => mudar({ ...p, pesos: PESOS_PADRAO })}>Pesos padrão</button>
    </div>
    <div className="filtro-sec"><div className="filtro-tit"><span>O que o app aprendeu</span></div>
      {top.length ? <div className="chips wrap">{top.map(([t]) => <button key={t} className="chip" onClick={() => { const termos = { ...p.termos }; delete termos[t]; mudar({ ...p, termos }) }}>{t}<X size={12} /></button>)}</div> : <p className="faint" style={{ fontSize: 13 }}>Ainda nada. Curta, salve e recuse imagens no feed.</p>}
      {univ.length > 0 && <p className="faint" style={{ fontSize: 12.5, marginTop: 10 }}>Universos: {univ.slice(0, 6).map(([u]) => UNIVERSOS[u]?.nome ?? u).join(', ')}</p>}
      {temp.length > 0 && <><p className="faint" style={{ fontSize: 12.5, marginTop: 10 }}>Interesses temporários (pesquisas, expiram em 7 dias):</p>
        <div className="chips wrap" style={{ marginTop: 6 }}>{temp.map(([t]) => <button key={t} className="chip" onClick={() => { const tp = { ...p.temporario }; delete tp[t]; mudar({ ...p, temporario: tp }) }}>{t}<X size={12} /></button>)}</div></>}
      <p className="faint" style={{ fontSize: 12, marginTop: 10 }}>Toque num termo para removê-lo. Isso não é uma classificação do seu estilo, só pistas para a curadoria.</p>
      <button className="btn sm ghost" style={{ marginTop: 6 }} onClick={() => { if (confirm('Apagar tudo o que o app aprendeu? Curtidas e recusas também.')) { mudar({ ...PERFIL_VAZIO, mistura: p.mistura, pesos: p.pesos, fontes: p.fontes }); toast('Perfil redefinido') } }}><Sparkles size={14} />Redefinir perfil</button>
    </div>
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}><button className="btn primary" onClick={onClose}>Pronto</button></div>
  </Sheet>
}

function PainelFontes({ estados, onClose }: { estados: EstadoFonte[]; onClose: () => void }) {
  const [p, setP] = useState<Perfil>()
  useEffect(() => { lerPerfil().then(setP) }, [])
  if (!p) return null
  return <Sheet label="Fontes" onClose={onClose}>
    <h3>Fontes</h3>
    <p className="faint" style={{ fontSize: 13, margin: '4px 0 12px' }}>Acervos abertos consultados pelas APIs oficiais. Nada é salvo no seu acervo sem você pedir; ao salvar, guardamos autoria, licença e o link original.</p>
    <div className="lista">
      {FONTES.map((f) => { const e = estados.find((x) => x.id === f.id); return (
        <div key={f.id} className="row" style={{ gridTemplateColumns: '1fr auto' }}>
          <div><div className="t">{f.nome}</div><div className="s">{!p.fontes[f.id] ? 'Desligada' : !e ? 'Ainda não consultada nesta sessão' : e.ok ? 'Respondendo normalmente' : `Sem resposta: ${e.erro}`}</div></div>
          <button className={'chip' + (p.fontes[f.id] ? ' on' : '')} onClick={async () => { const np = { ...p, fontes: { ...p.fontes, [f.id]: !p.fontes[f.id] } }; setP(np); await salvarPerfil(np) }}>{p.fontes[f.id] ? 'Ligada' : 'Desligada'}</button>
        </div>) })}
      {FONTES_PENDENTES.map((f) => <div key={f.nome} className="row" style={{ gridTemplateColumns: '1fr' }}><div><div className="t">{f.nome}</div><div className="s">{f.estado}</div></div></div>)}
    </div>
  </Sheet>
}
