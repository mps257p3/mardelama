import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, LayoutDashboard, Plus, Search, Tags as TagsIcon, ExternalLink } from 'lucide-react'
import { useGrupos, useReferencias } from '../../db/hooks'
import { normaliza, textoBusca } from '../../lib/filtros'
import { TIPOS_REF } from '../../lib/refs'
import { Foto } from '../../ui/form'
import { useAjuste, definirAjuste } from '../../db/settings'

export default function Referencias() {
  const refs = useReferencias()
  const grupos = useGrupos()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<string[]>([])
  const op = useAjuste<'E' | 'OU'>('refs.op', 'E')
  const [tipo, setTipo] = useState<string>()
  const [fav, setFav] = useState(false)
  const contagem = useMemo(() => { const m = new Map<string, number>(); (refs ?? []).forEach((r) => r.grupos.forEach((g) => m.set(g, (m.get(g) ?? 0) + 1))); return m }, [refs])
  const nomeG = useMemo(() => new Map(grupos.map((g) => [g.id, g.nome])), [grupos])

  const lista = useMemo(() => (refs ?? []).filter((r) => {
    if (sel.length && !(op === 'E' ? sel.every((g) => r.grupos.includes(g)) : sel.some((g) => r.grupos.includes(g)))) return false
    if (tipo && r.tipo !== tipo) return false
    if (fav && !r.favorito) return false
    if (q && !textoBusca(r.titulo, r.autor, r.fonte, r.descricao, r.comentarios, r.tags, r.grupos.map((g) => nomeG.get(g) ?? '')).includes(normaliza(q))) return false
    return true
  }), [refs, sel, op, tipo, fav, q, nomeG])

  return (
    <div className="page">
      <div className="head">
        <div><p className="eyebrow">Repertório</p><h1 style={{ marginTop: 8 }}>Referências</h1></div>
        <div className="acts">
          <Link className="btn" to="/paineis"><LayoutDashboard size={16} />Painéis</Link>
          <Link className="btn" to="/referencias/grupos"><TagsIcon size={16} />Grupos</Link>
          <Link className="btn primary" to="/referencias/nova"><Plus size={16} />Nova referência</Link>
        </div>
      </div>
      <div className="toolbar">
        <div className="search"><Search size={16} /><input className="input" placeholder="Buscar por título, artista, tag, comentário…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <button className={'chip' + (fav ? ' on' : '')} onClick={() => setFav(!fav)}><Heart size={13} />Favoritas</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <span className="eyebrow">Grupos</span>
        <div className="op" title="E: em todos os grupos escolhidos · OU: em qualquer um">
          <button className={op === 'E' ? 'on' : ''} onClick={() => definirAjuste('refs.op', 'E')}>E</button>
          <button className={op === 'OU' ? 'on' : ''} onClick={() => definirAjuste('refs.op', 'OU')}>OU</button>
        </div>
        {sel.length > 0 && <span className="faint" style={{ fontSize: 12.5 }}>{op === 'E' ? 'em todos: ' : 'em qualquer um: '}{sel.map((g) => nomeG.get(g)).join(op === 'E' ? ' + ' : ' / ')}</span>}
        {sel.length > 0 && <button className="btn sm ghost" onClick={() => setSel([])}>Limpar</button>}
      </div>
      <div className="chips" style={{ flexWrap: 'wrap', marginBottom: 12 }}>
        {grupos.map((g) => { const on = sel.includes(g.id); return (
          <button key={g.id} className={'chip' + (on ? ' on' : '')} onClick={() => setSel(on ? sel.filter((x) => x !== g.id) : [...sel, g.id])}>
            {g.nome}<span style={{ opacity: .6 }}>{contagem.get(g.id) ?? 0}</span>
          </button>) })}
      </div>
      <div className="chips" style={{ marginBottom: 24 }}>
        <button className={'chip' + (!tipo ? ' on' : '')} onClick={() => setTipo(undefined)}>Todos os tipos</button>
        {TIPOS_REF.map((t) => <button key={t} className={'chip' + (tipo === t ? ' on' : '')} onClick={() => setTipo(tipo === t ? undefined : t)}>{t}</button>)}
      </div>

      {refs && refs.length === 0 ? (
        <div className="empty"><span className="serif">Seu repertório visual começa aqui.</span>
          <span>Guarde imagens, artistas, texturas, formas e links. Uma mesma referência pode estar em vários grupos ao mesmo tempo.</span>
          <Link className="btn sm primary" to="/referencias/nova"><Plus size={15} />Adicionar referência</Link></div>
      ) : <>
        <p className="faint" style={{ fontSize: 13, marginBottom: 14 }}>{lista.length} {lista.length === 1 ? 'referência' : 'referências'}</p>
        <div className="mural">
          {lista.map((r) => (
            <Link key={r.id} to={`/referencias/${r.id}`} className="ref">
              <div className="img">
                {r.imagens[0] ? <Foto id={r.imagens[0]} alt={r.titulo} style={{ height: 'auto', objectFit: 'initial' }} />
                  : r.paleta?.length ? <div className="paleta" style={{ height: 140, borderRadius: 0 }}>{r.paleta.map((c) => <span key={c} style={{ background: c }} />)}</div>
                  : <div className="sem">{r.url ? <ExternalLink size={22} strokeWidth={1.2} /> : null}{r.titulo}</div>}
                {!!r.favorito && <Heart className="fav" size={16} fill="currentColor" />}
              </div>
              <div className="t">{r.titulo}</div>
              <div className="s">{[r.autor, r.tipo].filter(Boolean).join(' · ')}</div>
            </Link>
          ))}
        </div>
      </>}
    </div>
  )
}
