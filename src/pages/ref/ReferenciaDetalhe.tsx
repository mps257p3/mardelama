import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, ExternalLink, Heart, Images, Pencil, Trash2, LayoutDashboard, ScanSearch, Sparkles } from 'lucide-react'
import { Catalogar } from './Catalogar'
import { db, uid } from '../../db/schema'
import { alternarFavorito, excluir, useGrupos, usePaineis } from '../../db/hooks'
import { Foto } from '../../ui/form'
import { ImgRef } from './ImgRef'
import { Relacoes } from '../../ui/Relacoes'
import { Sheet } from '../../ui/Sheet'
import { useToast } from '../../ui/toast'

export default function ReferenciaDetalhe() {
  const { id } = useParams()
  const nav = useNavigate()
  const toast = useToast()
  const r = useLiveQuery(() => db.referencias.get(id!), [id])
  const grupos = useGrupos()
  const paineis = usePaineis()
  const [foto, setFoto] = useState(0)
  const [aoPainel, setAoPainel] = useState(false)
  const [catalogar, setCatalogar] = useState(false)
  if (r === undefined) return null
  if (!r || r.excluido) return <div className="page"><p>Referência não encontrada.</p></div>
  const gs = grupos.filter((g) => r.grupos.includes(g.id))

  return (
    <div className="page">
      <Link to="/referencias/acervo" className="back"><ArrowLeft size={15} />Referências</Link>
      <div className="detalhe">
        <div>
          <div className="capa" style={{ aspectRatio: 'auto', minHeight: 240 }}>{r.imagens[foto] ? <Foto id={r.imagens[foto]} alt={r.titulo} style={{ height: 'auto', maxHeight: '78vh', objectFit: 'contain' }} /> : r.imagemExterna ? <ImgRef r={r} style={{ height: 'auto', maxHeight: '78vh', objectFit: 'contain' }} /> : <Images size={44} strokeWidth={1} />}</div>
          {r.imagens.length > 1 && <div className="thumbs">{r.imagens.map((f, i) => <button key={f} className={i === foto ? 'on' : ''} onClick={() => setFoto(i)}><Foto id={f} /></button>)}</div>}
        </div>
        <div>
          <p className="eyebrow">{r.tipo}</p>
          <h1 style={{ marginTop: 8 }}>{r.titulo}</h1>
          {r.autor && <p className="serif" style={{ fontSize: 22, marginTop: 6, fontStyle: 'italic' }}>{r.autor}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
            <Link className="btn sm primary" to={`/referencias/${r.id}/editar`}><Pencil size={14} />Editar</Link>
            <button className="btn sm" onClick={() => alternarFavorito('referencias', r.id, r.favorito)}><Heart size={14} fill={r.favorito ? 'currentColor' : 'none'} />{r.favorito ? 'Favorita' : 'Favoritar'}</button>
            {(r.imagens.length > 0 || r.imagemExterna) && <button className="btn sm" onClick={() => setCatalogar(true)}><Sparkles size={14} />Sugerir catalogação</button>}
            <button className="btn sm" onClick={() => setAoPainel(true)}><LayoutDashboard size={14} />Levar a um painel</button>
            <Link className="btn sm" to={`/referencias/descobrir?ref=${r.id}`}><ScanSearch size={14} />Ver semelhantes</Link>
            {r.url && <a className="btn sm" href={r.url} target="_blank" rel="noreferrer"><ExternalLink size={14} />Abrir link</a>}
            <button className="btn sm ghost" onClick={async () => { if (confirm('Excluir esta referência?')) { await excluir('referencias', r.id); nav('/referencias/acervo') } }}><Trash2 size={14} />Excluir</button>
          </div>
          {gs.length > 0 && <div className="chips" style={{ flexWrap: 'wrap', marginTop: 22 }}>{gs.map((g) => <span key={g.id} className="chip">{g.nome}</span>)}</div>}
          {r.paleta?.length ? <div className="paleta" style={{ marginTop: 22, height: 40 }}>{r.paleta.map((c) => <span key={c} style={{ background: c }} title={c} />)}</div> : null}
          {r.descricao && <p style={{ marginTop: 22, whiteSpace: 'pre-wrap' }}>{r.descricao}</p>}
          {r.comentarios && <><p className="eyebrow" style={{ marginTop: 22 }}>Comentários pessoais</p><p className="muted" style={{ whiteSpace: 'pre-wrap', marginTop: 6 }}>{r.comentarios}</p></>}
          {r.fonte && <p className="faint" style={{ marginTop: 16, fontSize: 13 }}>Fonte: {r.fonte}{r.licenca ? ' · ' + r.licenca : ''}</p>}
          {r.tags.length > 0 && <div className="pills" style={{ marginTop: 14 }}>{r.tags.map((t) => <span key={t} className="chip">#{t}</span>)}</div>}
          <div style={{ marginTop: 32 }}><Relacoes tipo="referencia" id={r.id} /></div>
        </div>
      </div>
      {catalogar && <Catalogar r={r} onClose={() => setCatalogar(false)} />}
      {aoPainel && <Sheet label="Levar a um painel" onClose={() => setAoPainel(false)}>
        <h3>Levar a um painel</h3>
        <div className="lista" style={{ marginTop: 14 }}>
          {(paineis ?? []).map((p) => (
            <button key={p.id} className="row" style={{ gridTemplateColumns: '1fr auto', background: 'none', border: 0, borderBottom: '1px solid var(--line)', width: '100%', textAlign: 'left' }} onClick={async () => {
              const z = Math.max(0, ...p.itens.map((i) => i.z)) + 1
              await db.paineis.update(p.id, { itens: [...p.itens, { id: uid(), tipo: 'referencia', refId: r.id, x: 80 + (z % 6) * 40, y: 80 + (z % 6) * 30, w: 320, h: 380, z }], atualizadoEm: Date.now() })
              setAoPainel(false); toast(`Adicionada a "${p.nome}"`)
            }}><span className="t" style={{ fontSize: 18 }}>{p.nome}</span><span className="faint">{p.itens.length} itens</span></button>
          ))}
          {!paineis?.length && <p className="faint">Nenhum painel ainda. <Link to="/paineis" style={{ textDecoration: 'underline' }}>Criar um painel</Link>.</p>}
        </div>
      </Sheet>}
    </div>
  )
}
