import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ImagePlus, Link2, Plus, RotateCcw, Search } from 'lucide-react'
import { db, type Tipo } from '../../db/schema'
import { useAjuste, definirAjuste } from '../../db/settings'
import { useArquivoUrl, salvarArquivo } from '../../db/files'
import { SECOES, secaoDaCategoria, type SecaoBib } from '../../lib/biblioteca'
import { buscarTodos, ROTULO, type Resumo } from '../../lib/entidades'
import { Foto } from '../../ui/form'
import { Menu } from '../../ui/Menu'
import { Sheet } from '../../ui/Sheet'

/** Capa de uma seção: a foto escolhida pelo Marcelo; senão, a capa padrão (com reserva local se a externa falhar). */
export function useCapa(s: SecaoBib) {
  const id = useAjuste<string | undefined>(`bib.capa.${s.slug}`, undefined)
  const url = useArquivoUrl(id)
  return { src: url ?? s.capa, propria: !!id }
}

export function CapaImg({ s, className }: { s: SecaoBib; className?: string }) {
  const { src } = useCapa(s)
  const [falhou, setFalhou] = useState(false)
  useEffect(() => setFalhou(false), [src])
  return <img className={className} src={falhou && s.reserva ? s.reserva : src} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFalhou(true)} />
}

function CardSecao({ s, n, grande }: { s: SecaoBib; n: number; grande: boolean }) {
  return (
    <Link to={`/biblioteca/${s.slug}`} className={'bib-card' + (grande ? ' grande' : '')} style={{ ['--span' as string]: s.span ?? 2 }}>
      <CapaImg s={s} />
      <span className="bib-veu" />
      <span className="bib-txt">
        <span className="bib-n">{n ? `${n} ${n === 1 ? 'item' : 'itens'}` : ' '}</span>
        <span className="bib-nome">{s.nome}</span>
        <span className="bib-desc">{s.desc}</span>
      </span>
    </Link>
  )
}

/** Ritmo do feed: cards grandes (largura inteira no celular) alternando com pares. */
const GRANDES = new Set(['artistas', 'materiais', 'leituras'])

export default function Biblioteca() {
  const [q, setQ] = useState('')
  const [res, setRes] = useState<Resumo[]>()
  const [capas, setCapas] = useState(false)
  const conteudos = useLiveQuery(async () => (await db.conteudos.toArray()).filter((x) => !x.excluido), [], [])
  const nArtistas = useLiveQuery(async () => db.tables.some((t) => t.name === 'artistas') ? (await db.table('artistas').toArray()).filter((x) => !x.excluido).length : 0, [], 0)
  const porSecao = useMemo(() => {
    const m = new Map<string, number>()
    conteudos.forEach((c) => { const s = secaoDaCategoria(c.categoria).slug; m.set(s, (m.get(s) ?? 0) + 1) })
    m.set('artistas', (m.get('artistas') ?? 0) + nArtistas)
    return m
  }, [conteudos, nArtistas])

  useEffect(() => {
    if (!q.trim()) { setRes(undefined); return }
    let vivo = true
    const h = setTimeout(() => buscarTodos(q, 120).then((x) => vivo && setRes(x)), 180)
    return () => { vivo = false; clearTimeout(h) }
  }, [q])

  return (
    <div className="page bib">
      <div className="head">
        <div><p className="eyebrow">Pesquisa e estudo</p><h1 className="titulo-pagina" style={{ marginTop: 8 }}>Biblioteca</h1></div>
        <div className="acts" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <Link className="btn sm" to="/biblioteca/novo"><Plus size={15} />Novo</Link>
          <Menu itens={[{ l: 'Trocar capas', icon: <ImagePlus size={16} />, onClick: () => setCapas(true) }]} />
        </div>
      </div>
      <div className="search bib-busca">
        <Search size={17} />
        <input className="input" placeholder="Buscar artistas, técnicas, esmaltes, leituras…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {res ? <Resultados itens={res} q={q} /> : (
        <div className="bib-feed">
          {SECOES.map((s) => <CardSecao key={s.slug} s={s} n={porSecao.get(s.slug) ?? 0} grande={GRANDES.has(s.slug)} />)}
        </div>
      )}
      {capas && <TrocarCapas onClose={() => setCapas(false)} />}
    </div>
  )
}

function Resultados({ itens, q }: { itens: Resumo[]; q: string }) {
  const grupos = useMemo(() => { const m = new Map<Tipo, Resumo[]>(); itens.forEach((r) => m.set(r.tipo, [...(m.get(r.tipo) ?? []), r])); return [...m.entries()] }, [itens])
  if (!itens.length) return <p className="muted" style={{ marginTop: 24 }}>Nada encontrado para “{q}”.</p>
  return <>{grupos.map(([t, rs]) => (
    <section key={t} style={{ marginTop: 22 }}>
      <p className="eyebrow">{ROTULO[t]} · {rs.length}</p>
      <div className="lista">{rs.map((r) => (
        <Link key={r.id} to={r.to}>
          <div className="mini">{r.foto ? <Foto id={r.foto} /> : r.fotoUrl ? <img src={r.fotoUrl} alt="" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Link2 size={18} strokeWidth={1.3} />}</div>
          <div><div className="t">{r.titulo}</div><div className="s">{r.sub}</div></div><span />
        </Link>))}</div>
    </section>))}</>
}

function LinhaCapa({ s }: { s: SecaoBib }) {
  const { propria } = useCapa(s)
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div className="bib-capa-linha">
      <span className="ph"><CapaImg s={s} /></span>
      <span className="t">{s.nome}<span className="s">{propria ? 'Foto sua' : s.credito ? `Padrão · ${s.credito}` : 'Padrão'}</span></span>
      <span style={{ display: 'flex', gap: 4 }}>
        {propria && <button className="iconbtn" aria-label="Voltar à capa padrão" onClick={() => definirAjuste(`bib.capa.${s.slug}`, undefined)}><RotateCcw size={16} /></button>}
        <button className="btn sm" onClick={() => ref.current?.click()}><ImagePlus size={14} />Trocar</button>
      </span>
      <input ref={ref} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) await definirAjuste(`bib.capa.${s.slug}`, await salvarArquivo(f)); e.target.value = '' }} />
    </div>
  )
}

function TrocarCapas({ onClose }: { onClose: () => void }) {
  return (
    <Sheet onClose={onClose} label="Capas da Biblioteca" alto>
      <h3>Capas da Biblioteca</h3>
      <p className="faint" style={{ fontSize: 13.5, margin: '6px 0 14px' }}>Use fotos suas: testes de esmalte, materiais, peças e mãos no trabalho.</p>
      {SECOES.map((s) => <LinhaCapa key={s.slug} s={s} />)}
    </Sheet>
  )
}
