import { db, novo, type Grupo, type Referencia } from '../db/schema'
import { definirAjuste } from '../db/settings'
import { lerPerfil, salvarPerfil, traduz } from './curadoria'
import { chavePasta } from './pinterest'
import { analisarComIa } from './pinterestConta'

/**
 * Pastas e perfis públicos do Pinterest acompanhados pelo RSS oficial (sem login, sem API).
 * Cada pasta acompanhada é um grupo de Referências com o campo `rss` (sincroniza entre aparelhos).
 * O feed traz só os ~25 pins mais recentes de cada pasta: o app guarda o que chega e nunca apaga.
 */

export interface PinRss { id: string; link: string; titulo?: string; descricao?: string; imagem?: string; miniatura?: string; data?: number }
export interface FeedRss { titulo?: string; descricao?: string; perfil: string; pasta?: string; pagina: string; feed: string; pins: PinRss[] }
export interface ResultadoRss { novos: number; atualizados: number; pastas: number; analisados: number; falhas: { nome: string; erro: string }[]; quando: number }

export async function lerRss(link: string): Promise<FeedRss> {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), 20000)
  try {
    const r = await fetch('/api/pinterest-rss?u=' + encodeURIComponent(link), { signal: c.signal })
    const j = await r.json().catch(() => ({ erro: `O servidor não respondeu (HTTP ${r.status})` }))
    if (!r.ok) throw new Error(j.erro ?? `HTTP ${r.status}`)
    return j as FeedRss
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw new Error('O Pinterest demorou demais para responder.')
    throw e
  } finally { clearTimeout(t) }
}

const nomeDe = (f: FeedRss) => {
  const n = (f.pasta ? f.titulo || decodeURIComponent(f.pasta).replace(/-/g, ' ') : '@' + f.perfil).trim()
  return n[0].toUpperCase() + n.slice(1)
}

/** Começa a acompanhar uma pasta ou perfil: usa o grupo indicado, um grupo com o mesmo nome, ou cria um. */
export async function acompanhar(link: string, grupoId?: string) {
  const f = await lerRss(link)
  const grupos = (await db.grupos.toArray()).filter((g) => !g.excluido)
  if (grupos.some((g) => g.rss === f.pagina)) throw new Error('Essa pasta já está sendo acompanhada.')
  const nome = nomeDe(f)
  let g: Grupo | undefined = grupoId ? grupos.find((x) => x.id === grupoId) : grupos.find((x) => chavePasta(x.nome) === chavePasta(nome) && !x.rss)
  if (g) await db.grupos.update(g.id, { rss: f.pagina, atualizadoEm: Date.now() })
  else { g = novo({ nome, descricao: `Pinterest · ${f.pasta ? `pasta de @${f.perfil}` : 'perfil'} (RSS)`, rss: f.pagina }); await db.grupos.add(g) }
  // o nome da pasta vira interesse leve do Descobrir
  const perfil = await lerPerfil(); const k = traduz(nome.replace(/^@/, ''))
  if (k.length > 2) { perfil.termos[k] = Math.max(perfil.termos[k] ?? 0, 1); await salvarPerfil(perfil) }
  const r = await importarFeed(f, g.id)
  return { grupo: g, ...r, total: f.pins.length }
}

export async function deixarDeAcompanhar(grupoId: string) {
  await db.grupos.update(grupoId, { rss: undefined, atualizadoEm: Date.now() })
}

async function importarFeed(f: FeedRss, grupoId: string) {
  let novos = 0, atualizados = 0
  const ids: string[] = []
  const quem = f.pasta ? `@${f.perfil} / ${f.titulo ?? f.pasta}` : `@${f.perfil}`
  const lista: Referencia[] = []
  for (const p of f.pins) {
    const id = 'pinterest-' + p.id
    const ja = (await db.referencias.get(id)) ?? (await db.referencias.filter((r) => r.origem === 'pinterest:' + p.id).first())
    if (ja) {
      if (ja.excluido) continue // apagado no app: não volta
      const mud: Partial<Referencia> = {}
      if (!ja.grupos.includes(grupoId)) mud.grupos = [...ja.grupos, grupoId]
      if (!ja.imagemExterna && !ja.imagens.length && p.imagem) mud.imagemExterna = p.imagem
      if (Object.keys(mud).length) { await db.referencias.update(ja.id, { ...mud, atualizadoEm: Date.now() }); atualizados++ }
      continue
    }
    const nome = p.titulo || p.descricao
    const ref = novo({ titulo: (nome ?? 'Pin').slice(0, 120), tipo: 'Fotografia', imagens: [] as string[], tags: [] as string[], grupos: [grupoId] })
    lista.push({
      ...ref, id, origem: 'pinterest:' + p.id,
      fonte: `Pinterest · ${quem}`, url: p.link,
      descricao: [p.descricao && p.descricao !== nome ? p.descricao : '', `Pin: ${p.link}`, `Salvo por ${quem} (RSS público)`].filter(Boolean).join('\n'),
      imagemExterna: p.imagem, criadoEm: p.data ?? ref.criadoEm,
    })
  }
  if (lista.length) { await db.referencias.bulkAdd(lista); novos = lista.length; ids.push(...lista.map((x) => x.id)) }
  return { novos, atualizados, ids }
}

export const lerIaRss = async () => !!(await db.ajustes.get('pinterest.rss.ia'))?.valor

let emCurso: Promise<ResultadoRss> | undefined
/** Lê o RSS de todas as pastas acompanhadas; só entra o que é novo. */
export function atualizarRss(aviso?: (t: string) => void): Promise<ResultadoRss> {
  emCurso ??= executar(aviso).finally(() => { emCurso = undefined })
  return emCurso
}

async function executar(aviso?: (t: string) => void): Promise<ResultadoRss> {
  const grupos = (await db.grupos.toArray()).filter((g) => !g.excluido && g.rss)
  const res: ResultadoRss = { novos: 0, atualizados: 0, pastas: grupos.length, analisados: 0, falhas: [], quando: Date.now() }
  const novosIds: string[] = []
  for (const g of grupos) {
    aviso?.(`Lendo “${g.nome}”…`)
    try {
      const r = await importarFeed(await lerRss(g.rss!), g.id)
      res.novos += r.novos; res.atualizados += r.atualizados; novosIds.push(...r.ids)
    } catch (e) { res.falhas.push({ nome: g.nome, erro: (e as Error).message }) }
  }
  if (novosIds.length && (await lerIaRss())) res.analisados = await analisarComIa(novosIds, aviso, true)
  await definirAjuste('pinterest.rss.ultimo', res)
  return res
}

const INTERVALO = 6 * 3600_000
/** Com o app aberto, confere as pastas acompanhadas a cada 6 horas. */
export function iniciarRssAutomatico() {
  const tentar = async () => {
    if (!navigator.onLine) return
    const ultimo = (await db.ajustes.get('pinterest.rss.ultimo'))?.valor as ResultadoRss | undefined
    if (ultimo && Date.now() - ultimo.quando < INTERVALO) return
    if (!(await db.grupos.filter((g) => !!g.rss && !g.excluido).count())) return
    atualizarRss().catch((e) => console.warn('Pinterest RSS:', (e as Error).message))
  }
  setTimeout(tentar, 20_000)
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') tentar() })
  setInterval(tentar, 30 * 60_000)
}
