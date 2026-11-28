import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CapaArea } from '../../ui/FotoEditavel'
import { CabecalhoPagina } from '../../ui/Pagina'

export type AbaRef = 'acervo' | 'descobrir' | 'grupos' | 'paineis'
const ABAS: [AbaRef, string, string][] = [['descobrir', 'Descobrir', '/referencias/descobrir'], ['acervo', 'Acervo', '/referencias/acervo'], ['grupos', 'Grupos', '/referencias/grupos'], ['paineis', 'Painéis', '/paineis']]

/** Cabeçalho do Repertório: título, ícones discretos, as quatro abas (Descobrir primeiro) e, abaixo delas, a busca da aba. */
export function TopoRef({ aba, icones, capa, children }: { aba: AbaRef; icones?: ReactNode; capa?: boolean; children?: ReactNode }) {
  return <>
    <CabecalhoPagina titulo="Referências">{icones}</CabecalhoPagina>
    {capa && <CapaArea slug="referencias" nome="Referências" />}
    <nav className="abas-t">
      {ABAS.map(([k, l, to]) => <Link key={k} to={to} replace className={aba === k ? 'on' : ''}>{l}</Link>)}
    </nav>
    {children}
  </>
}
