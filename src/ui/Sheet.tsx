import { useEffect, type ReactNode } from 'react'

export function Sheet({ onClose, children, label, alto }: { onClose: () => void; children: ReactNode; label: string; alto?: boolean }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    const o = document.body.style.overflow; document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = o }
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
