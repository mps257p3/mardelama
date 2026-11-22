import { describe, expect, it } from 'vitest'
import { duracaoTexto, pontosDaCurva } from './curva'

describe('curva de queima', () => {
  it('rampa de 100 °C/h até 600 °C e patamar de 15 min', () => {
    const p = pontosDaCurva(25, [{ taxa: 100, alvo: 600, patamar: 15 }])
    expect(p.at(-1)).toEqual({ min: 345 + 15, temp: 600 })
  })
  it('escreve a duração em horas e minutos', () => {
    expect(duracaoTexto(125)).toBe('2 h 5 min')
    expect(duracaoTexto(40)).toBe('40 min')
  })
})
