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

/** Valor longo (frase) não cabe em meia tela: a linha vira rótulo em cima, texto na largura toda. */
const longo = (v: ReactNode) => typeof v === 'string' && v.length > 42

/** Tabela atributo/valor, sem bordas pesadas. Atributos curtos em duas colunas; textos longos na largura toda. */
export function Tabela({ itens }: { itens: Linha[] }) {
  const xs = itens.filter(([, v]) => tem(v))
  if (!xs.length) return null
  return <dl className="fx-tabela">{xs.map(([k, v, n]) => <div key={k} className={longo(v) ? 'longo' : undefined}><dt>{k}</dt><dd>{v}{n && <span className="fx-nota">{n}</span>}</dd></div>)}</dl>
}

/**
 * Converte um texto corrido em linhas estruturadas, sem perder nada: cada parágrafo "Rótulo: conteúdo"
 * vira rótulo + conteúdo; frases soltas viram itens. O texto original continua o mesmo no banco.
 */
export function estruturar(texto?: string): { rotulo?: string; itens: string[] }[] {
  if (!texto?.trim()) return []
  return texto.split(/\n{2,}|\n(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ][^:\n]{1,40}:\s)/).map((p) => p.trim()).filter(Boolean).map((p) => {
    const m = p.match(/^([^:\n]{2,40}):\s+([\s\S]+)$/)
    const corpo = m ? m[2] : p
    const itens = corpo.length > 140 ? corpo.split(/(?<=[.;])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ"(])/).map((x) => x.trim()).filter(Boolean) : [corpo]
    return { rotulo: m?.[1], itens: itens.map((x) => x.charAt(0).toUpperCase() + x.slice(1)) }
  })
}

/** Texto técnico estruturado: rótulo pequeno em cima, conteúdo na largura toda, frases longas em itens. */
export function Estruturado({ texto }: { texto?: string }) {
  const xs = estruturar(texto)
  if (!xs.length) return null
  return (
    <dl className="fx-estr">{xs.map((x, i) => (
      <div key={i}>
        {x.rotulo && <dt>{x.rotulo}</dt>}
        <dd>{x.itens.length > 1 ? <ul>{x.itens.map((t, j) => <li key={j}>{t}</li>)}</ul> : x.itens[0]}</dd>
      </div>
    ))}</dl>
  )
}

/** Bloco que abre e fecha: guarda o que é consulta secundária sem ocupar a ficha. */
export function Recolhido({ titulo, resumo, children }: { titulo: string; resumo?: string; children: ReactNode }) {
  const [aberto, setAberto] = useState(false)
  return (
    <div className={'fx-rec' + (aberto ? ' on' : '')}>
      <button className="fx-rec-b" aria-expanded={aberto} onClick={() => setAberto(!aberto)}><span>{titulo}</span>{resumo && <span className="fx-rec-r">{resumo}</span>}<i aria-hidden>{aberto ? '−' : '+'}</i></button>
      {aberto && <div className="fx-rec-c">{children}</div>}
    </div>
  )
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

/**
 * Indicador em cinco níveis: nome, classificação e cinco traços. Sem nível justificável, mostra só a descrição (sem barra).
 * `origem` diz de quem é a classificação (fabricante, você, IA).
 */
export function Indicador({ nome, nivel, nota, origem }: { nome: string; nivel?: Nivel; nota?: string; origem?: string }) {
  return (
    <div className="fx-ind">
      <div className="fx-ind-t"><span>{nome}</span>{nivel ? <b>{NIVEIS[nivel]}</b> : null}</div>
      {nivel ? <div className="fx-ind-b" role="img" aria-label={`${nome}: ${NIVEIS[nivel]}`}>{[1, 2, 3, 4, 5].map((i) => <i key={i} className={i <= nivel ? 'on' : ''} />)}</div> : null}
      {(nota || origem) && <p className="fx-ind-n">{nota}{origem && <span className="fx-ind-o">{origem}</span>}</p>}
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

/**
 * Tabela em dois níveis: atributos curtos visíveis; textos longos (explicações, cuidados) num bloco "Detalhes" recolhido.
 * Se só houver textos longos, eles aparecem direto (não faz sentido esconder tudo).
 */
export function TabelaNiveis({ itens, titulo = 'Detalhes' }: { itens: Linha[]; titulo?: string }) {
  const xs = itens.filter(([, v]) => tem(v))
  const curtos = xs.filter(([, v]) => !longo(v))
  const longos = xs.filter(([, v]) => longo(v))
  if (!curtos.length) return <Tabela itens={longos} />
  return <>
    <Tabela itens={curtos} />
    {longos.length > 0 && <Recolhido titulo={titulo} resumo={longos.map(([k]) => k).join(', ').toLowerCase()}><Tabela itens={longos} /></Recolhido>}
  </>
}

/** Propriedade expansível: nome e classificação objetiva; por baixo, explicação, fonte e condições de validade. */
export function Propriedade({ nome, classe, fonte, condicoes, children }: { nome: string; classe?: ReactNode; fonte?: string; condicoes?: string; children?: ReactNode }) {
  const [aberto, setAberto] = useState(false)
  const temMais = !!(children || fonte || condicoes)
  return (
    <div className={'fx-prop' + (aberto ? ' on' : '')}>
      <button className="fx-prop-b" aria-expanded={aberto} disabled={!temMais} onClick={() => setAberto(!aberto)}>
        <span className="n">{nome}</span><span className="c">{classe}</span>{temMais && <i aria-hidden>{aberto ? '−' : '+'}</i>}
      </button>
      {aberto && <div className="fx-prop-c">
        {children}
        {condicoes && <p className="fx-prop-l"><span>Condições</span>{condicoes}</p>}
        {fonte && <p className="fx-prop-l"><span>Fonte</span>{fonte}</p>}
      </div>}
    </div>
  )
}
