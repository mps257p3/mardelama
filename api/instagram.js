// Instagram (API oficial com Login do Facebook): busca as fotos dos posts salvos em perfis comerciais e de criador,
// pela "Business Discovery". O código de acesso fica só aqui, na variável META_TOKEN da Vercel.
export const config = { runtime: 'edge' }

const GRAPH = 'https://graph.facebook.com/v21.0'
const json = (dados, status = 200) => new Response(JSON.stringify(dados), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } })

async function graph(caminho, token) {
  const r = await fetch(`${GRAPH}/${caminho}${caminho.includes('?') ? '&' : '?'}access_token=${encodeURIComponent(token)}`)
  const j = await r.json().catch(() => ({}))
  if (!r.ok || j.error) {
    const e = j.error ?? {}
    const err = new Error(e.message || `HTTP ${r.status}`)
    err.codigo = e.code; err.sub = e.error_subcode; err.status = r.status
    throw err
  }
  return j
}

let contaCache
async function minhaConta(token) {
  if (contaCache) return contaCache
  const j = await graph('me/accounts?fields=name,instagram_business_account{id,username}&limit=50', token)
  const p = (j.data ?? []).find((x) => x.instagram_business_account)
  if (!p) throw Object.assign(new Error('Nenhuma Página do Facebook com Instagram ligado foi encontrada para este código de acesso.'), { codigo: 'sem-pagina' })
  contaCache = { igId: p.instagram_business_account.id, usuario: p.instagram_business_account.username, pagina: p.name }
  return contaCache
}

function explicar(e) {
  const c = e.codigo
  if (c === 190) return { erro: 'O código de acesso da Meta venceu ou foi recusado. Gere outro e troque o META_TOKEN na Vercel.', tipo: 'token' }
  if (c === 4 || c === 17 || c === 32 || c === 613) return { erro: 'A Meta pediu uma pausa (limite de consultas por hora). Continue mais tarde: o app retoma de onde parou.', tipo: 'limite' }
  if (c === 110 && e.sub === 2207013) return { erro: 'Perfil não encontrado ou não é comercial/criador.', tipo: 'perfil' }
  if (c === 'sem-pagina') return { erro: e.message, tipo: 'config' }
  if (/business discovery|cannot be found|does not exist|not.*business/i.test(e.message)) return { erro: 'Perfil pessoal ou inexistente: a Meta só mostra perfis comerciais e de criador.', tipo: 'perfil' }
  return { erro: e.message, tipo: 'outro' }
}

export default async function handler(req) {
  const token = process.env.META_TOKEN
  const u = new URL(req.url)
  const acao = u.searchParams.get('acao') ?? 'status'
  if (!token) return json({ configurado: false, erro: 'Falta o META_TOKEN na Vercel.' }, acao === 'status' ? 200 : 503)
  try {
    const conta = await minhaConta(token)
    if (acao === 'status') return json({ configurado: true, usuario: conta.usuario, pagina: conta.pagina })
    if (acao === 'perfil') {
      const alvo = (u.searchParams.get('u') ?? '').replace(/^@/, '')
      if (!/^[A-Za-z0-9._]{1,30}$/.test(alvo)) return json({ erro: 'Nome de usuário inválido' }, 400)
      const depois = u.searchParams.get('after')
      const media = `media${depois ? `.after(${encodeURIComponent(depois)})` : ''}.limit(50){permalink,media_type,media_url,thumbnail_url,timestamp,children{media_type,media_url,thumbnail_url}}`
      const j = await graph(`${conta.igId}?fields=business_discovery.username(${alvo}){username,${media}}`, token)
      const m = j.business_discovery?.media ?? {}
      const bruto = m.data ?? []
      const itens = bruto.map((x) => {
        const filho = x.children?.data?.find((c) => c.media_type === 'IMAGE') ?? x.children?.data?.[0]
        const img = x.media_type === 'VIDEO' ? x.thumbnail_url : x.media_type === 'CAROUSEL_ALBUM' ? (x.media_url ?? filho?.media_url ?? filho?.thumbnail_url) : x.media_url
        return { codigo: x.permalink?.match(/\/(?:p|reel|tv)\/([^/?#]+)/)?.[1], imagem: img ?? null, quando: x.timestamp }
      }).filter((x) => x.codigo)
      return json({ itens, after: bruto.length >= 50 && m.paging?.cursors?.after ? m.paging.cursors.after : null })
    }
    return json({ erro: 'Ação desconhecida' }, 400)
  } catch (e) {
    const x = explicar(e)
    return json(x, x.tipo === 'perfil' ? 404 : x.tipo === 'limite' ? 429 : x.tipo === 'token' || x.tipo === 'config' ? 503 : 502)
  }
}
