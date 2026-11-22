import { cliente_ } from '../db/sync'

/** Cabeçalho com o login do app, exigido pelas funções do servidor que gastam crédito ou usam tokens pessoais. */
export async function cabecalhoLogin(): Promise<Record<string, string>> {
  const sb = await cliente_()
  const token = (await sb?.auth.getSession())?.data.session?.access_token
  return token ? { authorization: `Bearer ${token}` } : {}
}
