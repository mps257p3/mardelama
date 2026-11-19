import { db } from './schema'

export const FAMILIAS_INICIAIS = [
  'Transparente', 'Branco opaco', 'Fosco', 'Acetinado', 'Retração (crawling)',
  'Vulcânico', 'Cristalino', 'Fundente', 'Metálico', 'Craquelado',
]

export const GRUPOS_INICIAIS = [
  'Animais', 'Figuras humanas', 'Surrealismo', 'Humor', 'Estranhamento', 'Grafismos',
  'Esculturas de parede', 'Texturas', 'Combinações cromáticas', 'Ilustração',
  'Formas orgânicas', 'Tipografia',
]

export async function seedIfEmpty() {
  // famílias e grupos agora nascem com ids fixos na base de conhecimento (sem duplicar entre aparelhos)
  await db.ajustes.put({ chave: 'seed-v1', valor: true })
  await seedBibliotecaV2()
  const { semearConhecimento } = await import('./conhecimento')
  await semearConhecimento()
}

const curva = (titulo: string, linhas: [string, string, string][], patamar: string) => `<p>${titulo}</p><table><thead><tr><th>Faixa</th><th>Tempo</th><th>Taxa</th></tr></thead><tbody>${linhas.map(([a, b, c]) => `<tr><td>${a}</td><td>${b}</td><td>${c}</td></tr>`).join('')}</tbody></table><p>${patamar}</p><blockquote>Não existe programação perfeita, existe a que é mais adequada para você.</blockquote>`

/** Conteúdos iniciais da biblioteca (curvas de queima guardadas na pasta do ateliê). */
export async function seedBibliotecaV2() {
  if (await db.ajustes.get('seed-v2')) return
  const fonte = 'Ateliê do Quintal Cerâmica (@ateliedoquintalceramica, Instagram)'
  const T = Date.UTC(2026, 10, 19, 12)
  const fixo = (id: string) => ({ id, criadoEm: T, atualizadoEm: T, excluido: 0 as const, favorito: 0 as const })
  const existentes = (await db.conteudos.where('categoria').equals('Curvas de temperatura').toArray()).map((c) => c.titulo)
  const itens = [
    { ...fixo('bib-curva-biscoito-1050'), titulo: 'Queima de biscoito 1050 °C', categoria: 'Curvas de temperatura', formato: 'texto' as const, autor: fonte, arquivos: [], tags: ['biscoito', 'curva', '1050'],
      corpo: curva('Programação sugerida para queima de biscoito, total aproximado de 9h15.', [['25 °C a 200 °C', '3:00 h', '1 °C/min'], ['200 °C a 600 °C', '3:30 h', '1,9 °C/min'], ['600 °C a 1050 °C', '2:30 h', '3 °C/min']], 'Patamar de 15 minutos a 1050 °C.') },
    { ...fixo('bib-curva-esmalte-1260'), titulo: 'Queima de esmalte 1260 °C', categoria: 'Curvas de temperatura', formato: 'texto' as const, autor: fonte, arquivos: [], tags: ['esmalte', 'curva', '1260', 'alta temperatura'],
      corpo: curva('Programação sugerida para queima de esmalte em alta temperatura, total aproximado de 8h20.', [['40 °C a 800 °C', '4:00 h', '3,1 °C/min'], ['800 °C a 1200 °C', '3:00 h', '2,2 °C/min'], ['1200 °C a 1260 °C', '1:00 h', '1 °C/min']], 'Patamar de 20 minutos a 1260 °C.') },
  ]
  for (const i of itens) if (!existentes.includes(i.titulo) && !(await db.conteudos.get(i.id))) await db.conteudos.add(i)
  await db.ajustes.put({ chave: 'seed-v2', valor: true })
}
