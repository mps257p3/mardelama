import { db } from '../db/schema'
import { ETAPAS } from '../db/schema'

/**
 * "Sobre a bancada": o que está em movimento no ateliê, lido dos registros que já existem.
 * Nada é criado no banco; os esmaltes consultados ficam só neste aparelho (localStorage).
 */
export interface ItemBancada {
  chave: string
  categoria: string
  titulo: string
  contexto?: string
  foto?: string          // id de Arquivo
  imagemExterna?: string // endereço da imagem na fonte
  to: string
  quando: number
  andamento?: boolean    // obra ou série ainda em curso: tem prioridade
}

const DIA = 86400000
const JANELA = 45 * DIA
const VISTOS = 'bancada.esmaltes-vistos'

/** Guarda a consulta de um esmalte (os 10 últimos), só neste aparelho. */
export function registrarConsultaEsmalte(id: string) {
  try {
    const xs: { id: string; t: number }[] = JSON.parse(localStorage.getItem(VISTOS) || '[]')
    localStorage.setItem(VISTOS, JSON.stringify([{ id, t: Date.now() }, ...xs.filter((x) => x.id !== id)].slice(0, 10)))
  } catch { /* sem armazenamento: a bancada segue sem os consultados */ }
}
function consultas(): { id: string; t: number }[] {
  try { return JSON.parse(localStorage.getItem(VISTOS) || '[]') } catch { return [] }
}

export function haQuanto(t: number, agora = Date.now()) {
  const d = Math.floor((agora - t) / DIA)
  if (d <= 0) return 'hoje'
  if (d === 1) return 'ontem'
  if (d < 7) return `há ${d} dias`
  if (d < 14) return 'há 1 semana'
  if (d < 31) return `há ${Math.floor(d / 7)} semanas`
  return new Date(t).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
}

const texto = (html?: string) => (html ?? '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
const recentes = async <T>(tabela: string, desde: number) =>
  (await db.table(tabela).where('atualizadoEm').above(desde).toArray()).filter((x: { excluido?: number }) => !x.excluido) as T[]

/** Até `n` registros, priorizando trabalhos em andamento e variando as categorias. */
export async function itensDaBancada(n = 3, agora = Date.now()): Promise<ItemBancada[]> {
  const desde = agora - JANELA
  const out: ItemBancada[] = []
  const etapa = Object.fromEntries(ETAPAS.map((e) => [e.id, e.nome]))

  for (const p of await recentes<import('../db/schema').Peca>('entrada', desde)) {
    if (p.etapa === 'pronta') continue
    out.push({ chave: 'peca' + p.id, categoria: p.tipo === 'estudo' ? 'Estudo em desenvolvimento' : 'Obra em desenvolvimento', titulo: p.titulo || 'Sem título',
      contexto: [etapa[p.etapa], haQuanto(p.atualizadoEm, agora)].filter(Boolean).join(' · '), foto: p.fotos?.[0], to: `/obras/peca/${p.id}`, quando: p.atualizadoEm, andamento: true })
  }
  for (const s of await recentes<import('../db/schema').Serie>('projetos', desde)) {
    if (s.status !== 'ativa') continue
    out.push({ chave: 'serie' + s.id, categoria: 'Pesquisa em andamento', titulo: s.nome, contexto: [s.intencao?.slice(0, 60), haQuanto(s.atualizadoEm, agora)].filter(Boolean).join(' · '),
      foto: s.capa, to: `/obras/serie/${s.id}`, quando: s.atualizadoEm, andamento: true })
  }
  const esmaltes = new Map((await db.esmaltes.toArray()).map((e) => [e.id, e]))
  for (const t of await recentes<import('../db/schema').Teste>('testes', desde)) {
    const e = t.esmalteId ? esmaltes.get(t.esmalteId) : undefined
    out.push({ chave: 'teste' + t.id, categoria: 'Experimento', titulo: e?.nome ? `${e.nome} · ${t.codigo}` : t.codigo,
      contexto: [t.cone && 'cone ' + t.cone, haQuanto(t.atualizadoEm, agora)].filter(Boolean).join(' · '), foto: t.fotos?.[0], to: `/testes/${t.id}`, quando: t.atualizadoEm })
  }
  for (const c of await recentes<import('../db/schema').Comercial>('comerciais', desde)) {
    out.push({ chave: 'er' + c.id, categoria: 'Engenharia reversa', titulo: [c.fabricante, c.nome].filter(Boolean).join(' '),
      contexto: haQuanto(c.atualizadoEm, agora), foto: c.fotos?.[0], to: `/engenharia-reversa/${c.id}`, quando: c.atualizadoEm })
  }
  for (const r of (await db.referencias.where('criadoEm').above(desde).toArray()).filter((x) => !x.excluido)) {
    out.push({ chave: 'ref' + r.id, categoria: 'Referência adicionada', titulo: r.titulo || 'Sem título', contexto: [r.autor, haQuanto(r.criadoEm, agora)].filter(Boolean).join(' · '),
      foto: r.imagens?.[0], imagemExterna: r.imagemExterna, to: `/referencias/${r.id}`, quando: r.criadoEm })
  }
  for (const nota of await recentes<import('../db/schema').Nota>('notas', desde)) {
    const corpo = texto(nota.corpo)
    if (!nota.titulo?.trim() && !corpo && !nota.imagens?.length) continue
    out.push({ chave: 'nota' + nota.id, categoria: 'Caderno', titulo: nota.titulo?.trim() || corpo.slice(0, 60) || 'Anotação',
      contexto: haQuanto(nota.atualizadoEm, agora), foto: nota.imagens?.[0], to: `/caderno/${nota.id}`, quando: nota.atualizadoEm })
  }
  for (const v of consultas()) {
    const e = esmaltes.get(v.id)
    if (!e || e.excluido || v.t < desde) continue
    out.push({ chave: 'esm' + e.id, categoria: 'Esmalte consultado', titulo: e.nome, contexto: [e.autoria, haQuanto(v.t, agora)].filter(Boolean).join(' · '),
      foto: e.fotos?.[0], to: `/esmaltes/${e.id}`, quando: v.t })
  }

  // em andamento primeiro, depois o mais recente; uma categoria por vez antes de repetir
  const ord = out.sort((a, b) => Number(!!b.andamento) - Number(!!a.andamento) || b.quando - a.quando)
  const escolhidos: ItemBancada[] = []
  for (const x of ord) if (escolhidos.length < n && !escolhidos.some((y) => y.categoria === x.categoria)) escolhidos.push(x)
  for (const x of ord) if (escolhidos.length < n && !escolhidos.includes(x)) escolhidos.push(x)
  return escolhidos
}
