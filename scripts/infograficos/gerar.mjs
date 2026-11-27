// Gera public/fenomenos/<id>.svg: infográficos técnicos dos fenômenos cerâmicos (um arquivo por fenômeno).
// Linguagem comum: fundo neutro, cortes transversais com a massa hachurada, camadas de esmalte em tons
// discretos, setas terracota para movimento e interação. Sem texto: a legenda fica no app.
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
const svg = (corpo) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="16 14 208 208" width="208" height="208"><rect width="240" height="240" fill="${C.fundo}"/>${defs}${corpo}</svg>\n`
const massa = (d) => `<path d="${d}" fill="url(#h)" stroke="${C.linha}" stroke-width="0.9" stroke-linejoin="round"/>`
const camada = (d, cor = C.e1, op = 1) => `<path d="${d}" fill="${cor}" fill-opacity="${op}" stroke="${C.linha}" stroke-width="0.9" stroke-linejoin="round"/>`
const seta = (d, m = 'a', cor = C.seta, w = 1.3, extra = '') => `<path d="${d}" fill="none" stroke="${cor}" stroke-width="${w}" stroke-linecap="round" marker-end="url(#${m})" ${extra}/>`
const tracejado = (d) => `<path d="${d}" fill="none" stroke="${C.fina}" stroke-width="0.6" stroke-dasharray="2 2"/>`
/** Bloco padrão de massa em corte: topo em y, base em 212. */
const BASE = 212
const blocoMassa = (topo) => massa(L(topo) + `L${topo.at(-1)[0]},${BASE}L${topo[0][0]},${BASE}Z`)
/** Lente de detalhe: círculo com conteúdo recortado. */
const lente = (id, cx, cy, r, conteudo) => `<clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath><circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.ar}"/><g clip-path="url(#${id})">${conteudo}</g><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.linha}" stroke-width="0.9"/>`
const ligacao = (x1, y1, x2, y2) => `<path d="M${x1},${y1}L${x2},${y2}" stroke="${C.fina}" stroke-width="0.6" stroke-dasharray="2 2"/>`
/** Mini gráfico temperatura × tempo, sem rótulos; `trecho` destacado em terracota. */
function grafico(x, y, w, h, linha, trecho) {
  const P = (p) => p.map(([u, v]) => [f(x + u * w), f(y + h - v * h)])
  return `<g><path d="M${x},${y}L${x},${y + h}L${x + w},${y + h}" fill="none" stroke="${C.fina}" stroke-width="0.7"/>
<polyline points="${pts(P(linha))}" fill="none" stroke="${C.linha}" stroke-width="1"/>
<polyline points="${pts(P(trecho))}" fill="none" stroke="${C.seta}" stroke-width="2.2" stroke-linecap="round"/></g>`
}

const D = {}

D.escorrimento = () => {
  // parede vertical em corte: o esmalte desce e engrossa, formando um cordão; o pé fica limpo
  const parede = massa(`M70,26L104,26L104,214L70,214Z`)
  const fora = (y) => 104 + (y < 40 ? 4 : 4 + Math.pow((y - 40) / 140, 1.8) * 16)
  const lado = curva(26, 176, fora, 50).map(([y, x]) => [x, y])
  const vidro = camada(`M104,26` + lado.map(([x, y]) => `L${x},${y}`).join('') + `Q125,190 114,192Q104,193 104,186Z`, C.e1)
  const pe = `<path d="M104,198L104,214" stroke="${C.linha}" stroke-width="0.9"/>${tracejado('M96,196L134,196')}`
  const setas = [50, 92, 134].map((y) => seta(`M${f(fora(y) + 12)},${y}L${f(fora(y + 26) + 12)},${y + 26}`)).join('')
  const g = grafico(156, 40, 62, 44, [[0, 0.05], [0.5, 0.8], [0.62, 0.8], [1, 0.25]], [[0.5, 0.8], [0.62, 0.8]])
  // vista de frente da mesma prova: cortina com línguas
  const ling = [[150, 34], [164, 52], [178, 28], [192, 46], [206, 38]]
  let cort = 'M144,104L212,104L212,' + 120
  for (let i = ling.length - 1; i >= 0; i--) { const [x, L] = ling[i]; cort += `L${x + 5},120Q${x + 4},${120 + L} ${x},${122 + L}Q${x - 4},${120 + L} ${x - 5},120` }
  cort += 'L144,120Z'
  const frente = `<rect x="144" y="104" width="68" height="104" rx="2" fill="url(#h)" stroke="${C.linha}" stroke-width="0.9"/>` + camada(cort, C.e1)
  return svg(parede + vidro + pe + setas + g + frente)
}

D.sobreposicao = () => {
  // corte: esmalte A na metade esquerda, esmalte B por cima da metade direita, cobrindo parte de A
  const topo = curva(20, 220, () => 150)
  const A = camada(`M20,150L140,150L140,140Q138,136 132,136L20,136Z`, C.e2)
  const B = camada(`M92,136Q96,126 104,125L220,125L220,150L140,150L140,140Q138,136 132,136Z`, C.e1, 0.9)
  const guia = tracejado('M92,108L92,120') + tracejado('M140,108L140,120') + `<path d="M20,104L92,104M92,104L140,104M140,104L220,104" stroke="${C.fina}" stroke-width="0.6"/>`
    + [20, 92, 140, 220].map((x) => `<path d="M${x},100L${x},108" stroke="${C.fina}" stroke-width="0.6"/>`).join('')
  const amostras = `<rect x="40" y="52" width="32" height="32" rx="3" fill="${C.e2}" stroke="${C.linha}" stroke-width="0.9"/>`
    + `<rect x="100" y="52" width="32" height="32" rx="3" fill="${C.e2}" stroke="${C.linha}" stroke-width="0.9"/><rect x="100" y="52" width="32" height="32" rx="3" fill="${C.e1}" fill-opacity="0.75" stroke="${C.linha}" stroke-width="0.9"/>`
    + `<rect x="164" y="52" width="32" height="32" rx="3" fill="${C.e1}" stroke="${C.linha}" stroke-width="0.9"/>`
  const desce = seta('M178,30L178,46', 'a') + seta('M116,30L116,46', 'a')
  return svg(blocoMassa(topo) + A + B + guia + amostras + desce)
}

D.reatividade = () => {
  // duas camadas que trocam componentes na fusão: zona de mistura e setas nos dois sentidos
  const topo = curva(20, 220, () => 156)
  const A = camada(faixa(curva(20, 220, (x) => 140 + Math.sin(x / 14) * 1.5), topo), C.e2)
  const zona = `<path d="${faixa(curva(20, 220, (x) => 133 + Math.sin(x / 9) * 2.5), curva(20, 220, (x) => 143 + Math.sin(x / 11 + 1) * 2.5))}" fill="${C.mistura}" stroke="none"/>`
  const B = camada(faixa(curva(20, 220, (x) => 120 + Math.sin(x / 20) * 1.2), curva(20, 220, (x) => 136 + Math.sin(x / 9) * 2)), C.e1, 0.92)
  const troca = [50, 100, 150, 196].map((x, i) => seta(`M${x},${i % 2 ? 126 : 150}L${x},${i % 2 ? 146 : 129}`, 'a', C.seta, 1.1) + seta(`M${x + 9},${i % 2 ? 150 : 126}L${x + 9},${i % 2 ? 129 : 146}`, 'aa', C.azul, 1.1)).join('')
  const r = rng(4)
  let manchas = ''
  for (let i = 0; i < 16; i++) { const x = 52 + r() * 136, y = 40 + r() * 52, rr = 3 + r() * 7; manchas += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rr * 1.2)}" ry="${f(rr)}" fill="${C.e1}" stroke="${C.e2b}" stroke-width="1.6"/>` }
  const plano = `<rect x="44" y="32" width="152" height="68" rx="4" fill="${C.e2}" stroke="${C.linha}" stroke-width="0.9"/>${manchas}<rect x="44" y="32" width="152" height="68" rx="4" fill="none" stroke="${C.linha}" stroke-width="0.9"/>`
  return svg(blocoMassa(topo) + A + zona + B + troca + plano + tracejado('M120,100L120,116'))
}

D.flutuacao = () => {
  // óxidos migram para a superfície na fusão e formam um véu fino de outra cor
  const topo = curva(20, 220, () => 160)
  const vidro = camada(faixa(curva(20, 220, () => 124), topo), C.e2b)
  const veu = (x0, x1) => `<path d="${faixa(curva(x0, x1, (x) => 124), curva(x0, x1, (x) => 124 + 5 * Math.sin(((x - x0) / (x1 - x0)) * Math.PI)))}" fill="${C.e1}" stroke="${C.azul}" stroke-width="0.7"/>`
  const r = rng(9)
  let pontos = ''
  for (let i = 0; i < 40; i++) pontos += `<circle cx="${f(26 + r() * 188)}" cy="${f(132 + r() * 24)}" r="1.1" fill="${C.azul}"/>`
  const sobe = [48, 96, 150, 196].map((x) => seta(`M${x},156L${x},134`, 'aa', C.azul, 1.1)).join('')
  const plano = `<rect x="44" y="34" width="152" height="62" rx="4" fill="${C.e2b}" stroke="${C.linha}" stroke-width="0.9"/>`
    + `<path d="M60,50Q90,40 110,56T170,52Q186,60 180,74Q150,90 120,78T62,82Q50,66 60,50Z" fill="${C.e1}" fill-opacity="0.9" stroke="${C.azul}" stroke-width="0.7"/>`
  return svg(blocoMassa(topo) + vidro + veu(36, 104) + veu(130, 206) + pontos + sobe + plano + tracejado('M120,96L120,118'))
}

D.cristalizacao = () => {
  // cristais nucleiam e crescem no vidro durante o resfriamento lento (patamar em destaque no gráfico)
  const topo = curva(20, 220, () => 166)
  const vidro = camada(faixa(curva(20, 220, () => 136), topo), C.e1b)
  const leque = (cx, cy, R, n, a0, a1) => Array.from({ length: n }, (_, i) => { const a = a0 + ((a1 - a0) * i) / (n - 1); return `M${cx},${cy}L${f(cx + Math.cos(a) * R)},${f(cy + Math.sin(a) * R)}` }).join('')
  const cris = [[60, 160, 20], [120, 162, 26], [182, 159, 18]].map(([x, y, R]) => `<path d="${leque(x, y, R, 11, -Math.PI * 0.95, -Math.PI * 0.05)}" stroke="${C.cristal}" stroke-width="1.4" stroke-linecap="round"/><circle cx="${x}" cy="${y}" r="1.8" fill="${C.azul}"/>`).join('')
  const ros = (cx, cy, R) => `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${C.cristal}" stroke="${C.azul}" stroke-width="0.7"/><path d="${leque(cx, cy, R - 1, 28, 0, Math.PI * 2)}" stroke="${C.e1b}" stroke-width="0.5"/>`
  const plano = `<rect x="22" y="34" width="110" height="74" rx="4" fill="${C.e1b}" stroke="${C.linha}" stroke-width="0.9"/>` + ros(52, 64, 18) + ros(98, 82, 14) + ros(108, 50, 9)
  const g = grafico(150, 38, 70, 62, [[0, 0.05], [0.35, 0.95], [0.45, 0.6], [0.8, 0.6], [1, 0.1]], [[0.45, 0.6], [0.8, 0.6]])
  return svg(blocoMassa(topo) + vidro + cris + plano + g + tracejado('M76,108L76,130'))
}

D.craquele = () => {
  // o vidro contrai mais que a massa no resfriamento, fica tracionado e trinca até a massa
  const topo = curva(20, 220, () => 150)
  const xs = [62, 118, 172]
  let vidro = '', x0 = 20
  for (const x of [...xs, 220]) { vidro += camada(`M${x0 + (x0 > 20 ? 1.2 : 0)},132L${x - (x < 220 ? 1.2 : 0)},132L${x - (x < 220 ? 0.4 : 0)},150L${x0 + (x0 > 20 ? 0.4 : 0)},150Z`, C.e1); x0 = x }
  const trac = xs.map((x) => seta(`M${x - 8},124L${x - 22},124`, 'a', C.seta, 1.1) + seta(`M${x + 8},124L${x + 22},124`, 'a', C.seta, 1.1)).join('')
  const r = rng(12)
  const plano = `<rect x="44" y="30" width="152" height="70" rx="4" fill="${C.e1}" stroke="${C.linha}" stroke-width="0.9"/>`
  let rede = ''
  const nos = [[44, 52], [78, 46], [70, 72], [104, 64], [96, 30], [132, 48], [126, 82], [160, 70], [150, 30], [196, 54], [182, 100], [104, 100], [62, 100], [44, 84], [196, 84]]
  const arestas = [[0, 1], [1, 2], [2, 3], [1, 4], [3, 5], [5, 4], [3, 6], [6, 7], [5, 8], [7, 9], [7, 10], [6, 11], [2, 12], [2, 13], [7, 14], [5, 7]]
  for (const [a, b] of arestas) { const [x1, y1] = nos[a], [x2, y2] = nos[b], mx = (x1 + x2) / 2 + (r() - 0.5) * 6, my = (y1 + y2) / 2 + (r() - 0.5) * 6; rede += `M${x1},${y1}Q${f(mx)},${f(my)} ${x2},${y2}` }
  return svg(blocoMassa(topo) + vidro + trac + plano + `<clipPath id="c"><rect x="44" y="30" width="152" height="70" rx="4"/></clipPath><path d="${rede}" fill="none" stroke="${C.linha}" stroke-width="0.9" clip-path="url(#c)"/>` + tracejado('M120,100L120,116'))
}

D.crawling = () => {
  // o esmalte cru perde aderência e, na fusão, se recolhe em ilhas, deixando a massa à mostra
  const topo = curva(20, 220, () => 158)
  const ilha = (a, b, h) => camada(`M${a},158C${a - 3},${158 - h} ${b + 3},${158 - h} ${b},158Z`, C.e1)
  const ilhas = ilha(22, 74, 34) + ilha(96, 150, 36) + ilha(172, 218, 30)
  const recua = [[84, 74], [86, 96], [160, 150], [162, 172]].map(([x, y]) => seta(`M${x},146L${x < y ? f(y + 0) : f(y)},146`, 'a', C.seta, 1.1)).join('')
  const r = rng(21)
  let plano = `<rect x="44" y="30" width="152" height="78" rx="4" fill="url(#h)" stroke="${C.linha}" stroke-width="0.9"/>`
  const blobs = [[72, 52, 20, 14], [120, 50, 18, 13], [170, 56, 19, 16], [88, 88, 22, 12], [146, 88, 18, 12]]
  for (const [cx, cy, rx, ry] of blobs) {
    const p = Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2, k = 1 + (r() - 0.5) * 0.35; return [f(cx + Math.cos(a) * rx * k), f(cy + Math.sin(a) * ry * k)] })
    plano += `<path d="M${p.map((q) => q.join(',')).join('L')}Z" fill="${C.e1}" stroke="${C.linha}" stroke-width="0.9" stroke-linejoin="round"/>`
  }
  return svg(blocoMassa(topo) + ilhas + recua + plano + tracejado('M120,108L120,120'))
}

D.acumulo = () => {
  // superfície com incisões: o esmalte escorre das partes altas para as cavidades, onde fica mais espesso
  const sulcos = [60, 120, 180]
  const relevo = (x) => 146 + sulcos.reduce((s, c) => s + 18 * Math.exp(-Math.pow((x - c) / 9, 2)), 0)
  const topo = curva(20, 220, relevo, 160)
  const sup = curva(20, 220, (x) => 142 + sulcos.reduce((s, c) => s + 3 * Math.exp(-Math.pow((x - c) / 12, 2)), 0), 160)
  const vidro = camada(faixa(sup, topo), C.e1b)
  const setas = sulcos.map((c) => seta(`M${c - 24},136Q${c - 12},134 ${c - 4},146`, 'a', C.seta, 1.1) + seta(`M${c + 24},136Q${c + 12},134 ${c + 4},146`, 'a', C.seta, 1.1)).join('')
  const plano = `<rect x="44" y="34" width="152" height="66" rx="4" fill="${C.e1}" stroke="${C.linha}" stroke-width="0.9"/>` + [76, 120, 164].map((x) => `<path d="M${x},40L${x},94" fill="none" stroke="${C.azul}" stroke-width="5" stroke-linecap="round" stroke-opacity="0.7"/>`).join('')
  return svg(blocoMassa(topo) + vidro + setas + plano + tracejado('M120,100L120,118'))
}

D.quebraBordas = () => {
  // na aresta a camada afina e a cor muda (deixa ver a massa); nos flancos e na base, engrossa
  const perfil = (x) => 196 - 70 * Math.exp(-Math.pow((x - 120) / 34, 2))
  const topo = curva(20, 220, perfil, 120)
  const esp = (x) => 3 + 10 * (1 - Math.exp(-Math.pow((x - 120) / 26, 2)))
  const sup = curva(20, 220, (x) => perfil(x) - esp(x), 120)
  const vidro = camada(faixa(sup, topo), C.e1b)
  const fino = `<path d="${faixa(curva(104, 136, (x) => perfil(x) - esp(x)), curva(104, 136, perfil))}" fill="${C.e2}" stroke="none"/>`
  const setas = seta('M108,112Q96,124 86,150', 'a', C.seta, 1.1) + seta('M132,112Q144,124 154,150', 'a', C.seta, 1.1)
  const lenteD = lente('q', 190, 66, 30, `<rect x="150" y="30" width="80" height="80" fill="${C.e1b}"/><path d="M160,100Q190,40 220,100" fill="none" stroke="${C.e2}" stroke-width="9"/><path d="M160,100Q190,40 220,100" fill="none" stroke="${C.linha}" stroke-width="0.6" stroke-dasharray="2 2"/>`)
  return svg(massa(L(topo) + `L220,${BASE}L20,${BASE}Z`) + vidro + fino + setas + ligacao(138, 118, 166, 88) + lenteD)
}

D.bolhas = () => {
  // gases da massa e do esmalte atravessam o vidro; bolhas presas, uma estourada (cratera) e um furinho
  const sup = (x) => (x > 140 && x < 168 ? 128 + 9 * Math.sin(((x - 140) / 28) * Math.PI) : x > 64 && x < 70 ? 128 + 14 : 128)
  const topo = curva(20, 220, () => 160)
  const vidro = camada(faixa(curva(20, 220, sup, 200), topo), C.e1)
  const r = rng(5)
  let b = ''
  for (const [x, y, rr] of [[44, 146, 5], [98, 140, 7], [116, 152, 3.5], [196, 144, 6], [182, 154, 3], [80, 152, 2.5], [210, 152, 2.5], [128, 136, 2.5]]) b += `<circle cx="${x}" cy="${y}" r="${rr}" fill="${C.ar}" stroke="${C.linha}" stroke-width="0.8"/>`
  for (let i = 0; i < 18; i++) b += `<circle cx="${f(26 + r() * 188)}" cy="${f(134 + r() * 22)}" r="1" fill="${C.ar}" stroke="${C.fina}" stroke-width="0.4"/>`
  const sobe = [[44, 170, 154], [98, 172, 150], [196, 172, 153]].map(([x, y0, y1]) => seta(`M${x},${y0}L${x},${y1}`, 'a', C.seta, 1.1)).join('')
  const plano = `<rect x="44" y="30" width="152" height="70" rx="4" fill="${C.e1}" stroke="${C.linha}" stroke-width="0.9"/>`
    + [[80, 56, 7], [140, 70, 4], [112, 46, 2.2], [168, 48, 2.6], [96, 84, 2], [176, 84, 5.5]].map(([x, y, rr]) => `<circle cx="${x}" cy="${y}" r="${rr}" fill="${C.massa}" stroke="${C.linha}" stroke-width="0.8"/><circle cx="${x}" cy="${y}" r="${f(rr + 2)}" fill="none" stroke="${C.e1b}" stroke-width="0.8"/>`).join('')
  return svg(blocoMassa(topo) + vidro + b + sobe + plano + tracejado('M154,100L154,122'))
}

D.separacaoFases = () => {
  // o vidro se divide em duas fases: gotículas de outra composição dispersas na matriz (detalhe ampliado)
  const topo = curva(20, 220, () => 168)
  const vidro = camada(faixa(curva(20, 220, () => 136), topo), C.e1b)
  const r = rng(3)
  let got = ''
  for (let i = 0; i < 70; i++) got += `<circle cx="${f(24 + r() * 192)}" cy="${f(140 + r() * 24)}" r="${f(0.8 + r() * 1)}" fill="${C.cristal}"/>`
  let det = `<rect x="70" y="10" width="120" height="120" fill="${C.e1b}"/>`
  const r2 = rng(8)
  for (let i = 0; i < 26; i++) det += `<circle cx="${f(84 + r2() * 92)}" cy="${f(24 + r2() * 84)}" r="${f(3 + r2() * 6)}" fill="${C.cristal}" stroke="${C.azul}" stroke-width="0.6"/>`
  return svg(blocoMassa(topo) + vidro + got + `<circle cx="120" cy="152" r="9" fill="none" stroke="${C.fina}" stroke-width="0.7" stroke-dasharray="2 2"/>` + ligacao(120, 143, 120, 112) + lente('s', 120, 66, 44, det))
}

D.opalescencia = () => {
  // gotículas finas espalham mais a luz azul (volta para o observador) e deixam passar o âmbar
  const topo = curva(20, 220, () => 170)
  const vidro = camada(faixa(curva(20, 220, () => 122), topo), C.e1)
  const r = rng(14)
  let got = ''
  for (let i = 0; i < 60; i++) got += `<circle cx="${f(24 + r() * 192)}" cy="${f(128 + r() * 38)}" r="0.9" fill="${C.ar}"/>`
  const luz = seta('M52,40L104,134', 'al', C.luz, 1.6)
  const azul = seta('M106,136L140,62', 'aa', C.azul, 1.3) + seta('M106,136L162,84', 'aa', C.azul, 1.3) + seta('M106,136L80,70', 'aa', C.azul, 1.3)
  const passa = `<path d="M106,136L126,164" stroke="${C.luz}" stroke-width="1.6" stroke-linecap="round"/>` + seta('M128,180L138,196', 'al', C.e2b, 1.6) + `<path d="M126,164L128,180" stroke="${C.e2b}" stroke-width="1.6" stroke-dasharray="1.5 2"/>`
  const olho = `<path d="M150,46q10,-8 20,0q-10,8 -20,0Z" fill="none" stroke="${C.linha}" stroke-width="0.9"/><circle cx="160" cy="46" r="2.4" fill="${C.linha}"/>`
  return svg(massa(`M20,170L220,170L220,${BASE}L20,${BASE}Z`) + vidro + got + luz + azul + passa + olho)
}

D.opacidade = () => {
  // a mesma camada: fina, deixa a luz chegar à massa (translúcida); espessa, devolve a luz antes (opaca)
  const esp = (x) => 6 + 30 * Math.pow((x - 20) / 200, 1.3)
  const topo = curva(20, 220, () => 170)
  const sup = curva(20, 220, (x) => 170 - esp(x))
  const vidro = camada(faixa(sup, topo), C.cristal)
  const r = rng(6)
  let part = ''
  for (let i = 0; i < 120; i++) { const x = 22 + r() * 196, y = 170 - r() * esp(x); if (r() < (x - 20) / 200 + 0.08) part += `<circle cx="${f(x)}" cy="${f(y)}" r="0.9" fill="${C.fina}"/>` }
  const raio = (x, prof) => { const y0 = 170 - esp(x); return seta(`M${x - 22},${f(y0 - 48)}L${x},${f(y0 + prof)}`, 'al', C.luz, 1.4) + seta(`M${x},${f(y0 + prof)}L${x + 18},${f(y0 - 40)}`, 'al', C.luz, 1.1, prof > 10 ? 'stroke-opacity="0.9"' : '') }
  const plano = `<defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="${C.massa}"/><stop offset="1" stop-color="${C.cristal}"/></linearGradient></defs><rect x="44" y="30" width="152" height="40" rx="4" fill="url(#g)" stroke="${C.linha}" stroke-width="0.9"/>`
  return svg(blocoMassa(topo) + vidro + part + raio(62, 10) + raio(180, 6) + plano)
}

D.variacaoEspessura = () => {
  const topo = curva(20, 220, () => 168)
  const degraus = camada(`M20,168L20,160L86,160L86,150L152,150L152,140L220,140L220,168Z`, C.e1)
  const c2 = `<path d="M86,168L86,150L152,150L152,140L220,140L220,168Z" fill="${C.e1b}" fill-opacity="0.55"/>`
  const c3 = `<path d="M152,168L152,140L220,140L220,168Z" fill="${C.azul}" fill-opacity="0.35"/>`
  const linhas = `<path d="M86,160L220,160M152,150L220,150" stroke="${C.fina}" stroke-width="0.6" stroke-dasharray="2 2"/>`
  const amostra = (x, op) => `<rect x="${x}" y="50" width="44" height="44" rx="3" fill="${C.e1}" stroke="${C.linha}" stroke-width="0.9"/><rect x="${x}" y="50" width="44" height="44" rx="3" fill="${C.azul}" fill-opacity="${op}"/>`
  return svg(blocoMassa(topo) + degraus + c2 + c3 + linhas + amostra(31, 0.05) + amostra(97, 0.25) + amostra(163, 0.5) + [53, 119, 185].map((x) => tracejado(`M${x},94L${x},134`)).join(''))
}

D.textura = () => {
  const r = rng(2)
  const sup = curva(20, 220, (x) => 140 + Math.sin(x / 5) * 2 + Math.sin(x / 2.3) * 1.2 + (r() - 0.5) * 2.5, 160)
  const topo = curva(20, 220, () => 162)
  let gr = ''
  for (let i = 0; i < 30; i++) gr += `<circle cx="${f(24 + r() * 192)}" cy="${f(144 + r() * 16)}" r="${f(1 + r() * 1.6)}" fill="${C.e2b}"/>`
  const lenteT = lente('t', 120, 66, 40, `<rect x="70" y="20" width="100" height="100" fill="${C.e2}"/>` + Array.from({ length: 50 }, () => `<circle cx="${f(80 + r() * 80)}" cy="${f(28 + r() * 76)}" r="${f(1.5 + r() * 3)}" fill="${C.e2b}" stroke="${C.linha}" stroke-width="0.4"/>`).join(''))
  return svg(blocoMassa(topo) + camada(faixa(sup, topo), C.e2) + gr + ligacao(120, 106, 120, 134) + lenteT)
}

D.transparencia = () => {
  const topo = curva(20, 220, () => 160)
  const engobe = `<path d="M60,160L60,156L104,156L104,160ZM140,160L140,156L190,156L190,160Z" fill="${C.e2b}" stroke="${C.linha}" stroke-width="0.6"/>`
  const vidro = camada(faixa(curva(20, 220, () => 132), curva(20, 220, () => 156)), C.cristal, 0.7)
  const luz = seta('M70,60L84,152', 'al', C.luz, 1.4) + seta('M86,154L104,64', 'al', C.luz, 1.1) + seta('M150,60L164,152', 'al', C.luz, 1.4) + seta('M166,154L184,64', 'al', C.luz, 1.1)
  return svg(blocoMassa(topo) + engobe + vidro + luz)
}

D.metalico = () => {
  const topo = curva(20, 220, () => 162)
  const vidro = camada(faixa(curva(20, 220, () => 136), topo), C.e2b)
  const pel = `<path d="M20,136L220,136L220,141L20,141Z" fill="${C.metal}" stroke="${C.linha}" stroke-width="0.7"/>`
  const r = rng(7)
  let cr = ''
  for (let i = 0; i < 30; i++) { const x = 24 + r() * 192; cr += `<path d="M${f(x)},141L${f(x + 3)},${f(146 + r() * 6)}" stroke="${C.metal}" stroke-width="1"/>` }
  const luz = seta('M70,50L120,132', 'al', C.luz, 1.5) + seta('M120,132L170,50', 'al', C.luz, 1.5)
  return svg(blocoMassa(topo) + vidro + pel + cr + luz)
}

D.iridescencia = () => {
  const topo = curva(20, 220, () => 162)
  const vidro = camada(faixa(curva(20, 220, () => 136), topo), C.azul, 0.75)
  const pel = `<path d="M20,133L220,133L220,136L20,136Z" fill="${C.e2}" stroke="${C.linha}" stroke-width="0.6"/>`
  const luz = seta('M60,50L104,131', 'al', C.luz, 1.5)
  const r1 = seta('M104,133L148,52', 'a', C.seta, 1.3) + `<path d="M104,131L112,136" stroke="${C.fina}" stroke-width="0.8"/>` + seta('M112,136L160,58', 'aa', C.azul, 1.3)
  return svg(blocoMassa(topo) + vidro + pel + luz + r1)
}

fs.mkdirSync(DIR, { recursive: true })
for (const [k, fn] of Object.entries(D)) {
  const s = fn().replace(/\n/g, '')
  fs.writeFileSync(path.join(DIR, k + '.svg'), s)
  console.log(k, (s.length / 1024).toFixed(1) + ' KB')
}
