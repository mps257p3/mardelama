import { Voltar } from '../../ui/Voltar'
import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { FolderInput, ImageDown, Upload } from 'lucide-react'
import { db } from '../../db/schema'
import { buscarFotos, estadoInstagram, type Andamento, type EstadoIG } from '../../lib/instagramFotos'
import { importarInstagram, lerExportacao, pendenteInstagram, type ExportacaoInstagram } from '../../lib/instagram'
import { useToast } from '../../ui/toast'

/** Coleções que costumam não ser referência de estudo: começam desmarcadas (você decide). */
const FORA = ['mkt', 'compra', 'presentes', 'informacoes', 'luisa', 'viagem']

export default function ImportarInstagram() {
  const toast = useToast()
  const nav = useNavigate()
  const pasta = useRef<HTMLInputElement>(null)
  const soltos = useRef<HTMLInputElement>(null)
  const [ex, setEx] = useState<ExportacaoInstagram>()
  const [marc, setMarc] = useState<Set<string>>(new Set())
  const [semColecao, setSemColecao] = useState(true)
  const [seguindo, setSeguindo] = useState(true)
  const [hashtags, setHashtags] = useState(true)
  const [ocupado, setOcupado] = useState(false)

  async function ler(fs: FileList | null) {
    if (!fs?.length) return
    try {
      const e = await lerExportacao([...fs])
      setEx(e); setMarc(new Set(e.colecoes.filter((c) => !FORA.includes(c.chave)).map((c) => c.chave)))
    } catch (err) { toast((err as Error).message) }
  }
  const semCol = ex?.posts.filter((p) => !p.colecoes.length).length ?? 0
  const total = ex ? ex.posts.filter((p) => p.colecoes.some((c) => marc.has(c)) || (semColecao && !p.colecoes.length)).length : 0

  async function importar() {
    if (!ex) return
    setOcupado(true)
    try {
      const r = await importarInstagram(ex, { colecoes: [...marc], semColecao, posts: true, seguindo, hashtags })
      toast(r.posts || r.grupos || r.atualizados ? `${r.posts} posts novos no Acervo${r.grupos ? `, ${r.grupos} grupos novos` : ''}${r.atualizados ? `, ${r.atualizados} com grupos atualizados` : ''}` : 'Nada novo: esses posts já estavam no Acervo')
      nav('/referencias/acervo')
    } catch (err) { toast('Não deu para importar: ' + (err as Error).message) }
    finally { setOcupado(false) }
  }

  return (
    <div className="page" style={{ maxWidth: 720 }}>
      <Voltar to="/referencias/acervo">Referências</Voltar>
      <p className="eyebrow">Repertório</p>
      <h1 style={{ marginTop: 6 }}>Importar do Instagram</h1>
      <p className="faint" style={{ fontSize: 13.5, marginTop: 6 }}>Use a exportação oficial (Central de Contas › Suas informações e permissões › Baixar suas informações, formato JSON). O Instagram não inclui as imagens dos posts de outras pessoas: cada post entra como um cartão com o @, a legenda e o link. Importar de novo não duplica.</p>

      <input ref={pasta} type="file" hidden multiple {...{ webkitdirectory: '' }} onChange={(e) => ler(e.target.files)} />
      <input ref={soltos} type="file" hidden multiple accept=".json,application/json" onChange={(e) => ler(e.target.files)} />
      {!ex && <FotosInstagram />}
      {!ex && <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
        <button className="btn primary" onClick={() => pasta.current?.click()}><FolderInput size={15} />Escolher a pasta exportada</button>
        <button className="btn" onClick={() => soltos.current?.click()}><Upload size={15} />Escolher os arquivos .json</button>
      </div>}

      {ex && <>
        <p style={{ marginTop: 18 }}><b>{ex.posts.length}</b> posts salvos, <b>{ex.colecoes.length}</b> coleções, <b>{ex.seguindo.length}</b> perfis seguidos, <b>{ex.hashtags.length}</b> hashtags.</p>
        <section className="rep-sec"><h3>Coleções que viram grupos</h3>
          <div className="rep-itens">{ex.colecoes.map((c) => <button key={c.chave} className={'chip' + (marc.has(c.chave) ? ' on' : '')} onClick={() => setMarc((m) => { const n = new Set(m); if (n.has(c.chave)) n.delete(c.chave); else n.add(c.chave); return n })}>{c.nome} · {c.n}</button>)}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn sm ghost" onClick={() => setMarc(new Set(ex.colecoes.map((c) => c.chave)))}>Marcar todas</button>
            <button className="btn sm ghost" onClick={() => setMarc(new Set())}>Desmarcar todas</button>
          </div>
        </section>
        <section className="rep-sec"><h3>Também importar</h3>
          <label className="sug-campo"><input type="checkbox" checked={semColecao} onChange={() => setSemColecao(!semColecao)} /><div>Posts salvos fora de coleções ({semCol})</div></label>
          <label className="sug-campo"><input type="checkbox" checked={seguindo} onChange={() => setSeguindo(!seguindo)} /><div>Perfis que você segue ({ex.seguindo.length}), para a lista “Perfis que acompanho”</div></label>
          <label className="sug-campo"><input type="checkbox" checked={hashtags} onChange={() => setHashtags(!hashtags)} /><div>Hashtags seguidas como interesses do Descobrir: {ex.hashtags.slice(0, 8).map((h) => '#' + h).join(' ')}{ex.hashtags.length > 8 ? '…' : ''}</div></label>
        </section>
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button className="btn primary" disabled={ocupado || (!total && !seguindo && !hashtags)} onClick={importar}>{ocupado ? 'Importando…' : `Importar ${total} posts`}</button>
          <button className="btn ghost" onClick={() => setEx(undefined)}>Escolher outra</button>
        </div>
      </>}
    </div>
  )
}

/** Preenche as fotos dos posts já importados, pela API oficial (precisa do META_TOKEN na Vercel). */
function FotosInstagram() {
  const [est, setEst] = useState<EstadoIG>()
  const [and, setAnd] = useState<Andamento>()
  const [rodando, setRodando] = useState(false)
  const parar = useRef(false)
  const pendentes = useLiveQuery(async () => (await db.referencias.toArray()).filter((r) => !r.excluido && pendenteInstagram(r)).length, [], 0)
  useEffect(() => { estadoInstagram().then(setEst) }, [])
  if (!pendentes && !and) return null
  async function rodar() {
    parar.current = false; setRodando(true)
    try { await buscarFotos(setAnd, () => parar.current) } finally { setRodando(false) }
  }
  return <section className="rep-sec ig-fotos">
    <h3>Fotos dos posts salvos</h3>
    <p style={{ fontSize: 14 }}><b>{pendentes}</b> posts importados ainda sem foto.</p>
    {est && !est.configurado && <p className="ia-off">Ligação com a Meta ainda não configurada: falta o <b>META_TOKEN</b> na Vercel. {est.erro && est.erro !== 'Falta o META_TOKEN na Vercel.' ? est.erro : ''}</p>}
    {est?.configurado && <p className="faint" style={{ fontSize: 13 }}>Conectado como @{est.usuario} (Página {est.pagina}). Só perfis comerciais e de criador têm as fotos disponíveis.</p>}
    {and && <p style={{ fontSize: 13.5, marginTop: 8 }}>
      {and.fotos} fotos encontradas · {and.feitosPerfis} de {and.perfis} perfis{and.perfilAtual ? ` · agora: ${and.perfilAtual}` : ''}{and.semFoto ? ` · ${and.semFoto} sem foto disponível` : ''}
      {and.parou && <><br /><span style={{ color: 'var(--terracota, #B46E4B)' }}>{and.parou}</span></>}
    </p>}
    {est?.configurado && <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
      {!rodando ? <button className="btn primary" onClick={rodar} disabled={!pendentes}><ImageDown size={15} />{and ? 'Continuar' : 'Buscar fotos'}</button>
        : <button className="btn" onClick={() => { parar.current = true }}>Parar</button>}
    </div>}
  </section>
}
