import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { MoreHorizontal, Check } from 'lucide-react'

export interface ItemMenu { l: string; icon?: ReactNode; to?: string; onClick?: () => unknown; on?: boolean; sep?: boolean; disabled?: boolean }

/** Menu discreto de três pontos: guarda as ações secundárias fora da tela. */
export function Menu({ itens, rotulo = 'Mais opções' }: { itens: ItemMenu[]; rotulo?: string }) {
  const [aberto, setAberto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const nav = useNavigate()
  useEffect(() => {
    if (!aberto) return
    const f = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setAberto(false) }
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false)
    document.addEventListener('pointerdown', f); window.addEventListener('keydown', k)
    return () => { document.removeEventListener('pointerdown', f); window.removeEventListener('keydown', k) }
  }, [aberto])
  return (
    <div className="menu-c" ref={ref}>
      <button className={'iconbtn' + (aberto ? ' on' : '')} aria-label={rotulo} aria-expanded={aberto} onClick={() => setAberto(!aberto)}><MoreHorizontal size={20} /></button>
      {aberto && <div className="menu-pop" role="menu">
        {itens.map((i, k) => i.sep ? <div key={k} className="menu-sep" /> : (
          <button key={k} role="menuitem" disabled={i.disabled} onClick={async () => { setAberto(false); if (i.to) nav(i.to); else await i.onClick?.() }}>
            <span className="ic">{i.icon}</span><span className="l">{i.l}</span>{i.on && <Check size={15} />}
          </button>
        ))}
      </div>}
    </div>
  )
}
