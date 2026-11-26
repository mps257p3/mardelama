/** "incluído em 25/11/2026": data em que o item entrou no app. */
export const incluidoEm = (ts?: number) => (ts ? 'incluído em ' + new Date(ts).toLocaleDateString('pt-BR') : '')
