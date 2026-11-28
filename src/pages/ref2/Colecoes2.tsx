import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, Images, Merge, MoreHorizontal, Pencil, Plus, Search, Settings2, Trash2, X } from 'lucide-react'
import { useGrupos, useReferencias, excluir } from '../../db/hooks'
import { db, novo, type Grupo, type Referencia } from '../../db/schema'
import { Menu } from '../../ui/Menu'
import { Sheet } from '../../ui/Sheet'
import { useToast } from '../../ui/toast'
import { Voltar } from '../../ui/Voltar'
import { normaliza } from '../../lib/filtros'
import { NIVEIS, nivelDaColecao, salvarConfig2, useConfig2, type Config2, type Nivel } from '../../lib/ref2'
import { ImgRef, temImagem } from '../ref/ImgRef'
import { BASE2, Topo2 } from './Topo2'

type Ordem = 'quantidade' | 'nome' | 'atualizacao'
const ehPinRef = (r: Referencia) => !!r.origem?.startsWith('pinterest:')

function useDadosColecoes() {
  const grupos = useGrupos()
  const refs = useReferencias()
  return useMemo(() => {
    const por = new Map<string, Referencia[]>()
    for (const r of refs ?? []) for (const g of r.grupos) por.set(g, [...(por.get(g) ?? []), r])
    const info = (g: Grupo) => {
      const rs = por.get(g.id) ?? []
      const pins = rs.filter(ehPinRef).length
      return { rs, n: rs.length, atual: Math.max(g.atualizadoEm, ...rs.map((r) => r.atualizadoEm)), pinterest: !!g.rss || (rs.length > 0 && pins / rs.length >= 0.5) }
    }
    return { grupos, refs: refs ?? [], info, carregado: !!refs }
  }, [grupos, refs])
}

/** Capa de até três imagens: as escolhidas à mão ou, sem escolha, as primeiras com imagem. */
function capaDe(g: Grupo, rs: Referencia[], cfg: Config2) {
  const escolhidas = (cfg.capas[g.id] ?? []).map((id) => rs.find((r) => r.id === id)).filter((r): r is Referencia => !!r && temImagem(r))
  return [...escolhidas, ...rs.filter((r) => temImagem(r) && !escolhidas.includes(r))].slice(0, 3)
}

/** Coleções (os grupos da versão atual, com outro nome): busca, ordem, capa escolhida e influência na curadoria. */
export default function Colecoes2() {
  const { grupos, info } = useDadosColecoes()
  const cfg = useConfig2()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [ordem, setOrdem] = useState<Ordem>('quantidade')
  const [vazias, setVazias] = useState(false)
  const [nova, setNova] = useState(false)
  const [opcoes, setOpcoes] = useState<Grupo>()
  const lista = grupos
    .filter((g) => (vazias || info(g).n) && (!q || normaliza(g.nome + ' ' + (g.descricao ?? '')).includes(normaliza(q))))
    .sort((a, b) => ordem === 'nome' ? a.nome.localeCompare(b.nome, 'pt-BR') : ordem === 'atualizacao' ? info(b).atual - info(a).atual : info(b).n - info(a).n)
  const nVazias = grupos.filter((g) => !info(g).n).length
  return (
    <div className="page ref2">
      <Topo2 aba="colecoes" icones={<>
        <button className="iconbtn" aria-label="Nova coleção" onClick={() => setNova(true)}><Plus size={19} /></button>
        <Menu itens={[
          { l: 'Gerenciar coleções', icon: <Settings2 size={16} />, to: `${BASE2}/colecoes/gerenciar` },
          { l: 'Influência na curadoria', icon: <Settings2 size={16} />, to: `${BASE2}/curadoria#repertorio` },
          ...(nVazias ? [{ l: vazias ? 'Ocultar coleções vazias' : `Mostrar coleções vazias (${nVazias})`, on: vazias, onClick: () => setVazias(!vazias) }] : []),
        ]} />
      </>}>
        <div className="busca-c"><Search size={16} /><input className="input" placeholder="Buscar coleções..." value={q} onChange={(e) => setQ(e.target.value)} />
          {q && <button className="limpar-busca" aria-label="Limpar" onClick={() => setQ('')}><X size={15} /></button>}</div>
        <div className="chips ref2-modos">
          {([['quantidade', 'Mais imagens'], ['nome', 'Nome'], ['atualizacao', 'Atualizadas']] as [Ordem, string][]).map(([k, l]) => <button key={k} className={'chip' + (ordem === k ? ' on' : '')} onClick={() => setOrdem(k)}>{l}</button>)}
        </div>
      </Topo2>
      {lista.length === 0 ? <div className="empty"><span className="serif">{q ? 'Nenhuma coleção com esse nome.' : 'Nenhuma coleção com imagens ainda.'}</span>{!q && <span>Toque e segure imagens no Acervo para colocá-las em coleções.</span>}</div> : (
        <div className="colecoes">
          {lista.map((g) => {
            const d = info(g); const capas = capaDe(g, d.rs, cfg); const nv = nivelDaColecao(cfg, g.id)
            return (
              <div key={g.id} className="colecao ref2-colecao">
                <Link to={`${BASE2}/acervo?colecao=${g.id}`}>
                  <div className={'capa-col n' + Math.min(capas.length, 3)}>
                    {capas.length ? capas.map((c) => <div key={c.id}><ImgRef r={c} /></div>) : <div className="vazia"><Images size={26} strokeWidth={1.1} /></div>}
                  </div>
                  <div className="t">{g.nome}</div>
                  <div className="s">{d.n} {d.n === 1 ? 'referência' : 'referências'}{d.pinterest ? ' · Pinterest' : ''}{nv !== 2 ? ` · influência ${NIVEIS[nv][1].toLowerCase()}` : ''}</div>
                </Link>
                <button className="ref2-colecao-mais" aria-label={`Opções de ${g.nome}`} onClick={() => setOpcoes(g)}><MoreHorizontal size={16} /></button>
              </div>
            )
          })}
        </div>
      )}
      {nova && <NovaColecao onClose={(id) => { setNova(false); if (id) nav(`${BASE2}/acervo?colecao=${id}`) }} />}
      {opcoes && <OpcoesColecao g={opcoes} rs={info(opcoes).rs} onClose={() => setOpcoes(undefined)} />}
    </div>
  )
}

function NovaColecao({ onClose }: { onClose: (id?: string) => void }) {
  const [nome, setNome] = useState('')
  return <Sheet label="Nova coleção" onClose={() => onClose()}>
    <h3>Nova coleção</h3>
    <form style={{ display: 'flex', gap: 8, marginTop: 12 }} onSubmit={async (e) => { e.preventDefault(); if (!nome.trim()) return; const g = novo({ nome: nome.trim() }); await db.grupos.add(g); onClose(g.id) }}>
      <input className="input" autoFocus placeholder="Nome da coleção" value={nome} onChange={(e) => setNome(e.target.value)} />
      <button className="btn primary" disabled={!nome.trim()}><Plus size={15} />Criar</button>
    </form>
    <p className="faint" style={{ fontSize: 12.5, marginTop: 10 }}>Depois, no Acervo, toque e segure imagens para colocá-las nela.</p>
  </Sheet>
}

/** Influência de uma coleção na curadoria de Referências 2 (não muda o conteúdo da coleção). */
export function SeletorInfluencia({ id }: { id: string }) {
  const cfg = useConfig2()
  const nv = nivelDaColecao(cfg, id)
  return <div className="seg" role="radiogroup" aria-label="Influência na curadoria">
    {NIVEIS.map(([k, l]) => <button key={k} className={nv === k ? 'on' : ''} role="radio" aria-checked={nv === k} onClick={() => salvarConfig2({ colecoes: { ...cfg.colecoes, [id]: k as Nivel } })}>{l}</button>)}
  </div>
}

function OpcoesColecao({ g, rs, onClose }: { g: Grupo; rs: Referencia[]; onClose: () => void }) {
  const cfg = useConfig2()
  const toast = useToast()
  const [nome, setNome] = useState(g.nome)
  const [capa, setCapa] = useState(false)
  const [escolha, setEscolha] = useState<string[]>(cfg.capas[g.id] ?? [])
  const comImg = rs.filter(temImagem)
  return <Sheet label={g.nome} onClose={onClose} alto>
    <h3>{g.nome}</h3>
    <form style={{ display: 'flex', gap: 8, marginTop: 12 }} onSubmit={async (e) => { e.preventDefault(); if (!nome.trim()) return; await db.grupos.update(g.id, { nome: nome.trim(), atualizadoEm: Date.now() }); toast('Renomeada') }}>
      <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} aria-label="Nome da coleção" />
      <button className="btn sm" disabled={nome.trim() === g.nome || !nome.trim()}><Pencil size={14} />Renomear</button>
    </form>
    <div className="filtro-sec"><div className="filtro-tit"><span>Influência na curadoria</span></div>
      <SeletorInfluencia id={g.id} />
      <p className="faint" style={{ fontSize: 12, marginTop: 6 }}>Quanto esta coleção pesa no seu perfil estético em Referências 2. Não muda nada na coleção nem na versão atual.</p></div>
    <div className="filtro-sec"><div className="filtro-tit"><span>Capa</span><button className="btn sm ghost" onClick={() => setCapa(!capa)}>{capa ? 'Fechar' : 'Escolher imagens'}</button></div>
      {capa && <>
        <p className="faint" style={{ fontSize: 12.5, margin: '0 0 8px' }}>Toque em até três imagens, na ordem da capa.</p>
        <div className="ref2-capa-escolha">{comImg.slice(0, 120).map((r) => { const k = escolha.indexOf(r.id); return <button key={r.id} className={k >= 0 ? 'on' : ''} onClick={() => setEscolha((e) => (k >= 0 ? e.filter((x) => x !== r.id) : [...e, r.id].slice(-3)))}><ImgRef r={r} />{k >= 0 && <span className="n">{k + 1}</span>}</button> })}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button className="btn sm primary" onClick={async () => { await salvarConfig2({ capas: { ...cfg.capas, [g.id]: escolha } }); toast('Capa salva'); setCapa(false) }}><Check size={14} />Salvar capa</button>
          {(cfg.capas[g.id]?.length ?? 0) > 0 && <button className="btn sm ghost" onClick={async () => { const c = { ...cfg.capas }; delete c[g.id]; await salvarConfig2({ capas: c }); setEscolha([]); toast('Capa automática') }}>Voltar à automática</button>}
        </div>
      </>}
    </div>
    <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
      <Link className="btn sm" to={`${BASE2}/colecoes/gerenciar`}><Merge size={14} />Combinar com outra</Link>
      <button className="btn sm ghost" onClick={async () => { if (await excluirColecao(g)) { toast('Coleção excluída (as referências continuam no Acervo)'); onClose() } }}><Trash2 size={14} />Excluir coleção</button>
    </div>
  </Sheet>
}

/** Exclui a coleção e tira ela das referências; as referências e as imagens continuam no Acervo. */
async function excluirColecao(g: Grupo) {
  const rs = await db.referencias.where('grupos').equals(g.id).toArray()
  if (!confirm(`Excluir a coleção “${g.nome}”? As ${rs.length} referências continuam no Acervo.`)) return false
  await Promise.all(rs.map((r) => db.referencias.update(r.id, { grupos: r.grupos.filter((x) => x !== g.id), atualizadoEm: Date.now() })))
  await excluir('grupos', g.id)
  return true
}

/** Gerenciar: renomear, combinar, excluir e a influência de cada coleção, numa lista só. */
export function GerenciarColecoes() {
  const { grupos, info } = useDadosColecoes()
  const toast = useToast()
  const [novoG, setNovoG] = useState('')
  const [edit, setEdit] = useState<{ id: string; nome: string }>()
  const [fundir, setFundir] = useState<string>()
  async function combinar(origem: string, destino: string) {
    const rs = await db.referencias.where('grupos').equals(origem).toArray()
    await Promise.all(rs.map((r) => db.referencias.update(r.id, { grupos: [...new Set(r.grupos.map((g) => (g === origem ? destino : g)))], atualizadoEm: Date.now() })))
    await excluir('grupos', origem)
    setFundir(undefined); toast('Coleções combinadas')
  }
  return (
    <div className="page ref2" style={{ maxWidth: 760 }}>
      <Voltar to={`${BASE2}/colecoes`}>Coleções</Voltar>
      <div className="pag-head"><h1 className="pag-titulo">Gerenciar coleções</h1></div>
      <form style={{ display: 'flex', gap: 8, margin: '8px 0 24px' }} onSubmit={async (e) => { e.preventDefault(); if (novoG.trim()) { await db.grupos.add(novo({ nome: novoG.trim() })); setNovoG('') } }}>
        <input className="input" placeholder="Nova coleção" value={novoG} onChange={(e) => setNovoG(e.target.value)} />
        <button className="btn primary"><Plus size={15} />Criar</button>
      </form>
      <div className="ref2-gerenciar">
        {[...grupos].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).map((g) => {
          const n = info(g).n
          return <div key={g.id} className="ref2-ger-linha">
            <div className="ref2-ger-topo">
              {edit?.id === g.id ? (
                <form style={{ display: 'flex', gap: 6, flex: 1 }} onSubmit={async (e) => { e.preventDefault(); await db.grupos.update(g.id, { nome: edit.nome, atualizadoEm: Date.now() }); setEdit(undefined) }}>
                  <input className="input" autoFocus value={edit.nome} onChange={(e) => setEdit({ ...edit, nome: e.target.value })} />
                  <button className="iconbtn" aria-label="Salvar"><Check size={16} /></button>
                  <button type="button" className="iconbtn" aria-label="Cancelar" onClick={() => setEdit(undefined)}><X size={16} /></button>
                </form>
              ) : <>
                <span className="t">{g.nome}<span className="s">{n} {n === 1 ? 'referência' : 'referências'}{info(g).pinterest ? ' · Pinterest' : ''}</span></span>
                <button className="iconbtn" aria-label="Renomear" onClick={() => setEdit({ id: g.id, nome: g.nome })}><Pencil size={15} /></button>
                <button className="iconbtn" aria-label="Combinar com outra coleção" onClick={() => setFundir(g.id)}><Merge size={15} /></button>
                <button className="iconbtn" aria-label="Excluir" onClick={async () => { if (await excluirColecao(g)) toast('Coleção excluída') }}><Trash2 size={15} /></button>
              </>}
            </div>
            <SeletorInfluencia id={g.id} />
          </div>
        })}
      </div>
      {fundir && <Sheet label="Combinar coleções" onClose={() => setFundir(undefined)}>
        <h3>Juntar “{grupos.find((g) => g.id === fundir)?.nome}” com…</h3>
        <p className="faint" style={{ fontSize: 13, margin: '4px 0 12px' }}>As referências passam para a coleção escolhida e esta deixa de existir. Nenhuma imagem é apagada.</p>
        <div className="chips wrap">{grupos.filter((g) => g.id !== fundir).map((g) => <button key={g.id} className="chip" onClick={() => combinar(fundir, g.id)}>{g.nome}</button>)}</div>
      </Sheet>}
    </div>
  )
}
