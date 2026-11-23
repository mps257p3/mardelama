import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Check, ExternalLink, Heart, ImagePlus, Link2, MapPin, Pencil, Plus, Trash2, X } from 'lucide-react'
import { db, novo, type Exposicao } from '../../db/schema'
import { alternarFavorito, excluir } from '../../db/hooks'
import { secaoPorSlug } from '../../lib/biblioteca'
import { vivos } from '../../lib/artistas'
import { Sheet } from '../../ui/Sheet'
import { AreaTexto, Campo, Texto } from '../../ui/form'
import { TextoEditavel } from '../../ui/editavel'
import { useToast } from '../../ui/toast'
import { HeroSecao } from './SecaoBiblioteca'
import { ImgObra } from './art/ImgObra'
import { salvarArquivo } from '../../db/files'
import { cabecalhoLogin } from '../../lib/login'

const ehImagem = (u: string) => /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(u)
/** Imagem de destaque da página da exposição (a mesma que aparece ao compartilhar o link). */
async function imagemDaPagina(u: string): Promise<string | undefined> {
  if (ehImagem(u)) return u
  const r = await fetch('/api/previa?u=' + encodeURIComponent(u), { headers: await cabecalhoLogin() })
  const j = await r.json().catch(() => ({}))
  return r.ok && j.imagem ? j.imagem : undefined
}
/** Link que fala só desta exposição (não a página inicial do local). */
const linkProprio = (u?: string) => { try { return !!u && new URL(u).pathname.replace(/\/+$/, '').length > 1 } catch { return false } }

const hojeISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const data = (iso?: string) => { if (!iso) return ''; const [a, m, d] = iso.split('-').map(Number); return `${d} ${MESES[m - 1]} ${a}` }
export const periodo = (e: Exposicao) => [e.inicio && (e.fim || e.fimAprox ? data(e.inicio) : 'desde ' + data(e.inicio)), e.fim ? 'até ' + data(e.fim) : e.fimAprox].filter(Boolean).join(' · ')
const mapa = (e: Exposicao) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(`${e.local}, ${e.endereco ?? ''}, São Paulo`)
/** Sem dia de encerramento, consideramos o fim do mês citado (ex.: "até janeiro de 2027"). */
export function fimEfetivo(e: Exposicao) {
  if (e.fim) return e.fim
  const m = e.fimAprox && /(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\w*\s+de\s+(\d{4})/i.exec(e.fimAprox)
  if (!m) return undefined
  const mes = MESES.indexOf(m[1].toLowerCase()) + 1, ano = Number(m[2])
  return `${ano}-${String(mes).padStart(2, '0')}-${new Date(ano, mes, 0).getDate()}`
}

type Rascunho = Partial<Exposicao>

/** Agenda de exposições de cerâmica: só na cidade de São Paulo. */
export default function Agenda() {
  const s = secaoPorSlug('agenda')!
  const { hash } = useLocation()
  const toast = useToast()
  const todas = useLiveQuery(async () => vivos(await db.exposicoes.toArray()), [], [])
  const [ed, setEd] = useState<Rascunho>()
  const hoje = hojeISO()
  const grupos = useMemo(() => {
    const ord = [...todas].sort((a, b) => (a.inicio ?? '').localeCompare(b.inicio ?? ''))
    const fim = (e: Exposicao) => fimEfetivo(e) ?? '9999'
    return {
      cartaz: ord.filter((e) => (e.inicio ?? '') <= hoje && fim(e) >= hoje).sort((a, b) => fim(a).localeCompare(fim(b))),
      breve: ord.filter((e) => (e.inicio ?? '') > hoje),
      passadas: ord.filter((e) => fim(e) < hoje).reverse(),
    }
  }, [todas, hoje])
  const conferido = todas.map((e) => e.conferidoEm).filter(Boolean).sort().pop()

  // busca uma vez a foto das exposições que têm página própria e ainda não têm imagem
  const buscando = useRef(false)
  useEffect(() => {
    if (buscando.current || !navigator.onLine) return
    const faltam = todas.filter((e) => !e.imagem && !e.arquivo && !e.imagemLida && linkProprio(e.url))
    if (!faltam.length) return
    buscando.current = true
    ;(async () => {
      for (const e of faltam) {
        const img = await imagemDaPagina(e.url!).catch(() => undefined)
        await db.exposicoes.update(e.id, img ? { imagem: img, imagemLida: true, atualizadoEm: Date.now() } : { imagemLida: true })
      }
    })().finally(() => { buscando.current = false })
  }, [todas])

  const arq = useRef<HTMLInputElement>(null)
  const [lendo, setLendo] = useState(false)
  async function lerImagem() {
    const u = ed?.url?.trim(); if (!u) { toast('Preencha o link da exposição primeiro'); return }
    setLendo(true)
    try { const img = await imagemDaPagina(u); if (img) setEd({ ...ed, imagem: img, arquivo: undefined }); else toast('A página não indica uma imagem. Cole o endereço da imagem ou envie uma foto.') }
    catch { toast('Não consegui abrir a página') } finally { setLendo(false) }
  }

  useEffect(() => { const id = hash.slice(1); if (id) setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80) }, [hash, todas.length])

  async function salvar() {
    if (!ed?.titulo?.trim() || !ed.local?.trim()) { toast('Escreva o nome da exposição e o local'); return }
    const x = { ...ed, titulo: ed.titulo.trim(), local: ed.local.trim() }
    if (x.id) await db.exposicoes.update(x.id, { ...x, atualizadoEm: Date.now() })
    else await db.exposicoes.add(novo({ ...x, origem: 'usuario' } as Omit<Exposicao, 'id' | 'criadoEm' | 'atualizadoEm'>))
    setEd(undefined); toast('Exposição salva')
  }

  const Cartao = ({ e }: { e: Exposicao }) => (
    <article id={e.id} className={'expo' + (hash.slice(1) === e.id ? ' alvo' : '') + (e.visitada ? ' fui' : '')}>
      {(e.imagem || e.arquivo) && <div className="expo-foto"><ImgObra o={{ imagem: e.imagem, arquivo: e.arquivo, titulo: e.titulo }} /></div>}
      <div className="expo-data">{periodo(e) || 'Datas a confirmar'}{e.gratuita && <span className="selo verificado">Gratuita</span>}{e.visitada && <span className="selo">Visitada</span>}</div>
      <h3>{e.titulo}</h3>
      <p className="expo-local"><MapPin size={14} /><a href={mapa(e)} target="_blank" rel="noreferrer">{e.local}{e.endereco ? ` · ${e.endereco}` : ''}</a></p>
      {e.artistas && <p className="expo-meta"><b>Artistas:</b> {e.artistas}</p>}
      {e.curadoria && <p className="expo-meta"><b>Curadoria:</b> {e.curadoria}</p>}
      {e.descricao && <p className="expo-desc">{e.descricao}</p>}
      <div className="expo-notas"><TextoEditavel valor={e.notas} multilinha rotulo="nota" vazio="Anotar algo (com quem ir, o que observar)…" onSalvar={(v) => db.exposicoes.update(e.id, { notas: v, atualizadoEm: Date.now() })} /></div>
      <div className="expo-acoes">
        <button className={'btn sm' + (e.favorito ? ' on' : '')} onClick={() => alternarFavorito('exposicoes', e.id, e.favorito)}><Heart size={14} fill={e.favorito ? 'currentColor' : 'none'} />Quero ir</button>
        <button className={'btn sm' + (e.visitada ? ' on' : '')} onClick={() => db.exposicoes.update(e.id, { visitada: !e.visitada, atualizadoEm: Date.now() })}><Check size={14} />Fui</button>
        {e.url && <a className="btn sm" href={e.url} target="_blank" rel="noreferrer"><ExternalLink size={14} />Site</a>}
        {e.fonte && e.fonte !== e.url && <a className="btn sm ghost" href={e.fonte} target="_blank" rel="noreferrer">Fonte</a>}
        <span style={{ flex: 1 }} />
        <button className="iconbtn" aria-label="Editar" onClick={() => setEd(e)}><Pencil size={15} /></button>
        <button className="iconbtn" aria-label="Excluir" onClick={async () => { if (confirm('Tirar esta exposição da agenda?')) await excluir('exposicoes', e.id) }}><Trash2 size={15} /></button>
      </div>
    </article>
  )

  return (
    <div className="page bib" style={{ maxWidth: 900 }}>
      <HeroSecao s={s} />
      <div className="head" style={{ marginTop: 18, alignItems: 'flex-start' }}>
        <p className="faint" style={{ fontSize: 13.5, margin: 0, maxWidth: 560 }}>Só exposições na cidade de São Paulo.{conferido ? ` Lista conferida em ${conferido}.` : ''} Horários e datas mudam: confirme no site antes de ir.</p>
        <button className="btn sm" onClick={() => setEd({ gratuita: false })}><Plus size={14} />Adicionar</button>
      </div>

      <h2 className="expo-grupo">Em cartaz</h2>
      {grupos.cartaz.map((e) => <Cartao key={e.id} e={e} />)}
      {grupos.cartaz.length === 0 && <p className="faint">Nada em cartaz na lista agora.</p>}

      {grupos.breve.length > 0 && <><h2 className="expo-grupo">Em breve</h2>{grupos.breve.map((e) => <Cartao key={e.id} e={e} />)}</>}

      {grupos.passadas.length > 0 && <details className="art-bloco" style={{ marginTop: 28 }}><summary><h2>Encerradas ({grupos.passadas.length})</h2></summary><div className="corpo">{grupos.passadas.map((e) => <Cartao key={e.id} e={e} />)}</div></details>}

      {ed && <Sheet onClose={() => setEd(undefined)} label="Exposição" alto>
        <h3>{ed.id ? 'Editar exposição' : 'Nova exposição'}</h3>
        <div className="form" style={{ marginTop: 12 }}>
          <Campo label="Nome da exposição" wide><Texto value={ed.titulo} onChange={(v) => setEd({ ...ed, titulo: v })} autoFocus={!ed.id} /></Campo>
          <Campo label="Local (museu, galeria…)"><Texto value={ed.local} onChange={(v) => setEd({ ...ed, local: v })} /></Campo>
          <Campo label="Endereço em São Paulo"><Texto value={ed.endereco} onChange={(v) => setEd({ ...ed, endereco: v })} /></Campo>
          <Campo label="Abre em"><Texto type="date" value={ed.inicio} onChange={(v) => setEd({ ...ed, inicio: v || undefined })} /></Campo>
          <Campo label="Fica até"><Texto type="date" value={ed.fim} onChange={(v) => setEd({ ...ed, fim: v || undefined, fimAprox: v ? undefined : ed.fimAprox })} /></Campo>
          <Campo label="Artistas" wide><Texto value={ed.artistas} onChange={(v) => setEd({ ...ed, artistas: v })} /></Campo>
          <Campo label="Curadoria"><Texto value={ed.curadoria} onChange={(v) => setEd({ ...ed, curadoria: v })} /></Campo>
          <Campo label="Entrada"><select className="input" value={ed.gratuita ? 's' : 'n'} onChange={(e) => setEd({ ...ed, gratuita: e.target.value === 's' })}><option value="n">Paga ou não informada</option><option value="s">Gratuita</option></select></Campo>
          <Campo label="Sobre a exposição" wide><AreaTexto rows={3} value={ed.descricao} onChange={(v) => setEd({ ...ed, descricao: v })} /></Campo>
          <Campo label="Link da exposição" wide><Texto type="url" placeholder="https://" value={ed.url} onChange={(v) => setEd({ ...ed, url: v || undefined })} /></Campo>
          <Campo label="Foto" wide>
            {(ed.imagem || ed.arquivo) && <div className="expo-foto" style={{ marginBottom: 8 }}><ImgObra o={{ imagem: ed.imagem, arquivo: ed.arquivo, titulo: ed.titulo }} /></div>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <button type="button" className="btn sm" disabled={lendo} onClick={lerImagem}><Link2 size={14} />{lendo ? 'Lendo…' : 'Pegar do link'}</button>
              <button type="button" className="btn sm" onClick={() => arq.current?.click()}><ImagePlus size={14} />Enviar foto</button>
              {(ed.imagem || ed.arquivo) && <button type="button" className="btn sm ghost" onClick={() => setEd({ ...ed, imagem: undefined, arquivo: undefined })}><X size={14} />Tirar</button>}
              <input ref={arq} type="file" accept="image/*" hidden onChange={async (ev) => { const f = ev.target.files?.[0]; if (f) setEd({ ...ed, arquivo: await salvarArquivo(f), imagem: undefined }) }} />
            </div>
            <Texto type="url" placeholder="ou cole o endereço de uma imagem" value={ed.imagem} onChange={(v) => setEd({ ...ed, imagem: v || undefined, arquivo: v ? undefined : ed.arquivo })} />
          </Campo>
        </div>
        <div className="barra-salvar"><button className="btn ghost" onClick={() => setEd(undefined)}>Cancelar</button><button className="btn primary" onClick={salvar}>Salvar</button></div>
      </Sheet>}
    </div>
  )
}
