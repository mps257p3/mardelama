import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronRight, Plus, TestTube } from 'lucide-react'
import { db, type Comercial, type Esmalte, type Receita, type Teste, type Verificacao } from '../../../db/schema'
import {
  APLICACAO, ATRIBUTOS_COMPORTAMENTO, COMPAT, DEFEITOS_FICHA, GEOMETRIAS, MASSAS, ORIGENS, PREPARACAO, QUEIMA, SEGURANCA, VERIFICACAO, VISUAL,
  dadosComerciais, temTexto, texturasDe,
} from '../../../lib/esmalteFicha'
import { fmt } from '../../../lib/opcoes'
import { Foto } from '../../../ui/form'
import { GaleriaPecas } from '../../../ui/GaleriaFotos'
import { Relacoes } from '../../../ui/Relacoes'
import { ArtistasAfins } from '../../bib/art/ArtistasAfins'
import { FluidezQueima } from '../FluidezQueima'
import { Estruturado, Grade, Grupo, Indicador, Origem, Paragrafos, Recolhido, Tabela, Vazio, type Linha } from './partes'

const data = (d?: string) => (d ? new Date(d + 'T12:00').toLocaleDateString('pt-BR') : '')
const quando = (t: number) => new Date(t).toLocaleDateString('pt-BR')
const linhas = (campos: [string, string][], r?: Record<string, string>): Linha[] => campos.map(([k, l]) => [l, r?.[k]])

/** Atalho compacto numa linha (substitui os cartões grandes). */
const Atalho = ({ to, titulo, nota }: { to: string; titulo: string; nota?: string }) => (
  <Link className="fx-atalho" to={to}><span><b>{titulo}</b>{nota && <span className="fx-nota">{nota}</span>}</span><ChevronRight size={16} strokeWidth={1.5} /></Link>
)

/* ——— Perfil: que tipo de resultado este esmalte pode produzir? ——— */
export function AbaPerfil({ e }: { e: Esmalte }) {
  const [todos, setTodos] = useState(false)
  const p = e.perfil ?? {}
  const visual: Linha[] = [
    ['Cor predominante', e.cor && <>{e.corHex && <i className="fx-amostra" style={{ background: e.corHex }} />}{e.cor}</>],
    ...linhas(VISUAL, p.visual).slice(0, 2),
    ['Textura', texturasDe(e).join(', ')],
    ...linhas(VISUAL, p.visual).slice(2),
  ]
  const avaliados = ATRIBUTOS_COMPORTAMENTO.filter(([k]) => p.comportamento?.[k])
  const mostrar = todos ? avaliados : avaliados.slice(0, 4)
  const superficie = GEOMETRIAS.filter(([k]) => p.superficie?.[k]?.length)
  const nada = !visual.some(([, v]) => v) && !avaliados.length && !superficie.length && !p.expressivo?.length && !p.expressivoTexto && !p.sugestoesIA
  return (
    <>
      {nada && <Vazio>O perfil visual e de comportamento ainda não foi registrado. Toque em ⋯ › Editar para preencher o que você já observou ou o que o fabricante informa.</Vazio>}
      <Grupo titulo="Características visuais" origem={p.origens?.visual} vazio={!visual.some(([, v]) => v)}>
        <Tabela itens={visual} />
        {e.corHex && <p className="fx-origem">A amostra de cor é uma referência aproximada, não um valor absoluto.</p>}
      </Grupo>
      <Grupo titulo="Comportamento" origem={p.origens?.comportamento} vazio={!avaliados.length}>
        <div className="fx-inds">{mostrar.map(([k, l]) => <Indicador key={k} nome={l} nivel={p.comportamento![k]} />)}</div>
        {avaliados.length > 4 && <button className="fx-link" onClick={() => setTodos(!todos)}>{todos ? 'Mostrar menos' : `Ver perfil completo (${avaliados.length})`}</button>}
      </Grupo>
      <Fluidez e={e} />
      <Grupo titulo="Interação com a superfície" origem={p.origens?.superficie} vazio={!superficie.length}>
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

/** Fluidez na queima dentro do perfil: uma linha por origem; o fabricante completo e os testes abrem embaixo. */
function Fluidez({ e }: { e: Esmalte }) {
  const f = e.fluidezQueima
  const comercial = e.origem === 'comercial'
  const testes = e.testesFluidez ?? []
  const fab = !comercial ? undefined
    : !f ? 'Ainda não consultado'
    : f.situacao === 'nao-informada' ? 'Não informada pelo fabricante'
    : f.resultados.map((r) => [r.classificacao, r.traducao && `(${r.traducao})`, r.cone && 'cone ' + r.cone.replace(/^cone\s*/i, '')].filter(Boolean).join(' ')).filter(Boolean).join('; ') || 'Descrição do fabricante'
  const ultimo = [...testes].sort((a, b) => b.data.localeCompare(a.data))[0]
  return (
    <section className="fx-grupo">
      <h3>Fluidez na queima</h3>
      <Tabela itens={[
        ['Fabricante', fab, f?.situacao === 'oficial' ? 'classificação oficial' : f?.situacao === 'descritiva' ? 'descrição, sem escala formal' : undefined],
        ['Sua avaliação', e.fluidez],
        ['Seus testes', testes.length ? `${testes.length} ${testes.length === 1 ? 'teste' : 'testes'}${ultimo?.escorrimentoMm != null ? ` · último: ${fmt(ultimo.escorrimentoMm, 0)} mm` : ''}` : comercial ? 'Nenhum' : undefined],
        ['Estimativa por IA', f?.estimativaIA, 'interpretação, não é dado do fabricante'],
      ]} />
      <Recolhido titulo={comercial ? 'Fabricante e testes de fluidez' : 'Testes de fluidez'} resumo={comercial ? 'consultar, fontes, registrar teste' : 'registrar teste'}>
        <FluidezQueima e={e} embutida soTestes={!comercial} />
      </Recolhido>
      <p className="fx-origem">Fluidez é como o esmalte fundido se move na queima; viscosidade é a consistência do líquido antes de aplicar (em Técnica).</p>
    </section>
  )
}

/* ——— Técnica: como devo utilizar este esmalte? ——— */
export function AbaTecnica({ e }: { e: Esmalte }) {
  const t = e.tecnica ?? {}
  const o = t.origens ?? {}
  const padrao = e.origem === 'comercial' ? 'Fabricante' : undefined
  const preparo: Linha[] = [...linhas(PREPARACAO, t.preparacao).slice(0, 4), ['Viscosidade da suspensão', e.viscosidade], ...linhas(PREPARACAO, t.preparacao).slice(4)]
  const aplic: Linha[] = [['Métodos', t.metodos?.join(', ')], ...linhas(APLICACAO, t.aplicacao)]
  const temAplic = aplic.some(([, v]) => v)
  const queima = linhas(QUEIMA, t.queima)
  const compat = MASSAS.filter(([k]) => t.compatibilidade?.[k])
  const naoAvaliadas = MASSAS.filter(([k]) => !t.compatibilidade?.[k]).map(([, l]) => l)
  return (
    <>
      <Grupo titulo="Preparação" origem={o.preparacao} padrao={padrao} vazio={!preparo.some(([, v]) => v)}><Tabela itens={preparo} /></Grupo>
      <Grupo titulo="Aplicação" origem={o.aplicacao} padrao={padrao} vazio={!temAplic && !e.aplicacao}>
        <Tabela itens={aplic} />
        {e.aplicacao && (temAplic ? <Recolhido titulo="Texto original da aplicação"><Estruturado texto={e.aplicacao} /></Recolhido> : <Estruturado texto={e.aplicacao} />)}
      </Grupo>
      <Grupo titulo="Queima" origem={o.queima} padrao={padrao} vazio={!queima.some(([, v]) => v)}>
        <Tabela itens={queima} />
        <p className="fx-origem">Temperatura, cone e atmosfera de referência estão no resumo do topo. O cone mede o trabalho de calor (temperatura e tempo), não só a temperatura.</p>
      </Grupo>
      <Grupo titulo="Compatibilidade" origem={o.compatibilidade} vazio={!compat.length && !t.compatNotas}>
        <Tabela itens={compat.map(([k, l]) => [l, COMPAT[t.compatibilidade![k]]])} />
        <Paragrafos texto={t.compatNotas} />
        {compat.length > 0 && naoAvaliadas.length > 0 && <p className="fx-origem">Ainda não avaliado: {naoAvaliadas.join(', ')}.</p>}
      </Grupo>
      <Seguranca e={e} />
      <Grupo titulo="Cuidados" origem={o.defeitos} vazio={!t.defeitos?.length}>
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

/**
 * Segurança separada em três perguntas: é atóxico? o fabricante declara segurança alimentar? pode ter contato direto com alimento?
 * Ressalva escrita transforma o "sim" em "sim, com ressalvas". Nada vira "pode ir à louça" genérico.
 */
function Seguranca({ e }: { e: Esmalte }) {
  const t = e.tecnica ?? {}
  const s = t.seguranca ?? {}
  const rot = (v?: Verificacao) => VERIFICACAO[v ?? 'nao-verificado']
  const declarada: Verificacao | undefined = s.alimentarDeclarada ?? (e.louca === 'sim' ? 'sim' : e.louca === 'nao' ? 'nao' : undefined)
  const contato: Verificacao | undefined = s.contatoAlimento ?? (e.louca === 'nao' ? 'nao' : undefined)
  const ressalva = declarada === 'sim' && !!t.segurancaNotas?.trim()
  const outros = SEGURANCA.filter(([k, , essencial]) => !essencial && k !== 'contatoAlimento' && s[k])
  return (
    <section className="fx-grupo">
      <h3>Segurança</h3>
      <Tabela itens={[
        ['Atoxicidade', s.atoxico ? (s.atoxico === 'sim' ? 'Atóxico, sem chumbo declarado' : rot(s.atoxico)) : 'Não verificado'],
        ['Segurança alimentar declarada', declarada === 'sim' ? (ressalva ? 'Sim, com ressalvas' : 'Sim') : rot(declarada), e.origem === 'comercial' ? 'pelo fabricante' : undefined],
        ['Contato direto com alimentos', rot(contato), contato ? undefined : 'nenhum ensaio registrado'],
        ['Ensaio laboratorial', rot(s.ensaio)],
        ...outros.map(([k, l]): Linha => [l, rot(s[k])]),
      ]} />
      {t.segurancaNotas && <div className="fx-ressalva"><p className="fx-rot">Ressalvas</p><Estruturado texto={t.segurancaNotas} /></div>}
      <p className="fx-origem">Atóxico não quer dizer próprio para alimentos. A segurança de um esmalte isolado não vale automaticamente para combinações e sobreposições.</p>
      <Origem o={t.origens?.seguranca} />
    </section>
  )
}
export { DEFEITOS_FICHA }

/* ——— Experimentos: caderno visual do ateliê ——— */
export function AbaExperimentos({ e, testes }: { e: Esmalte; testes: Teste[] }) {
  const nomes = useLiveQuery(async () => new Map((await db.esmaltes.toArray()).map((x) => [x.id, x.nome])), [], new Map<string, string>())
  const combos = useLiveQuery(async () => (await db.testes.toArray()).filter((t) => !t.excluido && t.combinacao?.length && (t.esmalteId === e.id || t.combinacao.includes(e.id))), [e.id], [])
  const proprios = testes.filter((t) => !t.combinacao?.length)
  const flu = e.testesFluidez ?? []
  return (
    <>
      <section className="fx-grupo">
        <div className="fx-grupo-h"><h3>Testes próprios</h3><Link className="fx-link" to={`/testes/novo?esmalte=${e.id}`}><Plus size={14} />Novo teste</Link></div>
        {proprios.length ? <div className="fx-lista-t">
          {proprios.map((t) => (
            <Link key={t.id} to={`/testes/${t.id}`} className="fx-linha-t">
              <div className="ph">{t.fotos[0] ? <Foto id={t.fotos[0]} /> : <TestTube size={18} strokeWidth={1.2} />}</div>
              <div>
                <p className="t">{t.codigo} · {t.planejado ? 'Planejado' : data(t.data)}</p>
                <p className="s">{[t.argila, t.temperatura && fmt(t.temperatura, 0) + ' °C', t.camadas && t.camadas + (t.camadas === 1 ? ' demão' : ' demãos')].filter(Boolean).join(' · ')}</p>
                {t.resultado && <p className="s r">{t.resultado}</p>}
              </div>
            </Link>
          ))}
        </div> : <p className="fx-vazio-l">Nenhum teste deste esmalte ainda.</p>}
        {flu.length > 0 && <p className="fx-origem">{flu.length} {flu.length === 1 ? 'teste de fluidez registrado' : 'testes de fluidez registrados'}: veja em Perfil › Fluidez na queima.</p>}
      </section>
      <Grupo titulo="Combinações e sobreposições" vazio={!combos.length}>
        {combos.map((t) => {
          const base = t.esmalteId ? nomes.get(t.esmalteId) : undefined
          return (
            <Link key={t.id} to={`/testes/${t.id}`} className="fx-linha-t">
              <div className="ph">{t.fotos[0] ? <Foto id={t.fotos[0]} /> : <TestTube size={18} strokeWidth={1.2} />}</div>
              <div>
                <p className="t">{base ?? '—'} + {t.combinacao!.map((id) => nomes.get(id) ?? '?').join(' + ')}</p>
                <p className="s">{[t.descricaoPlano, t.temperatura && fmt(t.temperatura, 0) + ' °C', t.camadas && t.camadas + ' demãos', t.resultado].filter(Boolean).join(' · ')}</p>
              </div>
            </Link>
          )
        })}
      </Grupo>
      <section className="fx-grupo fx-pessoal">
        <h3>Observações pessoais</h3>
        {e.notasPessoais ? <Paragrafos texto={e.notasPessoais} /> : <p className="fx-vazio-l">Sem anotações. Escreva em ⋯ › Editar › Experimentos.</p>}
        <Relacoes tipo="esmalte" id={e.id} />
      </section>
      <GaleriaPecas titulo="Obras relacionadas" fotos={e.pecas ?? []} onChange={(v) => db.esmaltes.update(e.id, { pecas: v, atualizadoEm: Date.now() })} />
    </>
  )
}

/* ——— Documentação: rastreabilidade ——— */
export function AbaDocumentacao({ e, familias, receita, estudo, aprovada }: { e: Esmalte; familias: string[]; receita?: Receita; estudo?: Comercial; aprovada?: Receita }) {
  const com = dadosComerciais(e)
  const comercial = e.origem === 'comercial'
  const fontes = [...new Set([...(e.fluidezQueima?.fontes ?? []), ...(estudo?.fontes ?? []), ...Object.values({ ...e.perfil?.origens, ...e.tecnica?.origens }).map((o) => o?.fonte).filter((x): x is string => !!x)])]
  const ia = [
    e.fluidezQueima?.estimativaIA && ['Fluidez (estimativa)', e.fluidezQueima.estimativaIA],
    e.perfil?.sugestoesIA && ['Possibilidades expressivas (sugestões)', e.perfil.sugestoesIA],
  ].filter(Boolean) as [string, string][]
  return (
    <>
      <Grupo titulo={comercial ? 'Identificação comercial' : 'Identificação'}>
        <Tabela itens={[
          ['Linha', com.linha], ['Código interno', e.codigo], ['Origem', comercial ? 'Comercial (industrial)' : 'Formulação própria'],
          ['Fonte da receita', e.fonteReceita], ['Status', e.status],
        ]} />
      </Grupo>
      {comercial ? (
        <Grupo titulo="Engenharia reversa">
          <p className="fx-par">A fórmula do fabricante é proprietária e não é presumida aqui.</p>
          {aprovada && !aprovada.excluido && <Atalho to={`/receitas/${aprovada.id}`} titulo="Receita aprovada" nota={aprovada.nome} />}
          {estudo ? <Atalho to={`/engenharia-reversa/${estudo.id}`} titulo="Estudo de engenharia reversa" nota="documentação e hipóteses de teste, separadas" />
            : <p className="fx-origem">Sem estudo ainda. Crie em ⋯ › Criar engenharia reversa.</p>}
        </Grupo>
      ) : receita && !receita.excluido ? (
        <Grupo titulo={`Receita${receita.codigo ? ' · ' + receita.codigo : ''}`} padrao={`Versão ${receita.versaoAtual}`}>
          <dl className="fx-tabela fx-receita">{receita.ingredientes.map((i, k) => <div key={k}><dt>{i.nome}{i.classe !== 'base' && <span className="fx-nota">{i.classe}</span>}</dt><dd>{fmt(i.percentual, 2)}</dd></div>)}</dl>
          <Atalho to={`/receitas/${receita.id}`} titulo="Abrir a fórmula" />
        </Grupo>
      ) : null}
      <Grupo titulo={comercial ? 'Documentação do fabricante' : 'Observações'} vazio={!e.observacoes}><Estruturado texto={e.observacoes} /></Grupo>
      <Grupo titulo="Fontes" vazio={!fontes.length}>
        <ul className="fx-fontes">{fontes.map((u) => <li key={u}><a href={u} target="_blank" rel="noreferrer">{u.replace(/^https?:\/\/(www\.)?/, '')}</a></li>)}</ul>
      </Grupo>
      <Grupo titulo="Análises da IA" vazio={!ia.length}>
        <div className="fx-ia">{ia.map(([k, v]) => <p key={k} className="fx-par"><span className="fx-rot">{k}</span> {v}</p>)}<p className="fx-origem">{ORIGENS.ia}: não é informação oficial nem resultado de teste.</p></div>
      </Grupo>
      <ArtistasAfins termos={[e.acabamento, e.textura, ...e.tags, ...familias]} />
      <Grupo titulo="Histórico">
        <Tabela itens={[['Incluído em', quando(e.criadoEm)], ['Última alteração', quando(e.atualizadoEm)], ['Fluidez consultada em', data(e.fluidezQueima?.consultadoEm)]]} />
      </Grupo>
      {e.tags.length > 0 && <section className="fx-grupo"><h3>Tags</h3><p className="fx-tags">{e.tags.map((t) => <span key={t}>{t}</span>)}</p></section>}
    </>
  )
}

export const temTecnica = (e: Esmalte) => temTexto(e.tecnica?.preparacao) || temTexto(e.tecnica?.aplicacao) || temTexto(e.tecnica?.queima)
export { Grade }
