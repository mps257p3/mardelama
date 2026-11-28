import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Sheet } from '../../ui/Sheet'
import { useToast } from '../../ui/toast'
import { traduz } from '../../lib/curadoria'
import { CATEGORIAS, EPOCAS2, FILTROS2_VAZIO, LINGUAGENS, SUGESTOES_TEMA, nFiltros2, salvarConfig2, todosOsTemas, useConfig2, type Categoria, type Filtros2, type Tema2 } from '../../lib/ref2'
import { mudarFiltros2, useFiltros2, ROT_INTERACAO } from './filtros2'

const ORDEM_FONTES: Categoria[] = ['pinterest', 'artistas', 'revistas', 'arena', 'contemporaneos', 'museus', 'abertas']
const ROT_FONTE: Record<Categoria, string> = { pinterest: 'Pinterest', artistas: 'Artistas', revistas: 'Revistas de arte', arena: 'Are.na', contemporaneos: 'Acervos modernos e contemporâneos', museus: 'Museus históricos', abertas: 'Imagens abertas' }

/** Um painel só com todos os filtros do Descobrir. As categorias se combinam; dentro de cada uma, vale qualquer opção marcada. */
export function FiltrosAvancados({ onClose }: { onClose: () => void }) {
  const f = useFiltros2()
  const cfg = useConfig2()
  const toast = useToast()
  const [novoTema, setNovoTema] = useState('')
  const [criando, setCriando] = useState(false)
  const temas = todosOsTemas(cfg)
  const tog = <K extends 'fontes' | 'linguagens' | 'temas'>(k: K, v: Filtros2[K][number]) => {
    const atual = f[k] as string[]
    mudarFiltros2({ [k]: atual.includes(v as string) ? atual.filter((x) => x !== v) : [...atual, v] } as Partial<Filtros2>)
  }
  async function adicionarTema(t?: Tema2) {
    const nome = (t?.nome ?? novoTema).trim(); if (!nome) return
    if (cfg.temasPessoais.some((x) => x.nome.toLowerCase() === nome.toLowerCase())) { toast('Esse tema já existe'); return }
    setCriando(true)
    let tema: Tema2 = t ?? { id: 'p:' + nome.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-'), nome, consultas: [traduz(nome)] }
    if (!t) {
      // com a IA, o nome vira consultas em inglês (fica guardado; a mesma busca não é paga de novo)
      try {
        const { iaConfigurada, interpretarBusca } = await import('../../lib/iaRepertorio')
        if (await iaConfigurada()) { const l = await interpretarBusca(nome); const qs = l.consultas.filter((c) => !c.lingua).map((c) => c.q).slice(0, 8); if (qs.length) tema = { ...tema, consultas: qs, universo: l.consultas[0]?.universo } }
      } catch { /* fica com a tradução simples */ }
    }
    await salvarConfig2({ temasPessoais: [...cfg.temasPessoais, { ...tema, pessoal: true }] })
    setNovoTema(''); setCriando(false)
    mudarFiltros2({ temas: [...f.temas, tema.id] })
  }
  async function removerTema(id: string) {
    await salvarConfig2({ temasPessoais: cfg.temasPessoais.filter((x) => x.id !== id) })
    mudarFiltros2({ temas: f.temas.filter((x) => x !== id) })
  }
  const n = nFiltros2(f)
  const sugestoes = SUGESTOES_TEMA.filter((s) => !cfg.temasPessoais.some((t) => t.id === s.id))
  return <Sheet label="Filtros" onClose={onClose} alto>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h3>Filtros</h3>
      <button className="btn sm ghost" disabled={!n} onClick={() => mudarFiltros2(FILTROS2_VAZIO)}>Limpar tudo</button>
    </div>
    <p className="faint" style={{ fontSize: 12.5, margin: '2px 0 4px' }}>Filtros de categorias diferentes se combinam. Dentro de uma categoria, vale qualquer opção marcada.</p>

    <div className="filtro-sec"><div className="filtro-tit"><span>Fontes</span></div>
      <div className="chips wrap">{ORDEM_FONTES.map((c) => <button key={c} className={'chip' + (f.fontes.includes(c) ? ' on' : '')} title={CATEGORIAS[c].desc} onClick={() => tog('fontes', c)}>{ROT_FONTE[c]}</button>)}</div>
    </div>

    <div className="filtro-sec"><div className="filtro-tit"><span>Época</span></div>
      <div className="chips wrap">{EPOCAS2.map(([k, l]) => <button key={k} className={'chip' + (f.epoca === k ? ' on' : '')} onClick={() => mudarFiltros2({ epoca: k })}>{l}</button>)}</div>
      <p className="faint" style={{ fontSize: 12, marginTop: 6 }}>As mesmas datas da versão atual: Contemporânea desde 1960, Moderna de 1880 a 1979, Histórica até 1879. Vanguardas e Pré-colombiana buscam pelos temas de mesmo nome.</p>
    </div>

    <div className="filtro-sec"><div className="filtro-tit"><span>Linguagem artística</span></div>
      <div className="chips wrap">{LINGUAGENS.map((l) => <button key={l.id} className={'chip' + (f.linguagens.includes(l.id) ? ' on' : '')} onClick={() => tog('linguagens', l.id)}>{l.nome}</button>)}</div>
    </div>

    <div className="filtro-sec"><div className="filtro-tit"><span>Temas</span></div>
      <div className="chips wrap">{temas.map((t) => <span key={t.id} className="chip-par">
        <button className={'chip' + (f.temas.includes(t.id) ? ' on' : '')} onClick={() => tog('temas', t.id)}>{t.nome}</button>
        {t.pessoal && <button className="chip-x" aria-label={`Apagar o tema ${t.nome}`} onClick={() => removerTema(t.id)}><X size={11} /></button>}
      </span>)}</div>
      <form className="ref2-novo-tema" onSubmit={(e) => { e.preventDefault(); adicionarTema() }}>
        <input className="input" placeholder="Criar um tema seu (ex.: Bichos híbridos)" value={novoTema} onChange={(e) => setNovoTema(e.target.value)} />
        <button className="btn sm" disabled={!novoTema.trim() || criando}><Plus size={14} />{criando ? 'Criando…' : 'Criar'}</button>
      </form>
      {sugestoes.length > 0 && <div className="chips wrap" style={{ marginTop: 8 }}>
        <span className="faint" style={{ fontSize: 12, alignSelf: 'center' }}>Sugestões:</span>
        {sugestoes.map((s) => <button key={s.id} className="chip ghost" onClick={() => adicionarTema(s)}><Plus size={12} />{s.nome}</button>)}
      </div>}
    </div>

    <div className="filtro-sec"><div className="filtro-tit"><span>Interações</span></div>
      <div className="chips wrap">{(Object.keys(ROT_INTERACAO) as Filtros2['interacao'][]).map((k) => <button key={k} className={'chip' + (f.interacao === k ? ' on' : '')} onClick={() => mudarFiltros2({ interacao: k })}>{ROT_INTERACAO[k]}</button>)}</div>
    </div>

    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}><button className="btn primary" onClick={onClose}>Ver imagens</button></div>
  </Sheet>
}
