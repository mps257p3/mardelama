import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, Check, ExternalLink, FlaskConical, Heart, Pencil, Trash2 } from 'lucide-react'
import { db, type IdeiaEsmalte } from '../../db/schema'
import { alternarFavorito, excluir, useEsmaltes, useFamilias } from '../../db/hooks'
import { normaliza } from '../../lib/filtros'
import { EFEITOS, testarIdeia } from '../../lib/ideias'
import { CapaFotos } from '../../ui/GaleriaFotos'
import { Relacoes } from '../../ui/Relacoes'
import { Menu } from '../../ui/Menu'
import { Foto, Tags } from '../../ui/form'
import { TextoEditavel } from '../../ui/editavel'
import { CampoTitulo } from '../obras/comum'
import { ImgRef } from '../ref/ImgRef'

const CAMPOS: [keyof IdeiaEsmalte, string, string][] = [
  ['materiais', 'Esmaltes e materiais', 'Um por linha. Ex.: Transparente brilhante: cobre tudo'],
  ['esmaltes', 'Como foi feito', 'Esmaltes, camadas, máscaras, ordem de aplicação…'],
  ['queima', 'Queima', 'Ex.: 1260 °C, cone 10, redução'],
  ['argila', 'Argila', 'Ex.: grês escuro com ferro'],
  ['autor', 'Autor / ateliê', 'Quem fez a peça'],
  ['fonte', 'Fonte', 'Onde você viu'],
  ['url', 'Link', 'Endereço da imagem ou do post'],
]

const maiuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/**
 * Texto corrido em blocos fáceis de ler: cada parágrafo que começa com "Rótulo:" ganha um título pequeno,
 * e enumerações separadas por ponto e vírgula viram lista.
 */
function Leitura({ texto, numerada }: { texto: string; numerada?: boolean }) {
  const blocos = texto.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean)
  return <>{blocos.map((b, i) => {
    const m = /^([^.:\n]{2,40}):\s+([\s\S]*)$/.exec(b)
    const rotulo = m?.[1], corpo = (m?.[2] ?? b).trim()
    const itens = corpo.split(/;\s+/).map((x) => x.trim().replace(/\.$/, '')).filter(Boolean)
    const lista = itens.length >= 3
    const Lista = numerada ? 'ol' : 'ul'
    return (
      <div key={i} className="leitura-bloco">
        {rotulo && <p className="leitura-rotulo">{rotulo}</p>}
        {lista ? <Lista>{itens.map((x, j) => <li key={j}>{maiuscula(x)}.</li>)}</Lista> : <p>{maiuscula(corpo)}</p>}
      </div>
    )
  })}</>
}

function Fato({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return <div className="ideia-fato"><p className="eyebrow">{rotulo}</p><p>{children}</p></div>
}

/** Ficha de uma ideia de esmaltação: a imagem, o que se sabe dela e os testes que ela gerou. */
export default function IdeiaDetalhe() {
  const { id } = useParams()
  const [sp] = useSearchParams()
  const nav = useNavigate()
  const i = useLiveQuery(() => db.ideias.get(id!), [id])
  const familias = useFamilias()
  const meusEsmaltes = useEsmaltes()
  const testes = useLiveQuery(async () => (await db.testes.where('ideiaId').equals(id!).toArray()).filter((t) => !t.excluido).sort((a, b) => b.criadoEm - a.criadoEm), [id], [])
  const [criando, setCriando] = useState(false)
  const recem = sp.get('novo') === '1'
  const [editando, setEditando] = useState(recem)

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
  const nomesFam = familias.filter((f) => i.familias.includes(f.id)).map((f) => f.nome)
  const marcas = [...i.efeitos, ...nomesFam]
  const hipotese = /^hip[oó]tese:\s*/i.test(i.esmaltes ?? '')
  const comoFeito = (i.esmaltes ?? '').replace(/^hip[oó]tese:\s*/i, '')
  const origem = [i.autor, i.fonte].filter(Boolean).join(' · ')
  // "Nome: para que serve", um por linha; se o nome bate com um esmalte seu, vira link
  const materiais = (i.materiais ?? '').split('\n').map((l) => l.replace(/^[-•*]\s*/, '').trim()).filter(Boolean).map((l) => {
    const k = l.indexOf(':')
    const nome = k > 0 ? l.slice(0, k).trim() : l, uso = k > 0 ? l.slice(k + 1).trim() : undefined
    const n = normaliza(nome)
    const meu = (meusEsmaltes ?? []).find((e) => (e.nome && n.includes(normaliza(e.nome))) || (e.codigo && n.split(/\s+/).includes(normaliza(e.codigo))))
    return { nome, uso, meu }
  })

  return (
    <div className="page ideia">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/ideias" className="back"><ArrowLeft size={15} />Ideias</Link>
        <div style={{ display: 'flex', gap: 2 }}>
          <button className="iconbtn" aria-label="Favoritar" onClick={() => alternarFavorito('ideias', i.id, i.favorito)}><Heart size={19} fill={i.favorito ? 'currentColor' : 'none'} /></button>
          <Menu itens={[
            { l: editando ? 'Terminar edição' : 'Editar ideia', icon: <Pencil size={16} />, onClick: () => setEditando(!editando) },
            { sep: true, l: '' },
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

        {editando ? (
          <div>
            <p className="eyebrow">Editando a ideia</p>
            <h1 style={{ marginTop: 6 }}><CampoTitulo valor={i.titulo} placeholder="Nome da ideia" autoFocus={recem && !i.titulo} onSalvar={(v) => salvar({ titulo: v })} /></h1>
            <h4 style={{ marginTop: 20 }}>Efeito</h4>
            <div className="chips">{[...EFEITOS, ...i.efeitos.filter((e) => !EFEITOS.includes(e))].map((e) => <button key={e} className={'chip' + (i.efeitos.includes(e) ? ' on' : '')} onClick={() => alternar('efeitos', e)}>{e}</button>)}</div>
            {familias.length > 0 && <>
              <h4>Família de esmalte</h4>
              <div className="chips">{familias.map((f) => <button key={f.id} className={'chip' + (i.familias.includes(f.id) ? ' on' : '')} onClick={() => alternar('familias', f.id)}>{f.nome}</button>)}</div>
            </>}
            <dl className="art-ficha" style={{ marginTop: 18 }}>
              {CAMPOS.map(([k, l, ph]) => <div key={k} style={{ display: 'contents' }}><dt>{l}</dt><dd><TextoEditavel valor={i[k] as string | undefined} multilinha={k === 'esmaltes' || k === 'materiais'} rotulo={l.toLowerCase()} vazio={ph} onSalvar={(v) => salvar({ [k]: v || undefined })} /></dd></div>)}
            </dl>
            <h4>Anotações</h4>
            <TextoEditavel valor={i.notas} multilinha rotulo="anotações" vazio="O que chama atenção, como você acha que foi feito, o que quer tentar…" onSalvar={(v) => salvar({ notas: v || undefined })} />
            <p className="faint" style={{ fontSize: 12.5, marginTop: 6 }}>Dica: comece um parágrafo com "Título:" para ele virar um bloco, e separe itens com ponto e vírgula para virarem lista.</p>
            <h4>Etiquetas</h4>
            <Tags value={i.tags} onChange={(v) => salvar({ tags: v })} />
            <button className="btn primary" style={{ marginTop: 20 }} onClick={() => setEditando(false)}><Check size={15} />Pronto</button>
          </div>
        ) : (
          <div className="ideia-ver">
            <p className="eyebrow">Ideia de esmaltação</p>
            <h1>{i.titulo || 'Ideia sem nome'}</h1>
            <div className="ideia-acoes">
              <button className="btn primary" disabled={criando} onClick={testar}><FlaskConical size={15} />Testar esta ideia</button>
              <button className="btn" onClick={() => setEditando(true)}><Pencil size={14} />Editar</button>
            </div>

            {materiais.length > 0 && <section className="ideia-bloco">
              <h3>Esmaltes e materiais</h3>
              <ul className="ideia-mat">{materiais.map((m, k) => (
                <li key={k}>
                  <span className="n">{m.meu ? <Link to={`/esmaltes/${m.meu.id}`}>{m.nome}</Link> : m.nome}{m.meu && <span className="meu">no seu laboratório</span>}</span>
                  {m.uso && <span className="u">{m.uso}</span>}
                </li>
              ))}</ul>
            </section>}

            {comoFeito && <section className="ideia-bloco">
              <h3>Como foi feito {hipotese && <span className="ideia-hip">hipótese</span>}</h3>
              <Leitura texto={comoFeito} numerada />
            </section>}

            {(marcas.length > 0 || i.queima || i.argila) && <div className="ideia-fatos">
              {marcas.length > 0 && <Fato rotulo="Superfície">{marcas.join(', ')}</Fato>}
              {i.queima && <Fato rotulo="Queima">{i.queima}</Fato>}
              {i.argila && <Fato rotulo="Argila">{i.argila}</Fato>}
            </div>}


            {!comoFeito && !materiais.length && !marcas.length && !i.queima && !i.argila && !i.notas && <p className="faint" style={{ marginTop: 18 }}>Toque em Editar para contar o que se sabe desta esmaltação.</p>}
          </div>
        )}
      </div>

      {!editando && i.notas && <section className="secao ideia-notas">
        <h2>Anotações</h2>
        <Leitura texto={i.notas} />
        {i.tags.length > 0 && <p className="ideia-tags">{i.tags.map((t) => <span key={t}>#{t}</span>)}</p>}
      </section>}

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
          : <p className="faint">Ainda nenhum. "Testar esta ideia" cria um teste planejado, e a foto do resultado aparece aqui, ao lado da imagem original.</p>}
      </section>

      <section className="secao">
        <Relacoes tipo="ideia" id={i.id} />
      </section>

      {!editando && (origem || i.url) && <p className="ideia-origem ideia-credito">
        <span className="eyebrow">Fonte</span>
        {origem && <span>{origem}</span>}
        {i.url && <a href={i.url} target="_blank" rel="noreferrer"><ExternalLink size={13} />Ver a fonte</a>}
      </p>}
    </div>
  )
}
