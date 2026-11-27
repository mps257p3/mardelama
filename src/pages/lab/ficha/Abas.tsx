import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronRight, Pencil, Plus, TestTube } from 'lucide-react'
import { db, type Comercial, type Esmalte, type Receita, type Teste, type Verificacao } from '../../../db/schema'
import {
  APLICACAO, ATRIBUTOS_COMPORTAMENTO, COMPAT, DEFEITOS_FICHA, GEOMETRIAS, MASSAS, ORIGENS, PREPARACAO, QUEIMA, SEGURANCA, VERIFICACAO, VISUAL,
  QUEIMA_ANTIGA, dadosComerciais, efeitosDe, temTexto, texturasDe,
} from '../../../lib/esmalteFicha'
import { fmt } from '../../../lib/opcoes'
import { Foto } from '../../../ui/form'
import { GaleriaPecas } from '../../../ui/GaleriaFotos'
import { Relacoes } from '../../../ui/Relacoes'
import { ArtistasAfins } from '../../bib/art/ArtistasAfins'
import { FluidezQueima } from '../FluidezQueima'
import { Pictogramas } from './Pictogramas'
import { Estruturado, Grade, Grupo, Indicador, Origem, Paragrafos, Recolhido, Tabela, Vazio, type Linha } from './partes'

const data = (d?: string) => (d ? new Date(d + 'T12:00').toLocaleDateString('pt-BR') : '')
const quando = (t: number) => new Date(t).toLocaleDateString('pt-BR')
const linhas = (campos: [string, string][], r?: Record<string, string>): Linha[] => campos.map(([k, l]) => [l, r?.[k]])

/** Atalho compacto numa linha (substitui os cartões grandes). */
const Atalho = ({ to, titulo, nota }: { to: string; titulo: string; nota?: string }) => (
  <Link className="fx-atalho" to={to}><span><b>{titulo}</b>{nota && <span className="fx-nota">{nota}</span>}</span><ChevronRight size={16} strokeWidth={1.5} /></Link>
)

/* ——— Perfil: a personalidade do esmalte ——— */
const PRINCIPAIS = ['fluidez', 'reatividade', 'espessura', 'temperatura', 'variacao', 'previsibilidade']

export function AbaPerfil({ e, irPara }: { e: Esmalte; irPara: (aba: 'experimentos') => void }) {
  const [todos, setTodos] = useState(false)
  const p = e.perfil ?? {}
  const efeitos = efeitosDe(e)
  const cores: Linha[] = [
    ['Predominante', e.cor && <>{e.corHex && <i className="fx-amostra" style={{ background: e.corHex }} />}{e.cor}</>],
    ...linhas(VISUAL, p.visual),
  ]
  const acab: Linha[] = [['Acabamento', e.acabamento], ['Opacidade', e.transparencia]]
  const texturas = texturasDe(e)
  const avaliados = ATRIBUTOS_COMPORTAMENTO.filter(([k]) => p.comportamento?.[k] || p.comportamentoNota?.[k])
  const ordem = [...avaliados.filter(([k]) => PRINCIPAIS.includes(k)), ...avaliados.filter(([k]) => !PRINCIPAIS.includes(k))]
  const mostrar = todos ? ordem : ordem.slice(0, 6)
  const superficie = GEOMETRIAS.filter(([k]) => p.superficie?.[k]?.length)
  const origemDe = (k: string) => { const o = p.comportamentoOrigem?.[k] ?? p.origens?.comportamento?.origem; return o ? ROTULO_ORIGEM[o] : undefined }
  const nada = !efeitos.length && !cores.some(([, v]) => v) && !acab.some(([, v]) => v) && !texturas.length && !avaliados.length && !superficie.length && !p.expressivo?.length && !p.expressivoTexto && !p.sugestoesIA
  return (
    <>
      {nada && <Vazio>A personalidade deste esmalte ainda não foi registrada. Toque em ⋯ › Editar para preencher o que você observou ou o que o fabricante informa.</Vazio>}
      <Grupo titulo="Identidade visual" vazio={!efeitos.length && !e.corHex}>
        {e.corHex && <div className="fx-cor"><i style={{ background: e.corHex }} /><span>{e.cor ?? 'Amostra de cor'}<span className="fx-nota">referência aproximada</span></span></div>}
        <Pictogramas tipos={efeitos} />
        {efeitos.length > 0 && <p className="fx-origem">Esquemas dos comportamentos identificados, não resultados de teste.</p>}
      </Grupo>
      <Grupo titulo="Cores e subtons" origem={p.origens?.visual} vazio={!cores.some(([, v]) => v)}><Tabela itens={cores} /></Grupo>
      <Grupo titulo="Acabamento e opacidade" vazio={!acab.some(([, v]) => v)}><Tabela itens={acab} /></Grupo>
      <Grupo titulo="Textura" vazio={!texturas.length}><p className="fx-lista">{texturas.join(' · ')}</p></Grupo>
      <section className="fx-grupo">
        <h3>Perfil comportamental</h3>
        {mostrar.length > 0 && <div className="fx-inds">{mostrar.map(([k, l]) => <Indicador key={k} nome={l} nivel={p.comportamento?.[k]} nota={p.comportamentoNota?.[k]} origem={origemDe(k)} />)}</div>}
        {ordem.length > 6 && <button className="fx-link" onClick={() => setTodos(!todos)}>{todos ? 'Mostrar menos' : `Ver todos (${ordem.length})`}</button>}
        <Fluidez e={e} irPara={irPara} />
      </section>
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

const ROTULO_ORIGEM: Record<string, string> = { fabricante: 'Fabricante', referencia: 'Referência', receita: 'Receita', experimento: 'Seu teste', pessoal: 'Sua avaliação', ia: 'IA' }

/** Fluidez no perfil: o termo original do fabricante, a sua avaliação e a IA, separados. Detalhes e testes ficam a um toque. */
function Fluidez({ e, irPara }: { e: Esmalte; irPara: (aba: 'experimentos') => void }) {
  const f = e.fluidezQueima
  const comercial = e.origem === 'comercial'
  const testes = e.testesFluidez ?? []
  const fab = !comercial ? undefined
    : !f ? 'Ainda não consultado'
    : f.situacao === 'nao-informada' ? 'Não informada'
    : f.resultados.map((r) => [r.classificacao, r.traducao && `(${r.traducao})`, r.cone && 'cone ' + r.cone.replace(/^cone\s*/i, '')].filter(Boolean).join(' ')).filter(Boolean).join('; ') || 'Só descrição'
  return (
    <div className="fx-flu">
      <p className="fx-sub">Fluidez na queima</p>
      <Tabela itens={[
        ['Fabricante', fab, f?.situacao === 'oficial' ? 'classificação original' : undefined],
        ['Sua avaliação', e.fluidez],
        ['IA', f?.estimativaIA, 'interpretação, não é dado do fabricante'],
      ]} />
      <div className="fx-acoes-l">
        {comercial && <Recolhido titulo="Detalhes do fabricante"><FluidezQueima e={e} embutida soFabricante /></Recolhido>}
        <button className="fx-atalho" onClick={() => irPara('experimentos')}><span><b>Seus testes de fluidez</b><span className="fx-nota">{testes.length ? `${testes.length} registrado${testes.length > 1 ? 's' : ''}` : 'nenhum ainda'}, em Experimentos</span></span><ChevronRight size={16} strokeWidth={1.5} /></button>
      </div>
    </div>
  )
}

/* ——— Técnica: como devo utilizar este esmalte? ——— */
export function AbaTecnica({ e }: { e: Esmalte }) {
  const t = e.tecnica ?? {}
  const o = t.origens ?? {}
  const padrao = e.origem === 'comercial' ? 'Fabricante' : undefined
  const preparo: Linha[] = [...linhas(PREPARACAO, t.preparacao).slice(0, 4), ['Viscosidade', e.viscosidade, 'do esmalte líquido, antes de aplicar'], ...linhas(PREPARACAO, t.preparacao).slice(4)]
  const aplic: Linha[] = [['Métodos', t.metodos?.join(', ')], ...linhas(APLICACAO, t.aplicacao)]
  const temAplic = aplic.some(([, v]) => v)
  const queima = [...linhas(QUEIMA, t.queima).slice(0, -1), ...linhas(QUEIMA_ANTIGA, t.queima)]
  const compat = MASSAS.filter(([k]) => t.compatibilidade?.[k])
  const naoAvaliadas = MASSAS.filter(([k]) => !t.compatibilidade?.[k]).map(([, l]) => l)
  return (
    <>
      <Grupo titulo="Preparação" origem={o.preparacao} padrao={padrao} vazio={!preparo.some(([, v]) => v)}><Tabela itens={preparo} /></Grupo>
      <Grupo titulo="Aplicação" origem={o.aplicacao} padrao={padrao} vazio={!temAplic && !e.aplicacao}>
        {/* o texto corrido só aparece aqui quando ainda não foi estruturado; o original fica em Documentação */}
        {temAplic ? <Tabela itens={aplic} /> : <Estruturado texto={e.aplicacao} />}
      </Grupo>
      <Grupo titulo="Queima" origem={o.queima} padrao={padrao} vazio={!queima.some(([, v]) => v) && !t.queima?.notas}>
        <Tabela itens={queima} />
        {t.queima?.notas && <Estruturado texto={t.queima.notas} />}
        <p className="fx-origem">A referência (temperatura, cone e atmosfera) está no topo. O limite de uma faixa comercial não é a temperatura máxima do esmalte; o cone mede o trabalho de calor, não só a temperatura.</p>
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
 * Segurança item por item, na nomenclatura do fabricante: atóxico, sem chumbo, Food Safe, Dinnerware Safe,
 * contato direto, ensaio e combinações. Condição escrita vira "Sim, com condições". Nada de "pode ir à louça" genérico.
 */
function Seguranca({ e }: { e: Esmalte }) {
  const t = e.tecnica ?? {}
  const s: Record<string, Verificacao | undefined> = { ...t.seguranca }
  const cond = t.segurancaCondicoes ?? {}
  if (!s.foodSafe && s.alimentarDeclarada) s.foodSafe = s.alimentarDeclarada
  if (!s.foodSafe && e.louca && !t.seguranca) s.foodSafe = e.louca === 'sim' ? 'sim' : e.louca === 'nao' ? 'nao' : undefined
  if (!s.contatoAlimento && e.louca === 'nao') s.contatoAlimento = 'nao'
  const itens = SEGURANCA.filter(([k, , essencial]) => essencial || s[k]).map(([k, l]): Linha => {
    const v = s[k] ?? 'nao-verificado'
    const c = cond[k]
    const valor = v === 'sim' && c ? 'Sim, com condições' : VERIFICACAO[v]
    const nota = c ?? (k === 'combinacoes' && v === 'nao-verificado' ? 'segurança isolada não vale para a combinação' : undefined)
    return [l, valor, nota]
  })
  return (
    <section className="fx-grupo">
      <h3>Segurança</h3>
      <Tabela itens={itens} />
      {t.segurancaNotas && <div className="fx-ressalva"><p className="fx-rot">Ressalvas</p><Estruturado texto={t.segurancaNotas} /></div>}
      <p className="fx-origem">Atóxico não quer dizer próprio para alimentos. Uma combinação não é segura só porque cada esmalte é.</p>
      <Origem o={t.origens?.seguranca} />
    </section>
  )
}
export { DEFEITOS_FICHA }

/* ——— Experimentos: caderno do ateliê ——— */
export function AbaExperimentos({ e, testes }: { e: Esmalte; testes: Teste[] }) {
  const nomes = useLiveQuery(async () => new Map((await db.esmaltes.toArray()).map((x) => [x.id, x.nome])), [], new Map<string, string>())
  const combos = useLiveQuery(async () => (await db.testes.toArray()).filter((t) => !t.excluido && t.combinacao?.length && (t.esmalteId === e.id || t.combinacao.includes(e.id))), [e.id], [])
  const proprios = testes.filter((t) => !t.combinacao?.length)
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
        </div> : <p className="fx-vazio-l">Nenhum ainda.</p>}
      </section>
      <section className="fx-grupo fx-flu-testes">
        <h3>Testes de fluidez</h3>
        <FluidezQueima e={e} embutida soTestes />
      </section>
      <section className="fx-grupo">
        <h3>Combinações e sobreposições</h3>
        {combos.length ? combos.map((t) => {
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
        }) : <p className="fx-vazio-l">Nenhuma ainda. Registre como um teste com combinação.</p>}
      </section>
      <section className="fx-grupo fx-pessoal">
        <h3>Observações pessoais</h3>
        <NotasPessoais e={e} />
        <Relacoes tipo="esmalte" id={e.id} />
      </section>
      <GaleriaPecas titulo="Obras relacionadas" compacto fotos={e.pecas ?? []} onChange={(v) => db.esmaltes.update(e.id, { pecas: v, atualizadoEm: Date.now() })} />
    </>
  )
}

/** Observações pessoais editáveis aqui mesmo: grava ao sair do campo. */
function NotasPessoais({ e }: { e: Esmalte }) {
  const [editando, setEditando] = useState(false)
  const [txt, setTxt] = useState(e.notasPessoais ?? '')
  if (!editando) return e.notasPessoais
    ? <><Paragrafos texto={e.notasPessoais} /><button className="fx-link" onClick={() => { setTxt(e.notasPessoais ?? ''); setEditando(true) }}><Pencil size={13} />Editar observações</button></>
    : <button className="fx-link" onClick={() => { setTxt(''); setEditando(true) }}><Plus size={14} />Escrever uma observação</button>
  const salvar = async () => { await db.esmaltes.update(e.id, { notasPessoais: txt.trim() || undefined, atualizadoEm: Date.now() }); setEditando(false) }
  return (
    <div className="fx-notas-ed">
      <textarea className="input" autoFocus rows={4} value={txt} onChange={(x) => setTxt(x.target.value)} placeholder="O que você observou: aplicação, queima, resultado, ideias…" />
      <div className="fx-notas-b"><button className="btn sm ghost" onClick={() => setEditando(false)}>Cancelar</button><button className="btn sm primary" onClick={salvar}>Salvar</button></div>
    </div>
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
      {e.aplicacao && (!!e.tecnica?.metodos?.length || temTexto(e.tecnica?.aplicacao)) && <Grupo titulo="Texto original de aplicação"><Estruturado texto={e.aplicacao} /></Grupo>}
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
