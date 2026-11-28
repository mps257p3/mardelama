import { useAjuste, definirAjuste } from '../db/settings'
import { useArquivoUrl, salvarArquivo } from '../db/files'
import { db } from '../db/schema'
import { estiloRecorte, useRecorteAjuste, salvarRecorteAjuste } from '../ui/Recorte'

/**
 * Fotografias da página inicial da Esmaltaria: a capa panorâmica e as quatro seções.
 * Não dependem dos registros: ficam visíveis mesmo com a seção vazia.
 * A foto escolhida pelo Marcelo fica no aparelho (reduzida ao salvar) e vai na sincronização;
 * sem ela, vale a padrão (arquivo local do app, ou externa com reserva local se falhar).
 * A capa usa a mesma foto do card da Esmaltaria na tela inicial.
 */
export type FotoEsm = { chave: string; nome: string; aspecto: number; padrao?: string; reserva?: string; credito?: string }

const commons = (arquivo: string) => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(arquivo)}?width=900`

/** Capa de uma área: a mesma foto do card da área na tela inicial (ajuste `area.foto.<slug>`). */
export const fotoDaArea = (slug: string, nome: string): FotoEsm => ({ chave: `area.foto.${slug}`, nome: `Capa de ${nome} (também na tela inicial)`, aspecto: 2.7, padrao: `/areas/${slug}.jpg` })

export const CAPA_ESMALTARIA: FotoEsm = fotoDaArea('esmaltes', 'Esmaltaria')

export const SECOES_ESM: (FotoEsm & { slug: string; to: string; unid: [string, string] })[] = [
  { slug: 'esmaltes', to: '/esmaltes', chave: 'esmaltaria.foto.esmaltes', nome: 'Esmaltes', aspecto: 3 / 2, unid: ['esmalte', 'esmaltes'],
    padrao: commons('Ceramics glaze crazing.jpg'), reserva: '/areas/esmaltes.jpg', credito: 'Wikimedia Commons' },
  { slug: 'receitas', to: '/receitas', chave: 'esmaltaria.foto.receitas', nome: 'Fórmulas', aspecto: 3 / 2, unid: ['fórmula', 'fórmulas'], padrao: '/areas/formulas.jpg' },
  { slug: 'testes', to: '/testes', chave: 'esmaltaria.foto.testes', nome: 'Testes', aspecto: 3 / 2, unid: ['teste', 'testes'], padrao: '/areas/testes.jpg' },
  { slug: 'ideias', to: '/ideias', chave: 'esmaltaria.foto.ideias', nome: 'Ideias', aspecto: 3 / 2, unid: ['ideia', 'ideias'], padrao: '/areas/caderno.jpg' },
]

/** Foto a mostrar: a do Marcelo (com enquadramento) ou a padrão. */
export function useFotoEsm(f: FotoEsm) {
  const id = useAjuste<string | undefined>(f.chave, undefined)
  const url = useArquivoUrl(id)
  const recorte = useRecorteAjuste(f.chave)
  return { src: url ?? f.padrao ?? '/areas/esmaltes.jpg', reserva: f.reserva, propria: !!id, id, recorte: id ? recorte : undefined, estilo: id ? estiloRecorte(recorte) : undefined }
}

export async function trocarFotoEsm(f: FotoEsm, file: File, atual?: string) {
  const id = await salvarArquivo(file)
  if (atual) await db.arquivos.update(atual, { excluido: 1, atualizadoEm: Date.now() })
  await definirAjuste(f.chave, id)
  await salvarRecorteAjuste(f.chave, undefined)
}

export async function restaurarFotoEsm(f: FotoEsm, atual?: string) {
  if (atual) await db.arquivos.update(atual, { excluido: 1, atualizadoEm: Date.now() })
  await definirAjuste(f.chave, undefined)
  await salvarRecorteAjuste(f.chave, undefined)
}
