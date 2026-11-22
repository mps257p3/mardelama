import { Suspense, useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Home, FlaskConical, Images, BookOpen, Plus, RefreshCw } from 'lucide-react'
import { LATERAL, RODAPE } from './nav'
import { Monograma } from './Monograma'
import { QuickAdd } from './QuickAdd'
import { definirContexto, emFluxoDeCadastro } from '../lib/contexto'
import { progressoSync } from '../db/sync'
import { trocouDeTela } from '../lib/atualizacao'

const AREA_DA_ROTA: [RegExp, string][] = [
  [/^\/(superficies|esmaltes|receitas|testes|testoteca|laboratorio|queimas|bancada|familias|curvas|engenharia-reversa|compras)/, 'esmaltes'],
  [/^\/materiais/, 'materiais'], [/^\/(referencias|paineis|compartilhar|cores)/, 'referencias'],
  [/^\/biblioteca/, 'biblioteca'], [/^\/(caderno|projetos|entrada)/, 'caderno'], [/^\/calculadoras/, 'calculadoras'],
]

export function Layout() {
  const [add, setAdd] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => { if (!emFluxoDeCadastro(pathname)) definirContexto(undefined) }, [pathname])
  useEffect(() => { trocouDeTela() }, [pathname])
  const area = AREA_DA_ROTA.find(([r]) => r.test(pathname))?.[1]
  return (
    <div className="app">
      <aside className="side" aria-label="Navegação" style={area ? { ['--area' as string]: `var(--c-${area})` } : undefined}>
        <NavLink to="/" className="brand" style={{ background: 'none' }}>
          <Monograma altura={40} />
          <span>Mar de<br />Lama</span>
        </NavLink>
        {LATERAL.map((x) => { const { to, nome, icon: I } = x; return (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => (isActive || (to === '/superficies' && /^\/(esmaltes|receitas|testes)(\/|$)/.test(pathname))) ? 'active' : ''}><I size={18} strokeWidth={1.4} />{nome}</NavLink>
        ) })}
        <div className="sep" />
        <button className="navbtn" onClick={() => setAdd(true)}><Plus size={18} strokeWidth={1.4} />Novo</button>
        <div className="grow" />
        {RODAPE.map(({ to, nome, icon: I }) => (
          <NavLink key={to} to={to}><I size={18} strokeWidth={1.4} />{nome}</NavLink>
        ))}
      </aside>

      <main className="main" style={area ? { ['--area' as string]: `var(--c-${area})` } : undefined}>
        <Suspense fallback={<div className="carregando-tela" aria-busy="true" />}><Outlet /></Suspense>
        <ProgressoSync />
        <footer className="versao">Versão de {new Date(__VERSAO__).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}</footer>
      </main>

      <nav className="bottom" aria-label="Navegação principal">
        <NavLink to="/" end><Home size={22} strokeWidth={1.4} />Início</NavLink>
        <NavLink to="/laboratorio" className={({ isActive }) => (isActive || area === 'esmaltes' || area === 'materiais' || area === 'calculadoras') ? 'active' : ''}><FlaskConical size={22} strokeWidth={1.4} />Laboratório</NavLink>
        <button className="plus" aria-label="Novo" onClick={() => setAdd(true)}><Plus size={24} strokeWidth={1.6} /></button>
        <NavLink to="/referencias/descobrir" className={({ isActive }) => (isActive || area === 'referencias') ? 'active' : ''}><Images size={22} strokeWidth={1.4} />Referências</NavLink>
        <NavLink to="/biblioteca"><BookOpen size={22} strokeWidth={1.4} />Biblioteca</NavLink>
      </nav>

      {add && <QuickAdd onClose={() => setAdd(false)} />}
    </div>
  )
}

/** Aviso discreto enquanto a sincronização roda, visível em qualquer tela. */
function ProgressoSync() {
  const [t, setT] = useState<string | undefined>(progressoSync())
  useEffect(() => { const f = (e: Event) => setT((e as CustomEvent<string | undefined>).detail); window.addEventListener('sync-progresso', f); return () => window.removeEventListener('sync-progresso', f) }, [])
  if (!t) return null
  return <div className="sync-pill" role="status"><RefreshCw size={13} className="gira" />{t}</div>
}
