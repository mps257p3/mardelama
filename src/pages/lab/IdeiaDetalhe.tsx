import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, ExternalLink, FlaskConical, Heart, Trash2 } from 'lucide-react'
import { db, type IdeiaEsmalte } from '../../db/schema'
import { alternarFavorito, excluir, useFamilias } from '../../db/hooks'
import { EFEITOS, testarIdeia } from '../../lib/ideias'
import { CapaFotos } from '../../ui/GaleriaFotos'
import { Relacoes } from '../../ui/Relacoes'
import { Menu } from '../../ui/Menu'
import { Foto, Tags } from '../../ui/form'
import { TextoEditavel } from '../../ui/editavel'
import { CampoTitulo } from '../obras/comum'
import { ImgRef } from '../ref/ImgRef'

const CAMPOS: [keyof IdeiaEsmalte, string, string][] = [
  ['esmaltes', 'Esmaltes e camadas', 'Ex.: tenmoku por baixo, shino por cima, 2 camadas'],
  ['queima', 'Queima', 'Ex.: 1260 °C, cone 10, redução'],
  ['argila', 'Argila', 'Ex.: grês escuro com ferro'],
  ['autor', 'Autor / ateliê', 'Quem fez a peça'],
  ['fonte', 'Fonte', 'Onde você viu'],
  ['url', 'Link', 'Endereço da imagem ou do post'],
]

/** Ficha de uma ideia de esmaltação: a imagem, o que se sabe dela e os testes que ela gerou. */
export default function IdeiaDetalhe() {
  const { id } = useParams()
  const [sp] = useSearchParams()
  const nav = useNavigate()
  const i = useLiveQuery(() => db.ideias.get(id!), [id])
  const familias = useFamilias()
  const testes = useLiveQuery(async () => (await db.testes.where('ideiaId').equals(id!).toArray()).filter((t) => !t.excluido).sort((a, b) => b.criadoEm - a.criadoEm), [id], [])
  const [criando, setCriando] = useState(false)
  const recem = sp.get('novo') === '1'

  // ideia criada e abandonada sem nada preenchido: não fica sobrando no mural
  const atual = useRef<IdeiaEsmalte | undefined>(undefined)
  useEffect(() => { atual.current = i }, [i])
  useEffect(() => () => {
    const x = atual.current
    if (recem && x && Date.now() - x.criadoEm > 1500 && !x.titulo.trim() && !x.imagens.length && !x.imagemExterna && !x.esmaltes && !x.notas) void db.ideias.delete(x.id)
  }, [recem])

  if (i === undefined) return null
  if (!i || i.excluido) return <div className="page"><p>Ideia não encontrada.</p></div>
  const salvar = (x: Partial<IdeiaEsmalte>) => db.ideias.update(i.id, { ...x, atualizadoEm: Date.now() })
  const alternar = (k: 'efeitos' | 'familias', v: string) => salvar({ [k]: i[k].includes(v) ? i[k].filter((x) => x !== v) : [...i[k], v] })
  async function testar() {
    if (criando || !i) return
    setCriando(true)
    try { nav(`/testes/${await testarIdeia(i)}/editar`) } finally { setCriando(false) }
  }

  return (
    <div className="page ideia">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/ideias" className="back"><ArrowLeft size={15} />Ideias</Link>
        <div style={{ display: 'flex', gap: 2 }}>
          <button className="iconbtn" aria-label="Favoritar" onClick={() => alternarFavorito('ideias', i.id, i.favorito)}><Heart size={19} fill={i.favorito ? 'currentColor' : 'none'} /></button>
          <Menu itens={[
            { l: 'Excluir ideia', icon: <Trash2 size={16} />, onClick: async () => { if (confirm('Excluir esta ideia?')) { await excluir('ideias', i.id); nav('/ideias') } } },
          ]} />
        </div>
      </div>

      <div className="detalhe">
        <div>
          {!i.imagens.length && i.imagemExterna
            ? <div className="ideia-externa"><ImgRef r={i} style={{ height: 'auto' }} /></div>
            : <CapaFotos fotos={i.imagens} onChange={(v) => salvar({ imagens: v })} alt={i.titulo} rotuloAdd="Adicionar imagem" vazio={<span className="faint">Foto, print ou imagem da esmaltação</span>} />}
        </div>
        <div>
          <p className="eyebrow">Ideia de esmaltação</p>
          <h1 style={{ marginTop: 6 }}><CampoTitulo valor={i.titulo} placeholder="Nome da ideia" autoFocus={recem && !i.titulo} onSalvar={(v) => salvar({ titulo: v })} /></h1>

          <button className="btn primary" style={{ marginTop: 14 }} disabled={criando} onClick={testar}><FlaskConical size={15} />Testar esta ideia</button>

          <h4 style={{ marginTop: 20 }}>Efeito</h4>
          <div className="chips">{[...EFEITOS, ...i.efeitos.filter((e) => !EFEITOS.includes(e))].map((e) => <button key={e} className={'chip' + (i.efeitos.includes(e) ? ' on' : '')} onClick={() => alternar('efeitos', e)}>{e}</button>)}</div>

          {familias.length > 0 && <>
            <h4>Família de esmalte</h4>
            <div className="chips">{familias.map((f) => <button key={f.id} className={'chip' + (i.familias.includes(f.id) ? ' on' : '')} onClick={() => alternar('familias', f.id)}>{f.nome}</button>)}</div>
          </>}

          <dl className="art-ficha" style={{ marginTop: 18 }}>
            {CAMPOS.map(([k, l, ph]) => <div key={k} style={{ display: 'contents' }}><dt>{l}</dt><dd><TextoEditavel valor={i[k] as string | undefined} rotulo={l.toLowerCase()} vazio={ph} onSalvar={(v) => salvar({ [k]: v || undefined })} /></dd></div>)}
          </dl>
          {i.url && <a className="btn sm" style={{ marginTop: 8 }} href={i.url} target="_blank" rel="noreferrer"><ExternalLink size={14} />Abrir a fonte</a>}

          <h4>Anotações</h4>
          <TextoEditavel valor={i.notas} multilinha rotulo="anotações" vazio="O que chama atenção, como você acha que foi feito, o que quer tentar…" onSalvar={(v) => salvar({ notas: v || undefined })} />
          <h4>Etiquetas</h4>
          <Tags value={i.tags} onChange={(v) => salvar({ tags: v })} />
        </div>
      </div>

      <section className="secao">
        <div className="secao-head"><h2>Testes desta ideia <span className="faint">{testes.length}</span></h2></div>
        {testes.length
          ? <div className="ideia-testes">{testes.map((t) => (
            <Link key={t.id} to={`/testes/${t.id}`} className="ideia-teste">
              <span className="ph">{t.fotos[0] ? <Foto id={t.fotos[0]} /> : <span className="faint">{t.planejado ? 'Planejado' : 'Sem foto'}</span>}</span>
              <span className="t">{t.codigo}</span>
              <span className="s">{t.resultado || t.descricaoPlano || t.data}</span>
            </Link>
          ))}</div>
          : <p className="faint">Quando você tocar em "Testar esta ideia", o teste aparece aqui, e a foto do resultado fica ao lado da imagem original.</p>}
      </section>

      <section className="secao">
        <Relacoes tipo="ideia" id={i.id} />
        <p className="faint" style={{ fontSize: 12.5 }}>Conecte esmaltes, fórmulas, referências e artistas ligados a esta ideia.</p>
      </section>
    </div>
  )
}
