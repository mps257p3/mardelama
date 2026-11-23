import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { FolderPlus, Plus, Sparkles } from 'lucide-react'
import { db, ETAPAS, type Observacao, type Peca, type Serie } from '../../db/schema'
import { vivos } from '../../lib/artistas'
import { Foto } from '../../ui/form'
import { CartaoPeca, STATUS_SERIE, nomeEtapa, normPeca, normSerie, novaPeca, novaSerie } from './comum'

const ABAS = [
  { id: 'processo', nome: 'Em processo' },
  { id: 'series', nome: 'Séries' },
  { id: 'prontas', nome: 'Obras prontas' },
  { id: 'estudos', nome: 'Estudos' },
  { id: 'diario', nome: 'Observações' },
] as const
type Aba = (typeof ABAS)[number]['id']

/** Minhas obras: o trabalho autoral — séries, peças em processo, obras prontas, estudos e o diário do processo. */
export default function MinhasObras() {
  const nav = useNavigate()
  const [sp, setSp] = useSearchParams()
  const aba = (ABAS.some((a) => a.id === sp.get('aba')) ? sp.get('aba') : 'processo') as Aba
  const pecas = useLiveQuery(async () => vivos(await db.entrada.toArray()).map(normPeca).sort((a, b) => b.atualizadoEm - a.atualizadoEm), [], undefined)
  const series = useLiveQuery(async () => vivos(await db.projetos.toArray()).map(normSerie).sort((a, b) => b.atualizadoEm - a.atualizadoEm), [], [] as Serie[])
  const [criando, setCriando] = useState(false)
  const porSerie = useMemo(() => new Map(series.map((s) => [s.id, s])), [series])

  const obras = pecas?.filter((p) => p.tipo === 'obra') ?? []
  const processo = obras.filter((p) => p.etapa !== 'pronta')
  const prontas = obras.filter((p) => p.etapa === 'pronta')
  const estudos = pecas?.filter((p) => p.tipo === 'estudo') ?? []
  const diario = useMemo(() => {
    const xs: { o: Observacao; titulo: string; to: string }[] = []
    for (const p of pecas ?? []) for (const o of p.observacoes) xs.push({ o, titulo: p.titulo || 'Sem título', to: `/obras/peca/${p.id}` })
    for (const s of series) for (const o of s.observacoes) xs.push({ o, titulo: 'Série ' + s.nome, to: `/obras/serie/${s.id}` })
    return xs.sort((a, b) => b.o.data - a.o.data).slice(0, 80)
  }, [pecas, series])

  async function criar(f: () => Promise<string>, to: (id: string) => string) {
    if (criando) return
    setCriando(true)
    try { nav(to(await f())) } finally { setCriando(false) }
  }
  const novaObra = () => criar(() => novaPeca({ tipo: 'obra' }), (id) => `/obras/peca/${id}?novo=1`)
  const novoEstudo = () => criar(() => novaPeca({ tipo: 'estudo' }), (id) => `/obras/peca/${id}?novo=1`)
  const novaSer = () => criar(() => novaSerie(), (id) => `/obras/serie/${id}?novo=1`)

  // vindo do "Adicionar" rápido (segurar o botão central): já abre uma peça nova
  const pediu = useRef(false)
  useEffect(() => {
    if (sp.get('nova') !== 'peca' || pediu.current) return
    pediu.current = true
    novaPeca({ tipo: 'obra' }).then((id) => nav(`/obras/peca/${id}?novo=1`, { replace: true }))
  }, [sp, nav])

  if (!pecas) return null
  const grade = (xs: Peca[], vazio: string) => xs.length
    ? <div className="obras-mural">{xs.map((p) => <Link key={p.id} to={`/obras/peca/${p.id}`} className="obra-card"><CartaoPeca p={p} serie={p.serieId ? porSerie.get(p.serieId) : undefined} /></Link>)}</div>
    : <p className="faint">{vazio}</p>

  return (
    <div className="page minhas-obras">
      <header className="mo-topo">
        <p className="eyebrow">Ateliê Mar de Lama</p>
        <h1>Minhas obras</h1>
        <p className="faint" style={{ margin: '4px 0 0', fontSize: 14 }}>{[`${series.length} ${series.length === 1 ? 'série' : 'séries'}`, `${processo.length} em processo`, `${prontas.length} ${prontas.length === 1 ? 'obra pronta' : 'obras prontas'}`, `${estudos.length} ${estudos.length === 1 ? 'estudo' : 'estudos'}`].join(' · ')}</p>
        <div className="mo-acoes">
          <button className="btn primary sm" disabled={criando} onClick={novaObra}><Plus size={15} />Nova peça</button>
          <button className="btn sm" disabled={criando} onClick={novaSer}><FolderPlus size={15} />Nova série</button>
          <button className="btn sm" disabled={criando} onClick={novoEstudo}><Sparkles size={15} />Novo estudo</button>
        </div>
      </header>

      <div className="chips mo-abas" role="tablist">
        {ABAS.map((a) => <button key={a.id} role="tab" aria-selected={aba === a.id} className={'chip' + (aba === a.id ? ' on' : '')} onClick={() => setSp(a.id === 'processo' ? {} : { aba: a.id }, { replace: true })}>{a.nome}</button>)}
      </div>

      {aba === 'processo' && (processo.length === 0
        ? <div className="mo-vazio"><p>Nenhuma peça em processo. Cadastre uma peça e acompanhe cada etapa, da ideia à queima final.</p><button className="btn primary" onClick={novaObra}><Plus size={15} />Nova peça</button></div>
        : ETAPAS.filter((e) => e.id !== 'pronta').map((e) => {
          const xs = processo.filter((p) => p.etapa === e.id)
          if (!xs.length) return null
          return <section key={e.id} className="mo-etapa"><h2>{e.nome} <span className="faint">{xs.length}</span></h2>{grade(xs, '')}</section>
        }))}

      {aba === 'series' && (series.length === 0
        ? <div className="mo-vazio"><p>Uma série reúne as peças de uma mesma investigação: a intenção, as peças, os estudos e o diário do processo.</p><button className="btn primary" onClick={novaSer}><FolderPlus size={15} />Nova série</button></div>
        : <div className="mo-series">{series.map((s) => {
          const xs = pecas.filter((p) => p.serieId === s.id)
          const capa = s.capa ?? xs.find((p) => p.fotos[0])?.fotos[0]
          return <Link key={s.id} to={`/obras/serie/${s.id}`} className="mo-serie">
            <span className="ph">{capa ? <Foto id={capa} /> : <span className="obra-sem"><span>Sem foto</span></span>}</span>
            <span className="t">{s.nome || 'Série sem nome'}</span>
            <span className="s">{[STATUS_SERIE[s.status], s.ano, `${xs.length} ${xs.length === 1 ? 'peça' : 'peças'}`].filter(Boolean).join(' · ')}</span>
          </Link>
        })}</div>)}

      {aba === 'prontas' && grade(prontas, 'Quando uma peça chega à etapa "Pronta", ela aparece aqui.')}
      {aba === 'estudos' && <>{grade(estudos, 'Estudos são peças de pesquisa: provas de forma, de superfície, de queima. Ficam separados das obras.')}{estudos.length > 0 && <p className="faint" style={{ fontSize: 13 }}>Etapas dos estudos: {[...new Set(estudos.map((p) => nomeEtapa(p.etapa)))].join(', ')}.</p>}</>}

      {aba === 'diario' && (diario.length === 0
        ? <p className="faint">Os registros que você faz em cada peça e série aparecem aqui, em ordem, como um diário do ateliê.</p>
        : <div className="diario">{diario.map(({ o, titulo, to }) => (
          <Link key={o.id} to={to} className="diario-item">
            <div className="diario-data">{new Date(o.data).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })} · {titulo}</div>
            {o.texto && <p>{o.texto}</p>}
            {!!o.fotos?.length && <div className="diario-fotos">{o.fotos.slice(0, 4).map((f) => <span key={f} className="diario-foto"><Foto id={f} /></span>)}</div>}
          </Link>
        ))}</div>)}
    </div>
  )
}
