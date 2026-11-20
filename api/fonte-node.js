// A mesma ponte de /api/fonte, mas no runtime Node da Vercel (outra rede de saída).
// O Smithsonian e a Library of Congress recusam os pedidos que saem da rede "edge".
import ponte from './fonte.js'

export const config = { runtime: 'nodejs' }

export function GET(request) { return ponte(request) }
