import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Search } from 'lucide-react'
import { db } from '../../db/schema'
import { CATS_GLOSSARIO, GLOSSARIO, comLinks, termoPorId, termosNoTexto, type CatGlossario } from '../../lib/glossario'
import { secaoPorSlug } from '../../lib/biblioteca'
import { normaliza } from '../../lib/filtros'
import { vivos } from '../../lib/artistas'
import { HeroSecao } from './SecaoBiblioteca'

/** Glossário: termos cerâmicos com links para os artistas em que aparecem. */
export default function Glossario() {
  const s = secaoPorSlug('glossario')!
  const { hash } = useLocation()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<CatGlossario>()
  const artistas = useLiveQuery(async () => vivos(await db.artistas.orderBy('nome').toArray()), [], [])
  // em que artistas cada termo aparece (bio, linguagem, processos e listas técnicas)
  const aparece = useMemo(() => {
    const m = new Map<string, { id: string; nome: string }[]>()
    artistas.forEach((a) => termosNoTexto([a.bio, a.linguagem, a.especialidade, ...a.caracteristicas, ...a.processos.map((p) => p.texto), ...a.esmaltes, ...a.queimas, ...a.tecnicas, ...a.materiais, ...a.tiposObra].join(' '))
      .forEach((t) => m.set(t.id, [...(m.get(t.id) ?? []), { id: a.id, nome: a.nome }])))
    return m
  }, [artistas])
  const lista = useMemo(() => {
    const n = normaliza(q.trim())
    return GLOSSARIO.filter((t) => (!cat || t.cat === cat) && (!n || normaliza([t.termo, t.original, t.def, ...(t.chaves ?? [])].join(' ')).includes(n)))
  }, [q, cat])
  const alvo = hash.slice(1)

  useEffect(() => {
    if (!alvo) return
    const el = document.getElementById(alvo)
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60)
  }, [alvo])

  return (
    <div className="page bib" style={{ maxWidth: 900 }}>
      <HeroSecao s={s} />
      <div className="search bib-busca" style={{ marginTop: 18 }}>
        <Search size={17} />
        <input className="input" placeholder="Buscar termo (barbotina, biscoito, shino…)" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="chips" style={{ margin: '12px 0 4px' }}>
        <button className={'chip' + (!cat ? ' on' : '')} onClick={() => setCat(undefined)}>Todos</button>
        {CATS_GLOSSARIO.map((c) => <button key={c} className={'chip' + (cat === c ? ' on' : '')} onClick={() => setCat(cat === c ? undefined : c)}>{c}</button>)}
      </div>
      {CATS_GLOSSARIO.filter((c) => lista.some((t) => t.cat === c)).map((c) => (
        <section key={c} className="glo-cat">
          <h2>{c}</h2>
          {lista.filter((t) => t.cat === c).sort((x, y) => x.termo.localeCompare(y.termo, 'pt-BR')).map((t) => (
            <details key={t.id + (alvo === t.id ? '-alvo' : '') + (q ? '-q' : '')} id={t.id} className={'glo-termo' + (alvo === t.id ? ' alvo' : '')} open={alvo === t.id || (!!q.trim() && lista.length <= 6)}>
              <summary><h3>{t.termo}{t.original && <span className="orig">{t.original}</span>}</h3></summary>
              <div className="glo-def">
                <p>{comLinks(t.def, t.id).map((x, i) => typeof x === 'string' ? x : <Link key={i} to={`#${x.t.id}`} className="glo-link" title={x.t.termo} onClick={() => { setQ(''); setCat(undefined) }}>{x.texto}</Link>)}</p>
                {t.exemplos && <><p className="glo-ex-t">Exemplos</p><ul className="glo-ex">{t.exemplos.map((x) => <li key={x}>{x}</li>)}</ul></>}
                {(aparece.get(t.id)?.length ?? 0) > 0 && <p className="glo-mais">Aparece em: {aparece.get(t.id)!.map((a, i) => <span key={a.id}>{i ? ', ' : ''}<Link to={`/biblioteca/artistas/${a.id}`}>{a.nome}</Link></span>)}</p>}
                {t.ver && <p className="glo-mais">Ver também: {t.ver.map((v, i) => { const x = termoPorId(v); return x && <span key={v}>{i ? ', ' : ''}<Link to={`#${v}`} onClick={() => { setQ(''); setCat(undefined) }}>{x.termo}</Link></span> })}</p>}
              </div>
            </details>
          ))}
        </section>
      ))}
      {lista.length === 0 && <p className="faint" style={{ marginTop: 20 }}>Nenhum termo encontrado.</p>}
      <p className="faint" style={{ fontSize: 12.5, marginTop: 28 }}>Definições curtas e gerais, sem receitas. Sentiu falta de algum termo? Peça aqui no projeto que ele entra no glossário.</p>
    </div>
  )
}
