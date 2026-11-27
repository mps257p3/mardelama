export const ACABAMENTOS = ['Brilhante', 'Acetinado', 'Semifosco', 'Fosco', 'Seco', 'Metálico'] as const
export const TEXTURAS = ['Lisa', 'Craquelada', 'Vulcânica', 'Retraída', 'Granulada', 'Cristalina', 'Escorrida'] as const
export const TRANSPARENCIAS = ['Transparente', 'Translúcido', 'Semiopaco', 'Opaco'] as const
export const ATMOSFERAS = ['Oxidação', 'Redução', 'Neutra', 'Lenha', 'Raku', 'Sal/soda'] as const
export const FLUIDEZ = ['Estável', 'Pouco fluido', 'Fluido', 'Muito fluido'] as const
export const APLICACOES = ['Pincel', 'Imersão', 'Derramamento', 'Pulverização', 'Sobreposição', 'Aplicação localizada', 'Aplicação espessa', 'Aplicação em camadas', 'Combinação com engobes', 'Esponja'] as const
export const STATUS = ['Ideia', 'Em teste', 'Em ajuste', 'Aprovado', 'Descartado'] as const
export const CORES = ['Branco', 'Preto', 'Azul', 'Verde', 'Turquesa', 'Amarelo', 'Laranja', 'Vermelho', 'Rosa', 'Roxo', 'Marrom', 'Bege', 'Cinza', 'Multicolor'] as const
export const CATEGORIAS_MATERIAIS = ['Argilas', 'Fritas', 'Feldspatos', 'Sílica', 'Fundentes', 'Óxidos', 'Carbonatos', 'Pigmentos', 'Opacificantes', 'Modificadores', 'Engobes', 'Aditivos', 'Conservantes', 'Massas cerâmicas', 'Esmaltes comerciais', 'Outros'] as const
export const ARGILAS = ['Grês', 'Porcelana', 'Faiança', 'Terracota', 'Raku', 'Grês escuro'] as const
export const DEFEITOS = ['Escorrimento', 'Retração indesejada', 'Bolhas', 'Furos (pinholes)', 'Crateras', 'Gretado', 'Descascamento', 'Subqueima', 'Sobrequeima', 'Cor inesperada', 'Matificação', 'Devitrificação'] as const

/** A tabela de cones é única para o app inteiro: ver lib/cones. */
export { CONES, coneMaisProximo, tempDoCone } from './cones'

export const fmt = (n: number | undefined, d = 1) =>
  n == null || !Number.isFinite(n) ? '–' : n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: d })
export const brl = (n?: number) => n == null || !Number.isFinite(n) ? '–' : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
