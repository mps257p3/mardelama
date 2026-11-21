import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { db, novo, type Conteudo } from '../../db/schema'
import { CATEGORIAS_BIB, FORMATOS } from '../../lib/biblioteca'
import { Campo, Escolha, Tags, Texto } from '../../ui/form'
import { TextoRico } from '../../ui/rich'
import { Arquivos } from '../../ui/arquivos'
import { useToast } from '../../ui/toast'

type C = Omit<Conteudo, 'id' | 'criadoEm' | 'atualizadoEm'> & { id?: string }

export default function ConteudoForm() {
  const { id } = useParams()
  const nav = useNavigate()
  const toast = useToast()
  const [sp] = useSearchParams()
  const [c, setC] = useState<C>()
  useEffect(() => { (async () => setC(id ? await db.conteudos.get(id) : { titulo: '', categoria: sp.get('categoria') || 'Técnicas de modelagem', formato: 'texto', corpo: '', arquivos: [], tags: [] }))() }, [id])
  if (!c) return null
  const set = <K extends keyof Conteudo>(k: K) => (v: Conteudo[K]) => setC({ ...c, [k]: v })
  async function salvar() {
    if (!c?.titulo.trim()) { toast('Dê um título ao conteúdo'); return }
    if (c.id) { await db.conteudos.put({ ...(c as Conteudo), atualizadoEm: Date.now() }); nav(`/biblioteca/${c.id}`, { replace: true }) }
    else { const x = novo(c); await db.conteudos.add(x); nav(`/biblioteca/${x.id}`, { replace: true }) }
    toast('Conteúdo salvo')
  }
  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <Link to={c.id ? `/biblioteca/${c.id}` : '/biblioteca'} className="back"><ArrowLeft size={15} />Voltar</Link>
      <p className="eyebrow">{c.id ? 'Editar conteúdo' : 'Novo conteúdo'}</p>
      <h1 style={{ marginTop: 8, marginBottom: 28 }}>{c.titulo || 'Sem título'}</h1>
      <div className="form">
        <Campo label="Título" wide><Texto value={c.titulo} onChange={set('titulo')} autoFocus={!c.id} /></Campo>
        <Campo label="Categoria"><select className="input" value={c.categoria} onChange={(e) => set('categoria')(e.target.value)}>{[...new Set([...CATEGORIAS_BIB, c.categoria])].map((x) => <option key={x}>{x}</option>)}</select></Campo>
        <Campo label="Autor ou fonte"><Texto value={c.autor} onChange={set('autor')} /></Campo>
        <Campo label="Formato" wide><Escolha value={c.formato} onChange={set('formato')} opcoes={FORMATOS} /></Campo>
        <Campo label="Link externo" wide><Texto value={c.url} onChange={set('url')} type="url" placeholder="https://" /></Campo>
        <Campo label="Texto" wide><TextoRico value={c.corpo ?? ''} onChange={set('corpo')} placeholder="Escreva, cole trechos, organize o que aprendeu…" /></Campo>
        <Campo label="Arquivos (PDF, imagens, documentos)" wide><Arquivos value={c.arquivos} onChange={set('arquivos')} /></Campo>
        <Campo label="Tags" wide><Tags value={c.tags} onChange={set('tags')} /></Campo>
      </div>
      <div className="barra-salvar"><button className="btn ghost" onClick={() => nav(-1)}>Cancelar</button><button className="btn primary" onClick={salvar}>Salvar conteúdo</button></div>
    </div>
  )
}
