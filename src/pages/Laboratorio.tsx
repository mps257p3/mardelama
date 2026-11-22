import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowRight, FlaskConical, Layers, Calculator, Shapes, Flame, SearchCode, ShoppingBag, ShieldAlert } from 'lucide-react'
import { db } from '../db/schema'

const vivos = async (t: string) => (await db.table(t).toArray()).filter((x: { excluido?: 0 | 1 }) => !x.excluido).length

const ITENS = [
  { to: '/superficies', nome: 'Superfícies', desc: 'Esmaltes, fórmulas e testes', icon: FlaskConical, t: 'esmaltes' },
  { to: '/familias', nome: 'Famílias', desc: 'B01 a B10: bases e comportamentos', icon: Shapes, t: 'familias' },
  { to: '/materiais', nome: 'Materiais', desc: 'Matérias-primas, preços e estoque', icon: Layers, t: 'materiais' },
  { to: '/curvas', nome: 'Curvas de queima', desc: 'Rampas, patamares e gráfico', icon: Flame, t: 'curvas' },
  { to: '/engenharia-reversa', nome: 'Engenharia reversa', desc: 'Esmaltes comerciais estudados', icon: SearchCode, t: 'comerciais' },
  { to: '/compras', nome: 'Compras', desc: 'Lista planejada e fornecedores', icon: ShoppingBag, t: 'compras' },
  { to: '/calculadoras', nome: 'Calculadoras', desc: 'Ferramentas de bancada', icon: Calculator },
] as const

export default function Laboratorio() {
  const n = useLiveQuery(async () => Object.fromEntries(await Promise.all(ITENS.filter((i) => 't' in i).map(async (i) => [i.to, await vivos((i as { t: string }).t)]))), [], {} as Record<string, number>)
  return (
    <div className="page">
      <h1>Laboratório</h1>
      <div className="areas" style={{ marginTop: 28 }}>
        {ITENS.map(({ to, nome, desc, icon: I }) => (
          <Link key={to} to={to} className="area">
            <I className="art" size={34} strokeWidth={1.1} style={{ width: 34 }} />
            <h3>{nome}</h3><p>{n[to] != null ? `${n[to]} · ` : ''}{desc}</p>
            <ArrowRight className="arrow" size={18} strokeWidth={1.4} />
          </Link>
        ))}
      </div>
      <Link to="/biblioteca/bib-seguranca" className="aviso forte" style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 24 }}>
        <ShieldAlert size={18} strokeWidth={1.5} style={{ flexShrink: 0 }} />
        <span>Segurança do laboratório: pó de sílica, óxidos, conservantes e descarte. Nenhum esmalte é considerado seguro para alimentos sem teste de lixiviação.</span>
      </Link>
    </div>
  )
}
