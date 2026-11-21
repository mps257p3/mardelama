export const CATEGORIAS_BIB = ['Forno', 'Técnicas de modelagem', 'Esmaltes', 'Química cerâmica', 'Tipos de argila', 'Técnicas de decoração', 'Processos de queima', 'Curvas de temperatura', 'Defeitos cerâmicos', 'Segurança no ateliê', 'Conservação e armazenamento', 'Técnicas de aplicação', 'História da arte', 'Artistas', 'Raku', 'Livros', 'Artigos', 'Vídeos', 'Documentos PDF'] as const
export const FORMATOS = [
  { v: 'texto', l: 'Texto próprio' }, { v: 'link', l: 'Link' }, { v: 'arquivo', l: 'Arquivo / PDF' },
  { v: 'livro', l: 'Livro' }, { v: 'artigo', l: 'Artigo' }, { v: 'video', l: 'Vídeo' },
] as const

const commons = (arquivo: string) => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(arquivo)}?width=1400`

export interface Atalho { to: string; nome: string; desc: string }
export interface SecaoBib {
  slug: string
  nome: string
  desc: string
  /** categorias antigas da biblioteca reunidas nesta seção */
  cats: string[]
  /** capa padrão: foto real da categoria (local ou de acervo aberto); o Marcelo pode trocar pela dele */
  capa: string
  reserva?: string
  credito?: string
  /** colunas que o card ocupa no computador (grade de 6) */
  span?: number
  /** partes do ateliê que pertencem a esta seção */
  atalhos: Atalho[]
}

/** As seções da Biblioteca, na ordem do feed. Cada categoria antiga entra em exatamente uma seção. */
export const SECOES: SecaoBib[] = [
  {
    slug: 'artistas', span: 4, nome: 'Artistas', desc: 'Artistas, obras e linguagens que ampliam as possibilidades da cerâmica.',
    cats: ['Artistas'], capa: '/areas/esmaltes.jpg', atalhos: [],
  },
  {
    slug: 'esmaltes', span: 2, nome: 'Esmaltes', desc: 'Formulações, acabamentos, testes e pesquisas de superfície.',
    cats: ['Esmaltes', 'Técnicas de aplicação'], capa: commons('Ceramics glaze crazing.jpg'), reserva: '/areas/esmaltes.jpg', credito: 'Wikimedia Commons',
    atalhos: [
      { to: '/esmaltes', nome: 'Superfícies', desc: 'Esmaltes, fórmulas e testes' },
      { to: '/familias', nome: 'Famílias', desc: 'Classificação do laboratório' },
      { to: '/engenharia-reversa', nome: 'Engenharia reversa', desc: 'Esmaltes comerciais' },
    ],
  },
  {
    slug: 'tecnicas', span: 2, nome: 'Técnicas', desc: 'Processos de construção, modelagem, decoração e queima.',
    cats: ['Técnicas de modelagem', 'Técnicas de decoração', 'Processos de queima', 'Forno', 'Curvas de temperatura', 'Defeitos cerâmicos'],
    capa: commons('Making pottery (Unsplash).jpg'), reserva: '/areas/caderno.jpg', credito: 'Unsplash · Wikimedia Commons',
    atalhos: [{ to: '/curvas', nome: 'Curvas de queima', desc: 'Programações do forno' }],
  },
  {
    slug: 'materiais', span: 2, nome: 'Materiais', desc: 'Argilas, óxidos, fundentes e suas propriedades.',
    cats: ['Tipos de argila', 'Química cerâmica', 'Segurança no ateliê', 'Conservação e armazenamento'], capa: '/areas/materiais.jpg',
    atalhos: [
      { to: '/materiais', nome: 'Matérias-primas', desc: 'Fichas de cada material' },
      { to: '/compras', nome: 'Compras', desc: 'Lista e fornecedores' },
    ],
  },
  {
    slug: 'raku', span: 2, nome: 'Raku', desc: 'Queima rápida, choque térmico, fumaça e reduções pós-queima.',
    cats: ['Raku'], capa: commons('Western-raku-vase.jpg'), reserva: '/areas/esmaltes.jpg', credito: 'Wikimedia Commons',
    atalhos: [{ to: '/curvas', nome: 'Curvas de queima', desc: 'Programações do forno' }],
  },
  {
    slug: 'referencias', span: 3, nome: 'Referências', desc: 'Um arquivo visual de ideias, formas e possibilidades.',
    cats: ['História da arte'], capa: '/areas/referencias.jpg',
    atalhos: [
      { to: '/referencias', nome: 'Acervo', desc: 'Todas as imagens guardadas' },
      { to: '/referencias/descobrir', nome: 'Descobrir', desc: 'Obras de museus e acervos' },
      { to: '/paineis', nome: 'Painéis', desc: 'Composições de estudo' },
    ],
  },
  {
    slug: 'leituras', span: 3, nome: 'Leituras', desc: 'Livros, artigos, vídeos e documentos guardados para estudo.',
    cats: ['Livros', 'Artigos', 'Vídeos', 'Documentos PDF'], capa: '/areas/biblioteca.jpg', atalhos: [],
  },
]

export const secaoPorSlug = (slug?: string) => SECOES.find((s) => s.slug === slug)
/** Seção de um conteúdo; categorias que não estão em nenhuma seção caem em Leituras (nada se perde). */
export function secaoDaCategoria(cat: string): SecaoBib {
  return SECOES.find((s) => s.cats.includes(cat)) ?? SECOES[SECOES.length - 1]
}
