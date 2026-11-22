import { useEffect, useRef, useState } from 'react'
import { cabecalhoLogin } from '../../../lib/login'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ImagePlus, Link2 } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, novo, type Obra } from '../../../db/schema'
import { salvarArquivo } from '../../../db/files'
import { vivos } from '../../../lib/artistas'
import { Campo, Tags, Texto, AreaTexto } from '../../../ui/form'
import { useToast } from '../../../ui/toast'
import { ImgObra } from './ImgObra'

type O = Omit<Obra, 'id' | 'criadoEm' | 'atualizadoEm'> & { id?: string }
const ehImagem = (u: string) => /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(u)

export default function ObraForm() {
  const { id } = useParams()
  const [sp] = useSearchParams()
  const nav = useNavigate()
  const toast = useToast()
  const artistas = useLiveQuery(async () => vivos(await db.artistas.orderBy('nome').toArray()), [], [])
  const [o, setO] = useState<O>()
  const [link, setLink] = useState('')
  const [lendo, setLendo] = useState(false)
  const arq = useRef<HTMLInputElement>(null)
  useEffect(() => { (async () => setO(id ? await db.obras.get(id) : { artistaId: sp.get('artista') ?? '', tags: [] }))() }, [id, sp])
  if (!o) return null
  const set = <K extends keyof O>(k: K) => (v: O[K]) => setO({ ...o, [k]: v })

  /** Lê a pré-visualização pública da página (título e imagem de destaque), como faz qualquer app ao colar um link. */
  async function lerLink() {
    const u = link.trim(); if (!/^https:\/\//.test(u)) { toast('Cole um link que comece com https://'); return }
    if (ehImagem(u)) { setO({ ...o!, imagem: u }); return }
    setLendo(true)
    try {
      const r = await fetch('/api/previa?u=' + encodeURIComponent(u), { headers: await cabecalhoLogin() })
      const j = await r.json()
      if (!r.ok) throw new Error(j.erro || 'falhou')
      setO({ ...o!, fonte: u, imagem: j.imagem || o!.imagem, titulo: o!.titulo || j.titulo, credito: o!.credito || j.site })
      if (!j.imagem) toast('A página não indica uma imagem. Cole o endereço da imagem ou envie uma foto.')
    } catch { setO({ ...o!, fonte: u }); toast('Não consegui ler a página. Guardei o link como fonte.') }
    setLendo(false)
  }
  async function salvar() {
    if (!o?.artistaId) { toast('Escolha o artista'); return }
    if (o.id) { await db.obras.put({ ...(o as Obra), atualizadoEm: Date.now() }); nav(`/biblioteca/obras/${o.id}`, { replace: true }) }
    else { const n = novo(o); await db.obras.add(n); if (sp.get('capa')) await db.artistas.update(n.artistaId, { capa: n.id, atualizadoEm: Date.now() }); nav(`/biblioteca/artistas/${n.artistaId}`, { replace: true }) }
    toast('Obra salva')
  }
  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <Link to={o.artistaId ? `/biblioteca/artistas/${o.artistaId}` : '/biblioteca/artistas'} className="back"><ArrowLeft size={15} />Voltar</Link>
      <p className="eyebrow">{o.id ? 'Editar obra' : 'Nova obra'}</p>
      <h1 style={{ marginTop: 8, marginBottom: 20 }}>{o.titulo || 'Obra'}</h1>
      {!o.id && <div className="aviso" style={{ marginBottom: 20 }}>
        <p style={{ margin: '0 0 10px' }}>Cole o link da obra no site do artista, da galeria ou do museu. O app lê o título e a imagem de destaque da página e guarda a fonte. Ou envie uma foto sua.</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="input" placeholder="https://" value={link} onChange={(e) => setLink(e.target.value)} />
          <button className="btn sm" disabled={lendo} onClick={lerLink}><Link2 size={14} />{lendo ? 'Lendo…' : 'Ler link'}</button>
          <button className="btn sm" onClick={() => arq.current?.click()}><ImagePlus size={14} />Foto</button>
          <input ref={arq} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) setO({ ...o, arquivo: await salvarArquivo(f) }) }} />
        </div>
      </div>}
      {(o.imagem || o.arquivo) && <div className="capa" style={{ maxWidth: 360, marginBottom: 20 }}><ImgObra o={o} /></div>}
      <div className="form">
        <Campo label="Artista"><select className="input" value={o.artistaId} onChange={(e) => set('artistaId')(e.target.value)}><option value="">Escolha…</option>{artistas.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}</select></Campo>
        <Campo label="Título"><Texto value={o.titulo} onChange={set('titulo')} /></Campo>
        <Campo label="Série ou família de acabamento"><Texto value={o.serie} onChange={set('serie')} /></Campo>
        <Campo label="Ano"><Texto value={o.ano} onChange={set('ano')} /></Campo>
        <Campo label="Dimensões"><Texto value={o.dimensoes} onChange={set('dimensoes')} /></Campo>
        <Campo label="Materiais"><Texto value={o.materiais} onChange={set('materiais')} /></Campo>
        <Campo label="Técnica de construção"><Texto value={o.tecnica} onChange={set('tecnica')} /></Campo>
        <Campo label="Esmaltação"><Texto value={o.esmaltacao} onChange={set('esmaltacao')} /></Campo>
        <Campo label="Tipo de queima"><Texto value={o.queima} onChange={set('queima')} /></Campo>
        <Campo label="Crédito da imagem"><Texto value={o.credito} onChange={set('credito')} /></Campo>
        <Campo label="Endereço da imagem" wide><Texto value={o.imagem} onChange={set('imagem')} type="url" placeholder="https://" /></Campo>
        <Campo label="Página de origem (fonte)" wide><Texto value={o.fonte} onChange={set('fonte')} type="url" placeholder="https://" /></Campo>
        <Campo label="Notas" wide><AreaTexto rows={3} value={o.notas} onChange={set('notas')} /></Campo>
        <Campo label="Etiquetas" wide><Tags value={o.tags} onChange={set('tags')} /></Campo>
      </div>
      <div className="barra-salvar"><button className="btn ghost" onClick={() => nav(-1)}>Cancelar</button><button className="btn primary" onClick={salvar}>Salvar obra</button></div>
    </div>
  )
}
