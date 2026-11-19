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
