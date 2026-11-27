import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronRight, Pencil, Plus, TestTube } from 'lucide-react'
import { db, type Comercial, type Esmalte, type Nivel, type Receita, type ResultadoTemperatura, type Teste, type Verificacao } from '../../../db/schema'
import type { ReactNode } from 'react'
import { ROTULO_ESTADO, estadoFluidez } from '../../../lib/fluidez'
import {
  APLICACAO, ATRIBUTOS_COMPORTAMENTO, NIVEIS, COMPAT, DEFEITOS_FICHA, FAIXAS, GEOMETRIAS, MASSAS, ORIGENS, PREPARACAO, SEGURANCA,
  QUEIMA_ANTIGA, ROTULO_SEGURANCA, TIPOS_TEMPERATURA, classeSeguranca, dadosComerciais, efeitosDe, expressivoAlemDosEfeitos, faixaDoCone, hexDaCor, temTexto, texturasDe,
} from '../../../lib/esmalteFicha'
import { fmt } from '../../../lib/opcoes'
import { Foto } from '../../../ui/form'
import { GaleriaPecas } from '../../../ui/GaleriaFotos'
import { Relacoes } from '../../../ui/Relacoes'
import { ArtistasAfins } from '../../bib/art/ArtistasAfins'
import { FluidezQueima } from '../FluidezQueima'
import { AtlasEfeitos } from './Fenomeno'
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

export function AbaPerfil({ e, irPara, foco }: { e: Esmalte; irPara: (aba: 'experimentos') => void; foco?: string }) {
  const p = e.perfil ?? {}
  const efeitos = efeitosDe(e)
  const v = p.visual ?? {}
  const aparencia: Linha[] = [
    ['Cor principal', e.cor && <Cores texto={e.cor} hex={e.corHex} />],
    ['Acabamento', e.acabamento], ['Opacidade', e.transparencia], ['Textura', texturasDe(e).join(', ')],
  ]
  const variacoes: Linha[] = [
    ['Cores secundárias', v.coresSecundarias && <Cores texto={v.coresSecundarias} />], ['Subtons', v.subtons && <Cores texto={v.subtons} />],
    ['Variação geral', v.variacao], ['Em camada fina', v.corFina], ['Em camada espessa', v.corEspessa],
    ['Por temperatura', v.corTemperatura], ['Por atmosfera', v.corAtmosfera], ['Nas áreas de acúmulo', v.corAcumulo],
    ['Influência da massa cerâmica', v.corMassa], ['Em sobreposições', v.corSobreposicao],
  ]
  const outras = expressivoAlemDosEfeitos(p.expressivo, efeitos)
  const origemDe = (k: string) => { const o = p.comportamentoOrigem?.[k] ?? p.origens?.comportamento?.origem; return o ? ROTULO_ORIGEM[o] : undefined }
  const props = ATRIBUTOS_COMPORTAMENTO.filter(([k]) => k !== 'fluidez' && (p.comportamento?.[k] || p.comportamentoNota?.[k] || p.comportamentoClasse?.[k]))
  const superficie = GEOMETRIAS.filter(([k]) => p.superficie?.[k]?.length)
  const temFluidez = e.origem === 'comercial' || !!e.fluidez || !!e.testesFluidez?.length || !!p.comportamento?.fluidez || !!p.comportamentoNota?.fluidez
  const temEfeitos = efeitos.length || superficie.length || outras.length || p.expressivoTexto || p.sugestoesIA
  return (
    <>
      <Grupo titulo="Aparência" origem={p.origens?.visual} vazio={![...aparencia, ...variacoes].some(([, x]) => x)}>
        <Tabela itens={aparencia} />
        {variacoes.some(([, x]) => x) && <Recolhido titulo="Variações cromáticas"><Tabela itens={variacoes} /></Recolhido>}
        {(e.corHex || [e.cor, v.coresSecundarias, v.subtons].some((x) => x && hexDaCor(x))) && <p className="fx-origem">Amostras de cor: aproximações visuais a partir das cores descritas, não extraídas de amostras reais.</p>}
      </Grupo>

      <section className="fx-grupo">
        <h3>Comportamento</h3>
        {temFluidez && <Fluidez e={e} irPara={irPara} aberta={foco === 'fluidez'} />}
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
        <AtlasEfeitos e={e} tipos={efeitos} />
        {superficie.length > 0 && <><p className="fx-sub">Interação com a superfície</p><Tabela itens={superficie.map(([k, l]) => [l, p.superficie![k].join(', ')])} /><Origem o={p.origens?.superficie} /></>}
        {/* possibilidades que só repetem os efeitos ilustrados não aparecem de novo */}
        {(!!outras.length || p.expressivoTexto || p.sugestoesIA) && <>
          <p className="fx-sub">{efeitos.length ? 'Outras possibilidades' : 'Possibilidades expressivas'}</p>
          {!!outras.length && <p className="fx-lista">{outras.join(' · ')}</p>}
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
function Fluidez({ e, irPara, aberta }: { e: Esmalte; irPara: (aba: 'experimentos') => void; aberta?: boolean }) {
  const p = e.perfil ?? {}
  const f = e.fluidezQueima
  const estado = estadoFluidez(e)
  const testes = [...(e.testesFluidez ?? [])].sort((a, b) => b.data.localeCompare(a.data))
  const classe = classeFluidez(e)
  const semEscala = !(f?.situacao === 'oficial' && f.resultados.some((r) => r.escala)) && !p.comportamento?.fluidez
  const origem = p.comportamentoOrigem?.fluidez
  return (
    <Propriedade nome="Fluidez na queima" classe={classe} id="fx-fluidez" aberta={aberta}>
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
      {semEscala && (p.comportamentoNota?.fluidez || p.comportamentoClasse?.fluidez) && <p className="fx-nota">O fabricante descreve o movimento em termos qualitativos; não há classificação quantitativa publicada.</p>}
      {e.origem === 'comercial' && <Recolhido titulo="Consulta ao fabricante" resumo="fontes, imagens, atualizar"><FluidezQueima e={e} embutida soFabricante /></Recolhido>}
      <p className="fx-origem">Fluidez é o movimento do esmalte fundido na queima. A viscosidade do esmalte em suspensão, antes de aplicar, fica em Técnica.</p>
    </Propriedade>
  )
}

/** Classificação de fluidez para resumo: termo e escala do fabricante; sem escala, a descrição qualitativa registrada. */
export function classeFluidez(e: Esmalte): string | undefined {
  const p = e.perfil ?? {}
  const f = e.fluidezQueima
  const oficiais = f?.situacao === 'oficial' ? f.resultados.filter((r) => r.classificacao) : []
  if (oficiais.length) return oficiais.map((r) => r.classificacao).join(' · ')
  if (p.comportamento?.fluidez) return NIVEIS[p.comportamento.fluidez]
  if (p.comportamentoClasse?.fluidez) return p.comportamentoClasse.fluidez
  if (e.fluidez) return `${e.fluidez} (sua avaliação)`
  const estado = estadoFluidez(e)
  if (estado) return ROTULO_ESTADO[estado]
  const n = e.testesFluidez?.length ?? 0
  return n ? `Sem classificação; ${n} ${n === 1 ? 'teste seu' : 'testes seus'}` : undefined
}

/** Cores descritas, cada uma com amostra aproximada quando o nome é reconhecido. Frases longas ficam só em texto. */
function Cores({ texto, hex }: { texto: string; hex?: string }) {
  const partes = texto.split(/\s*(?:,|;|\s+e\s+)\s*/).filter(Boolean)
  if (partes.length === 1) {
    const h = hex ?? (texto.length <= 32 ? hexDaCor(texto) : undefined)
    return <span className="fx-cores">{h && <i className="fx-amostra" style={{ background: h }} />}{texto}</span>
  }
  return <span className="fx-cores">{partes.map((c, i) => {
    const h = c.length <= 32 ? hexDaCor(c) : undefined
    return <span key={i}>{h && <i className="fx-amostra" style={{ background: h }} />}{c}{i < partes.length - 1 ? ', ' : ''}</span>
  })}</span>
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
  const ESSENCIAL_APLIC = ['demaos', 'biscoito', 'restricoes']
  const aplicBase: Linha[] = [['Métodos', t.metodos?.join(', ')], ...linhas(APLICACAO.filter(([k]) => ESSENCIAL_APLIC.includes(k)), t.aplicacao)]
  const aplicMais: Linha[] = linhas(APLICACAO.filter(([k]) => !ESSENCIAL_APLIC.includes(k)), t.aplicacao)
  const temAplic = [...aplicBase, ...aplicMais].some(([, v]) => v)
  const essencial: Linha[] = [
    ['Temperatura de referência', e.temperatura ? fmt(e.temperatura, 0) + ' °C' : undefined], ['Cone', e.cone && rotuloCone(e.cone)],
    ['Atmosfera', e.atmosfera], ['Faixa do fabricante', q.faixa], ['Faixa do revendedor', q.faixaRevenda],
  ]
  const faixas = faixasDeQueima(e)
  const fontesTemp = [...new Set((t.temperaturas ?? []).map((x) => x.fonte).filter((x): x is string => !!x))]
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
        {temAplic ? <>
          <Tabela itens={aplicBase} />
          {aplicMais.some(([, v]) => v) && <Recolhido titulo="Cuidados e recomendações"><Tabela itens={aplicMais} /></Recolhido>}
        </> : <Estruturado texto={e.aplicacao} />}
      </Grupo>
      <Grupo titulo="Queima" id="fx-queima" origem={o.queima} padrao={padrao} vazio={![...essencial, ...queima].some(([, v]) => v) && !faixas.length}>
        <Tabela itens={essencial} />
        {faixas.length > 0 && <ul className="fx-faixas">{faixas.map(([f, xs]) => (
          <li key={f}><p className="fx-faixa-t">{FAIXAS[f]}</p>
            {xs.map((x, i) => <div key={i} className={'fx-faixa-l' + (x.tipo === 'teste' ? ' pessoal' : x.tipo === 'hipotese' ? ' hip' : '')}>
              <p><b>{[x.cone && 'Cone ' + x.cone.replace(/^cone\s*/i, ''), x.temperatura, x.atmosfera].filter(Boolean).join(' · ')}</b>{x.descricao && <> · {x.descricao}</>}</p>
              <span className="fx-nota">{TIPOS_TEMPERATURA[x.tipo]}</span>
            </div>)}
          </li>
        ))}</ul>}
        {(queima.some(([, v]) => v) || fontesTemp.length > 0) && <Recolhido titulo="Condições e fontes da queima">
          <Tabela itens={queima} />
          {fontesTemp.length > 0 && <><p className="fx-sub">Fontes</p><ul className="fx-fontes">{fontesTemp.map((u) => <li key={u}><Fonte u={u} /></li>)}</ul></>}
        </Recolhido>}
        <p className="fx-origem">Uma imagem do fabricante não é recomendação de uso, e o limite de uma faixa informada não é a temperatura máxima do esmalte. Cone 06 (baixa temperatura) e cone 6 (média temperatura) são referências diferentes.</p>
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

/** Condições de queima agrupadas em baixa, média e alta: as documentadas e os seus testes de fluidez, sem misturar os tipos. */
function faixasDeQueima(e: Esmalte): ['baixa' | 'media' | 'alta', ResultadoTemperatura[]][] {
  const porTemp = (t?: string) => { const n = Number((t ?? '').replace(/[^\d].*$/, '')); return !n ? undefined : n < 1100 ? 'baixa' : n <= 1250 ? 'media' : 'alta' }
  const testes: ResultadoTemperatura[] = (e.testesFluidez ?? []).filter((x) => x.cone || x.temperatura).map((x) => ({
    cone: x.cone, temperatura: x.temperatura ? fmt(x.temperatura, 0) + ' °C' : undefined, atmosfera: x.atmosfera, tipo: 'teste',
    descricao: [x.escorrimentoMm != null && `${fmt(x.escorrimentoMm, 0)} mm de escorrimento`, data(x.data)].filter(Boolean).join(', '),
  }))
  const grupos = new Map<'baixa' | 'media' | 'alta', ResultadoTemperatura[]>()
  for (const x of [...(e.tecnica?.temperaturas ?? []), ...testes]) {
    const f = faixaDoCone(x.cone) ?? porTemp(x.temperatura)
    if (f) grupos.set(f, [...(grupos.get(f) ?? []), x])
  }
  return (['baixa', 'media', 'alta'] as const).filter((f) => grupos.has(f)).map((f) => [f, grupos.get(f)!])
}

/** Link para a página específica, com o domínio à vista e o caminho abreviado. */
const Fonte = ({ u, rotulo }: { u: string; rotulo?: ReactNode }) => {
  const curto = u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
  return <><a href={u} target="_blank" rel="noreferrer">{curto}</a>{rotulo && <span className="fx-nota">{rotulo}</span>}</>
}

/** "Cone 06" e "cone 6" são coisas diferentes: o zero à esquerda fica, e a faixa de temperatura vem junto. */
function rotuloCone(c: string) {
  const s = c.trim().replace(/^cone\s*/i, '')
  const baixa = /^0\d/.test(s)
  return `${s}${baixa ? ' (baixa temperatura)' : /^\d/.test(s) && Number(s.split(/[-/]/)[0]) <= 7 ? ' (média temperatura)' : /^\d/.test(s) ? ' (alta temperatura)' : ''}`
}

/**
 * Segurança alimentar em poucas palavras para o resumo do topo. Usa só o que foi declarado, sem tratar Food Safe e
 * Dinnerware Safe como equivalentes; condições e justificativas ficam em Técnica › Segurança.
 * Sem declaração: "Não informada" (a falta de informação não vira seguro nem inseguro).
 */
export const segurancaCurta = (e: Esmalte) => ROTULO_SEGURANCA[classeSeguranca(e).classe]

/** Fluidez em uma ou duas palavras para o resumo. A classificação completa, a escala e as fontes ficam em Perfil. */
export function fluidezCurta(e: Esmalte): string | undefined {
  const p = e.perfil ?? {}
  const f = e.fluidezQueima
  const oficiais = f?.situacao === 'oficial' ? [...new Set(f.resultados.map((r) => r.classificacao).filter(Boolean))] : []
  if (oficiais.length) return oficiais.slice(0, 2).join(' · ')
  if (p.comportamento?.fluidez) return NIVEIS[p.comportamento.fluidez]
  if (p.comportamentoClasse?.fluidez) return p.comportamentoClasse.fluidez.split(/[,;(]/)[0].trim()
  if (e.fluidez) return `${e.fluidez} (sua avaliação)`
  const estado = estadoFluidez(e)
  const CURTO = { 'nao-consultado': 'Não consultada', 'qualitativa-sem-consulta': 'Descrição qualitativa', indisponivel: 'Não disponível', 'sem-classificacao': 'Sem classificação', qualitativa: 'Descrição qualitativa', oficial: 'Classificação oficial' } as const
  if (estado) return CURTO[estado]
  return e.testesFluidez?.length ? 'Sem classificação' : undefined
}

const SEG_RESUMO = 'A classificação de segurança alimentar refere-se ao produto utilizado conforme as orientações do fabricante. Misturas, sobreposições e alterações nas condições de queima podem modificar as propriedades do esmalte e exigem avaliação independente.'

/**
 * Segurança do produto cadastrado, na nomenclatura do fabricante. "Pode ir à louça" fica quando o fabricante declara,
 * com as condições junto. Combinações não rebaixam a classificação individual; falta de ensaio próprio não vira "inseguro".
 */
function Seguranca({ e }: { e: Esmalte }) {
  const t = e.tecnica ?? {}
  const s: Record<string, Verificacao | undefined> = { ...t.seguranca }
  const cond = t.segurancaCondicoes ?? {}
  const { classe, motivo } = classeSeguranca(e)
  // valores na nomenclatura do fabricante; as condições originais ficam como nota de cada item
  const valor = (k: string): string => {
    const v = s[k]
    if (k === 'ensaio') return v === 'sim' ? 'Sim, aprovado' : v === 'nao' ? 'Sim, reprovado' : 'Não informado'
    return v === 'sim' ? 'Sim' : v === 'nao' ? 'Não' : 'Não informado'
  }
  const ESSENCIAIS = ['atoxico', 'semChumbo', 'foodSafe', 'dinnerwareSafe', 'contatoAlimento']
  const itens: Linha[] = SEGURANCA.filter(([k]) => k !== 'combinacoes' && k !== 'alimentarDeclarada' && k !== 'ensaio' && (ESSENCIAIS.includes(k) || s[k]))
    .map(([k, l]) => [l, valor(k), cond[k]])
  // registro antigo, sem o termo exato do fabricante: não vira "Food Safe"
  if (s.alimentarDeclarada) itens.splice(2, 0, ['Uso alimentar declarado', valor('alimentarDeclarada') + (s.foodSafe ? '' : ' (termo do fabricante não registrado)')])
  itens.push(['Restrições específicas', t.restricoesAlimentares || (classe === 'seguro' ? 'Nenhuma declarada' : 'Não informado')])
  itens.push(['Ensaio laboratorial documentado', valor('ensaio'), cond.ensaio])
  return (
    <section className="fx-grupo" id="fx-seguranca">
      <h3>Segurança e uso</h3>
      <p className={'fx-louca ' + classe}><b>{ROTULO_SEGURANCA[classe]}</b><span>{motivo}</span></p>
      <Tabela itens={itens} />
      {t.segurancaNotas && <div className="fx-ressalva"><p className="fx-rot">Observações do fabricante</p><Estruturado texto={t.segurancaNotas} /></div>}
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
  // cada fonte com o tipo identificado (fabricante, revendedor, distribuidor…), sem repetir a mesma página
  const fontes = new Map<string, string | undefined>()
  const add = (u?: string, r?: string) => { if (u && /^https?:/.test(u) && !fontes.get(u)) fontes.set(u, r) }
  for (const o of Object.values({ ...e.perfil?.origens, ...e.tecnica?.origens })) add(o?.fonte, o?.origem && ORIGENS[o.origem])
  for (const x of e.tecnica?.temperaturas ?? []) add(x.fonte, x.tipo === 'revendedor' ? ORIGENS.revendedor : x.tipo === 'teste' || x.tipo === 'hipotese' ? undefined : ORIGENS.fabricante)
  for (const u of e.fluidezQueima?.fontes ?? []) add(u)
  for (const u of estudo?.fontes ?? []) add(u)
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
      <Grupo titulo={comercial ? 'Documentação técnica' : 'Observações'} vazio={!e.observacoes}><Estruturado texto={e.observacoes} /></Grupo>
      {e.aplicacao && (!!e.tecnica?.metodos?.length || temTexto(e.tecnica?.aplicacao)) && <Grupo titulo="Texto original de aplicação"><Estruturado texto={e.aplicacao} /></Grupo>}
      <Grupo titulo="Fontes" vazio={!fontes.size}>
        <ul className="fx-fontes">{[...fontes].map(([u, r]) => <li key={u}><Fonte u={u} rotulo={r} /></li>)}</ul>
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
