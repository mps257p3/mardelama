import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Printer } from 'lucide-react'
import { db, novo, uid, type Esmalte, type Ingrediente, type Receita } from '../../db/schema'
import { proximosCodigosTeste } from '../../db/codigos'
import { useEsmaltes, useMateriais, useReceitas } from '../../db/hooks'
import { CONES, fmt } from '../../lib/opcoes'
import { CLASSES, misturar } from '../../lib/receita'
import { Campo, Multi, Numero } from '../../ui/form'
import { useToast } from '../../ui/toast'

type Modo = 'linear' | 'corante' | 'mistura' | 'triaxial' | 'temperatura' | 'sobreposicao'
const MODOS: { v: Modo; l: string; d: string }[] = [
  { v: 'linear', l: 'Teste linear', d: 'Varia um ingrediente da receita em passos regulares.' },
  { v: 'corante', l: 'Concentração de corante', d: 'Adiciona um corante em várias concentrações sobre a mesma base.' },
  { v: 'mistura', l: 'Mistura de dois esmaltes', d: 'De 100% A até 100% B, em passos.' },
  { v: 'triaxial', l: 'Mistura triaxial', d: 'Todas as combinações entre três esmaltes numa grade triangular.' },
  { v: 'temperatura', l: 'Variação de temperatura', d: 'O mesmo esmalte queimado em cones diferentes.' },
  { v: 'sobreposicao', l: 'Sobreposição', d: 'Cada esmalte aplicado sobre cada um dos outros.' },
]

interface Item { descricao: string; esmalteId?: string; cone?: string; temperatura?: number; combinacao?: string[]; receita?: { nome: string; ingredientes: Ingrediente[]; origemId?: string } }

const passos = (min: number, max: number, n: number) => Array.from({ length: n }, (_, i) => +(min + ((max - min) * i) / Math.max(1, n - 1)).toFixed(3))

export default function Planejar() {
  const toast = useToast()
  const esmaltes = useEsmaltes() ?? []
  const receitas = useReceitas() ?? []
  const materiais = useMateriais() ?? []
  const [modo, setModo] = useState<Modo>('linear')
  const [recId, setRecId] = useState('')
  const [ing, setIng] = useState('')
  const [min, setMin] = useState<number | undefined>(0)
  const [max, setMax] = useState<number | undefined>(10)
  const [n, setN] = useState<number | undefined>(5)
  const [ids, setIds] = useState<string[]>([])
  const [cones, setCones] = useState<string[]>(['5', '6', '7'])
  const [criados, setCriados] = useState<{ codigo: string; descricao: string }[]>()

  const rec = receitas.find((r) => r.id === recId)
  const esm = (id?: string) => esmaltes.find((e) => e.id === id)
  const recDe = (e?: Esmalte): Receita | undefined => receitas.find((r) => r.id === e?.receitaId)

  const itens: Item[] = useMemo(() => {
    const N = Math.max(1, Math.min(40, n ?? 1))
    if ((modo === 'linear' || modo === 'corante') && rec && ing.trim()) {
      return passos(min ?? 0, max ?? 0, N).map((v) => {
        const classe = modo === 'corante' ? 'corante' : (rec.ingredientes.find((i) => i.nome === ing)?.classe ?? 'aditivo')
        const existe = rec.ingredientes.some((i) => i.nome === ing)
        const ingredientes = existe ? rec.ingredientes.map((i) => (i.nome === ing ? { ...i, percentual: v } : i))
          : [...rec.ingredientes, { nome: ing, percentual: v, classe, materialId: materiais.find((m) => m.nome === ing)?.id }]
        return { descricao: `${ing} ${fmt(v, 2)}%`, esmalteId: rec.esmalteId, receita: { nome: `${rec.nome} · ${ing} ${fmt(v, 2)}%`, ingredientes, origemId: rec.id } }
      })
    }
    if (modo === 'mistura' && ids.length >= 2) {
      const [a, b] = [esm(ids[0]), esm(ids[1])]; const [ra, rb] = [recDe(a), recDe(b)]
      return passos(100, 0, N).map((pa) => ({
        descricao: `${fmt(pa, 0)}% ${a?.nome} + ${fmt(100 - pa, 0)}% ${b?.nome}`,
        receita: ra && rb ? { nome: `Mistura ${fmt(pa, 0)} ${a?.codigo} / ${fmt(100 - pa, 0)} ${b?.codigo}`, ingredientes: misturar(ra.ingredientes, rb.ingredientes, pa / 100) } : undefined,
      }))
    }
    if (modo === 'triaxial' && ids.length >= 3) {
      const [a, b, c] = ids.slice(0, 3).map(esm); const [ra, rb, rc] = [a, b, c].map(recDe)
      const out: Item[] = []
      for (let i = N; i >= 0; i--) for (let j = N - i; j >= 0; j--) {
        const k = N - i - j; const [pa, pb, pc] = [i, j, k].map((x) => (x * 100) / N)
        out.push({
          descricao: `${fmt(pa, 0)}% A · ${fmt(pb, 0)}% B · ${fmt(pc, 0)}% C`,
          receita: ra && rb && rc ? { nome: `Triaxial ${a?.codigo}/${b?.codigo}/${c?.codigo} ${fmt(pa, 0)}-${fmt(pb, 0)}-${fmt(pc, 0)}`, ingredientes: pa + pb ? misturar(misturar(ra.ingredientes, rb.ingredientes, pa / (pa + pb || 1)), rc.ingredientes, (pa + pb) / 100) : rc.ingredientes } : undefined,
        })
      }
      return out
    }
    if (modo === 'temperatura' && ids[0]) return cones.map((c) => ({ descricao: `${esm(ids[0])?.nome} · cone ${c}`, esmalteId: ids[0], cone: c, temperatura: CONES.find((x) => x.cone === c)?.c }))
    if (modo === 'sobreposicao' && ids.length >= 2) {
      const out: Item[] = []
      for (const top of ids) for (const base of ids) if (top !== base) out.push({ descricao: `${esm(top)?.nome} sobre ${esm(base)?.nome}`, esmalteId: top, combinacao: [base] })
      return out
    }
    return []
  }, [modo, rec, ing, min, max, n, ids, cones, materiais, esmaltes, receitas]) // eslint-disable-line react-hooks/exhaustive-deps

  async function criar() {
    const codigos = await proximosCodigosTeste(itens.length)
    const planoId = uid(); const hoje = new Date().toISOString().slice(0, 10)
    const nomeModo = MODOS.find((m) => m.v === modo)!.l
    await db.transaction('rw', db.testes, db.receitas, db.versoes, async () => {
      for (let i = 0; i < itens.length; i++) {
        const it = itens[i]; let receitaId: string | undefined
        if (it.receita) {
          const r = novo({ nome: it.receita.nome, ingredientes: it.receita.ingredientes, origemId: it.receita.origemId, versaoAtual: 1, ehBase: 0 as const, esmalteId: it.esmalteId, observacoes: `Gerada pelo plano "${nomeModo}" (${codigos[i]}).` })
          await db.receitas.add(r); receitaId = r.id
          await db.versoes.add({ id: uid(), receitaId: r.id, versao: 1, criadoEm: Date.now(), nota: 'Gerada por plano de experimento', snapshot: { ...r } })
        }
        const e = esm(it.esmalteId)
        await db.testes.add(novo({
          codigo: codigos[i], fotos: [], data: hoje, planejado: 1 as const, planoId, descricaoPlano: it.descricao,
          esmalteId: it.esmalteId, receitaId: receitaId ?? e?.receitaId, receitaVersao: receitaId ? 1 : recDe(e)?.versaoAtual,
          cone: it.cone ?? e?.cone, temperatura: it.temperatura ?? e?.temperatura, combinacao: it.combinacao ?? [], defeitos: [],
          observacoes: `Plano: ${nomeModo}.`,
        }))
      }
    })
    setCriados(itens.map((it, i) => ({ codigo: codigos[i], descricao: it.descricao })))
    toast(`${itens.length} testes planejados`)
  }

  if (criados) return (
    <div className="page" style={{ maxWidth: 760 }}>
      <Link to="/testes" className="back"><ArrowLeft size={15} />Testes</Link>
      <h1>Placas a preparar</h1>
      <p className="muted" style={{ marginTop: 8 }}>Inscreva cada código na placa correspondente. Os testes ficam como "planejados" até você registrar o resultado.</p>
      <table className="tabela" style={{ marginTop: 24 }}><thead><tr><th>Código</th><th>Composição</th></tr></thead>
        <tbody>{criados.map((c) => <tr key={c.codigo}><td className="codigo">{c.codigo}</td><td>{c.descricao}</td></tr>)}</tbody></table>
      <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
        <button className="btn" onClick={() => window.print()}><Printer size={15} />Imprimir lista</button>
        <Link className="btn primary" to="/testes">Ver testes</Link>
      </div>
    </div>
  )

  const precisaReceita = modo === 'linear' || modo === 'corante'
  const minEsm = { mistura: 2, triaxial: 3, temperatura: 1, sobreposicao: 2 } as Record<Modo, number>
  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <Link to="/testes" className="back"><ArrowLeft size={15} />Testes</Link>
      <p className="eyebrow">Laboratório</p>
      <h1 style={{ marginTop: 8 }}>Planejar experimento</h1>
      <div className="quick" style={{ marginTop: 24 }}>
        {MODOS.map((m) => <button key={m.v} onClick={() => { setModo(m.v); setIds([]) }} style={modo === m.v ? { borderColor: 'var(--ink)' } : undefined}><span>{m.l}<small>{m.d}</small></span></button>)}
      </div>

      <div className="form" style={{ marginTop: 28 }}>
        {precisaReceita ? <>
          <Campo label="Receita de partida">
            <select className="input" value={recId} onChange={(e) => { setRecId(e.target.value); setIng('') }}>
              <option value="">Escolha…</option>{receitas.map((r) => <option key={r.id} value={r.id}>{r.nome} (v{r.versaoAtual})</option>)}
            </select>
          </Campo>
          <Campo label={modo === 'corante' ? 'Corante' : 'Ingrediente a variar'}>
            <input className="input" list="plan-ing" value={ing} onChange={(e) => setIng(e.target.value)} placeholder={modo === 'corante' ? 'Ex.: Óxido de cobalto' : ''} />
            <datalist id="plan-ing">{(modo === 'linear' ? rec?.ingredientes.map((i) => i.nome) ?? [] : materiais.filter((m) => /óxido|carbonato|pigmento|corante/i.test(m.nome + m.categoria)).map((m) => m.nome)).map((x) => <option key={x} value={x} />)}</datalist>
          </Campo>
          <Campo label="De (%)"><Numero value={min} onChange={setMin} /></Campo>
          <Campo label="Até (%)"><Numero value={max} onChange={setMax} /></Campo>
          <Campo label="Número de passos"><Numero value={n} onChange={setN} /></Campo>
          {rec && modo === 'linear' && ing && !rec.ingredientes.some((i) => i.nome === ing) && <p className="aviso" style={{ gridColumn: '1/-1' }}>"{ing}" não está na receita; será adicionado como aditivo ({CLASSES[3].l.toLowerCase()}).</p>}
        </> : <>
          <Campo label={`Esmaltes (mínimo ${minEsm[modo]}${modo === 'mistura' || modo === 'triaxial' ? ', na ordem A, B' + (modo === 'triaxial' ? ', C' : '') : ''})`} wide>
            <Multi value={ids} onChange={(v) => setIds(modo === 'temperatura' ? v.slice(-1) : v)} opcoes={esmaltes.map((e) => ({ v: e.id, l: `${e.codigo} · ${e.nome}` }))} />
          </Campo>
          {(modo === 'mistura' || modo === 'triaxial') && <Campo label={modo === 'triaxial' ? 'Divisões por lado' : 'Número de passos'}><Numero value={n} onChange={setN} /></Campo>}
          {modo === 'temperatura' && <Campo label="Cones" wide><Multi value={cones} onChange={setCones} opcoes={CONES.filter((c) => c.c >= 900).map((c) => ({ v: c.cone, l: `${c.cone} · ${c.c}°` }))} /></Campo>}
          {(modo === 'mistura' || modo === 'triaxial') && ids.length >= minEsm[modo] && ids.slice(0, minEsm[modo]).some((i) => !recDe(esm(i))) &&
            <p className="aviso" style={{ gridColumn: '1/-1' }}>Nem todos os esmaltes têm receita vinculada. Os testes serão criados, mas sem gerar as receitas misturadas.</p>}
        </>}
        {esmaltes.length === 0 && !precisaReceita && <p className="aviso" style={{ gridColumn: '1/-1' }}>Cadastre esmaltes primeiro para usar este plano.</p>}
      </div>

      {itens.length > 0 && <>
        <h3 style={{ marginTop: 36 }}>{itens.length} placas</h3>
        {modo === 'triaxial' ? <Triangulo n={Math.max(1, Math.min(40, n ?? 1))} itens={itens} /> : (
          <div className="pills" style={{ marginTop: 14 }}>{itens.map((it, i) => <span key={i} className="chip">{it.descricao}</span>)}</div>
        )}
        <div className="barra-salvar"><button className="btn primary" onClick={criar}>Criar {itens.length} testes planejados</button></div>
      </>}
    </div>
  )
}

function Triangulo({ n, itens }: { n: number; itens: Item[] }) {
  let k = 0
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginTop: 18, overflowX: 'auto' }}>
      <span className="eyebrow">A</span>
      {Array.from({ length: n + 1 }, (_, linha) => (
        <div key={linha} style={{ display: 'flex', gap: 6 }}>
          {Array.from({ length: linha + 1 }, () => { const it = itens[k++]; return <div key={k} title={it?.descricao} style={{ width: 54, height: 40, borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--line-strong)', fontSize: 9.5, display: 'grid', placeItems: 'center', textAlign: 'center', lineHeight: 1.15, color: 'var(--ink-2)' }}>{it?.descricao.replace(/% [ABC]/g, '').replace(/ · /g, '/')}</div> })}
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: (n + 1) * 60 }}><span className="eyebrow">B</span><span className="eyebrow">C</span></div>
    </div>
  )
}
