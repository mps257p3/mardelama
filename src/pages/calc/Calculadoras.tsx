import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMapaMateriais, useReceitas } from '../../db/hooks'
import { CONES, brl, coneMaisProximo, fmt } from '../../lib/opcoes'
import { CLASSES, baseParaTotal, custo, misturar, pesos } from '../../lib/receita'
import { Campo, Numero } from '../../ui/form'
import type { Ingrediente } from '../../db/schema'

function Card({ id, titulo, desc, children }: { id: string; titulo: string; desc: string; children: React.ReactNode }) {
  return <section id={id} className="card calc"><div><h3>{titulo}</h3><p className="faint" style={{ fontSize: 13, marginTop: 4 }}>{desc}</p></div>{children}</section>
}
const Res = ({ v, sub }: { v: React.ReactNode; sub?: string }) => <div className="res">{v}{sub && <small>{sub}</small>}</div>

function TabelaPesos({ ings, pesoBase }: { ings: Ingrediente[]; pesoBase: number }) {
  const ps = pesos(ings, pesoBase)
  return <table className="tabela"><tbody>
    {CLASSES.map((c) => { const xs = ps.filter((i) => i.classe === c.v); return xs.length ? [<tr key={c.v} className="classe-titulo"><td colSpan={3}>{c.l}</td></tr>, ...xs.map((i, k) => <tr key={c.v + k}><td>{i.nome}</td><td className="n faint">{fmt(i.percentual, 2)}%</td><td className="n">{fmt(i.peso, 1)} g</td></tr>)] : null })}
  </tbody></table>
}

function SelReceita({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const rs = useReceitas()
  return <select className="input" value={value} onChange={(e) => onChange(e.target.value)}><option value="">Escolha uma receita…</option>{(rs ?? []).map((r) => <option key={r.id} value={r.id}>{r.nome} (v{r.versaoAtual})</option>)}</select>
}

function Redimensionar() {
  const rs = useReceitas(); const [id, setId] = useState(''); const [g, setG] = useState<number | undefined>(1000); const [total, setTotal] = useState(true)
  const r = rs?.find((x) => x.id === id)
  return <Card id="redimensionar" titulo="Redimensionar receita" desc="Pesos de cada ingrediente para a quantidade que você quer preparar.">
    <SelReceita value={id} onChange={setId} />
    <div className="linha"><Campo label="Quantidade (g)"><Numero value={g} onChange={setG} /></Campo>
      <Campo label="Refere-se a"><select className="input" value={total ? 't' : 'b'} onChange={(e) => setTotal(e.target.value === 't')}><option value="t">Total seco</option><option value="b">Só a base</option></select></Campo></div>
    {r && g ? <TabelaPesos ings={r.ingredientes} pesoBase={total ? baseParaTotal(r.ingredientes, g) : g} /> : null}
    {r?.aguaMlPor100g && g ? <p className="muted" style={{ fontSize: 14 }}>Água: {fmt(r.aguaMlPor100g * (total ? baseParaTotal(r.ingredientes, g) : g) / 100, 0)} ml</p> : null}
  </Card>
}

function PercPeso() {
  const [total, setTotal] = useState<number | undefined>(1000); const [p, setP] = useState<number | undefined>(5); const [gr, setGr] = useState<number | undefined>(25)
  return <Card id="percentual" titulo="Percentual e peso" desc="Converta entre porcentagem e gramas a partir do peso total.">
    <Campo label="Peso total (g)"><Numero value={total} onChange={setTotal} /></Campo>
    <div className="linha"><Campo label="Percentual (%)"><Numero value={p} onChange={setP} /></Campo><Res v={`${fmt((total ?? 0) * (p ?? 0) / 100, 2)} g`} sub="peso correspondente" /></div>
    <div className="linha"><Campo label="Peso (g)"><Numero value={gr} onChange={setGr} /></Campo><Res v={`${fmt(total ? (gr ?? 0) / total * 100 : 0, 2)} %`} sub="percentual correspondente" /></div>
  </Card>
}

function Retracao() {
  const [cru, setCru] = useState<number | undefined>(10); const [q, setQ] = useState<number | undefined>(8.8)
  const r = cru && q ? (1 - q / cru) * 100 : undefined
  return <Card id="retracao" titulo="Retração da argila" desc="Meça uma barra de teste antes de secar e depois de queimar.">
    <div className="linha"><Campo label="Comprimento úmido (cm)"><Numero value={cru} onChange={setCru} /></Campo><Campo label="Comprimento queimado (cm)"><Numero value={q} onChange={setQ} /></Campo></div>
    <Res v={`${fmt(r, 1)} %`} sub="retração total" />
  </Card>
}

function AntesDaQueima() {
  const [fim, setFim] = useState<number | undefined>(30); const [r, setR] = useState<number | undefined>(12)
  const antes = fim && r != null && r < 100 ? fim / (1 - r / 100) : undefined
  return <Card id="dimensoes" titulo="Dimensões antes da queima" desc="Quanto modelar para chegar ao tamanho final.">
    <div className="linha"><Campo label="Tamanho final desejado (cm)"><Numero value={fim} onChange={setFim} /></Campo><Campo label="Retração da argila (%)"><Numero value={r} onChange={setR} /></Campo></div>
    <Res v={`${fmt(antes, 1)} cm`} sub="tamanho a modelar (úmido)" />
  </Card>
}

function Densidade() {
  const [peso, setPeso] = useState<number | undefined>(145); const [vol, setVol] = useState<number | undefined>(100)
  const [alvo, setAlvo] = useState<number | undefined>(1.4); const [lote, setLote] = useState<number | undefined>(1000)
  const d = peso && vol ? peso / vol : undefined
  const agua = d && alvo && lote && alvo < d && alvo > 1 ? ((lote / d) * (d - alvo)) / (alvo - 1) : undefined
  return <Card id="densidade" titulo="Densidade do esmalte" desc="Pese um volume conhecido da suspensão (ex.: 100 ml numa proveta).">
    <div className="linha"><Campo label="Peso da amostra (g)"><Numero value={peso} onChange={setPeso} /></Campo><Campo label="Volume da amostra (ml)"><Numero value={vol} onChange={setVol} /></Campo></div>
    <Res v={`${fmt(d, 3)} g/ml`} sub="densidade atual" />
    <div className="linha"><Campo label="Densidade desejada"><Numero value={alvo} onChange={setAlvo} /></Campo><Campo label="Peso do balde (g de suspensão)"><Numero value={lote} onChange={setLote} /></Campo></div>
    <Res v={agua != null ? `${fmt(agua, 0)} ml de água` : '–'} sub={d && alvo && alvo >= d ? 'para aumentar a densidade, deixe decantar e retire água' : 'a acrescentar para atingir a densidade desejada'} />
  </Card>
}

function Custo() {
  const rs = useReceitas(); const mapa = useMapaMateriais(); const [id, setId] = useState(''); const [g, setG] = useState<number | undefined>(1000)
  const r = rs?.find((x) => x.id === id)
  const c = r && g ? custo(r.ingredientes, baseParaTotal(r.ingredientes, g), mapa) : undefined
  return <Card id="custo" titulo="Custo de formulação" desc="Usa o preço por kg cadastrado em cada material.">
    <SelReceita value={id} onChange={setId} />
    <Campo label="Quantidade total seca (g)"><Numero value={g} onChange={setG} /></Campo>
    {c && <><Res v={brl(c.total)} sub={g ? `${brl(c.total / g * 1000)} por kg` : undefined} />{c.faltando.length > 0 && <p className="faint" style={{ fontSize: 12.5 }}>Sem preço: {c.faltando.join(', ')}. <Link to="/materiais" style={{ textDecoration: 'underline' }}>Cadastrar</Link></p>}</>}
  </Card>
}

function Mistura() {
  const rs = useReceitas(); const [a, setA] = useState(''); const [b, setB] = useState(''); const [pa, setPa] = useState<number | undefined>(50); const [g, setG] = useState<number | undefined>(500)
  const ra = rs?.find((x) => x.id === a), rb = rs?.find((x) => x.id === b)
  const ings = useMemo(() => (ra && rb && pa != null ? misturar(ra.ingredientes, rb.ingredientes, pa / 100) : undefined), [ra, rb, pa])
  return <Card id="mistura" titulo="Mistura entre esmaltes" desc="Receita resultante de misturar duas formulações.">
    <SelReceita value={a} onChange={setA} /><SelReceita value={b} onChange={setB} />
    <div className="linha"><Campo label="% da receita A"><Numero value={pa} onChange={setPa} /></Campo><Campo label="Quantidade total (g)"><Numero value={g} onChange={setG} /></Campo></div>
    {ings && g ? <TabelaPesos ings={ings} pesoBase={baseParaTotal(ings, g)} /> : null}
    {ra && rb && g && pa != null ? <p className="muted" style={{ fontSize: 13.5 }}>Ou misture as suspensões prontas: {fmt(g * pa / 100, 0)} g de A + {fmt(g * (100 - pa) / 100, 0)} g de B (peso seco).</p> : null}
  </Card>
}

function Forno() {
  const [kw, setKw] = useState<number | undefined>(5); const [h, setH] = useState<number | undefined>(9); const [uso, setUso] = useState<number | undefined>(60); const [tar, setTar] = useState<number | undefined>(0.95)
  const kwh = (kw ?? 0) * (h ?? 0) * (uso ?? 0) / 100
  return <Card id="forno" titulo="Consumo elétrico do forno" desc="O forno não fica ligado em potência máxima o tempo todo: informe o uso médio estimado.">
    <div className="linha"><Campo label="Potência (kW)"><Numero value={kw} onChange={setKw} /></Campo><Campo label="Duração da queima (h)"><Numero value={h} onChange={setH} /></Campo></div>
    <div className="linha"><Campo label="Uso médio da potência (%)"><Numero value={uso} onChange={setUso} /></Campo><Campo label="Tarifa (R$/kWh)"><Numero value={tar} onChange={setTar} /></Campo></div>
    <div className="linha"><Res v={`${fmt(kwh, 1)} kWh`} sub="energia estimada" /><Res v={brl(kwh * (tar ?? 0))} sub="custo da queima" /></div>
  </Card>
}

function Cones() {
  const [t, setT] = useState<number | undefined>(1240)
  const c = coneMaisProximo(t)
  return <Card id="cones" titulo="Cones pirométricos" desc="Cones Orton grandes, aquecimento de 60 °C/h no final. Temperaturas de referência.">
    <div className="linha"><Campo label="Temperatura (°C)"><Numero value={t} onChange={setT} /></Campo><Res v={c ? `Cone ${c}` : '–'} sub="mais próximo" /></div>
    <div style={{ maxHeight: 240, overflow: 'auto' }}><table className="tabela"><tbody>
      {CONES.map((x) => <tr key={x.cone} style={x.cone === c ? { background: 'var(--areia)' } : undefined}><td>Cone {x.cone}</td><td className="n">{x.c} °C</td><td className="n faint">{Math.round(x.c * 9 / 5 + 32)} °F</td></tr>)}
    </tbody></table></div>
  </Card>
}

const UNIDADES = {
  temperatura: { l: 'Temperatura', u: { '°C': [(x: number) => x, (x: number) => x], '°F': [(x: number) => (x - 32) * 5 / 9, (x: number) => x * 9 / 5 + 32], 'K': [(x: number) => x - 273.15, (x: number) => x + 273.15] } },
  massa: { l: 'Massa', u: { g: 1, kg: 1000, oz: 28.3495, lb: 453.592 } },
  volume: { l: 'Volume', u: { ml: 1, l: 1000, 'fl oz': 29.5735, 'xícara (240 ml)': 240, 'colher de sopa (15 ml)': 15 } },
  comprimento: { l: 'Comprimento', u: { mm: 0.1, cm: 1, m: 100, in: 2.54, ft: 30.48 } },
} as const
type Tipo = keyof typeof UNIDADES

function Unidades() {
  const [tipo, setTipo] = useState<Tipo>('massa'); const [v, setV] = useState<number | undefined>(1); const [de, setDe] = useState('lb')
  const us = UNIDADES[tipo].u as Record<string, number | readonly [(x: number) => number, (x: number) => number]>
  const nomes = Object.keys(us); const origem = nomes.includes(de) ? de : nomes[0]
  const base = (x: number, u: string) => { const f = us[u]; return typeof f === 'number' ? x * f : f[0](x) }
  const de2 = (x: number, u: string) => { const f = us[u]; return typeof f === 'number' ? x / f : f[1](x) }
  return <Card id="unidades" titulo="Conversão de unidades" desc="Temperatura, massa, volume e comprimento.">
    <div className="chips">{(Object.keys(UNIDADES) as Tipo[]).map((t) => <button key={t} className={'chip' + (t === tipo ? ' on' : '')} onClick={() => { setTipo(t); setDe(Object.keys(UNIDADES[t].u)[0]) }}>{UNIDADES[t].l}</button>)}</div>
    <div className="linha"><Campo label="Valor"><Numero value={v} onChange={setV} /></Campo><Campo label="Unidade"><select className="input" value={origem} onChange={(e) => setDe(e.target.value)}>{nomes.map((n) => <option key={n}>{n}</option>)}</select></Campo></div>
    <table className="tabela"><tbody>{v != null && nomes.filter((n) => n !== origem).map((n) => <tr key={n}><td>{n}</td><td className="n">{fmt(de2(base(v, origem), n), 3)}</td></tr>)}</tbody></table>
  </Card>
}

const LISTA = [['redimensionar', 'Redimensionar'], ['percentual', '% e peso'], ['retracao', 'Retração'], ['dimensoes', 'Antes da queima'], ['densidade', 'Densidade'], ['custo', 'Custo'], ['mistura', 'Mistura'], ['forno', 'Forno'], ['cones', 'Cones'], ['unidades', 'Unidades']]

export default function Calculadoras() {
  return (
    <div className="page">
      <p className="eyebrow">Ferramentas</p>
      <h1 style={{ marginTop: 8 }}>Calculadoras</h1>
      <div className="chips" style={{ margin: '22px 0 26px' }}>{LISTA.map(([id, l]) => <a key={id} className="chip" href={`#${id}`} onClick={(e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}>{l}</a>)}</div>
      <div className="calcs">
        <Redimensionar /><PercPeso /><Retracao /><AntesDaQueima /><Densidade /><Custo /><Mistura /><Forno /><Cones /><Unidades />
      </div>
    </div>
  )
}
