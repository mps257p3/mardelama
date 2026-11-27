/**
 * Biblioteca de fenômenos cerâmicos: explicação geral, válida para qualquer esmalte.
 * O que é específico de um esmalte vem da ficha dele (ver `especificoDoFenomeno` em pages/lab/ficha/Fenomeno.tsx),
 * sempre separado desta explicação e com a origem identificada.
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
  },
  verticalEstavel: {
    nome: 'Estabilidade na vertical',
    definicao: 'Capacidade do esmalte de permanecer onde foi aplicado em superfícies verticais.',
    comoOcorre: 'Esmaltes de maior viscosidade no estado fundido, em geral com mais alumina ou sílica em relação aos fundentes, mantêm a camada coesa e não descem durante a queima.',
    condicoes: ['Temperatura e patamar', 'Espessura da camada', 'Composição'],
    exploracao: 'Desenhos precisos, linhas e reservas que se mantêm nítidas após a queima.',
    cuidados: 'Em temperaturas acima da recomendada, mesmo esmaltes estáveis podem começar a escorrer.',
    superficie: ['Permanece estável', 'Mantém a cobertura'],
  },
  acumulo: {
    nome: 'Acúmulo em relevos',
    definicao: 'Concentração de esmalte em depressões, incisões e reentrâncias da superfície.',
    comoOcorre: 'Na aplicação e na fusão, o esmalte se desloca das partes altas para as baixas. A camada mais espessa nas depressões muda cor, opacidade e brilho.',
    condicoes: ['Profundidade do relevo', 'Espessura aplicada', 'Fluidez na queima'],
    exploracao: 'Realçar texturas, carimbos, incisões e marcas do processo de construção.',
    cuidados: 'Acúmulos muito espessos podem craquelar, formar bolhas ou escorrer.',
    atributos: ['acumulo'], superficie: ['Acumula'],
  },
  afinaArestas: {
    nome: 'Afinamento nas arestas',
    definicao: 'Redução da espessura do esmalte sobre arestas, bordas e cristas.',
    comoOcorre: 'A tensão superficial do vidro fundido o afasta das arestas vivas; a camada fina deixa ver a massa ou muda de tom.',
    condicoes: ['Raio da aresta', 'Espessura aplicada', 'Fluidez na queima'],
    exploracao: 'Contornos claros que desenham a forma da peça.',
    cuidados: 'Em bordas de uso (lábios de canecas), a camada fina pode ficar áspera.',
    atributos: ['arestas'],
  },
  realcaRelevo: {
    nome: 'Realce de relevos',
    definicao: 'Diferença de tom entre partes altas e baixas de uma superfície texturizada.',
    comoOcorre: 'O esmalte fica mais espesso nas depressões e mais fino nas partes altas, o que acentua o desenho do relevo.',
    condicoes: ['Profundidade e nitidez do relevo', 'Transparência do esmalte', 'Espessura aplicada'],
    exploracao: 'Carimbos, texturas impressas, entalhes e marcas de ferramentas.',
    cuidados: 'Relevos rasos demais podem desaparecer sob camadas espessas.',
    atributos: ['texturas'], superficie: ['Realça relevos'],
  },
  cobreRelevo: {
    nome: 'Cobertura de relevos',
    definicao: 'Nivelamento da superfície pelo esmalte, que encobre detalhes do relevo.',
    comoOcorre: 'Camadas espessas ou esmaltes opacos preenchem as depressões e formam uma superfície mais lisa que a massa.',
    condicoes: ['Espessura aplicada', 'Opacidade', 'Fluidez na queima'],
    exploracao: 'Superfícies contínuas e calmas sobre formas texturizadas.',
    cuidados: 'Para preservar detalhes, aplicar camadas mais finas ou escolher esmaltes transparentes.',
    superficie: ['Encobre detalhes', 'Suaviza relevos'],
  },
  sobreposicao: {
    nome: 'Sobreposição',
    definicao: 'Aplicação de um esmalte sobre outro, com duas camadas distintas.',
    comoOcorre: 'Cada camada mantém em boa parte suas características; na região de encontro, a cor e a opacidade resultam da soma das duas.',
    condicoes: ['Ordem das camadas', 'Espessura de cada camada', 'Compatibilidade de dilatação', 'Temperatura de queima'],
    exploracao: 'Ampliar a paleta, criar profundidade e transições entre cores.',
    cuidados: 'Sobreposições aumentam a espessura total e podem escorrer. A segurança alimentar da combinação não é garantida pela classificação de cada esmalte.',
  },
  reatividade: {
    nome: 'Reatividade',
    definicao: 'Transformação visual que surge do contato químico entre esmaltes, ou entre esmalte e massa, durante a fusão.',
    comoOcorre: 'Na fusão, componentes migram entre as camadas. Fundentes e corantes de um esmalte alteram o outro e produzem halos, manchas, veios e cores que nenhum dos dois apresenta isoladamente. É diferente da sobreposição simples, em que as camadas apenas se somam.',
    condicoes: ['Combinação de esmaltes', 'Ordem e espessura das camadas', 'Temperatura e patamar', 'Atmosfera'],
    exploracao: 'Superfícies imprevisíveis e únicas, com efeitos de borda e de encontro.',
    cuidados: 'Resultados variam muito; registrar cada combinação em prova antes de usar em peças.',
    atributos: ['reatividade'],
  },
  cristalizacao: {
    nome: 'Cristalização',
    definicao: 'Formação de cristais visíveis no vidro do esmalte durante o resfriamento.',
    comoOcorre: 'Em esmaltes com excesso de certos óxidos (zinco, titânio, entre outros), cristais nucleiam e crescem quando a temperatura é mantida ou reduzida lentamente na faixa adequada.',
    condicoes: ['Curva de resfriamento e patamares', 'Composição', 'Espessura', 'Temperatura máxima'],
    exploracao: 'Rosetas, agulhas e campos cristalinos como elemento principal da superfície.',
    cuidados: 'Esmaltes cristalinos costumam ser muito fluidos; usar pedestal ou coletor sob a peça.',
    atributos: ['cristais', 'resfriamento'],
  },
  craquele: {
    nome: 'Craquelamento',
    definicao: 'Rede de fissuras na camada de esmalte.',
    comoOcorre: 'Ocorre quando o esmalte se contrai mais que a massa no resfriamento e fica sob tensão de tração. As fissuras podem surgir no forno ou dias depois.',
    condicoes: ['Diferença de dilatação entre esmalte e massa', 'Espessura', 'Velocidade de resfriamento'],
    exploracao: 'Craquelê decorativo realçado com tinta, óxidos ou fumaça.',
    cuidados: 'Em louça de uso, fissuras acumulam resíduos e enfraquecem a peça. Quando não é intencional, indica incompatibilidade com a massa.',
    defeitos: /craquel/i,
  },
  crawling: {
    nome: 'Retração (crawling)',
    definicao: 'Separação do esmalte em ilhas, deixando a massa exposta entre elas.',
    comoOcorre: 'A camada crua perde aderência (poeira, gordura, retração alta na secagem) e, na fusão, a tensão superficial recolhe o esmalte em ilhas de bordas arredondadas.',
    condicoes: ['Limpeza do biscoito', 'Espessura e retração da camada crua', 'Teor de argila e de magnésio no esmalte'],
    exploracao: 'Esmaltes de retração intencional criam superfícies de escamas e líquen.',
    cuidados: 'Quando indesejada: limpar o biscoito, reduzir a espessura e evitar manipular a camada crua.',
    defeitos: /crawling|retra/i,
  },
  reticulacao: {
    nome: 'Reticulação',
    definicao: 'Padrão em rede formado pela camada superior de esmalte, que se abre e deixa ver a camada de baixo.',
    comoOcorre: 'Uma camada de alta tensão superficial se contrai na fusão e se reorganiza em malha sobre a camada inferior.',
    condicoes: ['Combinação de esmaltes', 'Espessura da camada superior', 'Temperatura'],
    exploracao: 'Texturas de pele, casca e líquen.',
    cuidados: 'Superfícies muito irregulares não são indicadas para áreas de contato com alimentos.',
  },
  revelaMassa: {
    nome: 'Revelação da massa',
    definicao: 'Aparecimento da cor e da textura da massa através ou entre as áreas esmaltadas.',
    comoOcorre: 'Em camadas finas, esmaltes transparentes ou que afinam nas partes altas deixam a massa visível, às vezes com reação na interface.',
    condicoes: ['Espessura', 'Transparência', 'Cor e textura da massa'],
    exploracao: 'Valorizar marcas de torno, massas escuras ou com chamote.',
    cuidados: 'A cor da massa influencia o resultado; testar com a massa que será usada.',
    superficie: ['Revela a massa cerâmica'],
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
  },
  manchas: {
    nome: 'Pontilhados e manchas',
    definicao: 'Pequenas concentrações de cor distribuídas pela superfície.',
    comoOcorre: 'Partículas de óxidos, ilmenita, granilhas ou impurezas da massa se dissolvem parcialmente no vidro e deixam pontos com halo.',
    condicoes: ['Tamanho e quantidade das partículas', 'Temperatura', 'Atmosfera (a redução intensifica pontos de ferro)'],
    exploracao: 'Superfícies de aspecto pétreo e rústico.',
    cuidados: 'Pontos grandes podem formar crateras se a fusão for insuficiente.',
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
}
