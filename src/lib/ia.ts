/**
 * Camada de inteligência artificial — preparada, ainda sem provedor conectado.
 *
 * Toda resposta de IA é tratada como análise: o que foi verificado (dados do próprio ateliê
 * ou cálculo determinístico) fica separado do que é hipótese ou sugestão experimental.
 */

export type Confianca = 'verificado' | 'hipotese' | 'sugestao'

export interface Afirmacao {
  texto: string
  confianca: Confianca
  fonte?: string            // ex.: "teste T-0012", "cálculo de receita", "modelo"
}

export interface Analise {
  titulo: string
  afirmacoes: Afirmacao[]
  avisos: string[]
  geradoEm: number
  modelo?: string
}

export const AVISO_ALIMENTOS =
  'Nenhuma formulação pode ser considerada segura para contato com alimentos apenas pela análise da composição. ' +
  'A segurança depende da queima, da aplicação e de testes laboratoriais de lixiviação.'

export type Funcao =
  | 'esmalte-por-foto' | 'tags-referencia' | 'extrair-receita' | 'organizar-notas' | 'sugerir-experimentos'
  | 'comparar-formulacoes' | 'busca-semantica' | 'causas-defeitos' | 'referencias-relacionadas'

export const FUNCOES: { id: Funcao; nome: string; desc: string; onde: string }[] = [
  { id: 'esmalte-por-foto', nome: 'Características de esmaltes por fotografia', desc: 'Acabamento, textura, cor e fluidez estimados a partir da foto da placa.', onde: 'Esmalte e Teste' },
  { id: 'tags-referencia', nome: 'Sugestão de tags para referências', desc: 'Tags e grupos propostos a partir da imagem e do texto.', onde: 'Referência' },
  { id: 'extrair-receita', nome: 'Extração de receitas de imagens e documentos', desc: 'Lê uma foto ou PDF e preenche os ingredientes no editor.', onde: 'Receita' },
  { id: 'organizar-notas', nome: 'Organização de anotações', desc: 'Propõe temas, tags e conexões para o caderno.', onde: 'Caderno' },
  { id: 'sugerir-experimentos', nome: 'Sugestões de experimentos', desc: 'Planos de teste a partir do histórico de resultados.', onde: 'Planejar experimento' },
  { id: 'comparar-formulacoes', nome: 'Comparação comentada de formulações', desc: 'Explica o efeito provável das diferenças entre duas receitas.', onde: 'Comparar receitas' },
  { id: 'busca-semantica', nome: 'Busca semântica', desc: 'Encontra conteúdos pelo sentido, não só pelas palavras.', onde: 'Buscar' },
  { id: 'causas-defeitos', nome: 'Possíveis causas de defeitos', desc: 'Hipóteses para defeitos registrados em testes.', onde: 'Teste' },
  { id: 'referencias-relacionadas', nome: 'Referências relacionadas', desc: 'Sugere referências próximas por forma, cor e tema.', onde: 'Referência' },
]

export interface EntradaIA {
  funcao: Funcao
  texto?: string
  imagens?: Blob[]
  contexto?: Record<string, unknown>  // dados do ateliê relevantes (receita, testes, materiais)
}

/** Contrato que um provedor (ex.: API da Anthropic via função no servidor) deve implementar. */
export interface ProvedorIA {
  nome: string
  disponivel(): Promise<boolean>
  analisar(entrada: EntradaIA): Promise<Analise>
}

let provedor: ProvedorIA | undefined
export const registrarProvedor = (p: ProvedorIA) => { provedor = p }
export const provedorAtual = () => provedor

/** Garante as regras do ateliê em qualquer resposta, independentemente do provedor. */
export function aplicarRegras(a: Analise, funcao: Funcao): Analise {
  const envolveEsmalte = ['esmalte-por-foto', 'extrair-receita', 'sugerir-experimentos', 'comparar-formulacoes', 'causas-defeitos'].includes(funcao)
  const avisos = new Set(a.avisos)
  if (envolveEsmalte) avisos.add(AVISO_ALIMENTOS)
  // afirmações vindas do modelo sem fonte do ateliê nunca contam como verificadas
  const afirmacoes = a.afirmacoes.map((x) => (x.confianca === 'verificado' && (!x.fonte || x.fonte === 'modelo') ? { ...x, confianca: 'hipotese' as const } : x))
  return { ...a, afirmacoes, avisos: [...avisos] }
}

export async function analisar(entrada: EntradaIA): Promise<Analise> {
  if (!provedor || !(await provedor.disponivel())) throw new Error('Nenhum provedor de IA conectado.')
  return aplicarRegras(await provedor.analisar(entrada), entrada.funcao)
}
