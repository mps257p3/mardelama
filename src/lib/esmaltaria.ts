import { useAjuste, definirAjuste } from '../db/settings'
import { useArquivoUrl, salvarArquivo } from '../db/files'
import { db } from '../db/schema'
import { estiloRecorte, useRecorteAjuste, salvarRecorteAjuste } from '../ui/Recorte'

/**
 * Fotografias da página inicial da Esmaltaria: a capa panorâmica e as quatro seções.
 * Não dependem dos registros: ficam visíveis mesmo com a seção vazia.
 * A foto escolhida pelo Marcelo fica no aparelho (reduzida ao salvar) e vai na sincronização;
 * sem ela, vale a padrão (arquivo local do app, ou externa com reserva local se falhar).
 */
export type FotoEsm = { chave: string; nome: string; aspecto: number; padrao?: string; reserva?: string; credito?: string }

const commons = (arquivo: string) => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(arquivo)}?width=900`

export const CAPA_ESMALTARIA: FotoEsm = { chave: 'esmaltaria.capa', nome: 'Capa da Esmaltaria', aspecto: 2.7 }

export const SECOES_ESM: (FotoEsm & { slug: string; to: string; unid: [string, string] })[] = [
  { slug: 'esmaltes', to: '/esmaltes', chave: 'esmaltaria.foto.esmaltes', nome: 'Esmaltes', aspecto: 3 / 2, unid: ['esmalte', 'esmaltes'],
    padrao: commons('Ceramics glaze crazing.jpg'), reserva: '/areas/esmaltes.jpg', credito: 'Wikimedia Commons' },
  { slug: 'receitas', to: '/receitas', chave: 'esmaltaria.foto.receitas', nome: 'Fórmulas', aspecto: 3 / 2, unid: ['fórmula', 'fórmulas'], padrao: '/areas/formulas.jpg' },
  { slug: 'testes', to: '/testes', chave: 'esmaltaria.foto.testes', nome: 'Testes', aspecto: 3 / 2, unid: ['teste', 'testes'], padrao: '/areas/testes.jpg' },
  { slug: 'ideias', to: '/ideias', chave: 'esmaltaria.foto.ideias', nome: 'Ideias', aspecto: 3 / 2, unid: ['ideia', 'ideias'], padrao: '/areas/caderno.jpg' },
]

/** Foto a mostrar: a do Marcelo (com enquadramento) ou a padrão. A capa, sem foto própria, usa a foto da Esmaltaria da tela inicial. */
export function useFotoEsm(f: FotoEsm) {
  const id = useAjuste<string | undefined>(f.chave, undefined)
  const url = useArquivoUrl(id)
  const recorte = useRecorteAjuste(f.chave)
  // a capa, sem foto própria, repete a foto da Esmaltaria escolhida para a tela inicial
  const idHome = useAjuste<string | undefined>('area.foto.esmaltes', undefined)
  const urlHome = useArquivoUrl(f.padrao ? undefined : idHome)
  const padrao = f.padrao ?? urlHome ?? '/areas/esmaltes.jpg'
  return { src: url ?? padrao, reserva: f.reserva, propria: !!id, id, recorte: id ? recorte : undefined, estilo: id ? estiloRecorte(recorte) : undefined }
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
