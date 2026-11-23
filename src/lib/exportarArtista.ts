import { db, type Artista, type Nota, type Obra } from '../db/schema'
import { baixar } from '../db/backup'
import { ANALISE, CERTEZA, vivos } from './artistas'

/**
 * Exporta o estudo de um artista como um único arquivo HTML, que abre em qualquer navegador
 * e pode ser impresso ou salvo em PDF. As fotos guardadas no aparelho vão dentro do arquivo;
 * as imagens da web vão dentro quando o site permite, senão ficam como link.
 */

const esc = (s?: string) => (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const paraDataUrl = (b: Blob) => new Promise<string>((ok, erro) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = erro; r.readAsDataURL(b) })

async function imagemEmbutida(arquivo?: string, url?: string): Promise<string | undefined> {
  if (arquivo) { const a = await db.arquivos.get(arquivo); if (a?.blob?.size) return paraDataUrl(a.blob) }
  if (!url) return undefined
  try {
    const { viaPonte } = await import('./fontes')
    const c = new AbortController(); const t = setTimeout(() => c.abort(), 10000)
    const r = await fetch(viaPonte(url), { signal: c.signal }).finally(() => clearTimeout(t))
    const b = r.ok ? await r.blob() : undefined
    if (b && b.type.startsWith('image/')) return paraDataUrl(b)
  } catch { /* site não permite: fica o link */ }
  return url
}

const lista = (titulo: string, xs?: string[]) => xs?.length ? `<p><b>${esc(titulo)}:</b> ${xs.map(esc).join(', ')}</p>` : ''
const link = (url?: string, texto?: string) => url ? `<a href="${esc(url)}">${esc(texto || url)}</a>` : esc(texto)

export async function exportarArtista(a: Artista, aoAvancar?: (t: string) => void) {
  const obras: Obra[] = vivos(await db.obras.where('artistaId').equals(a.id).toArray()).sort((x, y) => x.criadoEm - y.criadoEm)
  const todos = vivos(await db.artistas.toArray())
  const relacionados = todos.filter((b) => b.id !== a.id && (a.relacionados.includes(b.id) || b.relacionados.includes(a.id)))
  const rs = vivos([...await db.relacoes.where('[aTipo+aId]').equals(['artista', a.id]).toArray(), ...await db.relacoes.where('[bTipo+bId]').equals(['artista', a.id]).toArray()])
  const notas = vivos((await db.notas.bulkGet(rs.map((r) => (r.aTipo === 'nota' ? r.aId : r.bTipo === 'nota' ? r.bId : '')).filter(Boolean))).filter(Boolean) as Nota[])

  const blocos: string[] = []
  let feitas = 0
  for (const o of obras) {
    aoAvancar?.(`Preparando obras: ${++feitas} de ${obras.length}`)
    const src = await imagemEmbutida(o.arquivo, o.imagem)
    const ficha = [o.ano, o.serie, o.dimensoes, o.materiais, o.tecnica, o.esmaltacao, o.queima].filter(Boolean).map(esc).join(' · ')
    blocos.push(`<figure>${src ? `<img src="${esc(src)}" alt="${esc(o.titulo)}">` : ''}<figcaption><b>${esc(o.titulo || o.serie || 'Sem título')}</b>${ficha ? `<br>${ficha}` : ''}${o.fonte || o.credito ? `<br><small>${link(o.fonte, o.credito || 'fonte')}</small>` : ''}${o.notas ? `<br><i>${esc(o.notas)}</i>` : ''}</figcaption></figure>`)
  }
  aoAvancar?.('Preparando fotos…')
  const minhas: string[] = []
  for (const id of a.fotos ?? []) { const s = await imagemEmbutida(id); if (s) minhas.push(`<figure><img src="${esc(s)}" alt=""></figure>`) }
  const retrato = a.retrato ? await imagemEmbutida(undefined, a.retrato) : undefined

  const pubs = [...a.publicacoes, ...a.fontes]
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(a.nome)} · Estudo de artista</title>
<style>
body{font:16px/1.55 Georgia,serif;color:#2b2420;background:#faf6f0;max-width:860px;margin:0 auto;padding:32px 20px}
h1{font-size:40px;margin:4px 0}h2{font-size:24px;margin:36px 0 10px;border-bottom:1px solid #d9cfc3;padding-bottom:4px}
.eyebrow{font:12px/1.3 system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#a2593b}
.obras{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:18px}
figure{margin:0;break-inside:avoid}figure img{width:100%;height:auto;border-radius:6px;display:block}
figcaption{font:13px/1.4 system-ui,sans-serif;margin-top:6px;color:#5b4f47}
blockquote{margin:16px 0;padding-left:16px;border-left:3px solid #c9a27e}blockquote .orig{color:#7a6d63;font-size:14px}
a{color:#7a3e26}small{color:#7a6d63}.retrato{max-width:260px}
@media print{body{background:#fff}h2{break-after:avoid}}
</style></head><body>
<p class="eyebrow">${esc([a.pais.join(' / '), a.especialidade].filter(Boolean).join(' · '))}</p>
<h1>${esc(a.nome)}</h1>${a.nomeOriginal ? `<p>${esc(a.nomeOriginal)}</p>` : ''}
${a.caracteristicas.length ? `<p>${a.caracteristicas.map(esc).join(' · ')}</p>` : ''}
<h2>O trabalho</h2><div class="obras">${blocos.join('') || '<p>Nenhuma obra cadastrada.</p>'}</div>
${a.series?.length ? `<p><b>Séries:</b> ${a.series.map((s) => link(s.url, s.nome + (s.original ? ` (${s.original})` : ''))).join(', ')}</p>` : ''}
${a.falas?.length ? `<h2>Nas palavras do artista</h2>${a.falas.map((f) => `<blockquote><p>“${esc(f.texto)}”</p>${f.original && f.original !== f.texto ? `<p class="orig">${esc(f.original)}</p>` : ''}${f.veiculo || f.fonte ? `<small>${link(f.fonte, f.veiculo || f.fonte)}</small>` : ''}</blockquote>`).join('')}` : ''}
<h2>Apresentação</h2>
${[['Nascimento', a.nascimento], ['Atuação', a.atuacao]].filter(([, v]) => v).map(([k, v]) => `<p><b>${k}:</b> ${esc(v)}</p>`).join('')}
${retrato ? `<figure class="retrato"><img src="${esc(retrato)}" alt="Retrato de ${esc(a.nome)}"></figure>` : ''}
${a.linguagem ? `<p><i>${esc(a.linguagem)}</i></p>` : ''}
${(a.bio ?? '').split(/\n{2,}/).filter(Boolean).map((p) => `<p>${esc(p)}</p>`).join('')}
${a.afinidade ? `<p><b>Afinidade com Ryuji Iwasaki:</b> ${esc(a.afinidade)}</p>` : ''}
${ANALISE.some(([k]) => a.analise?.[k]) ? `<h2>Linguagem artística</h2>${ANALISE.filter(([k]) => a.analise?.[k]).map(([k, l]) => `<p><b>${esc(l)}:</b> ${esc(a.analise![k])}</p>`).join('')}` : ''}
${a.processos.length ? `<h2>Técnicas e processos</h2>${a.processos.map((p) => `<p><b>${esc(p.tema)}</b> <small>(${esc(CERTEZA[p.certeza]?.rotulo ?? p.certeza)})</small>: ${esc(p.texto)}${p.fonte ? ` <small>${link(p.fonte, 'fonte')}</small>` : ''}</p>`).join('')}` : ''}
${a.materiais.length || a.esmaltes.length || a.queimas.length || a.tecnicas.length ? `<h2>Materiais e esmaltes</h2>${lista('Materiais', a.materiais)}${lista('Esmaltes e superfícies', a.esmaltes)}${lista('Queima', a.queimas)}${lista('Técnicas', a.tecnicas)}` : ''}
${a.estudar.length ? `<h2>O que estudar neste artista</h2><ol>${a.estudar.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>` : ''}
${pubs.length ? `<h2>Livros, entrevistas e publicações</h2><ul>${pubs.map((p) => `<li>${link(p.url, p.titulo)}${p.tipo ? ` <small>· ${esc(p.tipo)}</small>` : ''}${p.ano ? ` <small>· ${esc(p.ano)}</small>` : ''}</li>`).join('')}</ul>` : ''}
${a.site || a.instagram ? `<p>${a.site ? link(a.site, 'Site oficial') : ''}${a.site && a.instagram ? ' · ' : ''}${a.instagram ? link(`https://www.instagram.com/${a.instagram}/`, '@' + a.instagram) : ''}</p>` : ''}
${a.notas || a.hipoteses || a.links?.length || notas.length || minhas.length || a.tags.length ? `<h2>Anotações pessoais</h2>
${a.notas ? `<div>${a.notas}</div>` : ''}
${a.hipoteses ? `<p><b>Hipóteses de processo:</b> ${esc(a.hipoteses)}</p>` : ''}
${a.links?.length ? `<p><b>Links salvos:</b></p><ul>${a.links.map((l) => `<li>${link(l)}</li>`).join('')}</ul>` : ''}
${notas.length ? `<p><b>Experimentos no Caderno:</b></p>${notas.map((n) => `<h3>${esc(n.titulo)}</h3><div>${n.corpo ?? ''}</div>`).join('')}` : ''}
${lista('Etiquetas', a.tags)}
${minhas.length ? `<p><b>Minhas fotografias</b></p><div class="obras">${minhas.join('')}</div>` : ''}` : ''}
${relacionados.length ? `<h2>Artistas relacionados</h2><p>${relacionados.map((b) => esc(b.nome)).join(', ')}</p>` : ''}
<p><small>Exportado do Mar de Lama em ${new Date().toLocaleDateString('pt-BR')}. Imagens de terceiros para uso pessoal de estudo; direitos dos autores.</small></p>
</body></html>`

  const nome = `${a.nome.replace(/[\\/:*?"<>|]+/g, ' ').trim()} - estudo.html`
  const arquivo = new File([html], nome, { type: 'text/html' })
  // no celular, abre o menu de compartilhar (salvar em Arquivos, enviar, etc.); no computador, baixa
  if (navigator.canShare?.({ files: [arquivo] }) && matchMedia('(pointer: coarse)').matches) {
    try { await navigator.share({ files: [arquivo], title: a.nome }); return } catch (e) { if ((e as Error).name === 'AbortError') return }
  }
  baixar(arquivo, nome)
}
