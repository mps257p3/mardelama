import { Voltar } from '../../../ui/Voltar'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, X } from 'lucide-react'
import { db, novo, type Artista, type Certeza, type Fonte } from '../../../db/schema'
import { ANALISE, CERTEZA, TEMAS_PROCESSO, listaParaTexto, textoParaLista } from '../../../lib/artistas'
import { AreaTexto, Campo, Tags, Texto } from '../../../ui/form'
import { useToast } from '../../../ui/toast'

type A = Omit<Artista, 'id' | 'criadoEm' | 'atualizadoEm'> & { id?: string }
export const artistaVazio = (): A => ({
  nome: '', pais: [], caracteristicas: [], processos: [], estudar: [], publicacoes: [], fontes: [], relacionados: [], tags: [],
  tecnicas: [], materiais: [], esmaltes: [], queimas: [], esteticas: [], tiposObra: [], origem: 'usuario',
})
const fontesTexto = (fs: Fonte[]) => fs.map((f) => [f.titulo, f.url, f.tipo, f.ano].filter((x, i) => x || i < 2).join(' | ')).join('\n')
const textoFontes = (s: string): Fonte[] => textoParaLista(s).map((l) => { const [titulo, url, tipo, ano] = l.split('|').map((x) => x.trim()); return { titulo: titulo || url || '', url: url || undefined, tipo: tipo || undefined, ano: ano || undefined } })

export default function ArtistaForm() {
  const { id } = useParams()
  const nav = useNavigate()
  const toast = useToast()
  const [a, setA] = useState<A>()
  const [txt, setTxt] = useState<Record<string, string>>({})
  useEffect(() => { (async () => {
    const x = id ? await db.artistas.get(id) : artistaVazio()
    if (!x) return
    setA(x)
    setTxt({ pais: x.pais.join(', '), caracteristicas: listaParaTexto(x.caracteristicas), estudar: listaParaTexto(x.estudar), publicacoes: fontesTexto(x.publicacoes), fontes: fontesTexto(x.fontes) })
  })() }, [id])
  if (!a) return null
  const set = <K extends keyof A>(k: K) => (v: A[K]) => setA({ ...a, [k]: v })
  const t = (k: string) => (v: string) => setTxt({ ...txt, [k]: v })
  async function salvar() {
    if (!a?.nome.trim()) { toast('Escreva o nome do artista'); return }
    const x: A = { ...a, nome: a.nome.trim(), pais: txt.pais.split(',').map((p) => p.trim()).filter(Boolean), caracteristicas: textoParaLista(txt.caracteristicas), estudar: textoParaLista(txt.estudar), publicacoes: textoFontes(txt.publicacoes), fontes: textoFontes(txt.fontes), processos: a.processos.filter((p) => p.texto.trim()) }
    if (x.id) { await db.artistas.put({ ...(x as Artista), atualizadoEm: Date.now() }); nav(`/biblioteca/artistas/${x.id}`, { replace: true }) }
    else { const n = novo(x); await db.artistas.add(n); nav(`/biblioteca/artistas/${n.id}`, { replace: true }) }
    toast('Estudo salvo')
  }
  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <Voltar to={a.id ? `/biblioteca/artistas/${a.id}` : '/biblioteca/artistas'}>Voltar</Voltar>
      <p className="eyebrow">{a.id ? 'Editar estudo' : 'Novo estudo de artista'}</p>
      <h1 style={{ marginTop: 8, marginBottom: 8 }}>{a.nome || 'Sem nome'}</h1>
      <p className="faint" style={{ fontSize: 13.5, marginBottom: 24 }}>Só o nome é obrigatório. Deixe vazio o que não estiver documentado: o perfil mostra "Não documentado".</p>
      <div className="form">
        <Campo label="Nome"><Texto value={a.nome} onChange={set('nome')} autoFocus={!a.id} /></Campo>
        <Campo label="Nome no idioma original"><Texto value={a.nomeOriginal} onChange={set('nomeOriginal')} /></Campo>
        <Campo label="País (separe por vírgula)"><Texto value={txt.pais} onChange={t('pais')} placeholder="Japão, Reino Unido" /></Campo>
        <Campo label="Local de atuação"><Texto value={a.atuacao} onChange={set('atuacao')} /></Campo>
        <Campo label="Nascimento"><Texto value={a.nascimento} onChange={set('nascimento')} placeholder="ano, cidade" /></Campo>
        <Campo label="Especialidade"><Texto value={a.especialidade} onChange={set('especialidade')} /></Campo>
        <Campo label="Linguagem artística (resumo)" wide><AreaTexto rows={2} value={a.linguagem} onChange={set('linguagem')} /></Campo>
        <Campo label="Biografia" wide><AreaTexto rows={6} value={a.bio} onChange={set('bio')} /></Campo>
        <Campo label="Características (uma por linha)" wide><AreaTexto rows={4} value={txt.caracteristicas} onChange={t('caracteristicas')} /></Campo>
        <Campo label="Afinidade com Ryuji Iwasaki" wide><AreaTexto rows={2} value={a.afinidade} onChange={set('afinidade')} /></Campo>
        <Campo label="Site oficial"><Texto value={a.site} onChange={set('site')} type="url" placeholder="https://" /></Campo>
        <Campo label="Instagram (sem @)"><Texto value={a.instagram} onChange={set('instagram')} /></Campo>
        <Campo label="Fotografia do artista (endereço da imagem na fonte oficial)" wide><Texto value={a.retrato} onChange={set('retrato')} type="url" placeholder="https://" /></Campo>
        {([['tecnicas', 'Técnicas'], ['materiais', 'Materiais'], ['esmaltes', 'Esmaltes'], ['queimas', 'Tipos de queima'], ['esteticas', 'Estética'], ['tiposObra', 'Tipos de obra']] as const).map(([k, l]) => <Campo key={k} label={l}><Tags value={a[k]} onChange={set(k)} /></Campo>)}
      </div>

      <h2 style={{ margin: '32px 0 8px' }}>Linguagem artística</h2>
      <div className="form">{ANALISE.map(([k, l]) => <Campo key={k} label={l} wide><AreaTexto rows={2} value={a.analise?.[k]} onChange={(v) => setA({ ...a, analise: { ...a.analise, [k]: v } })} /></Campo>)}</div>

      <h2 style={{ margin: '32px 0 4px' }}>Técnicas e processos</h2>
      <p className="faint" style={{ fontSize: 13, marginBottom: 12 }}>Marque o grau de certeza de cada informação. Não registre receitas ou temperaturas sem fonte.</p>
      {a.processos.map((p, i) => (
        <div key={i} className="proc-ed">
          <select className="input" value={p.tema} onChange={(e) => setA({ ...a, processos: a.processos.map((q, j) => j === i ? { ...q, tema: e.target.value } : q) })}>{TEMAS_PROCESSO.map((x) => <option key={x}>{x}</option>)}{!(TEMAS_PROCESSO as readonly string[]).includes(p.tema) && <option>{p.tema}</option>}</select>
          <select className="input" value={p.certeza} onChange={(e) => setA({ ...a, processos: a.processos.map((q, j) => j === i ? { ...q, certeza: e.target.value as Certeza } : q) })}>{(Object.keys(CERTEZA) as Certeza[]).map((c) => <option key={c} value={c}>{CERTEZA[c].rotulo}</option>)}</select>
          <textarea className="input" rows={2} value={p.texto} placeholder="O que se sabe" onChange={(e) => setA({ ...a, processos: a.processos.map((q, j) => j === i ? { ...q, texto: e.target.value } : q) })} />
          <input className="input" value={p.fonte ?? ''} placeholder="Link da fonte" onChange={(e) => setA({ ...a, processos: a.processos.map((q, j) => j === i ? { ...q, fonte: e.target.value || undefined } : q) })} />
          <button type="button" className="iconbtn" aria-label="Remover" onClick={() => setA({ ...a, processos: a.processos.filter((_, j) => j !== i) })}><X size={15} /></button>
        </div>
      ))}
      <button type="button" className="btn sm" onClick={() => setA({ ...a, processos: [...a.processos, { tema: 'Esmaltes', certeza: 'verificado', texto: '' }] })}><Plus size={14} />Adicionar informação técnica</button>

      <div className="form" style={{ marginTop: 32 }}>
        <Campo label="O que estudar neste artista? (um ponto por linha)" wide><AreaTexto rows={4} value={txt.estudar} onChange={t('estudar')} /></Campo>
        <Campo label="Publicações (uma por linha: título | link | tipo | ano)" wide><AreaTexto rows={4} value={txt.publicacoes} onChange={t('publicacoes')} /></Campo>
        <Campo label="Fontes (uma por linha: título | link | tipo)" wide><AreaTexto rows={4} value={txt.fontes} onChange={t('fontes')} /></Campo>
      </div>
      <div className="barra-salvar"><button className="btn ghost" onClick={() => nav(-1)}>Cancelar</button><button className="btn primary" onClick={salvar}>Salvar estudo</button></div>
    </div>
  )
}
