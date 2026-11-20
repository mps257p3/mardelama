import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, FolderInput } from 'lucide-react'
import { importarPinterest, imagemDoPin, lerExportacaoPinterest, type ExportacaoPinterest } from '../../lib/pinterest'
import { useToast } from '../../ui/toast'
import { ContaPinterest } from './ContaPinterest'

const FORA = ['logo', 'catarina']

export default function ImportarPinterest() {
  const toast = useToast()
  const nav = useNavigate()
  const pasta = useRef<HTMLInputElement>(null)
  const [ex, setEx] = useState<ExportacaoPinterest>()
  const [marc, setMarc] = useState<Set<string>>(new Set())
  const [buscas, setBuscas] = useState(true)
  const [ocupado, setOcupado] = useState(false)

  async function ler(fs: FileList | null) {
    if (!fs?.length) return
    try { const e = await lerExportacaoPinterest([...fs]); setEx(e); setMarc(new Set(e.pastas.filter((p) => !FORA.includes(p.chave)).map((p) => p.chave))) }
    catch (err) { toast((err as Error).message) }
  }
  const total = ex ? ex.pins.filter((p) => marc.has(p.pasta.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''))).length : 0
  const amostra = ex?.pins.filter((p) => p.imagem).slice(0, 6) ?? []

  async function importar() {
    if (!ex) return
    setOcupado(true)
    try {
      const r = await importarPinterest(ex, { pastas: [...marc], buscas })
      toast(r.pins || r.grupos || r.atualizados ? `${r.pins} pins novos no Acervo${r.grupos ? `, ${r.grupos} grupos novos` : ''}${r.atualizados ? `, ${r.atualizados} com grupos atualizados` : ''}` : 'Nada novo: esses pins já estavam no Acervo')
      nav('/referencias')
    } catch (err) { toast('Não deu para importar: ' + (err as Error).message) }
    finally { setOcupado(false) }
  }

  return (
    <div className="page" style={{ maxWidth: 720 }}>
      <Link to="/referencias" className="back"><ArrowLeft size={15} />Referências</Link>
      <p className="eyebrow">Repertório</p>
      <h1 style={{ marginTop: 6 }}>Pinterest</h1>
      <ContaPinterest />
      <h3 style={{ marginTop: 30 }}>Importar a exportação</h3>
      <p className="faint" style={{ fontSize: 13.5, marginTop: 6 }}>Alternativa sem conexão: use a exportação oficial (Configurações › Privacidade e dados › Solicitar seus dados). Cada pin entra no Acervo com a imagem do Pinterest, a pasta como grupo e o link original quando existe. Importar de novo não duplica.</p>
      <input ref={pasta} type="file" hidden multiple {...{ webkitdirectory: '' }} onChange={(e) => ler(e.target.files)} />
      {!ex && <button className="btn primary" style={{ marginTop: 18 }} onClick={() => pasta.current?.click()}><FolderInput size={15} />Escolher a pasta exportada</button>}
      {ex && <>
        <p style={{ marginTop: 18 }}><b>{ex.pins.length}</b> pins em <b>{ex.pastas.length}</b> pastas{ex.buscas.length ? <>, <b>{ex.buscas.length}</b> buscas</> : null}.</p>
        {amostra.length > 0 && <div className="pin-amostra">{amostra.map((p) => <img key={p.id} src={imagemDoPin(p.imagem!)} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.visibility = 'hidden' }} />)}</div>}
        <section className="rep-sec"><h3>Pastas que viram grupos</h3>
          <div className="rep-itens">{ex.pastas.map((c) => <button key={c.chave} className={'chip' + (marc.has(c.chave) ? ' on' : '')} onClick={() => setMarc((m) => { const n = new Set(m); if (n.has(c.chave)) n.delete(c.chave); else n.add(c.chave); return n })}>{c.nome} · {c.n}</button>)}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn sm ghost" onClick={() => setMarc(new Set(ex.pastas.map((c) => c.chave)))}>Marcar todas</button>
            <button className="btn sm ghost" onClick={() => setMarc(new Set())}>Desmarcar todas</button>
          </div>
        </section>
        {ex.buscas.length > 0 && <section className="rep-sec"><h3>Também importar</h3>
          <label className="sug-campo"><input type="checkbox" checked={buscas} onChange={() => setBuscas(!buscas)} /><div>Suas buscas no Pinterest como interesses do Descobrir ({ex.buscas.slice(0, 5).join(', ')}…)</div></label>
        </section>}
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button className="btn primary" disabled={ocupado || !total} onClick={importar}>{ocupado ? 'Importando…' : `Importar ${total} pins`}</button>
          <button className="btn ghost" onClick={() => setEx(undefined)}>Escolher outra</button>
        </div>
      </>}
    </div>
  )
}
