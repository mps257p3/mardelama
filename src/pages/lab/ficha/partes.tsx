import { useState, type ReactNode } from 'react'
import type { FonteGrupo, Nivel } from '../../../db/schema'
import { NIVEIS, ORIGENS } from '../../../lib/esmalteFicha'

/** Peças reutilizáveis da ficha editorial do esmalte: grade técnica, tabela atributo/valor, grupo com origem e indicador. */

const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, '') } catch { return u } }
const data = (d?: string) => (d ? new Date(d + 'T12:00').toLocaleDateString('pt-BR') : '')

export type Linha = [string, ReactNode | undefined, string?]
const tem = (v: ReactNode | undefined) => v != null && v !== '' && v !== false

/** Grade compacta de duas colunas: rótulo pequeno, valor em destaque. Só o que tem valor. */
export function Grade({ itens }: { itens: Linha[] }) {
  const xs = itens.filter(([, v]) => tem(v))
  if (!xs.length) return null
  return <dl className="fx-grade">{xs.map(([k, v, n]) => <div key={k}><dt>{k}</dt><dd>{v}{n && <span className="fx-nota">{n}</span>}</dd></div>)}</dl>
}

/** Tabela atributo/valor, sem bordas pesadas. */
export function Tabela({ itens }: { itens: Linha[] }) {
  const xs = itens.filter(([, v]) => tem(v))
  if (!xs.length) return null
  return <dl className="fx-tabela">{xs.map(([k, v, n]) => <div key={k}><dt>{k}</dt><dd>{v}{n && <span className="fx-nota">{n}</span>}</dd></div>)}</dl>
}

/** Linha discreta com a origem do grupo inteiro (não uma etiqueta por linha). */
export function Origem({ o, padrao }: { o?: FonteGrupo; padrao?: string }) {
  const rotulo = o?.origem ? ORIGENS[o.origem] : padrao
  if (!rotulo && !o?.fonte) return null
  return <p className="fx-origem">{rotulo}{o?.fonte && <> · <a href={o.fonte} target="_blank" rel="noreferrer">{host(o.fonte)}</a></>}{o?.data && <> · {data(o.data)}</>}</p>
}

/** Grupo da ficha: título de seção + conteúdo. Não renderiza nada se o conteúdo estiver vazio. */
export function Grupo({ titulo, origem, padrao, children, vazio }: { titulo: string; origem?: FonteGrupo; padrao?: string; children: ReactNode; vazio?: boolean }) {
  if (vazio) return null
  return <section className="fx-grupo"><h3>{titulo}</h3>{children}<Origem o={origem} padrao={padrao} /></section>
}

/** Indicador segmentado em cinco níveis: nome, classificação textual e cinco traços. */
export function Indicador({ nome, nivel }: { nome: string; nivel: Nivel }) {
  return (
    <div className="fx-ind">
      <div className="fx-ind-t"><span>{nome}</span><b>{NIVEIS[nivel]}</b></div>
      <div className="fx-ind-b" role="img" aria-label={`${nome}: ${NIVEIS[nivel]}`}>{[1, 2, 3, 4, 5].map((i) => <i key={i} className={i <= nivel ? 'on' : ''} />)}</div>
    </div>
  )
}

/** Texto curto que se expande: até três linhas na consulta imediata. */
export function TextoCurto({ texto }: { texto: string }) {
  const [aberto, setAberto] = useState(false)
  const longo = texto.length > 180
  return (
    <div className="fx-desc">
      <p className={longo && !aberto ? 'fecha' : ''}>{texto}</p>
      {longo && <button className="fx-link" onClick={() => setAberto(!aberto)}>{aberto ? 'Mostrar menos' : 'Continuar lendo'}</button>}
    </div>
  )
}

/** Parágrafos a partir de texto com linhas em branco. */
export const Paragrafos = ({ texto }: { texto?: string }) => texto ? <>{texto.split(/\n{2,}/).filter(Boolean).map((p, i) => <p key={i} className="fx-par">{p}</p>)}</> : null

export const Vazio = ({ children }: { children: ReactNode }) => <p className="fx-vazio">{children}</p>
