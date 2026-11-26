import { db, type Comercial, type Ingrediente, type Louca } from '../db/schema'
import { chamar, iaConfigurada, paraBase64 } from './iaRepertorio'

interface Pesquisa { fabricante: string; nome: string; codigo: string; serie: string; cone: string; temperatura: string; louca?: Louca; instrucoes: string; declarados: string[]; usos?: string[]; documentacao: string; hipoteses: string[]; fontes: string[]; observacoes: string; avisos: string[]; imagens?: string[]
  receita?: { ingredientes: Ingrediente[]; parametros?: string; preparo?: string } }

const PADRAO = ['Fabricante', 'Novo esmalte estudado', 'Estudo de print', 'Esmalte não identificado']
const juntar = (a: string[], b: string[]) => [...new Set([...a, ...b].filter(Boolean))]

/**
 * Pesquisa um estudo de engenharia reversa com a IA (busca na web): usa as fotos do estudo (até 4)
 * e o que já está escrito (fabricante, nome, código). Preenche só o que a pesquisa trouxe; listas são somadas.
 * `prints` são imagens usadas só para identificar o esmalte: vão para a IA e não ficam guardadas.
 */
export async function pesquisarEstudo(id: string, prints: Blob[] = []) {
  const c = await db.comerciais.get(id)
  if (!c) throw new Error('Estudo não encontrado')
  if (!(await iaConfigurada())) throw new Error('A IA não está ligada')
  const guardadas = (await Promise.all(c.fotos.slice(0, 4).map((f) => db.arquivos.get(f)))).map((a) => a?.blob).filter((b): b is Blob => !!b)
  const blobs = [...prints, ...guardadas].slice(0, 4)
  const imagens = await Promise.all(blobs.map(async (b) => ({ base64: await paraBase64(b), tipo: 'image/jpeg' })))
  const texto = [c.fabricante, c.nome, c.codigo, c.serie].filter((x) => x && !PADRAO.includes(x)).join(' · ')
  if (!imagens.length && !texto) throw new Error('Coloque uma foto ou escreva o nome do esmalte')
  const p = await chamar<Pesquisa>({ acao: 'comercial', imagens, texto }, 175000)
  const obs = [p.observacoes, p.avisos.length ? 'Incertezas: ' + p.avisos.join(' ') : ''].filter(Boolean).join('\n\n')
  const d: Partial<Comercial> = {
    declarados: juntar(c.declarados, p.declarados), usos: juntar(c.usos ?? [], p.usos ?? []), hipoteses: juntar(c.hipoteses, p.hipoteses), fontes: juntar(c.fontes, p.fontes), atualizadoEm: Date.now(),
  }
  if (p.fabricante) d.fabricante = p.fabricante
  if (p.nome) d.nome = p.nome
  else if (PADRAO.includes(c.nome)) d.nome = 'Esmalte não identificado'
  for (const k of ['codigo', 'serie', 'cone', 'temperatura', 'instrucoes', 'documentacao'] as const) if (p[k]) d[k] = p[k]
  if (p.louca && (!c.louca || p.louca !== 'testar')) d.louca = p.louca
  if (obs) d.observacoes = c.observacoes && !c.observacoes.includes(obs) ? c.observacoes + '\n\n' + obs : obs
  // receita de teste (hipótese em 100 g): só entra se o estudo ainda não tem uma
  if (!c.receita && p.receita?.ingredientes.length) {
    const mats = await db.materiais.toArray()
    const achar = (nome: string) => mats.find((m) => !m.excluido && m.nome.toLowerCase() === nome.toLowerCase())?.id
    d.receita = {
      codigo: c.observacoes?.match(/ER-\d+/)?.[0], aguaMlPor100g: 85,
      ingredientes: p.receita.ingredientes.map((i) => ({ ...i, materialId: achar(i.nome) })),
      parametros: p.receita.parametros || undefined, observacoes: p.receita.preparo || undefined,
    }
  }
  const novas = await fotosDoFabricante(id, p.imagens ?? [])
  if (novas.length) d.fotos = [...c.fotos, ...novas]
  await db.comerciais.update(id, d)
  return !!p.nome // false: a IA não identificou o esmalte
}

/**
 * Baixa fotos do produto (placa de teste, pote) por link e guarda no aparelho, como as fotos do estudo.
 * Passa pela /api/imagem quando o site não deixa o navegador abrir direto. Devolve os ids que deram certo.
 */
export async function fotosDoFabricante(id: string, urls: string[]) {
  const { cabecalhoLogin } = await import('./login')
  const { salvarArquivo } = await import('../db/files')
  const ids: string[] = []
  for (const u of urls) {
    if (!/^https:\/\//.test(u)) continue
    try {
      const r = await fetch('/api/imagem?u=' + encodeURIComponent(u), { headers: await cabecalhoLogin() })
      const b = r.ok ? await r.blob() : undefined
      if (!b?.type.startsWith('image/') || b.size < 2000) continue
      const nome = (u.split('/').pop() || 'fabricante.jpg').split('?')[0]
      ids.push(await salvarArquivo(new File([b], nome, { type: b.type }), { tipo: 'comercial', id }))
    } catch { /* segue para a próxima */ }
  }
  return ids
}
