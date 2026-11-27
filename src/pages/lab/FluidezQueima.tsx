import { useState } from 'react'
import { Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { db, uid, type Esmalte, type TesteFluidez } from '../../db/schema'
import { atualizarFluidez } from '../../lib/fluidez'
import { ATMOSFERAS, fmt } from '../../lib/opcoes'
import { AreaTexto, Campo, Escolha, Foto, Fotos, Numero, Texto } from '../../ui/form'
import { Sheet } from '../../ui/Sheet'
import { useToast } from '../../ui/toast'

const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, '') } catch { return u } }
const data = (d?: string) => (d ? new Date(d + 'T12:00').toLocaleDateString('pt-BR') : '')

/**
 * Ficha do esmalte industrial › Fluidez durante a queima.
 * Três origens visualmente separadas: o que o fabricante publica (oficial ou descritivo), a estimativa da IA e os testes do usuário.
 */
export function FluidezQueima({ e, embutida, soTestes, soFabricante }: { e: Esmalte; embutida?: boolean; soTestes?: boolean; soFabricante?: boolean }) {
  const toast = useToast()
  const [consultando, setConsultando] = useState(false)
  const [teste, setTeste] = useState<TesteFluidez>()
  const f = e.fluidezQueima
  const testes = [...(e.testesFluidez ?? [])].sort((a, b) => b.data.localeCompare(a.data))

  async function consultar() {
    setConsultando(true)
    try {
      const r = await atualizarFluidez(e)
      toast(r?.situacao === 'nao-informada' ? 'O fabricante não publica a fluidez deste esmalte.' : 'Informações do fabricante atualizadas. Confira as fontes.')
    } catch (x) { toast('A consulta não deu certo: ' + (x as Error).message) } finally { setConsultando(false) }
  }
  const salvarTestes = (v: TesteFluidez[]) => db.esmaltes.update(e.id, { testesFluidez: v, atualizadoEm: Date.now() })

  const extras: [string, string | undefined][] = f ? [
    ['Influência da espessura', f.espessura], ['Em sobreposição', f.sobreposicao],
    ['Influência da curva de queima', f.curva], ['Recomendações de aplicação', f.recomendacoes],
  ] : []

  return (
    <section className={'fluidez' + (embutida ? ' embutida' : ' secao')}>
      {!embutida && <div className="secao-head"><h2>Fluidez durante a queima</h2></div>}
      {!embutida && <p className="faint fluidez-nota">Como o esmalte fundido se move e escorre na queima. Não é a consistência do esmalte líquido antes de aplicar.</p>}

      {!soTestes && <div className="fluidez-bloco">
        <p className="fluidez-origem">{!f || f.situacao === 'nao-informada' || f.situacao === 'indisponivel' ? <span className="selo">Fabricante</span> : f.situacao === 'descritiva' ? <span className="selo interpretacao">Descrição do fabricante</span> : <span className="selo verificado">Oficial do fabricante</span>}</p>
        {!f && <p className="muted">A consulta específica de fluidez ainda não foi feita. Toque em Atualizar informações do fabricante.</p>}
        {f?.situacao === 'indisponivel' && <p className="muted">A consulta não foi concluída{f.falhaEm ? ` (${data(f.falhaEm)})` : ''}. Tente de novo mais tarde.</p>}
        {f?.falhaEm && f.situacao !== 'indisponivel' && <p className="faint" style={{ fontSize: 12.5 }}>A última tentativa de atualizar ({data(f.falhaEm)}) não foi concluída; abaixo, a consulta anterior.</p>}
        {f?.situacao === 'nao-informada' && <p className="fluidez-vazia">Fluidez não informada pelo fabricante.</p>}
        {f?.situacao === 'descritiva' && <p className="faint" style={{ fontSize: 13 }}>O fabricante não tem uma classificação formal de fluidez; abaixo, o que ele descreve.</p>}
        {f && f.situacao !== 'nao-informada' && f.situacao !== 'indisponivel' && f.resultados.map((r, i) => (
          <div className="fluidez-res" key={i}>
            {r.classificacao && <p className="fluidez-termo"><b>{r.classificacao}</b>{r.traducao && <span> · {r.traducao}</span>}</p>}
            {(r.cone || r.temperatura) && <p className="fluidez-cone">{[r.cone && 'Cone ' + r.cone.replace(/^cone\s*/i, ''), r.temperatura].filter(Boolean).join(' · ')}</p>}
            {r.escala && <p className="fluidez-escala"><span className="faint">Escala do fabricante: </span>{r.escala}</p>}
            {r.comportamento && <p>{r.comportamento}</p>}
            {r.escorrimentoMm && <p><span className="faint">Escorrimento: </span>{/mm/i.test(r.escorrimentoMm) ? r.escorrimentoMm : r.escorrimentoMm + ' mm'}</p>}
          </div>
        ))}
        {extras.some(([, v]) => v) && <dl className="ficha fluidez-ficha">{extras.filter(([, v]) => v).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>}
        {!!f?.imagens.length && <div className="galeria fluidez-fotos" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {f.imagens.map((id) => <div className="peca" key={id}><div className="ph"><Foto id={id} alt="Teste de fluidez do fabricante" /></div></div>)}
        </div>}
        {f && (f.fontes.length > 0 || f.consultadoEm) && <p className="fluidez-fontes">
          {f.fontes.map((u) => <a key={u} href={u} target="_blank" rel="noreferrer" className="fonte">{host(u)}</a>)}
          {f.consultadoEm && <span className="faint">Consultado em {data(f.consultadoEm)}</span>}
        </p>}
        <button className="btn sm" disabled={consultando} onClick={consultar} style={{ marginTop: 14 }}><RefreshCw size={14} className={consultando ? 'gira' : undefined} />{consultando ? 'Consultando o fabricante…' : 'Atualizar informações do fabricante'}</button>
        {consultando && <p className="recebido-lendo" style={{ marginTop: 10 }}>Procurando a fluidez no site, na ficha técnica e nos catálogos do fabricante… leva 1 ou 2 minutos. Pode sair do app: a consulta continua e termina quando você voltar. O que já está na ficha não se perde.</p>}
      </div>}

      {!soTestes && f?.estimativaIA && <div className="fluidez-bloco ia">
        <p className="fluidez-origem"><span className="selo hipotese">Estimativa por IA</span></p>
        <p>{f.estimativaIA}</p>
        <p className="faint" style={{ fontSize: 12.5, marginTop: 6 }}>Interpretação da IA a partir do que está publicado. Não é classificação do fabricante nem resultado de teste.</p>
      </div>}

      {!soFabricante && <div className="fluidez-bloco seu">
        <p className="fluidez-origem"><span className="selo usuario">Seus testes</span></p>
        {!testes.length && <p className="muted">Nenhum teste de fluidez seu ainda.</p>}
        {testes.map((t) => (
          <div className="fluidez-res" key={t.id}>
            <p className="fluidez-termo"><b>{t.escorrimentoMm != null ? fmt(t.escorrimentoMm, 0) + ' mm' : 'Sem medida'}</b><span> · {data(t.data)}</span></p>
            <p className="fluidez-cone">{[t.temperatura && fmt(t.temperatura, 0) + ' °C', t.cone && 'cone ' + t.cone, t.atmosfera, t.inclinacao && 'inclinação ' + t.inclinacao].filter(Boolean).join(' · ')}</p>
            <p className="faint" style={{ fontSize: 13 }}>{[t.massa && 'Massa: ' + t.massa, t.quantidade && 'Aplicação: ' + t.quantidade, t.camadas && t.camadas + (t.camadas === 1 ? ' camada' : ' camadas'), t.curva && 'Curva: ' + t.curva, t.sobreposicao && 'Sobreposição: ' + t.sobreposicao].filter(Boolean).join(' · ')}</p>
            {t.observacoes && <p style={{ whiteSpace: 'pre-wrap' }}>{t.observacoes}</p>}
            {!!t.fotos.length && <div className="galeria" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginTop: 8 }}>{t.fotos.map((id) => <div className="peca" key={id}><div className="ph"><Foto id={id} /></div></div>)}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button className="btn sm ghost" onClick={() => setTeste(t)}><Pencil size={13} />Editar</button>
              <button className="btn sm ghost" onClick={() => { if (confirm('Excluir este teste de fluidez?')) salvarTestes(testes.filter((x) => x.id !== t.id)) }}><Trash2 size={13} />Excluir</button>
            </div>
          </div>
        ))}
        <button className="btn sm primary" style={{ marginTop: 12 }} onClick={() => setTeste({ id: uid(), data: new Date().toLocaleDateString('sv-SE'), fotos: [], temperatura: e.temperatura, cone: e.cone, atmosfera: e.atmosfera })}><Plus size={14} />Registrar teste de fluidez</button>
      </div>}

      {teste && <Sheet label="Teste de fluidez" alto onClose={() => setTeste(undefined)}>
        <FormTeste t={teste} onSalvar={async (t) => {
          await salvarTestes(testes.some((x) => x.id === t.id) ? testes.map((x) => (x.id === t.id ? t : x)) : [...testes, t])
          setTeste(undefined); toast('Teste de fluidez salvo')
        }} />
      </Sheet>}
    </section>
  )
}

function FormTeste({ t: inicial, onSalvar }: { t: TesteFluidez; onSalvar: (t: TesteFluidez) => void }) {
  const [t, setT] = useState(inicial)
  const set = <K extends keyof TesteFluidez>(k: K) => (v: TesteFluidez[K]) => setT((x) => ({ ...x, [k]: v === '' ? undefined : v }))
  return (
    <div>
      <h3>Teste de fluidez</h3>
      <p className="muted" style={{ margin: '8px 0 16px' }}>Fica separado das informações do fabricante.</p>
      <div className="form">
        <Campo label="Data"><input className="input" type="date" value={t.data} onChange={(x) => set('data')(x.target.value)} /></Campo>
        <Campo label="Temperatura máxima (°C)"><Numero value={t.temperatura} onChange={set('temperatura')} /></Campo>
        <Campo label="Cone pirométrico"><Texto value={t.cone} onChange={set('cone')} /></Campo>
        <Campo label="Curva de queima"><Texto value={t.curva} onChange={set('curva')} placeholder="Ex.: patamar de 10 min, resfriamento lento" /></Campo>
        <Campo label="Atmosfera" wide><Escolha value={t.atmosfera} onChange={set('atmosfera')} opcoes={ATMOSFERAS.map((v) => ({ v, l: v }))} /></Campo>
        <Campo label="Massa cerâmica"><Texto value={t.massa} onChange={set('massa')} /></Campo>
        <Campo label="Quantidade de esmalte"><Texto value={t.quantidade} onChange={set('quantidade')} placeholder="Ex.: 3 demãos de pincel, imersão 5 s" /></Campo>
        <Campo label="Número de camadas"><Numero value={t.camadas} onChange={set('camadas')} /></Campo>
        <Campo label="Inclinação do corpo de prova"><Texto value={t.inclinacao} onChange={set('inclinacao')} placeholder="Ex.: 45°, vertical" /></Campo>
        <Campo label="Escorrimento (mm)"><Numero value={t.escorrimentoMm} onChange={set('escorrimentoMm')} /></Campo>
        <Campo label="Esmaltes em sobreposição"><Texto value={t.sobreposicao} onChange={set('sobreposicao')} /></Campo>
        <Campo label="Fotografias" wide><Fotos value={t.fotos} onChange={set('fotos')} /></Campo>
        <Campo label="Observações" wide><AreaTexto value={t.observacoes} onChange={set('observacoes')} rows={3} /></Campo>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
        <button className="btn primary" onClick={() => onSalvar(t)}>Salvar teste</button>
      </div>
    </div>
  )
}
