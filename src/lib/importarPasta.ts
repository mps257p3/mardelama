import { db, novo } from '../db/schema'
import { salvarArquivo } from '../db/files'
import { extrairPaleta } from './paleta'

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
const IMAGEM = /\.(jpe?g|png|webp|gif|heic|heif|avif)$/i

async function impressao(f: File) {
  try {
    const h = await crypto.subtle.digest('SHA-1', await f.arrayBuffer())
    return 'sha1:' + Array.from(new Uint8Array(h), (b) => b.toString(16).padStart(2, '0')).join('')
  } catch { return undefined }
}

/**
 * Importa uma pasta de imagens como referências. Cada subpasta vira um grupo
 * (subpastas aninhadas viram grupos também). Se a pasta escolhida não tem subpastas,
 * o próprio nome dela vira o grupo. Imagens idênticas (mesmo conteúdo) entram uma vez só;
 * se aparecerem em outra pasta, a referência existente ganha o grupo dessa pasta.
 */
export async function importarPasta(files: File[], progresso: (feitos: number, total: number) => void) {
  const imgs = files.filter((f) => IMAGEM.test(f.name) && !f.name.startsWith('.'))
  const refs = (await db.referencias.toArray()).filter((r) => !r.excluido && r.origem)
  const ja = new Map(refs.map((r) => [r.origem!, r.id]))
  const caminhoDe = (f: File) => (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name
  const semSubpastas = imgs.every((f) => caminhoDe(f).split('/').length <= 2)
  const grupos = (await db.grupos.toArray()).filter((g) => !g.excluido)
  const grupoId = async (nome: string) => {
    let g = grupos.find((x) => norm(x.nome) === norm(nome))
    if (!g) { g = novo({ nome }); await db.grupos.add(g); grupos.push(g) }
    return g.id
  }
  let novos = 0, repetidos = 0, falhas = 0
  for (let k = 0; k < imgs.length; k++) {
    const f = imgs[k]
    const partes = caminhoDe(f).split('/')
    // a pasta raiz escolhida só vira grupo quando não há subpastas
    const pastas = semSubpastas ? partes.slice(0, -1) : partes.slice(1, -1)
    const antiga = partes.slice(1).join('/') + '|' + f.size
    const origem = (await impressao(f)) ?? antiga
    const existente = ja.get(origem) ?? ja.get(antiga)
    if (existente) {
      const ids = []
      for (const p of pastas) ids.push(await grupoId(p))
      const r = await db.referencias.get(existente)
      if (r && ids.some((g) => !r.grupos.includes(g))) await db.referencias.update(r.id, { grupos: [...new Set([...r.grupos, ...ids])], atualizadoEm: Date.now() })
      repetidos++; progresso(k + 1, imgs.length); continue
    }
    if (!f.size) { falhas++; progresso(k + 1, imgs.length); continue }
    let imagem: string
    try { imagem = await salvarArquivo(f, { tipo: 'referencia', id: 'importacao' }) } catch { falhas++; progresso(k + 1, imgs.length); continue }
    let paleta: string[] | undefined
    try { const a = await db.arquivos.get(imagem); if (a) paleta = await extrairPaleta(a.blob, 5) } catch { /* sem paleta */ }
    const ids = []
    for (const p of pastas) ids.push(await grupoId(p))
    const ref = novo({
      titulo: f.name.replace(/\.[^.]+$/, '').replace(/_+/g, ' ').replace(/\s+/g, ' ').trim(), tipo: 'Fotografia', imagens: [imagem], tags: [], grupos: ids, paleta, origem,
    })
    await db.referencias.add(ref)
    ja.set(origem, ref.id); novos++
    progresso(k + 1, imgs.length)
  }
  return { novos, repetidos, falhas, ignorados: files.length - imgs.length }
}
