import { useEffect, useRef } from 'react'
import { Bold, Italic, Heading2, List, Quote, Link2, Eraser } from 'lucide-react'

/** Remove scripts e atributos de evento de HTML colado. */
export function limparHtml(html: string) {
  const d = new DOMParser().parseFromString(html, 'text/html')
  d.querySelectorAll('script,style,iframe,object,embed').forEach((n) => n.remove())
  d.querySelectorAll('*').forEach((el) => [...el.attributes].forEach((a) => {
    if (a.name.startsWith('on') || (a.name === 'href' && /^\s*javascript:/i.test(a.value)) || a.name === 'style' || a.name === 'class') el.removeAttribute(a.name)
  }))
  return d.body.innerHTML
}

export function TextoRico({ value, onChange, placeholder }: { value: string; onChange: (html: string) => void; placeholder?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value }, [value])
  const cmd = (c: string, v?: string) => { ref.current?.focus(); document.execCommand(c, false, v); onChange(limparHtml(ref.current!.innerHTML)) }
  return (
    <div className="rico">
      <div className="rico-barra">
        <button type="button" aria-label="Negrito" onMouseDown={(e) => { e.preventDefault(); cmd('bold') }}><Bold size={15} /></button>
        <button type="button" aria-label="Itálico" onMouseDown={(e) => { e.preventDefault(); cmd('italic') }}><Italic size={15} /></button>
        <button type="button" aria-label="Título" onMouseDown={(e) => { e.preventDefault(); cmd('formatBlock', 'h3') }}><Heading2 size={15} /></button>
        <button type="button" aria-label="Lista" onMouseDown={(e) => { e.preventDefault(); cmd('insertUnorderedList') }}><List size={15} /></button>
        <button type="button" aria-label="Citação" onMouseDown={(e) => { e.preventDefault(); cmd('formatBlock', 'blockquote') }}><Quote size={15} /></button>
        <button type="button" aria-label="Link" onMouseDown={(e) => { e.preventDefault(); const u = prompt('Endereço do link'); if (u) cmd('createLink', u) }}><Link2 size={15} /></button>
        <button type="button" aria-label="Limpar formatação" onMouseDown={(e) => { e.preventDefault(); cmd('removeFormat'); cmd('formatBlock', 'p') }}><Eraser size={15} /></button>
      </div>
      <div ref={ref} className="rico-area prosa" contentEditable suppressContentEditableWarning data-placeholder={placeholder}
        onInput={() => onChange(limparHtml(ref.current!.innerHTML))}
        onPaste={(e) => { e.preventDefault(); const h = e.clipboardData.getData('text/html'); if (h) document.execCommand('insertHTML', false, limparHtml(h)); else document.execCommand('insertText', false, e.clipboardData.getData('text/plain')) }} />
    </div>
  )
}

export const Prosa = ({ html }: { html: string }) => <div className="prosa" dangerouslySetInnerHTML={{ __html: limparHtml(html) }} />
