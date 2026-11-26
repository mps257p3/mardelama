import { useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { ExternalLink, Heart, Trash2 } from 'lucide-react'
import { alternarFavorito, excluir } from '../db/hooks'
import { Sheet } from './Sheet'
import { useToast } from './toast'

type Tabela = Parameters<typeof excluir>[0]
type ComFavorito = Parameters<typeof alternarFavorito>[0]
const FAVORITAVEIS: string[] = ['esmaltes', 'materiais', 'referencias', 'conteudos', 'testes', 'artistas', 'obras', 'exposicoes', 'entrada', 'projetos', 'ideias']

export interface OpcoesItem { tabela: Tabela; id: string; titulo: string; favorito?: 0 | 1; nome?: string }

/** Manter o dedo apertado (ou clique direito) chama onSegurar; o soltar do dedo depois não vira clique. */
export function useSegurar(onSegurar: () => void) {
  const timer = useRef<number | undefined>(undefined)
  const abriu = useRef(false)
  const pos = useRef<[number, number]>([0, 0])
  const parar = () => { clearTimeout(timer.current); timer.current = undefined }
  return {
    onTouchStart: (e: React.TouchEvent) => { abriu.current = false; pos.current = [e.touches[0].clientX, e.touches[0].clientY]; parar(); timer.current = window.setTimeout(() => { abriu.current = true; navigator.vibrate?.(10); onSegurar() }, 500) },
    onTouchMove: (e: React.TouchEvent) => { if (Math.hypot(e.touches[0].clientX - pos.current[0], e.touches[0].clientY - pos.current[1]) > 10) parar() },
    onTouchEnd: (e: React.TouchEvent) => { parar(); if (abriu.current) e.preventDefault() },
    onTouchCancel: parar,
    onContextMenu: (e: React.MouseEvent) => { e.preventDefault(); if (!abriu.current) { parar(); onSegurar() } },
    onClickCapture: (e: React.MouseEvent) => { if (abriu.current) { e.preventDefault(); e.stopPropagation(); abriu.current = false } },
  }
}

/** Folha de opções de um item: abrir, favoritar (quando a lista tem favoritos) e excluir. */
export function FolhaOpcoes({ o, to, onClose }: { o: OpcoesItem; to: string; onClose: () => void }) {
  const toast = useToast()
  const nome = o.nome ?? 'item'
  return createPortal(
    <Sheet onClose={onClose} label={o.titulo || nome}>
      <h3>{o.titulo || `Sem título`}</h3>
      <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
        <Link className="btn" to={to} onClick={onClose}><ExternalLink size={16} />Abrir</Link>
        {FAVORITAVEIS.includes(o.tabela) && <button className="btn" onClick={async () => { await alternarFavorito(o.tabela as ComFavorito, o.id, o.favorito); onClose() }}>
          <Heart size={16} fill={o.favorito ? 'currentColor' : 'none'} />{o.favorito ? 'Remover dos favoritos' : 'Favoritar'}</button>}
        <button className="btn" style={{ color: 'var(--terracota)' }} onClick={async () => {
          if (!confirm(`Excluir ${o.titulo ? `"${o.titulo}"` : `este ${nome}`}?`)) return
          await excluir(o.tabela, o.id); onClose(); toast('Excluído')
        }}><Trash2 size={16} />Excluir {nome}</button>
      </div>
    </Sheet>,
    document.body,
  )
}

/** Link de lista que, ao segurar, abre as opções do item (excluir, favoritar). */
export function LinkSegurar({ to, opcoes, className, children }: { to: string; opcoes: OpcoesItem; className?: string; children: ReactNode }) {
  const [aberto, setAberto] = useState(false)
  const props = useSegurar(() => setAberto(true))
  return <>
    <Link to={to} className={[className, 'segurar'].filter(Boolean).join(' ')} {...props}>{children}</Link>
    {aberto && <FolhaOpcoes o={opcoes} to={to} onClose={() => setAberto(false)} />}
  </>
}
