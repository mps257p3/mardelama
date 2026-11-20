/** Política de privacidade (pedida pelo Pinterest para cadastrar o app). */
export default function Privacidade() {
  return (
    <div className="page" style={{ maxWidth: 720 }}>
      <p className="eyebrow">Mar de Lama</p>
      <h1 style={{ marginTop: 6 }}>Privacidade</h1>
      <div className="texto-longo" style={{ marginTop: 14, lineHeight: 1.6 }}>
        <p>O Mar de Lama é um aplicativo pessoal de ateliê de cerâmica, usado por uma única pessoa, o próprio dono do ateliê. Não é oferecido ao público nem vende dados.</p>
        <h3>O que é guardado</h3>
        <p>Receitas de esmaltes, testes, anotações e referências visuais criadas pelo usuário. Os dados ficam no aparelho e numa cópia de segurança no Supabase, acessível só à conta do usuário.</p>
        <h3>Pinterest</h3>
        <p>Quando o usuário conecta a própria conta do Pinterest, o app lê apenas os painéis e pins dessa conta (permissões de leitura: conta, painéis e pins) para guardá-los como referências pessoais, com título, descrição, imagem e link original. O app não publica, não altera e não apaga nada no Pinterest. O token de acesso fica cifrado no servidor e nunca é exibido nem compartilhado. Os dados do Pinterest não são usados para treinar modelos de inteligência artificial; quando o usuário ativa a leitura por IA, as imagens são enviadas apenas para gerar tags e cores para o próprio acervo dele.</p>
        <h3>Desconectar e apagar</h3>
        <p>O usuário pode desconectar a conta a qualquer momento em Referências › Pinterest, o que apaga o token do servidor. Também pode retirar o acesso em pinterest.com › Configurações › Aplicativos. As referências já salvas continuam no acervo pessoal e podem ser apagadas no próprio app.</p>
        <h3>Contato</h3>
        <p>Dúvidas sobre estes dados: pelo perfil @mar_de_lama.</p>
      </div>
    </div>
  )
}
