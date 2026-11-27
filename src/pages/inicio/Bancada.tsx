import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowUpRight } from 'lucide-react'
import { useArquivoUrl } from '../../db/files'
import { itensDaBancada, type ItemBancada } from '../../lib/bancada'

function Miniatura({ x }: { x: ItemBancada }) {
  const url = useArquivoUrl(x.foto)
  const src = url ?? x.imagemExterna
  return <span className="banc-img">{src && <img src={src} alt="" loading="lazy" />}</span>
}

/** Sobre a bancada: até três registros recentes do ateliê. Some quando não há nada recente. */
export function SecBancada() {
  const itens = useLiveQuery(() => itensDaBancada(3), [])
  if (!itens?.length) return null
  return (
    <section className="secao bancada">
      <div className="secao-head"><h2>Sobre a bancada</h2></div>
      <ul className="banc-lista">
        {itens.map((x) => (
          <li key={x.chave}>
            <Link to={x.to} className="banc-item">
              <Miniatura x={x} />
              <span className="banc-txt">
                <span className="banc-cat">{x.categoria}</span>
                <span className="banc-tit">{x.titulo}</span>
                {x.contexto && <span className="banc-ctx">{x.contexto}</span>}
              </span>
              <ArrowUpRight size={16} strokeWidth={1.4} aria-hidden className="banc-seta" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
