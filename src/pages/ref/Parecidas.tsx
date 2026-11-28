import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ScanSearch } from 'lucide-react'
import { db, type Referencia } from '../../db/schema'
import { estadoVisao, imagemDaRef, semelhanca, vetorDe } from '../../lib/visao'
import { ImgRef } from './ImgRef'

/** "Mais como esta": as referências do seu acervo que mais se parecem com esta, pela imagem (como o "relacionados" do Pinterest). */
export function ParecidasNoAcervo({ r, base: baseRota = '/referencias' }: { r: Referencia; base?: string }) {
  const [estado, setEstado] = useState<{ lidas: number; total: number }>()
  const [achadas, setAchadas] = useState<Referencia[]>()
  const [erro, setErro] = useState<string>()
  const base = imagemDaRef(r)
  if (!base) return null

  async function procurar() {
    setErro(undefined); setAchadas(undefined)
    const v = await vetorDe(base!)
    if (!v) { setErro(estadoVisao().fase === 'erro' ? 'O modelo de visão não baixou agora. Confira a internet e tente de novo.' : 'Não deu para ler esta imagem.'); return }
    const outras = (await db.referencias.toArray()).filter((x) => !x.excluido && x.id !== r.id && imagemDaRef(x)).sort((a, b) => b.atualizadoEm - a.atualizadoEm).slice(0, 400)
    let lidas = 0
    setEstado({ lidas, total: outras.length })
    const notas = await Promise.all(outras.map(async (x) => {
      const w = await vetorDe(imagemDaRef(x)!)
      setEstado({ lidas: ++lidas, total: outras.length })
      return { x, n: w ? semelhanca(v, w) : -1 }
    }))
    setEstado(undefined)
    setAchadas(notas.filter((k) => k.n > 0).sort((a, b) => b.n - a.n).slice(0, 12).map((k) => k.x))
  }

  return (
    <div className="parecidas" style={{ marginTop: 28 }}>
      <p className="eyebrow">Parecidas no seu acervo</p>
      {!achadas && !estado && <button className="btn sm" style={{ marginTop: 10 }} onClick={() => procurar().catch((e) => { setEstado(undefined); setErro((e as Error).message) })}><ScanSearch size={14} />Mais como esta</button>}
      {estado && <p className="faint" style={{ fontSize: 13, marginTop: 8 }}>{estado.total ? `Comparando pela imagem: ${estado.lidas} de ${estado.total}…` : 'Preparando o olhar do app (só na primeira vez)…'} A primeira vez demora; depois fica guardado.</p>}
      {erro && <p className="faint" style={{ fontSize: 13, marginTop: 8 }}>{erro}</p>}
      {achadas && (achadas.length
        ? <div className="parecidas-grade">{achadas.map((x) => <Link key={x.id} to={`${baseRota}/${x.id}`} title={x.titulo}><ImgRef r={x} /></Link>)}</div>
        : <p className="faint" style={{ fontSize: 13, marginTop: 8 }}>Ainda não há outras imagens no acervo para comparar.</p>)}
    </div>
  )
}
