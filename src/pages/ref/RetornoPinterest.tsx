import { Voltar } from '../../ui/Voltar'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { concluirConexao } from '../../lib/pinterestConta'

/** Volta da autorização no Pinterest: troca o código pela conexão (no servidor) e segue para a escolha dos painéis. */
export default function RetornoPinterest() {
  const [q] = useSearchParams()
  const nav = useNavigate()
  const [erro, setErro] = useState<string>()
  const feito = useRef(false)
  useEffect(() => {
    if (feito.current) return
    feito.current = true
    const code = q.get('code'), state = q.get('state')
    if (q.get('error') || !code || !state) { setErro(q.get('error') === 'access_denied' ? 'Você não autorizou o acesso no Pinterest. Nada foi conectado.' : 'O Pinterest não devolveu a autorização. Tente conectar de novo.'); return }
    concluirConexao(code, state).then(() => nav('/referencias/pinterest?conectado=1', { replace: true })).catch((e) => setErro((e as Error).message))
  }, [q, nav])
  return (
    <div className="page" style={{ maxWidth: 720 }}>
      <Voltar to="/referencias/pinterest">Pinterest</Voltar>
      <h1 style={{ marginTop: 6 }}>Conectando o Pinterest</h1>
      <p className="faint" style={{ marginTop: 8 }}>{erro ?? 'Só um instante…'}</p>
      {erro && <Link className="btn" style={{ marginTop: 16 }} to="/referencias/pinterest">Voltar</Link>}
    </div>
  )
}
