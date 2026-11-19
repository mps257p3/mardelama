/** Extrai uma paleta de até `n` cores de uma imagem (quantização simples por k-means). */
export async function extrairPaleta(blob: Blob, n = 5): Promise<string[]> {
  const bmp = await createImageBitmap(blob)
  const W = 64, H = Math.max(1, Math.round((bmp.height / bmp.width) * 64))
  const c = document.createElement('canvas'); c.width = W; c.height = H
  const ctx = c.getContext('2d')!; ctx.drawImage(bmp, 0, 0, W, H)
  const d = ctx.getImageData(0, 0, W, H).data
  const px: [number, number, number][] = []
  for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200) px.push([d[i], d[i + 1], d[i + 2]])
  if (!px.length) return []
  let cent = Array.from({ length: n }, (_, k) => px[Math.floor((k + 0.5) * px.length / n)])
  let grupos: number[] = []
  for (let it = 0; it < 10; it++) {
    grupos = px.map((p) => { let m = 0, md = Infinity; cent.forEach((q, k) => { const dd = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2; if (dd < md) { md = dd; m = k } }); return m })
    cent = cent.map((q, k) => { const xs = px.filter((_, i) => grupos[i] === k); if (!xs.length) return q; return [0, 1, 2].map((j) => Math.round(xs.reduce((s, x) => s + x[j], 0) / xs.length)) as [number, number, number] })
  }
  const cont = cent.map((_, k) => grupos.filter((g) => g === k).length)
  return cent.map((q, k) => ({ q, c: cont[k] })).sort((a, b) => b.c - a.c)
    .map(({ q }) => '#' + q.map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase())
    .filter((h, i, a) => a.indexOf(h) === i)
}
