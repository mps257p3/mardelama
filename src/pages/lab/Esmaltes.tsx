import { LinkSegurar } from '../../ui/Segurar'
import { incluidoEm } from '../../lib/data'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FlaskConical, Grid2x2, List, Plus, Search, SlidersHorizontal, Heart } from 'lucide-react'
import { useEsmaltes, useFamilias } from '../../db/hooks'
import { ACABAMENTOS, CORES, STATUS, TEXTURAS, ATMOSFERAS, fmt } from '../../lib/opcoes'
import { FAIXAS_TEMP, normaliza, textoBusca } from '../../lib/filtros'
import { Foto, Multi, Estrelas } from '../../ui/form'
import { useAjuste, definirAjuste } from '../../db/settings'
import { Menu } from '../../ui/Menu'

type F = { cor: string[]; temp: string[]; acab: string[]; text: string[]; fam: string[]; status: string[]; atm: string[]; fav: boolean }
const VAZIO: F = { cor: [], temp: [], acab: [], text: [], fam: [], status: [], atm: [], fav: false }

export default function Esmaltes({ embutido, familia }: { embutido?: boolean; familia?: string } = {}) {
  const esmaltes = useEsmaltes()
  const familias = useFamilias()
  const modo = useAjuste<'grade' | 'lista'>('esmaltes.modo', 'grade')
  const [q, setQ] = useState('')
  const [abrir, setAbrir] = useState(false)
  const [f, setF] = useState<F>(VAZIO)
  const ativos = Object.entries(f).reduce((n, [, v]) => n + (Array.isArray(v) ? v.length : v ? 1 : 0), 0)
  const famNome = useMemo(() => new Map(familias.map((x) => [x.id, x.nome])), [familias])

  const lista = useMemo(() => (esmaltes ?? []).filter((e) => {
    const qq = normaliza(q.trim())
    if (qq && !textoBusca(e.nome, e.codigo, e.autoria, e.cor, e.tags, e.familias.map((id) => famNome.get(id) ?? '')).includes(qq)) return false
    const any = (sel: string[], v?: string) => !sel.length || (v != null && sel.includes(v))
    if (!any(f.cor, e.cor) || !any(f.acab, e.acabamento) || !any(f.text, e.textura) || !any(f.status, e.status) || !any(f.atm, e.atmosfera)) return false
    if (familia && !e.familias.includes(familia)) return false
    if (f.fam.length && !f.fam.some((id) => e.familias.includes(id))) return false
    if (f.temp.length && !(e.temperatura != null && FAIXAS_TEMP.some((x) => f.temp.includes(x.v) && x.t(e.temperatura!)))) return false
    if (f.fav && !e.favorito) return false
    return true
  }), [esmaltes, q, f, famNome, familia])

  const op = (xs: readonly string[]) => xs.map((x) => ({ v: x, l: x }))
  const set = <K extends keyof F>(k: K) => (v: F[K]) => setF({ ...f, [k]: v })

  return (
    <div className={embutido ? undefined : 'page'}>
      <div className="toolbar">
        <div className="search"><Search size={16} /><input className="input" placeholder="Buscar esmaltes" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <button className={'iconbtn' + (abrir || ativos ? ' on' : '')} style={{ position: 'relative' }} aria-label="Filtros" onClick={() => setAbrir(!abrir)}><SlidersHorizontal size={18} />{ativos > 0 && <span className="badge">{ativos}</span>}</button>
        <Menu itens={[
          { l: 'Ver em grade', icon: <Grid2x2 size={16} />, on: modo === 'grade', onClick: () => definirAjuste('esmaltes.modo', 'grade') },
          { l: 'Ver em lista', icon: <List size={16} />, on: modo === 'lista', onClick: () => definirAjuste('esmaltes.modo', 'lista') },
        ]} />
      </div>

      {abrir && (
        <div className="card filtros">
          {!embutido && <div className="linha"><span>Família</span><Multi value={f.fam} onChange={set('fam')} opcoes={familias.map((x) => ({ v: x.id, l: x.nome }))} /></div>}
          <div className="linha"><span>Cor</span><Multi value={f.cor} onChange={set('cor')} opcoes={op(CORES)} /></div>
          <div className="linha"><span>Temperatura</span><Multi value={f.temp} onChange={set('temp')} opcoes={FAIXAS_TEMP.map((x) => ({ v: x.v, l: x.l }))} /></div>
          <div className="linha"><span>Acabamento</span><Multi value={f.acab} onChange={set('acab')} opcoes={op(ACABAMENTOS)} /></div>
          <div className="linha"><span>Textura</span><Multi value={f.text} onChange={set('text')} opcoes={op(TEXTURAS)} /></div>
          <div className="linha"><span>Atmosfera</span><Multi value={f.atm} onChange={set('atm')} opcoes={op(ATMOSFERAS)} /></div>
          <div className="linha"><span>Status</span><Multi value={f.status} onChange={set('status')} opcoes={op(STATUS)} /></div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <button className={'chip' + (f.fav ? ' on' : '')} onClick={() => setF({ ...f, fav: !f.fav })}><Heart size={13} />Só favoritos</button>
            <button className="btn sm ghost" onClick={() => setF(VAZIO)}>Limpar filtros</button>
          </div>
        </div>
      )}

      {!embutido && <p className="faint" style={{ fontSize: 13, marginBottom: 16 }}>{lista.length} {lista.length === 1 ? 'esmalte' : 'esmaltes'}</p>}

      {esmaltes && esmaltes.length === 0 ? (
        <div className="empty">
          <span className="serif">Sua biblioteca de superfícies começa aqui.</span>
          <span>Cadastre um esmalte comercial ou uma formulação própria, com fotos, receita e testes.</span>
          <Link className="btn primary sm" to="/esmaltes/novo"><Plus size={15} />Cadastrar esmalte</Link>
        </div>
      ) : modo === 'grade' ? (
        <div className="galeria galeria-grande">
          {lista.map((e) => (
            <LinkSegurar key={e.id} to={`/esmaltes/${e.id}`} className="peca" opcoes={{ tabela: 'esmaltes', id: e.id, titulo: e.nome, favorito: e.favorito, nome: 'esmalte' }}>
              <div className="ph">
                {e.fotos[0] ? <Foto id={e.fotos[0]} alt={e.nome} /> : e.corHex ? <div className="swatch" style={{ background: e.corHex }} /> : <FlaskConical size={30} strokeWidth={1.1} />}
                <span className="cod">{e.codigo}</span>
              </div>
              <div>
                <div className="t">{e.nome}</div>
                <div className="s">{[e.acabamento, e.temperatura ? fmt(e.temperatura, 0) + ' °C' : e.cone && 'cone ' + e.cone, incluidoEm(e.criadoEm)].filter(Boolean).join(' · ')}</div>
              </div>
            </LinkSegurar>
          ))}
        </div>
      ) : (
        <div className="lista">
          {lista.map((e) => (
            <LinkSegurar key={e.id} to={`/esmaltes/${e.id}`} opcoes={{ tabela: 'esmaltes', id: e.id, titulo: e.nome, favorito: e.favorito, nome: 'esmalte' }}>
              <div className="mini">{e.fotos[0] ? <Foto id={e.fotos[0]} /> : e.corHex ? <div className="swatch" style={{ background: e.corHex }} /> : <FlaskConical size={20} strokeWidth={1.2} />}</div>
              <div>
                <div className="t">{e.nome}</div>
                <div className="s">{[e.codigo, e.familias.map((id) => famNome.get(id)).filter(Boolean).join(', '), e.acabamento, e.textura, incluidoEm(e.criadoEm)].filter(Boolean).join(' · ')}</div>
              </div>
              <div className="r">
                {e.temperatura ? fmt(e.temperatura, 0) + ' °C' : e.cone ? 'cone ' + e.cone : ''}
                {!!e.avaliacao && <Estrelas value={e.avaliacao} tamanho={12} />}
              </div>
            </LinkSegurar>
          ))}
        </div>
      )}
    </div>
  )
}
