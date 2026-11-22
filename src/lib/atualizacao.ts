/**
 * Atualização do app sem perder o que se está digitando: se houve digitação na tela atual,
 * a versão nova espera a próxima troca de tela (ou o app ir para segundo plano sem nada digitado).
 */
let sujo = false
let pendente: (() => void) | undefined

if (typeof document !== 'undefined') {
  document.addEventListener('input', () => { sujo = true }, true)
}

/** Chamado quando há versão nova pronta. */
export function pedirAtualizacao(aplicar: () => void) {
  pendente = aplicar
  if (!sujo) aplicar()
}

/** Chamado a cada troca de tela: o que foi digitado já ficou para trás. */
export function trocouDeTela() {
  sujo = false
  if (pendente) pendente()
}
