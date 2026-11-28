import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Crop, ImagePlus, Plus, RotateCcw, Search } from 'lucide-react'
import { GLOSSARIO } from '../../lib/glossario'
import { db } from '../../db/schema'
import { useAjuste, definirAjuste } from '../../db/settings'
import { useArquivoUrl, salvarArquivo } from '../../db/files'
import { SECOES, secaoDaCategoria, type SecaoBib } from '../../lib/biblioteca'
import { buscarTodos, type Resumo } from '../../lib/entidades'
import { Menu } from '../../ui/Menu'
import { Sheet } from '../../ui/Sheet'
import { ResultadosBusca } from '../../ui/ResultadosBusca'
import { CapaArea, LinhaFoto } from '../../ui/FotoEditavel'
import { fotoDaArea } from '../../lib/esmaltaria'
import { useLayout } from '../../lib/layout'
import { CabecalhoPagina } from '../../ui/Pagina'
import { EditorRecorte, estiloRecorte, salvarRecorteAjuste, useRecorteAjuste } from '../../ui/Recorte'

/** Capa de uma seção: a foto escolhida pelo Marcelo; senão, a capa padrão (com reserva local se a externa falhar). */
export function useCapa(s: SecaoBib) {
  const id = useAjuste<string | undefined>(`bib.capa.${s.slug}`, undefined)
  const url = useArquivoUrl(id)
  const recorte = useRecorteAjuste(`bib.capa.${s.slug}`)
  return { src: url ?? s.capa, propria: !!id, recorte: id ? recorte : undefined }
}

export function CapaImg({ s, className }: { s: SecaoBib; className?: string }) {
  const { src, recorte } = useCapa(s)
  const [falhou, setFalhou] = useState(false)
  useEffect(() => setFalhou(false), [src])
  return <img className={className} src={falhou && s.reserva ? s.reserva : src} alt="" loading="lazy" referrerPolicy="no-referrer" style={estiloRecorte(recorte)} onError={() => setFalhou(true)} />
}

function CardSecao({ s, n, grande }: { s: SecaoBib; n: number; grande: boolean }) {
  return (
    <Link to={`/biblioteca/${s.slug}`} className={'bib-card' + (grande ? ' grande' : '')} style={{ ['--span' as string]: s.span ?? 2 }}>
      <CapaImg s={s} />
      <span className="bib-veu" />
      <span className="bib-txt">
        <span className="bib-n">{`${n} ${UNID[s.slug]?.[n === 1 ? 0 : 1] ?? (n === 1 ? 'item' : 'itens')}`}</span>
        <span className="bib-nome">{s.nome}</span>
        <span className="bib-desc">{s.desc}</span>
      </span>
    </Link>
  )
}

/** Ritmo do feed: cards grandes (largura inteira no celular) alternando com pares. */
const UNID: Record<string, [string, string]> = { artistas: ['artista', 'artistas'], glossario: ['termo', 'termos'], agenda: ['exposição', 'exposições'] }
const GRANDES = new Set(['artistas', 'materiais', 'leituras'])

export default function Biblioteca() {
  const [q, setQ] = useState('')
  const [buscaAberta, setBuscaAberta] = useState(false)
  const [res, setRes] = useState<Resumo[]>()
  const [capas, setCapas] = useState(false)
  const conteudos = useLiveQuery(async () => (await db.conteudos.toArray()).filter((x) => !x.excluido), [], [])
  const nArtistas = useLiveQuery(async () => db.tables.some((t) => t.name === 'artistas') ? (await db.table('artistas').toArray()).filter((x) => !x.excluido).length : 0, [], 0)
  const nExpos = useLiveQuery(async () => { const hoje = new Date().toISOString().slice(0, 10); return db.tables.some((t) => t.name === 'exposicoes') ? (await db.table('exposicoes').toArray()).filter((x) => !x.excluido && (!x.fim || x.fim >= hoje)).length : 0 }, [], 0)
  const porSecao = useMemo(() => {
    const m = new Map<string, number>()
    conteudos.forEach((c) => { const s = secaoDaCategoria(c.categoria).slug; m.set(s, (m.get(s) ?? 0) + 1) })
    m.set('artistas', (m.get('artistas') ?? 0) + nArtistas)
    m.set('glossario', GLOSSARIO.length)
    m.set('agenda', nExpos)
    return m
  }, [conteudos, nArtistas, nExpos])

  useEffect(() => {
    if (!q.trim()) { setRes(undefined); return }
    let vivo = true
    const h = setTimeout(() => buscarTodos(q, 120).then((x) => vivo && setRes(x)), 180)
    return () => { vivo = false; clearTimeout(h) }
  }, [q])

  return (
    <div className="page bib">
      <CabecalhoPagina titulo="Biblioteca">
        <button className="iconbtn" aria-label="Buscar na Biblioteca" onClick={() => setBuscaAberta((v) => !v || !!q)}><Search size={20} strokeWidth={1.5} /></button>
        <Link className="iconbtn" to="/biblioteca/novo" aria-label="Novo conteúdo"><Plus size={20} strokeWidth={1.5} /></Link>
        <Menu itens={[{ l: 'Trocar capas', icon: <ImagePlus size={16} />, onClick: () => setCapas(true) }]} />
      </CabecalhoPagina>
      <CapaArea slug="biblioteca" nome="Biblioteca" onEditar={() => setCapas(true)} />
      {(buscaAberta || q) && (
        <div className="search bib-busca pag-busca">
          <Search size={17} />
          <input className="input" autoFocus placeholder="Buscar artistas, técnicas, esmaltes, leituras…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      )}

      {res ? <ResultadosBusca itens={res} q={q} /> : (
        <div className="bib-feed">
          {SECOES.map((s) => <CardSecao key={s.slug} s={s} n={porSecao.get(s.slug) ?? 0} grande={GRANDES.has(s.slug)} />)}
        </div>
      )}
      {capas && <TrocarCapas onClose={() => setCapas(false)} />}
    </div>
  )
}

function LinhaCapa({ s }: { s: SecaoBib }) {
  const { propria, src, recorte } = useCapa(s)
  const chave = `bib.capa.${s.slug}`
  const ref = useRef<HTMLInputElement>(null)
  const [editar, setEditar] = useState(false)
  return (
    <div className="bib-capa-linha">
      <span className="ph"><CapaImg s={s} /></span>
      <span className="t">{s.nome}<span className="s">{propria ? 'Foto sua' : s.credito ? `Padrão · ${s.credito}` : 'Padrão'}</span></span>
      <span style={{ display: 'flex', gap: 4 }}>
        {propria && <button className="iconbtn" aria-label="Reenquadrar foto" onClick={() => setEditar(true)}><Crop size={16} /></button>}
        {propria && <button className="iconbtn" aria-label="Voltar à capa padrão" onClick={async () => { await definirAjuste(chave, undefined); await salvarRecorteAjuste(chave, undefined) }}><RotateCcw size={16} /></button>}
        <button className="btn sm" onClick={() => ref.current?.click()}><ImagePlus size={14} />Trocar</button>
      </span>
      <input ref={ref} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) { await definirAjuste(chave, await salvarArquivo(f)); await salvarRecorteAjuste(chave, undefined); setEditar(true) } e.target.value = '' }} />
      {editar && <EditorRecorte src={src} aspecto={GRANDES.has(s.slug) ? 16 / 10 : 3 / 4} valor={recorte} titulo={`Reenquadrar · ${s.nome}`}
        onSalvar={(r) => salvarRecorteAjuste(chave, r)} onClose={() => setEditar(false)} />}
    </div>
  )
}

function TrocarCapas({ onClose }: { onClose: () => void }) {
  const capa = { ...fotoDaArea('biblioteca', 'Biblioteca'), nome: 'Capa da Biblioteca', aspecto: useLayout().capa }
  return (
    <Sheet onClose={onClose} label="Capas da Biblioteca" alto>
      <h3>Capas da Biblioteca</h3>
      <p className="faint" style={{ fontSize: 13.5, margin: '6px 0 14px' }}>Use fotos suas: testes de esmalte, materiais, peças e mãos no trabalho. A capa é a mesma foto do card na tela inicial.</p>
      <LinhaFoto f={capa} />
      {SECOES.map((s) => <LinhaCapa key={s.slug} s={s} />)}
    </Sheet>
  )
}
