import { db, novo } from './schema'

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
  const feito = await db.ajustes.get('seed-v1')
  if (feito) return
  await db.transaction('rw', db.familias, db.grupos, db.ajustes, async () => {
    if ((await db.familias.count()) === 0)
      await db.familias.bulkAdd(FAMILIAS_INICIAIS.map((nome, ordem) => novo({ nome, ordem })))
    if ((await db.grupos.count()) === 0)
      await db.grupos.bulkAdd(GRUPOS_INICIAIS.map((nome) => novo({ nome })))
    await db.ajustes.put({ chave: 'seed-v1', valor: true })
  })
}
