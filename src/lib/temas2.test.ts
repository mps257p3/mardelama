import { describe, expect, it } from 'vitest'
import { ancorasDoTema, assuntoDe, citaAlguma, colecoesDoPinterest, refsDoTema, type Tema } from './temas2'
import type { Grupo, Referencia } from '../db/schema'

const g = (id: string, nome: string, extra: Partial<Grupo> = {}) => ({ id, nome, criadoEm: 0, atualizadoEm: 0, ...extra }) as Grupo
const r = (id: string, grupos: string[], extra: Partial<Referencia> = {}) => ({ id, titulo: 'Pin', tipo: 'Fotografia', imagens: [], tags: [], grupos, criadoEm: 0, atualizadoEm: 0, ...extra }) as Referencia

describe('temas de Referências 2', () => {
  it('reconhece o assunto pelo nome da pasta', () => {
    expect(assuntoDe('Luminárias de cerâmica')?.id).toBe('luminarias')
    expect(assuntoDe('Esculturas pequenas')?.id).toBe('esculturas')
    expect(assuntoDe('Máscaras')?.id).toBe('mascaras')
    expect(assuntoDe('Vasos')?.id).toBe('vasos')
    expect(assuntoDe('Coisas lindas')).toBeUndefined()
  })
  it('a âncora casa com a palavra, não com pedaço de outra', () => {
    expect(citaAlguma('ceramic lamps by x', ['lamp'])).toBe(true)
    expect(citaAlguma('iron clamp', ['lamp'])).toBe(false)
  })
  it('coleção do Pinterest: RSS, painel importado ou maioria de pins', () => {
    const gs = [g('a', 'A', { rss: 'https://pinterest.com/x/a' }), g('b', 'B'), g('c', 'C'), g('d', 'D')]
    const rs = [r('1', ['a']), r('2', ['b'], { origem: 'pinterest:9' }), r('3', ['b']), r('4', ['c']), r('5', ['d', 'c'], { origem: 'pinterest:8' }), r('6', ['c'])]
    expect(colecoesDoPinterest(gs, rs).map((x) => x.id).sort()).toEqual(['a', 'b', 'd'])
  })
  it('acervo do tema: coleções do tema e o que fala do assunto, sem apagados', () => {
    const t: Tema = { id: 't', nome: 'Luminárias', colecoes: ['a'], assunto: 'luminarias', criadoEm: 0 }
    const anc = ancorasDoTema(t)
    const rs = [r('1', ['a']), r('2', ['b'], { titulo: 'Pendant lamp in stoneware' }), r('3', ['b'], { titulo: 'Vaso azul' }), r('4', ['a'], { excluido: 1 })]
    const { daColecao, doAssunto } = refsDoTema(t, rs, anc)
    expect(daColecao.map((x) => x.id)).toEqual(['1'])
    expect(doAssunto.map((x) => x.id)).toEqual(['2'])
  })
})
