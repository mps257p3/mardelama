import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, TestTube } from 'lucide-react'
import { db, type Comercial, type Esmalte, type Receita, type Teste } from '../../../db/schema'
import {
  APLICACAO, ATRIBUTOS_COMPORTAMENTO, COMPAT, DEFEITOS_FICHA, GEOMETRIAS, MASSAS, ORIGENS, PREPARACAO, QUEIMA, SEGURANCA, VERIFICACAO, VISUAL,
  dadosComerciais, temTexto, texturasDe,
} from '../../../lib/esmalteFicha'
import { fmt } from '../../../lib/opcoes'
import { Foto } from '../../../ui/form'
import { GaleriaPecas } from '../../../ui/GaleriaFotos'
import { Relacoes } from '../../../ui/Relacoes'
import { SeloLouca, loucaDoTexto } from '../../../ui/Louca'
import { ArtistasAfins } from '../../bib/art/ArtistasAfins'
import { FluidezQueima } from '../FluidezQueima'
import { Grade, Grupo, Indicador, Origem, Paragrafos, Tabela, Vazio, type Linha } from './partes'

const data = (d?: string) => (d ? new Date(d + 'T12:00').toLocaleDateString('pt-BR') : '')
const quando = (t: number) => new Date(t).toLocaleDateString('pt-BR')
const linhas = (campos: [string, string][], r?: Record<string, string>): Linha[] => campos.map(([k, l]) => [l, r?.[k]])

/* ——— Perfil: que tipo de resultado este esmalte pode produzir? ——— */
export function AbaPerfil({ e }: { e: Esmalte }) {
  const [todos, setTodos] = useState(false)
  const p = e.perfil ?? {}
  const visual: Linha[] = [
    ['Cor predominante', e.cor && <>{e.corHex && <i className="fx-amostra" style={{ background: e.corHex }} />}{e.cor}</>],
    ...linhas(VISUAL, p.visual).slice(0, 2),
    ['Acabamento', e.acabamento], ['Opacidade', e.transparencia], ['Textura', texturasDe(e).join(', ')],
    ...linhas(VISUAL, p.visual).slice(2),
  ]
  const avaliados = ATRIBUTOS_COMPORTAMENTO.filter(([k]) => p.comportamento?.[k])
  const mostrar = todos ? avaliados : avaliados.slice(0, 4)
  const superficie = GEOMETRIAS.filter(([k]) => p.superficie?.[k]?.length)
  const nada = !visual.some(([, v]) => v) && !avaliados.length && !superficie.length && !p.expressivo?.length && !p.expressivoTexto && !p.sugestoesIA
  if (nada) return <Vazio>O perfil visual e de comportamento ainda não foi registrado. Toque em Editar para preencher o que você já observou ou o que o fabricante informa.</Vazio>
  return (
    <>
      <Grupo titulo="Identidade visual" origem={p.origens?.visual} vazio={!visual.some(([, v]) => v)}>
        <Tabela itens={visual} />
        {e.corHex && <p className="fx-origem">A amostra de cor é uma referência aproximada, não um valor absoluto.</p>}
      </Grupo>
      <Grupo titulo="Perfil comportamental" origem={p.origens?.comportamento} vazio={!avaliados.length}>
        <div className="fx-inds">{mostrar.map(([k, l]) => <Indicador key={k} nome={l} nivel={p.comportamento![k]} />)}</div>
        {avaliados.length > 4 && <button className="fx-link" onClick={() => setTodos(!todos)}>{todos ? 'Mostrar menos' : `Ver perfil completo (${avaliados.length})`}</button>}
      </Grupo>
      <Grupo titulo="Comportamento sobre a superfície" origem={p.origens?.superficie} vazio={!superficie.length}>
        <Tabela itens={superficie.map(([k, l]) => [l, p.superficie![k].join(', ')])} />
      </Grupo>
      <Grupo titulo="Possibilidades expressivas" origem={p.origens?.expressivo} vazio={!p.expressivo?.length && !p.expressivoTexto && !p.sugestoesIA}>
        {!!p.expressivo?.length && <p className="fx-lista">{p.expressivo.join(' · ')}</p>}
        <Paragrafos texto={p.expressivoTexto} />
        {p.sugestoesIA && <div className="fx-ia"><p className="fx-ia-t">Sugestões da IA</p><Paragrafos texto={p.sugestoesIA} /><p className="fx-origem">Ideias criativas, não características comprovadas.</p></div>}
      </Grupo>
    </>
  )
}

/* ——— Técnica: como devo utilizar este esmalte? ——— */
export function AbaTecnica({ e }: { e: Esmalte }) {
  const t = e.tecnica ?? {}
  const o = t.origens ?? {}
  const padrao = e.origem === 'comercial' ? 'Fabricante' : undefined
  const preparo: Linha[] = [...linhas(PREPARACAO, t.preparacao).slice(0, 4), ['Viscosidade da suspensão', e.viscosidade], ...linhas(PREPARACAO, t.preparacao).slice(4)]
  const aplic: Linha[] = [['Métodos', t.metodos?.join(', ')], ...linhas(APLICACAO, t.aplicacao)]
  const queima: Linha[] = [
    ['Temperatura de referência', e.temperatura ? fmt(e.temperatura, 0) + ' °C' : undefined], ['Cone pirométrico', e.cone], ['Atmosfera', e.atmosfera],
    ...linhas(QUEIMA, t.queima),
  ]
  const compat = MASSAS.filter(([k]) => t.compatibilidade?.[k])
  const naoAvaliadas = MASSAS.filter(([k]) => !t.compatibilidade?.[k]).map(([, l]) => l)
  const seg: Linha[] = SEGURANCA.filter(([k, , essencial]) => essencial || t.seguranca?.[k]).map(([k, l]) => [l, VERIFICACAO[t.seguranca?.[k] ?? 'nao-verificado']])
  return (
    <>
      <Grupo titulo="Preparação" origem={o.preparacao} padrao={padrao} vazio={!preparo.some(([, v]) => v)}><Tabela itens={preparo} /></Grupo>
      <Grupo titulo="Aplicação" origem={o.aplicacao} padrao={padrao} vazio={!aplic.some(([, v]) => v) && !e.aplicacao}>
        <Tabela itens={aplic} />
        {e.aplicacao && <p className="fx-par">{e.aplicacao}</p>}
      </Grupo>
      <section className="fx-grupo">
        <h3>Fluidez e viscosidade</h3>
        <Tabela itens={[['Viscosidade do líquido (aplicação)', e.viscosidade], ['Fluidez na queima · sua avaliação', e.fluidez]]} />
        {e.origem === 'comercial' ? <FluidezQueima e={e} embutida /> : <FluidezQueima e={e} embutida soTestes />}
      </section>
      <Grupo titulo="Queima" origem={o.queima} padrao={padrao} vazio={!queima.some(([, v]) => v)}>
        <Tabela itens={queima} />
        <p className="fx-origem">Temperatura e cone são referências distintas: o cone mede o trabalho de calor (temperatura e tempo), não só a temperatura.</p>
      </Grupo>
      <Grupo titulo="Compatibilidade" origem={o.compatibilidade} vazio={!compat.length && !t.compatNotas}>
        <Tabela itens={compat.map(([k, l]) => [l, COMPAT[t.compatibilidade![k]]])} />
        <Paragrafos texto={t.compatNotas} />
        {compat.length > 0 && naoAvaliadas.length > 0 && <p className="fx-origem">Ainda não avaliado: {naoAvaliadas.join(', ')}.</p>}
      </Grupo>
      <section className="fx-grupo">
        <h3>Segurança e uso</h3>
        <div style={{ marginBottom: 10 }}><SeloLouca origem={e.origem === 'comercial' ? 'fabricante' : 'proprio'} valor={e.louca ?? (e.origem === 'comercial' ? loucaDoTexto([e.observacoes, ...e.tags]) : undefined)}
          onChange={(v) => db.esmaltes.update(e.id, { louca: v, atualizadoEm: Date.now() })} /></div>
        <Tabela itens={seg} />
        <Paragrafos texto={t.segurancaNotas} />
        <p className="fx-origem">Atoxicidade não é segurança alimentar. A segurança de um esmalte isolado não vale automaticamente para combinações e sobreposições.</p>
        <Origem o={o.seguranca} />
      </section>
      <Grupo titulo="Defeitos e cuidados" origem={o.defeitos} vazio={!t.defeitos?.length}>
        {t.defeitos?.map((d, i) => (
          <div className="fx-defeito" key={i}>
            <p><b>{d.tipo}</b>{d.intencional && <span className="fx-nota">efeito intencional</span>}</p>
            {d.causa && <p><span className="fx-rot">Causa{d.hipotese ? ' (hipótese)' : ''}</span> {d.causa}</p>}
            {d.solucao && <p><span className="fx-rot">Solução{d.hipotese ? ' (hipótese)' : ''}</span> {d.solucao}</p>}
          </div>
        ))}
      </Grupo>
    </>
  )
}
export { DEFEITOS_FICHA }

/* ——— Experimentos: caderno visual do ateliê ——— */
export function AbaExperimentos({ e, testes }: { e: Esmalte; testes: Teste[] }) {
  const nomes = useLiveQuery(async () => new Map((await db.esmaltes.toArray()).map((x) => [x.id, x.nome])), [], new Map<string, string>())
  const combos = useLiveQuery(async () => (await db.testes.toArray()).filter((t) => !t.excluido && t.combinacao?.length && (t.esmalteId === e.id || t.combinacao.includes(e.id))), [e.id], [])
  const proprios = testes.filter((t) => !t.combinacao?.length)
  return (
    <>
      <section className="fx-grupo">
        <div className="fx-grupo-h"><h3>Amostras</h3><Link className="fx-link" to={`/testes/novo?esmalte=${e.id}`}><Plus size={14} />Novo teste</Link></div>
        {proprios.length ? <div className="fx-amostras">
          {proprios.map((t) => (
            <Link key={t.id} to={`/testes/${t.id}`} className="fx-amostra-c">
              <div className="ph">{t.fotos[0] ? <Foto id={t.fotos[0]} /> : <TestTube size={20} strokeWidth={1.2} />}</div>
              <p className="t">{t.codigo} · {t.planejado ? 'Planejado' : data(t.data)}</p>
              <p className="s">{[t.argila, t.temperatura && fmt(t.temperatura, 0) + ' °C', t.camadas && t.camadas + (t.camadas === 1 ? ' demão' : ' demãos')].filter(Boolean).join(' · ')}</p>
              {t.resultado && <p className="s r">{t.resultado}</p>}
            </Link>
          ))}
        </div> : <Vazio>Nenhum teste deste esmalte ainda.</Vazio>}
      </section>
      <Grupo titulo="Combinações e sobreposições" vazio={!combos.length}>
        {combos.map((t) => {
          const base = t.esmalteId ? nomes.get(t.esmalteId) : undefined
          return (
            <Link key={t.id} to={`/testes/${t.id}`} className="fx-combo">
              <div className="ph">{t.fotos[0] ? <Foto id={t.fotos[0]} /> : <TestTube size={18} strokeWidth={1.2} />}</div>
              <div>
                <p><span className="fx-rot">Base</span> {base ?? '—'}</p>
                <p><span className="fx-rot">Cobertura</span> {t.combinacao!.map((id) => nomes.get(id) ?? '?').join(' + ')}</p>
                <p className="s">{[t.descricaoPlano, t.temperatura && fmt(t.temperatura, 0) + ' °C', t.camadas && t.camadas + ' demãos', t.resultado].filter(Boolean).join(' · ')}</p>
              </div>
            </Link>
          )
        })}
      </Grupo>
      <GaleriaPecas titulo="Obras com este esmalte" fotos={e.pecas ?? []} onChange={(v) => db.esmaltes.update(e.id, { pecas: v, atualizadoEm: Date.now() })} />
      <section className="fx-grupo fx-pessoal">
        <h3>Observações pessoais</h3>
        {e.notasPessoais ? <Paragrafos texto={e.notasPessoais} /> : <Vazio>Sem anotações. Escreva em Editar › Observações pessoais.</Vazio>}
        <Relacoes tipo="esmalte" id={e.id} />
      </section>
    </>
  )
}

/* ——— Documentação: rastreabilidade ——— */
export function AbaDocumentacao({ e, familias, receita, estudo }: { e: Esmalte; familias: string[]; receita?: Receita; estudo?: Comercial }) {
  const com = dadosComerciais(e)
  const comercial = e.origem === 'comercial'
  const fontes = [...new Set([...(e.fluidezQueima?.fontes ?? []), ...(estudo?.fontes ?? []), ...Object.values({ ...e.perfil?.origens, ...e.tecnica?.origens }).map((o) => o?.fonte).filter((x): x is string => !!x)])]
  const ia = [
    e.fluidezQueima?.estimativaIA && ['Fluidez (estimativa)', e.fluidezQueima.estimativaIA],
    e.perfil?.sugestoesIA && ['Possibilidades expressivas (sugestões)', e.perfil.sugestoesIA],
  ].filter(Boolean) as [string, string][]
  return (
    <>
      <Grupo titulo="Identificação">
        <Tabela itens={[
          [comercial ? 'Fabricante' : 'Autoria', e.autoria], ['Linha comercial', com.linha], ['Código comercial', com.codigo], ['Código interno', e.codigo],
          ['Origem', comercial ? 'Comercial (industrial)' : 'Formulação própria'], ['Famílias', familias.join(', ')], ['Fonte da receita', e.fonteReceita],
        ]} />
      </Grupo>
      {comercial ? (
        <Grupo titulo="Composição e engenharia reversa">
          <p className="fx-par">A fórmula do fabricante é proprietária e não é presumida aqui.{estudo ? ' O estudo de engenharia reversa reúne o que a documentação diz e as hipóteses de teste, separadas.' : ''}</p>
          {estudo && <Link className="fx-link" to={`/engenharia-reversa/${estudo.id}`}>Abrir estudo de engenharia reversa</Link>}
        </Grupo>
      ) : receita && !receita.excluido ? (
        <Grupo titulo={`Receita${receita.codigo ? ' · ' + receita.codigo : ''}`} padrao={`Versão ${receita.versaoAtual}`}>
          <dl className="fx-tabela fx-receita">{receita.ingredientes.map((i, k) => <div key={k}><dt>{i.nome}{i.classe !== 'base' && <span className="fx-nota">{i.classe}</span>}</dt><dd>{fmt(i.percentual, 2)}</dd></div>)}</dl>
          <Link className="fx-link" to={`/receitas/${receita.id}`}>Abrir a fórmula</Link>
        </Grupo>
      ) : null}
      <Grupo titulo={comercial ? 'Documentação do fabricante' : 'Observações'} vazio={!e.observacoes}><Paragrafos texto={e.observacoes} /></Grupo>
      <Grupo titulo="Fontes e links" vazio={!fontes.length}>
        <ul className="fx-fontes">{fontes.map((u) => <li key={u}><a href={u} target="_blank" rel="noreferrer">{u.replace(/^https?:\/\/(www\.)?/, '')}</a></li>)}</ul>
      </Grupo>
      <Grupo titulo="Análises da IA" vazio={!ia.length}>
        <div className="fx-ia">{ia.map(([k, v]) => <p key={k} className="fx-par"><span className="fx-rot">{k}</span> {v}</p>)}<p className="fx-origem">{ORIGENS.ia}: não é informação oficial nem resultado de teste.</p></div>
      </Grupo>
      <ArtistasAfins termos={[e.acabamento, e.textura, ...e.tags, ...familias]} />
      <Grupo titulo="Histórico">
        <Tabela itens={[['Cadastrado em', quando(e.criadoEm)], ['Última alteração', quando(e.atualizadoEm)], ['Fluidez consultada em', data(e.fluidezQueima?.consultadoEm)], ['Status', e.status]]} />
        {e.tags.length > 0 && <p className="fx-origem">{e.tags.map((t) => '#' + t).join('  ')}</p>}
      </Grupo>
    </>
  )
}

export const temTecnica = (e: Esmalte) => temTexto(e.tecnica?.preparacao) || temTexto(e.tecnica?.aplicacao) || temTexto(e.tecnica?.queima)
export { Grade }
