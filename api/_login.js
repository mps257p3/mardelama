// Confere o login do app (Supabase) antes de gastar crédito de IA ou usar tokens pessoais.
// Arquivos com "_" no começo não viram endereço na Vercel: isto é só um ajudante das funções.
const SB_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://ekhffvrlldqmastjktlf.supabase.co'
const SB_CHAVE = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_vSf1bdhfaw7X_Q__iNka3w_J4SBLoRC'

const json = (dados, status) => new Response(JSON.stringify(dados), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } })

/**
 * Devolve o usuário logado, ou uma resposta 401/403 pronta para devolver.
 * Se a variável EMAILS_PERMITIDOS existir na Vercel (e-mails separados por vírgula), só esses entram.
 */
export async function exigirLogin(req) {
  const jwt = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!jwt) return { erro: json({ erro: 'Entre na sua conta do app (Ajustes) para usar este recurso.', codigo: 'SEM_LOGIN' }, 401) }
  let u
  try {
    const r = await fetch(`${SB_URL}/auth/v1/user`, { headers: { apikey: SB_CHAVE, authorization: `Bearer ${jwt}` } })
    if (!r.ok) return { erro: json({ erro: 'Seu login no app expirou. Entre de novo em Ajustes.', codigo: 'SEM_LOGIN' }, 401) }
    u = await r.json()
  } catch { return { erro: json({ erro: 'Não consegui conferir o login agora. Tente de novo.' }, 502) } }
  const permitidos = (process.env.EMAILS_PERMITIDOS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
  if (permitidos.length && !permitidos.includes(String(u.email || '').toLowerCase())) return { erro: json({ erro: 'Esta conta não tem acesso a este recurso.' }, 403) }
  return { usuario: { id: u.id, email: u.email } }
}
