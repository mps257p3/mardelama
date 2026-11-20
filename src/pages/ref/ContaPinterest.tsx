import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Lock, RefreshCw } from 'lucide-react'
import { useGrupos } from '../../db/hooks'
import { useToast } from '../../ui/toast'
import { chavePasta } from '../../lib/pinterest'
import {
  desconectar, escolherPaineis, estadoPinterest, iniciarConexao, listarPaineis, pinterestConfigurado, salvarConfig, sincronizarPinterest,
  type EstadoPinterest, type ErroPinterest, type PainelPinterest, type ResultadoPinterest,
} from '../../lib/pinterestConta'

const quando = (t?: number) => t ? new Date(t).toLocaleString('pt-BR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'nunca'
const resumo = (r: ResultadoPinterest) => r.novos || r.atualizados
  ? `${r.novos} pins novos${r.atualizados ? `, ${r.atualizados} atualizados` : ''}${r.analisados ? `, ${r.analisados} lidos pela IA` : ''}`
  : 'nada novo'

/** Conexão direta com a conta do Pinterest (API oficial). Fica no topo de Referências › Pinterest. */
export function ContaPinterest() {
  const toast = useToast()
  const grupos = useGrupos()
  const [cfgServidor, setCfgServidor] = useState<boolean>()
  const [e, setE] = useState<EstadoPinterest>()
  const [erro, setErro] = useState<{ msg: string; codigo?: string }>()
  const [ocupado, setOcupado] = useState<string>()
  const [paineis, setPaineis] = useState<PainelPinterest[]>()
  const [escolha, setEscolha] = useState<Record<string, string>>({}) // painel → grupo id | 'novo'

  async function carregar() {
    setErro(undefined)
    try { setE(await estadoPinterest()) } catch (x) { setErro({ msg: (x as Error).message, codigo: (x as ErroPinterest).codigo }) }
  }
  useEffect(() => { pinterestConfigurado().then((ok) => { setCfgServidor(ok); if (ok) carregar() }) }, [])

  async function fazer(rotulo: string, f: () => Promise<unknown>) {
    setOcupado(rotulo)
    try { await f() } catch (x) { toast((x as Error).message); if ((x as ErroPinterest).codigo === 'DESCONECTADO') carregar() } finally { setOcupado(undefined) }
  }

  async function abrirEscolha() {
    await fazer('Lendo seus painéis…', async () => {
      const { paineis: ps } = await listarPaineis()
      const atuais = new Map((e?.config.paineis ?? []).map((p) => [p.id, p.grupoId]))
      const inicial: Record<string, string> = {}
      for (const p of ps) {
        if (atuais.has(p.id)) { inicial[p.id] = atuais.get(p.id)!; continue }
        if (!atuais.size) { const igual = grupos?.find((g) => chavePasta(g.nome) === chavePasta(p.nome)); inicial[p.id] = igual?.id ?? 'novo' }
      }
      setEscolha(inicial); setPaineis(ps)
    })
  }
  async function guardarEscolha() {
    if (!paineis) return
    await fazer('Guardando…', async () => {
      const config = await escolherPaineis(paineis.filter((p) => escolha[p.id]).map((p) => ({ painel: p, grupo: escolha[p.id] })))
      setE((x) => x && { ...x, config }); setPaineis(undefined)
      toast('Painéis guardados. Sincronizando…')
      const r = await sincronizarPinterest((t) => setOcupado(t))
      toast('Pinterest: ' + resumo(r)); await carregar()
    })
  }

  if (cfgServidor === undefined) return null
  if (!cfgServidor) return (
    <section className="pin-conta">
      <h3>Conta do Pinterest</h3>
      <p className="faint">A conexão direta ainda não está ativa: falta cadastrar o app do Pinterest no servidor (variáveis <b>PINTEREST_APP_ID</b> e <b>PINTEREST_APP_SECRET</b> na Vercel). Enquanto isso, use a importação da exportação abaixo.</p>
    </section>
  )

  const sel = e?.config.paineis ?? []
  return (
    <section className="pin-conta">
      <h3>Conta do Pinterest</h3>
      {erro && <p className="faint">{erro.msg}{erro.codigo === 'SEM_LOGIN' || /login/i.test(erro.msg) ? <> <Link to="/ajustes">Ir para Ajustes</Link></> : null}</p>}
      {e && !e.conectado && <>
        <p className="faint">Conecte uma vez e o app passa a buscar sozinho os pins novos dos painéis que você escolher. Pins que você já importou pela exportação são reconhecidos e não duplicam.</p>
        <button className="btn primary" disabled={!!ocupado} onClick={() => fazer('Abrindo o Pinterest…', iniciarConexao)}>{ocupado ?? 'Conectar Pinterest'}</button>
      </>}
      {e?.conectado && <>
        <div className="pin-conta-linha">
          {e.conta?.foto && <img src={e.conta.foto} alt="" referrerPolicy="no-referrer" />}
          <div><b>{e.conta?.usuario ? '@' + e.conta.usuario : 'Conta conectada'}</b>
            <span className="faint"> · última sincronização: {quando(e.config.ultimo)}{e.config.ultimoResultado ? ` (${resumo(e.config.ultimoResultado)})` : ''}</span></div>
        </div>
        {e.config.ultimoResultado?.erro && <p className="faint">Última tentativa parou: {e.config.ultimoResultado.erro}</p>}
        <div className="pin-acoes">
          <button className="btn primary" disabled={!!ocupado || !sel.length} onClick={() => fazer('Sincronizando…', async () => { const r = await sincronizarPinterest((t) => setOcupado(t)); toast('Pinterest: ' + resumo(r)); await carregar() })}><RefreshCw size={15} />{ocupado ?? 'Sincronizar agora'}</button>
          <button className="btn ghost" disabled={!!ocupado} onClick={abrirEscolha}>{sel.length ? 'Escolher painéis' : 'Escolher painéis para acompanhar'}</button>
        </div>
        {sel.length > 0 && !paineis && <p className="faint" style={{ fontSize: 13 }}>Acompanhando {sel.length} {sel.length === 1 ? 'painel' : 'painéis'}: {sel.map((p) => p.nome).join(', ')}. O app confere novidades a cada 6 horas quando está aberto.</p>}

        {paineis && <div className="pin-paineis">
          <p className="faint" style={{ fontSize: 13 }}>Marque os painéis e escolha para qual grupo cada um vai. “Novo grupo” cria um grupo com o nome do painel (ou usa o que já tem esse nome).</p>
          {paineis.map((p) => (
            <div key={p.id} className={'pin-painel' + (escolha[p.id] ? ' on' : '')}>
              <input type="checkbox" checked={!!escolha[p.id]} onChange={() => setEscolha((x) => { const n = { ...x }; if (n[p.id]) delete n[p.id]; else n[p.id] = grupos?.find((g) => chavePasta(g.nome) === chavePasta(p.nome))?.id ?? 'novo'; return n })} />
              <div className="capa-p">{p.capa && <img src={p.capa} alt="" loading="lazy" referrerPolicy="no-referrer" />}</div>
              <div className="info-p"><b>{p.nome}</b>{p.privacidade === 'SECRET' && <Lock size={12} />}<span className="faint">{p.pins != null ? `${p.pins} pins` : ''}</span></div>
              {escolha[p.id] && <select className="input" value={escolha[p.id]} onChange={(ev) => setEscolha((x) => ({ ...x, [p.id]: ev.target.value }))}>
                <option value="novo">Novo grupo</option>
                {(grupos ?? []).map((g) => <option key={g.id} value={g.id}>{g.nome}</option>)}
              </select>}
            </div>
          ))}
          <div className="pin-acoes">
            <button className="btn primary" disabled={!!ocupado} onClick={guardarEscolha}>{ocupado ?? `Acompanhar ${Object.keys(escolha).length} painéis`}</button>
            <button className="btn ghost" onClick={() => setEscolha(Object.fromEntries(paineis.map((p) => [p.id, escolha[p.id] ?? grupos?.find((g) => chavePasta(g.nome) === chavePasta(p.nome))?.id ?? 'novo'])))}>Marcar todos</button>
            <button className="btn ghost" onClick={() => setPaineis(undefined)}>Cancelar</button>
          </div>
        </div>}

        <label className="sug-campo"><input type="checkbox" checked={!!e.config.iaImagens} disabled={!!ocupado} onChange={() => fazer('…', async () => { const config = await salvarConfig({ iaImagens: !e.config.iaImagens }); setE({ ...e, config }) })} />
          <div>Deixar a IA ler as imagens dos pins novos (até 8 por sincronização). Ela acrescenta tags e cores, que alimentam o repertório estético e o Descobrir. Usa crédito da Anthropic.</div></label>
        <button className="btn sm ghost" style={{ marginTop: 10 }} disabled={!!ocupado} onClick={() => { if (confirm('Desconectar o Pinterest? As referências já importadas continuam no Acervo.')) fazer('Desconectando…', async () => { await desconectar(); await carregar() }) }}>Desconectar</button>
      </>}
    </section>
  )
}
