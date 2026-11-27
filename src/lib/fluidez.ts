import { db, type Esmalte, type FluidezQueima, type ResultadoFluidez } from '../db/schema'
import { chamar, iaConfigurada } from './iaRepertorio'
import { codigoDoProduto, fotosDoFabricante } from './comercial'

/** Resposta da IA (api/ia.js, acao 'fluidez' e campo "fluidez" da pesquisa comercial): imagens ainda como links. */
export type PesquisaFluidez = Omit<FluidezQueima, 'imagens' | 'consultadoEm'> & { imagens: string[] }

const hoje = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
const chaveCone = (r: ResultadoFluidez) => (r.cone || r.temperatura || '').toLowerCase().replace(/\s+/g, '')
const uniao = (a: string[], b: string[]) => [...new Set([...a, ...b].filter(Boolean))]

/**
 * Junta a consulta nova com o que já estava na ficha, sem perder nada:
 * resultados do mesmo cone são substituídos, os de outros cones ficam; textos vazios na consulta nova mantêm os antigos;
 * fotos e fontes somam. Se a nova consulta não achou nada e a antiga tinha dados, a antiga fica.
 */
export function mesclarFluidez(anterior: FluidezQueima | undefined, nova: PesquisaFluidez, imagens: string[]): FluidezQueima {
  // uma consulta anterior que não terminou não tem dados: conta como "sem consulta", mas fotos e fontes ficam
  const antiga = anterior?.situacao === 'indisponivel' ? (anterior.imagens.length || anterior.fontes.length ? { ...anterior, situacao: 'nao-informada' as const } : undefined) : anterior
  const vazia = nova.situacao === 'nao-informada' && !nova.resultados.length
  if (antiga && vazia && antiga.situacao !== 'nao-informada') {
    return { ...antiga, fontes: uniao(antiga.fontes, nova.fontes), consultadoEm: hoje(), estimativaIA: nova.estimativaIA || antiga.estimativaIA }
  }
  const resultados = [...(antiga?.resultados ?? [])]
  for (const r of nova.resultados) {
    const i = resultados.findIndex((x) => chaveCone(x) && chaveCone(x) === chaveCone(r))
    if (i >= 0) resultados[i] = { ...resultados[i], ...Object.fromEntries(Object.entries(r).filter(([, v]) => v)) }
    else resultados.push(r)
  }
  const texto = (k: 'espessura' | 'sobreposicao' | 'curva' | 'recomendacoes') => nova[k] || antiga?.[k] || undefined
  const situacao = antiga?.situacao === 'oficial' || nova.situacao === 'oficial' ? (resultados.some((r) => r.classificacao) ? 'oficial' : 'descritiva') : nova.situacao === 'descritiva' || antiga?.situacao === 'descritiva' ? 'descritiva' : 'nao-informada'
  return {
    situacao, resultados, espessura: texto('espessura'), sobreposicao: texto('sobreposicao'), curva: texto('curva'), recomendacoes: texto('recomendacoes'),
    imagens: uniao(antiga?.imagens ?? [], imagens), fontes: uniao(antiga?.fontes ?? [], nova.fontes), consultadoEm: hoje(),
    estimativaIA: nova.estimativaIA || antiga?.estimativaIA || undefined,
  }
}

/** Monta a fluidez de um esmalte a partir da resposta da IA, baixando as fotos oficiais dos testes. */
export async function fluidezDaPesquisa(esmalteId: string, p: PesquisaFluidez | undefined, antiga?: FluidezQueima) {
  if (!p) return antiga
  const imagens = await fotosDoFabricante(esmalteId, p.imagens ?? [], 'esmalte')
  return mesclarFluidez(antiga, p, imagens)
}

/** Botão "Atualizar informações do fabricante": nova consulta às fontes oficiais, preservando o que já havia. */
export async function atualizarFluidez(e: Esmalte) {
  try { return await consultar(e) } catch (x) {
    // registra a tentativa que não terminou, sem apagar o que já havia
    const atual = (await db.esmaltes.get(e.id))?.fluidezQueima
    await db.esmaltes.update(e.id, { fluidezQueima: atual ? { ...atual, falhaEm: hoje() } : { situacao: 'indisponivel', resultados: [], imagens: [], fontes: [], falhaEm: hoje() } })
    throw x
  }
}
async function consultar(e: Esmalte) {
  if (!(await iaConfigurada())) throw new Error('A IA não está ligada')
  const linha = e.observacoes?.match(/^Linha:\s*(.+)$/m)?.[1]
  const p = await chamar<PesquisaFluidez>({ acao: 'fluidez', fabricante: e.autoria ?? '', nome: e.nome, codigo: codigoDoProduto(e) ?? '', linha: linha ?? '' }, 175000)
  const atual = await db.esmaltes.get(e.id)
  const f = await fluidezDaPesquisa(e.id, p, atual?.fluidezQueima)
  if (f) delete f.falhaEm
  await db.esmaltes.update(e.id, { fluidezQueima: f, atualizadoEm: Date.now() })
  return f
}

/** Rótulos de filtro: cada fabricante com a própria escala, sem equivalência entre marcas. */
export const NAO_INFORMADA = 'Fluidez não informada pelo fabricante'
export const SO_DESCRICAO = 'Só descrição do fabricante'
export const COM_TESTE = 'Com teste seu de fluidez'
export const NAO_CONSULTADO = 'Ainda não consultado'
export function rotulosFluidez(e: Esmalte): string[] {
  if (e.origem !== 'comercial') return e.testesFluidez?.length ? [COM_TESTE] : []
  const f = e.fluidezQueima
  const r: string[] = []
  if (!f || f.situacao === 'indisponivel') r.push(NAO_CONSULTADO)
  else if (f.situacao === 'nao-informada') r.push(NAO_INFORMADA)
  else if (f.situacao === 'descritiva') r.push(SO_DESCRICAO)
  else for (const x of f.resultados) if (x.classificacao) r.push(`${e.autoria || 'Sem marca'}: ${x.classificacao}`)
  if (e.testesFluidez?.length) r.push(COM_TESTE)
  return [...new Set(r)]
}

/**
 * Estado da informação de fluidez para a ficha. `fluidezQueima` só existe depois de uma consulta específica de fluidez
 * (botão Atualizar ou pesquisa do catálogo); esmaltes cadastrados por rótulo podem ter informação qualitativa do fabricante
 * em outros campos sem nunca terem passado por essa consulta.
 */
export type EstadoFluidez = 'nao-consultado' | 'qualitativa-sem-consulta' | 'indisponivel' | 'sem-classificacao' | 'qualitativa' | 'oficial'
export const ROTULO_ESTADO: Record<EstadoFluidez, string> = {
  'nao-consultado': 'Fabricante ainda não consultado',
  'qualitativa-sem-consulta': 'Informações qualitativas disponíveis',
  indisponivel: 'Consulta indisponível ou não concluída',
  'sem-classificacao': 'Fabricante consultado, sem classificação oficial',
  qualitativa: 'Informações qualitativas do fabricante',
  oficial: 'Classificação oficial disponível',
}
export function estadoFluidez(e: Esmalte): EstadoFluidez | undefined {
  if (e.origem !== 'comercial') return undefined
  const f = e.fluidezQueima
  if (!f || f.situacao === 'indisponivel') {
    if (f?.situacao === 'indisponivel') return 'indisponivel'
    const o = e.perfil?.comportamentoOrigem?.fluidez
    return e.perfil?.comportamentoNota?.fluidez && o && o !== 'pessoal' && o !== 'ia' ? 'qualitativa-sem-consulta' : 'nao-consultado'
  }
  return f.situacao === 'oficial' ? 'oficial' : f.situacao === 'descritiva' ? 'qualitativa' : 'sem-classificacao'
}
