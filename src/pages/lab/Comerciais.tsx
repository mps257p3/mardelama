import { useRef, useState } from 'react'
import { incluidoEm } from '../../lib/data'
import { Link, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, ImagePlus, Plus, Sparkles } from 'lucide-react'
import { db, novo, type Comercial } from '../../db/schema'
import { Foto } from '../../ui/form'
import { useToast } from '../../ui/toast'
import { pesquisarEstudo } from '../../lib/comercial'


export default function Comerciais() {
  const nav = useNavigate()
  const toast = useToast()
  const arquivo = useRef<HTMLInputElement>(null)
  const [pesquisando, setPesquisando] = useState(false)
  const itens = useLiveQuery(async () => (await db.comerciais.toArray()).filter((c) => !c.excluido).sort((a, b) => (a.observacoes ?? '').localeCompare(b.observacoes ?? '') || a.nome.localeCompare(b.nome)), [], [])
  async function novoItem() {
    const c: Comercial = novo({ fabricante: 'Fabricante', nome: 'Novo esmalte estudado', familias: [], fotos: [], declarados: [], hipoteses: [], fontes: [] })
    await db.comerciais.add(c); nav(`/engenharia-reversa/${c.id}`)
  }
  /** Print do rótulo, pote, catálogo ou post: guarda as fotos num estudo novo e a IA pesquisa o esmalte na web. */
  async function estudarPrint(files: FileList | null) {
    const imgs = [...(files ?? [])].filter((f) => f.type.startsWith('image/'))
    if (!imgs.length) return
    setPesquisando(true)
    try {
      const { salvarArquivo } = await import('../../db/files')
      const c: Comercial = novo({ fabricante: '', nome: 'Estudo de print', familias: [], fotos: [], declarados: [], hipoteses: [], fontes: [] })
      await db.comerciais.add(c)
      const fotos = await Promise.all(imgs.map((f) => salvarArquivo(f, { tipo: 'comercial', id: c.id })))
      await db.comerciais.update(c.id, { fotos })
      try { await pesquisarEstudo(c.id); toast('Pesquisa pronta. Confira as fontes.') }
      catch (e) { toast('A pesquisa não deu certo: ' + (e as Error).message + '. A foto ficou no estudo; dá para tentar de novo lá dentro.') }
      nav(`/engenharia-reversa/${c.id}`)
    } finally { setPesquisando(false) }
  }
  return (
    <div className="page" style={{ maxWidth: 860 }}>
      <Link to="/laboratorio" className="back"><ArrowLeft size={15} />Esmaltaria</Link>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
        <h1>Engenharia reversa</h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn primary" disabled={pesquisando} onClick={() => arquivo.current?.click()}><ImagePlus size={16} />Estudar print</button>
          <button className="btn" disabled={pesquisando} onClick={novoItem}><Plus size={16} />Novo estudo</button>
          <input ref={arquivo} type="file" accept="image/*" multiple hidden onChange={(e) => { estudarPrint(e.target.files); e.target.value = '' }} />
        </div>
      </div>
      {pesquisando && <p className="recebido-lendo" style={{ marginTop: 14 }}><Sparkles size={15} />Identificando o esmalte e procurando a ficha do fabricante… fique nesta tela, leva 1 ou 2 minutos.</p>}
      <p className="muted" style={{ marginTop: 10 }}>Esmaltes comerciais estudados como referência. Cada ficha separa o que o fabricante declara, o que vem da documentação, as hipóteses e o que já foi confirmado em teste.</p>
      <div className="lista" style={{ marginTop: 20 }}>
        {itens.map((c) => (
          <Link key={c.id} to={`/engenharia-reversa/${c.id}`}>
            <span className="mini">{c.fotos[0] ? <Foto id={c.fotos[0]} /> : <span style={{ fontSize: 11 }}>{(c.observacoes?.match(/ER-\d+/) ?? [''])[0]}</span>}</span>
            <span><span className="t">{c.fabricante} {c.nome}</span><br /><span className="s">{[c.codigo, c.serie, incluidoEm(c.criadoEm)].filter(Boolean).join(' · ')}</span></span>
            <span className="r">{c.confirmado ? 'com teste' : 'em estudo'}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
