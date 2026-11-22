// Pré-visualização de um link (título e imagem de destaque), como qualquer app faz ao colar um endereço.
// Lê só o começo da página pública, uma vez, quando a pessoa pede. Não guarda nada.
export const config = { runtime: 'edge' }
import { exigirLogin } from './_login.js'

const json = (dados, status = 200) => new Response(JSON.stringify(dados), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } })
const PRIVADO = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.|\[|::1|.*\.local$|.*\.internal$)/i
const meta = (html, chaves) => {
  for (const k of chaves) {
    const re1 = new RegExp(`<meta[^>]+(?:property|name)=["']${k}["'][^>]*content=["']([^"']+)["']`, 'i')
    const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${k}["']`, 'i')
    const m = html.match(re1) || html.match(re2)
    if (m) return m[1]
  }
  return ''
}
const limpar = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim().slice(0, 200)

export default async function handler(req) {
  const login = await exigirLogin(req); if (login.erro) return login.erro
  const u = new URL(req.url).searchParams.get('u') ?? ''
  let alvo
  try { alvo = new URL(u) } catch { return json({ erro: 'Link inválido' }, 400) }
  if (alvo.protocol !== 'https:' || PRIVADO.test(alvo.hostname) || /^\d+\.\d+\.\d+\.\d+$/.test(alvo.hostname)) return json({ erro: 'Use um link público https' }, 400)
  try {
    const r = await fetch(alvo, { redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 (compatible; MarDeLamaPreview/1.0)', accept: 'text/html' }, signal: AbortSignal.timeout(8000) })
    try { const fim = new URL(r.url || alvo.href); if (PRIVADO.test(fim.hostname) || /^\d+\.\d+\.\d+\.\d+$/.test(fim.hostname)) return json({ erro: 'Use um link público https' }, 400) } catch { /* segue */ }
    if (!r.ok) return json({ erro: `A página respondeu ${r.status}` }, 502)
    if (!(r.headers.get('content-type') ?? '').includes('html')) return json({ erro: 'O link não é uma página' }, 415)
    // só os primeiros 300 KB: os metadados ficam no cabeçalho
    const leitor = r.body.getReader(); const partes = []; let n = 0
    while (n < 300000) { const { done, value } = await leitor.read(); if (done) break; partes.push(value); n += value.length }
    leitor.cancel().catch(() => {})
    const tudo = new Uint8Array(n); let pos = 0; for (const p of partes) { tudo.set(p, pos); pos += p.length }
    const html = new TextDecoder().decode(tudo)
    const base = r.url || alvo.href
    const abs = (x) => { try { const v = new URL(x, base); return v.protocol === 'https:' ? v.href : '' } catch { return '' } }
    const imagem = abs(limpar(meta(html, ['og:image:secure_url', 'og:image', 'twitter:image', 'twitter:image:src'])))
    const titulo = limpar(meta(html, ['og:title', 'twitter:title']) || (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ?? ''))
    const site = limpar(meta(html, ['og:site_name'])) || new URL(base).hostname.replace(/^www\./, '')
    return json({ imagem, titulo, site })
  } catch {
    return json({ erro: 'Não consegui abrir a página' }, 502)
  }
}
