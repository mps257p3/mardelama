import { Home, FlaskConical, Images, BookOpen, Feather, Calculator, Layers, Settings, Search, Beaker } from 'lucide-react'

/** As seis áreas principais. `cor` identifica a área discretamente (ícones, etiquetas, indicadores). */
export const AREAS = [
  { slug: 'esmaltes', to: '/superficies', nome: 'Superfícies', desc: 'Esmaltes, fórmulas e testes', icon: FlaskConical, cor: '#3D5965', fase: 2 },
  { slug: 'materiais', to: '/materiais', nome: 'Materiais', desc: 'Argilas, fritas, óxidos e insumos', icon: Layers, cor: '#B46E4B', fase: 2 },
  { slug: 'referencias', to: '/referencias/descobrir', nome: 'Referências', desc: 'Imagens, artistas e ideias', icon: Images, cor: '#858D70', fase: 3 },
  { slug: 'biblioteca', to: '/biblioteca', nome: 'Biblioteca', desc: 'Técnicas, química e estudos', icon: BookOpen, cor: '#B49B70', fase: 4 },
  { slug: 'caderno', to: '/caderno', nome: 'Caderno', desc: 'Ideias, pesquisas e descobertas', icon: Feather, cor: '#987C79', fase: 4 },
  { slug: 'calculadoras', to: '/calculadoras', nome: 'Calculadoras', desc: 'Ferramentas para o ateliê', icon: Calculator, cor: '#594334', fase: 4 },
] as const

export type AreaSlug = (typeof AREAS)[number]['slug']
export const COR_AREA: Record<AreaSlug, string> = Object.fromEntries(AREAS.map((a) => [a.slug, a.cor])) as Record<AreaSlug, string>

export const LATERAL = [
  { to: '/', nome: 'Início', icon: Home },
  { to: '/busca', nome: 'Buscar', icon: Search },
  { to: '/laboratorio', nome: 'Laboratório', icon: Beaker },
  AREAS[0],
  ...AREAS.slice(1),
]
export const RODAPE = [{ to: '/ajustes', nome: 'Ajustes', icon: Settings }]
