import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

/** Destino do "Compartilhar" do sistema (PWA instalado): abre uma nova referência já preenchida. */
export default function Compartilhar() {
  const [sp] = useSearchParams()
  const nav = useNavigate()
  useEffect(() => { nav(`/referencias/nova?${sp.toString()}`, { replace: true }) }, [sp, nav])
  return null
}
