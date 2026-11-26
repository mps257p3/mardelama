/**
 * Trava a rolagem da página enquanto há algo aberto por cima (visor, painel).
 * Conta quantos estão abertos: só destrava quando o último fecha. Antes cada um guardava e
 * devolvia o valor anterior, e com dois abertos (visor + painel) a página podia ficar travada.
 */
let abertos = 0

export function travarRolagem() {
  abertos++
  document.body.style.overflow = 'hidden'
  let solto = false
  return () => {
    if (solto) return
    solto = true
    abertos = Math.max(0, abertos - 1)
    if (!abertos) document.body.style.overflow = ''
  }
}

/** Rede de segurança: se nada estiver aberto, a página tem que rolar. */
export function conferirRolagem() {
  if (document.querySelector('.sheet, .visor, .scrim')) return
  abertos = 0
  document.body.style.overflow = ''
}
