import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { criarReceita } from './Receitas'

export default function ReceitaNova() {
  const nav = useNavigate()
  const feito = useRef(false)
  useEffect(() => { if (feito.current) return; feito.current = true; criarReceita().then((id) => nav(`/receitas/${id}`, { replace: true })) }, [nav])
  return null
}
