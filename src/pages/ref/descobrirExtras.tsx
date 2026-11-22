import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { FolderPlus, RefreshCw, ScanSearch, Sparkles, X } from 'lucide-react'
import { db, novo, type Esmalte, type Referencia } from '../../db/schema'
import { useArquivoUrl } from '../../db/files'
import { type ItemDescoberta } from '../../lib/fontes'
import { salvarNoAcervo } from '../../lib/curadoria'
import { agruparCurtidas, explicarObra, iaConfigurada, type Explicacao, type TemaCurtidas, type TemasCurtidas } from '../../lib/iaRepertorio'
import { useToast } from '../../ui/toast'
import { Sheet } from '../../ui/Sheet'

/** Explicação da obra pela IA: o que é, técnica, origem, o que observar e ideias para o ateliê. */
export function ExplicarObra({ x, onClose }: { x: ItemDescoberta; onClose: () => void }) {
  const [r, setR] = useState<Explicacao>()
  const [erro, setErro] = useState<string>()
  useEffect(() => {
    let vivo = true
    iaConfigurada().then((ok) => {
      if (!ok) { setErro('A IA não está configurada (falta a chave ANTHROPIC_API_KEY na Vercel).'); return }
      explicarObra(x).then((v) => vivo && setR(v)).catch((e) => vivo && setErro((e as Error).message))
    })
    return () => { vivo = false }
  }, [x])
  return <Sheet label="Sobre esta obra" onClose={onClose} alto>
    <h3>Sobre esta obra</h3>
    <p className="faint" style={{ fontSize: 13, margin: '2px 0 12px' }}>{x.titulo}{x.autor ? ' · ' + x.autor : ''}</p>
    {erro ? <p style={{ fontSize: 14 }}>{erro}</p> : !r ? <p className="faint" style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}><Sparkles size={15} className="gira" />Olhando a obra…</p> : <div className="explica">
      <p>{r.oque}</p>
      <h4>Técnica</h4><p>{r.tecnica}</p>
      <h4>Origem</h4><p>{r.origem}</p>
      {r.olhar.length > 0 && <><h4>Para observar</h4><ul>{r.olhar.map((t) => <li key={t}>{t}</li>)}</ul></>}
      {r.ideias.length > 0 && <><h4>Ideias para o ateliê</h4><ul>{r.ideias.map((t) => <li key={t}>{t}</li>)}</ul></>}
      <p className="faint" style={{ fontSize: 12, marginTop: 12 }}>Leitura feita por IA a partir da imagem e dos dados do museu. Confira na fonte original antes de citar.</p>
    </div>}
  </Sheet>
}

function ImgArq({ id, externa, alt }: { id?: string; externa?: string; alt: string }) {
  const url = useArquivoUrl(id)
  const src = url ?? externa
  return src ? <img src={src} alt={alt} referrerPolicy="no-referrer" /> : <div className="sem-img" />
}

type Par = { tipo: 'ref'; r: Referencia } | { tipo: 'esm'; e: Esmalte }
const palavrasDe = (...xs: (string | undefined)[]) => new Set(xs.filter(Boolean).join(' ').toLowerCase().split(/[^a-zà-ú0-9]+/).filter((w) => w.length > 3))

/** A obra ao lado das suas referências e esmaltes, para comparar forma, cor e superfície. */
export function CompararObra({ x, onClose }: { x: ItemDescoberta; onClose: () => void }) {
  const [aba, setAba] = useState<'ref' | 'esm'>('ref')
  const [par, setPar] = useState<Par>()
  const refs = useLiveQuery(() => db.referencias.filter((r) => !r.excluido && (r.imagens.length > 0 || !!r.imagemExterna)).toArray(), [], [] as Referencia[])
  const esms = useLiveQuery(() => db.esmaltes.filter((e) => !e.excluido && (e.fotos.length > 0 || (e.pecas?.length ?? 0) > 0)).toArray(), [], [] as Esmalte[])
  const alvo = useMemo(() => palavrasDe(x.titulo, ...x.termos), [x])
  const lista = useMemo(() => {
    const nota = (ws: Set<string>) => [...ws].filter((w) => alvo.has(w)).length
    if (aba === 'ref') return [...refs].sort((a, b) => nota(palavrasDe(b.titulo, ...b.tags)) - nota(palavrasDe(a.titulo, ...a.tags)) || (b.atualizadoEm ?? 0) - (a.atualizadoEm ?? 0)).slice(0, 60).map((r) => ({ tipo: 'ref', r }) as Par)
    return [...esms].sort((a, b) => (b.atualizadoEm ?? 0) - (a.atualizadoEm ?? 0)).slice(0, 60).map((e) => ({ tipo: 'esm', e }) as Par)
  }, [aba, refs, esms, alvo])
  const chave = (p: Par) => (p.tipo === 'ref' ? 'r' + p.r.id : 'e' + p.e.id)
  return <Sheet label="Comparar com o seu acervo" onClose={onClose} alto>
    <h3>Ao lado do seu acervo</h3>
    <div className="comparar">
      <figure><img src={x.imagemGrande} alt={x.titulo} referrerPolicy="no-referrer" /><figcaption>{x.titulo}</figcaption></figure>
      <figure>{par ? <>{par.tipo === 'ref' ? <ImgArq id={par.r.imagens[0]} externa={par.r.imagemExterna} alt={par.r.titulo} /> : <ImgArq id={par.e.fotos[0] ?? par.e.pecas?.[0]} alt={par.e.nome} />}
        <figcaption>{par.tipo === 'ref' ? par.r.titulo : `${par.e.codigo ? par.e.codigo + ' · ' : ''}${par.e.nome}`}</figcaption></> : <div className="comparar-vazio">Escolha abaixo uma referência ou um esmalte</div>}</figure>
      {par && <button className="comparar-limpar" aria-label="Tirar" onClick={() => setPar(undefined)}><X size={14} /></button>}
    </div>
    <div className="chips" style={{ margin: '12px 0 8px' }}>
      <button className={'chip' + (aba === 'ref' ? ' on' : '')} onClick={() => setAba('ref')}>Referências</button>
      <button className={'chip' + (aba === 'esm' ? ' on' : '')} onClick={() => setAba('esm')}>Esmaltes</button>
    </div>
    {lista.length === 0 ? <p className="faint" style={{ fontSize: 13 }}>{aba === 'ref' ? 'Nenhuma referência com imagem ainda.' : 'Nenhum esmalte com foto ainda.'}</p> :
      <div className="comparar-grade">{lista.map((p) => <button key={chave(p)} className={par && chave(par) === chave(p) ? 'on' : ''} onClick={() => setPar(p)}>
        {p.tipo === 'ref' ? <ImgArq id={p.r.imagens[0]} externa={p.r.imagemExterna} alt={p.r.titulo} /> : <ImgArq id={p.e.fotos[0] ?? p.e.pecas?.[0]} alt={p.e.nome} />}
      </button>)}</div>}
  </Sheet>
}

/** Curtidas organizadas pela IA em temas: filtrar, buscar mais do tema ou virar grupo das Referências. */
export function TemasDasCurtidas({ itens, sel, onSel, onMais }: { itens: ItemDescoberta[]; sel?: TemaCurtidas; onSel: (t?: TemaCurtidas) => void; onMais: (t: TemaCurtidas) => void }) {
  const [r, setR] = useState<TemasCurtidas>()
  const [lendo, setLendo] = useState(false)
  const [criando, setCriando] = useState(false)
  const toast = useToast()
  useEffect(() => { db.ajustes.get('ia.temasCurtidas').then((a) => a?.valor && setR(a.valor as TemasCurtidas)) }, [])
  async function organizar(forcar: boolean) {
    if (!(await iaConfigurada())) { toast('A IA não está configurada.'); return }
    setLendo(true)
    try { setR(await agruparCurtidas(forcar)) } catch (e) { toast('Não deu para organizar: ' + (e as Error).message) } finally { setLendo(false) }
  }
  async function virarGrupo(t: TemaCurtidas) {
    setCriando(true)
    try {
      const nome = t.nome[0].toUpperCase() + t.nome.slice(1)
      let g = await db.grupos.filter((x) => !x.excluido && x.nome.toLowerCase() === nome.toLowerCase()).first()
      if (!g) { g = novo({ nome, descricao: t.descricao }); await db.grupos.add(g) }
      const doTema = itens.filter((x) => t.ids.includes(x.id))
      for (const x of doTema) await salvarNoAcervo(x, [g.id])
      toast(`${doTema.length} obras no grupo “${nome}”`)
    } catch (e) { toast('Não deu para criar o grupo: ' + (e as Error).message) } finally { setCriando(false) }
  }
  if (itens.length < 6) return null
  const novas = r ? itens.length - r.n : 0
  if (!r) return <div className="temas-curt"><button className="btn sm" disabled={lendo} onClick={() => organizar(false)}><Sparkles size={14} className={lendo ? 'gira' : ''} />{lendo ? 'Lendo suas curtidas…' : 'Organizar por temas'}</button></div>
  return <div className="temas-curt">
    <div className="chips">
      <button className={'chip' + (!sel ? ' on' : '')} onClick={() => onSel(undefined)}>Todas</button>
      {r.temas.map((t) => <button key={t.nome} className={'chip' + (sel?.nome === t.nome ? ' on' : '')} onClick={() => onSel(sel?.nome === t.nome ? undefined : t)}>{t.nome} <span className="faint">{t.ids.length}</span></button>)}
      <button className="chip" disabled={lendo} title="Reorganizar" aria-label="Reorganizar" onClick={() => organizar(true)}><RefreshCw size={13} className={lendo ? 'gira' : ''} />{novas > 0 ? ` ${novas} novas` : ''}</button>
    </div>
    {sel && <div className="tema-sel">
      <p>{sel.descricao}</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn sm" onClick={() => onMais(sel)}><ScanSearch size={14} />Mais disso</button>
        <button className="btn sm ghost" disabled={criando} onClick={() => virarGrupo(sel)}><FolderPlus size={14} />{criando ? 'Salvando…' : 'Virar grupo nas Referências'}</button>
      </div>
    </div>}
  </div>
}
