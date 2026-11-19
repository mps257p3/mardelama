import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './schema'

export function useAjuste<T>(chave: string, padrao: T): T {
  const v = useLiveQuery(() => db.ajustes.get(chave), [chave])
  return (v?.valor as T) ?? padrao
}
export const definirAjuste = (chave: string, valor: unknown) => db.ajustes.put({ chave, valor })
