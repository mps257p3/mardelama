import { db } from '../db/schema'

/**
 * Registro do gasto da IA neste aparelho. Cada pedido à /api/ia volta com os tokens e as buscas na web;
 * o custo é estimado pela tabela de preços da Anthropic (em dólar, sem impostos). O valor exato fica no Console.
 */
export interface UsoIA { modelo?: string; entrada: number; saida: number; cacheLido: number; cacheEscrito: number; buscas: number; leituras: number }
export interface GastoIA extends UsoIA { quando: number; acao: string; custo: number; erro?: boolean }

export const CHAVE_GASTOS = 'ia.gastos'
const MAX = 1500

/** Preço por milhão de tokens, em US$: entrada, saída, cache lido, cache escrito. */
const PRECOS: Record<string, [number, number, number, number]> = {
  'claude-opus-5-5': [4, 20, 0.2, 5],
  'claude-sonnet-5-5': [2, 10, 0.1, 2.5],
  'claude-haiku-5-5': [0.1, 0.5, 0.01, 0.125],
}
const BUSCA = 10 / 1000 // US$ 10 a cada mil buscas na web

export const NOME_ACAO: Record<string, string> = {
  artista: 'Pesquisar artista (com busca na web)',
  comercial: 'Engenharia reversa (com busca na web)',
  receber: 'Ler o que você compartilhou',
  catalogar: 'Catalogar referência',
  explicar: 'Explicar obra do Descobrir',
  foto: 'Busca por foto no Descobrir',
  buscar: 'Busca por texto no Descobrir',
  gosto: 'Leitura do seu gosto (Descobrir)',
  acervo: 'Leitura das suas pastas (Descobrir)',
  afins: 'Artistas na mesma linha (Descobrir)',
  agrupar: 'Temas das curtidas',
  perfil: 'Síntese do repertório',
}

export function custoDe(u: UsoIA): number {
  const [e, s, cl, ce] = PRECOS[u.modelo ?? ''] ?? PRECOS['claude-opus-5-5']
  return (u.entrada * e + u.saida * s + u.cacheLido * cl + u.cacheEscrito * ce) / 1e6 + u.buscas * BUSCA
}

export async function registrarGasto(acao: string, uso: UsoIA | undefined, erro = false) {
  if (!uso) return
  const g: GastoIA = { ...uso, quando: Date.now(), acao, custo: custoDe(uso), ...(erro ? { erro } : {}) }
  await db.transaction('rw', db.ajustes, async () => {
    const xs = ((await db.ajustes.get(CHAVE_GASTOS))?.valor as GastoIA[] | undefined) ?? []
    xs.push(g)
    await db.ajustes.put({ chave: CHAVE_GASTOS, valor: xs.slice(-MAX) })
  })
}

export interface ResumoGasto { acao: string; nome: string; vezes: number; custo: number; buscas: number }
export function resumir(xs: GastoIA[], desde: number) {
  const m = new Map<string, ResumoGasto>()
  let total = 0
  for (const x of xs) {
    if (x.quando < desde) continue
    total += x.custo
    const r = m.get(x.acao) ?? { acao: x.acao, nome: NOME_ACAO[x.acao] ?? x.acao, vezes: 0, custo: 0, buscas: 0 }
    r.vezes++; r.custo += x.custo; r.buscas += x.buscas
    m.set(x.acao, r)
  }
  return { total, linhas: [...m.values()].sort((a, b) => b.custo - a.custo) }
}

export const dolar = (v: number) => 'US$ ' + (v < 0.01 && v > 0 ? '<0,01' : v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))

/** Tarefas que o Descobrir fazia sozinho em segundo plano. Desligadas por padrão: só rodam pelo botão. */
export const CHAVE_AUTO = 'ia.automaticas'
export async function iaAutomaticaLigada() { return (await db.ajustes.get(CHAVE_AUTO))?.valor === true }
