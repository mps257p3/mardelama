import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { db, type Referencia } from '../../db/schema'
import { useGrupos } from '../../db/hooks'
import { Sheet } from '../../ui/Sheet'
import { useToast } from '../../ui/toast'
import { sugerirCatalogo, type SugestaoCatalogo } from '../../lib/iaRepertorio'
import { IaDesligada } from './Repertorio'

type Campo = 'titulo' | 'descricao' | 'tipo' | 'tags' | 'grupos' | 'paleta' | 'aplicacoes'

/** Revisão da catalogação sugerida pela IA: cada campo entra só se você marcar. */
export function Catalogar({ r, onClose }: { r: Referencia; onClose: () => void }) {
  const toast = useToast()
  const grupos = useGrupos()
  const [s, setS] = useState<SugestaoCatalogo>()
  const [erro, setErro] = useState<string>()
  const [marc, setMarc] = useState<Record<Campo, boolean>>({ titulo: false, descricao: false, tipo: false, tags: true, grupos: true, paleta: !r.paleta?.length, aplicacoes: false })
  useEffect(() => {
    let vivo = true
    sugerirCatalogo(r).then((x) => {
      if (!vivo) return
      x.paleta = x.paleta.filter((c) => /^#[0-9a-f]{6}$/i.test(c))
      setS(x)
      const generico = /^(whatsapp image|img[_ -]?\d|screenshot|captura de tela|pxl_|dsc_?\d|sem título)/i.test(r.titulo)
      setMarc((m) => ({ ...m, titulo: generico, descricao: !r.descricao, tipo: !r.tipo || r.tipo === 'Fotografia' && x.tipo !== 'Fotografia' }))
    }).catch((e) => vivo && setErro((e as Error).message))
    return () => { vivo = false }
  }, [r])

  async function aplicar() {
    if (!s) return
    const mud: Partial<Referencia> = { atualizadoEm: Date.now() }
    if (marc.titulo) mud.titulo = s.titulo
    if (marc.descricao || marc.aplicacoes) {
      const partes = [marc.descricao ? s.descricao : r.descricao, marc.aplicacoes && s.aplicacoes.length ? 'Para estudar no ateliê:\n' + s.aplicacoes.map((a) => '• ' + a).join('\n') : ''].filter(Boolean)
      mud.descricao = partes.join('\n\n')
    }
    if (marc.tipo) mud.tipo = s.tipo
    if (marc.tags) mud.tags = [...new Set([...r.tags, ...s.tags.map((t) => t.toLowerCase().replace(/^#/, ''))])]
    if (marc.paleta && s.paleta.length) mud.paleta = s.paleta
    if (marc.grupos && s.grupos.length) {
      const ids = [...r.grupos]
      for (const nome of s.grupos) {
        const g = grupos.find((x) => x.nome.toLowerCase() === nome.toLowerCase())
        if (g && !ids.includes(g.id)) ids.push(g.id)
      }
      mud.grupos = ids
    }
    await db.referencias.update(r.id, mud)
    toast('Catalogação aplicada'); onClose()
  }

  const tog = (k: Campo) => setMarc((m) => ({ ...m, [k]: !m[k] }))
  const linha = (k: Campo, rot: string, conteudo: React.ReactNode, vazio: boolean) => vazio ? null : (
    <label className="sug-campo"><input type="checkbox" checked={marc[k]} onChange={() => tog(k)} /><div><div className="rot">{rot}</div>{conteudo}</div></label>)
  const gruposExistentes = s?.grupos.filter((n) => grupos.some((g) => g.nome.toLowerCase() === n.toLowerCase())) ?? []

  return (
    <Sheet label="Sugerir catalogação" onClose={onClose}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Sparkles size={17} />Sugestão de catalogação</h3>
      {erro ? (/não configurada/i.test(erro) ? <IaDesligada /> : <p className="ia-off">{erro}</p>)
        : !s ? <p className="faint" style={{ margin: '18px 0' }}><Sparkles size={14} className="gira" /> Olhando a imagem…</p>
        : <>
          <p className="faint" style={{ fontSize: 13, margin: '4px 0 6px' }}>Marque o que quer aplicar. O resto fica como está.</p>
          {linha('titulo', 'Título', <div>{s.titulo}</div>, !s.titulo || s.titulo === r.titulo)}
          {linha('descricao', 'Descrição', <div style={{ fontSize: 14 }}>{s.descricao}</div>, !s.descricao)}
          {linha('tipo', 'Tipo', <div>{s.tipo}</div>, s.tipo === r.tipo)}
          {linha('tags', 'Tags', <div className="pills">{s.tags.map((t) => <span key={t} className="chip">#{t}</span>)}</div>, !s.tags.length)}
          {linha('grupos', 'Grupos', <div className="pills">{gruposExistentes.map((t) => <span key={t} className="chip">{t}</span>)}</div>, !gruposExistentes.length)}
          {linha('paleta', 'Paleta', <div className="paleta" style={{ height: 26 }}>{s.paleta.map((c) => <span key={c} style={{ background: c }} />)}</div>, !s.paleta.length)}
          {linha('aplicacoes', 'Para estudar no ateliê (vai para a descrição)', <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>{s.aplicacoes.map((a) => <li key={a}>{a}</li>)}</ul>, !s.aplicacoes.length)}
          <p className="sug-nota"><b>Origem:</b> {s.atribuicao.certeza === 'informada' && s.atribuicao.autor ? s.atribuicao.autor + '. ' : 'Autoria não identificada. '}{s.atribuicao.nota}</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn primary" onClick={aplicar}>Aplicar</button>
            <button className="btn ghost" onClick={onClose}>Cancelar</button>
          </div>
        </>}
    </Sheet>
  )
}

