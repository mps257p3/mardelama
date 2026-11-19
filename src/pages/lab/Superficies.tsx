import { useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Info, Plus } from 'lucide-react'
import { useFamilias, useEsmaltes, useReceitas, useTestes } from '../../db/hooks'
import Esmaltes from './Esmaltes'
import Receitas, { criarReceita } from './Receitas'
import Testes from './Testes'

type Aba = 'esmaltes' | 'receitas' | 'testes'

/** Esmaltes, fórmulas e testes numa só área, filtrados pela mesma família. */
export default function Superficies({ aba }: { aba: Aba }) {
  const [sp, setSp] = useSearchParams()
  const nav = useNavigate()
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
      <div className="topo-c">
        <h1>Superfícies</h1>
        <div className="icones">
          <Link className="iconbtn" to={fam ? `/familias/${fam}` : '/familias'} aria-label="Sobre as famílias" title="Sobre as famílias"><Info size={19} /></Link>
          {aba === 'receitas'
            ? <button className="iconbtn mais" aria-label="Nova fórmula" onClick={async () => nav(`/receitas/${await criarReceita(fam ? { familias: [fam] } : {})}`)}><Plus size={19} /></button>
            : <Link className="iconbtn mais" to={aba === 'testes' ? '/testes/novo' : '/esmaltes/novo'} aria-label={aba === 'testes' ? 'Novo teste' : 'Novo esmalte'}><Plus size={19} /></Link>}
        </div>
      </div>
      <div className="chips">
        <button className={'chip' + (!fam ? ' on' : '')} onClick={() => setSp({}, { replace: true })}>Todas</button>
        {familias.map((f) => <button key={f.id} className={'chip' + (fam === f.id ? ' on' : '')}
          onClick={() => setSp(fam === f.id ? {} : { fam: f.id }, { replace: true })}>{f.codigo ? f.codigo + ' · ' : ''}{f.nome}</button>)}
      </div>
      <nav className="abas-t">
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
