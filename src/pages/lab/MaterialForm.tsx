import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FileUp, X } from 'lucide-react'
import { db, novo, type Material } from '../../db/schema'
import { salvarArquivo } from '../../db/files'
import { CATEGORIAS_MATERIAIS } from '../../lib/opcoes'
import { AreaTexto, Campo, Fotos, Numero, Texto } from '../../ui/form'
import { useToast } from '../../ui/toast'
import { useLiveQuery } from 'dexie-react-hooks'

type M = Omit<Material, 'id' | 'criadoEm' | 'atualizadoEm'> & { id?: string }

function Documento({ value, onChange }: { value?: string; onChange: (id?: string) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const arq = useLiveQuery(() => (value ? db.arquivos.get(value) : undefined), [value])
  return <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
    {arq ? <span className="chip">{arq.nome}<button type="button" style={{ border: 0, background: 'none', padding: 0, display: 'flex' }} aria-label="Remover" onClick={() => onChange(undefined)}><X size={12} /></button></span>
      : <button type="button" className="btn sm" onClick={() => ref.current?.click()}><FileUp size={14} />Anexar PDF ou imagem</button>}
    <input ref={ref} type="file" accept="application/pdf,image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) onChange(await salvarArquivo(f)); e.target.value = '' }} />
  </div>
}

export default function MaterialForm() {
  const { id } = useParams()
  const nav = useNavigate()
  const toast = useToast()
  const [m, setM] = useState<M>()
  useEffect(() => { (async () => setM(id ? await db.materiais.get(id) : { nome: '', categoria: 'Outros', fotos: [] }))() }, [id])
  if (!m) return null
  const set = <K extends keyof Material>(k: K) => (v: Material[K]) => setM({ ...m, [k]: v })

  async function salvar() {
    if (!m?.nome.trim()) { toast('Dê um nome ao material'); return }
    if (m.id) { await db.materiais.put({ ...(m as Material), atualizadoEm: Date.now() }); nav(`/materiais/${m.id}`, { replace: true }) }
    else { const x = novo({ ...m, nome: m.nome.trim() }); await db.materiais.add(x); nav(`/materiais/${x.id}`, { replace: true }) }
    toast('Material salvo')
  }
  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <Link to={m.id ? `/materiais/${m.id}` : '/materiais'} className="back"><ArrowLeft size={15} />Voltar</Link>
      <p className="eyebrow">{m.id ? 'Editar material' : 'Novo material'}</p>
      <h1 style={{ marginTop: 8, marginBottom: 28 }}>{m.nome || 'Sem nome'}</h1>
      <div className="form">
        <Campo label="Fotografias" wide><Fotos value={m.fotos} onChange={set('fotos')} /></Campo>
        <Campo label="Nome"><Texto value={m.nome} onChange={set('nome')} autoFocus={!m.id} /></Campo>
        <Campo label="Categoria"><select className="input" value={m.categoria} onChange={(e) => set('categoria')(e.target.value)}>{CATEGORIAS_MATERIAIS.map((c) => <option key={c}>{c}</option>)}</select></Campo>
        <Campo label="Fabricante"><Texto value={m.fabricante} onChange={set('fabricante')} /></Campo>
        <Campo label="Fornecedor"><Texto value={m.fornecedor} onChange={set('fornecedor')} /></Campo>
        <Campo label="Preço por kg (R$)"><Numero value={m.precoKg} onChange={set('precoKg')} /></Campo>
        <Campo label="Quantidade disponível (kg)"><Numero value={m.estoqueKg} onChange={set('estoqueKg')} /></Campo>
        <Campo label="Link de compra" wide><Texto value={m.linkCompra} onChange={set('linkCompra')} type="url" placeholder="https://" /></Campo>
        <Campo label="Composição química" wide><AreaTexto value={m.composicao} onChange={set('composicao')} rows={3} /></Campo>
        <Campo label="Função"><Texto value={m.funcao} onChange={set('funcao')} placeholder="Fundente, opacificante…" /></Campo>
        <Campo label="Características"><Texto value={m.caracteristicas} onChange={set('caracteristicas')} /></Campo>
        <Campo label="Ficha técnica"><Documento value={m.fichaTecnica} onChange={set('fichaTecnica')} /></Campo>
        <Campo label="Ficha de segurança"><Documento value={m.fichaSeguranca} onChange={set('fichaSeguranca')} /></Campo>
        <Campo label="Observações" wide><AreaTexto value={m.observacoes} onChange={set('observacoes')} rows={4} /></Campo>
      </div>
      <div className="barra-salvar"><button className="btn ghost" onClick={() => nav(-1)}>Cancelar</button><button className="btn primary" onClick={salvar}>Salvar material</button></div>
    </div>
  )
}
