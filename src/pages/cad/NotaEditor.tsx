import { Voltar } from '../../ui/Voltar'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { PenTool, Plus, Trash2, X } from 'lucide-react'
import { db, novo, type Nota } from '../../db/schema'
import { excluir } from '../../db/hooks'
import { salvarArquivo } from '../../db/files'
import { Campo, Fotos, Sugestao, Tags } from '../../ui/form'
import { TextoRico } from '../../ui/rich'
import { Arquivos, Audio, Gravador } from '../../ui/arquivos'
import { Desenho } from '../../ui/Desenho'
import { Relacoes } from '../../ui/Relacoes'

export const notaVazia = (x: Nota) => !x.titulo?.trim() && !x.corpo.replace(/<[^>]+>|&nbsp;/g, '').trim() && !x.imagens.length && !x.audios.length && !x.arquivos.length && !x.links?.length && !x.paleta?.length && !x.tags.length && !x.tema

export async function novaNota() {
  const n = novo({ corpo: '', imagens: [], arquivos: [], audios: [], tags: [], paleta: [], links: [] })
  await db.notas.add(n); return n.id
}

export default function NotaEditor() {
  const { id } = useParams()
  const nav = useNavigate()
  const original = useLiveQuery(() => db.notas.get(id!), [id])
  const temas = useLiveQuery(async () => [...new Set((await db.notas.toArray()).map((n) => n.tema).filter(Boolean) as string[])], [], [])
  const [n, setN] = useState<Nota>()
  const [desenho, setDesenho] = useState(false)
  const [link, setLink] = useState('')
  const sujo = useRef(false)
  const [salvo, setSalvo] = useState(true)

  useEffect(() => { if (original && (!n || n.id !== original.id)) setN(original) }, [original, n])
  // anotação aberta e deixada em branco não fica no caderno
  const atual = useRef(n); atual.current = n
  useEffect(() => () => {
    const x = atual.current
    if (x && notaVazia(x)) db.notas.update(x.id, { excluido: 1, atualizadoEm: Date.now() })
  }, [id])
  useEffect(() => {
    if (!n || !sujo.current) return
    setSalvo(false)
    const h = setTimeout(async () => { await db.notas.put({ ...n, atualizadoEm: Date.now() }); sujo.current = false; setSalvo(true) }, 600)
    return () => clearTimeout(h)
  }, [n])

  if (original === undefined || !n) return null
  if (!original || original.excluido) return <div className="page"><p>Anotação não encontrada.</p></div>
  const set = <K extends keyof Nota>(k: K) => (v: Nota[K]) => { sujo.current = true; setN((x) => x && { ...x, [k]: v }) }
  const d = new Date(n.criadoEm)

  return (
    <div className="page" style={{ maxWidth: 820 }}>
      <Voltar to="/caderno">Caderno</Voltar>
      <p className="eyebrow">{d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · <span style={{ textTransform: 'none', letterSpacing: 0 }}>{salvo ? 'salvo' : 'salvando…'}</span></p>
      <input className="serif" value={n.titulo ?? ''} placeholder="Título (opcional)" onChange={(e) => set('titulo')(e.target.value)}
        style={{ fontSize: 'clamp(32px,4vw,44px)', border: 0, background: 'none', width: '100%', padding: 0, margin: "8px 0 16px", outline: 'none', color: 'var(--ink)' }} />
      <TextoRico value={n.corpo} onChange={set('corpo')} placeholder="O que você está pensando, pesquisando, descobrindo?" />

      <div className="form" style={{ marginTop: 28 }}>
        <Campo label="Imagens e desenhos" wide>
          <Fotos value={n.imagens} onChange={set('imagens')} />
          <div><button type="button" className="btn sm" onClick={() => setDesenho(true)}><PenTool size={14} />Desenhar</button></div>
        </Campo>
        <Campo label="Paleta de cores" wide>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {(n.paleta ?? []).map((c, i) => (
              <span key={i} style={{ position: 'relative' }}>
                <input type="color" value={c} onChange={(e) => set('paleta')(n.paleta!.map((x, j) => (j === i ? e.target.value : x)))} style={{ width: 44, height: 44, border: 0, padding: 0, background: 'none' }} />
                <button type="button" aria-label="Remover" onClick={() => set('paleta')(n.paleta!.filter((_, j) => j !== i))} style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: 9, border: 0, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', padding: 0 }}><X size={10} /></button>
              </span>
            ))}
            <button type="button" className="btn sm" onClick={() => set('paleta')([...(n.paleta ?? []), '#CBAB8F'])}><Plus size={14} />Cor</button>
          </div>
        </Campo>
        <Campo label="Áudios" wide>
          {n.audios.map((a) => <Audio key={a} id={a} onRemove={() => set('audios')(n.audios.filter((x) => x !== a))} />)}
          <Gravador onPronto={(id) => { sujo.current = true; setN((x) => x && { ...x, audios: [...x.audios, id] }) }} />
        </Campo>
        <Campo label="Links" wide>
          {(n.links ?? []).map((l) => <div key={l} style={{ display: 'flex', gap: 6, alignItems: 'center' }}><a href={l} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', color: 'var(--azul)', overflowWrap: 'anywhere' }}>{l}</a><button type="button" className="iconbtn" aria-label="Remover link" onClick={() => set('links')(n.links!.filter((x) => x !== l))}><X size={14} /></button></div>)}
          <form style={{ display: 'flex', gap: 8 }} onSubmit={(e) => { e.preventDefault(); if (link.trim()) { set('links')([...(n.links ?? []), link.trim()]); setLink('') } }}>
            <input className="input" type="url" placeholder="https://" value={link} onChange={(e) => setLink(e.target.value)} /><button className="btn sm"><Plus size={14} />Link</button>
          </form>
        </Campo>
        <Campo label="Arquivos" wide><Arquivos value={n.arquivos} onChange={set('arquivos')} /></Campo>
        <Campo label="Tema"><Sugestao id="temas" value={n.tema} onChange={set('tema')} opcoes={temas} /></Campo>
        <Campo label="Tags"><Tags value={n.tags} onChange={set('tags')} /></Campo>
      </div>

      <div style={{ marginTop: 32 }}><Relacoes tipo="nota" id={n.id} /></div>
      <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn sm ghost" onClick={async () => { if (confirm('Excluir esta anotação?')) { await excluir('notas', n.id); nav('/caderno') } }}><Trash2 size={14} />Excluir anotação</button>
      </div>
      {desenho && <Desenho onClose={() => setDesenho(false)} onSalvar={async (f) => { const id = await salvarArquivo(f); sujo.current = true; setN((x) => x && { ...x, imagens: [...x.imagens, id] }); setDesenho(false) }} />}
    </div>
  )
}
