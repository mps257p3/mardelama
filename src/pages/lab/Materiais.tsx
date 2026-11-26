import { LinkSegurar } from '../../ui/Segurar'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Layers, Plus, Search } from 'lucide-react'
import { useMateriais } from '../../db/hooks'
import { CATEGORIAS_MATERIAIS, brl, fmt } from '../../lib/opcoes'
import { normaliza, textoBusca } from '../../lib/filtros'
import { Foto } from '../../ui/form'

export default function Materiais() {
  const materiais = useMateriais()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<string>()
  const lista = useMemo(() => (materiais ?? []).filter((m) => (!cat || m.categoria === cat) &&
    (!q || textoBusca(m.nome, m.fabricante, m.fornecedor, m.composicao, m.funcao).includes(normaliza(q)))), [materiais, q, cat])
  const grupos = CATEGORIAS_MATERIAIS.map((c) => ({ c, xs: lista.filter((m) => m.categoria === c) })).filter((g) => g.xs.length)

  return (
    <div className="page">
      <div className="head">
        <div><p className="eyebrow">Laboratório</p><h1 style={{ marginTop: 8 }}>Materiais</h1></div>
        <div className="acts"><Link className="btn primary" to="/materiais/novo"><Plus size={16} />Novo material</Link></div>
      </div>
      <div className="toolbar">
        <div className="search"><Search size={16} /><input className="input" placeholder="Buscar por nome, fabricante, composição…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      </div>
      <div className="chips" style={{ marginBottom: 20 }}>
        <button className={'chip' + (!cat ? ' on' : '')} onClick={() => setCat(undefined)}>Todos</button>
        {CATEGORIAS_MATERIAIS.map((c) => <button key={c} className={'chip' + (cat === c ? ' on' : '')} onClick={() => setCat(cat === c ? undefined : c)}>{c}</button>)}
      </div>
      {materiais && materiais.length === 0 ? (
        <div className="empty"><span className="serif">Nenhum material cadastrado.</span><span>Cadastre as matérias-primas do ateliê. Elas aparecem como sugestão no editor de receitas e alimentam o cálculo de custos.</span>
          <Link className="btn sm primary" to="/materiais/novo"><Plus size={15} />Cadastrar material</Link></div>
      ) : grupos.map((g) => (
        <section key={g.c} style={{ marginBottom: 32 }}>
          <p className="eyebrow" style={{ marginBottom: 6 }}>{g.c}</p>
          <div className="lista">
            {g.xs.map((m) => (
              <LinkSegurar key={m.id} to={`/materiais/${m.id}`} opcoes={{ tabela: 'materiais', id: m.id, titulo: m.nome, favorito: m.favorito, nome: 'material' }}>
                <div className="mini">{m.fotos[0] ? <Foto id={m.fotos[0]} /> : <Layers size={20} strokeWidth={1.2} />}</div>
                <div><div className="t">{m.nome}</div><div className="s">{[m.fabricante, m.funcao].filter(Boolean).join(' · ')}</div></div>
                <div className="r">{m.precoKg != null ? brl(m.precoKg) + '/kg' : ''}{m.estoqueKg != null && <div className="faint">{fmt(m.estoqueKg, 2)} kg</div>}</div>
              </LinkSegurar>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
