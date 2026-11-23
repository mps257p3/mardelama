import Dexie, { type Table } from 'dexie'
import { db } from '../db/schema'
import { viaPonte } from './fontes'
import { cabecalhoLogin } from './login'

/**
 * Semelhança visual: um modelo de visão (MobileCLIP, roda no próprio aparelho, sem custo de IA)
 * transforma cada imagem numa "impressão digital" de 512 números. Imagens parecidas na forma,
 * textura, cor e gesto têm impressões próximas. O modelo baixa uma vez (fica no cache do navegador)
 * e as impressões ficam guardadas no aparelho, então cada imagem é lida uma vez só.
 */

const MODELO = 'Xenova/mobileclip_s0'

interface Vetor { chave: string; v: Float32Array; quando: number }
class BaseVisao extends Dexie {
  vetores!: Table<Vetor, string>
  constructor() { super('mardelama-visao'); this.version(1).stores({ vetores: 'chave, quando' }) }
}
const dbv = new BaseVisao()

/* ---------- estado do modelo (para a tela mostrar o download) ---------- */
export type EstadoVisao = { fase: 'parado' | 'baixando' | 'pronto' | 'erro'; progresso?: number; erro?: string }
let estado: EstadoVisao = { fase: 'parado' }
const ouvintes = new Set<(e: EstadoVisao) => void>()
const mudar = (e: EstadoVisao) => { estado = e; ouvintes.forEach((f) => f(e)) }
export const estadoVisao = () => estado
export function ouvirVisao(f: (e: EstadoVisao) => void) { ouvintes.add(f); return () => { ouvintes.delete(f) } }

type Motor = { proc: (img: unknown) => Promise<unknown>; modelo: (x: unknown) => Promise<{ image_embeds: { normalize: () => { data: Float32Array } } }>; RawImage: { fromBlob: (b: Blob) => Promise<unknown> } }
let carga: Promise<Motor> | undefined

/** Carrega o modelo (na primeira vez baixa uns 12 MB e guarda no cache do navegador). */
export function carregarModelo(): Promise<Motor> {
  if (carga) return carga
  const arquivos = new Map<string, { loaded: number; total: number }>()
  mudar({ fase: 'baixando', progresso: 0 })
  carga = (async () => {
    const t = await import('@huggingface/transformers')
    t.env.allowLocalModels = false
    const aoProgresso = (p: { status: string; file?: string; loaded?: number; total?: number }) => {
      if (p.status !== 'progress' || !p.file || !p.total) return
      arquivos.set(p.file, { loaded: p.loaded ?? 0, total: p.total })
      let l = 0, tt = 0; for (const a of arquivos.values()) { l += a.loaded; tt += a.total }
      mudar({ fase: 'baixando', progresso: tt ? l / tt : 0 })
    }
    const [proc, modelo] = await Promise.all([
      t.AutoProcessor.from_pretrained(MODELO, { progress_callback: aoProgresso }),
      t.CLIPVisionModelWithProjection.from_pretrained(MODELO, { dtype: 'q8', device: 'wasm', progress_callback: aoProgresso }),
    ])
    mudar({ fase: 'pronto' })
    return { proc: proc as unknown as Motor['proc'], modelo: modelo as unknown as Motor['modelo'], RawImage: t.RawImage as unknown as Motor['RawImage'] }
  })()
  carga.catch((e) => { carga = undefined; mudar({ fase: 'erro', erro: (e as Error).message }) })
  return carga
}

/* ---------- de onde vem a imagem ---------- */
export interface Imagem { chave: string; url?: string; arquivo?: string }
export const imagemDeUrl = (url: string): Imagem => ({ chave: url, url })
export const imagemDeArquivo = (id: string): Imagem => ({ chave: 'arq:' + id, arquivo: id })

async function baixar(url: string, init?: RequestInit) {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), 15000)
  try {
    const r = await fetch(url, { ...init, signal: c.signal })
    const b = r.ok ? await r.blob() : undefined
    return b && b.type.startsWith('image/') && b.size > 500 ? b : undefined
  } catch { return undefined } finally { clearTimeout(t) }
}
async function blobDe(img: Imagem): Promise<Blob | undefined> {
  if (img.arquivo) return (await db.arquivos.get(img.arquivo))?.blob
  if (!img.url) return
  if (img.url.startsWith('blob:') || img.url.startsWith('data:')) return baixar(img.url)
  // primeiro direto (museus abertos); se o site não deixa, o servidor do app busca
  return (await baixar(viaPonte(img.url))) ?? (await baixar('/api/imagem?u=' + encodeURIComponent(img.url), { headers: await cabecalhoLogin() }))
}

/* ---------- leitura das imagens, uma de cada vez ---------- */
let fila: Promise<unknown> = Promise.resolve()
const naFila = <T,>(f: () => Promise<T>) => { const p = fila.then(f, f); fila = p.catch(() => undefined); return p }
const emCurso = new Map<string, Promise<Float32Array | undefined>>()
const memoria = new Map<string, Float32Array | null>()

/** Impressão digital da imagem (guardada no aparelho). `undefined` quando a imagem não abre. */
export function vetorDe(img: Imagem): Promise<Float32Array | undefined> {
  const m = memoria.get(img.chave)
  if (m !== undefined) return Promise.resolve(m ?? undefined)
  let p = emCurso.get(img.chave)
  if (p) return p
  p = (async () => {
    const guardado = await dbv.vetores.get(img.chave).catch(() => undefined)
    if (guardado) return guardado.v
    const motor = await carregarModelo()
    const blob = await blobDe(img)
    if (!blob) return undefined
    return naFila(async () => {
      const im = await motor.RawImage.fromBlob(blob)
      const { image_embeds } = await motor.modelo(await motor.proc(im))
      const v = new Float32Array(image_embeds.normalize().data)
      await dbv.vetores.put({ chave: img.chave, v, quando: Date.now() }).catch(() => undefined)
      return v
    })
  })().then(
    // a imagem não abriu: não tenta de novo nesta sessão
    (v) => { memoria.set(img.chave, v ?? null); return v },
    // o modelo não carregou (sem internet?): pode tentar de novo depois
    () => undefined,
  ).finally(() => emCurso.delete(img.chave))
  emCurso.set(img.chave, p)
  return p
}

/** Impressões de várias imagens (as que não abrem ficam de fora). */
export async function vetoresDe(imgs: Imagem[]) {
  return (await Promise.all(imgs.map(vetorDe))).filter((v): v is Float32Array => !!v)
}

/* ---------- comparação ---------- */
export function semelhanca(a: Float32Array, b: Float32Array) { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s }

/** Quanto a imagem se parece com um conjunto: média das 3 mais parecidas (vale para gostos variados). */
export function notaContra(v: Float32Array, refs: Float32Array[], k = 3) {
  if (!refs.length) return 0
  const s = refs.map((r) => semelhanca(v, r)).sort((a, b) => b - a)
  const n = Math.min(k, s.length)
  return s.slice(0, n).reduce((a, b) => a + b, 0) / n
}

/**
 * Abaixo de quanto uma imagem "não tem nada a ver" com o conjunto. Mede o quanto as imagens do
 * próprio conjunto se parecem entre si e dá uma folga; fica sempre entre 0,3 e 0,6.
 */
export function limiarDo(refs: Float32Array[]) {
  if (refs.length < 2) return 0.45
  const vizinho = refs.map((r, i) => Math.max(...refs.filter((_, j) => j !== i).map((o) => semelhanca(r, o)))).sort((a, b) => a - b)
  const mediana = vizinho[Math.floor(vizinho.length / 2)]
  return Math.max(0.3, Math.min(0.6, mediana - 0.2))
}

/* ---------- conjuntos de referência ---------- */
const imagemDaObra = (o: { arquivo?: string; imagem?: string }) => (o.arquivo ? imagemDeArquivo(o.arquivo) : o.imagem ? imagemDeUrl(o.imagem) : undefined)

/** As obras de um artista dos estudos, pelo nome (como aparece no Descobrir). */
export async function imagensDoArtista(nome: string): Promise<Imagem[]> {
  const a = (await db.artistas.where('nome').equals(nome).toArray()).find((x) => !x.excluido)
  if (!a) return []
  const obras = (await db.obras.where('artistaId').equals(a.id).toArray()).filter((o) => !o.excluido)
  return obras.map(imagemDaObra).filter((x): x is Imagem => !!x).slice(0, 24)
}

/** Imagem principal de uma referência do acervo. */
export function imagemDaRef(r: { imagens: string[]; imagemExterna?: string }) {
  return r.imagens[0] ? imagemDeArquivo(r.imagens[0]) : r.imagemExterna ? imagemDeUrl(r.imagemExterna) : undefined
}

/** O seu olhar: referências do acervo, obras dos estudos e curtidas do Descobrir (as mais recentes primeiro). */
export async function imagensDoGosto(limite = 160): Promise<Imagem[]> {
  const [refs, obras, perfil] = await Promise.all([
    db.referencias.toArray(), db.obras.toArray(),
    db.ajustes.get('descobrir.perfil').then((x) => x?.valor as { curtidasItens?: { imagem: string }[] } | undefined).catch(() => undefined),
  ])
  const r = refs.filter((x) => !x.excluido).sort((a, b) => b.atualizadoEm - a.atualizadoEm).map(imagemDaRef)
  const o = obras.filter((x) => !x.excluido && x.favorito).concat(obras.filter((x) => !x.excluido && !x.favorito)).map(imagemDaObra)
  const c = [...(perfil?.curtidasItens ?? [])].reverse().map((x) => imagemDeUrl(x.imagem))
  // um pouco de cada fonte, alternando, para nenhuma dominar
  const fontes = [r, o, c].map((xs) => xs.filter((x): x is Imagem => !!x))
  const saida: Imagem[] = [], vistas = new Set<string>()
  for (let i = 0; saida.length < limite && fontes.some((f) => i < f.length); i++) for (const f of fontes) { const x = f[i]; if (x && !vistas.has(x.chave) && saida.length < limite) { vistas.add(x.chave); saida.push(x) } }
  return saida
}
