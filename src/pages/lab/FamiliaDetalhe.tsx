import { ArtistasAfins } from '../bib/art/ArtistasAfins'
import { Link, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { db, type Familia } from '../../db/schema'
import { TextoEditavel, ListaEditavel } from '../../ui/editavel'
import { Relacoes } from '../../ui/Relacoes'

const vivos = <T extends { excluido?: 0 | 1 }>(xs: T[]) => xs.filter((x) => !x.excluido)

export default function FamiliaDetalhe() {
  const { id } = useParams()
  const f = useLiveQuery(() => db.familias.get(id!), [id])
  const dados = useLiveQuery(async () => ({
    materiais: vivos(await db.materiais.toArray()),
    receitas: vivos(await db.receitas.where('familias').equals(id!).toArray()),
    esmaltes: vivos(await db.esmaltes.where('familias').equals(id!).toArray()),
    comerciais: vivos(await db.comerciais.toArray()).filter((c) => c.familias.includes(id!)),
  }), [id])
  if (f === undefined || !dados) return null
  if (!f || f.excluido) return <div className="page"><p>Família não encontrada.</p></div>
  const salvar = <K extends keyof Familia>(k: K) => (v: Familia[K]) => db.familias.update(f.id, { [k]: v, atualizadoEm: Date.now() } as Partial<Familia>)
  const txt = (k: 'quimicas' | 'tecnicas' | 'temperaturas' | 'prioridade' | 'usoInicial' | 'descricao') => (v: string) => salvar(k)(v || undefined)
  const mats = dados.materiais.filter((m) => (f.materiais ?? []).includes(m.id) || (m.familias ?? []).includes(f.id))

  return (
    <div className="page" style={{ maxWidth: 860 }}>
      <Link to="/familias" className="back"><ArrowLeft size={15} />Famílias</Link>
      <p className="eyebrow">{f.codigo ?? 'Família'}{f.nomeEn ? ` · ${f.nomeEn}` : ''}</p>
      <h1 style={{ marginTop: 8 }}>{f.nome}</h1>
      {f.dificuldade != null && <p className="faint" style={{ marginTop: 6 }}>Dificuldade {f.dificuldade} de 5</p>}

      {f.cuidados && <p className="aviso forte" style={{ marginTop: 20, display: 'flex', gap: 10 }}>
        <AlertTriangle size={18} strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 1 }} /><span>{f.cuidados} <Link to="/biblioteca/bib-seguranca" style={{ textDecoration: 'underline' }}>Segurança do laboratório</Link></span>
      </p>}

      <Secao titulo="Características visuais"><ListaEditavel rotulo="característica" itens={f.visuais ?? []} onSalvar={salvar('visuais')} /></Secao>
      <Secao titulo="Características químicas"><TextoEditavel rotulo="características químicas" multilinha valor={f.quimicas} onSalvar={txt('quimicas')} /></Secao>
      <Secao titulo="Matérias-primas relacionadas">
        {mats.length ? <div className="pills">{mats.map((m) => <Link key={m.id} className="pill" to={`/materiais/${m.id}`}>{m.nome}</Link>)}</div> : <p className="faint">Nenhuma ainda.</p>}
      </Secao>
      <Secao titulo="Temperaturas"><TextoEditavel rotulo="temperaturas" valor={f.temperaturas} onSalvar={txt('temperaturas')} /></Secao>
      <Secao titulo="Técnicas de aplicação"><TextoEditavel rotulo="técnicas" multilinha valor={f.tecnicas} onSalvar={txt('tecnicas')} /></Secao>
      <Secao titulo="Subcategorias"><ListaEditavel rotulo="subcategoria" itens={f.subcategorias ?? []} onSalvar={salvar('subcategorias')} /></Secao>
      <Secao titulo="Variáveis a testar"><ListaEditavel rotulo="variável" itens={f.variaveis ?? []} onSalvar={salvar('variaveis')} /></Secao>
      <Secao titulo="Possibilidades"><ListaEditavel rotulo="possibilidade" itens={f.possibilidades ?? []} onSalvar={salvar('possibilidades')} /></Secao>
      <Secao titulo="Prioridade de pesquisa"><TextoEditavel rotulo="prioridade" valor={f.prioridade} onSalvar={txt('prioridade')} /></Secao>
      <Secao titulo="Uso inicial sugerido"><TextoEditavel rotulo="uso inicial" multilinha valor={f.usoInicial} onSalvar={txt('usoInicial')} /></Secao>
      <Secao titulo="Anotações"><TextoEditavel rotulo="anotações" multilinha valor={f.descricao} onSalvar={txt('descricao')} vazio="Nenhuma anotação." /></Secao>

      <Secao titulo={`Fórmulas (${dados.receitas.length})`}>
        {dados.receitas.length ? <div className="lista">{dados.receitas.sort((a, b) => (a.codigo ?? a.nome).localeCompare(b.codigo ?? b.nome)).map((r) => (
          <Link key={r.id} to={`/receitas/${r.id}`} style={{ gridTemplateColumns: '1fr auto' }}><span><span className="t">{r.nome}</span><br /><span className="s">{r.codigo}</span></span><span className="faint" style={{ fontSize: 12 }}>{r.status}</span></Link>
        ))}</div> : <p className="faint">Nenhuma fórmula nesta família.</p>}
      </Secao>
      {dados.esmaltes.length > 0 && <Secao titulo={`Esmaltes (${dados.esmaltes.length})`}>
        <div className="lista">{dados.esmaltes.map((e) => <Link key={e.id} to={`/esmaltes/${e.id}`} style={{ gridTemplateColumns: '1fr auto' }}><span className="t">{e.nome}</span><span className="faint">{e.codigo}</span></Link>)}</div>
      </Secao>}
      {dados.comerciais.length > 0 && <Secao titulo="Esmaltes comerciais estudados">
        <div className="lista">{dados.comerciais.map((c) => <Link key={c.id} to={`/engenharia-reversa/${c.id}`} style={{ gridTemplateColumns: '1fr auto' }}><span className="t">{c.fabricante} {c.nome}</span><span className="faint">{c.codigo}</span></Link>)}</div>
      </Secao>}
      <div style={{ marginTop: 32 }}><Relacoes tipo="familia" id={f.id} /></div>
      <ArtistasAfins termos={[f.nome, ...(f.nome.match(/\(([^)]+)\)/)?.slice(1) ?? [])]} />
    </div>
  )
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return <section style={{ marginTop: 28 }}><h3 style={{ marginBottom: 10 }}>{titulo}</h3>{children}</section>
}
