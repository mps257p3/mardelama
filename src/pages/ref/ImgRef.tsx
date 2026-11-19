import type { CSSProperties } from 'react'
import type { Referencia } from '../../db/schema'
import { Foto } from '../../ui/form'

/** Primeira imagem de uma referência: arquivo local ou, se não deu para baixar, a imagem hospedada na fonte. */
export function ImgRef({ r, style, alt }: { r: Pick<Referencia, 'imagens' | 'imagemExterna' | 'titulo'>; style?: CSSProperties; alt?: string }) {
  if (r.imagens[0]) return <Foto id={r.imagens[0]} alt={alt ?? r.titulo} style={style} />
  if (r.imagemExterna) return <img src={r.imagemExterna} alt={alt ?? r.titulo} referrerPolicy="no-referrer" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', ...style }} />
  return null
}
export const temImagem = (r: Pick<Referencia, 'imagens' | 'imagemExterna'>) => !!(r.imagens[0] || r.imagemExterna)
