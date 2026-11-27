import type { Esmalte, ResultadoTemperatura } from '../db/schema'

/**
 * Tabela central de equivalência cone → °C, usada por todos os esmaltes, testes e calculadoras.
 * Cones autossustentáveis Orton, aquecimento de 150 °C/h nos últimos 100 °C da queima.
 * O zero à esquerda faz parte do nome: 06 (≈1013 °C) e 6 (≈1243 °C) são cones diferentes.
 */
export const TABELA_CONES = {
  fonte: 'Temperature Equivalents for Orton Pyrometric Cones, Edward Orton Jr. Ceramic Foundation',
  tipo: 'cones autossustentáveis Orton',
  taxa: '150 °C/h nos últimos 100 °C da queima',
  url: 'https://www.ortonceramic.com/pyrometric-cones-resources',
} as const

export const CONES: { cone: string; c: number }[] = [
  { cone: '022', c: 630 }, { cone: '021', c: 643 }, { cone: '020', c: 666 }, { cone: '019', c: 695 }, { cone: '018', c: 734 },
  { cone: '017', c: 763 }, { cone: '016', c: 796 }, { cone: '015', c: 818 }, { cone: '014', c: 838 }, { cone: '013', c: 861 },
  { cone: '012', c: 882 }, { cone: '011', c: 894 }, { cone: '010', c: 915 }, { cone: '09', c: 930 }, { cone: '08', c: 956 },
  { cone: '07', c: 987 }, { cone: '06', c: 1013 }, { cone: '05½', c: 1025 }, { cone: '05', c: 1044 }, { cone: '04', c: 1077 },
  { cone: '03', c: 1104 }, { cone: '02', c: 1122 }, { cone: '01', c: 1138 }, { cone: '1', c: 1154 }, { cone: '2', c: 1164 },
  { cone: '3', c: 1170 }, { cone: '4', c: 1183 }, { cone: '5', c: 1207 }, { cone: '6', c: 1243 }, { cone: '7', c: 1257 },
  { cone: '8', c: 1271 }, { cone: '9', c: 1280 }, { cone: '10', c: 1305 }, { cone: '11', c: 1315 }, { cone: '12', c: 1326 },
  { cone: '13', c: 1348 }, { cone: '14', c: 1384 },
]

export const EXPLICACAO_CONE = 'O cone pirométrico é uma referência de trabalho térmico para a maturação do esmalte, considerando os efeitos combinados da temperatura e do tempo de queima. Sua equivalência em graus Celsius é aproximada e depende da curva de queima.'

/** Normaliza a grafia sem mexer no zero à esquerda: "Cone 05 1/2" → "05½". */
const normaliza = (c: string) => c.trim().replace(/^cone\s*/i, '').replace(/\s*(1\/2|,5|\.5)$/, '½')

export const tempDoCone = (cone?: string) => (cone ? CONES.find((x) => x.cone === normaliza(cone))?.c : undefined)
export const coneMaisProximo = (t?: number) =>
  t == null ? undefined : CONES.reduce((a, b) => (Math.abs(b.c - t) < Math.abs(a.c - t) ? b : a)).cone

/** Cones citados num texto ("5-6", "06/05", "4 a 6", "cone 6"), na ordem, com o zero à esquerda preservado. */
export function conesDoTexto(t?: string): string[] {
  if (!t) return []
  return [...t.replace(/cones?\s*/gi, '').matchAll(/\b0?\d{1,2}(?!\d)(?:\s*(?:½|1\/2))?/g)].map((m) => normaliza(m[0])).filter((c) => CONES.some((x) => x.cone === c))
}

/** Temperatura de referência de um cone ou faixa de cones: "1243 °C" ou "1207 a 1243 °C". */
export function referenciaDoCone(cone?: string): string | undefined {
  const cs = conesDoTexto(cone)
  if (!cs.length) return undefined
  const ts = cs.map((c) => tempDoCone(c)!).sort((a, b) => a - b)
  const [min, max] = [ts[0], ts[ts.length - 1]]
  return min === max ? `${min} °C` : `${min} a ${max} °C`
}

/**
 * Temperatura do cabeçalho. A informada pelo fabricante fica como veio; sem ela, a equivalência do cone vira "Referência".
 * Só com a temperatura, nenhum cone é atribuído.
 */
export function temperaturaDaFicha(e: Esmalte): { valor: string; referencia: boolean } | undefined {
  if (e.temperaturaFabricante?.trim()) return { valor: e.temperaturaFabricante.trim(), referencia: false }
  const comercial = e.origem === 'comercial'
  // num esmalte comercial com cone, o número salvo pode ter vindo de conversão antiga: vale a referência da tabela
  if (comercial && e.cone) { const r = referenciaDoCone(e.cone); if (r) return { valor: r, referencia: true } }
  if (e.temperatura) return { valor: `${Math.round(e.temperatura)} °C`, referencia: false }
  const r = referenciaDoCone(e.cone)
  return r ? { valor: r, referencia: true } : undefined
}

/** Uma queima documentada em texto: cone e temperatura originais; só com cone, a referência entra rotulada. */
export function rotuloQueima(x: Pick<ResultadoTemperatura, 'cone' | 'temperatura'>): string {
  const cone = x.cone && 'Cone ' + x.cone.trim().replace(/^cone\s*/i, '')
  if (!cone) return x.temperatura ?? ''
  if (x.temperatura) return `${cone} (${x.temperatura})`
  const r = referenciaDoCone(x.cone)
  return r ? `${cone} (Referência ${r})` : cone
}
