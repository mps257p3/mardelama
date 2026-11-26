/**
 * Glossário de termos cerâmicos. Definições curtas e factuais, sem receitas.
 * `chaves` são as grafias procuradas nos textos (perfis de artistas) para criar os links automáticos.
 * Termos genéricos demais (torno, placa…) ficam fora da busca automática.
 */
export type CatGlossario = 'Argila e preparo' | 'Técnicas' | 'Esmaltes e superfícies' | 'Queima e fornos' | 'Materiais' | 'Defeitos' | 'Formas' | 'Tradições e estética'

export interface Termo {
  id: string
  termo: string
  original?: string
  cat: CatGlossario
  def: string
  chaves?: string[]
  ver?: string[]
  exemplos?: string[]          // situações práticas, uma por item
}

export const CATS_GLOSSARIO: CatGlossario[] = ['Argila e preparo', 'Técnicas', 'Esmaltes e superfícies', 'Queima e fornos', 'Materiais', 'Defeitos', 'Formas', 'Tradições e estética']

export const GLOSSARIO: Termo[] = [

  // Argila e preparo
  { id: 'argila', termo: 'Argila', cat: 'Argila e preparo', ver: ['plasticidade', 'gres', 'faianca'],
    def: 'Matéria-prima da cerâmica: mineral muito fino que, com água, fica plástico e pode ser modelado; com o calor, endurece de forma permanente.' },
  { id: 'massa', termo: 'Massa cerâmica', cat: 'Argila e preparo', ver: ['argila', 'chamote'],
    def: 'Mistura pronta de argilas, fundentes e cargas (como quartzo e chamote) preparada para um uso e uma temperatura de queima.' },
  { id: 'barbotina', termo: 'Barbotina', cat: 'Argila e preparo', chaves: ['barbotina'], ver: ['engobe', 'colagem', 'riscar-colar'],
    def: 'Argila diluída em água até virar uma pasta ou um líquido. Serve para colar partes, para fazer engobe e, com defloculante, para colagem em molde de gesso.' },
  { id: 'chamote', termo: 'Chamote', cat: 'Argila e preparo', chaves: ['chamote', 'grog'],
    def: 'Argila já queimada e moída, misturada à massa. Diminui a retração, ajuda na secagem e dá estrutura e textura, por isso é comum em peças grandes e na escultura.' },
  { id: 'plasticidade', termo: 'Plasticidade', cat: 'Argila e preparo',
    def: 'Capacidade da argila de mudar de forma sem rachar e manter a forma nova. Argilas mais plásticas são boas para o torno; menos plásticas racham mais facilmente.' },
  { id: 'sovar', termo: 'Sovar (amassar)', cat: 'Argila e preparo', ver: ['argila'],
    def: 'Amassar a argila para deixá-la homogênea e tirar bolhas de ar, que podem estourar na queima. Técnicas comuns: cabeça de carneiro e espiral (kikumomi).' },
  { id: 'couro', termo: 'Ponto de couro', cat: 'Argila e preparo', chaves: ['ponto de couro'], ver: ['osso'],
    def: 'Fase da secagem em que a peça já está firme, mas ainda úmida. É o momento de tornear o pé, colar alças, entalhar e aplicar engobe.' },
  { id: 'osso', termo: 'Ponto de osso (cru seco)', cat: 'Argila e preparo', ver: ['couro', 'biscoito'],
    def: 'Peça totalmente seca, mais clara e muito frágil, pronta para a primeira queima.' },
  { id: 'retracao-argila', termo: 'Retração da argila', cat: 'Argila e preparo', ver: ['chamote'],
    def: 'Diminuição de tamanho da peça ao secar e ao queimar, por perda de água e por vitrificação. Costuma ficar entre 8% e 15% no total, conforme a massa.' },
  { id: 'reaproveitamento', termo: 'Reaproveitamento de argila', cat: 'Argila e preparo',
    def: 'Sobras de argila crua podem ser molhadas, secas até o ponto certo e sovadas de novo. Argila já queimada não volta a ser plástica.' },

  // Técnicas ocidentais e gerais
  { id: 'modelagem', termo: 'Modelagem manual', cat: 'Técnicas', ver: ['acordelado', 'placa', 'beliscao'],
    def: 'Construção sem torno, com as mãos e ferramentas simples. Inclui beliscão, acordelado e placas.' },
  { id: 'beliscao', termo: 'Beliscão (pinch)', cat: 'Técnicas', chaves: ['beliscão', 'pinch'],
    def: 'Forma feita a partir de uma bola de argila aberta com o polegar e afinada com beliscões regulares.' },
  { id: 'placa', termo: 'Placas', cat: 'Técnicas', chaves: ['placas', 'slab'],
    def: 'Construção com lâminas de argila abertas com rolo ou laminadora, cortadas e unidas.' },
  { id: 'torno', termo: 'Torno', cat: 'Técnicas', ver: ['centralizar', 'tornear-pe'],
    def: 'Roda giratória onde a argila é centralizada, aberta e puxada para formar peças simétricas.' },
  { id: 'centralizar', termo: 'Centralizar', cat: 'Técnicas', ver: ['torno'],
    def: 'Primeiro passo no torno: deixar a argila girando perfeitamente no centro, sem oscilar.' },
  { id: 'tornear-pe', termo: 'Tornear o pé (retornear)', cat: 'Técnicas', ver: ['couro'],
    def: 'Com a peça em ponto de couro, virá-la no torno e retirar argila da base com ferramentas para formar o pé e acertar o peso.' },
  { id: 'riscar-colar', termo: 'Riscar e colar', cat: 'Técnicas', ver: ['barbotina'],
    def: 'Forma de unir duas partes: riscar as superfícies, passar barbotina e pressionar. Evita que a junta se abra na secagem ou na queima.' },
  { id: 'colagem', termo: 'Colagem em molde (slip casting)', cat: 'Técnicas', chaves: ['slip casting', 'colagem'], ver: ['barbotina', 'molde'],
    def: 'Barbotina líquida despejada num molde de gesso. O gesso absorve a água e forma uma parede de argila; o excesso é escorrido.' },
  { id: 'molde', termo: 'Molde de gesso', cat: 'Técnicas', chaves: ['molde', 'moldes'], ver: ['colagem'],
    def: 'Forma de gesso usada para colagem ou para prensar placas de argila, permitindo repetir a mesma peça.' },
  { id: 'sgraffito', termo: 'Esgrafito (sgraffito)', cat: 'Técnicas', chaves: ['sgraffito', 'esgrafito'], ver: ['engobe'],
    def: 'Riscar através de uma camada de engobe ou esmalte para revelar a cor de baixo.' },
  { id: 'cera', termo: 'Reserva com cera', cat: 'Técnicas', ver: ['imersao'],
    def: 'Cera aplicada onde o esmalte ou o engobe não deve aderir, como o pé da peça ou um desenho. Queima e desaparece no forno.' },
  { id: 'carimbo', termo: 'Carimbo e impressão', cat: 'Técnicas',
    def: 'Texturas e desenhos pressionados na argila mole com carimbos, rendas, folhas ou objetos.' },
  { id: 'decalque', termo: 'Decalque', cat: 'Técnicas',
    def: 'Imagem impressa em papel especial aplicada sobre o esmalte queimado e fixada numa terceira queima, de baixa temperatura.' },

  // Preparo do esmalte (barbotina)
  { id: 'floculacao', termo: 'Floculação (vinagre, sal de Epsom)', cat: 'Esmaltes e superfícies', chaves: ['floculação', 'floculante', 'flocular'], ver: ['defloculante', 'teste-vinagre'],
    def: 'Fazer as partículas do esmalte líquido se juntarem um pouco, para ele ficar mais encorpado. O esmalte para de assentar duro no fundo do balde e de escorrer da peça, e a camada sai mais uniforme, até em parede vertical. Os floculantes mais usados são vinagre branco, sal de Epsom (sulfato de magnésio, dissolvido antes em água quente) e cloreto de cálcio. Use sempre aos poucos: o efeito leva alguns minutos para aparecer, e em excesso o esmalte vira um gel que deixa marca de pincel e pode descascar ao secar.',
    exemplos: [
      'Esmalte que assentou duro no fundo do balde: pingue vinagre branco, umas 5 gotas por litro, mexa bem e espere 10 minutos antes de pôr mais.',
      'Esmalte ralo que escorre na imersão e deixa a camada fina: flocular deixa a camada mais grossa sem tirar água.',
      'Esmaltes com muita frita e pouca argila (como os fundentes FLX, só frita e caulim) assentam com facilidade e costumam pedir um floculante.',
      'Com sal de Epsom: dissolva o sal num pouco de água quente até não dissolver mais e junte essa solução no esmalte de colher de chá em colher de chá, mexendo entre uma e outra.',
      'Passou do ponto e virou gel: junte um pouco de água ou 1 a 2 gotas de defloculante e mexa.',
      'Na fórmula do app, registre em Preparo e queima › Aditivo líquido, por exemplo "Vinagre branco · 5 gotas/litro", para saber quanto cada balde levou.',
      'Passo a passo completo em Biblioteca › Esmaltes › "Como usar vinagre no esmalte".',
    ] },
  { id: 'defloculante', termo: 'Defloculante', cat: 'Esmaltes e superfícies', chaves: ['defloculante', 'silicato de sódio', 'darvan'], ver: ['floculacao', 'barbotina', 'colagem'],
    def: 'O contrário do floculante: afasta as partículas e deixa a mistura mais fluida com menos água. É a base da barbotina de colagem em molde de gesso e serve para afinar um esmalte que engrossou demais. Os mais comuns são silicato de sódio, Darvan e barrilha (carbonato de sódio). Em excesso, faz o esmalte assentar duro no fundo do balde.',
    exemplos: [
      'Barbotina de colagem: a argila fica líquida com pouca água, seca mais rápido no molde e encolhe menos.',
      'Esmalte que virou gel por excesso de vinagre ou de sal de Epsom: 1 a 2 gotas de defloculante por litro, mexendo bem.',
      'Esmalte que precisa de bastante sólido e pouca água, como os de pincel: um toque de defloculante deixa a mistura espalhar melhor.',
    ] },
  { id: 'teste-vinagre', termo: 'Teste do vinagre ou do limão', cat: 'Esmaltes e superfícies', chaves: ['teste do vinagre', 'teste do limão'], ver: ['floculacao'],
    def: 'Teste caseiro para ver se a superfície do esmalte resiste a comida ácida. Ele só mostra o que dá para ver: se a placa não muda, isso não prova que o esmalte é seguro para louça. Chumbo, cádmio e bário podem sair sem deixar marca, então só o teste de lixiviação em laboratório libera um esmalte para louça.',
    exemplos: [
      'Pingue vinagre branco ou ponha uma rodela de limão numa parte da placa queimada, cubra e deixe 24 a 48 horas.',
      'Lave e compare com uma parte que não teve contato. Se a cor mudar, o brilho cair ou ficar uma mancha esbranquiçada, o esmalte não serve para louça.',
      'Os esmaltes que mais costumam mudar no teste são os com muito cobre, manganês ou excesso de fundente.',
    ] },

  // Esmaltes (gerais)
  { id: 'esmalte', termo: 'Esmalte (vidrado)', cat: 'Esmaltes e superfícies', ver: ['frita', 'fundente', 'silica'],
    def: 'Camada que vira vidro na queima, cobrindo a peça. Formada basicamente por sílica (forma o vidro), fundentes (baixam o ponto de fusão) e alumina (estabiliza).' },
  { id: 'transparente', termo: 'Esmalte transparente', cat: 'Esmaltes e superfícies',
    def: 'Deixa ver a argila ou o engobe por baixo. Pode ser incolor ou tingido.' },
  { id: 'opaco', termo: 'Esmalte opaco', cat: 'Esmaltes e superfícies', ver: ['opacificante'],
    def: 'Cobre a cor da argila. A opacidade vem de opacificantes (como zircônio ou estanho) ou de cristais que se formam no resfriamento.' },
  { id: 'fosco', termo: 'Fosco, acetinado e brilhante', cat: 'Esmaltes e superfícies',
    def: 'Graus de brilho da superfície. O fosco vem de microcristais ou de pouca fusão; o acetinado fica no meio; o brilhante é um vidro liso e bem fundido.' },
  { id: 'cristalino', termo: 'Esmalte cristalino', cat: 'Esmaltes e superfícies',
    def: 'Esmalte em que se formam cristais visíveis (em geral silicato de zinco) durante um resfriamento controlado.' },
  { id: 'subesmalte', termo: 'Subesmalte (underglaze)', cat: 'Esmaltes e superfícies', chaves: ['underglaze', 'subesmalte'], ver: ['sobresmalte'],
    def: 'Cor aplicada sobre a peça crua ou o biscoito, antes do esmalte transparente. Permite pintar com precisão.' },
  { id: 'sobresmalte', termo: 'Sobresmalte (overglaze)', cat: 'Esmaltes e superfícies', chaves: ['overglaze', 'sobresmalte'], ver: ['lustre-metalico', 'decalque'],
    def: 'Cores, lustres e decalques aplicados sobre o esmalte já queimado e fixados numa queima de baixa temperatura.' },
  { id: 'imersao', termo: 'Aplicação por imersão (banho)', cat: 'Esmaltes e superfícies', chaves: ['imersão'], ver: ['pulverizacao'],
    def: 'Mergulhar a peça no esmalte por alguns segundos. A espessura depende do tempo, da densidade do esmalte e da porosidade do biscoito.' },
  { id: 'pulverizacao', termo: 'Aplicação por pulverização', cat: 'Esmaltes e superfícies', chaves: ['pulverização', 'pulverizado', 'pistola', 'compressor'], ver: ['imersao'],
    def: 'Esmalte ou engobe borrifado com pistola e compressor. Permite gradações e camadas finas; exige cabine e máscara.' },
  { id: 'densidade', termo: 'Densidade do esmalte', cat: 'Esmaltes e superfícies',
    def: 'Quanto pó há na água do esmalte, medida em gramas por mililitro. Controla a espessura da camada aplicada.' },

  // Queima (geral)
  { id: 'monoqueima', termo: 'Monoqueima', cat: 'Queima e fornos', chaves: ['monoqueima'], ver: ['biscoito'],
    def: 'Esmaltar a peça crua e queimá-la uma única vez, sem biscoito.' },
  { id: 'vitrificacao', termo: 'Vitrificação', cat: 'Queima e fornos', ver: ['gres', 'porcelana'],
    def: 'Formação de vidro dentro da massa durante a queima, que reduz a porosidade e aumenta a resistência.' },
  { id: 'cone', termo: 'Cone pirométrico', cat: 'Queima e fornos', chaves: ['cone'], ver: ['curva'],
    def: 'Pequena peça que se curva ao receber certa quantidade de calor (temperatura e tempo juntos). Mostra o trabalho de calor real, que o termômetro sozinho não indica.' },
  { id: 'curva', termo: 'Curva de queima', cat: 'Queima e fornos', ver: ['patamar', 'cone'],
    def: 'Programação de subida, patamar e descida de temperatura ao longo do tempo. Há curvas guardadas em Biblioteca › Técnicas.' },
  { id: 'patamar', termo: 'Patamar', cat: 'Queima e fornos', chaves: ['patamar'], ver: ['curva'],
    def: 'Tempo em que o forno fica na mesma temperatura, para igualar o calor ou deixar o esmalte alisar.' },
  { id: 'quartzo', termo: 'Inversão do quartzo', cat: 'Queima e fornos', ver: ['choque'],
    def: 'Por volta de 573 °C o quartzo muda de forma e de volume. Subir ou baixar rápido demais nessa faixa pode trincar as peças.' },
  { id: 'choque', termo: 'Choque térmico', cat: 'Queima e fornos', chaves: ['choque térmico'], ver: ['raku'],
    def: 'Trinca causada por mudança brusca de temperatura. Massas com chamote e porosas resistem melhor, por isso são usadas no raku.' },
  { id: 'baixa-alta', termo: 'Baixa e alta temperatura', cat: 'Queima e fornos', ver: ['faianca', 'gres'],
    def: 'Baixa temperatura vai até cerca de 1100 °C (faiança, terracota, raku). Alta temperatura fica em torno de 1200 °C a 1300 °C (grés, porcelana).' },
  { id: 'forno-eletrico', termo: 'Forno elétrico', cat: 'Queima e fornos', chaves: ['forno elétrico'], ver: ['oxidacao'],
    def: 'Forno com resistências. A queima é em oxidação e muito controlável, com controlador programável.' },
  { id: 'forno-gas', termo: 'Forno a gás', cat: 'Queima e fornos', chaves: ['forno a gás'], ver: ['reducao'],
    def: 'Forno com queimadores. Permite controlar a entrada de ar e fazer queimas em redução.' },

  // Materiais básicos
  { id: 'faianca', termo: 'Faiança e terracota', cat: 'Materiais', chaves: ['faiança', 'terracota'], ver: ['baixa-alta'],
    def: 'Massas de baixa temperatura que ficam porosas depois de queimadas. A terracota é avermelhada; a faiança costuma ser clara e esmaltada.' },
  { id: 'silica', termo: 'Sílica (quartzo)', cat: 'Materiais', chaves: ['sílica', 'quartzo'], ver: ['esmalte'],
    def: 'Principal formadora de vidro nos esmaltes e parte das massas.' },
  { id: 'fundente', termo: 'Fundente', cat: 'Materiais', chaves: ['fundente', 'fundentes'], ver: ['feldspato', 'frita'],
    def: 'Material que baixa a temperatura de fusão do esmalte ou da massa, como feldspatos, carbonato de cálcio, dolomita e fritas.' },
  { id: 'frita', termo: 'Frita', cat: 'Materiais', chaves: ['frita', 'fritas'], ver: ['fundente'],
    def: 'Vidro industrial moído, pré-fundido para tornar estáveis materiais solúveis ou tóxicos. Base de muitos esmaltes de baixa temperatura.' },
  { id: 'oxidos', termo: 'Óxidos corantes', cat: 'Materiais', chaves: ['óxido de ferro', 'óxido de cobre', 'cobalto', 'óxido de manganês'], ver: ['pigmento'],
    def: 'Óxidos metálicos que dão cor: ferro (mel, marrom, celadon), cobre (verde ou vermelho), cobalto (azul), manganês (marrom e roxo), cromo (verde).' },
  { id: 'pigmento', termo: 'Pigmento cerâmico (corante)', cat: 'Materiais', chaves: ['pigmento', 'pigmentos', 'pigmentada', 'pigmentado'], ver: ['oxidos'],
    def: 'Cor industrial estável, pré-calcinada, usada em massas, engobes e esmaltes. Dá cores mais previsíveis que os óxidos.' },
  { id: 'opacificante', termo: 'Opacificante', cat: 'Materiais', ver: ['opaco'],
    def: 'Material que deixa o esmalte opaco, como o silicato de zircônio e o óxido de estanho.' },

  // Defeitos
  { id: 'furos', termo: 'Furos (pinholes)', cat: 'Defeitos', chaves: ['pinholes', 'pinhole'],
    def: 'Pequenos furos no esmalte causados por gases que saem da massa ou do esmalte e não se fecham. Patamar e resfriamento lento ajudam.' },
  { id: 'escorrimento', termo: 'Escorrimento', cat: 'Defeitos', chaves: ['escorrido', 'escorridos', 'escorrimento'],
    def: 'Esmalte que desce e cola na placa do forno. Vem de camada grossa ou de esmalte fluido demais para a temperatura.' },
  { id: 'lascamento', termo: 'Lascamento (shivering)', cat: 'Defeitos', ver: ['craquelado'],
    def: 'O esmalte se solta em lascas, sobretudo nas bordas, por estar comprimido demais em relação à massa. É o oposto do craquelado.' },
  { id: 'trinca', termo: 'Trincas de secagem', cat: 'Defeitos', ver: ['retracao-argila'],
    def: 'Rachaduras causadas por secagem desigual, paredes de espessuras muito diferentes ou juntas mal coladas.' },
  { id: 'bolhas', termo: 'Bolhas e fervura', cat: 'Defeitos',
    def: 'Bolhas no esmalte por excesso de temperatura, camada grossa ou gases presos.' },

  // Esmaltes e superfícies
  { id: 'shino', termo: 'Shino', original: '志野', cat: 'Esmaltes e superfícies', chaves: ['shino'], ver: ['mino', 'feldspato'],
    def: 'Família de esmaltes surgida na região de Mino, no Japão, no período Momoyama (fim do século XVI). Esmalte espesso e leitoso, rico em feldspato, com pequenos furos na superfície e, onde fica mais fino, tons alaranjados. Variantes conhecidas: e-Shino (com pintura de ferro por baixo) e nezumi-Shino (sobre engobe de ferro, acinzentado).' },
  { id: 'oribe', termo: 'Oribe', original: '織部', cat: 'Esmaltes e superfícies', chaves: ['oribe'], ver: ['mino'],
    def: 'Estilo de Mino do início do século XVII, ligado ao mestre de chá Furuta Oribe. Conhecido pelo esmalte verde de cobre, por formas assimétricas e por pinturas em óxido de ferro. Hoje "Oribe" também designa, de modo geral, o esmalte verde de cobre nessa tradição.' },
  { id: 'kiseto', termo: 'Kiseto', original: '黄瀬戸', cat: 'Esmaltes e superfícies', chaves: ['kiseto'], ver: ['mino'],
    def: '"Seto amarelo". Esmalte amarelado de Mino, do período Momoyama, à base de cinza com um pouco de ferro, muitas vezes com toques de verde de cobre (tanpan) e marcas de queimado.' },
  { id: 'setoguro', termo: 'Setoguro e hikidashi-guro', original: '瀬戸黒・引き出し黒', cat: 'Esmaltes e superfícies', chaves: ['setoguro', 'hikidashi'], ver: ['mino'],
    def: 'Preto de Mino obtido retirando a peça do forno ainda em brasa (hikidashi, "puxar para fora"). O resfriamento brusco fixa o esmalte de ferro num preto profundo.' },
  { id: 'tenmoku', termo: 'Tenmoku', original: '天目', cat: 'Esmaltes e superfícies', chaves: ['tenmoku', 'temmoku'],
    def: 'Esmalte escuro rico em ferro. O nome vem do monte Tianmu, na China, de onde monges japoneses levaram tigelas desse tipo. Variantes famosas: "pelo de lebre" (estrias) e "gota de óleo" (pontos prateados).' },
  { id: 'celadon', termo: 'Celadon', cat: 'Esmaltes e superfícies', chaves: ['celadon', 'celadão', 'seladon'], ver: ['reducao'],
    def: 'Esmalte com pouca quantidade de ferro, queimado em redução, que resulta em tons verde-acinzentados a azulados. Tradição chinesa e coreana (Goryeo).' },
  { id: 'kairagi', termo: 'Kairagi', original: '梅花皮', cat: 'Esmaltes e superfícies', chaves: ['kairagi'], ver: ['retracao'],
    def: 'Textura de esmalte que se recolhe em glóbulos, lembrando pele de raia. Valorizada nas tigelas de chá do tipo Ido, sobretudo junto ao pé. É uma forma controlada de retração do esmalte.' },
  { id: 'retracao', termo: 'Retração do esmalte (crawling)', cat: 'Esmaltes e superfícies', chaves: ['retração', 'crawling'], ver: ['kairagi'],
    def: 'O esmalte se recolhe durante a queima e deixa áreas do corpo descobertas. Pode ser defeito (poeira, gordura, camada grossa demais) ou efeito buscado, como no kairagi.' },
  { id: 'craquelado', termo: 'Craquelado', original: '貫入 kan\'nyū', cat: 'Esmaltes e superfícies', chaves: ['craquelado', 'craquelê', 'craquelê', 'kannyu'],
    def: 'Rede de fissuras finas no esmalte causada pela diferença de dilatação entre esmalte e corpo. Em peças utilitárias pode acumular sujeira; como efeito, é realçado com tinta ou chá.' },
  { id: 'engobe', termo: 'Engobe', cat: 'Esmaltes e superfícies', chaves: ['engobe', 'engobes'], ver: ['kohiki', 'hakeme'],
    def: 'Argila líquida, às vezes com corantes, aplicada sobre a peça crua ou em ponto de couro para mudar a cor ou a textura da superfície.' },
  { id: 'kohiki', termo: 'Kohiki', original: '粉引', cat: 'Esmaltes e superfícies', chaves: ['kohiki'], ver: ['engobe'],
    def: 'Peça de argila escura coberta por engobe branco e esmalte transparente. Origem coreana (buncheong), muito apreciada no Japão.' },
  { id: 'hakeme', termo: 'Hakeme', original: '刷毛目', cat: 'Esmaltes e superfícies', chaves: ['hakeme'], ver: ['engobe'],
    def: 'Engobe branco aplicado com pincel largo e seco, que deixa as marcas do gesto visíveis.' },
  { id: 'shizenyu', termo: 'Esmalte natural de cinza', original: '自然釉 shizen-yū', cat: 'Esmaltes e superfícies', chaves: ['cinza natural', 'cinza da lenha', 'shizenyu', 'cinza volante'], ver: ['anagama', 'goma'],
    def: 'Vidrado que se forma sozinho quando a cinza da lenha cai sobre a peça durante a queima e funde com a superfície. Típico das cerâmicas de forno a lenha sem esmalte aplicado.' },
  { id: 'goma', termo: 'Goma', original: '胡麻', cat: 'Esmaltes e superfícies', chaves: ['goma'], ver: ['bizen', 'shizenyu'],
    def: '"Gergelim": pontinhos de cinza fundida sobre a peça, típicos de Bizen e Shigaraki.' },
  { id: 'hidasuki', termo: 'Hidasuki', original: '緋襷', cat: 'Esmaltes e superfícies', chaves: ['hidasuki'], ver: ['bizen'],
    def: 'Marcas vermelho-alaranjadas em peças de Bizen, deixadas por palha de arroz enrolada na peça durante a queima.' },
  { id: 'botamochi', termo: 'Botamochi', original: '牡丹餅', cat: 'Esmaltes e superfícies', chaves: ['botamochi'], ver: ['bizen'],
    def: 'Círculos mais claros em peças de Bizen onde discos de argila foram apoiados, protegendo a área da cinza e da chama.' },
  { id: 'yohen', termo: 'Yōhen', original: '窯変', cat: 'Esmaltes e superfícies', chaves: ['yohen', 'yōhen'],
    def: '"Transformação no forno": mudanças de cor e superfície causadas pela chama, pela cinza e pela atmosfera, que não se controlam por completo.' },
  { id: 'lustre-metalico', termo: 'Lustre e metais preciosos', cat: 'Esmaltes e superfícies', chaves: ['platina', 'lustre'], ver: ['kintsugi'],
    def: 'Camadas finas de ouro, platina ou lustre aplicadas sobre o esmalte já queimado e fixadas numa terceira queima, em temperatura baixa.' },

  // Queima e fornos
  { id: 'raku', termo: 'Raku', original: '楽焼', cat: 'Queima e fornos', chaves: ['raku'], ver: ['chawan'],
    def: 'No Japão, tradição de tigelas de chá da família Raku, em Kyoto, desde o século XVI: peças modeladas à mão e retiradas incandescentes do forno. No Ocidente, a partir de Paul Soldner nos anos 1960, "raku" passou a designar sobretudo a queima rápida com retirada em brasa e redução posterior em serragem ou papel, que escurece craquelados e partes sem esmalte.' },
  { id: 'reducao', termo: 'Redução', cat: 'Queima e fornos', chaves: ['redução', 'reduzida'], ver: ['oxidacao', 'celadon'],
    def: 'Atmosfera do forno com pouco oxigênio. Muda a cor dos óxidos: o cobre fica vermelho, o ferro dá verdes de celadon e pretos. Exige forno a gás, lenha ou outro combustível.' },
  { id: 'oxidacao', termo: 'Oxidação', cat: 'Queima e fornos', chaves: ['oxidação', 'oxidante'], ver: ['reducao'],
    def: 'Atmosfera com oxigênio suficiente durante a queima, como no forno elétrico. O cobre tende ao verde e o ferro aos tons de mel e marrom.' },
  { id: 'anagama', termo: 'Anagama', original: '穴窯', cat: 'Queima e fornos', chaves: ['anagama'], ver: ['noborigama', 'shizenyu'],
    def: 'Forno de câmara única, em forma de túnel inclinado, tradicionalmente escavado numa encosta. A queima a lenha dura vários dias e a cinza forma vidrados naturais.' },
  { id: 'noborigama', termo: 'Noborigama', original: '登り窯', cat: 'Queima e fornos', chaves: ['noborigama'], ver: ['anagama'],
    def: 'Forno a lenha de várias câmaras escalonadas numa encosta; o calor de uma câmara aquece a seguinte.' },
  { id: 'queima-lenha', termo: 'Queima a lenha', cat: 'Queima e fornos', chaves: ['forno a lenha', 'queima a lenha', 'wood firing'], ver: ['anagama', 'shizenyu'],
    def: 'Queima em que a lenha é o combustível. A chama, a cinza e a posição da peça no forno marcam a superfície de maneira única.' },
  { id: 'sal-soda', termo: 'Queima com sal ou soda', cat: 'Queima e fornos', chaves: ['queima com sal', 'queima de sal', 'salt glaze', 'soda'],
    def: 'Sal ou carbonato de sódio jogado no forno em alta temperatura vaporiza e reage com a sílica da argila, formando um vidrado com textura de casca de laranja.' },
  { id: 'saggar', termo: 'Saggar', cat: 'Queima e fornos', chaves: ['saggar'],
    def: 'Caixa refratária que protege a peça dentro do forno. Na queima em saggar, coloca-se material combustível e sais junto com a peça para criar marcas de fumaça e cor.' },
  { id: 'biscoito', termo: 'Biscoito (sinterização)', cat: 'Queima e fornos', chaves: ['biscoito'],
    def: 'Primeira queima, em temperatura mais baixa, que deixa a peça resistente e ainda porosa para receber esmalte.' },

  // Formas
  { id: 'chawan', termo: 'Chawan', original: '茶碗', cat: 'Formas', chaves: ['chawan'], ver: ['raku'],
    def: 'Tigela para preparar e beber o chá matcha.' },
  { id: 'guinomi', termo: 'Guinomi', original: 'ぐい呑み', cat: 'Formas', chaves: ['guinomi'], ver: ['tokkuri'],
    def: 'Copinho de saquê, um pouco maior que o ochoko.' },
  { id: 'tokkuri', termo: 'Tokkuri', original: '徳利', cat: 'Formas', chaves: ['tokkuri'], ver: ['guinomi'],
    def: 'Garrafa para servir saquê.' },
  { id: 'mizusashi', termo: 'Mizusashi', original: '水指', cat: 'Formas', chaves: ['mizusashi'],
    def: 'Recipiente com tampa para a água fria usada na cerimônia do chá.' },
  { id: 'mukozuke', termo: 'Mukōzuke', original: '向付', cat: 'Formas', chaves: ['mukozuke', 'mukōzuke'],
    def: 'Pratinho ou tigela individual da refeição kaiseki, servido do lado oposto ao arroz e à sopa.' },
  { id: 'tsubo', termo: 'Tsubo', original: '壺', cat: 'Formas', chaves: ['tsubo'],
    def: 'Jarra ou pote, em geral de corpo largo e boca estreita.' },
  { id: 'moon-jar', termo: 'Moon jar (dalhangari)', original: '달항아리', cat: 'Formas', chaves: ['moon jar', 'moon jars', 'dalhangari'], ver: ['porcelana'],
    def: 'Grande jarra branca de porcelana da Coreia do período Joseon (séculos XVII e XVIII). Feita em duas metades torneadas e unidas, o que deixa a forma levemente irregular, como uma lua.' },
  { id: 'hanaire', termo: 'Hanaire', original: '花入', cat: 'Formas', chaves: ['hanaire'],
    def: 'Vaso para flores usado na cerimônia do chá.' },

  // Técnicas
  { id: 'kurinuki', termo: 'Kurinuki', original: '刳り貫き', cat: 'Técnicas', chaves: ['kurinuki'],
    def: 'Escavar a forma a partir de um bloco maciço de argila, em vez de tornear ou montar.' },
  { id: 'nerikomi', termo: 'Nerikomi e neriage', original: '練り込み', cat: 'Técnicas', chaves: ['nerikomi', 'neriage'],
    def: 'Argilas de cores diferentes combinadas na própria massa, formando padrões que atravessam a parede da peça.' },
  { id: 'inlay', termo: 'Incrustação (mishima, zōgan)', original: '象嵌', cat: 'Técnicas', chaves: ['mishima', 'zogan', 'zōgan', 'incrustação'], ver: ['engobe'],
    def: 'Desenho incisivo na argila preenchido com engobe de outra cor e raspado depois, deixando a linha nítida.' },
  { id: 'acordelado', termo: 'Acordelado', cat: 'Técnicas', chaves: ['acordelado', 'acordelada', 'rolinhos'],
    def: 'Construção com rolos de argila sobrepostos e unidos.' },
  { id: 'brunido', termo: 'Brunido', cat: 'Técnicas', chaves: ['brunido', 'brunida', 'polida com pedra'], ver: ['sigillata'],
    def: 'Polimento da argila em ponto de couro com pedra ou colher, que dá brilho sem esmalte.' },
  { id: 'kintsugi', termo: 'Kintsugi', original: '金継ぎ', cat: 'Técnicas', chaves: ['kintsugi', 'urushi'], ver: ['lustre-metalico'],
    def: 'Reparo de peças quebradas com laca urushi, acabado com pó de ouro ou de outro metal, que deixa a fratura à vista.' },

  // Materiais
  { id: 'gres', termo: 'Grés', cat: 'Materiais', chaves: ['grés', 'stoneware'], ver: ['porcelana'],
    def: 'Massa cerâmica queimada em alta temperatura (em geral acima de 1200 °C) que fica densa e pouco porosa.' },
  { id: 'porcelana', termo: 'Porcelana', cat: 'Materiais', chaves: ['porcelana'], ver: ['caulim'],
    def: 'Massa branca à base de caulim, feldspato e quartzo, queimada em alta temperatura. Fica vitrificada e, em paredes finas, translúcida.' },
  { id: 'feldspato', termo: 'Feldspato', cat: 'Materiais', chaves: ['feldspato', 'feldspática', 'feldspático'], ver: ['shino'],
    def: 'Mineral que funciona como fundente em massas e esmaltes de alta temperatura. É a base de esmaltes como o Shino.' },
  { id: 'caulim', termo: 'Caulim', cat: 'Materiais', chaves: ['caulim'], ver: ['porcelana'],
    def: 'Argila primária, branca e pouco plástica, base da porcelana.' },
  { id: 'sigillata', termo: 'Terra sigillata', cat: 'Materiais', chaves: ['sigillata'], ver: ['brunido'],
    def: 'Engobe muito fino feito só com as partículas menores da argila, decantadas. Ganha brilho acetinado com polimento, sem esmalte.' },

  // Tradições e estética
  { id: 'mino', termo: 'Mino', original: '美濃焼', cat: 'Tradições e estética', chaves: ['mino'], ver: ['shino', 'oribe', 'kiseto', 'setoguro'],
    def: 'Região da província de Gifu, no Japão, onde surgiram Shino, Oribe, Kiseto e Setoguro no período Momoyama.' },
  { id: 'bizen', termo: 'Bizen', original: '備前焼', cat: 'Tradições e estética', chaves: ['bizen'], ver: ['hidasuki', 'goma', 'botamochi', 'yakishime'],
    def: 'Tradição de Okayama, um dos seis fornos antigos do Japão. Cerâmica sem esmalte, queimada longamente a lenha; a superfície vem da argila, da cinza e da chama.' },
  { id: 'shigaraki', termo: 'Shigaraki', original: '信楽焼', cat: 'Tradições e estética', chaves: ['shigaraki'], ver: ['yakishime', 'goma'],
    def: 'Tradição de Shiga, um dos seis fornos antigos. Argila com grãos de feldspato que estouram na queima, tons alaranjados e cinza vitrificada.' },
  { id: 'tokoname', termo: 'Tokoname', original: '常滑焼', cat: 'Tradições e estética', chaves: ['tokoname'], ver: ['yakishime'],
    def: 'Tradição de Aichi, um dos seis fornos antigos, conhecida por grandes jarras e, hoje, pelas chaleiras de argila vermelha.' },
  { id: 'rokkoyo', termo: 'Seis fornos antigos (Rokkoyō)', original: '六古窯', cat: 'Tradições e estética', chaves: ['rokkoyo', 'rokkoyō', 'seis fornos antigos'], ver: ['bizen', 'shigaraki', 'tokoname'],
    def: 'Bizen, Echizen, Seto, Shigaraki, Tamba e Tokoname: centros cerâmicos com produção contínua desde a Idade Média japonesa.' },
  { id: 'hagi', termo: 'Hagi', original: '萩焼', cat: 'Tradições e estética', chaves: ['hagi'],
    def: 'Tradição de Yamaguchi, muito ligada ao chá. Argila macia e esmaltes que mudam de cor com o uso, à medida que o chá penetra no craquelado.' },
  { id: 'karatsu', termo: 'Karatsu', original: '唐津焼', cat: 'Tradições e estética', chaves: ['karatsu'],
    def: 'Tradição de Saga, de origem coreana, com pintura de ferro simples (e-Garatsu) e esmaltes de cinza.' },
  { id: 'yakishime', termo: 'Yakishime', original: '焼き締め', cat: 'Tradições e estética', chaves: ['yakishime'], ver: ['bizen', 'shigaraki'],
    def: 'Cerâmica de alta temperatura sem esmalte aplicado, em que a superfície nasce da argila e do fogo.' },
  { id: 'mingei', termo: 'Mingei', original: '民芸', cat: 'Tradições e estética', chaves: ['mingei'],
    def: 'Movimento das artes populares japonesas, fundado nos anos 1920 por Yanagi Sōetsu com os ceramistas Hamada Shōji e Kawai Kanjirō, valorizando o objeto útil feito por artesãos anônimos.' },
  { id: 'wabi-sabi', termo: 'Wabi-sabi', original: '侘寂', cat: 'Tradições e estética', chaves: ['wabi-sabi', 'wabi sabi', 'wabi'],
    def: 'Sensibilidade estética japonesa que valoriza o simples, o imperfeito, o rústico e as marcas do tempo.' },
]

const tirarAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const PADROES = GLOSSARIO.map((t) => ({ t, re: t.chaves?.length ? new RegExp(`(^|[^a-z0-9])(${t.chaves.map((c) => escapar(tirarAcento(c))).join('|')})([^a-z0-9]|$)`) : undefined }))

/** Termos do glossário que aparecem num texto (sem repetir), na ordem do glossário. */
export function termosNoTexto(texto: string): Termo[] {
  const s = tirarAcento(texto.replace(/<[^>]+>/g, ' '))
  return PADROES.filter((p) => p.re?.test(s)).map((p) => p.t)
}

export const termoPorId = (id: string) => GLOSSARIO.find((t) => t.id === id)

/**
 * Grafias extras usadas só dentro do próprio glossário (os links entre definições).
 * Termos que aparecem em quase toda definição (argila, esmalte, massa) ficam de fora para não virar ruído.
 */
const EXTRAS: Record<string, string[]> = {
  sovar: ['sovar', 'sovada'], osso: ['ponto de osso', 'cru seco'], 'retracao-argila': ['retração'], modelagem: ['modelagem manual'],
  torno: ['torno'], centralizar: ['centralizar', 'centralizada', 'centralização'], 'tornear-pe': ['tornear o pé', 'retornear'],
  'riscar-colar': ['riscar e colar'], cera: ['reserva com cera', 'cera'], opaco: ['esmalte opaco', 'opaco'],
  vitrificacao: ['vitrificação', 'vitrifica', 'vitrificada', 'vitrificado'], curva: ['curva de queima'], quartzo: ['inversão do quartzo'],
  'baixa-alta': ['baixa temperatura', 'alta temperatura'], opacificante: ['opacificante'], lascamento: ['lascamento', 'shivering'], trinca: ['trincas de secagem'],
}
/** Mesmo comprimento do original (letra a letra), para achar a posição do termo no texto com acento. */
const plano = (s: string) => s.split('').map((c) => { const x = tirarAcento(c); return x.length === 1 ? x : c.toLowerCase() }).join('')
const LIGAR = GLOSSARIO.map((t) => {
  const ks = [...new Set([...(t.chaves ?? []), ...(EXTRAS[t.id] ?? [])].map(plano))].sort((a, b) => b.length - a.length)
  return { t, re: ks.length ? new RegExp(`(^|[^a-z0-9])(${ks.map(escapar).join('|')})(?:s|es)?(?=[^a-z0-9]|$)`, 'g') : undefined }
})

export type Trecho = string | { t: Termo; texto: string }

/** Divide um texto em pedaços, marcando a primeira menção de cada termo do glossário (menos `semId`) para virar link. */
export function comLinks(texto: string, semId?: string): Trecho[] {
  const s = plano(texto)
  const achados: { t: Termo; ini: number; fim: number }[] = []
  for (const { t, re } of LIGAR) {
    if (!re || t.id === semId) continue
    re.lastIndex = 0
    const m = re.exec(s)
    if (m) { const ini = m.index + m[1].length; achados.push({ t, ini, fim: m.index + m[0].length }) }
  }
  // o mais cedo primeiro; no empate, o mais longo ("esmalte opaco" ganha de "opaco")
  achados.sort((a, b) => a.ini - b.ini || b.fim - a.fim)
  const out: Trecho[] = []
  let pos = 0
  for (const a of achados) {
    if (a.ini < pos) continue
    if (a.ini > pos) out.push(texto.slice(pos, a.ini))
    out.push({ t: a.t, texto: texto.slice(a.ini, a.fim) })
    pos = a.fim
  }
  if (pos < texto.length) out.push(texto.slice(pos))
  return out
}
