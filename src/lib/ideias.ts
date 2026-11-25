import { db, novo, type IdeiaEsmalte, type Referencia, type Teste } from '../db/schema'
import { proximoCodigo } from '../db/codigos'
import { FONTE, type ItemDescoberta } from './fontes'

/** Efeitos de superfície para marcar e filtrar as ideias. */
export const EFEITOS = [
  'Escorrido', 'Camadas sobrepostas', 'Crawl (retraído)', 'Cristais', 'Craquelê', 'Variegado', 'Manchado', 'Gotas',
  'Fosco', 'Acetinado', 'Brilhante', 'Texturizado', 'Lunar / crateras', 'Breaking (borda clara)', 'Gradiente', 'Pintado / pincelado',
  'Engobe', 'Óxidos', 'Cinzas', 'Redução', 'Lustre / metálico',
]

/** Ideia nova e vazia (a página abre já para preencher). */
export async function novaIdeia(dados: Partial<IdeiaEsmalte> = {}) {
  const x = novo({ titulo: '', imagens: [], efeitos: [], familias: [], tags: [], ...dados }) as IdeiaEsmalte
  await db.ideias.add(x)
  return x.id
}

async function jaExiste(origem: string) {
  const x = await db.ideias.where('origem').equals(origem).first()
  return x && !x.excluido ? x.id : undefined
}

/** Leva uma imagem do Descobrir para as ideias (com crédito e link), sem duplicar. */
export async function ideiaDeDescobrir(item: ItemDescoberta) {
  const origem = 'descobrir:' + item.id
  const ja = await jaExiste(origem); if (ja) return ja
  const { salvarArquivoDeUrl } = await import('../db/files')
  const arq = await salvarArquivoDeUrl(item.imagemGrande, item.titulo).catch(() => salvarArquivoDeUrl(item.imagem, item.titulo)).catch(() => undefined)
  return novaIdeia({
    titulo: item.titulo, imagens: arq ? [arq] : [], imagemExterna: arq ? undefined : item.imagemGrande,
    autor: item.autor, fonte: `${FONTE[item.fonte].nome}${item.data ? ' · ' + item.data : ''}`, url: item.link, origem,
  })
}

/** Leva uma referência do acervo para as ideias (as fotos são as mesmas, não duplica arquivo). */
export async function ideiaDeReferencia(r: Referencia) {
  const origem = 'referencia:' + r.id
  const ja = await jaExiste(origem); if (ja) return ja
  return novaIdeia({
    titulo: r.titulo, imagens: [...r.imagens], imagemExterna: r.imagemExterna, autor: r.autor, fonte: r.fonte, url: r.url,
    notas: r.descricao, origem,
  })
}

/** Cria um teste planejado a partir da ideia; o resultado da queima fica ao lado da imagem original. */
export async function testarIdeia(i: IdeiaEsmalte) {
  const plano = [i.titulo && `Ideia: ${i.titulo}`, i.esmaltes && `Esmaltes: ${i.esmaltes}`, i.efeitos.length && `Efeito: ${i.efeitos.join(', ')}`].filter(Boolean).join(' · ')
  const t = novo({
    codigo: await proximoCodigo('T', 'testes', 4), fotos: [], data: new Date().toISOString().slice(0, 10),
    argila: i.argila, camadas: 2, defeitos: [], combinacao: [], planejado: 1, ideiaId: i.id,
    descricaoPlano: plano || undefined, observacoes: i.queima ? `Queima da ideia: ${i.queima}` : undefined,
  }) as Teste
  await db.testes.add(t)
  return t.id
}
