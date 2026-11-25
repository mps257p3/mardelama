import { db, type Tipo } from '../db/schema'

export interface Resumo { tipo: Tipo; id: string; titulo: string; sub: string; foto?: string; fotoUrl?: string; to: string }

export const ROTULO: Partial<Record<Tipo, string>> = {
  esmalte: 'Esmalte', receita: 'Receita', teste: 'Teste', material: 'Material',
  referencia: 'Referência', conteudo: 'Biblioteca', nota: 'Caderno', painel: 'Painel',
  familia: 'Família', curva: 'Curva de queima', comercial: 'Engenharia reversa',
  artista: 'Artista', obra: 'Obra', projeto: 'Série', entrada: 'Minha obra', colecao: 'Coleção', exposicao: 'Exposição', ideia: 'Ideia de esmaltação',
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export const DEF: Partial<Record<Tipo, { tabela: string; r: (x: any) => Omit<Resumo, 'tipo' | 'id'> }>> = {
  esmalte: { tabela: 'esmaltes', r: (x) => ({ titulo: x.nome, sub: x.codigo, foto: x.fotos?.[0], to: `/esmaltes/${x.id}` }) },
  receita: { tabela: 'receitas', r: (x) => ({ titulo: x.nome, sub: `versão ${x.versaoAtual}`, to: `/receitas/${x.id}` }) },
  teste: { tabela: 'testes', r: (x) => ({ titulo: x.codigo, sub: x.resultado || x.data, foto: x.fotos?.[0], to: `/testes/${x.id}` }) },
  material: { tabela: 'materiais', r: (x) => ({ titulo: x.nome, sub: x.categoria, foto: x.fotos?.[0], to: `/materiais/${x.id}` }) },
  referencia: { tabela: 'referencias', r: (x) => ({ titulo: x.titulo, sub: x.autor || x.tipo, foto: x.imagens?.[0], fotoUrl: x.imagemExterna, to: `/referencias/${x.id}` }) },
  conteudo: { tabela: 'conteudos', r: (x) => ({ titulo: x.titulo, sub: x.categoria, to: `/biblioteca/${x.id}` }) },
  familia: { tabela: 'familias', r: (x) => ({ titulo: x.nome, sub: x.codigo ?? 'Família', to: `/familias/${x.id}` }) },
  curva: { tabela: 'curvas', r: (x) => ({ titulo: x.nome, sub: x.codigo, to: `/curvas/${x.id}` }) },
  comercial: { tabela: 'comerciais', r: (x) => ({ titulo: `${x.fabricante} ${x.nome}`, sub: x.codigo ?? 'Esmalte comercial', foto: x.fotos?.[0], to: `/engenharia-reversa/${x.id}` }) },
  artista: { tabela: 'artistas', r: (x) => ({ titulo: x.nome, sub: [x.pais?.join(' / '), x.especialidade].filter(Boolean).join(' · '), foto: x.fotos?.[0], fotoUrl: x.retrato, to: `/biblioteca/artistas/${x.id}` }) },
  obra: { tabela: 'obras', r: (x) => ({ titulo: x.titulo || x.serie || 'Obra sem título', sub: [x.serie, x.ano].filter(Boolean).join(' · ') || 'Obra', foto: x.arquivo, fotoUrl: x.imagem, to: `/biblioteca/obras/${x.id}` }) },
  colecao: { tabela: 'colecoes', r: (x) => ({ titulo: x.nome, sub: `${x.itens?.length ?? 0} itens`, to: `/biblioteca/colecoes/${x.id}` }) },
  exposicao: { tabela: 'exposicoes', r: (x) => ({ titulo: x.titulo, sub: [x.local, x.fim ? 'até ' + x.fim.split('-').reverse().join('/') : x.fimAprox].filter(Boolean).join(' · '), to: `/biblioteca/agenda#${x.id}` }) },
  projeto: { tabela: 'projetos', r: (x) => ({ titulo: x.nome, sub: ['Série', x.ano].filter(Boolean).join(' · '), foto: x.capa, to: `/obras/serie/${x.id}` }) },
  entrada: { tabela: 'entrada', r: (x) => ({ titulo: x.titulo || 'Sem título', sub: x.tipo === 'estudo' ? 'Estudo' : 'Minha obra', foto: x.fotos?.[0], to: `/obras/peca/${x.id}` }) },
  ideia: { tabela: 'ideias', r: (x) => ({ titulo: x.titulo || 'Ideia de esmaltação', sub: (x.efeitos ?? []).join(', ') || 'Ideia de esmaltação', foto: x.imagens?.[0], fotoUrl: x.imagemExterna, to: `/ideias/${x.id}` }) },
  nota: { tabela: 'notas', r: (x) => ({ titulo: x.titulo || 'Anotação', sub: new Date(x.criadoEm).toLocaleDateString('pt-BR'), foto: x.imagens?.[0], to: `/caderno/${x.id}` }) },
}

export const TIPOS_RELACIONAVEIS = Object.keys(DEF) as Tipo[]

export async function resumo(tipo: Tipo, id: string): Promise<Resumo | undefined> {
  const d = DEF[tipo]; if (!d) return
  const x = await db.table(d.tabela).get(id)
  if (!x || x.excluido) return
  return { tipo, id, ...d.r(x) }
}

export async function buscarTodos(q: string, limite = 40): Promise<Resumo[]> {
  const n = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  const termos = n(q.trim()).split(/\s+/).filter(Boolean)
  const out: Resumo[] = []
  for (const tipo of TIPOS_RELACIONAVEIS) {
    const d = DEF[tipo]!
    const xs = await db.table(d.tabela).toArray()
    for (const x of xs) {
      if (x.excluido) continue
      const { blob: _b, ...semBlob } = x
      const texto = n(JSON.stringify(semBlob).replace(/<[^>]+>/g, ' '))
      if (!termos.length || termos.every((t) => texto.includes(t))) out.push({ tipo, id: x.id, ...d.r(x) })
    }
  }
  return out.slice(0, limite)
}
