/*
 * Gerador das amostras ilustrativas dos fenômenos cerâmicos (public/fenomenos/*.webp).
 * Renderização procedural: campo de altura + cor + brilho por pixel, iluminação de softbox com câmera em perspectiva,
 * oclusão de cavidades e grão. Roda no navegador (canvas); ver gerar.cjs.
 * São representações ilustrativas, não fotografias nem resultados de teste.
 */

/* ——— ruído ——— */
function rng(seed) {
  let a = seed >>> 0
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
function criaRuido(seed) {
  const r = rng(seed), p = new Uint8Array(512), g = []
  const perm = [...Array(256).keys()]
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]] }
  for (let i = 0; i < 512; i++) p[i] = perm[i & 255]
  for (let i = 0; i < 256; i++) { const a = r() * Math.PI * 2; g.push([Math.cos(a), Math.sin(a)]) }
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10)
  const n2 = (x, y) => {
    const X = Math.floor(x), Y = Math.floor(y), xf = x - X, yf = y - Y
    const h = (i, j) => g[p[(p[(X + i) & 255] + Y + j) & 511] & 255]
    const d = (gv, dx, dy) => gv[0] * dx + gv[1] * dy
    const u = fade(xf), v = fade(yf)
    const a = d(h(0, 0), xf, yf), b = d(h(1, 0), xf - 1, yf), c = d(h(0, 1), xf, yf - 1), e = d(h(1, 1), xf - 1, yf - 1)
    return (a + (b - a) * u + (c - a) * v + (a - b - c + e) * u * v) * 1.41
  }
  const fbm = (x, y, o = 5, lac = 2, gan = 0.5) => { let s = 0, amp = 0.5, f = 1, n = 0; for (let i = 0; i < o; i++) { s += amp * n2(x * f, y * f); n += amp; amp *= gan; f *= lac } return s / n }
  const ridge = (x, y, o = 5) => { let s = 0, amp = 0.5, f = 1, n = 0; for (let i = 0; i < o; i++) { s += amp * (1 - Math.abs(n2(x * f, y * f))); n += amp; amp *= 0.5; f *= 2 } return s / n }
  return { n2, fbm, ridge }
}
/** Voronoi: distância ao primeiro e segundo ponto e id da célula. */
const _vor = new Map()
function criaVoronoi(seed, escala) {
  const k0 = seed + ':' + escala
  if (_vor.has(k0)) return _vor.get(k0)
  const hs = (i, j, k) => { let h = Math.imul(i, 374761393) ^ Math.imul(j, 668265263) ^ Math.imul(seed * 31 + k, 2246822519); h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296 }
  const ponto = (i, j) => [i + hs(i, j, 1), j + hs(i, j, 2), hs(i, j, 3)]
  const f = (x, y) => {
    x *= escala; y *= escala
    const X = Math.floor(x), Y = Math.floor(y)
    let d1 = 9, d2 = 9, id = 0, px = 0, py = 0
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
      const q = ponto(X + i, Y + j), d = Math.hypot(q[0] - x, q[1] - y)
      if (d < d1) { d2 = d1; d1 = d; id = q[2]; px = q[0]; py = q[1] } else if (d < d2) d2 = d
    }
    return { d1: d1 / escala, d2: d2 / escala, id, px: px / escala, py: py / escala }
  }
  _vor.set(k0, f)
  return f
}

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x))
const mix = (a, b, t) => a + (b - a) * t
const mix3 = (a, b, t) => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)]
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t) }
const hex = (h) => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255]

/* ——— materiais ——— */
const N = criaRuido(7)
const N2 = criaRuido(31)
/** Massa cerâmica queimada: cor com variação suave, chamote fino e pontos de ferro. */
function massa(u, v, base = '#C9A68A') {
  const c = hex(base)
  const var1 = N.fbm(u * 5, v * 5, 4) * 0.06 + N2.fbm(u * 40, v * 40, 2) * 0.035
  let col = c.map((x) => x * (1 + var1))
  const ferro = N.n2(u * 160 + 3, v * 160)
  if (ferro > 0.62) col = mix3(col, [0.33, 0.22, 0.16], ss(0.62, 0.8, ferro) * 0.8)
  const h = N2.fbm(u * 90, v * 90, 3) * 0.0028 + (N.n2(u * 220, v * 220) > 0.6 ? 0.0016 : 0)
  return { col, h }
}
/**
 * Esmalte sobre a massa. `e` = espessura (0 sem esmalte; ~1 camada normal). Camada fina deixa a massa aparecer;
 * o esmalte nivela a microtextura da massa. `trans` controla quanto a massa aparece por transparência.
 */
function esmalte(m, cor, e, trans = 0.25, escuro = 0.25) {
  const a = 1 - Math.exp(-e * (1 / Math.max(0.05, trans)) * 0.5)
  const fundo = mix3(m.col, m.col.map((x) => x * (1 - escuro)), clamp(e))
  const col = mix3(fundo, cor, clamp(a))
  return { col, h: m.h * (1 - ss(0, 0.35, e)) + e * 0.012, cob: ss(0.02, 0.2, e) }
}

/* ——— amostras ——— */
// cada uma devolve, por pixel: col (rgb 0..1), h (altura), gloss (0..1), metal (0..1), film (iridescência 0..1)
const AMOSTRAS = {
  escorrimento(u, v) {
    // prova vertical: o esmalte desceu como uma cortina, com línguas de comprimentos e larguras diferentes;
    // a camada engrossa para baixo e forma um cordão na borda de cada língua
    const m = massa(u, v, '#D2B79C')
    const linguas = [[0.05, 0.16, 0.05], [0.15, 0.34, 0.035], [0.27, 0.12, 0.06], [0.38, 0.45, 0.045], [0.5, 0.22, 0.03], [0.61, 0.36, 0.05], [0.7, 0.1, 0.04], [0.8, 0.3, 0.035], [0.92, 0.42, 0.05]]
    let fundo = 0.3 + N.fbm(u * 5, 1.3, 4) * 0.06
    for (const [x, L, w] of linguas) {
      const dx = (u - x - N.fbm(v * 3, x * 11, 2) * 0.03) / w
      fundo += L * Math.exp(-Math.pow(Math.abs(dx), 2.6) * 1.2)
    }
    const dist = fundo - v
    if (dist < 0) return { col: m.col, h: m.h, gloss: 0, metal: 0 }
    const cordao = Math.exp(-dist / 0.022)
    const e = 0.35 + v * 1.4 + cordao * 0.9 + N.fbm(u * 10, v * 6, 3) * 0.1
    const estrias = N.fbm(u * 38, v * 2.5, 3)
    const cor = mix3(mix3(hex('#9BB2B4'), hex('#3D5960'), ss(0.5, 1.9, e)), hex('#C9D6D2'), ss(0.15, 0.5, estrias) * 0.35)
    const g = esmalte(m, cor, e, 0.3, 0.25)
    return { col: g.col, h: g.h + e * 0.006 + cordao * 0.008 + estrias * 0.0015, gloss: 0.88, metal: 0 }
  },

  sobreposicao(u, v) {
    // creme fosco embaixo; esmalte translúcido azul por cima, cobrindo parte; o encontro mostra as duas camadas
    const m = massa(u, v, '#CDB49A')
    const bA = u - 0.62 + N.fbm(v * 5, 2, 4) * 0.06, bB = u - 0.36 + N.fbm(v * 5, 7, 4) * 0.06
    const eA = bA < 0 ? 0.9 + N.fbm(u * 14, v * 14, 3) * 0.08 : 0
    const eB = bB > 0 ? 0.75 + N.fbm(u * 10 + 4, v * 10, 3) * 0.12 : 0
    let s = esmalte(m, hex('#E9E1CF'), eA, 0.12, 0.05)
    const sub = { col: s.col, h: m.h }
    const t = esmalte(sub, hex('#4F7480'), eB, 0.55, 0.15)
    const tom = eA > 0 && eB > 0 ? 0.55 : 0
    const col = eB > 0 ? mix3(t.col, mix3(s.col, hex('#6E95A0'), 0.6), tom) : s.col
    return { col, h: (eB > 0 ? 0.012 : s.h) + eA * 0.004 + (bB > 0 && bB < 0.006 ? 0.003 : 0), gloss: eB > 0 ? 0.85 : eA > 0 ? 0.25 : 0, metal: 0 }
  },

  reatividade(u, v) {
    // dois esmaltes que reagiram no contato: faixa de transformação com veios, halos e mosqueado
    const m = massa(u, v, '#BFA084')
    const w1 = N.fbm(u * 3, v * 3, 4), w2 = N2.fbm(u * 3 + 5, v * 3, 4)
    const x = u + w1 * 0.12, y = v + w2 * 0.12
    const front = x - 0.5 + N.fbm(y * 4, 3, 3) * 0.08
    const zona = Math.exp(-Math.pow(front / 0.12, 2))
    const azul = hex('#2F4C5C'), ambar = hex('#8C5A2E')
    let col = front < 0 ? azul : ambar
    const veio = N.ridge(x * 9, y * 22, 4)
    const mosq = N2.fbm(x * 26, y * 26, 3)
    const opal = mix3(hex('#9FB7BE'), hex('#D9CBA8'), ss(-0.2, 0.3, mosq))
    col = mix3(col, opal, clamp(zona * ss(0.55, 0.9, veio) * 1.1))
    col = mix3(col, hex('#E4DCC8'), zona * ss(0.25, 0.45, mosq) * 0.5)
    const vh = criaVoronoi(5, 9)(x, y)
    const halo = zona * ss(0.06, 0.0, vh.d1) * (vh.id > 0.55 ? 1 : 0)
    col = mix3(col, hex('#C8D6D4'), halo * 0.7)
    col = mix3(col, hex('#1E2A30'), zona * ss(0.025, 0, vh.d1) * (vh.id > 0.55 ? 0.6 : 0))
    const g = esmalte(m, col, 1.2, 0.08, 0)
    return { col: g.col, h: g.h + N.fbm(x * 30, y * 30, 2) * 0.002, gloss: 0.8, metal: 0 }
  },

  acumulo(u, v) {
    // relevo impresso (ondas concêntricas e incisões); o esmalte translúcido escurece nas cavidades e clareia nas cristas
    const m = massa(u, v, '#E4DCCF')
    const cx = u - 0.5, cy = v - 0.52
    const r = Math.hypot(cx * 1.05, cy)
    const aneis = Math.sin(r * 46 + N.fbm(u * 3, v * 3, 3) * 2.2) * 0.8 + N.fbm(u * 18, v * 18, 3) * 0.5
    const inc = 0
    const relevo = aneis * 0.5 + 0.5
    const prof = clamp(1 - relevo) * 0.9 + (inc ? 0.6 : 0)
    const e = 0.35 + prof * 1.4
    const g = esmalte({ col: m.col, h: m.h + relevo * 0.035 + inc * 0.02 }, mix3(hex('#B9CBB5'), hex('#5E8076'), ss(0.4, 1.6, e)), e, 0.5, 0.2)
    return { col: g.col, h: relevo * 0.016 + 0.012, gloss: 0.8, metal: 0 }
  },

  quebraBordas(u, v) {
    // relevos com arestas: o esmalte escuro afina nas cristas e "quebra" para âmbar e cor da massa
    const m = massa(u, v, '#B9926F')
    const lin = Math.abs(Math.sin(u * 13 + N.fbm(u * 2, v * 2, 3) * 2 + v * 2))
    const crista = Math.pow(lin, 6)
    const rid = N.ridge(u * 5, v * 5, 4)
    const alto = clamp(crista * 0.8 + ss(0.75, 0.95, rid) * 0.7)
    const e = clamp(1.3 - alto * 1.25, 0.02, 2)
    const corE = mix3(hex('#8E4E22'), hex('#231812'), ss(0.25, 0.95, e))
    const g = esmalte(m, corE, e, 0.35, 0.2)
    return { col: g.col, h: crista * 0.04 + rid * 0.02, gloss: 0.85, metal: 0 }
  },

  cristalizacao(u, v) {
    // fundo vítreo azul-acinzentado com cristais em leque (rosetas) crescidos no resfriamento
    const vr = criaVoronoi(19, 2.4)(u, v)
    let col = mix3(hex('#4E6670'), hex('#6F878D'), ss(-0.3, 0.4, N.fbm(u * 4, v * 4, 4)))
    let h = 0.02
    if (vr.id > 0.25) {
      const ang = Math.atan2(v - vr.py, u - vr.px)
      const R = (0.07 + vr.id * 0.12) * (1 + N.n2(Math.cos(ang) * 2 + vr.id * 9, Math.sin(ang) * 2) * 0.22)
      const d = Math.hypot(u - vr.px, v - vr.py)
      if (d < R) {
        const raios = 0.5 + 0.5 * Math.sin(ang * 64 + N.n2(ang * 3, vr.id * 10) * 6 + d * 30)
        const anel = 0.5 + 0.5 * Math.sin(d * 70)
        const borda = ss(R, R * 0.9, d)
        const cristal = mix3(mix3(hex('#AFC0C2'), hex('#E2DDCB'), ss(0, R, d)), hex('#EFEADC'), raios * 0.35 + anel * 0.1)
        col = mix3(col, cristal, borda * (0.75 + raios * 0.25))
        col = mix3(col, hex('#8A9A95'), ss(R * 0.92, R, d) * 0.6)
        h += borda * (0.004 + raios * 0.002)
      }
    }
    return { col, h, gloss: 0.9, metal: 0 }
  },

  craquele(u, v) {
    // esmalte marfim brilhante com rede irregular de fissuras finas tingidas
    const w = N.fbm(u * 3, v * 3, 3) * 0.05
    const a = criaVoronoi(3, 9)(u + w, v - w), b = criaVoronoi(11, 23)(u + w, v)
    const f1 = ss(0.0035, 0.0008, a.d2 - a.d1), f2 = ss(0.0022, 0.0004, b.d2 - b.d1) * (N.n2(u * 8, v * 8) > -0.1 ? 1 : 0)
    let col = mix3(hex('#EDE6D6'), hex('#E2D6BE'), ss(-0.3, 0.4, N.fbm(u * 5, v * 5, 3)))
    col = mix3(col, hex('#6D5A44'), Math.max(f1 * 0.85, f2 * 0.45))
    col = mix3(col, hex('#D9C8A8'), ss(0.02, 0.0, a.d2 - a.d1) * 0.25)
    return { col, h: 0.02 - f1 * 0.002 + a.d1 * 0.004, gloss: 0.92, metal: 0 }
  },

  crawling(u, v) {
    // ilhas de esmalte branco espesso, de bordas roladas, separadas por massa exposta
    const m = massa(u, v, '#A77D5E')
    const f = N.fbm(u * 6, v * 6, 5) + N2.fbm(u * 18, v * 18, 2) * 0.25
    const ilha = ss(-0.08, 0.06, f)
    const e = ilha * (1.1 + f * 0.6)
    const corI = mix3(hex('#EFE9DD'), hex('#D9D3C3'), ss(0, 0.4, N.fbm(u * 20, v * 20, 2)))
    const g = esmalte(m, corI, e, 0.05, 0)
    const rolo = Math.pow(ss(-0.08, 0.2, f), 0.5)
    return { col: g.col, h: m.h + rolo * 0.06 * ilha, gloss: ilha * 0.35, metal: 0 }
  },

  flutuacao(u, v) {
    // esmalte escuro com véus claros que "flutuam" na superfície (flutuação de rutilo/ferro), em faixas difusas
    const x = u + N.fbm(u * 2, v * 2, 4) * 0.25, y = v + N2.fbm(u * 2, v * 2, 4) * 0.25
    const veu = N.fbm(x * 3, y * 9, 5)
    const fios = N.ridge(x * 6, y * 26, 4)
    let col = mix3(hex('#1F2A2E'), hex('#2E3E44'), ss(-0.4, 0.4, N2.fbm(u * 5, v * 5, 3)))
    col = mix3(col, hex('#8FA9B2'), ss(0.0, 0.35, veu) * 0.75)
    col = mix3(col, hex('#D4D8CE'), ss(0.82, 0.95, fios) * ss(-0.05, 0.25, veu) * 0.7)
    col = mix3(col, hex('#7A5232'), ss(0.25, 0.55, -veu) * 0.35)
    return { col, h: 0.02 + veu * 0.002, gloss: 0.88, metal: 0 }
  },

  separacaoFases(u, v) {
    // vidro azul opalescente com gotículas leitosas e nuvens — duas fases vítreas, sem veios direcionais
    const base = ss(-0.3, 0.5, N.fbm(u * 3, v * 3, 4))
    let col = mix3(hex('#2E4C6A'), hex('#5D7F98'), base)
    const g1 = criaVoronoi(23, 38)(u, v), g2 = criaVoronoi(29, 85)(u, v)
    const got = ss(0.009, 0.0035, g1.d1) * (g1.id > 0.35 ? 1 : 0) * 0.7 + ss(0.004, 0.0012, g2.d1) * (g2.id > 0.4 ? 1 : 0) * 0.5
    const nuvem = ss(0.05, 0.45, N2.fbm(u * 5 + 3, v * 5, 4))
    col = mix3(col, hex('#C9D7DF'), clamp(got * (0.5 + nuvem) + nuvem * 0.35))
    return { col, h: 0.02, gloss: 0.94, metal: 0 }
  },

  variacaoEspessura(u, v) {
    // prova em degraus: 1, 2 e 3 demãos do mesmo esmalte, e uma faixa sem esmalte embaixo
    const m = massa(u, v, '#D7C1A6')
    const faixa = u + N.fbm(v * 8, 1, 2) * 0.012
    const demaos = faixa < 0.33 ? 1 : faixa < 0.66 ? 2 : 3
    const baixo = v > 0.82 + N.fbm(u * 10, 5, 2) * 0.012
    const e = baixo ? 0 : demaos * 0.45 + N.fbm(u * 12, v * 12, 3) * 0.05
    const g = esmalte(m, mix3(hex('#A8B48E'), hex('#4E6A3E'), ss(0.4, 1.4, e)), e, 0.6, 0.3)
    const degrau = Math.abs(faixa - 0.33) < 0.003 || Math.abs(faixa - 0.66) < 0.003 ? 0.002 : 0
    return { col: g.col, h: g.h + e * 0.012 + degrau, gloss: baixo ? 0 : 0.75, metal: 0 }
  },

  textura(u, v) {
    // superfície fosca e rugosa, granulada, com pequenas crateras
    const gran = N.fbm(u * 60, v * 60, 3), bol = criaVoronoi(41, 26)(u, v)
    const crat = bol.id > 0.7 ? ss(0.012, 0.004, bol.d1) : 0
    const h = gran * 0.012 + N2.fbm(u * 12, v * 12, 4) * 0.02 - crat * 0.012 + ss(0.016, 0.011, bol.d1) * (bol.id > 0.7 ? 0.004 : 0)
    let col = mix3(hex('#CFC5B4'), hex('#A89C88'), ss(-0.3, 0.5, N2.fbm(u * 8, v * 8, 3)))
    col = mix3(col, hex('#6E6152'), crat * 0.6)
    col = col.map((x) => x * (1 + gran * 0.12))
    return { col, h, gloss: 0.06, metal: 0, rug: 1 }
  },

  opacidade(u, v) {
    // esmalte acetinado branco que esconde a massa e as marcas: só a faixa sem esmalte, embaixo, mostra a argila
    const m = massa(u, v, '#B07C5A')
    const sulco = Math.abs(Math.sin(u * 9 + Math.sin(v * 5) * 0.8)) < 0.05 ? 1 : 0
    const baixo = v > 0.8 + N.fbm(u * 9, 4, 2) * 0.015
    const e = baixo ? 0 : 1.2 + sulco * 0.15
    const g = esmalte(m, mix3(hex('#EEEAE1'), hex('#E2DCCF'), ss(-0.2, 0.4, N.fbm(u * 6, v * 6, 3))), e, 0.02, 0)
    return { col: g.col, h: (baixo ? m.h - sulco * 0.006 : 0.015 - sulco * 0.0015), gloss: baixo ? 0 : 0.45, metal: 0 }
  },

  transparencia(u, v) {
    // esmalte transparente sobre massa avermelhada com engobe e incisões; à direita, faixa sem esmalte
    const m = massa(u, v, '#B4704E')
    const engobe = Math.abs(v - 0.35 - Math.sin(u * 7) * 0.06) < 0.045 || Math.abs(v - 0.66 - Math.sin(u * 6 + 1) * 0.05) < 0.03
    const inc = Math.abs(Math.sin(u * 30 + v * 4)) < 0.06 && v > 0.45 && v < 0.58
    let base = engobe ? mix3(hex('#EADCC4'), m.col, 0.15) : m.col
    if (inc) base = base.map((x) => x * 0.72)
    const seco = u > 0.8 + N.fbm(v * 8, 2, 2) * 0.012
    const e = seco ? 0 : 1
    // o vidro satura e aprofunda as cores de baixo
    const col = seco ? base.map((x) => x * 1.04) : base.map((x, i) => Math.pow(x, 1.25) * [0.98, 0.96, 0.9][i])
    return { col, h: m.h * (seco ? 1 : 0) + (inc ? -0.004 : 0) * (seco ? 1 : 0.4) + e * 0.012, gloss: seco ? 0.02 : 0.95, metal: 0 }
  },

  metalico(u, v) {
    // esmalte metálico de manganês/cobre: reflexo especular colorido, pouca cor difusa, manchas de brilho
    const f = N.fbm(u * 4, v * 4, 5)
    const col = mix3(hex('#4A3C30'), hex('#8A6A48'), ss(-0.3, 0.5, f))
    const h = N.fbm(u * 25, v * 25, 3) * 0.004 + f * 0.01
    return { col, h, gloss: 0.6 + ss(0, 0.5, f) * 0.3, metal: 0.85 }
  },

  iridescencia(u, v) {
    // esmalte escuro com película iridescente sutil, que muda de tom com o ângulo
    const f = N.fbm(u * 3, v * 3, 5)
    const col = mix3(hex('#1D1C22'), hex('#2C2A30'), ss(-0.3, 0.4, f))
    return { col, h: 0.015 + f * 0.006 + N2.fbm(u * 30, v * 30, 2) * 0.0015, gloss: 0.9, metal: 0.2, film: 0.75 + f * 0.4 }
  },
}

/* ——— renderização ——— */
export function renderizar(nome, S = 480) {
  const fn = AMOSTRAS[nome]
  const W = S, H = S, n = W * H
  const hh = new Float32Array(n), cr = new Float32Array(n), cg = new Float32Array(n), cb = new Float32Array(n)
  const gl = new Float32Array(n), mt = new Float32Array(n), fl = new Float32Array(n), rg = new Float32Array(n)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, s = fn(x / W, y / H)
    hh[i] = s.h; cr[i] = s.col[0]; cg[i] = s.col[1]; cb[i] = s.col[2]; gl[i] = s.gloss; mt[i] = s.metal || 0; fl[i] = s.film || 0; rg[i] = s.rug || 0
  }
  // altura média em vizinhança (oclusão de cavidades)
  const blur = (src, r) => {
    const t = new Float32Array(n), o = new Float32Array(n)
    for (let y = 0; y < H; y++) { let s = 0; for (let x = -r; x < W; x++) { if (x + r < W) s += src[y * W + x + r]; if (x - r - 1 >= 0) s -= src[y * W + x - r - 1]; if (x >= 0) t[y * W + x] = s / (2 * r + 1) } }
    for (let x = 0; x < W; x++) { let s = 0; for (let y = -r; y < H; y++) { if (y + r < H) s += t[(y + r) * W + x]; if (y - r - 1 >= 0) s -= t[(y - r - 1) * W + x]; if (y >= 0) o[y * W + x] = s / (2 * r + 1) } }
    return o
  }
  const media = blur(hh, 7)
  const cnv = document.createElement('canvas'); cnv.width = W; cnv.height = H
  const ctx = cnv.getContext('2d'), img = ctx.createImageData(W, H)
  const luz = [-0.55, -0.75, 1.35], cam = [0.5, 0.55, 1.9], esc = 1 / W
  const grao = rng(99)
  const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]); return [a[0] / l, a[1] / l, a[2] / l] }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x
    const hx = (hh[y * W + Math.min(W - 1, x + 1)] - hh[y * W + Math.max(0, x - 1)]) / (2 * esc)
    const hy = (hh[Math.min(H - 1, y + 1) * W + x] - hh[Math.max(0, y - 1) * W + x]) / (2 * esc)
    const nrm = norm([-hx, -hy, 1])
    const P = [x / W, y / H, 0]
    const L = norm([luz[0] - P[0], luz[1] - P[1], luz[2]]), V = norm([cam[0] - P[0], cam[1] - P[1], cam[2]])
    const Hv = norm([L[0] + V[0], L[1] + V[1], L[2] + V[2]])
    const ndl = Math.max(0, nrm[0] * L[0] + nrm[1] * L[1] + nrm[2] * L[2])
    const ndh = Math.max(0, nrm[0] * Hv[0] + nrm[1] * Hv[1] + nrm[2] * Hv[2])
    const ndv = Math.max(0, nrm[0] * V[0] + nrm[1] * V[1] + nrm[2] * V[2])
    const cav = clamp((media[i] - hh[i]) * 60, -0.5, 1)
    const ao = 1 - clamp(cav) * 0.35 + clamp(-cav) * 0.04
    const g = gl[i], m = mt[i]
    let base = [cr[i], cg[i], cb[i]]
    if (fl[i] > 0) {
      // película fina: tom varia com o ângulo de visão e com a espessura local
      const fase = (1 - ndv) * 6 + fl[i] * 5 + hh[i] * 200
      const film = [0.5 + 0.5 * Math.cos(fase), 0.5 + 0.5 * Math.cos(fase + 2.1), 0.5 + 0.5 * Math.cos(fase + 4.2)]
      base = mix3(base, film.map((c) => 0.12 + c * 0.3), 0.3)
    }
    const amb = 0.58, dif = (amb + 0.55 * ndl) * ao * (1 - m * 0.75)
    const fres = 0.04 + 0.96 * Math.pow(1 - ndv, 5)
    const espA = Math.pow(ndh, 30 + g * 260) * g * 0.75
    const espB = Math.pow(ndh, 6 + g * 10) * g * 0.13
    const amb2 = fres * g * 0.18
    const espCor = m > 0 ? mix3([1, 1, 1], base.map((c) => c * 2.2), m) : [1, 1, 1]
    const rug = rg[i] ? 0.92 + 0.16 * ndl : 1
    const vig = 1 - 0.13 * Math.pow(Math.hypot(P[0] - 0.45, P[1] - 0.45) / 0.75, 2)
    const ruido = (grao() - 0.5) * 0.018
    for (let k = 0; k < 3; k++) {
      let c = base[k] * dif * rug + (espA + espB + amb2) * espCor[k] + (m > 0 ? base[k] * Math.pow(ndh, 4) * m * 0.9 : 0)
      c = c * vig * 1.04 + ruido
      img.data[i * 4 + k] = Math.round(clamp(Math.pow(clamp(c), 0.96)) * 255)
    }
    img.data[i * 4 + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  // supersampling: renderiza no dobro e reduz, para evitar serrilhado nas texturas finas
  const out = document.createElement('canvas'); out.width = W / 2; out.height = H / 2
  const o2 = out.getContext('2d'); o2.imageSmoothingEnabled = true; o2.imageSmoothingQuality = 'high'
  o2.drawImage(cnv, 0, 0, W / 2, H / 2)
  return out.toDataURL('image/webp', 0.86)
}
export const NOMES = Object.keys(AMOSTRAS)
