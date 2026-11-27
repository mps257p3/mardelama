/**
 * Depois de uma publicação, uma janela aberta com a versão antiga pode pedir arquivos que já não existem
 * (a tela fica em branco). Aqui o app busca a versão nova do service worker e recarrega.
 * Os dados ficam no aparelho (IndexedDB) e não são tocados.
 */
const espera = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function recarregarComVersaoNova(limparCache = false) {
  try {
    const reg = await navigator.serviceWorker?.getRegistration()
    if (reg) {
      await Promise.race([reg.update().catch(() => undefined), espera(5000)])
      reg.waiting?.postMessage({ type: 'SKIP_WAITING' })
      if (limparCache) {
        // último recurso: apaga só os arquivos do app guardados pelo navegador e reinstala na próxima abertura
        for (const k of await caches.keys()) if (k.startsWith('workbox-precache')) await caches.delete(k)
        await reg.unregister()
      }
      await espera(600)
    }
  } catch { /* segue para o recarregamento */ }
  location.reload()
}

/** Marca de tempo do último recarregamento automático: evita laço, mas permite tentar de novo depois de 30 s. */
const CHAVE = 'recarregou-versao'
export function podeRecarregarSozinho() {
  try {
    const t = Number(sessionStorage.getItem(CHAVE) || 0)
    if (Date.now() - t < 30000) return false
    sessionStorage.setItem(CHAVE, String(Date.now()))
    return true
  } catch { return false }
}

/**
 * Botão do rodapé: confere agora se há versão nova publicada.
 * Se houver, instala e recarrega (devolve 'nova'); senão devolve 'atual'. Sem internet: 'offline'.
 */
export async function buscarVersaoNova(): Promise<'nova' | 'atual' | 'offline'> {
  if (!navigator.onLine) return 'offline'
  const reg = await navigator.serviceWorker?.getRegistration()
  if (!reg) return 'atual'
  try { await reg.update() } catch { return 'offline' }
  const sw = reg.installing ?? reg.waiting
  if (!sw) return 'atual'
  // espera a versão nova terminar de instalar (até 20 s) e recarrega com ela
  await new Promise<void>((ok) => {
    if (sw.state === 'installed' || sw.state === 'activated') return ok()
    const t = setTimeout(ok, 20000)
    sw.addEventListener('statechange', () => { if (sw.state === 'installed' || sw.state === 'activated') { clearTimeout(t); ok() } })
  })
  reg.waiting?.postMessage({ type: 'SKIP_WAITING' })
  await espera(600)
  location.reload()
  return 'nova'
}
