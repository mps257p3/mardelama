import { db } from './schema'

/** Próximo código sequencial (ex.: E-001, T-0001). Usa o maior código existente como referência. */
export async function proximoCodigo(prefixo: 'E' | 'T' | 'R', tabela: 'esmaltes' | 'testes', digitos: number) {
  const todos = await db.table(tabela).toArray() as { codigo?: string }[]
  const re = new RegExp(`^${prefixo}-(\\d+)$`)
  const max = todos.reduce((m, x) => { const r = x.codigo?.match(re); return r ? Math.max(m, +r[1]) : m }, 0)
  return `${prefixo}-${String(max + 1).padStart(digitos, '0')}`
}

/** Gera N códigos consecutivos de teste (para planos de experimento). */
export async function proximosCodigosTeste(n: number) {
  const primeiro = await proximoCodigo('T', 'testes', 4)
  const base = +primeiro.slice(2)
  return Array.from({ length: n }, (_, i) => `T-${String(base + i).padStart(4, '0')}`)
}
