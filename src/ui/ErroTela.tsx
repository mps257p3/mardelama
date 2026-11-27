import { Component, type ReactNode } from 'react'
import { recarregarComVersaoNova } from '../lib/versaoNova'

/**
 * Se uma tela falhar ao abrir, mostra o aviso e um botão em vez de deixar o app em branco.
 * Muda de tela (chave) → tenta de novo.
 */
export class ErroTela extends Component<{ chave: string; children: ReactNode }, { erro?: Error; chave: string }> {
  state: { erro?: Error; chave: string } = { chave: this.props.chave }
  static getDerivedStateFromError(erro: Error) { return { erro } }
  static getDerivedStateFromProps(p: { chave: string }, s: { erro?: Error; chave: string }) {
    return p.chave !== s.chave ? { erro: undefined, chave: p.chave } : null
  }
  render() {
    if (!this.state.erro) return this.props.children
    const versao = /dynamically imported module|Importing a module script failed|module script|Loading chunk/i.test(this.state.erro.message)
    return (
      <div className="erro-tela" role="alert">
        <p className="erro-tela-t">{versao ? 'O app foi atualizado' : 'Não consegui abrir esta tela'}</p>
        <p>{versao ? 'Esta janela ainda estava com a versão anterior. Toque abaixo para carregar a versão nova; seus dados continuam no aparelho.' : 'Toque abaixo para recarregar. Se continuar, mande um print desta mensagem.'}</p>
        <button className="btn" onClick={() => recarregarComVersaoNova(true)}>Carregar a versão nova</button>
        {!versao && <p className="erro-tela-d">{this.state.erro.message}</p>}
      </div>
    )
  }
}
