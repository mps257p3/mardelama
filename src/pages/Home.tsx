import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Search, Settings, ImagePlus } from 'lucide-react'
import { db, type Exposicao } from '../db/schema'
import { ImgObra } from './bib/art/ImgObra'
import { fimEfetivo, periodo } from './bib/Agenda'
import { useArquivoUrl } from '../db/files'
import { useAjuste } from '../db/settings'
import { AREAS } from '../ui/nav'
import { Monograma } from '../ui/Monograma'
import { Foto } from '../ui/form'
import { Miniatura } from '../ui/itens'
import { useDestaqueCfg, useSecoesInicio, type SecaoId } from '../lib/inicio'

const vivos = <T extends { excluido?: 0 | 1 }>(xs: T[]) => xs.filter((x) => !x.excluido)

export function useFotoArea(slug: string) {
  const id = useAjuste<string | undefined>(`area.foto.${slug}`, undefined)
  const url = useArquivoUrl(id)
  return url ?? `/areas/${slug}.jpg`
}

function CardArea({ a }: { a: (typeof AREAS)[number] }) {
  const src = useFotoArea(a.slug)
  const I = a.icon
  return (
    <Link to={a.to} className="card-area">
      <span className="foto"><img src={src} alt="" loading="lazy" /></span>
      <span className="nome"><I size={15} strokeWidth={1.5} style={{ color: a.cor }} />{a.nome}</span>
    </Link>
  )
}

export function Destaque({ editar = true }: { editar?: boolean }) {
  const id = useAjuste<string | undefined>('destaque', undefined)
  const url = useArquivoUrl(id)
  const cfg = useDestaqueCfg()
  return (
    <figure className={'destaque' + (cfg.tituloSobre ? ' sobre' : '')}>
      <img src={url ?? '/destaque-padrao.jpg'} alt={url ? "Fotografia de destaque" : "Raposa, obra de Marcelo Parducci"} style={{ objectPosition: url ? `${cfg.x}% ${cfg.y}%` : '50% 45%' }} />
      {cfg.tituloSobre && (
        <figcaption style={{ color: cfg.tituloClaro ? 'var(--marfim)' : 'var(--carvao)' }}>
          <h1>Mar de Lama</h1>
          <p>Pesquisa, matéria e criação.</p>
        </figcaption>
      )}
      {cfg.credito && <span className="credito">{cfg.credito}</span>}
      {editar && <Link to="/ajustes#tela-inicial" className="editar" aria-label="Personalizar fotografia de destaque"><ImagePlus size={16} strokeWidth={1.5} /></Link>}
    </figure>
  )
}

function Secao({ titulo, link, children }: { titulo: string; link?: { to: string; label: string }; children: React.ReactNode }) {
  return (
    <section className="secao">
      <div className="secao-head">
        <h2>{titulo}</h2>
        {link && <Link to={link.to}>{link.label}</Link>}
      </div>
      {children}
    </section>
  )
}

interface Peca { id: string; to: string; titulo: string; sub?: string; foto?: string; cor?: string }
function Trilho({ itens, tipo }: { itens: Peca[]; tipo: 'esmalte' | 'teste' | 'referencia' }) {
  return (
    <div className="trilho">
      {itens.map((p) => (
        <Link key={p.id} to={p.to} className="peca-mini">
          <span className="ph">{p.foto ? <Foto id={p.foto} /> : <Miniatura tipo={tipo} cor={p.cor} tam={112} />}</span>
          <span className="t">{p.titulo}</span>
          {p.sub && <span className="s">{p.sub}</span>}
        </Link>
      ))}
    </div>
  )
}

function SecEsmaltes() {
  const itens = useLiveQuery(async () => vivos(await db.esmaltes.orderBy('criadoEm').reverse().limit(16).toArray()).slice(0, 10)
    .map<Peca>((e) => ({ id: e.id, to: `/esmaltes/${e.id}`, titulo: e.nome, sub: e.codigo, foto: e.fotos[0], cor: e.corHex })), [])
  if (!itens?.length) return null
  return (
    <Secao titulo="Últimos esmaltes" link={itens.length ? { to: '/esmaltes', label: 'Ver todos' } : undefined}>
      {itens.length ? <Trilho itens={itens} tipo="esmalte" /> : null}
    </Secao>
  )
}

function SecTestes() {
  const itens = useLiveQuery(async () => vivos(await db.testes.orderBy('criadoEm').reverse().limit(16).toArray()).slice(0, 10)
    .map<Peca>((t) => ({ id: t.id, to: `/testes/${t.id}`, titulo: t.codigo, sub: t.data ? new Date(t.data + 'T12:00').toLocaleDateString('pt-BR') : undefined, foto: t.fotos[0] })), [])
  if (!itens?.length) return null
  return (
    <Secao titulo="Últimos testes" link={itens.length ? { to: '/testes', label: 'Ver todos' } : undefined}>
      {itens.length ? <Trilho itens={itens} tipo="teste" /> : null}
    </Secao>
  )
}

function SecFavoritas() {
  const itens = useLiveQuery(async () => vivos(await db.referencias.where('favorito').equals(1).toArray())
    .sort((a, b) => b.atualizadoEm - a.atualizadoEm).slice(0, 10)
    .map<Peca>((r) => ({ id: r.id, to: `/referencias/${r.id}`, titulo: r.titulo, sub: r.autor, foto: r.imagens[0] })), [])
  if (!itens?.length) return null
  return (
    <Secao titulo="Referências favoritas" link={itens.length ? { to: '/referencias/acervo', label: 'Ver referências' } : undefined}>
      {itens.length ? <Trilho itens={itens} tipo="referencia" /> : null}
    </Secao>
  )
}

function SecAgenda() {
  const itens = useLiveQuery(async () => {
    const hoje = new Date(); const h = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`
    const es = vivos(await db.exposicoes.toArray())
    const fim = (e: Exposicao) => fimEfetivo(e) ?? '9999'
    const cartaz = es.filter((e) => (e.inicio ?? '') <= h && fim(e) >= h).sort((a, b) => fim(a).localeCompare(fim(b)))
    const breve = es.filter((e) => (e.inicio ?? '') > h).sort((a, b) => (a.inicio ?? '').localeCompare(b.inicio ?? ''))
    return [...cartaz.map((e) => ({ e, quando: 'Em cartaz' })), ...breve.map((e) => ({ e, quando: 'Em breve' }))].slice(0, 4)
  }, [])
  if (!itens?.length) return null
  return (
    <Secao titulo="Exposições em São Paulo" link={{ to: '/biblioteca/agenda', label: 'Ver agenda' }}>
      <div className="expo-trilho">{itens.map(({ e, quando }) => (
        <Link key={e.id} to={`/biblioteca/agenda#${e.id}`} className={'expo-mini' + (e.imagem || e.arquivo ? ' com-foto' : '')}>
          {(e.imagem || e.arquivo) && <span className="expo-mini-foto"><ImgObra o={{ imagem: e.imagem, arquivo: e.arquivo, titulo: e.titulo }} /></span>}
          <span className="q">{quando}{e.favorito ? ' · quero ir' : ''}</span>
          <span className="t">{e.titulo}</span>
          <span className="s">{e.local}</span>
          <span className="d">{periodo(e)}</span>
        </Link>
      ))}</div>
    </Secao>
  )
}

const SECOES: Record<SecaoId, () => React.ReactElement | null> = {
  agenda: SecAgenda,
  esmaltes: SecEsmaltes, testes: SecTestes, favoritas: SecFavoritas,
}

export default function Home() {
  const cfg = useDestaqueCfg()
  const secoes = useSecoesInicio()
  return (
    <div className="page inicio">
      <header className="topo">
        <Monograma className="mono" altura={34} />
        <div className="acoes">
          <Link to="/busca" className="iconbtn" aria-label="Buscar"><Search size={20} strokeWidth={1.5} /></Link>
          <Link to="/ajustes" className="iconbtn" aria-label="Ajustes"><Settings size={20} strokeWidth={1.5} /></Link>
        </div>
      </header>

      <Destaque />
      {!cfg.tituloSobre && (
        <div className="titulo-inicio">
          <h1>Mar de Lama</h1>
          <p>Pesquisa, matéria e criação.</p>
        </div>
      )}

      <nav className="areas-fotos" aria-label="Áreas">
        {AREAS.map((a) => <CardArea key={a.slug} a={a} />)}
      </nav>

      {secoes.filter((s) => s.on).map((s) => { const C = SECOES[s.id]; return <C key={s.id} /> })}
    </div>
  )
}
