// Ponte para acervos abertos que não aceitam pedidos direto do navegador (CORS).
// Só repassa GETs para os hosts da lista; nada de chaves aqui.
export const config = { runtime: 'edge' }

const PERMITIDOS = ['api.artic.edu', 'www.artic.edu', 'collectionapi.metmuseum.org', 'images.metmuseum.org', 'upload.wikimedia.org']

export default async function handler(req) {
  const u = new URL(req.url).searchParams.get('u')
  let alvo
  try { alvo = new URL(u || '') } catch { return new Response('URL inválida', { status: 400 }) }
  if (alvo.protocol !== 'https:' || !PERMITIDOS.includes(alvo.hostname)) return new Response('Host não permitido', { status: 403 })
  let r
  try {
    r = await fetch(alvo, { headers: { 'User-Agent': 'MarDeLama/1.0 (atelie pessoal)', 'AIC-User-Agent': 'MarDeLama/1.0 (atelie pessoal)', Accept: req.headers.get('accept') || '*/*' } })
  } catch (e) { return new Response('Fonte indisponível', { status: 502, headers: { 'access-control-allow-origin': '*' } }) }
  const h = new Headers()
  h.set('content-type', r.headers.get('content-type') || 'application/octet-stream')
  h.set('access-control-allow-origin', '*')
  h.set('cache-control', r.ok ? 'public, max-age=3600, s-maxage=86400' : 'no-store')
  return new Response(r.body, { status: r.status, headers: h })
}
