import { Route, Routes } from 'react-router-dom'
import { Layout } from './ui/Layout'
import { ToastProvider } from './ui/toast'
import Home from './pages/Home'
import Ajustes from './pages/Ajustes'
import Laboratorio from './pages/Laboratorio'
import EmBreve from './pages/EmBreve'
import Esmaltes from './pages/lab/Esmaltes'
import EsmalteForm from './pages/lab/EsmalteForm'
import EsmalteDetalhe from './pages/lab/EsmalteDetalhe'
import Familias from './pages/lab/Familias'
import Receitas from './pages/lab/Receitas'
import ReceitaNova from './pages/lab/ReceitaNova'
import ReceitaEditor from './pages/lab/ReceitaEditor'
import ReceitaComparar from './pages/lab/ReceitaComparar'
import Testes from './pages/lab/Testes'
import TesteForm from './pages/lab/TesteForm'
import TesteDetalhe from './pages/lab/TesteDetalhe'
import TesteComparar from './pages/lab/TesteComparar'
import Planejar from './pages/lab/Planejar'
import Referencias from './pages/ref/Referencias'
import ReferenciaForm from './pages/ref/ReferenciaForm'
import ReferenciaDetalhe from './pages/ref/ReferenciaDetalhe'
import Grupos from './pages/ref/Grupos'
import Paineis from './pages/ref/Paineis'
import PainelEditor from './pages/ref/PainelEditor'
import Compartilhar from './pages/ref/Compartilhar'
import Materiais from './pages/lab/Materiais'
import MaterialForm from './pages/lab/MaterialForm'
import MaterialDetalhe from './pages/lab/MaterialDetalhe'

const FUTURO: { path: string; nome: string; fase: number; texto: string }[] = [
  { path: '/biblioteca/*', nome: 'Biblioteca', fase: 4, texto: 'Pesquisa técnica e teórica: técnicas, química, queimas, defeitos, livros, artigos e PDFs.' },
  { path: '/caderno/*', nome: 'Caderno', fase: 4, texto: 'Diário criativo com texto, imagens, desenhos, paletas, áudios e referências relacionadas.' },
  { path: '/calculadoras/*', nome: 'Calculadoras', fase: 4, texto: 'Retração, densidade, custos, misturas, consumo do forno, cones e conversões.' },
  { path: '/busca', nome: 'Buscar', fase: 5, texto: 'Busca global por todo o ateliê.' },
]

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="laboratorio" element={<Laboratorio />} />
          <Route path="ajustes" element={<Ajustes />} />
          <Route path="esmaltes" element={<Esmaltes />} />
          <Route path="esmaltes/novo" element={<EsmalteForm key="novo" />} />
          <Route path="esmaltes/familias" element={<Familias />} />
          <Route path="esmaltes/:id" element={<EsmalteDetalhe />} />
          <Route path="esmaltes/:id/editar" element={<EsmalteForm />} />
          <Route path="receitas" element={<Receitas />} />
          <Route path="receitas/nova" element={<ReceitaNova />} />
          <Route path="receitas/comparar" element={<ReceitaComparar />} />
          <Route path="receitas/:id" element={<ReceitaEditor />} />
          <Route path="testes" element={<Testes />} />
          <Route path="testes/novo" element={<TesteForm key="novo" />} />
          <Route path="testes/planejar" element={<Planejar />} />
          <Route path="testes/comparar" element={<TesteComparar />} />
          <Route path="testes/:id" element={<TesteDetalhe />} />
          <Route path="testes/:id/editar" element={<TesteForm />} />
          <Route path="referencias" element={<Referencias />} />
          <Route path="referencias/nova" element={<ReferenciaForm key="nova" />} />
          <Route path="referencias/grupos" element={<Grupos />} />
          <Route path="referencias/:id" element={<ReferenciaDetalhe />} />
          <Route path="referencias/:id/editar" element={<ReferenciaForm />} />
          <Route path="paineis" element={<Paineis />} />
          <Route path="paineis/:id" element={<PainelEditor />} />
          <Route path="compartilhar" element={<Compartilhar />} />
          <Route path="materiais" element={<Materiais />} />
          <Route path="materiais/novo" element={<MaterialForm key="novo" />} />
          <Route path="materiais/:id" element={<MaterialDetalhe />} />
          <Route path="materiais/:id/editar" element={<MaterialForm />} />
          {FUTURO.map((f) => <Route key={f.path} path={f.path} element={<EmBreve {...f} />} />)}
          <Route path="*" element={<EmBreve nome="Página não encontrada" fase={0} texto="Este endereço não existe no ateliê." />} />
        </Route>
      </Routes>
    </ToastProvider>
  )
}
