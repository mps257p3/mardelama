import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Bookmark, BookmarkCheck, BookOpen, Camera, Columns2, Compass, ExternalLink, Eye, EyeOff, FlaskConical, Heart, LayoutDashboard, RefreshCw, ScanSearch, Search, SlidersHorizontal, Sparkles, ThumbsDown, X } from 'lucide-react'
import { db } from '../../db/schema'
import { useAjuste, definirAjuste } from '../../db/settings'
import { FONTES, type ItemDescoberta } from '../../lib/fontes'
import { buscarLote, descurtir, diversificar, registrar, salvarNoAcervo, traduz, UNIVERSOS, type Interacao, type Pedido } from '../../lib/curadoria'
import { buscarPorFoto, iaConfigurada, interpretarBusca, leituraEmCache, type Consulta } from '../../lib/iaRepertorio'
import {
  CATEGORIAS, EPOCAS2, FILTROS2_VAZIO, LINGUAGENS, MODOS2, PERFIL2, chavesDoItem, contar, contarMostrados, ehItemPin, epocaBase, imagensDoRepertorio,
  itemDoPin, lerConfig2, lerPerfil2, marcarPinsVistos, nFiltros2, nomeDaFonte, perfilDeBusca, pinsNovos, planejar2, planejarArtistas, planejarDoPinterest,
  salvarPerfil2, todosOsTemas, useConfig2, type Categoria, type Modo2,
} from '../../lib/ref2'
import { ideiaDeDescobrir } from '../../lib/ideias'
import { imagemDaRef, imagemDeUrl, imagensDoArtista } from '../../lib/visao'
import { Menu } from '../../ui/Menu'
import { useToast } from '../../ui/toast'
import { useFecharComVoltar } from '../../ui/voltarFecha'
import { travarRolagem } from '../../ui/rolagem'
import { EscolherGrupos, EscolherPainel } from '../ref/acoesRefs'
import { CompararObra, ExplicarObra } from '../ref/descobrirExtras'
import { useEstadoVisao, useFiltroVisual, ordenarPorNota, type Alvo } from '../ref/filtroVisual'
import { BASE2, Topo2 } from './Topo2'
import { FiltrosAvancados } from './FiltrosAvancados'
import { filtrosAtuais, mudarFiltros2, ROT_INTERACAO, useFiltros2 } from './filtros2'
import { NovidadesPinterest } from './NovidadesPinterest'

type Contexto = { tipo: 'feed' } | { tipo: 'busca'; q: string; leitura?: string; consultas?: Consulta[]; deRef?: string; deRefId?: string; foto?: string } | { tipo: 'semelhantes'; item: ItemDescoberta }
const VALIDADE = 30 * 60000
// o lote fica só na memória (separado do Descobrir original): navegar e voltar mantém o feed
let memoria: { itens: ItemDescoberta[]; quando: number; chave: string; ctx: Contexto } | undefined
const LIMIAR = 80

export default function Descobrir2() {
  const toast = useToast()
  const cfg = useConfig2()
  const f = useFiltros2()
  const modo = useAjuste<Modo2>('ref2.modo', 'para-voce')
  const subArt = useAjuste<'seus' | 'novos'>('ref2.artistas.sub', 'seus')
  const chaveFeed = JSON.stringify([modo, subArt, f.fontes, f.epoca, f.linguagens, f.temas, f.interacao])
  const cache = useRef(memoria)
  const [ctx, setCtx] = useState<Contexto>(cache.current?.ctx ?? { tipo: 'feed' })
  const [itens, setItens] = useState<ItemDescoberta[]>(cache.current?.itens ?? [])
  const [carregando, setCarregando] = useState(false)
  const [interpretando, setInterpretando] = useState(false)
  const [q, setQ] = useState(ctx.tipo === 'busca' ? ctx.q : '')
  const [visor, setVisor] = useState<number>()
  const [painelFiltros, setPainelFiltros] = useState(false)
  const [curtidos, setCurtidos] = useState<Set<string>>(new Set())
  const [grupoPara, setGrupoPara] = useState<string>()
  const [vazias, setVazias] = useState(0)
  const [todasFalharam, setTodasFalharam] = useState(false)
  const rodada = useRef(0)
  const ocupado = useRef(0)
  const fim = useRef<HTMLDivElement>(null)
  const [params, setParams] = useSearchParams()
  const salvos = useLiveQuery(async () => new Map((await db.referencias.filter((r) => !!r.origem?.startsWith('descobrir:') && !r.excluido).toArray()).map((r) => [r.origem!.slice(10), r.id])), [], new Map<string, string>())
  const lista = f.interacao === 'curtidas' || f.interacao === 'salvas' || f.interacao === 'ocultadas'

  useEffect(() => { lerPerfil2().then((p) => setCurtidos(new Set(p.curtidos))) }, [])

  const itensRef = useRef(itens)
  useEffect(() => { itensRef.current = itens }, [itens])
  const carregar = useCallback(async (novo: boolean, c: Contexto = ctx, manterTela = false) => {
    const fl = filtrosAtuais()
    // listas guardadas (curtidas, salvas, ocultadas): não buscam nada nas fontes
    if (c.tipo === 'feed' && (fl.interacao === 'curtidas' || fl.interacao === 'salvas' || fl.interacao === 'ocultadas')) {
      if (!novo) return
      const p = await lerPerfil2()
      const xs = [...(fl.interacao === 'curtidas' ? p.curtidasItens ?? [] : fl.interacao === 'salvas' ? p.salvosItens ?? [] : p.ocultadosItens ?? [])].reverse()
      setItens(xs); memoria = { itens: xs, quando: Date.now(), chave: chaveFeedAtual(), ctx: c }; return
    }
    if (ocupado.current && !manterTela) return
    ocupado.current++; setCarregando(true); setTodasFalharam(false)
    rodada.current = novo ? 0 : rodada.current + 1
    try {
      const [perfil, conf] = await Promise.all([lerPerfil2(), lerConfig2()])
      const pb = perfilDeBusca(perfil, conf)
      const naoVistas = fl.interacao === 'nao-vistas'
      const conhecidos = new Set([...(novo && !manterTela ? [] : itensRef.current.map((i) => i.id)), ...(c.tipo === 'feed' || naoVistas ? perfil.vistos.slice(-800) : []), ...(naoVistas ? perfil.abertos ?? [] : [])])
      const permitidas = fl.fontes.length ? fl.fontes.flatMap((k) => CATEGORIAS[k].fontes) : undefined
      const restringe = (ps: Pedido[]) => (permitidas ? ps.map((p) => ({ ...p, fontes: [...permitidas].sort(() => Math.random() - .5) })) : ps)
      let pedidos: Pedido[]; let vagas = 0; let epoca = epocaBase(fl.epoca).epoca
      let pins: ItemDescoberta[] = []
      if (c.tipo === 'busca' && c.consultas?.length) pedidos = restringe(c.consultas.map((x) => ({ q: x.q, universo: x.universo, fonte: x.fonte, tipo: 'busca' as const })))
      else if (c.tipo === 'busca') { const t = traduz(c.q); pedidos = restringe(FONTES.map(() => ({ q: t, tipo: 'busca' as const })).concat(FONTES.map(() => ({ q: t, tipo: 'busca' as const })))) }
      else if (c.tipo === 'semelhantes') { const it = c.item; pedidos = restringe([it.autor, ...it.termos.slice(0, 3)].filter(Boolean).map((b) => ({ q: b as string, universo: it.universo, tipo: 'semelhantes' as const })).slice(0, 6)) }
      else {
        const plano = modo === 'artistas' ? await planejarArtistas(perfil, conf, subArt, fl)
          : modo === 'pinterest' ? await planejarDoPinterest(conf, fl)
          : await planejar2(perfil, conf, fl, modo)
        pedidos = plano.pedidos; vagas = plano.vagasPinterest; epoca = plano.epoca
        // vagas do Pinterest: pins que chegaram às suas pastas e você ainda não viu aqui (já estão no Acervo)
        if (vagas > 0) {
          const ja = new Set(itensRef.current.map((x) => x.id))
          const novos = (await pinsNovos(vagas * 2)).filter((r) => !ja.has('pin:' + r.id)).slice(0, vagas * 2)
          pins = novos.map((r) => itemDoPin(r)).filter((x) => x.imagem)
          await marcarPinsVistos(novos.map((r) => r.id))
        }
      }
      // Novos artistas mostra gente fora dos seus estudos, nunca os próprios estudados
      const conhecidosArt = c.tipo === 'feed' && modo === 'artistas' && subArt === 'novos'
        ? new Set((await db.artistas.toArray()).filter((a) => !a.excluido).map((a) => a.nome)) : undefined
      const busLivre = c.tipo === 'busca'
      const porAutor = busLivre ? 99 : c.tipo === 'semelhantes' ? 4 : 2, porSerie = busLivre ? 99 : 3
      let trocar = novo && !manterTela
      const somar = (xs: ItemDescoberta[], substituir: boolean, final = false) => setItens((prev) => {
        const antes = substituir ? [] : prev
        const ids = new Set(antes.map((x) => x.id))
        const novosX = diversificar(xs.filter((x) => !ids.has(x.id)), antes, porAutor, porSerie)
        contarMostrados(novosX)
        const l = [...antes, ...novosX]
        itensRef.current = l
        if (final) memoria = { itens: l.slice(-300), quando: Date.now(), chave: chaveFeedAtual(), ctx: c }
        return l
      })
      if (pins.length) { somar(pins, trocar); trocar = false }
      const aoChegar = (xs: ItemDescoberta[]) => {
        const fx = conhecidosArt ? xs.filter((x) => !x.autor || !conhecidosArt.has(x.autor)) : xs
        if (!fx.length) return
        somar(fx, trocar); trocar = false
      }
      let { itens: novos, estados } = pedidos.length ? await buscarLote(pb, pedidos, conhecidos, 6, rodada.current, epoca, aoChegar) : { itens: [] as ItemDescoberta[], estados: [] }
      if (conhecidosArt) novos = novos.filter((x) => !x.autor || !conhecidosArt.has(x.autor))
      somar(novos, trocar, true)
      // diagnóstico das fontes: respostas, falhas, quantos resultados
      for (const e of estados) contar(['f:' + e.id], e.ok ? { ok: 1 } : { falhas: 1 }, e.ok ? { ultimoOk: e.quando } : { ultimaFalha: e.quando, erro: e.erro })
      const porFonte = new Map<string, number>(); novos.forEach((x) => porFonte.set(x.fonte, (porFonte.get(x.fonte) ?? 0) + 1))
      for (const [k, n] of porFonte) contar(['f:' + k], { resultados: n })
      setVazias((v) => (novos.length || pins.length ? 0 : v + 1))
      if (c.tipo === 'feed' && novos.length) { const p = await lerPerfil2(); p.vistos = [...p.vistos.slice(-1500), ...novos.map((x) => x.id)]; await salvarPerfil2(p) }
      if (!novos.length && !pins.length && estados.length && estados.every((e) => !e.ok)) setTodasFalharam(true)
    } finally { ocupado.current--; if (!ocupado.current) setCarregando(false) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx, modo, subArt])
  const chaveFeedAtual = () => { const fl = filtrosAtuais(); return JSON.stringify([modoAtual.current, subAtual.current, fl.fontes, fl.epoca, fl.linguagens, fl.temas, fl.interacao]) }
  const modoAtual = useRef(modo); const subAtual = useRef(subArt)
  useEffect(() => { modoAtual.current = modo; subAtual.current = subArt }, [modo, subArt])

  // primeira abertura, troca de modo/filtros ou feed vencido: lote novo
  useEffect(() => {
    const ref = params.get('ref')
    if (ref) { setParams({}, { replace: true }); semelhantesDaRef(ref); return }
    const c = cache.current
    cache.current = undefined
    if (c && c.chave === chaveFeed && c.itens.length && !(c.ctx.tipo === 'feed' && Date.now() - c.quando > VALIDADE)) return
    if (ctx.tipo !== 'feed') { setCtx({ tipo: 'feed' }); setQ('') }
    setItens([]); setVazias(0); carregar(true, { tipo: 'feed' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveFeed])

  useEffect(() => {
    const el = fim.current; if (!el || lista) return
    const io = new IntersectionObserver((es) => { if (es[0].isIntersecting && itens.length && vazias < 4) carregar(false) }, { rootMargin: '900px' })
    io.observe(el); return () => io.disconnect()
  }, [carregar, itens.length, vazias, lista])

  async function semelhantesDaRef(id: string) {
    const r = await db.referencias.get(id); if (!r) return
    let c: Contexto = { tipo: 'busca', q: r.titulo, deRef: r.titulo, deRefId: r.id }
    setCtx(c); setQ(''); setItens([]); setVisor(undefined); window.scrollTo(0, 0)
    if (await iaConfigurada()) {
      setInterpretando(true)
      try {
        const l = await interpretarBusca(`Obras parecidas com esta referência do meu acervo (forma, superfície, técnica, tema, autor). Título: ${r.titulo}.${r.autor ? ' Autor: ' + r.autor + '.' : ''} Tipo: ${r.tipo}. Tags: ${r.tags.join(', ') || 'nenhuma'}.${r.descricao ? ' Descrição: ' + r.descricao.slice(0, 400) : ''}`)
        c = { ...c, leitura: l.leitura, consultas: l.consultas }
      } catch { /* segue com as tags */ } finally { setInterpretando(false) }
    }
    if (!c.consultas?.length) c = { ...c, consultas: [r.autor, ...r.tags.slice(0, 5).map(traduz), traduz(r.titulo)].filter((x): x is string => !!x && x.length > 2).slice(0, 6).map((q) => ({ q, universo: 'objetos' })) }
    setCtx(c); carregar(true, c)
  }

  async function buscar(e: React.FormEvent) {
    e.preventDefault(); const t = q.trim()
    if (!t) { voltarAoFeed(); return }
    let c: Contexto = { tipo: 'busca', q: t }
    setCtx(c); setItens([]); setVisor(undefined)
    let simples: Promise<void> | undefined
    if (await iaConfigurada()) {
      const ja = await leituraEmCache(t)
      if (ja) { c = { ...c, leitura: ja.leitura, consultas: ja.consultas }; setCtx(c) }
      else {
        simples = carregar(true, c)
        setInterpretando(true)
        try { const l = await interpretarBusca(t); c = { ...c, leitura: l.leitura, consultas: l.consultas }; setCtx(c) }
        catch (err) { toast('Busca sem IA: ' + (err as Error).message) }
        finally { setInterpretando(false) }
      }
    }
    registrar(null, 'pesquisar', c.consultas ? c.consultas.filter((x) => !x.lingua).flatMap((x) => x.q.split(/\s+/)).filter((w) => w.length > 3) : traduz(t).split(/\s+/).filter((w) => w.length > 3), PERFIL2)
    if (simples) { await simples; if (c.consultas) carregar(true, c, true) } else carregar(true, c)
  }
  async function porFoto(arq?: File) {
    if (!arq) return
    if (!(await iaConfigurada())) { toast('A busca por imagem precisa da IA configurada.'); return }
    let c: Contexto = { tipo: 'busca', q: 'sua foto', foto: URL.createObjectURL(arq) }
    setQ(''); setCtx(c); setItens([]); setVisor(undefined); window.scrollTo(0, 0); setInterpretando(true)
    try { const l = await buscarPorFoto(arq); c = { ...c, leitura: l.leitura, consultas: l.consultas }; setCtx(c) }
    catch (err) { toast('Não deu para ler a foto: ' + (err as Error).message); setInterpretando(false); return }
    setInterpretando(false)
    carregar(true, c)
  }
  function voltarAoFeed() { const c: Contexto = { tipo: 'feed' }; setQ(''); setCtx(c); setItens([]); carregar(true, c) }

  async function agir(item: ItemDescoberta, tipo: Interacao | 'ocultar' | 'mostrar') {
    const k = chavesDoItem(item)
    if (tipo === 'curtir') {
      if (curtidos.has(item.id)) { await descurtir(item, PERFIL2); setCurtidos((s) => { const n = new Set(s); n.delete(item.id); return n }); contar(k, { curtir: -1 }); return }
      await registrar(item, 'curtir', [], PERFIL2); setCurtidos((s) => new Set(s).add(item.id)); contar(k, { curtir: 1 }); return
    }
    if (tipo === 'recusar') { await registrar(item, 'recusar', [], PERFIL2); contar(k, { recusar: 1 }); setItens((xs) => xs.filter((x) => x.id !== item.id)); toast('Entendido. Menos coisas assim.'); return }
    if (tipo === 'ocultar') {
      const p = await lerPerfil2()
      p.ocultados = [...(p.ocultados ?? []).filter((x) => x !== item.id), item.id].slice(-1500)
      p.ocultadosItens = [...(p.ocultadosItens ?? []).filter((x) => x.id !== item.id), item].slice(-300)
      await salvarPerfil2(p); contar(k, { ocultar: 1 })
      setItens((xs) => xs.filter((x) => x.id !== item.id)); toast('Ocultada. Fica em Filtros › Interações › Ocultadas.'); return
    }
    if (tipo === 'mostrar') {
      const p = await lerPerfil2()
      p.ocultados = (p.ocultados ?? []).filter((x) => x !== item.id); p.ocultadosItens = (p.ocultadosItens ?? []).filter((x) => x.id !== item.id)
      await salvarPerfil2(p); setItens((xs) => xs.filter((x) => x.id !== item.id)); toast('Volta a aparecer no feed.'); return
    }
    if (tipo === 'salvar') {
      if (ehItemPin(item)) { setGrupoPara(item.pin); return }
      const ja = salvos.get(item.id)
      const ref = ja ?? await salvarNoAcervo(item)
      if (!ja) {
        await registrar(item, 'salvar', [], PERFIL2); contar(k, { salvar: 1 })
        const p = await lerPerfil2(); p.salvosItens = [...(p.salvosItens ?? []).filter((x) => x.id !== item.id), item].slice(-500); await salvarPerfil2(p)
        toast('Salvo no Acervo')
      }
      setGrupoPara(ref); return
    }
    if (tipo === 'painel') { await registrar(item, 'painel', [], PERFIL2); contar(k, { painel: 1 }); return }
    if (tipo === 'semelhantes') {
      await registrar(item, 'semelhantes', [], PERFIL2); contar(k, { semelhantes: 1 })
      const c: Contexto = { tipo: 'semelhantes', item }; setCtx(c); setVisor(undefined); setItens([]); window.scrollTo(0, 0); carregar(true, c)
    }
  }
  async function abriu(x: ItemDescoberta) {
    const p = await lerPerfil2()
    if ((p.abertos ?? []).includes(x.id)) return
    p.abertos = [...(p.abertos ?? []).slice(-1500), x.id]; await salvarPerfil2(p)
  }

  /* ---------- Olhar do app: esconde o que não tem nada a ver e mede a afinidade de cada fonte ---------- */
  const estV = useEstadoVisao()
  const chaveCtx = ctx.tipo === 'feed' ? 'feed:' + chaveFeed : ctx.tipo === 'semelhantes' ? 'sem:' + ctx.item.id : 'busca:' + (ctx.foto ?? ctx.deRefId ?? ctx.q)
  const alvoDe = (x: ItemDescoberta): Alvo | undefined => {
    if (ehItemPin(x)) return undefined
    if (ctx.tipo === 'semelhantes') { const it = ctx.item; return { modo: 'ordenar', chave: 'item:' + it.id, imagens: async () => [imagemDeUrl(it.imagem)] } }
    if (ctx.tipo === 'busca' && ctx.foto) { const fo = ctx.foto; return { modo: 'ordenar', chave: 'foto:' + fo, imagens: async () => [imagemDeUrl(fo)] } }
    if (ctx.tipo === 'busca' && ctx.deRefId) { const id = ctx.deRefId; return { modo: 'ordenar', chave: 'ref:' + id, imagens: async () => { const r = await db.referencias.get(id); const im = r && imagemDaRef(r); return im ? [im] : [] } } }
    if (ctx.tipo !== 'feed' || modo === 'explorar') return undefined
    if (x.motivo?.startsWith('Para sair')) return undefined
    if (x.artista) { const nome = x.artista; return { modo: 'filtrar', chave: 'art:' + nome, imagens: async () => { const a = await imagensDoArtista(nome); return a.length >= 2 ? a : imagensDoRepertorio(cfg) } } }
    return { modo: 'filtrar', chave: 'rep2', imagens: () => imagensDoRepertorio(cfg) }
  }
  const { notas, escondidos, lendo } = useFiltroVisual(itens, alvoDe, chaveCtx, cfg.visual && !lista)
  // afinidade visual por fonte (nota menos limiar) e o que foi escondido: vão para o histórico da curadoria, não para a tela
  const medidos = useRef(new Set<string>())
  useEffect(() => {
    const novosEsc: ItemDescoberta[] = []
    for (const x of itens) {
      const n = notas.get(x.id); if (!n || medidos.current.has(x.id)) continue
      medidos.current.add(x.id)
      contar(chavesDoItem(x), { visSoma: n.n - n.limiar, visN: 1, visEscondidas: n.modo === 'filtrar' && n.n < n.limiar ? 1 : 0 })
      if (n.modo === 'filtrar' && n.n < n.limiar) novosEsc.push(x)
    }
    if (novosEsc.length) lerPerfil2().then((p) => { const ant = p.escondidosVisual?.itens ?? []; p.escondidosVisual = { quando: Date.now(), itens: [...ant.filter((a) => !novosEsc.some((b) => b.id === a.id)), ...novosEsc].slice(-120) }; return salvarPerfil2(p) })
  }, [notas, itens])
  const filtrada = itens.filter((x) => !escondidos.has(x.id))
  const mostrar = cfg.visual && (ctx.tipo === 'semelhantes' || (ctx.tipo === 'busca' && (ctx.foto || ctx.deRefId))) ? ordenarPorNota(filtrada, notas) : filtrada

  // uma linha discreta e fixa (não empurra o feed) só enquanto há trabalho
  const status = interpretando ? (itens.length ? 'Refinando a busca com a IA…' : 'Entendendo o pedido…')
    : carregando ? 'Buscando referências…'
    : estV.fase === 'baixando' && cfg.visual ? `Preparando o olhar do app${estV.progresso ? ' · ' + Math.round(estV.progresso * 100) + '%' : '…'}`
    : lendo > 0 ? 'Comparando com o seu repertório…' : undefined

  const nAtivos = nFiltros2(f)
  const temas = todosOsTemas(cfg)
  const nomeCat = (c: Categoria) => CATEGORIAS[c].nome
  return (
    <div className="page acervo ref2">
      <Topo2 aba="descobrir" capa icones={<>
        <button className={'iconbtn' + (carregando ? ' girando' : '')} aria-label="Novas recomendações" title="Novas recomendações" onClick={() => { setItens([]); setVazias(0); carregar(true) }}><RefreshCw size={18} className={carregando ? 'gira' : ''} /></button>
        <Menu itens={[
          { l: 'Novas recomendações', icon: <RefreshCw size={16} />, onClick: () => { setItens([]); setVazias(0); carregar(true) } },
          { l: 'Curadoria', icon: <SlidersHorizontal size={16} />, to: `${BASE2}/curadoria` },
          { l: 'Fontes de descoberta', icon: <Compass size={16} />, to: `${BASE2}/curadoria#fontes` },
          { l: 'Meu repertório estético', icon: <Sparkles size={16} />, to: '/referencias/repertorio' },
        ]} />
      </>}>
        <div className="ref2-busca">
          <form className="busca-c" onSubmit={buscar}><Search size={16} />
            <input className="input" placeholder="Buscar referências..." value={q} onChange={(e) => setQ(e.target.value)} enterKeyHint="search" />
            {q && <button type="button" className="limpar-busca" aria-label="Limpar" onClick={voltarAoFeed}><X size={15} /></button>}
            <label className="busca-foto" aria-label="Buscar por imagem" title="Buscar por imagem"><Camera size={17} /><input type="file" accept="image/*" hidden onChange={(e) => { porFoto(e.target.files?.[0]); e.target.value = '' }} /></label>
          </form>
          <button className={'iconbtn ref2-filtro-btn' + (nAtivos ? ' on' : '')} aria-label="Filtros avançados" onClick={() => setPainelFiltros(true)}><SlidersHorizontal size={18} />{nAtivos > 0 && <span className="badge">{nAtivos}</span>}</button>
        </div>
      </Topo2>

      {ctx.tipo === 'feed' && !lista && <div className="chips ref2-modos">
        {MODOS2.map(([k, l]) => <button key={k} className={'chip' + (modo === k ? ' on' : '')} onClick={() => { if (modo !== k) definirAjuste('ref2.modo', k) }}>{l}</button>)}
      </div>}
      {ctx.tipo === 'feed' && !lista && modo === 'artistas' && <div className="seg ref2-sub">
        <button className={subArt === 'seus' ? 'on' : ''} onClick={() => definirAjuste('ref2.artistas.sub', 'seus')}>Seus artistas</button>
        <button className={subArt === 'novos' ? 'on' : ''} onClick={() => definirAjuste('ref2.artistas.sub', 'novos')}>Novos artistas</button>
      </div>}

      {nAtivos > 0 && <div className="chips ativos">
        {f.fontes.map((c) => <button key={c} className="chip" onClick={() => mudarFiltros2({ fontes: f.fontes.filter((x) => x !== c) })}>{nomeCat(c)}<X size={12} /></button>)}
        {f.epoca !== 'todas' && <button className="chip" onClick={() => mudarFiltros2({ epoca: 'todas' })}>{EPOCAS2.find((e) => e[0] === f.epoca)?.[1]}<X size={12} /></button>}
        {f.linguagens.map((l) => <button key={l} className="chip" onClick={() => mudarFiltros2({ linguagens: f.linguagens.filter((x) => x !== l) })}>{LINGUAGENS.find((x) => x.id === l)?.nome ?? l}<X size={12} /></button>)}
        {f.temas.map((t) => <button key={t} className="chip" onClick={() => mudarFiltros2({ temas: f.temas.filter((x) => x !== t) })}>{temas.find((x) => x.id === t)?.nome ?? t}<X size={12} /></button>)}
        {f.interacao !== 'todas' && <button className="chip" onClick={() => mudarFiltros2({ interacao: 'todas' })}>{ROT_INTERACAO[f.interacao]}<X size={12} /></button>}
        {nAtivos > 1 && <button className="chip limpar" onClick={() => mudarFiltros2(FILTROS2_VAZIO)}>Limpar</button>}
      </div>}

      {ctx.tipo !== 'feed' && <div className="contexto-desc">
        <span>{ctx.tipo === 'busca' ? (ctx.foto ? <><img className="busca-foto-mini" src={ctx.foto} alt="" />Parecidos com a sua imagem</> : ctx.deRef ? <>Semelhantes a <b>{ctx.deRef}</b></> : <>Resultados para <b>{ctx.q}</b></>) : <>Mais como <b>{ctx.item.titulo}</b></>}
          {ctx.tipo === 'busca' && ctx.leitura && <small className="leitura-ia"><Sparkles size={12} /> {ctx.leitura}</small>}</span>
        <button className="btn sm ghost" onClick={voltarAoFeed}>Voltar ao feed</button>
      </div>}

      {ctx.tipo === 'feed' && !lista && modo === 'pinterest' && <NovidadesPinterest />}
      {ctx.tipo === 'feed' && !lista && modo === 'pinterest' && itens.length > 0 && <p className="ref2-secao-t">Fora do Pinterest, na linha das suas pastas</p>}

      {mostrar.length === 0 && !carregando && !interpretando ? (
        <div className="empty"><Compass size={26} strokeWidth={1.1} style={{ color: 'var(--argila)' }} />
          <span className="serif">{lista ? (f.interacao === 'curtidas' ? 'Nenhuma curtida ainda.' : f.interacao === 'salvas' ? 'Nada salvo por aqui ainda.' : 'Nenhuma imagem ocultada.') : todasFalharam ? 'As fontes não responderam.' : 'Nada por aqui ainda.'}</span>
          {!lista && <span>{todasFalharam ? 'Confira a internet e tente de novo.' : 'Toque em atualizar para buscar novas referências.'}</span>}
          {!lista && <button className="btn sm" onClick={() => carregar(true)}><RefreshCw size={14} />Atualizar</button>}
        </div>
      ) : <Mural2 itens={mostrar} salvos={salvos} ocultadas={f.interacao === 'ocultadas'} onAbrir={(i) => { setVisor(i); abriu(mostrar[i]) }} onAgir={agir} />}
      <div ref={fim} style={{ height: 1 }} />
      {status && <div className="ref2-status" role="status"><RefreshCw size={13} className="gira" />{status}</div>}

      {visor != null && mostrar[visor] && <Visor2 itens={mostrar} inicio={visor} curtidos={curtidos} salvos={salvos} onClose={() => setVisor(undefined)} onAgir={agir} onVer={abriu} />}
      {grupoPara && <EscolherGrupos ids={[grupoPara]} onClose={() => setGrupoPara(undefined)} />}
      {painelFiltros && <FiltrosAvancados onClose={() => setPainelFiltros(false)} />}
    </div>
  )
}


/** Mural em colunas, proporção original das imagens, só um botão discreto de salvar sobre cada uma. */
function Mural2({ itens, salvos, ocultadas, onAbrir, onAgir }: { itens: ItemDescoberta[]; salvos: Map<string, string>; ocultadas: boolean; onAbrir: (i: number) => void; onAgir: (x: ItemDescoberta, t: 'salvar' | 'mostrar') => void }) {
  const calc = () => (window.innerWidth < 700 ? 2 : window.innerWidth >= 1300 ? 5 : window.innerWidth >= 1000 ? 4 : 3)
  const [cols, setCols] = useState(calc)
  useEffect(() => { const h = () => setCols(calc()); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h) }, [])
  const colunas = useMemo(() => { const c: { x: ItemDescoberta; i: number }[][] = Array.from({ length: cols }, () => []); itens.forEach((x, i) => c[i % cols].push({ x, i })); return c }, [itens, cols])
  return <div className="masonry ref2-mural" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
    {colunas.map((c, k) => <div key={k} className="masonry-col">{c.map(({ x, i }) => {
      const no = ehItemPin(x) || salvos.has(x.id)
      return <div key={x.id} className="tile tile-desc">
        <button className="tile-abrir" aria-label={x.titulo} onClick={() => onAbrir(i)}><img src={x.imagem} alt={x.titulo} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={(e) => { (e.currentTarget.closest('.tile') as HTMLElement).style.display = 'none' }} /></button>
        {ehItemPin(x) && <span className="ref2-origem">Pinterest</span>}
        {ocultadas
          ? <button className="ref2-salvar" aria-label="Mostrar de novo no feed" onClick={() => onAgir(x, 'mostrar')}><Eye size={14} /></button>
          : <button className={'ref2-salvar' + (no ? ' on' : '')} aria-label={no ? 'Já está no Acervo' : 'Salvar no Acervo'} onClick={() => onAgir(x, 'salvar')}>{no ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}</button>}
      </div>
    })}</div>)}
  </div>
}

/** Tela cheia: imagem protagonista e todas as ações. Gestos: → curte, ← não gostei, ↑ salva, ↓ fecha. */
function Visor2({ itens, inicio, curtidos, salvos, onClose, onAgir, onVer }: { itens: ItemDescoberta[]; inicio: number; curtidos: Set<string>; salvos: Map<string, string>; onClose: () => void; onAgir: (x: ItemDescoberta, t: Interacao | 'ocultar') => unknown; onVer: (x: ItemDescoberta) => void }) {
  useFecharComVoltar(onClose)
  const [i, setI] = useState(inicio)
  const [acao, setAcao] = useState<{ tipo: 'grupos' | 'painel'; ref: string }>()
  const [extra, setExtra] = useState<'explicar' | 'comparar'>()
  const [pop, setPop] = useState(0)
  const toque = useRef<{ x: number; y: number } | undefined>(undefined)
  const ultimoToque = useRef(0)
  const [arrasto, setArrasto] = useState<{ dx: number; dy: number }>()
  const toast = useToast()
  const n = itens.length; const x = itens[Math.min(i, n - 1)]
  const ir = (d: number) => setI((v) => (v + d + n) % n)
  useEffect(() => { if (x) onVer(x) }, [x?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (acao || extra) return; if (e.key === 'Escape') onClose(); if (e.key === 'ArrowLeft') ir(-1); if (e.key === 'ArrowRight') ir(1) }
    window.addEventListener('keydown', k); const soltar = travarRolagem()
    return () => { window.removeEventListener('keydown', k); soltar() }
  })
  if (!x) return null
  const pin = ehItemPin(x)
  const noAcervo = pin || salvos.has(x.id)
  async function levar(tipo: 'grupos' | 'painel') {
    if (ehItemPin(x)) { if (tipo === 'painel') await onAgir(x, 'painel'); setAcao({ tipo, ref: x.pin }); return }
    const ja = salvos.get(x.id)
    const ref = ja ?? await salvarNoAcervo(x)
    if (!ja) { await onAgir(x, tipo === 'painel' ? 'painel' : 'salvar'); if (tipo === 'painel') toast('Salvo no Acervo') } else if (tipo === 'painel') await onAgir(x, 'painel')
    setAcao({ tipo, ref })
  }
  function soltar(dx: number, dy: number) {
    setArrasto(undefined)
    if (Math.abs(dx) > LIMIAR && Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) { if (!curtidos.has(x.id)) onAgir(x, 'curtir'); setPop((v) => v + 1); setTimeout(() => ir(1), 260) }
      else onAgir(x, 'recusar')
    } else if (dy < -LIMIAR && Math.abs(dy) > Math.abs(dx)) { if (!noAcervo) onAgir(x, 'salvar'); else toast('Já está no Acervo') }
    else if (dy > LIMIAR * 1.5 && Math.abs(dy) > Math.abs(dx)) onClose()
  }
  const sugerido = x.cat === 'artistas' && x.motivo?.startsWith('Artista sugerido')
  return createPortal(
    <div className="visor visor-ref" role="dialog" aria-label={x.titulo}>
      <div className="visor-topo"><span>{nomeDaFonte(x)}</span><button className="visor-btn" aria-label="Fechar" onClick={onClose}><X size={20} /></button></div>
      <div className="visor-img"
        onTouchStart={(e) => { toque.current = { x: e.touches[0].clientX, y: e.touches[0].clientY } }}
        onTouchMove={(e) => { const t = toque.current; if (t) setArrasto({ dx: e.touches[0].clientX - t.x, dy: e.touches[0].clientY - t.y }) }}
        onTouchEnd={(e) => { const t = toque.current; toque.current = undefined; if (t) soltar(e.changedTouches[0].clientX - t.x, e.changedTouches[0].clientY - t.y) }}
        onTouchCancel={() => { toque.current = undefined; setArrasto(undefined) }}
        onClick={() => { const agora = Date.now(); if (agora - ultimoToque.current < 320) { if (!curtidos.has(x.id)) onAgir(x, 'curtir'); setPop((v) => v + 1); ultimoToque.current = 0 } else ultimoToque.current = agora }}>
        <img key={x.id} src={x.imagemGrande} alt={x.titulo} referrerPolicy="no-referrer" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', transform: arrasto ? `translate(${arrasto.dx}px, ${Math.min(arrasto.dy, 0) + Math.max(arrasto.dy, 0) * .5}px) rotate(${arrasto.dx / 25}deg)` : undefined, transition: arrasto ? 'none' : 'transform .2s ease' }} onError={(e) => { if (e.currentTarget.src !== x.imagem) e.currentTarget.src = x.imagem }} />
        {pop > 0 && <Heart key={pop} size={86} className="coracao-pop" fill="currentColor" />}
      </div>
      <div className="desc-info">
        <p className="t">{x.titulo}</p>
        <p className="s">{[x.autor, x.data].filter(Boolean).join(' · ') || (pin ? '' : 'Autoria não informada pela fonte')}</p>
        <p className="l">{x.licenca}{x.universo && UNIVERSOS[x.universo] ? ' · ' + UNIVERSOS[x.universo].nome : ''}</p>
        {(x.motivo || x.consulta) && <p className="l porque">{sugerido ? x.motivo : x.motivo ?? `Apareceu pela busca “${x.consulta}”`}</p>}
      </div>
      <div className="visor-acoes desc rotulos">
        <button className={'visor-acao' + (curtidos.has(x.id) ? ' on' : '')} onClick={() => onAgir(x, 'curtir')}><span className="visor-btn"><Heart size={18} fill={curtidos.has(x.id) ? 'currentColor' : 'none'} /></span>Curtir</button>
        <button className={'visor-acao' + (noAcervo ? ' on' : '')} onClick={() => levar('grupos')}><span className="visor-btn">{noAcervo ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}</span>{noAcervo ? 'No Acervo' : 'Salvar'}</button>
        <button className="visor-acao" onClick={() => onAgir(x, 'semelhantes')}><span className="visor-btn"><ScanSearch size={18} /></span>Mais como esta</button>
        <button className="visor-acao" onClick={() => onAgir(x, 'recusar')}><span className="visor-btn"><ThumbsDown size={17} /></span>Não gostei</button>
        <button className="visor-acao" onClick={() => onAgir(x, 'ocultar')}><span className="visor-btn"><EyeOff size={18} /></span>Ocultar</button>
        <button className="visor-acao" onClick={() => setExtra('comparar')}><span className="visor-btn"><Columns2 size={18} /></span>Comparar</button>
        <button className="visor-acao" onClick={() => setExtra('explicar')}><span className="visor-btn"><BookOpen size={18} /></span>Sobre</button>
      </div>
      <div className="visor-links">
        <button onClick={() => levar('painel')}><LayoutDashboard size={13} />Levar a um painel</button>
        <button onClick={async () => { await ideiaDeDescobrir(x); toast('Guardada em Esmaltaria › Ideias') }}><FlaskConical size={13} />Ideia de esmalte</button>
        {x.link && <a href={x.link} target="_blank" rel="noreferrer"><ExternalLink size={13} />Fonte original</a>}
        {pin && <Link to={`${BASE2}/${x.pin}`} onClick={onClose}>Ficha no Acervo</Link>}
      </div>
      {extra === 'explicar' && <ExplicarObra x={x} onClose={() => setExtra(undefined)} />}
      {extra === 'comparar' && <CompararObra x={x} onClose={() => setExtra(undefined)} />}
      {n > 1 && <><button className="visor-btn visor-ant" aria-label="Anterior" onClick={() => ir(-1)}>‹</button><button className="visor-btn visor-prox" aria-label="Próxima" onClick={() => ir(1)}>›</button></>}
      {acao?.tipo === 'grupos' && <EscolherGrupos ids={[acao.ref]} onClose={() => setAcao(undefined)} />}
      {acao?.tipo === 'painel' && <EscolherPainel ids={[acao.ref]} onClose={() => setAcao(undefined)} />}
    </div>, document.body)
}

