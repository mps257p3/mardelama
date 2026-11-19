import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Pipette, Plus, X } from 'lucide-react'
import { db, novo, type Referencia } from '../../db/schema'
import { useGrupos } from '../../db/hooks'
import { extrairPaleta } from '../../lib/paleta'
import { TIPOS_REF } from '../../lib/refs'
import { AreaTexto, Campo, Escolha, Fotos, Multi, Tags, Texto } from '../../ui/form'
import { useToast } from '../../ui/toast'

type R = Omit<Referencia, 'id' | 'criadoEm' | 'atualizadoEm'> & { id?: string }

export default function ReferenciaForm() {
  const { id } = useParams()
  const [sp] = useSearchParams()
  const nav = useNavigate()
  const toast = useToast()
  const grupos = useGrupos()
  const [r, setR] = useState<R>()
  const [novoG, setNovoG] = useState('')

  useEffect(() => {
    (async () => {
      if (id) { setR(await db.referencias.get(id)); return }
      // dados vindos do compartilhamento de outros apps (/compartilhar)
      const texto = sp.get('text') ?? ''
      const url = sp.get('url') || texto.match(/https?:\/\/\S+/)?.[0] || undefined
      const foto = sp.get('foto')
      const imagens = foto ? [foto] : []
      const base: R = { titulo: sp.get('title') ?? '', tipo: url || sp.get('link') ? 'Link' : 'Fotografia', imagens, tags: [], grupos: [], url, descricao: texto.replace(url ?? '', '').trim() || undefined }
      if (foto) { const a = await db.arquivos.get(foto); if (a) base.paleta = await extrairPaleta(a.blob, 5) }
      setR(base)
    })()
  }, [id, sp])

  if (!r) return null
  const set = <K extends keyof Referencia>(k: K) => (v: Referencia[K]) => setR({ ...r, [k]: v })

  async function paletaDaImagem(imagens = r!.imagens) {
    const a = imagens[0] ? await db.arquivos.get(imagens[0]) : undefined
    if (!a) { toast('Adicione uma imagem primeiro'); return }
    const p = await extrairPaleta(a.blob, 5)
    setR((x) => x && { ...x, imagens, paleta: p })
  }

  async function salvar() {
    if (!r) return
    const titulo = r.titulo.trim() || (r.url ? new URL(r.url).hostname : 'Sem título')
    if (r.id) { await db.referencias.put({ ...(r as Referencia), titulo, atualizadoEm: Date.now() }); nav(`/referencias/${r.id}`, { replace: true }) }
    else { const x = novo({ ...r, titulo }); await db.referencias.add(x); nav(`/referencias/${x.id}`, { replace: true }) }
    toast('Referência salva')
  }

  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <Link to={r.id ? `/referencias/${r.id}` : '/referencias'} className="back"><ArrowLeft size={15} />Voltar</Link>
      <p className="eyebrow">{r.id ? 'Editar referência' : 'Nova referência'}</p>
      <h1 style={{ marginTop: 8, marginBottom: 28 }}>{r.titulo || 'Sem título'}</h1>
      <div className="form">
        <Campo label="Imagens" wide><Fotos value={r.imagens} onChange={(v) => { const primeira = !r.imagens.length && v.length; setR({ ...r, imagens: v }); if (primeira && !r.paleta?.length) paletaDaImagem(v) }} /></Campo>
        <Campo label="Título"><Texto value={r.titulo} onChange={set('titulo')} autoFocus={!r.id && !sp.get('link')} /></Campo>
        <Campo label="Autor ou artista"><Texto value={r.autor} onChange={set('autor')} /></Campo>
        <Campo label="Tipo" wide><Escolha value={r.tipo} onChange={set('tipo')} opcoes={TIPOS_REF.map((v) => ({ v, l: v }))} /></Campo>
        <Campo label="Link (site, vídeo, perfil)"><Texto value={r.url} onChange={set('url')} type="url" placeholder="https://" autoFocus={!r.id && !!sp.get('link')} /></Campo>
        <Campo label="Fonte"><Texto value={r.fonte} onChange={set('fonte')} placeholder="Livro, museu, exposição…" /></Campo>
        <Campo label="Grupos (quantos quiser)" wide>
          <Multi value={r.grupos} onChange={set('grupos')} opcoes={grupos.map((g) => ({ v: g.id, l: g.nome }))} />
          <form style={{ display: 'flex', gap: 8, marginTop: 6 }} onSubmit={async (e) => {
            e.preventDefault(); const nome = novoG.trim(); if (!nome) return
            const g = novo({ nome }); await db.grupos.add(g); setR({ ...r, grupos: [...r.grupos, g.id] }); setNovoG('')
          }}><input className="input" placeholder="Criar novo grupo" value={novoG} onChange={(e) => setNovoG(e.target.value)} /><button className="btn sm"><Plus size={14} />Criar</button></form>
        </Campo>
        <Campo label="Paleta cromática" wide>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {(r.paleta ?? []).map((c, i) => (
              <label key={i} style={{ position: 'relative' }}>
                <input type="color" value={c} onChange={(e) => set('paleta')(r.paleta!.map((x, j) => (j === i ? e.target.value.toUpperCase() : x)))} style={{ width: 44, height: 44, border: 0, padding: 0, background: 'none' }} />
                <button type="button" aria-label="Remover cor" onClick={() => set('paleta')(r.paleta!.filter((_, j) => j !== i))} style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: 9, border: 0, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', padding: 0 }}><X size={10} /></button>
              </label>
            ))}
            <button type="button" className="btn sm" onClick={() => set('paleta')([...(r.paleta ?? []), '#B46E4B'])}><Plus size={14} />Cor</button>
            <button type="button" className="btn sm" onClick={() => paletaDaImagem()}><Pipette size={14} />Extrair da imagem</button>
          </div>
        </Campo>
        <Campo label="Descrição" wide><AreaTexto value={r.descricao} onChange={set('descricao')} rows={3} /></Campo>
        <Campo label="Comentários pessoais" wide><AreaTexto value={r.comentarios} onChange={set('comentarios')} rows={4} /></Campo>
        <Campo label="Tags" wide><Tags value={r.tags} onChange={set('tags')} /></Campo>
      </div>
      <div className="barra-salvar"><button className="btn ghost" onClick={() => nav(-1)}>Cancelar</button><button className="btn primary" onClick={salvar}>Salvar referência</button></div>
    </div>
  )
}
