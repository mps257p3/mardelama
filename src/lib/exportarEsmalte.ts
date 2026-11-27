import { temperaturaDaFicha } from './cones'
import { db, type Esmalte, type Teste } from '../db/schema'
import { baixar } from '../db/backup'
import { esc, imagemEmbutida } from './exportarArtista'
import { fmt } from './opcoes'

/**
 * Exporta a ficha de um esmalte como um único arquivo HTML (abre em qualquer navegador; dá para imprimir ou salvar em PDF).
 * Leva as fotos do esmalte, a ficha técnica, a fluidez durante a queima (fabricante, estimativa da IA e testes seus, separados),
 * a fórmula ligada, os testes e as peças. As fotos guardadas no aparelho vão dentro do arquivo.
 */
const LOUCA = { sim: 'Pode ir à louça', nao: 'Só decorativo', testar: 'Testar antes de usar em louça' } as const
const data = (d?: string) => (d ? new Date(d + 'T12:00').toLocaleDateString('pt-BR') : '')
const link = (u: string) => `<a href="${esc(u)}">${esc((() => { try { return new URL(u).hostname.replace(/^www\./, '') } catch { return u } })())}</a>`
const linhas = (xs: [string, string | undefined][]) => xs.filter(([, v]) => v).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')

async function fotos(ids: string[], alt = '') {
  const out: string[] = []
  for (const id of ids) { const s = await imagemEmbutida(id); if (s) out.push(`<figure><img src="${esc(s)}" alt="${esc(alt)}"></figure>`) }
  return out.join('')
}

export async function exportarEsmalte(e: Esmalte, aoAvancar?: (t: string) => void) {
  aoAvancar?.('Preparando fotos…')
  const familias = (await db.familias.bulkGet(e.familias)).filter((f) => f && !f.excluido).map((f) => f!.nome)
  const receita = e.receitaId ? await db.receitas.get(e.receitaId) : undefined
  const testes: Teste[] = (await db.testes.where('esmalteId').equals(e.id).toArray()).filter((t) => !t.excluido).sort((a, b) => b.data.localeCompare(a.data))
  const capa = await fotos(e.fotos, e.nome)
  const pecas = await fotos(e.pecas ?? [], 'Peça com ' + e.nome)
  const comercial = e.origem === 'comercial'

  const ficha = linhas([
    ['Código', e.codigo], ['Origem', comercial ? 'Comercial' : 'Formulação própria'], [comercial ? 'Fabricante' : 'Autoria', e.autoria],
    ['Famílias', familias.join(', ')], ['Cor', e.cor], ['Acabamento', e.acabamento], ['Textura', e.textura], ['Transparência', e.transparencia],
    ['Temperatura', (() => { const t = temperaturaDaFicha(e); return t && (t.referencia ? `${t.valor} (Referência: cone convertido pela tabela Orton de cones autossustentáveis, 150 °C/h)` : t.valor) })()], ['Cone', e.cone], ['Atmosfera', e.atmosfera],
    [comercial ? 'Fluidez (sua avaliação)' : 'Fluidez na queima', e.fluidez], ['Consistência do líquido', e.viscosidade], ['Aplicação', e.aplicacao],
    ['Uso em louça', e.louca ? LOUCA[e.louca] : undefined], ['Status', e.status], ['Avaliação', e.avaliacao ? '★'.repeat(e.avaliacao) + '☆'.repeat(5 - e.avaliacao) : undefined],
    ['Fonte da receita', e.fonteReceita],
  ])

  // Fluidez: as três origens ficam separadas e rotuladas
  let fluidez = ''
  const f = e.fluidezQueima
  if (comercial || e.testesFluidez?.length) {
    aoAvancar?.('Preparando fluidez…')
    const fab = !f ? '<p><i>Fabricante ainda não consultado sobre a fluidez.</i></p>'
      : f.situacao === 'indisponivel' ? '<p><i>Consulta indisponível ou não concluída.</i></p>'
      : f.situacao === 'nao-informada' ? '<p><i>Fluidez não informada pelo fabricante.</i></p>'
      : `${f.situacao === 'descritiva' ? '<p><small>O fabricante não tem classificação formal; abaixo, o que ele descreve.</small></p>' : ''}
        ${f.resultados.map((r) => `<div class="res">${r.classificacao ? `<p class="termo"><b>${esc(r.classificacao)}</b>${r.traducao ? ` · ${esc(r.traducao)}` : ''}</p>` : ''}
          ${r.cone || r.temperatura ? `<p class="meta">${esc([r.cone && 'Cone ' + r.cone.replace(/^cone\s*/i, ''), r.temperatura].filter(Boolean).join(' · '))}</p>` : ''}
          ${r.escala ? `<p><small>Escala do fabricante:</small> ${esc(r.escala)}</p>` : ''}${r.comportamento ? `<p>${esc(r.comportamento)}</p>` : ''}
          ${r.escorrimentoMm ? `<p><small>Escorrimento:</small> ${esc(/mm/i.test(r.escorrimentoMm) ? r.escorrimentoMm : r.escorrimentoMm + ' mm')}</p>` : ''}</div>`).join('')}
        <dl>${linhas([['Influência da espessura', f.espessura], ['Em sobreposição', f.sobreposicao], ['Influência da curva de queima', f.curva], ['Recomendações de aplicação', f.recomendacoes]])}</dl>
        ${f.imagens.length ? `<div class="grade">${await fotos(f.imagens, 'Teste de fluidez do fabricante')}</div>` : ''}`
    const rotulo = !f || f.situacao === 'nao-informada' || f.situacao === 'indisponivel' ? 'Fabricante' : f.situacao === 'descritiva' ? 'Descrição do fabricante' : 'Oficial do fabricante'
    const fontes = f && (f.fontes.length || f.consultadoEm) ? `<p><small>${f.fontes.map(link).join(' · ')}${f.consultadoEm ? `${f.fontes.length ? ' · ' : ''}Consultado em ${data(f.consultadoEm)}` : ''}</small></p>` : ''
    const seus: string[] = []
    for (const t of [...(e.testesFluidez ?? [])].sort((a, b) => b.data.localeCompare(a.data))) {
      seus.push(`<div class="res"><p class="termo"><b>${t.escorrimentoMm != null ? esc(fmt(t.escorrimentoMm, 0)) + ' mm' : 'Sem medida'}</b> · ${data(t.data)}</p>
        <p class="meta">${esc([t.temperatura && fmt(t.temperatura, 0) + ' °C', t.cone && 'cone ' + t.cone, t.atmosfera, t.inclinacao && 'inclinação ' + t.inclinacao].filter(Boolean).join(' · '))}</p>
        <p><small>${esc([t.massa && 'Massa: ' + t.massa, t.quantidade && 'Aplicação: ' + t.quantidade, t.camadas && t.camadas + (t.camadas === 1 ? ' camada' : ' camadas'), t.curva && 'Curva: ' + t.curva, t.sobreposicao && 'Sobreposição: ' + t.sobreposicao].filter(Boolean).join(' · '))}</small></p>
        ${t.observacoes ? `<p>${esc(t.observacoes)}</p>` : ''}${t.fotos.length ? `<div class="grade">${await fotos(t.fotos)}</div>` : ''}</div>`)
    }
    fluidez = `<h2>Fluidez durante a queima</h2><p><small>Como o esmalte fundido se move e escorre na queima. Não é a consistência do esmalte líquido.</small></p>
      ${comercial ? `<div class="bloco"><p class="selo">${rotulo}</p>${fab}${fontes}</div>` : ''}
      ${f?.estimativaIA ? `<div class="bloco ia"><p class="selo">Estimativa por IA</p><p>${esc(f.estimativaIA)}</p><p><small>Interpretação da IA; não é classificação do fabricante nem resultado de teste.</small></p></div>` : ''}
      <div class="bloco seu"><p class="selo">Seus testes</p>${seus.join('') || '<p><i>Nenhum teste de fluidez ainda.</i></p>'}</div>`
  }

  let formula = ''
  if (receita && !receita.excluido) {
    const total = receita.ingredientes.filter((i) => i.classe === 'base').reduce((s, i) => s + i.percentual, 0)
    formula = `<h2>Fórmula${receita.codigo ? ' · ' + esc(receita.codigo) : ''} <small>(versão ${receita.versaoAtual})</small></h2>
      <table><tbody>${receita.ingredientes.map((i) => `<tr><td>${esc(i.nome)}${i.classe !== 'base' ? ` <small>(${esc(i.classe)})</small>` : ''}</td><td class="n">${esc(fmt(i.percentual, 2))}</td></tr>`).join('')}
      <tr class="tot"><td>Base</td><td class="n">${esc(fmt(total, 2))}</td></tr></tbody></table>
      ${receita.temperatura ? `<p><b>Queima:</b> ${esc(receita.temperatura)}</p>` : ''}${receita.observacoes ? `<p>${esc(receita.observacoes)}</p>` : ''}`
  }

  const blocosTestes: string[] = []
  let n = 0
  for (const t of testes) {
    aoAvancar?.(`Preparando testes: ${++n} de ${testes.length}`)
    blocosTestes.push(`<figure>${(await fotos(t.fotos.slice(0, 1))).replace(/^<figure>|<\/figure>$/g, '')}<figcaption><b>${esc(t.codigo)}</b> · ${t.planejado ? 'Planejado' : data(t.data)}<br>${esc([t.temperatura && fmt(t.temperatura, 0) + ' °C', t.cone && 'cone ' + t.cone, t.argila, t.camadas && t.camadas + ' camadas', t.aplicacao].filter(Boolean).join(' · '))}${t.resultado ? `<br>${esc(t.resultado)}` : ''}${t.observacoes ? `<br><i>${esc(t.observacoes)}</i>` : ''}</figcaption></figure>`)
  }

  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(e.nome)} · Esmalte</title>
<style>
body{font:16px/1.55 Georgia,serif;color:#2b2420;background:#faf6f0;max-width:860px;margin:0 auto;padding:32px 20px}
h1{font-size:40px;margin:4px 0}h2{font-size:24px;margin:36px 0 10px;border-bottom:1px solid #d9cfc3;padding-bottom:4px}
.eyebrow{font:12px/1.3 system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#a2593b}
.grade{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;margin:12px 0}
figure{margin:0;break-inside:avoid}figure img{width:100%;height:auto;border-radius:6px;display:block}
figcaption{font:13px/1.4 system-ui,sans-serif;margin-top:6px;color:#5b4f47}
dl{display:grid;grid-template-columns:1fr 1fr;gap:0 20px;margin:0}dl div{padding:8px 0;border-bottom:1px solid #e4dbd0}
dt{font:11px/1.3 system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#7a6d63}dd{margin:2px 0 0}
.bloco{border:1px solid #d9cfc3;border-radius:10px;padding:12px 16px;margin:12px 0;break-inside:avoid;background:#fffdf9}
.bloco.ia{border-style:dashed;border-color:#b8653f;background:transparent}.bloco.seu{background:#f1e9df}
.selo{display:inline-block;font:11px/1 system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;padding:5px 8px;border-radius:999px;background:#e6e1d8;margin:0 0 6px}
.bloco.ia .selo{background:transparent;border:1px dashed #b8653f;color:#b8653f}.bloco.seu .selo{background:#2b2420;color:#faf6f0}
.res{padding:8px 0;border-top:1px solid #e4dbd0}.res:first-of-type{border-top:0}.res p{margin:3px 0}
.termo{font-size:18px}.meta{font:12px/1.3 system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#7a6d63}
table{border-collapse:collapse;width:100%;max-width:480px}td{padding:6px 0;border-bottom:1px solid #e4dbd0}td.n{text-align:right;font-variant-numeric:tabular-nums}tr.tot td{font-weight:bold;border-bottom:0}
a{color:#7a3e26}small{color:#7a6d63}.obs{white-space:pre-wrap}
@media (max-width:560px){dl{grid-template-columns:1fr}}
@media print{body{background:#fff}h2{break-after:avoid}}
</style></head><body>
<p class="eyebrow">${esc([e.codigo, familias.join(', ')].filter(Boolean).join(' · '))}</p>
<h1>${esc(e.nome)}</h1>
${capa ? `<div class="grade">${capa}</div>` : e.corHex ? `<div style="width:120px;height:120px;border-radius:8px;background:${esc(e.corHex)}"></div>` : ''}
<h2>Ficha</h2><dl>${ficha}</dl>
${e.tags.length ? `<p><small>${e.tags.map((t) => '#' + esc(t)).join(' ')}</small></p>` : ''}
${e.observacoes ? `<h2>Observações</h2><p class="obs">${esc(e.observacoes)}</p>` : ''}
${fluidez}
${formula}
${blocosTestes.length ? `<h2>Testes</h2><div class="grade">${blocosTestes.join('')}</div>` : ''}
${pecas ? `<h2>Peças com este esmalte</h2><div class="grade">${pecas}</div>` : ''}
<p><small>Exportado do Mar de Lama em ${new Date().toLocaleDateString('pt-BR')}.</small></p>
</body></html>`

  const nome = `${e.nome.replace(/[\\/:*?"<>|]+/g, ' ').trim()} - esmalte.html`
  const arquivo = new File([html], nome, { type: 'text/html' })
  // no celular, abre o menu de compartilhar (salvar em Arquivos, enviar, etc.); no computador, baixa
  if (navigator.canShare?.({ files: [arquivo] }) && matchMedia('(pointer: coarse)').matches) {
    try { await navigator.share({ files: [arquivo], title: e.nome }); return } catch (x) { if ((x as Error).name === 'AbortError') return }
  }
  baixar(arquivo, nome)
}
