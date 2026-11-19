import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { db, type Arquivo } from './schema'
import { definirAjuste } from './settings'

/**
 * Sincronização com o Supabase. O aparelho continua sendo a fonte principal (funciona offline);
 * quando há conexão e login, envia o que mudou e recebe o que mudou em outros aparelhos.
 * Conflitos: vence a alteração mais recente (atualizadoEm).
 */

export interface ConfigNuvem { url: string; chave: string }

const TABELAS = ['familias', 'esmaltes', 'receitas', 'versoes', 'testes', 'materiais', 'referencias', 'grupos', 'paineis', 'conteudos', 'notas'] as const
const BUCKET = 'arquivos'

let cliente: SupabaseClient | undefined
let configAtual = ''

export async function obterConfig(): Promise<ConfigNuvem | undefined> {
  const salvo = (await db.ajustes.get('nuvem'))?.valor as ConfigNuvem | undefined
  if (salvo?.url && salvo.chave) return salvo
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const chave = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
  return url && chave ? { url, chave } : undefined
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

export interface ResultadoSync { enviados: number; recebidos: number; quando: number }
let emCurso: Promise<ResultadoSync> | undefined

export function sincronizar(): Promise<ResultadoSync> {
  emCurso ??= executar().finally(() => { emCurso = undefined })
  return emCurso
}

async function executar(): Promise<ResultadoSync> {
  const sb = await cliente_(); if (!sb) throw new Error('Nuvem não configurada.')
  const user = (await sb.auth.getSession()).data.session?.user
  if (!user) throw new Error('Entre na sua conta para sincronizar.')
  const m = await marcas(); let enviados = 0, recebidos = 0; const inicio = Date.now()

  // 1. arquivos (fotos, PDFs, áudios): sobe o conteúdo para o Storage e os metadados para a tabela
  {
    const mk = m.arquivos ?? { enviado: 0, recebido: 0 }
    const novos = (await db.arquivos.toArray()).filter((a) => (a.atualizadoEm ?? 0) > mk.enviado)
    for (const a of novos) {
      const { blob, ...meta } = a
      if (!a.excluido) { const { error } = await sb.storage.from(BUCKET).upload(`${user.id}/${a.id}`, blob, { upsert: true, contentType: a.mime }); if (error) throw error }
      const { error } = await sb.from('arquivos').upsert(linha(meta)); if (error) throw error
      enviados++
    }
    const { data, error } = await sb.from('arquivos').select('*').gt('atualizado_em', mk.recebido).order('atualizado_em')
    if (error) throw error
    let maxR = mk.recebido
    for (const r of data ?? []) {
      maxR = Math.max(maxR, r.atualizado_em)
      const atual = await db.arquivos.get(r.id)
      if (atual && (atual.atualizadoEm ?? 0) >= r.atualizado_em) continue
      let blob = atual?.blob
      if (!blob && !r.excluido) { const d = await sb.storage.from(BUCKET).download(`${user.id}/${r.id}`); if (d.error) continue; blob = d.data }
      await db.arquivos.put({ ...(local(r) as Omit<Arquivo, 'blob'>), blob: blob ?? new Blob() } as Arquivo); recebidos++
    }
    m.arquivos = { enviado: inicio, recebido: maxR }
  }

  // 2. tabelas de conteúdo
  for (const t of TABELAS) {
    const mk = m[t] ?? { enviado: 0, recebido: 0 }
    const chave = t === 'versoes' ? 'criadoEm' : 'atualizadoEm'
    const novos = (await db.table(t).toArray()).filter((x: any) => (x[chave] ?? 0) > mk.enviado)
    for (let i = 0; i < novos.length; i += 200) {
      const { error } = await sb.from(t).upsert(novos.slice(i, i + 200).map(linha)); if (error) throw error
    }
    enviados += novos.length
    const { data, error } = await sb.from(t).select('*').gt('atualizado_em', mk.recebido).order('atualizado_em').limit(5000)
    if (error) throw error
    let maxR = mk.recebido
    for (const r of data ?? []) {
      maxR = Math.max(maxR, r.atualizado_em)
      const atual: any = await db.table(t).get(r.id)
      if (atual && (atual[chave] ?? 0) >= r.atualizado_em) continue
      await db.table(t).put(local(r)); recebidos++
    }
    m[t] = { enviado: inicio, recebido: maxR }
  }

  // 3. relações
  {
    const mk = m.relacoes ?? { enviado: 0, recebido: 0 }
    const novos = (await db.relacoes.toArray()).filter((x) => (x.atualizadoEm ?? x.criadoEm) > mk.enviado)
    if (novos.length) {
      const { error } = await sb.from('relacoes').upsert(novos.map((x) => ({ id: x.id, a_tipo: x.aTipo, a_id: x.aId, b_tipo: x.bTipo, b_id: x.bId, criado_em: x.criadoEm, atualizado_em: x.atualizadoEm ?? x.criadoEm, excluido: !!x.excluido })))
      if (error) throw error; enviados += novos.length
    }
    const { data, error } = await sb.from('relacoes').select('*').gt('atualizado_em', mk.recebido)
    if (error) throw error
    let maxR = mk.recebido
    for (const r of data ?? []) {
      maxR = Math.max(maxR, r.atualizado_em)
      const atual = await db.relacoes.get(r.id)
      if (atual && (atual.atualizadoEm ?? atual.criadoEm) >= r.atualizado_em) continue
      await db.relacoes.put({ id: r.id, aTipo: r.a_tipo, aId: r.a_id, bTipo: r.b_tipo, bId: r.b_id, criadoEm: r.criado_em, atualizadoEm: r.atualizado_em, excluido: r.excluido ? 1 : 0 }); recebidos++
    }
    m.relacoes = { enviado: inicio, recebido: maxR }
  }

  await definirAjuste('sync.marcas', m)
  const res = { enviados, recebidos, quando: Date.now() }
  await definirAjuste('sync.ultimo', res)
  return res
}

/** Sincroniza ao abrir, ao voltar a ficar online e a cada 3 minutos, quando houver login. */
export function iniciarSincronizacaoAutomatica() {
  const tentar = async () => { if (navigator.onLine && (await usuario())) sincronizar().catch((e) => console.warn('Sincronização:', e.message)) }
  tentar()
  window.addEventListener('online', tentar)
  setInterval(tentar, 180_000)
}
