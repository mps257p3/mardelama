// Revistas e blogs de arte (Colossal, BOOOOOOOM!, Artaxis…) pelo RSS público de cada site.
// Só lemos o feed oficial (o mesmo de qualquer leitor de RSS). Nos sites WordPress, a busca também tem feed
// oficial (/?s=termo&feed=rss2). Devolvemos as imagens de cada post já organizadas para o Descobrir.
// Roda em Node: alguns desses sites barram a rede "edge" da Vercel.
export const config = { runtime: 'nodejs' }

import { SITES } from '../src/lib/revistasSites.js'

/** Busca nas revistas brasileiras: as consultas do app são em inglês. */
const PT = { ceramics: 'cerâmica', ceramic: 'cerâmica', 'ceramic sculpture': 'escultura cerâmica', clay: 'argila', porcelain: 'porcelana', stoneware: 'grés', glaze: 'esmalte', pottery: 'cerâmica', illustration: 'ilustração', illustrator: 'ilustrador', drawing: 'desenho', drawings: 'desenhos', sculpture: 'escultura', painting: 'pintura', paintings: 'pinturas', painter: 'pintor', installation: 'instalação', textile: 'têxtil', printmaking: 'gravura', photograph: 'fotografia', photography: 'fotografia', 'animal sculpture': 'escultura animal', 'contemporary art': 'arte contemporânea', exhibition: 'exposição', artist: 'artista', vessel: 'vaso', comics: 'quadrinhos', zine: 'zine' }
const JA = { ceramics: '陶芸', ceramic: '陶芸', 'ceramic sculpture': '陶芸 彫刻', clay: '土', porcelain: '磁器', stoneware: '炻器', glaze: '釉薬', pottery: 'やきもの', illustration: 'イラストレーション', illustrator: 'イラストレーター', drawing: 'ドローイング', drawings: 'ドローイング', sculpture: '彫刻', painting: '絵画', paintings: '絵画', painter: '画家', installation: 'インスタレーション', textile: 'テキスタイル', printmaking: '版画', photograph: '写真', photography: '写真', 'animal sculpture': '動物 彫刻', 'contemporary art': '現代アート', exhibition: '展覧会', artist: 'アーティスト', vessel: 'うつわ', comics: 'マンガ', design: 'デザイン', 'graphic design': 'グラフィックデザイン' }
const RECENTES = ['/feed/', '/rss', '/rss.xml', '/feed.xml', '/?format=feed&type=rss']
const json = (dados, status = 200, cache = 'no-store') => new Response(JSON.stringify(dados), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cache } })
const entidades = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', ndash: '–', mdash: '—', hellip: '…' }
const desfaz = (s = '') => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e) => {
  if (e[0] === '#') { const n = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return Number.isFinite(n) ? String.fromCodePoint(n) : m }
  return entidades[e.toLowerCase()] ?? m
})
const tag = (xml, nome) => { const m = xml.match(new RegExp(`<${nome}(?:\\s[^>]*)?>([\\s\\S]*?)</${nome}>`, 'i')); return m ? desfaz(m[1]).trim() : undefined }
const tags = (xml, nome) => [...xml.matchAll(new RegExp(`<${nome}(?:\\s[^>]*)?>([\\s\\S]*?)</${nome}>`, 'gi'))].map((m) => desfaz(m[1]).trim())
const semHtml = (s = '') => desfaz(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()

/** Imagem de obra: jpg/png/webp, sem avatar, ícone, emoji, contador ou banner de anúncio. */
const LIXO = /gravatar|avatar|emoji|feedburner|pixel|tracking|logo|icon|badge|banner|advert|\/ads?\/|spacer|1x1|share|button|placeholder|wp-includes/i
const ehImagem = (u) => /^https:\/\//.test(u) && /\.(jpe?g|png|webp)(\?|$)/i.test(u) && !LIXO.test(u)
/** WordPress guarda versões menores (-300x200.jpg); a original é a mesma sem o sufixo. */
const original = (u) => u.replace(/-\d{2,4}x\d{2,4}(\.(jpe?g|png|webp))/i, '$1').replace(/([?&])(w|resize|fit)=[^&]+/g, '$1').replace(/[?&]$/, '')

function lerItens(xml, site, maxPorPost) {
  const itens = [...xml.matchAll(/<item[\s>][\s\S]*?<\/item>/gi)].map((m) => m[0])
  const out = []
  for (const it of itens) {
    const link = tag(it, 'link') || tag(it, 'guid')
    if (!link) continue
    const titulo = semHtml(tag(it, 'title') ?? '')
    const corpo = (tag(it, 'content:encoded') ?? '') + ' ' + (tag(it, 'description') ?? '')
    const imgs = []
    for (const m of it.matchAll(/<(?:media:content|media:thumbnail|enclosure)[^>]+url=["']([^"']+)["']/gi)) imgs.push(desfaz(m[1]))
    for (const m of corpo.matchAll(/<img[^>]+?(?:data-orig-file|data-large-file|data-src|src)=["']([^"']+)["']/gi)) imgs.push(desfaz(m[1]))
    const vistas = new Set(); const boas = []
    for (const u of imgs) { if (!ehImagem(u)) continue; const o = original(u); const k = o.replace(/^https:\/\/i\d\.wp\.com\//, 'https://'); if (vistas.has(k)) continue; vistas.add(k); boas.push({ grande: o, mini: u }) }
    if (!boas.length) continue
    const data = Date.parse(tag(it, 'pubDate') ?? tag(it, 'dc:date') ?? '')
    const categorias = tags(it, 'category').slice(0, 8)
    boas.slice(0, maxPorPost).forEach((b, k) => out.push({ link, titulo, k, imagem: b.mini, imagemGrande: b.grande, data: Number.isFinite(data) ? new Date(data).toISOString().slice(0, 10) : undefined, termos: [site.grupo, ...categorias] }))
  }
  return out
}

async function baixar(u) {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), 6000)
  try {
    const r = await fetch(u, { signal: c.signal, redirect: 'follow', headers: { accept: 'application/rss+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.5', 'user-agent': 'MarDeLama/1.0 (leitor de RSS pessoal)' } })
    if (!r.ok) return { erro: `HTTP ${r.status}` }
    const xml = await r.text()
    if (!/<rss[\s>]|<channel[\s>]/i.test(xml)) return { erro: 'não é RSS' }
    return { xml }
  } catch (e) { return { erro: e.name === 'AbortError' ? 'demorou demais' : 'não respondeu' } } finally { clearTimeout(t) }
}

export async function GET(request) {
  const p = new URL(request.url).searchParams
  const id = p.get('s') ?? ''
  const site = Object.hasOwn(SITES, id) ? SITES[id] : undefined
  if (!site) return json({ erro: 'Site desconhecido.' }, 400)
  const q0 = (p.get('q') ?? '').trim().slice(0, 80)
  const dic = site.lingua === 'pt' ? PT : site.lingua === 'ja' ? JA : undefined
  const q = dic ? (dic[q0.toLowerCase()] ?? q0) : q0
  const pagina = Math.max(1, Math.min(20, Number(p.get('p')) || 1))
  const pg = pagina > 1 ? `&paged=${pagina}` : ''
  const comPagina = (u) => u + (pagina > 1 ? (u.includes('?') ? '&' : '?') + `paged=${pagina}` : '')
  const recentes = (site.recentes ?? RECENTES.map((c) => site.base + c)).map(comPagina)
  const busca = q ? [`${site.base}/?s=${encodeURIComponent(q)}&feed=rss2${pg}`, `${site.base}/search/${encodeURIComponent(q)}/feed/rss2/${pagina > 1 ? `?paged=${pagina}` : ''}`] : []
  const erros = []
  const ok = (itens) => json({ site: site.nome, itens }, 200, 'public, max-age=1800, s-maxage=21600')
  for (const u of busca) {
    const r = await baixar(u)
    if (r.erro) { erros.push(r.erro); continue }
    return ok(lerItens(r.xml, site, 3))
  }
  // site sem busca por RSS: usa o feed de novidades; o que citar a consulta vem primeiro, senão as 4 mais recentes
  for (const u of recentes) {
    const r = await baixar(u)
    if (r.erro) { erros.push(r.erro); continue }
    const itens = lerItens(r.xml, site, q ? 3 : 4)
    if (!q) return ok(itens)
    const palavras = q.toLowerCase().split(/\s+/).filter((w) => w.length > (site.lingua === 'ja' ? 1 : 3))
    const cita = itens.filter((x) => palavras.some((w) => (x.titulo + ' ' + x.termos.join(' ')).toLowerCase().includes(w)))
    return ok(cita.length ? cita : itens.slice(0, 4))
  }
  return json({ erro: `${site.nome}: ${erros[0] ?? 'sem feed'}` }, 502, 'public, max-age=300, s-maxage=1800')
}
