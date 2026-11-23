import { useEffect, useRef, useState } from 'react'
import type { ItemDescoberta } from '../../lib/fontes'
import { estadoVisao, imagemDeUrl, limiarDo, notaContra, ouvirVisao, vetorDe, vetoresDe, type EstadoVisao, type Imagem } from '../../lib/visao'

/**
 * Com o que cada imagem do Descobrir é comparada.
 * `filtrar`: o que não se parece nada com o conjunto some (Seus artistas, feed).
 * `ordenar`: o mais parecido sobe (Mais como esta, busca por foto, semelhantes de uma referência).
 */
export interface Alvo { modo: 'filtrar' | 'ordenar'; chave: string; imagens: () => Promise<Imagem[]> }
export interface Nota { n: number; limiar: number; modo: Alvo['modo'] }

export function useEstadoVisao() {
  const [e, setE] = useState<EstadoVisao>(estadoVisao())
  useEffect(() => ouvirVisao(setE), [])
  return e
}

/** Lê as imagens à medida que chegam e dá a cada uma a nota de semelhança com o seu alvo. */
export function useFiltroVisual(itens: ItemDescoberta[], alvoDe: (x: ItemDescoberta) => Alvo | undefined, chaveCtx: string, ativo: boolean) {
  const [estado, setNotas] = useState<{ ctx: string; m: Map<string, Nota> }>({ ctx: chaveCtx, m: new Map() })
  // notas de outro contexto não valem mais
  const notas = estado.ctx === chaveCtx ? estado.m : new Map<string, Nota>()
  const [lendo, setLendo] = useState(0)
  const conjuntos = useRef(new Map<string, Promise<{ refs: Float32Array[]; limiar: number }>>())
  const pedidos = useRef(new Set<string>())
  const ctxAtual = useRef(chaveCtx)
  const alvoRef = useRef(alvoDe)
  useEffect(() => { alvoRef.current = alvoDe })

  // novo contexto (outro grupo, outra busca): começa do zero
  useEffect(() => {
    ctxAtual.current = chaveCtx
    conjuntos.current.clear(); pedidos.current.clear()
  }, [chaveCtx])

  useEffect(() => {
    if (!ativo) return
    for (const x of itens) {
      if (pedidos.current.has(x.id)) continue
      const alvo = alvoRef.current(x)
      if (!alvo) continue
      pedidos.current.add(x.id)
      const ctx = ctxAtual.current
      setLendo((n) => n + 1)
      void (async () => {
        let c = conjuntos.current.get(alvo.chave)
        if (!c) {
          c = alvo.imagens().then(vetoresDe).then((refs) => ({ refs, limiar: limiarDo(refs) }))
          conjuntos.current.set(alvo.chave, c)
        }
        const { refs, limiar } = await c
        if (!refs.length || ctxAtual.current !== ctx) return
        const v = await vetorDe(imagemDeUrl(x.imagem))
        if (!v || ctxAtual.current !== ctx) return
        setNotas((e) => ({ ctx, m: new Map(e.ctx === ctx ? e.m : undefined).set(x.id, { n: notaContra(v, refs), limiar, modo: alvo.modo }) }))
      })().catch(() => undefined).finally(() => setLendo((n) => n - 1))
    }
  }, [itens, ativo, chaveCtx])

  const escondidos = new Set<string>()
  if (ativo) for (const [id, k] of notas) if (k.modo === 'filtrar' && k.n < k.limiar) escondidos.add(id)
  return { notas, escondidos, lendo: ativo ? lendo : 0 }
}

/** Ordena pelo mais parecido; o que ainda não foi lido fica no fim, na ordem em que chegou. */
export function ordenarPorNota(xs: ItemDescoberta[], notas: Map<string, Nota>) {
  const lidos = xs.filter((x) => notas.has(x.id)).sort((a, b) => notas.get(b.id)!.n - notas.get(a.id)!.n)
  return [...lidos, ...xs.filter((x) => !notas.has(x.id))]
}
