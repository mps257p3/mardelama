import { db, type IdeiaEsmalte } from './schema'

/**
 * Ideias de esmaltação enviadas pelo Marcelo na conversa, com a leitura feita a partir das fotos.
 * As imagens ficam em /public/seed/ideias e são guardadas no aparelho como arquivo (sincronizam como as fotos dele).
 */
const T = Date.UTC(2026, 10, 25, 19)

const NOTAS_V1 = 'Leitura a partir das fotos (Claude e ChatGPT chegaram à mesma técnica; o processo exato não foi confirmado pela artista).\n\nO que se vê: peça torneada (os anéis aparecem sob a cor); bolinhas sem cor, no tom da argila, com contorno nítido; degradê contínuo sem marca de pincel, típico de pulverização; brilho uniforme de transparente.\n\nDegradê com 3 cores: vermelho, amarelo e turquesa. O laranja nasce da sobreposição vermelho + amarelo e o verde da sobreposição amarelo + turquesa (testar, pigmentos cerâmicos não se misturam como tinta).\n\nPigmentos para 1200 a 1260 °C: vermelho e laranja encapsulados em zircônio (certificados para a temperatura); amarelo de praseodímio; turquesa de vanádio-zircônio; verde industrial ou mistura testada. O transparente precisa ser compatível: preferir sem zinco, que pode apagar ou mudar alguns verdes e rosas.\n\nCuidados: underglaze cru borra quando se mergulha no transparente. Fazer uma queima de fixação a uns 900 °C antes, ou pulverizar o transparente. O vinil dá borda mais limpa que a cera, mas precisa estar bem colado para a cor não escorrer por baixo.\n\nEquipamento: aerógrafo de dupla ação, bico de 0,5 a 0,8 mm (bicos maiores entopem menos com suspensão cerâmica), compressor com regulador de pressão e filtro de umidade. Cabine com exaustão e máscara PFF3: a névoa de material cerâmico não deve ser inalada.\n\nPrimeiro teste: 3 plaquinhas de biscoito com 3 bolinhas de vinil cada; pulverizar vermelho→amarelo, amarelo→turquesa e as três cores; metade de cada com fixação a 900 °C antes do transparente, metade sem; queimar na temperatura de sempre.\n\nPossibilidade autoral: degradês e máscaras geométricas nas esculturas de animais, com terracota aparente e transparente só em partes.'

const NOTAS_V2 = [
  'Degradê com 3 cores: vermelho, amarelo e turquesa. O laranja nasce da sobreposição vermelho + amarelo e o verde da sobreposição amarelo + turquesa (testar, pigmentos cerâmicos não se misturam como tinta).',
  'Pigmentos para 1200 a 1260 °C: vermelho e laranja encapsulados em zircônio (certificados para a temperatura); amarelo de praseodímio; turquesa de vanádio-zircônio; verde industrial ou mistura testada. O transparente precisa ser compatível: preferir sem zinco, que pode apagar ou mudar alguns verdes e rosas.',
  'Cuidados: underglaze cru borra quando se mergulha no transparente. Fazer uma queima de fixação a uns 900 °C antes, ou pulverizar o transparente. O vinil dá borda mais limpa que a cera, mas precisa estar bem colado para a cor não escorrer por baixo.',
  'Equipamento: aerógrafo de dupla ação, bico de 0,5 a 0,8 mm (bicos maiores entopem menos com suspensão cerâmica), compressor com regulador de pressão e filtro de umidade. Cabine com exaustão e máscara PFF3: a névoa de material cerâmico não deve ser inalada.',
  'Primeiro teste: 3 plaquinhas de biscoito com 3 bolinhas de vinil cada; pulverizar vermelho→amarelo, amarelo→turquesa e as três cores; metade de cada com fixação a 900 °C antes do transparente, metade sem; queimar na temperatura de sempre.',
  'Possibilidade autoral: degradês e máscaras geométricas nas esculturas de animais, com terracota aparente e transparente só em partes.',
].join('\n\n')

const NOTAS = [
  'Degradê com 3 cores: vermelho, amarelo e turquesa. O laranja nasce da sobreposição vermelho + amarelo e o verde da sobreposição amarelo + turquesa (testar, pigmentos cerâmicos não se misturam como tinta).',
  'Pigmentos para 1200 a 1260 °C: vermelho e laranja encapsulados em zircônio (certificados para a temperatura); amarelo de praseodímio; turquesa de vanádio-zircônio; verde industrial ou mistura testada. O transparente precisa ser compatível: preferir sem zinco, que pode apagar ou mudar alguns verdes e rosas.',
  'Cuidados: underglaze cru borra quando se mergulha no transparente. Fazer uma queima de fixação a uns 900 °C antes, ou pulverizar o transparente. O vinil dá borda mais limpa que a cera, mas precisa estar bem colado para a cor não escorrer por baixo.',
  'Equipamento: aerógrafo de dupla ação, bico de 0,5 a 0,8 mm (bicos maiores entopem menos com suspensão cerâmica), compressor com regulador de pressão e filtro de umidade. Cabine com exaustão e máscara PFF3: a névoa de material cerâmico não deve ser inalada.',
  'Primeiro teste: 3 plaquinhas de biscoito com 3 bolinhas de vinil cada; pulverizar vermelho→amarelo, amarelo→turquesa e as três cores; metade de cada com fixação a 900 °C antes do transparente, metade sem; queimar na temperatura de sempre.',
].join('\n\n')

const MATERIAIS = [
  'Underglaze ou engobe vermelho: pigmento vermelho encapsulado em zircônio, certificado para 1260 °C',
  'Underglaze ou engobe amarelo: pigmento amarelo de praseodímio (zircônio-praseodímio)',
  'Underglaze ou engobe turquesa: pigmento de vanádio-zircônio',
  'Laranja e verde: nascem da sobreposição; se não der, laranja encapsulado e verde industrial',
  'Transparente brilhante de alta temperatura, sem zinco: cobre a peça toda',
  'Para comparar: underglazes comerciais Amaco Velvet (o rótulo indica até cone 10; vermelhos podem enfraquecer)',
  'Bolinhas de vinil adesivo (ou cera líquida): máscara das bolinhas',
  'Grês claro pontilhado: base da peça',
].join('\n')

const MATERIAIS_MOSCA = [
  'Esmalte base branco acetinado de alta temperatura (opacificado com zircônio): fundo das peças de mancha',
  'Esmalte transparente brilhante de alta, sem zinco: base para tingir as cores dos degradês e dos interiores',
  'Pigmento vermelho encapsulado em zircônio (inclusão), certificado para 1260 °C: mancha e degradê vermelhos, interior vermelho',
  'Pigmento laranja encapsulado em zircônio: mancha e degradê laranja',
  'Pigmento azul de cobalto (ou carbonato de cobalto): mancha e degradê azuis; pouca quantidade já dá cor forte',
  'Pigmento verde de cromo (ou cromo-cobalto para o verde mais escuro): mancha e peças verdes',
  'Óxido de ferro vermelho bem diluído (opcional): a borda marrom tostada de algumas peças',
  'Grês branco ou creme: corpo, com a base sem esmalte e três pezinhos',
  'Cera ou látex de reserva: protege a base da esmaltação',
].join('\n')

const NOTAS_MOSCA = [
  'Duas famílias na mesma coleção: peças brancas com uma mancha de cor pulverizada (bordas granuladas, típicas de aerógrafo) e peças com degradê da boca para baixo, mais carregado na borda e clareando até o branco.',
  'Diferença para as bolinhas da CMW: aqui a cor parece estar no próprio esmalte (pigmento misturado ao esmalte), e não num underglaze sob transparente. Assim não precisa de queima de fixação, e uma única queima de esmalte resolve.',
  'Quanto pigmento (ponto de partida): vermelho e laranja encapsulados 8 a 12% no esmalte; verde de cromo 4 a 8%; cobalto 1 a 3% (é muito forte). Testar em plaquinhas antes, porque cada esmalte base responde diferente.',
  'Cuidados: pigmentos encapsulados aguentam alta temperatura, mas desbotam se o esmalte base tiver muito zinco; verdes de cromo ficam marrons com zinco e podem dar rosa perto de estanho. Pulverizar sempre em cabine com exaustão e máscara PFF3.',
  'Primeiro teste: plaquinhas com o esmalte branco; pulverizar uma mancha de cada cor, de 10 cm e de 20 cm de distância, para ver o tamanho e o granulado da borda; em outras, pulverizar o esmalte colorido só no terço de cima para testar o degradê; queimar na temperatura de sempre.',
].join('\n\n')

const IDEIAS: { id: string; em: number; imagens: string[]; dados: Omit<IdeiaEsmalte, 'id' | 'criadoEm' | 'atualizadoEm' | 'imagens'> }[] = [
  {
    id: 'ideia-cmw-rainbow-polkadot',
    em: T,
    imagens: ['/seed/ideias/cmw-rainbow-loja.jpg', '/seed/ideias/cmw-rainbow-reel.jpg'],
    dados: {
      titulo: 'Bolinhas sobre degradê arco-íris',
      efeitos: ['Gradiente', 'Pintado / pincelado', 'Brilhante'],
      familias: [],
      materiais: MATERIAIS,
      esmaltes: 'Hipótese: bolinhas de vinil adesivo (ou cera) como máscara sobre o biscoito; engobe ou underglaze pulverizado com aerógrafo em degradê (vermelho, laranja, amarelo, verde, turquesa); retirar as máscaras; transparente brilhante por cima.',
      queima: 'Na peça original, provavelmente cone 5/6 em oxidação. No ateliê: 1200 a 1260 °C, forno elétrico, com pigmentos próprios para alta temperatura.',
      argila: 'Grês claro pontilhado (speckled); as bolinhas mostram a própria argila.',
      autor: 'CMW Ceramics',
      fonte: 'Rainbow Polkadot Bowl (Instagram @cmwceramics e loja)',
      url: 'https://cmwceramics.com',
      origem: 'semente:cmw-rainbow-polkadot',
      tags: ['aerógrafo', 'máscara', 'degradê', 'underglaze'],
      notas: NOTAS,
    },
  },
  {
    id: 'ideia-oda-mosca',
    em: Date.UTC(2026, 10, 25, 19, 30),
    imagens: [1, 2, 3, 4, 5, 6].map((n) => `/seed/ideias/oda-mosca-${n}.jpg`),
    dados: {
      titulo: 'Manchas pulverizadas e degradês',
      efeitos: ['Gradiente', 'Manchado', 'Brilhante', 'Acetinado'],
      familias: [],
      materiais: MATERIAIS_MOSCA,
      esmaltes: 'Hipótese: tornear a peça cônica com base arredondada e três pezinhos; biscoito; reservar a base com cera; para as manchas, mergulhar no esmalte branco e pulverizar com aerógrafo o esmalte colorido num só ponto, de perto, para a borda esfumada; para os degradês, esmaltar o interior com a cor e pulverizar o esmalte colorido mais carregado na boca, diminuindo para baixo; queima única de esmalte em alta.',
      queima: 'Não informada na publicação. Pelo grês e pelos pigmentos, provavelmente alta temperatura (1200 a 1260 °C) em oxidação, forno elétrico.',
      argila: 'Grês branco ou creme; a base fica sem esmalte e mostra a argila.',
      autor: 'Mosca Cerâmica',
      fonte: 'Coleção Mosca, Colecionáveis ÔDA 2026 (Instagram @odadesignbr)',
      origem: 'semente:oda-mosca',
      tags: ['aerógrafo', 'mancha', 'degradê', 'pigmento no esmalte'],
      notas: NOTAS_MOSCA,
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

/**
 * Semeia cada ideia uma vez por aparelho, com ids fixos (não duplica nem mexe no que o usuário editou ou excluiu).
 * Cada ideia tem a sua marca; a primeira usava 'seed-ideias-v1'.
 */
export async function semearIdeias() {
  const antiga = !!(await db.ajustes.get('seed-ideias-v1'))
  for (const x of IDEIAS) {
    const chave = 'seed-ideia:' + x.id
    if (await db.ajustes.get(chave)) continue
    if (!(antiga && x.id === 'ideia-cmw-rainbow-polkadot') && !(await db.ideias.get(x.id))) {
      const imagens = (await Promise.all(x.imagens.map((u) => arquivoDe(u, x.id)))).filter((a): a is string => !!a)
      // sem conseguir baixar (offline): tenta de novo na próxima abertura
      if (!imagens.length) continue
      await db.ideias.add({ id: x.id, criadoEm: x.em, atualizadoEm: Date.now(), excluido: 0, favorito: 0, ...x.dados, imagens })
    }
    await db.ajustes.put({ chave, valor: true })
  }
  await ajustarIdeias()
}

/** 25/11: anotações mais diretas (sem a nota sobre as IAs, sem "O que se vê" e sem "Possibilidade autoral"; degradê e pigmentos primeiro), se o usuário não mexeu. */
export async function ajustarIdeias() {
  if (await db.ajustes.get('fix-ideias-v3')) return
  const x = await db.ideias.get('ideia-cmw-rainbow-polkadot')
  if (x && (x.notas === NOTAS_V1 || x.notas === NOTAS_V2)) await db.ideias.update(x.id, { notas: NOTAS, atualizadoEm: Date.now() })
  // novo bloco "Esmaltes e materiais": só preenche se ainda estiver vazio
  const y = await db.ideias.get('ideia-cmw-rainbow-polkadot')
  if (y && !y.materiais) await db.ideias.update(y.id, { materiais: MATERIAIS, atualizadoEm: Date.now() })
  await db.ajustes.put({ chave: 'fix-ideias-v3', valor: true })
}
