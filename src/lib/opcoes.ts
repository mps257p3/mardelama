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

/** Tabela de cones pirométricos Orton (cones grandes, 60 °C/h no final). */
export const CONES: { cone: string; c: number }[] = [
  { cone: '022', c: 586 }, { cone: '021', c: 600 }, { cone: '020', c: 626 }, { cone: '019', c: 678 }, { cone: '018', c: 715 },
  { cone: '017', c: 738 }, { cone: '016', c: 772 }, { cone: '015', c: 791 }, { cone: '014', c: 807 }, { cone: '013', c: 837 },
  { cone: '012', c: 861 }, { cone: '011', c: 875 }, { cone: '010', c: 903 }, { cone: '09', c: 920 }, { cone: '08', c: 942 },
  { cone: '07', c: 976 }, { cone: '06', c: 998 }, { cone: '05½', c: 1015 }, { cone: '05', c: 1031 }, { cone: '04', c: 1063 },
  { cone: '03', c: 1086 }, { cone: '02', c: 1101 }, { cone: '01', c: 1117 }, { cone: '1', c: 1136 }, { cone: '2', c: 1142 },
  { cone: '3', c: 1152 }, { cone: '4', c: 1168 }, { cone: '5', c: 1186 }, { cone: '5½', c: 1196 }, { cone: '6', c: 1222 },
  { cone: '7', c: 1240 }, { cone: '8', c: 1263 }, { cone: '9', c: 1280 }, { cone: '10', c: 1305 }, { cone: '11', c: 1315 },
  { cone: '12', c: 1326 }, { cone: '13', c: 1346 }, { cone: '14', c: 1366 },
]
export const coneMaisProximo = (t?: number) =>
  t == null ? undefined : CONES.reduce((a, b) => (Math.abs(b.c - t) < Math.abs(a.c - t) ? b : a)).cone
export const tempDoCone = (cone?: string) => CONES.find((c) => c.cone === cone)?.c

export const fmt = (n: number | undefined, d = 1) =>
  n == null || !Number.isFinite(n) ? '–' : n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: d })
export const brl = (n?: number) => n == null || !Number.isFinite(n) ? '–' : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
