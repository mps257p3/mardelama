import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, ImageIcon, Plus, Sparkles, Trash2 } from 'lucide-react'
import { db, type Serie } from '../../db/schema'
import { excluir } from '../../db/hooks'
import { vivos } from '../../lib/artistas'
import { salvarArquivo } from '../../db/files'
import { Foto, Tags } from '../../ui/form'
import { Menu } from '../../ui/Menu'
import { Relacoes } from '../../ui/Relacoes'
import { TextoEditavel } from '../../ui/editavel'
import { CampoTitulo, CartaoPeca, Diario, STATUS_SERIE, normPeca, normSerie, novaPeca } from './comum'

/** Página de uma série: intenção, peças (obras e estudos), diário e conexões. */
export default function SerieDetalhe() {
  const { id } = useParams()
  const [sp] = useSearchParams()
  const nav = useNavigate()
  const bruto = useLiveQuery(() => db.projetos.get(id!), [id])
  const pecas = useLiveQuery(async () => vivos(await db.entrada.where('serieId').equals(id!).toArray()).map(normPeca).sort((a, b) => a.criadoEm - b.criadoEm), [id], [])
  const arq = useRef<HTMLInputElement>(null)
  const [criando, setCriando] = useState(false)
  const recem = sp.get('novo') === '1'

  // série criada e abandonada sem nome nem conteúdo: não fica sobrando
  const atual = useRef<Serie | undefined>(undefined)
  useEffect(() => { atual.current = bruto ? normSerie(bruto) : undefined }, [bruto])
  useEffect(() => () => {
    const s = atual.current
    if (recem && s && Date.now() - s.criadoEm > 1500 && !s.nome.trim() && !s.intencao && !s.observacoes.length && !s.capa) void db.projetos.delete(s.id)
  }, [recem])

  if (bruto === undefined) return null
  if (!bruto || bruto.excluido) return <div className="page"><p>Série não encontrada.</p></div>
  const s = normSerie(bruto)
  const salvar = (x: Partial<Serie>) => db.projetos.update(s.id, { ...x, atualizadoEm: Date.now() })
  const capa = s.capa ?? pecas.find((p) => p.fotos[0])?.fotos[0]
  const obras = pecas.filter((p) => p.tipo === 'obra'), estudos = pecas.filter((p) => p.tipo === 'estudo')
  async function adicionar(tipo: 'obra' | 'estudo') {
    if (criando) return
    setCriando(true)
    try { nav(`/obras/peca/${await novaPeca({ tipo, serieId: s.id })}?novo=1`) } finally { setCriando(false) }
  }

  return (
    <div className="page serie">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/obras?aba=series" className="back"><ArrowLeft size={15} />Séries</Link>
        <Menu itens={[
          { l: 'Trocar foto de capa', icon: <ImageIcon size={16} />, onClick: () => arq.current?.click() },
          { sep: true, l: '' },
          { l: 'Excluir série', icon: <Trash2 size={16} />, onClick: async () => { if (confirm('Excluir esta série? As peças continuam em Minhas obras, sem série.')) { await excluir('projetos', s.id); nav('/obras?aba=series') } } },
        ]} />
      </div>
      <input ref={arq} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) await salvar({ capa: await salvarArquivo(f) }) }} />

      <figure className="art-capa" onClick={() => !capa && arq.current?.click()}>
        {capa ? <Foto id={capa} alt={s.nome} /> : <span className="obra-sem"><ImageIcon size={22} strokeWidth={1.2} /><span>Toque para escolher a foto de capa</span></span>}
      </figure>
      <header className="art-titulo">
        <p className="eyebrow">Série{s.ano ? ` · ${s.ano}` : ''}</p>
        <h1><CampoTitulo valor={s.nome} placeholder="Nome da série" autoFocus={recem && !s.nome} onSalvar={(v) => salvar({ nome: v })} /></h1>
        <div className="chips" style={{ marginTop: 10 }}>
          {(Object.keys(STATUS_SERIE) as Serie['status'][]).map((k) => <button key={k} className={'chip' + (s.status === k ? ' on' : '')} onClick={() => salvar({ status: k })}>{STATUS_SERIE[k]}</button>)}
        </div>
      </header>

      <section className="secao">
        <h4>O que esta série investiga</h4>
        <TextoEditavel valor={s.intencao} multilinha rotulo="intenção" vazio="A pergunta, o gesto ou a matéria que move a série…" onSalvar={(v) => salvar({ intencao: v })} />
        <h4>Sobre</h4>
        <TextoEditavel valor={s.descricao} multilinha rotulo="descrição" vazio="Texto da série (para portfólio, exposição)…" onSalvar={(v) => salvar({ descricao: v })} />
        <dl className="art-ficha" style={{ marginTop: 12 }}><dt>Ano</dt><dd><TextoEditavel valor={s.ano} rotulo="ano" vazio="Ex.: 2025–2026" onSalvar={(v) => salvar({ ano: v || undefined })} /></dd></dl>
        <h4>Etiquetas</h4>
        <Tags value={s.tags} onChange={(v) => salvar({ tags: v })} />
      </section>

      <section className="secao">
        <div className="secao-head"><h2>Peças <span className="faint">{obras.length}</span></h2><button className="btn sm" disabled={criando} onClick={() => adicionar('obra')}><Plus size={14} />Peça</button></div>
        {obras.length ? <div className="obras-mural">{obras.map((p) => <Link key={p.id} to={`/obras/peca/${p.id}`} className="obra-card"><CartaoPeca p={p} /></Link>)}</div> : <p className="faint">Nenhuma peça nesta série ainda.</p>}
      </section>

      <section className="secao">
        <div className="secao-head"><h2>Estudos <span className="faint">{estudos.length}</span></h2><button className="btn sm" disabled={criando} onClick={() => adicionar('estudo')}><Sparkles size={14} />Estudo</button></div>
        {estudos.length ? <div className="obras-mural">{estudos.map((p) => <Link key={p.id} to={`/obras/peca/${p.id}`} className="obra-card"><CartaoPeca p={p} /></Link>)}</div> : <p className="faint">Provas de forma, superfície e queima ligadas a esta série.</p>}
      </section>

      <section className="secao">
        <div className="secao-head"><h2>Diário da série</h2></div>
        <Diario itens={s.observacoes} onChange={(v) => salvar({ observacoes: v })} vazio="Anote decisões, descobertas e rumos da série." />
      </section>

      <section className="secao">
        <Relacoes tipo="projeto" id={s.id} />
        <p className="faint" style={{ fontSize: 12.5 }}>Conecte referências, artistas, esmaltes e anotações que alimentam esta série.</p>
      </section>
    </div>
  )
}
