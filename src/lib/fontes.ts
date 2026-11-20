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

export type FonteId = 'aic' | 'met' | 'wm' | 'cma' | 'vam' | 'smk' | 'rijks' | 'eu'
export interface Fonte { id: FonteId; nome: string; site: string; buscar: (q: string, n: number, pagina: number) => Promise<ItemDescoberta[]> }

/** Hosts que recusam pedidos do navegador: passam pela ponte do próprio app (/api/fonte). */
const PELA_PONTE = /^https:\/\/(api\.artic\.edu|www\.artic\.edu|collectionapi\.metmuseum\.org|images\.metmuseum\.org|openaccess-cdn\.clevelandart\.org|api\.europeana\.eu\/record|[a-z0-9.-]+\.cdninstagram\.com|[a-z0-9.-]+\.fbcdn\.net)\//
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

/** Cleveland Museum of Art — Open Access, só obras CC0, com imagem. Forte em cerâmica asiática e europeia. */
const cma: Fonte = {
  id: 'cma', nome: 'Cleveland Museum of Art', site: 'https://www.clevelandart.org',
  async buscar(q, n, pagina) {
    const url = `https://openaccess-api.clevelandart.org/api/artworks/?q=${encodeURIComponent(q)}&has_image=1&cc0=1&limit=${n}&skip=${(pagina - 1) * n}` +
      '&fields=id,title,creators,creation_date,images,url,type,technique,culture,department,share_license_status'
    const j = await comTempo(url)
    return (j.data ?? []).filter((d: Record<string, any>) => d.images?.web?.url).map((d: Record<string, any>) => ({
      id: 'cma:' + d.id, fonte: 'cma' as const, titulo: limpa(d.title) || 'Sem título',
      autor: limpa(d.creators?.[0]?.description).replace(/\s*\(.*$/, '') || undefined, data: d.creation_date || undefined,
      imagem: d.images.web.url, imagemGrande: d.images.web.url, link: d.url || `https://www.clevelandart.org/art/${d.id}`,
      licenca: 'Domínio público (CC0)',
      termos: palavras(d.type, d.technique, ...(d.culture ?? []).slice(0, 2), d.department),
    }))
  },
}

/** Victoria and Albert Museum (Londres) — um dos maiores acervos de cerâmica do mundo. Imagens IIIF para uso pessoal e de estudo. */
const vam: Fonte = {
  id: 'vam', nome: 'Victoria and Albert Museum', site: 'https://collections.vam.ac.uk',
  async buscar(q, n, pagina) {
    const j = await comTempo(`https://api.vam.ac.uk/v2/objects/search?q=${encodeURIComponent(q)}&images_exist=1&page_size=${n}&page=${pagina}`)
    return (j.records ?? []).filter((r: Record<string, any>) => r._images?._iiif_image_base_url).map((r: Record<string, any>) => {
      const base = r._images._iiif_image_base_url
      const autor = r._primaryMaker?.name && !/^unknown$/i.test(r._primaryMaker.name) ? r._primaryMaker.name : undefined
      return {
        id: 'vam:' + r.systemNumber, fonte: 'vam' as const, titulo: limpa(r._primaryTitle) || r.objectType || 'Sem título', autor, data: r._primaryDate || undefined,
        imagem: `${base}full/!500,500/0/default.jpg`, imagemGrande: `${base}full/!1200,1200/0/default.jpg`,
        link: `https://collections.vam.ac.uk/item/${r.systemNumber}/`, licenca: '© Victoria and Albert Museum, uso pessoal e de estudo',
        termos: palavras(r.objectType, r._primaryPlace),
      }
    })
  },
}

/** SMK, Galeria Nacional da Dinamarca — API aberta, só obras em domínio público. */
const smk: Fonte = {
  id: 'smk', nome: 'SMK (Dinamarca)', site: 'https://open.smk.dk',
  async buscar(q, n, pagina) {
    const url = `https://api.smk.dk/api/v1/art/search/?keys=${encodeURIComponent(q)}&offset=${(pagina - 1) * n}&rows=${n}` +
      '&filters=' + encodeURIComponent('[has_image:true],[public_domain:true]') + '&lang=en'
    const j = await comTempo(url)
    return (j.items ?? []).filter((i: Record<string, any>) => i.image_thumbnail).map((i: Record<string, any>) => ({
      id: 'smk:' + i.object_number, fonte: 'smk' as const, titulo: limpa(i.titles?.[0]?.title) || 'Sem título',
      autor: i.artist?.[0] || undefined, data: i.production_date?.[0]?.period || undefined,
      imagem: i.image_thumbnail, imagemGrande: i.image_iiif_id ? `${i.image_iiif_id}/full/!1200,1200/0/default.jpg` : i.image_thumbnail,
      link: i.frontend_url || `https://open.smk.dk/artwork/image/${i.object_number}`, licenca: 'Domínio público (SMK Open)',
      termos: palavras(...(i.object_names ?? []).map((o: { name: string }) => o.name), ...(i.techniques ?? []), ...(i.materials ?? [])),
    }))
  },
}

/** Rijksmuseum (Amsterdam) — API de dados aberta (Linked Art), sem chave. A busca devolve endereços; cada obra é uma chamada. */
const RIJKS_VAZIAS = new Set(['the', 'and', 'with', 'of', 'for', 'figure', 'design', 'art', 'object'])
const rijks: Fonte = {
  id: 'rijks', nome: 'Rijksmuseum', site: 'https://www.rijksmuseum.nl',
  async buscar(q, n, pagina) {
    // a busca do Rijks é por campo e por palavra: tenta tipo, material, técnica e descrição com as palavras da consulta
    const ws = q.toLowerCase().split(/\s+/).filter((w) => w.length > 2 && !RIJKS_VAZIAS.has(w))
    if (!ws.length) return []
    const ult = ws[ws.length - 1], pri = ws[0]
    const pedidos = [`type=${ult}`, `material=${pri}`, `technique=${pri}`, `description=${ult}`]
    const listas = await Promise.all(pedidos.map((p) => comTempo(`https://data.rijksmuseum.nl/search/collection?${p.replace(/=(.*)$/, (_, v) => '=' + encodeURIComponent(v))}&imageAvailable=true`).catch(() => null)))
    const ids = [...new Set(listas.flatMap((l) => (l?.orderedItems ?? []).map((x: { id: string }) => x.id)))]
    const fatia = ids.slice((pagina - 1) * n, pagina * n)
    const objs = await Promise.all(fatia.map((id) => comTempo(id, { headers: { Accept: 'application/ld+json' } }, 9000).catch(() => null)))
    return objs.filter(Boolean).map((o: Record<string, any>) => {
      const txt = JSON.stringify(o)
      const img = txt.match(/https:\/\/iiif\.micr\.io\/[A-Za-z0-9]+/)?.[0]
      if (!img) return null
      const nomes = (o.identified_by ?? []).filter((x: { type: string }) => x.type === 'Name').map((x: { content: string }) => x.content)
      const pag = txt.match(/https:\/\/www\.rijksmuseum\.nl\/[a-z]{2}\/collectie\/object\/[^"]+/)?.[0]
      const autor = txt.match(/"notation":\[\{"@language":"en","@value":"([^"]+)"/)?.[1]
      const data = o.produced_by?.timespan?.identified_by?.[0]?.content
      const id = String(o.id).split('/').pop()
      return {
        id: 'rijks:' + id, fonte: 'rijks' as const, titulo: limpa(nomes[0]) || 'Sem título', autor: autor && !/^anonymous$/i.test(autor) ? autor : undefined, data,
        imagem: `${img}/full/!500,500/0/default.jpg`, imagemGrande: `${img}/full/!1200,1200/0/default.jpg`,
        link: pag || String(o.id), licenca: 'Domínio público (Rijksmuseum)', termos: palavras(...ws),
      }
    }).filter(Boolean) as ItemDescoberta[]
  },
}

/** Europeana — reúne milhares de museus europeus. A chave gratuita fica só na Vercel (EUROPEANA_KEY); a ponte a acrescenta. */
const licencaEu = (u?: string) => !u ? 'Ver licença na fonte' : /publicdomain/.test(u) ? 'Domínio público' : /creativecommons\.org\/licenses\/([a-z-]+)/.test(u) ? 'CC ' + u.match(/licenses\/([a-z-]+)/)![1].toUpperCase() : 'Ver licença na fonte'
const eu: Fonte = {
  id: 'eu', nome: 'Europeana', site: 'https://www.europeana.eu',
  async buscar(q, n, pagina) {
    const url = `https://api.europeana.eu/record/v2/search.json?query=${encodeURIComponent(q)}&rows=${n}&start=${(pagina - 1) * n + 1}` +
      '&media=true&thumbnail=true&qf=TYPE:IMAGE&reusability=open&profile=standard'
    const j = await comTempo(url).catch((e: Error) => { throw /HTTP 503/.test(e.message) ? new Error('falta a chave gratuita EUROPEANA_KEY na Vercel') : e })
    return (j.items ?? []).filter((i: Record<string, any>) => i.edmPreview?.[0]).map((i: Record<string, any>) => {
      const prev = i.edmPreview[0] + '&size=w400'
      const grande = i.edmIsShownBy?.[0]?.startsWith('https://') ? i.edmIsShownBy[0] : prev
      const autor = (i.dcCreator ?? []).find((c: string) => !/^https?:|_person$|^\d/.test(c))
      return {
        id: 'eu:' + i.id, fonte: 'eu' as const, titulo: limpa(i.title?.[0]).slice(0, 140) || 'Sem título', autor, data: i.year?.[0],
        imagem: prev, imagemGrande: grande, link: String(i.guid ?? '').replace(/\?utm_.*$/, '') || `https://www.europeana.eu/item${i.id}`,
        licenca: licencaEu(i.rights?.[0]) + (i.dataProvider?.[0] ? ' · ' + i.dataProvider[0] : ''),
        termos: palavras(...(i.dcSubjectLangAware?.en ?? []).slice(0, 4), ...(i.dcTypeLangAware?.en ?? []).slice(0, 2)),
      }
    })
  },
}

export const FONTES: Fonte[] = [aic, met, wm, cma, vam, smk, rijks, eu]
export const FONTE: Record<FonteId, Fonte> = { aic, met, wm, cma, vam, smk, rijks, eu }

/** Fontes que dependem de configuração: mostradas com o estado real, nunca simuladas. */
export const FONTES_PENDENTES = [
  { nome: 'Pinterest', estado: 'Não conectado. A API oficial só dá acesso às suas pastas e pins salvos (etapa 4).' },
]
