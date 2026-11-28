import { useAjuste } from '../db/settings'

/**
 * Padrão de layout das páginas principais (Esmaltaria, Referências, Biblioteca, Caderno).
 * Cada medida vira uma variável CSS no <html>; mudar aqui (Ajustes › Layout) muda todas as páginas juntas.
 * Valores em px de CSS (unidades lógicas), exceto a proporção da capa (largura ÷ altura).
 */
export type LayoutPag = { titulo: number; capa: number; tituloCapa: number; capaConteudo: number; cardsH: number; cardsV: number; secao: number }

export const LAYOUT_PADRAO: LayoutPag = { titulo: 44, capa: 2.7, tituloCapa: 16, capaConteudo: 28, cardsH: 12, cardsV: 16, secao: 32 }

export const CAMPOS_LAYOUT: { k: keyof LayoutPag; nome: string; desc: string; min: number; max: number; passo: number; css: string; px: boolean }[] = [
  { k: 'titulo', nome: 'Tamanho do título', desc: 'Título das páginas (Esmaltaria, Biblioteca…)', min: 28, max: 60, passo: 1, css: '--pag-titulo', px: true },
  { k: 'capa', nome: 'Proporção da capa', desc: 'Largura ÷ altura. Maior = capa mais baixa', min: 1.8, max: 3.6, passo: 0.1, css: '--capa-prop', px: false },
  { k: 'tituloCapa', nome: 'Título até a capa', desc: 'Espaço entre o título e a foto de capa', min: 4, max: 40, passo: 1, css: '--esp-titulo-capa', px: true },
  { k: 'capaConteudo', nome: 'Capa até o conteúdo', desc: 'Espaço entre a capa e o que vem embaixo', min: 8, max: 48, passo: 1, css: '--esp-capa-conteudo', px: true },
  { k: 'cardsH', nome: 'Entre cards (lado a lado)', desc: 'Espaço horizontal entre os cards', min: 4, max: 28, passo: 1, css: '--esp-cards-h', px: true },
  { k: 'cardsV', nome: 'Entre fileiras de cards', desc: 'Espaço vertical entre as fileiras', min: 4, max: 40, passo: 1, css: '--esp-cards-v', px: true },
  { k: 'secao', nome: 'Entre seções', desc: 'Antes de cada grupo, como “Pesquisa e formulação”', min: 12, max: 56, passo: 1, css: '--esp-secao', px: true },
]

export const CHAVE_LAYOUT = 'layout.paginas'

export function useLayout(): LayoutPag {
  const v = useAjuste<Partial<LayoutPag>>(CHAVE_LAYOUT, {})
  return { ...LAYOUT_PADRAO, ...(v ?? {}) }
}

export function aplicarLayout(l: LayoutPag) {
  const s = document.documentElement.style
  for (const c of CAMPOS_LAYOUT) s.setProperty(c.css, c.px ? `${l[c.k]}px` : String(l[c.k]))
}
