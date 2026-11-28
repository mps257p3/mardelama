import { useEffect, useMemo, useState } from 'react'
import { Compass, RefreshCw, ScanSearch, Shuffle } from 'lucide-react'
import { useGrupos, useReferencias } from '../../db/hooks'
import type { Referencia } from '../../db/schema'
import { textoBusca } from '../../lib/filtros'
import { traduz } from '../../lib/curadoria'
import { useConfig2 } from '../../lib/ref2'
import { imagemDaRef, semelhanca, vetorDe, estadoVisao } from '../../lib/visao'
import { Voltar } from '../../ui/Voltar'
import { ImgRef, temImagem } from '../ref/ImgRef'
import { VisorRefs } from '../ref/VisorRefs'
import { BASE2 } from './Topo2'

const sorteia = <T,>(xs: T[], n: number) => [...xs].sort(() => Math.random() - .5).slice(0, n)

/**
 * Redescobrir: o que já está no seu Acervo, visto de novo. Tudo aqui é do acervo (nada vem de fora),
 * e a semelhança usa o modelo visual que roda no aparelho, sem custo de IA.
 */
export default function Redescobrir() {
  const refs = useReferencias()
  const grupos = useGrupos()
  const cfg = useConfig2()
  const [semente, setSemente] = useState(1)
  const [visor, setVisor] = useState<{ xs: Referencia[]; i: number }>()
  const com = useMemo(() => (refs ?? []).filter((r) => temImagem(r)), [refs])
  const nomeG = useMemo(() => new Map(grupos.map((g) => [g.id, g.nome])), [grupos])

  // há tempo sem ver: do terço mais antigo (pela última mudança), sorteado
  const antigas = useMemo(() => { void semente; const xs = [...com].sort((a, b) => a.atualizadoEm - b.atualizadoEm); return sorteia(xs.slice(0, Math.max(12, Math.ceil(xs.length / 3))), 12) }, [com, semente])
  // combinação inesperada: uma de cada coleção diferente
  const combinacao = useMemo(() => {
    void semente
    const porG = new Map<string, Referencia[]>()
    for (const r of com) for (const g of r.grupos) porG.set(g, [...(porG.get(g) ?? []), r])
    const gs = sorteia([...porG.keys()].filter((g) => (porG.get(g)?.length ?? 0) >= 2), 4)
    const usadas = new Set<string>()
    return gs.map((g) => { const r = sorteia(porG.get(g)!.filter((x) => !usadas.has(x.id)), 1)[0]; if (r) usadas.add(r.id); return r && { r, g: nomeG.get(g) ?? '' } }).filter(Boolean) as { r: Referencia; g: string }[]
  }, [com, semente, nomeG])
  // interesses atuais (Curadoria › Direção da pesquisa): o que no acervo fala deles
  const interesses = cfg.direcao.interesses.filter((i) => !i.ate || i.ate > Date.now()).map((i) => i.termo)
  const doMomento = useMemo(() => {
    if (!interesses.length) return []
    const ts = interesses.flatMap((t) => [t, traduz(t)]).map((t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''))
    return com.filter((r) => { const tx = textoBusca(r.titulo, r.autor, r.descricao, r.comentarios, r.tags, r.grupos.map((g) => nomeG.get(g) ?? '')); return ts.some((t) => tx.includes(t)) }).slice(0, 18)
  }, [com, interesses.join('|'), nomeG]) // eslint-disable-line react-hooks/exhaustive-deps

  const abrir = (xs: Referencia[], i: number) => setVisor({ xs, i })
  return (
    <div className="page ref2">
      <Voltar to={`${BASE2}/acervo`}>Acervo</Voltar>
      <div className="pag-head"><h1 className="pag-titulo">Redescobrir</h1></div>
      <p className="faint" style={{ margin: '-6px 0 18px', fontSize: 14 }}>Imagens que já estão no seu Acervo, em outras combinações. Nada aqui vem de fora.</p>
      {!com.length && <div className="empty"><Compass size={26} strokeWidth={1.1} /><span className="serif">O acervo ainda não tem imagens.</span></div>}

      {antigas.length > 0 && <section className="ref2-red">
        <div className="ref2-red-head"><h2 className="esm-grupo">Há tempo sem ver</h2><button className="btn sm ghost" onClick={() => setSemente((s) => s + 1)}><Shuffle size={14} />Outras</button></div>
        <Faixa xs={antigas} onAbrir={(i) => abrir(antigas, i)} />
      </section>}

      {combinacao.length > 1 && <section className="ref2-red">
        <div className="ref2-red-head"><h2 className="esm-grupo">Combinação inesperada</h2><button className="btn sm ghost" onClick={() => setSemente((s) => s + 1)}><Shuffle size={14} />Outra</button></div>
        <div className="ref2-combo">{combinacao.map(({ r, g }, i) => <button key={r.id} onClick={() => abrir(combinacao.map((x) => x.r), i)}><span className="ph"><ImgRef r={r} /></span><span className="s">{g}</span></button>)}</div>
      </section>}

      {interesses.length > 0 && <section className="ref2-red">
        <div className="ref2-red-head"><h2 className="esm-grupo">Para os seus interesses atuais</h2></div>
        <p className="faint" style={{ fontSize: 12.5, margin: '-4px 0 8px' }}>{interesses.join(', ')}</p>
        {doMomento.length ? <Faixa xs={doMomento} onAbrir={(i) => abrir(doMomento, i)} /> : <p className="faint" style={{ fontSize: 13 }}>Nada no acervo fala desses interesses ainda.</p>}
      </section>}

      {com.length > 4 && <Visuais com={com} nomeG={nomeG} onAbrir={abrir} />}

      {visor && <VisorRefs lista={visor.xs} inicio={visor.i} onClose={() => setVisor(undefined)} base={BASE2} />}
    </div>
  )
}

function Faixa({ xs, onAbrir }: { xs: Referencia[]; onAbrir: (i: number) => void }) {
  return <div className="ref2-faixa">{xs.map((r, i) => <button key={r.id} onClick={() => onAbrir(i)} aria-label={r.titulo}><ImgRef r={r} /></button>)}</div>
}

/** Parecidas e conexões entre coleções, pelo modelo visual do aparelho. Só roda quando você toca (lê as imagens uma vez e guarda). */
function Visuais({ com, nomeG, onAbrir }: { com: Referencia[]; nomeG: Map<string, string>; onAbrir: (xs: Referencia[], i: number) => void }) {
  const [estado, setEstado] = useState<string>()
  const [parecidas, setParecidas] = useState<{ base: Referencia; xs: Referencia[] }>()
  const [pontes, setPontes] = useState<{ a: Referencia; b: Referencia; ga: string; gb: string }[]>()
  const [erro, setErro] = useState<string>()
  useEffect(() => { setErro(undefined) }, [com.length])

  async function vetores(xs: Referencia[]) {
    const out = new Map<string, Float32Array>(); let k = 0
    for (const r of xs) { const im = imagemDaRef(r); const v = im ? await vetorDe(im) : undefined; if (v) out.set(r.id, v); setEstado(`Lendo imagens ${++k} de ${xs.length}…`) }
    return out
  }
  async function procurarParecidas() {
    setErro(undefined); setParecidas(undefined)
    const base = sorteia(com, 1)[0]
    const amostra = [base, ...sorteia(com.filter((r) => r.id !== base.id), 160)]
    const vs = await vetores(amostra); setEstado(undefined)
    const vb = vs.get(base.id)
    if (!vb) { setErro(estadoVisao().fase === 'erro' ? 'O modelo de visão não baixou agora. Confira a internet e tente de novo.' : 'Não deu para ler essa imagem. Tente de novo.'); return }
    const xs = amostra.slice(1).filter((r) => vs.has(r.id)).map((r) => ({ r, n: semelhanca(vb, vs.get(r.id)!) })).sort((a, b) => b.n - a.n).slice(0, 10).map((x) => x.r)
    setParecidas({ base, xs })
  }
  async function procurarPontes() {
    setErro(undefined); setPontes(undefined)
    const porG = new Map<string, Referencia[]>()
    for (const r of com) for (const g of r.grupos) porG.set(g, [...(porG.get(g) ?? []), r])
    const gs = sorteia([...porG.keys()].filter((g) => (porG.get(g)?.length ?? 0) >= 3), 6)
    if (gs.length < 2) { setErro('Faltam coleções com imagens para comparar.'); return }
    const amostra = [...new Map(gs.flatMap((g) => sorteia(porG.get(g)!, 12)).map((r) => [r.id, r])).values()]
    const vs = await vetores(amostra); setEstado(undefined)
    const achados: { a: Referencia; b: Referencia; ga: string; gb: string; n: number }[] = []
    for (let i = 0; i < gs.length; i++) for (let j = i + 1; j < gs.length; j++) {
      const A = porG.get(gs[i])!.filter((r) => vs.has(r.id)), B = porG.get(gs[j])!.filter((r) => vs.has(r.id) && !r.grupos.includes(gs[i]))
      let melhor: { a: Referencia; b: Referencia; n: number } | undefined
      for (const a of A) for (const b of B) { if (a.id === b.id) continue; const n = semelhanca(vs.get(a.id)!, vs.get(b.id)!); if (!melhor || n > melhor.n) melhor = { a, b, n } }
      if (melhor) achados.push({ ...melhor, ga: nomeG.get(gs[i]) ?? '', gb: nomeG.get(gs[j]) ?? '' })
    }
    setPontes(achados.sort((a, b) => b.n - a.n).slice(0, 4))
  }
  return <>
    <section className="ref2-red">
      <div className="ref2-red-head"><h2 className="esm-grupo">Parecidas, pela imagem</h2><button className="btn sm ghost" disabled={!!estado} onClick={() => procurarParecidas().catch((e) => { setEstado(undefined); setErro((e as Error).message) })}><ScanSearch size={14} />{parecidas ? 'Outra' : 'Procurar'}</button></div>
      {parecidas && <><p className="faint" style={{ fontSize: 12.5, margin: '-4px 0 8px' }}>Partindo de “{parecidas.base.titulo}”</p><Faixa xs={[parecidas.base, ...parecidas.xs]} onAbrir={(i) => onAbrir([parecidas.base, ...parecidas.xs], i)} /></>}
    </section>
    <section className="ref2-red">
      <div className="ref2-red-head"><h2 className="esm-grupo">Conexões entre coleções</h2><button className="btn sm ghost" disabled={!!estado} onClick={() => procurarPontes().catch((e) => { setEstado(undefined); setErro((e as Error).message) })}><RefreshCw size={14} />{pontes ? 'Outras' : 'Procurar'}</button></div>
      {pontes?.map((p, i) => <div key={i} className="ref2-ponte">
        <button onClick={() => onAbrir([p.a, p.b], 0)}><span className="ph"><ImgRef r={p.a} /></span><span className="s">{p.ga}</span></button>
        <button onClick={() => onAbrir([p.a, p.b], 1)}><span className="ph"><ImgRef r={p.b} /></span><span className="s">{p.gb}</span></button>
      </div>)}
      {pontes && !pontes.length && <p className="faint" style={{ fontSize: 13 }}>Nenhuma conexão clara desta vez.</p>}
    </section>
    {estado && <p className="faint" style={{ fontSize: 12.5 }}>{estado}</p>}
    {erro && <p className="faint" style={{ fontSize: 13 }}>{erro}</p>}
  </>
}
