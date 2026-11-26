import { Link } from 'react-router-dom'
import { ArrowRight, FlaskConical, Lightbulb, ScrollText, Shapes, TestTube } from 'lucide-react'
import { useEsmaltes, useReceitas, useTestes } from '../../db/hooks'
import { useIdeias } from './Ideias'

/** Entrada de Superfícies: escolher para onde ir, em vez de cair direto numa lista. */
export default function SuperficiesInicio() {
  const n = { esmaltes: useEsmaltes()?.length, receitas: useReceitas()?.length, testes: useTestes()?.length, ideias: useIdeias()?.length }
  const ITENS = [
    { to: '/esmaltes', nome: 'Esmaltes', desc: 'Os esmaltes do ateliê', icon: FlaskConical, n: n.esmaltes },
    { to: '/receitas', nome: 'Fórmulas', desc: 'Receitas, versões e cálculos', icon: ScrollText, n: n.receitas },
    { to: '/testes', nome: 'Testes', desc: 'Plaquinhas, queimas e resultados', icon: TestTube, n: n.testes },
    { to: '/ideias', nome: 'Ideias', desc: 'Esmaltações que dão vontade de testar', icon: Lightbulb, n: n.ideias },
    { to: '/familias', nome: 'Famílias', desc: 'B01 a B10: bases e comportamentos', icon: Shapes },
  ]
  return (
    <div className="page">
      <h1>Superfícies</h1>
      <div className="areas" style={{ marginTop: 28 }}>
        {ITENS.map(({ to, nome, desc, icon: I, n }) => (
          <Link key={to} to={to} className="area">
            <I className="art" size={34} strokeWidth={1.1} style={{ width: 34 }} />
            <h3>{nome}</h3><p>{n != null ? `${n} · ` : ''}{desc}</p>
            <ArrowRight className="arrow" size={18} strokeWidth={1.4} />
          </Link>
        ))}
      </div>
    </div>
  )
}
