import { useEffect, useLayoutEffect, useRef } from 'react'

/**
 * Botão voltar do celular fecha o que está aberto por cima (visor de fotos, painel)
 * em vez de sair da tela. Cada aberto ganha uma entrada no histórico com a mesma URL;
 * o voltar consome essa entrada e fecha. Fechando pelo X, a entrada é desfeita.
 */
const ativos = new Set<string>()
type Estado = { aberto?: string } | null

export function useFecharComVoltar(onClose: () => void) {
  const fechar = useRef(onClose)
  useLayoutEffect(() => { fechar.current = onClose })
  useEffect(() => {
    const marca = Math.random().toString(36).slice(2)
    ativos.add(marca)
    // adiado: no modo de desenvolvimento o React monta, desmonta e monta de novo na hora
    let empilhou = false
    const t = window.setTimeout(() => { window.history.pushState({ ...(window.history.state as object | null), aberto: marca }, ''); empilhou = true }, 0)
    let consumida = false
    const pop = () => {
      if ((window.history.state as Estado)?.aberto === marca) return
      if (!ativos.has(marca)) return
      consumida = true
      fechar.current()
    }
    window.addEventListener('popstate', pop)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('popstate', pop)
      ativos.delete(marca)
      // espera um instante: se a ação que fechou também abriu outra tela, não desfaz essa navegação
      if (empilhou && !consumida) window.setTimeout(() => { if ((window.history.state as Estado)?.aberto === marca) window.history.back() }, 30)
    }
  }, [])
}

/**
 * Entrada de algo que já fechou (ex.: abriu outra tela de dentro do visor e voltou):
 * pula sozinha, para o voltar não "falhar" uma vez.
 */
export function pularEntradasOrfas() {
  const f = () => {
    const a = (window.history.state as Estado)?.aberto
    if (a && !ativos.has(a)) window.history.back()
  }
  window.addEventListener('popstate', f)
  return () => window.removeEventListener('popstate', f)
}
