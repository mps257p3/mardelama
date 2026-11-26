import { useState } from 'react'
import { ExternalLink, Sparkles } from 'lucide-react'
import { definirAjuste, useAjuste } from '../db/settings'
import { CHAVE_AUTO, CHAVE_GASTOS, dolar, NOME_ACAO, resumir, type GastoIA } from '../lib/gastoIA'

const PERIODOS = [{ id: 7, nome: '7 dias' }, { id: 30, nome: '30 dias' }, { id: 0, nome: 'Tudo' }] as const

/** Quanto a IA gastou neste aparelho, por atividade, e o interruptor das tarefas automáticas. */
export function AjustesGastoIA() {
  const xs = useAjuste<GastoIA[]>(CHAVE_GASTOS, [])
  const auto = useAjuste<boolean>(CHAVE_AUTO, false)
  const [dias, setDias] = useState<number>(30)
  const desde = dias ? Date.now() - dias * 86400000 : 0
  const { total, linhas } = resumir(xs, desde)
  const ultimos = [...xs].reverse().slice(0, 12)
  return (
    <section id="gasto-ia" style={{ marginTop: 32, scrollMarginTop: 16 }}>
      <h3>Gasto da IA</h3>
      <p className="muted" style={{ marginTop: 6 }}>Estimativa de cada uso da IA feito neste aparelho, pela tabela de preços da Anthropic. O valor cobrado de verdade fica no Console.</p>
      <div className="card" style={{ padding: 20, marginTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div><div style={{ fontFamily: 'var(--serif, serif)', fontSize: 30 }}>{dolar(total)}</div><div className="faint" style={{ fontSize: 12.5 }}>{linhas.reduce((n, l) => n + l.vezes, 0)} usos{dias ? ` nos últimos ${dias} dias` : ''}</div></div>
          <div className="seg">{PERIODOS.map((p) => <button key={p.id} className={dias === p.id ? 'on' : ''} onClick={() => setDias(p.id)}>{p.nome}</button>)}</div>
        </div>
        {linhas.length ? <div className="lista">
          {linhas.map((l) => <div key={l.acao} className="row" style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <div><div className="t">{l.nome}</div><div className="s faint" style={{ fontSize: 12.5 }}>{l.vezes} {l.vezes === 1 ? 'vez' : 'vezes'}{l.buscas ? ` · ${l.buscas} buscas na web` : ''}</div></div>
            <div style={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{dolar(l.custo)}</div>
          </div>)}
        </div> : <p className="faint" style={{ fontSize: 13 }}>Nenhum uso registrado ainda. O registro começa a contar a partir desta versão.</p>}
        {ultimos.length > 0 && <details>
          <summary className="faint" style={{ fontSize: 13, cursor: 'pointer' }}>Últimos usos</summary>
          <div className="lista" style={{ marginTop: 8 }}>
            {ultimos.map((x, i) => <div key={i} className="row" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13 }}>
              <span>{new Date(x.quando).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} · {NOME_ACAO[x.acao] ?? x.acao}{x.erro ? ' (deu erro)' : ''}</span>
              <span style={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{dolar(x.custo)}</span>
            </div>)}
          </div>
        </details>}
        <a className="btn sm ghost" style={{ alignSelf: 'flex-start' }} href="https://console.anthropic.com/usage" target="_blank" rel="noreferrer"><ExternalLink size={14} />Ver o gasto real no Console</a>
      </div>

      <p className="rotulo-ajuste" style={{ marginTop: 20 }}><Sparkles size={14} style={{ verticalAlign: -2 }} /> IA em segundo plano no Descobrir</p>
      <div className="seg" style={{ alignSelf: 'flex-start' }}>
        <button className={!auto ? 'on' : ''} onClick={() => definirAjuste(CHAVE_AUTO, false)}>Só pelos botões</button>
        <button className={auto ? 'on' : ''} onClick={() => definirAjuste(CHAVE_AUTO, true)}>Automática</button>
      </div>
      <p className="faint" style={{ fontSize: 13, marginTop: 8 }}>{auto
        ? 'Ao abrir o Descobrir, a IA relê o seu gosto, as suas pastas e os artistas na mesma linha, sem você tocar em nada.'
        : 'Nada roda sozinho. Para renovar as leituras, use os botões em Descobrir › Ajustar.'}</p>
    </section>
  )
}
