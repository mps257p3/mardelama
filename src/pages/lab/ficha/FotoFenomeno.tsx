import { useRef, useState, type PointerEvent as PE } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Camera, Crop, FlaskConical, Image as ImageIcon, RotateCcw, X } from 'lucide-react'
import { db, type Esmalte, type FotoFenomeno } from '../../../db/schema'
import { criarMiniatura, salvarArquivo, useArquivoUrl } from '../../../db/files'
import { associacoesFenomenos } from '../../../lib/esmalteFicha'
import { Sheet } from '../../../ui/Sheet'
import { AmostraFenomeno, nomeFenomeno } from '../../../ui/AmostraFenomeno'

type Recorte = NonNullable<FotoFenomeno['recorte']>
type Fotos = Record<string, FotoFenomeno | undefined>
const SEM_RECORTE: Recorte = { x: 0.5, y: 0.5, zoom: 1 }

/** Foto exibida no quadrado com o enquadramento escolhido (só exibição; cores e textura intactas). */
export function FotoRecortada({ foto, grande, alt }: { foto: FotoFenomeno; grande?: boolean; alt: string }) {
  const url = useArquivoUrl(grande ? foto.arquivoId : foto.miniaturaId ?? foto.arquivoId)
  const r = foto.recorte ?? SEM_RECORTE
  return (
    <span className="foto-fen">
      {url && <img src={url} alt={alt} decoding="async" style={{ objectPosition: `${r.x * 100}% ${r.y * 100}%`, transform: `scale(${r.zoom})`, transformOrigin: `${r.x * 100}% ${r.y * 100}%` }} />}
    </span>
  )
}

/** Botão do título da seção: abre "Gerenciar imagens". */
export function BotaoGerenciarImagens({ e }: { e: Esmalte }) {
  const [aberto, setAberto] = useState(false)
  if (!associacoesFenomenos(e).length) return null
  return <>
    <button className="iconbtn fx-cam-h" aria-label="Gerenciar imagens dos efeitos" onClick={() => setAberto(true)}><Camera size={18} strokeWidth={1.5} /></button>
    {aberto && <GerenciarImagens e={e} onClose={() => setAberto(false)} />}
  </>
}

/**
 * Todas as imagens dos fenômenos deste esmalte num só lugar. As mudanças ficam num rascunho até "Salvar alterações";
 * fechar sem salvar descarta as fotos novas. Só vale para este esmalte.
 */
function GerenciarImagens({ e, onClose }: { e: Esmalte; onClose: () => void }) {
  const tipos = associacoesFenomenos(e).map((a) => a.tipo)
  const [fotos, setFotos] = useState<Fotos>(() => ({ ...e.fotosFenomenos }))
  const criados = useRef(new Set<string>())
  const [vista, setVista] = useState<{ k: 'lista' } | { k: 'experimento' | 'ajuste'; tipo: string }>({ k: 'lista' })
  const [ocupado, setOcupado] = useState<string>()
  const [salvando, setSalvando] = useState(false)
  const alvo = useRef<string>('')
  const cam = useRef<HTMLInputElement>(null), gal = useRef<HTMLInputElement>(null)
  const dono = { tipo: 'esmalte' as const, id: e.id }
  const mudou = JSON.stringify(fotos) !== JSON.stringify({ ...e.fotosFenomenos })

  const excluir = async (ids: (string | undefined)[]) => { for (const id of ids) if (id) await db.arquivos.update(id, { excluido: 1, atualizadoEm: Date.now() }) }
  const usar = async (tipo: string, arquivoId: string, testeId?: string) => {
    setOcupado(tipo)
    try {
      const miniaturaId = await criarMiniatura(arquivoId, dono)
      if (miniaturaId) criados.current.add(miniaturaId)
      setFotos((f) => ({ ...f, [tipo]: { arquivoId, miniaturaId, testeId, data: Date.now() } }))
      setVista({ k: 'ajuste', tipo })
    } finally { setOcupado(undefined) }
  }
  const doArquivo = async (file?: File) => {
    const tipo = alvo.current
    if (!file || !tipo) return
    setOcupado(tipo)
    try { const id = await salvarArquivo(file, dono); criados.current.add(id); await usar(tipo, id) } finally { setOcupado(undefined) }
  }
  const fechar = async () => { await excluir([...criados.current]); onClose() }
  const salvar = async () => {
    setSalvando(true)
    const final = Object.fromEntries(Object.entries(fotos).filter(([, v]) => v)) as Record<string, FotoFenomeno>
    await db.esmaltes.update(e.id, { fotosFenomenos: Object.keys(final).length ? final : undefined, atualizadoEm: Date.now() })
    // arquivos que deixaram de ser usados: os criados nesta edição e os antigos criados aqui (nunca a foto original de um experimento)
    const usados = new Set(Object.values(final).flatMap((f) => [f.arquivoId, f.miniaturaId]))
    const antigos = Object.values(e.fotosFenomenos ?? {}).flatMap((f) => [f.miniaturaId, f.testeId ? undefined : f.arquivoId])
    await excluir([...criados.current, ...antigos].filter((id) => id && !usados.has(id)))
    onClose()
  }

  let corpo
  if (vista.k === 'ajuste' && fotos[vista.tipo]) {
    const t = vista.tipo, f = fotos[t]!
    corpo = <AjusteRecorte foto={f} titulo={nomeFenomeno(t)} onDone={(recorte) => { if (recorte) setFotos((x) => ({ ...x, [t]: { ...f, recorte } })); setVista({ k: 'lista' }) }} />
  } else if (vista.k === 'experimento') {
    corpo = <EscolherExperimento e={e} ocupado={!!ocupado} onBack={() => setVista({ k: 'lista' })} onPick={(testeId, arq) => usar(vista.tipo, arq, testeId)} />
  } else corpo = <>
    <p className="fx-origem">As fotos aparecem só na ficha de {e.nome}. A biblioteca de infográficos, os outros esmaltes e as informações técnicas não mudam.</p>
    <ul className="fx-ger">
      {tipos.map((t) => {
        const f = fotos[t]
        return (
          <li key={t}>
            <span className="fx-ger-mini">{f ? <FotoRecortada foto={f} alt="" /> : <AmostraFenomeno tipo={t} />}</span>
            <div className="fx-ger-txt">
              <b>{nomeFenomeno(t)}</b>
              <span className="fx-ger-orig">{ocupado === t ? 'Preparando a foto…' : f ? (f.testeId ? 'Foto de experimento' : 'Fotografia própria') : 'Infográfico técnico'}</span>
              <div className="fx-ger-acoes">
                <button className="iconbtn" disabled={!!ocupado} aria-label="Fotografar" title="Fotografar" onClick={() => { alvo.current = t; cam.current?.click() }}><Camera size={17} strokeWidth={1.5} /></button>
                <button className="iconbtn" disabled={!!ocupado} aria-label="Galeria" title="Galeria" onClick={() => { alvo.current = t; gal.current?.click() }}><ImageIcon size={17} strokeWidth={1.5} /></button>
                <button className="iconbtn" disabled={!!ocupado} aria-label="Foto de um experimento" title="Experimento" onClick={() => setVista({ k: 'experimento', tipo: t })}><FlaskConical size={17} strokeWidth={1.5} /></button>
                {f && <button className="iconbtn" aria-label="Ajustar enquadramento" title="Enquadrar" onClick={() => setVista({ k: 'ajuste', tipo: t })}><Crop size={17} strokeWidth={1.5} /></button>}
                {f && <button className="iconbtn" aria-label="Restaurar infográfico original" title="Restaurar infográfico" onClick={() => setFotos((x) => ({ ...x, [t]: undefined }))}><RotateCcw size={17} strokeWidth={1.5} /></button>}
              </div>
            </div>
          </li>
        )
      })}
    </ul>
    <div className="fx-acoes"><button className="btn sm" onClick={fechar}>Cancelar</button><button className="btn sm primary" disabled={!mudou || salvando || !!ocupado} onClick={salvar}>Salvar alterações</button></div>
  </>

  return (
    <Sheet onClose={fechar} label="Gerenciar imagens">
      <div className="fx-fen">
        <div className="fx-fen-h"><h2>{vista.k === 'ajuste' ? 'Enquadrar' : vista.k === 'experimento' ? 'Experimentos' : 'Gerenciar imagens'}</h2><button className="iconbtn" aria-label="Fechar" onClick={fechar}><X size={18} /></button></div>
        {corpo}
        <input ref={cam} type="file" accept="image/*" capture="environment" hidden onChange={(ev) => { void doArquivo(ev.target.files?.[0]); ev.target.value = '' }} />
        <input ref={gal} type="file" accept="image/*" hidden onChange={(ev) => { void doArquivo(ev.target.files?.[0]); ev.target.value = '' }} />
      </div>
    </Sheet>
  )
}

/** Fotos dos experimentos deste esmalte (sozinho ou em combinação), para reaproveitar sem copiar o arquivo. */
function EscolherExperimento({ e, onBack, onPick, ocupado }: { e: Esmalte; onBack: () => void; onPick: (testeId: string, arquivoId: string) => void; ocupado: boolean }) {
  const testes = useLiveQuery(async () => (await db.testes.toArray())
    .filter((t) => !t.excluido && t.fotos?.length && (t.esmalteId === e.id || t.combinacao?.includes(e.id)))
    .sort((a, b) => (b.data ?? '').localeCompare(a.data ?? '')), [e.id])
  return <>
    {testes && !testes.length && <p className="fx-vazio-l">Nenhum experimento com fotos para {e.nome}.</p>}
    {testes?.map((t) => (
      <div key={t.id} className="fx-exp-esc">
        <p className="fx-rot">{t.codigo}{t.data && ` · ${new Date(t.data + 'T12:00').toLocaleDateString('pt-BR')}`}{t.cone && ` · cone ${t.cone}`}</p>
        <div className="fx-exp-fotos">{t.fotos.map((f) => <MiniExp key={f} id={f} disabled={ocupado} onClick={() => onPick(t.id, f)} />)}</div>
      </div>
    ))}
    <div className="fx-acoes"><button className="btn sm" onClick={onBack}>Voltar</button></div>
  </>
}
function MiniExp({ id, onClick, disabled }: { id: string; onClick: () => void; disabled: boolean }) {
  const url = useArquivoUrl(id)
  return <button className="fx-exp-mini" disabled={disabled} onClick={onClick} aria-label="Usar esta foto">{url && <img src={url} alt="" />}</button>
}

/** Enquadramento: arrastar para mover, controle para ampliar. Não altera cores nem textura. */
function AjusteRecorte({ foto, titulo, onDone }: { foto: FotoFenomeno; titulo: string; onDone: (r?: Recorte) => void }) {
  const [r, setR] = useState<Recorte>(foto.recorte ?? SEM_RECORTE)
  const caixa = useRef<HTMLDivElement>(null)
  const arraste = useRef<{ px: number; py: number; r: Recorte } | undefined>(undefined)
  const url = useArquivoUrl(foto.arquivoId)
  const mover = (ev: PE) => {
    const a = arraste.current, el = caixa.current
    if (!a || !el) return
    const k = el.clientWidth * a.r.zoom
    setR({ ...a.r, x: Math.min(1, Math.max(0, a.r.x - (ev.clientX - a.px) / k)), y: Math.min(1, Math.max(0, a.r.y - (ev.clientY - a.py) / k)) })
  }
  return <>
    <p className="fx-rot">{titulo}</p>
    <div ref={caixa} className="foto-fen foto-ajuste" aria-label="Arraste para enquadrar"
      onPointerDown={(ev) => { (ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId); arraste.current = { px: ev.clientX, py: ev.clientY, r } }}
      onPointerMove={mover} onPointerUp={() => { arraste.current = undefined }} onPointerCancel={() => { arraste.current = undefined }}>
      {url && <img src={url} alt="" draggable={false} style={{ objectPosition: `${r.x * 100}% ${r.y * 100}%`, transform: `scale(${r.zoom})`, transformOrigin: `${r.x * 100}% ${r.y * 100}%` }} />}
    </div>
    <label className="fx-zoom">Ampliar<input type="range" min={1} max={4} step={0.05} value={r.zoom} onChange={(ev) => setR({ ...r, zoom: Number(ev.target.value) })} /></label>
    <p className="fx-origem">Arraste para mover. As cores e a textura da foto não são alteradas.</p>
    <div className="fx-acoes"><button className="btn sm" onClick={() => onDone()}>Voltar</button><button className="btn sm primary" onClick={() => onDone(r)}>Usar enquadramento</button></div>
  </>
}
