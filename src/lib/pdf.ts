/**
 * Abre um PDF no próprio aparelho: tira o texto de todas as páginas e recorta as figuras.
 * As figuras são achadas pelas imagens desenhadas na página (posição e tamanho de cada uma);
 * a página é desenhada em boa resolução e só o retângulo de cada figura é recortado.
 */
export interface PdfLido { titulo: string; texto: string; figuras: Blob[]; paginas: number }

const MAX_PAGINAS = 60
const MAX_FIGURAS = 30

type M = [number, number, number, number, number, number]
const mult = (a: M, b: M): M => [
  a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1],
  a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3],
  a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5],
]

export async function lerPdf(arquivo: Blob): Promise<PdfLido> {
  const pdfjs = await import('pdfjs-dist')
  const worker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  pdfjs.GlobalWorkerOptions.workerSrc = worker
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await arquivo.arrayBuffer()) }).promise
  const { OPS } = pdfjs
  const meta = await doc.getMetadata().catch(() => undefined)
  const titulo = String((meta?.info as { Title?: string } | undefined)?.Title ?? '').trim()
  const textos: string[] = []
  const figuras: Blob[] = []
  const n = Math.min(doc.numPages, MAX_PAGINAS)

  for (let i = 1; i <= n; i++) {
    const pg = await doc.getPage(i)
    const tc = await pg.getTextContent()
    const t = tc.items.map((x) => ('str' in x ? x.str + (x.hasEOL ? '\n' : '') : '')).join('').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
    if (t) textos.push(t)
    if (figuras.length >= MAX_FIGURAS) continue

    // onde cada imagem cai na página: acompanha a matriz de transformação pelo desenho
    const ops = await pg.getOperatorList()
    const vp = pg.getViewport({ scale: 1 })
    let ctm: M = [1, 0, 0, 1, 0, 0]
    const pilha: M[] = []
    const caixas: [number, number, number, number][] = []
    for (let k = 0; k < ops.fnArray.length; k++) {
      const f = ops.fnArray[k], a = ops.argsArray[k]
      if (f === OPS.save) pilha.push(ctm)
      else if (f === OPS.restore) ctm = pilha.pop() ?? ctm
      else if (f === OPS.transform) ctm = mult(ctm, a as M)
      else if (f === OPS.paintFormXObjectBegin) { pilha.push(ctm); if (Array.isArray(a?.[0]) && a[0].length === 6) ctm = mult(ctm, a[0] as M) }
      else if (f === OPS.paintFormXObjectEnd) ctm = pilha.pop() ?? ctm
      else if (f === OPS.paintImageXObject || f === OPS.paintInlineImageXObject || f === OPS.paintImageXObjectRepeat) {
        // a imagem ocupa o quadrado unitário no espaço do usuário
        const m = mult(vp.transform as M, ctm)
        const xs = [m[4], m[0] + m[4], m[2] + m[4], m[0] + m[2] + m[4]]
        const ys = [m[5], m[1] + m[5], m[3] + m[5], m[1] + m[3] + m[5]]
        caixas.push([Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)])
      }
    }
    // só figuras de verdade: nada de ícones, fios ou fundos minúsculos; repetidas não entram
    const area = vp.width * vp.height
    const boas = caixas
      .map(([x0, y0, x1, y1]) => [Math.max(0, x0), Math.max(0, y0), Math.min(vp.width, x1), Math.min(vp.height, y1)] as const)
      .filter(([x0, y0, x1, y1]) => x1 - x0 > 60 && y1 - y0 > 60 && (x1 - x0) * (y1 - y0) > area * 0.03)
      .filter((c, j, arr) => arr.findIndex((d) => d.every((v, q) => Math.abs(v - c[q]) < 4)) === j)
    if (!boas.length) continue

    const escala = Math.min(3, 2000 / Math.max(vp.width, vp.height))
    const v2 = pg.getViewport({ scale: escala })
    const tela = document.createElement('canvas')
    tela.width = Math.ceil(v2.width); tela.height = Math.ceil(v2.height)
    await pg.render({ canvas: tela, canvasContext: tela.getContext('2d')!, viewport: v2 }).promise
    for (const [x0, y0, x1, y1] of boas) {
      if (figuras.length >= MAX_FIGURAS) break
      const c = document.createElement('canvas')
      c.width = Math.round((x1 - x0) * escala); c.height = Math.round((y1 - y0) * escala)
      c.getContext('2d')!.drawImage(tela, x0 * escala, y0 * escala, c.width, c.height, 0, 0, c.width, c.height)
      const b = await new Promise<Blob | null>((ok) => c.toBlob(ok, 'image/jpeg', 0.88))
      if (b) figuras.push(b)
    }
    tela.width = tela.height = 0
  }
  await doc.destroy()
  return { titulo, texto: textos.join('\n\n'), figuras, paginas: doc.numPages }
}
