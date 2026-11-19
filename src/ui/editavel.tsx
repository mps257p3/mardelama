import { useEffect, useState } from 'react'
import { Check, Pencil, Plus, X } from 'lucide-react'

/** Texto que se edita no lugar: mostra o valor e, ao tocar no lápis, vira campo. */
export function TextoEditavel({ valor, onSalvar, multilinha, vazio = 'Sem informação', rotulo }: {
  valor?: string; onSalvar: (v: string) => unknown; multilinha?: boolean; vazio?: string; rotulo: string
}) {
  const [ed, setEd] = useState(false)
  const [v, setV] = useState(valor ?? '')
  useEffect(() => { if (!ed) setV(valor ?? '') }, [valor, ed])
  if (!ed) return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <p className={valor ? 'muted' : 'faint'} style={{ whiteSpace: 'pre-wrap', flex: 1, margin: 0 }}>{valor || vazio}</p>
      <button type="button" className="iconbtn" aria-label={`Editar ${rotulo}`} onClick={() => setEd(true)}><Pencil size={15} /></button>
    </div>
  )
  const salvar = async () => { await onSalvar(v.trim()); setEd(false) }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {multilinha
        ? <textarea className="input" rows={4} autoFocus value={v} onChange={(e) => setV(e.target.value)} aria-label={rotulo} />
        : <input className="input" autoFocus value={v} onChange={(e) => setV(e.target.value)} aria-label={rotulo} onKeyDown={(e) => { if (e.key === 'Enter') salvar() }} />}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" className="btn sm primary" onClick={salvar}><Check size={14} />Salvar</button>
        <button type="button" className="btn sm ghost" onClick={() => setEd(false)}>Cancelar</button>
      </div>
    </div>
  )
}

/** Lista de itens curtos (tópicos) que se adiciona e remove no lugar. */
export function ListaEditavel({ itens, onSalvar, vazio = 'Nenhum item.', rotulo, link }: {
  itens: string[]; onSalvar: (v: string[]) => unknown; vazio?: string; rotulo: string; link?: boolean
}) {
  const [novo, setNovo] = useState('')
  const add = () => { const x = novo.trim(); if (x) { onSalvar([...itens, x]); setNovo('') } }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {itens.length === 0 && <p className="faint" style={{ margin: 0 }}>{vazio}</p>}
      {itens.map((x, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', borderBottom: '1px solid var(--line)', padding: '4px 0' }}>
          {link && /^https?:\/\//.test(x)
            ? <a href={x} target="_blank" rel="noreferrer" style={{ flex: 1, textDecoration: 'underline', overflowWrap: 'anywhere', fontSize: 14.5 }}>{x}</a>
            : <span style={{ flex: 1, fontSize: 14.5 }}>{x}</span>}
          <button type="button" className="iconbtn" aria-label={`Remover ${x}`} onClick={() => onSalvar(itens.filter((_, j) => j !== i))}><X size={14} /></button>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <input className="input" placeholder={`Adicionar ${rotulo}`} value={novo} onChange={(e) => setNovo(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }} />
        <button type="button" className="btn sm" onClick={add} aria-label={`Adicionar ${rotulo}`}><Plus size={14} /></button>
      </div>
    </div>
  )
}
