import { describe, expect, it } from 'vitest'
import { citaArtista } from './curadoria'

const item = (titulo: string, extra: Partial<{ autor: string; termos: string[]; link: string }> = {}) => ({ titulo, termos: [], link: '', ...extra })

describe('citaArtista', () => {
  it('aceita quando o nome aparece no título ou no endereço', () => {
    expect(citaArtista(item('New works by Rebecca Manson'), 'Rebecca Manson')).toBe(true)
    expect(citaArtista(item('Studio visit', { link: 'https://x.com/2026/rebecca-manson-flowers' }), 'Rebecca Manson')).toBe(true)
    expect(citaArtista(item('Léa Renard: céramiques'), 'Lea Renard')).toBe(true)
  })
  it('aceita só o sobrenome longo em nomes compostos', () => {
    expect(citaArtista(item('Westerlund at the gallery'), 'Hanna Westerlund')).toBe(true)
  })
  it('recusa resultado que não cita o artista (nomes que são palavras comuns)', () => {
    expect(citaArtista(item('Em breve: novo show no Rio'), 'Breve (Augusto Ribeiro)')).toBe(false)
    expect(citaArtista(item('Augusto Ribeiro e a cerâmica'), 'Breve (Augusto Ribeiro)')).toBe(true)
    expect(citaArtista(item('Mary Akemi'), 'a.terra estúdio (Mary Akemi)')).toBe(true)
    expect(citaArtista(item('Mutina tiles by Grcic'), 'Mutina')).toBe(true)
    expect(citaArtista(item('Transmutina'), 'Mutina')).toBe(false)
    expect(citaArtista(item('Lou Reed live, 1972'), 'Suro')).toBe(false)
    expect(citaArtista(item('Pencils and watercolor'), 'Kaori Kurihara')).toBe(false)
  })
})
