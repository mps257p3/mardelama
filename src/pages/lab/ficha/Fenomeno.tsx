import { useState } from 'react'
import { X } from 'lucide-react'
import type { Esmalte, OrigemDado } from '../../../db/schema'
import {
  ATRIBUTOS_COMPORTAMENTO, GEOMETRIAS, NIVEIS, ORIGENS, PICTOGRAMAS, ROTULO_STATUS, TIPOS_TEMPERATURA, VISUAL,
  associacoesFenomenos, statusDaOrigem, texturasDe, type StatusFenomeno,
} from '../../../lib/esmalteFicha'
import { FENOMENOS } from '../../../lib/fenomenos'
import { Sheet } from '../../../ui/Sheet'
import { AmostraFenomeno } from '../../../ui/AmostraFenomeno'

const NOME = Object.fromEntries(PICTOGRAMAS)
const ATRIB = Object.fromEntries(ATRIBUTOS_COMPORTAMENTO)
const GEO = Object.fromEntries(GEOMETRIAS)
const VIS = Object.fromEntries(VISUAL)

/** Em que parte do painel o dado aparece. */
type Tema = 'comportamento' | 'temperatura' | 'espessura' | 'sobreposicao' | 'recomendacao'
const TEMAS: [Tema, string][] = [
  ['comportamento', 'Comportamento registrado'], ['temperatura', 'Influência da temperatura'], ['espessura', 'Influência da espessura'],
  ['sobreposicao', 'Em sobreposição a outros esmaltes'], ['recomendacao', 'Recomendações do fabricante'],
]

/** Um dado da ficha ligado ao fenômeno, com a origem e o grau de confirmação. */
export interface Item { tema: Tema; rotulo: string; texto: string; status: StatusFenomeno; origem?: string; fonte?: string }

const origemTemperatura = (tipo: string): OrigemDado =>
  tipo === 'revendedor' ? 'revendedor' : tipo === 'teste' ? 'experimento' : tipo === 'hipotese' ? 'ia' : 'fabricante'

/**
 * O que a ficha deste esmalte diz sobre o fenômeno. Só dados registrados, cada um com a origem; nada é deduzido.
 * Textos livres (notas, alertas, resultados de queima) entram só quando citam o fenômeno (`termos` da biblioteca).
 */
export function especificoDoFenomeno(e: Esmalte, tipo: string): Item[] {
  const fen = FENOMENOS[tipo]
  const p = e.perfil ?? {}
  const t = e.tecnica ?? {}
  const padrao: OrigemDado | undefined = e.origem === 'comercial' ? undefined : 'pessoal'
  const cita = (x?: string) => !!x && !!fen?.termos?.test(x)
  const itens: Item[] = []
  const vistos = new Set<string>()
  const add = (tema: Tema, rotulo: string, texto: string | undefined, o?: OrigemDado, fonte?: string) => {
    const tx = texto?.trim()
    if (!tx || vistos.has(tx)) return
    vistos.add(tx)
    itens.push({ tema, rotulo, texto: tx, status: statusDaOrigem(o), origem: o ? ORIGENS[o] : undefined, fonte })
  }
  const oc = (k: string) => p.comportamentoOrigem?.[k] ?? p.origens?.comportamento?.origem ?? padrao
  const fc = p.origens?.comportamento?.fonte
  const nota = (k: string) => {
    const classe = p.comportamento?.[k] ? NIVEIS[p.comportamento[k]] : p.comportamentoClasse?.[k]
    return [classe, p.comportamentoNota?.[k], p.comportamentoCondicoes?.[k] && `Condições: ${p.comportamentoCondicoes[k]}`].filter(Boolean).join('. ').replace(/\.\./g, '.')
  }

  // comportamento: atributos da ficha que tratam do fenômeno
  for (const k of fen?.atributos ?? []) {
    const tema: Tema = k === 'temperatura' || k === 'patamar' || k === 'resfriamento' ? 'temperatura' : k === 'espessura' ? 'espessura' : 'comportamento'
    add(tema, ATRIB[k] ?? k, nota(k), oc(k), fc)
  }
  // temperatura e espessura: só quando a nota cita o fenômeno
  for (const k of ['temperatura', 'patamar', 'resfriamento', 'atmosfera']) if (!fen?.atributos?.includes(k) && cita(p.comportamentoNota?.[k])) add('temperatura', ATRIB[k] ?? k, nota(k), oc(k), fc)
  if (!fen?.atributos?.includes('espessura') && cita(p.comportamentoNota?.espessura)) add('espessura', ATRIB.espessura ?? 'Espessura', nota('espessura'), oc('espessura'), fc)
  if (tipo === 'sobreposicao') add('sobreposicao', ATRIB.reatividade ?? 'Reatividade', nota('reatividade'), oc('reatividade'), fc)

  if (tipo === 'escorrimento') {
    const f = e.fluidezQueima
    if (f && f.situacao !== 'indisponivel') for (const r of f.resultados) {
      add('comportamento', `Fluidez${r.cone ? ' · cone ' + r.cone.replace(/^cone\s*/i, '') : ''}`, [r.classificacao, r.comportamento].filter(Boolean).join('. '), 'fabricante', f.fontes?.[0])
    }
    for (const x of e.testesFluidez ?? []) add('comportamento', `Teste de ${new Date(x.data + 'T12:00').toLocaleDateString('pt-BR')}`, [x.cone && 'cone ' + x.cone, x.escorrimentoMm != null && `${x.escorrimentoMm} mm de escorrimento`, x.observacoes].filter(Boolean).join(', '), 'experimento')
  }
  if (fen?.superficie) for (const [g, vs] of Object.entries(p.superficie ?? {})) {
    const hit = vs.filter((v) => fen.superficie!.includes(v))
    if (hit.length) add('comportamento', GEO[g] ?? g, hit.join(', '), p.origens?.superficie?.origem ?? padrao, p.origens?.superficie?.fonte)
  }

  // aparência: textos de cor que citam o fenômeno, cada um no tema certo
  const vo = p.origens?.visual?.origem ?? padrao, vf = p.origens?.visual?.fonte
  const v = p.visual ?? {}
  const temaVisual: Record<string, Tema> = { corTemperatura: 'temperatura', corAtmosfera: 'temperatura', corFina: 'espessura', corEspessa: 'espessura', corSobreposicao: 'sobreposicao' }
  for (const [k, txt] of Object.entries(v)) if (cita(txt)) add(temaVisual[k] ?? 'comportamento', VIS[k] ?? 'Aparência', txt, vo, vf)
  if (tipo === 'acumulo') add('espessura', VIS.corAcumulo ?? 'Nas áreas de acúmulo', v.corAcumulo, vo, vf)
  if (tipo === 'sobreposicao' || tipo === 'reatividade') add('sobreposicao', VIS.corSobreposicao ?? 'Em sobreposições', v.corSobreposicao, vo, vf)
  if (tipo === 'opacidade' || tipo === 'opalescencia') { add('espessura', VIS.corFina ?? 'Em camada fina', cita(v.corFina) ? v.corFina : undefined, vo, vf); add('espessura', VIS.corEspessa ?? 'Em camada espessa', cita(v.corEspessa) ? v.corEspessa : undefined, vo, vf) }

  // resultados de queima por cone que citam o fenômeno
  for (const x of t.temperaturas ?? []) if (cita(x.descricao))
    add('temperatura', [x.cone && 'Cone ' + x.cone.replace(/^cone\s*/i, ''), x.atmosfera].filter(Boolean).join(' · ') || 'Queima', `${x.descricao} (${TIPOS_TEMPERATURA[x.tipo].toLowerCase()})`, origemTemperatura(x.tipo), x.fonte)

  const tx = texturasDe(e)
  const TX: Record<string, string[]> = { craquele: ['Craquelada'], cristalizacao: ['Cristalizada', 'Microcristalina'] }
  const txs = tx.filter((x) => TX[tipo]?.includes(x))
  if (txs.length) add('comportamento', 'Textura registrada', txs.join(', '), vo, vf)

  if (tipo === 'sobreposicao' && t.metodos?.includes('Sobreposição')) add('sobreposicao', 'Método de aplicação', 'Indicado para sobreposição', t.origens?.aplicacao?.origem ?? padrao, t.origens?.aplicacao?.fonte)
  if (tipo === 'sobreposicao' || tipo === 'reatividade' || cita(t.segurancaCondicoes?.combinacoes)) add('sobreposicao', 'Combinações', t.segurancaCondicoes?.combinacoes, t.origens?.seguranca?.origem ?? padrao, t.origens?.seguranca?.fonte)

  // recomendações: alertas, restrições e cuidados de aplicação e queima que citam o fenômeno
  const oa = t.origens?.aplicacao?.origem ?? padrao, fa = t.origens?.aplicacao?.fonte
  for (const a of t.alertas ?? []) if (cita(a)) add('recomendacao', 'Alerta', a, oa, fa)
  for (const [k, l] of [['restricoes', 'Restrição de aplicação'], ['cuidados', 'Cuidado na aplicação'], ['demaos', 'Demãos']] as const) if (cita(t.aplicacao?.[k])) add('recomendacao', l, t.aplicacao![k], oa, fa)
  const oq = t.origens?.queima?.origem ?? padrao, fq = t.origens?.queima?.fonte
  for (const [k, txt] of Object.entries(t.queima ?? {})) if (cita(txt)) add('recomendacao', k === 'patamar' ? 'Patamar' : k === 'resfriamento' ? 'Resfriamento' : 'Queima', txt, oq, fq)

  if (fen?.defeitos) for (const d of t.defeitos ?? []) if (fen.defeitos.test(d.tipo)) {
    const o = d.hipotese ? 'ia' : t.origens?.defeitos?.origem ?? padrao
    add('comportamento', d.intencional ? 'Efeito intencional' : 'Defeito registrado', [d.tipo, d.causa && `Causa${d.hipotese ? ' (hipótese)' : ''}: ${d.causa}`, d.solucao && `Solução${d.hipotese ? ' (hipótese)' : ''}: ${d.solucao}`].filter(Boolean).join('. '), o)
  }
  return itens
}

/** Seção de efeitos: grade de amostras da biblioteca; cada uma abre o painel do fenômeno. */
export function AtlasEfeitos({ e }: { e: Esmalte }) {
  const [aberto, setAberto] = useState<{ tipo: string; status: StatusFenomeno }>()
  const lista = associacoesFenomenos(e)
  if (!lista.length) return null
  return (
    <>
      <ul className="fx-amostras-f">
        {lista.map((a) => (
          <li key={a.tipo}>
            <button className="fx-amostra-f" onClick={() => setAberto(a)} aria-label={`${NOME[a.tipo] ?? a.tipo}: ver explicação`}>
              <AmostraFenomeno tipo={a.tipo} />
              <span className="fx-amostra-nome">{NOME[a.tipo] ?? a.tipo}</span>
              {a.status !== 'documentado' && <span className={'fx-status ' + a.status}>{ROTULO_STATUS[a.status]}</span>}
            </button>
          </li>
        ))}
      </ul>
      <p className="fx-atlas-leg">Imagens ilustrativas dos fenômenos descritos. Não representam resultados de testes realizados com este esmalte.</p>
      {aberto && <PainelFenomeno e={e} tipo={aberto.tipo} status={aberto.status} onClose={() => setAberto(undefined)} />}
    </>
  )
}

const NOTA_STATUS: Record<StatusFenomeno, string> = {
  documentado: 'Associação documentada pelo fabricante ou por fonte identificada.',
  experimental: 'Associação observada nos seus testes ou registros; não é informação do fabricante.',
  'nao-confirmado': 'Associação sem fonte identificada. Confirme antes de considerar.',
}

function PainelFenomeno({ e, tipo, status, onClose }: { e: Esmalte; tipo: string; status: StatusFenomeno; onClose: () => void }) {
  const fen = FENOMENOS[tipo]
  const nome = fen?.nome ?? NOME[tipo] ?? tipo
  const itens = especificoDoFenomeno(e, tipo)
  const fontes = [...new Set(itens.map((i) => i.fonte).filter((x): x is string => !!x && /^https?:/.test(x)))]
  return (
    <Sheet onClose={onClose} label={nome}>
      <div className="fx-fen">
        <div className="fx-fen-h"><h2>{nome}</h2><button className="iconbtn" aria-label="Fechar" onClick={onClose}><X size={18} /></button></div>

        <section className="fx-fen-parte">
          <p className="fx-rot">Sobre o fenômeno</p>
          <figure className="fx-fen-fig"><AmostraFenomeno tipo={tipo} grande /><figcaption>Imagem ilustrativa; não é fotografia do produto nem resultado de teste deste esmalte.</figcaption></figure>
          {fen && <>
            <p className="fx-fen-def">{fen.definicao}</p>
            <h3>Como ocorre</h3><p className="fx-par">{fen.comoOcorre}</p>
            <h3>Fatores que favorecem ou modificam</h3><ul className="fx-fen-lista">{fen.condicoes.map((c) => <li key={c}>{c}</li>)}</ul>
            <h3>Possibilidades artísticas</h3><p className="fx-par">{fen.exploracao}</p>
            <h3>Cuidados técnicos</h3><p className="fx-par">{fen.cuidados}</p>
          </>}
        </section>

        <section className="fx-fen-parte fx-fen-esp">
          <p className="fx-rot">Comportamento neste esmalte · {e.nome}</p>
          <p className={'fx-fen-status ' + status}><b>{ROTULO_STATUS[status]}.</b> {NOTA_STATUS[status]}</p>
          {itens.length ? TEMAS.filter(([t]) => itens.some((i) => i.tema === t)).map(([t, l]) => (
            <div key={t} className="fx-fen-g">
              <h3>{l}</h3>
              <dl className="fx-fontes-l">{itens.filter((i) => i.tema === t).map((i, k) => (
                <div key={k}>
                  <dt>{i.rotulo}<span className={'fx-status ' + i.status}>{i.status === 'documentado' ? i.origem ?? ROTULO_STATUS.documentado : ROTULO_STATUS[i.status]}</span></dt>
                  <dd>{i.texto}</dd>
                </div>
              ))}</dl>
            </div>
          )) : <p className="fx-vazio-l">A ficha não traz detalhes deste esmalte sobre o fenômeno além da associação acima.</p>}
          {itens.some((i) => i.status === 'nao-confirmado') && <p className="fx-origem">Itens não confirmados não têm fonte identificada e não são informação oficial.</p>}
          {fontes.length > 0 && <p className="fx-origem">Fontes: {fontes.map((u, i) => <span key={u}>{i > 0 && ', '}<a href={u} target="_blank" rel="noreferrer">{u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}</a></span>)}</p>}
        </section>
      </div>
    </Sheet>
  )
}
