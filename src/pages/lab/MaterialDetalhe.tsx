import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, ExternalLink, FileText, Heart, Layers, Pencil, Trash2 } from 'lucide-react'
import { db } from '../../db/schema'
import { alternarFavorito, excluir, useReceitas } from '../../db/hooks'
import { useArquivoUrl } from '../../db/files'
import { brl, fmt } from '../../lib/opcoes'
import { Foto } from '../../ui/form'
import { Relacoes } from '../../ui/Relacoes'

function Doc({ id, rotulo }: { id?: string; rotulo: string }) {
  const url = useArquivoUrl(id)
  const arq = useLiveQuery(() => (id ? db.arquivos.get(id) : undefined), [id])
  if (!id || !url) return null
  return <a className="btn sm" href={url} target="_blank" rel="noreferrer" download={arq?.nome}><FileText size={14} />{rotulo}</a>
}

export default function MaterialDetalhe() {
  const { id } = useParams()
  const nav = useNavigate()
  const m = useLiveQuery(() => db.materiais.get(id!), [id])
  const receitas = useReceitas()
  if (m === undefined) return null
  if (!m || m.excluido) return <div className="page"><p>Material não encontrado.</p></div>
  const usadas = (receitas ?? []).filter((r) => r.ingredientes.some((i) => i.materialId === m.id || (!i.materialId && i.nome.trim().toLowerCase() === m.nome.toLowerCase())))
  const ficha: [string, string | undefined][] = [
    ['Categoria', m.categoria], ['Fabricante', m.fabricante], ['Fornecedor', m.fornecedor], ['Função', m.funcao],
    ['Preço', m.precoKg != null ? brl(m.precoKg) + ' / kg' : undefined], ['Em estoque', m.estoqueKg != null ? fmt(m.estoqueKg, 2) + ' kg' : undefined],
    ['Características', m.caracteristicas],
  ]
  return (
    <div className="page">
      <Link to="/materiais" className="back"><ArrowLeft size={15} />Materiais</Link>
      <div className="detalhe">
        <div className="capa">{m.fotos[0] ? <Foto id={m.fotos[0]} /> : <Layers size={44} strokeWidth={1} />}</div>
        <div>
          <p className="eyebrow">{m.categoria}</p>
          <h1 style={{ marginTop: 8 }}>{m.nome}</h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
            <Link className="btn sm primary" to={`/materiais/${m.id}/editar`}><Pencil size={14} />Editar</Link>
            <button className="btn sm" onClick={() => alternarFavorito('materiais', m.id, m.favorito)}><Heart size={14} fill={m.favorito ? 'currentColor' : 'none'} />{m.favorito ? 'Favorito' : 'Favoritar'}</button>
            <Doc id={m.fichaTecnica} rotulo="Ficha técnica" /><Doc id={m.fichaSeguranca} rotulo="Ficha de segurança" />
            {m.linkCompra && <a className="btn sm" href={m.linkCompra} target="_blank" rel="noreferrer"><ExternalLink size={14} />Comprar</a>}
            <button className="btn sm ghost" onClick={async () => { if (confirm('Excluir este material?')) { await excluir('materiais', m.id); nav('/materiais') } }}><Trash2 size={14} />Excluir</button>
          </div>
          <dl className="ficha" style={{ marginTop: 24 }}>{ficha.filter(([, v]) => v).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
          {m.composicao && <><h3 style={{ marginTop: 24 }}>Composição química</h3><p className="muted" style={{ whiteSpace: 'pre-wrap', marginTop: 6 }}>{m.composicao}</p></>}
          {m.observacoes && <><h3 style={{ marginTop: 24 }}>Observações</h3><p className="muted" style={{ whiteSpace: 'pre-wrap', marginTop: 6 }}>{m.observacoes}</p></>}
          <h3 style={{ marginTop: 32 }}>Usado em {usadas.length} {usadas.length === 1 ? 'receita' : 'receitas'}</h3>
          <div className="lista" style={{ marginTop: 8 }}>
            {usadas.map((r) => { const i = r.ingredientes.find((x) => x.materialId === m.id || x.nome.trim().toLowerCase() === m.nome.toLowerCase())!
              return <Link key={r.id} to={`/receitas/${r.id}`} style={{ gridTemplateColumns: '1fr auto' }}><span className="t" style={{ fontSize: 18 }}>{r.nome}</span><span className="faint">{fmt(i.percentual, 2)}%</span></Link> })}
          </div>
          <div style={{ marginTop: 32 }}><Relacoes tipo="material" id={m.id} /></div>
        </div>
      </div>
    </div>
  )
}
