/** Perfil de gosto do Descobrir: como juntar o deste aparelho com o que veio de outro. */
export type Gosto = { atualizadoEm?: number; curtidos?: string[]; recusados?: string[]; vistos?: string[]; curtidasItens?: { id: string }[]; [k: string]: unknown }
const uniao = (a: string[] = [], b: string[] = [], max = 1500) => [...new Set([...a, ...b])].slice(-max)
/** A versão mais recente vale para pesos e termos; listas (curtidas, recusas, vistos) somam as dos dois aparelhos. */
export function mesclarGosto(local: Gosto | undefined, remoto: Gosto | undefined): Gosto | undefined {
  if (!remoto) return local
  if (!local) return remoto
  const [base, outro] = (remoto.atualizadoEm ?? 0) > (local.atualizadoEm ?? 0) ? [remoto, local] : [local, remoto]
  const itens = new Map([...(outro.curtidasItens ?? []), ...(base.curtidasItens ?? [])].map((x) => [x.id, x]))
  const curtidos = uniao(outro.curtidos, base.curtidos)
  return {
    ...base,
    curtidos, recusados: uniao(outro.recusados, base.recusados), vistos: uniao(outro.vistos, base.vistos),
    curtidasItens: [...itens.values()].filter((x) => curtidos.includes(x.id)).slice(-500),
    atualizadoEm: Math.max(local.atualizadoEm ?? 0, remoto.atualizadoEm ?? 0),
  }
}
