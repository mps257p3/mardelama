import Dexie, { type EntityTable } from 'dexie'

/**
 * Banco local (IndexedDB) — funciona offline e é a fonte de verdade no aparelho.
 * Todas as tabelas usam ids UUID, `criadoEm`/`atualizadoEm` e `excluido` (soft delete)
 * para permitir sincronização com o Supabase (Postgres) na etapa seguinte.
 */
export interface Base {
  id: string
  criadoEm: number
  atualizadoEm: number
  excluido?: 0 | 1
  favorito?: 0 | 1
}

export type Tipo =
  | 'esmalte' | 'receita' | 'teste' | 'material' | 'referencia'
  | 'painel' | 'conteudo' | 'nota' | 'grupo' | 'familia'
  | 'curva' | 'queima' | 'comercial' | 'lote' | 'fornecedor' | 'projeto' | 'entrada' | 'paleta' | 'compra'
  | 'artista' | 'obra' | 'colecao' | 'exposicao' | 'ideia'

export interface Arquivo extends Base {
  nome: string
  mime: string
  tamanho: number
  blob: Blob
  donoTipo?: Tipo
  donoId?: string
}

/** Família de esmaltes — classificação interna do laboratório (não é classificação científica universal). */
export interface Familia extends Base {
  nome: string
  descricao?: string
  ordem: number
  codigo?: string
  nomeEn?: string
  visuais?: string[]          // características visuais
  quimicas?: string           // características químicas
  materiais?: string[]        // ids de Material relacionados
  tecnicas?: string
  temperaturas?: string
  dificuldade?: number        // 1..5
  prioridade?: string
  cuidados?: string
  possibilidades?: string[]
  subcategorias?: string[]
  variaveis?: string[]
  usoInicial?: string
}

export interface Esmalte extends Base {
  nome: string
  codigo: string
  fotos: string[]            // ids de Arquivo (o esmalte em si: plaquinhas, testes bonitos)
  pecas?: string[]           // ids de Arquivo: peças feitas com o esmalte
  autoria?: string
  origem: 'comercial' | 'propria'
  familias: string[]         // ids de Familia (múltiplas categorias)
  cor?: string
  corHex?: string
  acabamento?: string
  textura?: string
  transparencia?: string
  temperatura?: number       // °C
  cone?: string
  atmosfera?: string
  fluidez?: string
  aplicacao?: string
  receitaId?: string
  observacoes?: string
  fonteReceita?: string
  status?: string
  avaliacao?: number         // 0..5
  tags: string[]
}

export type ClasseIngrediente = 'base' | 'corante' | 'opacificante' | 'aditivo'
export interface Ingrediente {
  materialId?: string
  nome: string
  percentual: number
  classe: ClasseIngrediente
}

export interface Receita extends Base {
  nome: string
  codigo?: string
  familias?: string[]        // ids de Familia (uma fórmula pode ter várias)
  status?: string            // ex.: 'Experimental — ainda não testada'
  objetivo?: string
  referencia?: string        // referência estética (não é reprodução confirmada)
  fonte?: string
  parametros?: string        // parâmetros iniciais de teste
  curvaId?: string
  densidade?: number         // g/ml da suspensão, quando medida
  tags?: string[]
  esmalteId?: string
  origemId?: string          // receita original da qual derivou
  ehBase?: 0 | 1             // base reutilizável
  versaoAtual: number
  ingredientes: Ingrediente[]
  aguaMlPor100g?: number
  liquidos?: { nome: string; quantidade: number; unidade: string }[]
  observacoes?: string
  fotos?: string[]           // foto do esmalte resultante
  pecas?: string[]           // fotos de peças feitas com a receita
}

export interface VersaoReceita {
  id: string
  receitaId: string
  versao: number
  criadoEm: number
  nota?: string
  snapshot: Omit<Receita, 'id'>
}

export interface Teste extends Base {
  codigo: string
  esmalteId?: string
  receitaId?: string
  receitaVersao?: number
  fotos: string[]
  data: string
  argila?: string
  temperatura?: number
  cone?: string
  curva?: string
  camadas?: number
  aplicacao?: string
  densidade?: number
  combinacao?: string[]      // ids de esmaltes sobrepostos
  resultado?: string
  defeitos?: string[]
  observacoes?: string
  avaliacao?: number
  planoId?: string
  descricaoPlano?: string   // ex.: "70% A + 30% B"
  planejado?: 0 | 1         // ainda não queimado
  ideiaId?: string          // ideia de esmaltação que originou o teste
}

export interface Material extends Base {
  nome: string
  categoria: string
  nomesAlternativos?: string
  nomeEn?: string
  formula?: string           // apenas quando aplicável; matérias naturais variam
  funcaoSecundaria?: string
  fusao?: string             // influência na fusão
  texturaInf?: string
  corInf?: string
  brilhoInf?: string
  familias?: string[]
  lote?: string
  cuidados?: string
  tonalidades?: { nome: string; hex: string }[]   // paleta ilustrativa (não é resultado garantido)
  precoEstimado?: 0 | 1
  verificado?: 0 | 1
  fotos: string[]
  fabricante?: string
  fornecedor?: string
  composicao?: string
  funcao?: string
  caracteristicas?: string
  precoKg?: number
  estoqueKg?: number
  fichaTecnica?: string      // id de Arquivo
  fichaSeguranca?: string
  linkCompra?: string
  observacoes?: string
}

/** Ideia de esmaltação: uma imagem de superfície que dá vontade de testar, com o que se sabe dela. */
export interface IdeiaEsmalte extends Base {
  titulo: string
  imagens: string[]          // ids de Arquivo
  imagemExterna?: string     // imagem na fonte, quando não deu para baixar
  efeitos: string[]          // escorrido, crawl, cristais…
  familias: string[]         // ids de família de esmalte
  esmaltes?: string          // esmaltes e camadas, em texto livre
  queima?: string            // temperatura, cone, atmosfera
  argila?: string
  autor?: string
  fonte?: string
  url?: string
  notas?: string
  origem?: string            // 'descobrir:<id>' ou 'referencia:<id>' (evita duplicar)
  tags: string[]
}

export interface Referencia extends Base {
  titulo: string
  tipo: string
  imagens: string[]
  autor?: string
  fonte?: string
  url?: string
  descricao?: string
  comentarios?: string
  tags: string[]
  grupos: string[]
  paleta?: string[]
  origem?: string            // caminho do arquivo importado de uma pasta (evita importar duas vezes)
  imagemExterna?: string     // imagem hospedada na fonte (quando não foi possível baixar)
  licenca?: string
}

export interface Grupo extends Base {
  nome: string; descricao?: string; cor?: string
  /** Pasta ou perfil público do Pinterest acompanhado por RSS (link da página). */
  rss?: string
}

export interface ItemPainel {
  id: string
  tipo: 'referencia' | 'texto' | 'cor' | 'imagem'
  refId?: string
  arquivoId?: string
  texto?: string
  cor?: string
  x: number; y: number; w: number; h: number; z: number
}
export interface Painel extends Base { nome: string; descricao?: string; itens: ItemPainel[] }

export interface Conteudo extends Base {
  titulo: string
  categoria: string
  formato: 'texto' | 'link' | 'arquivo' | 'livro' | 'video' | 'artigo'
  corpo?: string
  url?: string
  arquivos: string[]
  autor?: string
  tags: string[]
}

export interface Nota extends Base {
  titulo?: string
  corpo: string              // HTML formatado
  imagens: string[]
  arquivos: string[]
  audios: string[]
  paleta?: string[]
  links?: string[]
  tema?: string
  tags: string[]
}

/** Relações livres entre quaisquer conteúdos (rede de conhecimento). */
export interface Relacao {
  id: string
  aTipo: Tipo; aId: string
  bTipo: Tipo; bId: string
  criadoEm: number
  atualizadoEm?: number
  excluido?: 0 | 1
}

export interface SegmentoCurva { taxa: number; alvo: number; patamar: number }   // °C/h (negativa = resfriamento), °C, min
export interface Curva extends Base {
  nome: string
  codigo: string
  tempInicial: number
  segmentos: SegmentoCurva[]
  cone?: string
  atmosfera?: string
  resfriamentoNatural?: 0 | 1
  status?: string
  fonte?: string
  observacoes?: string
}

export interface Queima extends Base {
  nome: string
  codigo: string
  data: string
  tipo?: string
  forno?: string
  curvaId?: string
  tempMax?: number
  cone?: string
  duracaoMin?: number
  consumoKwh?: number
  consumoMedido?: 0 | 1       // 1 = medido; 0 = estimado
  real?: { min: number; temp: number }[]   // leituras reais (tempo desde o início, °C)
  fotos: string[]
  testes: string[]
  pecas?: string
  resultados?: string
  observacoes?: string
}

export interface Comercial extends Base {
  fabricante: string
  nome: string
  codigo?: string
  serie?: string
  familias: string[]
  cone?: string
  temperatura?: string
  fotos: string[]
  instrucoes?: string
  declarados: string[]        // declarado pelo fabricante (rótulo)
  documentacao?: string       // obtido em documentação técnica (preliminar)
  hipoteses: string[]         // hipóteses de composição (não confirmadas)
  confirmado?: string         // resultado confirmado por teste
  curvaId?: string
  fontes: string[]
  observacoes?: string
}

export interface Lote extends Base {
  receitaId: string
  versao: number
  codigo: string
  data: string
  pesoBase: number
  itens: { nome: string; materialId?: string; classe: ClasseIngrediente; previsto: number; real?: number }[]
  aguaPrevista?: number
  aguaReal?: number
  conservante?: string
  dosagem?: string
  abertura?: string
  inspecao?: string
  estado?: string
  pesoRestante?: number
  validade?: string
  baixaEstoque?: 0 | 1
  observacoes?: string
}

export interface Fornecedor extends Base { nome: string; url?: string; ultimaConsulta?: string; produtos?: { nome: string; url: string }[]; observacoes?: string }

export interface Compra extends Base {
  nome: string
  categoria: string
  materialId?: string
  quantidade: string
  qtdKg?: number
  valorEstimado?: number
  status: 'planejada' | 'comprada'
  fornecedorId?: string
  link?: string
  dataConsulta?: string
}

/** Grau de certeza de uma informação: documentada em fonte, leitura visual ou hipótese técnica. */
export type Certeza = 'verificado' | 'interpretacao' | 'hipotese'
export interface Fonte { titulo: string; url?: string; tipo?: string; ano?: string }
export interface Processo { tema: string; texto: string; certeza: Certeza; fonte?: string }
export interface Analise { formas?: string; paleta?: string; texturas?: string; composicao?: string; materiais?: string; superficieVolume?: string; reconhecivel?: string }
export interface SerieArtista { nome: string; original?: string; url?: string; desc?: string }

/** Artista da Biblioteca. Campos desconhecidos ficam vazios ("Não documentado"); nada é inventado. */
/** Fala do próprio artista: texto traduzido para pt-BR, original e fonte. */
export interface FalaArtista { texto: string; original?: string; fonte?: string; veiculo?: string }

export interface Artista extends Base {
  nome: string
  nomeOriginal?: string
  pais: string[]               // país(es) de origem / atuação, como "Japão", "Reino Unido"
  atuacao?: string             // local de atuação confirmado
  nascimento?: string          // ex.: "1981, Hiroshima" (só se documentado)
  retrato?: string             // URL da fotografia do artista (fonte oficial)
  capa?: string                // id da obra de destaque
  especialidade?: string
  linguagem?: string           // breve descrição da linguagem artística
  bio?: string                 // biografia (texto simples, parágrafos separados por linha em branco)
  caracteristicas: string[]
  afinidade?: string           // em que se aproxima de Iwasaki (observação curatorial)
  analise?: Analise
  processos: Processo[]
  estudar: string[]            // "O que estudar neste artista?"
  series?: SerieArtista[]      // famílias de acabamento / séries com nome oficial
  falas?: FalaArtista[]        // citações do artista, traduzidas, com o original e a fonte
  publicacoes: Fonte[]         // livros, catálogos, entrevistas, reportagens, vídeos, exposições
  fontes: Fonte[]              // sites oficiais, galerias, páginas consultadas
  instagram?: string
  site?: string
  relacionados: string[]       // ids de artistas
  tags: string[]
  tecnicas: string[]
  materiais: string[]
  esmaltes: string[]
  queimas: string[]
  esteticas: string[]
  tiposObra: string[]
  origem: 'curadoria' | 'usuario' | 'ia'
  revisadoEm?: string          // data da última conferência das fontes
  // ——— pesquisa pessoal (separada do que é documentado) ———
  notas?: string               // HTML
  hipoteses?: string           // hipóteses de processo do Marcelo
  links?: string[]
  fotos?: string[]             // ids de Arquivo
}

export interface Obra extends Base {
  artistaId: string
  titulo?: string
  ano?: string
  dimensoes?: string
  materiais?: string
  tecnica?: string
  esmaltacao?: string
  queima?: string
  serie?: string
  imagem?: string              // URL da imagem na fonte original
  arquivo?: string             // id de Arquivo (foto guardada no aparelho)
  fonte?: string               // página onde a imagem foi publicada
  credito?: string
  tags: string[]
  notas?: string
}

export interface Colecao extends Base { nome: string; descricao?: string; itens: { tipo: Tipo; id: string }[] }

/** Exposição na agenda (só cidade de São Paulo). Datas em AAAA-MM-DD; `fimAprox` quando a fonte não dá o dia exato. */
export interface Exposicao extends Base {
  titulo: string
  local: string
  endereco?: string
  inicio?: string
  fim?: string
  fimAprox?: string
  artistas?: string
  curadoria?: string
  descricao?: string
  url?: string
  fonte?: string
  gratuita?: boolean
  visitada?: boolean
  notas?: string
  origem: 'curadoria' | 'usuario'
  conferidoEm?: string
  /** Foto da exposição: endereço da imagem de destaque do site, ou foto enviada (id em arquivos). */
  imagem?: string
  arquivo?: string
  /** Já tentou ler a imagem do link da exposição (não repete). */
  imagemLida?: boolean
}

/* ——— Minhas obras: o trabalho autoral do ateliê ——— */

/** Etapas de uma peça, na ordem do ateliê. */
export const ETAPAS = [
  { id: 'ideia', nome: 'Ideia' },
  { id: 'modelagem', nome: 'Modelagem' },
  { id: 'secagem', nome: 'Secagem' },
  { id: 'biscoito', nome: 'Biscoito' },
  { id: 'esmaltacao', nome: 'Esmaltação' },
  { id: 'queima', nome: 'Queima final' },
  { id: 'pronta', nome: 'Pronta' },
] as const
export type Etapa = (typeof ETAPAS)[number]['id']

/** Registro datado do processo (o que mudou, o que observei), com fotos opcionais. */
export interface Observacao { id: string; data: number; texto: string; fotos?: string[] }

/** Série / corpo de trabalho. Guardada na tabela `projetos` (já existente no Supabase). */
export interface Serie extends Base {
  nome: string
  intencao?: string            // o que a série investiga
  descricao?: string
  ano?: string
  status: 'ativa' | 'pausada' | 'concluida'
  capa?: string                // id de Arquivo
  observacoes: Observacao[]
  tags: string[]
}

/** Peça do Marcelo: obra ou estudo. Guardada na tabela `entrada` (já existente no Supabase). */
export interface Peca extends Base {
  titulo: string
  tipo: 'obra' | 'estudo'
  serieId?: string
  etapa: Etapa
  fotos: string[]              // ids de Arquivo
  ano?: string
  dimensoes?: string
  argila?: string
  tecnica?: string
  superficie?: string          // esmaltes, engobes, óxidos usados
  queima?: string
  descricao?: string
  destino?: string             // exposição, venda, acervo pessoal…
  observacoes: Observacao[]
  tags: string[]
}

export interface Ajuste { chave: string; valor: unknown }

export class AtelieDB extends Dexie {
  arquivos!: EntityTable<Arquivo, 'id'>
  familias!: EntityTable<Familia, 'id'>
  esmaltes!: EntityTable<Esmalte, 'id'>
  receitas!: EntityTable<Receita, 'id'>
  versoes!: EntityTable<VersaoReceita, 'id'>
  testes!: EntityTable<Teste, 'id'>
  materiais!: EntityTable<Material, 'id'>
  referencias!: EntityTable<Referencia, 'id'>
  grupos!: EntityTable<Grupo, 'id'>
  paineis!: EntityTable<Painel, 'id'>
  conteudos!: EntityTable<Conteudo, 'id'>
  notas!: EntityTable<Nota, 'id'>
  relacoes!: EntityTable<Relacao, 'id'>
  ajustes!: EntityTable<Ajuste, 'chave'>
  curvas!: EntityTable<Curva, 'id'>
  queimas!: EntityTable<Queima, 'id'>
  comerciais!: EntityTable<Comercial, 'id'>
  lotes!: EntityTable<Lote, 'id'>
  fornecedores!: EntityTable<Fornecedor, 'id'>
  compras!: EntityTable<Compra, 'id'>
  artistas!: EntityTable<Artista, 'id'>
  obras!: EntityTable<Obra, 'id'>
  colecoes!: EntityTable<Colecao, 'id'>
  exposicoes!: EntityTable<Exposicao, 'id'>
  projetos!: EntityTable<Serie, 'id'>
  entrada!: EntityTable<Peca, 'id'>
  ideias!: EntityTable<IdeiaEsmalte, 'id'>

  constructor() {
    super('atelie-mp')
    this.version(1).stores({
      arquivos: 'id, donoTipo, donoId, atualizadoEm',
      familias: 'id, nome, ordem',
      esmaltes: 'id, nome, codigo, *familias, *tags, temperatura, cone, acabamento, favorito, atualizadoEm, criadoEm',
      receitas: 'id, nome, esmalteId, origemId, ehBase, atualizadoEm',
      versoes: 'id, receitaId, [receitaId+versao]',
      testes: 'id, codigo, esmalteId, receitaId, data, atualizadoEm, criadoEm',
      materiais: 'id, nome, categoria, favorito, atualizadoEm',
      referencias: 'id, titulo, tipo, *grupos, *tags, favorito, atualizadoEm, criadoEm',
      grupos: 'id, nome',
      paineis: 'id, nome, atualizadoEm',
      conteudos: 'id, titulo, categoria, *tags, favorito, atualizadoEm',
      notas: 'id, tema, *tags, criadoEm, atualizadoEm',
      relacoes: 'id, [aTipo+aId], [bTipo+bId]',
      ajustes: 'chave',
    })
    this.version(2).stores({
      familias: 'id, nome, ordem, codigo',
      receitas: 'id, nome, codigo, esmalteId, origemId, ehBase, *familias, atualizadoEm',
      curvas: 'id, codigo, nome, atualizadoEm',
      queimas: 'id, codigo, data, curvaId, *testes, atualizadoEm, criadoEm',
      comerciais: 'id, codigo, fabricante, *familias, atualizadoEm',
      lotes: 'id, receitaId, data, atualizadoEm, criadoEm',
      fornecedores: 'id, nome, atualizadoEm',
      compras: 'id, categoria, status, materialId, atualizadoEm',
    })
    this.version(3).stores({
      artistas: 'id, nome, favorito, atualizadoEm',
      obras: 'id, artistaId, favorito, atualizadoEm',
      colecoes: 'id, nome, atualizadoEm',
      exposicoes: 'id, fim, favorito, atualizadoEm',
    })
    // Minhas obras: séries (projetos) e peças (entrada), nomes das tabelas já criadas no Supabase
    this.version(4).stores({
      projetos: 'id, nome, status, atualizadoEm',
      entrada: 'id, serieId, tipo, etapa, favorito, atualizadoEm',
    })
    // Ideias de esmaltação (Superfícies > Ideias)
    this.version(5).stores({
      ideias: 'id, origem, *familias, *efeitos, favorito, atualizadoEm, criadoEm',
      testes: 'id, codigo, esmalteId, receitaId, ideiaId, data, atualizadoEm, criadoEm',
    })
  }
}

export const db = new AtelieDB()

export const uid = () => crypto.randomUUID()
export const agora = () => Date.now()
export function novo<T extends object>(dados: T): T & Base {
  const t = agora()
  return { id: uid(), criadoEm: t, atualizadoEm: t, excluido: 0, favorito: 0, ...dados }
}
