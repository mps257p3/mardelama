import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, Pencil, TestTube, Trash2, Heart } from 'lucide-react'
import { db } from '../../db/schema'
import { alternarFavorito, excluir, useEsmaltes } from '../../db/hooks'
import { fmt } from '../../lib/opcoes'
import { Estrelas, Foto } from '../../ui/form'
import { Relacoes } from '../../ui/Relacoes'
import { ImgRef, temImagem } from '../ref/ImgRef'

export default function TesteDetalhe() {
  const { id } = useParams()
  const nav = useNavigate()
  const t = useLiveQuery(() => db.testes.get(id!), [id])
  const ideia = useLiveQuery(async () => (t?.ideiaId ? db.ideias.get(t.ideiaId) : undefined), [t?.ideiaId])
  const esmaltes = useEsmaltes()
  const receita = useLiveQuery(async () => (t?.receitaId ? db.receitas.get(t.receitaId) : undefined), [t?.receitaId])
  const [foto, setFoto] = useState(0)
  if (t === undefined) return null
  if (!t || t.excluido) return <div className="page"><p>Teste não encontrado.</p></div>
  const e = esmaltes?.find((x) => x.id === t.esmalteId)
  const comb = (t.combinacao ?? []).map((c) => esmaltes?.find((x) => x.id === c)?.nome).filter(Boolean)
  const ficha: [string, React.ReactNode][] = [
    ['Data', t.planejado ? 'Planejado' : new Date(t.data + 'T12:00').toLocaleDateString('pt-BR')],
    ['Esmalte', e && <Link to={`/esmaltes/${e.id}`} style={{ textDecoration: 'underline' }}>{e.nome}</Link>],
    ['Receita', receita && <Link to={`/receitas/${receita.id}`} style={{ textDecoration: 'underline' }}>{receita.nome} · v{t.receitaVersao ?? '?'}</Link>],
    ['Plano', t.descricaoPlano], ['Argila', t.argila], ['Temperatura', t.temperatura ? fmt(t.temperatura, 0) + ' °C' : undefined],
    ['Cone', t.cone], ['Camadas', t.camadas], ['Aplicação', t.aplicacao], ['Densidade', t.densidade ? fmt(t.densidade, 3) + ' g/ml' : undefined],
    ['Sobreposto com', comb.join(', ')], ['Defeitos', t.defeitos?.join(', ')],
  ]
  return (
    <div className="page">
      <Link to="/testes" className="back"><ArrowLeft size={15} />Superfícies</Link>
      <div className="detalhe">
        <div>
          <div className="capa">{t.fotos[foto] ? <Foto id={t.fotos[foto]} /> : <TestTube size={44} strokeWidth={1} />}</div>
          {t.fotos.length > 1 && <div className="thumbs">{t.fotos.map((f, i) => <button key={f} className={i === foto ? 'on' : ''} onClick={() => setFoto(i)} aria-label={`Foto ${i + 1}`}><Foto id={f} /></button>)}</div>}
        </div>
        <div>
          <p className="eyebrow">Teste{t.planejado ? ' planejado' : ''}</p>
          <h1 style={{ marginTop: 8 }}>{t.codigo}</h1>
          {ideia && !ideia.excluido && <Link to={`/ideias/${ideia.id}`} className="teste-ideia">{temImagem(ideia) && <span className="ph"><ImgRef r={ideia} /></span>}<span><span className="eyebrow">Da ideia</span><br />{ideia.titulo || 'Ideia de esmaltação'}</span></Link>}
          {!!t.avaliacao && <div style={{ marginTop: 12 }}><Estrelas value={t.avaliacao} /></div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
            <Link className="btn sm primary" to={`/testes/${t.id}/editar`}><Pencil size={14} />Editar</Link>
            <button className="btn sm" onClick={() => alternarFavorito('testes', t.id, t.favorito)}><Heart size={14} fill={t.favorito ? 'currentColor' : 'none'} />{t.favorito ? 'Favorito' : 'Favoritar'}</button>
            <button className="btn sm ghost" onClick={async () => { if (confirm('Excluir este teste?')) { await excluir('testes', t.id); nav('/testes') } }}><Trash2 size={14} />Excluir</button>
          </div>
          <dl className="ficha" style={{ marginTop: 24 }}>{ficha.filter(([, v]) => v).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
          {t.resultado && <><h3 style={{ marginTop: 24 }}>Resultado</h3><p className="muted" style={{ whiteSpace: 'pre-wrap', marginTop: 6 }}>{t.resultado}</p></>}
          {t.curva && <><h3 style={{ marginTop: 24 }}>Curva de queima</h3><p className="muted" style={{ whiteSpace: 'pre-wrap', marginTop: 6 }}>{t.curva}</p></>}
          {t.observacoes && <><h3 style={{ marginTop: 24 }}>Observações</h3><p className="muted" style={{ whiteSpace: 'pre-wrap', marginTop: 6 }}>{t.observacoes}</p></>}
          <div style={{ marginTop: 32 }}><Relacoes tipo="teste" id={t.id} /></div>
        </div>
      </div>
    </div>
  )
}
