// National Gallery of Art (Washington) — acervo de acesso aberto.
// A NGA não tem API de busca: publica os dados do acervo em CSV (CC0) no GitHub e as imagens por IIIF (api.nga.gov).
// Guardamos aqui um índice compacto desses dados (api/_dados/nga.tsv.gz, ~62 mil obras com imagem aberta,
// refeito por scripts/nga-indice.py) e fazemos a busca no servidor. As imagens vêm direto do IIIF oficial.
export const config = { runtime: 'nodejs' }

import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'

const TIPO = { p: 'print', i: 'index of american design', d: 'drawing', s: 'sculpture', t: 'painting', f: 'photograph', a: 'decorative art' }
/** Termos extras por tipo: ajudam os temas (Ilustradores = desenho/gravura) a reconhecer a obra. */
const TIPO_TERMOS = { p: ['print', 'printmaking'], i: ['drawing', 'watercolor', 'folk art', 'american design'], d: ['drawing'], s: ['sculpture'], t: ['painting'], f: ['photograph'], a: ['decorative art'] }
/** Palavras da consulta que, no acervo, aparecem com outros nomes (técnica e material). */
const SINONIMOS = {
  ceramic: ['ceramic', 'earthenware', 'stoneware', 'porcelain', 'terracotta', 'terra cotta', 'faience', 'maiolica', 'majolica', 'pottery', 'glazed', 'slip', 'redware', 'creamware', 'delft'],
  pottery: ['pottery', 'earthenware', 'stoneware', 'redware', 'ceramic', 'jug', 'crock', 'jar'],
  clay: ['clay', 'terracotta', 'terra cotta', 'earthenware'],
  glaze: ['glaze', 'glazed', 'enamel'],
  vessel: ['vessel', 'vase', 'jar', 'bowl', 'jug', 'pitcher', 'ewer', 'pot', 'urn'],
  illustration: ['illustration', 'drawing', 'print', 'woodcut', 'etching', 'lithograph', 'engraving'],
  printmaking: ['print', 'woodcut', 'etching', 'lithograph', 'engraving', 'screenprint', 'aquatint', 'linocut'],
  animal: ['animal', 'bird', 'dog', 'cat', 'horse', 'deer', 'lion', 'owl', 'fish', 'cow', 'rooster', 'monkey'],
}
const VAZIAS = new Set(['the', 'and', 'with', 'of', 'for', 'art', 'arts', 'artwork', 'artist', 'contemporary', 'modern', 'style', 'object', 'design', 'from', 'in', 'a', 'an'])
const raiz = (w) => w.replace(/(ies)$/, 'y').replace(/([^s])s$/, '$1')

let INDICE
function indice() {
  if (INDICE) return INDICE
  const txt = gunzipSync(readFileSync(new URL('./_dados/nga.tsv.gz', import.meta.url))).toString('utf8')
  INDICE = txt.split('\n').filter(Boolean).map((l) => {
    const [id, uuid, tipo, titulo, autor, data, ano, tecnica] = l.split('\t')
    return { id, uuid, tipo, titulo, autor, data, ano: ano ? Number(ano) : undefined, tecnica, busca: ` ${titulo} ${autor} ${tecnica} ${TIPO[tipo] ?? ''} `.toLowerCase() }
  })
  return INDICE
}

/** Mistura estável: a mesma consulta dá a mesma ordem (páginas coerentes), consultas diferentes dão ordens diferentes. */
const hash = (s) => { let h = 2166136261; for (let k = 0; k < s.length; k++) h = Math.imul(h ^ s.charCodeAt(k), 16777619); return h >>> 0 }
const json = (dados, status = 200, cache = 'no-store') => new Response(JSON.stringify(dados), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cache } })

export function GET(request) {
  const p = new URL(request.url).searchParams
  const q = (p.get('q') ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s-]/g, ' ').trim().slice(0, 80)
  const n = Math.max(1, Math.min(40, Number(p.get('n')) || 12))
  const pagina = Math.max(1, Math.min(50, Number(p.get('p')) || 1))
  const de = p.get('de') ? Number(p.get('de')) : undefined
  const ate = p.get('ate') ? Number(p.get('ate')) : undefined
  const palavras = [...new Set(q.split(/\s+/).filter((w) => w.length > 2 && !VAZIAS.has(w)))]
  if (!palavras.length) return json({ itens: [], total: 0 }, 200, 'public, max-age=3600, s-maxage=86400')
  // cada palavra vira um grupo de alternativas (ela mesma, a raiz e os sinônimos de técnica)
  const grupos = palavras.map((w) => [...new Set([w, raiz(w), ...(SINONIMOS[raiz(w)] ?? SINONIMOS[w] ?? [])])])
  let base
  try { base = indice() } catch { return json({ erro: 'Índice da National Gallery indisponível.' }, 500) }
  const achados = []
  for (const o of base) {
    if (de != null && o.ano != null && o.ano < de) continue
    if (ate != null && o.ano != null && o.ano > ate) continue
    if ((de != null || ate != null) && o.ano == null) continue
    let pontos = 0
    for (const g of grupos) if (g.some((w) => o.busca.includes(' ' + w))) pontos++
    if (!pontos) continue
    // no título vale mais que na técnica
    if (grupos.some((g) => g.some((w) => o.titulo.toLowerCase().includes(w)))) pontos += .5
    achados.push({ o, pontos })
  }
  const melhor = Math.max(0, ...achados.map((a) => a.pontos))
  // com mais de uma palavra, só fica o que bate com todas (ou quase todas, se houver pouco)
  const corte = grupos.length > 1 && achados.filter((a) => a.pontos >= grupos.length).length >= n ? grupos.length : Math.min(melhor, Math.max(1, grupos.length - 1))
  const sel = achados.filter((a) => a.pontos >= corte)
  sel.sort((a, b) => (b.pontos - a.pontos) || (hash(q + a.o.id) - hash(q + b.o.id)))
  const fatia = sel.slice((pagina - 1) * n, pagina * n).map(({ o }) => ({
    id: o.id, titulo: o.titulo, autor: o.autor || undefined, data: o.data || undefined, ano: o.ano,
    imagem: `https://api.nga.gov/iiif/${o.uuid}/full/!500,500/0/default.jpg`,
    imagemGrande: `https://api.nga.gov/iiif/${o.uuid}/full/!1400,1400/0/default.jpg`,
    link: `https://www.nga.gov/collection/art-object-page.${o.id}.html`,
    termos: [...(TIPO_TERMOS[o.tipo] ?? []), ...o.tecnica.toLowerCase().split(/[,;]| and | on /).map((x) => x.trim()).filter((x) => x.length > 2).slice(0, 4)],
  }))
  return json({ itens: fatia, total: sel.length }, 200, 'public, max-age=3600, s-maxage=86400')
}
