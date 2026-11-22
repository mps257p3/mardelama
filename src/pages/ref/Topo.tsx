import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export type AbaRef = 'acervo' | 'descobrir' | 'grupos' | 'paineis'
const ABAS: [AbaRef, string, string][] = [['descobrir', 'Descobrir', '/referencias/descobrir'], ['acervo', 'Acervo', '/referencias/acervo'], ['grupos', 'Grupos', '/referencias/grupos'], ['paineis', 'Painéis', '/paineis']]

/** Cabeçalho do Repertório: título, ícones discretos, as quatro abas (Descobrir primeiro) e, abaixo delas, a busca da aba. */
export function TopoRef({ aba, icones, children }: { aba: AbaRef; icones?: ReactNode; children?: ReactNode }) {
  return <>
    <div className="topo-c">
      <div><p className="eyebrow repertorio">Repertório</p><h1>Referências</h1></div>
      <div className="icones">{icones}</div>
    </div>
    <nav className="abas-t">
      {ABAS.map(([k, l, to]) => <Link key={k} to={to} replace className={aba === k ? 'on' : ''}>{l}</Link>)}
    </nav>
    {children}
  </>
}
