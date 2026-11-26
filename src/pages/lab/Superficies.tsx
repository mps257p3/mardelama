import { Voltar } from '../../ui/Voltar'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Camera, FlaskConical, Images, Info, Lightbulb, Plus, ScanText, ScrollText, Sparkles, TestTube } from 'lucide-react'
import { Sheet } from '../../ui/Sheet'
import { catalogarEsmalte } from '../../lib/comercial'
import { useToast } from '../../ui/toast'
import { Menu } from '../../ui/Menu'
import { useFamilias, useEsmaltes, useReceitas, useTestes } from '../../db/hooks'
import Esmaltes from './Esmaltes'
import Receitas, { criarReceita } from './Receitas'
import Testes from './Testes'
import Ideias, { useIdeias } from './Ideias'
import { novaIdeia } from '../../lib/ideias'

type Aba = 'esmaltes' | 'receitas' | 'testes' | 'ideias'

/** Esmaltes, fórmulas e testes numa só área, filtrados pela mesma família. */
export default function Superficies({ aba, entrada }: { aba: Aba; entrada?: boolean }) {
  const [sp, setSp] = useSearchParams()
  const nav = useNavigate()
  const fam = sp.get('fam') ?? ''
  const familias = useFamilias()
  const esmaltes = useEsmaltes()
  const receitas = useReceitas()
  const testes = useTestes()
  const ideias = useIdeias()
  const toast = useToast()
  const foto = useRef<HTMLInputElement>(null)
  const camera = useRef<HTMLInputElement>(null)
  const [escolher, setEscolher] = useState(false)
  const [catalogando, setCatalogando] = useState(false)
  async function catalogar(files: FileList | null) {
    if (!files?.length) return
    setEscolher(false)
    setCatalogando(true)
    try { const id = await catalogarEsmalte([...files], fam ? [fam] : []); toast('Esmalte catalogado. Confira as informações.'); nav(`/esmaltes/${id}`) }
    catch (e) { toast((e as Error).message) }
    finally { setCatalogando(false) }
  }
  const famEsm = useMemo(() => new Map((esmaltes ?? []).map((e) => [e.id, e.familias])), [esmaltes])
  const famRec = useMemo(() => new Map((receitas ?? []).map((r) => [r.id, r.familias ?? []])), [receitas])
  const n = {
    esmaltes: (esmaltes ?? []).filter((e) => !fam || e.familias.includes(fam)).length,
    receitas: (receitas ?? []).filter((r) => !fam || (r.familias ?? []).includes(fam)).length,
    testes: (testes ?? []).filter((t) => !fam || testeDaFamilia(t, fam, famEsm, famRec)).length,
    ideias: (ideias ?? []).filter((i) => !fam || i.familias.includes(fam)).length,
  }
  const q = fam ? `?fam=${fam}` : ''
  // ao entrar pela área, abre na primeira aba que tem algo (não numa lista vazia)
  const carregou = esmaltes !== undefined && receitas !== undefined && testes !== undefined
  useEffect(() => {
    if (!entrada || !carregou || n.esmaltes) return
    if (n.receitas) nav(`/receitas${q}`, { replace: true })
    else if (n.testes) nav(`/testes${q}`, { replace: true })
  }, [entrada, carregou, n.esmaltes, n.receitas, n.testes, nav, q])
  const ABAS: [Aba, string][] = [['esmaltes', 'Esmaltes'], ['receitas', 'Fórmulas'], ['testes', 'Testes'], ['ideias', 'Ideias']]
  return (
    <div className="page">
      <Voltar to="/laboratorio">Esmaltaria</Voltar>
      <div className="topo-c">
        <h1>Esmaltaria</h1>
        <div className="icones">
          <Link className="iconbtn" to={fam ? `/familias/${fam}` : '/familias'} aria-label="Sobre as famílias" title="Sobre as famílias"><Info size={19} /></Link>
          <Menu rotulo="Adicionar" botao={<span className="iconbtn mais"><Plus size={19} /></span>} itens={[
            { l: 'Catalogar esmalte por foto', icon: <Camera size={16} />, onClick: () => setEscolher(true) },
            { l: 'Esmalte', icon: <FlaskConical size={16} />, to: '/esmaltes/novo' },
            { l: 'Fórmula', icon: <ScrollText size={16} />, onClick: async () => nav(`/receitas/${await criarReceita(fam ? { familias: [fam] } : {})}`) },
            { l: 'Teste', icon: <TestTube size={16} />, to: '/testes/novo' },
            { l: 'Ideia de esmaltação', icon: <Lightbulb size={16} />, onClick: async () => nav(`/ideias/${await novaIdeia(fam ? { familias: [fam] } : {})}?novo=1`) },
            { sep: true, l: '' },
            { l: 'Ler print ou site', icon: <ScanText size={16} />, to: '/compartilhar' },
          ]} />
        </div>
      </div>
      <input ref={foto} type="file" accept="image/*" multiple hidden onChange={(e) => { catalogar(e.target.files); e.target.value = '' }} />
      <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { catalogar(e.target.files); e.target.value = '' }} />
      {escolher && <Sheet label="Catalogar esmalte por foto" onClose={() => setEscolher(false)}>
        <h3>Catalogar esmalte por foto</h3>
        <p className="muted" style={{ margin: '6px 0 16px', fontSize: 14 }}>Fotografe o rótulo, o pote ou uma placa de teste. A IA identifica o esmalte e traz marca, temperatura, uso em louça e fotos do fabricante.</p>
        <div style={{ display: 'grid', gap: 10 }}>
          <button className="btn primary" onClick={() => camera.current?.click()}><Camera size={17} />Tirar foto</button>
          <button className="btn" onClick={() => foto.current?.click()}><Images size={17} />Escolher da galeria</button>
        </div>
      </Sheet>}
      {catalogando && <p className="recebido-lendo" style={{ marginBottom: 14 }}><Sparkles size={15} />Identificando o esmalte e procurando a ficha e as fotos do fabricante… fique nesta tela, leva 1 ou 2 minutos.</p>}
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
      {aba === 'ideias' && <Ideias familia={fam} />}
    </div>
  )
}

export function testeDaFamilia(t: { esmalteId?: string; receitaId?: string }, fam: string, famEsm: Map<string, string[]>, famRec: Map<string, string[]>) {
  return !!((t.esmalteId && famEsm.get(t.esmalteId)?.includes(fam)) || (t.receitaId && famRec.get(t.receitaId)?.includes(fam)))
}
