import { useSyncExternalStore } from 'react'
import { criarFiltroRefs } from '../../lib/filtroRefs'

/** Filtros do Acervo de Referências 2: separados dos do Acervo original (outra chave na sessão). */
const f = criarFiltroRefs('ref2.acervo.filtro', 'ref2.acervo.op')
export const mudarFiltroAcervo2 = f.mudar
export function useFiltroAcervo2() { return useSyncExternalStore(f.assinar, f.ler) }
