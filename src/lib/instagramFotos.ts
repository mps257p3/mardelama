import { db } from '../db/schema'
import { cabecalhoLogin } from './login'
import { salvarArquivoDeUrl } from '../db/files'
import { pendenteInstagram } from './instagram'

/**
 * Preenche a foto dos posts salvos do Instagram usando a API oficial (função /api/instagram no servidor).
 * Percorre os posts de cada perfil até achar os que você salvou. O progresso fica guardado:
 * se a Meta pedir pausa, a próxima rodada continua de onde parou.
 */

export interface EstadoIG { configurado: boolean; usuario?: string; pagina?: string; erro?: string }
export async function estadoInstagram(): Promise<EstadoIG> {
  try { const r = await fetch('/api/instagram?acao=status', { headers: await cabecalhoLogin() }); return await r.json() } catch { return { configurado: false, erro: 'Sem conexão com o servidor' } }
}

interface Progresso { feitos: Record<string, 'ok' | 'pessoal' | 'parcial'>; quando: number }
const CHAVE = 'instagram.fotos'
const MAX_PAGINAS = 12   // até 600 posts por perfil

export async function lerProgresso(): Promise<Progresso> { return { feitos: {}, quando: 0, ...((await db.ajustes.get(CHAVE))?.valor as Partial<Progresso> ?? {}) } }

export interface Andamento { perfis: number; perfilAtual?: string; feitosPerfis: number; fotos: number; semFoto: number; parou?: string }

const usuarioDe = (autor?: string) => autor?.match(/@([\w.]+)/)?.[1]

export async function buscarFotos(aoAndar: (a: Andamento) => void, cancelado: () => boolean): Promise<Andamento> {
  const prog = await lerProgresso()
  const pend = (await db.referencias.toArray()).filter((r) => !r.excluido && pendenteInstagram(r))
  const porPerfil = new Map<string, typeof pend>()
  pend.forEach((r) => { const u = usuarioDe(r.autor); if (u && !prog.feitos[u]) porPerfil.set(u, [...(porPerfil.get(u) ?? []), r]) })
  const perfis = [...porPerfil].sort((a, b) => b[1].length - a[1].length)
  const a: Andamento = { perfis: perfis.length, feitosPerfis: 0, fotos: 0, semFoto: 0 }
  aoAndar({ ...a })

  for (const [u, refs] of perfis) {
    if (cancelado()) break
    a.perfilAtual = '@' + u; aoAndar({ ...a })
    const faltam = new Map(refs.map((r) => [r.origem!.slice('instagram:'.length), r]))
    let after: string | null = null, paginas = 0, resultado: 'ok' | 'pessoal' | 'parcial' = 'ok'
    try {
      do {
        const res: Response = await fetch(`/api/instagram?acao=perfil&u=${encodeURIComponent(u)}${after ? '&after=' + encodeURIComponent(after) : ''}`, { headers: await cabecalhoLogin() })
        const j: { erro?: string; itens: { codigo: string; imagem: string | null }[]; after?: string | null } = await res.json().catch(() => ({ erro: `HTTP ${res.status}` }))
        if (res.status === 404) { resultado = 'pessoal'; break }
        if (!res.ok) { a.parou = j.erro ?? `HTTP ${res.status}`; aoAndar({ ...a }); await gravar(prog); return a }
        for (const it of j.itens as { codigo: string; imagem: string | null }[]) {
          const r = faltam.get(it.codigo); if (!r || !it.imagem) continue
          faltam.delete(it.codigo)
          let foto: string | undefined
          try { foto = await salvarArquivoDeUrl(it.imagem, r.titulo) } catch { /* fica sem foto local */ }
          if (foto) { await db.referencias.update(r.id, { imagens: [foto], atualizadoEm: Date.now() }); a.fotos++; aoAndar({ ...a }) }
        }
        after = j.after ?? null; paginas++
      } while (after && faltam.size && paginas < MAX_PAGINAS && !cancelado())
      if (resultado === 'ok' && faltam.size) resultado = 'parcial'
    } catch (e) { a.parou = (e as Error).message; aoAndar({ ...a }); await gravar(prog); return a }
    if (cancelado()) break   // perfil pela metade: volta nele na próxima rodada
    a.semFoto += faltam.size
    prog.feitos[u] = resultado; a.feitosPerfis++; aoAndar({ ...a })
    if (a.feitosPerfis % 10 === 0) await gravar(prog)
  }
  await gravar(prog)
  a.perfilAtual = undefined; aoAndar({ ...a })
  return a
}
const gravar = (p: Progresso) => db.ajustes.put({ chave: CHAVE, valor: { ...p, quando: Date.now() } })
