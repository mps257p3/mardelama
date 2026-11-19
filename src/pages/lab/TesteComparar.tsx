import { Link, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, TestTube } from 'lucide-react'
import { db } from '../../db/schema'
import { useEsmaltes } from '../../db/hooks'
import { fmt } from '../../lib/opcoes'
import { Estrelas, Foto } from '../../ui/form'

export default function TesteComparar() {
  const [sp] = useSearchParams()
  const ids = (sp.get('ids') ?? '').split(',').filter(Boolean)
  const testes = useLiveQuery(async () => (await db.testes.bulkGet(ids)).filter(Boolean), [sp.get('ids')])
  const esmaltes = useEsmaltes()
  const linhas: [string, (t: NonNullable<NonNullable<typeof testes>[number]>) => React.ReactNode][] = [
    ['Esmalte', (t) => esmaltes?.find((e) => e.id === t.esmalteId)?.nome],
    ['Plano', (t) => t.descricaoPlano], ['Receita', (t) => t.receitaVersao ? 'v' + t.receitaVersao : undefined],
    ['Argila', (t) => t.argila], ['Temperatura', (t) => t.temperatura ? fmt(t.temperatura, 0) + ' °C' : undefined], ['Cone', (t) => t.cone],
    ['Camadas', (t) => t.camadas], ['Aplicação', (t) => t.aplicacao], ['Densidade', (t) => t.densidade],
    ['Defeitos', (t) => t.defeitos?.join(', ')], ['Resultado', (t) => t.resultado],
    ['Avaliação', (t) => t.avaliacao ? <Estrelas value={t.avaliacao} tamanho={14} /> : undefined],
  ]
  return (
    <div className="page">
      <Link to="/testes" className="back"><ArrowLeft size={15} />Testes</Link>
      <h1>Comparar testes</h1>
      <div className="comparar" style={{ marginTop: 28 }}>
        {(testes ?? []).map((t) => t && (
          <div key={t.id}>
            <Link to={`/testes/${t.id}`} className="capa" style={{ aspectRatio: '1', display: 'grid' }}>{t.fotos[0] ? <Foto id={t.fotos[0]} /> : <TestTube size={36} strokeWidth={1} />}</Link>
            <h3 className="codigo" style={{ marginTop: 14, fontSize: 15 }}>{t.codigo}</h3>
            <dl className="ficha" style={{ gridTemplateColumns: '1fr', marginTop: 8 }}>
              {linhas.map(([k, f]) => <div key={k}><dt>{k}</dt><dd>{f(t) ?? '—'}</dd></div>)}
            </dl>
          </div>
        ))}
      </div>
    </div>
  )
}
