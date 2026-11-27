import { Voltar } from '../../ui/Voltar'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { db, novo, type Compat, type DefeitoEsmalte, type Esmalte, type FonteGrupo, type Nivel, type OrigemDado, type PerfilEsmalte, type TecnicaEsmalte, type Verificacao } from '../../db/schema'
import { proximoCodigo } from '../../db/codigos'
import { useFamilias, useReceitas } from '../../db/hooks'
import { ATMOSFERAS, CONES, CORES, FLUIDEZ, STATUS, coneMaisProximo, tempDoCone } from '../../lib/opcoes'
import {
  ACABAMENTOS_FICHA, APLICACAO, ATRIBUTOS_COMPORTAMENTO, COMPAT, COMPORTAMENTOS_SUPERFICIE, DEFEITOS_FICHA, EXPRESSIVO, GEOMETRIAS, MASSAS, METODOS, NIVEIS,
  OPACIDADES, ORIGENS, PICTOGRAMAS, PREPARACAO, QUEIMA, QUEIMA_ANTIGA, SEGURANCA, TEXTURAS_FICHA, VERIFICACAO, VISUAL, texturasDe,
} from '../../lib/esmalteFicha'
import { AreaTexto, Campo, Escolha, Estrelas, Fotos, Multi, Numero, Sugestao, Tags, Texto } from '../../ui/form'
import { useToast } from '../../ui/toast'
import { criarReceita } from './Receitas'

/** Tira chaves vazias de um registro de textos (o que fica vazio não aparece na ficha). */
const limpo = (r: Record<string, string | undefined>) => Object.fromEntries(Object.entries(r).filter(([, v]) => v?.trim())) as Record<string, string>

/** Origem do grupo: de onde vêm estas informações (uma vez por grupo, não por linha). */
function OrigemCampo({ valor, onChange }: { valor?: FonteGrupo; onChange: (o: FonteGrupo | undefined) => void }) {
  const v = valor ?? {}
  const muda = (x: Partial<FonteGrupo>) => { const n = { ...v, ...x }; onChange(n.origem || n.fonte ? n : undefined) }
  return (
    <div className="fx-form-origem wide-row">
      <select className="input" value={v.origem ?? ''} onChange={(x) => muda({ origem: (x.target.value || undefined) as OrigemDado | undefined })} aria-label="Origem destas informações">
        <option value="">Origem: não informada</option>{(Object.keys(ORIGENS) as OrigemDado[]).map((k) => <option key={k} value={k}>Origem: {ORIGENS[k]}</option>)}
      </select>
      <input className="input" placeholder="Link da fonte (opcional)" value={v.fonte ?? ''} onChange={(x) => muda({ fonte: x.target.value || undefined })} />
      <input className="input" type="date" value={v.data ?? ''} onChange={(x) => muda({ data: x.target.value || undefined })} aria-label="Data da consulta" />
    </div>
  )
}

const DICA_QUEIMA: Record<string, string> = {
  faixa: 'Ex.: cone 06–05, 999 a 1031 °C', conesAlternativos: 'Ex.: 05, 04', curva: 'Ex.: rápida, média, lenta', aquecimento: 'Ex.: 150 °C/h',
  patamar: 'Ex.: 15 min', resfriamento: 'Ex.: 100 °C/h até 760 °C', resfriamentoControlado: 'Ex.: sim, 50 °C/h',
}

const VAZIO: Omit<Esmalte, 'id' | 'criadoEm' | 'atualizadoEm'> = { nome: '', codigo: '', fotos: [], origem: 'propria', familias: [], tags: [] }

export default function EsmalteForm() {
  const { id } = useParams()
  const nav = useNavigate()
  const toast = useToast()
  const familias = useFamilias()
  const receitas = useReceitas()
  const [e, setE] = useState<typeof VAZIO & { id?: string }>(VAZIO)
  const [pronto, setPronto] = useState(false)
  const [abertos, setAbertos] = useState<string[]>([])

  useEffect(() => {
    (async () => {
      if (id) { const x = await db.esmaltes.get(id); if (x) setE(x) }
      else setE({ ...VAZIO, codigo: await proximoCodigo('E', 'esmaltes', 3) })
      setPronto(true)
    })()
  }, [id])

  const set = <K extends keyof Esmalte>(k: K) => (v: Esmalte[K]) => setE((x) => ({ ...x, [k]: v }))
  const perfil: PerfilEsmalte = e.perfil ?? {}
  const tec: TecnicaEsmalte = e.tecnica ?? {}
  const setPerfil = (x: Partial<PerfilEsmalte>) => setE((y) => ({ ...y, perfil: { ...y.perfil, ...x } }))
  const setTec = (x: Partial<TecnicaEsmalte>) => setE((y) => ({ ...y, tecnica: { ...y.tecnica, ...x } }))

  async function salvar() {
    if (!e.nome.trim()) { toast('Dê um nome ao esmalte'); return }
    if (e.id) {
      // fluidez do fabricante e testes de fluidez são editados na ficha (e a consulta pode terminar enquanto este formulário está aberto)
      const atual = await db.esmaltes.get(e.id)
      await db.esmaltes.put({ ...(e as Esmalte), fluidezQueima: atual?.fluidezQueima, testesFluidez: atual?.testesFluidez, atualizadoEm: Date.now() })
      nav(`/esmaltes/${e.id}`, { replace: true })
    } else {
      const x = novo({ ...e, nome: e.nome.trim() })
      // formulação própria já nasce com a fórmula ligada
      if (!x.receitaId && x.origem === 'propria') x.receitaId = await criarReceita({ nome: x.nome, esmalteId: x.id, familias: x.familias })
      await db.esmaltes.add(x)
      if (x.receitaId) await db.receitas.update(x.receitaId, { esmalteId: x.id })
      nav(`/esmaltes/${x.id}`, { replace: true })
    }
    toast('Esmalte salvo')
  }

  if (!pronto) return null
  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <Voltar to={e.id ? `/esmaltes/${e.id}` : '/esmaltes'}>Voltar</Voltar>
      <p className="eyebrow">{e.id ? 'Editar esmalte' : 'Novo esmalte'}</p>
      <h1 style={{ marginTop: 8, marginBottom: 28 }}>{e.nome || 'Sem nome'}</h1>

      <nav className="fx-form-nav">{[['ed-id', 'Identificação'], ['ed-perfil', 'Perfil'], ['ed-tecnica', 'Técnica'], ['ed-exp', 'Experimentos'], ['ed-doc', 'Documentação']].map(([k, l]) => <a key={k} href={'#' + k} onClick={(x) => { x.preventDefault(); document.getElementById(k)?.scrollIntoView({ behavior: 'smooth' }) }}>{l}</a>)}</nav>

      <div className="form">
        <h3 id="ed-id">Identificação</h3>
        <Campo label="É um esmalte comercial ou uma fórmula sua?" wide><Escolha value={e.origem} onChange={set('origem')} opcoes={[{ v: 'propria', l: 'Minha fórmula' }, { v: 'comercial', l: 'Comercial' }]} /></Campo>
        <Campo label="Fotografias" wide><Fotos value={e.fotos} onChange={set('fotos')} /></Campo>
        <Campo label="Nome"><Texto value={e.nome} onChange={set('nome')} autoFocus={!e.id} /></Campo>
        <Campo label="Código interno"><Texto value={e.codigo} onChange={set('codigo')} /></Campo>
        <Campo label={e.origem === 'comercial' ? 'Fabricante' : 'Autoria'}><Texto value={e.autoria} onChange={set('autoria')} /></Campo>
        <Campo label="Função"><Texto value={e.funcao} onChange={set('funcao')} placeholder="Ex.: fundente, base, cobertura, efeito" /></Campo>
        <Campo label="Famílias (pode escolher várias)" wide><Multi value={e.familias} onChange={set('familias')} opcoes={familias.map((f) => ({ v: f.id, l: f.nome }))} /></Campo>
        <Campo label="Descrição curta (até três linhas na ficha)" wide><AreaTexto value={e.descricao} onChange={set('descricao')} rows={3} /></Campo>

        <h3 id="ed-perfil">Perfil · identidade visual</h3>
        <Campo label="Cor predominante"><Sugestao id="cores" value={e.cor} onChange={set('cor')} opcoes={CORES} /></Campo>
        <Campo label="Amostra de cor (referência aproximada)">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input type="color" value={e.corHex ?? '#CBAB8F'} onChange={(x) => set('corHex')(x.target.value)} style={{ width: 46, height: 46, border: 0, background: 'none', padding: 0 }} />
            {e.corHex && <button type="button" className="btn sm ghost" onClick={() => set('corHex')(undefined)}>Tirar</button>}
          </div>
        </Campo>
        {VISUAL.map(([k, l]) => <Campo key={k} label={l}><Texto value={perfil.visual?.[k]} onChange={(v) => setPerfil({ visual: limpo({ ...perfil.visual, [k]: v }) })} /></Campo>)}
        <Campo label="Acabamento" wide><Escolha value={e.acabamento} onChange={(v) => set('acabamento')(v === e.acabamento ? undefined : v)} opcoes={[...ACABAMENTOS_FICHA, ...(e.acabamento && !(ACABAMENTOS_FICHA as readonly string[]).includes(e.acabamento) ? [e.acabamento] : [])].map((v) => ({ v, l: v }))} /></Campo>
        <Campo label="Opacidade" wide><Escolha value={e.transparencia} onChange={(v) => set('transparencia')(v === e.transparencia ? undefined : v)} opcoes={OPACIDADES.map((v) => ({ v, l: v }))} /></Campo>
        <Campo label="Textura (pode marcar várias)" wide><Multi value={texturasDe(e)} onChange={(v) => set('textura')(v.join(', ') || undefined)} opcoes={[...new Set([...TEXTURAS_FICHA, ...texturasDe(e)])].map((v) => ({ v, l: v }))} /></Campo>
        <OrigemCampo valor={perfil.origens?.visual} onChange={(o) => setPerfil({ origens: { ...perfil.origens, visual: o } })} />

        <h3>Perfil · comportamento</h3>
        <p className="faint wide-row" style={{ fontSize: 13 }}>Marque só o que foi observado ou informado. O que ficar sem marcação não aparece na ficha.</p>
        {ATRIBUTOS_COMPORTAMENTO.map(([k, l]) => <Campo key={k} label={l} wide>
          <Escolha value={perfil.comportamento?.[k] ? String(perfil.comportamento[k]) : undefined}
            onChange={(v) => { const c = { ...perfil.comportamento }; if (c[k] === Number(v)) delete c[k]; else c[k] = Number(v) as Nivel; setPerfil({ comportamento: c }) }}
            opcoes={([1, 2, 3, 4, 5] as Nivel[]).map((n) => ({ v: String(n), l: NIVEIS[n] }))} />
          {(perfil.comportamento?.[k] || perfil.comportamentoNota?.[k] || perfil.comportamentoOrigem?.[k] || perfil.comportamentoClasse?.[k]) || abertos.includes(k) ? <div className="fx-form-ind">
            <select className="input" value={perfil.comportamentoOrigem?.[k] ?? ''} aria-label="De quem é esta classificação"
              onChange={(x) => { const c = { ...perfil.comportamentoOrigem }; if (x.target.value) c[k] = x.target.value as OrigemDado; else delete c[k]; setPerfil({ comportamentoOrigem: c }) }}>
              <option value="">Classificação de: —</option>{(Object.keys(ORIGENS) as OrigemDado[]).map((o) => <option key={o} value={o}>{ORIGENS[o]}</option>)}
            </select>
            <input className="input" placeholder="Classificação curta sem nível (ex.: Variável)" value={perfil.comportamentoClasse?.[k] ?? ''} onChange={(x) => setPerfil({ comportamentoClasse: limpo({ ...perfil.comportamentoClasse, [k]: x.target.value }) })} />
            <textarea className="input wide-row" rows={2} placeholder="Explicação técnica" value={perfil.comportamentoNota?.[k] ?? ''} onChange={(x) => setPerfil({ comportamentoNota: limpo({ ...perfil.comportamentoNota, [k]: x.target.value }) })} />
            <input className="input wide-row" placeholder="Condições de validade (cone, aplicação, sobreposição…)" value={perfil.comportamentoCondicoes?.[k] ?? ''} onChange={(x) => setPerfil({ comportamentoCondicoes: limpo({ ...perfil.comportamentoCondicoes, [k]: x.target.value }) })} />
          </div> : <button type="button" className="fx-link" onClick={() => setAbertos([...abertos, k])}>Descrever, citar fonte ou condições</button>}
        </Campo>)}
        <OrigemCampo valor={perfil.origens?.comportamento} onChange={(o) => setPerfil({ origens: { ...perfil.origens, comportamento: o } })} />

        <h3>Perfil · comportamentos identificados</h3>
        <p className="faint wide-row" style={{ fontSize: 13 }}>Aparecem como pictogramas na ficha. Marque só o que foi informado ou observado; alguns já saem da superfície, da opacidade e da textura.</p>
        <Campo label="Comportamentos" wide><Multi value={perfil.efeitos ?? []} onChange={(v) => setPerfil({ efeitos: v.length ? v : undefined })} opcoes={PICTOGRAMAS.map(([v, l]) => ({ v, l }))} /></Campo>

        <h3>Perfil · comportamento sobre a superfície</h3>
        {GEOMETRIAS.map(([k, l]) => <Campo key={k} label={l} wide><Multi value={perfil.superficie?.[k] ?? []} onChange={(v) => { const x = { ...perfil.superficie, [k]: v }; if (!v.length) delete x[k]; setPerfil({ superficie: x }) }} opcoes={COMPORTAMENTOS_SUPERFICIE.map((v) => ({ v, l: v }))} /></Campo>)}
        <OrigemCampo valor={perfil.origens?.superficie} onChange={(o) => setPerfil({ origens: { ...perfil.origens, superficie: o } })} />

        <h3>Perfil · possibilidades expressivas</h3>
        <Campo label="Adequado para (comprovado)" wide><Multi value={perfil.expressivo ?? []} onChange={(v) => setPerfil({ expressivo: v })} opcoes={EXPRESSIVO.map((v) => ({ v, l: v }))} /></Campo>
        <Campo label="Descrição" wide><AreaTexto value={perfil.expressivoTexto} onChange={(v) => setPerfil({ expressivoTexto: v || undefined })} rows={3} /></Campo>
        <Campo label="Sugestões criativas da IA (ficam separadas)" wide><AreaTexto value={perfil.sugestoesIA} onChange={(v) => setPerfil({ sugestoesIA: v || undefined })} rows={2} /></Campo>
        <OrigemCampo valor={perfil.origens?.expressivo} onChange={(o) => setPerfil({ origens: { ...perfil.origens, expressivo: o } })} />

        <h3 id="ed-tecnica">Técnica · preparação</h3>
        {PREPARACAO.map(([k, l]) => <Campo key={k} label={l}><Texto value={tec.preparacao?.[k]} onChange={(v) => setTec({ preparacao: limpo({ ...tec.preparacao, [k]: v }) })} /></Campo>)}
        <Campo label="Viscosidade do esmalte líquido (antes de aplicar)" wide><Texto value={e.viscosidade} onChange={set('viscosidade')} placeholder="Ex.: cremoso, ralo; densidade 1,45 g/ml" /></Campo>
        <OrigemCampo valor={tec.origens?.preparacao} onChange={(o) => setTec({ origens: { ...tec.origens, preparacao: o } })} />

        <h3>Técnica · aplicação</h3>
        <Campo label="Métodos recomendados" wide><Multi value={tec.metodos ?? []} onChange={(v) => setTec({ metodos: v })} opcoes={[...new Set([...METODOS, ...(tec.metodos ?? [])])].map((v) => ({ v, l: v }))} /></Campo>
        {APLICACAO.map(([k, l]) => <Campo key={k} label={l}><Texto value={tec.aplicacao?.[k]} onChange={(v) => setTec({ aplicacao: limpo({ ...tec.aplicacao, [k]: v }) })} /></Campo>)}
        <Campo label="Recomendação de aplicação (texto)" wide><AreaTexto value={e.aplicacao} onChange={(v) => set('aplicacao')(v || undefined)} rows={3} /></Campo>
        <OrigemCampo valor={tec.origens?.aplicacao} onChange={(o) => setTec({ origens: { ...tec.origens, aplicacao: o } })} />

        <h3>Técnica · fluidez</h3>
        <Campo label={e.origem === 'comercial' ? 'Fluidez na queima · sua avaliação (a do fabricante fica na ficha)' : 'Fluidez na queima · sua avaliação'} wide><Escolha value={e.fluidez} onChange={(v) => set('fluidez')(v === e.fluidez ? undefined : v)} opcoes={FLUIDEZ.map((v) => ({ v, l: v }))} /></Campo>

        <h3>Técnica · queima</h3>
        <Campo label="Temperatura de referência (°C)"><Numero value={e.temperatura} onChange={(t) => setE((x) => ({ ...x, temperatura: t, cone: x.cone || coneMaisProximo(t) }))} /></Campo>
        <Campo label="Cone pirométrico recomendado">
          <select className="input" value={e.cone ?? ''} onChange={(x) => setE((y) => ({ ...y, cone: x.target.value || undefined, temperatura: y.temperatura ?? tempDoCone(x.target.value) }))}>
            <option value="">—</option>{[...(e.cone && !CONES.some((c) => c.cone === e.cone) ? [{ cone: e.cone, c: '' }] : []), ...CONES].map((c) => <option key={c.cone} value={c.cone}>Cone {c.cone}{c.c ? ` · ${c.c} °C` : ''}</option>)}
          </select>
        </Campo>
        <Campo label="Atmosfera" wide><Escolha value={e.atmosfera} onChange={(v) => set('atmosfera')(v === e.atmosfera ? undefined : v)} opcoes={ATMOSFERAS.map((v) => ({ v, l: v }))} /></Campo>
        {[...QUEIMA, ...QUEIMA_ANTIGA.filter(([k]) => tec.queima?.[k])].map(([k, l]) => <Campo key={k} label={l} wide={k === 'notas' || k === 'alternativas'}>{k === 'notas' || k === 'alternativas'
          ? <AreaTexto value={tec.queima?.[k]} onChange={(v) => setTec({ queima: limpo({ ...tec.queima, [k]: v }) })} rows={2} />
          : <Texto value={tec.queima?.[k]} onChange={(v) => setTec({ queima: limpo({ ...tec.queima, [k]: v }) })} placeholder={DICA_QUEIMA[k]} />}</Campo>)}
        <OrigemCampo valor={tec.origens?.queima} onChange={(o) => setTec({ origens: { ...tec.origens, queima: o } })} />

        <h3>Técnica · compatibilidade</h3>
        {MASSAS.map(([k, l]) => <Campo key={k} label={l} wide><Escolha value={tec.compatibilidade?.[k]} onChange={(v) => { const c = { ...tec.compatibilidade }; if (c[k] === v) delete c[k]; else c[k] = v; setTec({ compatibilidade: c }) }} opcoes={(Object.keys(COMPAT) as Compat[]).map((v) => ({ v, l: COMPAT[v] }))} /></Campo>)}
        <Campo label="Notas de compatibilidade (inclui massas suas)" wide><AreaTexto value={tec.compatNotas} onChange={(v) => setTec({ compatNotas: v || undefined })} rows={2} /></Campo>
        <OrigemCampo valor={tec.origens?.compatibilidade} onChange={(o) => setTec({ origens: { ...tec.origens, compatibilidade: o } })} />

        <h3>Técnica · segurança e uso</h3>
        {SEGURANCA.map(([k, l]) => <Campo key={k} label={l} wide><Escolha value={tec.seguranca?.[k]} onChange={(v) => { const c = { ...tec.seguranca }; if (c[k] === v) delete c[k]; else c[k] = v; setTec({ seguranca: c }) }} opcoes={(Object.keys(VERIFICACAO) as Verificacao[]).map((v) => ({ v, l: VERIFICACAO[v] }))} />
          {tec.seguranca?.[k] && <input className="input fx-form-cond" placeholder="Condições do fabricante (como ele escreve)" value={tec.segurancaCondicoes?.[k] ?? ''} onChange={(x) => setTec({ segurancaCondicoes: limpo({ ...tec.segurancaCondicoes, [k]: x.target.value }) })} />}</Campo>)}
        <Campo label="Uso em louça (resumo usado nos filtros)" wide><Escolha value={e.louca} onChange={set('louca')} opcoes={[{ v: 'sim', l: 'Pode ir à louça' }, { v: 'nao', l: 'Só decorativo' }, { v: 'testar', l: 'Só após teste' }]} /></Campo>
        <Campo label="Restrições e notas de segurança" wide><AreaTexto value={tec.segurancaNotas} onChange={(v) => setTec({ segurancaNotas: v || undefined })} rows={2} /></Campo>
        <OrigemCampo valor={tec.origens?.seguranca} onChange={(o) => setTec({ origens: { ...tec.origens, seguranca: o } })} />

        <h3>Técnica · alertas</h3>
        <Campo label="Cuidados específicos (um por linha; aparecem no topo da ficha)" wide><AreaTexto value={(tec.alertas ?? []).join('\n')} onChange={(v) => setTec({ alertas: v.split('\n').map((x) => x.trim()).filter(Boolean) })} rows={2} /></Campo>

        <h3>Técnica · defeitos e cuidados</h3>
        {(tec.defeitos ?? []).map((d, i) => {
          const muda = (x: Partial<DefeitoEsmalte>) => setTec({ defeitos: tec.defeitos!.map((y, j) => (j === i ? { ...y, ...x } : y)) })
          return <div key={i} className="fx-form-def wide-row">
            <Campo label="Defeito ou efeito"><Sugestao id={'def' + i} value={d.tipo} onChange={(v) => muda({ tipo: v })} opcoes={DEFEITOS_FICHA} /></Campo>
            <Campo label="Tipo" wide><Escolha value={d.intencional ? 's' : 'n'} onChange={(v) => muda({ intencional: v === 's' })} opcoes={[{ v: 'n', l: 'Defeito indesejado' }, { v: 's', l: 'Efeito intencional' }]} /></Campo>
            <Campo label="Possível causa"><Texto value={d.causa} onChange={(v) => muda({ causa: v || undefined })} /></Campo>
            <Campo label="Solução"><Texto value={d.solucao} onChange={(v) => muda({ solucao: v || undefined })} /></Campo>
            <label className="fx-check"><input type="checkbox" checked={!!d.hipotese} onChange={(x) => muda({ hipotese: x.target.checked })} />Causa e solução são hipóteses</label>
            <button type="button" className="btn sm ghost" onClick={() => setTec({ defeitos: tec.defeitos!.filter((_, j) => j !== i) })}>Remover</button>
          </div>
        })}
        <div className="wide-row"><button type="button" className="btn sm" onClick={() => setTec({ defeitos: [...(tec.defeitos ?? []), { tipo: '' }] })}>Registrar defeito ou efeito</button></div>

        <h3 id="ed-exp">Experimentos</h3>
        <Campo label="Observações pessoais" wide><AreaTexto value={e.notasPessoais} onChange={(v) => set('notasPessoais')(v || undefined)} rows={4} /></Campo>
        <Campo label="Status de desenvolvimento"><select className="input" value={e.status ?? ''} onChange={(x) => set('status')(x.target.value || undefined)}><option value="">—</option>{STATUS.map((s) => <option key={s}>{s}</option>)}</select></Campo>
        <Campo label="Avaliação pessoal"><Estrelas value={e.avaliacao} onChange={set('avaliacao')} tamanho={24} /></Campo>

        <h3 id="ed-doc">Documentação</h3>
        <Campo label="Receita vinculada">
          <select className="input" value={e.receitaId ?? ''} onChange={(x) => set('receitaId')(x.target.value || undefined)}>
            <option value="">Nenhuma</option>{(receitas ?? []).map((r) => <option key={r.id} value={r.id}>{r.nome} (v{r.versaoAtual})</option>)}
          </select>
        </Campo>
        <Campo label="Fonte da receita"><Texto value={e.fonteReceita} onChange={set('fonteReceita')} placeholder="Livro, site, colega…" /></Campo>
        <Campo label="Tags"><Tags value={e.tags} onChange={set('tags')} /></Campo>
        <Campo label={e.origem === 'comercial' ? 'Documentação do fabricante e observações' : 'Observações'} wide><AreaTexto value={e.observacoes} onChange={set('observacoes')} rows={8} /></Campo>
      </div>

      <div className="barra-salvar">
        <button className="btn ghost" onClick={() => nav(-1)}>Cancelar</button>
        <button className="btn primary" onClick={salvar}>Salvar esmalte</button>
      </div>
    </div>
  )
}
