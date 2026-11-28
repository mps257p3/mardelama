import { lazy, type ComponentType } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Layout } from './ui/Layout'
import { podeRecarregarSozinho, recarregarComVersaoNova } from './lib/versaoNova'
import { ToastProvider } from './ui/toast'
import Home from './pages/Home'
import { SECOES, SECOES_PROPRIAS } from './lib/biblioteca'

/**
 * Cada área é baixada só quando é aberta (o app abre mais rápido). Se o arquivo da área sumiu
 * porque saiu uma versão nova do app, recarrega uma vez para pegar a versão nova.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function carregar<T extends ComponentType<any>>(f: () => Promise<{ default: T }>) {
  return lazy(() => f().catch((e) => {
    // versão antiga aberta pedindo arquivo que sumiu: busca a nova e recarrega (no máximo uma vez a cada 30 s)
    if (podeRecarregarSozinho()) { void recarregarComVersaoNova(); return new Promise<never>(() => {}) }
    throw e
  }))
}

const Ajustes = carregar(() => import('./pages/Ajustes'))
const AjustesLayout = carregar(() => import('./pages/AjustesLayout'))
const Laboratorio = carregar(() => import('./pages/Laboratorio'))
const Seguranca = carregar(() => import('./pages/lab/Seguranca'))
const EmBreve = carregar(() => import('./pages/EmBreve'))
const EsmalteForm = carregar(() => import('./pages/lab/EsmalteForm'))
const EsmalteDetalhe = carregar(() => import('./pages/lab/EsmalteDetalhe'))
const Familias = carregar(() => import('./pages/lab/Familias'))
const ReceitaNova = carregar(() => import('./pages/lab/ReceitaNova'))
const ReceitaEditor = carregar(() => import('./pages/lab/ReceitaEditor'))
const ReceitaComparar = carregar(() => import('./pages/lab/ReceitaComparar'))
const TesteForm = carregar(() => import('./pages/lab/TesteForm'))
const TesteDetalhe = carregar(() => import('./pages/lab/TesteDetalhe'))
const IdeiaDetalhe = carregar(() => import('./pages/lab/IdeiaDetalhe'))
const TesteComparar = carregar(() => import('./pages/lab/TesteComparar'))
const Planejar = carregar(() => import('./pages/lab/Planejar'))
const Referencias = carregar(() => import('./pages/ref/Referencias'))
const ReferenciaForm = carregar(() => import('./pages/ref/ReferenciaForm'))
const ReferenciaDetalhe = carregar(() => import('./pages/ref/ReferenciaDetalhe'))
const Grupos = carregar(() => import('./pages/ref/Grupos'))
const Colecoes = carregar(() => import('./pages/ref/Colecoes'))
const Descobrir = carregar(() => import('./pages/ref/Descobrir'))
const Repertorio = carregar(() => import('./pages/ref/Repertorio'))
const ImportarInstagram = carregar(() => import('./pages/ref/ImportarInstagram'))
const ImportarPinterest = carregar(() => import('./pages/ref/ImportarPinterest'))
const RetornoPinterest = carregar(() => import('./pages/ref/RetornoPinterest'))
const Privacidade = carregar(() => import('./pages/Privacidade'))
const Paineis = carregar(() => import('./pages/ref/Paineis'))
const PainelEditor = carregar(() => import('./pages/ref/PainelEditor'))
const Compartilhar = carregar(() => import('./pages/ref/Compartilhar'))
const Biblioteca = carregar(() => import('./pages/bib/Biblioteca'))
const ConteudoForm = carregar(() => import('./pages/bib/ConteudoForm'))
const ConteudoDetalhe = carregar(() => import('./pages/bib/ConteudoDetalhe'))
const SecaoBiblioteca = carregar(() => import('./pages/bib/SecaoBiblioteca'))
const Artistas = carregar(() => import('./pages/bib/art/Artistas'))
const ArtistaDetalhe = carregar(() => import('./pages/bib/art/ArtistaDetalhe'))
const ArtistaForm = carregar(() => import('./pages/bib/art/ArtistaForm'))
const ObraDetalhe = carregar(() => import('./pages/bib/art/ObraDetalhe'))
const ObraForm = carregar(() => import('./pages/bib/art/ObraForm'))
const ColecaoDetalhe = carregar(() => import('./pages/bib/art/Colecoes').then((m) => ({ default: m.ColecaoDetalhe })))
const ColecoesLista = carregar(() => import('./pages/bib/art/Colecoes').then((m) => ({ default: m.ColecoesLista })))
const Glossario = carregar(() => import('./pages/bib/Glossario'))
const Agenda = carregar(() => import('./pages/bib/Agenda'))
const Caderno = carregar(() => import('./pages/cad/Caderno'))
const MinhasObras = carregar(() => import('./pages/obras/MinhasObras'))
const PecaDetalhe = carregar(() => import('./pages/obras/PecaDetalhe'))
const SerieDetalhe = carregar(() => import('./pages/obras/SerieDetalhe'))
const NotaEditor = carregar(() => import('./pages/cad/NotaEditor'))
const NotaNova = carregar(() => import('./pages/cad/NotaNova'))
const Calculadoras = carregar(() => import('./pages/calc/Calculadoras'))
const Busca = carregar(() => import('./pages/Busca'))
const Atividade = carregar(() => import('./pages/Atividade'))
const Materiais = carregar(() => import('./pages/lab/Materiais'))
const MaterialForm = carregar(() => import('./pages/lab/MaterialForm'))
const MaterialDetalhe = carregar(() => import('./pages/lab/MaterialDetalhe'))
const FamiliaDetalhe = carregar(() => import('./pages/lab/FamiliaDetalhe'))
const Curvas = carregar(() => import('./pages/lab/Curvas'))
const CurvaDetalhe = carregar(() => import('./pages/lab/CurvaDetalhe'))
const Comerciais = carregar(() => import('./pages/lab/Comerciais'))
const ComercialDetalhe = carregar(() => import('./pages/lab/ComercialDetalhe'))
const Compras = carregar(() => import('./pages/lab/Compras'))
const Superficies = carregar(() => import('./pages/lab/Superficies'))
/** /referencias sozinho vai para o Descobrir; com parâmetros (ex.: ?grupo=) é um link antigo do Acervo. */
function EntradaReferencias() {
  const { search } = useLocation()
  return <Navigate to={search ? '/referencias/acervo' + search : '/referencias/descobrir'} replace />
}

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="laboratorio" element={<Laboratorio />} />
          <Route path="esmaltaria/seguranca" element={<Seguranca />} />
          <Route path="ajustes" element={<Ajustes />} />
          <Route path="ajustes/layout" element={<AjustesLayout />} />
          <Route path="esmaltes" element={<Superficies aba="esmaltes" />} />
          <Route path="superficies" element={<Navigate to="/laboratorio" replace />} />
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
          <Route path="ideias" element={<Superficies aba="ideias" />} />
          <Route path="ideias/:id" element={<IdeiaDetalhe />} />
          {/* Referências abre no Descobrir; links antigos com ?grupo= etc. continuam caindo no Acervo */}
          <Route path="referencias" element={<EntradaReferencias />} />
          <Route path="referencias/acervo" element={<Referencias />} />
          <Route path="referencias/nova" element={<ReferenciaForm key="nova" />} />
          <Route path="referencias/grupos" element={<Colecoes />} />
          <Route path="referencias/grupos/gerenciar" element={<Grupos />} />
          <Route path="referencias/descobrir" element={<Descobrir />} />
          <Route path="referencias/repertorio" element={<Repertorio />} />
          <Route path="referencias/instagram" element={<ImportarInstagram />} />
          <Route path="referencias/pinterest" element={<ImportarPinterest />} />
          <Route path="referencias/pinterest/retorno" element={<RetornoPinterest />} />
          <Route path="privacidade" element={<Privacidade />} />
          <Route path="referencias/:id" element={<ReferenciaDetalhe />} />
          <Route path="referencias/:id/editar" element={<ReferenciaForm />} />
          <Route path="paineis" element={<Paineis />} />
          <Route path="paineis/:id" element={<PainelEditor />} />
          <Route path="biblioteca" element={<Biblioteca />} />
          <Route path="biblioteca/novo" element={<ConteudoForm key="novo" />} />
          <Route path="biblioteca/artistas" element={<Artistas />} />
          <Route path="biblioteca/artistas/novo" element={<ArtistaForm key="novo" />} />
          <Route path="biblioteca/artistas/:id" element={<ArtistaDetalhe />} />
          <Route path="biblioteca/artistas/:id/editar" element={<ArtistaForm />} />
          <Route path="biblioteca/obras/nova" element={<ObraForm key="nova" />} />
          <Route path="biblioteca/obras/:id" element={<ObraDetalhe />} />
          <Route path="biblioteca/obras/:id/editar" element={<ObraForm />} />
          <Route path="biblioteca/colecoes" element={<ColecoesLista />} />
          <Route path="biblioteca/colecoes/:id" element={<ColecaoDetalhe />} />
          <Route path="biblioteca/glossario" element={<Glossario />} />
          <Route path="biblioteca/agenda" element={<Agenda />} />
          {SECOES.filter((x) => !SECOES_PROPRIAS.has(x.slug)).map((x) => <Route key={x.slug} path={`biblioteca/${x.slug}`} element={<SecaoBiblioteca key={x.slug} slug={x.slug} />} />)}
          <Route path="biblioteca/:id" element={<ConteudoDetalhe />} />
          <Route path="biblioteca/:id/editar" element={<ConteudoForm />} />
          <Route path="obras" element={<MinhasObras />} />
          <Route path="obras/peca/:id" element={<PecaDetalhe />} />
          <Route path="obras/serie/:id" element={<SerieDetalhe />} />
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
