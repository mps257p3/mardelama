import { db, novo, type Artista, type Obra, type Referencia } from '../db/schema'
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
  pdfs?: File[]               // PDFs originais (o texto já foi para `texto` e as figuras para `imagens`)
}

export interface Previa { imagem?: string; titulo?: string; site?: string; erro?: string }

export type Destino = 'ideia' | 'referencia' | 'nota' | 'artista'

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
  for (let i = 0; i < m.n; i++) {
    const r = await cache.match(`/__recebido/${id}/${i}`)
    if (r) { const b = await r.blob(); imagens.push(new File([b], decodeURIComponent(r.headers.get('x-nome') ?? '') || `arquivo-${i + 1}`, { type: b.type })) }
  }
  return { id, titulo: m.titulo, texto: m.texto, url: m.url || linkDe(m.texto), imagens }
}

export const ehPdf = (b: Blob) => b.type === 'application/pdf' || (b instanceof File && /\.pdf$/i.test(b.name))

/** Abre os PDFs que vieram junto: o texto entra no texto recebido e as figuras recortadas viram as fotos. */
export async function abrirPdfs(r: Recebido): Promise<Recebido> {
  const pdfs = r.imagens.filter(ehPdf) as File[]
  if (!pdfs.length) return r
  const { lerPdf } = await import('./pdf')
  const lidos = await Promise.all(pdfs.map((p) => lerPdf(p)))
  const nome = (p: File) => (p.name || '').replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').trim()
  return {
    ...r,
    titulo: r.titulo || lidos[0].titulo || nome(pdfs[0]),
    texto: [r.texto, ...lidos.map((l) => l.texto)].filter((t) => t.trim()).join('\n\n'),
    imagens: [...r.imagens.filter((b) => !ehPdf(b)), ...lidos.flatMap((l) => l.figuras)],
    pdfs: [...(r.pdfs ?? []), ...pdfs.map((p) => p instanceof File ? p : new File([p], 'documento.pdf', { type: 'application/pdf' }))],
  }
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

/** Link de arquivo na nuvem (Acrobat, Drive, OneDrive, Dropbox): o app recebe só o endereço, não o arquivo. */
export const ehLinkDeArquivo = (url?: string) => !!url && /(^|\.)(acrobat\.adobe\.com|drive\.google\.com|docs\.google\.com|onedrive\.live\.com|1drv\.ms|dropbox\.com)$/i.test(hostDe(url))

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
  const imagens = await Promise.all(r.imagens.slice(0, MAX_LEITURA).map(async (b) => ({ base64: await paraBase64(b), tipo: 'image/jpeg' })))
  return chamar<Leitura>({ acao: 'receber', imagens, total: r.imagens.length, pdf: !!r.pdfs?.length, titulo: r.titulo, texto: r.texto, url: r.url, previa: previa && !previa.erro ? previa : undefined, respostas, pesquisar,
    contexto: anterior ? { titulo: anterior.titulo, autor: anterior.autor, resumo: anterior.resumo, transcricao: anterior.transcricao } : undefined }, pesquisar ? 175000 : 90000)
}

async function guardarImagens(r: Recebido, tipo: 'ideia' | 'referencia' | 'nota' | 'obra', id: string) {
  const { salvarArquivo } = await import('../db/files')
  return Promise.all(r.imagens.map((b, i) => salvarArquivo(new File([b], `recebido-${i + 1}.${(b.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg')}`, { type: b.type || 'image/jpeg' }), { tipo, id })))
}

/** A IA lê só as primeiras; todas as fotos do envio vão juntas para a mesma ficha. */
export const MAX_LEITURA = 4

const semAcento = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/^@/, '').replace(/[^a-z0-9]/g, '')

/** Acha o artista pelo nome ou @perfil; se não houver, cria um novo com o que foi lido. */
async function artistaDe(r: Recebido, l?: Leitura, previa?: Previa): Promise<Artista> {
  const nome = (l?.autor || r.titulo || previa?.titulo || '').trim()
  const chave = semAcento(nome)
  if (chave) {
    const achado = (await db.artistas.toArray()).find((a) => !a.excluido && [a.nome, a.nomeOriginal, a.instagram].some((x) => x && semAcento(x.replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/$/, '')) === chave))
    if (achado) return achado
  }
  const insta = ehInstagram(r.url) ? r.url : nome.startsWith('@') ? `https://www.instagram.com/${nome.slice(1)}/` : undefined
  const a = novo({
    nome: nome || 'Artista sem nome', pais: [], caracteristicas: [], processos: [], estudar: [], publicacoes: [], fontes: [], relacionados: [], tags: l?.tags ?? [],
    tecnicas: [], materiais: [], esmaltes: [], queimas: [], esteticas: [], tiposObra: [], origem: 'usuario',
    instagram: insta, site: r.url && !ehInstagram(r.url) ? r.url : undefined, links: r.url ? [r.url] : [],
    notas: [l?.resumo, l?.transcricao].filter(Boolean).map((p) => `<p>${escapar(p as string).replace(/\n/g, '<br>')}</p>`).join('') || undefined,
  }) as Artista
  await db.artistas.add(a)
  return a
}

const escapar = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Guarda no destino escolhido e devolve o caminho da página criada. */
export async function guardar(destino: Destino, r: Recebido, l?: Leitura, previa?: Previa): Promise<string> {
  const titulo = l?.titulo || r.titulo || previa?.titulo || ''
  const autor = l?.autor || undefined
  const fonte = fonteDe(r.url, previa?.site)
  const externa = !r.imagens.length && previa?.imagem ? previa.imagem : undefined
  // num PDF a IA não transcreve (o texto já foi tirado do arquivo, inteiro)
  const transcricao = l?.transcricao?.trim() || (r.pdfs?.length ? r.texto.trim() : undefined)
  const textoLivre = r.pdfs?.length ? '' : r.texto.replace(r.url ?? '', '').trim()
  let caminho: string
  if (destino === 'ideia') {
    const e = l?.esmalte
    const notas = [e?.notas?.trim(), transcricao && (r.pdfs?.length ? `Texto do PDF:\n${transcricao}` : `Texto do post: ${transcricao.replace(/\n+/g, ' ')}`), !l && textoLivre].filter(Boolean).join('\n\n') || undefined
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
  } else if (destino === 'artista') {
    const a = await artistaDe(r, l, previa)
    // cada foto vira uma obra do mesmo artista; sem fotos, a imagem do link
    const base = { artistaId: a.id, titulo: l?.titulo || undefined, fonte: r.url, credito: fonte, tags: l?.tags ?? [], notas: transcricao || undefined }
    const ids: string[] = []
    if (r.imagens.length) for (const _ of r.imagens) { const o = novo(base) as Obra; await db.obras.add(o); ids.push(o.id) }
    else if (externa) { const o = novo({ ...base, imagem: externa }) as Obra; await db.obras.add(o); ids.push(o.id) }
    const arqs = await Promise.all(r.imagens.map(async (b, i) => (await import('../db/files')).salvarArquivo(new File([b], `recebido-${i + 1}.jpg`, { type: b.type || 'image/jpeg' }), { tipo: 'obra', id: ids[i] })))
    for (let i = 0; i < arqs.length; i++) await db.obras.update(ids[i], { arquivo: arqs[i] })
    if (!a.capa && ids[0]) await db.artistas.update(a.id, { capa: ids[0], atualizadoEm: Date.now() })
    caminho = `/biblioteca/artistas/${a.id}`
  } else {
    const n = novo({
      titulo: titulo || undefined, imagens: [], arquivos: [], audios: [], tags: l?.tags ?? [], paleta: [], links: r.url ? [r.url] : [],
      corpo: [l?.resumo, transcricao, !l && textoLivre].filter(Boolean).map((p) => `<p>${escapar(p as string).replace(/\n/g, '<br>')}</p>`).join(''),
    })
    await db.notas.add(n)
    const imagens = await guardarImagens(r, 'nota', n.id)
    const { salvarArquivo } = await import('../db/files')
    const arquivos = await Promise.all((r.pdfs ?? []).map((p) => salvarArquivo(p, { tipo: 'nota', id: n.id })))
    if (imagens.length || arquivos.length) await db.notas.update(n.id, { imagens, arquivos })
    caminho = `/caderno/${n.id}`
  }
  await limparRecebido(r.id)
  return caminho
}
