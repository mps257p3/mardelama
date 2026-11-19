import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Settings2, Images } from 'lucide-react'
import { useGrupos, useReferencias } from '../../db/hooks'
import { ImgRef, temImagem } from './ImgRef'
import type { Referencia } from '../../db/schema'
import { Menu } from '../../ui/Menu'
import { TopoRef } from './Topo'

/** Grupos como coleções visuais: capa feita das próprias referências. */
export default function Colecoes() {
  const grupos = useGrupos()
  const refs = useReferencias()
  const [vazios, setVazios] = useState(false)
  const porGrupo = useMemo(() => {
    const m = new Map<string, Referencia[]>()
    for (const r of refs ?? []) { if (!temImagem(r)) continue; for (const g of r.grupos) { const a = m.get(g) ?? []; a.push(r); m.set(g, a) } }
    return m
  }, [refs])
  const conta = useMemo(() => { const m = new Map<string, number>(); (refs ?? []).forEach((r) => r.grupos.forEach((g) => m.set(g, (m.get(g) ?? 0) + 1))); return m }, [refs])
  const lista = grupos.filter((g) => vazios || conta.get(g.id)).sort((a, b) => (conta.get(b.id) ?? 0) - (conta.get(a.id) ?? 0))
  const nVazios = grupos.filter((g) => !conta.get(g.id)).length
  return (
    <div className="page">
      <TopoRef aba="grupos" icones={<Menu itens={[
        { l: 'Gerenciar grupos', icon: <Settings2 size={16} />, to: '/referencias/grupos/gerenciar' },
        ...(nVazios ? [{ l: vazios ? 'Ocultar grupos vazios' : `Mostrar grupos vazios (${nVazios})`, on: vazios, onClick: () => setVazios(!vazios) }] : []),
      ]} />} />
      {lista.length === 0 ? <div className="empty"><span className="serif">Nenhum grupo com imagens ainda.</span><span>Toque e segure imagens no Acervo para colocá-las em grupos.</span></div> : (
        <div className="colecoes">
          {lista.map((g) => {
            const capas = porGrupo.get(g.id) ?? []
            return (
              <Link key={g.id} to={`/referencias?grupo=${g.id}`} className="colecao">
                <div className={'capa-col n' + Math.min(capas.length, 3)}>
                  {capas.length ? capas.slice(0, 3).map((c) => <div key={c.id}><ImgRef r={c} /></div>) : <div className="vazia"><Images size={26} strokeWidth={1.1} /></div>}
                </div>
                <div className="t">{g.nome}</div>
                <div className="s">{conta.get(g.id) ?? 0} {conta.get(g.id) === 1 ? 'referência' : 'referências'}</div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
