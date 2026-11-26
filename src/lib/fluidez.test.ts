import { describe, expect, it, vi } from 'vitest'
vi.mock('./iaRepertorio', () => ({ chamar: vi.fn(), iaConfigurada: vi.fn() }))
vi.mock('./comercial', () => ({ codigoDoProduto: vi.fn(), fotosDoFabricante: vi.fn() }))
vi.mock('../db/schema', () => ({ db: {} }))
import { mesclarFluidez, rotulosFluidez } from './fluidez'
import type { Esmalte, FluidezQueima } from '../db/schema'

const antiga: FluidezQueima = {
  situacao: 'oficial', imagens: ['a1'], fontes: ['https://marca.com/p'], consultadoEm: '2026-01-01', espessura: 'Mais grosso escorre mais',
  resultados: [{ cone: '6', classificacao: 'Runny when thick', traducao: 'Escorre quando espesso' }, { cone: '05', classificacao: 'Stable', traducao: 'Estável' }],
}

describe('mesclarFluidez', () => {
  it('substitui o mesmo cone, mantém os outros e soma fotos e fontes', () => {
    const r = mesclarFluidez(antiga, { situacao: 'oficial', resultados: [{ cone: '6', classificacao: 'Moving glaze', traducao: 'Esmalte que se move' }], imagens: [], fontes: ['https://marca.com/ficha.pdf'] }, ['b2'])
    expect(r.resultados).toHaveLength(2)
    expect(r.resultados[0].classificacao).toBe('Moving glaze')
    expect(r.resultados[1].classificacao).toBe('Stable')
    expect(r.imagens).toEqual(['a1', 'b2'])
    expect(r.fontes).toHaveLength(2)
    expect(r.espessura).toBe('Mais grosso escorre mais')
  })
  it('consulta sem resultado não apaga o que havia', () => {
    const r = mesclarFluidez(antiga, { situacao: 'nao-informada', resultados: [], imagens: [], fontes: [] }, [])
    expect(r.situacao).toBe('oficial')
    expect(r.resultados).toHaveLength(2)
  })
  it('primeira consulta sem nada publicado fica como não informada', () => {
    expect(mesclarFluidez(undefined, { situacao: 'nao-informada', resultados: [], imagens: [], fontes: [] }, []).situacao).toBe('nao-informada')
  })
})

describe('rotulosFluidez', () => {
  it('usa o termo de cada fabricante, sem converter', () => {
    const e = { origem: 'comercial', autoria: 'Amaco', fluidezQueima: antiga, testesFluidez: [{ id: '1', data: '2026-01-01', fotos: [] }] } as unknown as Esmalte
    expect(rotulosFluidez(e)).toEqual(['Amaco: Runny when thick', 'Amaco: Stable', 'Com teste seu de fluidez'])
  })
})
