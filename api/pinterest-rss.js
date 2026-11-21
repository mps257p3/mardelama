// RSS público do Pinterest: cada pasta pública tem um feed oficial em pinterest.com/<perfil>/<pasta>.rss
// e cada perfil em pinterest.com/<perfil>/feed.rss. Aqui só lemos esse feed (o mesmo que qualquer leitor de RSS usa),
// sem login, sem raspar páginas, e devolvemos os pins já organizados para o app.
export const config = { runtime: 'edge' }

const json = (dados, status = 200, cache = 'no-store') => new Response(JSON.stringify(dados), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cache } })
const HOST = /^([a-z]{2,3}\.)?(www\.)?pinterest\.(com|[a-z]{2,3}|com\.[a-z]{2}|co\.[a-z]{2})$/i
const RESERVADOS = new Set(['pin', 'search', 'ideas', 'today', 'settings', 'business', 'categories', 'explore', 'videos', '_', 'oauth', 'resource'])

/** Converte o link que a pessoa colou no endereço do feed. Aceita pasta, perfil, .rss e pin.it (link curto). */
async function feedDe(entrada) {
  let u
  try { u = new URL(/^https?:\/\//i.test(entrada) ? entrada : 'https://' + entrada) } catch { return { erro: 'Link inválido.' } }
  if (u.hostname === 'pin.it') {
    try { const r = await fetch(u, { redirect: 'follow' }); u = new URL(r.url) } catch { return { erro: 'Não consegui abrir o link curto. Cole o link completo da pasta.' } }
  }
  if (!HOST.test(u.hostname)) return { erro: 'Cole um link do Pinterest (pasta ou perfil).' }
  const partes = u.pathname.replace(/\.rss$/i, '').split('/').filter(Boolean).map(decodeURIComponent)
  if (!partes.length || RESERVADOS.has(partes[0].toLowerCase())) return { erro: 'Esse link não é de uma pasta nem de um perfil. Abra a pasta no Pinterest e copie o endereço dela.' }
  const perfil = partes[0]
  const pasta = partes[1] && partes[1] !== 'feed' && !['_saved', '_created', 'pins'].includes(partes[1]) ? partes[1] : undefined
  const caminho = pasta ? `${encodeURIComponent(perfil)}/${encodeURIComponent(pasta)}.rss` : `${encodeURIComponent(perfil)}/feed.rss`
  return { feed: `https://www.pinterest.com/${caminho}`, perfil, pasta, pagina: `https://www.pinterest.com/${perfil}/${pasta ? pasta + '/' : ''}` }
}

const entidades = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }
const desfaz = (s = '') => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e) => {
  if (e[0] === '#') { const n = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return Number.isFinite(n) ? String.fromCodePoint(n) : m }
  return entidades[e.toLowerCase()] ?? m
})
const tag = (xml, nome) => { const m = xml.match(new RegExp(`<${nome}(?:\\s[^>]*)?>([\\s\\S]*?)</${nome}>`, 'i')); return m ? desfaz(m[1]).trim() : undefined }
const semHtml = (s = '') => desfaz(s.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ')).replace(/[ \t]+/g, ' ').replace(/\n\s*/g, '\n').trim()
/** O feed traz a miniatura pequena (236x); a mesma imagem existe em 736x. */
const maior = (src) => src?.replace(/\/(?:\d+x\d*|originals)\//, '/736x/')

export function lerFeed(xml) {
  const canal = xml.split(/<item[\s>]/i)[0]
  const itens = [...xml.matchAll(/<item[\s>][\s\S]*?<\/item>/gi)].map((m) => m[0])
  const pins = []
  for (const it of itens) {
    const link = tag(it, 'link') || tag(it, 'guid')
    const id = link?.match(/\/pin\/(\d+)/)?.[1]
    if (!id) continue
    const desc = tag(it, 'description') ?? ''
    const src = desc.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1]
    const texto = semHtml(desc)
    const titulo = tag(it, 'title')
    const data = Date.parse(tag(it, 'pubDate') ?? '')
    pins.push({ id, link: `https://www.pinterest.com/pin/${id}/`, titulo: titulo && titulo !== texto ? titulo : undefined, descricao: texto || undefined, imagem: maior(src), miniatura: src, data: Number.isFinite(data) ? data : undefined })
  }
  return { titulo: tag(canal, 'title'), descricao: semHtml(tag(canal, 'description') ?? '') || undefined, pins }
}

export default async function handler(req) {
  const entrada = new URL(req.url).searchParams.get('u')
  if (!entrada) return json({ erro: 'Falta o link.' }, 400)
  const f = await feedDe(entrada.trim())
  if (f.erro) return json({ erro: f.erro }, 400)
  let r
  try { r = await fetch(f.feed, { headers: { accept: 'application/rss+xml, application/xml;q=0.9, */*;q=0.5', 'user-agent': 'MarDeLama/1.0 (leitor de RSS pessoal)' } }) }
  catch { return json({ erro: 'O Pinterest não respondeu. Tente mais tarde.' }, 502) }
  if (r.status === 404) return json({ erro: f.pasta ? 'Pasta não encontrada. Ela precisa ser pública (pastas secretas não têm RSS).' : 'Perfil não encontrado.' }, 404)
  if (r.status === 429) return json({ erro: 'O Pinterest pediu uma pausa. Tente mais tarde.' }, 429)
  if (!r.ok) return json({ erro: `O Pinterest recusou o feed (HTTP ${r.status}).` }, 502)
  const xml = await r.text()
  if (!/<rss[\s>]|<channel[\s>]/i.test(xml)) return json({ erro: 'O Pinterest não devolveu um RSS para esse link.' }, 502)
  const feed = lerFeed(xml)
  return json({ ...feed, perfil: f.perfil, pasta: f.pasta, pagina: f.pagina, feed: f.feed }, 200, 'public, max-age=600, s-maxage=1800')
}
