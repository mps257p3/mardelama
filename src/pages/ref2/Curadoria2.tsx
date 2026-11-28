import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowUp, Cpu, Cloud, Plus, RefreshCw, Sparkles, X } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/schema'
import { useAjuste, definirAjuste } from '../../db/settings'
import { FONTE, anoDe, type FonteId } from '../../lib/fontes'
import { PERFIL_VAZIO, PESOS_PADRAO, UNIVERSOS, type Interacao } from '../../lib/curadoria'
import { CHAVE_AUTO } from '../../lib/gastoIA'
import { CHAVE_INSPIRA, artistasNaMesmaLinha, atualizarGostoIA, inspirarDoAcervo, lerRepertorio, type InspiracaoAcervo, type RepertorioSalvo } from '../../lib/iaRepertorio'
import {
  CATEGORIAS, EPOCAS2, HIERARQUIA_PADRAO, NIVEIS, PERFIL2, lerEsteticaDoPinterest, lerLeituraPinterest, lerPerfil2, lerStats, redefinirPerfil2, relevancia,
  salvarConfig2, salvarPerfil2, termosDoRepertorio, todosOsTemas, useConfig2, zerarStats, ehPin,
  type Categoria, type Influencias, type LeituraEstetica, type Nivel, type Perfil2, type Stats,
} from '../../lib/ref2'
import { estadoVisao } from '../../lib/visao'
import { useToast } from '../../ui/toast'
import { Voltar } from '../../ui/Voltar'
import { useGrupos } from '../../db/hooks'
import { SeletorInfluencia } from './Colecoes2'
import { BASE2 } from './Topo2'

const SECOES: [string, string][] = [['direcao', 'Direção da pesquisa'], ['repertorio', 'Meu repertório'], ['fontes', 'Fontes de descoberta'], ['diversidade', 'Diversidade do feed'], ['ia', 'Inteligência artificial'], ['historico', 'Histórico de aprendizado']]
const dataHora = (t?: number) => (t ? new Date(t).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—')

/** Curadoria de Referências 2: tudo o que guia o feed, num lugar só. Nada aqui muda a versão atual. */
export default function Curadoria2() {
  useEffect(() => { const h = window.location.hash.slice(1); if (h) setTimeout(() => document.getElementById(h)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200) }, [])
  return (
    <div className="page ref2 ref2-curadoria" style={{ maxWidth: 820 }}>
      <Voltar to={`${BASE2}/descobrir`}>Descobrir</Voltar>
      <div className="pag-head"><h1 className="pag-titulo">Curadoria</h1></div>
      <p className="faint" style={{ margin: '-6px 0 14px', fontSize: 14 }}>Três coisas separadas guiam o feed: <b>de onde</b> vêm as imagens (fontes), <b>o que define o seu gosto</b> (repertório) e <b>o que você quer explorar agora</b> (direção). Tudo aqui vale só para Referências 2.</p>
      <nav className="chips wrap ref2-indice">{SECOES.map(([id, l]) => <a key={id} className="chip" href={'#' + id} onClick={(e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}>{l}</a>)}</nav>
      <Direcao />
      <Repertorio />
      <Fontes />
      <Diversidade />
      <IA />
      <Historico />
    </div>
  )
}

function Secao({ id, titulo, desc, children }: { id: string; titulo: string; desc?: string; children: React.ReactNode }) {
  return <section id={id} className="ref2-cur-sec"><h2 className="esm-grupo">{titulo}</h2>{desc && <p className="faint ref2-cur-desc">{desc}</p>}{children}</section>
}

/* ---------- 1. Direção da pesquisa ---------- */
function Direcao() {
  const cfg = useConfig2()
  const [termo, setTermo] = useState('')
  const [prazo, setPrazo] = useState<'7' | '30' | '0'>('30')
  const d = cfg.direcao
  const agora = Date.now()
  const salvar = (mud: Partial<typeof d>) => salvarConfig2({ direcao: { ...d, ...mud } })
  const temas = todosOsTemas(cfg)
  return <Secao id="direcao" titulo="Direção da pesquisa" desc="O que você quer explorar agora. Entra numa parte de cada lote e pode ter prazo; não muda o seu perfil estético.">
    <div className="filtro-sec"><div className="filtro-tit"><span>Interesses atuais</span></div>
      {d.interesses.length > 0 && <div className="chips wrap">{d.interesses.map((i) => <button key={i.termo} className={'chip' + (i.ate && i.ate < agora ? ' vencido' : '')} onClick={() => salvar({ interesses: d.interesses.filter((x) => x.termo !== i.termo) })}>{i.termo}<small style={{ opacity: .6 }}>{i.ate ? (i.ate < agora ? 'venceu' : `até ${new Date(i.ate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`) : 'sem prazo'}</small><X size={12} /></button>)}</div>}
      <form className="ref2-novo-tema" onSubmit={(e) => { e.preventDefault(); const t = termo.trim(); if (!t) return; salvar({ interesses: [...d.interesses.filter((x) => x.termo !== t), { termo: t, ate: prazo === '0' ? undefined : agora + Number(prazo) * 86400000 }] }); setTermo('') }}>
        <input className="input" placeholder="Ex.: máscaras africanas, azul cobalto" value={termo} onChange={(e) => setTermo(e.target.value)} />
        <select className="input" style={{ width: 'auto' }} value={prazo} onChange={(e) => setPrazo(e.target.value as typeof prazo)} aria-label="Prazo"><option value="7">7 dias</option><option value="30">30 dias</option><option value="0">Sem prazo</option></select>
        <button className="btn sm" disabled={!termo.trim()}><Plus size={14} />Adicionar</button>
      </form>
    </div>
    <div className="filtro-sec"><div className="filtro-tit"><span>Temas prioritários</span></div>
      <div className="chips wrap">{temas.map((t) => <button key={t.id} className={'chip' + (d.temas.includes(t.id) ? ' on' : '')} onClick={() => salvar({ temas: d.temas.includes(t.id) ? d.temas.filter((x) => x !== t.id) : [...d.temas, t.id] })}>{t.nome}</button>)}</div>
      <p className="faint" style={{ fontSize: 12, marginTop: 6 }}>Temas novos se criam em Descobrir › Filtros › Temas.</p>
    </div>
    <div className="filtro-sec"><div className="filtro-tit"><span>Períodos preferenciais</span></div>
      <div className="chips wrap">{EPOCAS2.filter(([k]) => k !== 'todas').map(([k, l]) => <button key={k} className={'chip' + (d.epocas.includes(k) ? ' on' : '')} onClick={() => salvar({ epocas: d.epocas.includes(k) ? d.epocas.filter((x) => x !== k) : [...d.epocas, k] })}>{l}</button>)}</div>
      <p className="faint" style={{ fontSize: 12, marginTop: 6 }}>Sem filtro de época, parte do lote puxa para estes períodos (com os mesmos critérios de data).</p>
    </div>
  </Secao>
}

/* ---------- 2. Meu repertório ---------- */
const ROT_INF: [keyof Influencias, string, string][] = [
  ['colecoes', 'Coleções', 'O nome de cada coleção como pista do seu gosto (cada coleção tem também o seu nível, abaixo).'],
  ['acervo', 'Acervo', 'Referências que não vieram do Pinterest: pastas, Instagram, Descobrir, as suas.'],
  ['pinterest', 'Pinterest', 'Pins das suas pastas e a leitura estética delas.'],
  ['artistas', 'Artistas favoritos', 'Artistas da Biblioteca e as obras deles no filtro visual.'],
  ['curtidas', 'Curtidas', 'O que você curte e salva no Descobrir.'],
  ['paineis', 'Painéis', 'Referências que você levou a painéis contam mais.'],
]
function Repertorio() {
  const cfg = useConfig2()
  const grupos = useGrupos()
  const toast = useToast()
  const [rep, setRep] = useState<RepertorioSalvo>()
  const [termos, setTermos] = useState<[string, number][]>()
  const [leit, setLeit] = useState<LeituraEstetica>()
  const [lendo, setLendo] = useState(false)
  const [verCol, setVerCol] = useState(false)
  const nPins = useLiveQuery(() => db.referencias.filter((r) => ehPin(r) && !r.excluido).count(), [], 0)
  useEffect(() => { lerRepertorio().then(setRep); lerLeituraPinterest().then(setLeit) }, [])
  useEffect(() => { termosDoRepertorio(cfg, 14).then(setTermos) }, [cfg.atualizadoEm]) // eslint-disable-line react-hooks/exhaustive-deps
  async function lerPinterest() {
    setLendo(true)
    try { setLeit(await lerEsteticaDoPinterest()); toast('Pinterest lido. O próximo lote já usa.') }
    catch (e) { toast((e as Error).message) } finally { setLendo(false) }
  }
  const C = leit?.caracteristicas
  return <Secao id="repertorio" titulo="Meu repertório" desc="O que define as suas preferências. A influência de cada parte vale só para esta versão.">
    {rep && <div className="ref2-leitura"><p className="eyebrow">Leitura estética</p><p>{rep.r.sintese}</p><Link className="faint" style={{ fontSize: 12.5 }} to="/referencias/repertorio">Ver a leitura completa</Link></div>}
    <div className="filtro-sec"><div className="filtro-tit"><span>Seu Pinterest, lido pela IA</span><span className="ref2-onde ext"><Cloud size={12} />Serviço externo</span></div>
      {C ? <>
        <p style={{ fontSize: 14, lineHeight: 1.5, margin: '0 0 8px' }}>{leit!.resumo}</p>
        <dl className="ref2-carac">
          {([['Linguagens', C.linguagens], ['Materialidade', C.materialidade], ['Formas', C.formas], ['Paletas', C.paletas], ['Texturas', C.texturas], ['Grafismos', C.grafismos], ['Composição', C.composicao], ['Estilo escultórico', C.escultorico], ['Temas', C.temas]] as [string, string[]][]).filter(([, v]) => v?.length).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v.join(', ')}</dd></div>)}
          {C.abstracao && <div><dt>Figurativo e abstrato</dt><dd>{C.abstracao}</dd></div>}
        </dl>
        <p className="faint" style={{ fontSize: 12 }}>Lido em {new Date(leit!.quando).toLocaleDateString('pt-BR')} ({leit!.n} pins). {leit!.consultas.length} buscas em outras fontes saíram daqui.</p>
      </> : <p className="faint" style={{ fontSize: 13 }}>A IA olha uma amostra dos seus pins (mais das coleções de influência alta) e descreve linguagem, materiais, formas, paletas, texturas, grafismos e temas. Essas características viram buscas nas outras fontes. {nPins ? `${nPins} pins no Acervo.` : 'Ainda não há pins no Acervo.'}</p>}
      <button className="btn sm ghost" style={{ marginTop: 6 }} disabled={lendo || !nPins} onClick={lerPinterest}><Sparkles size={14} className={lendo ? 'gira' : ''} />{lendo ? 'Lendo os pins…' : C ? 'Ler de novo' : 'Ler meu Pinterest'}</button>
    </div>
    <div className="filtro-sec"><div className="filtro-tit"><span>Influência de cada parte</span></div>
      {ROT_INF.map(([k, l, d]) => <div key={k} className="ref2-inf">
        <div><b>{l}</b><span className="faint">{d}</span></div>
        <div className="seg">{NIVEIS.map(([n, nl]) => <button key={n} className={cfg.influencia[k] === n ? 'on' : ''} onClick={() => salvarConfig2({ influencia: { ...cfg.influencia, [k]: n as Nivel } })}>{nl}</button>)}</div>
      </div>)}
    </div>
    <div className="filtro-sec"><div className="filtro-tit"><span>Influência de cada coleção</span><button className="btn sm ghost" onClick={() => setVerCol(!verCol)}>{verCol ? 'Fechar' : `Ver ${grupos.length}`}</button></div>
      <p className="faint" style={{ fontSize: 12.5, margin: 0 }}>Ex.: esculturas de animais em alta, organização do ateliê em baixa. A coleção e as imagens não mudam.</p>
      {verCol && <div className="ref2-gerenciar" style={{ marginTop: 10 }}>{[...grupos].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).map((g) => <div key={g.id} className="ref2-ger-linha"><div className="ref2-ger-topo"><span className="t">{g.nome}{g.rss ? <span className="s">Pinterest</span> : null}</span></div><SeletorInfluencia id={g.id} /></div>)}</div>}
    </div>
    {termos && termos.length > 0 && <p className="faint" style={{ fontSize: 12.5 }}>Pistas do repertório agora: {termos.map(([t]) => t).join(', ')}.</p>}
  </Secao>
}

/* ---------- 3. Fontes de descoberta ---------- */
interface Teste { id: FonteId; ms: number; n: number; contemporaneas: number; historicas: number; semData: number; largura?: number; erro?: string }
function Fontes() {
  const cfg = useConfig2()
  const [st, setSt] = useState<Stats>({})
  const [testes, setTestes] = useState<Teste[]>()
  const [testando, setTestando] = useState(false)
  useEffect(() => { lerStats().then(setSt) }, [])
  const mover = (c: Categoria, d: -1 | 1) => { const p = [...cfg.prioridade]; const i = p.indexOf(c); const j = i + d; if (j < 0 || j >= p.length) return; [p[i], p[j]] = [p[j], p[i]]; salvarConfig2({ prioridade: p }) }
  const togCat = (c: Categoria) => salvarConfig2({ desligadas: cfg.desligadas.includes(c) ? cfg.desligadas.filter((x) => x !== c) : [...cfg.desligadas, c] })
  const togFonte = (f: FonteId) => salvarConfig2({ fontesOff: cfg.fontesOff.includes(f) ? cfg.fontesOff.filter((x) => x !== f) : [...cfg.fontesOff, f] })
  async function testar() {
    setTestando(true); setTestes([])
    const ids = [...new Set(Object.values(CATEGORIAS).flatMap((c) => c.fontes))]
    await Promise.all(ids.map(async (id) => {
      const t0 = performance.now()
      try {
        const xs = await FONTE[id].buscar('ceramic sculpture', 12, 1)
        const anos = xs.map((x) => (x.fonte === 'wm' ? undefined : anoDe(x.data)))
        // largura real das imagens do mural (as revistas às vezes mandam miniaturas pequenas)
        const larguras = await Promise.all(xs.slice(0, 5).map((x) => new Promise<number>((r) => { const im = new Image(); im.referrerPolicy = 'no-referrer'; im.onload = () => r(im.naturalWidth); im.onerror = () => r(0); im.src = x.imagem; setTimeout(() => r(0), 8000) })))
        const ok = larguras.filter((w) => w > 0)
        const r: Teste = { id, ms: Math.round(performance.now() - t0), n: xs.length, contemporaneas: anos.filter((a) => a != null && a >= 1960).length, historicas: anos.filter((a) => a != null && a < 1880).length, semData: anos.filter((a) => a == null).length, largura: ok.length ? Math.round(ok.reduce((a, b) => a + b, 0) / ok.length) : undefined }
        setTestes((ts) => [...(ts ?? []), r])
      } catch (e) { setTestes((ts) => [...(ts ?? []), { id, ms: Math.round(performance.now() - t0), n: 0, contemporaneas: 0, historicas: 0, semData: 0, erro: (e as Error).message }]) }
    }))
    setTestando(false)
  }
  const fmt = (f: number) => f.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
  return <Secao id="fontes" titulo="Fontes de descoberta" desc="De onde vêm as imagens. A ordem define a prioridade inicial; com o ajuste automático ligado, cada fonte ganha ou perde espaço conforme as suas reações, sempre medidas em proporção ao que ela já mostrou (nenhuma é desligada sozinha).">
    <label className="faixa" style={{ gridTemplateColumns: '1fr auto' }}><span>Ajustar a prioridade pelo que você curte, salva, oculta e recusa</span><input type="checkbox" style={{ width: 'auto' }} checked={cfg.adaptativo} onChange={(e) => salvarConfig2({ adaptativo: e.target.checked })} /></label>
    <label className="faixa"><span>Parte de cada lote para fontes menos usadas</span><input type="range" min={0} max={40} step={5} value={cfg.exploracao} onChange={(e) => salvarConfig2({ exploracao: Number(e.target.value) })} /><b>{cfg.exploracao}%</b></label>
    <div className="ref2-cats">
      {cfg.prioridade.map((c, i) => {
        const s = st['c:' + c]; const off = cfg.desligadas.includes(c)
        return <div key={c} className={'ref2-cat' + (off ? ' off' : '')}>
          <div className="ref2-cat-topo">
            <span className="n">{i + 1}</span>
            <div className="t"><b>{CATEGORIAS[c].nome}</b><span className="faint">{CATEGORIAS[c].desc}</span>
              <span className="faint ref2-cat-num">{s ? `${s.mostrados} mostradas · ${s.curtir + s.salvar + s.painel} gestos positivos · ${s.recusar + s.ocultar} negativos · relevância ${fmt(relevancia(s))}×` : 'Ainda sem dados'}{s?.visN ? ` · afinidade visual ${s.visSoma / s.visN >= 0 ? '+' : ''}${fmt((s.visSoma / s.visN) * 100)}` : ''}</span></div>
            <div className="ref2-cat-acoes">
              <button className="iconbtn" aria-label="Subir" disabled={i === 0} onClick={() => mover(c, -1)}><ArrowUp size={15} /></button>
              <button className="iconbtn" aria-label="Descer" disabled={i === cfg.prioridade.length - 1} onClick={() => mover(c, 1)}><ArrowDown size={15} /></button>
              <input type="checkbox" aria-label={off ? 'Ligar' : 'Desligar'} checked={!off} onChange={() => togCat(c)} style={{ width: 'auto' }} />
            </div>
          </div>
          {CATEGORIAS[c].fontes.length > 0 && !off && <div className="ref2-fontes">{CATEGORIAS[c].fontes.map((f) => { const sf = st['f:' + f]; const fo = cfg.fontesOff.includes(f); return <label key={f} className={'ref2-fonte' + (fo ? ' off' : '')}>
            <input type="checkbox" checked={!fo} onChange={() => togFonte(f)} style={{ width: 'auto' }} />
            <span><b>{FONTE[f].nome}</b><small className="faint">{sf ? `última resposta ${dataHora(sf.ultimoOk)} · ${sf.resultados} resultados · ${sf.falhas} falhas${sf.erro && (sf.ultimaFalha ?? 0) > (sf.ultimoOk ?? 0) ? ' · ' + sf.erro : ''}` : 'sem uso ainda'}</small></span>
          </label> })}</div>}
        </div>
      })}
    </div>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
      <button className="btn sm ghost" onClick={() => salvarConfig2({ prioridade: HIERARQUIA_PADRAO, desligadas: [], fontesOff: [] })}>Voltar à ordem inicial</button>
      <button className="btn sm" disabled={testando} onClick={testar}><RefreshCw size={14} className={testando ? 'gira' : ''} />{testando ? 'Testando…' : 'Testar as fontes agora'}</button>
    </div>
    {testes && testes.length > 0 && <div className="ref2-teste">
      <p className="faint" style={{ fontSize: 12.5 }}>Uma busca igual (“ceramic sculpture”) em cada fonte: resultados, tempo, época das obras e largura média das miniaturas.</p>
      <table><thead><tr><th>Fonte</th><th>Resultados</th><th>Tempo</th><th>Desde 1960</th><th>Até 1879</th><th>Sem data</th><th>Largura</th></tr></thead>
        <tbody>{[...testes].sort((a, b) => b.n - a.n).map((t) => <tr key={t.id}><td>{FONTE[t.id].nome}</td>{t.erro ? <td colSpan={6} className="faint">{t.erro}</td> : <><td>{t.n}</td><td>{fmt(t.ms / 1000)} s</td><td>{t.contemporaneas}</td><td>{t.historicas}</td><td>{t.semData}</td><td>{t.largura ? t.largura + ' px' : '—'}</td></>}</tr>)}</tbody></table>
    </div>}
    <DiagnosticoPinterest />
  </Secao>
}

function DiagnosticoPinterest() {
  const dados = useLiveQuery(async () => {
    const pins = await db.referencias.filter((r) => ehPin(r) && !r.excluido).toArray()
    const agora = Date.now()
    return { n: pins.length, comImg: pins.filter((p) => p.imagemExterna || p.imagens.length).length, d7: pins.filter((p) => agora - p.atualizadoEm < 7 * 86400000).length, d30: pins.filter((p) => agora - p.atualizadoEm < 30 * 86400000).length, rss: await db.grupos.filter((g) => !!g.rss && !g.excluido).count() }
  }, [])
  const rss = useAjuste<{ quando: number; novos: number; falhas: { nome: string; erro: string }[] } | undefined>('pinterest.rss.ultimo', undefined)
  const api = useAjuste<{ quando: number; novos: number; erro?: string } | undefined>('pinterest.ultimo', undefined)
  if (!dados) return null
  return <div className="ref2-leitura" style={{ marginTop: 14 }}>
    <p className="eyebrow">Pinterest</p>
    <p style={{ fontSize: 13.5 }}>{dados.n} pins no Acervo ({dados.comImg} com imagem) · {dados.d7} chegaram ou mudaram nos últimos 7 dias, {dados.d30} nos últimos 30 · {dados.rss} pastas públicas acompanhadas.</p>
    <p className="faint" style={{ fontSize: 12.5 }}>RSS: {rss ? `${dataHora(rss.quando)}, ${rss.novos} novos${rss.falhas.length ? `, ${rss.falhas.length} pastas falharam` : ''}` : 'nunca lido'} · Conta conectada: {api ? `${dataHora(api.quando)}, ${api.novos} novos${api.erro ? ', erro: ' + api.erro : ''}` : 'sem leitura registrada'}.</p>
    <p className="faint" style={{ fontSize: 12.5 }}>O app pede ao Pinterest só leitura das suas pastas e pins (user_accounts, boards e pins). A API não dá busca no Pinterest inteiro nem pins relacionados para este app; por isso o modo Pinterest mostra o que chega às suas pastas e usa as características delas para buscar em outras fontes.</p>
  </div>
}

/* ---------- 4. Diversidade ---------- */
function Diversidade() {
  const [p, setP] = useState<Perfil2>()
  useEffect(() => { lerPerfil2().then(setP) }, [])
  if (!p) return null
  const mx = p.mistura
  const mudar = (np: Perfil2) => { setP(np); salvarPerfil2(np) }
  return <Secao id="diversidade" titulo="Diversidade do feed" desc="Afinidade estética de cada lote (não é a parte de cada fonte).">
    {([['proximo', 'Afinidade: perto do seu gosto'], ['adjacente', 'Expansão: universos vizinhos'], ['experimental', 'Experimentação: o inesperado']] as const).map(([k, l]) => (
      <label key={k} className="faixa"><span>{l}</span><input type="range" min={0} max={100} step={5} value={mx[k]} onChange={(e) => mudar({ ...p, mistura: { ...mx, [k]: Number(e.target.value) } })} /><b>{Math.round((mx[k] / (mx.proximo + mx.adjacente + mx.experimental || 1)) * 100)}%</b></label>))}
    <button className="btn sm ghost" onClick={() => mudar({ ...p, mistura: PERFIL_VAZIO.mistura })}>Voltar a 60 / 25 / 15</button>
  </Secao>
}

/* ---------- 5. Inteligência artificial ---------- */
function Onde({ local }: { local?: boolean }) { return local ? <span className="ref2-onde"><Cpu size={12} />No aparelho, sem custo</span> : <span className="ref2-onde ext"><Cloud size={12} />Serviço externo (gasta crédito)</span> }
function IA() {
  const cfg = useConfig2()
  const auto = useAjuste<boolean>(CHAVE_AUTO, false)
  const toast = useToast()
  const [p, setP] = useState<Perfil2>()
  const [insp, setInsp] = useState<InspiracaoAcervo>()
  const [nAfins, setNAfins] = useState<number>()
  const [rodando, setRodando] = useState<string>()
  const ev = estadoVisao()
  useEffect(() => { lerPerfil2().then(setP); db.ajustes.get(CHAVE_INSPIRA).then((a) => a?.valor && setInsp(a.valor as InspiracaoAcervo)); db.ajustes.get('ia.afins').then((a) => setNAfins((a?.valor as { afins?: unknown[] } | undefined)?.afins?.length)) }, [])
  async function rodar(qual: string, f: () => Promise<unknown>, ok: string) {
    setRodando(qual)
    try { const r = await f(); toast(r ? ok : 'Precisa da IA configurada (e de dados suficientes).') } catch (e) { toast('A IA não respondeu: ' + (e as Error).message) } finally { setRodando(undefined) }
  }
  return <Secao id="ia" titulo="Inteligência artificial" desc="O que roda no aparelho não custa nada. O que usa serviço externo passa pela chave da Anthropic na Vercel e gasta crédito.">
    <div className="filtro-sec"><div className="filtro-tit"><span>Olhar do app</span><Onde local /></div>
      <label className="faixa" style={{ gridTemplateColumns: '1fr auto' }}><span>Comparar as imagens do feed com o seu repertório (pesado pela influência de cada parte)</span><input type="checkbox" style={{ width: 'auto' }} checked={cfg.visual} onChange={(e) => salvarConfig2({ visual: e.target.checked })} /></label>
      <p className="faint" style={{ fontSize: 12 }}>Modelo MobileCLIP, baixado uma vez (uns 12 MB). Esconde o que não tem nada a ver, ordena “Mais como esta” e a busca por imagem, e mede a afinidade de cada fonte. Estado agora: {ev.fase === 'pronto' ? 'pronto' : ev.fase === 'baixando' ? 'baixando' : ev.fase === 'erro' ? 'não carregou' : 'ainda não usado nesta sessão'}.</p></div>
    <div className="filtro-sec"><div className="filtro-tit"><span>IA em segundo plano</span><Onde /></div>
      <div className="seg"><button className={!auto ? 'on' : ''} onClick={() => definirAjuste(CHAVE_AUTO, false)}>Só pelos botões</button><button className={auto ? 'on' : ''} onClick={() => definirAjuste(CHAVE_AUTO, true)}>Automática</button></div>
      <p className="faint" style={{ fontSize: 12, marginTop: 6 }}>Este controle é o mesmo da versão atual (vale para as duas): decide se as leituras rodam sozinhas.</p></div>
    <div className="filtro-sec"><div className="filtro-tit"><span>Leitura do gosto</span><Onde /></div>
      <p style={{ fontSize: 14, margin: '0 0 6px' }}>{p?.gostoIA?.resumo ?? 'Ainda sem leitura nesta versão.'}</p>
      <button className="btn sm ghost" disabled={!!rodando} onClick={() => rodar('gosto', async () => { const g = await atualizarGostoIA(true, PERFIL2); if (g) setP(await lerPerfil2()); return g }, 'Leitura do gosto atualizada')}><Sparkles size={14} className={rodando === 'gosto' ? 'gira' : ''} />Atualizar leitura</button>
      <p className="faint" style={{ fontSize: 12, marginTop: 6 }}>Lê as curtidas e salvas de Referências 2 e grava só no perfil desta versão.</p></div>
    <div className="filtro-sec"><div className="filtro-tit"><span>Suas pastas no feed</span><Onde /></div>
      <p style={{ fontSize: 14, margin: '0 0 6px' }}>{insp?.leitura ?? 'Ainda sem leitura.'}</p>
      <button className="btn sm ghost" disabled={!!rodando} onClick={() => rodar('pastas', async () => { const n = await inspirarDoAcervo(true); if (n) setInsp(n); return n }, 'Pastas relidas')}><Sparkles size={14} className={rodando === 'pastas' ? 'gira' : ''} />Reler minhas pastas</button>
      <p className="faint" style={{ fontSize: 12, marginTop: 6 }}>Leitura do acervo compartilhada com a versão atual (a mesma IA não é paga duas vezes).</p></div>
    <div className="filtro-sec"><div className="filtro-tit"><span>Artistas na mesma linha</span><Onde /></div>
      <p className="faint" style={{ fontSize: 13 }}>{nAfins ? `${nAfins} artistas sugeridos, usados em Artistas › Novos artistas.` : 'A IA sugere artistas parecidos com os da Biblioteca. Sem isso, Novos artistas busca pelas técnicas dos seus estudos.'}</p>
      <button className="btn sm ghost" disabled={!!rodando} onClick={() => rodar('afins', async () => { const xs = await artistasNaMesmaLinha(true); setNAfins(xs.length); return xs.length }, 'Artistas atualizados')}><Sparkles size={14} className={rodando === 'afins' ? 'gira' : ''} />Procurar artistas</button></div>
    <p className="faint" style={{ fontSize: 12.5 }}>Também usam serviço externo: a busca em linguagem natural e por imagem, “Sobre” no visor, a leitura do Pinterest (em Meu repertório) e a catalogação assistida no Acervo. Buscas já feitas ficam guardadas e não são pagas de novo.</p>
  </Secao>
}

/* ---------- 6. Histórico ---------- */
const ROT_PESO: Record<Interacao, string> = { curtir: 'Curtir', salvar: 'Salvar', painel: 'Levar a um painel', semelhantes: 'Mais como esta', pesquisar: 'Pesquisar', recusar: 'Não gostei' }
function Historico() {
  const [p, setP] = useState<Perfil2>()
  const toast = useToast()
  useEffect(() => { lerPerfil2().then(setP) }, [])
  if (!p) return null
  const mudar = (np: Perfil2) => { setP(np); salvarPerfil2(np) }
  const top = Object.entries(p.termos).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 24)
  const univ = Object.entries(p.universos).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])
  const temp = Object.entries(p.temporario).filter(([, v]) => v.ate > Date.now())
  const esc = p.escondidosVisual?.itens ?? []
  return <Secao id="historico" titulo="Histórico de aprendizado" desc="O que esta versão aprendeu com você. Toque num termo para tirá-lo.">
    <p style={{ fontSize: 13.5 }}>{p.curtidos.length} curtidas · {(p.salvosItens ?? []).length} salvas aqui · {p.recusados.length} recusadas · {(p.ocultados ?? []).length} ocultadas.</p>
    <div className="filtro-sec"><div className="filtro-tit"><span>Preferências aprendidas</span></div>
      {top.length ? <div className="chips wrap">{top.map(([t]) => <button key={t} className="chip" onClick={() => { const termos = { ...p.termos }; delete termos[t]; mudar({ ...p, termos }) }}>{t}<X size={12} /></button>)}</div> : <p className="faint" style={{ fontSize: 13 }}>Ainda nada.</p>}
      {univ.length > 0 && <p className="faint" style={{ fontSize: 12.5, marginTop: 8 }}>Temas recorrentes (universos): {univ.slice(0, 8).map(([u]) => UNIVERSOS[u]?.nome ?? u).join(', ')}</p>}
      {temp.length > 0 && <><p className="faint" style={{ fontSize: 12.5, marginTop: 8 }}>Interesses de pesquisa (expiram em 7 dias):</p>
        <div className="chips wrap" style={{ marginTop: 6 }}>{temp.map(([t]) => <button key={t} className="chip" onClick={() => { const tp = { ...p.temporario }; delete tp[t]; mudar({ ...p, temporario: tp }) }}>{t}<X size={12} /></button>)}</div></>}
    </div>
    <div className="filtro-sec"><div className="filtro-tit"><span>Peso de cada gesto</span></div>
      {(Object.keys(ROT_PESO) as Interacao[]).map((k) => (
        <label key={k} className="faixa"><span>{ROT_PESO[k]}</span><input type="range" min={k === 'recusar' ? -5 : 0} max={k === 'recusar' ? 0 : 5} step={0.5} value={p.pesos[k]} onChange={(e) => mudar({ ...p, pesos: { ...p.pesos, [k]: Number(e.target.value) } })} /><b>{p.pesos[k] > 0 ? '+' : ''}{p.pesos[k]}</b></label>))}
      <button className="btn sm ghost" onClick={() => mudar({ ...p, pesos: PESOS_PADRAO })}>Pesos padrão</button>
    </div>
    <div className="filtro-sec"><div className="filtro-tit"><span>Escondidas pelo olhar do app</span></div>
      {esc.length ? <>
        <p className="faint" style={{ fontSize: 12.5, margin: '0 0 8px' }}>{esc.length} imagens recentes não pareciam com o seu repertório e ficaram fora do feed (última em {dataHora(p.escondidosVisual?.quando)}).</p>
        <div className="ref2-faixa">{esc.slice(-24).reverse().map((x) => <a key={x.id} href={x.link} target="_blank" rel="noreferrer" title={x.titulo}><img src={x.imagem} alt={x.titulo} referrerPolicy="no-referrer" loading="lazy" /></a>)}</div>
      </> : <p className="faint" style={{ fontSize: 13 }}>Nenhuma por enquanto.</p>}
    </div>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <button className="btn sm ghost" onClick={async () => { if (confirm('Recomeçar o perfil de Referências 2? Curtidas, recusas e o que foi aprendido aqui somem. O perfil da versão atual não muda.')) { await redefinirPerfil2(); setP(await lerPerfil2()); toast('Perfil experimental redefinido') } }}>Redefinir perfil experimental</button>
      <button className="btn sm ghost" onClick={async () => { if (confirm('Zerar a relevância aprendida de cada fonte?')) { await zerarStats(); toast('Relevância das fontes zerada') } }}>Zerar relevância das fontes</button>
    </div>
  </Secao>
}
