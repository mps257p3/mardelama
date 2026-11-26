import { db, novo, type Referencia } from '../db/schema'
import { cabecalhoLogin } from './login'
import { chamar, iaConfigurada, paraBase64 } from './iaRepertorio'
import { novaIdeia } from './ideias'

/** O que chegou pelo menu Compartilhar (ou foi colado na tela Recebido). */
export interface Recebido {
  id?: string                 // entrada no cache do service worker
  titulo: string
  texto: string
  url?: string
  imagens: Blob[]
}

export interface Previa { imagem?: string; titulo?: string; site?: string; erro?: string }

export type Destino = 'ideia' | 'referencia' | 'nota'

export interface Leitura {
  titulo: string
  transcricao: string
  resumo: string
  autor: string
  destino: Destino
  porque: string
  tags: string[]
  esmalte: { materiais: string[]; como: string; efeitos: string[]; queima: string; argila: string; notas: string }
  perguntas: { pergunta: string; opcoes: string[] }[]
}

export interface Resposta { pergunta: string; resposta: string }

const CACHE = 'recebidos'
const linkDe = (texto: string) => texto.match(/https?:\/\/\S+/)?.[0]

/** Lê o que o service worker guardou ao receber um compartilhamento. */
export async function lerRecebido(id: string): Promise<Recebido | undefined> {
  if (!('caches' in self)) return undefined
  const cache = await caches.open(CACHE)
  const meta = await cache.match(`/__recebido/${id}/meta`)
  if (!meta) return undefined
  const m = await meta.json() as { titulo: string; texto: string; url: string; n: number }
  const imagens: Blob[] = []
  for (let i = 0; i < m.n; i++) { const r = await cache.match(`/__recebido/${id}/${i}`); if (r) imagens.push(await r.blob()) }
  return { id, titulo: m.titulo, texto: m.texto, url: m.url || linkDe(m.texto), imagens }
}

/** Apaga do aparelho o que já foi guardado no app (ou descartado). */
export async function limparRecebido(id?: string) {
  if (!id || !('caches' in self)) return
  const cache = await caches.open(CACHE)
  for (const k of await cache.keys()) if (new URL(k.url).pathname.startsWith(`/__recebido/${id}/`)) await cache.delete(k)
}

export async function previaDoLink(url: string): Promise<Previa> {
  try {
    const r = await fetch(`/api/previa?u=${encodeURIComponent(url)}`, { headers: await cabecalhoLogin() })
    return await r.json()
  } catch { return { erro: 'Sem conexão' } }
}

export const ehInstagram = (url?: string) => !!url && /(^|\.)instagram\.com$/i.test(hostDe(url))
function hostDe(url: string) { try { return new URL(url).hostname.replace(/^www\./, '') } catch { return '' } }
function fonteDe(url?: string, site?: string) {
  if (!url) return undefined
  if (ehInstagram(url)) return 'Instagram'
  return site || hostDe(url) || undefined
}

/** Transcreve, resume e sugere o destino. Precisa da IA configurada na Vercel. */
export const NAO_SEI = 'Não sei'
export const temNaoSei = (rs: Resposta[]) => rs.some((x) => x.resposta === NAO_SEI)

/** Com "Não sei" em alguma resposta, o servidor pesquisa na internet antes de preencher (demora mais). */
export async function lerComIA(r: Recebido, previa?: Previa, respostas: Resposta[] = [], anterior?: Leitura, pesquisar = false): Promise<Leitura | undefined> {
  if (!(await iaConfigurada())) return undefined
  const imagens = await Promise.all(r.imagens.slice(0, 4).map(async (b) => ({ base64: await paraBase64(b), tipo: 'image/jpeg' })))
  return chamar<Leitura>({ acao: 'receber', imagens, titulo: r.titulo, texto: r.texto, url: r.url, previa: previa && !previa.erro ? previa : undefined, respostas, pesquisar,
    contexto: anterior ? { titulo: anterior.titulo, autor: anterior.autor, resumo: anterior.resumo, transcricao: anterior.transcricao } : undefined }, pesquisar ? 175000 : 90000)
}

async function guardarImagens(r: Recebido, tipo: 'ideia' | 'referencia' | 'nota', id: string) {
  const { salvarArquivo } = await import('../db/files')
  return Promise.all(r.imagens.map((b, i) => salvarArquivo(new File([b], `recebido-${i + 1}.${(b.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg')}`, { type: b.type || 'image/jpeg' }), { tipo, id })))
}

const escapar = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Guarda no destino escolhido e devolve o caminho da página criada. */
export async function guardar(destino: Destino, r: Recebido, l?: Leitura, previa?: Previa): Promise<string> {
  const titulo = l?.titulo || r.titulo || previa?.titulo || ''
  const autor = l?.autor || undefined
  const fonte = fonteDe(r.url, previa?.site)
  const externa = !r.imagens.length && previa?.imagem ? previa.imagem : undefined
  const transcricao = l?.transcricao?.trim()
  const textoLivre = r.texto.replace(r.url ?? '', '').trim()
  let caminho: string
  if (destino === 'ideia') {
    const e = l?.esmalte
    const notas = [e?.notas?.trim(), transcricao && `Texto do post: ${transcricao.replace(/\n+/g, ' ')}`, !l && textoLivre].filter(Boolean).join('\n\n') || undefined
    const id = await novaIdeia({
      titulo, autor, fonte, url: r.url, imagemExterna: externa, tags: l?.tags ?? [],
      materiais: e?.materiais.length ? e.materiais.join('\n') : undefined, esmaltes: e?.como || undefined,
      efeitos: e?.efeitos ?? [], queima: e?.queima || undefined, argila: e?.argila || undefined, notas,
    })
    const imagens = await guardarImagens(r, 'ideia', id)
    if (imagens.length) await db.ideias.update(id, { imagens })
    caminho = `/ideias/${id}`
  } else if (destino === 'referencia') {
    const x = novo({
      titulo: titulo || (r.url ? hostDe(r.url) : 'Sem título'), tipo: r.imagens.length ? 'Fotografia' : r.url ? 'Link' : 'Fotografia',
      imagens: [], tags: l?.tags ?? [], grupos: [], url: r.url, autor, fonte, imagemExterna: externa,
      descricao: [l?.resumo, transcricao, !l && textoLivre].filter(Boolean).join('\n\n') || undefined,
    }) as Referencia
    await db.referencias.add(x)
    const imagens = await guardarImagens(r, 'referencia', x.id)
    if (imagens.length) await db.referencias.update(x.id, { imagens })
    caminho = `/referencias/${x.id}`
  } else {
    const n = novo({
      titulo: titulo || undefined, imagens: [], arquivos: [], audios: [], tags: l?.tags ?? [], paleta: [], links: r.url ? [r.url] : [],
      corpo: [l?.resumo, transcricao, !l && textoLivre].filter(Boolean).map((p) => `<p>${escapar(p as string).replace(/\n/g, '<br>')}</p>`).join(''),
    })
    await db.notas.add(n)
    const imagens = await guardarImagens(r, 'nota', n.id)
    if (imagens.length) await db.notas.update(n.id, { imagens })
    caminho = `/caderno/${n.id}`
  }
  await limparRecebido(r.id)
  return caminho
}
