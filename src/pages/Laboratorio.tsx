import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowUpRight, Calculator, ChevronRight, Crop, Flame, ImagePlus, Layers, RotateCcw, Search, SearchCode, Shapes, ShieldCheck, ShoppingBag } from 'lucide-react'
import { db, type Tipo } from '../db/schema'
import { useEsmaltes, useReceitas, useTestes } from '../db/hooks'
import { useIdeias } from './lab/Ideias'
import { buscarTodos, type Resumo } from '../lib/entidades'
import { CAPA_ESMALTARIA, SECOES_ESM, useFotoEsm, trocarFotoEsm, restaurarFotoEsm, type FotoEsm } from '../lib/esmaltaria'
import { EditorRecorte, salvarRecorteAjuste } from '../ui/Recorte'
import { ResultadosBusca } from '../ui/ResultadosBusca'
import { Sheet } from '../ui/Sheet'
import { useToast } from '../ui/toast'

const vivos = async (t: string) => (await db.table(t).toArray()).filter((x: { excluido?: 0 | 1 }) => !x.excluido).length

type ItemLab = { to: string; nome: string; desc: string; icon: typeof Layers; t?: string }
const GRUPOS: { titulo: string; itens: ItemLab[] }[] = [
  { titulo: 'Pesquisa e formulação', itens: [
    { to: '/materiais', nome: 'Materiais', desc: 'Matérias-primas, preços e estoque', icon: Layers, t: 'materiais' },
    { to: '/familias', nome: 'Famílias', desc: 'Bases e comportamentos', icon: Shapes, t: 'familias' },
    { to: '/engenharia-reversa', nome: 'Engenharia reversa', desc: 'Estudos de esmaltes comerciais', icon: SearchCode, t: 'comerciais' },
  ] },
  { titulo: 'Ferramentas de bancada', itens: [
    { to: '/curvas', nome: 'Curvas de queima', desc: 'Rampas, patamares e gráficos', icon: Flame, t: 'curvas' },
    { to: '/calculadoras', nome: 'Calculadoras', desc: 'Ferramentas de cálculo e conversão', icon: Calculator },
  ] },
  { titulo: 'Suprimentos', itens: [
    { to: '/compras', nome: 'Compras', desc: 'Lista planejada e fornecedores', icon: ShoppingBag, t: 'compras' },
  ] },
]

/** Tipos que a busca da Esmaltaria percorre, na ordem em que os grupos aparecem. */
const TIPOS_BUSCA: Tipo[] = ['esmalte', 'receita', 'teste', 'ideia', 'material', 'familia', 'comercial', 'curva']
const ROTULOS_BUSCA: Partial<Record<Tipo, string>> = {
  esmalte: 'Esmaltes', receita: 'Fórmulas', teste: 'Testes', ideia: 'Ideias', material: 'Materiais',
  familia: 'Famílias', comercial: 'Engenharia reversa', curva: 'Curvas de queima',
}

/** Imagem com a reserva local quando a externa não carrega. */
function ImgEsm({ f }: { f: FotoEsm }) {
  const { src, reserva, estilo } = useFotoEsm(f)
  const [falhou, setFalhou] = useState(false)
  useEffect(() => setFalhou(false), [src])
  return <img src={falhou && reserva ? reserva : src} alt="" loading="lazy" referrerPolicy="no-referrer" style={estilo} onError={() => setFalhou(true)} />
}

/** Esmaltaria: capa, as quatro seções principais, a lista das áreas de bancada e a segurança. */
export default function Laboratorio() {
  const [busca, setBusca] = useState(false)
  const [fotos, setFotos] = useState(false)
  const esmaltes = useEsmaltes(), receitas = useReceitas(), testes = useTestes(), ideias = useIdeias()
  const nSecao: Record<string, number | undefined> = { esmaltes: esmaltes?.length, receitas: receitas?.length, testes: testes?.length, ideias: ideias?.length }
  const n = useLiveQuery(async () => {
    const ts = GRUPOS.flatMap((g) => g.itens).filter((i) => i.t)
    return Object.fromEntries(await Promise.all(ts.map(async (i) => [i.to, await vivos(i.t!)])))
  }, [], {} as Record<string, number>)

  return (
    <div className="page esm">
      <div className="esm-head">
        <h1 className="sup-titulo">Esmaltaria</h1>
        <button className="iconbtn" aria-label="Buscar na Esmaltaria" onClick={() => setBusca(true)}><Search size={20} strokeWidth={1.5} /></button>
      </div>

      <figure className="destaque esm-capa">
        <ImgEsm f={CAPA_ESMALTARIA} />
        <button className="editar" aria-label="Personalizar fotografias da Esmaltaria" onClick={() => setFotos(true)}><ImagePlus size={13} strokeWidth={1.5} /></button>
      </figure>

      <div className="esm-cards">
        {SECOES_ESM.map((s) => {
          const q = nSecao[s.slug]
          return (
            <Link key={s.slug} to={s.to} className="card-area">
              <span className="foto"><ImgEsm f={s} /></span>
              <span className="nome">{s.nome}<ArrowUpRight size={14} strokeWidth={1.4} className="seta" aria-hidden /></span>
              <span className="desc">{q == null ? ' ' : q ? `${q} ${s.unid[q === 1 ? 0 : 1]}` : 'Nenhum ainda'}</span>
            </Link>
          )
        })}
      </div>

      {GRUPOS.map((g) => (
        <section key={g.titulo} className="esm-bloco">
          <p className="esm-grupo">{g.titulo}</p>
          <nav className="lab-lista">
            {g.itens.map(({ to, nome, desc, icon: I }) => (
              <Link key={to} to={to}>
                <I size={20} strokeWidth={1.3} />
                <span className="t">{nome}<span className="s">{desc}</span></span>
                {n[to] != null && <span className="n">{n[to]}</span>}
                <ChevronRight size={16} strokeWidth={1.5} className="seta" />
              </Link>
            ))}
          </nav>
        </section>
      ))}

      <nav className="lab-lista esm-seg">
        <Link to="/esmaltaria/seguranca">
          <ShieldCheck size={20} strokeWidth={1.3} />
          <span className="t">Segurança no ateliê<span className="s">Manuseio, toxicidade, segurança alimentar e descarte.</span></span>
          <ChevronRight size={16} strokeWidth={1.5} className="seta" />
        </Link>
      </nav>

      {busca && <BuscaEsmaltaria onClose={() => setBusca(false)} />}
      {fotos && <FotosEsmaltaria onClose={() => setFotos(false)} />}
    </div>
  )
}

function BuscaEsmaltaria({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('')
  const [res, setRes] = useState<Resumo[]>()
  useEffect(() => {
    if (!q.trim()) { setRes(undefined); return }
    let vivo = true
    const h = setTimeout(() => buscarTodos(q, 150, TIPOS_BUSCA).then((x) => vivo && setRes(x)), 180)
    return () => { vivo = false; clearTimeout(h) }
  }, [q])
  return (
    <Sheet onClose={onClose} label="Buscar na Esmaltaria" alto>
      <h3>Buscar na Esmaltaria</h3>
      <div className="search bib-busca" style={{ margin: "12px 0 0" }}>
        <Search size={17} />
        <input className="input" autoFocus placeholder="Esmaltes, fórmulas, testes, materiais…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {res ? <div onClick={(e) => { if ((e.target as HTMLElement).closest('a')) onClose() }}><ResultadosBusca itens={res} q={q} rotulos={ROTULOS_BUSCA} ordem={TIPOS_BUSCA} /></div>
        : <p className="faint" style={{ fontSize: 13.5, marginTop: 14 }}>Procura em esmaltes comerciais, fórmulas, testes, ideias, materiais, famílias, engenharia reversa e curvas de queima.</p>}
    </Sheet>
  )
}

function LinhaFoto({ f }: { f: FotoEsm }) {
  const foto = useFotoEsm(f)
  const ref = useRef<HTMLInputElement>(null)
  const [editar, setEditar] = useState(false)
  const toast = useToast()
  return (
    <div className="bib-capa-linha">
      <span className="ph"><ImgEsm f={f} /></span>
      <span className="t">{f.nome}<span className="s">{foto.propria ? 'Foto sua' : f.credito ? `Padrão · ${f.credito}` : 'Padrão'}</span></span>
      <span style={{ display: 'flex', gap: 4 }}>
        {foto.propria && <button className="iconbtn" aria-label="Reenquadrar foto" onClick={() => setEditar(true)}><Crop size={16} /></button>}
        {foto.propria && <button className="iconbtn" aria-label="Voltar à foto padrão" onClick={() => restaurarFotoEsm(f, foto.id)}><RotateCcw size={16} /></button>}
        <button className="btn sm" onClick={() => ref.current?.click()}><ImagePlus size={14} />Trocar</button>
      </span>
      <input ref={ref} type="file" accept="image/*" hidden onChange={async (e) => {
        const arq = e.target.files?.[0]; e.target.value = ''
        if (!arq) return
        try { await trocarFotoEsm(f, arq, foto.id); setEditar(true) } catch { toast('Não consegui salvar essa foto.') }
      }} />
      {editar && <EditorRecorte src={foto.src} aspecto={f.aspecto} valor={foto.recorte} titulo={`Reenquadrar · ${f.nome}`}
        onSalvar={(r) => salvarRecorteAjuste(f.chave, r)} onClose={() => setEditar(false)} />}
    </div>
  )
}

function FotosEsmaltaria({ onClose }: { onClose: () => void }) {
  return (
    <Sheet onClose={onClose} label="Fotos da Esmaltaria" alto>
      <h3>Fotos da Esmaltaria</h3>
      <p className="faint" style={{ fontSize: 13.5, margin: '6px 0 14px' }}>Troque cada foto pela galeria do aparelho. Ela é reduzida ao salvar e vai junto na sincronização.</p>
      {[CAPA_ESMALTARIA, ...SECOES_ESM].map((f) => <LinhaFoto key={f.chave} f={f} />)}
    </Sheet>
  )
}
