import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { db, type Referencia } from '../../db/schema'
import { useAjuste } from '../../db/settings'
import { marcarPinsVistos, pinsNovos, ehPin } from '../../lib/ref2'
import { useToast } from '../../ui/toast'
import { ImgRef } from '../ref/ImgRef'
import { VisorRefs } from '../ref/VisorRefs'
import { BASE2 } from './Topo2'
import { mudarFiltroAcervo2 } from './filtroAcervo2'

/**
 * Pinterest em Referências 2. A conexão (API oficial e RSS) só lê as suas pastas: não existe busca no Pinterest inteiro
 * para este app. Aqui ficam os pins que chegaram e você ainda não viu; eles já estão no Acervo e aparecem marcados assim.
 */
export function NovidadesPinterest() {
  const toast = useToast()
  const nav = useNavigate()
  const [novos, setNovos] = useState<Referencia[]>()
  const [total, setTotal] = useState<number>()
  const [lendo, setLendo] = useState<string>()
  const [visor, setVisor] = useState<number>()
  const ultimoRss = useAjuste<{ quando: number; novos: number; falhas: unknown[] } | undefined>('pinterest.rss.ultimo', undefined)
  const ultimoApi = useAjuste<{ quando: number; novos: number; erro?: string } | undefined>('pinterest.ultimo', undefined)
  const conectado = useAjuste<boolean>('pinterest.conectado', false)

  async function carregar() {
    const [xs, n] = await Promise.all([pinsNovos(80), db.referencias.filter((r) => ehPin(r) && !r.excluido).count()])
    setNovos(xs); setTotal(n)
  }
  useEffect(() => { carregar() }, [])
  // o que apareceu aqui deixa de ser novidade na próxima visita (continua na tela até você sair)
  useEffect(() => {
    if (!novos?.length) return
    const t = setTimeout(() => marcarPinsVistos(novos.map((r) => r.id)), 4000)
    return () => clearTimeout(t)
  }, [novos])

  async function atualizar() {
    let n = 0; const erros: string[] = []
    try {
      setLendo('Lendo as pastas públicas…')
      const { atualizarRss } = await import('../../lib/pinterestRss')
      const r = await atualizarRss((t) => setLendo(t)); n += r.novos
      if (r.falhas.length) erros.push(`${r.falhas.length} pasta(s) não responderam`)
    } catch (e) { erros.push((e as Error).message) }
    try {
      const { estadoPinterest, sincronizarPinterest } = await import('../../lib/pinterestConta')
      const e = await estadoPinterest().catch(() => undefined)
      if (e?.conectado) { setLendo('Lendo a conta conectada…'); const r = await sincronizarPinterest((t) => setLendo(t)); n += r.novos }
    } catch (e) { erros.push((e as Error).message) }
    setLendo(undefined)
    toast(n ? `${n} pins novos no Acervo` + (erros.length ? ` · ${erros[0]}` : '') : erros.length ? erros[0] : 'Nenhum pin novo nas suas pastas.')
    const xs = await pinsNovos(80)
    setNovos((ant) => [...xs.filter((x) => !ant?.some((a) => a.id === x.id)), ...(ant ?? [])])
  }

  const quando = Math.max(ultimoRss?.quando ?? 0, ultimoApi?.quando ?? 0)
  return <section className="ref2-pinterest">
    <div className="ref2-pin-head">
      <div>
        <p className="ref2-secao-t" style={{ margin: 0 }}>Novidades das suas pastas</p>
        <p className="faint" style={{ fontSize: 12.5, margin: '2px 0 0' }}>
          {total != null ? `${total} pins no Acervo` : '…'}{quando ? ` · pastas lidas em ${new Date(quando).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}` : ''}{conectado ? ' · conta conectada' : ''}
        </p>
      </div>
      <button className="btn sm" disabled={!!lendo} onClick={atualizar}><RefreshCw size={14} className={lendo ? 'gira' : ''} />{lendo ? 'Lendo…' : 'Ler pastas'}</button>
    </div>
    {lendo && <p className="faint" style={{ fontSize: 12.5, margin: '0 0 8px' }}>{lendo}</p>}
    {novos && novos.length === 0 && <p className="faint" style={{ fontSize: 13.5, margin: '4px 0 12px' }}>Nenhum pin novo desde a sua última visita. Os que já estavam no Acervo não aparecem aqui como novidade. <button className="link" onClick={() => { mudarFiltroAcervo2({ origens: ['pinterest'] }); nav(`${BASE2}/acervo`) }}>Ver os pins no Acervo</button></p>}
    {!!novos?.length && <div className="ref2-pin-grade">
      {novos.slice(0, 24).map((r, i) => <button key={r.id} className="ref2-pin" onClick={() => setVisor(i)} aria-label={r.titulo}>
        <ImgRef r={r} /><span className="ref2-origem">Novo · no Acervo</span>
      </button>)}
    </div>}
    {!!novos && novos.length > 24 && <p className="faint" style={{ fontSize: 12.5 }}><button className="link" onClick={() => { mudarFiltroAcervo2({ origens: ['pinterest'], ordem: 'atualizadas' }); nav(`${BASE2}/acervo`) }}>Ver todos os {novos.length} no Acervo</button></p>}
    <p className="faint ref2-nota">A conexão com o Pinterest lê só as suas pastas (conta conectada e pastas públicas por RSS); o Pinterest não libera busca no site inteiro para este app. Mais abaixo, o app usa o que há nas suas pastas para buscar obras em outras fontes. <Link to="/referencias/pinterest">Pastas e conexão</Link></p>
    {visor != null && novos && <VisorRefs lista={novos.slice(0, 24)} inicio={visor} onClose={() => setVisor(undefined)} base={BASE2} />}
  </section>
}
