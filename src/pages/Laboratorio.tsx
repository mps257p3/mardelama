import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronRight, Layers, Calculator, Shapes, Flame, SearchCode, ShoppingBag, ShieldAlert } from 'lucide-react'
import { db } from '../db/schema'
import { CapasSuperficies } from './lab/CapasSuperficies'

const vivos = async (t: string) => (await db.table(t).toArray()).filter((x: { excluido?: 0 | 1 }) => !x.excluido).length

const ITENS = [
  { to: '/materiais', nome: 'Materiais', desc: 'Matérias-primas, preços e estoque', icon: Layers, t: 'materiais' },
  { to: '/familias', nome: 'Famílias', desc: 'B01 a B10: bases e comportamentos', icon: Shapes, t: 'familias' },
  { to: '/curvas', nome: 'Curvas de queima', desc: 'Rampas, patamares e gráfico', icon: Flame, t: 'curvas' },
  { to: '/engenharia-reversa', nome: 'Engenharia reversa', desc: 'Esmaltes comerciais estudados', icon: SearchCode, t: 'comerciais' },
  { to: '/compras', nome: 'Compras', desc: 'Lista planejada e fornecedores', icon: ShoppingBag, t: 'compras' },
  { to: '/calculadoras', nome: 'Calculadoras', desc: 'Ferramentas de bancada', icon: Calculator },
] as const

/** Laboratório: as capas de Superfícies no topo e as outras áreas de bancada numa lista embaixo. */
export default function Laboratorio() {
  const n = useLiveQuery(async () => Object.fromEntries(await Promise.all(ITENS.filter((i) => 't' in i).map(async (i) => [i.to, await vivos((i as { t: string }).t)]))), [], {} as Record<string, number>)
  return (
    <div className="page">
      <h1 className="sup-titulo">Laboratório</h1>
      <CapasSuperficies />
      <nav className="lab-lista">
        {ITENS.map(({ to, nome, desc, icon: I }) => (
          <Link key={to} to={to}>
            <I size={20} strokeWidth={1.3} />
            <span className="t">{nome}<span className="s">{desc}</span></span>
            {n[to] != null && <span className="n">{n[to]}</span>}
            <ChevronRight size={16} strokeWidth={1.5} className="seta" />
          </Link>
        ))}
      </nav>
      <Link to="/biblioteca/bib-seguranca" className="aviso forte" style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 24 }}>
        <ShieldAlert size={18} strokeWidth={1.5} style={{ flexShrink: 0 }} />
        <span>Segurança do laboratório: pó de sílica, óxidos, conservantes e descarte. Nenhum esmalte é considerado seguro para alimentos sem teste de lixiviação.</span>
      </Link>
    </div>
  )
}
