// Gera public/fenomenos/<nome>.webp a partir de render.js, num Chromium sem interface.
// Uso: node scripts/amostras/gerar.cjs [nome ...]
const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')

;(async () => {
  const dir = path.join(__dirname, '../../public/fenomenos')
  fs.mkdirSync(dir, { recursive: true })
  const codigo = fs.readFileSync(path.join(__dirname, 'render.js'), 'utf8').replace(/^export /gm, '')
  const b = await chromium.launch()
  const p = await b.newPage()
  await p.setContent('<html><body></body></html>')
  await p.addScriptTag({ content: codigo + '\nwindow.renderizar = renderizar; window.NOMES = NOMES;' })
  const nomes = process.argv.slice(2).length ? process.argv.slice(2) : await p.evaluate(() => window.NOMES)
  for (const n of nomes) {
    const url = await p.evaluate((n) => window.renderizar(n, 960), n)
    fs.writeFileSync(path.join(dir, n + '.webp'), Buffer.from(url.split(',')[1], 'base64'))
    console.log(n)
  }
  await b.close()
})()
