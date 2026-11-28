import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Search, Settings, ImagePlus, ArrowUpRight, Heart } from 'lucide-react'
import { alternarFavorito } from '../db/hooks'
import { SecBancada } from './inicio/Bancada'
import { db, type Exposicao } from '../db/schema'
import { ImgObra } from './bib/art/ImgObra'
import { fimEfetivo, periodo } from './bib/Agenda'
import { useArquivoUrl } from '../db/files'
import { useAjuste } from '../db/settings'
import { AREAS, REF2 } from '../ui/nav'
import { Monograma } from '../ui/Monograma'
import { estiloRecorte, useRecorteAjuste } from '../ui/Recorte'
import { useDestaqueCfg, useSecoesInicio, type SecaoId } from '../lib/inicio'

const vivos = <T extends { excluido?: 0 | 1 }>(xs: T[]) => xs.filter((x) => !x.excluido)

export function useFotoArea(slug: string) {
  const id = useAjuste<string | undefined>(`area.foto.${slug}`, undefined)
  const url = useArquivoUrl(id)
  return url ?? `/areas/${slug}.jpg`
}
/** Enquadramento da foto própria de uma área (a padrão fica centralizada). */
export function useEstiloFotoArea(slug: string) {
  const id = useAjuste<string | undefined>(`area.foto.${slug}`, undefined)
  const r = useRecorteAjuste(`area.foto.${slug}`)
  return id ? estiloRecorte(r) : undefined
}

const DESC_AREA: Record<string, string> = {
  esmaltes: 'Materiais e superfícies', referencias: 'Repertório visual', biblioteca: 'Conhecimento e pesquisa', caderno: 'Ideias e processos',
}

function CardArea({ a, selo }: { a: (typeof AREAS)[number] | typeof REF2; selo?: string }) {
  const src = useFotoArea(a.slug)
  const estilo = useEstiloFotoArea(a.slug)
  const I = a.icon
  return (
    <Link to={a.to} className="card-area">
      <span className="foto"><img src={src} alt="" loading="lazy" style={estilo} /></span>
      <span className="nome"><I size={15} strokeWidth={1.5} style={{ color: a.cor }} />{a.nome}<ArrowUpRight size={14} strokeWidth={1.4} className="seta" aria-hidden /></span>
      {(DESC_AREA[a.slug] ?? (selo ? a.desc : undefined)) && <span className="desc">{DESC_AREA[a.slug] ?? a.desc}</span>}
      {selo && <span className="desc"><span className="selo-exp">{selo}</span></span>}
    </Link>
  )
}

export function Destaque({ editar = true }: { editar?: boolean }) {
  const id = useAjuste<string | undefined>('destaque', undefined)
  const url = useArquivoUrl(id)
  const cfg = useDestaqueCfg()
  return (
    <figure className={'destaque' + (cfg.tituloSobre ? ' sobre' : '')}>
      <img src={url ?? '/destaque-padrao.jpg'} alt={url ? "Fotografia de destaque" : "Raposa, obra de Marcelo Parducci"} style={url ? estiloRecorte({ x: cfg.x / 100, y: cfg.y / 100, zoom: cfg.zoom ?? 1 }) : { objectPosition: '50% 45%' }} />
      {cfg.tituloSobre && (
        <figcaption style={{ color: cfg.tituloClaro ? 'var(--marfim)' : 'var(--carvao)' }}>
          <h1>Mar de Lama</h1>
        </figcaption>
      )}
      {cfg.credito && <span className="credito">{cfg.credito}</span>}
      {editar && <Link to="/ajustes#tela-inicial" className="editar" aria-label="Personalizar fotografia de destaque"><ImagePlus size={13} strokeWidth={1.5} /></Link>}
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

/** Situação pela data de hoje: em cartaz, últimos dias (até 7 dias do fim) ou em breve. */
function situacao(e: Exposicao, h: string) {
  if ((e.inicio ?? '') > h) return 'Em breve'
  const f = fimEfetivo(e)
  if (f) { const dias = (new Date(f + 'T12:00').getTime() - new Date(h + 'T12:00').getTime()) / 86400000; if (dias <= 7) return 'Últimos dias' }
  return 'Em cartaz'
}

function SecAgenda() {
  const itens = useLiveQuery(async () => {
    const hoje = new Date(); const h = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`
    const es = vivos(await db.exposicoes.toArray())
    const fim = (e: Exposicao) => fimEfetivo(e) ?? '9999'
    const cartaz = es.filter((e) => (e.inicio ?? '') <= h && fim(e) >= h).sort((a, b) => fim(a).localeCompare(fim(b)))
    const breve = es.filter((e) => (e.inicio ?? '') > h).sort((a, b) => (a.inicio ?? '').localeCompare(b.inicio ?? ''))
    return [...cartaz, ...breve].slice(0, 4).map((e) => ({ e, quando: situacao(e, h) }))
  }, [])
  if (!itens?.length) return null
  return (
    <Secao titulo="Exposições em São Paulo" link={{ to: '/biblioteca/agenda', label: 'Ver agenda' }}>
      <div className="expo-trilho">{itens.map(({ e, quando }) => (
        <div key={e.id} className="expo-mini">
          <Link to={`/biblioteca/agenda#${e.id}`} className="expo-mini-link">
            {(e.imagem || e.arquivo) && <span className="expo-mini-foto"><ImgObra o={{ imagem: e.imagem, arquivo: e.arquivo, titulo: e.titulo }} /></span>}
            <span className={'q' + (quando === 'Últimos dias' ? ' ultimos' : '')}>{quando}</span>
            <span className="t">{e.titulo}</span>
            <span className="s">{e.local}</span>
            <span className="d">{periodo(e)}</span>
          </Link>
          <button className={'expo-fav' + (e.favorito ? ' on' : '')} aria-pressed={!!e.favorito} aria-label={e.favorito ? 'Tirar de "quero ir"' : 'Quero ir'} onClick={() => alternarFavorito('exposicoes', e.id, e.favorito)}>
            <Heart size={15} strokeWidth={1.5} fill={e.favorito ? 'currentColor' : 'none'} />
          </button>
        </div>
      ))}</div>
    </Secao>
  )
}

const SECOES: Record<SecaoId, () => React.ReactElement | null> = {
  bancada: SecBancada,
  agenda: SecAgenda,
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
        </div>
      )}

      <nav className="areas-fotos" aria-label="Áreas">
        {AREAS.filter((a) => a.slug !== 'materiais' && a.slug !== 'calculadoras').flatMap((a) => a.slug === 'referencias' ? [<CardArea key={a.slug} a={a} />, <CardArea key={REF2.slug} a={REF2} selo="Experimental" />] : [<CardArea key={a.slug} a={a} />])}
      </nav>

      {secoes.filter((s) => s.on).map((s) => { const C = SECOES[s.id]; return <C key={s.id} /> })}
    </div>
  )
}
