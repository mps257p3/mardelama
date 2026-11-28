import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Bookmark, BookmarkCheck, BookOpen, Columns2, ExternalLink, Eye, EyeOff, FlaskConical, Heart, LayoutDashboard, ScanSearch, ThumbsDown, X } from 'lucide-react'
import { db } from '../../db/schema'
import type { ItemDescoberta } from '../../lib/fontes'
import { descurtir, registrar, salvarNoAcervo, UNIVERSOS, type Interacao } from '../../lib/curadoria'
import { PERFIL2, chavesDoItem, contar, ehItemPin, lerPerfil2, nomeDaFonte, salvarPerfil2 } from '../../lib/ref2'
import { ideiaDeDescobrir } from '../../lib/ideias'
import { useToast } from '../../ui/toast'
import { useFecharComVoltar } from '../../ui/voltarFecha'
import { travarRolagem } from '../../ui/rolagem'
import { EscolherGrupos, EscolherPainel } from '../ref/acoesRefs'
import { CompararObra, ExplicarObra } from '../ref/descobrirExtras'
import { BASE2 } from './Topo2'

/* Peças do feed de Referências 2, usadas pelo Descobrir e pela página de cada Tema. */

const LIMIAR = 80

/** Ações sobre as imagens do feed (curtir, salvar, ocultar...), gravadas no perfil de Referências 2. */
export function useAcoes2(setItens: Dispatch<SetStateAction<ItemDescoberta[]>>, aoSemelhantes: (item: ItemDescoberta) => void) {
  const toast = useToast()
  const [curtidos, setCurtidos] = useState<Set<string>>(new Set())
  const [grupoPara, setGrupoPara] = useState<string>()
  const salvos = useLiveQuery(async () => new Map((await db.referencias.filter((r) => !!r.origem?.startsWith('descobrir:') && !r.excluido).toArray()).map((r) => [r.origem!.slice(10), r.id])), [], new Map<string, string>())
  useEffect(() => { lerPerfil2().then((p) => setCurtidos(new Set(p.curtidos))) }, [])

  async function agir(item: ItemDescoberta, tipo: Interacao | 'ocultar' | 'mostrar') {
    const k = chavesDoItem(item)
    if (tipo === 'curtir') {
      if (curtidos.has(item.id)) { await descurtir(item, PERFIL2); setCurtidos((s) => { const n = new Set(s); n.delete(item.id); return n }); contar(k, { curtir: -1 }); return }
      await registrar(item, 'curtir', [], PERFIL2); setCurtidos((s) => new Set(s).add(item.id)); contar(k, { curtir: 1 }); return
    }
    if (tipo === 'recusar') { await registrar(item, 'recusar', [], PERFIL2); contar(k, { recusar: 1 }); setItens((xs) => xs.filter((x) => x.id !== item.id)); toast('Entendido. Menos coisas assim.'); return }
    if (tipo === 'ocultar') {
      const p = await lerPerfil2()
      p.ocultados = [...(p.ocultados ?? []).filter((x) => x !== item.id), item.id].slice(-1500)
      p.ocultadosItens = [...(p.ocultadosItens ?? []).filter((x) => x.id !== item.id), item].slice(-300)
      await salvarPerfil2(p); contar(k, { ocultar: 1 })
      setItens((xs) => xs.filter((x) => x.id !== item.id)); toast('Ocultada. Fica em Filtros › Interações › Ocultadas.'); return
    }
    if (tipo === 'mostrar') {
      const p = await lerPerfil2()
      p.ocultados = (p.ocultados ?? []).filter((x) => x !== item.id); p.ocultadosItens = (p.ocultadosItens ?? []).filter((x) => x.id !== item.id)
      await salvarPerfil2(p); setItens((xs) => xs.filter((x) => x.id !== item.id)); toast('Volta a aparecer no feed.'); return
    }
    if (tipo === 'salvar') {
      if (ehItemPin(item)) { setGrupoPara(item.pin); return }
      const ja = salvos.get(item.id)
      const ref = ja ?? await salvarNoAcervo(item)
      if (!ja) {
        await registrar(item, 'salvar', [], PERFIL2); contar(k, { salvar: 1 })
        const p = await lerPerfil2(); p.salvosItens = [...(p.salvosItens ?? []).filter((x) => x.id !== item.id), item].slice(-500); await salvarPerfil2(p)
        toast('Salvo no Acervo')
      }
      setGrupoPara(ref); return
    }
    if (tipo === 'painel') { await registrar(item, 'painel', [], PERFIL2); contar(k, { painel: 1 }); return }
    if (tipo === 'semelhantes') {
      await registrar(item, 'semelhantes', [], PERFIL2); contar(k, { semelhantes: 1 })
      aoSemelhantes(item)
    }
  }
  async function abriu(x: ItemDescoberta) {
    const p = await lerPerfil2()
    if ((p.abertos ?? []).includes(x.id)) return
    p.abertos = [...(p.abertos ?? []).slice(-1500), x.id]; await salvarPerfil2(p)
  }

  const extras = grupoPara ? <EscolherGrupos ids={[grupoPara]} onClose={() => setGrupoPara(undefined)} /> : null
  return { agir, abriu, curtidos, salvos, extras }
}

/** Mural em colunas, proporção original das imagens, só um botão discreto de salvar sobre cada uma. */
export function Mural2({ itens, salvos, ocultadas, onAbrir, onAgir }: { itens: ItemDescoberta[]; salvos: Map<string, string>; ocultadas: boolean; onAbrir: (i: number) => void; onAgir: (x: ItemDescoberta, t: 'salvar' | 'mostrar') => void }) {
  const calc = () => (window.innerWidth < 700 ? 2 : window.innerWidth >= 1300 ? 5 : window.innerWidth >= 1000 ? 4 : 3)
  const [cols, setCols] = useState(calc)
  useEffect(() => { const h = () => setCols(calc()); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h) }, [])
  const colunas = useMemo(() => { const c: { x: ItemDescoberta; i: number }[][] = Array.from({ length: cols }, () => []); itens.forEach((x, i) => c[i % cols].push({ x, i })); return c }, [itens, cols])
  return <div className="masonry ref2-mural" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
    {colunas.map((c, k) => <div key={k} className="masonry-col">{c.map(({ x, i }) => {
      const no = ehItemPin(x) || salvos.has(x.id)
      return <div key={x.id} className="tile tile-desc">
        <button className="tile-abrir" aria-label={x.titulo} onClick={() => onAbrir(i)}><img src={x.imagem} alt={x.titulo} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={(e) => { (e.currentTarget.closest('.tile') as HTMLElement).style.display = 'none' }} /></button>
        {ehItemPin(x) && <span className="ref2-origem">Pinterest</span>}
        {ocultadas
          ? <button className="ref2-salvar" aria-label="Mostrar de novo no feed" onClick={() => onAgir(x, 'mostrar')}><Eye size={14} /></button>
          : <button className={'ref2-salvar' + (no ? ' on' : '')} aria-label={no ? 'Já está no Acervo' : 'Salvar no Acervo'} onClick={() => onAgir(x, 'salvar')}>{no ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}</button>}
      </div>
    })}</div>)}
  </div>
}

/** Tela cheia: imagem protagonista e todas as ações. Gestos: → curte, ← não gostei, ↑ salva, ↓ fecha. */
export function Visor2({ itens, inicio, curtidos, salvos, onClose, onAgir, onVer }: { itens: ItemDescoberta[]; inicio: number; curtidos: Set<string>; salvos: Map<string, string>; onClose: () => void; onAgir: (x: ItemDescoberta, t: Interacao | 'ocultar') => unknown; onVer: (x: ItemDescoberta) => void }) {
  useFecharComVoltar(onClose)
  const [i, setI] = useState(inicio)
  const [acao, setAcao] = useState<{ tipo: 'grupos' | 'painel'; ref: string }>()
  const [extra, setExtra] = useState<'explicar' | 'comparar'>()
  const [pop, setPop] = useState(0)
  const toque = useRef<{ x: number; y: number } | undefined>(undefined)
  const ultimoToque = useRef(0)
  const [arrasto, setArrasto] = useState<{ dx: number; dy: number }>()
  const toast = useToast()
  const n = itens.length; const x = itens[Math.min(i, n - 1)]
  const ir = (d: number) => setI((v) => (v + d + n) % n)
  useEffect(() => { if (x) onVer(x) }, [x?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (acao || extra) return; if (e.key === 'Escape') onClose(); if (e.key === 'ArrowLeft') ir(-1); if (e.key === 'ArrowRight') ir(1) }
    window.addEventListener('keydown', k); const soltar = travarRolagem()
    return () => { window.removeEventListener('keydown', k); soltar() }
  })
  if (!x) return null
  const pin = ehItemPin(x)
  const noAcervo = pin || salvos.has(x.id)
  async function levar(tipo: 'grupos' | 'painel') {
    if (ehItemPin(x)) { if (tipo === 'painel') await onAgir(x, 'painel'); setAcao({ tipo, ref: x.pin }); return }
    const ja = salvos.get(x.id)
    const ref = ja ?? await salvarNoAcervo(x)
    if (!ja) { await onAgir(x, tipo === 'painel' ? 'painel' : 'salvar'); if (tipo === 'painel') toast('Salvo no Acervo') } else if (tipo === 'painel') await onAgir(x, 'painel')
    setAcao({ tipo, ref })
  }
  function soltar(dx: number, dy: number) {
    setArrasto(undefined)
    if (Math.abs(dx) > LIMIAR && Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) { if (!curtidos.has(x.id)) onAgir(x, 'curtir'); setPop((v) => v + 1); setTimeout(() => ir(1), 260) }
      else onAgir(x, 'recusar')
    } else if (dy < -LIMIAR && Math.abs(dy) > Math.abs(dx)) { if (!noAcervo) onAgir(x, 'salvar'); else toast('Já está no Acervo') }
    else if (dy > LIMIAR * 1.5 && Math.abs(dy) > Math.abs(dx)) onClose()
  }
  const sugerido = x.cat === 'artistas' && x.motivo?.startsWith('Artista sugerido')
  return createPortal(
    <div className="visor visor-ref" role="dialog" aria-label={x.titulo}>
      <div className="visor-topo"><span>{nomeDaFonte(x)}</span><button className="visor-btn" aria-label="Fechar" onClick={onClose}><X size={20} /></button></div>
      <div className="visor-img"
        onTouchStart={(e) => { toque.current = { x: e.touches[0].clientX, y: e.touches[0].clientY } }}
        onTouchMove={(e) => { const t = toque.current; if (t) setArrasto({ dx: e.touches[0].clientX - t.x, dy: e.touches[0].clientY - t.y }) }}
        onTouchEnd={(e) => { const t = toque.current; toque.current = undefined; if (t) soltar(e.changedTouches[0].clientX - t.x, e.changedTouches[0].clientY - t.y) }}
        onTouchCancel={() => { toque.current = undefined; setArrasto(undefined) }}
        onClick={() => { const agora = Date.now(); if (agora - ultimoToque.current < 320) { if (!curtidos.has(x.id)) onAgir(x, 'curtir'); setPop((v) => v + 1); ultimoToque.current = 0 } else ultimoToque.current = agora }}>
        <img key={x.id} src={x.imagemGrande} alt={x.titulo} referrerPolicy="no-referrer" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', transform: arrasto ? `translate(${arrasto.dx}px, ${Math.min(arrasto.dy, 0) + Math.max(arrasto.dy, 0) * .5}px) rotate(${arrasto.dx / 25}deg)` : undefined, transition: arrasto ? 'none' : 'transform .2s ease' }} onError={(e) => { if (e.currentTarget.src !== x.imagem) e.currentTarget.src = x.imagem }} />
        {pop > 0 && <Heart key={pop} size={86} className="coracao-pop" fill="currentColor" />}
      </div>
      <div className="desc-info">
        <p className="t">{x.titulo}</p>
        <p className="s">{[x.autor, x.data].filter(Boolean).join(' · ') || (pin ? '' : 'Autoria não informada pela fonte')}</p>
        <p className="l">{x.licenca}{x.universo && UNIVERSOS[x.universo] ? ' · ' + UNIVERSOS[x.universo].nome : ''}</p>
        {(x.motivo || x.consulta) && <p className="l porque">{sugerido ? x.motivo : x.motivo ?? `Apareceu pela busca “${x.consulta}”`}</p>}
      </div>
      <div className="visor-acoes desc rotulos">
        <button className={'visor-acao' + (curtidos.has(x.id) ? ' on' : '')} onClick={() => onAgir(x, 'curtir')}><span className="visor-btn"><Heart size={18} fill={curtidos.has(x.id) ? 'currentColor' : 'none'} /></span>Curtir</button>
        <button className={'visor-acao' + (noAcervo ? ' on' : '')} onClick={() => levar('grupos')}><span className="visor-btn">{noAcervo ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}</span>{noAcervo ? 'No Acervo' : 'Salvar'}</button>
        <button className="visor-acao" onClick={() => onAgir(x, 'semelhantes')}><span className="visor-btn"><ScanSearch size={18} /></span>Mais como esta</button>
        <button className="visor-acao" onClick={() => onAgir(x, 'recusar')}><span className="visor-btn"><ThumbsDown size={17} /></span>Não gostei</button>
        <button className="visor-acao" onClick={() => onAgir(x, 'ocultar')}><span className="visor-btn"><EyeOff size={18} /></span>Ocultar</button>
        <button className="visor-acao" onClick={() => setExtra('comparar')}><span className="visor-btn"><Columns2 size={18} /></span>Comparar</button>
        <button className="visor-acao" onClick={() => setExtra('explicar')}><span className="visor-btn"><BookOpen size={18} /></span>Sobre</button>
      </div>
      <div className="visor-links">
        <button onClick={() => levar('painel')}><LayoutDashboard size={13} />Levar a um painel</button>
        <button onClick={async () => { await ideiaDeDescobrir(x); toast('Guardada em Esmaltaria › Ideias') }}><FlaskConical size={13} />Ideia de esmalte</button>
        {x.link && <a href={x.link} target="_blank" rel="noreferrer"><ExternalLink size={13} />Fonte original</a>}
        {pin && <Link to={`${BASE2}/${x.pin}`} onClick={onClose}>Ficha no Acervo</Link>}
      </div>
      {extra === 'explicar' && <ExplicarObra x={x} onClose={() => setExtra(undefined)} />}
      {extra === 'comparar' && <CompararObra x={x} onClose={() => setExtra(undefined)} />}
      {n > 1 && <><button className="visor-btn visor-ant" aria-label="Anterior" onClick={() => ir(-1)}>‹</button><button className="visor-btn visor-prox" aria-label="Próxima" onClick={() => ir(1)}>›</button></>}
      {acao?.tipo === 'grupos' && <EscolherGrupos ids={[acao.ref]} onClose={() => setAcao(undefined)} />}
      {acao?.tipo === 'painel' && <EscolherPainel ids={[acao.ref]} onClose={() => setAcao(undefined)} />}
    </div>, document.body)
}
