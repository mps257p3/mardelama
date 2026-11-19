/**
 * Fontes abertas para o Descobrir. Cada fonte é um módulo com a mesma interface,
 * para que novas (Europeana, Pinterest, sites de artistas) entrem sem mexer no feed.
 * Só usamos APIs públicas e oficiais, sem scraping.
 */

export interface ItemDescoberta {
  id: string                // 'aic:123', 'met:456', 'wm:Arquivo.jpg'
  fonte: FonteId
  titulo: string
  autor?: string
  data?: string
  imagem: string            // miniatura para o mural
  imagemGrande: string      // para tela cheia e para salvar
  link: string              // página original
  licenca: string
  termos: string[]          // classificação, técnica, cultura, temas (minúsculas)
  universo?: string         // universo criativo de onde veio a consulta
  consulta?: string
}

export type FonteId = 'aic' | 'met' | 'wm'
export interface Fonte { id: FonteId; nome: string; site: string; buscar: (q: string, n: number, pagina: number) => Promise<ItemDescoberta[]> }

/** Hosts que recusam pedidos do navegador: passam pela ponte do próprio app (/api/fonte). */
const PELA_PONTE = /^https:\/\/(api\.artic\.edu|www\.artic\.edu|collectionapi\.metmuseum\.org|images\.metmuseum\.org)\//
export const viaPonte = (url: string) => (PELA_PONTE.test(url) ? '/api/fonte?u=' + encodeURIComponent(url) : url)
const comTempo = async (url: string, init?: RequestInit, ms = 12000) => {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), ms)
  try { const r = await fetch(viaPonte(url), { ...init, signal: c.signal }); if (!r.ok) throw new Error(`HTTP ${r.status}`); return await r.json() } finally { clearTimeout(t) }
}
const limpa = (s?: string) => (s ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
const palavras = (...xs: (string | undefined | null)[]) =>
  [...new Set(xs.filter(Boolean).flatMap((x) => String(x).toLowerCase().split(/[;,/()|]+/).map((p) => p.trim())).filter((p) => p.length > 2 && p.length < 40))]

/** Art Institute of Chicago — API pública, imagens IIIF, domínio público marcado. */
const aic: Fonte = {
  id: 'aic', nome: 'Art Institute of Chicago', site: 'https://www.artic.edu',
  async buscar(q, n, pagina) {
    const campos = 'id,title,artist_title,date_display,image_id,classification_title,medium_display,place_of_origin,style_title,subject_titles,is_public_domain'
    const url = `https://api.artic.edu/api/v1/artworks/search?q=${encodeURIComponent(q)}&limit=${n}&page=${pagina}&fields=${campos}&query[term][is_public_domain]=true`
    const j = await comTempo(url)
    const iiif = j.config?.iiif_url ?? 'https://www.artic.edu/iiif/2'
    return (j.data ?? []).filter((d: { image_id?: string }) => d.image_id).map((d: Record<string, any>) => ({
      id: 'aic:' + d.id, fonte: 'aic', titulo: limpa(d.title) || 'Sem título', autor: d.artist_title || undefined, data: d.date_display || undefined,
      imagem: `${iiif}/${d.image_id}/full/400,/0/default.jpg`, imagemGrande: `${iiif}/${d.image_id}/full/843,/0/default.jpg`,
      link: `https://www.artic.edu/artworks/${d.id}`, licenca: d.is_public_domain ? 'Domínio público (CC0)' : 'Ver termos da fonte',
      termos: palavras(d.classification_title, d.medium_display, d.place_of_origin, d.style_title, ...(d.subject_titles ?? []).slice(0, 5)),
    }))
  },
}

/** The Metropolitan Museum of Art — Open Access (busca devolve ids; cada objeto é uma chamada). */
const met: Fonte = {
  id: 'met', nome: 'The Met', site: 'https://www.metmuseum.org',
  async buscar(q, n, pagina) {
    const j = await comTempo(`https://collectionapi.metmuseum.org/public/collection/v1/search?hasImages=true&q=${encodeURIComponent(q)}`)
    const ids: number[] = (j.objectIDs ?? []).slice((pagina - 1) * n * 2, pagina * n * 2)
    const objs = await Promise.all(ids.map((id) => comTempo(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`, undefined, 9000).catch(() => null)))
    return objs.filter((o) => o?.primaryImageSmall && o.isPublicDomain).slice(0, n).map((o: Record<string, any>) => ({
      id: 'met:' + o.objectID, fonte: 'met', titulo: limpa(o.title) || 'Sem título', autor: o.artistDisplayName || undefined, data: o.objectDate || undefined,
      imagem: o.primaryImageSmall, imagemGrande: o.primaryImageSmall, link: o.objectURL || `https://www.metmuseum.org/art/collection/search/${o.objectID}`,
      licenca: 'Domínio público (Open Access, CC0)',
      termos: palavras(o.classification, o.medium, o.culture, o.department, o.objectName, ...(o.tags ?? []).map((t: { term: string }) => t.term).slice(0, 5)),
    }))
  },
}

/** Wikimedia Commons — arquivos de mídia livres, com autoria e licença de cada um. */
const wm: Fonte = {
  id: 'wm', nome: 'Wikimedia Commons', site: 'https://commons.wikimedia.org',
  async buscar(q, n, pagina) {
    const url = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrnamespace=6' +
      `&gsrsearch=${encodeURIComponent(q + ' filetype:bitmap')}&gsrlimit=${n}&gsroffset=${(pagina - 1) * n}` +
      '&prop=imageinfo|categories&clshow=!hidden&cllimit=8&iiprop=url|extmetadata|mime&iiurlwidth=500&iiextmetadatafilter=Artist|LicenseShortName|ObjectName|ImageDescription|DateTimeOriginal'
    const j = await comTempo(url)
    const ps = Object.values(j.query?.pages ?? {}) as Record<string, any>[]
    return ps.filter((p) => p.imageinfo?.[0]?.thumburl && /jpe?g|png|webp/.test(p.imageinfo[0].mime ?? '')).map((p) => {
      const ii = p.imageinfo[0]; const m = ii.extmetadata ?? {}
      const titulo = limpa(m.ObjectName?.value) || p.title.replace(/^File:/, '').replace(/\.[a-z0-9]+$/i, '').replace(/_/g, ' ')
      return {
        id: 'wm:' + p.title, fonte: 'wm' as const, titulo: titulo.slice(0, 140), autor: limpa(m.Artist?.value).slice(0, 80) || undefined, data: limpa(m.DateTimeOriginal?.value).slice(0, 20) || undefined,
        imagem: ii.thumburl, imagemGrande: ii.thumburl, link: ii.descriptionurl, licenca: limpa(m.LicenseShortName?.value) || 'Ver licença na fonte',
        termos: palavras(...(p.categories ?? []).map((c: { title: string }) => c.title.replace(/^Category:/, ''))),
      }
    })
  },
}

export const FONTES: Fonte[] = [aic, met, wm]
export const FONTE: Record<FonteId, Fonte> = { aic, met, wm }

/** Fontes que dependem de configuração: mostradas com o estado real, nunca simuladas. */
export const FONTES_PENDENTES = [
  { nome: 'Europeana', estado: 'Precisa de uma chave gratuita da Europeana (entra na etapa 3, junto com o servidor).' },
  { nome: 'Pinterest', estado: 'Não conectado. A API oficial só dá acesso às suas pastas e pins salvos (etapa 4).' },
]
