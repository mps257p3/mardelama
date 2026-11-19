import { useNavigate } from 'react-router-dom'
import { FlaskConical, TestTube, Layers, Images, BookOpen, Feather, ScrollText } from 'lucide-react'
import { Sheet } from './Sheet'

const OPCOES = [
  { to: '/caderno/nova', nome: 'Anotação', desc: 'Ideia, pesquisa, descoberta', icon: Feather },
  { to: '/referencias/nova', nome: 'Referência', desc: 'Imagem, artista, link', icon: Images },
  { to: '/esmaltes/novo', nome: 'Esmalte', desc: 'Comercial ou próprio', icon: FlaskConical },
  { to: '/testes/novo', nome: 'Teste', desc: 'Placa de teste com código', icon: TestTube },
  { to: '/receitas/nova', nome: 'Receita', desc: 'Formulação de esmalte', icon: ScrollText },
  { to: '/materiais/novo', nome: 'Material', desc: 'Insumo do ateliê', icon: Layers },
  { to: '/biblioteca/novo', nome: 'Conteúdo', desc: 'Texto, link, PDF', icon: BookOpen },
]

export function QuickAdd({ onClose }: { onClose: () => void }) {
  const nav = useNavigate()
  return (
    <Sheet onClose={onClose} label="Adicionar">
      <p className="eyebrow">Adicionar ao ateliê</p>
      <h2 style={{ marginTop: 6 }}>O que você quer registrar?</h2>
      <div className="quick">
        {OPCOES.map(({ to, nome, desc, icon: I }) => (
          <button key={to} onClick={() => { onClose(); nav(to) }}>
            <I size={20} strokeWidth={1.4} />
            <span>{nome}<small>{desc}</small></span>
          </button>
        ))}
      </div>
    </Sheet>
  )
}
