import { LinkSegurar } from '../../ui/Segurar'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu } from '../../ui/Menu'
import { Columns2, Search, TestTube, Grid3x3, Check } from 'lucide-react'
import { useEsmaltes, useReceitas, useTestes } from '../../db/hooks'
import { testeDaFamilia } from './Superficies'
import { normaliza, textoBusca } from '../../lib/filtros'
import { Foto } from '../../ui/form'

export default function Testes({ embutido, familia }: { embutido?: boolean; familia?: string } = {}) {
  const testes = useTestes()
  const esmaltes = useEsmaltes()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [filtro, setFiltro] = useState<'todos' | 'planejados' | 'queimados'>('todos')
  const [sel, setSel] = useState<string[] | null>(null)
  const esm = useMemo(() => new Map((esmaltes ?? []).map((e) => [e.id, e])), [esmaltes])
  const receitas = useReceitas()
  const famEsm = useMemo(() => new Map((esmaltes ?? []).map((e) => [e.id, e.familias])), [esmaltes])
  const famRec = useMemo(() => new Map((receitas ?? []).map((r) => [r.id, r.familias ?? []])), [receitas])
  const lista = (testes ?? []).filter((t) => (!familia || testeDaFamilia(t, familia, famEsm, famRec)) && (filtro === 'todos' || (filtro === 'planejados' ? t.planejado : !t.planejado)) &&
    (!q || textoBusca(t.codigo, t.resultado, t.observacoes, t.descricaoPlano, t.argila, t.cone, t.esmalteId && esm.get(t.esmalteId)?.nome).includes(normaliza(q))))

  return (
    <div className={embutido ? undefined : 'page'}>
      <div className="toolbar">
        <div className="search"><Search size={16} /><input className="input" placeholder="Buscar testes" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <Menu itens={[
          ...(['todos', 'planejados', 'queimados'] as const).map((f) => ({ l: f === 'todos' ? 'Todos os testes' : f === 'planejados' ? 'Só planejados' : 'Só queimados', on: filtro === f, onClick: () => setFiltro(f) })),
          { l: '', sep: true },
          { l: sel ? 'Cancelar comparação' : 'Comparar testes', icon: <Columns2 size={16} />, onClick: () => setSel(sel ? null : []) },
          { l: 'Planejar experimento', icon: <Grid3x3 size={16} />, to: '/testes/planejar' },
        ]} />
      </div>
      {sel && <div className="aviso" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <span>Toque nos testes para comparar ({sel.length} de até 6).</span>
        <button className="btn sm primary" disabled={sel.length < 2} onClick={() => nav(`/testes/comparar?ids=${sel.join(',')}`)}>Comparar</button>
      </div>}

      {testes && testes.length === 0 ? (
        <div className="empty"><span className="serif">Nenhum teste registrado.</span><span>Registre uma placa de teste ou planeje uma série (linear, misturas, triaxial, temperaturas, sobreposições).</span></div>
      ) : (
        <div className="galeria">
          {lista.map((t) => {
            const e = t.esmalteId ? esm.get(t.esmalteId) : undefined
            const on = sel?.includes(t.id)
            const corpo = <>
              <div className="ph" style={on ? { outline: '2px solid var(--ink)', outlineOffset: 2 } : undefined}>
                {t.fotos[0] ? <Foto id={t.fotos[0]} /> : e?.corHex ? <div className="swatch" style={{ background: e.corHex, opacity: .5 }} /> : <TestTube size={26} strokeWidth={1.1} />}
                <span className="cod">{t.codigo}</span>
                {on && <span style={{ position: 'absolute', right: 8, top: 8, background: 'var(--ink)', color: 'var(--marfim)', borderRadius: 99, width: 24, height: 24, display: 'grid', placeItems: 'center' }}><Check size={14} /></span>}
              </div>
              <div>
                <div className="t">{e?.nome ?? t.descricaoPlano ?? 'Teste'}</div>
                <div className="s">{[t.planejado ? 'Planejado' : new Date(t.data + 'T12:00').toLocaleDateString('pt-BR'), t.cone && 'cone ' + t.cone, t.descricaoPlano && e ? t.descricaoPlano : ''].filter(Boolean).join(' · ')}</div>
              </div>
            </>
            return sel ? <button key={t.id} className="peca" style={{ background: 'none', border: 0, padding: 0, textAlign: 'left' }}
              onClick={() => setSel(on ? sel.filter((x) => x !== t.id) : sel.length < 6 ? [...sel, t.id] : sel)}>{corpo}</button>
              : <LinkSegurar key={t.id} to={`/testes/${t.id}`} className="peca" opcoes={{ tabela: 'testes', id: t.id, titulo: t.codigo, favorito: t.favorito, nome: 'teste' }}>{corpo}</LinkSegurar>
          })}
        </div>
      )}
    </div>
  )
}
