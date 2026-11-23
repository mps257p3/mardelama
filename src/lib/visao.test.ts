import { describe, expect, it } from 'vitest'
import { limiarDo, notaContra, semelhanca } from './visao'

const vet = (...xs: number[]) => { const v = new Float32Array(xs); const n = Math.hypot(...xs); return v.map((x) => x / n) }

describe('semelhança visual', () => {
  it('compara vetores normalizados', () => {
    expect(semelhanca(vet(1, 0), vet(1, 0))).toBeCloseTo(1)
    expect(semelhanca(vet(1, 0), vet(0, 1))).toBeCloseTo(0)
  })
  it('a nota usa as mais parecidas do conjunto', () => {
    const refs = [vet(1, 0, 0), vet(0.9, 0.1, 0), vet(0, 0, 1)]
    expect(notaContra(vet(1, 0, 0), refs, 2)).toBeGreaterThan(0.9)
    expect(notaContra(vet(0, 1, 0), refs, 2)).toBeLessThan(0.2)
  })
  it('o limiar fica entre 0,3 e 0,6', () => {
    expect(limiarDo([vet(1, 0), vet(1, 0.01), vet(1, 0.02)])).toBe(0.6)
    expect(limiarDo([vet(1, 0), vet(0, 1)])).toBe(0.3)
    expect(limiarDo([vet(1, 0)])).toBe(0.45)
  })
})
