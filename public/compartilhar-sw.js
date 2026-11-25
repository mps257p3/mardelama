// Recebe o que é compartilhado de outros apps (fotos, links, textos) quando o app está instalado.
// O Android manda um POST para /compartilhar; guardamos tudo no cache do aparelho e abrimos a tela "Recebido".
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (event.request.method !== 'POST' || url.origin !== self.location.origin || url.pathname !== '/compartilhar') return
  event.respondWith((async () => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
    try {
      const dados = await event.request.formData()
      const cache = await caches.open('recebidos')
      const arquivos = dados.getAll('arquivos').filter((f) => f && typeof f === 'object' && f.size > 0)
      await Promise.all(arquivos.map((f, i) => cache.put(`/__recebido/${id}/${i}`, new Response(f, { headers: { 'content-type': f.type || 'application/octet-stream', 'x-nome': encodeURIComponent(f.name || 'imagem') } }))))
      const meta = { titulo: dados.get('title') || '', texto: dados.get('text') || '', url: dados.get('url') || '', n: arquivos.length }
      await cache.put(`/__recebido/${id}/meta`, new Response(JSON.stringify(meta), { headers: { 'content-type': 'application/json' } }))
      return Response.redirect(new URL(`/compartilhar?recebido=${id}`, self.location.origin).href, 303)
    } catch {
      return Response.redirect(new URL('/compartilhar?erro=1', self.location.origin).href, 303)
    }
  })())
})

// O manifesto vem sempre da rede (com o guardado só se estiver sem internet). Assim, ao instalar o app,
// o Chrome lê a versão atual, com o Compartilhar de imagens, e não uma cópia antiga.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname !== '/manifest.webmanifest') return
  event.respondWith(fetch(event.request, { cache: 'no-store' }).catch(() => caches.match(event.request, { ignoreSearch: true }).then((r) => r || Response.error())))
})
