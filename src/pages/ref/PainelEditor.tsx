import { Voltar } from '../../ui/Voltar'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowUpToLine, ImagePlus, Images, Palette, Trash2, Type } from 'lucide-react'
import { db, uid, type ItemPainel, type Painel } from '../../db/schema'
import { excluir, useReferencias } from '../../db/hooks'
import { salvarArquivo } from '../../db/files'
import { Foto } from '../../ui/form'
import { ImgRef, temImagem } from './ImgRef'
import { Sheet } from '../../ui/Sheet'

const LARG = 1600, ALT = 1100

function RefImg({ refId }: { refId?: string }) {
  const r = useLiveQuery(() => (refId ? db.referencias.get(refId) : undefined), [refId])
  if (!r) return null
  return temImagem(r) ? <ImgRef r={r} /> : <div className="txt" style={{ background: 'var(--surface-2)' }}>{r.titulo}</div>
}

export default function PainelEditor({ voltar = '/paineis', refs: baseRefs = '/referencias' }: { voltar?: string; refs?: string }) {
  const { id } = useParams()
  const nav = useNavigate()
  const original = useLiveQuery(() => db.paineis.get(id!), [id])
  const refs = useReferencias()
  const [p, setP] = useState<Painel>()
  const [sel, setSel] = useState<string>()
  const [escala, setEscala] = useState(0.5)
  const [sheet, setSheet] = useState<'ref' | 'texto' | undefined>()
  const [texto, setTexto] = useState('')
  const wrap = useRef<HTMLDivElement>(null)
  const arq = useRef<HTMLInputElement>(null)
  const sujo = useRef(false)

  useEffect(() => { if (original && !p) setP(original) }, [original, p])
  useLayoutEffect(() => {
    const el = wrap.current; if (!el) return
    const ro = new ResizeObserver(() => setEscala(el.clientWidth / LARG)); ro.observe(el); return () => ro.disconnect()
  }, [p?.id])
  useEffect(() => {
    if (!p || !sujo.current) return
    const h = setTimeout(() => { db.paineis.put({ ...p, atualizadoEm: Date.now() }); sujo.current = false }, 500)
    return () => clearTimeout(h)
  }, [p])

  if (original === undefined || !p) return null
  if (!original || original.excluido) return <div className="page"><p>Painel não encontrado.</p></div>

  const mudar = (itens: ItemPainel[], extra: Partial<Painel> = {}) => { sujo.current = true; setP({ ...p, ...extra, itens }) }
  const atualizar = (iid: string, d: Partial<ItemPainel>) => mudar(p.itens.map((i) => (i.id === iid ? { ...i, ...d } : i)))
  const topo = () => Math.max(0, ...p.itens.map((i) => i.z)) + 1
  const adicionar = (i: Omit<ItemPainel, 'id' | 'z' | 'x' | 'y'> & Partial<Pick<ItemPainel, 'x' | 'y'>>) => {
    const n = p.itens.length
    const item = { id: uid(), z: topo(), x: 120 + (n % 8) * 50, y: 100 + (n % 8) * 40, ...i } as ItemPainel
    mudar([...p.itens, item]); setSel(item.id)
  }

  function arrastar(e: React.PointerEvent, item: ItemPainel, modo: 'mover' | 'redimensionar') {
    e.stopPropagation(); e.preventDefault()
    setSel(item.id)
    const x0 = e.clientX, y0 = e.clientY, ini = { ...item }
    if (item.z < topo() - 1) atualizar(item.id, { z: topo() })
    const mover = (ev: PointerEvent) => {
      const dx = (ev.clientX - x0) / escala, dy = (ev.clientY - y0) / escala
      setP((cur) => cur && { ...cur, itens: cur.itens.map((i) => i.id !== item.id ? i : modo === 'mover'
        ? { ...i, x: Math.round(Math.min(LARG - 40, Math.max(-i.w + 40, ini.x + dx))), y: Math.round(Math.min(ALT - 40, Math.max(-i.h + 40, ini.y + dy))) }
        : { ...i, w: Math.round(Math.max(60, ini.w + dx)), h: Math.round(Math.max(40, ini.h + dy)) }) })
    }
    const soltar = () => { sujo.current = true; setP((cur) => cur && { ...cur }); window.removeEventListener('pointermove', mover); window.removeEventListener('pointerup', soltar) }
    window.addEventListener('pointermove', mover); window.addEventListener('pointerup', soltar)
  }

  const selecionado = p.itens.find((i) => i.id === sel)

  return (
    <div className="page" style={{ maxWidth: 1400 }}>
      <Voltar to={voltar}>Painéis</Voltar>
      <input className="serif" value={p.nome} onChange={(e) => mudar(p.itens, { nome: e.target.value })}
        style={{ fontSize: 'clamp(32px,4vw,44px)', border: 0, background: 'none', width: '100%', padding: 0, outline: 'none', color: 'var(--ink)' }} />
      <div className="toolbar">
        <button className="btn sm" onClick={() => setSheet('ref')}><Images size={14} />Referência</button>
        <button className="btn sm" onClick={() => arq.current?.click()}><ImagePlus size={14} />Imagem</button>
        <button className="btn sm" onClick={() => { setTexto(''); setSel(undefined); setSheet('texto') }}><Type size={14} />Texto</button>
        <button className="btn sm" onClick={() => adicionar({ tipo: 'cor', cor: '#B46E4B', w: 160, h: 160 })}><Palette size={14} />Cor</button>
        <input ref={arq} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) adicionar({ tipo: 'imagem', arquivoId: await salvarArquivo(f), w: 360, h: 300 }); e.target.value = '' }} />
        <span style={{ flex: 1 }} />
        {selecionado && <>
          {selecionado.tipo === 'cor' && <input type="color" value={selecionado.cor} onChange={(e) => atualizar(selecionado.id, { cor: e.target.value })} style={{ width: 38, height: 34, border: 0, background: 'none', padding: 0 }} aria-label="Cor" />}
          {selecionado.tipo === 'texto' && <button className="btn sm" onClick={() => { setTexto(selecionado.texto ?? ''); setSheet('texto') }}><Type size={14} />Editar texto</button>}
          <button className="btn sm" onClick={() => atualizar(selecionado.id, { z: topo() })}><ArrowUpToLine size={14} />Para frente</button>
          <button className="btn sm" onClick={() => { mudar(p.itens.filter((i) => i.id !== selecionado.id)); setSel(undefined) }}><Trash2 size={14} />Remover</button>
        </>}
        {!selecionado && <button className="btn sm ghost" onClick={async () => { if (confirm('Excluir este painel?')) { await excluir('paineis', p.id); nav(voltar) } }}><Trash2 size={14} />Excluir painel</button>}
      </div>

      <div ref={wrap} className="lousa-wrap" style={{ height: ALT * escala }} onPointerDown={() => setSel(undefined)}>
        <div className="lousa" style={{ width: LARG, height: ALT, transform: `scale(${escala})` }}>
          {[...p.itens].sort((a, b) => a.z - b.z).map((i) => (
            <div key={i.id} className={'item' + (sel === i.id ? ' sel' : '')} style={{ left: i.x, top: i.y, width: i.w, height: i.h, zIndex: i.z, background: i.tipo === 'cor' ? i.cor : undefined }}
              onPointerDown={(e) => arrastar(e, i, 'mover')}
              onDoubleClick={() => { if (i.tipo === 'texto') { setTexto(i.texto ?? ''); setSel(i.id); setSheet('texto') } else if (i.tipo === 'referencia') nav(`${baseRefs}/${i.refId}`) }}>
              {i.tipo === 'referencia' && <RefImg refId={i.refId} />}
              {i.tipo === 'imagem' && <Foto id={i.arquivoId} />}
              {i.tipo === 'texto' && <div className="txt">{i.texto}</div>}
              {i.tipo === 'cor' && <span style={{ position: 'absolute', left: 10, bottom: 8, fontSize: 18, color: 'rgba(255,255,255,.85)', mixBlendMode: 'difference' }}>{i.cor?.toUpperCase()}</span>}
              {sel === i.id && <div className="alca" onPointerDown={(e) => arrastar(e, i, 'redimensionar')} />}
            </div>
          ))}
        </div>
      </div>
      <p className="faint" style={{ fontSize: 12.5, marginTop: 10 }}>Arraste para mover, use o canto azul para redimensionar e toque duas vezes num texto para editar. Tudo é salvo automaticamente.</p>

      {sheet === 'ref' && <Sheet label="Adicionar referência" onClose={() => setSheet(undefined)}>
        <h3>Adicionar referência</h3>
        <div className="galeria" style={{ marginTop: 16, gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {(refs ?? []).map((r) => (
            <button key={r.id} className="peca" style={{ background: 'none', border: 0, padding: 0, textAlign: 'left' }} onClick={() => { adicionar({ tipo: 'referencia', refId: r.id, w: 320, h: 380 }); setSheet(undefined) }}>
              <div className="ph">{r.imagens[0] ? <Foto id={r.imagens[0]} /> : <Images size={22} />}</div><div className="s">{r.titulo}</div>
            </button>
          ))}
        </div>
        {!refs?.length && <p className="faint">Nenhuma referência cadastrada ainda.</p>}
      </Sheet>}
      {sheet === 'texto' && <Sheet label="Texto" onClose={() => setSheet(undefined)}>
        <h3>{selecionado?.tipo === 'texto' ? 'Editar texto' : 'Novo texto'}</h3>
        <textarea className="input" autoFocus rows={5} style={{ marginTop: 14 }} value={texto} onChange={(e) => setTexto(e.target.value)} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
          <button className="btn primary" onClick={() => {
            if (selecionado?.tipo === 'texto') atualizar(selecionado.id, { texto }); else if (texto.trim()) adicionar({ tipo: 'texto', texto, w: 420, h: 160 })
            setSheet(undefined)
          }}>Aplicar</button>
        </div>
      </Sheet>}
    </div>
  )
}
