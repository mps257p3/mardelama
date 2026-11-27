import { temTelaAnterior } from '../../ui/Voltar'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { AlertTriangle, ArrowLeft, Info, ChevronRight, Copy, Download, Heart, ImagePlus, Pencil, ScrollText, TestTube, Trash2 } from 'lucide-react'
import { db, novo } from '../../db/schema'
import { alternarFavorito, excluir, useFamilias } from '../../db/hooks'
import { proximoCodigo } from '../../db/codigos'
import { salvarArquivo } from '../../db/files'
import { criarReceita as criarReceitaNova } from './Receitas'
import { registrarConsultaEsmalte } from '../../lib/bancada'
import { TABELA_CONES, EXPLICACAO_CONE, temperaturaDaFicha } from '../../lib/cones'
import type { Esmalte } from '../../db/schema'
import { alertasDe, dadosComerciais, outrasQueimas } from '../../lib/esmalteFicha'
import { useEstadoDaTela } from '../../ui/memoriaRolagem'
import { Menu } from '../../ui/Menu'
import { useToast } from '../../ui/toast'
import { Galeria, useFotosFicha } from './ficha/Galeria'
import { Grade, TextoCurto } from './ficha/partes'
import { AbaDocumentacao, AbaExperimentos, AbaPerfil, AbaTecnica, fluidezCurta, segurancaCurta } from './ficha/Abas'

const ABAS = [['perfil', 'Perfil'], ['tecnica', 'Técnica'], ['experimentos', 'Experimentos'], ['documentacao', 'Documentação']] as const
type Aba = typeof ABAS[number][0]

/**
 * Ficha do esmalte (Esmaltaria, redesenho editorial de 26/11).
 * Consulta imediata (foto, identidade, resumo, alertas) → abas Perfil, Técnica, Experimentos e Documentação.
 * A consulta não tem campos de formulário: tudo se edita em Editar.
 */
export default function EsmalteDetalhe() {
  const { id } = useParams()
  useEffect(() => { if (id) registrarConsultaEsmalte(id) }, [id])
  const nav = useNavigate()
  const toast = useToast()
  const e = useLiveQuery(() => db.esmaltes.get(id!), [id])
  const familias = useFamilias()
  const receita = useLiveQuery(async () => (e?.receitaId ? db.receitas.get(e.receitaId) : undefined), [e?.receitaId])
  const testes = useLiveQuery(async () => (await db.testes.where('esmalteId').equals(id!).toArray()).filter((t) => !t.excluido).sort((a, b) => b.data.localeCompare(a.data)), [id], [])
  const estudo = useLiveQuery(async () => (e?.origem === 'comercial' ? (await import('../../lib/comercial')).estudoDoEsmalte(e) : undefined), [e])
  const aprovada = useLiveQuery(async () => (estudo?.receita?.aprovadaId ? db.receitas.get(estudo.receita.aprovadaId) : undefined), [estudo?.receita?.aprovadaId])
  const [aba, setAba] = useEstadoDaTela<Aba>('esmalte.aba', 'perfil')
  const [exportando, setExportando] = useState<string>()
  const abasRef = useRef<HTMLDivElement>(null)
  const [foco, setFoco] = useState<string>()
  const fotoRef = useRef<HTMLInputElement>(null)
  const fotosTestes = useMemo(() => testes.flatMap((t) => t.fotos.slice(0, 1)), [testes])
  const fotos = useFotosFicha(e ?? ({ fotos: [], origem: 'propria' } as never), fotosTestes)

  if (e === undefined) return null
  if (!e || e.excluido) return <div className="page"><p>Esmalte não encontrado.</p></div>

  const fam = e.familias.map((f) => familias.find((x) => x.id === f)?.nome).filter((x): x is string => !!x)
  const comercial = e.origem === 'comercial'
  const alertas = alertasDe(e)
  const com = dadosComerciais(e)
  // código comercial quando existe (o interno fica em Documentação); fabricante só aqui
  const eyebrow = [e.autoria, com.codigo ?? (comercial ? undefined : e.codigo)].filter(Boolean).join(' · ')
  const familiaFuncao = [fam.join(', '), fam.some((f) => f.toLowerCase() === e.funcao?.toLowerCase()) ? '' : e.funcao].filter(Boolean).join(' · ')

  async function criarReceita() {
    const rid = await criarReceitaNova({ nome: e!.nome, esmalteId: e!.id })
    await db.esmaltes.update(e!.id, { receitaId: rid, atualizadoEm: Date.now() })
    nav(`/receitas/${rid}`)
  }
  async function engenhariaReversa() {
    if (aprovada && !aprovada.excluido) return nav(`/receitas/${aprovada.id}`)
    if (estudo) return nav(`/engenharia-reversa/${estudo.id}` + (estudo.receita ? '#receita' : '?pesquisar=1'))
    const { criarEstudoDoEsmalte } = await import('../../lib/comercial')
    nav(`/engenharia-reversa/${await criarEstudoDoEsmalte(e!)}?pesquisar=1`)
  }
  async function duplicar() {
    const { id: _i, criadoEm: _c, atualizadoEm: _a, ...resto } = e!
    const x = novo({ ...resto, nome: e!.nome + ' (cópia)', codigo: await proximoCodigo('E', 'esmaltes', 3), favorito: 0 as const })
    await db.esmaltes.add(x); toast('Esmalte duplicado'); nav(`/esmaltes/${x.id}`)
  }
  async function exportar() {
    setExportando('Preparando…')
    try { const { exportarEsmalte } = await import('../../lib/exportarEsmalte'); await exportarEsmalte(e!, setExportando); toast('Ficha exportada') }
    catch (x) { toast('Não consegui exportar: ' + (x as Error).message) } finally { setExportando(undefined) }
  }
  /** Toque no resumo: abre a aba certa e leva até o detalhe (a fluidez já abre expandida). */
  const irParaDetalhe = (alvo: 'fluidez' | 'seguranca' | 'queima') => {
    setFoco(alvo)
    trocarAba(alvo === 'fluidez' ? 'perfil' : 'tecnica')
    setTimeout(() => document.getElementById('fx-' + alvo)?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 60)
  }
  const trocarAba = (a: Aba) => {
    setAba(a)
    const el = abasRef.current
    if (el && el.getBoundingClientRect().top < 1) window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top, behavior: 'instant' as ScrollBehavior })
  }

  return (
    <div className="page ficha-esm">
      <header className="fx-topo">
        <button className="fx-voltar" onClick={() => (temTelaAnterior() ? nav(-1) : nav('/esmaltes'))}><ArrowLeft size={16} />Esmaltaria</button>
        <div className="fx-acoes">
          <button className="iconbtn" aria-label={e.favorito ? 'Tirar dos favoritos' : 'Favoritar'} onClick={() => alternarFavorito('esmaltes', e.id, e.favorito)}><Heart size={18} fill={e.favorito ? 'currentColor' : 'none'} /></button>
          <Menu itens={[
            { l: 'Editar', icon: <Pencil size={16} />, to: `/esmaltes/${e.id}/editar` },
            { l: 'Duplicar', icon: <Copy size={16} />, onClick: duplicar },
            { l: 'Exportar ficha', icon: <Download size={16} />, onClick: exportar, disabled: !!exportando },
            { sep: true, l: '' },
            { l: 'Novo teste', icon: <TestTube size={16} />, to: `/testes/novo?esmalte=${e.id}` },
            comercial
              ? { l: aprovada && !aprovada.excluido ? 'Receita aprovada' : estudo ? 'Engenharia reversa' : 'Criar engenharia reversa', icon: <ScrollText size={16} />, onClick: engenhariaReversa }
              : receita && !receita.excluido ? { l: 'Abrir fórmula', icon: <ScrollText size={16} />, to: `/receitas/${receita.id}` } : { l: 'Criar fórmula', icon: <ScrollText size={16} />, onClick: criarReceita },
            { l: 'Adicionar foto', icon: <ImagePlus size={16} />, onClick: () => fotoRef.current?.click() },
            { sep: true, l: '' },
            { l: 'Excluir', icon: <Trash2 size={16} />, onClick: async () => { if (confirm(`Excluir "${e.nome}"?`)) { await excluir('esmaltes', e.id); toast('Esmalte excluído'); nav('/esmaltes') } } },
          ]} />
        </div>
        <input ref={fotoRef} type="file" accept="image/*" multiple hidden onChange={async (x) => {
          const fs = Array.from(x.target.files ?? []); x.target.value = ''
          const ids: string[] = []
          for (const f of fs) { try { ids.push(await salvarArquivo(f)) } catch { /* segue */ } }
          if (ids.length) { await db.esmaltes.update(e.id, { fotos: [...e.fotos, ...ids], atualizadoEm: Date.now() }); toast(ids.length === 1 ? 'Foto adicionada' : `${ids.length} fotos adicionadas`) }
        }} />
      </header>

      <div className="fx-id">
        {eyebrow && <p className="fx-eyebrow">{eyebrow}</p>}
        <h1 className="fx-nome">{e.nome}</h1>
        {familiaFuncao && <p className="fx-familia">{familiaFuncao}</p>}
      </div>

      <div className="fx-capa">
        <Galeria fotos={fotos ?? []} nome={e.nome} corHex={e.corHex} recortes={e.fotosRecorte}
          onRecorte={(id, r) => db.esmaltes.update(e.id, { fotosRecorte: { ...e.fotosRecorte, [id]: r }, atualizadoEm: Date.now() })} />
        <div className="fx-resumo">
          {e.descricao && <TextoCurto texto={e.descricao} />}
          <QueimaResumo e={e} />
          <ResumoLinhas itens={[['Fluidez na queima', fluidezCurta(e), () => irParaDetalhe('fluidez')], ['Segurança alimentar', segurancaCurta(e), () => irParaDetalhe('seguranca')], ['Outras queimas documentadas', outrasQueimas(e).join(' · ') || undefined, () => irParaDetalhe('queima')]]} />
          {alertas.length > 0 && <ul className="fx-alertas" aria-label="Alertas">{alertas.map((a) => <li key={a}><AlertTriangle size={14} strokeWidth={1.6} />{a}</li>)}</ul>}
        </div>
      </div>

      <div className="fx-abas" ref={abasRef} role="tablist">
        {ABAS.map(([k, l]) => <button key={k} role="tab" aria-selected={aba === k} className={aba === k ? 'on' : ''} onClick={() => trocarAba(k)}>{l}</button>)}
      </div>
      <div className="fx-conteudo" role="tabpanel">
        {aba === 'perfil' && <AbaPerfil key={foco} e={e} irPara={trocarAba} foco={foco} />}
        {aba === 'tecnica' && <AbaTecnica e={e} />}
        {aba === 'experimentos' && <AbaExperimentos e={e} testes={testes} />}
        {aba === 'documentacao' && <AbaDocumentacao e={e} familias={fam} receita={receita} estudo={estudo} aprovada={aprovada} />}
      </div>
      {exportando && <div className="sync-pill" role="status">{exportando}</div>}
    </div>
  )
}

/** Temperatura, cone e atmosfera. Tocar no cone abre a explicação e a tabela usada nas conversões. */
function QueimaResumo({ e }: { e: Esmalte }) {
  const [aberto, setAberto] = useState(false)
  const t = temperaturaDaFicha(e)
  const cone = e.cone?.trim().replace(/^cone\s*/i, '')
  return <>
    <Grade itens={[
      ['Temperatura', t?.valor && <span className="fx-temp-v">{t.valor}</span>, t?.referencia ? 'Referência' : undefined],
      ['Cone', cone && <button className="fx-cone-b" aria-expanded={aberto} onClick={() => setAberto(!aberto)}>{cone}<Info size={13} strokeWidth={1.6} aria-hidden /></button>],
      ['Atmosfera', e.atmosfera],
    ]} />
    {aberto && <div className="fx-cone-exp" role="note">
      <p>{EXPLICACAO_CONE}</p>
      {t?.referencia && <p className="fx-nota">“Referência” indica temperatura convertida a partir do cone, não informada pelo fabricante.</p>}
      <p className="fx-nota">Conversões: tabela de {TABELA_CONES.tipo}, aquecimento de {TABELA_CONES.taxa}. Fonte: <a href={TABELA_CONES.url} target="_blank" rel="noreferrer">{TABELA_CONES.fonte}</a>.</p>
    </div>}
  </>
}

/** Linhas curtas do resumo; cada uma leva ao detalhe correspondente. */
function ResumoLinhas({ itens }: { itens: [string, string | undefined, () => void][] }) {
  const xs = itens.filter(([, v]) => v)
  if (!xs.length) return null
  return <dl className="fx-resumo-l">{xs.map(([k, v, ir]) => (
    <div key={k}><dt>{k}</dt><dd><button className={'fx-resumo-ir' + (v!.length > 28 ? ' longo' : '')} onClick={ir}>{v}<ChevronRight size={14} strokeWidth={1.6} aria-hidden /></button></dd></div>
  ))}</dl>
}
