import { db, type IdeiaEsmalte } from './schema'

/**
 * Ideias de esmaltação enviadas pelo Marcelo na conversa, com a leitura feita a partir das fotos.
 * As imagens ficam em /public/seed/ideias e são guardadas no aparelho como arquivo (sincronizam como as fotos dele).
 */
const T = Date.UTC(2026, 10, 25, 19)

const IDEIAS: { id: string; imagens: string[]; dados: Omit<IdeiaEsmalte, 'id' | 'criadoEm' | 'atualizadoEm' | 'imagens'> }[] = [
  {
    id: 'ideia-cmw-rainbow-polkadot',
    imagens: ['/seed/ideias/cmw-rainbow-loja.jpg', '/seed/ideias/cmw-rainbow-reel.jpg'],
    dados: {
      titulo: 'Bolinhas sobre degradê arco-íris',
      efeitos: ['Gradiente', 'Pintado / pincelado', 'Brilhante'],
      familias: [],
      esmaltes: 'Hipótese: bolinhas de vinil adesivo (ou cera) como máscara sobre o biscoito; engobe ou underglaze pulverizado com aerógrafo em degradê (vermelho, laranja, amarelo, verde, turquesa); retirar as máscaras; transparente brilhante por cima.',
      queima: 'Na peça original, provavelmente cone 5/6 em oxidação. No ateliê: 1200 a 1260 °C, forno elétrico, com pigmentos próprios para alta temperatura.',
      argila: 'Grês claro pontilhado (speckled); as bolinhas mostram a própria argila.',
      autor: 'CMW Ceramics',
      fonte: 'Rainbow Polkadot Bowl (Instagram @cmwceramics e loja)',
      url: 'https://cmwceramics.com',
      origem: 'semente:cmw-rainbow-polkadot',
      tags: ['aerógrafo', 'máscara', 'degradê', 'underglaze'],
      notas: [
        'Leitura a partir das fotos (Claude e ChatGPT chegaram à mesma técnica; o processo exato não foi confirmado pela artista).',
        '',
        'O que se vê: peça torneada (os anéis aparecem sob a cor); bolinhas sem cor, no tom da argila, com contorno nítido; degradê contínuo sem marca de pincel, típico de pulverização; brilho uniforme de transparente.',
        '',
        'Degradê com 3 cores: vermelho, amarelo e turquesa. O laranja nasce da sobreposição vermelho + amarelo e o verde da sobreposição amarelo + turquesa (testar, pigmentos cerâmicos não se misturam como tinta).',
        '',
        'Pigmentos para 1200 a 1260 °C: vermelho e laranja encapsulados em zircônio (certificados para a temperatura); amarelo de praseodímio; turquesa de vanádio-zircônio; verde industrial ou mistura testada. O transparente precisa ser compatível: preferir sem zinco, que pode apagar ou mudar alguns verdes e rosas.',
        '',
        'Cuidados: underglaze cru borra quando se mergulha no transparente. Fazer uma queima de fixação a uns 900 °C antes, ou pulverizar o transparente. O vinil dá borda mais limpa que a cera, mas precisa estar bem colado para a cor não escorrer por baixo.',
        '',
        'Equipamento: aerógrafo de dupla ação, bico de 0,5 a 0,8 mm (bicos maiores entopem menos com suspensão cerâmica), compressor com regulador de pressão e filtro de umidade. Cabine com exaustão e máscara PFF3: a névoa de material cerâmico não deve ser inalada.',
        '',
        'Primeiro teste: 3 plaquinhas de biscoito com 3 bolinhas de vinil cada; pulverizar vermelho→amarelo, amarelo→turquesa e as três cores; metade de cada com fixação a 900 °C antes do transparente, metade sem; queimar na temperatura de sempre.',
        '',
        'Possibilidade autoral: degradês e máscaras geométricas nas esculturas de animais, com terracota aparente e transparente só em partes.',
      ].join('\n'),
    },
  },
]

async function arquivoDe(url: string, dono: string) {
  try {
    const r = await fetch(url)
    const b = r.ok ? await r.blob() : undefined
    if (!b || !b.type.startsWith('image/')) return undefined
    const { salvarArquivo } = await import('./files')
    return await salvarArquivo(new File([b], url.split('/').pop()!, { type: b.type }), { tipo: 'ideia', id: dono })
  } catch { return undefined }
}

/** Semeia as ideias uma vez por aparelho, com ids fixos (não duplica nem mexe no que o usuário editou ou excluiu). */
export async function semearIdeias() {
  if (await db.ajustes.get('seed-ideias-v1')) return
  for (const x of IDEIAS) {
    if (await db.ideias.get(x.id)) continue
    const imagens = (await Promise.all(x.imagens.map((u) => arquivoDe(u, x.id)))).filter((a): a is string => !!a)
    // sem conseguir baixar (offline): tenta de novo na próxima abertura
    if (!imagens.length) return
    await db.ideias.add({ id: x.id, criadoEm: T, atualizadoEm: Date.now(), excluido: 0, favorito: 0, ...x.dados, imagens })
  }
  await db.ajustes.put({ chave: 'seed-ideias-v1', valor: true })
}
