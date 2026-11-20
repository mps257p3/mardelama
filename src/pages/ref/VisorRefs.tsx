import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ExternalLink, FileText, FolderPlus, Heart, Info, LayoutDashboard, ScanSearch, X } from 'lucide-react'
import type { Referencia } from '../../db/schema'
import { alternarFavorito, useGrupos } from '../../db/hooks'
import { ImgRef, temImagem } from './ImgRef'
import { EscolherGrupos, EscolherPainel } from './acoesRefs'
import { ehSalvoInstagram } from '../../lib/instagram'

/** Tela cheia do Acervo: imagem protagonista, metadados sob demanda, deslizar para navegar. */
export function VisorRefs({ lista, inicio, onClose }: { lista: Referencia[]; inicio: number; onClose: () => void }) {
  const [i, setI] = useState(inicio)
  const [info, setInfo] = useState(false)
  const [acao, setAcao] = useState<'grupos' | 'painel'>()
  const grupos = useGrupos()
  const toque = useRef<{ x: number; y: number } | undefined>(undefined)
  const n = lista.length
  const r = lista[Math.min(i, n - 1)]
  const ir = (d: number) => setI((x) => (x + d + n) % n)
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (acao) return; if (e.key === 'Escape') onClose(); if (e.key === 'ArrowLeft') ir(-1); if (e.key === 'ArrowRight') ir(1) }
    window.addEventListener('keydown', k)
    const o = document.body.style.overflow; document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = o }
  })
  if (!r) return null
  const gs = grupos.filter((g) => r.grupos.includes(g.id))
  return createPortal(
    <div className="visor visor-ref" role="dialog" aria-label={r.titulo}
      onTouchStart={(e) => { toque.current = { x: e.touches[0].clientX, y: e.touches[0].clientY } }}
      onTouchEnd={(e) => {
        const t = toque.current; toque.current = undefined; if (!t) return
        const dx = e.changedTouches[0].clientX - t.x, dy = e.changedTouches[0].clientY - t.y
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) && n > 1) ir(dx < 0 ? 1 : -1)
        else if (dy > 90 && Math.abs(dy) > Math.abs(dx) && !info) onClose()
        else if (dy < -60 && Math.abs(dy) > Math.abs(dx)) setInfo(true)
      }}>
      <div className="visor-topo">
        <span>{n > 1 ? `${i + 1} / ${n}` : ''}</span>
        <button className="visor-btn" aria-label="Fechar" onClick={onClose}><X size={20} /></button>
      </div>
      <div className="visor-img" onClick={() => setInfo(!info)}>
        {temImagem(r) ? <ImgRef key={r.id} r={r} style={{ objectFit: 'contain' }} />
          : r.paleta?.length ? <div className="paleta" style={{ width: '80%', height: 160 }}>{r.paleta.map((c) => <span key={c} style={{ background: c }} />)}</div>
          : ehSalvoInstagram(r) ? <div className="visor-ig" onClick={(e) => e.stopPropagation()}>
              {r.autor && <p className="ig-user">{r.autor}</p>}
              <p className="serif ig-legenda">{(r.descricao ?? r.titulo).slice(0, 420)}{(r.descricao ?? '').length > 420 ? '…' : ''}</p>
              {r.url && <a className="btn sm" href={r.url} target="_blank" rel="noreferrer"><ExternalLink size={14} />Abrir no Instagram</a>}
              <p className="ig-nota">A exportação do Instagram não traz a imagem. Para vê-la aqui, abra a ficha › Editar e adicione um print.</p>
            </div>
          : <p className="serif" style={{ fontSize: 26, textAlign: 'center' }}>{r.titulo}</p>}
      </div>
      <div className="visor-acoes">
        <button className="visor-btn" aria-label={r.favorito ? 'Desfavoritar' : 'Favoritar'} onClick={() => alternarFavorito('referencias', r.id, r.favorito)}><Heart size={19} fill={r.favorito ? 'currentColor' : 'none'} /></button>
        <button className="visor-btn" aria-label="Grupos" onClick={() => setAcao('grupos')}><FolderPlus size={19} /></button>
        <button className="visor-btn" aria-label="Levar a um painel" onClick={() => setAcao('painel')}><LayoutDashboard size={19} /></button>
        <Link className="visor-btn" aria-label="Ver semelhantes no Descobrir" title="Ver semelhantes" to={`/referencias/descobrir?ref=${r.id}`}><ScanSearch size={19} /></Link>
        {r.url && <a className="visor-btn" aria-label="Fonte original" href={r.url} target="_blank" rel="noreferrer"><ExternalLink size={18} /></a>}
        <button className={'visor-btn' + (info ? ' on' : '')} aria-label="Informações" onClick={() => setInfo(!info)}><Info size={19} /></button>
      </div>
      {info && <div className="visor-info">
        <p className="eyebrow" style={{ color: 'rgba(245,240,232,.6)' }}>{[r.tipo, new Date(r.criadoEm).toLocaleDateString('pt-BR')].filter(Boolean).join(' · ')}</p>
        {!/^(whatsapp image|img[_ -]?\d|screenshot|captura de tela|pxl_|dsc_?\d)/i.test(r.titulo) && <h2 className="serif">{r.titulo}</h2>}
        {r.autor && <p className="serif" style={{ fontStyle: 'italic', fontSize: 18 }}>{r.autor}</p>}
        {r.descricao && <p className="desc">{r.descricao}</p>}
        {gs.length > 0 && <p className="meta">{gs.map((g) => g.nome).join(' · ')}</p>}
        {r.tags.length > 0 && <p className="meta">{r.tags.map((t) => '#' + t).join('  ')}</p>}
        {r.paleta?.length ? <div className="paleta" style={{ height: 22, marginTop: 10 }}>{r.paleta.map((c) => <span key={c} style={{ background: c }} />)}</div> : null}
        {r.fonte && <p className="meta">Fonte: {r.fonte}{r.licenca ? ' · ' + r.licenca : ''}</p>}
        <Link to={`/referencias/${r.id}`} className="visor-ficha"><FileText size={15} />Ficha completa e edição</Link>
      </div>}
      {n > 1 && <>
        <button className="visor-btn visor-ant" aria-label="Anterior" onClick={() => ir(-1)}><ChevronLeft size={24} /></button>
        <button className="visor-btn visor-prox" aria-label="Próxima" onClick={() => ir(1)}><ChevronRight size={24} /></button>
      </>}
      {acao === 'grupos' && <EscolherGrupos ids={[r.id]} onClose={() => setAcao(undefined)} />}
      {acao === 'painel' && <EscolherPainel ids={[r.id]} onClose={() => setAcao(undefined)} />}
    </div>, document.body)
}
