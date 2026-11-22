import { describe, expect, it } from 'vitest'
import { mesclarGosto } from './gosto'

describe('gosto do Descobrir entre aparelhos', () => {
  it('soma as curtidas dos dois aparelhos e fica com a data mais recente', () => {
    const r = mesclarGosto({ atualizadoEm: 1, curtidos: ['a'] }, { atualizadoEm: 2, curtidos: ['b'] })
    expect(r?.curtidos?.sort()).toEqual(['a', 'b'])
    expect(r?.atualizadoEm).toBe(2)
  })
  it('sem nada do outro aparelho, mantém o local', () => {
    const l = { atualizadoEm: 1, curtidos: ['a'] }
    expect(mesclarGosto(l, undefined)).toBe(l)
  })
})
