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
  ['fluidez', 'Fluidez'], ['reatividade', 'Reatividade'], ['espessura', 'Sensível à espessura'],
  ['temperatura', 'Sensível à temperatura'], ['variacao', 'Variação cromática'], ['previsibilidade', 'Previsibilidade'],
  ['patamar', 'Sensível ao patamar'], ['resfriamento', 'Sensível ao resfriamento'], ['cristais', 'Formação de cristais'],
  ['acumulo', 'Acúmulo em depressões'], ['arestas', 'Afinamento nas arestas'], ['texturas', 'Evidencia texturas'],
]

export const GEOMETRIAS: [string, string][] = [
  ['arestas', 'Arestas'], ['relevos', 'Relevos'], ['depressoes', 'Depressões'], ['verticais', 'Superfícies verticais'],
  ['horizontais', 'Superfícies horizontais'], ['finas', 'Camadas finas'], ['espessas', 'Camadas espessas'],
]
export const COMPORTAMENTOS_SUPERFICIE = ['Mantém a cobertura', 'Revela a massa cerâmica', 'Afina', 'Acumula', 'Realça relevos', 'Suaviza relevos', 'Encobre detalhes', 'Produz contraste cromático', 'Escorre', 'Permanece estável'] as const

export const EXPRESSIVO = ['Esculturas', 'Superfícies texturizadas', 'Grafismos', 'Sobreposições', 'Transições cromáticas', 'Escorrimentos', 'Efeitos orgânicos', 'Contrastes', 'Revelação da massa cerâmica', 'Acabamentos uniformes'] as const

export const PREPARACAO: [string, string][] = [
  ['apresentacao', 'Apresentação'], ['diluicao', 'Diluição'], ['agua', 'Água'], ['densidade', 'Densidade'],
  ['homogeneizacao', 'Homogeneização'], ['conservacao', 'Conservação'], ['cuidados', 'Cuidados'],
]
export const APLICACAO: [string, string][] = [
  ['demaos', 'Demãos'], ['espessura', 'Espessura'], ['intervalo', 'Intervalo'], ['biscoito', 'Biscoito'],
  ['cuidados', 'Cuidados'], ['restricoes', 'Restrições'],
]
export const METODOS = ['Pincel', 'Imersão', 'Pulverização', 'Derramamento', 'Esponja', 'Carimbo', 'Sobreposição', 'Aplicação localizada'] as const
/**
 * Queima: a temperatura de referência é a do esmalte (campo `temperatura`); aqui ficam a faixa que o fabricante recomenda
 * e o que está documentado em outras temperaturas. O limite de uma faixa comercial não é "temperatura máxima" do esmalte.
 * Patamar, aquecimento e resfriamento guardam valores (ex.: 15 min, 150 °C/h); comentários vão em Observações.
 */
export const QUEIMA: [string, string][] = [
  ['faixa', 'Faixa do fabricante'], ['conesAlternativos', 'Cones'], ['curva', 'Curva'], ['aquecimento', 'Aquecimento'], ['patamar', 'Patamar'],
  ['resfriamento', 'Resfriamento'], ['resfriamentoControlado', 'Resfriamento controlado'], ['eletrico', 'Forno elétrico'], ['gas', 'Forno a gás'],
  ['alternativas', 'Outras temperaturas'], ['notas', 'Observações'],
]
/** Campos antigos: só aparecem quando já têm valor. */
export const QUEIMA_ANTIGA: [string, string][] = [['tMin', 'Mínima informada'], ['tIdeal', 'Indicada'], ['tMax', 'Limite informado']]
export const MASSAS: [string, string][] = [
  ['terracota', 'Terracota'], ['faianca', 'Faiança'], ['gres', 'Grés'], ['porcelana', 'Porcelana'], ['claras', 'Massas claras'],
  ['escuras', 'Massas escuras'], ['chamote', 'Com chamote'], ['ferro', 'Alto teor de ferro'], ['engobes', 'Engobes'], ['esmaltes', 'Outros esmaltes'],
]
export const COMPAT = { documentada: 'Documentada', experimental: 'Experimental', incompativel: 'Incompatível' } as const

/**
 * Segurança, item por item, na nomenclatura do fabricante (Food Safe e Dinnerware Safe não são a mesma coisa).
 * Os essenciais aparecem como "não verificado" quando vazios. `alimentarDeclarada` é o campo antigo de Food Safe.
 */
export const SEGURANCA: [string, string, boolean][] = [
  ['atoxico', 'Atóxico', true], ['semChumbo', 'Sem chumbo declarado', true], ['foodSafe', 'Food Safe', true], ['dinnerwareSafe', 'Dinnerware Safe', true],
  ['contatoAlimento', 'Contato direto com alimentos', true], ['ensaio', 'Ensaio laboratorial', true], ['combinacoes', 'Em combinações e sobreposições', true],
  ['loucaFuncional', 'Uso funcional em louça', false], ['quimica', 'Resistência química', false], ['acidos', 'Resistência a ácidos', false],
  ['abrasao', 'Resistência à abrasão', false], ['lavaLoucas', 'Lava-louças', false], ['microondas', 'Micro-ondas', false], ['decorativo', 'Só decorativo', false],
]

/** Comportamentos com pictograma. Só aparecem quando identificados (registrados ou deduzidos de campos preenchidos). */
export const PICTOGRAMAS: [string, string][] = [
  ['escorrimento', 'Escorrimento'], ['verticalEstavel', 'Estável na vertical'], ['acumulo', 'Acumula em depressões'], ['afinaArestas', 'Afina nas arestas'],
  ['realcaRelevo', 'Realça relevos'], ['cobreRelevo', 'Cobre relevos'], ['sobreposicao', 'Sobreposição'], ['transparencia', 'Transparência'],
  ['craquele', 'Craquelamento'], ['cristalizacao', 'Cristalização'], ['reticulacao', 'Reticulação'], ['revelaMassa', 'Revela a massa'],
]
/** Efeitos identificados: os marcados na ficha + os que decorrem do que já está preenchido. */
export function efeitosDe(e: Esmalte): string[] {
  const s = new Set(e.perfil?.efeitos ?? [])
  const sup = e.perfil?.superficie ?? {}
  const tem = (geo: string | null, c: string) => (geo ? sup[geo] : Object.values(sup).flat())?.includes(c)
  if (tem(null, 'Escorre')) s.add('escorrimento')
  if (tem('verticais', 'Permanece estável') || tem('verticais', 'Mantém a cobertura')) s.add('verticalEstavel')
  if (tem(null, 'Acumula')) s.add('acumulo')
  if (tem('arestas', 'Afina')) s.add('afinaArestas')
  if (tem(null, 'Realça relevos')) s.add('realcaRelevo')
  if (tem(null, 'Encobre detalhes') || tem(null, 'Suaviza relevos')) s.add('cobreRelevo')
  if (tem(null, 'Revela a massa cerâmica')) s.add('revelaMassa')
  if (e.transparencia === 'Transparente' || e.transparencia === 'Translúcido') s.add('transparencia')
  const tx = texturasDe(e)
  if (tx.includes('Craquelada')) s.add('craquele')
  if (tx.includes('Cristalizada') || tx.includes('Microcristalina')) s.add('cristalizacao')
  if (tx.includes('Reticulada')) s.add('reticulacao')
  return PICTOGRAMAS.map(([k]) => k).filter((k) => s.has(k))
}
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
