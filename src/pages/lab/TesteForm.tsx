import { Voltar } from '../../ui/Voltar'
import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'

import { db, novo, type Teste } from '../../db/schema'
import { proximoCodigo } from '../../db/codigos'
import { useEsmaltes, useReceitas } from '../../db/hooks'
import { APLICACOES, ARGILAS, CONES, DEFEITOS, coneMaisProximo, tempDoCone } from '../../lib/opcoes'
import { AreaTexto, Campo, Escolha, Estrelas, Fotos, Multi, Numero, Sugestao, Texto } from '../../ui/form'
import { useToast } from '../../ui/toast'

type T = Omit<Teste, 'id' | 'criadoEm' | 'atualizadoEm'> & { id?: string }

export default function TesteForm() {
  const { id } = useParams()
  const [sp] = useSearchParams()
  const nav = useNavigate()
  const toast = useToast()
  const esmaltes = useEsmaltes()
  const receitas = useReceitas()
  const [t, setT] = useState<T>()
  const versoes = useLiveQuery(async () => (t?.receitaId ? db.versoes.where('receitaId').equals(t.receitaId).toArray() : []), [t?.receitaId], [])

  useEffect(() => {
    (async () => {
      if (id) { setT(await db.testes.get(id)); return }
      const esmalteId = sp.get('esmalte') ?? undefined
      const e = esmalteId ? await db.esmaltes.get(esmalteId) : undefined
      const receitaParam = sp.get('receita')
      const r = receitaParam ? await db.receitas.get(receitaParam) : e?.receitaId ? await db.receitas.get(e.receitaId) : undefined
      setT({
        codigo: await proximoCodigo('T', 'testes', 4), fotos: [], data: new Date().toISOString().slice(0, 10),
        esmalteId: esmalteId ?? r?.esmalteId, receitaId: r?.id, receitaVersao: r?.versaoAtual, temperatura: e?.temperatura, cone: e?.cone, aplicacao: e?.aplicacao, camadas: 2, defeitos: [], combinacao: [],
      })
    })()
  }, [id, sp])

  if (!t) return null
  const set = <K extends keyof Teste>(k: K) => (v: Teste[K]) => setT({ ...t, [k]: v })

  async function salvar() {
    if (!t) return
    if (t.id) { await db.testes.put({ ...(t as Teste), atualizadoEm: Date.now() }); nav(`/testes/${t.id}`, { replace: true }) }
    else { const x = novo(t); await db.testes.add(x); nav(`/testes/${x.id}`, { replace: true }) }
    toast('Teste salvo')
  }

  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <Voltar to={t.id ? `/testes/${t.id}` : '/testes'}>Voltar</Voltar>
      <p className="eyebrow">{t.id ? 'Editar teste' : 'Novo teste'}</p>
      <h1 style={{ marginTop: 8, marginBottom: 6 }}>{t.codigo}</h1>
      <p className="faint" style={{ marginBottom: 28, fontSize: 13.5 }}>Inscreva este código na placa de teste antes da queima.</p>

      <div className="form">
        <Campo label="Fotografias" wide><Fotos value={t.fotos} onChange={set('fotos')} /></Campo>
        <Campo label="Código"><Texto value={t.codigo} onChange={set('codigo')} /></Campo>
        <Campo label="Data"><input type="date" className="input" value={t.data} onChange={(e) => set('data')(e.target.value)} /></Campo>
        <Campo label="Esmalte">
          <select className="input" value={t.esmalteId ?? ''} onChange={async (e) => {
            const es = (esmaltes ?? []).find((x) => x.id === e.target.value)
            const r = es?.receitaId ? await db.receitas.get(es.receitaId) : undefined
            setT({ ...t, esmalteId: es?.id, receitaId: r?.id ?? t.receitaId, receitaVersao: r?.versaoAtual ?? t.receitaVersao })
          }}><option value="">—</option>{(esmaltes ?? []).map((e) => <option key={e.id} value={e.id}>{e.codigo} · {e.nome}</option>)}</select>
        </Campo>
        <Campo label="Receita e versão">
          <div style={{ display: 'flex', gap: 8 }}>
            <select className="input" value={t.receitaId ?? ''} onChange={(e) => { const r = (receitas ?? []).find((x) => x.id === e.target.value); setT({ ...t, receitaId: r?.id, receitaVersao: r?.versaoAtual }) }}>
              <option value="">—</option>{(receitas ?? []).map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
            </select>
            <select className="input" style={{ width: 96 }} value={t.receitaVersao ?? ''} onChange={(e) => set('receitaVersao')(e.target.value ? +e.target.value : undefined)}>
              <option value="">v?</option>
              {[...new Set([...versoes.map((v) => v.versao), ...(t.receitaVersao ? [t.receitaVersao] : [])])].sort((a, b) => b - a).map((v) => <option key={v} value={v}>v{v}</option>)}
            </select>
          </div>
        </Campo>
        {t.descricaoPlano && <Campo label="Plano" wide><Texto value={t.descricaoPlano} onChange={set('descricaoPlano')} /></Campo>}

        <h3>Queima</h3>
        <Campo label="Tipo de argila"><Sugestao id="argilas" value={t.argila} onChange={set('argila')} opcoes={ARGILAS} /></Campo>
        <Campo label="Temperatura (°C)"><Numero value={t.temperatura} onChange={(v) => setT({ ...t, temperatura: v, cone: t.cone || coneMaisProximo(v) })} /></Campo>
        <Campo label="Cone pirométrico">
          <select className="input" value={t.cone ?? ''} onChange={(e) => setT({ ...t, cone: e.target.value || undefined, temperatura: t.temperatura ?? tempDoCone(e.target.value) })}>
            <option value="">—</option>{CONES.map((c) => <option key={c.cone} value={c.cone}>Cone {c.cone} · {c.c} °C</option>)}
          </select>
        </Campo>
        <Campo label="Curva de queima"><AreaTexto value={t.curva} onChange={set('curva')} rows={3} /></Campo>

        <h3>Aplicação</h3>
        <Campo label="Método" wide><Escolha value={t.aplicacao} onChange={set('aplicacao')} opcoes={APLICACOES.map((v) => ({ v, l: v }))} /></Campo>
        <Campo label="Número de camadas"><Numero value={t.camadas} onChange={set('camadas')} /></Campo>
        <Campo label="Densidade da suspensão (g/ml)"><Numero value={t.densidade} onChange={set('densidade')} placeholder="Ex.: 1,45" /></Campo>
        <Campo label="Combinado com (sobreposição)" wide><Multi value={t.combinacao ?? []} onChange={set('combinacao')} opcoes={(esmaltes ?? []).filter((e) => e.id !== t.esmalteId).map((e) => ({ v: e.id, l: e.nome }))} /></Campo>

        <h3>Resultado</h3>
        <label style={{ gridColumn: '1 / -1', display: 'flex', gap: 10, alignItems: 'center', fontSize: 14 }}>
          <input type="checkbox" checked={!!t.planejado} onChange={(e) => set('planejado')(e.target.checked ? 1 : 0)} /> Ainda não queimado (planejado)
        </label>
        <Campo label="Resultado" wide><AreaTexto value={t.resultado} onChange={set('resultado')} rows={3} /></Campo>
        <Campo label="Defeitos identificados" wide><Multi value={t.defeitos ?? []} onChange={set('defeitos')} opcoes={DEFEITOS.map((v) => ({ v, l: v }))} /></Campo>
        <Campo label="Avaliação pessoal"><Estrelas value={t.avaliacao} onChange={set('avaliacao')} tamanho={24} /></Campo>
        <Campo label="Observações" wide><AreaTexto value={t.observacoes} onChange={set('observacoes')} rows={4} /></Campo>
      </div>
      <div className="barra-salvar">
        <button className="btn ghost" onClick={() => nav(-1)}>Cancelar</button>
        <button className="btn primary" onClick={salvar}>Salvar teste</button>
      </div>
    </div>
  )
}
