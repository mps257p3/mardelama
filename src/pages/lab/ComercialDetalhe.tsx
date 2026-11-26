import { useState } from 'react'
import { incluidoEm } from '../../lib/data'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, Sparkles, Trash2 } from 'lucide-react'
import { pesquisarEstudo } from '../../lib/comercial'
import { useToast } from '../../ui/toast'
import { db, type Comercial, type Receita } from '../../db/schema'
import { useFamilias } from '../../db/hooks'
import { TextoEditavel, ListaEditavel } from '../../ui/editavel'
import { Fotos, Multi } from '../../ui/form'
import { Relacoes } from '../../ui/Relacoes'

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
      <div style={{ margin: '12px 0 20px' }}><Fotos value={c.fotos} onChange={(v) => salvar({ fotos: v })} /></div>
      <p className="eyebrow">{[c.fabricante, c.codigo, c.serie].filter(Boolean).join(' · ')}</p>
      <h1 style={{ marginTop: 8 }}>{c.nome}</h1>
      <p className="faint" style={{ fontSize: 13, marginTop: 4 }}>{maiusc(incluidoEm(c.criadoEm))}</p>
      {c.temperatura && <p className="muted" style={{ marginTop: 6 }}>{c.temperatura}</p>}
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

      <ReceitasDeTeste id={c.id} />

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

/** Receitas ligadas ao estudo, mostradas inteiras: ingredientes em 100 g, parâmetros e preparo. */
function ReceitasDeTeste({ id }: { id: string }) {
  const rs = useLiveQuery(async () => {
    const [a, b] = await Promise.all([
      db.relacoes.where('[aTipo+aId]').equals(['comercial', id]).toArray(),
      db.relacoes.where('[bTipo+bId]').equals(['comercial', id]).toArray(),
    ])
    const ids = [...a.filter((r) => !r.excluido && r.bTipo === 'receita').map((r) => r.bId), ...b.filter((r) => !r.excluido && r.aTipo === 'receita').map((r) => r.aId)]
    const xs = await db.receitas.bulkGet([...new Set(ids)])
    return xs.filter((x): x is Receita => !!x && !x.excluido)
  }, [id], [])
  if (!rs.length) return null
  return (
    <>
      {rs.map((r) => {
        const base = r.ingredientes.filter((i) => i.classe === 'base')
        const extra = r.ingredientes.filter((i) => i.classe !== 'base')
        const soma = base.reduce((t, i) => t + i.percentual, 0)
        const linha = (i: Receita['ingredientes'][number], k: number) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '7px 0', borderBottom: '1px solid var(--line)' }}>
            <span>{i.nome}</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{String(i.percentual).replace('.', ',')} g</span>
          </div>
        )
        return (
          <section key={r.id} className="card" style={{ padding: 18, marginTop: 16 }}>
            <h3>Receita para testar</h3>
            <p className="faint" style={{ fontSize: 13, margin: '4px 0 12px' }}>{[r.codigo, r.status].filter(Boolean).join(' · ')}. Hipótese, não é a fórmula do fabricante.</p>
            <p className="eyebrow" style={{ marginTop: 4 }}>Base · {String(soma).replace('.', ',')} g</p>
            {base.map(linha)}
            {extra.length > 0 && <p className="eyebrow" style={{ marginTop: 14 }}>Somar à base</p>}
            {extra.map(linha)}
            {r.aguaMlPor100g && <p className="muted" style={{ fontSize: 14, marginTop: 10 }}>Água: cerca de {r.aguaMlPor100g} ml para cada 100 g de seco.</p>}
            {r.parametros && <><p className="eyebrow" style={{ marginTop: 16 }}>Variações e queima</p><p style={{ marginTop: 6, whiteSpace: 'pre-line' }}>{r.parametros}</p></>}
            {r.observacoes && <><p className="eyebrow" style={{ marginTop: 16 }}>Preparo e aplicação</p><p style={{ marginTop: 6, whiteSpace: 'pre-line' }}>{r.observacoes}</p></>}
            <Link to={`/receitas/${r.id}`} className="btn sm" style={{ marginTop: 14 }}>Abrir a receita</Link>
          </section>
        )
      })}
    </>
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
