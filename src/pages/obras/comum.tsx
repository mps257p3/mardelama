import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Trash2, X } from 'lucide-react'
import { db, ETAPAS, novo, uid, type Base, type Etapa, type Observacao, type Peca, type Serie } from '../../db/schema'
import { salvarArquivo } from '../../db/files'
import { Foto } from '../../ui/form'
import { Visor } from '../../ui/GaleriaFotos'

/* Registros vindos de versões antigas podem não ter todos os campos: completa com o padrão. */
export const normPeca = (p: Peca): Peca => ({ ...p, titulo: p.titulo ?? 'Sem título', tipo: p.tipo ?? 'obra', etapa: (ETAPAS.some((e) => e.id === p.etapa) ? p.etapa : 'ideia') as Etapa, fotos: p.fotos ?? [], observacoes: p.observacoes ?? [], tags: p.tags ?? [] })
export const normSerie = (s: Serie): Serie => ({ ...s, nome: s.nome ?? 'Série sem nome', status: s.status ?? 'ativa', observacoes: s.observacoes ?? [], tags: s.tags ?? [] })

export const nomeEtapa = (e: Etapa) => ETAPAS.find((x) => x.id === e)?.nome ?? e
export const STATUS_SERIE: Record<Serie['status'], string> = { ativa: 'Em andamento', pausada: 'Pausada', concluida: 'Concluída' }

export async function novaPeca(dados: Partial<Peca> = {}) {
  const p = novo({ titulo: '', tipo: 'obra', etapa: 'ideia', fotos: [], observacoes: [], tags: [], ...dados } as Omit<Peca, keyof Base>)
  await db.entrada.add(p)
  return p.id
}
export async function novaSerie(nome = '') {
  const s = novo({ nome, status: 'ativa', observacoes: [], tags: [] } as Omit<Serie, keyof Base>)
  await db.projetos.add(s)
  return s.id
}

/** Título que se edita direto (sem lápis): grava ao sair do campo ou ao apertar Enter. */
export function CampoTitulo({ valor, onSalvar, placeholder, autoFocus }: { valor: string; onSalvar: (v: string) => unknown; placeholder: string; autoFocus?: boolean }) {
  const [v, setV] = useState(valor)
  const editando = useRef(false)
  useEffect(() => { if (!editando.current) setV(valor) }, [valor])
  const gravar = () => { editando.current = false; if (v.trim() !== valor) void onSalvar(v.trim()) }
  return <input className="campo-titulo" value={v} placeholder={placeholder} autoFocus={autoFocus} aria-label={placeholder}
    onFocus={() => { editando.current = true }} onChange={(e) => setV(e.target.value)} onBlur={gravar}
    onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }} />
}

const quando = (t: number) => new Date(t).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })

/** Diário do processo: registros datados, do mais recente ao mais antigo, com fotos. */
export function Diario({ itens, onChange, vazio = 'Nada registrado ainda.' }: { itens: Observacao[]; onChange: (v: Observacao[]) => unknown; vazio?: string }) {
  const [texto, setTexto] = useState('')
  const [fotos, setFotos] = useState<string[]>([])
  const [salvando, setSalvando] = useState(false)
  const [visor, setVisor] = useState<{ fotos: string[]; i: number }>()
  const arq = useRef<HTMLInputElement>(null)
  const ordem = [...itens].sort((a, b) => b.data - a.data)
  async function registrar() {
    if (!texto.trim() && !fotos.length) return
    await onChange([...itens, { id: uid(), data: Date.now(), texto: texto.trim(), fotos }])
    setTexto(''); setFotos([])
  }
  return (
    <div className="diario">
      <div className="diario-novo">
        <textarea className="input" rows={2} placeholder="O que aconteceu, o que observei, o que quero testar…" value={texto} onChange={(e) => setTexto(e.target.value)} />
        {fotos.length > 0 && <div className="diario-fotos">{fotos.map((f) => <span key={f} className="diario-foto"><Foto id={f} /><button aria-label="Tirar foto" onClick={() => setFotos(fotos.filter((x) => x !== f))}><X size={12} /></button></span>)}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn sm" disabled={salvando} onClick={() => arq.current?.click()}><ImagePlus size={14} />{salvando ? 'Salvando…' : 'Foto'}</button>
          <button className="btn sm primary" disabled={!texto.trim() && !fotos.length} onClick={registrar}>Registrar</button>
        </div>
        <input ref={arq} type="file" accept="image/*" multiple hidden onChange={async (e) => {
          const fs = Array.from(e.target.files ?? []); e.target.value = ''
          if (!fs.length) return
          setSalvando(true)
          const ids: string[] = []
          for (const f of fs) { try { ids.push(await salvarArquivo(f)) } catch { /* ignora a que falhar */ } }
          setFotos((x) => [...x, ...ids]); setSalvando(false)
        }} />
      </div>
      {ordem.length === 0 && <p className="faint" style={{ fontSize: 13.5 }}>{vazio}</p>}
      {ordem.map((o) => (
        <article key={o.id} className="diario-item">
          <div className="diario-data">{quando(o.data)}
            <button className="iconbtn" aria-label="Apagar registro" onClick={async () => { if (confirm('Apagar este registro?')) await onChange(itens.filter((x) => x.id !== o.id)) }}><Trash2 size={13} /></button>
          </div>
          {o.texto && <p>{o.texto}</p>}
          {!!o.fotos?.length && <div className="diario-fotos">{o.fotos.map((f, i) => <button key={f} className="diario-foto" onClick={() => setVisor({ fotos: o.fotos!, i })}><Foto id={f} /></button>)}</div>}
        </article>
      ))}
      {visor && <Visor fotos={visor.fotos} inicio={visor.i} onClose={() => setVisor(undefined)} />}
    </div>
  )
}

/** Cartão de peça para as grades. */
export function CartaoPeca({ p, serie }: { p: Peca; serie?: Serie }) {
  const ultima = p.observacoes.length ? Math.max(...p.observacoes.map((o) => o.data)) : undefined
  return (
    <>
      <span className="ph">{p.fotos[0] ? <Foto id={p.fotos[0]} /> : <span className="obra-sem"><span>{p.tipo === 'estudo' ? 'Estudo' : 'Sem foto'}</span></span>}</span>
      <span className="t">{p.titulo || 'Sem título'}</span>
      <span className="s">{[p.etapa !== 'pronta' ? nomeEtapa(p.etapa) : p.ano, serie?.nome, ultima ? 'registro em ' + quando(ultima) : ''].filter(Boolean).join(' · ')}</span>
    </>
  )
}
