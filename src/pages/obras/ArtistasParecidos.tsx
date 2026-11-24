import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ScanSearch } from 'lucide-react'
import { db, type Artista, type Obra } from '../../db/schema'
import { estadoVisao, imagemDeArquivo, imagemDeUrl, semelhanca, vetorDe, vetoresDe } from '../../lib/visao'
import { ImgObra } from '../bib/art/ImgObra'

/** Resultado guardado no aparelho: abre já com a última comparação, sem ler as imagens de novo. */
interface Guardado { fotos: string; itens: { artista: string; obra: string; n: number }[] }
const CHAVE = 'mardelama.artistasParecidos.'
const ler = (ctx: string): Guardado | undefined => { try { return JSON.parse(localStorage.getItem(CHAVE + ctx) ?? 'null') ?? undefined } catch { return undefined } }
const gravar = (ctx: string, g: Guardado) => { try { localStorage.setItem(CHAVE + ctx, JSON.stringify(g)) } catch { /* sem armazenamento: só não guarda */ } }

const imagemDaObra = (o: Obra) => (o.arquivo ? imagemDeArquivo(o.arquivo) : o.imagem ? imagemDeUrl(o.imagem) : undefined)

/**
 * Artistas dos estudos cujas obras mais se parecem com as suas fotos, pela imagem (forma, textura, cor).
 * Cada obra do artista é comparada com a sua foto mais parecida; a nota do artista é a média das 2 obras mais próximas.
 */
export function ArtistasParecidos({ ctx, fotos, titulo = 'Artistas parecidos' }: { ctx: string; fotos: string[]; titulo?: string }) {
  const minhas = fotos.slice(0, 10)
  const assinatura = minhas.join(',')
  const [resultado, setResultado] = useState<Guardado | undefined>(() => ler(ctx))
  const [estado, setEstado] = useState<{ lidas: number; total: number }>()
  const [erro, setErro] = useState<string>()
  const ids = resultado?.itens ?? []
  const dados = useLiveQuery(async () => {
    const [as, os] = await Promise.all([db.artistas.bulkGet(ids.map((x) => x.artista)), db.obras.bulkGet(ids.map((x) => x.obra))])
    return ids.map((_, i) => ({ a: as[i], o: os[i] })).filter((x): x is { a: Artista; o: Obra | undefined } => !!x.a && !x.a.excluido)
  }, [ids.map((x) => x.artista + x.obra).join()])

  if (!minhas.length) return null

  async function procurar() {
    setErro(undefined)
    setEstado({ lidas: 0, total: 0 })
    const meus = await vetoresDe(minhas.map(imagemDeArquivo))
    if (!meus.length) { setEstado(undefined); setErro(estadoVisao().fase === 'erro' ? 'O modelo de visão não baixou agora. Confira a internet e tente de novo.' : 'Não deu para ler as fotos.'); return }
    const artistas = (await db.artistas.toArray()).filter((a) => !a.excluido)
    const obras = (await db.obras.toArray()).filter((o) => !o.excluido && (o.arquivo || o.imagem))
    // até 6 obras por artista, a capa primeiro
    const porArtista = new Map<string, Obra[]>()
    for (const a of artistas) {
      const xs = obras.filter((o) => o.artistaId === a.id).sort((x, y) => (y.id === a.capa ? 1 : 0) - (x.id === a.capa ? 1 : 0)).slice(0, 6)
      if (xs.length) porArtista.set(a.id, xs)
    }
    const total = [...porArtista.values()].reduce((s, xs) => s + xs.length, 0)
    let lidas = 0
    setEstado({ lidas, total })
    const notas = await Promise.all([...porArtista].map(async ([artista, xs]) => {
      const lidasObras = await Promise.all(xs.map(async (o) => {
        const w = await vetorDe(imagemDaObra(o)!)
        setEstado({ lidas: ++lidas, total })
        return { obra: o.id, n: w ? Math.max(...meus.map((v) => semelhanca(v, w))) : -1 }
      }))
      const boas = lidasObras.filter((x) => x.n > 0).sort((a, b) => b.n - a.n)
      if (!boas.length) return undefined
      const top = boas.slice(0, 2)
      return { artista, obra: boas[0].obra, n: top.reduce((s, x) => s + x.n, 0) / top.length }
    }))
    const itens = notas.filter((x): x is Guardado['itens'][number] => !!x).sort((a, b) => b.n - a.n).slice(0, 8)
    const g = { fotos: assinatura, itens }
    gravar(ctx, g); setResultado(g); setEstado(undefined)
  }
  const rodar = () => procurar().catch((e) => { setEstado(undefined); setErro((e as Error).message) })
  const desatualizado = resultado && resultado.fotos !== assinatura

  return (
    <section className="secao art-parecidos">
      <div className="secao-head">
        <h2>{titulo}</h2>
        {resultado && !estado && <button className="btn sm" onClick={rodar}><ScanSearch size={14} />{desatualizado ? 'Atualizar (fotos novas)' : 'Comparar de novo'}</button>}
      </div>
      {!resultado && !estado && <>
        <p className="faint" style={{ fontSize: 13 }}>Compara as suas fotos com as obras dos Estudos de artistas, pela forma, textura e cor.</p>
        <button className="btn sm" style={{ marginTop: 8 }} onClick={rodar}><ScanSearch size={14} />Ver artistas parecidos</button>
      </>}
      {estado && <p className="faint" style={{ fontSize: 13 }}>{estado.total ? `Comparando com as obras dos artistas: ${estado.lidas} de ${estado.total}…` : 'Lendo as suas fotos…'} A primeira vez demora; depois fica guardado no aparelho.</p>}
      {erro && <p className="faint" style={{ fontSize: 13 }}>{erro}</p>}
      {resultado && !estado && (dados?.length
        ? <div className="art-parecidos-grade">{dados.map(({ a, o }) => (
          <Link key={a.id} to={`/biblioteca/artistas/${a.id}`} className="art-parecido">
            <span className="ph"><ImgObra o={o} alt={a.nome} /></span>
            <span className="t">{a.nome}</span>
            {(a.pais[0] || a.especialidade) && <span className="s">{[a.pais[0], a.especialidade].filter(Boolean).join(' · ')}</span>}
          </Link>
        ))}</div>
        : dados && <p className="faint" style={{ fontSize: 13 }}>Nenhum artista com obras para comparar ainda.</p>)}
    </section>
  )
}
