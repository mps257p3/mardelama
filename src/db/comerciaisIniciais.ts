import { db, type Comercial, type Receita, type ReceitaTeste } from './schema'

/**
 * Estudos de engenharia reversa enviados pelo Marcelo (prints do reel de @katiebceramics com os 3 esmaltes "móveis" favoritos dela).
 * Tudo o que está em "declarados" e "documentacao" vem das fontes listadas; as receitas são hipóteses para teste.
 * O print do reel vem de /public/seed; as fotos da marca são baixadas no aparelho pela /api/imagem (precisa de login).
 */
type Dados = Omit<Comercial, 'id' | 'criadoEm' | 'atualizadoEm' | 'fotos'>
interface Semente { id: string; em: number; reel: string; marca: string[]; dados: Dados }

const REEL = 'Reel de @katiebceramics, "these are my 3 favourite mobile glazes"'

export const SEMENTES: Semente[] = [
  {
    id: 'comercial-spectrum-1431-pearl-white',
    em: Date.UTC(2026, 10, 26, 1, 50),
    reel: '/seed/ideias/spectrum-pearl-white-reel.jpg',
    marca: [
      'https://www.spectrumglazes.com/wp-content/uploads/2026/02/1431-12x10-1.jpg',
      'https://kruegerpottery.com/cdn/shop/files/1431_08b3ae62-ee35-4fac-be6a-11aa8920be8b.jpg?v=1741130223',
      'https://kruegerpottery.com/cdn/shop/files/1431-pearl-white-plate_05115d32-4799-48e0-9ed1-1f63ba7ff72f.jpg?v=1741130223',
    ],
    dados: {
      fabricante: 'Spectrum', nome: 'Pearl White', codigo: '1431', serie: 'Floating (cone 4/6)', familias: [],
      cone: '4 a 6', temperatura: '1180 a 1220 °C; melhor a 1200 °C',
      instrucoes: '2 a 3 demãos para cobrir. A espessura muda a cor e a opacidade. Pode escorrer em superfícies verticais.',
      usos: [
        'Superfícies com textura: quebra e reage melhor sobre relevo (Bath Potters)',
        'Sozinho: a linha Floating dá a impressão de duas cores sobrepostas sem precisar sobrepor esmaltes',
        'Aplicação variada: onde é mais grosso fica mais opaco e aparecem os fluxos cor de areia',
        'Queima a 1200 °C (indicação da Bath Potters); a massa usada muda o resultado',
        'Peças verticais: deixe folga no pé, porque o esmalte se move',
        'Louça de mesa: a linha é declarada sem chumbo e própria para louça',
      ],
      declarados: [
        'Branco perolado transparente com fluxos cor de areia clara (descrição da loja Hot Clay)',
        'Linha Floating: uma cor parece flutuar sobre a outra sem sobrepor esmaltes',
        'Cone 4 a 6 (1180 a 1220 °C)',
        '2 a 3 demãos para cobertura total',
        'Sem chumbo e próprio para louça (Krueger, Creative Crafts, Hot Clay)',
      ],
      documentacao: 'Ficha COSHH da linha Floating cone 4/6 (1431 a 1442), 01/03/2019: o único componente declarado da linha é cobre (CAS 7440-50-8, 3,55%), e a mesma ficha marca o 1431 Pearl White como "(None)", ou seja, sem cobre. O resto da composição não é declarado. Preliminar: conferir a versão do produto.',
      hipoteses: [
        'Tipo de esmalte: vidro de boro com titânio ou rutilo, como os "floating" em geral; o titânio dá o véu perolado e os fluxos cor de areia onde acumula',
        'Sem corante forte: o cobre da ficha da linha não se aplica ao Pearl White',
        'Ponto de partida (100): nefelina sienita 48, Gerstley Borate 26 (ou frita de boro), sílica 20, caulim 6. Adições: dióxido de titânio 4 a 6% e rutilo 1 a 2%',
        'Para mais "areia": subir o rutilo até 3%; para mais branco, trocar parte do titânio por zircônio (opacidade sem cor)',
      ],
      fontes: [
        'https://www.spectrumglazes.com/product/1431-pearl-white/',
        'https://www.bathpotters.co.uk/pearl-white-spectrum-floating-glaze-1431/p2736',
        'https://www.bathpotters.co.uk/userfiles/file/spectrum-floating-glaze-coshh10.pdf',
        'https://www.kruegerpottery.com/collections/mid-fire-glazes/products/spectrum-1431',
        'https://www.hot-clay.com/products/spectrum-floating-glazes-pearl-white-1431',
        REEL,
      ],
      observacoes: 'A receita é hipótese: a Spectrum não publica a fórmula. A base é a do Floating Blue de cone 6 (Ceramics Monthly, out. 2001), sem cobalto e sem ferro. Primeiro teste: placas verticais com titânio 4 e 6%, rutilo 1 e 2%, metade com 2 demãos e metade com 3, sobre a massa de sempre.',
    },
  },
  {
    id: 'comercial-amaco-pc17-honey-flux',
    em: Date.UTC(2026, 10, 26, 1, 51),
    reel: '/seed/ideias/amaco-honey-flux-reel.jpg',
    marca: [
      'https://kruegerpottery.com/cdn/shop/files/PC17_b56c1e8c-29a2-4bf2-a02a-5fd6011460c9.jpg?v=1715630190',
      'https://www.bathpotters.co.uk/images/products/large/3748_6979.jpg',
      'https://www.bathpotters.co.uk/images/products/large/3748_6978.jpg',
    ],
    dados: {
      fabricante: 'Amaco', nome: 'Honey Flux', codigo: 'PC-17', serie: "Potter's Choice", familias: [],
      cone: '5 a 6', temperatura: '1180 a 1220 °C, oxidação',
      instrucoes: '2 a 3 demãos grossas (a Amaco diz que a linha rende com aplicação generosa). Deixe folga no pé: o esmalte se move.',
      usos: [
        'Por cima de outros esmaltes, para dar movimento: ele aumenta o escorrido do que está embaixo',
        'Cone 5 para mel e creme opacos; cone 6 para branco fluido com pintas cor de mel',
        'Combinações mostradas pela Amaco: Oatmeal (PC-31) por cima dele; ele por cima de Textured Amber Brown (PC-62), River Birch (PCF-74) e Chai Matte (SH-12); Flux Blossom (PCF-54) e Chun Plum (PC-55) por cima dele',
        'Terço de cima da peça: como escorre, é melhor aplicar na borda e deixar descer',
        'Prato ou placa de sacrifício por baixo nos testes',
        'Louça de mesa: a Amaco classifica a linha como própria para louça',
      ],
      declarados: [
        'Cor creme que aumenta o escorrido quando aplicado sobre outros esmaltes',
        'Mel e creme opacos no cone 5; branco fluido com pintas cor de mel no cone 6',
        'Efeitos de redução em queima de oxidação',
        'Base da linha PCF (Potter\'s Choice Flux) da Amaco',
        'Próprio para louça; sem chumbo',
      ],
      documentacao: 'Ficha de segurança do PC-17 não encontrada nas compilações da Bath Potters que consegui ler. Preliminar: procurar a SDS do PC-17 no site da Amaco.',
      hipoteses: [
        'Tipo de esmalte: vidro muito fundente, com muito boro (frita ou Gerstley Borate) e pouca alumina, por isso escorre e faz os outros escorrerem',
        'A cor de mel e as pintas vêm provavelmente de rutilo com um pouco de ferro; no cone 5 o titânio deixa opaco, no cone 6 dissolve e fica fluido',
        'Ponto de partida (100): Gerstley Borate 35, nefelina sienita 40, sílica 20, caulim 5. Adições: rutilo 4%, óxido de ferro vermelho 1%',
        'Para escorrer mais: tirar 5 de sílica; para escorrer menos: trocar 5 de Gerstley Borate por caulim',
      ],
      fontes: [
        'https://kruegerpottery.com/products/amaco-pc17',
        'https://www.bathpotters.co.uk/honey-flux-amaco-potters-choice-brush-on-glaze-pc-17/p3748',
        'https://www.theceramicshop.com/product/31745/pc17-honey-flux-pint/',
        'https://amaco.com/asset/662032abdf5bd',
        'https://shop.amaco.com/glazes-underglazes/high-fire-glazes/pcf-potters-choice-flux',
        'https://amaco.com/resources/layering?glaze_top=pc-17-honey-flux',
        REEL,
      ],
      observacoes: 'A receita é hipótese: a Amaco não publica a fórmula. Primeiro teste: placas verticais com prato embaixo, sozinho (2 e 3 demãos) e por cima de um esmalte que você já usa, no cone 5 e no cone 6, para ver a diferença entre creme opaco e branco fluido.',
    },
  },
  {
    id: 'comercial-mayco-sw214-micro-pearl',
    em: Date.UTC(2026, 10, 26, 1, 52),
    reel: '/seed/ideias/mayco-micro-pearl-reel.jpg',
    marca: [
      'https://www.maycocolors.com/wp-content/uploads/2024/03/SW214.jpg',
      'https://www.maycocolors.com/wp-content/uploads/2024/03/sw214_1234coats_cone6_web.jpg',
      'https://www.maycocolors.com/wp-content/uploads/2024/03/sw214_over_sw401_sw402_cone6_web.jpg',
      'https://www.maycocolors.com/wp-content/uploads/2024/03/sw214_cone10.jpg',
    ],
    dados: {
      fabricante: 'Mayco', nome: 'Micro Pearl', codigo: 'SW-214', serie: 'Stoneware (Micro)', familias: [],
      cone: '5 a 10', temperatura: 'Cone 5 e 6 em oxidação; cone 10 em redução',
      instrucoes: 'Estável com 3 demãos; mais demãos ou aplicação mais grossa podem fazer o esmalte se mover. Oxidação ou redução.',
      usos: [
        'Superfícies com textura: o branco quebra sobre o relevo',
        'Cone 6 em oxidação para os microcristais iridescentes lilás e amarelo-claro',
        'Cone 5 para um branco fosco-acetinado perolado e estável, sem movimento',
        'Cone 10 em redução: escurece para azul, roxo e branco variegado',
        'Sobre ou sob Light Flux (SW-401) e Dark Flux (SW-402), combinação mostrada pela Mayco',
        'Louça de mesa: é o único da linha Micro considerado próprio para louça',
      ],
      declarados: [
        'Branco brilhante semiopaco com fundo lilás que quebra sobre textura (cone 6)',
        'Microcristalização iridescente em lilás e amarelo-claro durante a queima',
        'Cone 5: branco semiopaco fosco-acetinado perolado e estável',
        'Cone 10 redução: azul, roxo e branco variegado',
        'Estável com 3 demãos; mais pode escorrer',
        'Dinnerware Safe (selo na página da Mayco)',
      ],
      documentacao: 'Ficha de segurança Stoneware SW (set. 2026) inclui o MICRO PEARL (SW214), e o aviso de rótulo da ficha diz "Contém zinco" (a ficha cobre várias cores, então isso é forte indício, não certeza, de zinco no Micro Pearl). A seção 3 dá máximos para a linha inteira, não para este esmalte: feldspato até 26%, sílica cristalina até 23%, óxido de zinco até 13%, além de corantes de outras cores da linha (cobre, manganês, cobalto). Preliminar: conferir a versão do produto.',
      hipoteses: [
        'Microcristais: o zinco da ficha, com titânio, forma cristais muito pequenos (tipo titanato de zinco) no resfriamento; a Bath Potters confirma que os Micro não têm cristais prontos adicionados',
        'O lilás e o amarelo iridescente são típicos de titânio em vidro com zinco; não precisa de corante',
        'Ponto de partida (100): feldspato potássico 25, frita de boro 25, sílica 20, óxido de zinco 12, carbonato de cálcio 10, caulim 8. Adições: dióxido de titânio 6 a 8%',
        'Resfriamento lento ou patamar entre 1100 e 1000 °C deve ajudar a formar os microcristais',
      ],
      fontes: [
        'https://www.maycocolors.com/product/sw214-micro-pearl/',
        'https://www.maycocolors.com/wp-content/uploads/2026/10/Stoneware-SW-CL-US-CA-SDS-Sept2026-EN.pdf',
        REEL,
      ],
      observacoes: 'A receita é hipótese: a Mayco não publica a fórmula. Primeiro teste: base com zinco 10 e 14% e titânio 6 e 8%, cone 6, uma queima com resfriamento natural e outra com patamar de 1 hora a 1050 °C, para ver onde nascem os microcristais.',
    },
  },
]

async function arquivo(url: string, id: string) {
  try {
    const r = await fetch(url)
    const b = r.ok ? await r.blob() : undefined
    if (!b?.type.startsWith('image/')) return undefined
    const { salvarArquivo } = await import('./files')
    return await salvarArquivo(new File([b], url.split('/').pop()!, { type: b.type }), { tipo: 'comercial', id })
  } catch { return undefined }
}

/** Cria cada estudo uma vez por aparelho (id fixo) e depois junta as fotos da marca, também uma vez. */
export async function semearComerciais() {
  for (const s of SEMENTES) {
    const chave = 'seed-comercial:' + s.id
    if (!(await db.ajustes.get(chave))) {
      if (!(await db.comerciais.get(s.id))) {
        const reel = await arquivo(s.reel, s.id)
        if (!reel) continue
        await db.comerciais.add({ id: s.id, criadoEm: s.em, atualizadoEm: Date.now(), excluido: 0, favorito: 0, ...s.dados, fotos: [reel] })
      }
      await db.ajustes.put({ chave, valor: true })
    }
    const chaveFotos = 'seed-comercial-fotos:' + s.id
    if (await db.ajustes.get(chaveFotos)) continue
    const c = await db.comerciais.get(s.id)
    if (!c || c.excluido) continue
    const { fotosDoFabricante } = await import('../lib/comercial')
    const novas = await fotosDoFabricante(s.id, s.marca).catch(() => [])
    if (!novas.length) continue
    const atual = await db.comerciais.get(s.id)
    await db.comerciais.update(s.id, { fotos: [...novas, ...(atual?.fotos ?? [])], atualizadoEm: Date.now() })
    await db.ajustes.put({ chave: chaveFotos, valor: true })
  }
}

/** Estudos que já vinham no app (ER-001 a ER-003): melhores usos e fotos da marca, só se o campo estiver vazio. */
export const EXTRAS: { id: string; usos: string[]; marca: string[] }[] = [
  {
    id: 'com-er-001',
    usos: [
      'Peças decorativas: a Coyote não recomenda para louça de mesa',
      'Resfriamento lento é o que forma os cristais dourados (Coyote: "should be slow-cooled to achieve their best")',
      'Curva da Coyote, em °C aproximados: 55 °C/h até 105; 195 °C/h até 1095; 85 °C/h até 1205 com patamar de 15 min; desce a 1175 com patamar de 15 min; 70 °C/h até 760',
      'Cone 5 com patamar de 30 min em forno digital, ou cone 6',
      '2 a 3 demãos a pincel; grosso escorre, então deixe uns 6 mm sem esmalte no pé',
      'Segunda camada por cima só na metade de cima da peça',
      'Pode ir ao forno com esmaltes que não são cristalinos e não exige bandeja de escorrido',
    ],
    marca: [
      'https://coyoteclay.com/Images/250%20Tiles/SLCrystal%20Nebula%20MBG164%20SC.jpg',
      'https://coyoteclay.com/Images/Tile%20Comparisons/Crystal%20Nebula.jpg',
    ],
  },
  {
    id: 'com-er-002',
    usos: [
      'Por baixo, por cima ou entre outros esmaltes, para criar reação e movimento (funciona como fundente)',
      'Peças verticais: não aplicar no terço de baixo; camadas que vão diminuindo para baixo',
      '1 a 3 demãos a pincel, ou batido com esponja, de forma livre ou uniforme',
      'Cone 06/05 com subida média (cerca de 120 °C/h); um patamar realça o escorrido',
      'Em alta (cone 6) fica transparente com flutuação branca e escorre mais: testar antes',
      'Combinação mostrada pela Mayco: White Cascade sobre Blue Grotto (EL-118); técnicas Peacock, Frozen Pond e Plopping',
      'Escorre menos que o Clear Cascade (PC-601): fica mais onde foi pintado',
    ],
    marca: [
      'https://www.maycocolors.com/wp-content/uploads/2020/09/pc-602.jpg',
      'https://www.maycocolors.com/wp-content/uploads/2020/09/pc-602_cone6.jpg',
      'https://www.maycocolors.com/wp-content/uploads/2020/09/pc602_cone10.jpg',
    ],
  },
  {
    id: 'com-er-003',
    usos: [
      'Peças decorativas: superfície áspera e seca, tipo casca de árvore; não é para louça',
      'Aplicação bem grossa, até a camada seca rachar antes da queima: é isso que faz o esmalte retrair',
      'Cone 5 a 6',
      'Por cima de underglaze, ou combinado com White Crawl e sobre shino (peças mostradas pela Coyote)',
      'Deixe uns 6 mm sem esmalte no pé e nada de esmalte embaixo da peça',
    ],
    marca: [
      'https://coyoteclay.com/Images/250%20Tiles/CRCactus%20Crawl%20MBG063%20RC.jpg',
      'https://coyoteclay.com/Images/Tile%20Comparisons/Cactus%20Crawl.jpg',
    ],
  },
]

export async function completarEstudosAntigos() {
  for (const x of EXTRAS) {
    const c = await db.comerciais.get(x.id)
    if (!c || c.excluido) continue
    const chaveUsos = 'fix-comercial-usos:' + x.id
    if (!(await db.ajustes.get(chaveUsos))) {
      if (!c.usos?.length) await db.comerciais.update(x.id, { usos: x.usos, atualizadoEm: Date.now() })
      await db.ajustes.put({ chave: chaveUsos, valor: true })
    }
    const chaveFotos = 'seed-comercial-fotos:' + x.id
    if (await db.ajustes.get(chaveFotos)) continue
    const { fotosDoFabricante } = await import('../lib/comercial')
    const novas = await fotosDoFabricante(x.id, x.marca).catch(() => [])
    if (!novas.length) continue
    const atual = await db.comerciais.get(x.id)
    await db.comerciais.update(x.id, { fotos: [...novas, ...(atual?.fotos ?? [])], atualizadoEm: Date.now() })
    await db.ajustes.put({ chave: chaveFotos, valor: true })
  }
}

/* ---------------------------------------- fórmulas de teste (hipóteses dos estudos, em 100 g) */

type Ing = [slug: string, nome: string, pct: number, classe?: 'base' | 'corante' | 'opacificante' | 'aditivo']
const CMC: Ing = ['goma-cmc', 'Goma CMC', 0.8, 'aditivo']
const PREPARO_V1 = [
  'Preparo (100 g de seco, para pincel): dissolva a goma CMC em 80 a 90 ml de água um dia antes; junte o seco aos poucos; peneire duas vezes em 80 mesh; deixe descansar 24 h e mexa antes de usar. Densidade de pincel: perto de 1,45 a 1,50 g/ml.',
  'Gerstley Borate trocado por frita borácica (o Gerstley quase não existe no Brasil): a frita assenta no fundo, mexa sempre. A troca muda um pouco o resultado; é parte do teste.',
  'Aplicação: 3 demãos em plaquinha vertical, deixando o pé limpo; prato ou biscoito por baixo.',
]
const PREPARO = [
  'Para 100 g de esmalte seco, dissolva a goma CMC em 80 a 90 ml de água um dia antes. No dia, junte o pó aos poucos, mexendo, e passe tudo duas vezes pela peneira de 80 mesh. Deixe descansar 24 horas e mexa bem antes de usar. Para pincel, a densidade boa fica entre 1,45 e 1,50 g/ml.',
  'A receita original usaria Gerstley Borate, que quase não existe no Brasil, então troquei por frita borácica. A frita assenta no fundo do pote, por isso mexa sempre. A troca muda um pouco o resultado, e isso também faz parte do teste.',
  'Aplique 3 demãos numa plaquinha em pé, deixando o pé sem esmalte, e queime com um prato ou um caco de biscoito por baixo.',
]

const FORMULAS: { id: string; comercial: string; codigo: string; nome: string; ings: Ing[]; parametros: string; extra?: string; preparo?: string[]; agua?: number }[] = [
  {
    id: 'rec-er-pc33-iron-lustre', comercial: 'comercial-amaco-pc33-iron-lustre', codigo: 'ER-PC33', nome: 'Hipótese Iron Lustre (Amaco PC-33)',
    ings: [['sienito-nefelinico', 'Sienito nefelínico', 48], ['frita-boracica', 'Frita borácica', 26], ['silica', 'Sílica (quartzo)', 20], ['caulim', 'Caulim', 6],
      ['oxido-ferro-vermelho', 'Óxido de ferro vermelho', 6, 'corante'], ['rutilo', 'Rutilo', 4, 'corante'], CMC],
    parametros: 'Vale fazer três placas, com 4, 6 e 8 g de ferro. Se quiser puxar o azul da flutuação, faça mais uma com 0,25 a 0,5 g de óxido de cobalto. Queime em cone 6, perto de 1222 °C, e esfrie devagar entre 1100 e 900 °C.',
  },
  {
    id: 'rec-er-1431-pearl-white', comercial: 'comercial-spectrum-1431-pearl-white', codigo: 'ER-1431', nome: 'Hipótese Pearl White (Spectrum 1431)',
    ings: [['sienito-nefelinico', 'Sienito nefelínico', 48], ['frita-boracica', 'Frita borácica', 26], ['silica', 'Sílica (quartzo)', 20], ['caulim', 'Caulim', 6],
      ['dioxido-titanio', 'Dióxido de titânio', 5, 'opacificante'], ['rutilo', 'Rutilo', 1.5, 'corante'], CMC],
    parametros: 'Teste também com 4 e 6 g de titânio, e com 1 e 2 g de rutilo. Quanto mais rutilo, mais aparece aquele pontilhado de areia. Queime a 1200 °C, entre cone 4 e 6.',
  },
  {
    id: 'rec-er-pc17-honey-flux', comercial: 'comercial-amaco-pc17-honey-flux', codigo: 'ER-PC17', nome: 'Hipótese Honey Flux (Amaco PC-17)',
    ings: [['sienito-nefelinico', 'Sienito nefelínico', 40], ['frita-boracica', 'Frita borácica', 35], ['silica', 'Sílica (quartzo)', 20], ['caulim', 'Caulim', 5],
      ['rutilo', 'Rutilo', 4, 'corante'], ['oxido-ferro-vermelho', 'Óxido de ferro vermelho', 1, 'corante'], CMC],
    parametros: 'Este escorre muito, então use sempre placa em pé com prato por baixo. Teste sozinho e por cima de um esmalte que você já usa, no cone 5 e no cone 6. Se escorrer demais, troque 5 g de frita por 5 g de caulim.',
  },
  {
    id: 'rec-er-sw214-micro-pearl', comercial: 'comercial-mayco-sw214-micro-pearl', codigo: 'ER-SW214', nome: 'Hipótese Micro Pearl (Mayco SW-214)',
    ings: [['feldspato-potassico', 'Feldspato potássico', 25], ['frita-boracica', 'Frita borácica', 25], ['silica', 'Sílica (quartzo)', 20], ['oxido-zinco', 'Óxido de zinco', 12],
      ['carbonato-calcio', 'Carbonato de cálcio', 10], ['caulim', 'Caulim', 8], ['dioxido-titanio', 'Dióxido de titânio', 7, 'opacificante'], CMC],
    parametros: 'Teste também com 10 e 14 g de zinco, e com 6 e 8 g de titânio. Queime em cone 6 duas vezes: uma esfriando naturalmente e outra parando 1 hora a 1050 °C na descida.',
    extra: 'O óxido de zinco cru encolhe muito e pode fazer o esmalte se retrair na peça. Se isso acontecer, calcine o zinco a uns 900 °C antes de pesar.',
  },
  {
    id: 'rec-er-164-crystal-nebula', comercial: 'com-er-001', codigo: 'ER-164', nome: 'Hipótese Crystal Nebula (Coyote MBG164)',
    ings: [['frita-alcalina', 'Frita alcalina', 50], ['oxido-zinco', 'Óxido de zinco', 25], ['silica', 'Sílica (quartzo)', 22], ['caulim', 'Caulim', 3],
      ['dioxido-titanio', 'Dióxido de titânio', 3, 'opacificante'], ['oxido-cobalto', 'Óxido de cobalto', 0.25, 'corante'], ['goma-cmc', 'Goma CMC', 1, 'aditivo']],
    parametros: 'A base é a clássica de esmalte cristalino de cone 6, com frita, zinco e sílica em partes de 50, 25 e 25 (a GBCG do Digitalfire). Tirei um pouco de sílica para entrar caulim, porque a Coyote diz que o dela escorre menos que um cristalino comum. O titânio ajuda a nascer os cristais dourados e o cobalto dá o azul-claro do fundo. Teste também com 22 e 28 g de zinco, com 2 e 5 g de titânio, e uma placa sem cobalto. Quem forma os cristais é a queima: suba uns 195 °C por hora até 1093 °C e depois 83 °C por hora até 1204 °C, segurando 15 minutos. Desça até 1177 °C e segure mais 15 minutos. Então esfrie a uns 70 °C por hora até 760 °C e deixe o forno esfriar sozinho. É a curva que a Sheffield Pottery publica para esta linha da Coyote.',
    preparo: [
      'No lugar da Ferro 3110 (a frita das receitas americanas), use uma frita alcalina e anote o código dela. Como a receita quase não tem argila, o pó assenta rápido no pote, por isso ela leva 1 g de goma CMC. Dissolva a goma em 80 a 90 ml de água um dia antes, junte o pó aos poucos, passe duas vezes pela peneira de 80 mesh e mexa sempre antes de usar.',
      'Aplique 2 a 3 demãos numa plaquinha em pé, deixando o pé limpo. A Coyote diz que ele dispensa bandeja, mas avisa que ainda escorre; num teste, um caco por baixo não custa nada. O Crystal Nebula não é indicado para louça.',
    ],
  },
  {
    id: 'rec-er-602-white-cascade', comercial: 'com-er-002', codigo: 'ER-602', nome: 'Hipótese White Cascade (Mayco PC-602)',
    ings: [['frita-boracica', 'Frita borácica', 90], ['caulim', 'Caulim', 10], ['silicato-zirconio', 'Silicato de zircônio', 6, 'opacificante'], ['goma-cmc', 'Goma CMC', 0.8, 'aditivo']],
    parametros: 'A ficha da Mayco para a linha Pottery Cascade só declara frita e um pouco de argila, então a base aqui é quase toda frita, como o FLX-001. O silicato de zircônio é a aposta para o branco que flutua; a Mayco não declara opacificante, por isso isso é hipótese. Teste também com 3 e 10 g de zircônio, e com 8 e 14 g de caulim (mais caulim, menos escorrimento). Queime em cone 06 a 05, perto de 1000 a 1030 °C, subindo uns 140 °C por hora (250 °F/h, como a Mayco recomenda).',
    preparo: [
      'Dissolva a goma CMC em 80 a 90 ml de água um dia antes. No dia, junte o pó aos poucos, mexendo, e passe duas vezes pela peneira de 80 mesh. A frita assenta no fundo do pote, por isso mexa sempre.',
      'Aplique 1 a 3 demãos, com pincel ou esponja, por cima ou por baixo de outro esmalte. Não passe no terço de baixo das peças em pé, porque ele escorre. Faça uma placa só com ele e outra sobre um esmalte de baixa temperatura que você já usa, sempre com prato por baixo.',
    ],
  },
  {
    id: 'rec-er-063-cactus-crawl', comercial: 'com-er-003', codigo: 'ER-063', nome: 'Hipótese Cactus Crawl (Coyote MBG063)', agua: 100,
    ings: [['sienito-nefelinico', 'Sienito nefelínico', 60], ['carbonato-magnesio-leve', 'Carbonato de magnésio leve', 35], ['argila-plastica', 'Argila plástica', 5],
      ['oxido-cromo', 'Óxido de cromo', 0.5, 'corante'], ['oxido-ferro-vermelho', 'Óxido de ferro vermelho', 1.5, 'corante'], ['goma-cmc', 'Goma CMC', 0.3, 'aditivo']],
    parametros: 'É a mesma receita do RET-004 (Cactus 01), que já está em Fórmulas. O carbonato de magnésio leve encolhe muito ao secar e faz a camada rachar e se juntar em ilhas, que viram as escamas. O cromo dá o verde e o ferro puxa para o musgo. Teste também com 25 e 45 g de magnésio (menos e mais retração), e com 0,25 e 1 g de cromo. Queime em cone 6, perto de 1220 °C, com resfriamento natural.',
    preparo: [
      'Dissolva a goma CMC em uns 100 ml de água um dia antes, junte o pó aos poucos e passe pela peneira de 80 mesh. A mistura fica mais rala que um esmalte comum, porque o magnésio leve ocupa muito volume.',
      'Aplique bem grosso, até a camada rachar ao secar, antes de ir ao forno: é isso que forma as escamas. Teste três espessuras na mesma placa. A superfície fica áspera e seca, então use só em peças decorativas.',
    ],
  },
]

/** Monta a receita de teste de cada estudo a partir da tabela FORMULAS. */
function receitaDe(f: (typeof FORMULAS)[number]): ReceitaTeste {
  return {
    codigo: f.codigo, aguaMlPor100g: f.agua ?? 85, parametros: f.parametros,
    ingredientes: f.ings.map(([s, nome, p, c]) => ({ materialId: 'mat-' + s, nome, percentual: p, classe: c ?? 'base' as const })),
    observacoes: [...(f.preparo ?? PREPARO), ...(f.extra ? [f.extra] : [])].join('\n\n'),
  }
}

/** 26/11: põe a receita de teste nos estudos que ainda não têm (os 3 estudos antigos e os que chegarem depois). */
export async function receitasQueFaltam() {
  for (const f of FORMULAS) {
    const c = await db.comerciais.get(f.comercial)
    if (c && !c.excluido && !c.receita) await db.comerciais.update(c.id, { receita: receitaDe(f), atualizadoEm: Date.now() })
  }
}

/**
 * 26/11: a receita de teste fica dentro do estudo, não em Fórmulas. Põe a receita em cada estudo
 * (aproveitando o que já foi editado na Fórmula antiga, se houver) e tira de Fórmulas as que foram semeadas.
 */
export async function receitaNoEstudo() {
  if (await db.ajustes.get('fix-receita-no-estudo-v1')) return
  for (const f of FORMULAS) {
    const c = await db.comerciais.get(f.comercial)
    if (!c) return // estudo ainda não chegou: tenta na próxima abertura
    const r = await db.receitas.get(f.id)
    const viva = r && !r.excluido ? r : undefined
    if (!c.receita) {
      const receita = viva
        ? { codigo: viva.codigo, ingredientes: viva.ingredientes, aguaMlPor100g: viva.aguaMlPor100g, parametros: viva.parametros, observacoes: viva.observacoes }
        : receitaDe(f)
      await db.comerciais.update(c.id, { receita, atualizadoEm: Date.now() })
    }
    if (viva) {
      await db.receitas.update(f.id, { excluido: 1, atualizadoEm: Date.now() })
      if (await db.relacoes.get('rel-' + f.id)) await db.relacoes.update('rel-' + f.id, { excluido: 1, atualizadoEm: Date.now() })
    }
  }
  await db.ajustes.put({ chave: 'fix-receita-no-estudo-v1', valor: true })
}

/** Textos das fórmulas como foram semeados em 26/11 (antes da reescrita). */
const PARAMETROS_V1 = ['Variações: ferro 4, 6 e 8%. Para puxar o azul da flutuação, uma placa com óxido de cobalto 0,25 a 0,5%. Cone 6 (cerca de 1222 °C), resfriamento lento entre 1100 e 900 °C.',
  'Variações: titânio 4 e 6%; rutilo 1 e 2% (mais rutilo, mais "areia"). Queima a 1200 °C, cone 4 a 6.',
  'Muito fluido: placa vertical sempre com prato por baixo. Testar sozinho e por cima de um esmalte que você já usa, no cone 5 e no cone 6. Para escorrer menos: trocar 5 de frita por caulim.',
  'Variações: zinco 10 e 14%; titânio 6 e 8%. Cone 6; uma queima com resfriamento natural e outra com patamar de 1 h a 1050 °C.']
const EXTRA_V1 = 'Óxido de zinco cru encolhe muito e pode fazer o esmalte retrair; se acontecer, calcine o zinco a uns 900 °C antes de pesar.'

/** Reescreve parâmetros e preparo das fórmulas de teste, só onde ainda estão como foram semeados. */
export async function reescreverFormulas() {
  if (await db.ajustes.get('fix-formulas-textos-v1')) return
  for (const [n, f] of FORMULAS.entries()) {
    const r = await db.receitas.get(f.id); if (!r) continue
    const obsV1 = [...PREPARO_V1, ...(f.extra ? [EXTRA_V1] : [])].join('\n\n')
    const d: Partial<Receita> = {}
    if (r.parametros === PARAMETROS_V1[n]) d.parametros = f.parametros
    if (r.observacoes === obsV1) d.observacoes = [...PREPARO, ...(f.extra ? [f.extra] : [])].join('\n\n')
    if (Object.keys(d).length) await db.receitas.update(f.id, { ...d, atualizadoEm: Date.now() })
  }
  await db.ajustes.put({ chave: 'fix-formulas-textos-v1', valor: true })
}

/** 26/11: troca os textos semeados pelos reescritos (TEXTOS_V2), só onde o campo ainda está igual ao semeado. */
export async function reescreverTextos() {
  if (await db.ajustes.get('fix-comercial-textos-v2')) return
  const { TEXTOS_V2 } = await import('./comerciaisTextos')
  const { IRON_LUSTRE } = await import('./ideiasIniciais')
  const antigos: Record<string, Partial<Comercial>> = { 'comercial-amaco-pc33-iron-lustre': IRON_LUSTRE }
  for (const s of SEMENTES) antigos[s.id] = s.dados
  for (const x of EXTRAS) antigos[x.id] = { usos: x.usos }
  const igual = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
  for (const [id, novos] of Object.entries(TEXTOS_V2)) {
    const c = await db.comerciais.get(id)
    if (!c) continue
    const d: Partial<Comercial> = {}
    for (const k of Object.keys(novos) as (keyof typeof novos)[]) {
      if (igual(c[k], antigos[id]?.[k])) (d as Record<string, unknown>)[k] = novos[k]
    }
    if (Object.keys(d).length) await db.comerciais.update(id, { ...d, atualizadoEm: Date.now() })
  }
  await db.ajustes.put({ chave: 'fix-comercial-textos-v2', valor: true })
}

/**
 * 26/11: o print do reel só servia para identificar o esmalte. Quando o estudo já tem as fotos da marca,
 * tira o print das fotos e do aparelho. Roda a cada abertura (são poucos estudos) até as fotos da marca chegarem.
 */
export async function tirarPrints() {
  for (const c of await db.comerciais.toArray()) {
    if (c.excluido || c.fotos.length < 2) continue
    const prints: string[] = []
    for (const f of c.fotos) if (/-reel\.(jpe?g|png|webp)$/i.test((await db.arquivos.get(f))?.nome ?? '')) prints.push(f)
    if (!prints.length || prints.length === c.fotos.length) continue
    await db.comerciais.update(c.id, { fotos: c.fotos.filter((f) => !prints.includes(f)), atualizadoEm: Date.now() })
    for (const f of prints) await db.arquivos.update(f, { excluido: 1, atualizadoEm: Date.now() })
  }
}

/** Tira de um texto de parâmetros a temperatura e o cone de queima (ex.: "1220 °C, cone 6"). */
export function temperaturaDoTexto(s?: string) {
  if (!s) return undefined
  const graus = [...s.matchAll(/(\d{3,4})\s*°C/g)].map((m) => Number(m[1])).filter((n) => n >= 900 && n <= 1400)
  const cone = s.match(/cone\s+(0?\d{1,2}(?:\s*(?:a|e|-)\s*0?\d{1,2})?)/i)?.[1]
  const t = [graus.length ? Math.max(...graus) + ' °C' : '', cone ? 'cone ' + cone : ''].filter(Boolean).join(', ')
  return t || undefined
}

/** 26/11: fórmulas ganham o campo temperatura (cabeçalho). Vem do estudo aprovado ou dos parâmetros. */
export async function temperaturaNasFormulas() {
  if (await db.ajustes.get('fix-temperatura-formulas-v1')) return
  const rs = await db.receitas.toArray()
  if (!rs.length) return
  const deEstudo = new Map((await db.comerciais.toArray()).filter((c) => c.receita?.aprovadaId).map((c) => [c.receita!.aprovadaId!, c.temperatura]))
  for (const r of rs) {
    if (r.excluido || r.temperatura) continue
    const t = deEstudo.get(r.id) || temperaturaDoTexto(r.parametros)
    if (t) await db.receitas.update(r.id, { temperatura: t, atualizadoEm: Date.now() })
  }
  await db.ajustes.put({ chave: 'fix-temperatura-formulas-v1', valor: true })
}

/**
 * 26/11: os dois potes do Marcelo, cadastrados em Esmaltes a partir das fotos dos rótulos (frente, verso e etiqueta da Zeramics).
 * Tudo vem do que está impresso no rótulo. As fotos do pote serviram só de base: na ficha entram as fotos do site da marca.
 */
const ROTULOS: { id: string; estudo: string; pote: string; marca: string[]; dados: Omit<import('./schema').Esmalte, 'id' | 'criadoEm' | 'atualizadoEm' | 'fotos' | 'codigo' | 'excluido' | 'favorito'> }[] = [
  {
    id: 'esm-coyote-mbg164', estudo: 'com-er-001', pote: 'coyote-crystal-nebula-pote.jpg',
    marca: EXTRAS[0].marca,
    dados: {
      nome: 'Crystal Nebula', autoria: 'Coyote Clay & Color', origem: 'comercial', familias: ['fam-b07'],
      temperatura: 1204, cone: '5-6', atmosfera: 'Oxidação', louca: 'nao',
      aplicacao: 'Pincel: 2 a 3 demãos sobre biscoito, alternando a direção da pincelada. Ou 1 demão mergulhada ou derramada. Mexer bem antes.',
      tags: ['comercial', 'Coyote', 'Slow Cool Crystal', 'MBG164', 'cristais', 'resfriamento lento'],
      observacoes: [
        'Código do produto: MBG164 (Coyote, linha Slow Cool Crystal Series). Pote de 1 pint (473 ml).',
        'Queima: cone 5 ou 6 de testemunho, com programa de resfriamento lento. Etiqueta da Zeramics: 1186 a 1220 °C.',
        'Curva do rótulo, em 5 rampas: 38 °C/h até 104 °C; 177 °C/h até 1093 °C; 66 °C/h até 1204 °C com patamar de 15 min; 260 °C/h descendo até 1177 °C com patamar de 15 min; 52 °C/h descendo até 760 °C. (No rótulo, em °F: 100/h até 220; 350/h até 2000; 150/h até 2200, 15 min; 500/h até 2150, 15 min; 125/h até 1400.)',
        'Louça: o rótulo diz que NÃO é recomendado para alimentos (pode riscar fácil, mudar de cor ou ter textura imprópria). A Zeramics também: não usar em peça utilitária.',
        'Segurança: sem chumbo, atóxico (ASTM D-4236). Composição na etiqueta: argila, frita, pigmentos, água e conservantes.',
        'Para mais informações sobre resfriamento lento, o rótulo indica coyoteclay.com.',
      ].join('\n\n'),
    },
  },
  {
    id: 'esm-mayco-pc602', estudo: 'com-er-002', pote: 'mayco-white-cascade-frasco.jpg',
    marca: EXTRAS[1].marca,
    dados: {
      nome: 'White Cascade', autoria: 'Mayco', origem: 'comercial', familias: ['fam-b08'],
      fluidez: 'Fluido', temperatura: 999, cone: '06-05', atmosfera: 'Oxidação', louca: 'sim',
      aplicacao: 'Pincel: 1 a 2 demãos (a Zeramics diz 2 a 3) por cima ou por baixo de outros esmaltes atóxicos, sobre biscoito cone 04 (1060 °C). Não aplicar na metade de baixo da peça. Não borrifar sem proteção.',
      tags: ['comercial', 'Mayco', 'Pottery Cascade', 'PC-602', 'fundente'],
      observacoes: [
        'Código do produto: PC-602 (Mayco, linha Pottery Cascade). Frasco de 16 fl oz (473 ml).',
        'Queima: cone 06 na prateleira (999 °C). Etiqueta da Zeramics: cone 06/05, 999 a 1031 °C; a cor pode mudar em temperaturas mais altas.',
        'Em média temperatura (cone 5/6), o rótulo diz: transparente com flutuação branca.',
        'Dicas do rótulo: use como fundente com Elements e Element Chunkies. A aplicação e a posição da peça no forno mudam o escorrido. Evite a parte de baixo da peça. O movimento depende do esmalte que está por baixo. Temperatura, rampa e patamar realçam o escorrido.',
        'Louça: a Mayco declara "Food Safe" quando usado como manda o fabricante, mas avisa que a superfície pode não ser adequada para alimentos. A Zeramics: pode ser usado em peça utilitária. Como ele vai junto com outros esmaltes, a peça só é segura se o esmalte de baixo também for.',
        'Segurança: atóxico, sem chumbo.',
      ].join('\n\n'),
    },
  },
]

export async function esmaltesDosRotulos() {
  const { proximoCodigo } = await import('./codigos')
  for (const s of ROTULOS) {
    const chave = 'seed-esmalte-rotulo:' + s.id
    if (!(await db.ajustes.get(chave))) {
      if (!(await db.esmaltes.get(s.id))) {
        const t = Date.now()
        await db.esmaltes.add({ id: s.id, criadoEm: t, atualizadoEm: t, excluido: 0, favorito: 0, codigo: await proximoCodigo('E', 'esmaltes', 3), fotos: [], ...s.dados })
        if (await db.comerciais.get(s.estudo)) {
          await db.relacoes.add({ id: 'rel-' + s.id, aTipo: 'esmalte', aId: s.id, bTipo: 'comercial', bId: s.estudo, criadoEm: t, atualizadoEm: t, excluido: 0 }).catch(() => undefined)
        }
      }
      await db.ajustes.put({ chave, valor: true })
    }
    const chaveFotos = 'seed-esmalte-rotulo-fotos:' + s.id
    const e = await db.esmaltes.get(s.id)
    if (!e || e.excluido) continue
    // a primeira versão guardava a foto do pote na ficha: sai, e ficam só as fotos do site
    const chavePote = 'fix-esmalte-rotulo-sem-pote:' + s.id
    if (!(await db.ajustes.get(chavePote))) {
      const arqs = await db.arquivos.bulkGet(e.fotos)
      const pote = arqs.filter((a) => a?.nome === s.pote).map((a) => a!.id)
      if (pote.length) {
        for (const f of pote) await db.arquivos.update(f, { excluido: 1, atualizadoEm: Date.now() })
        const resto = e.fotos.filter((f) => !pote.includes(f))
        await db.esmaltes.update(s.id, { fotos: resto, atualizadoEm: Date.now() })
        if (!resto.length) await db.ajustes.delete(chaveFotos)
      }
      await db.ajustes.put({ chave: chavePote, valor: true })
    }
    if (await db.ajustes.get(chaveFotos)) continue
    const { fotosDoFabricante } = await import('../lib/comercial')
    const novas = await fotosDoFabricante(s.id, s.marca, 'esmalte').catch(() => [])
    if (!novas.length) continue
    const atual = await db.esmaltes.get(s.id)
    await db.esmaltes.update(s.id, { fotos: [...(atual?.fotos ?? []), ...novas], atualizadoEm: Date.now() })
    await db.ajustes.put({ chave: chaveFotos, valor: true })
  }
}

/** 26/11: em esmalte comercial, o botão Fórmula virou Engenharia reversa. Some a fórmula vazia que o botão antigo criava. */
export async function formulasVaziasDeComerciais() {
  if (await db.ajustes.get('fix-formula-vazia-comercial-v1')) return
  for (const e of await db.esmaltes.toArray()) {
    if (e.excluido || e.origem !== 'comercial' || !e.receitaId) continue
    const r = await db.receitas.get(e.receitaId)
    if (r && !r.excluido && !r.ingredientes?.length && r.versaoAtual === 1 && r.esmalteId === e.id) {
      await db.receitas.update(r.id, { excluido: 1, atualizadoEm: Date.now() })
      await db.esmaltes.update(e.id, { receitaId: undefined, atualizadoEm: Date.now() })
    }
  }
  await db.ajustes.put({ chave: 'fix-formula-vazia-comercial-v1', valor: true })
}

/**
 * 26/11, redesenho da ficha: o White Cascade (protótipo) ganha os campos estruturados,
 * só com o que já está no rótulo da Mayco e na etiqueta da Zeramics. Não sobrescreve nada preenchido.
 */
export async function fichaWhiteCascade() {
  const chave = 'fix-ficha-white-cascade-v1'
  if (await db.ajustes.get(chave)) return
  const e = await db.esmaltes.get('esm-mayco-pc602')
  if (e && !e.excluido) {
    const fab = { origem: 'fabricante' as const }
    const p = e.perfil ?? {}
    const t = e.tecnica ?? {}
    const so = <T extends object>(atual: T | undefined, novo: T): T => ({ ...novo, ...(atual ?? {}) })
    await db.esmaltes.update(e.id, {
      funcao: e.funcao || 'Fundente',
      descricao: e.descricao || 'Fundente da linha Pottery Cascade. Vai por cima ou por baixo de outros esmaltes atóxicos e escorre na queima; o movimento depende do esmalte que está por baixo.',
      perfil: {
        ...p,
        superficie: so(p.superficie, { verticais: ['Escorre'] }),
        expressivo: p.expressivo?.length ? p.expressivo : ['Escorrimentos', 'Sobreposições'],
        origens: so(p.origens, { superficie: fab, expressivo: fab }),
      },
      tecnica: {
        ...t,
        aplicacao: so(t.aplicacao, { demaos: '1 a 2 (a Zeramics diz 2 a 3)', biscoito: 'Cone 04 (1060 °C)', restricoes: 'Não aplicar na metade de baixo da peça. Não borrifar sem proteção.' }),
        metodos: t.metodos?.length ? t.metodos : ['Pincel', 'Sobreposição'],
        queima: so(t.queima, {
          tIdeal: '999 °C (cone 06, na prateleira)', tMax: '1031 °C (faixa da Zeramics: 999 a 1031 °C, cone 06/05)',
          patamar: 'Temperatura, rampa e patamar realçam o escorrido.', alternativas: 'Cone 5/6: transparente com flutuação branca. A cor pode mudar em temperaturas mais altas.',
        }),
        seguranca: so(t.seguranca, { atoxico: 'sim', alimentarDeclarada: 'sim' }),
        segurancaNotas: t.segurancaNotas || 'A Mayco declara "Food Safe" quando usado como manda o fabricante, mas avisa que a superfície pode não ser adequada para alimentos. Como vai junto com outros esmaltes, a peça só é segura se o esmalte de baixo também for.',
        alertas: t.alertas?.length ? t.alertas : ['Evite a metade de baixo da peça: o esmalte escorre.', 'Segurança na louça depende do esmalte que vai por baixo.'],
        origens: so(t.origens, { aplicacao: fab, queima: fab, seguranca: fab }),
      },
      atualizadoEm: Date.now(),
    })
  }
  await db.ajustes.put({ chave, valor: true })
}

/**
 * 27/11, refinamento da ficha: White Cascade com o que está no rótulo e na página oficial da Mayco
 * (maycocolors.com/product/pc-602-white-cascade, lida em 27/11/2026). Faixa da Zeramics deixa de ser "temperatura máxima";
 * a frase sobre patamar sai do campo de patamar; segurança separada em Food Safe e Dinnerware Safe, com as condições.
 * Só mexe no que está vazio ou no que o ajuste v1 escreveu.
 */
export async function fichaWhiteCascadeV2() {
  const chave = 'fix-ficha-white-cascade-v2'
  if (await db.ajustes.get(chave)) return
  const e = await db.esmaltes.get('esm-mayco-pc602')
  if (e && !e.excluido) {
    const URL = 'https://www.maycocolors.com/product/pc-602-white-cascade/'
    const fab = { origem: 'fabricante' as const, fonte: URL, data: '2026-11-27' }
    const p = { ...e.perfil }
    const t = { ...e.tecnica }
    const q = { ...t.queima }
    if (q.tIdeal === '999 °C (cone 06, na prateleira)') delete q.tIdeal
    if (q.tMax?.startsWith('1031 °C (faixa da Zeramics')) delete q.tMax
    if (q.patamar === 'Temperatura, rampa e patamar realçam o escorrido.') delete q.patamar
    if (q.alternativas === 'Cone 5/6: transparente com flutuação branca. A cor pode mudar em temperaturas mais altas.') delete q.alternativas
    q.faixa ||= 'Cone 06/05, 999 a 1031 °C (etiqueta da Zeramics); a Mayco indica cone 06 na prateleira'
    q.alternativas ||= 'Cone 6, oxidação: "Transparent. Color clear with white float" (Mayco; o rótulo diz cone 5/6). A página também mostra uma foto em cone 10 redução, sem descrição. A cor pode mudar em temperaturas mais altas (Zeramics).'
    t.queima = q
    const s = { ...t.seguranca }
    if (s.alimentarDeclarada === 'sim' && !s.foodSafe) { s.foodSafe = 'sim'; delete s.alimentarDeclarada }
    s.semChumbo ||= 'sim'
    s.dinnerwareSafe ||= 'sim'
    s.contatoAlimento ||= 'nao-verificado'
    s.combinacoes ||= 'nao-verificado'
    t.seguranca = s
    t.segurancaCondicoes = {
      foodSafe: 'Rótulo: "Food Safe" quando usado como o fabricante manda; avisa que a superfície pode não ser adequada para alimentos.',
      combinacoes: 'A peça só é segura se o esmalte de baixo também for (rótulo).',
      ...t.segurancaCondicoes,
    }
    if (t.segurancaNotas?.startsWith('A Mayco declara "Food Safe"')) delete t.segurancaNotas
    t.metodos = [...new Set([...(t.metodos ?? []), 'Esponja'])]
    t.aplicacao = { cuidados: 'Pode ser aplicado de forma aleatória ou uniforme (Mayco).', ...t.aplicacao }
    t.origens = { ...t.origens, aplicacao: fab, queima: fab, seguranca: fab }
    p.visual = { coresSecundarias: 'Branco puro em cone 06, que se mistura às cores dos esmaltes usados junto', ...p.visual }
    p.efeitos = [...new Set([...(p.efeitos ?? []), 'escorrimento', 'sobreposicao'])]
    p.comportamentoNota = {
      fluidez: 'A linha Pottery Cascade é descrita como "moving, flowing glazes", e o rótulo manda evitar a parte de baixo da peça; a dica do site diz "minimum movement and will stay in the pattern that you apply it in". As duas frases são da Mayco e não batem.',
      reatividade: '"Intermingles with the other glazes being used" (cone 06); o movimento depende do esmalte que está por baixo.',
      espessura: 'A aplicação e a posição da peça no forno mudam o escorrido (rótulo).',
      temperatura: 'Temperatura, rampa e patamar realçam o escorrido (rótulo). Reformulado para mover mais em baixa temperatura (site).',
      ...p.comportamentoNota,
    }
    p.comportamentoOrigem = { fluidez: 'fabricante', reatividade: 'fabricante', espessura: 'fabricante', temperatura: 'fabricante', ...p.comportamentoOrigem }
    p.origens = { ...p.origens, visual: fab, comportamento: fab }
    await db.esmaltes.update(e.id, { perfil: p, tecnica: t, atualizadoEm: Date.now() })
  }
  await db.ajustes.put({ chave, valor: true })
}
