import { useEffect, useState, type CSSProperties } from 'react'
import { ImageOff } from 'lucide-react'
import { db, type Obra } from '../../../db/schema'
import { Foto } from '../../../ui/form'
import { salvarArquivo } from '../../../db/files'
import { cabecalhoLogin } from '../../../lib/login'

/** Pedidos em andamento por endereço: várias telas com a mesma obra fazem um pedido só. */
const emCurso = new Map<string, Promise<Blob | undefined>>()

/** Quando o site não deixa o navegador abrir a imagem, o servidor do app busca uma vez. */
function buscarPeloServidor(url: string) {
  let p = emCurso.get(url)
  if (!p) {
    p = (async () => {
      const r = await fetch('/api/imagem?u=' + encodeURIComponent(url), { headers: await cabecalhoLogin() })
      const b = r.ok ? await r.blob() : undefined
      return b && b.type.startsWith('image/') && b.size > 500 ? b : undefined
    })().catch(() => undefined)
    emCurso.set(url, p)
  }
  return p
}

/**
 * Foto da obra: a guardada no aparelho; senão, a publicada na fonte original.
 * Se a fonte não abrir no navegador, tenta pelo servidor e, sendo uma obra, guarda a cópia no aparelho.
 */
export function ImgObra({ o, style, className, alt }: { o?: Pick<Obra, 'arquivo' | 'imagem' | 'titulo'> & { id?: string }; style?: CSSProperties; className?: string; alt?: string }) {
  const [estado, setEstado] = useState<'web' | 'servidor' | 'falhou'>('web')
  const [local, setLocal] = useState<string>()
  const obraId = o?.id, imagem = o?.imagem
  // outra imagem no mesmo lugar (ex.: visor trocando de obra): começa de novo
  const [de, setDe] = useState(imagem)
  if (de !== imagem) { setDe(imagem); setEstado('web'); setLocal(undefined) }
  useEffect(() => {
    if (estado !== 'servidor' || !imagem) return
    let vivo = true, u: string | undefined
    buscarPeloServidor(imagem).then(async (b) => {
      if (!vivo) return
      if (!b) { setEstado('falhou'); return }
      // obra cadastrada: guarda no aparelho (vai junto na sincronização e funciona sem internet)
      if (obraId && (await db.obras.get(obraId))?.imagem === imagem) {
        const id = await salvarArquivo(new File([b], (o?.titulo || 'obra').slice(0, 60) + '.' + (b.type.split('/')[1] || 'jpg'), { type: b.type }))
        await db.obras.update(obraId, { arquivo: id, atualizadoEm: Date.now() })
      } else { u = URL.createObjectURL(b); setLocal(u) }
    })
    return () => { vivo = false; if (u) URL.revokeObjectURL(u) }
  }, [estado, imagem, obraId, o?.titulo])

  const estilo: CSSProperties = { width: '100%', height: '100%', objectFit: 'cover', display: 'block', ...style }
  if (o?.arquivo) return <Foto id={o.arquivo} alt={alt ?? o.titulo ?? ''} style={style} className={className} />
  if (local) return <img src={local} alt={alt ?? o?.titulo ?? ''} className={className} style={estilo} />
  if (imagem && estado === 'web') return <img src={imagem} alt={alt ?? o?.titulo ?? ''} referrerPolicy="no-referrer" loading="lazy" className={className} onError={() => setEstado(navigator.onLine ? 'servidor' : 'falhou')} style={estilo} />
  return <span className="obra-sem" style={style}><ImageOff size={20} strokeWidth={1.2} /><span>{estado === 'servidor' ? 'Carregando…' : estado === 'falhou' ? 'Imagem indisponível na fonte' : 'Sem imagem'}</span></span>
}
