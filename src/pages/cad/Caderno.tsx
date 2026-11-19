import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Search } from 'lucide-react'
import { db } from '../../db/schema'
import { normaliza, textoBusca } from '../../lib/filtros'
import { Foto } from '../../ui/form'
import { useAjuste, definirAjuste } from '../../db/settings'
import { novaNota, notaVazia } from './NotaEditor'

const semHtml = (h: string) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

export default function Caderno() {
  const notas = useLiveQuery(async () => (await db.notas.orderBy('criadoEm').reverse().toArray()).filter((n) => !n.excluido))
  const modo = useAjuste<'tempo' | 'temas'>('caderno.modo', 'tempo')
  const [q, setQ] = useState('')
  const nav = useNavigate()
  useEffect(() => { db.notas.toArray().then((ns) => ns.filter((x) => !x.excluido && notaVazia(x)).forEach((x) => db.notas.update(x.id, { excluido: 1, atualizadoEm: Date.now() }))) }, [])
  const lista = useMemo(() => (notas ?? []).filter((n) => !q || textoBusca(n.titulo, semHtml(n.corpo), n.tags, n.tema).includes(normaliza(q))), [notas, q])
  const grupos = useMemo(() => {
    const m = new Map<string, typeof lista>()
    for (const n of lista) {
      const ch = modo === 'tempo' ? new Date(n.criadoEm).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : (n.tema || 'Sem tema')
      m.set(ch, [...(m.get(ch) ?? []), n])
    }
    return [...m.entries()].sort((a, b) => modo === 'temas' ? (a[0] === 'Sem tema' ? 1 : b[0] === 'Sem tema' ? -1 : a[0].localeCompare(b[0])) : 0)
  }, [lista, modo])

  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <div className="head">
        <div><p className="eyebrow">Diário criativo</p><h1 style={{ marginTop: 8 }}>Caderno</h1></div>
        <button className="btn primary" onClick={async () => nav(`/caderno/${await novaNota()}`)}><Plus size={16} />Nova anotação</button>
      </div>
      <div className="toolbar">
        <div className="search"><Search size={16} /><input className="input" placeholder="Buscar nas anotações…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="seg">
          <button className={modo === 'tempo' ? 'on' : ''} onClick={() => definirAjuste('caderno.modo', 'tempo')}>Cronológico</button>
          <button className={modo === 'temas' ? 'on' : ''} onClick={() => definirAjuste('caderno.modo', 'temas')}>Por temas</button>
        </div>
      </div>
      {notas && notas.length === 0 && <div className="empty"><span className="serif">Uma página em branco.</span><span>Registre ideias, pensamentos, pesquisas e descobertas, com texto, imagens, desenhos, cores e áudio.</span></div>}
      {grupos.map(([g, ns]) => (
        <section key={g} style={{ marginTop: 28 }}>
          <p className="eyebrow" style={{ textTransform: 'uppercase' }}>{g}</p>
          <div className="diario">
            {ns.map((n) => { const d = new Date(n.criadoEm); const txt = semHtml(n.corpo); return (
              <Link key={n.id} to={`/caderno/${n.id}`} className="entrada">
                <div className="dia"><b>{d.getDate()}</b><span>{d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span></div>
                <div>
                  <div className="t">{n.titulo || txt.slice(0, 60) || 'Sem título'}</div>
                  {txt && n.titulo && <div className="resumo">{txt}</div>}
                  {(n.imagens.length > 0 || n.paleta?.length) ? <div className="imgs">
                    {n.imagens.slice(0, 4).map((i) => <div key={i}><Foto id={i} /></div>)}
                    {n.paleta?.length ? <div style={{ display: 'flex', flexDirection: 'column' }}>{n.paleta.map((c) => <span key={c} style={{ flex: 1, background: c }} />)}</div> : null}
                  </div> : null}
                  <div className="s faint" style={{ fontSize: 12, marginTop: 8 }}>{[modo === 'tempo' && n.tema, ...n.tags.map((t) => '#' + t), n.audios.length ? `${n.audios.length} áudio` : ''].filter(Boolean).join('  ')}</div>
                </div>
              </Link>) })}
          </div>
        </section>
      ))}
    </div>
  )
}
