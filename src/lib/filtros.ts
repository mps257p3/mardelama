export const FAIXAS_TEMP = [
  { v: 'baixa', l: 'Baixa (até 1100 °C)', t: (x: number) => x <= 1100 },
  { v: 'media', l: 'Média (1101–1220 °C)', t: (x: number) => x > 1100 && x <= 1220 },
  { v: 'alta', l: 'Alta (acima de 1220 °C)', t: (x: number) => x > 1220 },
] as const

export function textoBusca(...partes: (string | number | undefined | string[])[]) {
  return partes.flat().filter((p) => p != null).join(' ').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}
export const normaliza = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
