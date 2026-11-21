import { db, type Artista } from '../db/schema'
import { lerPerfil } from './curadoria'
import { normaliza } from './filtros'
import { definirAjuste } from '../db/settings'

const lerAjuste = async <T,>(k: string) => (await db.ajustes.get(k))?.valor as T | undefined

/** Artista que aparece muito nas suas curtidas e referências salvas, mas ainda não tem estudo. */
export interface SugestaoArtista { nome: string; vezes: number; imagens: string[] }

const IGNORAR = 'artistas.sugestoesIgnoradas'
const MINIMO = 3
// autorias genéricas que não são um artista ("Unknown", "Japanese", "Wedgwood"…)
const GENERICO = /^(unknown|anonymous|anonimo|anônimo|desconhecido|unidentified|not recorded|various|japanese|chinese|korean|french|english|german|italian|american|greek|roman|egyptian|attributed|after|workshop|manufactory|factory|made by)\b/i

const chave = (n: string) => normaliza(n).replace(/\(.*?\)/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()

/** Conta curtidas (Descobrir) e referências salvas por autor; sugere quem passa de 3 e não está nos estudos. Sem IA paga. */
export async function sugerirArtistas(estudos: Artista[], max = 3): Promise<SugestaoArtista[]> {
  const perfil = await lerPerfil()
  const ignorados = new Set((await lerAjuste<string[]>(IGNORAR)) ?? [])
  const jaTem = new Set(estudos.flatMap((a) => [a.nome, a.nomeOriginal].filter(Boolean).map((n) => chave(n!))))
  const conta = new Map<string, SugestaoArtista>()
  const soma = (autor: string | undefined, img?: string) => {
    const nome = autor?.split(/[;|]/)[0].replace(/\s*\(.*$/, '').trim()
    if (!nome || nome.length < 3 || GENERICO.test(nome)) return
    const k = chave(nome)
    if (!k || jaTem.has(k) || ignorados.has(k)) return
    const s = conta.get(k) ?? { nome, vezes: 0, imagens: [] }
    s.vezes++
    if (img && s.imagens.length < 3) s.imagens.push(img)
    conta.set(k, s)
  }
  ;(perfil.curtidasItens ?? []).forEach((x) => soma(x.autor, x.imagem))
  ;(await db.referencias.toArray()).filter((r) => !r.excluido).forEach((r) => soma(r.autor))
  return [...conta.values()].filter((s) => s.vezes >= MINIMO).sort((a, b) => b.vezes - a.vezes).slice(0, max)
}

export async function ignorarSugestao(nome: string) {
  const atual = (await lerAjuste<string[]>(IGNORAR)) ?? []
  await definirAjuste(IGNORAR, [...new Set([...atual, chave(nome)])])
}
