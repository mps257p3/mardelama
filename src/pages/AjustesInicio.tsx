import { useEffect, useRef } from 'react'
import { ArrowDown, ArrowUp, Eye, EyeOff, ImagePlus, RotateCcw } from 'lucide-react'
import { db } from '../db/schema'
import { salvarArquivo } from '../db/files'
import { definirAjuste, useAjuste } from '../db/settings'
import { AREAS } from '../ui/nav'
import { useToast } from '../ui/toast'
import { Destaque, useFotoArea } from './Home'
import { SECOES_INICIO, useDestaqueCfg, useSecoesInicio, type DestaqueCfg } from '../lib/inicio'

function escolherImagem(): Promise<File | undefined> {
  return new Promise((r) => {
    const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'
    i.onchange = () => r(i.files?.[0]); i.click()
  })
}

async function trocarImagem(chave: string, atual: string | undefined, dono: string) {
  const f = await escolherImagem(); if (!f) return false
  const id = await salvarArquivo(f, { tipo: 'nota', id: dono })
  if (atual) await db.arquivos.delete(atual)
  await definirAjuste(chave, id)
  return true
}
async function restaurarImagem(chave: string, atual?: string) {
  if (atual) await db.arquivos.delete(atual)
  await db.ajustes.delete(chave)
}

function FotoArea({ a }: { a: (typeof AREAS)[number] }) {
  const toast = useToast()
  const chave = `area.foto.${a.slug}`
  const atual = useAjuste<string | undefined>(chave, undefined)
  const src = useFotoArea(a.slug)
  return (
    <div className="ajuste-area">
      <img src={src} alt="" />
      <div className="info">
        <span style={{ fontWeight: 500 }}>{a.nome}</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn sm" onClick={async () => { if (await trocarImagem(chave, atual, 'area-' + a.slug)) toast(`Foto de ${a.nome} atualizada`) }}><ImagePlus size={14} />Trocar</button>
          {atual && <button className="iconbtn" aria-label="Restaurar foto original" onClick={() => restaurarImagem(chave, atual).then(() => toast('Foto original restaurada'))}><RotateCcw size={16} /></button>}
        </div>
      </div>
    </div>
  )
}

export function AjustesInicio() {
  const toast = useToast()
  const destaque = useAjuste<string | undefined>('destaque', undefined)
  const cfg = useDestaqueCfg()
  const secoes = useSecoesInicio()
  const ref = useRef<HTMLElement>(null)
  useEffect(() => { if (location.hash === '#tela-inicial') setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth' }), 200) }, [])
  const muda = (p: Partial<DestaqueCfg>) => definirAjuste('destaque.cfg', { ...cfg, ...p })
  const mover = (i: number, d: number) => {
    const s = [...secoes]; const j = i + d; if (j < 0 || j >= s.length) return
    ;[s[i], s[j]] = [s[j], s[i]]; definirAjuste('inicio.secoes', s)
  }

  return (
    <section id="tela-inicial" ref={ref} style={{ marginTop: 32, scrollMarginTop: 16 }}>
      <h3>Tela inicial</h3>

      <p className="rotulo-ajuste">Fotografia de destaque</p>
      <Destaque editar={false} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        <button className="btn sm primary" onClick={async () => { if (await trocarImagem('destaque', destaque, 'destaque')) { await muda({ x: 50, y: 50 }); toast('Fotografia de destaque atualizada') } }}><ImagePlus size={14} />Trocar fotografia</button>
        {destaque && <button className="btn sm" onClick={() => restaurarImagem('destaque', destaque).then(() => toast('Fotografia original restaurada'))}><RotateCcw size={14} />Restaurar original</button>}
      </div>
      <div className="form" style={{ marginTop: 16 }}>
        <div className="field"><label>Enquadramento horizontal</label><input type="range" min={0} max={100} value={cfg.x} onChange={(e) => muda({ x: +e.target.value })} /></div>
        <div className="field"><label>Enquadramento vertical</label><input type="range" min={0} max={100} value={cfg.y} onChange={(e) => muda({ y: +e.target.value })} /></div>
        <div className="field"><label>Crédito da imagem (opcional)</label><input className="input" placeholder="ex.: @artista" defaultValue={cfg.credito ?? ''} onBlur={(e) => muda({ credito: e.target.value.trim() || undefined })} /></div>
        <div className="field">
          <label>Título</label>
          <div className="seg" style={{ alignSelf: 'flex-start' }}>
            <button className={!cfg.tituloSobre ? 'on' : ''} onClick={() => muda({ tituloSobre: false })}>Abaixo da foto</button>
            <button className={cfg.tituloSobre && cfg.tituloClaro ? 'on' : ''} onClick={() => muda({ tituloSobre: true, tituloClaro: true })}>Sobre, claro</button>
            <button className={cfg.tituloSobre && !cfg.tituloClaro ? 'on' : ''} onClick={() => muda({ tituloSobre: true, tituloClaro: false })}>Sobre, escuro</button>
          </div>
        </div>
      </div>

      <p className="rotulo-ajuste">Fotografias das áreas</p>
      <div className="ajuste-areas">{AREAS.map((a) => <FotoArea key={a.slug} a={a} />)}</div>

      <p className="rotulo-ajuste">Seções</p>
      <div className="linhas">
        {secoes.map((s, i) => (
          <div key={s.id} className="linha-secao" style={{ opacity: s.on ? 1 : 0.5 }}>
            <span>{SECOES_INICIO.find((x) => x.id === s.id)?.nome}</span>
            <button className="iconbtn" aria-label="Subir" disabled={i === 0} onClick={() => mover(i, -1)}><ArrowUp size={16} /></button>
            <button className="iconbtn" aria-label="Descer" disabled={i === secoes.length - 1} onClick={() => mover(i, 1)}><ArrowDown size={16} /></button>
            <button className="iconbtn" aria-label={s.on ? 'Ocultar' : 'Mostrar'} onClick={() => definirAjuste('inicio.secoes', secoes.map((x) => x.id === s.id ? { ...x, on: !x.on } : x))}>{s.on ? <Eye size={16} /> : <EyeOff size={16} />}</button>
          </div>
        ))}
      </div>
    </section>
  )
}
