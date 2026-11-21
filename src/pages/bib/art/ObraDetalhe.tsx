import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, BookmarkPlus, ExternalLink, FolderPlus, Heart, Pencil, Star, Trash2 } from 'lucide-react'
import { db, type Obra } from '../../../db/schema'
import { alternarFavorito, excluir } from '../../../db/hooks'
import { salvarObraComoReferencia } from '../../../lib/artistas'
import { Relacoes } from '../../../ui/Relacoes'
import { Menu } from '../../../ui/Menu'
import { TextoEditavel } from '../../../ui/editavel'
import { Tags } from '../../../ui/form'
import { useToast } from '../../../ui/toast'
import { ImgObra } from './ImgObra'
import { fichaObra } from './VisorObras'
import { AdicionarAColecao } from './Colecoes'

/** Página de uma obra: ficha, fonte e conexões com referências, esmaltes, técnicas, testes e anotações. */
export default function ObraDetalhe() {
  const { id } = useParams()
  const nav = useNavigate()
  const toast = useToast()
  const o = useLiveQuery(() => db.obras.get(id!), [id])
  const a = useLiveQuery(() => (o ? db.artistas.get(o.artistaId) : undefined), [o?.artistaId])
  const [col, setCol] = useState(false)
  if (o === undefined) return null
  if (!o || o.excluido) return <div className="page"><p>Obra não encontrada.</p></div>
  const salvar = (p: Partial<Obra>) => db.obras.update(o.id, { ...p, atualizadoEm: Date.now() })
  return (
    <div className="page bib">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to={a ? `/biblioteca/artistas/${a.id}` : '/biblioteca/artistas'} className="back"><ArrowLeft size={15} />{a?.nome ?? 'Artistas'}</Link>
        <div style={{ display: 'flex', gap: 2 }}>
          <button className="iconbtn" aria-label="Favoritar" onClick={() => alternarFavorito('obras', o.id, o.favorito)}><Heart size={19} fill={o.favorito ? 'currentColor' : 'none'} /></button>
          <Menu itens={[
            { l: 'Editar obra', icon: <Pencil size={16} />, to: `/biblioteca/obras/${o.id}/editar` },
            { l: 'Usar como capa do artista', icon: <Star size={16} />, onClick: async () => { if (a) { await db.artistas.update(a.id, { capa: o.id, atualizadoEm: Date.now() }); toast('Capa atualizada') } } },
            { l: 'Adicionar à coleção', icon: <FolderPlus size={16} />, onClick: () => setCol(true) },
            { sep: true, l: '' },
            { l: 'Excluir obra', icon: <Trash2 size={16} />, onClick: async () => { if (confirm('Excluir esta obra?')) { await excluir('obras', o.id); nav(-1) } } },
          ]} />
        </div>
      </div>
      <div className="detalhe">
        <div><div className="capa" style={{ aspectRatio: 'auto', minHeight: 280, background: 'var(--surface-2)' }}><ImgObra o={o} style={{ objectFit: 'contain', maxHeight: '70dvh' }} /></div>
          {o.fonte && <p className="faint" style={{ fontSize: 12.5, marginTop: 8 }}>Imagem: <a href={o.fonte} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>{o.credito || 'fonte original'}</a> · uso pessoal, direitos do autor.</p>}
        </div>
        <div>
          <p className="eyebrow">{a?.nome}</p>
          <h1 style={{ marginTop: 6 }}>{o.titulo || o.serie || 'Sem título'}</h1>
          <dl className="art-ficha" style={{ marginTop: 16 }}>
            {fichaObra(o).map(([k, v]) => <div key={k} style={{ display: 'contents' }}><dt>{k}</dt><dd>{v}</dd></div>)}
            {fichaObra(o).length === 0 && <><dt>Ficha</dt><dd className="nd">Não documentada</dd></>}
          </dl>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '18px 0' }}>
            <button className="btn sm" onClick={async () => { await salvarObraComoReferencia(o, a); toast('Salva no Acervo de Referências') }}><BookmarkPlus size={14} />Salvar como referência</button>
            {o.fonte && <a className="btn sm" href={o.fonte} target="_blank" rel="noreferrer"><ExternalLink size={14} />Fonte</a>}
          </div>
          <section className="minha-pesquisa" style={{ marginTop: 8 }}>
            <p className="eyebrow">Só seu</p>
            <h4>Notas sobre esta obra</h4>
            <TextoEditavel valor={o.notas} multilinha rotulo="notas" vazio="O que estudar nesta peça?" onSalvar={(v) => salvar({ notas: v })} />
            <h4>Etiquetas</h4>
            <Tags value={o.tags} onChange={(v) => salvar({ tags: v })} />
          </section>
          <div style={{ marginTop: 24 }}><Relacoes tipo="obra" id={o.id} /></div>
          <p className="faint" style={{ fontSize: 12.5 }}>Conecte a uma referência salva, uma família de esmaltes, uma técnica da Biblioteca, um teste seu ou uma anotação. A ligação aparece dos dois lados.</p>
        </div>
      </div>
      {col && <AdicionarAColecao item={{ tipo: 'obra', id: o.id }} onClose={() => setCol(false)} />}
    </div>
  )
}
