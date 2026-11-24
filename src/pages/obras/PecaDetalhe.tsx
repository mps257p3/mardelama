import { useEffect, useRef } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, Heart, Trash2 } from 'lucide-react'
import { db, ETAPAS, uid, type Etapa, type Peca } from '../../db/schema'
import { alternarFavorito, excluir } from '../../db/hooks'
import { vivos } from '../../lib/artistas'
import { CapaFotos } from '../../ui/GaleriaFotos'
import { Relacoes } from '../../ui/Relacoes'
import { Menu } from '../../ui/Menu'
import { Tags } from '../../ui/form'
import { TextoEditavel } from '../../ui/editavel'
import { ArtistasParecidos } from './ArtistasParecidos'
import { CampoTitulo, Diario, nomeEtapa, normPeca, normSerie } from './comum'

const CAMPOS: [keyof Peca, string, string][] = [
  ['ano', 'Ano', 'Ex.: 2026'],
  ['dimensoes', 'Dimensões', 'Ex.: 32 × 18 cm'],
  ['argila', 'Argila / massa', 'Ex.: grês branco'],
  ['tecnica', 'Técnica', 'Ex.: placas, torno, acordelado'],
  ['superficie', 'Superfície', 'Esmaltes, engobes, óxidos'],
  ['queima', 'Queima', 'Ex.: 1240 °C, redução'],
  ['destino', 'Destino', 'Exposição, venda, acervo…'],
]

/** Página de uma peça (obra ou estudo): fotos, etapa, ficha, diário do processo e conexões. */
export default function PecaDetalhe() {
  const { id } = useParams()
  const [sp] = useSearchParams()
  const nav = useNavigate()
  const bruto = useLiveQuery(() => db.entrada.get(id!), [id])
  const series = useLiveQuery(async () => vivos(await db.projetos.toArray()).map(normSerie).sort((a, b) => a.nome.localeCompare(b.nome)), [], [])
  const recem = sp.get('novo') === '1'

  // peça criada e abandonada sem nada preenchido: não fica sobrando na lista
  const atual = useRef<Peca | undefined>(undefined)
  useEffect(() => { atual.current = bruto ? normPeca(bruto) : undefined }, [bruto])
  useEffect(() => () => {
    const p = atual.current
    if (recem && p && Date.now() - p.criadoEm > 1500 && !p.titulo.trim() && !p.fotos.length && !p.observacoes.length && !p.descricao) void db.entrada.delete(p.id)
  }, [recem])

  if (bruto === undefined) return null
  if (!bruto || bruto.excluido) return <div className="page"><p>Peça não encontrada.</p></div>
  const p = normPeca(bruto)
  const salvar = (x: Partial<Peca>) => db.entrada.update(p.id, { ...x, atualizadoEm: Date.now() })
  const serie = series.find((s) => s.id === p.serieId)
  async function mudarEtapa(e: Etapa) {
    if (e === p.etapa) return
    await salvar({ etapa: e, observacoes: [...p.observacoes, { id: uid(), data: Date.now(), texto: `Passou para ${nomeEtapa(e)}.` }] })
  }

  return (
    <div className="page peca">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to={serie ? `/obras/serie/${serie.id}` : p.tipo === 'estudo' ? '/obras?aba=estudos' : '/obras'} className="back"><ArrowLeft size={15} />{serie?.nome || 'Minhas obras'}</Link>
        <div style={{ display: 'flex', gap: 2 }}>
          <button className="iconbtn" aria-label="Favoritar" onClick={() => alternarFavorito('entrada', p.id, p.favorito)}><Heart size={19} fill={p.favorito ? 'currentColor' : 'none'} /></button>
          <Menu itens={[
            { l: p.tipo === 'estudo' ? 'Marcar como obra' : 'Marcar como estudo', onClick: () => salvar({ tipo: p.tipo === 'estudo' ? 'obra' : 'estudo' }) },
            { sep: true, l: '' },
            { l: 'Excluir peça', icon: <Trash2 size={16} />, onClick: async () => { if (confirm('Excluir esta peça?')) { await excluir('entrada', p.id); nav('/obras') } } },
          ]} />
        </div>
      </div>

      <div className="detalhe">
        <div><CapaFotos fotos={p.fotos} onChange={(v) => salvar({ fotos: v })} alt={p.titulo} rotuloAdd="Adicionar foto da peça" vazio={<span className="faint">Fotografe a peça em cada etapa</span>} /></div>
        <div>
          <p className="eyebrow">{p.tipo === 'estudo' ? 'Estudo' : 'Obra'}{serie ? ` · ${serie.nome}` : ''}</p>
          <h1 style={{ marginTop: 6 }}><CampoTitulo valor={p.titulo} placeholder="Título da peça" autoFocus={recem && !p.titulo} onSalvar={(v) => salvar({ titulo: v })} /></h1>

          <h4 style={{ marginTop: 18 }}>Etapa</h4>
          <div className="etapas">{ETAPAS.map((e, i) => {
            const idx = ETAPAS.findIndex((x) => x.id === p.etapa)
            return <button key={e.id} className={'etapa' + (e.id === p.etapa ? ' on' : i < idx ? ' feita' : '')} onClick={() => mudarEtapa(e.id)}>{e.nome}</button>
          })}</div>

          <h4>Série</h4>
          <select className="input" value={p.serieId ?? ''} onChange={(e) => salvar({ serieId: e.target.value || undefined })}>
            <option value="">Sem série</option>
            {series.map((s) => <option key={s.id} value={s.id}>{s.nome || 'Série sem nome'}</option>)}
          </select>

          <dl className="art-ficha" style={{ marginTop: 18 }}>
            {CAMPOS.map(([k, l, ph]) => <div key={k} style={{ display: 'contents' }}><dt>{l}</dt><dd><TextoEditavel valor={p[k] as string | undefined} rotulo={l.toLowerCase()} vazio={ph} onSalvar={(v) => salvar({ [k]: v || undefined })} /></dd></div>)}
          </dl>

          <h4>Sobre a peça</h4>
          <TextoEditavel valor={p.descricao} multilinha rotulo="descrição" vazio="Intenção, referências, o que esta peça investiga…" onSalvar={(v) => salvar({ descricao: v })} />
          <h4>Etiquetas</h4>
          <Tags value={p.tags} onChange={(v) => salvar({ tags: v })} />
        </div>
      </div>

      <section className="secao">
        <div className="secao-head"><h2>Diário do processo</h2></div>
        <Diario itens={p.observacoes} onChange={(v) => salvar({ observacoes: v })} vazio="Registre o que acontece com a peça: rachaduras, como o esmalte correu, o que mudaria na próxima." />
      </section>

      <section className="secao">
        <Relacoes tipo="entrada" id={p.id} />
        <p className="faint" style={{ fontSize: 12.5 }}>Conecte os esmaltes, testes, queimas, referências e artistas que entraram nesta peça.</p>
      </section>

      <ArtistasParecidos key={p.id} ctx={'peca:' + p.id} fotos={p.fotos} />
    </div>
  )
}
