// Gera public/fenomenos/<id>.svg: infográficos técnicos dos fenômenos cerâmicos (um arquivo por fenômeno).
// Uma ilustração por fenômeno, só com o conceito principal: vista de cima de uma prova ou corte transversal,
// massa hachurada, esmalte em tons discretos, setas terracota quando há movimento. Sem texto, sem vistas extras.
// Uso: node scripts/infograficos/gerar.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../public/fenomenos')
const C = {
  fundo: '#F3EEE6', linha: '#3A3836', fina: '#7C7268', massa: '#DCC7B1', hach: '#B79A80',
  e1: '#B7C7CC', e1b: '#8FA5AD', e2: '#E2C9A2', e2b: '#C9A273', seta: '#B46E4B', azul: '#3D5965',
  mistura: '#C4B9A0', cristal: '#EEF1EE', ar: '#F8F5EF', metal: '#7A6248', luz: '#D9A441',
}
const f = (n) => Math.round(n * 10) / 10
function rng(seed) { let a = seed; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
/** Linha amostrada de uma função y(x). */
const curva = (x0, x1, fy, n = 60) => Array.from({ length: n + 1 }, (_, i) => { const x = x0 + ((x1 - x0) * i) / n; return [f(x), f(fy(x))] })
const pts = (p) => p.map(([x, y]) => `${x},${y}`).join(' ')
const L = (p) => 'M' + p.map(([x, y]) => `${x},${y}`).join('L')
/** Faixa entre duas curvas (de cima e de baixo), fechada. */
const faixa = (cima, baixo) => L(cima) + 'L' + [...baixo].reverse().map(([x, y]) => `${x},${y}`).join('L') + 'Z'

const defs = `<defs>
<pattern id="h" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="${C.massa}"/><line x1="0" y1="0" x2="0" y2="5" stroke="${C.hach}" stroke-width="0.7"/></pattern>
<marker id="a" viewBox="0 0 8 8" refX="6.5" refY="4" markerWidth="5.5" markerHeight="5.5" orient="auto-start-reverse"><path d="M0.5,0.8L7,4L0.5,7.2" fill="none" stroke="${C.seta}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></marker>
<marker id="aa" viewBox="0 0 8 8" refX="6.5" refY="4" markerWidth="5.5" markerHeight="5.5" orient="auto-start-reverse"><path d="M0.5,0.8L7,4L0.5,7.2" fill="none" stroke="${C.azul}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></marker>
<marker id="al" viewBox="0 0 8 8" refX="6.5" refY="4" markerWidth="5.5" markerHeight="5.5" orient="auto-start-reverse"><path d="M0.5,0.8L7,4L0.5,7.2" fill="none" stroke="${C.luz}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></marker>
</defs>`
const svg = (corpo) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><rect width="200" height="200" fill="${C.fundo}"/>${defs}${corpo}</svg>\n`
const massa = (d) => `<path d="${d}" fill="url(#h)" stroke="${C.linha}" stroke-width="0.9" stroke-linejoin="round"/>`
const camada = (d, cor = C.e1, op = 1) => `<path d="${d}" fill="${cor}" fill-opacity="${op}" stroke="${C.linha}" stroke-width="0.9" stroke-linejoin="round"/>`
const seta = (d, m = 'a', cor = C.seta, w = 1.3, extra = '') => `<path d="${d}" fill="none" stroke="${cor}" stroke-width="${w}" stroke-linecap="round" marker-end="url(#${m})" ${extra}/>`
/** Bloco padrão de massa em corte: topo em y, base em 212. */
const BASE = 174
const blocoMassa = (topo) => massa(L(topo) + `L${topo.at(-1)[0]},${BASE}L${topo[0][0]},${BASE}Z`)

const D = {}
// vista de cima: prova quadrada de cantos arredondados, com o conteúdo recortado nela
const PX0 = 26, PX1 = 174
const prova = (conteudo, fundo = C.e1) => `<clipPath id="p"><rect x="${PX0}" y="${PX0}" width="${PX1 - PX0}" height="${PX1 - PX0}" rx="6"/></clipPath>`
  + `<rect x="${PX0}" y="${PX0}" width="${PX1 - PX0}" height="${PX1 - PX0}" rx="6" fill="${fundo}"/><g clip-path="url(#p)">${conteudo}</g>`
  + `<rect x="${PX0}" y="${PX0}" width="${PX1 - PX0}" height="${PX1 - PX0}" rx="6" fill="none" stroke="${C.linha}" stroke-width="0.9"/>`
const blob = (cx, cy, rx, ry, n, j, r) => { const p = Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2, k = 1 + (r() - 0.5) * 2 * j; return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k] }); return suave(p) }
function suave(p) {
  const n = p.length, at = (i) => p[(i + n) % n]
  let d = `M${f(p[0][0])},${f(p[0][1])}`
  for (let i = 0; i < n; i++) { const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)]; d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}` }
  return d + 'Z'
}
// corte: bloco de massa de x 22 a 178, topo dado
const X0 = 26, X1 = 174

D.escorrimento = () => {
  // superfície vertical (de frente): o esmalte desce por gravidade e forma línguas
  const ling = [[44, 46], [64, 70], [86, 38], [106, 82], [128, 54], [150, 74]]
  let d = `M${PX0},${PX0}L${PX1},${PX0}L${PX1},86`
  for (let i = ling.length - 1; i >= 0; i--) { const [x, L] = ling[i]; d += `L${x + 9},86C${x + 9},${86 + L * 0.7} ${x + 6},${86 + L} ${x},${86 + L}C${x - 6},${86 + L} ${x - 9},${86 + L * 0.7} ${x - 9},86` }
  d += `L${PX0},86Z`
  return svg(prova(`<path d="${d}" fill="${C.e1}" stroke="${C.linha}" stroke-width="0.9"/>`, 'url(#h)') + seta('M187,60L187,140'))
}
D.sobreposicao = () => {
  // duas camadas parcialmente sobrepostas: a área comum mostra as duas
  const A = `<rect x="34" y="40" width="88" height="112" rx="5" fill="${C.e2}" stroke="${C.linha}" stroke-width="0.9"/>`
  const B = `<rect x="78" y="56" width="88" height="112" rx="5" fill="${C.e1b}" fill-opacity="0.72" stroke="${C.linha}" stroke-width="0.9"/>`
  return svg(prova('', 'url(#h)') + A + B)
}
D.reatividade = () => {
  // dois esmaltes lado a lado; na região de contato surgem halos e manchas que nenhum dos dois tem sozinho
  const r = rng(4)
  let zona = ''
  for (let i = 0; i < 22; i++) { const y = 30 + r() * 140, x = 92 + (r() - 0.5) * 34, rr = 3 + r() * 6; zona += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rr * 1.1)}" ry="${f(rr)}" fill="${C.cristal}" stroke="${C.e2b}" stroke-width="1.6"/>` }
  const borda = `M100,${PX0}C88,60 112,90 98,120S104,160 100,${PX1}`
  const dir = `<path d="${borda}L${PX1},${PX1}L${PX1},${PX0}Z" fill="${C.e2}"/>`
  return svg(prova(dir + `<path d="M80,${PX0}C70,70 92,100 80,130S86,165 82,${PX1}L118,${PX1}C114,160 124,130 116,110S120,60 118,${PX0}Z" fill="${C.mistura}"/>` + zona, C.e1b))
}
D.flutuacao = () => {
  // véus de outra cor que parecem flutuar sobre o esmalte
  const v = [`M30,62C60,44 90,70 120,54S168,50 172,64L172,82C140,96 110,74 80,90S40,96 30,84Z`, `M30,118C52,104 84,126 112,112S160,104 172,118L172,132C146,146 114,128 88,140S44,146 30,136Z`]
  return svg(prova(v.map((d) => `<path d="${d}" fill="${C.e1}" fill-opacity="0.9" stroke="${C.azul}" stroke-width="0.7"/>`).join(''), C.e2b))
}
D.cristalizacao = () => {
  const leque = (cx, cy, R, n) => Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2; return `M${cx},${cy}L${f(cx + Math.cos(a) * R)},${f(cy + Math.sin(a) * R)}` }).join('')
  const ros = (cx, cy, R) => `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${C.cristal}" stroke="${C.azul}" stroke-width="0.7"/><path d="${leque(cx, cy, R - 1, 32)}" stroke="${C.e1b}" stroke-width="0.55"/>`
  return svg(prova(ros(74, 78, 30) + ros(130, 120, 24) + ros(132, 56, 13) + ros(64, 140, 15), C.e1b))
}
D.craquele = () => {
  const nos = [[26, 58], [70, 50], [62, 94], [104, 84], [96, 26], [136, 60], [128, 118], [174, 98], [152, 26], [174, 52], [168, 174], [110, 150], [74, 174], [26, 120], [92, 174], [40, 150]]
  const ar = [[0, 1], [1, 2], [2, 3], [1, 4], [3, 5], [5, 4], [3, 6], [6, 7], [5, 8], [5, 9], [6, 10], [6, 11], [11, 12], [2, 13], [11, 14], [13, 15], [15, 12], [2, 15]]
  const r = rng(12)
  let d = ''
  for (const [a, b] of ar) { const [x1, y1] = nos[a], [x2, y2] = nos[b]; d += `M${x1},${y1}Q${f((x1 + x2) / 2 + (r() - 0.5) * 10)},${f((y1 + y2) / 2 + (r() - 0.5) * 10)} ${x2},${y2}` }
  return svg(prova(`<path d="${d}" fill="none" stroke="${C.linha}" stroke-width="1"/>`, C.e1))
}
D.crawling = () => {
  const r = rng(21)
  const ilhas = [[64, 62, 30, 24], [128, 58, 28, 22], [70, 128, 32, 26], [136, 126, 26, 28]].map(([x, y, a, b]) => `<path d="${blob(x, y, a, b, 10, 0.16, r)}" fill="${C.e1}" stroke="${C.linha}" stroke-width="0.9"/>`).join('')
  return svg(prova(ilhas, 'url(#h)'))
}
D.acumulo = () => {
  // corte: incisões na superfície; o esmalte se acumula nelas e fica mais escuro
  const sulcos = [62, 100, 138]
  const rel = (x) => 84 + sulcos.reduce((s, c) => s + 20 * Math.exp(-Math.pow((x - c) / 8, 2)), 0)
  const topo = curva(X0, X1, rel, 160)
  const sup = curva(X0, X1, (x) => 79 + sulcos.reduce((s, c) => s + 3 * Math.exp(-Math.pow((x - c) / 10, 2)), 0), 160)
  return svg(massa(L(topo) + `L${X1},${BASE}L${X0},${BASE}Z`) + camada(faixa(sup, topo), C.e1b))
}
D.quebraBordas = () => {
  // corte de uma aresta: a camada afina no alto e a cor muda
  const perfil = (x) => 172 - 90 * Math.exp(-Math.pow((x - 100) / 30, 2))
  const esp = (x) => 3 + 9 * (1 - Math.exp(-Math.pow((x - 100) / 22, 2)))
  const topo = curva(X0, X1, perfil, 140), sup = curva(X0, X1, (x) => perfil(x) - esp(x), 140)
  const fino = `<path d="${faixa(curva(86, 114, (x) => perfil(x) - esp(x)), curva(86, 114, perfil))}" fill="${C.e2}"/>`
  return svg(massa(L(topo) + `L${X1},${BASE}L${X0},${BASE}Z`) + camada(faixa(sup, topo), C.e1b) + fino)
}
D.bolhas = () => {
  // corte: bolhas de gás presas no vidro e uma que estourou na superfície
  const sup = (x) => (x > 118 && x < 146 ? 62 + 10 * Math.sin(((x - 118) / 28) * Math.PI) : 62)
  const vidro = camada(faixa(curva(X0, X1, sup, 200), curva(X0, X1, () => 112)), C.e1)
  const b = [[46, 84, 8], [82, 76, 10], [100, 98, 5], [156, 88, 7], [64, 102, 3.5], [166, 104, 3]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${C.ar}" stroke="${C.linha}" stroke-width="0.8"/>`).join('')
  return svg(massa(`M${X0},112L${X1},112L${X1},${BASE}L${X0},${BASE}Z`) + vidro + b)
}
D.separacaoFases = () => {
  const r = rng(8)
  let g = ''
  for (let i = 0; i < 46; i++) g += `<circle cx="${f(30 + r() * 140)}" cy="${f(30 + r() * 140)}" r="${f(2.5 + r() * 6)}" fill="${C.cristal}" fill-opacity="0.9" stroke="${C.azul}" stroke-width="0.5"/>`
  return svg(prova(g, C.e1b))
}
D.opalescencia = () => {
  // corte: a luz entra; o azul volta para quem olha, o âmbar atravessa
  const vidro = camada(faixa(curva(X0, X1, () => 96), curva(X0, X1, () => 136)), C.e1)
  const r = rng(14)
  let g = ''
  for (let i = 0; i < 50; i++) g += `<circle cx="${f(26 + r() * 148)}" cy="${f(104 + r() * 32)}" r="0.9" fill="${C.ar}"/>`
  return svg(massa(`M${X0},136L${X1},136L${X1},${BASE}L${X0},${BASE}Z`) + vidro + g + seta('M48,30L94,112', 'al', C.luz, 1.6) + seta('M96,114L138,40', 'aa', C.azul, 1.5) + seta('M96,114L118,166', 'al', C.e2b, 1.6))
}
D.opacidade = () => {
  // a mesma camada passa de translúcida (a massa aparece) a opaca
  const grad = `<defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="${C.cristal}" stop-opacity="0.15"/><stop offset="1" stop-color="${C.cristal}" stop-opacity="1"/></linearGradient></defs>`
  const motivo = [52, 84, 116, 148].map((y) => `<path d="M20,${y}C60,${y - 14} 100,${y + 14} 180,${y}" fill="none" stroke="${C.metal}" stroke-width="5" stroke-linecap="round"/>`).join('')
  return svg(grad + prova(motivo + `<rect x="0" y="0" width="200" height="200" fill="url(#g)"/>`, 'url(#h)'))
}
D.variacaoEspessura = () => {
  const deg = camada(`M${X0},110L${X0},96L76,96L76,82L124,82L124,68L${X1},68L${X1},110Z`, C.e1)
  return svg(massa(`M${X0},110L${X1},110L${X1},${BASE}L${X0},${BASE}Z`) + deg + `<path d="M76,110L76,82L124,82L124,68L${X1},68L${X1},110Z" fill="${C.e1b}" fill-opacity="0.55"/><path d="M124,110L124,68L${X1},68L${X1},110Z" fill="${C.azul}" fill-opacity="0.35"/>`)
}
D.textura = () => {
  const r = rng(2)
  const sup = curva(X0, X1, (x) => 74 + Math.sin(x / 4) * 3 + Math.sin(x / 1.9) * 1.6 + (r() - 0.5) * 3, 160)
  let gr = ''
  for (let i = 0; i < 26; i++) gr += `<circle cx="${f(26 + r() * 148)}" cy="${f(80 + r() * 22)}" r="${f(1.2 + r() * 2)}" fill="${C.e2b}"/>`
  return svg(massa(`M${X0},106L${X1},106L${X1},${BASE}L${X0},${BASE}Z`) + camada(faixa(sup, curva(X0, X1, () => 106)), C.e2) + gr)
}
D.transparencia = () => {
  // vista de cima: um desenho de engobe aparece nítido através do vidro transparente
  return svg(prova(`<path d="M30,76C70,52 110,104 170,72L170,92C110,124 70,72 30,96Z" fill="${C.e2b}"/><path d="M30,124C70,100 110,152 170,120L170,136C110,168 70,116 30,140Z" fill="${C.e2b}"/><rect x="0" y="0" width="200" height="200" fill="${C.cristal}" fill-opacity="0.35"/>`, 'url(#h)'))
}
D.metalico = () => {
  // corte: película metálica na superfície que reflete a luz como espelho
  return svg(massa(`M${X0},126L${X1},126L${X1},${BASE}L${X0},${BASE}Z`) + camada(`M${X0},100L${X1},100L${X1},126L${X0},126Z`, C.e2b) + `<path d="M${X0},100L${X1},100L${X1},105L${X0},105Z" fill="${C.metal}" stroke="${C.linha}" stroke-width="0.7"/>` + seta('M52,28L100,98', 'al', C.luz, 1.6) + seta('M100,98L148,28', 'al', C.luz, 1.6))
}
D.iridescencia = () => {
  // vista de cima: faixas de cor que mudam como numa película fina
  const cores = ['#8FA5AD', '#B7A3C0', '#D9B48A', '#A9C2A4', '#8FA5AD', '#C9A6B4']
  const faixas = cores.map((c, i) => `<path d="M0,${20 + i * 30}C60,${8 + i * 30} 120,${44 + i * 30} 200,${22 + i * 30}L200,${52 + i * 30}C120,${74 + i * 30} 60,${38 + i * 30} 0,${50 + i * 30}Z" fill="${c}" fill-opacity="0.75"/>`).join('')
  return svg(prova(faixas, '#3E4A55'))
}

fs.mkdirSync(DIR, { recursive: true })
for (const [k, fn] of Object.entries(D)) {
  const s = fn().replace(/\n/g, '')
  fs.writeFileSync(path.join(DIR, k + '.svg'), s)
  console.log(k, (s.length / 1024).toFixed(1) + ' KB')
}
