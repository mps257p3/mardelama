import { useEffect, type ReactNode } from 'react'
import { aplicarLayout, useLayout } from '../lib/layout'

/** Cabeçalho padrão das páginas principais: título em serifa e ícones à direita (medidas em Ajustes › Layout). */
export function CabecalhoPagina({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="pag-head">
      <h1 className="pag-titulo">{titulo}</h1>
      {children && <div className="icones">{children}</div>}
    </div>
  )
}

/** Aplica no app inteiro as medidas de layout salvas (sincronizadas entre aparelhos). */
export function AplicarLayout() {
  const l = useLayout()
  useEffect(() => { aplicarLayout(l) }, [l.titulo, l.capa, l.tituloCapa, l.capaConteudo, l.cardsH, l.cardsV, l.secao]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}
