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
  ['corTemperatura', 'Por temperatura'], ['corAtmosfera', 'Por atmosfera'], ['corMassa', 'Influência da massa cerâmica'], ['corSobreposicao', 'Em sobreposições'],
]

export const NIVEIS: Record<Nivel, string> = { 1: 'Muito baixo', 2: 'Baixo', 3: 'Moderado', 4: 'Alto', 5: 'Muito alto' }
/** Na ordem de relevância: os primeiros aparecem antes de "ver perfil completo". */
export const ATRIBUTOS_COMPORTAMENTO: [string, string][] = [
  ['fluidez', 'Fluidez'], ['reatividade', 'Reatividade'], ['espessura', 'Influência da espessura'],
  ['temperatura', 'Influência da temperatura'], ['variacao', 'Variação cromática'], ['previsibilidade', 'Previsibilidade'],
  ['patamar', 'Influência do patamar'], ['resfriamento', 'Influência do resfriamento'], ['cristais', 'Formação de cristais'],
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
  ['faixa', 'Faixa do fabricante'], ['faixaRevenda', 'Faixa do revendedor'], ['conesAlternativos', 'Cones'], ['curva', 'Curva'], ['aquecimento', 'Aquecimento'], ['patamar', 'Patamar'],
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
  ['atoxico', 'Atóxico (Non-Toxic)', true], ['semChumbo', 'Sem chumbo declarado', true], ['foodSafe', 'Food Safe', true], ['dinnerwareSafe', 'Dinnerware Safe', true],
  ['contatoAlimento', 'Contato direto com alimentos', true], ['ensaio', 'Ensaio laboratorial', true], ['combinacoes', 'Em combinações e sobreposições', true],
  ['loucaFuncional', 'Uso funcional em louça', false], ['quimica', 'Resistência química', false], ['acidos', 'Resistência a ácidos', false],
  ['abrasao', 'Resistência à abrasão', false], ['lavaLoucas', 'Lava-louças', false], ['microondas', 'Micro-ondas', false], ['decorativo', 'Só decorativo', false],
]

/** Comportamentos com pictograma. Só aparecem quando identificados (registrados ou deduzidos de campos preenchidos). */
export const PICTOGRAMAS: [string, string][] = [
  ['escorrimento', 'Escorrimento'], ['sobreposicao', 'Sobreposição'], ['reatividade', 'Reatividade entre esmaltes'], ['acumulo', 'Acúmulo em cavidades'],
  ['quebraBordas', 'Quebra de cor nas bordas'], ['cristalizacao', 'Cristalização'], ['craquele', 'Craquelado'], ['crawling', 'Retração (crawling)'],
  ['flutuacao', 'Flutuação de cor'], ['separacaoFases', 'Separação de fases'], ['variacaoEspessura', 'Variação por espessura'], ['textura', 'Textura'],
  ['opacidade', 'Opacidade'], ['transparencia', 'Transparência'], ['metalico', 'Efeito metálico'], ['iridescencia', 'Iridescência'],
]
/** Chaves antigas de efeitos, levadas para o fenômeno correspondente da biblioteca atual. */
const EFEITO_ANTIGO: Record<string, string> = { afinaArestas: 'quebraBordas', revelaMassa: 'quebraBordas', realcaRelevo: 'acumulo', reticulacao: 'textura', cobreRelevo: 'opacidade' }
/** Efeitos identificados: os marcados na ficha + os que decorrem do que já está preenchido. Nada é presumido. */
export function efeitosDe(e: Esmalte): string[] {
  const s = new Set((e.perfil?.efeitos ?? []).map((k) => EFEITO_ANTIGO[k] ?? k))
  const sup = e.perfil?.superficie ?? {}
  const tem = (geo: string | null, c: string) => (geo ? sup[geo] : Object.values(sup).flat())?.includes(c)
  if (tem(null, 'Escorre')) s.add('escorrimento')
  if (tem(null, 'Acumula') || tem(null, 'Realça relevos')) s.add('acumulo')
  if (tem('arestas', 'Afina') || tem(null, 'Revela a massa cerâmica')) s.add('quebraBordas')
  if (e.transparencia === 'Transparente' || e.transparencia === 'Translúcido') s.add('transparencia')
  if (e.transparencia === 'Opaco') s.add('opacidade')
  const tx = texturasDe(e)
  if (tx.includes('Craquelada')) s.add('craquele')
  if (tx.includes('Cristalizada') || tx.includes('Microcristalina')) s.add('cristalizacao')
  if (tx.includes('Metálica') || e.acabamento === 'Metálico') s.add('metalico')
  if (tx.includes('Iridescente') || /iridesc/i.test(e.acabamento ?? '')) s.add('iridescencia')
  if (tx.some((t) => ['Rugosa', 'Granulada', 'Enrugada', 'Espumada', 'Reticulada'].includes(t))) s.add('textura')
  if (e.tecnica?.defeitos?.some((d) => d.intencional && /crawling|retra/i.test(d.tipo))) s.add('crawling')
  const p = e.perfil
  const documentado = (k: string) => !!(p?.comportamento?.[k] || p?.comportamentoNota?.[k] || p?.comportamentoClasse?.[k]) && p?.comportamentoOrigem?.[k] !== 'ia'
  if ((p?.comportamento?.reatividade ?? 0) >= 3 || (documentado('reatividade') && !p?.comportamento?.reatividade)) s.add('reatividade')
  if (p?.visual?.corFina || p?.visual?.corEspessa) s.add('variacaoEspessura')
  // flutuação só quando a documentação fala dela (ex.: "white float", "flutuação branca")
  const textos = [...Object.values(p?.visual ?? {}), ...(e.tecnica?.temperaturas ?? []).map((x) => x.descricao ?? '')]
  if (textos.some((x) => /flutua|float/i.test(x))) s.add('flutuacao')
  return PICTOGRAMAS.map(([k]) => k).filter((k) => s.has(k))
}

/** Onde mora a amostra ilustrativa de cada fenômeno (mesma biblioteca para fichas, filtros e classificação). */
export const imagemFenomeno = (k: string) => `/fenomenos/${k}.webp`

/** "Possibilidades expressivas" que só repetem um efeito já ilustrado não aparecem de novo. */
const EXPRESSIVO_EFEITO: Record<string, string> = { Escorrimentos: 'escorrimento', 'Sobreposições': 'sobreposicao', 'Revelação da massa cerâmica': 'quebraBordas' }
export const expressivoAlemDosEfeitos = (lista: string[] | undefined, efeitos: string[]) => (lista ?? []).filter((x) => !efeitos.includes(EXPRESSIVO_EFEITO[x]))

/** Amostra aproximada para nomes de cor comuns. Só para cores nomeadas na documentação; nunca tirada de fotos. */
const CORES_HEX: [RegExp, string][] = [
  [/^branc/i, '#F4F1EA'], [/^pret/i, '#24211E'], [/^azul/i, '#3D5F7A'], [/^verde/i, '#5E7A5A'], [/^turquesa/i, '#3F8C8A'], [/^amarel/i, '#D8B54A'],
  [/^laranj/i, '#D27A3E'], [/^vermelh/i, '#A63A2E'], [/^rosa/i, '#D49A9A'], [/^rox/i, '#6E4E7A'], [/^marrom/i, '#6B4A33'], [/^bege/i, '#D9C7A8'],
  [/^cinz/i, '#8C8A85'], [/^creme/i, '#EFE4CC'], [/^ocre/i, '#B8873A'], [/^celadon|^celadon/i, '#A9BFA4'], [/^ferrugem/i, '#8E4A2A'],
]
export const hexDaCor = (nome: string) => CORES_HEX.find(([r]) => r.test(nome.trim()))?.[1]

/** Faixa de temperatura de um cone: 06 é baixa, 6 é média. */
export function faixaDoCone(cone?: string): 'baixa' | 'media' | 'alta' | undefined {
  const c = (cone ?? '').trim().replace(/^cone\s*/i, '')
  if (!c) return undefined
  if (/^0\d/.test(c)) return 'baixa'
  const n = Number(c.split(/[^\d]/)[0])
  if (Number.isNaN(n)) return undefined
  return n <= 7 ? 'media' : 'alta'
}
export const FAIXAS = { baixa: 'Baixa temperatura', media: 'Média temperatura', alta: 'Alta temperatura' } as const
export const TIPOS_TEMPERATURA = {
  recomendado: 'Recomendado pelo fabricante', documentado: 'Documentado pelo fabricante', imagem: 'Imagem do fabricante, sem descrição',
  revendedor: 'Informado pelo revendedor', teste: 'Seu teste', hipotese: 'Hipótese não verificada',
} as const
/**
 * Segurança alimentar em quatro classes, a partir do que foi declarado:
 * - Seguro: o fabricante declara adequado ao contato alimentar/louça (Food Safe, Dinnerware Safe ou equivalente).
 * - Uso restrito: há restrição específica declarada (ex.: só superfícies externas, limitação de acabamento).
 * - Não seguro: o fabricante declara que não é adequado ao contato alimentar.
 * - Não informado: documentação insuficiente.
 * Cuidados gerais (aplicação, queima, integridade da superfície, combinações) não rebaixam a classe.
 * Atóxico não é segurança alimentar. Formulação própria só é "Seguro" com ensaio laboratorial aprovado.
 */
export type ClasseSeguranca = 'seguro' | 'restrito' | 'nao-seguro' | 'nao-informado'
export const ROTULO_SEGURANCA: Record<ClasseSeguranca, string> = { seguro: 'Seguro', restrito: 'Uso restrito', 'nao-seguro': 'Não seguro', 'nao-informado': 'Não informado' }
export function classeSeguranca(e: Esmalte): { classe: ClasseSeguranca; motivo: string } {
  const t = e.tecnica ?? {}
  const s = t.seguranca ?? {}
  const restricao = t.restricoesAlimentares?.trim()
  const comercial = e.origem === 'comercial'
  const quem = comercial ? 'o fabricante' : 'você'
  if (s.foodSafe === 'nao' || s.dinnerwareSafe === 'nao' || s.contatoAlimento === 'nao' || s.decorativo === 'sim' || e.louca === 'nao')
    return { classe: 'nao-seguro', motivo: comercial ? 'O fabricante declara que o esmalte não é adequado ao contato alimentar.' : 'Registrado por você como não adequado ao contato alimentar.' }
  if (!comercial && s.ensaio === 'nao') return { classe: 'nao-seguro', motivo: 'Ensaio laboratorial reprovado.' }
  const termos = ([['foodSafe', 'Food Safe'], ['dinnerwareSafe', 'Dinnerware Safe'], ['contatoAlimento', 'contato direto com alimentos']] as const).filter(([k]) => s[k] === 'sim').map(([, l]) => l)
  const declarado = comercial ? termos.length > 0 || s.alimentarDeclarada === 'sim' || e.louca === 'sim' : s.ensaio === 'sim'
  if (declarado) {
    const base = comercial ? (termos.length ? `${termos.join(' e ')} declarado${termos.length > 1 ? 's' : ''} pelo fabricante.` : 'Uso em louça declarado pelo fabricante.') : 'Ensaio laboratorial aprovado.'
    return restricao ? { classe: 'restrito', motivo: `${base} Restrição específica: ${restricao}` } : { classe: 'seguro', motivo: base }
  }
  if (!comercial && e.louca === 'sim') return { classe: 'nao-informado', motivo: 'Registrado por você como apto à louça, sem ensaio laboratorial documentado.' }
  return { classe: 'nao-informado', motivo: `Não há documentação suficiente de ${quem} para estabelecer uma classificação.` }
}

/**
 * Outras queimas com resultado documentado (fabricante, revenda, imagem), fora do cone de referência.
 * Um resultado documentado não é recomendação; testes e hipóteses ficam de fora do resumo.
 */
export function outrasQueimas(e: Esmalte): string[] {
  const norm = (c: string) => c.trim().replace(/^cone\s*/i, '')
  const ref = new Set((e.cone ?? '').split(/[-/–]/).map(norm).filter(Boolean))
  const xs = (e.tecnica?.temperaturas ?? []).filter((x) => x.tipo !== 'teste' && x.tipo !== 'hipotese')
  const rot = xs.map((x) => x.cone ? (ref.has(norm(x.cone)) ? undefined : 'Cone ' + norm(x.cone)) : x.temperatura).filter((x): x is string => !!x)
  return [...new Set(rot)]
}

export const VERIFICACAO = { sim: 'Sim', nao: 'Não', 'nao-verificado': 'Não verificado' } as const

export const DEFEITOS_FICHA = ['Craquelamento', 'Descascamento', 'Crawling (retração)', 'Bolhas', 'Pinholes', 'Crateras', 'Escorrimento excessivo', 'Cobertura irregular', 'Desvitrificação indesejada', 'Alteração inesperada de cor'] as const

export const ORIGENS: Record<OrigemDado, string> = {
  fabricante: 'Fabricante', rotulo: 'Rótulo do fabricante', distribuidor: 'Distribuidor ou importador', revendedor: 'Revendedor',
  referencia: 'Publicação técnica', receita: 'Receita original', experimento: 'Experimento próprio', pessoal: 'Observação pessoal', ia: 'Interpretação da IA',
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
  // "não usar em louça" já aparece na linha de segurança alimentar do resumo
  if (e.tecnica?.compatibilidade && Object.entries(e.tecnica.compatibilidade).some(([, v]) => v === 'incompativel')) {
    const nomes = Object.entries(e.tecnica.compatibilidade).filter(([, v]) => v === 'incompativel').map(([k]) => MASSAS.find(([m]) => m === k)?.[1] ?? k)
    a.push('Incompatível com: ' + nomes.join(', ') + '.')
  }
  return a
}

/** Primeiro parágrafo útil das observações, para a descrição curta quando não há uma escrita. */
export const temTexto = (r?: Record<string, string>) => !!r && Object.values(r).some((v) => v?.trim())
