import type { Esmalte, Nivel, OrigemDado } from '../db/schema'

/**
 * Vocabulário da ficha editorial do esmalte (Esmaltaria, redesenho de 26/11).
 * As listas definem o que existe para editar; a consulta só mostra o que foi preenchido.
 */

export const ACABAMENTOS_FICHA = ['Superfosco', 'Fosco', 'Acetinado', 'Semibrilhante', 'Brilhante', 'Alto brilho', 'Metálico'] as const
export const OPACIDADES = ['Transparente', 'Translúcido', 'Semiopaco', 'Opaco'] as const
export const TEXTURAS_FICHA = ['Lisa', 'Rugosa', 'Granulada', 'Cristalizada', 'Microcristalina', 'Craquelada', 'Reticulada', 'Enrugada', 'Espumada', 'Pontilhada', 'Iridescente', 'Metálica'] as const
/** Textura pode ter várias classificações; fica no campo `textura`, separadas por vírgula. */
export const texturasDe = (e: Pick<Esmalte, 'textura'>) => (e.textura ?? '').split(/\s*,\s*/).filter(Boolean)

export const VISUAL: [string, string][] = [
  ['coresSecundarias', 'Cores secundárias'], ['subtons', 'Subtons'], ['variacao', 'Variação cromática'],
  ['corFina', 'Em camada fina'], ['corEspessa', 'Em camada espessa'], ['corAcumulo', 'Nas áreas de acúmulo'],
]

export const NIVEIS: Record<Nivel, string> = { 1: 'Muito baixo', 2: 'Baixo', 3: 'Moderado', 4: 'Alto', 5: 'Muito alto' }
/** Na ordem de relevância: os primeiros aparecem antes de "ver perfil completo". */
export const ATRIBUTOS_COMPORTAMENTO: [string, string][] = [
  ['fluidez', 'Fluidez durante a queima'], ['reatividade', 'Reatividade com outros esmaltes'], ['variacao', 'Variação cromática'],
  ['espessura', 'Sensibilidade à espessura'], ['temperatura', 'Sensibilidade à temperatura'], ['patamar', 'Sensibilidade ao tempo de patamar'],
  ['resfriamento', 'Sensibilidade à velocidade de resfriamento'], ['cristais', 'Tendência à formação de cristais'],
  ['acumulo', 'Tendência ao acúmulo em depressões'], ['arestas', 'Tendência ao afinamento nas arestas'],
  ['texturas', 'Capacidade de evidenciar texturas'], ['previsibilidade', 'Previsibilidade do resultado'],
]

export const GEOMETRIAS: [string, string][] = [
  ['arestas', 'Arestas'], ['relevos', 'Relevos'], ['depressoes', 'Depressões'], ['verticais', 'Superfícies verticais'],
  ['horizontais', 'Superfícies horizontais'], ['finas', 'Camadas finas'], ['espessas', 'Camadas espessas'],
]
export const COMPORTAMENTOS_SUPERFICIE = ['Mantém a cobertura', 'Revela a massa cerâmica', 'Afina', 'Acumula', 'Realça relevos', 'Suaviza relevos', 'Encobre detalhes', 'Produz contraste cromático', 'Escorre', 'Permanece estável'] as const

export const EXPRESSIVO = ['Esculturas', 'Superfícies texturizadas', 'Grafismos', 'Sobreposições', 'Transições cromáticas', 'Escorrimentos', 'Efeitos orgânicos', 'Contrastes', 'Revelação da massa cerâmica', 'Acabamentos uniformes'] as const

export const PREPARACAO: [string, string][] = [
  ['apresentacao', 'Forma de apresentação'], ['diluicao', 'Diluição'], ['agua', 'Proporção de água'], ['densidade', 'Densidade da suspensão'],
  ['homogeneizacao', 'Homogeneização'], ['conservacao', 'Conservação'], ['cuidados', 'Cuidados de preparação'],
]
export const APLICACAO: [string, string][] = [
  ['demaos', 'Número de demãos'], ['espessura', 'Espessura'], ['intervalo', 'Intervalo entre demãos'], ['biscoito', 'Temperatura de biscoito'],
  ['cuidados', 'Cuidados'], ['restricoes', 'Restrições'],
]
export const METODOS = ['Pincel', 'Imersão', 'Pulverização', 'Derramamento', 'Esponja', 'Carimbo', 'Sobreposição', 'Aplicação localizada'] as const
export const QUEIMA: [string, string][] = [
  ['tMin', 'Temperatura mínima'], ['tIdeal', 'Temperatura ideal'], ['tMax', 'Temperatura máxima'], ['conesAlternativos', 'Cones alternativos'],
  ['aquecimento', 'Velocidade de aquecimento'], ['patamar', 'Tempo de patamar'], ['resfriamento', 'Velocidade de resfriamento'],
  ['resfriamentoControlado', 'Resfriamento controlado'], ['eletrico', 'Forno elétrico'], ['gas', 'Forno a gás'], ['alternativas', 'Em outras temperaturas'],
]
export const MASSAS: [string, string][] = [
  ['terracota', 'Terracota'], ['faianca', 'Faiança'], ['gres', 'Grés'], ['porcelana', 'Porcelana'], ['claras', 'Massas claras'],
  ['escuras', 'Massas escuras'], ['chamote', 'Com chamote'], ['ferro', 'Alto teor de ferro'], ['engobes', 'Engobes'], ['esmaltes', 'Outros esmaltes'],
]
export const COMPAT = { documentada: 'Documentada', experimental: 'Experimental', incompativel: 'Incompatível' } as const

/** Segurança: os três primeiros são essenciais e aparecem como "não verificado" quando vazios. */
export const SEGURANCA: [string, string, boolean][] = [
  ['atoxico', 'Atóxico (sem chumbo declarado)', true], ['alimentarDeclarada', 'Segurança alimentar declarada pelo fabricante', true],
  ['ensaio', 'Segurança comprovada por ensaio laboratorial', true], ['contatoAlimento', 'Contato direto com alimentos', false],
  ['loucaFuncional', 'Adequação funcional para louças', false], ['quimica', 'Resistência química', false], ['acidos', 'Resistência a ácidos', false],
  ['abrasao', 'Resistência à abrasão', false], ['lavaLoucas', 'Lava-louças', false], ['microondas', 'Micro-ondas', false], ['decorativo', 'Uso exclusivamente decorativo', false],
]
export const VERIFICACAO = { sim: 'Sim', nao: 'Não', 'nao-verificado': 'Não verificado' } as const

export const DEFEITOS_FICHA = ['Craquelamento', 'Descascamento', 'Crawling (retração)', 'Bolhas', 'Pinholes', 'Crateras', 'Escorrimento excessivo', 'Cobertura irregular', 'Desvitrificação indesejada', 'Alteração inesperada de cor'] as const

export const ORIGENS: Record<OrigemDado, string> = {
  fabricante: 'Fabricante', referencia: 'Referência técnica', receita: 'Receita original', experimento: 'Experimento próprio', pessoal: 'Observação pessoal', ia: 'Interpretação da IA',
}

/** Código comercial e linha que ficam nas observações ("Código do produto: PC-602 (Mayco, linha Pottery Cascade)"). */
export function dadosComerciais(e: Esmalte) {
  const obs = e.observacoes ?? ''
  const codigo = obs.match(/C[óo]digo do produto:\s*([A-Z0-9][\w-]*)/i)?.[1]
  const linha = obs.match(/^Linha:\s*(.+)$/m)?.[1] ?? obs.match(/linha\s+([^).,\n]+)/i)?.[1]?.trim()
  return { codigo, linha }
}

/** Fluidez para o resumo: o termo do fabricante quando existe; senão a sua avaliação, dita como sua. */
export function fluidezResumo(e: Esmalte): { valor: string; nota?: string } | undefined {
  const r = e.fluidezQueima?.situacao === 'oficial' ? e.fluidezQueima.resultados.find((x) => x.classificacao) : undefined
  if (r) return { valor: r.classificacao!, nota: [r.traducao, r.cone && 'cone ' + r.cone.replace(/^cone\s*/i, '')].filter(Boolean).join(' · ') }
  const n = e.perfil?.comportamento?.fluidez
  if (n) return { valor: NIVEIS[n] }
  if (e.fluidez) return { valor: e.fluidez, nota: 'sua avaliação' }
  return undefined
}

const ESCORRE = /runn|fluid|flow|mov|escorr/i
/** Alertas só quando há motivo concreto na ficha; nada genérico. */
export function alertasDe(e: Esmalte): string[] {
  const a: string[] = [...(e.tecnica?.alertas ?? [])]
  const fab = e.fluidezQueima?.situacao === 'oficial' && e.fluidezQueima.resultados.some((r) => ESCORRE.test(r.classificacao ?? ''))
  const nivel = (e.perfil?.comportamento?.fluidez ?? 0) >= 4
  const sua = e.fluidez === 'Fluido' || e.fluidez === 'Muito fluido'
  if ((fab || nivel || sua) && !a.some((x) => /escorr/i.test(x))) a.unshift('Risco de escorrimento: deixe folga no pé e use placa por baixo.')
  if (e.louca === 'nao' && !a.some((x) => /alimento|louça/i.test(x))) a.push('Não usar em peças para alimentos.')
  if (e.tecnica?.compatibilidade && Object.entries(e.tecnica.compatibilidade).some(([, v]) => v === 'incompativel')) {
    const nomes = Object.entries(e.tecnica.compatibilidade).filter(([, v]) => v === 'incompativel').map(([k]) => MASSAS.find(([m]) => m === k)?.[1] ?? k)
    a.push('Incompatível com: ' + nomes.join(', ') + '.')
  }
  return a
}

/** Primeiro parágrafo útil das observações, para a descrição curta quando não há uma escrita. */
export const temTexto = (r?: Record<string, string>) => !!r && Object.values(r).some((v) => v?.trim())
