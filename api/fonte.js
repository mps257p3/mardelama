// Ponte para acervos abertos que não aceitam pedidos direto do navegador (CORS).
// Só repassa GETs para os hosts da lista; nada de chaves aqui.
export const config = { runtime: 'edge' }

const PERMITIDOS = ['api.artic.edu', 'www.artic.edu', 'collectionapi.metmuseum.org', 'images.metmuseum.org', 'openaccess-cdn.clevelandart.org', 'api.europeana.eu', 'api.si.edu', 'ids.si.edu', 'search.artsmia.org', 'upload.wikimedia.org', 'www.loc.gov', 'tile.loc.gov']

export default async function handler(req) {
  const u = new URL(req.url).searchParams.get('u')
  let alvo
  try { alvo = new URL(u || '') } catch { return new Response('URL inválida', { status: 400 }) }
  // imagens que a API oficial do Instagram devolveu (CDN da Meta, endereços variam por região)
  const daMia = /^[0-9]\.api\.artsmia\.org$/.test(alvo.hostname)
  const daMeta = /\.(cdninstagram\.com|fbcdn\.net)$/.test(alvo.hostname)
  if (alvo.protocol !== 'https:' || !(PERMITIDOS.includes(alvo.hostname) || daMeta || daMia)) return new Response('Host não permitido', { status: 403 })
  // Europeana: a chave gratuita fica só na Vercel (variável EUROPEANA_KEY) e entra aqui
  if (alvo.hostname === 'api.europeana.eu') {
    const chave = process.env.EUROPEANA_KEY
    if (!chave) return new Response('Falta a chave da Europeana na Vercel', { status: 503, headers: { 'access-control-allow-origin': '*' } })
    alvo.searchParams.set('wskey', chave.trim())
  }
  // Smithsonian: chave gratuita do api.data.gov na variável SMITHSONIAN_KEY (sem ela, a chave pública de demonstração, bem limitada)
  // só os 40 caracteres da chave: espaços, aspas ou texto colado junto fazem o firewall do Smithsonian recusar o pedido
  if (alvo.hostname === 'api.si.edu') alvo.searchParams.set('api_key', (process.env.SMITHSONIAN_KEY || '').match(/[A-Za-z0-9]{40}/)?.[0] || 'DEMO_KEY')
  let r
  try {
    r = await fetch(alvo, { headers: { 'User-Agent': 'MarDeLama/1.0 (atelie pessoal)', 'AIC-User-Agent': 'MarDeLama/1.0 (atelie pessoal)', Accept: req.headers.get('accept') || '*/*' } })
  } catch { return new Response('Fonte indisponível', { status: 502, headers: { 'access-control-allow-origin': '*' } }) }
  const h = new Headers()
  // as imagens do Mia chegam sem tipo; sem ele o app não aceita salvar
  h.set('content-type', r.headers.get('content-type') || (daMia ? 'image/jpeg' : 'application/octet-stream'))
  h.set('access-control-allow-origin', '*')
  h.set('cache-control', r.ok ? 'public, max-age=3600, s-maxage=86400' : 'no-store')
  return new Response(r.body, { status: r.status, headers: h })
}
