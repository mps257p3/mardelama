import { useState, type CSSProperties } from 'react'
import { ImageOff } from 'lucide-react'
import type { Obra } from '../../../db/schema'
import { Foto } from '../../../ui/form'

/** Foto da obra: a guardada no aparelho; senão, a publicada na fonte original (sem copiar o arquivo). */
export function ImgObra({ o, style, className, alt }: { o?: Pick<Obra, 'arquivo' | 'imagem' | 'titulo'>; style?: CSSProperties; className?: string; alt?: string }) {
  const [falhou, setFalhou] = useState(false)
  if (o?.arquivo) return <Foto id={o.arquivo} alt={alt ?? o.titulo ?? ''} style={style} className={className} />
  if (o?.imagem && !falhou) return <img src={o.imagem} alt={alt ?? o.titulo ?? ''} referrerPolicy="no-referrer" loading="lazy" className={className} onError={() => setFalhou(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', ...style }} />
  return <span className="obra-sem" style={style}><ImageOff size={20} strokeWidth={1.2} /><span>{falhou ? 'Imagem indisponível na fonte' : 'Sem imagem'}</span></span>
}
