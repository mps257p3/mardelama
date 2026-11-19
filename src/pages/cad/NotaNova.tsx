import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { novaNota } from './NotaEditor'

export default function NotaNova() {
  const nav = useNavigate(); const feito = useRef(false)
  useEffect(() => { if (!feito.current) { feito.current = true; novaNota().then((id) => nav(`/caderno/${id}`, { replace: true })) } }, [nav])
  return null
}
