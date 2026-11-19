import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Home, FlaskConical, Images, BookOpen, Plus } from 'lucide-react'
import { LATERAL, RODAPE } from './nav'
import { Monograma } from './Monograma'
import { QuickAdd } from './QuickAdd'

export function Layout() {
  const [add, setAdd] = useState(false)
  return (
    <div className="app">
      <aside className="side" aria-label="Navegação">
        <NavLink to="/" className="brand" style={{ background: 'none' }}>
          <Monograma altura={40} />
          <span>Mar de<br />Lama</span>
        </NavLink>
        {LATERAL.map(({ to, nome, icon: I }) => (
          <NavLink key={to} to={to} end={to === '/'}><I size={18} strokeWidth={1.4} />{nome}</NavLink>
        ))}
        <div className="sep" />
        <button className="navbtn" onClick={() => setAdd(true)}><Plus size={18} strokeWidth={1.4} />Novo</button>
        <div className="grow" />
        {RODAPE.map(({ to, nome, icon: I }) => (
          <NavLink key={to} to={to}><I size={18} strokeWidth={1.4} />{nome}</NavLink>
        ))}
      </aside>

      <main className="main">
        <Outlet />
        <footer className="versao">Versão de {new Date(__VERSAO__).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}</footer>
      </main>

      <nav className="bottom" aria-label="Navegação principal">
        <NavLink to="/" end><Home size={22} strokeWidth={1.4} />Início</NavLink>
        <NavLink to="/laboratorio"><FlaskConical size={22} strokeWidth={1.4} />Laboratório</NavLink>
        <button className="plus" aria-label="Novo" onClick={() => setAdd(true)}><Plus size={24} strokeWidth={1.6} /></button>
        <NavLink to="/referencias"><Images size={22} strokeWidth={1.4} />Referências</NavLink>
        <NavLink to="/biblioteca"><BookOpen size={22} strokeWidth={1.4} />Biblioteca</NavLink>
      </nav>

      {add && <QuickAdd onClose={() => setAdd(false)} />}
    </div>
  )
}
