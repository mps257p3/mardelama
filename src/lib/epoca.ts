import type { ItemDescoberta } from './fontes'

/** Filtro de época do Descobrir. Os acervos de museu são majoritariamente antigos; este filtro ajuda a achar o atual. */
export type Epoca = 'todas' | 'contemporanea' | 'moderna' | 'antiga'
export const EPOCAS: [Epoca, string, string][] = [
  ['todas', 'Todas as épocas', ''],
  ['contemporanea', 'Contemporânea', 'de 1970 até hoje'],
  ['moderna', 'Moderna', '1880 a 1970'],
  ['antiga', 'Antiga', 'antes de 1880'],
]
const FAIXA: Record<Exclude<Epoca, 'todas'>, [number, number]> = { contemporanea: [1970, 9999], moderna: [1880, 1969], antiga: [-99999, 1879] }
/** Palavras somadas às consultas para puxar material da época (os acervos indexam esses termos). */
export const REFORCO: Record<Exclude<Epoca, 'todas'>, string[]> = {
  contemporanea: ['contemporary', '21st century', 'contemporary art'],
  moderna: ['modernist', '20th century', 'avant-garde'],
  antiga: [],
}

/** Ano aproximado a partir do texto de data das fontes ("ca. 1920", "19th century", "500 BCE", "2015–2018"). */
export function anoDe(data?: string): number | undefined {
  if (!data) return undefined
  const s = data.toLowerCase()
  const sec = /(\d{1,2})(st|nd|rd|th)\s+century/.exec(s) ?? /s[ée]culo\s+([xivl]+)/.exec(s)
  const ac = /\b(bce|bc|b\.c\.|a\.c\.)\b/.test(s)
  if (sec) {
    const n = /^\d+$/.test(sec[1]) ? Number(sec[1]) : romano(sec[1])
    const ano = (n - 1) * 100 + 50
    return ac ? -ano : ano
  }
  const m = /(\d{3,4})/.exec(s)
  if (!m) return undefined
  const ano = Number(m[1])
  return ac ? -ano : ano
}
function romano(r: string) {
  const v: Record<string, number> = { i: 1, v: 5, x: 10, l: 50 }
  let t = 0
  for (let i = 0; i < r.length; i++) { const a = v[r[i]] ?? 0, b = v[r[i + 1]] ?? 0; t += a < b ? -a : a }
  return t
}

/** Item sem data só entra quando nenhuma época está escolhida, exceto fotos do Openverse (quase sempre recentes).
 * No Wikimedia a data é a da foto, não a da obra: lá a data não serve para a época. */
export function naEpoca(x: ItemDescoberta, e: Epoca) {
  if (e === 'todas') return true
  const ano = x.fonte === 'wm' ? undefined : anoDe(x.data)
  if (ano == null) return e === 'contemporanea' && x.fonte === 'ov'
  const [de, ate] = FAIXA[e]
  return ano >= de && ano <= ate
}
