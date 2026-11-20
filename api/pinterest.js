// Conexão com a conta do Pinterest pela API oficial (v5, OAuth 2.0).
// Os tokens nunca chegam ao aparelho: ficam cifrados (AES-GCM) na tabela `integracoes` do Supabase,
// com uma chave derivada de PINTEREST_APP_SECRET, que só existe aqui na Vercel.
// Cada pedido do app vem com o login do Supabase; a tabela tem RLS, então cada pessoa só alcança a própria linha.
import { createHmac, createCipheriv, createDecipheriv, randomBytes, timingSafeEqual, hkdfSync } from 'node:crypto'

const SB_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://ekhffvrlldqmastjktlf.supabase.co'
const SB_CHAVE = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_vSf1bdhfaw7X_Q__iNka3w_J4SBLoRC'
const APP_ID = process.env.PINTEREST_APP_ID
const APP_SECRET = process.env.PINTEREST_APP_SECRET
const API = 'https://api.pinterest.com/v5'
const ESCOPOS = 'user_accounts:read,boards:read,boards:read_secret,pins:read,pins:read_secret'

const json = (dados, status = 200) => new Response(JSON.stringify(dados), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } })
class Falha extends Error { constructor(msg, status = 400, codigo) { super(msg); this.status = status; this.codigo = codigo } }

const retornoDe = (req) => process.env.PINTEREST_REDIRECT_URI || `${new URL(req.url).origin}/referencias/pinterest/retorno`

// ---------- cifra ----------
const chave = (uso) => Buffer.from(hkdfSync('sha256', APP_SECRET, 'mardelama', uso, 32))
function cifrar(obj) {
  const iv = randomBytes(12)
  const c = createCipheriv('aes-256-gcm', chave('tokens'), iv)
  const dados = Buffer.concat([c.update(JSON.stringify(obj), 'utf8'), c.final()])
  return [iv, c.getAuthTag(), dados].map((b) => b.toString('base64')).join('.')
}
function decifrar(txt) {
  const [iv, tag, dados] = txt.split('.').map((s) => Buffer.from(s, 'base64'))
  const d = createDecipheriv('aes-256-gcm', chave('tokens'), iv); d.setAuthTag(tag)
  return JSON.parse(Buffer.concat([d.update(dados), d.final()]).toString('utf8'))
}
/** state do OAuth: liga a autorização ao usuário logado e expira em 15 minutos. */
const assinar = (txt) => createHmac('sha256', chave('state')).update(txt).digest('base64url')
function criarState(userId) { const t = Date.now().toString(36); const n = randomBytes(6).toString('base64url'); return `${t}.${n}.${assinar(`${userId}.${t}.${n}`)}` }
function conferirState(state, userId) {
  const [t, n, s] = String(state || '').split('.')
  if (!t || !n || !s) return false
  const esperado = Buffer.from(assinar(`${userId}.${t}.${n}`)); const veio = Buffer.from(s)
  return esperado.length === veio.length && timingSafeEqual(esperado, veio) && Date.now() - parseInt(t, 36) < 15 * 60_000
}

// ---------- Supabase (com o login da própria pessoa) ----------
async function usuarioDe(req) {
  const jwt = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!jwt) throw new Falha('Entre na sua conta do app (Ajustes) para conectar o Pinterest.', 401)
  const r = await fetch(`${SB_URL}/auth/v1/user`, { headers: { apikey: SB_CHAVE, authorization: `Bearer ${jwt}` } })
  if (!r.ok) throw new Falha('Seu login no app expirou. Entre de novo em Ajustes.', 401)
  const u = await r.json()
  return { id: u.id, jwt }
}
const cabecalhos = (u, extra = {}) => ({ apikey: SB_CHAVE, authorization: `Bearer ${u.jwt}`, 'content-type': 'application/json', ...extra })
function erroTabela(r, corpo) {
  if (r.status === 404 || /integracoes/.test(corpo) && /does not exist|Could not find/i.test(corpo)) throw new Falha('Falta criar a tabela de conexões no Supabase (rodar supabase/migracao-pinterest.sql).', 503, 'MIGRACAO')
  throw new Falha('O banco recusou o pedido: ' + corpo.slice(0, 200), 502)
}
async function lerLinha(u) {
  const r = await fetch(`${SB_URL}/rest/v1/integracoes?provedor=eq.pinterest&select=*`, { headers: cabecalhos(u) })
  const corpo = await r.text()
  if (!r.ok) erroTabela(r, corpo)
  return JSON.parse(corpo)[0]
}
async function gravarLinha(u, campos) {
  const r = await fetch(`${SB_URL}/rest/v1/integracoes?on_conflict=user_id,provedor`, {
    method: 'POST', headers: cabecalhos(u, { prefer: 'resolution=merge-duplicates,return=minimal' }),
    body: JSON.stringify({ user_id: u.id, provedor: 'pinterest', atualizado_em: Date.now(), ...campos }),
  })
  if (!r.ok) erroTabela(r, await r.text())
}
async function apagarLinha(u) {
  const r = await fetch(`${SB_URL}/rest/v1/integracoes?provedor=eq.pinterest`, { method: 'DELETE', headers: cabecalhos(u) })
  if (!r.ok) erroTabela(r, await r.text())
}

// ---------- Pinterest ----------
const basic = () => 'Basic ' + Buffer.from(`${APP_ID}:${APP_SECRET}`).toString('base64')
async function pedirToken(params) {
  const r = await fetch(`${API}/oauth/token`, { method: 'POST', headers: { authorization: basic(), 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(params) })
  const j = await r.json().catch(() => ({}))
  if (!r.ok || !j.access_token) throw new Falha('O Pinterest recusou a autorização: ' + (j.message || j.error_description || j.error || `HTTP ${r.status}`), 502)
  const agora = Date.now()
  return { access: j.access_token, refresh: j.refresh_token, expira: agora + (j.expires_in ?? 2592000) * 1000, refreshExpira: j.refresh_token_expires_in ? agora + j.refresh_token_expires_in * 1000 : undefined, escopo: j.scope }
}

/** Devolve um token válido, renovando quando faltar menos de 2 dias (o renovado é gravado de novo, cifrado). */
async function tokenDe(u) {
  const linha = await lerLinha(u)
  if (!linha?.cifrado) throw new Falha('Pinterest não conectado.', 409, 'DESCONECTADO')
  let t
  try { t = decifrar(linha.cifrado) } catch { throw new Falha('A conexão com o Pinterest precisa ser refeita (a chave do servidor mudou).', 409, 'DESCONECTADO') }
  if (t.expira - Date.now() < 2 * 86400_000) {
    if (!t.refresh) throw new Falha('A autorização do Pinterest venceu. Conecte de novo.', 409, 'DESCONECTADO')
    try {
      const novo = await pedirToken({ grant_type: 'refresh_token', refresh_token: t.refresh })
      t = { ...t, ...novo, refresh: novo.refresh || t.refresh, refreshExpira: novo.refreshExpira || t.refreshExpira }
      await gravarLinha(u, { cifrado: cifrar(t) })
    } catch (e) { throw new Falha('A autorização do Pinterest venceu. Conecte de novo. (' + e.message + ')', 409, 'DESCONECTADO') }
  }
  return { token: t.access, linha }
}

async function pinterest(token, caminho, params = {}) {
  const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== ''))
  const r = await fetch(`${API}${caminho}${q.size ? '?' + q : ''}`, { headers: { authorization: `Bearer ${token}`, accept: 'application/json' } })
  const j = await r.json().catch(() => ({}))
  const restam = r.headers.get('x-ratelimit-remaining')
  if (r.status === 429) throw new Falha('O Pinterest pediu uma pausa (limite de pedidos do dia). Tente mais tarde.', 429, 'LIMITE')
  if (r.status === 401) throw new Falha('O Pinterest não aceitou mais a autorização. Conecte de novo.', 409, 'DESCONECTADO')
  if (r.status === 403 && /PINNER_DATA_ACCESS_DENIED/i.test(JSON.stringify(j))) throw new Falha('O Pinterest só libera os pins de contas comerciais (Business) para apps novos. Transforme sua conta em conta comercial (é gratuito) e tente de novo.', 403, 'CONTA_PESSOAL')
  if (!r.ok) throw new Falha(`O Pinterest recusou o pedido (${r.status}): ${j.message || ''}`.trim(), 502)
  return { j, restam: restam == null ? undefined : Number(restam) }
}

const melhorImagem = (imgs = {}) => {
  const ordem = ['1200x', 'originals', '600x', '400x300', '150x150']
  for (const k of ordem) if (imgs[k]?.url) return imgs[k].url
  return Object.values(imgs).find((x) => x?.url)?.url
}
const pinParaApp = (p) => ({
  id: p.id, criadoEm: p.created_at ? Date.parse(p.created_at) || undefined : undefined,
  titulo: p.title || undefined, descricao: p.description || undefined, alt: p.alt_text || undefined, nota: p.note || undefined,
  link: p.link || undefined, cor: /^#[0-9a-f]{6}$/i.test(p.dominant_color || '') ? p.dominant_color.toLowerCase() : undefined,
  video: p.media?.media_type === 'video' || /video/i.test(p.creative_type || ''),
  imagem: melhorImagem(p.media?.images) || p.media?.cover_image_url || undefined,
  painel: p.board_id, dono: p.board_owner?.username || undefined,
})
const painelParaApp = (b) => ({
  id: b.id, nome: b.name, descricao: b.description || undefined, pins: b.pin_count ?? undefined, privacidade: b.privacy,
  capa: b.media?.image_cover_url || b.media?.pin_thumbnail_urls?.[0] || undefined,
})

// ---------- rotas ----------
export async function GET() {
  return json({ configurada: !!(APP_ID && APP_SECRET) })
}

export async function POST(req) {
  if (!APP_ID || !APP_SECRET) return json({ erro: 'Pinterest não configurado: faltam PINTEREST_APP_ID e PINTEREST_APP_SECRET na Vercel.', codigo: 'SEM_APP' }, 503)
  let d
  try { d = await req.json() } catch { return json({ erro: 'Pedido inválido' }, 400) }
  try {
    const u = await usuarioDe(req)
    switch (d?.acao) {
      case 'estado': {
        const l = await lerLinha(u)
        return json({ conectado: !!l?.cifrado, conta: l?.conta ?? null, config: l?.config ?? {}, retorno: retornoDe(req) })
      }
      case 'inicio': {
        const url = new URL('https://www.pinterest.com/oauth/')
        url.search = new URLSearchParams({ client_id: APP_ID, redirect_uri: retornoDe(req), response_type: 'code', scope: ESCOPOS, state: criarState(u.id) })
        return json({ url: url.toString() })
      }
      case 'conectar': {
        if (!conferirState(d.state, u.id)) throw new Falha('A autorização não confere com este login ou demorou demais. Tente conectar de novo.', 400)
        if (!d.code) throw new Falha('O Pinterest não devolveu o código de autorização.', 400)
        const t = await pedirToken({ grant_type: 'authorization_code', code: String(d.code), redirect_uri: retornoDe(req) })
        let conta = {}
        try {
          const { j } = await pinterest(t.access, '/user_account')
          conta = { usuario: j.username, tipo: j.account_type, foto: j.profile_image, pins: j.pin_count, paineis: j.board_count }
        } catch { /* a conta aparece sem nome; os pins continuam acessíveis */ }
        const atual = await lerLinha(u)
        await gravarLinha(u, { cifrado: cifrar(t), conta: { ...conta, desde: Date.now(), escopo: t.escopo }, config: atual?.config ?? {} })
        return json({ conectado: true, conta })
      }
      case 'desconectar': {
        await apagarLinha(u)
        return json({ conectado: false })
      }
      case 'config': {
        const l = await lerLinha(u)
        if (!l) throw new Falha('Pinterest não conectado.', 409, 'DESCONECTADO')
        const config = { ...(l.config ?? {}), ...(d.config ?? {}) }
        await gravarLinha(u, { config })
        return json({ config })
      }
      case 'paineis': {
        const { token } = await tokenDe(u)
        const todos = []; let bookmark, restam
        for (let i = 0; i < 10; i++) {
          const r = await pinterest(token, '/boards', { page_size: 100, bookmark })
          todos.push(...(r.j.items ?? []).map(painelParaApp)); restam = r.restam
          bookmark = r.j.bookmark; if (!bookmark) break
        }
        return json({ paineis: todos, restam })
      }
      case 'pins': {
        if (!/^\d+$/.test(String(d.painel || ''))) throw new Falha('Painel inválido.', 400)
        const { token } = await tokenDe(u)
        const r = await pinterest(token, `/boards/${d.painel}/pins`, { page_size: 100, bookmark: d.bookmark })
        return json({ pins: (r.j.items ?? []).map(pinParaApp), bookmark: r.j.bookmark || null, restam: r.restam })
      }
      default: return json({ erro: 'Ação desconhecida' }, 400)
    }
  } catch (e) {
    if (e instanceof Falha) return json({ erro: e.message, codigo: e.codigo }, e.status)
    return json({ erro: 'Erro inesperado: ' + (e instanceof Error ? e.message : String(e)) }, 500)
  }
}

