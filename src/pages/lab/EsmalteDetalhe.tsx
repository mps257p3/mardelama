import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, Copy, FlaskConical, Heart, Pencil, Plus, Trash2, TestTube } from 'lucide-react'
import { db, novo } from '../../db/schema'
import { alternarFavorito, excluir, useFamilias } from '../../db/hooks'
import { proximoCodigo } from '../../db/codigos'
import { criarReceita as criarReceitaNova } from './Receitas'
import { fmt } from '../../lib/opcoes'
import { CLASSES, normalizar } from '../../lib/receita'
import { Estrelas, Foto } from '../../ui/form'
import { Relacoes } from '../../ui/Relacoes'
import { useToast } from '../../ui/toast'

export default function EsmalteDetalhe() {
  const { id } = useParams()
  const nav = useNavigate()
  const toast = useToast()
  const e = useLiveQuery(() => db.esmaltes.get(id!), [id])
  const familias = useFamilias()
  const receita = useLiveQuery(async () => (e?.receitaId ? db.receitas.get(e.receitaId) : undefined), [e?.receitaId])
  const testes = useLiveQuery(async () => (await db.testes.where('esmalteId').equals(id!).toArray()).filter((t) => !t.excluido).sort((a, b) => b.data.localeCompare(a.data)), [id])
  const [foto, setFoto] = useState(0)
  const [aba, setAba] = useState<'ficha' | 'receita' | 'testes' | 'conexoes'>('ficha')

  if (e === undefined) return null
  if (!e || e.excluido) return <div className="page"><p>Esmalte não encontrado.</p></div>

  const fam = e.familias.map((f) => familias.find((x) => x.id === f)?.nome).filter(Boolean)
  const ficha: [string, string | undefined][] = [
    ['Código', e.codigo], ['Origem', e.origem === 'comercial' ? 'Comercial' : 'Formulação própria'],
    [e.origem === 'comercial' ? 'Fabricante' : 'Autoria', e.autoria], ['Famílias', fam.join(', ')],
    ['Cor', e.cor], ['Acabamento', e.acabamento], ['Textura', e.textura], ['Transparência', e.transparencia],
    ['Temperatura', e.temperatura ? fmt(e.temperatura, 0) + ' °C' : undefined], ['Cone', e.cone],
    ['Atmosfera', e.atmosfera], ['Fluidez', e.fluidez], ['Aplicação', e.aplicacao], ['Status', e.status],
    ['Fonte da receita', e.fonteReceita],
  ]

  async function criarReceita() {
    const rid = await criarReceitaNova({ nome: e!.nome, esmalteId: e!.id })
    await db.esmaltes.update(e!.id, { receitaId: rid, atualizadoEm: Date.now() })
    nav(`/receitas/${rid}`)
  }
  async function duplicar() {
    const { id: _i, criadoEm: _c, atualizadoEm: _a, ...resto } = e!
    const x = novo({ ...resto, nome: e!.nome + ' (cópia)', codigo: await proximoCodigo('E', 'esmaltes', 3), favorito: 0 as const })
    await db.esmaltes.add(x); toast('Esmalte duplicado'); nav(`/esmaltes/${x.id}`)
  }

  return (
    <div className="page">
      <Link to="/esmaltes" className="back"><ArrowLeft size={15} />Esmaltes</Link>
      <div className="detalhe">
        <div>
          <div className="capa">
            {e.fotos[foto] ? <Foto id={e.fotos[foto]} alt={e.nome} /> : e.corHex ? <div className="swatch" style={{ background: e.corHex }} /> : <FlaskConical size={44} strokeWidth={1} />}
          </div>
          {e.fotos.length > 1 && <div className="thumbs">{e.fotos.map((f, i) => <button key={f} className={i === foto ? 'on' : ''} onClick={() => setFoto(i)}><Foto id={f} /></button>)}</div>}
        </div>
        <div>
          <p className="eyebrow">{e.codigo}{fam.length ? ' · ' + fam.join(', ') : ''}</p>
          <h1 style={{ marginTop: 8 }}>{e.nome}</h1>
          <div className="pills" style={{ marginTop: 14 }}>
            {[e.temperatura && fmt(e.temperatura, 0) + ' °C', e.cone && 'Cone ' + e.cone, e.acabamento, e.textura, e.status].filter(Boolean).map((p) => <span className="pill" key={String(p)}>{p}</span>)}
          </div>
          {!!e.avaliacao && <div style={{ marginTop: 14 }}><Estrelas value={e.avaliacao} /></div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
            <Link className="btn sm primary" to={`/esmaltes/${e.id}/editar`}><Pencil size={14} />Editar</Link>
            <Link className="btn sm" to={`/testes/novo?esmalte=${e.id}`}><TestTube size={14} />Novo teste</Link>
            <button className="btn sm" onClick={() => alternarFavorito('esmaltes', e.id, e.favorito)}><Heart size={14} fill={e.favorito ? 'currentColor' : 'none'} />{e.favorito ? 'Favorito' : 'Favoritar'}</button>
            <button className="btn sm ghost" onClick={duplicar}><Copy size={14} />Duplicar</button>
            <button className="btn sm ghost" onClick={async () => { if (confirm(`Excluir "${e.nome}"?`)) { await excluir('esmaltes', e.id); toast('Esmalte excluído'); nav('/esmaltes') } }}><Trash2 size={14} />Excluir</button>
          </div>

          <div className="tabs">
            {([['ficha', 'Ficha'], ['receita', 'Receita'], ['testes', `Testes (${testes?.length ?? 0})`], ['conexoes', 'Conexões']] as const).map(([k, l]) =>
              <button key={k} className={aba === k ? 'on' : ''} onClick={() => setAba(k)}>{l}</button>)}
          </div>

          {aba === 'ficha' && <>
            <dl className="ficha" style={{ margin: 0 }}>{ficha.filter(([, v]) => v).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
            {e.tags.length > 0 && <div className="pills" style={{ marginTop: 16 }}>{e.tags.map((t) => <span key={t} className="chip">#{t}</span>)}</div>}
            {e.observacoes && <p style={{ marginTop: 20, whiteSpace: 'pre-wrap' }} className="muted">{e.observacoes}</p>}
          </>}

          {aba === 'receita' && (receita && !receita.excluido ? (
            <div className="card" style={{ padding: 20 }}>
              <div className="section-head" style={{ marginBottom: 8 }}><h3>{receita.nome}</h3><span className="faint" style={{ fontSize: 12 }}>v{receita.versaoAtual}</span></div>
              <table className="tabela"><tbody>
                {CLASSES.map((c) => {
                  const xs = normalizar(receita.ingredientes).filter((i) => i.classe === c.v)
                  return xs.length ? [<tr key={c.v} className="classe-titulo"><td colSpan={2}>{c.l}</td></tr>,
                    ...xs.map((i, k) => <tr key={c.v + k}><td>{i.nome}</td><td className="n">{fmt(i.percentual, 2)} %</td></tr>)] : null
                })}
              </tbody></table>
              <Link to={`/receitas/${receita.id}`} className="link-arrow" style={{ marginTop: 18 }}>Abrir no editor de receitas</Link>
            </div>
          ) : (
            <div className="empty"><span className="serif">Sem receita vinculada.</span>
              <button className="btn sm primary" onClick={criarReceita}><Plus size={14} />Criar receita para este esmalte</button></div>
          ))}

          {aba === 'testes' && (testes && testes.length ? (
            <>
              <div className="galeria" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                {testes.map((t) => (
                  <Link key={t.id} to={`/testes/${t.id}`} className="peca">
                    <div className="ph">{t.fotos[0] ? <Foto id={t.fotos[0]} /> : <TestTube size={22} strokeWidth={1.2} />}<span className="cod">{t.codigo}</span></div>
                    <div className="s">{new Date(t.data + 'T12:00').toLocaleDateString('pt-BR')}{t.cone ? ' · cone ' + t.cone : ''}</div>
                  </Link>
                ))}
              </div>
              {testes.length > 1 && <Link className="btn sm" style={{ marginTop: 16 }} to={`/testes/comparar?ids=${testes.slice(0, 4).map((t) => t.id).join(',')}`}>Comparar lado a lado</Link>}
            </>
          ) : <div className="empty"><span className="serif">Nenhum teste ainda.</span><Link className="btn sm primary" to={`/testes/novo?esmalte=${e.id}`}><Plus size={14} />Registrar teste</Link></div>)}

          {aba === 'conexoes' && <Relacoes tipo="esmalte" id={e.id} extras={[
            ...(receita && !receita.excluido ? [{ tipo: 'receita' as const, id: receita.id, titulo: receita.nome, sub: `versão ${receita.versaoAtual}`, to: `/receitas/${receita.id}` }] : []),
          ]} />}
        </div>
      </div>
    </div>
  )
}
