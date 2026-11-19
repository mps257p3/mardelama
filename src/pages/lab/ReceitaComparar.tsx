import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft } from 'lucide-react'
import { db, type Ingrediente } from '../../db/schema'
import { useReceitas } from '../../db/hooks'
import { CLASSES, comparar } from '../../lib/receita'
import { fmt } from '../../lib/opcoes'

/** Opções: "r:<id>" (receita atual) ou "v:<id>" (versão registrada). */
function useFonte(sel: string) {
  return useLiveQuery(async (): Promise<{ nome: string; ings: Ingrediente[] } | undefined> => {
    if (!sel) return
    const [t, id] = sel.split(':')
    if (t === 'r') { const r = await db.receitas.get(id); return r && { nome: `${r.nome} (atual, v${r.versaoAtual})`, ings: r.ingredientes } }
    const v = await db.versoes.get(id); return v && { nome: `${v.snapshot.nome} v${v.versao}`, ings: v.snapshot.ingredientes }
  }, [sel])
}

export default function ReceitaComparar() {
  const [sp] = useSearchParams()
  const receitas = useReceitas()
  const versoes = useLiveQuery(() => db.versoes.toArray(), [], [])
  const [a, setA] = useState(sp.get('a') ? 'r:' + sp.get('a') : '')
  const [b, setB] = useState('')
  const fa = useFonte(a), fb = useFonte(b)
  const linhas = useMemo(() => (fa && fb ? comparar(fa.ings, fb.ings) : []), [fa, fb])

  const Opcoes = () => <>
    <option value="">Escolha…</option>
    {(receitas ?? []).map((r) => <optgroup key={r.id} label={r.nome}>
      <option value={'r:' + r.id}>{r.nome} — atual (v{r.versaoAtual})</option>
      {versoes.filter((v) => v.receitaId === r.id).sort((x, y) => y.versao - x.versao).map((v) => <option key={v.id} value={'v:' + v.id}>{r.nome} — v{v.versao}{v.nota ? ' · ' + v.nota : ''}</option>)}
    </optgroup>)}
  </>

  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <Link to="/receitas" className="back"><ArrowLeft size={15} />Receitas</Link>
      <h1>Comparar formulações</h1>
      <p className="muted" style={{ marginTop: 8 }}>Compare receitas diferentes ou versões da mesma receita. A base é normalizada para 100% nos dois lados.</p>
      <div className="grade2" style={{ marginTop: 24 }}>
        <select className="input" value={a} onChange={(e) => setA(e.target.value)}><Opcoes /></select>
        <select className="input" value={b} onChange={(e) => setB(e.target.value)}><Opcoes /></select>
      </div>
      {fa && fb && (
        <div className="tabela-wrap" style={{ marginTop: 24 }}>
          <table className="tabela">
            <thead><tr><th>Ingrediente</th><th className="n">A</th><th className="n">B</th><th className="n">Diferença</th></tr></thead>
            <tbody>
              {CLASSES.map((c) => {
                const xs = linhas.filter((l) => l.classe === c.v)
                return xs.length ? [<tr key={c.v} className="classe-titulo"><td colSpan={4}>{c.l}</td></tr>,
                  ...xs.map((l) => <tr key={c.v + l.nome}>
                    <td>{l.nome}</td><td className="n">{l.a == null ? '—' : fmt(l.a, 2)}</td><td className="n">{l.b == null ? '—' : fmt(l.b, 2)}</td>
                    <td className="n" style={{ color: Math.abs(l.delta) < 0.005 ? 'var(--ink-3)' : l.delta > 0 ? 'var(--azul)' : 'var(--terracota)' }}>{Math.abs(l.delta) < 0.005 ? '=' : (l.delta > 0 ? '+' : '') + fmt(l.delta, 2)}</td>
                  </tr>)] : null
              })}
            </tbody>
          </table>
          <p className="faint" style={{ fontSize: 12.5, marginTop: 10 }}>A: {fa.nome} · B: {fb.nome}</p>
        </div>
      )}
    </div>
  )
}
