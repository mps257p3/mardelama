import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, FlaskConical, ImagePlus, Image as ImageIcon, Sparkles, Trash2 } from 'lucide-react'
import { ehInstagram, guardar, lerComIA, lerRecebido, limparRecebido, previaDoLink, type Destino, type Leitura, type Previa, type Recebido } from '../../lib/recebidos'
import { useToast } from '../../ui/toast'

const DESTINOS: { id: Destino; nome: string; desc: string; icone: typeof FlaskConical }[] = [
  { id: 'ideia', nome: 'Ideia de esmaltação', desc: 'Superfícies > Ideias, com esmaltes e passo a passo', icone: FlaskConical },
  { id: 'referencia', nome: 'Referência', desc: 'Acervo de imagens de inspiração', icone: ImageIcon },
  { id: 'nota', nome: 'Anotação no caderno', desc: 'Texto, aula, receita ou lembrete', icone: BookOpen },
]

/**
 * Destino do "Compartilhar" do celular (app instalado): fotos, prints, links de sites e textos.
 * O app lê o conteúdo, transcreve o texto e pergunta para onde vai. Também dá para colar um link ou escolher fotos aqui.
 */
export default function Compartilhar() {
  const [sp] = useSearchParams()
  const nav = useNavigate()
  const toast = useToast()
  const [r, setR] = useState<Recebido>()
  const [previa, setPrevia] = useState<Previa>()
  const [leitura, setLeitura] = useState<Leitura>()
  const [lendo, setLendo] = useState(false)
  const [erroIA, setErroIA] = useState<string>()
  const [salvando, setSalvando] = useState(false)
  const [colado, setColado] = useState('')
  const arquivo = useRef<HTMLInputElement>(null)

  // o que chegou: do service worker (POST com fotos) ou pelo endereço (link e texto)
  useEffect(() => {
    (async () => {
      const id = sp.get('recebido')
      const x = id ? await lerRecebido(id) : undefined
      if (x) { setR(x); return }
      const texto = sp.get('text') ?? '', url = sp.get('url') || texto.match(/https?:\/\/\S+/)?.[0] || undefined
      if (texto || url || sp.get('title')) setR({ titulo: sp.get('title') ?? '', texto, url, imagens: [] })
      else setR({ titulo: '', texto: '', imagens: [] })
    })()
  }, [sp])

  const vazio = !!r && !r.imagens.length && !r.url && !r.texto.trim()
  const chave = r ? `${r.id}|${r.url}|${r.texto}|${r.imagens.length}` : ''

  // prévia do link e leitura automática assim que há conteúdo
  useEffect(() => {
    if (!r || vazio) return
    let vivo = true
    setLeitura(undefined); setErroIA(undefined); setLendo(true)
    ;(async () => {
      const p = r.url && !r.imagens.length && !ehInstagram(r.url) ? await previaDoLink(r.url) : undefined
      if (!vivo) return
      setPrevia(p)
      try { const l = await lerComIA(r, p); if (vivo) { setLeitura(l); if (!l) setErroIA('A leitura automática não está ligada. Escolha o destino abaixo.') } }
      catch (e) { if (vivo) setErroIA((e as Error).message) }
      finally { if (vivo) setLendo(false) }
    })()
    return () => { vivo = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave])

  const urls = useMemo(() => (r?.imagens ?? []).map((b) => URL.createObjectURL(b)), [r?.imagens])
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls])

  if (!r) return null

  async function escolher(d: Destino) {
    if (!r || salvando) return
    setSalvando(true)
    try {
      const caminho = await guardar(d, r, leitura, previa)
      toast(d === 'ideia' ? 'Ideia guardada' : d === 'referencia' ? 'Referência guardada' : 'Anotação guardada')
      nav(caminho, { replace: true })
    } catch (e) { toast('Não deu para guardar: ' + (e as Error).message); setSalvando(false) }
  }

  async function descartar() {
    await limparRecebido(r?.id)
    nav('/', { replace: true })
  }

  function usarColado(files?: FileList | null) {
    const texto = colado.trim()
    const imagens = [...(files ?? [])].filter((f) => f.type.startsWith('image/'))
    if (!texto && !imagens.length) return
    setR({ titulo: '', texto, url: texto.match(/https?:\/\/\S+/)?.[0], imagens })
    setColado('')
  }

  const sugerido = leitura?.destino
  const titulo = leitura?.titulo || r.titulo || previa?.titulo

  return (
    <div className="page recebido" style={{ maxWidth: 760 }}>
      <Link to="/" className="back"><ArrowLeft size={15} />Início</Link>
      <p className="eyebrow">Recebido</p>
      <h1 style={{ marginTop: 8, marginBottom: 18 }}>{vazio ? 'Trazer para o app' : titulo || (lendo ? 'Lendo…' : 'Sem título')}</h1>

      {vazio ? (
        <div className="recebido-colar">
          <p className="faint">No celular, use o botão Compartilhar de qualquer app (galeria, navegador, Instagram) e escolha Mar de Lama. Para o Instagram, mande o print: o link não abre de fora. Aqui você também pode colar um link de site ou escolher fotos.</p>
          <textarea className="input" rows={3} placeholder="Cole um link ou um texto" value={colado} onChange={(e) => setColado(e.target.value)} />
          <div className="recebido-acoes">
            <button className="btn primary" disabled={!colado.trim()} onClick={() => usarColado()}><Sparkles size={15} />Ler</button>
            <button className="btn" onClick={() => arquivo.current?.click()}><ImagePlus size={15} />Escolher fotos</button>
            <input ref={arquivo} type="file" accept="image/*" multiple hidden onChange={(e) => usarColado(e.target.files)} />
          </div>
        </div>
      ) : <>
        {(urls.length > 0 || previa?.imagem) && (
          <div className="recebido-fotos">
            {urls.length ? urls.map((u) => <img key={u} src={u} alt="" />) : <img src={previa!.imagem} alt="" />}
          </div>
        )}
        {r.url && <p className="recebido-link"><a href={r.url} target="_blank" rel="noreferrer">{previa?.site || r.url}</a></p>}
        {r.url && ehInstagram(r.url) && !r.imagens.length && <p className="faint recebido-aviso">O Instagram não deixa abrir o post por link. Para ler a imagem e a legenda, compartilhe um print.</p>}

        <section className="recebido-leitura">
          {lendo && <p className="faint">Lendo o conteúdo e transcrevendo o texto…</p>}
          {erroIA && !lendo && <p className="faint">{erroIA}</p>}
          {leitura && <>
            {leitura.resumo && <p>{leitura.resumo}</p>}
            {leitura.autor && <p className="faint">Autor: {leitura.autor}</p>}
            {leitura.transcricao && <details className="recebido-transcricao" open={leitura.transcricao.length < 400}><summary>Texto transcrito</summary><p>{leitura.transcricao}</p></details>}
          </>}
          {!leitura && !lendo && r.texto && <p className="recebido-texto">{r.texto}</p>}
        </section>

        <h2 className="recebido-pergunta">Para onde vai?</h2>
        <div className="recebido-destinos">
          {DESTINOS.map(({ id, nome, desc, icone: I }) => (
            <button key={id} className={'recebido-destino' + (sugerido === id ? ' on' : '')} disabled={salvando} onClick={() => escolher(id)}>
              <I size={20} />
              <span className="t">{nome}{sugerido === id && <em>sugerido</em>}</span>
              <span className="s">{sugerido === id && leitura?.porque ? leitura.porque : desc}</span>
            </button>
          ))}
        </div>
        <button className="btn sm recebido-descartar" onClick={descartar}><Trash2 size={14} />Descartar</button>
      </>}
    </div>
  )
}
