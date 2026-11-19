import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Columns2, Download, GitBranch, Grid2x2, Layers, List, ScrollText, Search } from 'lucide-react'
import { Menu } from '../../ui/Menu'
import { Foto } from '../../ui/form'
import { useAjuste, definirAjuste } from '../../db/settings'
import { baixar } from '../../db/backup'
import { CLASSES } from '../../lib/receita'
import { db, novo, uid } from '../../db/schema'
import { useEsmaltes, useFamilias, useReceitas } from '../../db/hooks'
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

export default function Receitas({ embutido, familia }: { embutido?: boolean; familia?: string } = {}) {
  const receitas = useReceitas()
  const esmaltes = useEsmaltes()
  const [q, setQ] = useState('')
  const [so, setSo] = useState<'todas' | 'bases'>('todas')
  const familias = useFamilias()
  const [famLocal, setFam] = useState('')
  const fam = embutido ? familia ?? '' : famLocal
  const codFam = useMemo(() => new Map(familias.map((f) => [f.id, f.codigo ?? f.nome])), [familias])
  const nomeEsm = useMemo(() => new Map((esmaltes ?? []).map((e) => [e.id, e.nome])), [esmaltes])
  const fotoEsm = useMemo(() => new Map((esmaltes ?? []).map((e) => [e.id, e.fotos[0]])), [esmaltes])
  const modo = useAjuste<'grade' | 'lista'>('receitas.modo', 'grade')
  const nomeRec = useMemo(() => new Map((receitas ?? []).map((r) => [r.id, r.nome])), [receitas])
  const lista = (receitas ?? []).filter((r) => (so === 'todas' || r.ehBase) && (!fam || (r.familias ?? []).includes(fam)) &&
    (!q || textoBusca(r.nome, r.codigo, r.ingredientes.map((i) => i.nome), r.observacoes, r.tags).includes(normaliza(q))))
    .sort((a, b) => (a.codigo ?? '~').localeCompare(b.codigo ?? '~') || b.atualizadoEm - a.atualizadoEm)

  return (
    <div className={embutido ? undefined : 'page'}>
      <div className="toolbar">
        <div className="search"><Search size={16} /><input className="input" placeholder="Buscar fórmulas ou ingredientes" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <button className={'iconbtn' + (so === 'bases' ? ' on' : '')} title="Só bases reutilizáveis" aria-label="Só bases reutilizáveis" onClick={() => setSo(so === 'bases' ? 'todas' : 'bases')}><Layers size={18} /></button>
        <Menu itens={[
          { l: 'Só bases reutilizáveis', icon: <Layers size={16} />, on: so === 'bases', onClick: () => setSo(so === 'bases' ? 'todas' : 'bases') },
          { l: 'Ver em grade', icon: <Grid2x2 size={16} />, on: modo === 'grade', onClick: () => definirAjuste('receitas.modo', 'grade') },
          { l: 'Ver em lista', icon: <List size={16} />, on: modo === 'lista', onClick: () => definirAjuste('receitas.modo', 'lista') },
          { l: '', sep: true },
          { l: 'Comparar fórmulas', icon: <Columns2 size={16} />, to: '/receitas/comparar' },
          { l: 'Exportar CSV', icon: <Download size={16} />, disabled: !lista.length, onClick: () => {
            const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
            const linhas = [['Receita', 'Versão', 'Esmalte', 'Classe', 'Ingrediente', 'Percentual'].join(';'),
              ...lista.flatMap((r) => r.ingredientes.map((i) => [r.nome, r.versaoAtual, r.esmalteId ? nomeEsm.get(r.esmalteId) : '', CLASSES.find((c) => c.v === i.classe)?.l, i.nome, String(i.percentual).replace('.', ',')].map(esc).join(';')))]
            baixar(new Blob(['\ufeff' + linhas.join('\n')], { type: 'text/csv;charset=utf-8' }), `receitas-${new Date().toISOString().slice(0, 10)}.csv`)
          } },
        ]} />
      </div>
      {!embutido && <div className="chips" style={{ marginBottom: 8 }}>
        <button className={'chip' + (!fam ? ' on' : '')} onClick={() => setFam('')}>Todas as famílias</button>
        {familias.map((f) => <button key={f.id} className={'chip' + (fam === f.id ? ' on' : '')} onClick={() => setFam(fam === f.id ? '' : f.id)}>{f.codigo ? f.codigo + ' · ' : ''}{f.nome}</button>)}
      </div>}
      {receitas && receitas.length === 0 ? (
        <div className="empty"><span className="serif">Nenhuma receita ainda.</span><span>Formule com receita base, corantes, opacificantes e aditivos, com versões e variações.</span></div>
      ) : modo === 'grade' ? (
        <div className="galeria galeria-grande">
          {lista.map((r) => {
            const f = r.fotos?.[0] ?? r.pecas?.[0] ?? (r.esmalteId ? fotoEsm.get(r.esmalteId) : undefined)
            return (
              <Link key={r.id} to={`/receitas/${r.id}`} className="peca">
                <div className="ph">
                  {f ? <Foto id={f} alt={r.nome} /> : r.origemId ? <GitBranch size={28} strokeWidth={1.1} /> : <ScrollText size={28} strokeWidth={1.1} />}
                  {r.codigo && <span className="cod">{r.codigo}</span>}
                </div>
                <div>
                  <div className="t">{r.nome}</div>
                  <div className="s">{[r.status, r.ehBase ? 'Base reutilizável' : '', 'v' + r.versaoAtual].filter(Boolean).join(' · ')}</div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="lista">
          {lista.map((r) => (
            <Link key={r.id} to={`/receitas/${r.id}`}>
              <div className="mini">{(r.fotos?.[0] ?? (r.esmalteId && fotoEsm.get(r.esmalteId))) ? <Foto id={r.fotos?.[0] ?? fotoEsm.get(r.esmalteId!)} /> : r.origemId ? <GitBranch size={20} strokeWidth={1.2} /> : <ScrollText size={20} strokeWidth={1.2} />}</div>
              <div>
                <div className="t">{r.codigo && <span className="codigo" style={{ marginRight: 8, color: 'var(--area)' }}>{r.codigo}</span>}{r.nome}</div>
                <div className="s">{[r.status, (r.familias ?? []).map((f) => codFam.get(f)).filter(Boolean).join(' ') , r.ehBase ? 'Base reutilizável' : '', r.esmalteId && nomeEsm.get(r.esmalteId), r.origemId && 'variação de ' + (nomeRec.get(r.origemId) ?? '…'), r.ingredientes.length + ' ingredientes'].filter(Boolean).join(' · ')}</div>
              </div>
              <div className="r">v{r.versaoAtual}<br /><span className="faint">base {fmt(somaBase(r.ingredientes), 1)}%</span></div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
