import { FlaskConical, ScrollText, TestTube, Layers, Images, BookOpen, Feather, LayoutDashboard, type LucideIcon } from 'lucide-react'
import { db, type Tipo } from '../db/schema'
import { COR_AREA, type AreaSlug } from '../ui/nav'
import { DEF, ROTULO, type Resumo } from './entidades'

/** Área à qual cada tipo de conteúdo pertence (define cor e ícone de identificação). */
export const AREA_DO_TIPO: Partial<Record<Tipo, AreaSlug>> = {
  esmalte: 'esmaltes', receita: 'esmaltes', teste: 'esmaltes', material: 'materiais',
  referencia: 'referencias', painel: 'referencias', conteudo: 'biblioteca', nota: 'caderno',
}
export const ICONE_TIPO: Partial<Record<Tipo, LucideIcon>> = {
  esmalte: FlaskConical, receita: ScrollText, teste: TestTube, material: Layers,
  referencia: Images, painel: LayoutDashboard, conteudo: BookOpen, nota: Feather,
}
export const corDoTipo = (t: Tipo) => COR_AREA[AREA_DO_TIPO[t] ?? 'calculadoras']

export interface ItemAtividade extends Resumo { quando: number; rotulo: string }

const TABELAS: Tipo[] = ['esmalte', 'receita', 'teste', 'material', 'referencia', 'conteudo', 'nota']

const notaVazia = (x: { titulo?: string; corpo?: string; imagens?: unknown[]; tags?: unknown[] }) =>
  !x.titulo?.trim() && !(x.corpo ?? '').replace(/<[^>]+>|&nbsp;/g, '').trim() && !x.imagens?.length && !x.tags?.length

/** Conteúdos criados ou editados mais recentemente, de todas as áreas. */
export async function atividadeRecente(limite = 40): Promise<ItemAtividade[]> {
  const out: ItemAtividade[] = []
  for (const tipo of TABELAS) {
    const d = DEF[tipo]!
    const xs = await db.table(d.tabela).orderBy('atualizadoEm').reverse().limit(limite * 2).toArray()
    for (const x of xs) {
      if (x.excluido || (tipo === 'nota' && notaVazia(x))) continue
      out.push({ tipo, id: x.id, ...d.r(x), quando: x.atualizadoEm, rotulo: ROTULO[tipo] ?? tipo })
    }
  }
  return out.sort((a, b) => b.quando - a.quando).slice(0, limite)
}
