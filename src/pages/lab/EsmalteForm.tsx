import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { db, novo, type Esmalte } from '../../db/schema'
import { proximoCodigo } from '../../db/codigos'
import { useFamilias, useReceitas } from '../../db/hooks'
import { ACABAMENTOS, APLICACOES, ATMOSFERAS, CONES, CORES, FLUIDEZ, STATUS, TEXTURAS, TRANSPARENCIAS, coneMaisProximo, tempDoCone } from '../../lib/opcoes'
import { AreaTexto, Campo, Escolha, Estrelas, Fotos, Multi, Numero, Sugestao, Tags, Texto } from '../../ui/form'
import { useToast } from '../../ui/toast'
import { criarReceita } from './Receitas'

const VAZIO: Omit<Esmalte, 'id' | 'criadoEm' | 'atualizadoEm'> = { nome: '', codigo: '', fotos: [], origem: 'propria', familias: [], tags: [] }

export default function EsmalteForm() {
  const { id } = useParams()
  const nav = useNavigate()
  const toast = useToast()
  const familias = useFamilias()
  const receitas = useReceitas()
  const [e, setE] = useState<typeof VAZIO & { id?: string }>(VAZIO)
  const [pronto, setPronto] = useState(false)

  useEffect(() => {
    (async () => {
      if (id) { const x = await db.esmaltes.get(id); if (x) setE(x) }
      else setE({ ...VAZIO, codigo: await proximoCodigo('E', 'esmaltes', 3) })
      setPronto(true)
    })()
  }, [id])

  const set = <K extends keyof Esmalte>(k: K) => (v: Esmalte[K]) => setE((x) => ({ ...x, [k]: v }))

  async function salvar() {
    if (!e.nome.trim()) { toast('Dê um nome ao esmalte'); return }
    if (e.id) {
      await db.esmaltes.put({ ...(e as Esmalte), atualizadoEm: Date.now() })
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
      <Link to={e.id ? `/esmaltes/${e.id}` : '/esmaltes'} className="back"><ArrowLeft size={15} />Voltar</Link>
      <p className="eyebrow">{e.id ? 'Editar esmalte' : 'Novo esmalte'}</p>
      <h1 style={{ marginTop: 8, marginBottom: 28 }}>{e.nome || 'Sem nome'}</h1>

      <div className="form">
        <Campo label="É um esmalte comercial ou uma fórmula sua?" wide><Escolha value={e.origem} onChange={set('origem')} opcoes={[{ v: 'propria', l: 'Minha fórmula' }, { v: 'comercial', l: 'Comercial' }]} /></Campo>
        <Campo label="Fotografias" wide><Fotos value={e.fotos} onChange={set('fotos')} /></Campo>
        <Campo label="Nome"><Texto value={e.nome} onChange={set('nome')} autoFocus={!e.id} /></Campo>
        <Campo label="Código de identificação"><Texto value={e.codigo} onChange={set('codigo')} /></Campo>
        <Campo label={e.origem === 'comercial' ? 'Fabricante' : 'Autoria'}><Texto value={e.autoria} onChange={set('autoria')} /></Campo>
        <Campo label="Fonte da receita"><Texto value={e.fonteReceita} onChange={set('fonteReceita')} placeholder="Livro, site, colega…" /></Campo>
        <Campo label="Famílias (pode escolher várias)" wide><Multi value={e.familias} onChange={set('familias')} opcoes={familias.map((f) => ({ v: f.id, l: f.nome }))} /></Campo>

        <h3>Aparência</h3>
        <Campo label="Cor"><Sugestao id="cores" value={e.cor} onChange={set('cor')} opcoes={CORES} /></Campo>
        <Campo label="Tom de referência">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input type="color" value={e.corHex ?? '#CBAB8F'} onChange={(x) => set('corHex')(x.target.value)} style={{ width: 46, height: 46, border: 0, background: 'none', padding: 0 }} />
            <span className="faint" style={{ fontSize: 13 }}>Usado quando não há foto</span>
          </div>
        </Campo>
        <Campo label="Acabamento" wide><Escolha value={e.acabamento} onChange={set('acabamento')} opcoes={ACABAMENTOS.map((v) => ({ v, l: v }))} /></Campo>
        <Campo label="Textura" wide><Escolha value={e.textura} onChange={set('textura')} opcoes={TEXTURAS.map((v) => ({ v, l: v }))} /></Campo>
        <Campo label="Transparência" wide><Escolha value={e.transparencia} onChange={set('transparencia')} opcoes={TRANSPARENCIAS.map((v) => ({ v, l: v }))} /></Campo>

        <h3>Queima e aplicação</h3>
        <Campo label="Temperatura de queima (°C)"><Numero value={e.temperatura} onChange={(t) => setE((x) => ({ ...x, temperatura: t, cone: x.cone || coneMaisProximo(t) }))} /></Campo>
        <Campo label="Cone pirométrico">
          <select className="input" value={e.cone ?? ''} onChange={(x) => setE((y) => ({ ...y, cone: x.target.value || undefined, temperatura: y.temperatura ?? tempDoCone(x.target.value) }))}>
            <option value="">—</option>{CONES.map((c) => <option key={c.cone} value={c.cone}>Cone {c.cone} · {c.c} °C</option>)}
          </select>
        </Campo>
        <Campo label="Atmosfera" wide><Escolha value={e.atmosfera} onChange={set('atmosfera')} opcoes={ATMOSFERAS.map((v) => ({ v, l: v }))} /></Campo>
        <Campo label="Fluidez" wide><Escolha value={e.fluidez} onChange={set('fluidez')} opcoes={FLUIDEZ.map((v) => ({ v, l: v }))} /></Campo>
        <Campo label="Método de aplicação" wide><Escolha value={e.aplicacao} onChange={set('aplicacao')} opcoes={APLICACOES.map((v) => ({ v, l: v }))} /></Campo>

        <h3>Receita e desenvolvimento</h3>
        <Campo label="Receita vinculada">
          <select className="input" value={e.receitaId ?? ''} onChange={(x) => set('receitaId')(x.target.value || undefined)}>
            <option value="">Nenhuma</option>{(receitas ?? []).map((r) => <option key={r.id} value={r.id}>{r.nome} (v{r.versaoAtual})</option>)}
          </select>
        </Campo>
        <Campo label="Status de desenvolvimento"><select className="input" value={e.status ?? ''} onChange={(x) => set('status')(x.target.value || undefined)}><option value="">—</option>{STATUS.map((s) => <option key={s}>{s}</option>)}</select></Campo>
        <Campo label="Avaliação pessoal"><Estrelas value={e.avaliacao} onChange={set('avaliacao')} tamanho={24} /></Campo>
        <Campo label="Tags"><Tags value={e.tags} onChange={set('tags')} /></Campo>
        <Campo label="Observações" wide><AreaTexto value={e.observacoes} onChange={set('observacoes')} rows={5} /></Campo>
      </div>

      <div className="barra-salvar">
        <button className="btn ghost" onClick={() => nav(-1)}>Cancelar</button>
        <button className="btn primary" onClick={salvar}>Salvar esmalte</button>
      </div>
    </div>
  )
}
