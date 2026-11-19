import { Link } from 'react-router-dom'
import { ArrowRight, FlaskConical, ScrollText, TestTube, Layers, Calculator } from 'lucide-react'

const ITENS = [
  { to: '/esmaltes', nome: 'Esmaltes', desc: 'Catálogo visual de superfícies', icon: FlaskConical },
  { to: '/receitas', nome: 'Receitas', desc: 'Formulações, versões e variações', icon: ScrollText },
  { to: '/testes', nome: 'Testes', desc: 'Placas, queimas e comparações', icon: TestTube },
  { to: '/materiais', nome: 'Materiais', desc: 'Matérias-primas e insumos', icon: Layers },
  { to: '/calculadoras', nome: 'Calculadoras', desc: 'Ferramentas de bancada', icon: Calculator },
]

export default function Laboratorio() {
  return (
    <div className="page">
      <p className="eyebrow">Laboratório</p>
      <h1 style={{ marginTop: 8 }}>Experimentação</h1>
      <div className="areas" style={{ marginTop: 28 }}>
        {ITENS.map(({ to, nome, desc, icon: I }) => (
          <Link key={to} to={to} className="area">
            <I className="art" size={34} strokeWidth={1.1} style={{ width: 34 }} />
            <h3>{nome}</h3><p>{desc}</p>
            <ArrowRight className="arrow" size={18} strokeWidth={1.4} />
          </Link>
        ))}
      </div>
    </div>
  )
}
