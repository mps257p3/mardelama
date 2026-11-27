import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronRight, Pencil, Plus, TestTube } from 'lucide-react'
import { db, type Comercial, type Esmalte, type Nivel, type Receita, type Teste, type Verificacao } from '../../../db/schema'
import { ROTULO_ESTADO, estadoFluidez } from '../../../lib/fluidez'
import {
  APLICACAO, ATRIBUTOS_COMPORTAMENTO, NIVEIS, COMPAT, DEFEITOS_FICHA, GEOMETRIAS, MASSAS, ORIGENS, PREPARACAO, SEGURANCA,
  QUEIMA_ANTIGA, dadosComerciais, efeitosDe, temTexto, texturasDe,
} from '../../../lib/esmalteFicha'
import { fmt } from '../../../lib/opcoes'
import { Foto } from '../../../ui/form'
import { GaleriaPecas } from '../../../ui/GaleriaFotos'
import { Relacoes } from '../../../ui/Relacoes'
import { ArtistasAfins } from '../../bib/art/ArtistasAfins'
import { FluidezQueima } from '../FluidezQueima'
import { Pictogramas } from './Pictogramas'
import { Estruturado, Grade, Grupo, Origem, Paragrafos, Propriedade, Recolhido, Tabela, TabelaNiveis, type Linha } from './partes'

const data = (d?: string) => (d ? new Date(d + 'T12:00').toLocaleDateString('pt-BR') : '')
const quando = (t: number) => new Date(t).toLocaleDateString('pt-BR')
const linhas = (campos: [string, string][], r?: Record<string, string>): Linha[] => campos.map(([k, l]) => [l, r?.[k]])

/** Atalho compacto numa linha (substitui os cartões grandes). */
const Atalho = ({ to, titulo, nota }: { to: string; titulo: string; nota?: string }) => (
  <Link className="fx-atalho" to={to}><span><b>{titulo}</b>{nota && <span className="fx-nota">{nota}</span>}</span><ChevronRight size={16} strokeWidth={1.5} /></Link>
)

/* ——— Perfil: aparência, comportamento, efeitos e os seus registros ——— */
const ROTULO_ORIGEM = ORIGENS

export function AbaPerfil({ e, irPara }: { e: Esmalte; irPara: (aba: 'experimentos') => void }) {
  const p = e.perfil ?? {}
  const efeitos = efeitosDe(e)
  const v = p.visual ?? {}
  const aparencia: Linha[] = [
    ['Cor principal', e.cor && <>{e.corHex && <i className="fx-amostra" style={{ background: e.corHex }} />}{e.cor}</>],
    ['Cores secundárias', v.coresSecundarias], ['Subtons', v.subtons],
    ['Acabamento', e.acabamento], ['Opacidade', e.transparencia], ['Textura', texturasDe(e).join(', ')],
    ['Variação cromática', v.variacao], ['Em camada fina', v.corFina], ['Em camada espessa', v.corEspessa], ['Nas áreas de acúmulo', v.corAcumulo],
  ]
  const origemDe = (k: string) => { const o = p.comportamentoOrigem?.[k] ?? p.origens?.comportamento?.origem; return o ? ROTULO_ORIGEM[o] : undefined }
  const props = ATRIBUTOS_COMPORTAMENTO.filter(([k]) => k !== 'fluidez' && (p.comportamento?.[k] || p.comportamentoNota?.[k] || p.comportamentoClasse?.[k]))
  const superficie = GEOMETRIAS.filter(([k]) => p.superficie?.[k]?.length)
  const temFluidez = e.origem === 'comercial' || !!e.fluidez || !!e.testesFluidez?.length || !!p.comportamento?.fluidez || !!p.comportamentoNota?.fluidez
  const temEfeitos = efeitos.length || superficie.length || p.expressivo?.length || p.expressivoTexto || p.sugestoesIA
  return (
    <>
      <Grupo titulo="Aparência" origem={p.origens?.visual} vazio={!aparencia.some(([, x]) => x)}>
        <TabelaNiveis itens={aparencia} titulo="Cor por espessura e variação" />
        {e.corHex && <p className="fx-origem">Amostra de cor: referência aproximada.</p>}
      </Grupo>

      <section className="fx-grupo">
        <h3>Comportamento</h3>
        {temFluidez && <Fluidez e={e} irPara={irPara} />}
        {props.map(([k, l]) => (
          <Propriedade key={k} nome={l}
            classe={p.comportamento?.[k] ? <span className="fx-nivel"><Barras nivel={p.comportamento[k]} />{NIVEIS[p.comportamento[k]]}</span> : p.comportamentoClasse?.[k] ?? 'Sem classificação'}
            fonte={origemDe(k)} condicoes={p.comportamentoCondicoes?.[k]}>
            {p.comportamentoNota?.[k] ? <p className="fx-par">{p.comportamentoNota[k]}</p> : !p.comportamento?.[k] ? <p className="fx-par">Não há dados suficientes para estabelecer uma classificação.</p> : null}
          </Propriedade>
        ))}
        {!temFluidez && !props.length && <p className="fx-vazio-l">Nenhuma propriedade registrada. Em ⋯ › Editar › Perfil, registre o que o fabricante informa ou o que você observou.</p>}
      </section>

      <section className="fx-grupo">
        <h3>Efeitos e interações</h3>
        {!temEfeitos && <p className="fx-vazio-l">Nenhum efeito identificado nas informações disponíveis.</p>}
        <Pictogramas tipos={efeitos} />
        {efeitos.length > 0 && <p className="fx-origem">Ilustrações esquemáticas dos efeitos identificados nas fontes; não são resultados de teste.</p>}
        {superficie.length > 0 && <><p className="fx-sub">Interação com a superfície</p><Tabela itens={superficie.map(([k, l]) => [l, p.superficie![k].join(', ')])} /><Origem o={p.origens?.superficie} /></>}
        {(!!p.expressivo?.length || p.expressivoTexto || p.sugestoesIA) && <>
          <p className="fx-sub">Possibilidades expressivas</p>
          {!!p.expressivo?.length && <p className="fx-lista">{p.expressivo.join(' · ')}</p>}
          <Paragrafos texto={p.expressivoTexto} />
          <Origem o={p.origens?.expressivo} />
          {p.sugestoesIA && <div className="fx-ia"><p className="fx-ia-t">Sugestões da IA</p><Paragrafos texto={p.sugestoesIA} /><p className="fx-origem">Ideias criativas, não características comprovadas.</p></div>}
        </>}
      </section>

      <MeusRegistros e={e} irPara={irPara} />
    </>
  )
}

const Barras = ({ nivel }: { nivel: Nivel }) => <i className="fx-barras" aria-hidden>{[1, 2, 3, 4, 5].map((i) => <b key={i} className={i <= nivel ? 'on' : ''} />)}</i>

/**
 * Fluidez na queima numa só propriedade: classificação oficial (termo e escala originais), informação qualitativa,
 * outras fontes, sua avaliação, testes e divergências. A consulta ao fabricante continua aqui dentro.
 */
function Fluidez({ e, irPara }: { e: Esmalte; irPara: (aba: 'experimentos') => void }) {
  const p = e.perfil ?? {}
  const f = e.fluidezQueima
  const estado = estadoFluidez(e)
  const testes = [...(e.testesFluidez ?? [])].sort((a, b) => b.data.localeCompare(a.data))
  const oficiais = f?.situacao === 'oficial' ? f.resultados.filter((r) => r.classificacao) : []
  const classe = oficiais.length ? oficiais.map((r) => r.classificacao).join(' · ')
    : p.comportamento?.fluidez ? NIVEIS[p.comportamento.fluidez]
    : p.comportamentoClasse?.fluidez ?? (e.fluidez ? `${e.fluidez} (sua avaliação)` : estado ? ROTULO_ESTADO[estado] : undefined)
  const origem = p.comportamentoOrigem?.fluidez
  return (
    <Propriedade nome="Fluidez na queima" classe={classe}>
      <dl className="fx-fontes-l">
        {estado && <div><dt>Fabricante</dt><dd>
          <p className="fx-estado">{ROTULO_ESTADO[estado]}{f?.consultadoEm ? ` · consulta de ${data(f.consultadoEm)}` : ''}</p>
          {f && f.situacao !== 'indisponivel' && f.resultados.map((r, i) => (
            <p key={i} className="fx-par">{[r.cone && 'Cone ' + r.cone.replace(/^cone\s*/i, ''), r.temperatura].filter(Boolean).join(' · ')}{(r.cone || r.temperatura) && ': '}
              {r.classificacao && <b>{r.classificacao}</b>}{r.traducao && ` (${r.traducao})`}{r.classificacao && r.comportamento ? '. ' : ''}{r.comportamento}
              {r.escala && <span className="fx-nota">Escala do fabricante: {r.escala}</span>}</p>
          ))}
        </dd></div>}
        {p.comportamentoNota?.fluidez && <div><dt>{origem && origem !== 'fabricante' ? ROTULO_ORIGEM[origem] : 'Informação qualitativa'}</dt><dd>
          <p className="fx-par">{p.comportamentoNota.fluidez}</p>
          {p.comportamentoCondicoes?.fluidez && <p className="fx-nota">Condições: {p.comportamentoCondicoes.fluidez}</p>}
        </dd></div>}
        {e.fluidez && <div><dt>Sua avaliação</dt><dd>{e.fluidez}</dd></div>}
        {f?.estimativaIA && <div><dt>Interpretação da IA</dt><dd><p className="fx-par">{f.estimativaIA}</p><span className="fx-nota">Não é dado do fabricante nem resultado de teste.</span></dd></div>}
        <div><dt>Seus testes</dt><dd>{testes.length ? `${testes.length} registrado${testes.length > 1 ? 's' : ''}${testes[0].escorrimentoMm != null ? `; último: ${fmt(testes[0].escorrimentoMm, 0)} mm em ${data(testes[0].data)}` : ''}` : 'Nenhum registrado'}
          <button className="fx-link" onClick={() => irPara('experimentos')}>{testes.length ? 'Ver testes' : 'Registrar teste'} <ChevronRight size={14} /></button></dd></div>
      </dl>
      {e.origem === 'comercial' && <Recolhido titulo="Consulta ao fabricante" resumo="fontes, imagens, atualizar"><FluidezQueima e={e} embutida soFabricante /></Recolhido>}
      <p className="fx-origem">Fluidez é o movimento do esmalte fundido na queima. A viscosidade do esmalte em suspensão, antes de aplicar, fica em Técnica.</p>
    </Propriedade>
  )
}

/** Resumo do que é seu: avaliação, situação, testes e observações. O conteúdo completo fica em Experimentos. */
function MeusRegistros({ e, irPara }: { e: Esmalte; irPara: (aba: 'experimentos') => void }) {
  const n = useLiveQuery(async () => (await db.testes.where('esmalteId').equals(e.id).toArray()).filter((t) => !t.excluido).length, [e.id], 0)
  const itens: Linha[] = [
    ['Avaliação', e.avaliacao ? <span className="fx-estrelas" aria-label={`${e.avaliacao} de 5`}>{'★'.repeat(e.avaliacao)}<span>{'★'.repeat(5 - e.avaliacao)}</span></span> : undefined],
    ['Situação', e.status], ['Fluidez (sua avaliação)', e.fluidez],
    ['Testes', n ? `${n} ${n === 1 ? 'teste' : 'testes'}` : undefined], ['Testes de fluidez', e.testesFluidez?.length ? String(e.testesFluidez.length) : undefined],
  ]
  const nota = e.notasPessoais?.trim()
  return (
    <section className="fx-grupo">
      <div className="fx-grupo-h"><h3>Meus registros</h3><button className="fx-link" onClick={() => irPara('experimentos')}>Experimentos <ChevronRight size={14} /></button></div>
      {itens.some(([, x]) => x) || nota ? <>
        <Tabela itens={itens} />
        {nota && <p className="fx-par fx-citacao">{nota.length > 160 ? nota.slice(0, 160).trimEnd() + '…' : nota}</p>}
      </> : <p className="fx-vazio-l">Nenhum registro seu ainda.</p>}
    </section>
  )
}

/* ——— Técnica: como usar. Essencial primeiro; o resto em "Detalhes". ——— */
export function AbaTecnica({ e }: { e: Esmalte }) {
  const t = e.tecnica ?? {}
  const o = t.origens ?? {}
  const q = t.queima ?? {}
  const padrao = e.origem === 'comercial' ? 'Fabricante' : undefined
  const preparo: Linha[] = [...linhas(PREPARACAO, t.preparacao).slice(0, 4), ['Viscosidade', e.viscosidade, 'do esmalte em suspensão, antes de aplicar'], ...linhas(PREPARACAO, t.preparacao).slice(4)]
  const aplic: Linha[] = [['Métodos', t.metodos?.join(', ')], ...linhas(APLICACAO, t.aplicacao)]
  const temAplic = aplic.some(([, v]) => v)
  const essencial: Linha[] = [
    ['Temperatura de referência', e.temperatura ? fmt(e.temperatura, 0) + ' °C' : undefined], ['Cone', e.cone && rotuloCone(e.cone)],
    ['Faixa informada', q.faixa], ['Atmosfera', e.atmosfera],
  ]
  const queima: Linha[] = [
    ['Outros cones', q.conesAlternativos],
    ...linhas(QUEIMA_ANTIGA, q),
    ['Outras temperaturas', q.alternativas], ['Curva', q.curva], ['Aquecimento', q.aquecimento], ['Patamar', q.patamar], ['Resfriamento', q.resfriamento],
    ['Resfriamento controlado', q.resfriamentoControlado], ['Forno elétrico', q.eletrico], ['Forno a gás', q.gas], ['Observações', q.notas],
  ]
  const compat = MASSAS.filter(([k]) => t.compatibilidade?.[k])
  const naoAvaliadas = MASSAS.filter(([k]) => !t.compatibilidade?.[k]).map(([, l]) => l)
  return (
    <>
      <Grupo titulo="Preparação" origem={o.preparacao} padrao={padrao} vazio={!preparo.some(([, v]) => v)}><TabelaNiveis itens={preparo} /></Grupo>
      <Grupo titulo="Aplicação" origem={o.aplicacao} padrao={padrao} vazio={!temAplic && !e.aplicacao}>
        {/* o texto corrido só aparece aqui quando ainda não foi estruturado; o original fica em Documentação */}
        {temAplic ? <TabelaNiveis itens={aplic} /> : <Estruturado texto={e.aplicacao} />}
      </Grupo>
      <Grupo titulo="Queima" origem={o.queima} padrao={padrao} vazio={![...essencial, ...queima].some(([, v]) => v)}>
        <Tabela itens={essencial} />
        {queima.some(([, v]) => v) && <Recolhido titulo="Outras temperaturas e condições" resumo={queima.filter(([, v]) => v).map(([k]) => k).join(', ').toLowerCase()}><Tabela itens={queima} /></Recolhido>}
        <p className="fx-origem">O limite de uma faixa informada não é a temperatura máxima do esmalte. Cone 06 (baixa temperatura) e cone 6 (média temperatura) são referências diferentes.</p>
      </Grupo>
      <Grupo titulo="Compatibilidade" origem={o.compatibilidade} vazio={!compat.length && !t.compatNotas}>
        <Tabela itens={compat.map(([k, l]) => [l, COMPAT[t.compatibilidade![k]]])} />
        <Paragrafos texto={t.compatNotas} />
        {compat.length > 0 && naoAvaliadas.length > 0 && <p className="fx-origem">Ainda não avaliado: {naoAvaliadas.join(', ')}.</p>}
      </Grupo>
      <Seguranca e={e} />
      <Grupo titulo="Cuidados" origem={o.defeitos} vazio={!t.defeitos?.length}>
        {t.defeitos?.map((d, i) => (
          <Propriedade key={i} nome={d.tipo} classe={d.intencional ? 'Efeito intencional' : d.hipotese ? 'Hipótese' : undefined}>
            {d.causa && <p className="fx-par"><span className="fx-rot">Causa{d.hipotese ? ' (hipótese)' : ''}</span> {d.causa}</p>}
            {d.solucao && <p className="fx-par"><span className="fx-rot">Solução{d.hipotese ? ' (hipótese)' : ''}</span> {d.solucao}</p>}
          </Propriedade>
        ))}
      </Grupo>
    </>
  )
}

/** "Cone 06" e "cone 6" são coisas diferentes: o zero à esquerda fica, e a faixa de temperatura vem junto. */
function rotuloCone(c: string) {
  const s = c.trim().replace(/^cone\s*/i, '')
  const baixa = /^0\d/.test(s)
  return `${s}${baixa ? ' (baixa temperatura)' : /^\d/.test(s) && Number(s.split(/[-/]/)[0]) <= 7 ? ' (média temperatura)' : /^\d/.test(s) ? ' (alta temperatura)' : ''}`
}

const SEG_RESUMO = 'A classificação de segurança refere-se ao esmalte nas condições de uso e queima recomendadas. A segurança de combinações e sobreposições com outros esmaltes não é automaticamente assegurada.'

/**
 * Segurança do produto cadastrado, na nomenclatura do fabricante. "Pode ir à louça" fica quando o fabricante declara,
 * com as condições junto. Combinações não rebaixam a classificação individual; falta de ensaio próprio não vira "inseguro".
 */
function Seguranca({ e }: { e: Esmalte }) {
  const t = e.tecnica ?? {}
  const s: Record<string, Verificacao | undefined> = { ...t.seguranca }
  const cond = t.segurancaCondicoes ?? {}
  if (!s.foodSafe && s.alimentarDeclarada) s.foodSafe = s.alimentarDeclarada
  const comercial = e.origem === 'comercial'
  const declarada = e.louca === 'sim' || s.foodSafe === 'sim' || s.dinnerwareSafe === 'sim'
  const vetada = e.louca === 'nao' || s.decorativo === 'sim'
  const condicoes = [cond.foodSafe, cond.dinnerwareSafe, cond.loucaFuncional].filter(Boolean) as string[]
  const valor = (k: string): string => {
    const v = s[k]
    if (k === 'ensaio') return v === 'sim' ? 'Realizado, aprovado' : v === 'nao' ? 'Realizado, reprovado' : 'Não realizado'
    return v === 'sim' ? (cond[k] ? 'Sim, com condições' : 'Sim') : v === 'nao' ? 'Não' : 'Não informado'
  }
  const ESSENCIAIS = ['atoxico', 'semChumbo', 'foodSafe', 'dinnerwareSafe', 'contatoAlimento', 'ensaio']
  const itens: Linha[] = SEGURANCA.filter(([k]) => k !== 'combinacoes' && k !== 'alimentarDeclarada' && (ESSENCIAIS.includes(k) || s[k]))
    .map(([k, l]) => [k === 'ensaio' ? 'Ensaio laboratorial próprio' : l, valor(k), cond[k]])
  return (
    <section className="fx-grupo">
      <h3>Segurança</h3>
      {(declarada || vetada) && <p className={'fx-louca' + (vetada ? ' nao' : '')}>
        <b>{vetada ? 'Não usar em louça' : 'Pode ir à louça'}</b>
        <span>{comercial ? 'declarado pelo fabricante' : 'registrado por você'}{!vetada && condicoes.length ? ', com condições' : ''}</span>
      </p>}
      <Tabela itens={itens} />
      {t.segurancaNotas && <div className="fx-ressalva"><p className="fx-rot">Restrições</p><Estruturado texto={t.segurancaNotas} /></div>}
      {cond.combinacoes && <p className="fx-origem fx-cond">{cond.combinacoes}</p>}
      <p className="fx-origem">{SEG_RESUMO}</p>
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
        <Tabela itens={[
          ['Incluído em', quando(e.criadoEm)], ['Atualizado em', quando(e.atualizadoEm)],
          ['Fluidez consultada em', data(e.fluidezQueima?.consultadoEm)],
        ]} />
      </Grupo>
      {e.tags.length > 0 && <section className="fx-grupo"><h3>Tags</h3><p className="fx-tags">{e.tags.map((t) => <span key={t}>{t}</span>)}</p></section>}
    </>
  )
}

export const temTecnica = (e: Esmalte) => temTexto(e.tecnica?.preparacao) || temTexto(e.tecnica?.aplicacao) || temTexto(e.tecnica?.queima)
export { Grade }
