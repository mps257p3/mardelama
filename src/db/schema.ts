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

export interface Arquivo extends Base {
  nome: string
  mime: string
  tamanho: number
  blob: Blob
  donoTipo?: Tipo
  donoId?: string
}

export interface Familia extends Base { nome: string; descricao?: string; ordem: number }

export interface Esmalte extends Base {
  nome: string
  codigo: string
  fotos: string[]            // ids de Arquivo
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
  esmalteId?: string
  origemId?: string          // receita original da qual derivou
  ehBase?: 0 | 1             // base reutilizável
  versaoAtual: number
  ingredientes: Ingrediente[]
  aguaMlPor100g?: number
  liquidos?: { nome: string; quantidade: number; unidade: string }[]
  observacoes?: string
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
}

export interface Material extends Base {
  nome: string
  categoria: string
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
}

export interface Grupo extends Base { nome: string; descricao?: string; cor?: string }

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
  }
}

export const db = new AtelieDB()

export const uid = () => crypto.randomUUID()
export const agora = () => Date.now()
export function novo<T extends object>(dados: T): T & Base {
  const t = agora()
  return { id: uid(), criadoEm: t, atualizadoEm: t, excluido: 0, favorito: 0, ...dados }
}
