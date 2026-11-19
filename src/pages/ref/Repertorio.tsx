import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Compass, RefreshCw, Sparkles, X } from 'lucide-react'
import { gerarRepertorio, iaConfigurada, lerCorrecoes, lerRepertorio, salvarCorrecoes, salvarRepertorio, type Correcoes, type Repertorio as Rep, type RepertorioSalvo } from '../../lib/iaRepertorio'
import { lerPerfil, salvarPerfil } from '../../lib/curadoria'
import { useToast } from '../../ui/toast'

/** Aviso honesto quando a chave da IA ainda não foi colocada no servidor. */
export function IaDesligada() {
  return <div className="ia-off"><b>IA ainda não configurada.</b> Falta colocar a chave da Anthropic no servidor (Vercel), na variável <b>ANTHROPIC_API_KEY</b>. Enquanto isso, o resto do app funciona normalmente, só sem as sugestões automáticas.</div>
}

const SECOES: [keyof Rep, string][] = [['temas', 'Temas'], ['linguagens', 'Linguagens'], ['formas', 'Formas e volumes'], ['texturas', 'Texturas e superfícies'], ['artistas', 'Artistas'], ['tendencias', 'Tendências']]

export default function Repertorio() {
  const toast = useToast()
  const [ia, setIa] = useState<boolean>()
  const [s, setS] = useState<RepertorioSalvo>()
  const [cor, setCor] = useState<Correcoes>({ removidos: [], nota: '' })
  const [gerando, setGerando] = useState(false)
  useEffect(() => { iaConfigurada().then(setIa); lerRepertorio().then(setS); lerCorrecoes().then(setCor) }, [])

  async function gerar() {
    setGerando(true)
    try { await salvarCorrecoes(cor); setS(await gerarRepertorio()) }
    catch (e) { toast((e as Error).message) }
    finally { setGerando(false) }
  }
  async function tirar(campo: keyof Rep, item: string) {
    if (!s) return
    const r = { ...s.r, [campo]: (s.r[campo] as string[]).filter((x) => x !== item) }
    const ns = { ...s, r }; setS(ns); await salvarRepertorio(ns)
    const nc = { ...cor, removidos: [...new Set([...cor.removidos, `${campo}: ${item}`])] }; setCor(nc); await salvarCorrecoes(nc)
  }
  async function explorar() {
    if (!s?.r.proximos.length) return
    const p = await lerPerfil(); const ate = Date.now() + 7 * 864e5
    s.r.proximos.forEach((q) => { p.temporario[q.toLowerCase()] = { p: 2, ate } })
    await salvarPerfil(p)
    try { sessionStorage.removeItem('descobrir.feed') } catch { /* sem armazenamento */ }
    toast('O Descobrir vai trazer isso nos próximos 7 dias')
  }

  const r = s?.r
  return (
    <div className="page" style={{ maxWidth: 760 }}>
      <Link to="/referencias" className="back"><ArrowLeft size={15} />Referências</Link>
      <p className="eyebrow">Repertório</p>
      <h1 style={{ marginTop: 6 }}>Meu repertório estético</h1>
      <p className="faint" style={{ fontSize: 13.5, marginTop: 6 }}>Uma leitura do seu acervo e do que você curte, salva e recusa no Descobrir. É uma interpretação: tire o que não for você e escreva o que falta.</p>

      {ia === false && <IaDesligada />}
      {ia && <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <button className="btn sm primary" onClick={gerar} disabled={gerando}>{gerando ? <><RefreshCw size={14} className="gira" />Lendo o acervo…</> : <><Sparkles size={14} />{r ? 'Atualizar leitura' : 'Gerar leitura'}</>}</button>
        {s && <span className="faint" style={{ fontSize: 12.5 }}>Feita em {new Date(s.quando).toLocaleDateString('pt-BR')}, com {s.base} {s.base === 1 ? 'referência' : 'referências'}</span>}
      </div>}

      {r && <>
        <p className="serif rep-sintese">{r.sintese}</p>
        {r.paleta.length > 0 && <section className="rep-sec"><h3>Paleta recorrente</h3><div className="rep-cores">{r.paleta.map((c) => <span key={c} title={c} style={{ background: c }} />)}</div></section>}
        {SECOES.map(([k, l]) => (r[k] as string[]).length > 0 && <section key={k} className="rep-sec"><h3>{l}</h3>
          <div className="rep-itens">{(r[k] as string[]).map((x) => <span key={x} className="chip">{x}<button aria-label={`Tirar ${x}`} onClick={() => tirar(k, x)}><X size={12} /></button></span>)}</div></section>)}
        {r.evolucao && <section className="rep-sec"><h3>Como vem mudando</h3><p style={{ fontSize: 15 }}>{r.evolucao}</p></section>}
        {r.proximos.length > 0 && <section className="rep-sec"><h3>Para explorar a seguir</h3>
          <div className="rep-itens">{r.proximos.map((x) => <span key={x} className="chip">{x}</span>)}</div>
          <button className="btn sm" style={{ marginTop: 10 }} onClick={explorar}><Compass size={14} />Levar ao Descobrir</button></section>}
      </>}

      {ia && <section className="rep-sec"><h3>Algo errado ou faltando?</h3>
        <textarea className="input" rows={3} placeholder="Ex.: não gosto de brilho; me interesso por arquitetura brutalista; Lucie Rie é central" value={cor.nota}
          onChange={(e) => setCor({ ...cor, nota: e.target.value })} onBlur={() => salvarCorrecoes(cor)} />
        <p className="faint" style={{ fontSize: 12.5, marginTop: 6 }}>Entra na próxima leitura, junto com o que você tirou{cor.removidos.length ? ` (${cor.removidos.length})` : ''}.</p>
      </section>}
    </div>
  )
}
