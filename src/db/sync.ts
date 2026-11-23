import { pausaVinculo } from '../lib/contexto'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { db, type Arquivo } from './schema'
import { definirAjuste } from './settings'
import { mesclarGosto, type Gosto } from './gosto'

/**
 * Sincronização com o Supabase. O aparelho continua sendo a fonte principal (funciona offline);
 * quando há conexão e login, envia o que mudou e recebe o que mudou em outros aparelhos.
 * Conflitos: vence a alteração mais recente (atualizadoEm).
 */

export interface ConfigNuvem { url: string; chave: string }

const TABELAS = ['familias', 'esmaltes', 'receitas', 'versoes', 'testes', 'materiais', 'referencias', 'grupos', 'paineis', 'conteudos', 'notas', 'curvas', 'queimas', 'comerciais', 'lotes', 'fornecedores', 'compras', 'projetos', 'entrada', 'paletas', 'artistas', 'obras', 'colecoes', 'exposicoes'] as const
/** Tabela ainda não criada no Supabase (migração pendente): pula sem interromper o resto. */
const faltaTabela = (e: { code?: string; message?: string }) => e.code === '42P01' || e.code === 'PGRST205' || /does not exist|Could not find the table/i.test(e.message ?? '')
/** Ajustes que viajam entre aparelhos: o perfil de gosto do Descobrir. */
const AJUSTES_SINC = ['descobrir.perfil']
const BUCKET = 'arquivos'
const PAGINA = 1000
const NOMES: Record<string, string> = { referencias: 'referências', grupos: 'grupos', esmaltes: 'esmaltes', receitas: 'receitas', testes: 'testes', conteudos: 'biblioteca' }
/** Sobe quando a forma de receber muda e é preciso rever tudo o que veio antes (sem duplicar: compara por data). */
const VERSAO_SYNC = 2

let cliente: SupabaseClient | undefined
let configAtual = ''

/** Conexão embutida no app publicado (não depende do banco local). */
export function configPadrao(): ConfigNuvem | undefined {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const chave = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
  return url && chave ? { url, chave } : undefined
}

export async function obterConfig(): Promise<ConfigNuvem | undefined> {
  const padrao = configPadrao(); if (padrao) return padrao
  // se o banco local demorar a abrir, segue com a conexão padrão em vez de travar a tela
  const salvo = await Promise.race([
    db.ajustes.get('nuvem').then((a) => a?.valor as ConfigNuvem | undefined).catch(() => undefined),
    new Promise<undefined>((r) => setTimeout(() => r(undefined), 2500)),
  ])
  if (salvo?.url && salvo.chave) return salvo
  return configPadrao()
}

export async function cliente_() {
  const c = await obterConfig(); if (!c) return undefined
  const k = c.url + c.chave
  if (!cliente || k !== configAtual) { cliente = createClient(c.url, c.chave, { auth: { persistSession: true, autoRefreshToken: true } }); configAtual = k }
  return cliente
}

export async function salvarConfig(c: ConfigNuvem) { await definirAjuste('nuvem', c); cliente = undefined }

export async function entrar(email: string) {
  const sb = await cliente_(); if (!sb) throw new Error('Configure a conexão com o Supabase primeiro.')
  const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + '/ajustes' } })
  if (error) throw error
}
/** Entra com o código numérico que vem no e-mail (funciona dentro do app instalado, sem abrir o navegador). */
export async function entrarComCodigo(email: string, codigo: string) {
  const sb = await cliente_(); if (!sb) throw new Error('Configure a conexão com o Supabase primeiro.')
  const { error } = await sb.auth.verifyOtp({ email, token: codigo.replace(/\D/g, ''), type: 'email' })
  if (error) throw new Error(/expired|invalid/i.test(error.message) ? 'Código inválido ou vencido. Peça um novo.' : error.message)
}
/** Entra com a conta Google (volta para Ajustes já conectado). */
export async function entrarComGoogle() {
  const sb = await cliente_(); if (!sb) throw new Error('Configure a conexão com o Supabase primeiro.')
  const { error } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + '/ajustes' } })
  if (error) throw error
}
export async function sair() { const sb = await cliente_(); await sb?.auth.signOut() }
export async function usuario() { const sb = await cliente_(); return (await sb?.auth.getSession())?.data.session?.user }

type Marcas = Record<string, { enviado: number; recebido: number }>
const marcas = async () => ((await db.ajustes.get('sync.marcas'))?.valor as Marcas) ?? {}

/* eslint-disable @typescript-eslint/no-explicit-any */
const linha = (x: any) => {
  const { id, criadoEm, atualizadoEm, excluido, ...resto } = x
  return { id, criado_em: criadoEm ?? atualizadoEm, atualizado_em: atualizadoEm ?? criadoEm, excluido: !!excluido, dados: { ...resto, criadoEm, atualizadoEm } }
}
const local = (r: any) => ({ ...r.dados, id: r.id, criadoEm: r.criado_em, atualizadoEm: r.atualizado_em, excluido: r.excluido ? 1 : 0 })

export interface ResultadoSync { enviados: number; recebidos: number; quando: number; pendentes?: string[] }
let emCurso: Promise<ResultadoSync> | undefined

export function sincronizar(): Promise<ResultadoSync> {
  if (!emCurso) { pausaVinculo.n++; emCurso = executar().then(async (r) => { await definirAjuste('sync.erro', null); return r }, async (e) => { await definirAjuste('sync.erro', { quando: Date.now(), msg: String((e as Error)?.message ?? e) }); throw e }).finally(() => { emCurso = undefined; pausaVinculo.n--; avisarProgresso(undefined) }) }
  return emCurso
}

/** Executa as tarefas com no máximo `n` ao mesmo tempo. */
async function emParalelo<T>(itens: T[], n: number, f: (x: T) => Promise<void>) {
  let i = 0
  await Promise.all(Array.from({ length: Math.min(n, itens.length) }, async () => { while (i < itens.length) await f(itens[i++]) }))
}
/** Progresso da sincronização, mostrado em Ajustes. */
let progressoAtual: string | undefined
export const progressoSync = () => progressoAtual
export function avisarProgresso(texto?: string) { progressoAtual = texto; window.dispatchEvent(new CustomEvent('sync-progresso', { detail: texto })) }

/** Lê as linhas alteradas depois de `desde`, em páginas de 1000, andando por (atualizado_em, id). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function* paginas(sb: SupabaseClient, tabela: string, desde: number): AsyncGenerator<any[]> {
  let maxR = desde, ultimoId = ''
  for (;;) {
    const filtro = ultimoId ? `atualizado_em.gt.${maxR},and(atualizado_em.eq.${maxR},id.gt.${ultimoId})` : `atualizado_em.gt.${maxR}`
    const { data, error } = await sb.from(tabela).select('*').or(filtro).order('atualizado_em').order('id').limit(PAGINA)
    if (error) throw error
    const lista = data ?? []
    if (!lista.length) return
    yield lista
    const fim = lista[lista.length - 1]; maxR = fim.atualizado_em; ultimoId = fim.id
    if (lista.length < PAGINA) return
  }
}

async function executar(): Promise<ResultadoSync> {
  const sb = await cliente_(); if (!sb) throw new Error('Nuvem não configurada.')
  const user = (await sb.auth.getSession()).data.session?.user
  if (!user) throw new Error('Entre na sua conta para sincronizar.')
  const m = await marcas(); let enviados = 0, recebidos = 0; const inicio = Date.now()
  // versão 1 recebia no máximo 1000 por vez e podia pular itens com o mesmo horário: revê tudo uma vez
  if (((await db.ajustes.get('sync.versao'))?.valor as number ?? 1) < VERSAO_SYNC) {
    for (const k of Object.keys(m)) m[k] = { ...m[k], recebido: 0 }
  }

  // 2. tabelas de conteúdo, várias ao mesmo tempo; o aviso na tela só aparece quando há o que receber
  const pendentes: string[] = []
  await emParalelo(TABELAS.filter((t) => db.tables.some((x) => x.name === t)), 6, async (t) => {
    const mk = m[t] ?? { enviado: 0, recebido: 0 }
    const chave = t === 'versoes' ? 'criadoEm' : 'atualizadoEm'
    // usa o índice quando existe, sem ler a tabela inteira
    const tab = db.table(t)
    const novos: any[] = tab.schema.indexes.some((i) => i.name === chave)
      ? await tab.where(chave).above(mk.enviado).toArray()
      : (await tab.toArray()).filter((x: any) => (x[chave] ?? 0) > mk.enviado)
    for (let i = 0; i < novos.length; i += 200) {
      const { error } = await sb.from(t).upsert(novos.slice(i, i + 200).map(linha))
      if (error) { if (faltaTabela(error)) { pendentes.push(t); break } throw error }
    }
    if (pendentes.includes(t)) return
    enviados += novos.length
    // recebe em páginas de 1000 (limite do servidor), andando por (atualizado_em, id): itens importados em lote
    // têm o mesmo horário, e paginar só pelo horário perderia os que caem na virada da página
    let maxR = mk.recebido, ultimoId = '', parou = false
    for (;;) {
      const filtro = ultimoId ? `atualizado_em.gt.${maxR},and(atualizado_em.eq.${maxR},id.gt.${ultimoId})` : `atualizado_em.gt.${maxR}`
      const { data, error } = await sb.from(t).select('*').or(filtro).order('atualizado_em').order('id').limit(PAGINA)
      if (error) { if (faltaTabela(error)) { pendentes.push(t); parou = true; break } throw error }
      const lista = data ?? []
      if (!lista.length) break
      const atuais: any[] = await db.table(t).bulkGet(lista.map((r) => r.id))
      const trocar = lista.filter((r, i) => !(atuais[i] && (atuais[i][chave] ?? 0) >= r.atualizado_em)).map(local)
      if (trocar.length) await db.table(t).bulkPut(trocar)
      recebidos += trocar.length
      const fim = lista[lista.length - 1]; maxR = fim.atualizado_em; ultimoId = fim.id
      if (lista.length > 200) avisarProgresso(`Recebendo ${NOMES[t] ?? t}…`)
      if (lista.length < PAGINA) break
    }
    if (parou) return
    m[t] = { enviado: inicio, recebido: maxR }
  })

  // 3. relações
  {
    const mk = m.relacoes ?? { enviado: 0, recebido: 0 }
    const novos = (await db.relacoes.toArray()).filter((x) => (x.atualizadoEm ?? x.criadoEm) > mk.enviado)
    if (novos.length) {
      const { error } = await sb.from('relacoes').upsert(novos.map((x) => ({ id: x.id, a_tipo: x.aTipo, a_id: x.aId, b_tipo: x.bTipo, b_id: x.bId, criado_em: x.criadoEm, atualizado_em: x.atualizadoEm ?? x.criadoEm, excluido: !!x.excluido })))
      if (error) throw error; enviados += novos.length
    }
    // recebe em páginas, andando por (atualizado_em, id), como nas tabelas de conteúdo
    let maxR = mk.recebido
    for await (const lista of paginas(sb, 'relacoes', mk.recebido)) {
      const atuais = await db.relacoes.bulkGet(lista.map((r) => r.id))
      const trocar = lista.filter((r, i) => { const a = atuais[i]; return !(a && (a.atualizadoEm ?? a.criadoEm) >= r.atualizado_em) })
        .map((r) => ({ id: r.id, aTipo: r.a_tipo, aId: r.a_id, bTipo: r.b_tipo, bId: r.b_id, criadoEm: r.criado_em, atualizadoEm: r.atualizado_em, excluido: (r.excluido ? 1 : 0) as 0 | 1 }))
      if (trocar.length) await db.relacoes.bulkPut(trocar)
      recebidos += trocar.length
      maxR = lista[lista.length - 1].atualizado_em
    }
    m.relacoes = { enviado: inicio, recebido: maxR }
  }

  // 3b. gosto do Descobrir (curtidas, recusas, termos aprendidos): mescla entre aparelhos
  {
    const mk = m.ajustes ?? { enviado: 0, recebido: 0 }
    try {
      const { data, error } = await sb.from('ajustes').select('*').in('id', AJUSTES_SINC).gt('atualizado_em', mk.recebido)
      if (error) throw error
      let maxR = mk.recebido
      for (const r of data ?? []) {
        maxR = Math.max(maxR, r.atualizado_em)
        const atual = (await db.ajustes.get(r.id))?.valor
        await db.ajustes.put({ chave: r.id, valor: mesclarGosto(atual as Gosto | undefined, r.dados?.valor as Gosto | undefined) })
        recebidos++
      }
      for (const k of AJUSTES_SINC) {
        const v = (await db.ajustes.get(k))?.valor as Gosto | undefined
        if (v?.atualizadoEm && v.atualizadoEm > mk.enviado) {
          const { error: e2 } = await sb.from('ajustes').upsert({ id: k, criado_em: v.atualizadoEm, atualizado_em: v.atualizadoEm, excluido: false, dados: { valor: v } })
          if (e2) throw e2
          enviados++
        }
      }
      m.ajustes = { enviado: inicio, recebido: maxR }
    } catch (e) { if (faltaTabela(e as { code?: string; message?: string })) pendentes.push('ajustes'); else throw e }
  }

  await definirAjuste('sync.marcas', m)
  // a revisão completa (troca de versão) já foi feita: um erro daqui em diante não a repete
  await definirAjuste('sync.versao', VERSAO_SYNC)

  // 4. arquivos (fotos, PDFs, áudios) por último: os registros já aparecem e as fotos vão chegando
  {
    const mk = m.arquivos ?? { enviado: 0, recebido: 0 }
    // só os arquivos alterados (pelo índice), sem carregar na memória todas as fotos do aparelho
    const novos = await db.arquivos.where('atualizadoEm').above(mk.enviado).toArray()
    let feitos = 0, primeiraFalhaEnvio = Infinity
    await emParalelo(novos, 4, async (a) => {
      const { blob, ...meta } = a
      try {
        if (!a.excluido) { const { error } = await sb.storage.from(BUCKET).upload(`${user.id}/${a.id}`, blob, { upsert: true, contentType: a.mime }); if (error) throw error }
        const { error } = await sb.from('arquivos').upsert(linha(meta)); if (error) throw error
        enviados++; avisarProgresso(`Enviando fotos: ${++feitos} de ${novos.length}`)
      } catch (e) {
        // uma foto que não sobe não trava o resto; é tentada de novo na próxima vez
        console.warn('Envio de arquivo:', a.id, (e as Error)?.message)
        primeiraFalhaEnvio = Math.min(primeiraFalhaEnvio, a.atualizadoEm ?? 0)
      }
    })
    if (primeiraFalhaEnvio < Infinity) pendentes.push('fotos (algumas não subiram; tento de novo na próxima sincronização)')
    // a marca só avança até antes da primeira foto que não baixou: ela é tentada de novo na próxima vez
    let maxR = mk.recebido, baixados = 0, falhou = false
    // fotos que faltam no servidor: depois de 3 tentativas, desiste delas em vez de reler tudo a cada abertura
    const falhas = ((await db.ajustes.get('sync.falhasFotos'))?.valor as Record<string, number>) ?? {}
    for await (const lista of paginas(sb, 'arquivos', mk.recebido)) {
      const ok = new Array<boolean>(lista.length).fill(true)
      await emParalelo(lista.map((r, i) => [r, i] as const), 6, async ([r, i]) => {
        const atual = await db.arquivos.get(r.id)
        if (!(atual && (atual.atualizadoEm ?? 0) >= r.atualizado_em)) {
          let blob = atual?.blob
          if (!blob && !r.excluido) {
            const d = await sb.storage.from(BUCKET).download(`${user.id}/${r.id}`).catch((e) => ({ data: null, error: e }))
            if (d.error || !d.data) { falhas[r.id] = (falhas[r.id] ?? 0) + 1; if (falhas[r.id] < 3) ok[i] = false; return }
            blob = d.data; delete falhas[r.id]
            avisarProgresso(`Recebendo fotos: ${++baixados}`)
          }
          await db.arquivos.put({ ...(local(r) as Omit<Arquivo, 'blob'>), blob: blob ?? new Blob() } as Arquivo); recebidos++
        }
      })
      const primeiraFalha = ok.indexOf(false)
      if (primeiraFalha >= 0) {
        falhou = true
        // volta a marca para logo antes da que falhou (as já recebidas são puladas na próxima vez)
        maxR = Math.max(mk.recebido, lista[primeiraFalha].atualizado_em - 1)
        break
      }
      maxR = lista[lista.length - 1].atualizado_em
    }
    if (falhou) pendentes.push('fotos (algumas não baixaram; tento de novo na próxima sincronização)')
    await definirAjuste('sync.falhasFotos', falhas)
    m.arquivos = { enviado: primeiraFalhaEnvio < Infinity ? primeiraFalhaEnvio - 1 : inicio, recebido: maxR }
  }

  await definirAjuste('sync.marcas', m)
  const res: ResultadoSync = { enviados, recebidos, quando: Date.now(), pendentes }
  await definirAjuste('sync.ultimo', res)
  return res
}

/** Sincroniza ao abrir, ao voltar ao app, ao voltar a ficar online e a cada 5 minutos, quando houver login. */
export function iniciarSincronizacaoAutomatica() {
  let ultima = 0
  const tentar = async () => {
    // ao trocar de app e voltar logo, não sincroniza de novo (no máximo uma vez por minuto)
    if (Date.now() - ultima < 60_000) return
    if (navigator.onLine && (await usuario())) { ultima = Date.now(); sincronizar().catch((e) => console.warn('Sincronização:', e.message)) }
  }
  tentar()
  window.addEventListener('online', tentar)
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') tentar() })
  setInterval(tentar, 300_000)
}
