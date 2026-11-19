/** Monograma original de Marcelo Parducci — usado sem redesenho nem distorção (apenas altura definida). */
export function Monograma({ altura = 48, className }: { altura?: number; className?: string }) {
  return <img src="/brand/monograma.png" alt="Marcelo Parducci" className={className} style={{ height: altura, width: 'auto' }} />
}
