import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../../db/schema'
import { vivos } from '../../../lib/artistas'
import { normaliza } from '../../../lib/filtros'
import { ImgObra } from './ImgObra'
import { obraDeCapa } from './Artistas'

const GENERICOS = new Set(['esmalte', 'esmaltes', 'argila', 'branco', 'preto', 'outro', 'outros', 'teste', 'fosco', 'brilhante'])

/**
 * Artistas do Acervo cujo estudo menciona os mesmos termos (acabamento, textura, família, material).
 * É uma sugestão automática por texto; a ligação firme continua sendo feita em Conexões, nos dois lados.
 */
export function ArtistasAfins({ termos, titulo = 'Artistas com acabamentos ou técnicas parecidos' }: { termos: (string | undefined)[]; titulo?: string }) {
  const chaves = [...new Set(termos.filter(Boolean).map((t) => normaliza(t!.trim())).filter((t) => t.length > 3 && !GENERICOS.has(t)))]
  const achados = useLiveQuery(async () => {
    if (!chaves.length) return []
    const artistas = vivos(await db.artistas.toArray())
    const obras = vivos(await db.obras.toArray())
    return artistas.map((a) => {
      const texto = normaliza([...a.esmaltes, ...a.tecnicas, ...a.materiais, ...a.queimas, ...a.esteticas, ...a.processos.map((p) => p.texto), a.analise?.texturas, a.analise?.materiais].filter(Boolean).join(' · '))
      const casou = chaves.filter((c) => new RegExp(`(^|[^a-z0-9])${c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(texto))
      return { a, casou, capa: obraDeCapa(a, obras) }
    }).filter((x) => x.casou.length).sort((x, y) => y.casou.length - x.casou.length).slice(0, 8)
  }, [chaves.join('|')], [])
  if (!achados.length) return null
  return (
    <section style={{ marginTop: 28 }}>
      <p className="eyebrow" style={{ marginBottom: 10 }}>{titulo}</p>
      <div className="trilho sug">
        {achados.map(({ a, casou, capa }) => (
          <Link key={a.id} to={`/biblioteca/artistas/${a.id}`} className="peca-mini">
            <span className="ph"><ImgObra o={capa} /></span>
            <span className="t">{a.nome}</span>
            <span className="s">em comum: {casou.slice(0, 2).join(', ')}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
