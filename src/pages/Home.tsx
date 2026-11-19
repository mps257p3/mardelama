import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowRight, ImagePlus, Search, Settings, FlaskConical, Images, Feather, Layers, BookOpen, ScrollText } from 'lucide-react'
import { db, type Tipo } from '../db/schema'
import { salvarArquivo, useArquivoUrl } from '../db/files'
import { definirAjuste, useAjuste } from '../db/settings'
import { AREAS } from '../ui/nav'
import { Monograma } from '../ui/Monograma'
import { useToast } from '../ui/toast'

interface Recente { tipo: Tipo; id: string; titulo: string; sub: string; foto?: string; to: string; quando: number }

const ICONE: Partial<Record<Tipo, typeof Images>> = {
  esmalte: FlaskConical, referencia: Images, nota: Feather, material: Layers, conteudo: BookOpen, teste: ScrollText,
}

function useRecentes(): Recente[] | undefined {
  return useLiveQuery(async () => {
    const n = 10
    const vivos = <T extends { excluido?: 0 | 1 }>(xs: T[]) => xs.filter((x) => !x.excluido)
    const [es, rs, ns, ms, cs, ts] = await Promise.all([
      db.esmaltes.orderBy('criadoEm').reverse().limit(n).toArray(),
      db.referencias.orderBy('criadoEm').reverse().limit(n).toArray(),
      db.notas.orderBy('criadoEm').reverse().limit(n).toArray(),
      db.materiais.orderBy('atualizadoEm').reverse().limit(n).toArray(),
      db.conteudos.orderBy('atualizadoEm').reverse().limit(n).toArray(),
      db.testes.orderBy('criadoEm').reverse().limit(n).toArray(),
    ])
    const out: Recente[] = [
      ...vivos(es).map((x) => ({ tipo: 'esmalte' as const, id: x.id, titulo: x.nome, sub: 'Esmalte · ' + x.codigo, foto: x.fotos[0], to: `/esmaltes/${x.id}`, quando: x.criadoEm })),
      ...vivos(rs).map((x) => ({ tipo: 'referencia' as const, id: x.id, titulo: x.titulo, sub: 'Referência', foto: x.imagens[0], to: `/referencias/${x.id}`, quando: x.criadoEm })),
      ...vivos(ns).map((x) => ({ tipo: 'nota' as const, id: x.id, titulo: x.titulo || 'Anotação', sub: 'Caderno', foto: x.imagens[0], to: `/caderno/${x.id}`, quando: x.criadoEm })),
      ...vivos(ms).map((x) => ({ tipo: 'material' as const, id: x.id, titulo: x.nome, sub: 'Material · ' + x.categoria, foto: x.fotos[0], to: `/materiais/${x.id}`, quando: x.criadoEm })),
      ...vivos(cs).map((x) => ({ tipo: 'conteudo' as const, id: x.id, titulo: x.titulo, sub: 'Biblioteca · ' + x.categoria, to: `/biblioteca/${x.id}`, quando: x.criadoEm })),
      ...vivos(ts).map((x) => ({ tipo: 'teste' as const, id: x.id, titulo: x.codigo, sub: 'Teste', foto: x.fotos[0], to: `/testes/${x.id}`, quando: x.criadoEm })),
    ]
    return out.sort((a, b) => b.quando - a.quando).slice(0, 12)
  })
}

function Tile({ r }: { r: Recente }) {
  const url = useArquivoUrl(r.foto)
  const I = ICONE[r.tipo] ?? Images
  return (
    <Link to={r.to} className="tile">
      <div className="ph">{url ? <img src={url} alt="" /> : <I size={28} strokeWidth={1.2} />}</div>
      <div><div className="t">{r.titulo}</div><div className="s">{r.sub}</div></div>
    </Link>
  )
}

function Faixa({ titulo, itens, vazio, link }: { titulo: string; itens?: Recente[]; vazio: React.ReactNode; link?: { to: string; label: string } }) {
  return (
    <section style={{ marginTop: 48 }}>
      <div className="section-head">
        <h2>{titulo}</h2>
        {link && itens && itens.length > 0 && <Link to={link.to}>{link.label}</Link>}
      </div>
      {itens === undefined ? null : itens.length === 0 ? vazio : (
        <div className="rail">{itens.map((r) => <Tile key={r.tipo + r.id} r={r} />)}</div>
      )}
    </section>
  )
}

export default function Home() {
  const toast = useToast()
  const destaqueId = useAjuste<string | undefined>('destaque', undefined)
  const destaqueUrl = useArquivoUrl(destaqueId)
  const input = useRef<HTMLInputElement>(null)
  const recentes = useRecentes()

  const testes = useLiveQuery(async () => {
    const ts = (await db.testes.orderBy('data').reverse().limit(10).toArray()).filter((t) => !t.excluido)
    return ts.map<Recente>((t) => ({ tipo: 'teste', id: t.id, titulo: t.codigo, sub: new Date(t.data + 'T12:00').toLocaleDateString('pt-BR'), foto: t.fotos[0], to: `/testes/${t.id}`, quando: t.criadoEm }))
  })
  const favoritas = useLiveQuery(async () => {
    const rs = (await db.referencias.where('favorito').equals(1).toArray()).filter((r) => !r.excluido)
    return rs.sort((a, b) => b.atualizadoEm - a.atualizadoEm).slice(0, 12)
      .map<Recente>((r) => ({ tipo: 'referencia', id: r.id, titulo: r.titulo, sub: r.autor || r.tipo, foto: r.imagens[0], to: `/referencias/${r.id}`, quando: r.criadoEm }))
  })

  async function trocarDestaque(f?: File) {
    if (!f) return
    const id = await salvarArquivo(f, { tipo: 'nota', id: 'destaque' })
    if (destaqueId) await db.arquivos.delete(destaqueId)
    await definirAjuste('destaque', id)
    toast('Imagem de destaque atualizada')
  }

  return (
    <div className="page">
      <section className="hero">
        <div className="hero-text">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Monograma className="mono" altura={54} />
            <div style={{ display: 'flex' }}>
              <Link to="/busca" className="iconbtn" aria-label="Buscar"><Search size={19} strokeWidth={1.4} /></Link>
              <Link to="/ajustes" className="iconbtn" aria-label="Ajustes"><Settings size={19} strokeWidth={1.4} /></Link>
            </div>
          </div>
          <div>
            <h1 style={{ marginTop: 10 }}>Mar de Lama</h1>
            <p className="lead">Esmaltes, referências, estudos e anotações, reunidos em uma só memória.</p>
          </div>
        </div>
        <figure className="hero-figure" style={{ margin: 0 }}>
          <img src={destaqueUrl ?? '/hero-default.jpg'} alt="Fotografia de destaque do ateliê" />
          <button className="btn sm hero-edit" onClick={() => input.current?.click()}>
            <ImagePlus size={15} strokeWidth={1.5} />Trocar imagem
          </button>
          <input ref={input} type="file" accept="image/*" hidden onChange={(e) => { trocarDestaque(e.target.files?.[0]); e.target.value = '' }} />
        </figure>
      </section>

      <section style={{ marginTop: 40 }}>
        <p className="eyebrow">Áreas</p>
        <div className="areas">
          {AREAS.map(({ to, nome, desc, icon: I }) => (
            <Link key={to} to={to} className="area">
              <I className="art" size={34} strokeWidth={1.1} style={{ width: 34 }} />
              <h3>{nome}</h3>
              <p>{desc}</p>
              <ArrowRight className="arrow" size={18} strokeWidth={1.4} />
            </Link>
          ))}
        </div>
      </section>

      <Faixa titulo="Adicionados recentemente" itens={recentes}
        vazio={<div className="empty"><span className="serif">O ateliê ainda está em silêncio.</span><span>Use o botão + para registrar a primeira anotação, referência ou esmalte.</span></div>} />

      <Faixa titulo="Últimos testes" itens={testes} link={{ to: '/testes', label: 'Ver todos' }}
        vazio={<div className="empty"><span className="serif">Nenhuma placa de teste ainda.</span><span>Cada teste ganha um código próprio para inscrever na placa física.</span></div>} />

      <Faixa titulo="Referências favoritas" itens={favoritas} link={{ to: '/referencias', label: 'Ver referências' }}
        vazio={<div className="empty"><span className="serif">Sem favoritas por enquanto.</span><span>Marque referências como favoritas para vê-las aqui.</span></div>} />
    </div>
  )
}
