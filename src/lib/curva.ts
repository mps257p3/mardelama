import type { SegmentoCurva } from '../db/schema'

export interface PontoCurva { min: number; temp: number }

/** Converte rampas (°C/h) e patamares (min) em pontos tempo × temperatura. */
export function pontosDaCurva(tempInicial: number, segmentos: SegmentoCurva[]): PontoCurva[] {
  const pts: PontoCurva[] = [{ min: 0, temp: tempInicial }]
  let t = 0, temp = tempInicial
  for (const s of segmentos) {
    const taxa = Math.abs(s.taxa) || 0
    if (taxa > 0 && s.alvo !== temp) { t += (Math.abs(s.alvo - temp) / taxa) * 60; temp = s.alvo; pts.push({ min: t, temp }) }
    if (s.patamar > 0) { t += s.patamar; pts.push({ min: t, temp }) }
  }
  return pts
}

export const duracaoTexto = (min: number) => {
  const h = Math.floor(min / 60), m = Math.round(min % 60)
  return h ? `${h} h${m ? ` ${m} min` : ''}` : `${m} min`
}
