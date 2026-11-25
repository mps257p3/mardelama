import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Heart, Plus, Search } from 'lucide-react'
import { db } from '../../db/schema'
import { vivos } from '../../lib/artistas'
import { normaliza, textoBusca } from '../../lib/filtros'
import { EFEITOS, novaIdeia } from '../../lib/ideias'
import { ImgRef, temImagem } from '../ref/ImgRef'

export const useIdeias = () => useLiveQuery(async () => vivos(await db.ideias.orderBy('criadoEm').reverse().toArray()))

/** Superfícies > Ideias: um mural de esmaltações que dão vontade de testar. Tocar abre a ficha. */
export default function Ideias({ familia }: { familia?: string }) {
  const ideias = useIdeias()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [efeito, setEfeito] = useState<string>()
  const testadas = useLiveQuery(async () => new Set((await db.testes.where('ideiaId').above('').toArray()).filter((t) => !t.excluido).map((t) => t.ideiaId!)), [], new Set<string>())
  const daFamilia = useMemo(() => (ideias ?? []).filter((i) => !familia || i.familias.includes(familia)), [ideias, familia])
  // só os efeitos que já aparecem nas ideias, na ordem da lista
  const usados = EFEITOS.filter((e) => daFamilia.some((i) => i.efeitos.includes(e)))
  const lista = daFamilia.filter((i) => (!efeito || i.efeitos.includes(efeito)) &&
    (!q || textoBusca(i.titulo, i.esmaltes, i.queima, i.argila, i.autor, i.notas, ...i.efeitos, ...i.tags).includes(normaliza(q))))

  if (!ideias) return null
  if (!ideias.length) return (
    <div className="mo-vazio">
      <p>Guarde aqui as esmaltações que você quer tentar: fotos suas, prints, ou imagens do Descobrir e das Referências (no botão "Ideia de esmalte"). Cada ideia tem a ficha do que se sabe dela e vira teste com um toque.</p>
      <button className="btn primary" onClick={async () => nav(`/ideias/${await novaIdeia(familia ? { familias: [familia] } : {})}?novo=1`)}><Plus size={15} />Nova ideia</button>
    </div>
  )
  return (
    <div>
      <div className="toolbar">
        <div className="search"><Search size={16} /><input className="input" placeholder="Buscar ideias (escorrido, shino, cinzas…)" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      </div>
      {usados.length > 1 && <div className="chips" style={{ margin: '0 0 14px' }}>
        <button className={'chip' + (!efeito ? ' on' : '')} onClick={() => setEfeito(undefined)}>Todos os efeitos</button>
        {usados.map((e) => <button key={e} className={'chip' + (efeito === e ? ' on' : '')} onClick={() => setEfeito(efeito === e ? undefined : e)}>{e}</button>)}
      </div>}
      {lista.length === 0 && <p className="faint">Nenhuma ideia com esse filtro.</p>}
      <div className="mural">{lista.map((i) => (
        <Link key={i.id} to={`/ideias/${i.id}`} className="ref">
          <div className="img">
            {temImagem(i) ? <ImgRef r={i} style={{ height: 'auto' }} /> : <div className="sem">{i.titulo || 'Ideia sem imagem'}</div>}
            {i.favorito ? <Heart size={16} className="fav" fill="currentColor" /> : null}
            {testadas.has(i.id) && <span className="ideia-testada">Com teste</span>}
          </div>
          {i.titulo && <div className="t">{i.titulo}</div>}
          {(i.efeitos.length > 0 || i.queima) && <div className="s">{[i.efeitos.slice(0, 3).join(', '), i.queima].filter(Boolean).join(' · ')}</div>}
        </Link>
      ))}</div>
    </div>
  )
}
