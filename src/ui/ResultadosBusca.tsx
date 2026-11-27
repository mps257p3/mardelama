import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Link2 } from 'lucide-react'
import type { Tipo } from '../db/schema'
import { ROTULO, type Resumo } from '../lib/entidades'
import { Foto } from './form'

/** Resultados de busca agrupados por tipo de registro, cada um levando direto à ficha. */
export function ResultadosBusca({ itens, q, rotulos, ordem }: { itens: Resumo[]; q: string; rotulos?: Partial<Record<Tipo, string>>; ordem?: Tipo[] }) {
  const grupos = useMemo(() => {
    const m = new Map<Tipo, Resumo[]>(); itens.forEach((r) => m.set(r.tipo, [...(m.get(r.tipo) ?? []), r]))
    const gs = [...m.entries()]
    return ordem ? gs.sort((a, b) => ordem.indexOf(a[0]) - ordem.indexOf(b[0])) : gs
  }, [itens, ordem])
  if (!itens.length) return <p className="muted" style={{ marginTop: 24 }}>Nada encontrado para “{q}”.</p>
  return <>{grupos.map(([t, rs]) => (
    <section key={t} style={{ marginTop: 22 }}>
      <p className="eyebrow">{rotulos?.[t] ?? ROTULO[t]} · {rs.length}</p>
      <div className="lista">{rs.map((r) => (
        <Link key={r.id} to={r.to}>
          <div className="mini">{r.foto ? <Foto id={r.foto} /> : r.fotoUrl ? <img src={r.fotoUrl} alt="" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Link2 size={18} strokeWidth={1.3} />}</div>
          <div><div className="t">{r.titulo}</div><div className="s">{r.sub}</div></div><span />
        </Link>))}</div>
    </section>))}</>
}
