import type { ClasseIngrediente, Ingrediente, Material } from '../db/schema'

export const CLASSES: { v: ClasseIngrediente; l: string }[] = [
  { v: 'base', l: 'Receita base' },
  { v: 'corante', l: 'Corantes' },
  { v: 'opacificante', l: 'Opacificantes' },
  { v: 'aditivo', l: 'Aditivos' },
]

export const somaBase = (ings: Ingrediente[]) => ings.filter((i) => i.classe === 'base').reduce((s, i) => s + (i.percentual || 0), 0)
export const somaExtras = (ings: Ingrediente[]) => ings.filter((i) => i.classe !== 'base').reduce((s, i) => s + (i.percentual || 0), 0)

/** Normaliza a receita base para 100%; corantes, opacificantes e aditivos continuam como % sobre a base. */
export function normalizar(ings: Ingrediente[]): Ingrediente[] {
  const s = somaBase(ings)
  if (!s) return ings
  const out = ings.map((i) => (i.classe === 'base' ? { ...i, percentual: +(i.percentual * 100 / s).toFixed(2) } : i))
  // corrige o arredondamento no maior ingrediente para fechar exatamente 100%
  const resto = +(100 - somaBase(out)).toFixed(2)
  if (resto) {
    let k = -1
    out.forEach((i, j) => { if (i.classe === 'base' && (k < 0 || i.percentual > out[k].percentual)) k = j })
    if (k >= 0) out[k] = { ...out[k], percentual: +(out[k].percentual + resto).toFixed(2) }
  }
  return out
}

/**
 * Pesos para um lote. `pesoBase` é o peso seco da receita base; extras são calculados sobre ele
 * (ex.: 2% de óxido de cobalto sobre 1000 g de base = 20 g), como é a convenção cerâmica.
 */
export function pesos(ings: Ingrediente[], pesoBase: number) {
  const s = somaBase(ings) || 100
  return ings.map((i) => ({
    ...i,
    peso: i.classe === 'base' ? (i.percentual / s) * pesoBase : (i.percentual / 100) * pesoBase,
  }))
}

/** Converte um peso total desejado (base + extras) em peso de base. */
export const baseParaTotal = (ings: Ingrediente[], total: number) => total / (1 + somaExtras(ings) / 100)

export function custo(ings: Ingrediente[], pesoBase: number, materiais: Map<string, Material>) {
  let total = 0
  const faltando: string[] = []
  for (const i of pesos(ings, pesoBase)) {
    const m = i.materialId ? materiais.get(i.materialId) : undefined
    if (m?.precoKg != null) total += (i.peso / 1000) * m.precoKg
    else faltando.push(i.nome)
  }
  return { total, faltando }
}

/** Diferenças por ingrediente entre duas formulações (por nome normalizado). */
export function comparar(a: Ingrediente[], b: Ingrediente[]) {
  const key = (i: Ingrediente) => (i.materialId ?? i.nome.trim().toLowerCase()) + '|' + i.classe
  const na = normalizar(a), nb = normalizar(b)
  const ma = new Map(na.map((i) => [key(i), i])), mb = new Map(nb.map((i) => [key(i), i]))
  const chaves = [...new Set([...ma.keys(), ...mb.keys()])]
  return chaves.map((k) => {
    const x = ma.get(k), y = mb.get(k)
    return { nome: (x ?? y)!.nome, classe: (x ?? y)!.classe, a: x?.percentual, b: y?.percentual, delta: (y?.percentual ?? 0) - (x?.percentual ?? 0) }
  }).sort((p, q) => CLASSES.findIndex((c) => c.v === p.classe) - CLASSES.findIndex((c) => c.v === q.classe))
}

/** Mistura duas receitas (ex.: 70% A + 30% B), combinando ingredientes iguais. */
export function misturar(a: Ingrediente[], b: Ingrediente[], fracA: number): Ingrediente[] {
  const na = normalizar(a), nb = normalizar(b)
  const m = new Map<string, Ingrediente>()
  const add = (i: Ingrediente, f: number) => {
    const k = (i.materialId ?? i.nome.trim().toLowerCase()) + '|' + i.classe
    const cur = m.get(k)
    m.set(k, { ...i, percentual: +((cur?.percentual ?? 0) + i.percentual * f).toFixed(3) })
  }
  na.forEach((i) => add(i, fracA)); nb.forEach((i) => add(i, 1 - fracA))
  return [...m.values()].filter((i) => i.percentual > 0)
}

export function receitaComoTexto(nome: string, ings: Ingrediente[], pesoBase?: number, agua?: number) {
  const ps = pesoBase ? pesos(ings, pesoBase) : undefined
  const linhas = [nome, '']
  for (const c of CLASSES) {
    const xs = (ps ?? ings).filter((i) => i.classe === c.v)
    if (!xs.length) continue
    linhas.push(c.l.toUpperCase())
    for (const i of xs) linhas.push(`  ${i.nome.padEnd(28)} ${i.percentual.toFixed(2).padStart(7)} %${ps ? `   ${(i as unknown as { peso: number }).peso.toFixed(1).padStart(8)} g` : ''}`)
    linhas.push('')
  }
  if (agua) linhas.push(`Água: ${agua} ml por 100 g de base`)
  return linhas.join('\n')
}
