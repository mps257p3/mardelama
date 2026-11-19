import { db, novo, type Referencia } from '../db/schema'
import { lerPerfil, salvarPerfil } from './curadoria'

/**
 * Importação da exportação oficial do Instagram ("Baixar suas informações", formato JSON).
 * A exportação traz links, autores, legendas e coleções, mas não as imagens dos posts de outras pessoas.
 */

export interface PostSalvo { codigo: string; url: string; legenda: string; usuario?: string; nome?: string; salvoEm: number; colecoes: string[] }
export interface Seguido { usuario: string; desde: number }
export interface ExportacaoInstagram { posts: PostSalvo[]; colecoes: { nome: string; chave: string; n: number }[]; seguindo: Seguido[]; hashtags: string[] }

/** O Instagram grava UTF-8 como se fosse Latin-1 ("Ã£" no lugar de "ã"). */
export function conserta(s?: string) {
  if (!s) return ''
  try { return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from([...s].map((c) => c.charCodeAt(0) & 0xff))) } catch { return s }
}
const chaveColecao = (nome: string) => nome.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const codigoDe = (url: string) => url.match(/instagram\.com\/(?:p|reel|tv)\/([^/?#]+)/)?.[1]

type LV = { label?: string; value?: string; href?: string; title?: string; dict?: LV[]; timestamp_value?: number }

function lerPost(lv: LV[], ts: number): Omit<PostSalvo, 'colecoes'> | undefined {
  const campo = (rot: string) => lv.find((x) => conserta(x.label) === rot)
  const url = campo('URL')?.href ?? campo('URL')?.value
  const codigo = url && codigoDe(url)
  if (!url || !codigo) return
  const dono = lv.find((x) => x.title === 'Dono')?.dict?.[0]?.dict ?? []
  const doDono = (rot: string) => conserta(dono.find((x) => conserta(x.label) === rot)?.value)
  return { codigo, url, legenda: conserta(campo('Legenda')?.value), usuario: doDono('Nome de usuário') || undefined, nome: doDono('Nome') || undefined, salvoEm: ts * 1000 }
}

/** Lê os arquivos da pasta exportada (pode escolher a pasta inteira; os outros arquivos são ignorados). */
export async function lerExportacao(arquivos: File[]): Promise<ExportacaoInstagram> {
  const json = async (nome: string) => { const f = arquivos.find((a) => a.name === nome); return f ? JSON.parse(await f.text()) : undefined }
  const [salvos, colecoesJ, seguindoJ, tagsJ] = await Promise.all([json('saved_posts.json'), json('saved_collections.json'), json('following.json'), json('following_hashtags.json')])
  if (!salvos && !colecoesJ && !seguindoJ) throw new Error('Não encontrei os arquivos da exportação (saved_posts.json, saved_collections.json ou following.json).')

  const posts = new Map<string, PostSalvo>()
  for (const it of (Array.isArray(salvos) ? salvos : salvos?.saved_saved_media ?? []) as { timestamp: number; label_values: LV[] }[]) {
    const p = lerPost(it.label_values ?? [], it.timestamp); if (p && !posts.has(p.codigo)) posts.set(p.codigo, { ...p, colecoes: [] })
  }
  const colecoes = new Map<string, { nome: string; chave: string; n: number }>()
  for (const col of (Array.isArray(colecoesJ) ? colecoesJ : []) as { timestamp: number; label_values: LV[] }[]) {
    const lv = col.label_values ?? []
    const nome = conserta(lv.find((x) => conserta(x.label) === 'Nome')?.value).trim()
    if (!nome) continue
    const chave = chaveColecao(nome)
    const c = colecoes.get(chave) ?? { nome: nome[0].toUpperCase() + nome.slice(1), chave, n: 0 }
    for (const bloco of lv.filter((x) => x.dict && !x.label)) for (const d of bloco.dict ?? []) {
      const p = lerPost(d.dict ?? [], col.timestamp); if (!p) continue
      const ja = posts.get(p.codigo) ?? { ...p, colecoes: [] }
      if (!ja.colecoes.includes(chave)) { ja.colecoes.push(chave); c.n++ }
      posts.set(p.codigo, ja)
    }
    colecoes.set(chave, c)
  }
  const seguindo: Seguido[] = ((seguindoJ?.relationships_following ?? []) as { title?: string; string_list_data?: { value?: string; href?: string; timestamp?: number }[] }[])
    .map((s) => ({ usuario: s.title || s.string_list_data?.[0]?.value || s.string_list_data?.[0]?.href?.split('/').pop() || '', desde: (s.string_list_data?.[0]?.timestamp ?? 0) * 1000 }))
    .filter((s) => s.usuario)
  const hashtags = ((tagsJ?.relationships_following_hashtags ?? []) as { string_list_data?: { value?: string }[] }[]).map((h) => h.string_list_data?.[0]?.value ?? '').filter(Boolean)
  return { posts: [...posts.values()].sort((a, b) => b.salvoEm - a.salvoEm), colecoes: [...colecoes.values()].filter((c) => c.n > 0).sort((a, b) => b.n - a.n), seguindo, hashtags }
}

export const ehSalvoInstagram = (r: Referencia) => !!r.origem?.startsWith('instagram:')
/** Post do Instagram que ainda não ganhou imagem: fica na lista "Salvos do Instagram", fora do mural. */
export const pendenteInstagram = (r: Referencia) => ehSalvoInstagram(r) && !r.imagens.length && !r.imagemExterna

function tituloDe(p: PostSalvo) {
  const linha = p.legenda.split('\n').map((l) => l.replace(/#\S+/g, '').trim()).find((l) => l.length > 2) ?? ''
  const t = linha.length > 70 ? linha.slice(0, 68).replace(/\s+\S*$/, '') + '…' : linha
  return t || (p.usuario ? '@' + p.usuario : 'Post do Instagram')
}

export interface OpcoesImportacao { colecoes: string[]; semColecao: boolean; posts: boolean; seguindo: boolean; hashtags: boolean }

export async function importarInstagram(ex: ExportacaoInstagram, op: OpcoesImportacao) {
  const res = { posts: 0, atualizados: 0, grupos: 0, perfis: 0, hashtags: 0 }
  if (op.posts) {
    const grupos = (await db.grupos.toArray()).filter((g) => !g.excluido)
    const idDe = new Map<string, string>()
    for (const chave of op.colecoes) {
      const c = ex.colecoes.find((x) => x.chave === chave); if (!c) continue
      let g = grupos.find((x) => chaveColecao(x.nome) === chave)
      if (!g) { g = novo({ nome: c.nome, descricao: 'Coleção do Instagram' }); await db.grupos.add(g); res.grupos++ }
      idDe.set(chave, g.id)
    }
    const existentes = new Map((await db.referencias.filter((r) => ehSalvoInstagram(r)).toArray()).map((r) => [r.origem!, r]))
    const novos: Referencia[] = []
    for (const p of ex.posts) {
      const gs = p.colecoes.map((c) => idDe.get(c)).filter(Boolean) as string[]
      if (!gs.length && !(op.semColecao && !p.colecoes.length)) continue
      const origem = 'instagram:' + p.codigo
      const ja = existentes.get(origem)
      if (ja) {
        const juntos = [...new Set([...ja.grupos, ...gs])]
        if (ja.excluido || juntos.length === ja.grupos.length) continue
        await db.referencias.update(ja.id, { grupos: juntos, atualizadoEm: Date.now() }); res.atualizados++; continue
      }
      const tags = [...new Set((p.legenda.match(/#[\p{L}\p{N}_]+/gu) ?? []).map((t) => t.slice(1).toLowerCase()))].slice(0, 12)
      novos.push({
        ...novo({ titulo: tituloDe(p), tipo: 'Link', imagens: [], tags, grupos: gs }),
        autor: p.nome && p.usuario ? `${p.nome} (@${p.usuario})` : p.usuario ? '@' + p.usuario : undefined,
        fonte: 'Instagram', url: p.url, descricao: p.legenda || undefined, origem,
        criadoEm: p.salvoEm || Date.now(),
      })
    }
    await db.referencias.bulkAdd(novos); res.posts = novos.length
  }
  if (op.seguindo && ex.seguindo.length) {
    const atual = ((await db.ajustes.get('instagram.seguindo'))?.valor as Seguido[] | undefined) ?? []
    const m = new Map(atual.map((s) => [s.usuario, s])); ex.seguindo.forEach((s) => m.set(s.usuario, { ...m.get(s.usuario), ...s }))
    await db.ajustes.put({ chave: 'instagram.seguindo', valor: [...m.values()] }); res.perfis = ex.seguindo.length
  }
  if (op.hashtags && ex.hashtags.length) {
    const p = await lerPerfil()
    ex.hashtags.forEach((h) => { p.termos[h.toLowerCase()] = Math.max(p.termos[h.toLowerCase()] ?? 0, 1.5) })
    await salvarPerfil(p); res.hashtags = ex.hashtags.length
  }
  return res
}
