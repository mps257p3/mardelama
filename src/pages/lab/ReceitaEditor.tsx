import { useEffect, useMemo, useState } from 'react'
import { incluidoEm } from '../../lib/data'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, ScrollText, Copy, Download, GitBranch, History, Plus, Scale, Trash2, X, Columns2, Printer } from 'lucide-react'
import { db, novo, uid, type ClasseIngrediente, type Ingrediente, type Receita } from '../../db/schema'
import { excluir, useEsmaltes, useFamilias, useMapaMateriais, useMateriais, useReceitas } from '../../db/hooks'
import { STATUS_RECEITA, TEXTURAS_AUTORAIS } from '../../db/conhecimento'
import { CLASSES, baseParaTotal, custo, normalizar, pesos, receitaComoTexto, somaBase, somaExtras } from '../../lib/receita'
import { brl, fmt } from '../../lib/opcoes'
import { baixar } from '../../db/backup'
import { Campo, Numero, Texto, AreaTexto, Multi, Tags } from '../../ui/form'
import { Sheet } from '../../ui/Sheet'
import { Relacoes } from '../../ui/Relacoes'
import { useToast } from '../../ui/toast'
import { CapaFotos, GaleriaPecas } from '../../ui/GaleriaFotos'
import { Menu } from '../../ui/Menu'
import { SeloLouca, loucaDoTexto } from '../../ui/Louca'

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
  const familias = useFamilias()
  const curvas = useLiveQuery(async () => (await db.curvas.orderBy('codigo').toArray()).filter((x) => !x.excluido), [], [])
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
    const x = novo({ ...resto, nome: r!.nome + (tipo === 'variacao' ? ' · variação' : ' (cópia)'), codigo: r!.codigo ? r!.codigo + (tipo === 'variacao' ? '-V' : '-C') : undefined, status: STATUS_RECEITA[0], versaoAtual: 1, origemId: tipo === 'variacao' ? r!.id : r!.origemId, esmalteId: tipo === 'variacao' ? r!.esmalteId : undefined, ehBase: 0 as const, fotos: [], pecas: [] })
    await db.receitas.add(x)
    await db.versoes.add({ id: uid(), receitaId: x.id, versao: 1, criadoEm: Date.now(), nota: tipo === 'variacao' ? `Derivada de ${r!.nome} v${r!.versaoAtual}` : `Cópia de ${r!.nome}`, snapshot: { ...x } })
    toast(tipo === 'variacao' ? 'Variação criada' : 'Receita duplicada'); nav(`/receitas/${x.id}`)
  }

  const linhas = (classe: ClasseIngrediente) => comPeso.map((i, k) => ({ i, k })).filter(({ i }) => i.classe === classe)

  const louca = r.louca ?? (loucaDoTexto([r.parametros, r.observacoes]) === 'nao' ? 'nao' : 'testar')
  const linhasDe = (s?: string, min = 3) => Math.min(14, Math.max(min, Math.ceil((s ?? '').length / 42) + (s ?? '').split('\n').length))
  const resumoFicha = [r.codigo, r.status, (r.familias ?? []).map((f) => familias.find((x) => x.id === f)?.nome).filter(Boolean).join(', ')].filter(Boolean).join(' · ')

  return (
    <div className="page formula">
      <Link to="/receitas" className="back"><ArrowLeft size={15} />Esmaltaria</Link>
      <div className="receita-capa">
        <CapaFotos fotos={r.fotos ?? []} alt={r.nome} rotuloAdd="Adicionar foto do esmalte" onChange={(v) => mudar({ fotos: v })}
          vazio={<ScrollText size={36} strokeWidth={1} />} />
      </div>

      <p className="eyebrow">{r.codigo ? r.codigo + ' · ' : 'Fórmula · '}versão {r.versaoAtual}{original?.criadoEm ? ' · ' + incluidoEm(original.criadoEm) : ''}</p>
      <input className="serif formula-nome" value={r.nome} onChange={(e) => mudar({ nome: e.target.value })} aria-label="Nome da fórmula" />
      <div className="linha-queima">
        <textarea className="formula-temp" value={r.temperatura ?? ''} placeholder="Temperatura e cone" aria-label="Temperatura de queima"
          rows={Math.max(1, Math.ceil((r.temperatura ?? '').length / 40))} onChange={(e) => mudar({ temperatura: e.target.value.replace(/\n/g, ' ') || undefined })} />
        <SeloLouca origem="proprio" valor={louca} onChange={(v) => mudar({ louca: v })} />
      </div>
      {(r.status || origem) && <div className="pills" style={{ marginTop: 10 }}>
        {r.status && <span className={'pill' + (/Experimental|Modelo/.test(r.status) ? ' alerta' : '')}>{r.status}</span>}
        {origem && <Link className="pill" to={`/receitas/${origem.id}`}><GitBranch size={11} style={{ verticalAlign: -1 }} /> Variação de {origem.nome}</Link>}
      </div>}
      {r.objetivo && <p className="formula-objetivo">{r.objetivo}</p>}

      <div className="formula-acoes">
        <button className="btn primary sm" onClick={() => { setNotaVersao(''); setPainel('versao') }}>Registrar versão</button>
        <span className="faint" style={{ fontSize: 12.5 }}>{sujo ? 'Salvando…' : 'Salvo automaticamente'}</span>
        <span style={{ flex: 1 }} />
        <Menu itens={[
          { l: 'Criar variação', icon: <GitBranch size={16} />, onClick: () => derivar('variacao') },
          { l: 'Duplicar', icon: <Copy size={16} />, onClick: () => derivar('duplicar') },
          { l: `Histórico de versões (${versoes?.length ?? 0})`, icon: <History size={16} />, onClick: () => setPainel('versoes') },
          { l: 'Comparar com outra', icon: <Columns2 size={16} />, to: `/receitas/comparar?a=${r.id}` },
          { l: 'Usar uma base', icon: <Plus size={16} />, onClick: () => setPainel('base') },
          { sep: true, l: '' },
          { l: 'Exportar texto', icon: <Download size={16} />, onClick: () => baixar(new Blob([receitaComoTexto(`${r.nome} (v${r.versaoAtual})`, r.ingredientes, pesoBase, r.aguaMlPor100g)], { type: 'text/plain' }), `${r.nome}.txt`) },
          { l: 'Imprimir', icon: <Printer size={16} />, onClick: () => window.print() },
          { l: 'Excluir', icon: <Trash2 size={16} />, onClick: async () => { if (confirm('Excluir esta receita?')) { await excluir('receitas', r.id); nav('/receitas') } } },
        ]} />
      </div>

      <div className="detalhe" style={{ marginTop: 24 }}>
        <div>
          <h3 className="formula-sec">Receita</h3>
          <div className="tabela-wrap">
            <table className="tabela formula-tabela">
              <thead><tr><th>Ingrediente</th><th className="n" style={{ width: 76 }}>%</th><th className="n" style={{ width: 70 }}>{lote.g >= 1000 ? fmt(lote.g / 1000, 1) + ' kg' : lote.g + ' g'}</th><th style={{ width: 32 }} /></tr></thead>
              <tbody>
                {CLASSES.map((cl) => {
                  const ls = linhas(cl.v)
                  return [
                    <tr key={cl.v} className="classe-titulo"><td colSpan={3}>{cl.l}{cl.v !== 'base' && ls.length > 0 && <span className="faint" style={{ textTransform: 'none', letterSpacing: 0, marginLeft: 8 }}>sobre a base</span>}</td>
                      <td><button className="iconbtn" style={{ width: 30, height: 30 }} aria-label={`Adicionar em ${cl.l}`} onClick={() => addIng(cl.v)}><Plus size={15} /></button></td></tr>,
                    ...ls.map(({ i, k }) => (
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
                  ]
                })}
              </tbody>
              <tfoot>
                <tr><td>Base</td><td className="n" style={{ color: Math.abs(sb - 100) > 0.05 ? 'var(--terracota)' : undefined }}>{fmt(sb, 1)}</td><td className="n">{fmt(pesoBase, 1)}</td><td /></tr>
                {somaExtras(r.ingredientes) > 0 && <tr><td className="faint" style={{ fontWeight: 400 }}>+ extras</td><td className="n faint" style={{ fontWeight: 400 }}>{fmt(somaExtras(r.ingredientes), 1)}</td><td className="n faint" style={{ fontWeight: 400 }}>{fmt(pesoBase * somaExtras(r.ingredientes) / 100, 1)}</td><td /></tr>}
                <tr><td>Total seco</td><td /><td className="n">{fmt(pesoBase * (1 + somaExtras(r.ingredientes) / 100), 1)}</td><td /></tr>
              </tfoot>
            </table>
            <datalist id="materiais-lista">{(materiais ?? []).map((m) => <option key={m.id} value={m.nome}>{m.categoria}</option>)}</datalist>
          </div>
          {Math.abs(sb - 100) > 0.05 && sb > 0 && <div className="aviso" style={{ marginTop: 14 }}>
            A base soma {fmt(sb, 2)}%. Os pesos já saem proporcionais; normalize para registrar em 100%.
            <div style={{ marginTop: 10 }}><button className="btn sm" onClick={() => mudar({ ingredientes: normalizar(r.ingredientes) })}><Scale size={14} />Normalizar base para 100%</button></div>
          </div>}

          <div className="formula-lote">
            <span className="faint">Calcular para</span>
            <div className="seg">
              <button className={lote.modo === 'base' ? 'on' : ''} onClick={() => setLote({ ...lote, modo: 'base' })}>base</button>
              <button className={lote.modo === 'total' ? 'on' : ''} onClick={() => setLote({ ...lote, modo: 'total' })}>total seco</button>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Numero value={lote.g} onChange={(v) => setLote({ ...lote, g: v ?? 0 })} /><span>g</span></div>
            <div className="chips" style={{ width: '100%' }}>{[100, 250, 500, 1000, 2000].map((g) => <button key={g} className={'chip' + (lote.g === g ? ' on' : '')} onClick={() => setLote({ ...lote, g })}>{g >= 1000 ? g / 1000 + ' kg' : g + ' g'}</button>)}</div>
          </div>
          <details className="formula-dobra">
            <summary>Água, volume e custo deste lote</summary>
            <div style={{ paddingTop: 8 }}><Resumo r={r} pesoBase={pesoBase} comPeso={comPeso} mapa={mapa} custoTotal={c.total} faltando={c.faltando} /></div>
          </details>

          <h3 className="formula-sec">Preparo e queima</h3>
          <div className="form" style={{ marginTop: 12 }}>
            <Campo label="Água (ml por 100 g de base)"><Numero value={r.aguaMlPor100g} onChange={(v) => mudar({ aguaMlPor100g: v })} /></Campo>
            <Campo label="Água para este lote"><div className="input" style={{ display: 'flex', alignItems: 'center' }}>{r.aguaMlPor100g ? fmt(r.aguaMlPor100g * pesoBase / 100, 0) + ' ml' : '–'}</div></Campo>
            {(r.liquidos ?? []).map((l, k) => (
              <div key={k} style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 80px 90px 36px', gap: 8 }}>
                <Texto value={l.nome} placeholder="Aditivo líquido" onChange={(v) => mudar({ liquidos: r.liquidos!.map((x, j) => (j === k ? { ...x, nome: v } : x)) })} />
                <Numero value={l.quantidade} onChange={(v) => mudar({ liquidos: r.liquidos!.map((x, j) => (j === k ? { ...x, quantidade: v ?? 0 } : x)) })} />
                <select className="input" value={l.unidade} onChange={(e) => mudar({ liquidos: r.liquidos!.map((x, j) => (j === k ? { ...x, unidade: e.target.value } : x)) })}>
                  <option value="ml/100g">ml/100 g</option><option value="gotas/100g">gotas/100 g</option><option value="ml/lote">ml/lote</option>
                </select>
                <button className="iconbtn" aria-label="Remover" onClick={() => mudar({ liquidos: r.liquidos!.filter((_, j) => j !== k) })}><X size={14} /></button>
              </div>
            ))}
            <div style={{ gridColumn: '1 / -1' }}><button className="btn sm ghost" onClick={() => mudar({ liquidos: [...(r.liquidos ?? []), { nome: '', quantidade: 0, unidade: 'ml/100g' }] })}><Plus size={14} />Aditivo líquido</button></div>
            <div style={{ gridColumn: '1 / -1' }}><Campo label="Variações e queima"><AreaTexto value={r.parametros} onChange={(v) => mudar({ parametros: v })} rows={linhasDe(r.parametros)} /></Campo></div>
            <div style={{ gridColumn: '1 / -1' }}><Campo label="Curva de queima">
              <select className="input" value={r.curvaId ?? ''} onChange={(e) => mudar({ curvaId: e.target.value || undefined })}>
                <option value="">Nenhuma</option>{curvas.map((x) => <option key={x.id} value={x.id}>{x.codigo} · {x.nome}</option>)}
              </select>
            </Campo>
            {r.curvaId && <Link to={`/curvas/${r.curvaId}`} className="faint" style={{ fontSize: 12.5 }}>Abrir curva</Link>}</div>
          </div>

          <h3 className="formula-sec">Observações</h3>
          <div style={{ marginTop: 12 }}><AreaTexto value={r.observacoes} onChange={(v) => mudar({ observacoes: v })} rows={linhasDe(r.observacoes, 4)} /></div>
        </div>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <details className="card formula-ficha">
            <summary><h3>Ficha da fórmula</h3>{resumoFicha && <span className="faint">{resumoFicha}</span>}</summary>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Campo label="Código"><Texto value={r.codigo} onChange={(v) => mudar({ codigo: v.toUpperCase() || undefined })} placeholder="ex.: RET-006" /></Campo>
                <Campo label="Status">
                  <select className="input" value={r.status ?? ''} onChange={(e) => mudar({ status: e.target.value || undefined })}>
                    <option value="">—</option>{STATUS_RECEITA.map((x) => <option key={x}>{x}</option>)}
                  </select>
                </Campo>
              </div>
              <Campo label="Famílias (quantas quiser)"><Multi value={r.familias ?? []} onChange={(v) => mudar({ familias: v })} opcoes={familias.map((f) => ({ v: f.id, l: (f.codigo ? f.codigo + ' ' : '') + f.nome }))} /></Campo>
              <Campo label="Objetivo"><AreaTexto value={r.objetivo} onChange={(v) => mudar({ objetivo: v })} rows={linhasDe(r.objetivo)} /></Campo>
              <Campo label="Referência estética"><AreaTexto value={r.referencia} onChange={(v) => mudar({ referencia: v })} rows={linhasDe(r.referencia, 2)} /></Campo>
              <Campo label="Fonte"><Texto value={r.fonte} onChange={(v) => mudar({ fonte: v })} /></Campo>
              <Campo label="Densidade medida da suspensão (g/ml)"><Numero value={r.densidade} onChange={(v) => mudar({ densidade: v })} placeholder="opcional" /></Campo>
              <Campo label="Texturas e tags"><Tags value={r.tags ?? []} onChange={(v) => mudar({ tags: v })} sugestoes={TEXTURAS_AUTORAIS} /></Campo>
              <Campo label="Esmalte vinculado">
                <select className="input" value={r.esmalteId ?? ''} onChange={(e) => mudar({ esmalteId: e.target.value || undefined })}>
                  <option value="">Nenhum</option>{(esmaltes ?? []).map((e) => <option key={e.id} value={e.id}>{e.codigo} · {e.nome}</option>)}
                </select>
              </Campo>
              <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14 }}>
                <input type="checkbox" checked={!!r.ehBase} onChange={(e) => mudar({ ehBase: e.target.checked ? 1 : 0 })} /> Base reutilizável
              </label>
            </div>
          </details>

          {variacoes.length > 0 && <div>
            <p className="eyebrow" style={{ marginBottom: 8 }}>Variações desta receita</p>
            <div className="lista">{variacoes.map((v) => <Link key={v.id} to={`/receitas/${v.id}`} style={{ gridTemplateColumns: '1fr auto' }}><span className="t" style={{ fontSize: 18 }}>{v.nome}</span><span className="faint">v{v.versaoAtual}</span></Link>)}</div>
          </div>}

          <Relacoes tipo="receita" id={r.id} extras={r.ingredientes.filter((i) => i.materialId && mapa.get(i.materialId)).map((i) => ({ tipo: 'material' as const, id: i.materialId!, titulo: i.nome, sub: mapa.get(i.materialId!)!.categoria, to: `/materiais/${i.materialId}` }))} />
        </aside>
      </div>
      <GaleriaPecas titulo="Peças com esta receita" fotos={r.pecas ?? []} onChange={(v) => mudar({ pecas: v })} />

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

import type { Material } from '../../db/schema'
function Resumo({ r, pesoBase, comPeso, mapa, custoTotal, faltando }: { r: R; pesoBase: number; comPeso: (Ingrediente & { peso: number })[]; mapa: Map<string, Material>; custoTotal: number; faltando: string[] }) {
  const seco = pesoBase * (1 + somaExtras(r.ingredientes) / 100)
  const agua = r.aguaMlPor100g ? (r.aguaMlPor100g * pesoBase) / 100 : 0
  const liquido = seco + agua
  const linha = (l: string, v: string, forte = false) => <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '4px 0', fontWeight: forte ? 600 : 400 }}><span className={forte ? '' : 'muted'}>{l}</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{v}</span></div>
  const porIng = comPeso.map((i) => { const m = i.materialId ? mapa.get(i.materialId) : undefined; return { i, m, custo: m?.precoKg != null ? (i.peso / 1000) * m.precoKg : undefined } })
  const estimado = porIng.some((x) => x.m?.precoEstimado)
  const semEstoque = porIng.filter((x) => x.m && x.m.estoqueKg != null && x.m.estoqueKg * 1000 < x.i.peso)
  return (
    <div style={{ fontSize: 14 }}>
      {linha('Peso total seco', fmt(seco, 1) + ' g', true)}
      {linha('Água', agua ? fmt(agua, 0) + ' g' : '–')}
      {linha('Mistura líquida estimada', agua ? fmt(liquido, 0) + ' g' : '–')}
      {linha('Sólidos', agua ? fmt((seco / liquido) * 100, 1) + ' %' : '–')}
      {linha('Volume', r.densidade && agua ? fmt(liquido / r.densidade, 0) + ' ml' : 'informe a densidade')}
      <hr className="divider" style={{ margin: '12px 0' }} />
      {linha('Custo total', brl(custoTotal), true)}
      {linha('Custo por 100 g', seco ? brl((custoTotal / seco) * 100) : '–')}
      {linha('Custo por kg', seco ? brl((custoTotal / seco) * 1000) : '–')}
      {estimado && <p className="faint" style={{ fontSize: 12, marginTop: 4 }}>Inclui preços estimados (lista de compras), ainda não confirmados.</p>}
      {faltando.length > 0 && <p className="faint" style={{ fontSize: 12, marginTop: 4 }}>Sem preço: {faltando.filter(Boolean).join(', ') || 'ingredientes sem nome'}.</p>}
      <details style={{ marginTop: 8 }}>
        <summary className="faint" style={{ fontSize: 13, cursor: 'pointer', minHeight: 32 }}>Custo e estoque por ingrediente</summary>
        {porIng.map(({ i, m, custo }, k) => (
          <div key={k} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--line)', fontSize: 13 }}>
            <span>{i.nome || '—'}</span><span className="muted">{fmt(i.peso, 1)} g</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{brl(custo)}</span>
            {m && <span className="faint" style={{ gridColumn: '1 / -1', fontSize: 12 }}>Estoque: {m.estoqueKg != null ? fmt(m.estoqueKg * 1000, 0) + ' g' : 'não informado'}{m.estoqueKg != null && m.estoqueKg * 1000 < i.peso ? ' · insuficiente para este lote' : ''}</span>}
          </div>
        ))}
      </details>
      {semEstoque.length > 0 && <p className="aviso" style={{ marginTop: 10, fontSize: 13 }}>Estoque insuficiente: {semEstoque.map((x) => x.i.nome).join(', ')}.</p>}
    </div>
  )
}
