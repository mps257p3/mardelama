import { db, novo, type Referencia } from '../db/schema'
import { cliente_ } from '../db/sync'
import { definirAjuste } from '../db/settings'
import { lerPerfil, salvarPerfil, traduz } from './curadoria'
import { chavePasta, ehPin } from './pinterest'
import { iaConfigurada, sugerirCatalogo } from './iaRepertorio'

/**
 * Conta do Pinterest conectada pela API oficial (v5). Tudo passa por /api/pinterest, que guarda
 * os tokens cifrados no servidor. Aqui só ficam: quais painéis acompanhar e a qual grupo cada um vai.
 * Pins já importados (pela exportação ZIP ou por outra sincronização) são reconhecidos pelo id do pin
 * e nunca duplicam; pins removidos do Pinterest continuam no Acervo.
 */

export interface Conta { usuario?: string; tipo?: string; foto?: string; pins?: number; paineis?: number; desde?: number }
export interface PainelEscolhido { id: string; nome: string; grupoId: string }
export interface ConfigPinterest { paineis?: PainelEscolhido[]; completos?: string[]; ultimo?: number; ultimoResultado?: ResultadoPinterest; iaImagens?: boolean }
export interface EstadoPinterest { conectado: boolean; conta: Conta | null; config: ConfigPinterest; retorno?: string }
export interface PainelPinterest { id: string; nome: string; descricao?: string; pins?: number; privacidade?: string; capa?: string }
export interface PinApi { id: string; criadoEm?: number; titulo?: string; descricao?: string; alt?: string; nota?: string; link?: string; cor?: string; video: boolean; imagem?: string; painel?: string; dono?: string }
export interface ResultadoPinterest { novos: number; atualizados: number; pedidos: number; analisados: number; quando: number; erro?: string }

export class ErroPinterest extends Error {
  codigo?: string; status?: number
  constructor(msg: string, codigo?: string, status?: number) { super(msg); this.codigo = codigo; this.status = status }
}

let configurada: Promise<boolean> | undefined
/** O servidor tem o app do Pinterest configurado (PINTEREST_APP_ID e PINTEREST_APP_SECRET na Vercel)? */
export function pinterestConfigurado() {
  configurada ??= fetch('/api/pinterest').then((r) => (r.ok ? r.json() : { configurada: false })).then((j) => !!j.configurada).catch(() => false)
  return configurada
}

async function chamar<T>(acao: string, dados: Record<string, unknown> = {}): Promise<T> {
  const sb = await cliente_()
  const sessao = (await sb?.auth.getSession())?.data.session
  if (!sessao) throw new ErroPinterest('Entre na sua conta do app (Ajustes) para usar o Pinterest.', 'SEM_LOGIN', 401)
  const c = new AbortController(); const t = setTimeout(() => c.abort(), 30000)
  try {
    const r = await fetch('/api/pinterest', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${sessao.access_token}` }, body: JSON.stringify({ acao, ...dados }), signal: c.signal })
    const j = await r.json().catch(() => ({ erro: `O servidor não respondeu (HTTP ${r.status})` }))
    if (!r.ok) throw new ErroPinterest(j.erro ?? `HTTP ${r.status}`, j.codigo, r.status)
    return j as T
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw new ErroPinterest('O Pinterest demorou demais para responder.')
    throw e
  } finally { clearTimeout(t) }
}

export async function estadoPinterest() {
  const e = await chamar<EstadoPinterest>('estado')
  await definirAjuste('pinterest.conectado', e.conectado)
  return e
}

/** Abre a tela de autorização do Pinterest (volta para /referencias/pinterest/retorno). */
export async function iniciarConexao() {
  const { url } = await chamar<{ url: string }>('inicio')
  location.assign(url)
}
export async function concluirConexao(code: string, state: string) {
  const r = await chamar<{ conectado: boolean; conta: Conta }>('conectar', { code, state })
  await definirAjuste('pinterest.conectado', true)
  return r
}
export async function desconectar() {
  await chamar('desconectar')
  await definirAjuste('pinterest.conectado', false)
}
export const listarPaineis = () => chamar<{ paineis: PainelPinterest[]; restam?: number }>('paineis')
export const salvarConfig = (config: Partial<ConfigPinterest>) => chamar<{ config: ConfigPinterest }>('config', { config }).then((r) => r.config)

/** Escolha de painéis: cada um vai para um grupo existente ou cria um grupo com o nome do painel. */
export async function escolherPaineis(escolha: { painel: PainelPinterest; grupo: string | 'novo' }[]) {
  const grupos = (await db.grupos.toArray()).filter((g) => !g.excluido)
  const paineis: PainelEscolhido[] = []
  for (const { painel, grupo } of escolha) {
    let id = grupo !== 'novo' && grupos.some((g) => g.id === grupo) ? grupo : undefined
    if (!id) {
      const igual = grupos.find((g) => chavePasta(g.nome) === chavePasta(painel.nome))
      if (igual) id = igual.id
      else { const g = novo({ nome: painel.nome.trim()[0].toUpperCase() + painel.nome.trim().slice(1), descricao: 'Painel do Pinterest' }); await db.grupos.add(g); grupos.push(g); id = g.id }
    }
    paineis.push({ id: painel.id, nome: painel.nome, grupoId: id })
  }
  // nomes dos painéis entram como interesses do Descobrir (peso leve, como as buscas do ZIP)
  const perfil = await lerPerfil()
  paineis.forEach((p) => { const k = traduz(p.nome); if (k.length > 2) perfil.termos[k] = Math.max(perfil.termos[k] ?? 0, 1) })
  await salvarPerfil(perfil)
  return salvarConfig({ paineis })
}

const idDoPin = (pinId: string) => 'pinterest-' + pinId
const site = (url?: string) => { try { return url ? new URL(url).hostname.replace(/^www\./, '') : undefined } catch { return undefined } }
const urlDoPin = (id: string) => `https://www.pinterest.com/pin/${id}/`
/** Miniatura deduzida da exportação ZIP (não confirmada): a da API é melhor e a substitui. */
const deduzida = (u?: string) => !u || /i\.pinimg\.com\/736x\//.test(u)

function referenciaDe(p: PinApi, grupoId: string, painel: string): Referencia {
  const nome = p.titulo || p.descricao || p.alt
  const s = site(p.link)
  const ref = novo({ titulo: (nome ?? painel).slice(0, 120), tipo: p.video ? 'Vídeo' : 'Fotografia', imagens: [] as string[], tags: [] as string[], grupos: [grupoId] })
  return {
    ...ref, id: idDoPin(p.id),
    fonte: 'Pinterest' + (s ? ' · ' + s : ''), url: p.link || urlDoPin(p.id),
    descricao: [p.descricao && p.descricao !== nome ? p.descricao : '', p.alt && p.alt !== nome ? p.alt : '', p.nota ? 'Nota: ' + p.nota : '', `Pin: ${urlDoPin(p.id)}`].filter(Boolean).join('\n'),
    imagemExterna: p.imagem, paleta: p.cor ? [p.cor] : undefined, origem: 'pinterest:' + p.id,
    criadoEm: p.criadoEm ?? ref.criadoEm,
  }
}

let emCurso: Promise<ResultadoPinterest> | undefined
/** Sincroniza os painéis escolhidos: só entram pins novos; os já importados ganham o grupo e a imagem que faltarem. */
export function sincronizarPinterest(aviso?: (t: string) => void): Promise<ResultadoPinterest> {
  emCurso ??= executar(aviso).finally(() => { emCurso = undefined })
  return emCurso
}

async function executar(aviso?: (t: string) => void): Promise<ResultadoPinterest> {
  const estado = await estadoPinterest()
  if (!estado.conectado) throw new ErroPinterest('Pinterest não conectado.', 'DESCONECTADO')
  const cfg = estado.config
  const paineis = cfg.paineis ?? []
  const res: ResultadoPinterest = { novos: 0, atualizados: 0, pedidos: 0, analisados: 0, quando: Date.now() }
  if (!paineis.length) return res
  const existentes = new Map((await db.referencias.filter(ehPin).toArray()).map((r) => [r.origem!, r]))
  const completos = new Set(cfg.completos ?? [])
  const novosIds: string[] = []
  try {
    for (const painel of paineis) {
      const grupo = await db.grupos.get(painel.grupoId)
      const grupoId = grupo && !grupo.excluido ? grupo.id : painel.grupoId
      let bookmark: string | null | undefined, conhecidoDesde = false
      for (let pagina = 0; pagina < 40; pagina++) {
        aviso?.(`Lendo “${painel.nome}”…`)
        const r = await chamar<{ pins: PinApi[]; bookmark: string | null }>('pins', { painel: painel.id, bookmark })
        res.pedidos++
        let novosNaPagina = 0
        const novos: Referencia[] = []
        for (const p of r.pins) {
          const origem = 'pinterest:' + p.id
          const ja = existentes.get(origem) ?? (await db.referencias.get(idDoPin(p.id)))
          if (ja) {
            if (ja.excluido) continue // apagado no app: não volta
            const mud: Partial<Referencia> = {}
            if (!ja.grupos.includes(grupoId)) mud.grupos = [...ja.grupos, grupoId]
            if (p.imagem && deduzida(ja.imagemExterna) && !ja.imagens.length) mud.imagemExterna = p.imagem
            if (p.cor && !ja.paleta?.length) mud.paleta = [p.cor]
            if (Object.keys(mud).length) { await db.referencias.update(ja.id, { ...mud, atualizadoEm: Date.now() }); res.atualizados++ }
            continue
          }
          const ref = referenciaDe(p, grupoId, painel.nome)
          novos.push(ref); existentes.set(origem, ref); novosNaPagina++
        }
        if (novos.length) { await db.referencias.bulkAdd(novos); res.novos += novos.length; novosIds.push(...novos.map((n) => n.id)) }
        bookmark = r.bookmark
        // painel já lido por inteiro antes: uma página sem nada novo quer dizer que o resto já está no Acervo
        if (!novosNaPagina && completos.has(painel.id)) { conhecidoDesde = true; break }
        if (!bookmark) break
      }
      if (!bookmark || conhecidoDesde) completos.add(painel.id)
    }
  } catch (e) {
    res.erro = (e as Error).message
    await salvarConfig({ completos: [...completos], ultimoResultado: res }).catch(() => {})
    await definirAjuste('pinterest.ultimo', res)
    throw e
  }
  if (cfg.iaImagens && novosIds.length) res.analisados = await analisarComIa(novosIds, aviso)
  await salvarConfig({ completos: [...completos], ultimo: res.quando, ultimoResultado: res }).catch(() => {})
  await definirAjuste('pinterest.ultimo', res)
  return res
}

/**
 * Leitura das imagens pela IA (só quando ligada). Para não gastar crédito demais, lê até 8 pins novos por vez
 * e grava só tags, paleta e, se `organizar`, os grupos que a IA reconheceu entre os seus. Título e descrição
 * continuam os do Pinterest; a catalogação completa segue no botão "Sugerir catalogação".
 */
export async function analisarComIa(ids: string[], aviso?: (t: string) => void, organizar = false) {
  if (!(await iaConfigurada())) return 0
  const grupos = organizar ? (await db.grupos.toArray()).filter((g) => !g.excluido) : []
  let n = 0
  for (const id of ids.slice(0, 8)) {
    const r = await db.referencias.get(id); if (!r?.imagemExterna) continue
    aviso?.(`IA lendo as imagens novas (${n + 1})…`)
    try {
      const s = await sugerirCatalogo(r)
      const extras = s.grupos.map((nome) => grupos.find((g) => chavePasta(g.nome) === chavePasta(nome))?.id).filter(Boolean) as string[]
      await db.referencias.update(id, {
        tags: [...new Set([...r.tags, ...s.tags.map((t) => t.toLowerCase().replace(/^#/, ''))])].slice(0, 14),
        paleta: [...new Set([...(r.paleta ?? []), ...s.paleta.filter((c) => /^#[0-9a-f]{6}$/i.test(c))])].slice(0, 6),
        ...(extras.length ? { grupos: [...new Set([...r.grupos, ...extras])] } : {}),
        atualizadoEm: Date.now(),
      })
      n++
    } catch { break } // sem crédito, limite ou fora do ar: tenta na próxima
  }
  return n
}

const INTERVALO = 6 * 3600_000
/** Verificação periódica: com o app aberto e conectado, sincroniza se a última passou de 6 horas. */
export function iniciarPinterestAutomatico() {
  const tentar = async () => {
    if (!navigator.onLine || !(await db.ajustes.get('pinterest.conectado'))?.valor) return
    const ultimo = (await db.ajustes.get('pinterest.ultimo'))?.valor as ResultadoPinterest | undefined
    if (ultimo && Date.now() - ultimo.quando < INTERVALO) return
    sincronizarPinterest().catch((e) => {
      console.warn('Pinterest:', (e as Error).message)
      if ((e as ErroPinterest).codigo === 'DESCONECTADO') definirAjuste('pinterest.conectado', false)
    })
  }
  setTimeout(tentar, 15_000)
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') tentar() })
  setInterval(tentar, 30 * 60_000)
}
