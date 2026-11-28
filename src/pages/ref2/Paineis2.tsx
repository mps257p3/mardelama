import { Link, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { LayoutDashboard, Plus } from 'lucide-react'
import { db, novo, type ItemPainel, type Painel } from '../../db/schema'
import { usePaineis } from '../../db/hooks'
import { Foto } from '../../ui/form'
import { ImgRef } from '../ref/ImgRef'
import { BASE2, Topo2 } from './Topo2'

const plural = (n: number) => `${n} ${n === 1 ? 'item' : 'itens'}`

function PecaRef({ refId }: { refId?: string }) {
  const r = useLiveQuery(() => (refId ? db.referencias.get(refId) : undefined), [refId])
  return r ? <ImgRef r={r} /> : null
}

/**
 * Capa que é o próprio painel em miniatura: cada item no lugar e no tamanho em que está na composição,
 * enquadrado pela área ocupada (sem sobras vazias em volta).
 */
function Miniatura({ p }: { p: Painel }) {
  const itens = p.itens
  if (!itens.length) return <div className="ref2-mini vazia"><LayoutDashboard size={28} strokeWidth={1.1} /></div>
  const x0 = Math.min(...itens.map((i) => i.x)), y0 = Math.min(...itens.map((i) => i.y))
  const x1 = Math.max(...itens.map((i) => i.x + i.w)), y1 = Math.max(...itens.map((i) => i.y + i.h))
  const W = Math.max(1, x1 - x0), H = Math.max(1, y1 - y0)
  const pos = (i: ItemPainel) => ({ left: `${((i.x - x0) / W) * 100}%`, top: `${((i.y - y0) / H) * 100}%`, width: `${(i.w / W) * 100}%`, height: `${(i.h / H) * 100}%`, zIndex: i.z })
  return <div className="ref2-mini" style={{ aspectRatio: `${Math.min(1.6, Math.max(0.7, W / H))}` }}>
    {[...itens].sort((a, b) => a.z - b.z).map((i) => <div key={i.id} className={'ref2-mini-item ' + i.tipo} style={{ ...pos(i), background: i.tipo === 'cor' ? i.cor : undefined }}>
      {i.tipo === 'referencia' && <PecaRef refId={i.refId} />}
      {i.tipo === 'imagem' && <Foto id={i.arquivoId} />}
      {i.tipo === 'texto' && <span>{i.texto}</span>}
    </div>)}
  </div>
}

/** Painéis: o mesmo editor de composição livre da versão atual; aqui muda a apresentação da lista. */
export default function Paineis2() {
  const paineis = usePaineis()
  const nav = useNavigate()
  return (
    <div className="page ref2">
      <Topo2 aba="paineis" icones={<button className="iconbtn" aria-label="Novo painel" onClick={async () => { const p = novo({ nome: 'Novo painel', itens: [] }); await db.paineis.add(p); nav(`${BASE2}/paineis/${p.id}`) }}><Plus size={19} /></button>} />
      {paineis && paineis.length === 0 ? (
        <div className="empty" style={{ marginTop: 8 }}><span className="serif">Nenhum painel ainda.</span><span>Reúna referências, imagens, textos e cores numa composição livre.</span></div>
      ) : (
        <div className="colecoes ref2-paineis">
          {[...(paineis ?? [])].sort((a, b) => b.atualizadoEm - a.atualizadoEm).map((p) => (
            <Link key={p.id} to={`${BASE2}/paineis/${p.id}`} className="colecao">
              <Miniatura p={p} />
              <div className="t">{p.nome}</div>
              <div className="s">{plural(p.itens.length)}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
