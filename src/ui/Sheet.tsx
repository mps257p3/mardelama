import { useFecharComVoltar } from './voltarFecha'
import { travarRolagem } from './rolagem'
import { useEffect, type ReactNode } from 'react'

export function Sheet({ onClose, children, label, alto }: { onClose: () => void; children: ReactNode; label: string; alto?: boolean }) {
  useFecharComVoltar(onClose)
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    const soltar = travarRolagem()
    return () => { window.removeEventListener('keydown', k); soltar() }
  }, [onClose])
  return (
    <>
      <div className={"scrim" + (alto ? " alto" : "")} onClick={onClose} />
      <div className={"sheet" + (alto ? " alto" : "")} role="dialog" aria-modal="true" aria-label={label}>
        <div className="grab" />
        {children}
      </div>
    </>
  )
}
