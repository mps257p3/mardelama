import { useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Amphora, Camera, Link2, FlaskConical, Layers, Feather, TestTube, BookOpen, type LucideIcon } from 'lucide-react'
import { Sheet } from './Sheet'
import { salvarArquivo } from '../db/files'
import { contextoDaRota, definirContexto } from '../lib/contexto'

interface Opcao { id: string; nome: string; icon: LucideIcon; cor: string; to?: string }

/** Opções do "+". Cada uma abre um cadastro real; o contexto da página atual vira conexão automática. */
export const OPCOES_ADICIONAR: Opcao[] = [
  { id: 'peca', nome: 'Peça minha', icon: Amphora, cor: 'var(--c-obras)', to: '/obras?nova=peca' },
  { id: 'foto', nome: 'Fotografia', icon: Camera, cor: 'var(--c-referencias)' },
  { id: 'link', nome: 'Link', icon: Link2, cor: 'var(--c-referencias)', to: '/referencias/nova?link=1' },
  { id: 'esmalte', nome: 'Esmalte', icon: FlaskConical, cor: 'var(--c-esmaltes)', to: '/esmaltes/novo' },
  { id: 'material', nome: 'Material', icon: Layers, cor: 'var(--c-materiais)', to: '/materiais/novo' },
  { id: 'nota', nome: 'Anotação', icon: Feather, cor: 'var(--c-caderno)', to: '/caderno/nova' },
  { id: 'teste', nome: 'Teste', icon: TestTube, cor: 'var(--c-esmaltes)', to: '/testes/novo' },
  { id: 'estudo', nome: 'Estudo', icon: BookOpen, cor: 'var(--c-biblioteca)', to: '/biblioteca/novo' },
]

export function QuickAdd({ onClose }: { onClose: () => void }) {
  const nav = useNavigate()
  const { pathname } = useLocation()
  const ctx = contextoDaRota(pathname)
  const arquivo = useRef<HTMLInputElement>(null)

  function ir(o: Opcao) {
    definirContexto(ctx)
    let to = o.to!
    // o teste já nasce com esmalte ou receita preenchidos quando criado a partir deles
    if (o.id === 'teste' && ctx?.tipo === 'esmalte') to += `?esmalte=${ctx.id}`
    if (o.id === 'teste' && ctx?.tipo === 'receita') to += `?receita=${ctx.id}`
    onClose(); nav(to)
  }
  async function foto(f?: File) {
    if (!f) return
    definirContexto(ctx)
    const id = await salvarArquivo(f, { tipo: 'referencia', id: 'novo' })
    onClose(); nav(`/referencias/nova?foto=${id}`)
  }

  return (
    <Sheet onClose={onClose} label="Adicionar">
      <h2>Adicionar</h2>
      {ctx && <p className="faint" style={{ fontSize: 13, marginTop: 4 }}>O novo item já nasce conectado a esta página.</p>}
      <div className="quick">
        {OPCOES_ADICIONAR.map((o) => (
          <button key={o.id} onClick={() => (o.id === 'foto' ? arquivo.current?.click() : ir(o))}>
            <o.icon size={24} strokeWidth={1.4} style={{ color: o.cor }} />
            <span>{o.nome}</span>
          </button>
        ))}
      </div>
      <input ref={arquivo} type="file" accept="image/*" hidden onChange={(e) => { foto(e.target.files?.[0]); e.target.value = '' }} />
    </Sheet>
  )
}
