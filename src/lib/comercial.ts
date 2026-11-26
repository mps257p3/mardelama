import { db, novo, uid, type Comercial, type Esmalte, type Ingrediente, type Louca } from '../db/schema'
import { chamar, iaConfigurada, paraBase64 } from './iaRepertorio'

interface Pesquisa { fabricante: string; nome: string; codigo: string; serie: string; cone: string; temperatura: string; louca?: Louca; instrucoes: string; declarados: string[]; usos?: string[]; documentacao: string; hipoteses: string[]; fontes: string[]; observacoes: string; avisos: string[]; imagens?: string[]
  receita?: { ingredientes: Ingrediente[]; parametros?: string; preparo?: string }
  fluidez?: import('./fluidez').PesquisaFluidez }

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
export async function fotosDoFabricante(id: string, urls: string[], tipo: 'comercial' | 'esmalte' = 'comercial') {
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
      ids.push(await salvarArquivo(new File([b], nome, { type: b.type }), { tipo, id }))
    } catch { /* segue para a próxima */ }
  }
  return ids
}

/** Temperatura em °C a partir do texto da pesquisa ("1180 a 1220 °C" → 1220; só °F → converte). */
function grausDoTexto(t?: string) {
  if (!t) return undefined
  const c = [...t.matchAll(/(\d{3,4})\s*°?\s*C\b/g)].map((m) => Number(m[1])).filter((n) => n >= 600 && n <= 1400)
  if (c.length) return Math.max(...c)
  const f = [...t.matchAll(/(\d{4})\s*°?\s*F\b/g)].map((m) => Math.round((Number(m[1]) - 32) * 5 / 9)).filter((n) => n >= 600 && n <= 1400)
  return f.length ? Math.max(...f) : undefined
}

/**
 * Esmaltaria › + › Catalogar por foto: a IA identifica o esmalte pela foto (pote, rótulo, placa),
 * pesquisa o fabricante e cria a ficha em Esmaltes: marca, temperatura, cone, uso em louça e fotos do fabricante.
 * As fotos enviadas servem só de base para a pesquisa e não ficam guardadas: na ficha entram as fotos do fabricante.
 */
export async function catalogarEsmalte(fotos: Blob[], familias: string[] = []) {
  if (!(await iaConfigurada())) throw new Error('A IA não está ligada')
  const imagens = await Promise.all(fotos.slice(0, 4).map(async (b) => ({ base64: await paraBase64(b), tipo: 'image/jpeg' })))
  const p = await chamar<Pesquisa>({ acao: 'comercial', imagens, texto: '' }, 175000)
  if (!p.nome) throw new Error('A IA não reconheceu o esmalte na foto. Tente uma foto do rótulo.')
  const { proximoCodigo } = await import('../db/codigos')
  const id = uid()
  // as fotos enviadas servem só para a pesquisa; na ficha ficam as fotos do fabricante
  const ids = await fotosDoFabricante(id, p.imagens ?? [], 'esmalte')
  const bloco = (t: string, xs?: string[]) => (xs?.length ? t + ':\n' + xs.map((x) => '• ' + x).join('\n') : '')
  const observacoes = [
    [p.codigo && 'Código do produto: ' + p.codigo, p.serie && 'Linha: ' + p.serie, p.temperatura && 'Queima: ' + p.temperatura].filter(Boolean).join('\n'),
    p.instrucoes, bloco('Declarado pelo fabricante', p.declarados), bloco('Melhores usos', p.usos), p.observacoes,
    p.avisos.length ? 'Incertezas: ' + p.avisos.join(' ') : '', bloco('Fontes', p.fontes),
  ].filter(Boolean).join('\n\n')
  const e: Esmalte = {
    ...novo({ nome: p.nome, codigo: await proximoCodigo('E', 'esmaltes', 3), origem: 'comercial' as const, autoria: p.fabricante || undefined, familias, fotos: ids, tags: [] as string[] }),
    id, cone: p.cone || undefined, temperatura: grausDoTexto(p.temperatura), louca: p.louca, observacoes: observacoes || undefined,
    fluidezQueima: await (await import('./fluidez')).fluidezDaPesquisa(id, p.fluidez),
  }
  await db.esmaltes.add(e)
  return id
}

const normal = (s?: string) => (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

/** Código do produto que ficou nas observações do esmalte (ex.: "Código do produto: PC-602"). */
export const codigoDoProduto = (e: Esmalte) => e.observacoes?.match(/C[óo]digo do produto:\s*([A-Z0-9][\w-]*)/i)?.[1]

/**
 * Estudo de engenharia reversa de um esmalte comercial: o ligado a ele em Conexões ou,
 * se não houver, o de mesmo código ou nome (e mesma marca, quando as duas têm marca).
 */
export async function estudoDoEsmalte(e: Esmalte): Promise<Comercial | undefined> {
  const rels = (await db.relacoes.toArray()).filter((r) => !r.excluido && (
    (r.aTipo === 'esmalte' && r.aId === e.id && r.bTipo === 'comercial') || (r.bTipo === 'esmalte' && r.bId === e.id && r.aTipo === 'comercial')))
  for (const r of rels) {
    const c = await db.comerciais.get(r.aTipo === 'comercial' ? r.aId : r.bId)
    if (c && !c.excluido) return c
  }
  const todos = (await db.comerciais.toArray()).filter((c) => !c.excluido)
  const cod = normal(codigoDoProduto(e))
  const marca = normal(e.autoria).split(' ')[0]
  const mesmaMarca = (c: Comercial) => !marca || !c.fabricante || normal(c.fabricante).includes(marca) || marca.includes(normal(c.fabricante).split(' ')[0])
  return todos.find((c) => cod && normal(c.codigo) === cod) ?? todos.find((c) => normal(c.nome) === normal(e.nome) && mesmaMarca(c))
}

/** Cria o estudo de engenharia reversa a partir da ficha do esmalte e liga os dois em Conexões. */
export async function criarEstudoDoEsmalte(e: Esmalte) {
  const c: Comercial = novo({
    fabricante: e.autoria ?? '', nome: e.nome, codigo: codigoDoProduto(e), familias: e.familias, cone: e.cone,
    temperatura: e.temperatura ? e.temperatura + ' °C' : undefined, louca: e.louca,
    fotos: [], declarados: [], hipoteses: [], fontes: [],
  })
  await db.comerciais.add(c)
  const t = Date.now()
  await db.relacoes.add({ id: uid(), aTipo: 'esmalte', aId: e.id, bTipo: 'comercial', bId: c.id, criadoEm: t, atualizadoEm: t, excluido: 0 })
  return c.id
}
