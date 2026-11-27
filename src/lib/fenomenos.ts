/**
 * Biblioteca de fenômenos cerâmicos: explicação geral, válida para qualquer esmalte.
 * O que é específico de um esmalte vem da ficha dele (ver `especificoDoFenomeno` em pages/lab/ficha/Fenomeno.tsx),
 * sempre separado desta explicação e com a origem identificada.
 *
 * Para incluir um fenômeno: uma entrada aqui, o par id/nome em PICTOGRAMAS (lib/esmalteFicha.ts) e a amostra em
 * scripts/amostras/render.js. As fichas guardam só o id (perfil.efeitos), então nenhuma ficha precisa mudar.
 */
export interface Fenomeno {
  nome: string
  definicao: string
  comoOcorre: string
  condicoes: string[]
  exploracao: string
  cuidados: string
  /** Atributos de comportamento da ficha que tratam deste fenômeno. */
  atributos?: string[]
  /** Valores de "interação com a superfície" que indicam o fenômeno. */
  superficie?: string[]
  /** Tipos de defeito/efeito (expressão regular) ligados ao fenômeno. */
  defeitos?: RegExp
  /** Termos (expressão regular) que ligam alertas, restrições e descrições de queima da ficha ao fenômeno. */
  termos?: RegExp
}

export const FENOMENOS: Record<string, Fenomeno> = {
  escorrimento: {
    nome: 'Escorrimento',
    definicao: 'Movimento descendente do esmalte fundido durante a queima, por ação da gravidade.',
    comoOcorre: 'Quando a viscosidade do vidro fundido cai o suficiente na temperatura de queima, a camada deixa de se sustentar nas superfícies inclinadas e desce, formando fluxos, gotas e acúmulos nas partes baixas da peça.',
    condicoes: ['Temperatura máxima e tempo de patamar', 'Espessura da camada', 'Inclinação da superfície', 'Composição (fundentes e alumina)', 'Sobreposição com outros esmaltes'],
    exploracao: 'Fluxos verticais, véus sobre relevos, encontros de cor em sobreposições e acúmulos vítreos em bases e reentrâncias.',
    cuidados: 'Deixar faixa sem esmalte acima do pé, usar placa ou bolacha de proteção e testar antes em provas verticais.',
    atributos: ['fluidez', 'patamar', 'temperatura'], superficie: ['Escorre'], defeitos: /escorr/i,
    termos: /escorr|run|flu[ií]d/i,
  },

  acumulo: {
    nome: 'Acúmulo em cavidades',
    definicao: 'Concentração de esmalte em depressões, incisões e reentrâncias da superfície.',
    comoOcorre: 'Na aplicação e na fusão, o esmalte se desloca das partes altas para as baixas. A camada mais espessa nas depressões muda cor, opacidade e brilho.',
    condicoes: ['Profundidade do relevo', 'Espessura aplicada', 'Fluidez na queima'],
    exploracao: 'Realçar texturas, carimbos, incisões e marcas do processo de construção.',
    cuidados: 'Acúmulos muito espessos podem craquelar, formar bolhas ou escorrer.',
    atributos: ['acumulo', 'texturas'], superficie: ['Acumula', 'Realça relevos'],
    termos: /acúmul|acumul|pool|cavidad|relevo/i,
  },
  quebraBordas: {
    nome: 'Variação de cor nas bordas',
    definicao: 'Mudança de cor nas arestas, bordas e relevos, onde a camada de esmalte fica mais fina.',
    comoOcorre: 'Na fusão, o esmalte se afasta das partes altas e se acumula nas baixas. Nas arestas, a camada fina deixa aparecer a massa ou desenvolve outra cor, como o âmbar e o ferrugem dos esmaltes ricos em ferro.',
    condicoes: ['Raio das arestas e altura dos relevos', 'Espessura aplicada', 'Fluidez na queima', 'Cor da massa'],
    exploracao: 'Contornos que desenham a forma, realce de texturas, bordas e marcas de torno.',
    cuidados: 'Em bordas de uso, como lábios de canecas, a camada fina pode ficar áspera.',
    atributos: ['arestas'], superficie: ['Afina', 'Revela a massa cerâmica'],
    termos: /borda|aresta|break|relevo/i,
  },



  sobreposicao: {
    nome: 'Sobreposição',
    definicao: 'Aplicação de um esmalte sobre outro, com duas camadas distintas.',
    comoOcorre: 'Cada camada mantém em boa parte suas características; na região de encontro, a cor e a opacidade resultam da soma das duas.',
    condicoes: ['Ordem das camadas', 'Espessura de cada camada', 'Compatibilidade de dilatação', 'Temperatura de queima'],
    exploracao: 'Ampliar a paleta, criar profundidade e transições entre cores.',
    cuidados: 'Sobreposições aumentam a espessura total e podem escorrer. A segurança alimentar da combinação não é garantida pela classificação de cada esmalte.',
    termos: /sobrepos|layer|camada/i,
  },
  reatividade: {
    nome: 'Reatividade entre esmaltes',
    definicao: 'Transformação visual que surge do contato químico entre esmaltes, ou entre esmalte e massa, durante a fusão.',
    comoOcorre: 'Na fusão, componentes migram entre as camadas. Fundentes e corantes de um esmalte alteram o outro e produzem halos, manchas, veios e cores que nenhum dos dois apresenta isoladamente. É diferente da sobreposição simples, em que as camadas apenas se somam.',
    condicoes: ['Combinação de esmaltes', 'Ordem e espessura das camadas', 'Temperatura e patamar', 'Atmosfera'],
    exploracao: 'Superfícies imprevisíveis e únicas, com efeitos de borda e de encontro.',
    cuidados: 'Resultados variam muito; registrar cada combinação em prova antes de usar em peças.',
    atributos: ['reatividade'],
    termos: /reativ|reage|intera/i,
  },
  cristalizacao: {
    nome: 'Cristalização',
    definicao: 'Formação de cristais visíveis no vidro do esmalte durante o resfriamento.',
    comoOcorre: 'Em esmaltes com excesso de certos óxidos (zinco, titânio, entre outros), cristais nucleiam e crescem quando a temperatura é mantida ou reduzida lentamente na faixa adequada.',
    condicoes: ['Curva de resfriamento e patamares', 'Composição', 'Espessura', 'Temperatura máxima'],
    exploracao: 'Rosetas, agulhas e campos cristalinos como elemento principal da superfície.',
    cuidados: 'Esmaltes cristalinos costumam ser muito fluidos; usar pedestal ou coletor sob a peça.',
    atributos: ['cristais', 'resfriamento'],
    termos: /crist|crystal/i,
  },
  craquele: {
    nome: 'Craquelamento',
    definicao: 'Rede de fissuras na camada de esmalte.',
    comoOcorre: 'Ocorre quando o esmalte se contrai mais que a massa no resfriamento e fica sob tensão de tração. As fissuras podem surgir no forno ou dias depois.',
    condicoes: ['Diferença de dilatação entre esmalte e massa', 'Espessura', 'Velocidade de resfriamento'],
    exploracao: 'Craquelê decorativo realçado com tinta, óxidos ou fumaça.',
    cuidados: 'Em louça de uso, fissuras acumulam resíduos e enfraquecem a peça. Quando não é intencional, indica incompatibilidade com a massa.',
    defeitos: /craquel/i,
    termos: /craquel|crackl|craz/i,
  },
  crawling: {
    nome: 'Retração (crawling)',
    definicao: 'Separação do esmalte em ilhas, deixando a massa exposta entre elas.',
    comoOcorre: 'A camada crua perde aderência (poeira, gordura, retração alta na secagem) e, na fusão, a tensão superficial recolhe o esmalte em ilhas de bordas arredondadas.',
    condicoes: ['Limpeza do biscoito', 'Espessura e retração da camada crua', 'Teor de argila e de magnésio no esmalte'],
    exploracao: 'Esmaltes de retração intencional criam superfícies de escamas e líquen.',
    cuidados: 'Quando indesejada: limpar o biscoito, reduzir a espessura e evitar manipular a camada crua.',
    defeitos: /crawling|retra/i,
    termos: /crawl|retra/i,
  },


  variacaoEspessura: {
    nome: 'Variação por espessura',
    definicao: 'Mudança de cor, opacidade ou textura conforme a espessura da camada aplicada.',
    comoOcorre: 'Camadas finas deixam a massa interferir e dissolvem menos corante; camadas espessas concentram cor, opacidade e às vezes cristais ou fluxos.',
    condicoes: ['Número de demãos', 'Método de aplicação', 'Densidade do esmalte em suspensão'],
    exploracao: 'Degradês, pinceladas visíveis e reservas por espessura.',
    cuidados: 'Para resultado uniforme, controlar a densidade e o tempo de imersão.',
    atributos: ['espessura'],
  },
  separacaoFases: {
    nome: 'Separação de fases',
    definicao: 'Formação de regiões vítreas de composições diferentes dentro do mesmo esmalte.',
    comoOcorre: 'Certos vidros, ao fundir ou resfriar, se dividem em gotículas ou veios de composição distinta, que espalham a luz e produzem aspecto leitoso, opalescente ou com variegação.',
    condicoes: ['Composição (sílica, boro, fósforo, titânio)', 'Velocidade de resfriamento', 'Espessura'],
    exploracao: 'Azuis opalescentes, véus leitosos e variegações sutis.',
    cuidados: 'O efeito depende da curva de queima; pequenas mudanças alteram o resultado.',
    termos: /separa[çc][ãa]o de fases|phase/i,
  },

  bolhas: {
    nome: 'Formação de bolhas',
    definicao: 'Bolhas de gás presas no vidro ou abertas na superfície, como furinhos, crateras ou superfície fervida.',
    comoOcorre: 'Gases liberados pela massa e pelo esmalte (queima de matéria orgânica, decomposição de carbonatos e sulfatos, água) atravessam a camada fundida. Se o vidro estiver viscoso demais ou a queima terminar antes de as bolhas se fecharem, elas ficam presas ou deixam crateras.',
    condicoes: ['Biscoito mal queimado ou poroso', 'Espessura da camada', 'Velocidade de aquecimento e patamar final', 'Composição do esmalte e da massa', 'Excesso de temperatura (fervura)'],
    exploracao: 'Microbolhas dão profundidade e aspecto leitoso a esmaltes transparentes; crateras intencionais criam superfícies lunares.',
    cuidados: 'Furinhos e crateras abertas são difíceis de limpar e não são indicados para contato com alimentos. Patamar no pico e biscoito bem queimado costumam reduzir o problema.',
    defeitos: /bolha|pinhole|cratera|ferv|blister/i,
    termos: /bolh|pinhole|cratera|ferv|blister|bubbl/i,
  },
  opalescencia: {
    nome: 'Opalescência',
    definicao: 'Aspecto leitoso e azulado em luz refletida, que fica amarelado ou âmbar contra a luz, como na opala.',
    comoOcorre: 'Gotículas microscópicas de vidro de outra composição, formadas por separação de fases, ou partículas muito finas espalham mais a luz azul que a vermelha. Em camadas espessas o efeito se intensifica.',
    condicoes: ['Composição (boro, fósforo, cálcio, titânio)', 'Espessura', 'Velocidade de resfriamento', 'Temperatura máxima'],
    exploracao: 'Azuis leitosos sobre massas escuras, véus que mudam com a espessura e com a luz.',
    cuidados: 'O efeito depende muito da curva de queima e da espessura; registrar ambas a cada prova.',
    termos: /opales|opal|leitos/i,
  },
  metalico: {
    nome: 'Efeito metálico',
    definicao: 'Superfície com reflexo semelhante ao de metais.',
    comoOcorre: 'Altas concentrações de óxidos (manganês, cobre, ferro) cristalizam ou se separam na superfície durante o resfriamento e criam brilho metálico.',
    condicoes: ['Concentração de óxidos', 'Temperatura', 'Atmosfera', 'Resfriamento'],
    exploracao: 'Peças decorativas com brilho de bronze, grafite ou cobre.',
    cuidados: 'Esmaltes com teor elevado de óxidos metálicos não costumam ser indicados para contato com alimentos; seguir a classificação do fabricante.',
  },
  transparencia: {
    nome: 'Transparência',
    definicao: 'Passagem da luz pela camada de esmalte, que deixa ver a massa e as decorações sob ela.',
    comoOcorre: 'Um vidro sem opacificantes e bem fundido não espalha a luz; a cor de baixo aparece, em geral mais saturada.',
    condicoes: ['Espessura', 'Bolhas e microcristais', 'Cor da massa e dos engobes'],
    exploracao: 'Cobrir engobes, pinturas sob esmalte e massas coloridas.',
    cuidados: 'Camadas espessas podem ficar leitosas por bolhas; a transparência também revela defeitos da superfície.',
  },
  textura: {
    nome: 'Textura',
    definicao: 'Relevo tátil próprio da superfície esmaltada.',
    comoOcorre: 'Granilhas, fusão incompleta, cristais, retração ou formação de espuma deixam a superfície rugosa, granulada ou enrugada.',
    condicoes: ['Composição', 'Temperatura', 'Espessura'],
    exploracao: 'Contraste entre áreas lisas e ásperas, superfícies minerais.',
    cuidados: 'Superfícies ásperas são difíceis de limpar e não são indicadas para contato com alimentos.',
  },
  flutuacao: {
    nome: 'Flutuação de cor',
    definicao: 'Véus e manchas de outra cor que aparecem sobre o esmalte, como se flutuassem na superfície.',
    comoOcorre: 'Óxidos como titânio (rutilo), ferro ou fósforo migram para a superfície durante a fusão e o resfriamento e formam véus claros ou azulados sobre um fundo de outra cor.',
    condicoes: ['Composição (rutilo, ferro, fósforo)', 'Espessura', 'Temperatura máxima', 'Velocidade de resfriamento'],
    exploracao: 'Superfícies com profundidade, véus azulados sobre fundos escuros, variegação suave.',
    cuidados: 'O efeito varia muito com a espessura e o resfriamento; registrar a curva usada.',
    termos: /flutua|float/i,
  },
  opacidade: {
    nome: 'Variação de opacidade',
    definicao: 'Mudança no quanto o esmalte esconde a massa e o que está sob ele, de uma área para outra ou de uma queima para outra.',
    comoOcorre: 'Opacificantes (estanho, zircônio, titânio) ou microcristais e bolhas no vidro espalham a luz, que deixa de atravessar a camada.',
    condicoes: ['Teor de opacificante', 'Espessura', 'Temperatura (excesso pode clarear o vidro)'],
    exploracao: 'Superfícies de cor uniforme, cobertura de massas escuras, base para pintura sobre esmalte.',
    cuidados: 'Esmaltes opacos encobrem relevos e incisões finas; testar a espessura em peças texturizadas.',
    superficie: ['Encobre detalhes', 'Suaviza relevos'],
    termos: /opac|transl[uú]cid|transparen|leitos/i,
  },
  iridescencia: {
    nome: 'Iridescência',
    definicao: 'Reflexo que muda de cor conforme o ângulo de visão.',
    comoOcorre: 'Uma película muito fina na superfície, formada por óxidos metálicos ou por lustres, provoca interferência da luz e produz tons que variam com o ângulo.',
    condicoes: ['Composição (óxidos metálicos, bismuto, lustres)', 'Atmosfera', 'Resfriamento'],
    exploracao: 'Superfícies cambiantes em peças decorativas.',
    cuidados: 'Películas superficiais podem se desgastar com o uso e não costumam ser indicadas para contato com alimentos; seguir a classificação do fabricante.',
  },
}
