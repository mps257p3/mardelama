import { ArtistasAfins } from '../bib/art/ArtistasAfins'
import { incluidoEm } from '../../lib/data'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, Copy, FlaskConical, Heart, Pencil, Plus, ScrollText, Trash2, TestTube } from 'lucide-react'
import { db, novo } from '../../db/schema'
import { alternarFavorito, excluir, useFamilias } from '../../db/hooks'
import { proximoCodigo } from '../../db/codigos'
import { criarReceita as criarReceitaNova } from './Receitas'
import { fmt } from '../../lib/opcoes'
import { Estrelas, Foto } from '../../ui/form'
import { Relacoes } from '../../ui/Relacoes'
import { useToast } from '../../ui/toast'
import { CapaFotos, GaleriaPecas } from '../../ui/GaleriaFotos'
import { SeloLouca, loucaDoTexto } from '../../ui/Louca'

const maiusc = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export default function EsmalteDetalhe() {
  const { id } = useParams()
  const nav = useNavigate()
  const toast = useToast()
  const e = useLiveQuery(() => db.esmaltes.get(id!), [id])
  const familias = useFamilias()
  const receita = useLiveQuery(async () => (e?.receitaId ? db.receitas.get(e.receitaId) : undefined), [e?.receitaId])
  const testes = useLiveQuery(async () => (await db.testes.where('esmalteId').equals(id!).toArray()).filter((t) => !t.excluido).sort((a, b) => b.data.localeCompare(a.data)), [id])
  const [verTestes, setVerTestes] = useState(false)

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
      <Link to="/esmaltes" className="back"><ArrowLeft size={15} />Esmaltaria</Link>
      <div className="detalhe">
        <div>
          <CapaFotos fotos={e.fotos} alt={e.nome} rotuloAdd="Adicionar foto do esmalte"
            onChange={(v) => db.esmaltes.update(e.id, { fotos: v, atualizadoEm: Date.now() })}
            vazio={e.corHex ? <div className="swatch" style={{ background: e.corHex }} /> : <FlaskConical size={44} strokeWidth={1} />} />
        </div>
        <div>
          <p className="eyebrow">{e.codigo}{fam.length ? ' · ' + fam.join(', ') : ''}</p>
          <h1 style={{ marginTop: 8 }}>{e.nome}</h1>
          <p className="faint" style={{ fontSize: 13, marginTop: 4 }}>{maiusc(incluidoEm(e.criadoEm))}</p>
          <div className="linha-queima">
            {(e.temperatura || e.cone) && <span className="t">{[e.temperatura && fmt(e.temperatura, 0) + ' °C', e.cone && 'cone ' + e.cone, e.atmosfera].filter(Boolean).join(', ')}</span>}
            <SeloLouca origem={e.origem === 'comercial' ? 'fabricante' : 'proprio'} valor={e.louca ?? (e.origem === 'comercial' ? loucaDoTexto([e.observacoes, ...e.tags]) : undefined)}
              onChange={(v) => db.esmaltes.update(e.id, { louca: v, atualizadoEm: Date.now() })} />
          </div>
          <div className="pills" style={{ marginTop: 12 }}>
            {[e.acabamento, e.textura, e.status].filter(Boolean).map((p) => <span className="pill" key={String(p)}>{p}</span>)}
          </div>
          {!!e.avaliacao && <div style={{ marginTop: 14 }}><Estrelas value={e.avaliacao} /></div>}
          <div className="esm-botoes">
            {receita && !receita.excluido
              ? <Link className="esm-botao" to={`/receitas/${receita.id}`}><ScrollText size={20} strokeWidth={1.3} /><b>Fórmula</b><span>{receita.codigo ? receita.codigo + ' · ' : ''}versão {receita.versaoAtual}</span></Link>
              : <button className="esm-botao" onClick={criarReceita}><ScrollText size={20} strokeWidth={1.3} /><b>Fórmula</b><span>{e.origem === 'comercial' ? 'Comercial · criar estudo' : 'Criar fórmula'}</span></button>}
            <button className={'esm-botao' + (verTestes ? ' on' : '')} onClick={() => setVerTestes(!verTestes)}><TestTube size={20} strokeWidth={1.3} /><b>Testes</b><span>{testes?.length ? `${testes.length} ${testes.length === 1 ? 'registrado' : 'registrados'}` : 'Nenhum ainda'}</span></button>
          </div>

          {verTestes && <div className="esm-testes">
            {testes && testes.length ? <div className="galeria" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {testes.map((t) => (
                <Link key={t.id} to={`/testes/${t.id}`} className="peca">
                  <div className="ph">{t.fotos[0] ? <Foto id={t.fotos[0]} /> : <TestTube size={22} strokeWidth={1.2} />}<span className="cod">{t.codigo}</span></div>
                  <div className="s">{t.planejado ? 'Planejado' : new Date(t.data + 'T12:00').toLocaleDateString('pt-BR')}{t.cone ? ' · cone ' + t.cone : ''}</div>
                </Link>
              ))}
            </div> : <p className="muted">Nenhum teste deste esmalte ainda.</p>}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
              <Link className="btn sm primary" to={`/testes/novo?esmalte=${e.id}`}><Plus size={14} />Novo teste</Link>
              {testes && testes.length > 1 && <Link className="btn sm" to={`/testes/comparar?ids=${testes.slice(0, 4).map((t) => t.id).join(',')}`}>Comparar lado a lado</Link>}
            </div>
          </div>}

          <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
            <Link className="btn sm primary" to={`/esmaltes/${e.id}/editar`}><Pencil size={14} />Editar</Link>
                        <button className="btn sm" onClick={() => alternarFavorito('esmaltes', e.id, e.favorito)}><Heart size={14} fill={e.favorito ? 'currentColor' : 'none'} />{e.favorito ? 'Favorito' : 'Favoritar'}</button>
            <button className="btn sm ghost" onClick={duplicar}><Copy size={14} />Duplicar</button>
            <button className="btn sm ghost" onClick={async () => { if (confirm(`Excluir "${e.nome}"?`)) { await excluir('esmaltes', e.id); toast('Esmalte excluído'); nav('/esmaltes') } }}><Trash2 size={14} />Excluir</button>
          </div>

          <dl className="ficha" style={{ margin: '24px 0 0' }}>{ficha.filter(([, v]) => v).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
          {e.tags.length > 0 && <div className="pills" style={{ marginTop: 16 }}>{e.tags.map((t) => <span key={t} className="chip">#{t}</span>)}</div>}
          {e.observacoes && <p style={{ marginTop: 20, whiteSpace: 'pre-wrap' }} className="muted">{e.observacoes}</p>}

          <div style={{ marginTop: 28 }} />
          <Relacoes tipo="esmalte" id={e.id} extras={[
            ...(receita && !receita.excluido ? [{ tipo: 'receita' as const, id: receita.id, titulo: receita.nome, sub: `versão ${receita.versaoAtual}`, to: `/receitas/${receita.id}` }] : []),
          ]} />
          <ArtistasAfins termos={[e.acabamento, e.textura, ...e.tags, ...(fam as string[])]} />
        </div>
      </div>
      <GaleriaPecas titulo="Peças com este esmalte" fotos={e.pecas ?? []}
        onChange={(v) => db.esmaltes.update(e.id, { pecas: v, atualizadoEm: Date.now() })} />
    </div>
  )
}
