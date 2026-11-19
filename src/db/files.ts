import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, novo, type Tipo } from './schema'

/** Reduz fotos grandes antes de guardar (mantém qualidade para tela, economiza espaço e sincronização). */
async function reduzir(file: File, max = 2200): Promise<Blob> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') return file
  const bmp = await createImageBitmap(file)
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height))
  if (k === 1 && file.size < 1.5e6) return file
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k)
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height)
  return await new Promise<Blob>((r) => c.toBlob((b) => r(b ?? file), 'image/jpeg', 0.86))
}

export async function salvarArquivo(file: File, dono?: { tipo: Tipo; id: string }) {
  const blob = await reduzir(file)
  const a = novo({
    nome: file.name, mime: blob.type || file.type, tamanho: blob.size, blob,
    donoTipo: dono?.tipo, donoId: dono?.id,
  })
  await db.arquivos.add(a)
  return a.id
}

/** URL de objeto para exibir um arquivo guardado; libera a memória ao desmontar. */
export function useArquivoUrl(id?: string) {
  const arq = useLiveQuery(() => (id ? db.arquivos.get(id) : undefined), [id])
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    if (!arq?.blob) { setUrl(undefined); return }
    const u = URL.createObjectURL(arq.blob)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [arq])
  return url
}
