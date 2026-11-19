import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource/cormorant-garamond/400.css'
import '@fontsource/cormorant-garamond/500.css'
import '@fontsource/cormorant-garamond/400-italic.css'
import '@fontsource/dm-sans/400.css'
import '@fontsource/dm-sans/500.css'
import '@fontsource/dm-sans/600.css'
import './styles.css'
import App from './App'
import { seedIfEmpty } from './db/seed'
import { ativarVinculoAutomatico } from './lib/contexto'
import { iniciarSincronizacaoAutomatica } from './db/sync'
import { registerSW } from 'virtual:pwa-register'
import { db } from './db/schema'

// Se o banco do aparelho não abrir, mostra o motivo em vez de deixar as telas vazias.
function aviso(texto: string) {
  if (document.getElementById('aviso-banco')) return
  const d = document.createElement('div'); d.id = 'aviso-banco'; d.setAttribute('role', 'alert')
  d.style.cssText = 'position:fixed;left:12px;right:12px;top:calc(env(safe-area-inset-top) + 12px);z-index:9999;background:#1E1C19;color:#F5F0E8;padding:14px 16px;border-radius:14px;font:15px/1.45 "DM Sans",sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.2)'
  d.textContent = texto; d.onclick = () => d.remove(); document.body.appendChild(d)
}
db.on('blocked', () => aviso('O app está aberto em outra janela com uma versão antiga. Feche todas as janelas do Mar de Lama (inclusive abas do navegador) e abra de novo.'))
db.open().catch((e: Error) => aviso('Não consegui abrir os dados deste aparelho: ' + (e?.message || e) + '. Feche o app por completo e abra de novo; se continuar, mande um print.'))

// Atualização do app instalado: verifica nova versão ao abrir, ao voltar para o app e a cada 20 min,
// e recarrega sozinho quando houver (os dados ficam no aparelho e não são afetados).
const atualizar = registerSW({
  immediate: true,
  onRegisteredSW(_url, reg) {
    if (!reg) return
    const checar = () => { if (navigator.onLine) reg.update().catch(() => {}) }
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checar() })
    setInterval(checar, 20 * 60 * 1000)
  },
  onNeedRefresh() { atualizar(true) },
})

seedIfEmpty()
ativarVinculoAutomatico()
iniciarSincronizacaoAutomatica()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
