import { conferirRolagem } from './rolagem'
import { useMemoriaRolagem } from './memoriaRolagem'
import { pularEntradasOrfas } from './voltarFecha'
import { Suspense, useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Home, FlaskConical, Images, BookOpen, Plus, RefreshCw } from 'lucide-react'
import { LATERAL, RODAPE } from './nav'
import { Monograma } from './Monograma'
import { QuickAdd } from './QuickAdd'
import { definirContexto, emFluxoDeCadastro } from '../lib/contexto'
import { progressoSync } from '../db/sync'
import { trocouDeTela } from '../lib/atualizacao'
import { ErroTela } from './ErroTela'
import { buscarVersaoNova } from '../lib/versaoNova'

const AREA_DA_ROTA: [RegExp, string][] = [
  [/^\/(superficies|esmaltes|receitas|testes|testoteca|laboratorio|queimas|bancada|familias|curvas|engenharia-reversa|compras)/, 'esmaltes'],
  [/^\/materiais/, 'materiais'], [/^\/(referencias|paineis|compartilhar|cores)/, 'referencias'],
  [/^\/obras/, 'obras'], [/^\/biblioteca/, 'biblioteca'], [/^\/(caderno|projetos|entrada)/, 'caderno'], [/^\/calculadoras/, 'calculadoras'],
]

export function Layout() {
  const [add, setAdd] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => { if (!emFluxoDeCadastro(pathname)) definirContexto(undefined) }, [pathname])
  useEffect(() => { trocouDeTela(); const t = window.setTimeout(conferirRolagem, 400); return () => window.clearTimeout(t) }, [pathname])
  useEffect(() => pularEntradasOrfas(), [])
  useMemoriaRolagem()
  const area = AREA_DA_ROTA.find(([r]) => r.test(pathname))?.[1]
  return (
    <div className="app">
      <aside className="side" aria-label="Navegação" style={area ? { ['--area' as string]: `var(--c-${area})` } : undefined}>
        <NavLink to="/" className="brand" style={{ background: 'none' }}>
          <Monograma altura={40} />
          <span>Mar de<br />Lama</span>
        </NavLink>
        {LATERAL.map((x) => { const { to, nome, icon: I } = x; return (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => (isActive || (to === '/laboratorio' && /^\/(esmaltes|receitas|testes|ideias|familias|curvas|engenharia-reversa|compras)(\/|$)/.test(pathname))) ? 'active' : ''}><I size={18} strokeWidth={1.4} />{nome}</NavLink>
        ) })}
        <div className="sep" />
        <button className="navbtn" onClick={() => setAdd(true)}><Plus size={18} strokeWidth={1.4} />Novo</button>
        <div className="grow" />
        {RODAPE.map(({ to, nome, icon: I }) => (
          <NavLink key={to} to={to}><I size={18} strokeWidth={1.4} />{nome}</NavLink>
        ))}
      </aside>

      <main className="main" style={area ? { ['--area' as string]: `var(--c-${area})` } : undefined}>
        <ErroTela chave={pathname}><Suspense fallback={<div className="carregando-tela" aria-busy="true" />}><Outlet /></Suspense></ErroTela>
        <ProgressoSync />
        <RodapeVersao />
      </main>

      <nav className="bottom" aria-label="Navegação principal">
        <NavLink to="/" end><Home size={22} strokeWidth={1.4} />Início</NavLink>
        <NavLink to="/laboratorio" className={({ isActive }) => (isActive || area === 'esmaltes' || area === 'materiais' || area === 'calculadoras') ? 'active' : ''}><FlaskConical size={22} strokeWidth={1.4} />Esmaltaria</NavLink>
        <BotaoObras onSegurar={() => setAdd(true)} />
        <NavLink to="/referencias/descobrir" className={({ isActive }) => (isActive || area === 'referencias') ? 'active' : ''}><Images size={22} strokeWidth={1.4} />Referências</NavLink>
        <NavLink to="/biblioteca"><BookOpen size={22} strokeWidth={1.4} />Biblioteca</NavLink>
      </nav>

      {add && <QuickAdd onClose={() => setAdd(false)} />}
    </div>
  )
}

/** Botão central: toque leva a Minhas obras; segurar abre o "Adicionar" rápido. */
function BotaoObras({ onSegurar }: { onSegurar: () => void }) {
  const t = useRef<number | undefined>(undefined)
  const segurou = useRef(false)
  const parar = () => { clearTimeout(t.current); t.current = undefined }
  return (
    <NavLink to="/obras" className={({ isActive }) => 'plus obras-btn' + (isActive ? ' on' : '')} aria-label="Minhas obras (segure para adicionar)"
      onTouchStart={() => { segurou.current = false; parar(); t.current = window.setTimeout(() => { segurou.current = true; navigator.vibrate?.(10); onSegurar() }, 500) }}
      onTouchMove={parar} onTouchEnd={(e) => { parar(); if (segurou.current) e.preventDefault() }} onTouchCancel={parar}
      onContextMenu={(e) => { e.preventDefault(); onSegurar() }}
      onClick={(e) => { if (segurou.current) { e.preventDefault(); segurou.current = false } }}>
      <img src="/brand/botao-obras.png" alt="" width={56} height={56} draggable={false} />
    </NavLink>
  )
}

/** Aviso discreto enquanto a sincronização roda, visível em qualquer tela. */
function ProgressoSync() {
  const [t, setT] = useState<string | undefined>(progressoSync())
  useEffect(() => { const f = (e: Event) => setT((e as CustomEvent<string | undefined>).detail); window.addEventListener('sync-progresso', f); return () => window.removeEventListener('sync-progresso', f) }, [])
  if (!t) return null
  return <div className="sync-pill" role="status"><RefreshCw size={13} className="gira" />{t}</div>
}

/** Versão no rodapé. Tocar busca na hora se há versão nova publicada. */
function RodapeVersao() {
  const [estado, setEstado] = useState<'' | 'buscando' | 'atual' | 'offline' | 'nova'>('')
  const data = new Date(__VERSAO__).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
  const msg = { '': '', buscando: 'Buscando versão nova…', nova: 'Versão nova encontrada. Recarregando…', atual: 'Você já está na versão mais recente. Se acabou de aprovar uma mudança, a publicação leva uns 2 minutos: toque de novo depois.', offline: 'Sem internet agora. Tente de novo quando estiver conectado.' }[estado]
  return (
    <footer className="versao">
      <button className="versao-b" disabled={estado === 'buscando' || estado === 'nova'} onClick={async () => { setEstado('buscando'); setEstado(await buscarVersaoNova().catch(() => 'atual' as const)) }}>
        <RefreshCw size={12} strokeWidth={1.6} className={estado === 'buscando' ? 'gira' : undefined} aria-hidden />Versão de {data} · buscar atualização
      </button>
      {msg && <p className="versao-msg" role="status">{msg}</p>}
    </footer>
  )
}
