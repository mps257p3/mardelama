import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Bookmark, BookmarkCheck, Heart, Sparkles, X } from 'lucide-react'
import { db, type Esmalte, type Referencia } from '../../db/schema'
import { useArquivoUrl } from '../../db/files'
import { definirAjuste, useAjuste } from '../../db/settings'
import { FONTE, type ItemDescoberta } from '../../lib/fontes'
import { lerPerfil } from '../../lib/curadoria'
import { explicarObra, iaConfigurada, type Explicacao } from '../../lib/iaRepertorio'
import { Sheet } from '../../ui/Sheet'

const hoje = () => new Date().toLocaleDateString('sv-SE')

/** Escolhe, uma vez por dia, a obra do lote que mais combina com o que você curtiu. */
export function useObraDoDia(itens: ItemDescoberta[], ativo: boolean) {
  const salva = useAjuste<{ dia: string; item: ItemDescoberta } | undefined>('descobrir.obraDoDia', undefined)
  useEffect(() => {
    if (!ativo || itens.length < 6) return
    let vivo = true
    ;(async () => {
      const atual = (await db.ajustes.get('descobrir.obraDoDia'))?.valor as { dia: string } | undefined
      if (!vivo || atual?.dia === hoje()) return
      const p = await lerPerfil()
      const nota = (x: ItemDescoberta) => x.termos.reduce((t, k) => t + (p.termos[k] ?? 0), 0) + (x.autor ? (p.artistas[x.autor] ?? 0) * 2 : 0) + (x.universo ? (p.universos[x.universo] ?? 0) * .5 : 0) + Math.random()
      const ja = new Set(p.curtidos)
      const melhor = [...itens].filter((x) => !ja.has(x.id)).sort((a, b) => nota(b) - nota(a))[0]
      if (vivo && melhor) await definirAjuste('descobrir.obraDoDia', { dia: hoje(), item: melhor })
    })()
    return () => { vivo = false }
  }, [ativo, itens])
  return salva?.dia === hoje() ? salva.item : undefined
}

export function ObraDoDia({ x, curtido, salvo, onAbrir, onCurtir, onSalvar }: { x: ItemDescoberta; curtido: boolean; salvo: boolean; onAbrir: () => void; onCurtir: () => void; onSalvar: () => void }) {
  return <section className="obra-dia">
    <button className="obra-dia-img" onClick={onAbrir} aria-label={x.titulo}><img src={x.imagemGrande} alt={x.titulo} referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.src = x.imagem }} /></button>
    <div className="obra-dia-txt">
      <span className="eyebrow">Obra do dia</span>
      <h2 className="serif">{x.titulo}</h2>
      <p>{[x.autor, x.data].filter(Boolean).join(' · ')}</p>
      <p className="faint">{FONTE[x.fonte]?.nome}</p>
      <div className="obra-dia-acoes">
        <button className={'btn sm' + (curtido ? ' primary' : '')} onClick={onCurtir}><Heart size={14} fill={curtido ? 'currentColor' : 'none'} />{curtido ? 'Curtida' : 'Curtir'}</button>
        <button className="btn sm ghost" onClick={onSalvar}>{salvo ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}{salvo ? 'No acervo' : 'Salvar'}</button>
        <button className="btn sm ghost" onClick={onAbrir}>Ver</button>
      </div>
    </div>
  </section>
}

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
