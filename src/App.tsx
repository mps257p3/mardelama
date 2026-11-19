import { Route, Routes } from 'react-router-dom'
import { Layout } from './ui/Layout'
import { ToastProvider } from './ui/toast'
import Home from './pages/Home'
import Ajustes from './pages/Ajustes'
import Laboratorio from './pages/Laboratorio'
import EmBreve from './pages/EmBreve'

const FUTURO: { path: string; nome: string; fase: number; texto: string }[] = [
  { path: '/esmaltes/*', nome: 'Esmaltes', fase: 2, texto: 'Catálogo visual de esmaltes com famílias, filtros combináveis, receitas e histórico de testes.' },
  { path: '/receitas/*', nome: 'Receitas', fase: 2, texto: 'Editor de formulações com base, corantes, opacificantes e aditivos, versões, variações e custos.' },
  { path: '/testes/*', nome: 'Testes', fase: 2, texto: 'Registro de placas de teste com código próprio, comparação lado a lado e planejamento de experimentos.' },
  { path: '/materiais/*', nome: 'Materiais', fase: 2, texto: 'Catálogo de matérias-primas, com fichas técnicas e as receitas que usam cada material.' },
  { path: '/referencias/*', nome: 'Referências', fase: 3, texto: 'Biblioteca visual com grupos cruzados, filtros E/OU e painéis de inspiração.' },
  { path: '/biblioteca/*', nome: 'Biblioteca', fase: 4, texto: 'Pesquisa técnica e teórica: técnicas, química, queimas, defeitos, livros, artigos e PDFs.' },
  { path: '/caderno/*', nome: 'Caderno', fase: 4, texto: 'Diário criativo com texto, imagens, desenhos, paletas, áudios e referências relacionadas.' },
  { path: '/calculadoras/*', nome: 'Calculadoras', fase: 4, texto: 'Retração, densidade, custos, misturas, consumo do forno, cones e conversões.' },
  { path: '/busca', nome: 'Buscar', fase: 5, texto: 'Busca global por todo o ateliê.' },
  { path: '/compartilhar', nome: 'Compartilhar', fase: 3, texto: 'Receber links e imagens compartilhados de outros aplicativos.' },
]

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="laboratorio" element={<Laboratorio />} />
          <Route path="ajustes" element={<Ajustes />} />
          {FUTURO.map((f) => <Route key={f.path} path={f.path} element={<EmBreve {...f} />} />)}
          <Route path="*" element={<EmBreve nome="Página não encontrada" fase={0} texto="Este endereço não existe no ateliê." />} />
        </Route>
      </Routes>
    </ToastProvider>
  )
}
