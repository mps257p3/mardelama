import { ArtistasAfins } from '../bib/art/ArtistasAfins'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { AlertTriangle, ArrowLeft, ExternalLink, FileText, Heart, Layers, Pencil, ShoppingBag, Trash2 } from 'lucide-react'
import { db } from '../../db/schema'
import { alternarFavorito, excluir, useFamilias, useReceitas, useTestes } from '../../db/hooks'
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
  const testes = useTestes()
  const familias = useFamilias()
  const compras = useLiveQuery(async () => (await db.compras.where('materialId').equals(id!).toArray()).filter((c) => !c.excluido), [id], [])
  const fornecedores = useLiveQuery(async () => (await db.fornecedores.toArray()).filter((f) => !f.excluido), [], [])
  if (m === undefined) return null
  if (!m || m.excluido) return <div className="page"><p>Material não encontrado.</p></div>
  const usadas = (receitas ?? []).filter((r) => r.ingredientes.some((i) => i.materialId === m.id || (!i.materialId && i.nome.trim().toLowerCase() === m.nome.toLowerCase())))
  const testesRel = (testes ?? []).filter((t) => usadas.some((r) => r.id === t.receitaId))
  const fams = familias.filter((f) => (m.familias ?? []).includes(f.id) || (f.materiais ?? []).includes(m.id))
  const ficha: [string, string | undefined][] = [
    ['Categoria', m.categoria], ['Nome em inglês', m.nomeEn], ['Outros nomes', m.nomesAlternativos], ['Fórmula química', m.formula],
    ['Função principal', m.funcao], ['Funções secundárias', m.funcaoSecundaria],
    ['Influência na fusão', m.fusao], ['Influência na textura', m.texturaInf], ['Influência na cor', m.corInf], ['Influência no brilho', m.brilhoInf],
    ['Fabricante', m.fabricante], ['Fornecedor', m.fornecedor], ['Lote', m.lote],
    ['Preço', m.precoKg != null ? brl(m.precoKg) + ' / kg' + (m.precoEstimado ? ' (estimado)' : '') : undefined], ['Em estoque', m.estoqueKg != null ? fmt(m.estoqueKg, 2) + ' kg' : 'Não informado'],
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
          {m.cuidados && <p className="aviso forte" style={{ marginTop: 20, display: 'flex', gap: 10 }}><AlertTriangle size={18} strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 1 }} /><span>{m.cuidados} <Link to="/biblioteca/bib-seguranca" style={{ textDecoration: 'underline' }}>Segurança do laboratório</Link></span></p>}
          {!!m.tonalidades?.length && <div style={{ marginTop: 20 }}>
            <p className="eyebrow">Paleta ilustrativa</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>{m.tonalidades.map((t) => <span key={t.nome} style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, width: 64 }}><span style={{ height: 40, borderRadius: 8, background: t.hex }} />{t.nome}</span>)}</div>
            <p className="faint" style={{ fontSize: 12, marginTop: 6 }}>Referência ilustrativa, não resultado garantido: a cor depende da base, concentração, argila, atmosfera, temperatura, espessura e resfriamento.</p>
          </div>}
          {fams.length > 0 && <div className="pills" style={{ marginTop: 16 }}>{fams.map((f) => <Link key={f.id} className="pill" to={`/familias/${f.id}`}>{f.codigo} {f.nome}</Link>)}</div>}
          <dl className="ficha" style={{ marginTop: 24 }}>{ficha.filter(([, v]) => v).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
          {m.composicao && <><h3 style={{ marginTop: 24 }}>Composição química</h3><p className="muted" style={{ whiteSpace: 'pre-wrap', marginTop: 6 }}>{m.composicao}</p></>}
          {m.observacoes && <><h3 style={{ marginTop: 24 }}>Observações</h3><p className="muted" style={{ whiteSpace: 'pre-wrap', marginTop: 6 }}>{m.observacoes}</p></>}
          <h3 style={{ marginTop: 32 }}>Usado em {usadas.length} {usadas.length === 1 ? 'receita' : 'receitas'}</h3>
          <div className="lista" style={{ marginTop: 8 }}>
            {usadas.map((r) => { const i = r.ingredientes.find((x) => x.materialId === m.id || x.nome.trim().toLowerCase() === m.nome.toLowerCase())!
              return <Link key={r.id} to={`/receitas/${r.id}`} style={{ gridTemplateColumns: '1fr auto' }}><span className="t" style={{ fontSize: 18 }}>{r.nome}</span><span className="faint">{fmt(i.percentual, 2)}%</span></Link> })}
          </div>
          {testesRel.length > 0 && <><h3 style={{ marginTop: 32 }}>Testes relacionados</h3>
            <div className="lista" style={{ marginTop: 8 }}>{testesRel.map((t) => <Link key={t.id} to={`/testes/${t.id}`} style={{ gridTemplateColumns: '1fr auto' }}><span className="t">{t.codigo}</span><span className="faint">{t.resultado ?? t.data}</span></Link>)}</div></>}
          {(compras.length > 0 || fornecedores.length > 0) && <><h3 style={{ marginTop: 32 }}>Compra e fornecedores</h3>
            {compras.map((c) => <p key={c.id} className="muted" style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}><ShoppingBag size={15} />{c.quantidade} · {c.valorEstimado != null ? brl(c.valorEstimado) + ' estimado' : 'a cotar'} · {c.status === 'planejada' ? 'compra planejada' : 'comprado'}</p>)}
            <p style={{ marginTop: 8 }}><Link to="/compras" style={{ textDecoration: 'underline', fontSize: 14 }}>Lista de compras e fornecedores</Link></p></>}
          <div style={{ marginTop: 32 }}><Relacoes tipo="material" id={m.id} /></div>
          <ArtistasAfins termos={[m.nome]} titulo="Artistas que documentam este material" />
        </div>
      </div>
    </div>
  )
}
