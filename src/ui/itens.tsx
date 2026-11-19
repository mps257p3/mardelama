import { Link } from 'react-router-dom'
import { ChevronRight, Plus } from 'lucide-react'
import type { Tipo } from '../db/schema'
import { ICONE_TIPO, corDoTipo } from '../lib/atividade'
import { Foto } from './form'

/** Miniatura: foto quando houver; senão, pequena representação gráfica da área (ícone na cor da área). */
export function Miniatura({ tipo, foto, cor, tam = 48 }: { tipo: Tipo; foto?: string; cor?: string; tam?: number }) {
  const I = ICONE_TIPO[tipo]
  const c = corDoTipo(tipo)
  return (
    <span className="miniatura" style={{ width: tam, height: tam, background: cor ?? undefined, color: c, ['--area' as string]: c }}>
      {foto ? <Foto id={foto} /> : !cor && I ? <I size={Math.round(tam * 0.4)} strokeWidth={1.4} /> : null}
    </span>
  )
}

export function LinhaItem({ to, tipo, titulo, sub, foto, cor }: { to: string; tipo: Tipo; titulo: string; sub?: string; foto?: string; cor?: string }) {
  return (
    <Link to={to} className="linha-item">
      <Miniatura tipo={tipo} foto={foto} cor={cor} />
      <span className="txt"><span className="t">{titulo}</span>{sub && <span className="s">{sub}</span>}</span>
      <ChevronRight size={18} strokeWidth={1.4} className="seta" />
    </Link>
  )
}

/** Linha compacta para seções vazias: uma frase curta e a ação de cadastro. */
export function LinhaVazia({ texto, acao, to }: { texto: string; acao: string; to: string }) {
  return (
    <div className="linha-vazia">
      <span>{texto}</span>
      <Link to={to}><Plus size={15} strokeWidth={1.6} />{acao}</Link>
    </div>
  )
}
