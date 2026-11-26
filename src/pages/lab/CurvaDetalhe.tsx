import { Voltar } from '../../ui/Voltar'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Trash2, X } from 'lucide-react'
import { db, type Curva, type SegmentoCurva } from '../../db/schema'
import { pontosDaCurva, duracaoTexto } from '../../lib/curva'
import { GraficoCurva } from '../../ui/GraficoCurva'
import { TextoEditavel } from '../../ui/editavel'
import { Numero } from '../../ui/form'
import { Relacoes } from '../../ui/Relacoes'

export default function CurvaDetalhe() {
  const { id } = useParams()
  const nav = useNavigate()
  const c = useLiveQuery(() => db.curvas.get(id!), [id])
  const usos = useLiveQuery(async () => ({
    receitas: (await db.receitas.toArray()).filter((r) => !r.excluido && r.curvaId === id),
    comerciais: (await db.comerciais.toArray()).filter((r) => !r.excluido && r.curvaId === id),
  }), [id], { receitas: [], comerciais: [] })
  const [segs, setSegs] = useState<SegmentoCurva[]>()
  const [ini, setIni] = useState<number>()
  useEffect(() => { if (c) { setSegs(c.segmentos); setIni(c.tempInicial) } }, [c?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  if (c === undefined || !segs) return null
  if (!c || c.excluido) return <div className="page"><p>Curva não encontrada.</p></div>
  const salvar = (d: Partial<Curva>) => db.curvas.update(c.id, { ...d, atualizadoEm: Date.now() })
  const sujo = JSON.stringify(segs) !== JSON.stringify(c.segmentos) || ini !== c.tempInicial
  const pts = pontosDaCurva(ini ?? 25, segs.filter((s) => s.alvo > 0))
  const max = Math.max(...pts.map((p) => p.temp))
  const muda = (i: number, k: keyof SegmentoCurva) => (v?: number) => setSegs(segs.map((s, j) => (j === i ? { ...s, [k]: v ?? 0 } : s)))

  return (
    <div className="page" style={{ maxWidth: 860 }}>
      <Voltar to="/curvas">Curvas de queima</Voltar>
      <p className="eyebrow">{c.codigo}</p>
      <h1 style={{ marginTop: 8 }}>{c.nome}</h1>
      <p className="muted" style={{ marginTop: 6 }}>{[c.cone && `Cone ${c.cone}`, c.atmosfera, pts.length > 1 && `${max} °C`, pts.length > 1 && duracaoTexto(pts[pts.length - 1].min) + ' até o fim da última etapa', c.resfriamentoNatural ? 'depois resfriamento natural' : ''].filter(Boolean).join(' · ')}</p>
      {c.status && <p className="aviso" style={{ marginTop: 16 }}>{c.status}</p>}

      <div className="card" style={{ padding: 16, marginTop: 20 }}><GraficoCurva planejada={pts} /></div>

      <h3 style={{ marginTop: 28 }}>Etapas</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 44px', gap: 8, alignItems: 'end', marginTop: 10 }}>
        <span className="faint" style={{ fontSize: 12 }}>Rampa (°C/h)</span><span className="faint" style={{ fontSize: 12 }}>Até (°C)</span><span className="faint" style={{ fontSize: 12 }}>Patamar (min)</span><span />
        {segs.map((s, i) => (
          <Linha key={i}>
            <Numero value={s.taxa} onChange={muda(i, 'taxa')} aria-label={`Rampa da etapa ${i + 1}`} />
            <Numero value={s.alvo} onChange={muda(i, 'alvo')} aria-label={`Temperatura da etapa ${i + 1}`} />
            <Numero value={s.patamar} onChange={muda(i, 'patamar')} aria-label={`Patamar da etapa ${i + 1}`} />
            <button type="button" className="iconbtn" aria-label={`Remover etapa ${i + 1}`} onClick={() => setSegs(segs.filter((_, j) => j !== i))}><X size={15} /></button>
          </Linha>
        ))}
      </div>
      <p className="faint" style={{ fontSize: 12.5, marginTop: 8 }}>Rampa negativa = resfriamento controlado. Temperatura inicial do forno:</p>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 6 }}>
        <div style={{ width: 110 }}><Numero value={ini} onChange={setIni} aria-label="Temperatura inicial" /></div>
        <button type="button" className="btn sm" onClick={() => setSegs([...segs, { taxa: 100, alvo: (segs[segs.length - 1]?.alvo ?? 0) + 100, patamar: 0 }])}><Plus size={14} />Etapa</button>
        {sujo && <>
          <button type="button" className="btn sm primary" onClick={() => salvar({ segmentos: segs, tempInicial: ini ?? 25 })}>Salvar etapas</button>
          <button type="button" className="btn sm ghost" onClick={() => { setSegs(c.segmentos); setIni(c.tempInicial) }}>Desfazer</button>
        </>}
      </div>

      <div className="form" style={{ marginTop: 28 }}>
        <h3>Ficha</h3>
        <Campo rotulo="Nome"><TextoEditavel rotulo="nome" valor={c.nome} onSalvar={(v) => v && salvar({ nome: v })} /></Campo>
        <Campo rotulo="Código"><TextoEditavel rotulo="código" valor={c.codigo} onSalvar={(v) => v && salvar({ codigo: v })} /></Campo>
        <Campo rotulo="Cone"><TextoEditavel rotulo="cone" valor={c.cone} onSalvar={(v) => salvar({ cone: v || undefined })} /></Campo>
        <Campo rotulo="Atmosfera"><TextoEditavel rotulo="atmosfera" valor={c.atmosfera} onSalvar={(v) => salvar({ atmosfera: v || undefined })} /></Campo>
        <Campo rotulo="Situação"><TextoEditavel rotulo="situação" multilinha valor={c.status} onSalvar={(v) => salvar({ status: v || undefined })} /></Campo>
        <Campo rotulo="Fonte"><TextoEditavel rotulo="fonte" valor={c.fonte} onSalvar={(v) => salvar({ fonte: v || undefined })} /></Campo>
        <Campo rotulo="Observações"><TextoEditavel rotulo="observações" multilinha valor={c.observacoes} onSalvar={(v) => salvar({ observacoes: v || undefined })} /></Campo>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14.5 }}>
          <input type="checkbox" checked={!!c.resfriamentoNatural} onChange={(e) => salvar({ resfriamentoNatural: e.target.checked ? 1 : 0 })} /> Resfriamento natural depois da última etapa
        </label>
      </div>

      {(usos.receitas.length > 0 || usos.comerciais.length > 0) && <>
        <h3 style={{ marginTop: 28 }}>Usada em</h3>
        <div className="lista" style={{ marginTop: 8 }}>
          {usos.receitas.map((r) => <Link key={r.id} to={`/receitas/${r.id}`} style={{ gridTemplateColumns: '1fr auto' }}><span className="t">{r.nome}</span><span className="faint">{r.codigo}</span></Link>)}
          {usos.comerciais.map((r) => <Link key={r.id} to={`/engenharia-reversa/${r.id}`} style={{ gridTemplateColumns: '1fr auto' }}><span className="t">{r.fabricante} {r.nome}</span><span className="faint">{r.codigo}</span></Link>)}
        </div>
      </>}
      <div style={{ marginTop: 32 }}><Relacoes tipo="curva" id={c.id} /></div>
      <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn sm ghost" onClick={async () => { if (confirm('Excluir esta curva?')) { await salvar({ excluido: 1 }); nav('/curvas') } }}><Trash2 size={14} />Excluir curva</button>
      </div>
    </div>
  )
}

const Linha = ({ children }: { children: React.ReactNode }) => <>{children}</>
const Campo = ({ rotulo, children }: { rotulo: string; children: React.ReactNode }) => <div className="field"><label>{rotulo}</label>{children}</div>
