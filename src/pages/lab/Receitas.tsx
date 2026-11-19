import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Download, GitBranch, Plus, ScrollText, Search } from 'lucide-react'
import { baixar } from '../../db/backup'
import { CLASSES } from '../../lib/receita'
import { db, novo, uid } from '../../db/schema'
import { useEsmaltes, useReceitas } from '../../db/hooks'
import { normaliza, textoBusca } from '../../lib/filtros'
import { somaBase } from '../../lib/receita'
import { fmt } from '../../lib/opcoes'

export async function criarReceita(dados: Partial<Parameters<typeof novo>[0]> = {}) {
  const r = novo({ nome: 'Nova receita', versaoAtual: 1, ingredientes: [], ehBase: 0 as const, ...dados })
  await db.receitas.add(r as never)
  const { id: _id, ...snapshot } = r as never as Record<string, unknown>
  await db.versoes.add({ id: uid(), receitaId: r.id, versao: 1, criadoEm: Date.now(), nota: 'Versão inicial', snapshot: snapshot as never })
  return r.id
}

export default function Receitas() {
  const receitas = useReceitas()
  const esmaltes = useEsmaltes()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [so, setSo] = useState<'todas' | 'bases'>('todas')
  const nomeEsm = useMemo(() => new Map((esmaltes ?? []).map((e) => [e.id, e.nome])), [esmaltes])
  const nomeRec = useMemo(() => new Map((receitas ?? []).map((r) => [r.id, r.nome])), [receitas])
  const lista = (receitas ?? []).filter((r) => (so === 'todas' || r.ehBase) &&
    (!q || textoBusca(r.nome, r.ingredientes.map((i) => i.nome), r.observacoes).includes(normaliza(q))))

  return (
    <div className="page">
      <div className="head">
        <div><p className="eyebrow">Laboratório</p><h1 style={{ marginTop: 8 }}>Receitas</h1></div>
        <div className="acts">
          <Link className="btn" to="/receitas/comparar">Comparar</Link>
          <button className="btn" disabled={!lista.length} onClick={() => {
            const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
            const linhas = [['Receita', 'Versão', 'Esmalte', 'Classe', 'Ingrediente', 'Percentual'].join(';'),
              ...lista.flatMap((r) => r.ingredientes.map((i) => [r.nome, r.versaoAtual, r.esmalteId ? nomeEsm.get(r.esmalteId) : '', CLASSES.find((c) => c.v === i.classe)?.l, i.nome, String(i.percentual).replace('.', ',')].map(esc).join(';')))]
            baixar(new Blob(['\ufeff' + linhas.join('\n')], { type: 'text/csv;charset=utf-8' }), `receitas-${new Date().toISOString().slice(0, 10)}.csv`)
          }}><Download size={16} />Exportar CSV</button>
          <button className="btn primary" onClick={async () => nav(`/receitas/${await criarReceita()}`)}><Plus size={16} />Nova receita</button>
        </div>
      </div>
      <div className="toolbar">
        <div className="search"><Search size={16} /><input className="input" placeholder="Buscar por nome ou ingrediente…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="seg">
          <button className={so === 'todas' ? 'on' : ''} onClick={() => setSo('todas')}>Todas</button>
          <button className={so === 'bases' ? 'on' : ''} onClick={() => setSo('bases')}>Bases reutilizáveis</button>
        </div>
      </div>
      {receitas && receitas.length === 0 ? (
        <div className="empty"><span className="serif">Nenhuma receita ainda.</span><span>Formule com receita base, corantes, opacificantes e aditivos, com versões e variações.</span></div>
      ) : (
        <div className="lista">
          {lista.map((r) => (
            <Link key={r.id} to={`/receitas/${r.id}`}>
              <div className="mini">{r.origemId ? <GitBranch size={20} strokeWidth={1.2} /> : <ScrollText size={20} strokeWidth={1.2} />}</div>
              <div>
                <div className="t">{r.nome}</div>
                <div className="s">{[r.ehBase ? 'Base reutilizável' : '', r.esmalteId && nomeEsm.get(r.esmalteId), r.origemId && 'variação de ' + (nomeRec.get(r.origemId) ?? '…'), r.ingredientes.length + ' ingredientes'].filter(Boolean).join(' · ')}</div>
              </div>
              <div className="r">v{r.versaoAtual}<br /><span className="faint">base {fmt(somaBase(r.ingredientes), 1)}%</span></div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
