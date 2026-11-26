import { useState } from 'react'
import { incluidoEm } from '../../lib/data'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, Check, Sparkles, Trash2 } from 'lucide-react'
import { pesquisarEstudo } from '../../lib/comercial'
import { useToast } from '../../ui/toast'
import { db, uid, type Comercial, type Ingrediente, type Receita } from '../../db/schema'
import { useFamilias } from '../../db/hooks'
import { TextoEditavel, ListaEditavel } from '../../ui/editavel'
import { Multi } from '../../ui/form'
import { CapaFotos } from '../../ui/GaleriaFotos'
import { Relacoes } from '../../ui/Relacoes'
import { SeloLouca, loucaDoTexto } from '../../ui/Louca'

const maiusc = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export default function ComercialDetalhe() {
  const { id } = useParams()
  const nav = useNavigate()
  const c = useLiveQuery(() => db.comerciais.get(id!), [id])
  const curvas = useLiveQuery(async () => (await db.curvas.toArray()).filter((x) => !x.excluido).sort((a, b) => a.codigo.localeCompare(b.codigo)), [], [])
  const familias = useFamilias()
  const toast = useToast()
  const [pesquisando, setPesquisando] = useState(false)
  if (c === undefined) return null
  if (!c || c.excluido) return <div className="page"><p>Estudo não encontrado.</p></div>
  const salvar = (d: Partial<Comercial>) => db.comerciais.update(c.id, { ...d, atualizadoEm: Date.now() })
  const t = (k: 'fabricante' | 'nome' | 'codigo' | 'serie' | 'cone' | 'temperatura' | 'instrucoes' | 'documentacao' | 'confirmado' | 'observacoes') => (v: string) => salvar({ [k]: v || undefined })
  const curva = curvas.find((x) => x.id === c.curvaId)

  return (
    <div className="page" style={{ maxWidth: 860 }}>
      <Link to="/engenharia-reversa" className="back"><ArrowLeft size={15} />Engenharia reversa</Link>
      <div style={{ margin: '12px 0 20px' }}><CapaFotos fotos={c.fotos} onChange={(v) => salvar({ fotos: v })} alt={c.nome} rotuloAdd="Adicionar foto" /></div>
      <p className="eyebrow">{[c.fabricante, c.codigo, c.serie].filter(Boolean).join(' · ')}</p>
      <h1 style={{ marginTop: 8 }}>{c.nome}</h1>
      <p className="faint" style={{ fontSize: 13, marginTop: 4 }}>{maiusc(incluidoEm(c.criadoEm))}</p>
      <div className="linha-queima">
        {c.temperatura && <span className="t">{c.temperatura}</span>}
        <SeloLouca origem="fabricante" original valor={c.louca ?? loucaDoTexto([...(c.usos ?? []), ...c.declarados, c.instrucoes, c.observacoes])} onChange={(v) => salvar({ louca: v })} />
      </div>
      <div style={{ marginTop: 14 }}>
        <button className="btn" disabled={pesquisando} onClick={async () => {
          setPesquisando(true)
          try { await pesquisarEstudo(c.id); toast('Pesquisa pronta. Confira as fontes.') } catch (e) { toast('A pesquisa não deu certo: ' + (e as Error).message) } finally { setPesquisando(false) }
        }}><Sparkles size={15} />{pesquisando ? 'Pesquisando…' : 'Pesquisar com IA'}</button>
        {pesquisando && <p className="recebido-lendo" style={{ marginTop: 10 }}><Sparkles size={15} />Identificando o esmalte e procurando a ficha do fabricante… fique nesta tela, leva 1 ou 2 minutos.</p>}
      </div>
      <p className="aviso" style={{ marginTop: 16 }}>Estudo de referência. Hipóteses não são componentes confirmados, e nenhum resultado aqui indica segurança para contato com alimentos.</p>

      <section className="card" style={{ padding: 18, marginTop: 16 }}>
        <h3>Melhores usos e condições</h3>
        <p className="faint" style={{ fontSize: 13, margin: '4px 0 12px' }}>Em que peças, superfícies, queima e combinações o esmalte rende mais.</p>
        <ListaEditavel rotulo="uso ou condição" itens={c.usos ?? []} onSalvar={(v) => salvar({ usos: v })} vazio="Nada registrado. A pesquisa com IA preenche." />
      </section>

      <ReceitaDeTeste c={c} />

      <Bloco n="1" titulo="Declarado pelo fabricante" sub="Somente o que está no rótulo ou na embalagem.">
        <ListaEditavel rotulo="item declarado" itens={c.declarados} onSalvar={(v) => salvar({ declarados: v })} vazio="Nada declarado registrado." />
      </Bloco>
      <Bloco n="2" titulo="Documentação técnica" sub="Ficha técnica ou de segurança. Marque como preliminar enquanto não conferir a versão do produto.">
        <TextoEditavel rotulo="documentação" multilinha valor={c.documentacao} onSalvar={t('documentacao')} vazio="Sem documentação registrada." />
      </Bloco>
      <Bloco n="3" titulo="Hipóteses de composição" sub="Possíveis ingredientes a investigar. Não confirmados.">
        <ListaEditavel rotulo="hipótese" itens={c.hipoteses} onSalvar={(v) => salvar({ hipoteses: v })} vazio="Nenhuma hipótese." />
      </Bloco>
      <Bloco n="4" titulo="Confirmado por teste" sub="Só o que você reproduziu e verificou nas suas queimas.">
        <TextoEditavel rotulo="resultado confirmado" multilinha valor={c.confirmado} onSalvar={t('confirmado')} vazio="Nada confirmado ainda." />
      </Bloco>

      <div className="form" style={{ marginTop: 32 }}>
        <h3>Ficha</h3>
        <Campo rotulo="Fabricante"><TextoEditavel rotulo="fabricante" valor={c.fabricante} onSalvar={(v) => v && salvar({ fabricante: v })} /></Campo>
        <Campo rotulo="Nome"><TextoEditavel rotulo="nome" valor={c.nome} onSalvar={(v) => v && salvar({ nome: v })} /></Campo>
        <Campo rotulo="Código do produto"><TextoEditavel rotulo="código" valor={c.codigo} onSalvar={t('codigo')} /></Campo>
        <Campo rotulo="Série"><TextoEditavel rotulo="série" valor={c.serie} onSalvar={t('serie')} /></Campo>
        <Campo rotulo="Cone"><TextoEditavel rotulo="cone" valor={c.cone} onSalvar={t('cone')} /></Campo>
        <Campo rotulo="Temperatura"><TextoEditavel rotulo="temperatura" multilinha valor={c.temperatura} onSalvar={t('temperatura')} /></Campo>
        <Campo rotulo="Instruções e características"><TextoEditavel rotulo="instruções" multilinha valor={c.instrucoes} onSalvar={t('instrucoes')} /></Campo>
        <Campo rotulo="Famílias"><Multi value={c.familias} onChange={(v) => salvar({ familias: v })} opcoes={familias.map((f) => ({ v: f.id, l: f.codigo ? `${f.codigo} ${f.nome}` : f.nome }))} /></Campo>
        <Campo rotulo="Curva de queima">
          <select className="input" value={c.curvaId ?? ''} onChange={(e) => salvar({ curvaId: e.target.value || undefined })}>
            <option value="">Nenhuma</option>
            {curvas.map((x) => <option key={x.id} value={x.id}>{x.codigo} · {x.nome}</option>)}
          </select>
          {curva && <Link to={`/curvas/${curva.id}`} style={{ textDecoration: 'underline', fontSize: 13.5 }}>Abrir {curva.codigo}</Link>}
        </Campo>
        <Campo rotulo="Fontes"><ListaEditavel rotulo="fonte (link)" link itens={c.fontes} onSalvar={(v) => salvar({ fontes: v })} vazio="Nenhuma fonte." /></Campo>
        <Campo rotulo="Observações"><TextoEditavel rotulo="observações" multilinha valor={c.observacoes} onSalvar={t('observacoes')} /></Campo>
      </div>

      <div style={{ marginTop: 32 }}><Relacoes tipo="comercial" id={c.id} /></div>
      <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn sm ghost" onClick={async () => { if (confirm('Excluir este estudo?')) { await salvar({ excluido: 1 }); nav('/engenharia-reversa') } }}><Trash2 size={14} />Excluir estudo</button>
      </div>
    </div>
  )
}

/** Receita de teste do estudo (hipótese, em 100 g). Fica só aqui até o botão Aprovar copiar para Fórmulas. */
function ReceitaDeTeste({ c }: { c: Comercial }) {
  const nav = useNavigate()
  const r = c.receita
  const aprovada = useLiveQuery(async () => (r?.aprovadaId ? db.receitas.get(r.aprovadaId) : undefined), [r?.aprovadaId])
  if (!r) return null
  const base = r.ingredientes.filter((i) => i.classe === 'base')
  const extra = r.ingredientes.filter((i) => i.classe !== 'base')
  const soma = base.reduce((t, i) => t + i.percentual, 0)
  const g = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',') + ' g'
  const linha = (i: Ingrediente, k: number) => (
    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '7px 0', borderBottom: '1px solid var(--line)' }}>
      <span>{i.nome}</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{g(i.percentual)}</span>
    </div>
  )
  async function aprovar() {
    if (!r) return
    const agora = Date.now(), id = uid()
    const usos = c.usos?.length ? 'Melhores usos e condições:\n' + c.usos.map((u) => '• ' + u).join('\n') : ''
    const receita: Receita = {
      id, criadoEm: agora, atualizadoEm: agora, excluido: 0,
      nome: c.nome, codigo: r.codigo, familias: c.familias ?? [], status: 'Experimental — ainda não testada',
      objetivo: `Chegar perto do ${[c.fabricante, c.codigo, c.nome].filter(Boolean).join(' ')}.`,
      referencia: `Engenharia reversa de ${[c.fabricante, c.nome].filter(Boolean).join(' ')} (não é a fórmula do fabricante).`,
      fonte: c.fontes?.[0], parametros: r.parametros, curvaId: c.curvaId, tags: ['engenharia reversa'], versaoAtual: 1,
      ingredientes: r.ingredientes.map((i) => ({ ...i })), aguaMlPor100g: r.aguaMlPor100g,
      observacoes: [r.observacoes, usos, c.observacoes].filter(Boolean).join('\n\n'),
      temperatura: c.temperatura, louca: 'testar',
    }
    const { id: _i, ...snapshot } = receita
    await db.transaction('rw', db.receitas, db.versoes, db.relacoes, db.comerciais, async () => {
      await db.receitas.add(receita)
      await db.versoes.add({ id: uid(), receitaId: id, versao: 1, criadoEm: agora, nota: 'Aprovada a partir da engenharia reversa', snapshot })
      await db.relacoes.add({ id: uid(), aTipo: 'comercial', aId: c.id, bTipo: 'receita', bId: id, criadoEm: agora, atualizadoEm: agora, excluido: 0 })
      await db.comerciais.update(c.id, { receita: { ...r, aprovadaId: id }, atualizadoEm: agora })
    })
    nav(`/receitas/${id}`)
  }
  return (
    <section className="card" style={{ padding: 18, marginTop: 16 }}>
      <h3>Receita para testar</h3>
      <p className="faint" style={{ fontSize: 13, margin: '4px 0 12px' }}>{r.codigo ? r.codigo + ' · ' : ''}Hipótese, não é a fórmula do fabricante. Fica só aqui até você aprovar.</p>
      <p className="eyebrow" style={{ marginTop: 4 }}>Base · {g(soma)}</p>
      {base.map(linha)}
      {extra.length > 0 && <p className="eyebrow" style={{ marginTop: 14 }}>Somar à base</p>}
      {extra.map(linha)}
      {r.aguaMlPor100g && <p className="muted" style={{ fontSize: 14, marginTop: 10 }}>Água: cerca de {r.aguaMlPor100g} ml para cada 100 g de seco.</p>}
      {r.parametros && <><p className="eyebrow" style={{ marginTop: 16 }}>Variações e queima</p><p style={{ marginTop: 6, whiteSpace: 'pre-line' }}>{r.parametros}</p></>}
      {r.observacoes && <><p className="eyebrow" style={{ marginTop: 16 }}>Preparo e aplicação</p><p style={{ marginTop: 6, whiteSpace: 'pre-line' }}>{r.observacoes}</p></>}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
        {aprovada && !aprovada.excluido
          ? <Link to={`/receitas/${aprovada.id}`} className="btn"><Check size={15} />Aprovada · abrir em Fórmulas</Link>
          : <button className="btn primary" onClick={aprovar}><Check size={15} />Aprovar</button>}
      </div>
      <p className="aviso" style={{ marginTop: 14, fontSize: 13 }}><b>Sua receita não herda o selo da marca.</b> Ela não é a fórmula do fabricante, então só pode ir à louça depois de um teste de lixiviação na sua queima.</p>
      {!(aprovada && !aprovada.excluido) && <p className="faint" style={{ fontSize: 13, marginTop: 8 }}>Aprovar copia a receita, o preparo, os melhores usos e as observações para Fórmulas.</p>}
    </section>
  )
}

function Bloco({ n, titulo, sub, children }: { n: string; titulo: string; sub: string; children: React.ReactNode }) {
  return (
    <section className="card" style={{ padding: 18, marginTop: 16 }}>
      <p className="eyebrow">{n} de 4</p>
      <h3 style={{ marginTop: 4 }}>{titulo}</h3>
      <p className="faint" style={{ fontSize: 13, margin: '4px 0 12px' }}>{sub}</p>
      {children}
    </section>
  )
}
const Campo = ({ rotulo, children }: { rotulo: string; children: React.ReactNode }) => <div className="field"><label>{rotulo}</label>{children}</div>
