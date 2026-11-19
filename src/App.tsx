import { Route, Routes } from 'react-router-dom'
import { Layout } from './ui/Layout'
import { ToastProvider } from './ui/toast'
import Home from './pages/Home'
import Ajustes from './pages/Ajustes'
import Laboratorio from './pages/Laboratorio'
import EmBreve from './pages/EmBreve'
import EsmalteForm from './pages/lab/EsmalteForm'
import EsmalteDetalhe from './pages/lab/EsmalteDetalhe'
import Familias from './pages/lab/Familias'
import ReceitaNova from './pages/lab/ReceitaNova'
import ReceitaEditor from './pages/lab/ReceitaEditor'
import ReceitaComparar from './pages/lab/ReceitaComparar'
import TesteForm from './pages/lab/TesteForm'
import TesteDetalhe from './pages/lab/TesteDetalhe'
import TesteComparar from './pages/lab/TesteComparar'
import Planejar from './pages/lab/Planejar'
import Referencias from './pages/ref/Referencias'
import ReferenciaForm from './pages/ref/ReferenciaForm'
import ReferenciaDetalhe from './pages/ref/ReferenciaDetalhe'
import Grupos from './pages/ref/Grupos'
import Colecoes from './pages/ref/Colecoes'
import Descobrir from './pages/ref/Descobrir'
import Repertorio from './pages/ref/Repertorio'
import ImportarInstagram from './pages/ref/ImportarInstagram'
import ImportarPinterest from './pages/ref/ImportarPinterest'
import Paineis from './pages/ref/Paineis'
import PainelEditor from './pages/ref/PainelEditor'
import Compartilhar from './pages/ref/Compartilhar'
import Biblioteca from './pages/bib/Biblioteca'
import ConteudoForm from './pages/bib/ConteudoForm'
import ConteudoDetalhe from './pages/bib/ConteudoDetalhe'
import Caderno from './pages/cad/Caderno'
import NotaEditor from './pages/cad/NotaEditor'
import NotaNova from './pages/cad/NotaNova'
import Calculadoras from './pages/calc/Calculadoras'
import Busca from './pages/Busca'
import Atividade from './pages/Atividade'
import Materiais from './pages/lab/Materiais'
import MaterialForm from './pages/lab/MaterialForm'
import MaterialDetalhe from './pages/lab/MaterialDetalhe'
import FamiliaDetalhe from './pages/lab/FamiliaDetalhe'
import Curvas from './pages/lab/Curvas'
import CurvaDetalhe from './pages/lab/CurvaDetalhe'
import Comerciais from './pages/lab/Comerciais'
import ComercialDetalhe from './pages/lab/ComercialDetalhe'
import Compras from './pages/lab/Compras'
import Superficies from './pages/lab/Superficies'

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="laboratorio" element={<Laboratorio />} />
          <Route path="ajustes" element={<Ajustes />} />
          <Route path="esmaltes" element={<Superficies aba="esmaltes" />} />
          <Route path="superficies" element={<Superficies aba="esmaltes" />} />
          <Route path="esmaltes/novo" element={<EsmalteForm key="novo" />} />
          <Route path="esmaltes/familias" element={<Familias />} />
          <Route path="familias" element={<Familias />} />
          <Route path="familias/:id" element={<FamiliaDetalhe />} />
          <Route path="curvas" element={<Curvas />} />
          <Route path="curvas/:id" element={<CurvaDetalhe />} />
          <Route path="engenharia-reversa" element={<Comerciais />} />
          <Route path="engenharia-reversa/:id" element={<ComercialDetalhe />} />
          <Route path="compras" element={<Compras />} />
          <Route path="esmaltes/:id" element={<EsmalteDetalhe />} />
          <Route path="esmaltes/:id/editar" element={<EsmalteForm />} />
          <Route path="receitas" element={<Superficies aba="receitas" />} />
          <Route path="receitas/nova" element={<ReceitaNova />} />
          <Route path="receitas/comparar" element={<ReceitaComparar />} />
          <Route path="receitas/:id" element={<ReceitaEditor />} />
          <Route path="testes" element={<Superficies aba="testes" />} />
          <Route path="testes/novo" element={<TesteForm key="novo" />} />
          <Route path="testes/planejar" element={<Planejar />} />
          <Route path="testes/comparar" element={<TesteComparar />} />
          <Route path="testes/:id" element={<TesteDetalhe />} />
          <Route path="testes/:id/editar" element={<TesteForm />} />
          <Route path="referencias" element={<Referencias />} />
          <Route path="referencias/nova" element={<ReferenciaForm key="nova" />} />
          <Route path="referencias/grupos" element={<Colecoes />} />
          <Route path="referencias/grupos/gerenciar" element={<Grupos />} />
          <Route path="referencias/descobrir" element={<Descobrir />} />
          <Route path="referencias/repertorio" element={<Repertorio />} />
          <Route path="referencias/instagram" element={<ImportarInstagram />} />
          <Route path="referencias/pinterest" element={<ImportarPinterest />} />
          <Route path="referencias/:id" element={<ReferenciaDetalhe />} />
          <Route path="referencias/:id/editar" element={<ReferenciaForm />} />
          <Route path="paineis" element={<Paineis />} />
          <Route path="paineis/:id" element={<PainelEditor />} />
          <Route path="biblioteca" element={<Biblioteca />} />
          <Route path="biblioteca/novo" element={<ConteudoForm key="novo" />} />
          <Route path="biblioteca/:id" element={<ConteudoDetalhe />} />
          <Route path="biblioteca/:id/editar" element={<ConteudoForm />} />
          <Route path="caderno" element={<Caderno />} />
          <Route path="caderno/nova" element={<NotaNova />} />
          <Route path="caderno/:id" element={<NotaEditor />} />
          <Route path="busca" element={<Busca />} />
          <Route path="atividade" element={<Atividade />} />
          <Route path="calculadoras" element={<Calculadoras />} />
          <Route path="compartilhar" element={<Compartilhar />} />
          <Route path="materiais" element={<Materiais />} />
          <Route path="materiais/novo" element={<MaterialForm key="novo" />} />
          <Route path="materiais/:id" element={<MaterialDetalhe />} />
          <Route path="materiais/:id/editar" element={<MaterialForm />} />
          <Route path="*" element={<EmBreve nome="Página não encontrada" fase={0} texto="Este endereço não existe no ateliê." />} />
        </Route>
      </Routes>
    </ToastProvider>
  )
}
