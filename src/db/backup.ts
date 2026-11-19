import { db } from './schema'

const TABELAS = ['familias', 'esmaltes', 'receitas', 'versoes', 'testes', 'materiais', 'referencias', 'grupos', 'paineis', 'conteudos', 'notas', 'relacoes', 'ajustes'] as const

const b64 = (blob: Blob) => new Promise<string>((ok, err) => {
  const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = err; r.readAsDataURL(blob)
})

/** Exporta todo o ateliê (dados + imagens + arquivos) em um único arquivo JSON. */
export async function exportarTudo(): Promise<Blob> {
  const dados: Record<string, unknown[]> = {}
  for (const t of TABELAS) dados[t] = await db.table(t).toArray()
  const arquivos = await db.arquivos.toArray()
  dados.arquivos = await Promise.all(arquivos.map(async ({ blob, ...a }) => ({ ...a, dataUrl: await b64(blob) })))
  const json = JSON.stringify({ app: 'atelie-mp', formato: 1, exportadoEm: new Date().toISOString(), dados })
  return new Blob([json], { type: 'application/json' })
}

/** Importa um backup, mesclando: registros com o mesmo id são substituídos pela versão mais recente. */
export async function importarTudo(file: File) {
  const txt = await file.text()
  const j = JSON.parse(txt)
  if (j.app !== 'atelie-mp') throw new Error('Este arquivo não é um backup do ateliê.')
  const d = j.dados as Record<string, any[]>
  let n = 0
  await db.transaction('rw', db.tables, async () => {
    for (const t of TABELAS) {
      const linhas = d[t] ?? []
      for (const l of linhas) {
        const atual = await db.table(t).get(t === 'ajustes' ? l.chave : l.id)
        if (!atual || !('atualizadoEm' in l) || (l.atualizadoEm ?? 0) >= (atual.atualizadoEm ?? 0)) { await db.table(t).put(l); n++ }
      }
    }
    for (const a of d.arquivos ?? []) {
      const { dataUrl, ...resto } = a
      const blob = await (await fetch(dataUrl)).blob()
      await db.arquivos.put({ ...resto, blob }); n++
    }
  })
  return n
}

export function baixar(blob: Blob, nome: string) {
  const u = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), { href: u, download: nome })
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(u), 2000)
}
