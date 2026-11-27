import { useState } from 'react'
import { X } from 'lucide-react'
import type { Esmalte, OrigemDado } from '../../../db/schema'
import { ATRIBUTOS_COMPORTAMENTO, GEOMETRIAS, NIVEIS, ORIGENS, PICTOGRAMAS, texturasDe } from '../../../lib/esmalteFicha'
import { FENOMENOS } from '../../../lib/fenomenos'
import { Sheet } from '../../../ui/Sheet'
import { Ilustracao } from './Atlas'

const NOME = Object.fromEntries(PICTOGRAMAS)
const ATRIB = Object.fromEntries(ATRIBUTOS_COMPORTAMENTO)
const GEO = Object.fromEntries(GEOMETRIAS)

/** Um dado do esmalte ligado ao fenômeno, com a origem. `grupo` separa documentação, registros seus e IA. */
interface Item { rotulo: string; texto: string; origem?: string; fonte?: string; grupo: 'doc' | 'seu' | 'ia' }
const grupoDe = (o?: OrigemDado): Item['grupo'] => (o === 'experimento' || o === 'pessoal' ? 'seu' : o === 'ia' ? 'ia' : 'doc')

/**
 * O que a ficha deste esmalte diz sobre o fenômeno. Só dados registrados, cada um com a origem; nada é deduzido.
 * Sem dados, o painel mostra apenas a explicação geral.
 */
export function especificoDoFenomeno(e: Esmalte, tipo: string): Item[] {
  const fen = FENOMENOS[tipo]
  const p = e.perfil ?? {}
  const t = e.tecnica ?? {}
  const padrao: OrigemDado | undefined = e.origem === 'comercial' ? undefined : 'pessoal'
  const itens: Item[] = []
  const add = (rotulo: string, texto: string | undefined, o?: OrigemDado, fonte?: string) => {
    if (texto?.trim()) itens.push({ rotulo, texto: texto.trim(), origem: o ? ORIGENS[o] : undefined, fonte, grupo: grupoDe(o) })
  }
  for (const k of fen?.atributos ?? []) {
    const o = p.comportamentoOrigem?.[k] ?? p.origens?.comportamento?.origem ?? padrao
    const fonte = p.origens?.comportamento?.fonte
    const classe = p.comportamento?.[k] ? NIVEIS[p.comportamento[k]] : p.comportamentoClasse?.[k]
    const partes = [classe, p.comportamentoNota?.[k], p.comportamentoCondicoes?.[k] && `Condições: ${p.comportamentoCondicoes[k]}`].filter(Boolean)
    add(ATRIB[k] ?? k, partes.join('. ').replace(/\.\./g, '.'), o, fonte)
  }
  if (tipo === 'escorrimento') {
    const f = e.fluidezQueima
    if (f && f.situacao !== 'indisponivel') for (const r of f.resultados) {
      add(`Fabricante${r.cone ? ' · cone ' + r.cone.replace(/^cone\s*/i, '') : ''}`, [r.classificacao, r.comportamento].filter(Boolean).join('. '), 'fabricante', f.fontes?.[0])
    }
    for (const x of e.testesFluidez ?? []) add(`Teste de ${new Date(x.data + 'T12:00').toLocaleDateString('pt-BR')}`, [x.cone && 'cone ' + x.cone, x.escorrimentoMm != null && `${x.escorrimentoMm} mm de escorrimento`, x.observacoes].filter(Boolean).join(', '), 'experimento')
    for (const a of t.alertas ?? []) if (/escorr/i.test(a)) add('Cuidado', a, e.origem === 'comercial' ? (t.origens?.aplicacao?.origem ?? 'fabricante') : 'pessoal')
  }
  if (fen?.superficie) {
    for (const [g, vs] of Object.entries(p.superficie ?? {})) {
      const hit = vs.filter((v) => fen.superficie!.includes(v))
      if (hit.length) add(GEO[g] ?? g, hit.join(', '), p.origens?.superficie?.origem ?? padrao, p.origens?.superficie?.fonte)
    }
  }
  const vo = p.origens?.visual?.origem ?? padrao, vf = p.origens?.visual?.fonte
  if (tipo === 'variacaoEspessura') { add('Em camada fina', p.visual?.corFina, vo, vf); add('Em camada espessa', p.visual?.corEspessa, vo, vf) }
  if (tipo === 'acumulo') add('Nas áreas de acúmulo', p.visual?.corAcumulo, vo, vf)
  if (tipo === 'transparencia' && (e.transparencia === 'Transparente' || e.transparencia === 'Translúcido')) add('Opacidade', e.transparencia, vo, vf)
  const tx = texturasDe(e)
  const TX: Record<string, string[]> = { craquele: ['Craquelada'], cristalizacao: ['Cristalizada', 'Microcristalina'], reticulacao: ['Reticulada'], metalico: ['Metálica'], manchas: ['Pontilhada'], textura: ['Rugosa', 'Granulada', 'Enrugada', 'Espumada'] }
  const txs = tx.filter((x) => TX[tipo]?.includes(x))
  if (txs.length) add('Textura registrada', txs.join(', '), vo, vf)
  if (tipo === 'metalico' && e.acabamento === 'Metálico') add('Acabamento', e.acabamento, vo, vf)
  if (tipo === 'sobreposicao' && t.metodos?.includes('Sobreposição')) add('Método de aplicação', 'Indicado para sobreposição', t.origens?.aplicacao?.origem ?? padrao, t.origens?.aplicacao?.fonte)
  if (tipo === 'sobreposicao' || tipo === 'reatividade') add('Combinações', t.segurancaCondicoes?.combinacoes, t.origens?.seguranca?.origem ?? padrao, t.origens?.seguranca?.fonte)
  if (fen?.defeitos) for (const d of t.defeitos ?? []) if (fen.defeitos.test(d.tipo)) {
    const o = t.origens?.defeitos?.origem ?? padrao
    add(d.intencional ? 'Efeito intencional' : 'Defeito registrado', [d.tipo, d.causa && `Causa${d.hipotese ? ' (hipótese)' : ''}: ${d.causa}`, d.solucao && `Solução${d.hipotese ? ' (hipótese)' : ''}: ${d.solucao}`].filter(Boolean).join('. '), o)
  }
  if (p.efeitos?.includes(tipo) && !itens.length) add('Registro na ficha', 'Efeito marcado na ficha deste esmalte, sem descrição adicional.', p.origens?.expressivo?.origem ?? padrao)
  return itens
}

/** Seção de efeitos: grade editorial de ilustrações; cada uma abre o painel com a explicação. */
export function AtlasEfeitos({ e, tipos }: { e: Esmalte; tipos: string[] }) {
  const [aberto, setAberto] = useState<string>()
  if (!tipos.length) return null
  return (
    <>
      <ul className={'fx-atlas' + (tipos.length <= 2 ? ' poucos' : '')}>
        {tipos.map((t) => (
          <li key={t}>
            <button className="fx-atlas-b" onClick={() => setAberto(t)} aria-label={`${NOME[t] ?? t}: ver explicação`}>
              <Ilustracao tipo={t} titulo={NOME[t]} />
              <span>{NOME[t] ?? t}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="fx-atlas-leg">Representações esquemáticas dos fenômenos cerâmicos.</p>
      {aberto && <PainelFenomeno e={e} tipo={aberto} onClose={() => setAberto(undefined)} />}
    </>
  )
}

function PainelFenomeno({ e, tipo, onClose }: { e: Esmalte; tipo: string; onClose: () => void }) {
  const fen = FENOMENOS[tipo]
  const itens = especificoDoFenomeno(e, tipo)
  const grupos: [Item['grupo'], string][] = [['doc', 'Documentado'], ['seu', 'Seus registros'], ['ia', 'Interpretação da IA']]
  const fontes = [...new Set(itens.map((i) => i.fonte).filter((x): x is string => !!x && /^https?:/.test(x)))]
  return (
    <Sheet onClose={onClose} label={fen?.nome ?? NOME[tipo] ?? tipo}>
      <div className="fx-fen">
        <div className="fx-fen-h"><h2>{fen?.nome ?? NOME[tipo]}</h2><button className="iconbtn" aria-label="Fechar" onClick={onClose}><X size={18} /></button></div>
        <figure className="fx-fen-fig"><Ilustracao tipo={tipo} titulo={fen?.nome} /><figcaption>Representação esquemática; não é resultado de teste nem previsão do esmalte.</figcaption></figure>
        {fen && <>
          <p className="fx-fen-def">{fen.definicao}</p>
          <h3>Como ocorre</h3><p className="fx-par">{fen.comoOcorre}</p>
          <h3>O que influencia</h3><ul className="fx-fen-lista">{fen.condicoes.map((c) => <li key={c}>{c}</li>)}</ul>
          <h3>Possibilidades artísticas</h3><p className="fx-par">{fen.exploracao}</p>
          <h3>Cuidados técnicos</h3><p className="fx-par">{fen.cuidados}</p>
        </>}
        <section className="fx-fen-esp">
          <h3>Neste esmalte · {e.nome}</h3>
          {itens.length ? grupos.filter(([g]) => itens.some((i) => i.grupo === g)).map(([g, l]) => (
            <div key={g} className={'fx-fen-g ' + g}>
              <p className="fx-rot">{l}</p>
              <dl className="fx-fontes-l">{itens.filter((i) => i.grupo === g).map((i, k) => (
                <div key={k}><dt>{i.rotulo}{i.origem && g === 'doc' && <span> · {i.origem}</span>}</dt><dd>{i.texto}</dd></div>
              ))}</dl>
              {g === 'ia' && <p className="fx-origem">Não é informação oficial nem resultado de teste.</p>}
            </div>
          )) : <p className="fx-vazio-l">Não há informações específicas deste esmalte sobre o fenômeno. Acima, apenas a explicação geral.</p>}
          {fontes.length > 0 && <p className="fx-origem">Fontes: {fontes.map((u, i) => <span key={u}>{i > 0 && ', '}<a href={u} target="_blank" rel="noreferrer">{u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}</a></span>)}</p>}
        </section>
      </div>
    </Sheet>
  )
}
