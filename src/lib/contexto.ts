import { db, uid, type Tipo } from '../db/schema'

/**
 * Contexto do "+": quando o usuário cria algo a partir de uma página (ex.: dentro de um esmalte),
 * o novo conteúdo nasce já conectado àquela página. O contexto vale para a primeira criação
 * e expira em 15 minutos ou ao sair do fluxo de cadastro.
 */
const CHAVE = 'contexto-novo'
interface Ctx { tipo: Tipo; id: string; quando: number }

const ROTAS: [RegExp, Tipo][] = [
  [/^\/esmaltes\/([^/]+)$/, 'esmalte'], [/^\/receitas\/([^/]+)$/, 'receita'], [/^\/testes\/([^/]+)$/, 'teste'],
  [/^\/materiais\/([^/]+)$/, 'material'], [/^\/referencias\/([^/]+)$/, 'referencia'], [/^\/biblioteca\/([^/]+)$/, 'conteudo'],
  [/^\/caderno\/([^/]+)$/, 'nota'],
]
const RESERVADOS = new Set(['novo', 'nova', 'familias', 'comparar', 'planejar', 'grupos'])

export function contextoDaRota(pathname: string): { tipo: Tipo; id: string } | undefined {
  for (const [r, tipo] of ROTAS) {
    const m = pathname.match(r)
    if (m && !RESERVADOS.has(m[1])) return { tipo, id: m[1] }
  }
}
export function definirContexto(c?: { tipo: Tipo; id: string }) {
  try { if (c) sessionStorage.setItem(CHAVE, JSON.stringify({ ...c, quando: Date.now() })); else sessionStorage.removeItem(CHAVE) } catch { /* sem armazenamento */ }
}
function lerContexto(): Ctx | undefined {
  try {
    const c = JSON.parse(sessionStorage.getItem(CHAVE) ?? 'null') as Ctx | null
    if (c && Date.now() - c.quando < 15 * 60 * 1000) return c
  } catch { /* ignora */ }
}
/** Rotas de cadastro em que o contexto continua valendo. */
export const emFluxoDeCadastro = (p: string) => /\/(novo|nova)$/.test(p) || /^\/caderno\/[^/]+$/.test(p) || p === '/compartilhar'

const TABELA_TIPO: Record<string, Tipo> = {
  esmaltes: 'esmalte', receitas: 'receita', testes: 'teste', materiais: 'material',
  referencias: 'referencia', conteudos: 'conteudo', notas: 'nota',
}

/** Sincronização e importação de backup gravam registros sem vínculo automático. */
export const pausaVinculo = { n: 0 }

/** Liga automaticamente o primeiro conteúdo criado ao contexto pendente. */
export function ativarVinculoAutomatico() {
  for (const [tabela, tipo] of Object.entries(TABELA_TIPO)) {
    db.table(tabela).hook('creating', (_pk, obj: { id: string }) => {
      if (pausaVinculo.n > 0) return
      const c = lerContexto(); if (!c || c.id === obj.id) return
      definirContexto(undefined)
      const t = Date.now()
      setTimeout(() => { db.relacoes.add({ id: uid(), aTipo: c.tipo, aId: c.id, bTipo: tipo, bId: obj.id, criadoEm: t, atualizadoEm: t, excluido: 0 }).catch(() => {}) }, 0)
    })
  }
}
