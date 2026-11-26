import { Link } from 'react-router-dom'
import { ArrowUpRight, FlaskConical, Lightbulb, ScrollText, TestTube } from 'lucide-react'
import { useEsmaltes, useReceitas, useTestes } from '../../db/hooks'
import { Foto } from '../../ui/form'
import { useIdeias } from './Ideias'

type Capa = { id?: string; externa?: string }
const recente = <T extends { atualizadoEm: number }>(xs: T[] | undefined, foto: (x: T) => Capa | undefined): Capa | undefined =>
  [...(xs ?? [])].sort((a, b) => b.atualizadoEm - a.atualizadoEm).map(foto).find((c) => c && (c.id || c.externa))

/** Capas de Superfícies (esmaltes, fórmulas, testes, ideias) com fotos do próprio ateliê; ficam no topo da Esmaltaria. */
export function CapasSuperficies() {
  const esmaltes = useEsmaltes(), receitas = useReceitas(), testes = useTestes(), ideias = useIdeias()
  const ITENS: { to: string; nome: string; n?: number; capa?: Capa; icon: typeof FlaskConical; cor: string; classe: string }[] = [
    { to: '/esmaltes', nome: 'Esmaltes', n: esmaltes?.length, icon: FlaskConical, cor: 'esm', classe: 'larga',
      capa: recente(esmaltes, (e) => ({ id: e.fotos[0] ?? e.pecas?.[0] })) },
    { to: '/receitas', nome: 'Fórmulas', n: receitas?.length, icon: ScrollText, cor: 'rec', classe: '',
      capa: recente(receitas, (r) => ({ id: r.fotos?.[0] ?? r.pecas?.[0] })) },
    { to: '/testes', nome: 'Testes', n: testes?.length, icon: TestTube, cor: 'tes', classe: '',
      capa: recente(testes, (t) => ({ id: t.fotos[0] })) },
    { to: '/ideias', nome: 'Ideias', n: ideias?.length, icon: Lightbulb, cor: 'ide', classe: 'larga',
      capa: recente(ideias, (i) => ({ id: i.imagens[0], externa: i.imagemExterna })) },
  ]
  return (
    <div className="sup-capas">
      {ITENS.map(({ to, nome, n, capa, icon: I, cor, classe }) => (
        <Link key={to} to={to} className={`sup-capa ${cor} ${classe}`}>
          {capa?.id ? <Foto id={capa.id} alt="" /> : capa?.externa ? <img src={capa.externa} alt="" referrerPolicy="no-referrer" loading="lazy" /> : <I className="sup-icone" size={120} strokeWidth={0.7} />}
          <span className="sup-texto">
            {n != null && <span className="sup-n">{n}</span>}
            <span className="sup-nome">{nome}</span>
          </span>
          <ArrowUpRight className="sup-seta" size={18} strokeWidth={1.5} />
        </Link>
      ))}
    </div>
  )
}
