import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Material } from './schema'

const vivos = <T extends { excluido?: 0 | 1 }>(xs: T[]) => xs.filter((x) => !x.excluido)

export const useFamilias = () => useLiveQuery(async () => vivos(await db.familias.orderBy('ordem').toArray()), [], [])
export const useEsmaltes = () => useLiveQuery(async () => vivos(await db.esmaltes.orderBy('atualizadoEm').reverse().toArray()))
export const useMateriais = () => useLiveQuery(async () => vivos(await db.materiais.orderBy('nome').toArray()))
export const useReceitas = () => useLiveQuery(async () => vivos(await db.receitas.orderBy('atualizadoEm').reverse().toArray()))
export const useTestes = () => useLiveQuery(async () => vivos(await db.testes.orderBy('criadoEm').reverse().toArray()))
export function useMapaMateriais() {
  const ms = useMateriais()
  return new Map<string, Material>((ms ?? []).map((m) => [m.id, m]))
}

/** Exclusão suave: mantém o registro para sincronização e permite desfazer pelo backup. */
export async function excluir(tabela: 'esmaltes' | 'receitas' | 'testes' | 'materiais' | 'familias' | 'referencias' | 'grupos' | 'paineis' | 'conteudos' | 'notas' | 'artistas' | 'obras' | 'colecoes' | 'exposicoes' | 'projetos' | 'entrada', id: string) {
  await db.table(tabela).update(id, { excluido: 1, atualizadoEm: Date.now() })
}
export async function alternarFavorito(tabela: 'esmaltes' | 'materiais' | 'referencias' | 'conteudos' | 'testes' | 'artistas' | 'obras' | 'exposicoes' | 'entrada' | 'projetos', id: string, atual?: 0 | 1) {
  await db.table(tabela).update(id, { favorito: atual ? 0 : 1, atualizadoEm: Date.now() })
}

export const useReferencias = () => useLiveQuery(async () => vivos(await db.referencias.orderBy('criadoEm').reverse().toArray()))
export const useGrupos = () => useLiveQuery(async () => vivos(await db.grupos.orderBy('nome').toArray()), [], [])
export const usePaineis = () => useLiveQuery(async () => vivos(await db.paineis.orderBy('atualizadoEm').reverse().toArray()))
