import { PICTOGRAMAS, imagemFenomeno } from '../lib/esmalteFicha'

const NOME: Record<string, string> = Object.fromEntries(PICTOGRAMAS)

/**
 * Amostra ilustrativa de um fenômeno cerâmico (imagem quadrada da biblioteca em /public/fenomenos).
 * A mesma biblioteca serve às fichas, aos filtros e à classificação. Não é fotografia do produto nem resultado de teste.
 */
export function AmostraFenomeno({ tipo, className }: { tipo: string; className?: string }) {
  return <img className={'amostra-fen' + (className ? ' ' + className : '')} src={imagemFenomeno(tipo)} alt={`${NOME[tipo] ?? tipo} (representação ilustrativa)`} width={480} height={480} loading="lazy" decoding="async" />
}
export const nomeFenomeno = (k: string) => NOME[k] ?? k
