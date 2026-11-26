import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

/** Há uma tela anterior dentro do app? (o React Router guarda a posição no histórico em `idx`) */
export const temTelaAnterior = () => ((window.history.state as { idx?: number } | null)?.idx ?? 0) > 0

/**
 * Link "voltar" do topo das telas: fecha esta tela e volta para onde você estava
 * (como o botão voltar do celular). Só quando a tela foi aberta direto (link, atalho)
 * vai para `to`, a tela "mãe".
 */
export function Voltar({ to, children }: { to: string; children: ReactNode }) {
  const nav = useNavigate()
  const anterior = temTelaAnterior()
  return (
    <Link to={to} className="back" onClick={(e) => { if (!anterior) return; e.preventDefault(); nav(-1) }}>
      <ArrowLeft size={15} />{anterior ? 'Voltar' : children}
    </Link>
  )
}
