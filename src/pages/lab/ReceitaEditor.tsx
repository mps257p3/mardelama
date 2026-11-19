import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, Copy, Download, GitBranch, History, Plus, Scale, Trash2, X, Columns2, Printer } from 'lucide-react'
import { db, novo, uid, type ClasseIngrediente, type Ingrediente, type Receita } from '../../db/schema'
import { excluir, useEsmaltes, useMapaMateriais, useMateriais, useReceitas } from '../../db/hooks'
import { CLASSES, baseParaTotal, custo, normalizar, pesos, receitaComoTexto, somaBase, somaExtras } from '../../lib/receita'
import { brl, fmt } from '../../lib/opcoes'
import { baixar } from '../../db/backup'
import { Campo, Numero, Texto, AreaTexto } from '../../ui/form'
import { Sheet } from '../../ui/Sheet'
import { Relacoes } from '../../ui/Relacoes'
import { useToast } from '../../ui/toast'

type R = Omit<Receita, 'criadoEm' | 'atualizadoEm'>

export default function ReceitaEditor() {
  const { id } = useParams()
  const nav = useNavigate()
  const toast = useToast()
  const original = useLiveQuery(() => db.receitas.get(id!), [id])
  const versoes = useLiveQuery(() => db.versoes.where('receitaId').equals(id!).reverse().sortBy('versao'), [id])
  const materiais = useMateriais()
  const mapa = useMapaMateriais()
  const esmaltes = useEsmaltes()
  const receitas = useReceitas()
  const [r, setR] = useState<R>()
  const [sujo, setSujo] = useState(false)
  const [lote, setLote] = useState<{ modo: 'base' | 'total'; g: number }>({ modo: 'base', g: 1000 })
  const [painel, setPainel] = useState<'versoes' | 'base' | 'versao' | undefined>()
  const [notaVersao, setNotaVersao] = useState('')

  useEffect(() => { if (original && (!r || r.id !== original.id)) { setR(original); setSujo(false) } }, [original, r])

  // salvamento automático (útil com as mãos sujas de argila)
  useEffect(() => {
    if (!sujo || !r) return
    const h = setTimeout(async () => { await db.receitas.update(r.id, { ...r, atualizadoEm: Date.now() }); setSujo(false) }, 700)
    return () => clearTimeout(h)
  }, [r, sujo])

  const pesoBase = r ? (lote.modo === 'base' ? lote.g : baseParaTotal(r.ingredientes, lote.g)) : 0
  const comPeso = useMemo(() => (r ? pesos(r.ingredientes, pesoBase) : []), [r, pesoBase])
  const c = useMemo(() => (r ? custo(r.ingredientes, pesoBase, mapa) : { total: 0, faltando: [] }), [r, pesoBase, mapa])
  const variacoes = (receitas ?? []).filter((x) => x.origemId === id)
  const origem = (receitas ?? []).find((x) => x.id === r?.origemId)

  if (original === undefined || !r) return null
  if (!original || original.excluido) return <div className="page"><p>Receita não encontrada.</p></div>

  const mudar = (p: Partial<R>) => { setR({ ...r, ...p }); setSujo(true) }
  const setIng = (k: number, p: Partial<Ingrediente>) => mudar({ ingredientes: r.ingredientes.map((i, j) => (j === k ? { ...i, ...p } : i)) })
  const addIng = (classe: ClasseIngrediente) => mudar({ ingredientes: [...r.ingredientes, { nome: '', percentual: 0, classe }] })
  const sb = somaBase(r.ingredientes)

  async function registrarVersao(nota: string, incrementar = true) {
    const atual = await db.receitas.get(r!.id)
    const v = incrementar ? (atual?.versaoAtual ?? 1) + 1 : (atual?.versaoAtual ?? 1)
    const { id: _id, ...snap } = { ...(atual as Receita), ...r!, versaoAtual: v, atualizadoEm: Date.now() }
    await db.receitas.put({ ...(snap as Receita), id: r!.id })
    await db.versoes.add({ id: uid(), receitaId: r!.id, versao: v, criadoEm: Date.now(), nota: nota || undefined, snapshot: snap })
    setR({ ...r!, versaoAtual: v }); setSujo(false)
  }
  async function derivar(tipo: 'duplicar' | 'variacao') {
    const { id: _i, ...resto } = r!
    const x = novo({ ...resto, nome: r!.nome + (tipo === 'variacao' ? ' · variação' : ' (cópia)'), versaoAtual: 1, origemId: tipo === 'variacao' ? r!.id : r!.origemId, esmalteId: tipo === 'variacao' ? r!.esmalteId : undefined, ehBase: 0 as const })
    await db.receitas.add(x)
    await db.versoes.add({ id: uid(), receitaId: x.id, versao: 1, criadoEm: Date.now(), nota: tipo === 'variacao' ? `Derivada de ${r!.nome} v${r!.versaoAtual}` : `Cópia de ${r!.nome}`, snapshot: { ...x } })
    toast(tipo === 'variacao' ? 'Variação criada' : 'Receita duplicada'); nav(`/receitas/${x.id}`)
  }

  const linhas = (classe: ClasseIngrediente) => comPeso.map((i, k) => ({ i, k })).filter(({ i }) => i.classe === classe)

  return (
    <div className="page">
      <Link to="/receitas" className="back"><ArrowLeft size={15} />Receitas</Link>
      <div className="head">
        <div style={{ flex: 1, minWidth: 260 }}>
          <p className="eyebrow">Receita · versão {r.versaoAtual}</p>
          <input className="serif" value={r.nome} onChange={(e) => mudar({ nome: e.target.value })}
            style={{ fontSize: 'clamp(34px,5vw,52px)', border: 0, background: 'none', width: '100%', padding: 0, marginTop: 6, outline: 'none', color: 'var(--ink)' }} />
          {origem && <p className="faint" style={{ fontSize: 13 }}><GitBranch size={13} style={{ verticalAlign: -2 }} /> Variação de <Link to={`/receitas/${origem.id}`} style={{ textDecoration: 'underline' }}>{origem.nome}</Link></p>}
        </div>
        <div className="acts">
          <span className="faint" style={{ fontSize: 12.5, alignSelf: 'center' }}>{sujo ? 'Salvando…' : 'Salvo automaticamente'}</span>
          <button className="btn primary" onClick={() => { setNotaVersao(''); setPainel('versao') }}>Registrar versão</button>
        </div>
      </div>

      <div className="detalhe" style={{ marginTop: 28 }}>
        <div>
          <div className="tabela-wrap">
            <table className="tabela">
              <thead><tr><th>Ingrediente</th><th className="n" style={{ width: 96 }}>%</th><th className="n" style={{ width: 92 }}>Peso (g)</th><th style={{ width: 36 }} /></tr></thead>
              <tbody>
                {CLASSES.map((cl) => [
                  <tr key={cl.v} className="classe-titulo"><td colSpan={3}>{cl.l}{cl.v !== 'base' && <span className="faint" style={{ textTransform: 'none', letterSpacing: 0, marginLeft: 8 }}>% sobre a base</span>}</td>
                    <td><button className="iconbtn" style={{ width: 30, height: 30 }} aria-label={`Adicionar em ${cl.l}`} onClick={() => addIng(cl.v)}><Plus size={15} /></button></td></tr>,
                  ...linhas(cl.v).map(({ i, k }) => (
                    <tr key={cl.v + k}>
                      <td>
                        <input className="input" list="materiais-lista" value={i.nome} placeholder="Material" onChange={(e) => {
                          const m = (materiais ?? []).find((x) => x.nome === e.target.value)
                          setIng(k, { nome: e.target.value, materialId: m?.id })
                        }} />
                        {i.materialId && <Link to={`/materiais/${i.materialId}`} className="faint" style={{ fontSize: 11 }}>no catálogo{mapa.get(i.materialId)?.precoKg != null ? ' · ' + brl(mapa.get(i.materialId)!.precoKg) + '/kg' : ''}</Link>}
                      </td>
                      <td><Numero value={i.percentual} onChange={(v) => setIng(k, { percentual: v ?? 0 })} style={{ textAlign: 'right' }} /></td>
                      <td className="n">{fmt(i.peso, 1)}</td>
                      <td><button className="iconbtn" style={{ width: 30, height: 30 }} aria-label="Remover" onClick={() => mudar({ ingredientes: r.ingredientes.filter((_, j) => j !== k) })}><X size={14} /></button></td>
                    </tr>
                  )),
                ])}
              </tbody>
              <tfoot>
                <tr><td>Base</td><td className="n" style={{ color: Math.abs(sb - 100) > 0.05 ? 'var(--terracota)' : undefined }}>{fmt(sb, 2)} %</td><td className="n">{fmt(pesoBase, 1)}</td><td /></tr>
                <tr><td className="faint" style={{ fontWeight: 400 }}>+ extras</td><td className="n faint" style={{ fontWeight: 400 }}>{fmt(somaExtras(r.ingredientes), 2)} %</td><td className="n faint" style={{ fontWeight: 400 }}>{fmt(pesoBase * somaExtras(r.ingredientes) / 100, 1)}</td><td /></tr>
                <tr><td>Total seco</td><td /><td className="n">{fmt(pesoBase * (1 + somaExtras(r.ingredientes) / 100), 1)}</td><td /></tr>
              </tfoot>
            </table>
            <datalist id="materiais-lista">{(materiais ?? []).map((m) => <option key={m.id} value={m.nome}>{m.categoria}</option>)}</datalist>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
            <button className="btn sm" disabled={!sb || Math.abs(sb - 100) < 0.005} onClick={() => mudar({ ingredientes: normalizar(r.ingredientes) })}><Scale size={14} />Normalizar base para 100%</button>
            <button className="btn sm" onClick={() => setPainel('base')}><Plus size={14} />Usar uma base</button>
          </div>
          {Math.abs(sb - 100) > 0.05 && sb > 0 && <p className="aviso" style={{ marginTop: 14 }}>A receita base soma {fmt(sb, 2)}%. Os pesos já são calculados proporcionalmente; normalize para registrar em 100%.</p>}

          <h3 style={{ marginTop: 36 }}>Líquidos</h3>
          <div className="form" style={{ marginTop: 14 }}>
            <Campo label="Água (ml por 100 g de base seca)"><Numero value={r.aguaMlPor100g} onChange={(v) => mudar({ aguaMlPor100g: v })} /></Campo>
            <Campo label="Água para este lote"><div className="input" style={{ display: 'flex', alignItems: 'center' }}>{r.aguaMlPor100g ? fmt(r.aguaMlPor100g * pesoBase / 100, 0) + ' ml' : '–'}</div></Campo>
            {(r.liquidos ?? []).map((l, k) => (
              <div key={k} style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 100px 90px 36px', gap: 8 }}>
                <Texto value={l.nome} placeholder="Aditivo líquido" onChange={(v) => mudar({ liquidos: r.liquidos!.map((x, j) => (j === k ? { ...x, nome: v } : x)) })} />
                <Numero value={l.quantidade} onChange={(v) => mudar({ liquidos: r.liquidos!.map((x, j) => (j === k ? { ...x, quantidade: v ?? 0 } : x)) })} />
                <select className="input" value={l.unidade} onChange={(e) => mudar({ liquidos: r.liquidos!.map((x, j) => (j === k ? { ...x, unidade: e.target.value } : x)) })}>
                  <option value="ml/100g">ml/100 g</option><option value="gotas/100g">gotas/100 g</option><option value="ml/lote">ml/lote</option>
                </select>
                <button className="iconbtn" aria-label="Remover" onClick={() => mudar({ liquidos: r.liquidos!.filter((_, j) => j !== k) })}><X size={14} /></button>
              </div>
            ))}
            <div style={{ gridColumn: '1 / -1' }}><button className="btn sm" onClick={() => mudar({ liquidos: [...(r.liquidos ?? []), { nome: '', quantidade: 0, unidade: 'ml/100g' }] })}><Plus size={14} />Aditivo líquido</button></div>
          </div>

          <h3 style={{ marginTop: 36 }}>Observações</h3>
          <div style={{ marginTop: 12 }}><AreaTexto value={r.observacoes} onChange={(v) => mudar({ observacoes: v })} rows={4} /></div>
        </div>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div className="card" style={{ padding: 20 }}>
            <h3>Lote</h3>
            <div className="seg" style={{ marginTop: 12 }}>
              <button className={lote.modo === 'base' ? 'on' : ''} onClick={() => setLote({ ...lote, modo: 'base' })}>Peso da base</button>
              <button className={lote.modo === 'total' ? 'on' : ''} onClick={() => setLote({ ...lote, modo: 'total' })}>Peso total seco</button>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}>
              <Numero value={lote.g} onChange={(v) => setLote({ ...lote, g: v ?? 0 })} /><span>g</span>
            </div>
            <div className="chips" style={{ marginTop: 10 }}>{[100, 500, 1000, 3000, 5000].map((g) => <button key={g} className={'chip' + (lote.g === g ? ' on' : '')} onClick={() => setLote({ ...lote, g })}>{g >= 1000 ? g / 1000 + ' kg' : g + ' g'}</button>)}</div>
            <hr className="divider" style={{ margin: '18px 0' }} />
            <p className="eyebrow">Custo estimado</p>
            <p className="serif" style={{ fontSize: 34, marginTop: 4 }}>{brl(c.total)}</p>
            {c.faltando.length > 0 && <p className="faint" style={{ fontSize: 12.5 }}>Sem preço cadastrado: {c.faltando.filter(Boolean).join(', ') || 'ingredientes sem nome'}.</p>}
          </div>

          <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Campo label="Esmalte vinculado">
              <select className="input" value={r.esmalteId ?? ''} onChange={(e) => mudar({ esmalteId: e.target.value || undefined })}>
                <option value="">Nenhum</option>{(esmaltes ?? []).map((e) => <option key={e.id} value={e.id}>{e.codigo} · {e.nome}</option>)}
              </select>
            </Campo>
            <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14 }}>
              <input type="checkbox" checked={!!r.ehBase} onChange={(e) => mudar({ ehBase: e.target.checked ? 1 : 0 })} /> Base reutilizável
            </label>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn sm" onClick={() => derivar('variacao')}><GitBranch size={14} />Criar variação</button>
            <button className="btn sm" onClick={() => derivar('duplicar')}><Copy size={14} />Duplicar</button>
            <button className="btn sm" onClick={() => setPainel('versoes')}><History size={14} />Histórico ({versoes?.length ?? 0})</button>
            <Link className="btn sm" to={`/receitas/comparar?a=${r.id}`}><Columns2 size={14} />Comparar</Link>
            <button className="btn sm" onClick={() => baixar(new Blob([receitaComoTexto(`${r.nome} (v${r.versaoAtual})`, r.ingredientes, pesoBase, r.aguaMlPor100g)], { type: 'text/plain' }), `${r.nome}.txt`)}><Download size={14} />Exportar</button>
            <button className="btn sm" onClick={() => window.print()}><Printer size={14} />Imprimir</button>
            <button className="btn sm ghost" onClick={async () => { if (confirm('Excluir esta receita?')) { await excluir('receitas', r.id); nav('/receitas') } }}><Trash2 size={14} />Excluir</button>
          </div>

          {variacoes.length > 0 && <div>
            <p className="eyebrow" style={{ marginBottom: 8 }}>Variações desta receita</p>
            <div className="lista">{variacoes.map((v) => <Link key={v.id} to={`/receitas/${v.id}`} style={{ gridTemplateColumns: '1fr auto' }}><span className="t" style={{ fontSize: 18 }}>{v.nome}</span><span className="faint">v{v.versaoAtual}</span></Link>)}</div>
          </div>}

          <Relacoes tipo="receita" id={r.id} extras={r.ingredientes.filter((i) => i.materialId && mapa.get(i.materialId)).map((i) => ({ tipo: 'material' as const, id: i.materialId!, titulo: i.nome, sub: mapa.get(i.materialId!)!.categoria, to: `/materiais/${i.materialId}` }))} />
        </aside>
      </div>

      {painel === 'versao' && <Sheet label="Registrar versão" onClose={() => setPainel(undefined)}>
        <h3>Registrar versão {r.versaoAtual + 1}</h3>
        <p className="muted" style={{ margin: '8px 0 16px' }}>Guarda um retrato desta formulação no histórico. Testes podem apontar para a versão exata que usaram.</p>
        <Campo label="O que mudou?"><Texto value={notaVersao} onChange={setNotaVersao} placeholder="Ex.: +2% de rutilo, menos sílica" autoFocus /></Campo>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
          <button className="btn primary" onClick={async () => { await registrarVersao(notaVersao); setPainel(undefined); toast('Versão registrada') }}>Registrar</button>
        </div>
      </Sheet>}

      {painel === 'versoes' && <Sheet label="Histórico" onClose={() => setPainel(undefined)}>
        <h3>Histórico de versões</h3>
        <div className="lista" style={{ marginTop: 14 }}>
          {(versoes ?? []).map((v) => (
            <div key={v.id} className="row" style={{ gridTemplateColumns: '48px 1fr auto' }}>
              <span className="codigo">v{v.versao}</span>
              <div><div style={{ fontSize: 14 }}>{v.nota || 'Sem nota'}</div><div className="s">{new Date(v.criadoEm).toLocaleString('pt-BR')} · {v.snapshot.ingredientes.map((i) => `${i.nome} ${fmt(i.percentual, 1)}`).join(', ')}</div></div>
              <button className="btn sm" onClick={() => { mudar({ ingredientes: v.snapshot.ingredientes, aguaMlPor100g: v.snapshot.aguaMlPor100g, liquidos: v.snapshot.liquidos }); setPainel(undefined); toast(`Ingredientes da v${v.versao} restaurados`) }}>Restaurar</button>
            </div>
          ))}
          {!versoes?.length && <p className="faint">Ainda sem versões registradas.</p>}
        </div>
      </Sheet>}

      {painel === 'base' && <Sheet label="Usar base" onClose={() => setPainel(undefined)}>
        <h3>Usar uma base reutilizável</h3>
        <p className="muted" style={{ margin: '8px 0 16px' }}>Substitui a receita base atual pela base escolhida; corantes, opacificantes e aditivos são mantidos.</p>
        <div className="lista">
          {(receitas ?? []).filter((x) => x.ehBase && x.id !== r.id).map((b) => (
            <button key={b.id} className="row" style={{ gridTemplateColumns: '1fr auto', background: 'none', border: 0, borderBottom: '1px solid var(--line)', textAlign: 'left', width: '100%' }}
              onClick={() => { mudar({ ingredientes: [...b.ingredientes.filter((i) => i.classe === 'base'), ...r.ingredientes.filter((i) => i.classe !== 'base')], origemId: r.origemId ?? b.id }); setPainel(undefined) }}>
              <div><div className="t" style={{ fontSize: 18 }}>{b.nome}</div><div className="s">{b.ingredientes.filter((i) => i.classe === 'base').map((i) => i.nome).join(', ')}</div></div><Plus size={16} />
            </button>
          ))}
          {!(receitas ?? []).some((x) => x.ehBase && x.id !== r.id) && <p className="faint">Marque uma receita como "Base reutilizável" para usá-la aqui.</p>}
        </div>
      </Sheet>}
    </div>
  )
}
