import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { RefreshCw, X } from 'lucide-react'
import { db } from '../../db/schema'
import { useAjuste, definirAjuste } from '../../db/settings'
import { useToast } from '../../ui/toast'
import { acompanhar, atualizarRss, deixarDeAcompanhar, type ResultadoRss } from '../../lib/pinterestRss'

const quando = (t?: number) => t ? new Date(t).toLocaleString('pt-BR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'nunca'
const resumo = (r: ResultadoRss) => (r.novos || r.atualizados ? `${r.novos} pins novos${r.atualizados ? `, ${r.atualizados} atualizados` : ''}${r.analisados ? `, ${r.analisados} organizados pela IA` : ''}` : 'nada novo') + (r.falhas.length ? ` · ${r.falhas.length} com erro` : '')

/** Pastas e perfis públicos do Pinterest acompanhados pelo RSS oficial: funciona sem login e sem aprovação. */
export function PastasRss() {
  const toast = useToast()
  const pastas = useLiveQuery(async () => (await db.grupos.toArray()).filter((g) => !g.excluido && g.rss).sort((a, b) => a.nome.localeCompare(b.nome)), [], [])
  const ultimo = useAjuste<ResultadoRss | undefined>('pinterest.rss.ultimo', undefined)
  const ia = useAjuste<boolean>('pinterest.rss.ia', false)
  const [link, setLink] = useState('')
  const [ocupado, setOcupado] = useState<string>()

  async function adicionar() {
    if (!link.trim()) return
    setOcupado('Lendo a pasta…')
    try {
      const r = await acompanhar(link.trim())
      setLink('')
      toast(`Acompanhando “${r.grupo.nome}”: ${r.novos} pins novos${r.atualizados ? `, ${r.atualizados} já estavam no Acervo` : ''}`)
    } catch (e) { toast((e as Error).message) } finally { setOcupado(undefined) }
  }
  async function atualizar() {
    setOcupado('Atualizando…')
    try { const r = await atualizarRss((t) => setOcupado(t)); toast('Pinterest: ' + resumo(r)) } catch (e) { toast((e as Error).message) } finally { setOcupado(undefined) }
  }

  return (
    <section className="pin-conta">
      <h3>Pastas públicas</h3>
      <p className="faint">Cole o link de uma pasta pública do Pinterest (sua ou de qualquer pessoa) ou de um perfil. O app lê o RSS oficial dela e traz os pins novos para o Acervo, no grupo com o nome da pasta. Não precisa de login. Pastas secretas não têm RSS.</p>
      <div className="pin-rss-add">
        <input className="input" inputMode="url" placeholder="https://br.pinterest.com/perfil/nome-da-pasta/" value={link} onChange={(e) => setLink(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && adicionar()} />
        <button className="btn primary" disabled={!!ocupado || !link.trim()} onClick={adicionar}>Acompanhar</button>
      </div>
      {pastas.length > 0 && <>
        <ul className="pin-rss-lista">
          {pastas.map((g) => (
            <li key={g.id}>
              <b>{g.nome}</b>
              <a className="faint" href={g.rss} target="_blank" rel="noreferrer">{g.rss!.replace(/^https:\/\/www\.pinterest\.com\//, '').replace(/\/$/, '')}</a>
              <button className="iconbtn" aria-label={`Parar de acompanhar ${g.nome}`} disabled={!!ocupado} onClick={async () => { if (confirm(`Parar de acompanhar “${g.nome}”? O grupo e os pins continuam no Acervo.`)) await deixarDeAcompanhar(g.id) }}><X size={15} /></button>
            </li>
          ))}
        </ul>
        <div className="pin-acoes">
          <button className="btn" disabled={!!ocupado} onClick={atualizar}><RefreshCw size={15} />{ocupado ?? 'Atualizar agora'}</button>
        </div>
        <p className="faint" style={{ fontSize: 12.5 }}>Última atualização: {quando(ultimo?.quando)}{ultimo ? ` (${resumo(ultimo)})` : ''}. O app confere a cada 6 horas quando está aberto. O RSS mostra só os pins mais recentes de cada pasta (cerca de 25), então o app guarda o que chega e nunca apaga.</p>
        {ultimo?.falhas.map((f) => <p key={f.nome} className="faint" style={{ fontSize: 12.5 }}>{f.nome}: {f.erro}</p>)}
      </>}
      <label className="sug-campo"><input type="checkbox" checked={ia} onChange={() => definirAjuste('pinterest.rss.ia', !ia)} />
        <div>Deixar a IA organizar os pins novos (até 8 por vez): ela lê a imagem, acrescenta tags e cores e coloca também nos seus grupos que combinarem. Alimenta o repertório estético e o Descobrir. Usa crédito da Anthropic.</div></label>
    </section>
  )
}
