import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CapaArea } from '../../ui/FotoEditavel'
import { CabecalhoPagina } from '../../ui/Pagina'

export const BASE2 = '/referencias-2'
export type Aba2 = 'descobrir' | 'acervo' | 'colecoes' | 'paineis'
const ABAS: [Aba2, string][] = [['descobrir', 'Descobrir'], ['acervo', 'Acervo'], ['colecoes', 'Coleções'], ['paineis', 'Painéis']]

/**
 * Cabeçalho de Referências 2: título com ícones, capa (só no Descobrir, como na versão atual),
 * as quatro abas e, abaixo delas, a busca da aba. A capa tem foto própria (troca pelo botãozinho nela).
 */
export function Topo2({ aba, icones, capa, children }: { aba: Aba2; icones?: ReactNode; capa?: boolean; children?: ReactNode }) {
  return <div className="ref2-topo">
    <CabecalhoPagina titulo="Referências 2">{icones}</CabecalhoPagina>
    {capa && <CapaArea slug="referencias2" nome="Referências 2" className="ref2-capa" />}
    <nav className="abas-t ref2-abas">
      {ABAS.map(([k, l]) => <Link key={k} to={`${BASE2}/${k}`} replace className={aba === k ? 'on' : ''}>{l}</Link>)}
    </nav>
    {children}
  </div>
}
