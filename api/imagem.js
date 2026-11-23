// Busca uma imagem pública que o navegador não conseguiu abrir direto (ex.: sites que só mostram
// a imagem dentro das próprias páginas). Uma vez por imagem: o app guarda a cópia no aparelho.
// Só para quem está logado, só imagens, só endereços públicos https. User-Agent honesto.
export const config = { runtime: 'edge' }
import { exigirLogin } from './_login.js'

const PRIVADO = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.|\[|::1|.*\.local$|.*\.internal$)/i
const MAX = 15 * 1024 * 1024
const publico = (h) => !PRIVADO.test(h) && !/^\d+\.\d+\.\d+\.\d+$/.test(h)

export default async function handler(req) {
  const login = await exigirLogin(req); if (login.erro) return login.erro
  let alvo
  try { alvo = new URL(new URL(req.url).searchParams.get('u') ?? '') } catch { return new Response('URL inválida', { status: 400 }) }
  if (alvo.protocol !== 'https:' || !publico(alvo.hostname)) return new Response('Use um endereço público https', { status: 400 })
  let r
  try {
    r = await fetch(alvo, { redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 (compatible; MarDeLama/1.0; atelie pessoal)', accept: 'image/avif,image/webp,image/*;q=0.8' }, signal: AbortSignal.timeout(12000) })
  } catch { return new Response('A fonte não respondeu', { status: 502 }) }
  try { if (!publico(new URL(r.url || alvo.href).hostname)) return new Response('Endereço não permitido', { status: 400 }) } catch { /* segue */ }
  const tipo = r.headers.get('content-type') || ''
  if (!r.ok) return new Response(`A fonte respondeu ${r.status}`, { status: 502 })
  if (!tipo.startsWith('image/')) return new Response('Não é uma imagem', { status: 415 })
  if (Number(r.headers.get('content-length') || 0) > MAX) return new Response('Imagem grande demais', { status: 413 })
  return new Response(r.body, { status: 200, headers: { 'content-type': tipo, 'cache-control': 'private, max-age=86400' } })
}
