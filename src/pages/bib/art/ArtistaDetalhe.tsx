import { Voltar } from '../../../ui/Voltar'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Check, Download, ExternalLink, FolderPlus, Heart, ImageIcon, ImagePlus, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react'
import { Sheet } from '../../../ui/Sheet'
import { db, novo, uid, type Artista, type Certeza, type Nota, type Obra } from '../../../db/schema'
import { alternarFavorito, excluir } from '../../../db/hooks'
import { ANALISE, CERTEZA, TEMAS_PROCESSO, gostoDosArtistas, recomendar, vivos, type Sugestao } from '../../../lib/artistas'
import { Menu } from '../../../ui/Menu'
import { Relacoes } from '../../../ui/Relacoes'
import { GaleriaPecas } from '../../../ui/GaleriaFotos'
import { TextoRico } from '../../../ui/rich'
import { ListaEditavel, TextoEditavel } from '../../../ui/editavel'
import { Tags } from '../../../ui/form'
import { ImgObra } from './ImgObra'
import { VisorObras } from './VisorObras'
import { obraDeCapa } from './Artistas'
import { AdicionarAColecao } from './Colecoes'
import { PesquisaIA } from './PesquisaIA'
import { termosNoTexto } from '../../../lib/glossario'
import { useToast } from '../../../ui/toast'

const ND = <span className="nd">Não documentado</span>

function Bloco({ titulo, children, aberto = false, id, n }: { titulo: string; children: React.ReactNode; aberto?: boolean; id?: string; n?: number }) {
  return <details className="art-bloco" open={aberto} id={id}><summary><h2>{n != null && <span className="num">{String(n).padStart(2, '0')}</span>}{titulo}</h2></summary><div className="corpo">{children}</div></details>
}

const MATERIAIS = [['materiais', 'Materiais'], ['esmaltes', 'Esmaltes e superfícies'], ['queimas', 'Queima'], ['tecnicas', 'Técnicas']] as const

function Selo({ c }: { c: Certeza }) { return <span className={'selo ' + c} title={CERTEZA[c].desc}>{CERTEZA[c].rotulo}</span> }

const host = (u?: string) => { try { return u ? new URL(u).hostname.replace(/^www\./, '') : '' } catch { return '' } }

export default function ArtistaDetalhe() {
  const { id } = useParams()
  const nav = useNavigate()
  const a = useLiveQuery(() => db.artistas.get(id!), [id])
  const obras = useLiveQuery(async () => vivos(await db.obras.where('artistaId').equals(id!).toArray()).sort((x, y) => x.criadoEm - y.criadoEm), [id], [] as Obra[])
  const todos = useLiveQuery(async () => vivos(await db.artistas.toArray()), [], [])
  const todasObras = useLiveQuery(async () => vivos(await db.obras.toArray()), [], [])
  const [serie, setSerie] = useState<string>()
  const [visor, setVisor] = useState<number>()
  const [colecao, setColecao] = useState(false)
  const [ia, setIa] = useState(false)
  const [trocaCapa, setTrocaCapa] = useState(false)
  const [todasVer, setTodasVer] = useState(false)
  const [sug, setSug] = useState<Sugestao[]>([])
  const [exportando, setExportando] = useState<string>()
  const toast = useToast()
  useEffect(() => { if (!a) return; let vivo = true; gostoDosArtistas(todos).then((g) => vivo && setSug(recomendar(a, todos, g))); return () => { vivo = false } }, [a, todos])

  const series = useMemo(() => [...new Set(obras.map((o) => o.serie).filter(Boolean) as string[])], [obras])
  const galeria = useMemo(() => obras.filter((o) => !serie || o.serie === serie), [obras, serie])
  const termos = useMemo(() => a ? termosNoTexto([a.bio, a.linguagem, ...a.processos.map((p) => p.texto), ...a.esmaltes, ...a.queimas, ...a.tecnicas].join(' ')) : [], [a])

  const relacionados = useMemo(() => a ? todos.filter((b) => b.id !== a.id && (a.relacionados.includes(b.id) || b.relacionados.includes(a.id))) : [], [a, todos])
  const notasEstudo = useLiveQuery(async () => {
    if (!id) return []
    const rs = vivos([...await db.relacoes.where('[aTipo+aId]').equals(['artista', id]).toArray(), ...await db.relacoes.where('[bTipo+bId]').equals(['artista', id]).toArray()])
    const ids = rs.map((r) => (r.aTipo === 'nota' ? r.aId : r.bTipo === 'nota' ? r.bId : '')).filter(Boolean)
    return vivos((await db.notas.bulkGet(ids)).filter(Boolean) as Nota[])
  }, [id], [] as Nota[])

  if (a === undefined) return null
  if (!a || a.excluido) return <div className="page"><p>Artista não encontrado.</p></div>
  const capa = obraDeCapa(a, obras)
  async function anotarExperimento(tema: string) {
    const n = novo({ titulo: `${a!.nome} · ${tema}`, corpo: `<p>Experimento a partir do estudo de <strong>${a!.nome}</strong>.</p><p><em>Tema:</em> ${tema}</p><p></p>`, imagens: [], arquivos: [], audios: [], tags: ['estudo de artista'] })
    await db.notas.add(n)
    await db.relacoes.add({ id: uid(), aTipo: 'artista', aId: a!.id, bTipo: 'nota', bId: n.id, criadoEm: Date.now(), atualizadoEm: Date.now(), excluido: 0 })
    nav(`/caderno/${n.id}`)
  }
  const salvar = (p: Partial<Artista>) => db.artistas.update(a.id, { ...p, atualizadoEm: Date.now() })
  const proc = new Map<string, typeof a.processos>()
  a.processos.forEach((p) => proc.set(p.tema, [...(proc.get(p.tema) ?? []), p]))
  const temasExtras = [...proc.keys()].filter((t) => !(TEMAS_PROCESSO as readonly string[]).includes(t))
  const pubs = new Map<string, typeof a.publicacoes>()
  ;[...a.publicacoes, ...a.fontes].forEach((p) => { const k = p.tipo || 'Outros'; pubs.set(k, [...(pubs.get(k) ?? []), p]) })

  return (
    <div className="page bib art">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Voltar to="/biblioteca/artistas">Estudos de artistas</Voltar>
        <div style={{ display: 'flex', gap: 2 }}>
          <button className="iconbtn" aria-label={a.favorito ? 'Remover dos favoritos' : 'Favoritar'} onClick={() => alternarFavorito('artistas', a.id, a.favorito)}><Heart size={19} fill={a.favorito ? 'currentColor' : 'none'} /></button>
          <Menu itens={[
            { l: 'Editar perfil', icon: <Pencil size={16} />, to: `/biblioteca/artistas/${a.id}/editar` },
            { l: 'Adicionar obra', icon: <ImagePlus size={16} />, to: `/biblioteca/obras/nova?artista=${a.id}` },
            { l: 'Adicionar à coleção', icon: <FolderPlus size={16} />, onClick: () => setColecao(true) },
            { l: 'Pesquisar com IA', icon: <Sparkles size={16} />, onClick: () => setIa(true) },
            { l: 'Exportar artista', icon: <Download size={16} />, onClick: async () => {
              if (exportando) return
              setExportando('Preparando…')
              try { const { exportarArtista } = await import('../../../lib/exportarArtista'); await exportarArtista(a, setExportando); toast('Estudo exportado') }
              catch (e) { toast('Não consegui exportar: ' + (e as Error).message) } finally { setExportando(undefined) }
            } },
            { sep: true, l: '' },
            { l: 'Excluir artista', icon: <Trash2 size={16} />, onClick: async () => { if (confirm(`Excluir ${a.nome} da Biblioteca?`)) { await excluir('artistas', a.id); nav('/biblioteca/artistas') } } },
          ]} />
        </div>
      </div>

      <figure className="art-capa" onClick={() => capa && setVisor(obras.indexOf(capa))}>
        <ImgObra o={capa} alt={capa?.titulo ?? a.nome} />
        {capa?.credito && <figcaption>{[capa.titulo, capa.credito].filter(Boolean).join(' · ')}</figcaption>}
        <button className="btn sm capa-trocar" onClick={(e) => { e.stopPropagation(); setTrocaCapa(true) }}><ImageIcon size={14} />Trocar capa</button>
      </figure>
      {trocaCapa && <Sheet onClose={() => setTrocaCapa(false)} label="Trocar capa" alto>
        <h3>Foto de capa</h3>
        <p className="faint" style={{ fontSize: 13.5, margin: '4px 0 12px' }}>Escolha uma das obras ou envie uma foto sua.</p>
        <div className="capa-opcoes">
          <Link className="capa-op nova" to={`/biblioteca/obras/nova?artista=${a.id}&capa=1`}><ImagePlus size={22} strokeWidth={1.4} /><span>Enviar foto</span></Link>
          {obras.filter((o) => o.arquivo || o.imagem).map((o) => (
            <button key={o.id} className={'capa-op' + (capa?.id === o.id ? ' on' : '')} aria-label={o.titulo} onClick={async () => { await salvar({ capa: o.id }); setTrocaCapa(false) }}>
              <ImgObra o={o} />{capa?.id === o.id && <span className="capa-marca"><Check size={14} /></span>}
            </button>
          ))}
        </div>
      </Sheet>}
      <header className="art-titulo">
        <p className="eyebrow">{[a.pais.join(' / '), a.especialidade].filter(Boolean).join(' · ')}</p>
        <h1>{a.nome}</h1>
        {a.nomeOriginal && <p className="original">{a.nomeOriginal}</p>}
        {a.caracteristicas.length > 0 && <div className="pills" style={{ marginTop: 12 }}>{a.caracteristicas.map((c) => <span key={c} className="pill">{c}</span>)}</div>}
      </header>

      <section className="art-galeria art-bloco-fixo">
        <div className="section-head"><h2><span className="num">01</span>O trabalho</h2><Link to={`/biblioteca/obras/nova?artista=${a.id}`} className="faint" style={{ fontSize: 13, display: 'inline-flex', gap: 4, alignItems: 'center' }}><Plus size={14} />Adicionar</Link></div>
        {series.length > 1 && <div className="chips" style={{ marginBottom: 12 }}>
          <button className={'chip' + (!serie ? ' on' : '')} onClick={() => setSerie(undefined)}>Todas</button>
          {series.map((s) => <button key={s} className={'chip' + (serie === s ? ' on' : '')} onClick={() => setSerie(serie === s ? undefined : s)}>{s}</button>)}
        </div>}
        {serie && a.series?.find((s) => s.nome === serie)?.url && <p className="faint" style={{ fontSize: 13, margin: '-4px 0 12px' }}>Série <b>{serie}</b> {a.series.find((s) => s.nome === serie)?.original} · <a href={a.series.find((s) => s.nome === serie)!.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>ver no site oficial</a></p>}
        <div className="obras-mural">
          {(todasVer || serie ? galeria : galeria.slice(0, 12)).map((o) => (
            <button key={o.id} className="obra-card" onClick={() => setVisor(obras.indexOf(o))}>
              <span className="ph"><ImgObra o={o} /></span>
              <span className="t">{o.titulo || o.serie || 'Sem título'}{o.favorito ? <Heart size={11} fill="currentColor" /> : null}</span>
              <span className="s">{[o.ano, host(o.fonte)].filter(Boolean).join(' · ')}</span>
            </button>
          ))}
          {obras.length === 0 && <p className="faint">Nenhuma obra cadastrada ainda.</p>}
        </div>
        {!todasVer && !serie && galeria.length > 12 && <button className="btn" style={{ width: '100%', marginTop: 14 }} onClick={() => setTodasVer(true)}>Ver todas as {galeria.length} obras</button>}
        {a.series && a.series.length > 0 && <p className="faint" style={{ fontSize: 12.5, marginTop: 10 }}>Séries no site oficial: {a.series.map((s, i) => <span key={s.nome}>{i ? ', ' : ''}{s.url ? <a href={s.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>{s.nome}</a> : s.nome}{s.original ? ` (${s.original})` : ''}</span>)}.</p>}
      </section>
      {a.falas && a.falas.length > 0 && <section className="art-falas art-bloco-fixo">
        <div className="section-head"><h2>Nas palavras do artista</h2></div>
        {a.falas.map((f, i) => (
          <blockquote key={i} className="art-fala">
            <p>“{f.texto}”</p>
            {f.original && f.original !== f.texto && <p className="original">{f.original}</p>}
            {(f.veiculo || f.fonte) && <cite>{f.fonte ? <a href={f.fonte} target="_blank" rel="noreferrer">{f.veiculo || host(f.fonte)}</a> : f.veiculo}</cite>}
          </blockquote>
        ))}
        <p className="faint" style={{ fontSize: 12 }}>Tradução livre para o português. O original fica abaixo de cada fala.</p>
      </section>}
      <div className="art-blocos">
        <Bloco n={2} titulo="Apresentação do artista" aberto>
          <dl className="art-ficha">
            <dt>Nome original</dt><dd>{a.nomeOriginal || ND}</dd>
            <dt>País</dt><dd>{a.pais.join(' / ') || ND}</dd>
            <dt>Nascimento</dt><dd>{a.nascimento || ND}</dd>
            <dt>Atuação</dt><dd>{a.atuacao || ND}</dd>
          </dl>
          {a.retrato && <figure className="art-retrato"><img src={a.retrato} alt={`Retrato de ${a.nome}`} referrerPolicy="no-referrer" loading="lazy" onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = 'none' }} /><figcaption>Foto: {host(a.retrato)}</figcaption></figure>}
          {a.linguagem && <p className="art-lead">{a.linguagem}</p>}
          {a.bio ? a.bio.split(/\n{2,}/).map((p, i) => <p key={i} className="art-p">{p}</p>) : <p>{ND}</p>}
          {a.afinidade && <aside className="art-afinidade"><p className="eyebrow">Afinidade com Ryuji Iwasaki</p><p>{a.afinidade}</p></aside>}
        </Bloco>
      </div>


      <div className="art-blocos">
        <Bloco n={3} titulo="Linguagem artística">
          <p className="faint" style={{ fontSize: 13, marginTop: 0 }}>Leitura editorial a partir das obras e das fontes. É interpretação, não informação do artista.</p>
          <dl className="art-analise">{ANALISE.map(([k, l]) => <div key={k}><dt>{l}</dt><dd>{a.analise?.[k] || ND}</dd></div>)}</dl>
        </Bloco>

        <Bloco n={4} titulo="Técnicas e processos">
          <div className="legenda-selos">{(Object.keys(CERTEZA) as Certeza[]).map((c) => <span key={c}><Selo c={c} /> {CERTEZA[c].desc}</span>)}</div>
          <div className="processos">
            {[...TEMAS_PROCESSO, ...temasExtras].map((t) => {
              const ps = proc.get(t)
              return <div key={t} className={'proc' + (ps ? '' : ' vazio')}>
                <h4>{t}</h4>
                {ps ? ps.map((p, i) => <p key={i}><Selo c={p.certeza} /> {p.texto}{p.fonte && <> <a href={p.fonte} target="_blank" rel="noreferrer" className="fonte">{host(p.fonte)}</a></>}</p>) : ND}
              </div>
            })}
          </div>
          <p className="faint" style={{ fontSize: 12.5 }}>Receitas, temperaturas e composições só aparecem quando publicadas pelo artista ou por fonte confiável.</p>
        </Bloco>

        <Bloco n={5} titulo="Materiais e esmaltes">
          {MATERIAIS.some(([k]) => a[k].length) ? <dl className="art-ficha">{MATERIAIS.map(([k, l]) => <div key={k} style={{ display: 'contents' }}><dt>{l}</dt><dd>{a[k].length ? <span className="pills">{a[k].map((x) => <span key={x} className="pill">{x}</span>)}</span> : ND}</dd></div>)}</dl> : <p>{ND}</p>}
          {(proc.get('Argila') || proc.get('Esmaltes') || proc.get('Engobes')) && <p className="faint" style={{ fontSize: 13 }}>Detalhes documentados sobre argila, engobes e esmaltes estão em Técnicas e processos.</p>}
          {termos.length > 0 && <p style={{ fontSize: 13.5, marginTop: 12 }}>No glossário: {termos.map((t, i) => <span key={t.id}>{i ? ', ' : ''}<Link to={`/biblioteca/glossario#${t.id}`} style={{ textDecoration: 'underline' }}>{t.termo}</Link></span>)}</p>}
        </Bloco>

        <Bloco n={6} titulo="O que estudar neste artista?" aberto>
          {a.estudar.length ? <ol className="estudar">{a.estudar.map((x, i) => {
            const nota = notasEstudo.find((n) => n.titulo === `${a.nome} · ${x}`)
            return <li key={i}>{x}<span className="estudar-acao">{nota ? <Link to={`/caderno/${nota.id}`}>Ver meu experimento</Link> : <button onClick={() => anotarExperimento(x)}>+ Anotar experimento</button>}</span></li>
          })}</ol> : <p>{ND}</p>}
          <p className="faint" style={{ fontSize: 12.5 }}>Pontos para desenvolver o seu trabalho, sem copiar o dele. Cada experimento vira uma anotação no Caderno, ligada a este estudo.</p>
        </Bloco>

        <Bloco n={7} titulo="Livros, entrevistas e publicações">
          {pubs.size === 0 ? ND : [...pubs.entries()].map(([tipo, ps]) => (
            <div key={tipo} style={{ marginBottom: 14 }}>
              <p className="eyebrow" style={{ marginBottom: 6 }}>{tipo}</p>
              <ul className="fontes">{ps.map((p, i) => <li key={i}>{p.url ? <a href={p.url} target="_blank" rel="noreferrer">{p.titulo}<ExternalLink size={12} /></a> : <span>{p.titulo}</span>}{p.ano ? <span className="faint"> · {p.ano}</span> : null}</li>)}</ul>
            </div>
          ))}
          {(a.site || a.instagram) && <p style={{ fontSize: 14 }}>{a.site && <a href={a.site} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', marginRight: 14 }}>Site oficial</a>}{a.instagram && <a href={`https://www.instagram.com/${a.instagram}/`} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>@{a.instagram}</a>}</p>}
          {a.revisadoEm && <p className="faint" style={{ fontSize: 12 }}>Fontes conferidas em {a.revisadoEm}.</p>}
        </Bloco>
      </div>

      <section className="minha-pesquisa">
        <p className="eyebrow">Só seu · separado das informações documentadas</p>
        <h2><span className="num">08</span>Anotações pessoais</h2>
        <h4>Observações</h4>
        <TextoRico value={a.notas ?? ''} onChange={(v) => salvar({ notas: v })} placeholder="O que você percebe, o que quer testar…" />
        <h4>Hipóteses de processo</h4>
        <TextoEditavel valor={a.hipoteses} multilinha rotulo="hipóteses" vazio="Ex.: a borda clara pode vir de esmalte mais fino na aresta." onSalvar={(v) => salvar({ hipoteses: v })} />
        <h4>Links salvos</h4>
        <ListaEditavel itens={a.links ?? []} link rotulo="link" vazio="Nenhum link ainda." onSalvar={(v) => salvar({ links: v })} />
        <h4>Etiquetas</h4>
        <Tags value={a.tags} onChange={(v) => salvar({ tags: v })} />
        <div style={{ marginTop: 22 }} />
        <Relacoes tipo="artista" id={a.id} />
        <GaleriaPecas fotos={a.fotos ?? []} onChange={(v) => salvar({ fotos: v })} titulo="Minhas fotografias" />
      </section>

      <section className="secao art-bloco-fixo">
        <div className="secao-head"><h2><span className="num">09</span>Artistas relacionados</h2></div>
        {relacionados.length > 0 && <div className="trilho sug" style={{ marginBottom: 18 }}>
          {relacionados.map((b) => (
            <Link key={b.id} to={`/biblioteca/artistas/${b.id}`} className="peca-mini">
              <span className="ph"><ImgObra o={obraDeCapa(b, todasObras)} /></span>
              <span className="t">{b.nome}</span>
              <span className="s">{b.pais.join(' / ')}</span>
            </Link>
          ))}
        </div>}
        {sug.length > 0 && <><p className="eyebrow" style={{ marginBottom: 10 }}>Você também pode gostar de</p>
        <div className="trilho sug">
          {sug.map(({ a: b, motivos }) => (
            <Link key={b.id} to={`/biblioteca/artistas/${b.id}`} className="peca-mini">
              <span className="ph"><ImgObra o={obraDeCapa(b, todasObras)} /></span>
              <span className="t">{b.nome}</span>
              <span className="s">{motivos[0] ?? b.pais.join(' / ')}</span>
            </Link>
          ))}
        </div></>}
        {!relacionados.length && !sug.length && <p>{ND}</p>}
      </section>

      {exportando && <div className="sync-pill" role="status">{exportando}</div>}
      {visor != null && <VisorObras obras={obras} inicio={visor} artista={a} onClose={() => setVisor(undefined)} />}
      {colecao && <AdicionarAColecao item={{ tipo: 'artista', id: a.id }} onClose={() => setColecao(false)} />}
      {ia && <PesquisaIA artista={a} onClose={() => setIa(false)} />}
    </div>
  )
}
