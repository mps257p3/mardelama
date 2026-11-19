import { db, novo, type Referencia } from '../db/schema'
import { lerPerfil, salvarPerfil, traduz } from './curadoria'

/**
 * Importação da exportação oficial do Pinterest (Configurações › Privacidade e dados › Solicitar seus dados).
 * Vem em HTML: pins/0001.html traz cada pin com pasta, descrição, link original e o código da imagem.
 */

export interface Pin { id: string; url: string; pasta: string; detalhes?: string; titulo?: string; imagem?: string; original?: string; video: boolean; criadoEm: number }
export interface ExportacaoPinterest { pins: Pin[]; pastas: { nome: string; chave: string; n: number }[]; buscas: string[] }

const texto = (html: string) => {
  const sem = html.replace(/<(style|script)[\s\S]*?<\/\1>/gi, '').replace(/<[^>]+>/g, '\n')
  const t = document.createElement('textarea'); t.innerHTML = sem; return t.value
}
const campo = (b: string, rot: string) => {
  const v = b.match(new RegExp(rot + ':\\s*([^\\n]*(?:\\n\\s*https?://\\S+)?)'))?.[1].trim()
  return v && v !== 'No data' ? v : undefined
}
export const chavePasta = (nome: string) => nome.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
/** Endereço público da miniatura no Pinterest, montado a partir do código que vem na exportação. */
export const imagemDoPin = (h: string) => `https://i.pinimg.com/736x/${h.slice(0, 2)}/${h.slice(2, 4)}/${h.slice(4, 6)}/${h}.jpg`

export async function lerExportacaoPinterest(arquivos: File[]): Promise<ExportacaoPinterest> {
  const achar = (pasta: string) => arquivos.find((f) => (f.webkitRelativePath || f.name).replace(/\\/g, '/').includes(pasta + '/') || f.name === pasta + '.html')
  const fPins = achar('pins') ?? arquivos.find((f) => /pins/i.test(f.name))
  if (!fPins) throw new Error('Não encontrei pins/0001.html na pasta escolhida.')
  const t = texto(await fPins.text())
  const blocos = t.split(/\n\s*(?=https:\/\/(?:[a-z]+\.)?pinterest\.[a-z.]+\/pin\/)/).slice(1)
  const pins: Pin[] = []
  const vistos = new Set<string>()
  for (const b of blocos) {
    const url = b.match(/^https:\/\/\S+\/pin\/\d+\/?/)?.[0]
    const id = url?.match(/\/pin\/(\d+)/)?.[1]
    if (!url || !id || vistos.has(id) || /Alive:\s*No/.test(b)) continue
    vistos.add(id)
    const h = campo(b, 'Image')?.match(/^[0-9a-f]{32}$/)?.[0]
    const original = campo(b, 'Canonical Link')?.match(/https?:\/\/\S+/)?.[0]
    const data = campo(b, 'Created at')?.replace(/\//g, '-').replace(' ', 'T')
    pins.push({ id, url, pasta: campo(b, 'Board Name') ?? 'Sem pasta', titulo: campo(b, 'Title'), detalhes: campo(b, 'Details'), imagem: h, original, video: /Is Video:\s*Yes/.test(b), criadoEm: data ? Date.parse(data + 'Z') || Date.now() : Date.now() })
  }
  const pastas = new Map<string, { nome: string; chave: string; n: number }>()
  pins.forEach((p) => { const k = chavePasta(p.pasta); const c = pastas.get(k) ?? { nome: p.pasta.trim()[0].toUpperCase() + p.pasta.trim().slice(1), chave: k, n: 0 }; c.n++; pastas.set(k, c) })
  const fBuscas = achar('search_history')
  const buscas = fBuscas ? [...new Set([...texto(await fBuscas.text()).matchAll(/Query:\s*([^\n]+)/g)].map((m) => m[1].trim().toLowerCase()))] : []
  return { pins: pins.sort((a, b) => b.criadoEm - a.criadoEm), pastas: [...pastas.values()].sort((a, b) => b.n - a.n), buscas }
}

export const ehPin = (r: Referencia) => !!r.origem?.startsWith('pinterest:')

export async function importarPinterest(ex: ExportacaoPinterest, op: { pastas: string[]; buscas: boolean }) {
  const res = { pins: 0, grupos: 0, atualizados: 0, buscas: 0 }
  const grupos = (await db.grupos.toArray()).filter((g) => !g.excluido)
  const idDe = new Map<string, string>()
  for (const k of op.pastas) {
    const c = ex.pastas.find((x) => x.chave === k); if (!c) continue
    let g = grupos.find((x) => chavePasta(x.nome) === k)
    if (!g) { g = novo({ nome: c.nome, descricao: 'Pasta do Pinterest' }); await db.grupos.add(g); grupos.push(g); res.grupos++ }
    idDe.set(k, g.id)
  }
  const existentes = new Map((await db.referencias.filter(ehPin).toArray()).map((r) => [r.origem!, r]))
  const novos: Referencia[] = []
  for (const p of ex.pins) {
    const g = idDe.get(chavePasta(p.pasta)); if (!g) continue
    const origem = 'pinterest:' + p.id
    const ja = existentes.get(origem)
    if (ja) {
      if (!ja.excluido && !ja.grupos.includes(g)) { await db.referencias.update(ja.id, { grupos: [...ja.grupos, g], atualizadoEm: Date.now() }); res.atualizados++ }
      continue
    }
    const nome = p.titulo ?? p.detalhes
    let site: string | undefined
    try { site = p.original ? new URL(p.original).hostname.replace(/^www\./, '') : undefined } catch { /* link estranho */ }
    novos.push({
      ...novo({ titulo: (nome ?? p.pasta).slice(0, 120), tipo: p.video ? 'Vídeo' : 'Fotografia', imagens: [], tags: [], grupos: [g] }),
      fonte: 'Pinterest' + (site ? ' · ' + site : ''), url: p.original ?? p.url,
      descricao: [p.detalhes && p.detalhes !== nome ? p.detalhes : '', `Pin: ${p.url}`].filter(Boolean).join('\n'),
      imagemExterna: p.imagem ? imagemDoPin(p.imagem) : undefined, origem, criadoEm: p.criadoEm,
    })
  }
  await db.referencias.bulkAdd(novos); res.pins = novos.length
  if (op.buscas && ex.buscas.length) {
    const perfil = await lerPerfil()
    ex.buscas.forEach((b) => { const k = traduz(b); if (k.length > 2) perfil.termos[k] = Math.max(perfil.termos[k] ?? 0, 1) })
    await salvarPerfil(perfil); res.buscas = ex.buscas.length
  }
  return res
}
