import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useFamilias, useEsmaltes, useReceitas, useTestes } from '../../db/hooks'
import Esmaltes from './Esmaltes'
import Receitas from './Receitas'
import Testes from './Testes'

type Aba = 'esmaltes' | 'receitas' | 'testes'

/** Esmaltes, fórmulas e testes numa só área, filtrados pela mesma família. */
export default function Superficies({ aba }: { aba: Aba }) {
  const [sp, setSp] = useSearchParams()
  const fam = sp.get('fam') ?? ''
  const familias = useFamilias()
  const esmaltes = useEsmaltes()
  const receitas = useReceitas()
  const testes = useTestes()
  const famEsm = useMemo(() => new Map((esmaltes ?? []).map((e) => [e.id, e.familias])), [esmaltes])
  const famRec = useMemo(() => new Map((receitas ?? []).map((r) => [r.id, r.familias ?? []])), [receitas])
  const n = {
    esmaltes: (esmaltes ?? []).filter((e) => !fam || e.familias.includes(fam)).length,
    receitas: (receitas ?? []).filter((r) => !fam || (r.familias ?? []).includes(fam)).length,
    testes: (testes ?? []).filter((t) => !fam || testeDaFamilia(t, fam, famEsm, famRec)).length,
  }
  const q = fam ? `?fam=${fam}` : ''
  const ABAS: [Aba, string][] = [['esmaltes', 'Esmaltes'], ['receitas', 'Fórmulas'], ['testes', 'Testes']]
  return (
    <div className="page">
      <div className="head" style={{ marginBottom: 12 }}>
        <div><p className="eyebrow">Laboratório</p><h1 style={{ marginTop: 8 }}>Superfícies</h1></div>
      </div>
      <div className="chips sup-familias">
        <button className={'chip' + (!fam ? ' on' : '')} onClick={() => setSp({}, { replace: true })}>Todas as famílias</button>
        {familias.map((f) => <button key={f.id} className={'chip' + (fam === f.id ? ' on' : '')}
          onClick={() => setSp(fam === f.id ? {} : { fam: f.id }, { replace: true })}>{f.codigo ? f.codigo + ' · ' : ''}{f.nome}</button>)}
        <Link to={fam ? `/familias/${fam}` : '/familias'} className="chip ghost-link">Sobre {fam ? 'esta família' : 'as famílias'} →</Link>
      </div>
      <nav className="sup-abas">
        {ABAS.map(([k, l]) => <Link key={k} to={`/${k}${q}`} replace className={aba === k ? 'on' : ''}>{l}<span>{n[k]}</span></Link>)}
      </nav>
      {aba === 'esmaltes' && <Esmaltes embutido familia={fam} />}
      {aba === 'receitas' && <Receitas embutido familia={fam} />}
      {aba === 'testes' && <Testes embutido familia={fam} />}
    </div>
  )
}

export function testeDaFamilia(t: { esmalteId?: string; receitaId?: string }, fam: string, famEsm: Map<string, string[]>, famRec: Map<string, string[]>) {
  return !!((t.esmalteId && famEsm.get(t.esmalteId)?.includes(fam)) || (t.receitaId && famRec.get(t.receitaId)?.includes(fam)))
}
