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
// Cada amostra devolve, por ponto (u, v) do plano da prova: col (rgb 0..1), h (altura), gloss (0..1),
// e opcionalmente metal, film (película iridescente), trans (quanto se vê através do vidro: liga as microbolhas).
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
    if (dist < 0) return { col: m.col, h: m.h, gloss: 0.05 }
    const cordao = Math.exp(-dist / 0.022), rampa = ss(0, 0.012, dist)
    const e = (0.75 + v * 1.1 + cordao * 0.7 + N.fbm(u * 10, v * 6, 3) * 0.08) * (0.4 + 0.6 * rampa)
    const estrias = N.fbm(u * 30, v * 3, 3)
    const cor = mix3(mix3(hex('#9DB8B0'), hex('#3D6058'), ss(0.7, 1.9, e)), hex('#BFD0C6'), ss(0.2, 0.55, estrias) * 0.18)
    const g = esmalte(m, cor, e, 0.3, 0.25)
    return { col: g.col, h: m.h * (1 - rampa) + rampa * (0.006 + e * 0.004 + cordao * 0.003) + estrias * 0.0003, gloss: 0.9 * ss(0, 0.004, dist), trans: 0.6 }
  },

  sobreposicao(u, v) {
    // prova com duas camadas de verdade: à esquerda, um esmalte acetinado aveia com pintas de ferro; por cima,
    // mergulhado pela parte de cima, um esmalte mel translúcido. Onde cobre a aveia, deixa ver as pintas e fica
    // dourado; onde cobre a massa nua, fica castanho; a borda do mergulho tem cordão e pequenas gotas.
    const m = massa(u, v, '#C4A383')
    const dA = 0.6 - u + N.fbm(v * 4, 3, 4) * 0.05 + N2.fbm(u * 20, v * 20, 2) * 0.006
    let limB = 0.52 + N.fbm(u * 3, 7, 3) * 0.04
    for (const [x, L, w] of [[0.18, 0.09, 0.025], [0.47, 0.05, 0.02], [0.74, 0.12, 0.03], [0.9, 0.04, 0.018]]) limB += L * Math.exp(-Math.pow((u - x) / w, 2))
    const dB = limB - v
    const eA = dA > 0 ? ss(0, 0.01, dA) * (0.9 + N.fbm(u * 16, v * 16, 3) * 0.08) : 0
    const eB = dB > 0 ? ss(0, 0.006, dB) * (0.7 + ss(0, 0.3, dB) * 0.4 + N.fbm(u * 9 + 4, v * 9, 3) * 0.12) : 0
    const pv = N2.n2(u * 140, v * 140), pinta = ss(0.6, 0.72, pv)
    const corA = mix3(mix3(hex('#E4D9C2'), hex('#D2C3A5'), ss(-0.2, 0.5, N.fbm(u * 7, v * 7, 3))), hex('#5E3F26'), pinta * 0.85)
    const a = esmalte(m, corA, eA, 0.1, 0.05)
    // a camada de cima filtra a cor de baixo, como um vidro âmbar
    const filtro = mix3([1, 1, 1], hex('#B06A24'), clamp(1 - Math.exp(-eB * 1.6)))
    let col = a.col.map((c, k) => c * mix(1, filtro[k], 0.95))
    const borda = dB > 0 ? Math.exp(-dB / 0.01) : 0
    col = mix3(col, hex('#7A4318'), borda * 0.4 * (eB > 0 ? 1 : 0))
    const hA = eA * 0.007, hB = eB * 0.006 + borda * 0.004 * (eB > 0 ? 1 : 0)
    return { col, h: m.h * (1 - ss(0, 0.3, eA + eB)) + hA + hB, gloss: eB > 0 ? 0.9 : eA > 0 ? 0.35 : 0.04, trans: eB > 0 ? 0.5 : 0 }
  },

  reatividade(u, v) {
    // azul de rutilo aplicado sobre um esmalte escuro de ferro: onde os dois reagem, o azul se recolhe em manchas
    // arredondadas de núcleo leitoso, cercadas por uma auréola cor de âmbar; pontos de ferro sobem através do azul.
    // A densidade das manchas cresce na diagonal: de um esmalte só, à zona de reação, ao azul quase contínuo.
    const x = u + N.fbm(u * 3, v * 3, 3) * 0.04, y = v + N2.fbm(u * 3, v * 3, 3) * 0.04
    const grad = (x * 0.8 + y * 0.6) - 0.65
    const f = N.fbm(x * 13, y * 13, 4) * 0.8 + N2.fbm(x * 40, y * 40, 2) * 0.12 + grad * 0.6
    const mancha = ss(0.0, 0.025, f)
    const aureola = Math.exp(-Math.pow(f / 0.035, 2)) * (f < 0.02 ? 1 : 0)
    const nucleo = ss(0.04, 0.3, f)
    const base = mix3(hex('#2A1B13'), hex('#4A2E1C'), ss(-0.3, 0.4, N2.fbm(u * 9, v * 9, 3)))
    const azul = mix3(hex('#4C6B7E'), hex('#9DB3BC'), nucleo * (0.75 + N.fbm(x * 25, y * 25, 2) * 0.4))
    let col = mix3(base, hex('#9A6A38'), aureola * 0.85)
    col = mix3(col, azul, mancha)
    const ferro = N.n2(u * 150, v * 150)
    col = mix3(col, hex('#5B3A22'), ss(0.6, 0.72, ferro) * mancha * 0.8)
    return { col, h: 0.012 + mancha * 0.0018 + aureola * 0.0006, gloss: 0.88, trans: 0.35 }
  },

  flutuacao(u, v) {
    // flutuação de rutilo: sobre um fundo castanho de ferro, véus azul-acinzentados que se abrem em
    // estrias finas, como pelo de lebre, com pontinhos de cristais de titânio
    const x = u + N.fbm(u * 3, v * 3, 4) * 0.035
    const veu = ss(-0.12, 0.24, N.fbm(x * 5, v * 3.2, 5) + 0.02)
    const pelo = N.ridge(x * 75, v * 7, 3), pelo2 = N2.ridge(x * 140, v * 11, 2)
    const fio = ss(0.84, 0.95, pelo) * 0.8 + ss(0.86, 0.96, pelo2) * 0.5
    let col = mix3(hex('#3B2418'), hex('#6A4026'), ss(-0.3, 0.5, N2.fbm(u * 7, v * 7, 3)))
    const azul = mix3(hex('#4F6676'), hex('#A2B3B9'), clamp(ss(0, 1, veu) * 0.6 + fio * 0.5))
    col = mix3(col, azul, clamp(veu * 0.85 + fio * (0.25 + veu * 0.4)))
    col = mix3(col, hex('#B5824A'), ss(0.0, 0.12, veu) * ss(0.4, 0.12, veu) * 0.55)
    col = mix3(col, hex('#D2A86E'), ss(0.7, 0.8, N2.n2(u * 230, v * 230)) * (1 - veu) * 0.8)
    return { col, h: 0.012 + veu * 0.0012, gloss: 0.88, trans: 0.25 }
  },

  cristalizacao(u, v) {
    // macrocristais de silicato de zinco num vidro azul: rosetas que crescem até encontrar as vizinhas,
    // com agulhas radiais finas e anéis de crescimento; em volta, um halo onde o fundo foi consumido
    const vr = criaVoronoi(19, 3.1)(u, v)
    const fundo = mix3(hex('#2F4A5E'), hex('#42627A'), ss(-0.3, 0.4, N.fbm(u * 4, v * 4, 4)))
    let col = fundo, h = 0.014
    if (vr.id > 0.22) {
      const ang = Math.atan2(v - vr.py, u - vr.px), d = Math.hypot(u - vr.px, v - vr.py)
      const R = (0.08 + vr.id * 0.1) * (1 + N.n2(Math.cos(ang) * 1.5 + vr.id * 9, Math.sin(ang) * 1.5) * 0.18)
      const limite = Math.min(R, d + (vr.d2 - vr.d1) * 0.5)
      const dentro = ss(limite + 0.006, limite - 0.006, d + N.n2(ang * 9, d * 40) * 0.004) * ss(0.0, 0.004, vr.d2 - vr.d1)
      const agulha = 0.5 + 0.5 * Math.sin(ang * (60 + vr.id * 40) + N.n2(ang * 4, d * 12 + vr.id * 7) * 5)
      const anel = 0.5 + 0.5 * Math.sin(d * (90 + vr.id * 30) + N.n2(ang * 2, vr.id * 3) * 2)
      const cristal = mix3(mix3(hex('#7F9AA8'), hex('#B9C6C4'), ss(0, R, d) * 0.6 + 0.1), hex('#D8D9CC'), agulha * 0.25 + anel * 0.1)
      col = mix3(col, cristal, dentro * (0.55 + agulha * 0.2 + ss(R, R * 0.4, d) * 0.15))
      const halo = ss(R + 0.025, R, d) * (1 - dentro) * (vr.id > 0.22 ? 1 : 0)
      col = mix3(col, hex('#1E3242'), halo * 0.45)
      h += dentro * (0.0008 + agulha * 0.0004)
    }
    const micro = N2.n2(u * 260, v * 260)
    col = mix3(col, hex('#B9C7C9'), ss(0.7, 0.82, micro) * 0.5)
    return { col, h, gloss: 0.92, trans: 0.35 }
  },

  craquele(u, v) {
    // craquelamento num esmalte claro e brilhante: rede irregular de fissuras de várias larguras, tingidas,
    // com uma rede secundária mais fina; a camada engrossa e esverdeia levemente nas depressões
    const w = N.fbm(u * 3, v * 3, 3) * 0.06
    const a = criaVoronoi(3, 7)(u + w, v - w * 0.7), b = criaVoronoi(11, 19)(u + w * 1.3, v + w)
    const larg = 0.0012 + ss(-0.3, 0.5, N.fbm(u * 6, v * 6, 2)) * 0.0022
    const f1 = ss(larg, larg * 0.25, a.d2 - a.d1)
    const f2 = ss(0.0011, 0.0002, b.d2 - b.d1) * ss(-0.1, 0.25, N2.fbm(u * 5, v * 5, 2))
    const sombra = ss(larg * 5, larg, a.d2 - a.d1)
    let col = mix3(hex('#E9E3D2'), hex('#CFD3BE'), ss(-0.3, 0.5, N.fbm(u * 4, v * 4, 3)))
    col = mix3(col, hex('#B8A88A'), sombra * 0.25)
    col = mix3(col, hex('#4E3E2E'), Math.max(f1 * 0.85, f2 * 0.5))
    return { col, h: 0.014 + N.fbm(u * 5, v * 5, 3) * 0.002 - f1 * 0.0006, gloss: 0.9, trans: 0.4 }
  },

  crawling(u, v) {
    // retração: um esmalte acetinado espesso que se recolheu em ilhas de bordas arredondadas, como gotas
    // achatadas, deixando a massa à mostra em canais estreitos
    const m = massa(u, v, '#B48A68')
    const f = N.fbm(u * 4.5, v * 4.5, 4) + N2.fbm(u * 11, v * 11, 2) * 0.06 + 0.16
    const ilha = ss(-0.012, 0.012, f)
    const bojo = ss(-0.01, 0.2, f)
    const corI = mix3(mix3(hex('#E6E1D4'), hex('#CFC9B8'), ss(-0.2, 0.4, N.fbm(u * 9, v * 9, 3))), hex('#8E7A62'), ss(0.08, 0.0, f) * 0.25)
    const col = mix3(m.col, corI, ilha)
    return { col, h: m.h * (1 - ilha) + ilha * (0.004 + Math.sqrt(bojo) * 0.016), gloss: ilha * 0.45 + 0.03 }
  },

  acumulo(u, v) {
    // pétalas entalhadas sob um celadon translúcido: o esmalte se acumula nos sulcos dos contornos,
    // onde fica verde-escuro, e afina nas partes altas, onde clareia
    const m = massa(u, v, '#E0D6C4')
    const cx = 0.5 + N.fbm(3, 5, 2) * 0.05, cy = 1.35
    const dx = u - cx, dy = v - cy, r = Math.hypot(dx, dy) + N.fbm(u * 3, v * 3, 3) * 0.015, th = Math.atan2(dx, -dy)
    const fileira = r / 0.2, k = Math.floor(fileira), fr = fileira - k
    const nPet = 7 + k * 3, pos = (th / Math.PI * 0.5 + 0.5) * nPet + (k % 2) * 0.5, fp = pos - Math.floor(pos)
    const arco = 1 - Math.pow(Math.abs(fp - 0.5) * 2, 2) * 0.55   // contorno arredondado da pétala
    const dPet = fr - arco * 0.92                                   // <0 dentro da pétala
    const sulco = Math.exp(-Math.pow(dPet / 0.06, 2)) + Math.exp(-Math.pow((Math.abs(fp - 0.5) * 2 - 1) / 0.05, 2)) * (dPet < 0 ? 0.6 : 0)
    const relevo = (dPet < 0 ? ss(-0.9, -0.05, dPet) * 0.6 : 0) - sulco * 0.6
    const e = 0.45 + clamp(sulco) * 1.5 + (dPet > 0 ? 0.3 : 0)
    const cor = mix3(hex('#B6C9AE'), hex('#4A6F5E'), ss(0.5, 1.8, e))
    const g = esmalte({ col: m.col, h: m.h }, cor, e, 0.5, 0.15)
    return { col: g.col, h: 0.02 + relevo * 0.012, gloss: 0.9, trans: 0.7 }
  },

  quebraBordas(u, v) {
    // caneluras verticais sob um esmalte escuro de ferro: nas arestas a camada afina e a cor "quebra"
    // para ferrugem e âmbar; nos fundos, o esmalte acumula quase preto
    const m = massa(u, v, '#C9A27E')
    const x = u * 7.5 + N.fbm(u * 1.5, v * 1.5, 3) * 0.35 + v * 0.25
    const fr = x - Math.floor(x)
    const perfil = Math.pow(Math.abs(fr - 0.5) * 2, 1.6)  // 1 na aresta, 0 no fundo
    const marca = N.fbm(u * 40, v * 3, 2) * 0.08
    const alto = clamp(perfil + marca)
    const e = clamp(1.4 - Math.pow(alto, 2.2) * 1.3, 0.05, 2)
    const cor = mix3(mix3(hex('#C08048'), hex('#7A3A1A'), ss(0.1, 0.5, e)), hex('#1F1510'), ss(0.45, 1.2, e))
    const g = esmalte(m, cor, e, 0.3, 0.2)
    return { col: g.col, h: alto * 0.03, gloss: 0.88, trans: 0.2 }
  },

  bolhas(u, v) {
    // esmalte branco brilhante com bolhas: crateras abertas de bordas arredondadas (bolhas que estouraram
    // e não cicatrizaram), furinhos e bolhas fechadas logo abaixo da superfície
    const m = massa(u, v, '#C9A888')
    const e = 1.0 + N.fbm(u * 3, v * 3, 4) * 0.4
    const cor = mix3(hex('#EFE9DD'), hex('#E0D7C6'), ss(-0.2, 0.5, N.fbm(u * 6, v * 6, 3)))
    const g = esmalte(m, cor, e, 0.12, 0.05)
    let col = g.col, h = 0.014 + e * 0.003
    const c1 = criaVoronoi(53, 7)(u, v), c2 = criaVoronoi(59, 20)(u, v), c3 = criaVoronoi(61, 55)(u, v)
    for (const [c, lim, r, prof] of [[c1, 0.78, 0.022, 0.008], [c2, 0.8, 0.008, 0.004], [c3, 0.86, 0.0032, 0.002]]) {
      if (c.id < lim) continue
      const rr = r * (0.6 + (c.id - lim) / (1 - lim) * 0.8), q = c.d1 / rr
      if (q > 1.8) continue
      const furo = ss(1, 0.7, q), aro = Math.exp(-Math.pow((q - 1.0) / 0.22, 2))
      h += -furo * prof + aro * prof * 0.3
      // no fundo da cratera o esmalte é fino e a massa aparece
      col = mix3(col, mix3(m.col, cor, 0.25), furo * 0.75)
    }
    const fech = criaVoronoi(67, 14)(u, v)
    if (fech.id > 0.8 && fech.d1 < 0.009) { const q = fech.d1 / 0.009; h += (1 - q * q) * 0.0016 }
    return { col, h, gloss: 0.9, trans: 0.4 }
  },

  separacaoFases(u, v) {
    // esmalte tipo jun: a fase leitosa separada no vidro dá um azul-lavanda opaco, salpicado de áreas
    // mais transparentes e escuras onde ela não se formou; perto da borda fina, o vidro deixa ver o castanho da massa
    const m = massa(u, v, '#6E4E38')
    const x = u + N.fbm(u * 4, v * 4, 4) * 0.03, y = v + N2.fbm(u * 4, v * 4, 4) * 0.03
    const leite = ss(-0.25, 0.3, N.fbm(x * 9, y * 9, 4) + N2.fbm(x * 26, y * 26, 2) * 0.2)
    const fina = ss(0.75, 0.98, u * 0.25 + (1 - v) * 0.0 + N.fbm(v * 3, 2, 3) * 0.1 + 0.62)
    let col = mix3(hex('#2E3F63'), hex('#46577E'), ss(-0.3, 0.4, N2.fbm(u * 6, v * 6, 3)))
    col = mix3(col, mix3(hex('#7C8DB2'), hex('#A9B4CA'), ss(0.5, 1, leite)), leite * 0.9)
    col = mix3(col, hex('#8A6A9A'), ss(0.7, 0.85, N2.n2(x * 5, y * 5)) * 0.35)
    col = mix3(col, mix3(m.col, hex('#8E6A3E'), 0.4), fina * 0.85)
    return { col, h: 0.014, gloss: 0.9, trans: 0.4 }
  },

  opalescencia(u, v) {
    // esmalte opalescente sobre massa escura com marcas de torno: espesso nos sulcos, fica azul leitoso;
    // fino nas cristas, fica âmbar transparente e deixa ver a massa
    const m = massa(u, v, '#5A4436')
    const y = v * 7 + N.fbm(u * 2, v * 2, 3) * 1.1 + Math.sin(u * 2.5) * 0.3
    const fr = y - Math.floor(y)
    const crista = Math.pow(1 - Math.abs(fr - 0.5) * 2, 5)
    const e = 0.3 + (1 - crista) * 1.3 + N.fbm(u * 8, v * 8, 3) * 0.15
    const opal = ss(0.75, 1.45, e) * (0.85 + N2.fbm(u * 6, v * 6, 3) * 0.3)
    let col = mix3(m.col.map((c) => c * 0.9), hex('#A0662E'), ss(0.1, 0.5, e) * 0.85)
    col = mix3(col, mix3(hex('#6F8EAA'), hex('#AFC3D3'), ss(0.9, 1.7, e)), clamp(opal))
    return { col, h: Math.pow(1 - Math.abs(fr - 0.5) * 2, 2) * 0.006 + 0.008, gloss: 0.9, trans: 0.5 }
  },

  opacidade(u, v) {
    // variação de opacidade: esmalte branco de estanho sobre massa vermelha, nas marcas de torno;
    // espesso, cobre por completo; fino, fica translúcido e rosado e deixa a massa transparecer
    const m = massa(u, v, '#A9603E')
    const y = v * 11 + N.fbm(u * 1.8, v * 1.8, 3) * 1.6
    const fr = y - Math.floor(y)
    const crista = Math.pow(1 - Math.abs(fr - 0.5) * 2, 2.5)
    const e = 0.08 + (1 - crista) * 1.1 + N.fbm(u * 10, v * 6, 3) * 0.12 + ss(0.2, 0.7, N2.fbm(u * 2, v * 2, 3)) * 0.4
    const branco = mix3(hex('#F1ECE2'), hex('#E6DDCF'), ss(-0.2, 0.4, N.fbm(u * 7, v * 7, 3)))
    const g = esmalte(m, branco, e, 0.09, 0.0)
    const col = mix3(g.col, hex('#D9A58A'), ss(0.35, 0.1, e) * ss(0.02, 0.08, e) * 0.5)
    return { col, h: crista * 0.012 + 0.01, gloss: 0.55 }
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
    return { col: g.col, h: g.h + e * 0.008 + degrau, gloss: baixo ? 0.04 : 0.8, trans: baixo ? 0 : 0.6 }
  },

  textura(u, v) {
    // superfície fosca e rugosa, granulada, com pequenas crateras
    const gran = N.fbm(u * 60, v * 60, 3), bol = criaVoronoi(41, 26)(u, v)
    const crat = bol.id > 0.7 ? ss(0.012, 0.004, bol.d1) : 0
    const h = gran * 0.008 + N2.fbm(u * 12, v * 12, 4) * 0.016 - crat * 0.01 + ss(0.016, 0.011, bol.d1) * (bol.id > 0.7 ? 0.003 : 0)
    let col = mix3(hex('#CFC5B4'), hex('#A89C88'), ss(-0.3, 0.5, N2.fbm(u * 8, v * 8, 3)))
    col = mix3(col, hex('#6E6152'), crat * 0.6)
    col = col.map((x) => x * (1 + gran * 0.12))
    return { col, h, gloss: 0.08 }
  },

  transparencia(u, v) {
    // esmalte transparente sobre massa avermelhada com engobe e incisões; à direita, faixa sem esmalte
    const m = massa(u, v, '#B4704E')
    const engobe = Math.abs(v - 0.35 - Math.sin(u * 7) * 0.06) < 0.045 || Math.abs(v - 0.66 - Math.sin(u * 6 + 1) * 0.05) < 0.03
    const inc = Math.abs(Math.sin(u * 30 + v * 4)) < 0.06 && v > 0.45 && v < 0.58
    let base = engobe ? mix3(hex('#EADCC4'), m.col, 0.15) : m.col
    if (inc) base = base.map((x) => x * 0.72)
    const seco = u > 0.8 + N.fbm(v * 8, 2, 2) * 0.012
    const col = seco ? base.map((x) => x * 1.04) : base.map((x, i) => Math.pow(x, 1.25) * [0.98, 0.96, 0.9][i])
    return { col, h: seco ? m.h : 0.012 + (inc ? -0.0015 : 0), gloss: seco ? 0.04 : 0.95, trans: seco ? 0 : 1 }
  },

  metalico(u, v) {
    // esmalte metálico de manganês/cobre: reflexo colorido, pouca cor difusa, manchas de brilho
    const f = N.fbm(u * 4, v * 4, 5)
    const col = mix3(hex('#4A3C30'), hex('#8A6A48'), ss(-0.3, 0.5, f))
    const h = N.fbm(u * 18, v * 18, 3) * 0.0012 + f * 0.006
    return { col, h, gloss: 0.6 + ss(0, 0.5, f) * 0.3, metal: 0.85 }
  },

  iridescencia(u, v) {
    // esmalte escuro com película iridescente sutil, que muda de tom com o ângulo
    const f = N.fbm(u * 3, v * 3, 5)
    const col = mix3(hex('#1D1C22'), hex('#2C2A30'), ss(-0.3, 0.4, f))
    return { col, h: 0.012 + f * 0.003 + N2.fbm(u * 20, v * 20, 2) * 0.0004, gloss: 0.9, metal: 0.2, film: 0.75 + f * 0.4 }
  },
}

/* ——— renderização ——— */
// Câmera inclinada sobre a prova (perspectiva leve), softbox atrás e acima refletida no vidro, casca de laranja e
// microbolhas no esmalte, profundidade de campo curta nas bordas de cima e de baixo, grão fino. Renderiza em S×S e
// entrega a metade (supersampling), em WebP de até ~100 KB.
export function renderizar(nome, S = 1024, maxKB = 100) {
  const fn = AMOSTRAS[nome]
  const W = S, H = S, n = W * H, P = 0.42
  const hh = new Float32Array(n), cr = new Float32Array(n), cg = new Float32Array(n), cb = new Float32Array(n)
  const gl = new Float32Array(n), mt = new Float32Array(n), fl = new Float32Array(n), uu = new Float32Array(n), vv = new Float32Array(n)
  const pin = criaVoronoi(71, 40), mb1 = criaVoronoi(83, 95), mb2 = criaVoronoi(89, 45)
  for (let y = 0; y < H; y++) {
    const sy = (y + 0.5) / H, w = 1 + P * (1 - sy)
    const v = (sy + P * (sy - sy * sy / 2)) / (1 + P / 2)
    for (let x = 0; x < W; x++) {
      const i = y * W + x, u = 0.5 + ((x + 0.5) / W - 0.5) * w * 0.86
      const s = fn(u, v)
      let h = s.h, col = s.col
      const g = s.gloss || 0, tr = s.trans || 0
      // casca de laranja: ondulação fina de todo vidro brilhante
      h += g * (N2.fbm(u * 55, v * 55, 2) * 0.00011 + N.n2(u * 150, v * 150) * 0.00002)
      // furinhos raros
      if (g > 0.5) { const p = pin(u, v); if (p.id > 0.988 && p.d1 < 0.0022) { const q = p.d1 / 0.0022; h -= (1 - q * q) * 0.0012; col = col.map((c) => c * (0.75 + q * 0.25)) } }
      // microbolhas presas no vidro translúcido
      if (tr > 0) for (const [mb, lim, r] of [[mb1, 1 - 0.1 * tr, 0.0016], [mb2, 1 - 0.05 * tr, 0.0028]]) {
        const b = mb(u, v)
        if (b.id > lim) {
          const rr = r * (0.5 + (b.id - lim) / (1 - lim))
          if (b.d1 < rr) { const q = b.d1 / rr; col = mix3(col, [0.93, 0.95, 0.94], Math.min(0.5, 0.3 * tr) * (1 - q * q)); col = col.map((c) => c * (1 - 0.18 * Math.exp(-Math.pow((q - 0.85) / 0.12, 2)) * Math.min(1, tr))) }
        }
      }
      hh[i] = h; cr[i] = col[0]; cg[i] = col[1]; cb[i] = col[2]; gl[i] = g; mt[i] = s.metal || 0; fl[i] = s.film || 0; uu[i] = u; vv[i] = v
    }
  }
  const blur = (src, r) => {
    const t = new Float32Array(n), o = new Float32Array(n)
    for (let y = 0; y < H; y++) { let s = 0; for (let x = -r; x < W; x++) { if (x + r < W) s += src[y * W + x + r]; if (x - r - 1 >= 0) s -= src[y * W + x - r - 1]; if (x >= 0) t[y * W + x] = s / (2 * r + 1) } }
    for (let x = 0; x < W; x++) { let s = 0; for (let y = -r; y < H; y++) { if (y + r < H) s += t[(y + r) * W + x]; if (y - r - 1 >= 0) s -= t[(y - r - 1) * W + x]; if (y >= 0) o[y * W + x] = s / (2 * r + 1) } }
    return o
  }
  const media = blur(hh, Math.round(S / 70))
  const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]); return [a[0] / l, a[1] / l, a[2] / l] }
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
  const cam = [0.5, 1.75, 1.35]
  const key = norm([-0.3, -0.85, 0.95])
  // softbox (retângulo luminoso) na direção C, com eixos e1 (horizontal) e e2
  const C = norm([-0.1, -0.86, 0.55]), e1 = norm([C[1], -C[0], 0]), e2 = [C[1] * e1[2] - C[2] * e1[1], C[2] * e1[0] - C[0] * e1[2], C[0] * e1[1] - C[1] * e1[0]]
  const cnv = document.createElement('canvas'); cnv.width = W; cnv.height = H
  const ctx = cnv.getContext('2d'), img = ctx.createImageData(W, H)
  const tom = (c) => (c < 0.82 ? c : 0.82 + (c - 0.82) / (1 + (c - 0.82) / 0.2))
  for (let y = 0; y < H; y++) {
    const sy = (y + 0.5) / H, w = 1 + P * (1 - sy), ex = (w * 0.86) / W, ey = w / (1 + P / 2) / H
    for (let x = 0; x < W; x++) {
      const i = y * W + x
      const hx = (hh[y * W + Math.min(W - 1, x + 1)] - hh[y * W + Math.max(0, x - 1)]) / (2 * ex)
      const hy = (hh[Math.min(H - 1, y + 1) * W + x] - hh[Math.max(0, y - 1) * W + x]) / (2 * ey)
      const nr = norm([-hx, -hy, 1])
      const V = norm([cam[0] - uu[i], cam[1] - vv[i], cam[2]])
      const ndv = Math.max(0.001, dot(nr, V))
      const R = [2 * ndv * nr[0] - V[0], 2 * ndv * nr[1] - V[1], 2 * ndv * nr[2] - V[2]]
      const g = gl[i], m = mt[i]
      // reflexo do softbox: borda nítida no vidro brilhante, difusa no fosco
      const rc = dot(R, C)
      let box = 0
      if (rc > 0.05) {
        const px = dot(R, e1) / rc, py = dot(R, e2) / rc, s = 0.025 + Math.pow(1 - g, 1.5) * 0.7
        box = ss(0.32 + s, 0.32 - s, Math.abs(px)) * ss(0.11 + s, 0.11 - s, Math.abs(py)) * (1 - 0.35 * clamp(py / 0.11 * 0.5 + 0.5))
      }
      const sala = 0.22 * ss(-0.1, 1, R[2])
      const F = 0.045 + 0.955 * Math.pow(1 - ndv, 5)
      const forca = mix(0.12, 1, g) * (g < 0.15 ? 0.4 : 1)
      const env = (box * 6.5 * (0.2 + 0.8 * g) + sala) * forca
      const cav = clamp((media[i] - hh[i]) * 70, -0.5, 1)
      const ao = 1 - clamp(cav) * 0.38
      const ndl = Math.max(0, dot(nr, key))
      const dif = (0.42 + 0.62 * ndl + 0.1 * Math.max(0, nr[0] * 0.6 + nr[1] * 0.3)) * ao
      let base = [cr[i], cg[i], cb[i]]
      if (fl[i] > 0) {
        const fase = (1 - ndv) * 6 + fl[i] * 5 + hh[i] * 200
        base = mix3(base, [0.5 + 0.5 * Math.cos(fase), 0.5 + 0.5 * Math.cos(fase + 2.1), 0.5 + 0.5 * Math.cos(fase + 4.2)].map((c) => 0.12 + c * 0.3), 0.3)
      }
      const corEsp = m > 0 ? mix3([1, 1, 1], base.map((c) => c * 2.2), m) : [1, 1, 1]
      const fe = m > 0 ? mix(F, 0.7, m) : F
      for (let k = 0; k < 3; k++) {
        const c = base[k] * dif * (1 - fe) * (1 - m * 0.7) + env * fe * corEsp[k] * ao
        img.data[i * 4 + k] = Math.round(clamp(tom(c * 1.02)) * 255)
      }
      img.data[i * 4 + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  // profundidade de campo: o topo (mais longe) e a borda de baixo (mais perto) saem levemente desfocados
  const bl = document.createElement('canvas'); bl.width = W; bl.height = H
  const bc = bl.getContext('2d')
  bc.filter = `blur(${(S * 0.004).toFixed(1)}px)`; bc.drawImage(cnv, 0, 0); bc.filter = 'none'
  bc.globalCompositeOperation = 'destination-in'
  const gr = bc.createLinearGradient(0, 0, 0, H)
  gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.22, 'rgba(0,0,0,0)'); gr.addColorStop(0.82, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.5)')
  bc.fillStyle = gr; bc.fillRect(0, 0, W, H)
  ctx.drawImage(bl, 0, 0)
  // vinheta suave
  const vg = ctx.createRadialGradient(W * 0.48, H * 0.45, W * 0.25, W * 0.5, H * 0.5, W * 0.78)
  vg.addColorStop(0, 'rgba(20,14,8,0)'); vg.addColorStop(1, 'rgba(20,14,8,0.2)')
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H)
  // reduz à metade e aplica o grão no tamanho final
  const out = document.createElement('canvas'); out.width = W / 2; out.height = H / 2
  const o2 = out.getContext('2d'); o2.imageSmoothingEnabled = true; o2.imageSmoothingQuality = 'high'
  o2.drawImage(cnv, 0, 0, W / 2, H / 2)
  const fim = o2.getImageData(0, 0, W / 2, H / 2), gr2 = rng(99)
  for (let i = 0; i < fim.data.length; i += 4) {
    const z = (gr2() + gr2() + gr2() - 1.5) * 3.2
    for (let k = 0; k < 3; k++) fim.data[i + k] = Math.max(0, Math.min(255, fim.data[i + k] + z))
  }
  o2.putImageData(fim, 0, 0)
  for (let q = 0.84; ; q -= 0.04) {
    const url = out.toDataURL('image/webp', q)
    if ((url.length - 23) * 0.75 <= maxKB * 1024 || q <= 0.5) return url
  }
}
export const NOMES = Object.keys(AMOSTRAS)
