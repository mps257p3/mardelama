import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { RotateCcw } from 'lucide-react'
import { definirAjuste } from '../db/settings'
import { CAMPOS_LAYOUT, CHAVE_LAYOUT, LAYOUT_PADRAO, aplicarLayout, useLayout, type LayoutPag } from '../lib/layout'
import { Voltar } from '../ui/Voltar'
import { CabecalhoPagina } from '../ui/Pagina'
import { CapaArea } from '../ui/FotoEditavel'

/**
 * Layout das páginas: as medidas do padrão (título, capa, espaçamentos).
 * Mexer aqui muda Esmaltaria, Referências, Biblioteca e Caderno ao mesmo tempo, e vai na sincronização.
 */
export default function AjustesLayout() {
  const salvo = useLayout()
  const [l, setL] = useState<LayoutPag>(salvo)
  const t = useRef<number | undefined>(undefined)
  // o valor salvo pode chegar depois (sincronização): acompanha enquanto ninguém está mexendo
  useEffect(() => { if (t.current === undefined) setL(salvo) }, [salvo.titulo, salvo.capa, salvo.tituloCapa, salvo.capaConteudo, salvo.cardsH, salvo.cardsV, salvo.secao]) // eslint-disable-line react-hooks/exhaustive-deps

  function mudar(k: keyof LayoutPag, v: number) {
    const n = { ...l, [k]: v }
    setL(n); aplicarLayout(n) // aparece na hora
    clearTimeout(t.current)
    t.current = window.setTimeout(() => { t.current = undefined; definirAjuste(CHAVE_LAYOUT, n) }, 400)
  }
  function restaurar() { clearTimeout(t.current); t.current = undefined; setL(LAYOUT_PADRAO); aplicarLayout(LAYOUT_PADRAO); definirAjuste(CHAVE_LAYOUT, {}) }
  const mudou = CAMPOS_LAYOUT.some((c) => l[c.k] !== LAYOUT_PADRAO[c.k])

  return (
    <div className="page" style={{ maxWidth: 760 }}>
      <Voltar to="/ajustes">Ajustes</Voltar>
      <CabecalhoPagina titulo="Layout">
        {mudou && <button className="btn sm" onClick={restaurar}><RotateCcw size={14} />Padrão</button>}
      </CabecalhoPagina>
      <p className="muted" style={{ margin: '-6px 0 16px' }}>Estas medidas valem para Esmaltaria, Referências, Biblioteca e Caderno ao mesmo tempo. A prévia abaixo muda enquanto você mexe.</p>

      <CapaArea slug="esmaltes" nome="Esmaltaria" />

      <div className="lay-campos">
        {CAMPOS_LAYOUT.map((c) => (
          <label key={c.k} className="lay-campo">
            <span className="t">{c.nome}<span className="s">{c.desc}</span></span>
            <span className="v">{c.px ? `${l[c.k]} px` : l[c.k].toFixed(1).replace('.', ',')}</span>
            <input type="range" min={c.min} max={c.max} step={c.passo} value={l[c.k]} onChange={(e) => mudar(c.k, Number(e.target.value))} />
          </label>
        ))}
      </div>
      <p className="faint" style={{ fontSize: 13, marginTop: 18 }}>Para ver numa página inteira: <Link to="/laboratorio">Esmaltaria</Link> · <Link to="/biblioteca">Biblioteca</Link> · <Link to="/caderno">Caderno</Link> · <Link to="/referencias/descobrir">Referências</Link>.</p>
    </div>
  )
}
