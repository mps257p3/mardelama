import { db, type Comercial } from '../db/schema'
import { chamar, iaConfigurada, paraBase64 } from './iaRepertorio'

interface Pesquisa { fabricante: string; nome: string; codigo: string; serie: string; cone: string; temperatura: string; instrucoes: string; declarados: string[]; documentacao: string; hipoteses: string[]; fontes: string[]; observacoes: string; avisos: string[] }

const PADRAO = ['Fabricante', 'Novo esmalte estudado', 'Estudo de print', 'Esmalte não identificado']
const juntar = (a: string[], b: string[]) => [...new Set([...a, ...b].filter(Boolean))]

/**
 * Pesquisa um estudo de engenharia reversa com a IA (busca na web): usa as fotos do estudo (até 4)
 * e o que já está escrito (fabricante, nome, código). Preenche só o que a pesquisa trouxe; listas são somadas.
 */
export async function pesquisarEstudo(id: string) {
  const c = await db.comerciais.get(id)
  if (!c) throw new Error('Estudo não encontrado')
  if (!(await iaConfigurada())) throw new Error('A IA não está ligada')
  const blobs = (await Promise.all(c.fotos.slice(0, 4).map((f) => db.arquivos.get(f)))).map((a) => a?.blob).filter((b): b is Blob => !!b)
  const imagens = await Promise.all(blobs.map(async (b) => ({ base64: await paraBase64(b), tipo: 'image/jpeg' })))
  const texto = [c.fabricante, c.nome, c.codigo, c.serie].filter((x) => x && !PADRAO.includes(x)).join(' · ')
  if (!imagens.length && !texto) throw new Error('Coloque uma foto ou escreva o nome do esmalte')
  const p = await chamar<Pesquisa>({ acao: 'comercial', imagens, texto }, 175000)
  const obs = [p.observacoes, p.avisos.length ? 'Incertezas: ' + p.avisos.join(' ') : ''].filter(Boolean).join('\n\n')
  const d: Partial<Comercial> = {
    declarados: juntar(c.declarados, p.declarados), hipoteses: juntar(c.hipoteses, p.hipoteses), fontes: juntar(c.fontes, p.fontes), atualizadoEm: Date.now(),
  }
  if (p.fabricante) d.fabricante = p.fabricante
  if (p.nome) d.nome = p.nome
  else if (PADRAO.includes(c.nome)) d.nome = 'Esmalte não identificado'
  for (const k of ['codigo', 'serie', 'cone', 'temperatura', 'instrucoes', 'documentacao'] as const) if (p[k]) d[k] = p[k]
  if (obs) d.observacoes = c.observacoes && !c.observacoes.includes(obs) ? c.observacoes + '\n\n' + obs : obs
  await db.comerciais.update(id, d)
}
