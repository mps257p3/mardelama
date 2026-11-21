import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { BookOpen, Bookmark, BookmarkCheck, Camera, Columns2, Compass, ExternalLink, EyeOff, Heart, LayoutDashboard, RefreshCw, Search, SlidersHorizontal, Sparkles, Plug, X, ScanSearch } from 'lucide-react'
import { db } from '../../db/schema'
import { FONTES, FONTES_PENDENTES, FONTE, type ItemDescoberta } from '../../lib/fontes'
import { buscarLote, EPOCAS, type Epoca, descurtir, lerPerfil, PERFIL_VAZIO, PESOS_PADRAO, planejar, registrar, retomarFonte, salvarNoAcervo, salvarPerfil, TEMAS, traduz, UNIVERSOS, type EstadoFonte, type Interacao, type Modo, type Perfil } from '../../lib/curadoria'
import { useAjuste, definirAjuste } from '../../db/settings'
import { Menu } from '../../ui/Menu'
import { Sheet } from '../../ui/Sheet'
import { useToast } from '../../ui/toast'
import { TopoRef } from './Topo'
import { EscolherGrupos, EscolherPainel } from './acoesRefs'
import { atualizarGostoIA, buscarPorFoto, iaConfigurada, interpretarBusca, type Consulta, type TemaCurtidas } from '../../lib/iaRepertorio'
import { CompararObra, ExplicarObra, ObraDoDia, TemasDasCurtidas, useObraDoDia } from './descobrirExtras'

const MODOS: [Modo, string][] = [['para-voce', 'Para você'], ['fora-da-curva', 'Fora da curva'], ['novos-artistas', 'Novos artistas'], ['cores-texturas', 'Cores e texturas'], ['formas-volumes', 'Formas e volumes']]
const VALIDADE = 30 * 60000   // ao voltar ao Descobrir depois de meia hora, vem um lote novo
type Contexto = { tipo: 'feed' } | { tipo: 'busca'; q: string; leitura?: string; consultas?: Consulta[]; tema?: string; deRef?: string; foto?: string } | { tipo: 'semelhantes'; item: ItemDescoberta } | { tipo: 'curtidas' }
interface Cache { itens: ItemDescoberta[]; quando: number; modo: Modo; ctx: Contexto; epoca?: Epoca }
// o lote fica só na memória: navegar pelo app e voltar mantém o feed; recarregar a página traz material novo
let memoria: Cache | undefined
const lerCache = () => memoria
const gravarCache = (c: Cache) => { memoria = { ...c, itens: c.itens.slice(-300) } }
const DICA_CURTIR = 'descobrir.dicaCurtir'
const DICA_GESTOS = 'descobrir.dicaGestos'
const LIMIAR = 80   // px de arrasto para valer o gesto

export default function Descobrir() {
  const toast = useToast()
  const modo = useAjuste<Modo>('descobrir.modo', 'para-voce')
  const epoca = useAjuste<Epoca>('descobrir.epoca', 'todas')
  const cache = useRef(lerCache())
  const [ctx, setCtx] = useState<Contexto>(cache.current?.ctx ?? { tipo: 'feed' })
  const [itens, setItens] = useState<ItemDescoberta[]>(cache.current?.itens ?? [])
  const [carregando, setCarregando] = useState(false)
  const [interpretando, setInterpretando] = useState(false)
  const [estados, setEstados] = useState<EstadoFonte[]>([])
  const [q, setQ] = useState(ctx.tipo === 'busca' ? ctx.q : '')
  const [visor, setVisor] = useState<number>()
  const [painel, setPainel] = useState<'ajustes' | 'fontes'>()
  const [curtidos, setCurtidos] = useState<Set<string>>(new Set())
  const [grupoPara, setGrupoPara] = useState<string>()
  const rodada = useRef(0)
  const [params, setParams] = useSearchParams()
  const fim = useRef<HTMLDivElement>(null)
  const ocupado = useRef(false)
  const salvos = useLiveQuery(async () => new Map((await db.referencias.filter((r) => !!r.origem?.startsWith('descobrir:') && !r.excluido).toArray()).map((r) => [r.origem!.slice(10), r.id])), [], new Map<string, string>())

  useEffect(() => { lerPerfil().then((p) => setCurtidos(new Set(p.curtidos))) }, [])
  // a leitura do gosto pela IA se renova sozinha quando há curtidas novas (no máximo a cada 12 horas)
  useEffect(() => { atualizarGostoIA().catch(() => undefined) }, [])

  const carregar = useCallback(async (novo: boolean, c: Contexto = ctx, m: Modo = modo) => {
    if (c.tipo === 'curtidas') {
      if (!novo) return
      const perfil = await lerPerfil(); const lista = [...(perfil.curtidasItens ?? [])].reverse()
      setItens(lista); gravarCache({ itens: lista, quando: Date.now(), modo: m, ctx: c, epoca }); return
    }
    if (ocupado.current) return
    ocupado.current = true; setCarregando(true)
    rodada.current = novo ? 0 : rodada.current + 1
    try {
      const perfil = await lerPerfil()
      const conhecidos = new Set([...(novo ? [] : itens.map((i) => i.id)), ...(c.tipo === 'feed' ? perfil.vistos.slice(-800) : [])])
      let pedidos
      if (c.tipo === 'busca' && c.consultas?.length) pedidos = c.consultas.map((x) => ({ q: x.q, universo: x.universo, fonte: x.fonte, tipo: 'busca' as const }))
      else if (c.tipo === 'busca') { const t = traduz(c.q); pedidos = FONTES.map(() => ({ q: t, tipo: 'busca' as const })).concat(FONTES.map(() => ({ q: t, tipo: 'busca' as const }))) }
      else if (c.tipo === 'semelhantes') { const it = c.item; const base = [it.autor, ...it.termos.slice(0, 3)].filter(Boolean) as string[]; pedidos = base.flatMap((b) => [{ q: b, universo: it.universo, tipo: 'semelhantes' as const }]).slice(0, 6) }
      else pedidos = await planejar(perfil, m, 8, epoca)
      let { itens: novos, estados: es } = await buscarLote(perfil, pedidos, conhecidos, 6, rodada.current, epoca)
      if (m === 'novos-artistas' && c.tipo === 'feed') {
        const conhecidosArt = new Set([...Object.keys(perfil.artistas), ...(await db.referencias.toArray()).map((r) => r.autor).filter(Boolean) as string[]])
        novos = novos.filter((x) => !x.autor || !conhecidosArt.has(x.autor))
      }
      setEstados(es)
      const lista = novo ? novos : [...itens, ...novos]
      setItens(lista)
      gravarCache({ itens: lista, quando: Date.now(), modo: m, ctx: c, epoca })
      if (c.tipo === 'feed' && novos.length) { perfil.vistos = [...perfil.vistos.slice(-1500), ...novos.map((x) => x.id)]; await salvarPerfil(perfil) }
      if (!novos.length && es.length && es.every((e) => !e.ok)) toast('As fontes não responderam agora. Tente de novo em instantes.')
    } finally { ocupado.current = false; setCarregando(false) }
  }, [ctx, modo, epoca, itens, toast])

  // primeira abertura, troca de modo ou feed vencido: busca novo lote
  useEffect(() => {
    const c = cache.current
    // veio de uma referência do acervo ("Ver semelhantes")
    const ref = params.get('ref')
    if (ref) { setParams({}, { replace: true }); cache.current = { itens: [], quando: 0, modo, ctx }; semelhantesDaRef(ref); return }
    if (!c || !c.itens.length || c.modo !== modo || (c.epoca ?? 'todas') !== epoca || (c.ctx.tipo === 'feed' && Date.now() - c.quando > VALIDADE)) carregar(true, ctx, modo)
    cache.current = { itens: [], quando: 0, modo, ctx, epoca }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modo, epoca])

  useEffect(() => {
    const el = fim.current; if (!el) return
    const io = new IntersectionObserver((es) => { if (es[0].isIntersecting && itens.length) carregar(false) }, { rootMargin: '900px' })
    io.observe(el); return () => io.disconnect()
  }, [carregar, itens.length])

  /** Obras parecidas com uma referência do acervo: a IA lê título, autor, tags e descrição e monta as buscas. */
  async function semelhantesDaRef(id: string) {
    const r = await db.referencias.get(id); if (!r) return
    let c: Contexto = { tipo: 'busca', q: r.titulo, deRef: r.titulo }
    setCtx(c); setQ(''); setItens([]); setVisor(undefined); window.scrollTo(0, 0)
    if (await iaConfigurada()) {
      setInterpretando(true)
      try {
        const l = await interpretarBusca(`Obras parecidas com esta referência do meu acervo (forma, superfície, técnica, tema, autor). Título: ${r.titulo}.${r.autor ? ' Autor: ' + r.autor + '.' : ''} Tipo: ${r.tipo}. Tags: ${r.tags.join(', ') || 'nenhuma'}.${r.descricao ? ' Descrição: ' + r.descricao.slice(0, 400) : ''}`)
        c = { ...c, leitura: l.leitura, consultas: l.consultas }
      } catch { /* segue com as tags */ } finally { setInterpretando(false) }
    }
    if (!c.consultas?.length) {
      const base = [r.autor, ...r.tags.slice(0, 5).map(traduz), traduz(r.titulo)].filter((x): x is string => !!x && x.length > 2)
      c = { ...c, consultas: base.slice(0, 6).map((q) => ({ q, universo: 'objetos' })) }
    }
    setCtx(c); carregar(true, c)
  }

  async function agir(item: ItemDescoberta, tipo: Interacao) {
    if (tipo === 'curtir') {
      if (curtidos.has(item.id)) { await descurtir(item); setCurtidos((s) => { const n = new Set(s); n.delete(item.id); return n }); return }
      await registrar(item, 'curtir'); setCurtidos((s) => new Set(s).add(item.id))
      // nas primeiras curtidas, explica o que acontece
      try { const n = Number(localStorage.getItem(DICA_CURTIR) ?? 0); if (n < 3) { localStorage.setItem(DICA_CURTIR, String(n + 1)); toast('Curtida. O próximo lote traz mais coisas assim.') } } catch { /* sem armazenamento */ }
      return
    }
    if (tipo === 'recusar') { await registrar(item, 'recusar'); setItens((xs) => xs.filter((x) => x.id !== item.id)); toast('Entendido. Menos coisas assim.'); return }
    if (tipo === 'salvar') {
      // salva e já oferece o grupo (pasta) das Referências; dá para fechar sem escolher
      const ref = salvos.get(item.id) ?? await salvarNoAcervo(item)
      if (!salvos.has(item.id)) { await registrar(item, 'salvar'); toast('Salvo no acervo') }
      setGrupoPara(ref); return
    }
    if (tipo === 'semelhantes') { await registrar(item, 'semelhantes'); const c: Contexto = { tipo: 'semelhantes', item }; setCtx(c); setVisor(undefined); setItens([]); window.scrollTo(0, 0); carregar(true, c) }
  }
  async function buscar(e: React.FormEvent) {
    e.preventDefault(); const t = q.trim()
    if (!t) { voltarAoFeed(); return }
    let c: Contexto = { tipo: 'busca', q: t }
    setCtx(c); setItens([])
    // com a IA configurada, toda busca (em português ou outra língua) vira consultas em inglês e nos idiomas dos acervos
    if (await iaConfigurada()) {
      setInterpretando(true)
      try { const l = await interpretarBusca(t); c = { ...c, leitura: l.leitura, consultas: l.consultas }; setCtx(c) }
      catch (err) { toast('Busca sem IA: ' + (err as Error).message) }
      finally { setInterpretando(false) }
    }
    registrar(null, 'pesquisar', c.tipo === 'busca' && c.consultas ? c.consultas.filter((x) => !x.lingua).flatMap((x) => x.q.split(/\s+/)).filter((w) => w.length > 3) : traduz(t).split(/\s+/).filter((w) => w.length > 3))
    carregar(true, c)
  }
  function voltarAoFeed() { const c: Contexto = { tipo: 'feed' }; setQ(''); setCtx(c); setItens([]); carregar(true, c) }
  function abrirTema(id: string) {
    const t = TEMAS.find((x) => x.id === id)!
    if (ctx.tipo === 'busca' && ctx.tema === id) { voltarAoFeed(); return }
    const c: Contexto = { tipo: 'busca', q: t.nome, tema: id, consultas: [...t.consultas].sort(() => Math.random() - .5).map((q) => ({ q, universo: t.universo })) }
    setQ(''); setCtx(c); setItens([]); window.scrollTo(0, 0); carregar(true, c)
  }
  function abrirCurtidas() { const c: Contexto = { tipo: 'curtidas' }; setTemaCurt(undefined); setQ(''); setCtx(c); setItens([]); window.scrollTo(0, 0); carregar(true, c) }
  const obraDoDia = useObraDoDia(itens, ctx.tipo === 'feed' && modo === 'para-voce')
  const [visorUnico, setVisorUnico] = useState<ItemDescoberta>()
  const [temaCurt, setTemaCurt] = useState<TemaCurtidas>()
  const lista = ctx.tipo === 'curtidas' && temaCurt ? itens.filter((x) => temaCurt.ids.includes(x.id)) : itens

  /** Busca por foto: tirada na hora ou da galeria. */
  async function porFoto(arq?: File) {
    if (!arq) return
    if (!(await iaConfigurada())) { toast('A busca por foto precisa da IA configurada.'); return }
    let c: Contexto = { tipo: 'busca', q: 'sua foto', foto: URL.createObjectURL(arq) }
    setQ(''); setCtx(c); setItens([]); setVisor(undefined); window.scrollTo(0, 0); setInterpretando(true)
    try { const l = await buscarPorFoto(arq); c = { ...c, leitura: l.leitura, consultas: l.consultas }; setCtx(c) }
    catch (err) { toast('Não deu para ler a foto: ' + (err as Error).message); setInterpretando(false); return }
    setInterpretando(false)
    registrar(null, 'pesquisar', (c.consultas ?? []).filter((x) => !x.lingua).flatMap((x) => x.q.split(/\s+/)).filter((w) => w.length > 3))
    carregar(true, c)
  }
  function maisDoTema(t: TemaCurtidas) {
    const c: Contexto = { tipo: 'busca', q: t.nome, leitura: t.descricao, consultas: [{ q: t.consulta, universo: '' }] }
    setTemaCurt(undefined); setQ(t.nome); setCtx(c); setItens([]); window.scrollTo(0, 0); carregar(true, c)
  }

  const falhas = estados.filter((e) => !e.ok && !e.pausada)
  return (
    <div className="page acervo">
      <TopoRef aba="descobrir" icones={<>
        <button className={'iconbtn' + (carregando ? ' girando' : '')} aria-label="Novas recomendações" title="Novas recomendações" onClick={() => { setItens([]); carregar(true) }}><RefreshCw size={18} className={carregando ? 'gira' : ''} /></button>
        <Menu itens={[
          { l: 'Novas recomendações', icon: <RefreshCw size={16} />, onClick: () => { setItens([]); carregar(true) } },
          { l: 'Ajustar curadoria', icon: <SlidersHorizontal size={16} />, onClick: () => setPainel('ajustes') },
          { l: 'Fontes', icon: <Plug size={16} />, onClick: () => setPainel('fontes') },
          { l: 'Meu repertório estético', icon: <Sparkles size={16} />, to: '/referencias/repertorio' },
        ]} />
      </>}>
        <form className="busca-c" onSubmit={buscar}><Search size={16} />
          <input className="input" placeholder="Pesquisar ou descrever o que procura" value={q} onChange={(e) => setQ(e.target.value)} enterKeyHint="search" />
          {q && <button type="button" className="limpar-busca" aria-label="Limpar" onClick={voltarAoFeed}><X size={15} /></button>}
          <label className="busca-foto" aria-label="Buscar por foto" title="Buscar por foto"><Camera size={17} /><input type="file" accept="image/*" hidden onChange={(e) => { porFoto(e.target.files?.[0]); e.target.value = '' }} /></label>
        </form>
      </TopoRef>

      {ctx.tipo === 'feed' && (
        <div className="chips" style={{ marginBottom: 8 }}>
          {MODOS.map(([k, l]) => <button key={k} className={'chip' + (modo === k ? ' on' : '')} onClick={() => { if (modo !== k) { setItens([]); definirAjuste('descobrir.modo', k) } }}>{l}</button>)}
        </div>
      )}
      {ctx.tipo !== 'curtidas' && (
        <div className="chips epocas" role="group" aria-label="Época" style={{ marginBottom: 8 }}>
          {(Object.keys(EPOCAS) as Epoca[]).map((k) => <button key={k} className={'chip' + (epoca === k ? ' on' : '')} onClick={() => { if (epoca !== k) { setItens([]); definirAjuste('descobrir.epoca', k) } }}>{EPOCAS[k].nome}</button>)}
        </div>
      )}
      {(ctx.tipo === 'feed' || (ctx.tipo === 'busca' && ctx.tema) || ctx.tipo === 'curtidas') && (
        <div className="chips temas-desc" style={{ marginBottom: 10 }}>
          <button className={'chip' + (ctx.tipo === 'curtidas' ? ' on' : '')} onClick={() => (ctx.tipo === 'curtidas' ? voltarAoFeed() : abrirCurtidas())}><Heart size={13} fill={ctx.tipo === 'curtidas' ? 'currentColor' : 'none'} />Curtidas{curtidos.size ? ` ${curtidos.size}` : ''}</button>
          {TEMAS.map((t) => <button key={t.id} className={'chip' + (ctx.tipo === 'busca' && ctx.tema === t.id ? ' on' : '')} onClick={() => abrirTema(t.id)}>{t.nome}</button>)}
        </div>
      )}
      {ctx.tipo !== 'feed' && (
        <div className="contexto-desc">
          <span>{ctx.tipo === 'curtidas' ? <>Suas curtidas{itens.length ? ` (${itens.length})` : ''}</> : ctx.tipo === 'busca' ? (ctx.foto ? <><img className="busca-foto-mini" src={ctx.foto} alt="" />Parecidos com a sua foto{ctx.leitura && <small className="leitura-ia"><Sparkles size={12} /> {ctx.leitura}</small>}</> : ctx.deRef ? <>Semelhantes a <b>{ctx.deRef}</b>{ctx.leitura && <small className="leitura-ia"><Sparkles size={12} /> {ctx.leitura}</small>}</> : ctx.tema ? <>Tema <b>{ctx.q}</b></> : <>Resultados para <b>“{ctx.q}”</b>{ctx.leitura && <small className="leitura-ia"><Sparkles size={12} /> {ctx.leitura}</small>}</>) : <>Mais como <b>{ctx.item.titulo}</b></>}</span>
          <button className="btn sm ghost" onClick={voltarAoFeed}>Voltar ao feed</button>
        </div>
      )}
      {ctx.tipo === 'curtidas' && <TemasDasCurtidas itens={itens} sel={temaCurt} onSel={setTemaCurt} onMais={maisDoTema} />}
      {ctx.tipo === 'feed' && modo === 'para-voce' && obraDoDia && <ObraDoDia x={obraDoDia} curtido={curtidos.has(obraDoDia.id)} salvo={salvos.has(obraDoDia.id)} onAbrir={() => setVisorUnico(obraDoDia)} onCurtir={() => agir(obraDoDia, 'curtir')} onSalvar={() => agir(obraDoDia, 'salvar')} />}

      {falhas.length > 0 && !carregando && <p className="aviso-fonte">{falhas.map((f) => FONTE[f.id].nome).join(', ')} não {falhas.length > 1 ? 'responderam' : 'respondeu'} agora ({falhas[0].erro}). As outras seguem normalmente.</p>}

      {itens.length === 0 && !carregando && !interpretando ? (
        <div className="empty"><Compass size={26} strokeWidth={1.1} style={{ color: 'var(--argila)' }} />
          <span className="serif">{ctx.tipo === 'curtidas' ? 'Nenhuma curtida ainda.' : estados.length && estados.every((e) => !e.ok) ? 'As fontes não responderam.' : 'Nada por aqui ainda.'}</span>
          <span>{estados.length && estados.every((e) => !e.ok) ? 'Confira a internet e toque em atualizar.' : 'Toque em atualizar para buscar novas referências.'}</span>
          <button className="btn sm" onClick={() => carregar(true)}><RefreshCw size={14} />Atualizar</button></div>
      ) : <MuralDescobrir itens={lista} curtidos={curtidos} salvos={salvos} onAbrir={setVisor} onAgir={agir} />}
      {(carregando || interpretando) && <div className="carregando-desc">{interpretando ? <><Sparkles size={16} className="gira" />Entendendo o pedido…</> : <><RefreshCw size={16} className="gira" />Buscando nos acervos…</>}</div>}
      <div ref={fim} style={{ height: 1 }} />

      {visor != null && lista[visor] && <VisorDescobrir itens={lista} inicio={visor} curtidos={curtidos} salvos={salvos} onClose={() => setVisor(undefined)} onAgir={agir} />}
      {visorUnico && <VisorDescobrir itens={[visorUnico]} inicio={0} curtidos={curtidos} salvos={salvos} onClose={() => setVisorUnico(undefined)} onAgir={(x, t) => { if (t === 'semelhantes' || t === 'recusar') setVisorUnico(undefined); return agir(x, t) }} />}
      {grupoPara && <EscolherGrupos ids={[grupoPara]} onClose={() => setGrupoPara(undefined)} />}
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
          <button aria-label="Salvar nas referências" className={salvos.has(x.id) ? 'on' : ''} onClick={() => onAgir(x, 'salvar')}>{salvos.has(x.id) ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}</button>
          <button aria-label="Não gostei" onClick={() => onAgir(x, 'recusar')}><EyeOff size={14} /></button>
        </div>
      </div>))}</div>)}
  </div>
}

function VisorDescobrir({ itens, inicio, curtidos, salvos, onClose, onAgir }: { itens: ItemDescoberta[]; inicio: number; curtidos: Set<string>; salvos: Map<string, string>; onClose: () => void; onAgir: (x: ItemDescoberta, t: Interacao) => unknown }) {
  const [i, setI] = useState(inicio)
  const [acao, setAcao] = useState<{ tipo: 'grupos' | 'painel'; ref: string }>()
  const [extra, setExtra] = useState<'explicar' | 'comparar'>()
  const [pop, setPop] = useState(0)
  const ultimoToque = useRef(0)
  const toque = useRef<{ x: number; y: number } | undefined>(undefined)
  const [arrasto, setArrasto] = useState<{ dx: number; dy: number }>()
  const [dica] = useState(() => { try { const k = Number(localStorage.getItem(DICA_GESTOS) ?? 0); if (k < 4) { localStorage.setItem(DICA_GESTOS, String(k + 1)); return true } } catch { /* sem armazenamento */ } return false })
  const toast = useToast()
  const n = itens.length; const x = itens[Math.min(i, n - 1)]
  const ir = (d: number) => setI((v) => (v + d + n) % n)
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (acao || extra) return; if (e.key === 'Escape') onClose(); if (e.key === 'ArrowLeft') ir(-1); if (e.key === 'ArrowRight') ir(1) }
    window.addEventListener('keydown', k); const o = document.body.style.overflow; document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = o }
  })
  if (!x) return null
  async function levar(tipo: 'grupos' | 'painel') {
    const ref = salvos.get(x.id) ?? await salvarNoAcervo(x)
    if (!salvos.has(x.id)) { await registrar(x, tipo === 'painel' ? 'painel' : 'salvar'); toast('Salvo no acervo') } else if (tipo === 'painel') await registrar(x, 'painel')
    setAcao({ tipo, ref })
  }
  async function salvarRapido() {
    if (salvos.has(x.id)) { toast('Já está no acervo'); return }
    await salvarNoAcervo(x); await registrar(x, 'salvar'); toast('Salvo no acervo')
  }
  // gestos no celular: → curte e passa, ← descarta, ↑ salva no acervo, ↓ fecha
  function soltar(dx: number, dy: number) {
    setArrasto(undefined)
    if (Math.abs(dx) > LIMIAR && Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) { if (!curtidos.has(x.id)) onAgir(x, 'curtir'); setPop((v) => v + 1); setTimeout(() => ir(1), 260) }
      else onAgir(x, 'recusar')
    } else if (dy < -LIMIAR && Math.abs(dy) > Math.abs(dx)) salvarRapido()
    else if (dy > LIMIAR * 1.5 && Math.abs(dy) > Math.abs(dx)) onClose()
  }
  const rotulo = !arrasto ? undefined : Math.abs(arrasto.dx) > Math.abs(arrasto.dy) ? (arrasto.dx > 40 ? 'Curtir' : arrasto.dx < -40 ? 'Não gostei' : undefined) : (arrasto.dy < -40 ? 'Salvar' : arrasto.dy > 60 ? 'Fechar' : undefined)
  return createPortal(
    <div className="visor visor-ref" role="dialog" aria-label={x.titulo}>
      <div className="visor-topo"><span>{FONTE[x.fonte].nome}</span><button className="visor-btn" aria-label="Fechar" onClick={onClose}><X size={20} /></button></div>
      <div className="visor-img"
        onTouchStart={(e) => { toque.current = { x: e.touches[0].clientX, y: e.touches[0].clientY } }}
        onTouchMove={(e) => { const t = toque.current; if (t) setArrasto({ dx: e.touches[0].clientX - t.x, dy: e.touches[0].clientY - t.y }) }}
        onTouchEnd={(e) => { const t = toque.current; toque.current = undefined; if (t) soltar(e.changedTouches[0].clientX - t.x, e.changedTouches[0].clientY - t.y) }}
        onTouchCancel={() => { toque.current = undefined; setArrasto(undefined) }}
        onClick={() => {
        // toque duplo na imagem curte (como nas redes)
        const agora = Date.now()
        if (agora - ultimoToque.current < 320) { if (!curtidos.has(x.id)) onAgir(x, 'curtir'); setPop((v) => v + 1); ultimoToque.current = 0 } else ultimoToque.current = agora
      }}><img key={x.id} src={x.imagemGrande} alt={x.titulo} referrerPolicy="no-referrer" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', transform: arrasto ? `translate(${arrasto.dx}px, ${Math.min(arrasto.dy, 0) + Math.max(arrasto.dy, 0) * .5}px) rotate(${arrasto.dx / 25}deg)` : undefined, transition: arrasto ? 'none' : 'transform .2s ease' }} onError={(e) => { if (e.currentTarget.src !== x.imagem) e.currentTarget.src = x.imagem }} />
        {pop > 0 && <Heart key={pop} size={86} className="coracao-pop" fill="currentColor" />}
        {rotulo && <span className={'gesto-rotulo ' + rotulo.toLowerCase().replace(/\s/g, '-')}>{rotulo}</span>}
        {dica && !arrasto && <span className="gesto-dica">→ curte · ← não gostei · ↑ salva · ↓ fecha</span>}</div>
      <div className="desc-info">
        <p className="t">{x.titulo}</p>
        <p className="s">{[x.autor, x.data].filter(Boolean).join(' · ')}</p>
        <p className="l">{x.licenca}{x.universo ? ' · ' + (UNIVERSOS[x.universo]?.nome ?? '') : ''}</p>
        {(x.motivo || x.consulta) && <p className="l porque">{x.motivo ?? `Apareceu pela busca “${x.consulta}”`}</p>}
      </div>
      <div className="visor-acoes desc rotulos">
        <button className={'visor-acao' + (curtidos.has(x.id) ? ' on' : '')} onClick={() => onAgir(x, 'curtir')}><span className="visor-btn"><Heart size={18} fill={curtidos.has(x.id) ? 'currentColor' : 'none'} /></span>Curtir</button>
        <button className={'visor-acao' + (salvos.has(x.id) ? ' on' : '')} onClick={() => levar('grupos')}><span className="visor-btn">{salvos.has(x.id) ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}</span>Salvar</button>
        <button className="visor-acao" onClick={() => onAgir(x, 'semelhantes')}><span className="visor-btn"><ScanSearch size={18} /></span>Mais assim</button>
        <button className="visor-acao" onClick={() => setExtra('explicar')}><span className="visor-btn"><BookOpen size={18} /></span>Sobre</button>
        <button className="visor-acao" onClick={() => setExtra('comparar')}><span className="visor-btn"><Columns2 size={18} /></span>Comparar</button>
        <button className="visor-acao" onClick={() => onAgir(x, 'recusar')}><span className="visor-btn"><EyeOff size={18} /></span>Não gostei</button>
      </div>
      <div className="visor-links">
        <button onClick={() => levar('painel')}><LayoutDashboard size={13} />Levar a um painel</button>
        <a href={x.link} target="_blank" rel="noreferrer"><ExternalLink size={13} />Ver no museu</a>
      </div>
      {extra === 'explicar' && <ExplicarObra x={x} onClose={() => setExtra(undefined)} />}
      {extra === 'comparar' && <CompararObra x={x} onClose={() => setExtra(undefined)} />}
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
    <LeituraIA p={p} onNova={(g) => setP({ ...p, gostoIA: g })} />
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

/** Leitura do gosto feita pela IA, com o que ela propôs buscar e o que evita. */
function LeituraIA({ p, onNova }: { p: Perfil; onNova: (g: Perfil['gostoIA']) => void }) {
  const [rodando, setRodando] = useState(false)
  const toast = useToast()
  const g = p.gostoIA
  async function agora() {
    setRodando(true)
    try { const n = await atualizarGostoIA(true); if (n) { onNova(n); toast('Leitura do gosto atualizada') } else toast('A IA não está configurada') }
    catch (e) { toast('A IA não respondeu: ' + (e as Error).message) }
    finally { setRodando(false) }
  }
  return <div className="filtro-sec"><div className="filtro-tit"><span>Leitura do seu gosto (IA)</span></div>
    {g ? <>
      <p style={{ fontSize: 14, lineHeight: 1.5, margin: '0 0 8px' }}>{g.resumo}</p>
      <p className="faint" style={{ fontSize: 12.5 }}>Buscas que a IA sugeriu: {g.consultas.slice(0, 8).map((c) => c.q).join(', ')}{g.consultas.length > 8 ? '…' : ''}</p>
      {g.evitar.length > 0 && <p className="faint" style={{ fontSize: 12.5 }}>Evitando: {g.evitar.join(', ')}</p>}
      <p className="faint" style={{ fontSize: 12, marginTop: 6 }}>Atualizada em {new Date(g.quando).toLocaleDateString('pt-BR')}. Renova sozinha quando há curtidas novas, no máximo a cada 12 horas.</p>
    </> : <p className="faint" style={{ fontSize: 13 }}>Depois de algumas curtidas, a IA lê o seu gosto e sugere buscas novas para o feed.</p>}
    <button className="btn sm ghost" style={{ marginTop: 6 }} disabled={rodando} onClick={agora}><Sparkles size={14} className={rodando ? 'gira' : ''} />{rodando ? 'Lendo o seu gosto…' : 'Atualizar leitura agora'}</button>
  </div>
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
          <div><div className="t">{f.nome}</div><div className="s">{!p.fontes[f.id] ? 'Desligada' : !e ? 'Ainda não consultada nesta sessão' : e.ok ? 'Respondendo normalmente' : e.pausada ? `Recusou os pedidos (${e.erro}). Pausada por algumas horas; as outras fontes cobrem o feed.` : `Sem resposta: ${e.erro}`}</div></div>
          <button className={'chip' + (p.fontes[f.id] ? ' on' : '')} onClick={async () => { retomarFonte(f.id); const np = { ...p, fontes: { ...p.fontes, [f.id]: !p.fontes[f.id] } }; setP(np); await salvarPerfil(np) }}>{p.fontes[f.id] ? 'Ligada' : 'Desligada'}</button>
        </div>) })}
      {FONTES_PENDENTES.map((f) => <div key={f.nome} className="row" style={{ gridTemplateColumns: '1fr' }}><div><div className="t">{f.nome}</div><div className="s">{f.estado}</div></div></div>)}
    </div>
  </Sheet>
}
