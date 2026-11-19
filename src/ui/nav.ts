import { Home, FlaskConical, Images, BookOpen, Feather, Calculator, Layers, Settings, Search } from 'lucide-react'

export const AREAS = [
  { to: '/esmaltes', nome: 'Esmaltes', desc: 'Receitas, testes e variações', icon: FlaskConical, fase: 2 },
  { to: '/materiais', nome: 'Materiais', desc: 'Argilas, fritas, óxidos e insumos', icon: Layers, fase: 2 },
  { to: '/referencias', nome: 'Referências', desc: 'Imagens, artistas e ideias', icon: Images, fase: 3 },
  { to: '/biblioteca', nome: 'Biblioteca', desc: 'Técnicas, química e estudos', icon: BookOpen, fase: 4 },
  { to: '/caderno', nome: 'Caderno', desc: 'Ideias, pesquisas e descobertas', icon: Feather, fase: 4 },
  { to: '/calculadoras', nome: 'Calculadoras', desc: 'Ferramentas para o ateliê', icon: Calculator, fase: 4 },
] as const

export const LATERAL = [
  { to: '/', nome: 'Início', icon: Home },
  { to: '/busca', nome: 'Buscar', icon: Search },
  ...AREAS,
]
export const RODAPE = [{ to: '/ajustes', nome: 'Ajustes', icon: Settings }]
