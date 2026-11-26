import { Voltar } from '../ui/Voltar'

import { useLiveQuery } from 'dexie-react-hooks'

import { atividadeRecente } from '../lib/atividade'
import { LinhaItem } from '../ui/itens'

export default function Atividade() {
  const itens = useLiveQuery(() => atividadeRecente(200), [])
  const dia = (t: number) => new Date(t).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  return (
    <div className="page" style={{ maxWidth: 760 }}>
      <Voltar to="/">Início</Voltar>
      <h1 className="titulo-pagina">Atividade recente</h1>
      <div style={{ marginTop: 16 }}>
        {itens?.map((r, i) => {
          const d = dia(r.quando); const novoDia = i === 0 || d !== dia(itens[i - 1].quando)
          return (
            <div key={r.tipo + r.id}>
              {novoDia && <p className="rotulo-ajuste" style={{ marginTop: 20 }}>{d}</p>}
              <LinhaItem to={r.to} tipo={r.tipo} titulo={r.titulo} sub={r.rotulo + (r.sub ? ' · ' + r.sub : '')} foto={r.foto} />
            </div>
          )
        })}
        {itens && !itens.length && <p className="muted">Nada registrado ainda.</p>}
      </div>
    </div>
  )
}
