import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/**
 * Voltar devolve a tela na mesma altura em que estava.
 * Guarda a rolagem de cada entrada do histórico (pela chave da navegação) e, ao voltar,
 * rola de novo até lá esperando a lista carregar. Abrir uma tela nova começa do topo, e o Início sempre volta ao topo.
 */
const CHAVE = 'rolagem-telas'
function ler(): Record<string, number> {
  try { return JSON.parse(sessionStorage.getItem(CHAVE) || '{}') } catch { return {} }
}
function gravar(m: Record<string, number>) {
  try { sessionStorage.setItem(CHAVE, JSON.stringify(m)) } catch { /* sem armazenamento: só não lembra */ }
}

export function useMemoriaRolagem() {
  const loc = useLocation()
  const tipo = useNavigationType()
  const chave = useRef(loc.key)
  chave.current = loc.key // já na renderização: rolagens da tela nova não sobrescrevem a anterior
  const posicoes = useRef<Record<string, number>>(ler())

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    let t = 0
    const salvar = () => {
      window.clearTimeout(t)
      t = window.setTimeout(() => { posicoes.current[chave.current] = window.scrollY; gravar(posicoes.current) }, 120)
    }
    window.addEventListener('scroll', salvar, { passive: true })
    return () => { window.removeEventListener('scroll', salvar); window.clearTimeout(t) }
  }, [])

  useEffect(() => {
    if (tipo === 'PUSH') { if (!loc.hash) window.scrollTo(0, 0); return }
    if (tipo !== 'POP') return
    if (loc.pathname === '/') { window.scrollTo(0, 0); return } // o Início sempre volta ao topo
    const alvo = posicoes.current[loc.key]
    if (!alvo) return
    // a lista vem do banco aos poucos: tenta até a página ter altura, por até 3 s ou até a pessoa mexer
    let parar = false
    const desistir = () => { parar = true }
    window.addEventListener('touchstart', desistir, { passive: true, once: true })
    window.addEventListener('wheel', desistir, { passive: true, once: true })
    const inicio = Date.now()
    const tentar = () => {
      if (parar) return
      window.scrollTo(0, alvo)
      if (Math.abs(window.scrollY - alvo) < 2 || Date.now() - inicio > 3000) return
      window.setTimeout(tentar, 60)
    }
    tentar()
    return () => { parar = true; window.removeEventListener('touchstart', desistir); window.removeEventListener('wheel', desistir) }
  }, [loc.key]) // eslint-disable-line react-hooks/exhaustive-deps
}

/** useState que volta com o mesmo valor quando a pessoa retorna a esta tela pelo voltar (busca, filtros). */
export function useEstadoDaTela<T>(nome: string, inicial: T): [T, Dispatch<SetStateAction<T>>] {
  const { key } = useLocation()
  const id = `tela:${nome}:${key}`
  const [v, setV] = useState<T>(() => {
    try { const s = sessionStorage.getItem(id); return s ? JSON.parse(s) as T : inicial } catch { return inicial }
  })
  useEffect(() => { try { sessionStorage.setItem(id, JSON.stringify(v)) } catch { /* ignora */ } }, [id, v])
  return [v, setV]
}
