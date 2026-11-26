import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, FlaskConical, ImagePlus, Image as ImageIcon, Palette, Sparkles, Trash2 } from 'lucide-react'
import { MAX_LEITURA, NAO_SEI, abrirPdfs, ehPdf, ehInstagram, guardar, temNaoSei, lerComIA, lerRecebido, limparRecebido, previaDoLink, type Destino, type Leitura, type Previa, type Recebido, type Resposta } from '../../lib/recebidos'
import { useToast } from '../../ui/toast'

const DESTINOS: { id: Destino; nome: string; desc: string; icone: typeof FlaskConical }[] = [
  { id: 'ideia', nome: 'Ideia de esmaltação', desc: 'Esmaltaria > Ideias, com esmaltes e passo a passo', icone: FlaskConical },
  { id: 'referencia', nome: 'Referência', desc: 'Acervo de imagens de inspiração', icone: ImageIcon },
  { id: 'artista', nome: 'Artista', desc: 'Biblioteca > Artistas: as fotos viram obras dele', icone: Palette },
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
  const [pendente, setPendente] = useState<Destino>()
  const [respostas, setRespostas] = useState<Record<string, string>>({})
  const [respondidas, setRespondidas] = useState<Resposta[]>([])
  const [rodada, setRodada] = useState(0)
  const [pesquisar, setPesquisar] = useState(false)
  const [abrindoPdf, setAbrindoPdf] = useState(false)
  const arquivo = useRef<HTMLInputElement>(null)

  // o que chegou: do service worker (POST com fotos) ou pelo endereço (link e texto)
  useEffect(() => {
    (async () => {
      const id = sp.get('recebido')
      const x = id ? await lerRecebido(id) : undefined
      if (x) { setR(await comPdf(x)); return }
      const texto = sp.get('text') ?? '', url = sp.get('url') || texto.match(/https?:\/\/\S+/)?.[0] || undefined
      if (texto || url || sp.get('title')) setR({ titulo: sp.get('title') ?? '', texto, url, imagens: [] })
      else setR({ titulo: '', texto: '', imagens: [] })
    })()
  }, [sp])

  // PDF: tira o texto e recorta as figuras antes de ler
  async function comPdf(x: Recebido): Promise<Recebido> {
    if (!x.imagens.some(ehPdf)) return x
    setAbrindoPdf(true)
    try { return await abrirPdfs(x) } catch (e) { toast('Não consegui abrir o PDF: ' + (e as Error).message); return { ...x, imagens: x.imagens.filter((b) => !ehPdf(b)) } } finally { setAbrindoPdf(false) }
  }

  const vazio = !!r && !r.imagens.length && !r.url && !r.texto.trim()
  const chave = r ? `${r.id}|${r.url}|${r.texto}|${r.imagens.length}` : ''

  // prévia do link e leitura automática assim que há conteúdo (e de novo depois das respostas)
  useEffect(() => {
    if (!r || vazio) return
    let vivo = true
    setErroIA(undefined); setLendo(true)
    ;(async () => {
      let p = previa
      if (!rodada) { p = r.url && !r.imagens.length && !ehInstagram(r.url) ? await previaDoLink(r.url) : undefined; if (!vivo) return; setPrevia(p) }
      try {
        const l = await lerComIA(r, p, respondidas, leitura, pesquisar)
        if (!vivo) return
        setLeitura(l); setRespostas({})
        if (!l) setErroIA('A leitura automática não está ligada. Escolha o destino abaixo.')
      } catch (e) { if (vivo) setErroIA('A leitura não deu certo: ' + (e as Error).message) }
      finally { if (vivo) setLendo(false) }
    })()
    return () => { vivo = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave, rodada])

  // tocou num destino durante a leitura: guarda assim que ela termina, já com os campos preenchidos
  useEffect(() => { if (pendente && !lendo) { const d = pendente; setPendente(undefined); escolher(d) } }, [pendente, lendo]) // eslint-disable-line react-hooks/exhaustive-deps

  const urls = useMemo(() => (r?.imagens ?? []).map((b) => URL.createObjectURL(b)), [r?.imagens])
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls])

  if (abrindoPdf) return <div className="page recebido" style={{ maxWidth: 760 }}><p className="eyebrow">Recebido</p><p className="recebido-lendo" style={{ marginTop: 18 }}><Sparkles size={15} />Abrindo o PDF: tirando o texto e recortando as figuras…</p></div>
  if (!r) return null

  async function escolher(d: Destino) {
    if (!r || salvando) return
    if (lendo) { setPendente(d); return }
    setSalvando(true)
    try {
      const caminho = await guardar(d, r, leitura, previa)
      toast(d === 'ideia' ? 'Ideia guardada' : d === 'referencia' ? 'Referência guardada' : d === 'artista' ? 'Guardado no artista' : 'Anotação guardada')
      nav(caminho, { replace: true })
    } catch (e) { toast('Não deu para guardar: ' + (e as Error).message); setSalvando(false) }
  }

  async function descartar() {
    await limparRecebido(r?.id)
    nav('/', { replace: true })
  }

  async function usarColado(files?: FileList | null) {
    const texto = colado.trim()
    const imagens = [...(files ?? [])].filter((f) => f.type.startsWith('image/') || ehPdf(f))
    if (!texto && !imagens.length) return
    setColado('')
    setR(await comPdf({ titulo: '', texto, url: texto.match(/https?:\/\/\S+/)?.[0], imagens }))
  }

  function responder() {
    const novas = (leitura?.perguntas ?? []).map((q) => ({ pergunta: q.pergunta, resposta: (respostas[q.pergunta] ?? '').trim() })).filter((x) => x.resposta)
    if (!novas.length) return
    setRespondidas([...respondidas, ...novas]); setPesquisar(temNaoSei(novas)); setRodada((n) => n + 1)
  }

  const perguntas = !lendo ? leitura?.perguntas ?? [] : []
  const sugerido = leitura?.destino
  const titulo = leitura?.titulo || r.titulo || previa?.titulo

  return (
    <div className="page recebido" style={{ maxWidth: 760 }}>
      <Link to="/" className="back"><ArrowLeft size={15} />Início</Link>
      <p className="eyebrow">Recebido</p>
      <h1 style={{ marginTop: 8, marginBottom: 18 }}>{vazio ? 'Trazer para o app' : titulo || (lendo ? 'Lendo…' : 'Sem título')}</h1>

      {vazio ? (
        <div className="recebido-colar">
          <p className="faint">No celular, use o botão Compartilhar de qualquer app (galeria, navegador, Instagram) e escolha Mar de Lama. Para o Instagram, mande o print: o link não abre de fora. Aqui você também pode colar um link de site ou escolher fotos e PDFs.</p>
          <textarea className="input" rows={3} placeholder="Cole um link ou um texto" value={colado} onChange={(e) => setColado(e.target.value)} />
          <div className="recebido-acoes">
            <button className="btn primary" disabled={!colado.trim()} onClick={() => usarColado()}><Sparkles size={15} />Ler</button>
            <button className="btn" onClick={() => arquivo.current?.click()}><ImagePlus size={15} />Escolher fotos ou PDF</button>
            <input ref={arquivo} type="file" accept="image/*,application/pdf,.pdf" multiple hidden onChange={(e) => usarColado(e.target.files)} />
          </div>
        </div>
      ) : <>
        {(urls.length > 0 || previa?.imagem) && (
          <div className="recebido-fotos">
            {urls.length ? urls.map((u) => <img key={u} src={u} alt="" />) : <img src={previa!.imagem} alt="" />}
          </div>
        )}
        {!!r.pdfs?.length && <p className="faint recebido-aviso">PDF aberto: {r.imagens.length ? `${r.imagens.length} ${r.imagens.length > 1 ? 'figuras recortadas' : 'figura recortada'}` : 'sem figuras'} e o texto inteiro.</p>}
        {r.imagens.length > 1 && <p className="faint recebido-aviso">{r.imagens.length} fotos, que vão juntas para a mesma ficha.{r.imagens.length > MAX_LEITURA ? ` A leitura olha as ${MAX_LEITURA} primeiras.` : ''}</p>}
        {r.url && <p className="recebido-link"><a href={r.url} target="_blank" rel="noreferrer">{previa?.site || r.url}</a></p>}
        {r.url && ehInstagram(r.url) && !r.imagens.length && <p className="faint recebido-aviso">O Instagram não deixa abrir o post por link. Para ler a imagem e a legenda, compartilhe um print.</p>}

        <section className="recebido-leitura">
          {lendo && <p className="recebido-lendo"><Sparkles size={15} />{pesquisar ? 'Procurando na internet o que você não sabia… pode levar 1 ou 2 minutos.' : 'Lendo a imagem e preenchendo os campos… leva uns 20 segundos.'}</p>}
          {erroIA && !lendo && <p className="faint">{erroIA} {erroIA.startsWith('A leitura não') && <button className="btn sm" onClick={() => setRodada((n) => n + 1)}>Tentar de novo</button>}</p>}
          {leitura && <>
            {leitura.resumo && <p>{leitura.resumo}</p>}
            {leitura.autor && <p className="faint">Autor: {leitura.autor}</p>}
            {leitura.transcricao && <details className="recebido-transcricao" open={leitura.transcricao.length < 400}><summary>Texto transcrito</summary><p>{leitura.transcricao}</p></details>}
          </>}
          {!leitura && !lendo && r.texto && <p className="recebido-texto">{r.texto}</p>}
        </section>

        {perguntas.length > 0 && (
          <section className="recebido-perguntas">
            <h2 className="recebido-pergunta">Antes de guardar</h2>
            {perguntas.map((q) => (
              <div key={q.pergunta} className="recebido-q">
                <p>{q.pergunta}</p>
                <div className="chips">{[...q.opcoes.filter((o) => o !== NAO_SEI), NAO_SEI].map((o) => <button key={o} className={'chip' + (respostas[q.pergunta] === o ? ' on' : '')} onClick={() => setRespostas({ ...respostas, [q.pergunta]: o })}>{o}</button>)}</div>
                <input className="input" placeholder="Ou escreva aqui" value={[...q.opcoes, NAO_SEI].includes(respostas[q.pergunta] ?? '') ? '' : respostas[q.pergunta] ?? ''} onChange={(e) => setRespostas({ ...respostas, [q.pergunta]: e.target.value })} />
              </div>
            ))}
            <button className="btn primary" disabled={!Object.values(respostas).some((v) => v.trim())} onClick={responder}><Sparkles size={15} />Responder e completar</button>
          </section>
        )}

        <h2 className="recebido-pergunta">Para onde vai?</h2>
        {pendente && <p className="faint">Guardando assim que a leitura terminar…</p>}
        <div className="recebido-destinos">
          {DESTINOS.map(({ id, nome, desc, icone: I }) => (
            <button key={id} className={'recebido-destino' + (sugerido === id ? ' on' : '')} disabled={salvando || !!pendente} onClick={() => escolher(id)}>
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
