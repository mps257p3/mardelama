import { PICTOGRAMAS, imagemFenomeno } from '../lib/esmalteFicha'

const NOME: Record<string, string> = Object.fromEntries(PICTOGRAMAS)

/**
 * Amostra ilustrativa de um fenômeno cerâmico (imagem quadrada da biblioteca em /public/fenomenos).
 * A mesma biblioteca serve às fichas, aos filtros e à classificação. Não é fotografia do produto nem resultado de teste.
 */
export function AmostraFenomeno({ tipo, className, grande }: { tipo: string; className?: string; grande?: boolean }) {
  return <img className={'amostra-fen' + (className ? ' ' + className : '')} src={imagemFenomeno(tipo)} alt={`${NOME[tipo] ?? tipo} (imagem ilustrativa)`} width={512} height={512} loading={grande ? 'eager' : 'lazy'} decoding="async" />
}
export const nomeFenomeno = (k: string) => NOME[k] ?? k
