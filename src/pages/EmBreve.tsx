import { Link } from 'react-router-dom'

/** Área ainda em construção: mostra com honestidade em que fase ela chega. */
export default function EmBreve({ nome, fase, texto }: { nome: string; fase: number; texto: string }) {
  return (
    <div className="page">
      <div className="soon">
        <p className="eyebrow">Em construção · fase {fase}</p>
        <h1>{nome}</h1>
        <p className="muted">{texto}</p>
        <div><Link to="/" className="link-arrow">Voltar ao início</Link></div>
      </div>
    </div>
  )
}
