import { describe, expect, it } from 'vitest'
import { conesDoTexto, referenciaDoCone, rotuloQueima, temperaturaDaFicha } from './cones'
import type { Esmalte } from '../db/schema'

const esm = (x: Partial<Esmalte>) => ({ id: 'x', nome: 'x', origem: 'comercial', familias: [], fotos: [], tags: [], ...x }) as unknown as Esmalte

describe('cones', () => {
  it('preserva o zero à esquerda', () => {
    expect(referenciaDoCone('06')).toBe('1013 °C')
    expect(referenciaDoCone('6')).toBe('1243 °C')
    expect(conesDoTexto('cone 06/05')).toEqual(['06', '05'])
  })
  it('faixa de cones vira faixa de temperaturas', () => {
    expect(referenciaDoCone('5-6')).toBe('1207 a 1243 °C')
    expect(referenciaDoCone('06–05')).toBe('1013 a 1044 °C')
    expect(referenciaDoCone('4 a 6')).toBe('1183 a 1243 °C')
  })
  it('não lê temperatura como cone', () => {
    expect(conesDoTexto('1220 °C')).toEqual([])
  })
  it('cabeçalho: original do fabricante, senão referência; só temperatura não gera cone', () => {
    expect(temperaturaDaFicha(esm({ cone: '5-6', temperatura: 1204 }))).toEqual({ valor: '1207 a 1243 °C', referencia: true })
    expect(temperaturaDaFicha(esm({ cone: '6', temperaturaFabricante: '1220 °C' }))).toEqual({ valor: '1220 °C', referencia: false })
    expect(temperaturaDaFicha(esm({ temperatura: 1200 }))).toEqual({ valor: '1200 °C', referencia: false })
  })
  it('queimas documentadas', () => {
    expect(rotuloQueima({ cone: '10' })).toBe('Cone 10 (Referência 1305 °C)')
    expect(rotuloQueima({ cone: '6', temperatura: '1222 °C' })).toBe('Cone 6 (1222 °C)')
  })
})
