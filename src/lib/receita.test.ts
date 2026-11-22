import { describe, expect, it } from 'vitest'
import type { Ingrediente } from '../db/schema'
import { baseParaTotal, comparar, misturar, normalizar, pesos, somaBase } from './receita'

const b = (nome: string, percentual: number): Ingrediente => ({ nome, percentual, classe: 'base' })
const c = (nome: string, percentual: number): Ingrediente => ({ nome, percentual, classe: 'corante' })

describe('normalizar', () => {
  it('leva a base a exatamente 100% e não mexe nos corantes', () => {
    const r = normalizar([b('Feldspato', 33), b('Sílica', 33), b('Caulim', 33), c('Cobalto', 2)])
    expect(somaBase(r)).toBe(100)
    expect(r.find((i) => i.nome === 'Cobalto')?.percentual).toBe(2)
  })
  it('receita sem base fica como está', () => {
    const r = [c('Cobalto', 2)]
    expect(normalizar(r)).toEqual(r)
  })
})

describe('pesos', () => {
  it('corante é calculado sobre o peso da base (convenção cerâmica)', () => {
    const p = pesos([b('Feldspato', 60), b('Sílica', 40), c('Cobalto', 2)], 1000)
    expect(p.map((i) => Math.round(i.peso))).toEqual([600, 400, 20])
  })
  it('peso total desejado vira peso de base descontando os extras', () => {
    expect(baseParaTotal([b('A', 100), c('Cobalto', 10)], 1100)).toBeCloseTo(1000)
  })
})

describe('comparar e misturar', () => {
  it('mostra a diferença por ingrediente', () => {
    const d = comparar([b('Feldspato', 50), b('Sílica', 50)], [b('Feldspato', 60), b('Sílica', 40)])
    expect(d.find((x) => x.nome === 'Feldspato')?.delta).toBe(10)
  })
  it('70% A + 30% B soma ingredientes iguais', () => {
    const m = misturar([b('Feldspato', 100)], [b('Feldspato', 50), b('Sílica', 50)], 0.7)
    expect(m.find((i) => i.nome === 'Feldspato')?.percentual).toBeCloseTo(85)
    expect(m.find((i) => i.nome === 'Sílica')?.percentual).toBeCloseTo(15)
  })
})
