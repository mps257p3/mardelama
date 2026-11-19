import { Compass } from 'lucide-react'
import { TopoRef } from './Topo'

/** Feed de descoberta: chega na etapa 2 (acervos abertos + modelo visual no aparelho). */
export default function Descobrir() {
  return (
    <div className="page">
      <TopoRef aba="descobrir" />
      <div className="empty" style={{ marginTop: 12 }}>
        <Compass size={28} strokeWidth={1.1} style={{ color: 'var(--argila)' }} />
        <span className="serif">Em construção.</span>
        <span>Aqui vai aparecer um feed de obras de acervos abertos (The Met, Art Institute of Chicago, Wikimedia Commons, Europeana), escolhidas a partir do que você guarda no Acervo. Nada é adicionado ao seu acervo sem você salvar.</span>
      </div>
    </div>
  )
}
