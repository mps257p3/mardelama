import { useFecharComVoltar } from '../../../ui/voltarFecha'
import { travarRolagem } from '../../../ui/rolagem'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { BookmarkPlus, ChevronLeft, ChevronRight, ExternalLink, FolderPlus, Heart, Link2, X } from 'lucide-react'
import type { Artista, Obra } from '../../../db/schema'
import { alternarFavorito } from '../../../db/hooks'
import { salvarObraComoReferencia } from '../../../lib/artistas'
import { useToast } from '../../../ui/toast'
import { ImgObra } from './ImgObra'
import { AdicionarAColecao } from './Colecoes'
import { Zoom } from '../../../ui/Zoom'

export function fichaObra(o: Obra) {
  return ([['Ano', o.ano], ['Série', o.serie], ['Dimensões', o.dimensoes], ['Materiais', o.materiais], ['Técnica', o.tecnica], ['Esmaltação', o.esmaltacao], ['Queima', o.queima]] as const).filter(([, v]) => v) as [string, string][]
}

/** Visor das obras: ampliar, favoritar, salvar como referência e ir às conexões. */
export function VisorObras({ obras, inicio, artista, onClose }: { obras: Obra[]; inicio: number; artista?: Artista; onClose: () => void }) {
  useFecharComVoltar(onClose)
  const [i, setI] = useState(Math.max(0, inicio))
  const [info, setInfo] = useState(true)
  const [col, setCol] = useState(false)
  const [ampliado, setAmpliado] = useState(false)
  const toque = useRef<number | undefined>(undefined)
  const nav = useNavigate()
  const toast = useToast()
  const n = obras.length
  const ir = (d: number) => setI((x) => (x + d + n) % n)
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); if (e.key === 'ArrowLeft') ir(-1); if (e.key === 'ArrowRight') ir(1) }
    window.addEventListener('keydown', k)
    const soltar = travarRolagem()
    return () => { window.removeEventListener('keydown', k); soltar() }
  })
  const o = obras[Math.min(i, n - 1)]
  if (!o) return null
  return createPortal(
    <div className="visor visor-ref" role="dialog" aria-label="Obra ampliada"
      onTouchStart={(e) => { toque.current = e.touches[0].clientX }}
      onTouchEnd={(e) => { if (toque.current == null || ampliado || e.touches.length) { toque.current = undefined; return } const d = e.changedTouches[0].clientX - toque.current; toque.current = undefined; if (Math.abs(d) > 50 && n > 1) ir(d < 0 ? 1 : -1) }}>
      <div className="visor-topo">
        <span>{n > 1 ? `${i + 1} de ${n}` : ''}</span>
        <button className="visor-btn" aria-label="Fechar" onClick={onClose}><X size={20} /></button>
      </div>
      <div className="visor-img"><Zoom key={o.id} onZoom={setAmpliado} onToque={() => setInfo((v) => !v)}><ImgObra o={o} style={{ objectFit: 'contain', background: 'transparent' }} /></Zoom></div>
      {info && !ampliado && <div className="visor-info" onClick={() => setInfo(false)}>
        <p className="meta" style={{ marginTop: 0 }}>{artista?.nome}</p>
        <h2>{o.titulo || o.serie || 'Sem título'}</h2>
        <div className="meta">{fichaObra(o).map(([k, v]) => <div key={k}>{k}: {v}</div>)}</div>
        {o.notas && <p className="desc">{o.notas}</p>}
        {o.fonte && <a className="visor-ficha" href={o.fonte} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>Fonte original{o.credito ? ` · ${o.credito}` : ''} <ExternalLink size={13} /></a>}
      </div>}
      <div className="visor-acoes" style={{ position: 'relative', zIndex: 2 }}>
        <button className={'visor-btn' + (o.favorito ? ' on' : '')} aria-label="Favoritar obra" onClick={() => alternarFavorito('obras', o.id, o.favorito)}><Heart size={18} fill={o.favorito ? 'currentColor' : 'none'} /></button>
        <button className="visor-btn" aria-label="Salvar como referência" onClick={async () => { const r = await salvarObraComoReferencia(o, artista); toast('Salva no Acervo de Referências'); void r }}><BookmarkPlus size={18} /></button>
        <button className="visor-btn" aria-label="Adicionar à coleção" onClick={() => setCol(true)}><FolderPlus size={18} /></button>
        <button className="visor-btn" aria-label="Conexões e detalhes" onClick={() => { onClose(); nav(`/biblioteca/obras/${o.id}`) }}><Link2 size={18} /></button>
      </div>
      {n > 1 && <>
        <button className="visor-btn visor-ant" aria-label="Anterior" onClick={() => ir(-1)}><ChevronLeft size={24} /></button>
        <button className="visor-btn visor-prox" aria-label="Próxima" onClick={() => ir(1)}><ChevronRight size={24} /></button>
      </>}
      {col && <AdicionarAColecao item={{ tipo: 'obra', id: o.id }} onClose={() => setCol(false)} />}
    </div>, document.body)
}
