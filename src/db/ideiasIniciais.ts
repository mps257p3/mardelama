import { db, type Comercial, type IdeiaEsmalte } from './schema'

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


const MATERIAIS_KATIEB = [
  'Esmalte base: a cor predominante da peça',
  'Esmalte reativo: manchas e variações (os de ferro e rutilo reagem bem)',
  'Esmalte fluido: movimento e escorrido, sempre com pé de peça protegido',
  'Esmalte estável: segura o escorrido onde não se quer movimento',
  'Esmalte translúcido: profundidade',
  'Esmalte opaco: contraste',
  'Esmalte de efeito: microcristais, floating',
  'Liner interno testado para alimento: o lado de dentro da peça utilitária',
  'Pincel largo e macio, esponja natural úmida e esponja seca: aplicação',
].join('\n')

const NOTAS_KATIEB_V1 = [
  'Sete técnicas para esmaltar de forma expressiva sem perder o controle: o acaso só aparece quando o resto está anotado.',
  '1. Camadas irregulares: varie a carga do pincel, o número de demãos e a pressão; alterne grosso e fino, deixando a massa aparecer. O grosso reage e escorre mais.',
  '2. Diluição medida: separe porções e acrescente água em quantidade anotada; aplique as concentrações lado a lado ou sobrepostas para degradês e transparências. A água muda o quanto de esmalte fica na peça, não a fluidez na queima.',
  '3. Uma função para cada esmalte: base, reativo, fluido, estável, translúcido, opaco, de efeito. Teste toda combinação: dois esmaltes estáveis podem virar uma mistura muito fluida.',
  '4. Pincel seco: pouca carga e muitas passadas sem recarregar, mudando direção, pressão e velocidade. Deixa estrias, falhas e realça o relevo; as marcas suavizam um pouco no forno.',
  '5. Esponja: úmida para tirar, espalhar e suavizar; seca para puxar o excesso ainda úmido. O esmalte se acumula nas cavidades. Nunca esfregue esmalte seco (poeira).',
  '6. Acaso controlado: combine espessuras, diluições, sobreposições e intervenções; teste esmaltes reativos e curvas de resfriamento.',
  '7. Dentro funcional, fora experimental: liner testado por dentro; borda, área da boca e encontros entre esmaltes também precisam ser seguros.',
  'Nos testes: anote composição, diluição, número de camadas e ordem; fotografe antes e depois; placa vertical para ver o escorrido; placa de sacrifício na prateleira; anote temperatura, patamar e resfriamento; compare sempre sobre a mesma massa.',
].join('\n\n')


const COMO_KATIEB = [
  'Camadas irregulares (foto 1): varie a carga do pincel, o número de demãos e a pressão. Alterne grosso e fino, deixando a massa aparecer. O grosso reage e escorre mais.',
  'Diluição medida (foto 2): separe porções e acrescente água em quantidade anotada. Aplique as concentrações lado a lado ou sobrepostas, para degradês e transparências. A água muda o quanto de esmalte fica na peça, não a fluidez na queima.',
  'Uma função para cada esmalte (foto 3): combine base, reativo, fluido, estável, translúcido, opaco e de efeito, conforme a lista de esmaltes acima. Dois esmaltes estáveis juntos podem virar uma mistura muito fluida.',
  'Pincel seco (foto 4): pouca carga e muitas passadas sem recarregar, mudando direção, pressão e velocidade. Deixa estrias e falhas e realça o relevo. As marcas suavizam um pouco no forno.',
  'Esponja (foto 5): úmida para tirar, espalhar e suavizar. Seca para puxar o excesso ainda úmido. O esmalte se acumula nas cavidades.',
  'Acaso controlado (foto 6): junte espessuras, diluições, sobreposições e intervenções. Teste esmaltes reativos e curvas de resfriamento.',
  'Liner por dentro (foto 7): liner testado por dentro e experimentação só por fora. Borda, área da boca e encontros entre esmaltes também precisam ser seguros.',
].join('\n\n')

const NOTAS_KATIEB = [
  'Nos testes: anote composição, diluição, número de camadas e ordem; fotografe antes e depois; use placa vertical para ver o escorrido; ponha placa de sacrifício na prateleira; anote temperatura, patamar e resfriamento; compare sempre sobre a mesma massa.',
  'Cuidado: nunca esfregue esmalte seco com a esponja, por causa da poeira.',
].join('\n\n')

const USOS_IRON_LUSTRE = [
  'Superfícies com relevo, carimbo ou entalhe: afina nas partes altas (marrom) e acumula nos fundos, onde aparece o azul-acinzentado',
  'Aplicação grossa, 2 a 3 demãos: fina, fica chapada e sem flutuação (Bath Potters, The Ceramic Shop)',
  'Peças verticais e bordas: o esmalte se move, então deixe uma folga sem esmalte no pé',
  'Cone 5 a 6 em oxidação, forno elétrico: é para onde foi feito (efeito de redução sem redução)',
  'Resfriamento lento entre 1100 e 900 °C costuma realçar as flutuações (prática comum com rutilo; testar)',
  'Por cima de outros Potter\'s Choice: a Amaco mostra PC-33 sobre Sage (PC-44), Blue Stone (PC-22), June Bug (PC-10), Iron Yellow (PC-38) e Glacier (C-19)',
  'Uso utilitário: a Amaco classifica a linha como própria para louça; mesmo assim, teste a sua queima antes de vender',
]

const IRON_LUSTRE: Omit<Comercial, 'id' | 'criadoEm' | 'atualizadoEm' | 'fotos'> = {
  fabricante: 'Amaco',
  nome: 'Iron Lustre',
  codigo: 'PC-33',
  serie: "Potter's Choice",
  familias: [],
  cone: '5 a 6',
  temperatura: '1186 a 1222 °C, oxidação',
  instrucoes: 'Pincel, 2 a 3 demãos grossas (aplicação fina fica sem graça, sem a flutuação). Deixe uma folga no pé: o esmalte se move. A Amaco mostra combinações com ele por cima de outros PC, como PC-21 Oatmeal.',
  usos: USOS_IRON_LUSTRE,
  declarados: [
    'Marrom onde fica fino; flutuações azul-acinzentadas onde fica grosso',
    'Efeitos de redução em queima de oxidação (característica da linha Potter\'s Choice)',
    'Cone 5 a 6',
    'Próprio para louça de mesa segundo a Amaco (a linha toda, exceto PC-4, PC-9 e PC-64); sem chumbo',
  ],
  documentacao: 'Ficha de segurança SDS 5430, rev. 40 (25/04/2021), seção 3: dióxido de silício até 15% (CAS 14808-60-7); silicato de alumínio (caulim) até 15% (CAS 1332-58-7); carbonato de cálcio menos de 1%; conservante triazina menos de 1%. Nenhum composto de ferro, cobalto, manganês, cromo, bário, zinco ou lítio aparece, o que só quer dizer que estão abaixo do limite de declaração ou não são classificados como perigosos. O restante (cerca de 70% do sólido) não é declarado: em esmaltes comerciais costuma ser frita, que não entra na ficha por não ser perigosa.',
  hipoteses: [
    'Tipo de esmalte: base de boro (frita ou Gerstley Borate) com ferro e rutilo, da mesma família do "Floating Blue" de cone 6. O azul-acinzentado que "flutua" no grosso é típico de rutilo ou titânio em vidro de boro; o marrom no fino vem do ferro.',
    'Pouca sílica e caulim livres (até 15% cada) apontam para uma base feita quase toda de frita.',
    'Ponto de partida (100): nefelina sienita 48, Gerstley Borate 26, sílica 20, caulim 6. Adições: óxido de ferro vermelho 4 a 6%, rutilo claro 4%.',
    'Para puxar o azul da flutuação: testar 0,25 a 0,5% de óxido de cobalto. Para mais marrom metálico: subir o ferro até 8%.',
    'Base de referência publicada: Floating Blue (cone 6, oxidação; Ceramics Monthly, out. 2001): Gerstley Borate 26, nefelina sienita 48, caulim EPK 6, sílica 20 + óxido de cobalto 1, rutilo claro 4, óxido de ferro vermelho 2. Aqui o ferro sobe e o cobalto cai porque a cor dominante é marrom.',
  ],
  fontes: [
    'https://www.bathpotters.co.uk/userfiles/file/amaco-potters-choice-pc-31-pc-712.pdf',
    'https://www.bathpotters.co.uk/iron-lustre-amaco-potters-choice-glaze/p2201',
    'https://www.theceramicshop.com/product/9814/pc33-iron-lustre-pint/',
    'https://amaco.com/resources/layering/pc-33-iron-lustre-over-pcf-74-river-birch',
    'https://ceramicartsnetwork.org/ceramic-recipes/recipe/Floating-Blue-Glaze-143691',
    'Reel de @katiebceramics, "3. Iron Lustre by Amaco"',
  ],
  observacoes: 'Temperatura: cone 5 = 1186 °C e cone 6 = 1222 °C a 60 °C/h nos últimos 100 °C (Bath Potters); a The Ceramic Shop cita 1184 e 1241 °C a 150 °C/h.\n\nVisto no reel de @katiebceramics sobre esmaltes "flutuantes". A receita é hipótese: a Amaco não publica a fórmula. Primeiro teste: 3 placas verticais com a base e ferro 4, 6 e 8% (rutilo 4% em todas), uma metade com 2 demãos e outra com 3, mais uma placa com óxido de cobalto 0,5%. Cone 6, resfriamento lento entre 1100 e 900 °C ajuda a flutuação. O rutilo varia muito de lote para lote.',
}

/** Fotos do PC-33 na loja Bath Potters (distribuidora da Amaco no Reino Unido): a primeira é a placa do próprio esmalte. */
const FOTOS_IRON_LUSTRE = [6361, 4264, 2686, 8977].map((n) => `https://www.bathpotters.co.uk/images/products/large/2201_${n}.jpg`)

/** Junta as fotos da marca ao estudo (precisa estar logado e com internet; tenta de novo na próxima abertura). */
async function usosIronLustre() {
  if (await db.ajustes.get('fix-comercial-usos-v1')) return
  const c = await db.comerciais.get('comercial-amaco-pc33-iron-lustre')
  if (c && !c.usos?.length) await db.comerciais.update(c.id, { usos: USOS_IRON_LUSTRE, atualizadoEm: Date.now() })
  await db.ajustes.put({ chave: 'fix-comercial-usos-v1', valor: true })
}

async function fotosIronLustre() {
  const id = 'comercial-amaco-pc33-iron-lustre'
  if (await db.ajustes.get('seed-comercial-fotos:' + id)) return
  const c = await db.comerciais.get(id)
  if (!c || c.excluido) return
  const { fotosDoFabricante } = await import('../lib/comercial')
  const novas = await fotosDoFabricante(id, FOTOS_IRON_LUSTRE)
  if (!novas.length) return
  // as fotos da marca vêm primeiro (a capa vira a placa do esmalte); o print do reel fica no fim
  const atual = await db.comerciais.get(id)
  await db.comerciais.update(id, { fotos: [...novas, ...(atual?.fotos ?? [])], atualizadoEm: Date.now() })
  await db.ajustes.put({ chave: 'seed-comercial-fotos:' + id, valor: true })
}

async function semearIronLustre() {
  const id = 'comercial-amaco-pc33-iron-lustre'
  const chave = 'seed-comercial:' + id
  if (await db.ajustes.get(chave)) return
  if (!(await db.comerciais.get(id))) {
    let fotos: string[] = []
    try {
      const r = await fetch('/seed/ideias/amaco-iron-lustre-reel.jpg')
      const b = r.ok ? await r.blob() : undefined
      if (b?.type.startsWith('image/')) {
        const { salvarArquivo } = await import('./files')
        fotos = [await salvarArquivo(new File([b], 'amaco-iron-lustre-reel.jpg', { type: b.type }), { tipo: 'comercial', id })]
      }
    } catch { /* offline: tenta na próxima */ }
    if (!fotos.length) return
    await db.comerciais.add({ id, criadoEm: Date.UTC(2026, 10, 26, 1, 40), atualizadoEm: Date.now(), excluido: 0, favorito: 0, ...IRON_LUSTRE, fotos })
  }
  await db.ajustes.put({ chave, valor: true })
}

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
  {
    id: 'ideia-katieb-esmaltacao-expressiva',
    em: Date.UTC(2026, 10, 26, 1, 35),
    imagens: [...[1, 2, 3, 4, 5, 6, 7].map((n) => `/seed/ideias/katieb-tecnica-${n}.jpg`), '/seed/ideias/katieb-post-1.jpg'],
    dados: {
      titulo: 'Esmaltação expressiva: 7 técnicas',
      efeitos: ['Camadas sobrepostas', 'Pintado / pincelado', 'Escorrido', 'Variegado', 'Manchado'],
      familias: [],
      materiais: MATERIAIS_KATIEB,
      esmaltes: COMO_KATIEB,
      queima: 'Conforme o esmalte. Forno elétrico em oxidação serve; alta temperatura (1200 a 1280 °C) com materiais compatíveis.',
      autor: 'Katie B Ceramics',
      fonte: 'Publicação de @katiebceramics (Instagram), com guia ilustrado',
      url: 'https://www.instagram.com/katiebceramics/',
      origem: 'semente:katieb-esmaltacao-expressiva',
      tags: ['camadas', 'pincel seco', 'esponja', 'diluição', 'liner', 'acaso controlado'],
      notas: NOTAS_KATIEB,
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
  await ajustarKatieb()
  await semearIronLustre()
  await usosIronLustre()
  await fotosIronLustre().catch(() => undefined)
  const { semearComerciais, completarEstudosAntigos } = await import('./comerciaisIniciais')
  await semearComerciais().catch(() => undefined)
  await completarEstudosAntigos().catch(() => undefined)
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

/** 26/11: a ideia da esmaltação expressiva fica sem repetição (as 7 técnicas em "Como foi feito", uma por foto), se o usuário não mexeu. */
async function ajustarKatieb() {
  if (await db.ajustes.get('fix-ideias-v4')) return
  const x = await db.ideias.get('ideia-katieb-esmaltacao-expressiva')
  if (x && x.notas === NOTAS_KATIEB_V1) {
    const ideia = IDEIAS.find((d) => d.id === x.id)!.dados
    await db.ideias.update(x.id, { notas: NOTAS_KATIEB, esmaltes: COMO_KATIEB, materiais: ideia.materiais, atualizadoEm: Date.now() })
  }
  await db.ajustes.put({ chave: 'fix-ideias-v4', valor: true })
}
