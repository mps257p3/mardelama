import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Heart, Link2, Search } from 'lucide-react'
import { db, type Tipo } from '../db/schema'
import { buscarTodos, resumo, ROTULO, type Resumo } from '../lib/entidades'
import { Foto } from '../ui/form'

function Linhas({ itens }: { itens: Resumo[] }) {
  const grupos = useMemo(() => { const m = new Map<Tipo, Resumo[]>(); itens.forEach((r) => m.set(r.tipo, [...(m.get(r.tipo) ?? []), r])); return [...m.entries()] }, [itens])
  return <>{grupos.map(([t, rs]) => (
    <section key={t} style={{ marginTop: 26 }}>
      <p className="eyebrow">{ROTULO[t]} · {rs.length}</p>
      <div className="lista">{rs.map((r) => (
        <Link key={r.id} to={r.to}>
          <div className="mini">{r.foto ? <Foto id={r.foto} /> : r.fotoUrl ? <img src={r.fotoUrl} alt="" referrerPolicy="no-referrer" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Link2 size={18} strokeWidth={1.3} />}</div>
          <div><div className="t">{r.titulo}</div><div className="s">{r.sub}</div></div><span />
        </Link>))}</div>
    </section>))}</>
}

export default function Busca() {
  const [sp, setSp] = useSearchParams()
  const [q, setQ] = useState(sp.get('q') ?? '')
  const [res, setRes] = useState<Resumo[]>()
  useEffect(() => {
    if (!q.trim()) { setRes(undefined); return }
    let vivo = true
    const h = setTimeout(() => { buscarTodos(q, 300).then((x) => vivo && setRes(x)); setSp(q ? { q } : {}, { replace: true }) }, 180)
    return () => { vivo = false; clearTimeout(h) }
  }, [q, setSp])

  const favoritos = useLiveQuery(async () => {
    const tabs: [string, Tipo][] = [['esmaltes', 'esmalte'], ['testes', 'teste'], ['materiais', 'material'], ['referencias', 'referencia'], ['conteudos', 'conteudo']]
    const out: Resumo[] = []
    for (const [t, tipo] of tabs) for (const x of (await db.table(t).toArray()).filter((y) => y.favorito && !y.excluido)) { const r = await resumo(tipo, x.id); if (r) out.push(r) }
    return out
  }, [], [])

  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <p className="eyebrow">Todo o ateliê</p>
      <h1 style={{ marginTop: 8 }}>Buscar</h1>
      <div className="search" style={{ margin: '24px 0 8px' }}>
        <Search size={18} />
        <input autoFocus className="input" style={{ minHeight: 54, fontSize: 17, borderRadius: 999, paddingLeft: 44 }} placeholder="Esmaltes, receitas, testes, materiais, referências, anotações…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {res ? (res.length ? <><p className="faint" style={{ fontSize: 13 }}>{res.length} resultados</p><Linhas itens={res} /></> : <p className="muted" style={{ marginTop: 24 }}>Nada encontrado para "{q}".</p>) : (
        <>
          <h2 style={{ marginTop: 32, display: 'flex', alignItems: 'center', gap: 10 }}><Heart size={22} strokeWidth={1.3} />Favoritos</h2>
          {favoritos.length ? <Linhas itens={favoritos} /> : <p className="faint" style={{ marginTop: 12 }}>Itens marcados como favoritos aparecem aqui, reunidos.</p>}
        </>
      )}
    </div>
  )
}
