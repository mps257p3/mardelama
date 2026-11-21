import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { db, novo, type Artista, type Fonte, type Processo } from '../../../db/schema'
import { CERTEZA } from '../../../lib/artistas'
import { chamar, iaConfigurada } from '../../../lib/iaRepertorio'
import { Sheet } from '../../../ui/Sheet'
import { useToast } from '../../../ui/toast'

interface ObraSugerida { titulo: string; ano: string; dimensoes: string; materiais: string; imagem: string; fonte: string; credito: string }
interface Resultado {
  nomeOriginal: string; pais: string[]; atuacao: string; nascimento: string; especialidade: string; linguagem: string; bio: string
  caracteristicas: string[]; tecnicas: string[]; materiais: string[]; esmaltes: string[]; queimas: string[]; esteticas: string[]; tiposObra: string[]
  site: string; instagram: string; processos: Processo[]; estudar: string[]; publicacoes: Fonte[]; fontes: Fonte[]; obras: ObraSugerida[]; avisos: string[]
}

const TEXTOS = [['nomeOriginal', 'Nome original'], ['atuacao', 'Local de atuação'], ['nascimento', 'Nascimento'], ['especialidade', 'Especialidade'], ['linguagem', 'Linguagem artística'], ['bio', 'Biografia'], ['site', 'Site oficial'], ['instagram', 'Instagram']] as const
const LISTAS = [['pais', 'País'], ['caracteristicas', 'Características'], ['tecnicas', 'Técnicas'], ['materiais', 'Materiais'], ['esmaltes', 'Esmaltes'], ['queimas', 'Queima'], ['esteticas', 'Estética'], ['tiposObra', 'Tipos de obra'], ['estudar', 'O que estudar']] as const
const juntar = <T,>(a: T[], b: T[], k: (x: T) => string) => { const vistos = new Set(a.map(k)); return [...a, ...b.filter((x) => !vistos.has(k(x)))] }

/** Pesquisa com IA e busca na web. Nada é gravado sem revisão: a pessoa marca o que quer aproveitar. */
export function PesquisaIA({ artista: a, onClose }: { artista: Artista; onClose: () => void }) {
  const toast = useToast()
  const [ok, setOk] = useState<boolean>()
  const [lendo, setLendo] = useState(false)
  const [erro, setErro] = useState('')
  const [r, setR] = useState<Resultado>()
  const [marcado, setMarcado] = useState<Record<string, boolean>>({})
  useEffect(() => { iaConfigurada().then(setOk) }, [])
  const m = (k: string) => marcado[k] ?? false
  const alternar = (k: string) => setMarcado({ ...marcado, [k]: !m(k) })

  async function pesquisar() {
    setLendo(true); setErro('')
    try {
      const contexto = [a.especialidade, a.atuacao, a.site].filter(Boolean).join(' · ')
      const res = await chamar<Resultado>({ acao: 'artista', nome: a.nome, contexto }, 175000)
      setR(res)
      // por padrão, marca só o que preenche campo vazio e o que tem fonte
      const ini: Record<string, boolean> = {}
      TEXTOS.forEach(([k]) => { if (res[k] && !a[k]) ini[k] = true })
      LISTAS.forEach(([k]) => { if (res[k].length && !a[k].length) ini[k] = true })
      res.processos.forEach((p, i) => { if (p.certeza !== 'hipotese') ini['p' + i] = true })
      res.fontes.forEach((_, i) => { ini['f' + i] = true })
      res.publicacoes.forEach((_, i) => { ini['u' + i] = true })
      setMarcado(ini)
    } catch (e) { setErro((e as Error).message) }
    setLendo(false)
  }

  async function aplicar() {
    if (!r) return
    const p: Partial<Artista> = {}
    TEXTOS.forEach(([k]) => { if (m(k) && r[k]) p[k] = r[k] })
    LISTAS.forEach(([k]) => { if (m(k)) p[k] = juntar(a[k], r[k], (x) => x.toLowerCase()) })
    const procs = r.processos.filter((_, i) => m('p' + i))
    if (procs.length) p.processos = juntar(a.processos, procs, (x) => x.texto)
    const fs = r.fontes.filter((_, i) => m('f' + i)); if (fs.length) p.fontes = juntar(a.fontes, fs, (x) => x.url || x.titulo)
    const us = r.publicacoes.filter((_, i) => m('u' + i)); if (us.length) p.publicacoes = juntar(a.publicacoes, us, (x) => x.url || x.titulo)
    p.revisadoEm = new Date().toLocaleDateString('pt-BR')
    await db.artistas.update(a.id, { ...p, atualizadoEm: Date.now() })
    const existentes = new Set((await db.obras.where('artistaId').equals(a.id).toArray()).map((o) => o.imagem))
    const obras = r.obras.filter((o, i) => m('o' + i) && !existentes.has(o.imagem))
    if (obras.length) await db.obras.bulkAdd(obras.map((o) => novo({ artistaId: a.id, titulo: o.titulo || undefined, ano: o.ano || undefined, dimensoes: o.dimensoes || undefined, materiais: o.materiais || undefined, imagem: o.imagem, fonte: o.fonte, credito: o.credito || undefined, tags: [] })))
    toast('Perfil atualizado')
    onClose()
  }

  const Marca = ({ k, children }: { k: string; children: React.ReactNode }) => (
    <label className="ia-item"><input type="checkbox" checked={m(k)} onChange={() => alternar(k)} /><span>{children}</span></label>
  )
  const qtd = Object.values(marcado).filter(Boolean).length

  return (
    <Sheet onClose={onClose} label="Pesquisar com IA" alto>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Sparkles size={17} />Pesquisar {a.nome}</h3>
      {!r && <>
        <p className="muted" style={{ fontSize: 14 }}>A IA procura na web, priorizando o site oficial, museus e galerias, e traz uma proposta para você revisar. Nada entra no perfil sem você marcar. Cada pesquisa custa alguns centavos de dólar na sua conta da Anthropic e leva de 1 a 3 minutos.</p>
        {ok === false && <p className="aviso">A IA não está configurada: falta a chave ANTHROPIC_API_KEY na Vercel.</p>}
        {erro && <p className="aviso">{erro}</p>}
        <button className="btn primary" disabled={lendo || ok === false} onClick={pesquisar} style={{ marginTop: 8 }}><Sparkles size={15} />{lendo ? 'Pesquisando… (pode levar 2 min)' : 'Pesquisar agora'}</button>
      </>}
      {r && <div className="ia-res">
        {r.avisos.length > 0 && <div className="aviso"><strong>Atenção:</strong><ul>{r.avisos.map((x) => <li key={x}>{x}</li>)}</ul></div>}
        {TEXTOS.some(([k]) => r[k]) && <><h4>Dados gerais</h4>{TEXTOS.filter(([k]) => r[k]).map(([k, l]) => <Marca key={k} k={k}><b>{l}{a[k] ? ' (substitui o atual)' : ''}:</b> {r[k]}</Marca>)}</>}
        {LISTAS.some(([k]) => r[k].length) && <><h4>Listas</h4>{LISTAS.filter(([k]) => r[k].length).map(([k, l]) => <Marca key={k} k={k}><b>{l}:</b> {r[k].join(' · ')}</Marca>)}</>}
        {r.processos.length > 0 && <><h4>Técnicas e processos</h4>{r.processos.map((p, i) => <Marca key={i} k={'p' + i}><span className={'selo ' + p.certeza}>{CERTEZA[p.certeza].rotulo}</span> <b>{p.tema}:</b> {p.texto}{p.fonte && <> <a href={p.fonte} target="_blank" rel="noreferrer" className="faint">fonte</a></>}</Marca>)}</>}
        {r.obras.length > 0 && <><h4>Obras com imagem na fonte</h4><div className="ia-obras">{r.obras.map((o, i) => <Marca key={i} k={'o' + i}><img src={o.imagem} alt="" referrerPolicy="no-referrer" loading="lazy" onError={(e) => { e.currentTarget.style.visibility = 'hidden' }} /><span>{o.titulo || 'Sem título'}{o.ano ? `, ${o.ano}` : ''}<br /><a href={o.fonte} target="_blank" rel="noreferrer" className="faint">{o.credito || 'fonte'}</a></span></Marca>)}</div></>}
        {r.fontes.length > 0 && <><h4>Fontes</h4>{r.fontes.map((f, i) => <Marca key={i} k={'f' + i}>{f.url ? <a href={f.url} target="_blank" rel="noreferrer">{f.titulo}</a> : f.titulo}{f.tipo ? ` · ${f.tipo}` : ''}</Marca>)}</>}
        {r.publicacoes.length > 0 && <><h4>Publicações</h4>{r.publicacoes.map((f, i) => <Marca key={i} k={'u' + i}>{f.url ? <a href={f.url} target="_blank" rel="noreferrer">{f.titulo}</a> : f.titulo}{f.ano ? ` · ${f.ano}` : ''}</Marca>)}</>}
        <p className="faint" style={{ fontSize: 12.5 }}>Informação técnica sem link vira hipótese automaticamente. Confira as fontes antes de aplicar.</p>
        <div className="barra-salvar"><button className="btn ghost" onClick={onClose}>Descartar</button><button className="btn primary" disabled={!qtd} onClick={aplicar}>Aplicar {qtd} {qtd === 1 ? 'item' : 'itens'}</button></div>
      </div>}
    </Sheet>
  )
}
