import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Camera, Cloud, Compass, Image as ImageIcon, Pencil, RefreshCw, Search, Sparkles, X } from 'lucide-react'
import { db, type Artista, type Referencia } from '../../db/schema'
import type { ItemDescoberta } from '../../lib/fontes'
import { buscarLote, diversificar } from '../../lib/curadoria'
import { buscarPorFoto, iaConfigurada } from '../../lib/iaRepertorio'
import { contar, contarMostrados, lerConfig2, lerPerfil2, perfilDeBusca, useConfig2 } from '../../lib/ref2'
import { citaAlguma, editarTema, falaDoTema, lerLeituraTema, lerTemaComIA, planejarTema, type LeituraTema, type Tema } from '../../lib/temas2'
import { normaliza, textoBusca } from '../../lib/filtros'
import { imagemDaRef, imagemDeUrl, semelhanca, vetorDe } from '../../lib/visao'
import { Menu } from '../../ui/Menu'
import { Sheet } from '../../ui/Sheet'
import { useToast } from '../../ui/toast'
import { Voltar } from '../../ui/Voltar'
import { ImgObra } from '../bib/art/ImgObra'
import { obraDeCapa } from '../bib/art/Artistas'
import { ImgRef, temImagem } from '../ref/ImgRef'
import { VisorRefs } from '../ref/VisorRefs'
import { useEstadoVisao, useFiltroVisual, type Alvo } from '../ref/filtroVisual'
import { Mural2, useAcoes2, Visor2 } from './Feed2'
import { EditarColecoesTema, useDadosTemas } from './Temas2'
import { BASE2 } from './Topo2'

type Aba = 'descobrir' | 'acervo' | 'artistas'
type Busca = { tipo: 'tema' } | { tipo: 'texto'; q: string } | { tipo: 'foto'; url: string; consultas: string[] }
const VALIDADE = 30 * 60000
// o lote de cada tema fica na memória: abrir outro tema e voltar mantém o que já veio (só o tema aberto busca)
const memoria = new Map<string, { itens: ItemDescoberta[]; quando: number; busca: Busca }>()

/** Página de um tema: Descobrir (novas, só do assunto), Meu acervo (o que já está guardado) e Artistas (da Biblioteca). */
export default function Tema2() {
  const { id = '' } = useParams()
  const d = useDadosTemas()
  const t = d?.e.lista.find((x) => x.id === id)
  const [aba, setAba] = useState<Aba>('descobrir')
  const [editar, setEditar] = useState(false)
  const [capa, setCapa] = useState(false)
  const x = useMemo(() => (t && d ? d.dados(t) : undefined), [t, d])
  if (!d) return <div className="page ref2" />
  if (!t || !x) return <div className="page ref2"><Voltar to={`${BASE2}/descobrir`}>Temas</Voltar><div className="empty"><span className="serif">Este tema não existe mais.</span></div></div>
  const doTema = [...x.daColecao, ...x.doAssunto]
  return (
    <div className="page ref2 ref2-tema-pag">
      <Voltar to={`${BASE2}/descobrir`}>Temas</Voltar>
      <div className="pag-head"><h1 className="pag-titulo">{t.nome}</h1>
        <div className="icones"><Menu itens={[
          { l: 'Editar tema e coleções', icon: <Pencil size={16} />, onClick: () => setEditar(true) },
          { l: 'Trocar a capa', icon: <ImageIcon size={16} />, onClick: () => setCapa(true) },
        ]} /></div>
      </div>
      {x.capa && <figure className="destaque esm-capa ref2-tema-banner"><ImgRef r={x.capa} /></figure>}
      <nav className="abas-t">
        {([['descobrir', 'Descobrir'], ['acervo', 'Meu acervo'], ['artistas', 'Artistas']] as [Aba, string][]).map(([k, l]) =>
          <button key={k} className={aba === k ? 'on' : ''} onClick={() => setAba(k)}>{l}{k === 'acervo' ? <span>{doTema.length}</span> : null}</button>)}
      </nav>
      {aba === 'descobrir' && <DescobrirTema t={t} rs={x.daColecao.length ? x.daColecao : x.doAssunto} ancoras={x.ancoras} />}
      {aba === 'acervo' && <AcervoTema daColecao={x.daColecao} doAssunto={x.doAssunto} />}
      {aba === 'artistas' && <ArtistasTema refs={doTema} ancoras={x.ancoras} />}
      {editar && <EditarColecoesTema tema={t} onClose={() => setEditar(false)} />}
      {capa && <CapaTema t={t} rs={doTema} onClose={() => setCapa(false)} />}
    </div>
  )
}

/* ---------------- Descobrir do tema ---------------- */
function DescobrirTema({ t, rs, ancoras }: { t: Tema; rs: Referencia[]; ancoras: string[] }) {
  const toast = useToast()
  const cfg = useConfig2()
  const cache = useRef(memoria.get(t.id))
  const [busca, setBusca] = useState<Busca>(cache.current?.busca ?? { tipo: 'tema' })
  const [itens, setItens] = useState<ItemDescoberta[]>(cache.current?.itens ?? [])
  const [q, setQ] = useState(busca.tipo === 'texto' ? busca.q : '')
  const [carregando, setCarregando] = useState(false)
  const [lendoFoto, setLendoFoto] = useState(false)
  const [vazias, setVazias] = useState(0)
  const [visor, setVisor] = useState<number>()
  const [leitura, setLeitura] = useState<LeituraTema>()
  const [lendoIA, setLendoIA] = useState(false)
  const rodada = useRef(0); const ocupado = useRef(false); const fim = useRef<HTMLDivElement>(null)
  const itensRef = useRef(itens); useEffect(() => { itensRef.current = itens }, [itens])
  // o que já está no Acervo nunca aparece como descoberta nova
  const guardados = useLiveQuery(async () => {
    const s = new Set<string>()
    for (const r of await db.referencias.toArray()) { if (r.excluido) continue; if (r.origem?.startsWith('descobrir:')) s.add(r.origem.slice(10)); if (r.imagemExterna) s.add(r.imagemExterna) }
    return s
  }, [], new Set<string>())
  const guardadosRef = useRef(guardados); useEffect(() => { guardadosRef.current = guardados }, [guardados])
  useEffect(() => { lerLeituraTema(t.id).then(setLeitura) }, [t.id])

  const carregar = useCallback(async (novo: boolean, b: Busca = busca) => {
    if (ocupado.current) return
    ocupado.current = true; setCarregando(true)
    rodada.current = novo ? 0 : rodada.current + 1
    try {
      const [perfil, conf] = await Promise.all([lerPerfil2(), lerConfig2()])
      const pedidos = await planejarTema(t, rs, ancoras, 10, b.tipo === 'texto' ? b.q : b.tipo === 'foto' ? b.consultas : undefined)
      const conhecidos = new Set([...(novo ? [] : itensRef.current.map((i) => i.id)), ...(perfil.ocultados ?? [])])
      let trocar = novo
      const somar = (xs: ItemDescoberta[], final = false) => setItens((prev) => {
        const antes = trocar ? [] : prev; trocar = false
        const ids = new Set(antes.map((i) => i.id)); const g = guardadosRef.current
        const fx = xs.filter((i) => !ids.has(i.id) && !g.has(i.id) && !g.has(i.imagemGrande) && !g.has(i.imagem))
        // o que cita o assunto vem primeiro dentro de cada leva
        const ord = [...fx.filter((i) => falaDoTema(i, ancoras)), ...fx.filter((i) => !falaDoTema(i, ancoras))]
        const novosX = diversificar(ord, antes, 2, 3)
        contarMostrados(novosX)
        const l = [...antes, ...novosX]
        if (final) memoria.set(t.id, { itens: l.slice(-300), quando: Date.now(), busca: b })
        return l
      })
      const { itens: vindos, estados } = await buscarLote(perfilDeBusca(perfil, conf), pedidos, conhecidos, 6, rodada.current, 'todas', (xs) => somar(xs))
      somar(vindos, true)
      for (const e of estados) contar(['f:' + e.id], e.ok ? { ok: 1 } : { falhas: 1 }, e.ok ? { ultimoOk: e.quando } : { ultimaFalha: e.quando, erro: e.erro })
      setVazias((v) => (vindos.length ? 0 : v + 1))
    } finally { ocupado.current = false; setCarregando(false) }
  }, [t, rs, ancoras, busca])

  useEffect(() => {
    const c = cache.current; cache.current = undefined
    if (c && c.itens.length && Date.now() - c.quando < VALIDADE) return
    setItens([]); carregar(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t.id])
  useEffect(() => {
    const el = fim.current; if (!el) return
    const io = new IntersectionObserver((es) => { if (es[0].isIntersecting && itens.length && vazias < 4) carregar(false) }, { rootMargin: '900px' })
    io.observe(el); return () => io.disconnect()
  }, [carregar, itens.length, vazias])

  const { agir, abriu, curtidos, salvos, extras } = useAcoes2(setItens, (item) => {
    // "Mais como esta" dentro do tema: busca pelo título/autor da obra, sempre com o assunto do tema
    const b: Busca = { tipo: 'texto', q: [item.autor, item.titulo].filter(Boolean).join(' ').slice(0, 80) }
    setBusca(b); setQ(''); setVisor(undefined); setItens([]); window.scrollTo(0, 0); carregar(true, b)
  })

  function buscar(e: React.FormEvent) {
    e.preventDefault(); const s = q.trim()
    const b: Busca = s ? { tipo: 'texto', q: s } : { tipo: 'tema' }
    setBusca(b); setItens([]); setVazias(0); carregar(true, b)
  }
  async function porFoto(arq?: File) {
    if (!arq) return
    if (!(await iaConfigurada())) { toast('Para buscar nas fontes por imagem é preciso a IA. Em “Meu acervo” a busca por imagem funciona no aparelho.'); return }
    setLendoFoto(true)
    try {
      const l = await buscarPorFoto(arq, `Busque apenas obras do tema “${t.nome}”.`)
      const b: Busca = { tipo: 'foto', url: URL.createObjectURL(arq), consultas: l.consultas.map((c) => c.q) }
      setBusca(b); setQ(''); setItens([]); setVazias(0); carregar(true, b)
    } catch (err) { toast('Não deu para ler a foto: ' + (err as Error).message) } finally { setLendoFoto(false) }
  }
  function voltar() { const b: Busca = { tipo: 'tema' }; setQ(''); setBusca(b); setItens([]); setVazias(0); carregar(true, b) }
  async function lerComIA() {
    setLendoIA(true)
    try { const l = await lerTemaComIA(t); setLeitura(l); toast('Leitura do tema pronta. As próximas buscas usam essa leitura.'); setItens([]); carregar(true) }
    catch (err) { toast((err as Error).message) } finally { setLendoIA(false) }
  }

  /* olhar do app: compara com as imagens das coleções do tema (não com todo o seu gosto) */
  const estV = useEstadoVisao()
  const chaveCtx = 'tema:' + t.id + ':' + (busca.tipo === 'foto' ? busca.url : busca.tipo === 'texto' ? busca.q : '')
  const alvoDe = (): Alvo => busca.tipo === 'foto'
    ? { modo: 'ordenar', chave: 'foto:' + busca.url, imagens: async () => [imagemDeUrl(busca.url)] }
    : { modo: 'ordenar', chave: 'tema:' + t.id, imagens: async () => rs.filter(temImagem).sort((a, b) => b.atualizadoEm - a.atualizadoEm).slice(0, 60).map(imagemDaRef).filter((v): v is NonNullable<typeof v> => !!v) }
  const { notas, lendo } = useFiltroVisual(itens, alvoDe, chaveCtx, cfg.visual)
  // sentido primeiro: o que cita o assunto fica; o que não cita só fica se o olhar do app confirmar que é parecido com o tema
  const semOlhar = !cfg.visual || estV.fase === 'erro'
  const mostrar = itens.filter((i) => { if (falaDoTema(i, ancoras)) return true; const n = notas.get(i.id); return n ? n.n >= n.limiar : semOlhar })
  const status = lendoFoto ? 'Lendo a sua imagem…' : lendoIA ? 'Lendo as pastas do tema…' : carregando ? 'Buscando no tema…'
    : estV.fase === 'baixando' && cfg.visual ? 'Preparando o olhar do app…' : lendo > 0 ? 'Comparando com as pastas do tema…' : undefined

  return <>
    <div className="ref2-busca">
      <form className="busca-c" onSubmit={buscar}><Search size={16} />
        <input className="input" placeholder={`Buscar em ${t.nome}...`} value={q} onChange={(e) => setQ(e.target.value)} enterKeyHint="search" />
        {q && <button type="button" className="limpar-busca" aria-label="Limpar" onClick={voltar}><X size={15} /></button>}
        <label className="busca-foto" aria-label="Buscar por imagem" title="Buscar por imagem"><Camera size={17} /><input type="file" accept="image/*" hidden onChange={(e) => { porFoto(e.target.files?.[0]); e.target.value = '' }} /></label>
      </form>
    </div>
    {busca.tipo !== 'tema' ? <div className="contexto-desc">
      <span>{busca.tipo === 'foto' ? <><img className="busca-foto-mini" src={busca.url} alt="" />Parecidos com a sua imagem, em {t.nome}</> : <>Em {t.nome}: <b>{busca.q}</b></>}</span>
      <button className="btn sm ghost" onClick={voltar}>Voltar ao tema</button>
    </div> : <div className="ref2-tema-leitura">
      {leitura ? <p><Sparkles size={12} /> {leitura.resumo}</p> : <p className="faint">Buscas guiadas pelas pastas do tema: o assunto vai em toda consulta e o que já está no Acervo não aparece.</p>}
      <button className="btn sm ghost" disabled={lendoIA} onClick={lerComIA}><Cloud size={13} />{leitura ? 'Ler de novo com IA' : 'Ler o tema com IA'}</button>
    </div>}
    {mostrar.length === 0 && !carregando && !lendoFoto ? <div className="empty"><Compass size={26} strokeWidth={1.1} />
      <span className="serif">{itens.length ? 'Nada com relação clara com o tema nesta leva.' : 'Nada por aqui ainda.'}</span>
      <button className="btn sm" onClick={() => { setItens([]); carregar(true) }}><RefreshCw size={14} />Buscar de novo</button>
    </div> : <Mural2 itens={mostrar} salvos={salvos} ocultadas={false} onAbrir={(i) => { setVisor(i); abriu(mostrar[i]) }} onAgir={agir} />}
    <div ref={fim} style={{ height: 1 }} />
    {status && <div className="ref2-status" role="status"><RefreshCw size={13} className="gira" />{status}</div>}
    {visor != null && mostrar[visor] && <Visor2 itens={mostrar} inicio={visor} curtidos={curtidos} salvos={salvos} onClose={() => setVisor(undefined)} onAgir={agir} onVer={abriu} />}
    {extras}
  </>
}

/* ---------------- Meu acervo do tema ---------------- */
function AcervoTema({ daColecao, doAssunto }: { daColecao: Referencia[]; doAssunto: Referencia[] }) {
  const toast = useToast()
  const [q, setQ] = useState('')
  const [foto, setFoto] = useState<{ url: string; ordem?: Map<string, number> }>()
  const [visor, setVisor] = useState<{ xs: Referencia[]; i: number }>()
  const filtra = (xs: Referencia[]) => {
    const n = normaliza(q.trim()); let out = n ? xs.filter((r) => textoBusca(r.titulo, r.autor, r.tags, r.descricao).includes(n)) : xs
    if (foto?.ordem) { const o = foto.ordem; out = out.filter((r) => o.has(r.id)).sort((a, b) => o.get(b.id)! - o.get(a.id)!) }
    return out
  }
  async function porFoto(arq?: File) {
    if (!arq) return
    const url = URL.createObjectURL(arq); setFoto({ url })
    try {
      const v = await vetorDe(imagemDeUrl(url))
      if (!v) { toast('O olhar do app não abriu agora. Confira a internet e tente de novo.'); setFoto(undefined); return }
      const ordem = new Map<string, number>()
      for (const r of [...daColecao, ...doAssunto].filter(temImagem).slice(0, 240)) { const im = imagemDaRef(r); const w = im && await vetorDe(im); if (w) ordem.set(r.id, semelhanca(v, w)) }
      setFoto({ url, ordem })
    } catch (e) { toast((e as Error).message); setFoto(undefined) }
  }
  const a = filtra(daColecao), b = filtra(doAssunto)
  const grade = (xs: Referencia[]) => <div className="ref2-tema-acervo">{xs.slice(0, 300).map((r, i) => <button key={r.id} onClick={() => setVisor({ xs, i })} aria-label={r.titulo}>{temImagem(r) ? <ImgRef r={r} /> : <span className="tile-sem">{r.titulo}</span>}</button>)}</div>
  return <>
    <div className="ref2-busca">
      <div className="busca-c"><Search size={16} />
        <input className="input" placeholder="Buscar no acervo do tema..." value={q} onChange={(e) => setQ(e.target.value)} />
        {(q || foto) && <button type="button" className="limpar-busca" aria-label="Limpar" onClick={() => { setQ(''); setFoto(undefined) }}><X size={15} /></button>}
        <label className="busca-foto" aria-label="Ordenar pela semelhança com uma imagem" title="Buscar por imagem (no aparelho)"><Camera size={17} /><input type="file" accept="image/*" hidden onChange={(e) => { porFoto(e.target.files?.[0]); e.target.value = '' }} /></label>
      </div>
    </div>
    {foto && <div className="contexto-desc"><span><img className="busca-foto-mini" src={foto.url} alt="" />{foto.ordem ? 'Do mais parecido ao menos parecido' : 'Comparando no aparelho…'}</span></div>}
    {a.length > 0 && <><p className="ref2-secao-t">Das coleções do tema · {a.length}</p>{grade(a)}</>}
    {b.length > 0 && <><p className="ref2-secao-t">Também falam do assunto · {b.length}</p>{grade(b)}</>}
    {!a.length && !b.length && <div className="empty"><span className="serif">{q || foto ? 'Nada encontrado no acervo do tema.' : 'O tema ainda não tem referências.'}</span></div>}
    {visor && <VisorRefs lista={visor.xs} inicio={visor.i} onClose={() => setVisor(undefined)} base={BASE2} />}
  </>
}

/* ---------------- Artistas do tema ---------------- */
function ArtistasTema({ refs, ancoras }: { refs: Referencia[]; ancoras: string[] }) {
  const [q, setQ] = useState('')
  const dados = useLiveQuery(async () => ({ artistas: (await db.artistas.toArray()).filter((a) => !a.excluido), obras: (await db.obras.toArray()).filter((o) => !o.excluido) }), [])
  const lista = useMemo(() => {
    if (!dados) return undefined
    const autores = new Map<string, number>()
    for (const r of refs) if (r.autor) { const k = normaliza(r.autor); autores.set(k, (autores.get(k) ?? 0) + 1) }
    const obrasDe = new Map<string, string>()
    for (const o of dados.obras) obrasDe.set(o.artistaId, (obrasDe.get(o.artistaId) ?? '') + ' ' + textoBusca(o.titulo, o.tecnica, o.serie, o.tags))
    return dados.artistas.map((a: Artista) => {
      const n = autores.get(normaliza(a.nome)) ?? 0
      const tx = textoBusca(a.especialidade, a.linguagem, a.caracteristicas, a.tags, a.tecnicas, (a.bio ?? '').slice(0, 800)) + ' ' + (obrasDe.get(a.id) ?? '')
      const ponto = (n ? 3 + n : 0) + (citaAlguma(tx, ancoras) ? 2 : 0) + (a.favorito ? .5 : 0)
      return { a, ponto, n }
    }).filter((x) => x.ponto >= 2).sort((x, y) => y.ponto - x.ponto)
  }, [dados, refs, ancoras])
  if (!lista || !dados) return null
  const nq = normaliza(q.trim())
  const vis = nq ? lista.filter((x) => normaliza(x.a.nome + ' ' + (x.a.linguagem ?? '')).includes(nq)) : lista
  return <>
    <div className="ref2-busca"><div className="busca-c"><Search size={16} /><input className="input" placeholder="Buscar artista..." value={q} onChange={(e) => setQ(e.target.value)} /></div></div>
    {vis.length === 0 ? <div className="empty"><span className="serif">Nenhum artista da Biblioteca ligado a este tema.</span><span>Aparecem aqui os estudos de artistas que tratam do assunto ou que são autores de referências do tema.</span></div>
      : <div className="colecoes">{vis.map(({ a, n }) => { const capa = obraDeCapa(a, dados.obras); return <Link key={a.id} to={`/biblioteca/artistas/${a.id}`} className="art-card">
        <span className="ph"><ImgObra o={capa} alt={capa?.titulo ?? a.nome} /></span>
        <span className="txt"><span className="pais">{a.pais.join(' / ')}</span><span className="nome">{a.nome}</span>
          <span className="tracos">{n ? `${n} ${n === 1 ? 'referência' : 'referências'} do tema` : a.linguagem ?? a.especialidade ?? ''}</span></span>
      </Link> })}</div>}
  </>
}

/* ---------------- capa do tema ---------------- */
function CapaTema({ t, rs, onClose }: { t: Tema; rs: Referencia[]; onClose: () => void }) {
  const toast = useToast()
  const comImg = rs.filter(temImagem)
  return <Sheet label={`Capa de ${t.nome}`} onClose={onClose} alto>
    <h3>Capa de {t.nome}</h3>
    <p className="faint" style={{ fontSize: 12.5, margin: '4px 0 8px' }}>Toque numa imagem do tema para usar como capa.</p>
    <div className="ref2-capa-escolha">{comImg.slice(0, 160).map((r) => <button key={r.id} className={t.capa === r.id ? 'on' : ''} onClick={async () => { await editarTema(t.id, { capa: r.id }); toast('Capa salva'); onClose() }}><ImgRef r={r} /></button>)}</div>
    {t.capa && <button className="btn sm ghost" onClick={async () => { await editarTema(t.id, { capa: undefined }); toast('Capa automática'); onClose() }}>Voltar à automática</button>}
  </Sheet>
}
