import { useRef, useState, type PointerEvent as PE } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Camera, FlaskConical, Image as ImageIcon, RotateCcw, Crop, X } from 'lucide-react'
import { db, type Esmalte, type FotoFenomeno } from '../../../db/schema'
import { criarMiniatura, salvarArquivo, useArquivoUrl } from '../../../db/files'
import { Sheet } from '../../../ui/Sheet'
import { nomeFenomeno } from '../../../ui/AmostraFenomeno'

type Recorte = NonNullable<FotoFenomeno['recorte']>
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

/** Grava (ou apaga, com `undefined`) a foto de um fenômeno só neste esmalte. */
async function gravar(e: Esmalte, tipo: string, foto: FotoFenomeno | undefined) {
  const atual = (await db.esmaltes.get(e.id))?.fotosFenomenos ?? {}
  const prox = { ...atual }
  const velha = atual[tipo]
  if (foto) prox[tipo] = foto; else delete prox[tipo]
  await db.esmaltes.update(e.id, { fotosFenomenos: Object.keys(prox).length ? prox : undefined, atualizadoEm: Date.now() })
  // arquivos criados aqui saem junto; a foto original de um experimento nunca é apagada
  if (velha && velha.arquivoId !== foto?.arquivoId) {
    const lixo = [velha.miniaturaId, velha.testeId ? undefined : velha.arquivoId].filter((x): x is string => !!x && x !== foto?.miniaturaId)
    for (const id of lixo) await db.arquivos.update(id, { excluido: 1, atualizadoEm: Date.now() })
  }
}

/** Menu do botão de câmera: fotografar, galeria, experimento, ajustar, restaurar. */
export function MenuFoto({ e, tipo, onClose }: { e: Esmalte; tipo: string; onClose: () => void }) {
  const foto = e.fotosFenomenos?.[tipo]
  const cam = useRef<HTMLInputElement>(null), gal = useRef<HTMLInputElement>(null)
  const [etapa, setEtapa] = useState<'menu' | 'experimento' | 'ajuste'>('menu')
  const [nova, setNova] = useState<FotoFenomeno | undefined>()
  const [ocupado, setOcupado] = useState(false)
  const dono = { tipo: 'esmalte' as const, id: e.id }

  const doArquivo = async (f?: File) => {
    if (!f) return
    setOcupado(true)
    try {
      const arquivoId = await salvarArquivo(f, dono)
      setNova({ arquivoId, miniaturaId: await criarMiniatura(arquivoId, dono), data: Date.now() })
      setEtapa('ajuste')
    } finally { setOcupado(false) }
  }
  const doExperimento = async (testeId: string, arquivoId: string) => {
    setOcupado(true)
    try {
      setNova({ arquivoId, testeId, miniaturaId: await criarMiniatura(arquivoId, dono), data: Date.now() })
      setEtapa('ajuste')
    } finally { setOcupado(false) }
  }
  const cancelarNova = async () => {
    // descarta o que foi criado para uma foto que não chegou a ser salva
    if (nova) for (const id of [nova.miniaturaId, nova.testeId ? undefined : nova.arquivoId]) if (id) await db.arquivos.update(id, { excluido: 1, atualizadoEm: Date.now() })
    onClose()
  }

  if (etapa === 'ajuste' && (nova ?? foto)) {
    const alvo = (nova ?? foto)!
    return <AjusteRecorte foto={alvo} titulo={nomeFenomeno(tipo)}
      onCancel={nova ? cancelarNova : onClose}
      onSave={async (recorte) => { await gravar(e, tipo, { ...alvo, recorte }); onClose() }} />
  }
  if (etapa === 'experimento') return <EscolherExperimento e={e} onClose={onClose} onBack={() => setEtapa('menu')} onPick={doExperimento} ocupado={ocupado} />

  const fontes = <>
    <button className="fx-op" disabled={ocupado} onClick={() => cam.current?.click()}><Camera size={18} strokeWidth={1.5} />Fotografar amostra</button>
    <button className="fx-op" disabled={ocupado} onClick={() => gal.current?.click()}><ImageIcon size={18} strokeWidth={1.5} />Selecionar foto da galeria</button>
    <button className="fx-op" disabled={ocupado} onClick={() => setEtapa('experimento')}><FlaskConical size={18} strokeWidth={1.5} />Selecionar foto de um experimento</button>
  </>
  return (
    <Sheet onClose={onClose} label={`Foto: ${nomeFenomeno(tipo)}`}>
      <div className="fx-fen">
        <div className="fx-fen-h"><h2>{nomeFenomeno(tipo)}</h2><button className="iconbtn" aria-label="Fechar" onClick={onClose}><X size={18} /></button></div>
        <p className="fx-origem">A foto aparece só na ficha de {e.nome}. A biblioteca de infográficos, os outros esmaltes e as informações técnicas não mudam.</p>
        {foto ? <>
          <p className="fx-rot fx-op-t">Substituir fotografia</p>{fontes}
          <p className="fx-rot fx-op-t">Esta fotografia</p>
          <button className="fx-op" onClick={() => setEtapa('ajuste')}><Crop size={18} strokeWidth={1.5} />Ajustar enquadramento</button>
          <button className="fx-op" onClick={async () => { await gravar(e, tipo, undefined); onClose() }}><RotateCcw size={18} strokeWidth={1.5} />Restaurar infográfico original</button>
        </> : fontes}
        {ocupado && <p className="fx-origem">Preparando a foto…</p>}
        <input ref={cam} type="file" accept="image/*" capture="environment" hidden onChange={(ev) => { void doArquivo(ev.target.files?.[0]); ev.target.value = '' }} />
        <input ref={gal} type="file" accept="image/*" hidden onChange={(ev) => { void doArquivo(ev.target.files?.[0]); ev.target.value = '' }} />
      </div>
    </Sheet>
  )
}

/** Fotos dos experimentos deste esmalte (sozinho ou em combinação), para reaproveitar sem copiar o arquivo. */
function EscolherExperimento({ e, onClose, onBack, onPick, ocupado }: { e: Esmalte; onClose: () => void; onBack: () => void; onPick: (testeId: string, arquivoId: string) => void; ocupado: boolean }) {
  const testes = useLiveQuery(async () => (await db.testes.toArray())
    .filter((t) => !t.excluido && t.fotos?.length && (t.esmalteId === e.id || t.combinacao?.includes(e.id)))
    .sort((a, b) => (b.data ?? '').localeCompare(a.data ?? '')), [e.id])
  return (
    <Sheet onClose={onClose} label="Foto de um experimento">
      <div className="fx-fen">
        <div className="fx-fen-h"><h2>Experimentos</h2><button className="iconbtn" aria-label="Fechar" onClick={onClose}><X size={18} /></button></div>
        {testes && !testes.length && <p className="fx-vazio-l">Nenhum experimento com fotos para {e.nome}.</p>}
        {testes?.map((t) => (
          <div key={t.id} className="fx-exp-esc">
            <p className="fx-rot">{t.codigo}{t.data && ` · ${new Date(t.data + 'T12:00').toLocaleDateString('pt-BR')}`}{t.cone && ` · cone ${t.cone}`}</p>
            <div className="fx-exp-fotos">{t.fotos.map((f) => <MiniExp key={f} id={f} disabled={ocupado} onClick={() => onPick(t.id, f)} />)}</div>
          </div>
        ))}
        <button className="btn sm" onClick={onBack}>Voltar</button>
      </div>
    </Sheet>
  )
}
function MiniExp({ id, onClick, disabled }: { id: string; onClick: () => void; disabled: boolean }) {
  const url = useArquivoUrl(id)
  return <button className="fx-exp-mini" disabled={disabled} onClick={onClick} aria-label="Usar esta foto">{url && <img src={url} alt="" />}</button>
}

/** Enquadramento: arrastar para mover, controle para ampliar. Não altera cores nem textura. */
function AjusteRecorte({ foto, titulo, onSave, onCancel }: { foto: FotoFenomeno; titulo: string; onSave: (r: Recorte) => void; onCancel: () => void }) {
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
  return (
    <Sheet onClose={onCancel} label={`Enquadrar foto: ${titulo}`}>
      <div className="fx-fen">
        <div className="fx-fen-h"><h2>Enquadrar</h2><button className="iconbtn" aria-label="Fechar" onClick={onCancel}><X size={18} /></button></div>
        <div ref={caixa} className="foto-fen foto-ajuste"
          onPointerDown={(ev) => { (ev.target as HTMLElement).setPointerCapture(ev.pointerId); arraste.current = { px: ev.clientX, py: ev.clientY, r } }}
          onPointerMove={mover} onPointerUp={() => { arraste.current = undefined }} onPointerCancel={() => { arraste.current = undefined }}>
          {url && <img src={url} alt="" draggable={false} style={{ objectPosition: `${r.x * 100}% ${r.y * 100}%`, transform: `scale(${r.zoom})`, transformOrigin: `${r.x * 100}% ${r.y * 100}%` }} />}
        </div>
        <label className="fx-zoom">Ampliar<input type="range" min={1} max={4} step={0.05} value={r.zoom} onChange={(ev) => setR({ ...r, zoom: Number(ev.target.value) })} /></label>
        <p className="fx-origem">Arraste para mover. As cores e a textura da foto não são alteradas.</p>
        <div className="fx-acoes"><button className="btn sm" onClick={onCancel}>Cancelar</button><button className="btn sm primary" onClick={() => onSave(r)}>Salvar</button></div>
      </div>
    </Sheet>
  )
}
