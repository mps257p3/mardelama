import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowUp, Check, Eye, EyeOff, Images, Merge, Pencil, Plus, Settings2, Trash2 } from 'lucide-react'
import { useGrupos, useReferencias } from '../../db/hooks'
import type { Grupo, Referencia } from '../../db/schema'
import { normaliza } from '../../lib/filtros'
import {
  ancorasDoTema, apagarTema, colecoesDoPinterest, combinarTemas, criarTema, editarTema, moverTema, refsDoTema, sincronizarTemas, useTemas, type Tema,
} from '../../lib/temas2'
import { Sheet } from '../../ui/Sheet'
import { useToast } from '../../ui/toast'
import { ImgRef, temImagem } from '../ref/ImgRef'
import { BASE2 } from './Topo2'

/** Capa do tema: a escolhida à mão ou o pin mais recente das coleções do tema. */
export function capaDoTema(t: Tema, rs: Referencia[]) {
  const escolhida = t.capa ? rs.find((r) => r.id === t.capa && temImagem(r)) : undefined
  return escolhida ?? [...rs].filter(temImagem).sort((a, b) => b.atualizadoEm - a.atualizadoEm)[0]
}

/** Dados de todos os temas de uma vez (só contagem e capa; nada de leitura de imagem aqui). */
export function useDadosTemas() {
  const e = useTemas()
  const grupos = useGrupos()
  const refs = useReferencias()
  return useMemo(() => {
    if (!e || !refs) return undefined
    const nomeG = new Map(grupos.map((g) => [g.id, g.nome]))
    const dados = (t: Tema) => {
      const ancoras = ancorasDoTema(t, t.colecoes.map((c) => nomeG.get(c) ?? ''))
      const { daColecao, doAssunto } = refsDoTema(t, refs, ancoras)
      return { ancoras, daColecao, doAssunto, capa: capaDoTema(t, daColecao.length ? daColecao : doAssunto) }
    }
    return { e, grupos, refs, nomeG, dados }
  }, [e, grupos, refs])
}

/** Grade dos temas (modo Temas do Descobrir). */
export function GradeTemas() {
  const d = useDadosTemas()
  const [organizar, setOrganizar] = useState(false)
  const [novo, setNovo] = useState(false)
  // pastas novas do Pinterest entram sozinhas num tema (uma vez); as que você tirar não voltam
  useEffect(() => { sincronizarTemas().catch(() => undefined) }, [])
  if (!d) return null
  const visiveis = d.e.lista.filter((t) => !t.oculto)
  const ocultos = d.e.lista.length - visiveis.length
  return <section className="ref2-temas">
    <div className="ref2-temas-acoes">
      <button className="btn sm ghost" onClick={() => setNovo(true)}><Plus size={14} />Novo tema</button>
      {d.e.lista.length > 0 && <button className="btn sm ghost" onClick={() => setOrganizar(true)}><Settings2 size={14} />Organizar{ocultos ? ` · ${ocultos} oculto${ocultos > 1 ? 's' : ''}` : ''}</button>}
    </div>
    {visiveis.length === 0 ? <div className="empty"><Images size={26} strokeWidth={1.1} />
      <span className="serif">{d.e.lista.length ? 'Todos os temas estão ocultos.' : 'Nenhum tema ainda.'}</span>
      <span>{d.e.lista.length ? 'Toque em Organizar para mostrá-los de novo.' : 'Os temas nascem das suas pastas do Pinterest. Conecte a conta ou acompanhe pastas em Acervo › ⋯ › Pinterest, ou crie um tema com as suas coleções.'}</span>
    </div> : <div className="colecoes ref2-temas-grade">
      {visiveis.map((t) => {
        const x = d.dados(t); const n = x.daColecao.length + x.doAssunto.length
        return <Link key={t.id} to={`${BASE2}/temas/${t.id}`} className="colecao ref2-tema">
          <span className="ref2-tema-capa">{x.capa ? <ImgRef r={x.capa} /> : <Images size={26} strokeWidth={1.1} />}</span>
          <span className="t">{t.nome}</span>
          <span className="s">{n} {n === 1 ? 'referência' : 'referências'} · {t.colecoes.length} {t.colecoes.length === 1 ? 'coleção' : 'coleções'}</span>
        </Link>
      })}
    </div>}
    {organizar && <OrganizarTemas onClose={() => setOrganizar(false)} />}
    {novo && <EditarColecoesTema onClose={() => setNovo(false)} />}
  </section>
}

/** Criar, renomear, reordenar, ocultar, combinar e apagar temas. Nada disso mexe nas coleções. */
function OrganizarTemas({ onClose }: { onClose: () => void }) {
  const d = useDadosTemas()
  const toast = useToast()
  const [combinar, setCombinar] = useState<Tema>()
  const [editar, setEditar] = useState<Tema>()
  if (!d) return null
  const l = d.e.lista
  return <Sheet label="Organizar temas" onClose={onClose} alto>
    <h3>Organizar temas</h3>
    <p className="faint" style={{ fontSize: 12.5, margin: '4px 0 10px' }}>Mexer num tema nunca altera nem apaga as coleções ou as referências.</p>
    <div className="ref2-gerenciar">{l.map((t, i) => <div key={t.id} className={'ref2-ger-linha' + (t.oculto ? ' off' : '')}>
      <div className="ref2-ger-topo">
        <span className="t">{t.nome}<span className="s">{t.colecoes.length} {t.colecoes.length === 1 ? 'coleção' : 'coleções'}</span></span>
        <span className="ref2-cat-acoes">
          <button className="iconbtn" aria-label="Subir" disabled={i === 0} onClick={() => moverTema(t.id, -1)}><ArrowUp size={15} /></button>
          <button className="iconbtn" aria-label="Descer" disabled={i === l.length - 1} onClick={() => moverTema(t.id, 1)}><ArrowDown size={15} /></button>
          <button className="iconbtn" aria-label={t.oculto ? 'Mostrar' : 'Ocultar'} onClick={() => editarTema(t.id, { oculto: !t.oculto })}>{t.oculto ? <EyeOff size={15} /> : <Eye size={15} />}</button>
        </span>
      </div>
      <div className="chips wrap">
        <button className="chip" onClick={() => setEditar(t)}><Pencil size={13} />Editar</button>
        {l.length > 1 && <button className="chip" onClick={() => setCombinar(t)}><Merge size={13} />Combinar</button>}
        <button className="chip" onClick={async () => { await apagarTema(t.id); toast(`Tema “${t.nome}” apagado. As coleções continuam no Acervo.`) }}><Trash2 size={13} />Apagar</button>
      </div>
      {combinar?.id === t.id && <div className="ref2-combinar">
        <span className="faint" style={{ fontSize: 12.5 }}>Juntar “{t.nome}” a:</span>
        <div className="chips wrap">{l.filter((x) => x.id !== t.id).map((x) => <button key={x.id} className="chip" onClick={async () => { await combinarTemas(x.id, t.id); setCombinar(undefined); toast(`“${t.nome}” agora faz parte de “${x.nome}”`) }}>{x.nome}</button>)}</div>
      </div>}
    </div>)}</div>
    {editar && <EditarColecoesTema tema={editar} onClose={() => setEditar(undefined)} />}
  </Sheet>
}

/** Novo tema ou edição: nome, palavras do assunto e quais coleções alimentam o tema (várias podem ir para o mesmo). */
export function EditarColecoesTema({ tema, onClose }: { tema?: Tema; onClose: () => void }) {
  const grupos = useGrupos()
  const refs = useReferencias()
  const toast = useToast()
  const [nome, setNome] = useState(tema?.nome ?? '')
  const [termos, setTermos] = useState((tema?.termos ?? []).join(', '))
  const [cols, setCols] = useState<string[]>(tema?.colecoes ?? [])
  const [q, setQ] = useState('')
  const [todas, setTodas] = useState(false)
  const pin = useMemo(() => new Set(colecoesDoPinterest(grupos, refs ?? []).map((g) => g.id)), [grupos, refs])
  const n = useMemo(() => { const m = new Map<string, number>(); for (const r of refs ?? []) if (!r.excluido) for (const g of r.grupos) m.set(g, (m.get(g) ?? 0) + 1); return m }, [refs])
  const lista = grupos.filter((g: Grupo) => (todas || pin.has(g.id) || cols.includes(g.id)) && (!q || normaliza(g.nome).includes(normaliza(q))))
    .sort((a, b) => Number(cols.includes(b.id)) - Number(cols.includes(a.id)) || a.nome.localeCompare(b.nome, 'pt-BR'))
  async function salvar() {
    const ts = termos.split(',').map((x) => x.trim()).filter(Boolean)
    if (tema) await editarTema(tema.id, { nome: nome.trim(), colecoes: cols, termos: ts })
    else { await criarTema(nome.trim(), cols); }
    toast(tema ? 'Tema salvo' : 'Tema criado'); onClose()
  }
  return <Sheet label={tema ? `Editar ${tema.nome}` : 'Novo tema'} onClose={onClose} alto>
    <h3>{tema ? 'Editar tema' : 'Novo tema'}</h3>
    <div className="filtro-sec"><div className="filtro-tit"><span>Nome</span></div>
      <input className="input" autoFocus={!tema} placeholder="Ex.: Luminárias" value={nome} onChange={(e) => setNome(e.target.value)} /></div>
    <div className="filtro-sec"><div className="filtro-tit"><span>Palavras do assunto (opcional)</span></div>
      <input className="input" placeholder="Ex.: abajur, pendente, arandela" value={termos} onChange={(e) => setTermos(e.target.value)} />
      <p className="faint" style={{ fontSize: 12, marginTop: 6 }}>Ajudam a reconhecer o que é deste tema nas buscas e no Acervo.</p></div>
    <div className="filtro-sec"><div className="filtro-tit"><span>Coleções do tema · {cols.length}</span>
      <button className="btn sm ghost" onClick={() => setTodas(!todas)}>{todas ? 'Só Pinterest' : 'Todas as coleções'}</button></div>
      <input className="input" placeholder="Buscar coleção..." value={q} onChange={(e) => setQ(e.target.value)} style={{ marginBottom: 8 }} />
      <div className="ref2-fontes" style={{ margin: 0, flexDirection: 'column', gap: 8 }}>{lista.map((g) => <label key={g.id} className="ref2-fonte">
        <input type="checkbox" checked={cols.includes(g.id)} onChange={() => setCols((c) => (c.includes(g.id) ? c.filter((x) => x !== g.id) : [...c, g.id]))} />
        {g.nome}<span className="faint">{n.get(g.id) ?? 0}{pin.has(g.id) ? ' · Pinterest' : ''}</span></label>)}
        {!lista.length && <span className="faint" style={{ fontSize: 12.5 }}>{todas ? 'Nenhuma coleção.' : 'Nenhuma pasta do Pinterest encontrada. Toque em “Todas as coleções”.'}</span>}
      </div></div>
    <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
      <button className="btn primary" disabled={!nome.trim()} onClick={salvar}><Check size={15} />{tema ? 'Salvar' : 'Criar tema'}</button>
      <button className="btn ghost" onClick={onClose}>Cancelar</button>
    </div>
  </Sheet>
}
