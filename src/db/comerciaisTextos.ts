import type { Comercial } from './schema'

/**
 * Textos da engenharia reversa reescritos em frases corridas (26/11, pedido do Marcelo).
 * Só substituem o texto antigo se ele ainda estiver igual ao que o app semeou (não mexe no que foi editado).
 */
type Campos = Partial<Pick<Comercial, 'usos' | 'declarados' | 'hipoteses' | 'instrucoes'>>

export const TEXTOS_V2: Record<string, Campos> = {
  'comercial-amaco-pc33-iron-lustre': {
    instrucoes: 'Aplique a pincel, em 2 ou 3 demãos grossas. Deixe uma folga sem esmalte perto do pé, porque ele se move na queima. A Amaco mostra combinações dele com outros Potter\'s Choice, como o Oatmeal (PC-21).',
    usos: [
      'Fica mais bonito sobre relevo, carimbo ou entalhe. Nas partes altas ele afina e fica marrom; nos fundos acumula e aparece o azul-acinzentado.',
      'Aplique grosso, em 2 ou 3 demãos. Com camada fina ele fica chapado e não aparece a flutuação.',
      'Como escorre, deixe uma faixa sem esmalte perto do pé, principalmente em peças altas.',
      'Foi feito para cone 5 ou 6 em forno elétrico, com oxidação, e mesmo assim dá um aspecto de queima de redução.',
      'Um resfriamento lento entre 1100 e 900 °C costuma realçar as manchas que flutuam. É prática comum com rutilo; vale testar.',
      'Também funciona por cima de outros esmaltes da linha. A Amaco mostra combinações com Sage (PC-44), Blue Stone (PC-22), June Bug (PC-10), Iron Yellow (PC-38) e Glacier (C-19).',
      'Segundo a Amaco, pode ser usado em louça. Antes de vender, teste na sua própria queima.',
    ],
    declarados: [
      'Fica marrom onde a camada é fina e azul-acinzentado onde é grossa.',
      'Dá efeitos de queima de redução mesmo numa queima de oxidação, como toda a linha Potter\'s Choice.',
      'Queima em cone 5 a 6.',
      'É próprio para louça e não tem chumbo, segundo a Amaco.',
    ],
    hipoteses: [
      'Deve ser um esmalte de boro com ferro e rutilo, da mesma família do Floating Blue. O azul que flutua nas partes grossas costuma vir do rutilo, e o marrom vem do ferro.',
      'A ficha de segurança mostra pouca sílica e pouco caulim (até 15% cada), o que sugere uma base feita quase toda de frita.',
      'Para começar: nefelina 48, Gerstley Borate 26, sílica 20 e caulim 6, com 4 a 6% de óxido de ferro vermelho e 4% de rutilo claro.',
      'Para puxar mais azul, teste 0,25 a 0,5% de óxido de cobalto. Para um marrom mais metálico, suba o ferro até 8%.',
      'A referência é o Floating Blue de cone 6 (Ceramics Monthly, outubro de 2001), que usa a mesma base com 2% de ferro, 4% de rutilo e 1% de cobalto. Aqui o ferro sobe e o cobalto sai porque a cor principal é marrom.',
    ],
  },
  'comercial-spectrum-1431-pearl-white': {
    instrucoes: 'Aplique 2 ou 3 demãos para cobrir bem. A espessura muda a cor e a opacidade, e em superfícies verticais ele pode escorrer.',
    usos: [
      'Rende mais sobre textura: ali ele quebra e reage melhor, segundo a Bath Potters.',
      'Sozinho já parece ter duas cores, uma flutuando sobre a outra, sem precisar sobrepor esmaltes.',
      'Varie a espessura: onde fica mais grosso ele fica mais opaco e aparecem os fluxos cor de areia.',
      'A Bath Potters indica queimar a 1200 °C. A massa usada também muda o resultado.',
      'Em peças verticais, deixe uma folga sem esmalte no pé, porque ele se move.',
      'A linha é declarada sem chumbo e própria para louça.',
    ],
    declarados: [
      'É um branco perolado transparente com fluxos cor de areia clara (descrição da loja Hot Clay).',
      'Como toda a linha Floating, uma cor parece flutuar sobre a outra sem sobrepor esmaltes.',
      'Queima em cone 4 a 6, de 1180 a 1220 °C.',
      'Pede 2 a 3 demãos para cobrir.',
      'Não tem chumbo e é próprio para louça (Krueger, Creative Crafts e Hot Clay).',
    ],
    hipoteses: [
      'Deve ser um vidro de boro com titânio ou rutilo, como os esmaltes "floating" em geral. O titânio dá o véu perolado, e os fluxos cor de areia aparecem onde ele acumula.',
      'Não deve ter corante forte: o cobre que aparece na ficha da linha não se aplica ao Pearl White.',
      'Para começar: nefelina 48, Gerstley Borate (ou frita de boro) 26, sílica 20 e caulim 6, com 4 a 6% de dióxido de titânio e 1 a 2% de rutilo.',
      'Para mais "areia", suba o rutilo até 3%. Para um branco mais fechado, troque parte do titânio por zircônio, que dá opacidade sem cor.',
    ],
  },
  'comercial-amaco-pc17-honey-flux': {
    instrucoes: 'Aplique 2 ou 3 demãos grossas; a Amaco diz que a linha rende mais com aplicação generosa. Deixe uma folga sem esmalte no pé, porque ele se move.',
    usos: [
      'Brilha por cima de outros esmaltes: ele faz o que está embaixo escorrer mais.',
      'No cone 5 fica mel e creme, opaco. No cone 6 vira um branco fluido com pintas cor de mel.',
      'A Amaco mostra o Oatmeal (PC-31) por cima dele, e ele por cima de Textured Amber Brown (PC-62), River Birch (PCF-74) e Chai Matte (SH-12). Flux Blossom (PCF-54) e Chun Plum (PC-55) também ficam bem por cima dele.',
      'Como escorre muito, aplique no terço de cima da peça e deixe descer.',
      'Nos testes, use sempre um prato ou uma placa de sacrifício por baixo.',
      'Segundo a Amaco, a linha pode ser usada em louça.',
    ],
    declarados: [
      'É um esmalte cor de creme que faz escorrer mais o esmalte que estiver embaixo.',
      'No cone 5 fica mel e creme, opaco; no cone 6 fica branco fluido com pintas cor de mel.',
      'Dá efeitos de queima de redução numa queima de oxidação.',
      'É a base da linha PCF (Potter\'s Choice Flux) da Amaco.',
      'É próprio para louça e não tem chumbo.',
    ],
    hipoteses: [
      'Deve ser um vidro muito fundente, com bastante boro (frita ou Gerstley Borate) e pouca alumina. Por isso escorre e faz os outros escorrerem.',
      'A cor de mel e as pintas devem vir de rutilo com um pouco de ferro. No cone 5 o titânio deixa o esmalte opaco; no cone 6 ele dissolve e o esmalte fica fluido.',
      'Para começar: Gerstley Borate 35, nefelina 40, sílica 20 e caulim 5, com 4% de rutilo e 1% de óxido de ferro vermelho.',
      'Para escorrer mais, tire 5 de sílica. Para escorrer menos, troque 5 de Gerstley Borate por caulim.',
    ],
  },
  'comercial-mayco-sw214-micro-pearl': {
    instrucoes: 'Com 3 demãos ele fica estável. Mais demãos, ou uma camada mais grossa, podem fazer o esmalte se mover. Serve para queima de oxidação ou de redução.',
    usos: [
      'Fica melhor sobre textura, onde o branco quebra e marca o relevo.',
      'No cone 6, em oxidação, aparecem os microcristais iridescentes em lilás e amarelo-claro.',
      'No cone 5 ele fica um branco perolado, fosco-acetinado e estável, sem escorrer.',
      'No cone 10, em redução, escurece e fica variegado em azul, roxo e branco.',
      'A Mayco mostra ele por cima e por baixo do Light Flux (SW-401) e do Dark Flux (SW-402).',
      'É o único da linha Micro considerado próprio para louça.',
    ],
    declarados: [
      'No cone 6 é um branco brilhante e semiopaco, com fundo lilás, que quebra sobre a textura.',
      'Durante a queima formam-se microcristais iridescentes em lilás e amarelo-claro.',
      'No cone 5 fica um branco semiopaco, perolado e fosco-acetinado, bem estável.',
      'No cone 10 em redução fica variegado em azul, roxo e branco.',
      'É estável com 3 demãos; com mais, pode escorrer.',
      'Tem o selo de próprio para louça (Dinnerware Safe) na página da Mayco.',
    ],
    hipoteses: [
      'Os microcristais devem nascer do zinco da ficha junto com titânio, que formam cristais muito pequenos no resfriamento. A Bath Potters confirma que os Micro não levam cristais prontos.',
      'O lilás e o amarelo iridescente são típicos de titânio num vidro com zinco, então não precisa de corante.',
      'Para começar: feldspato potássico 25, frita de boro 25, sílica 20, óxido de zinco 12, carbonato de cálcio 10 e caulim 8, com 6 a 8% de dióxido de titânio.',
      'Um resfriamento lento, ou um patamar entre 1100 e 1000 °C, deve ajudar a formar os microcristais.',
    ],
  },
  'com-er-001': {
    usos: [
      'É para peças decorativas: a Coyote não recomenda para louça de mesa.',
      'O resfriamento lento é o que forma os cristais dourados. Sem ele, o esmalte não mostra o melhor.',
      'A curva da Coyote, em °C aproximados: sobe 55 °C/h até 105; 195 °C/h até 1095; 85 °C/h até 1205 e segura 15 minutos; desce até 1175 e segura mais 15 minutos; depois resfria 70 °C/h até 760.',
      'Em forno digital, use cone 5 com 30 minutos de patamar; em forno manual, cone 6.',
      'Aplique 2 ou 3 demãos a pincel. Camada grossa escorre, então deixe uns 6 mm sem esmalte no pé.',
      'Se for sobrepor outro esmalte, coloque só na metade de cima da peça.',
      'Pode ir ao forno junto com esmaltes que não são cristalinos e não precisa de bandeja para o escorrido.',
    ],
  },
  'com-er-002': {
    usos: [
      'Funciona como fundente: por baixo, por cima ou entre outros esmaltes, cria reação e movimento.',
      'Em peças verticais, não aplique no terço de baixo; faça camadas que vão diminuindo para baixo.',
      'Aplique 1 a 3 demãos a pincel, ou bata com esponja, de forma livre ou uniforme.',
      'Queima em cone 06/05, com subida média (cerca de 120 °C/h). Um patamar no fim realça o escorrido.',
      'Em alta temperatura (cone 6) ele fica transparente, com uma flutuação branca, e escorre mais. Teste antes.',
      'A Mayco mostra o White Cascade sobre o Blue Grotto (EL-118) e as técnicas Peacock, Frozen Pond e Plopping.',
      'Escorre menos que o Clear Cascade (PC-601) e fica mais onde foi pintado.',
    ],
  },
  'com-er-003': {
    usos: [
      'É para peças decorativas: a superfície fica áspera e seca, como casca de árvore, e não serve para louça.',
      'Aplique bem grosso, até a camada seca rachar antes da queima. É isso que faz o esmalte retrair.',
      'Queima em cone 5 a 6.',
      'Pode ir por cima de underglaze. A Coyote mostra peças com ele junto do White Crawl e por cima de shino.',
      'Deixe uns 6 mm sem esmalte no pé e nenhum esmalte embaixo da peça.',
    ],
  },
}
