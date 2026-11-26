import type { Artista, Obra, Processo, Fonte, FalaArtista } from './schema'

/**
 * Segunda leva de estudos de referência (pedido de 26/11/2026) e fotos que faltavam em obras da primeira leva.
 * Fontes conferidas em 26/11/2026. Marcelo autorizou usar imagens que o museu marca como de uso restrito (app pessoal).
 */
const v = (tema: string, texto: string, fonte?: string): Processo => ({ tema, texto, certeza: 'verificado', fonte })
const f = (titulo: string, url?: string, tipo?: string, ano?: string): Fonte => ({ titulo, url, tipo, ano })
const fala = (texto: string, original: string, fonte: string, veiculo: string): FalaArtista => ({ texto, original, fonte, veiculo })

type A = Omit<Artista, 'id' | 'criadoEm' | 'atualizadoEm' | 'excluido' | 'favorito' | 'origem' | 'revisadoEm' | 'relacionados'> & { relacionados?: string[] }
type O = Omit<Obra, 'id' | 'criadoEm' | 'atualizadoEm' | 'excluido' | 'favorito' | 'tags'> & { tags?: string[] }
const vazio = { tecnicas: [], materiais: [], esmaltes: [], queimas: [], esteticas: [], tiposObra: [], tags: [], publicacoes: [], fontes: [], estudar: [], processos: [], caracteristicas: [] }

const WP = 'https://en.wikipedia.org/wiki/'
const HAM_W = `${WP}Sh%C5%8Dji_Hamada`
const HAM_JT = 'https://japantimes.co.jp/culture/2000/06/24/arts/an-unknown-craftsman-from-mashiko'
const KAW_W = `${WP}Kawai_Kanjir%C5%8D`
const KAW_B = 'https://britannica.com/biography/Kawai-Kanjiro'
const ROS_W = `${WP}Rosanjin`
const ROS_M = 'https://www.mirviss.com/artists/136-kitaoji-rosanjin/'
const PRICE_W = `${WP}Kenneth_Price`
const SUZ_SESC = 'https://portal.sescsp.org.br/online/artigo/compartilhar/11199_O+BARRO+E+VIDA+E+PODE+SER+ESPIRITO+TAMBEM'
const SUZ_S94 = 'https://salon94.com/artists/shoko-suzuki'
const SUZ_OC = 'https://ocula.com/artists/shoko-suzuki/'
const YUA_OC = 'https://ocula.com/artists/megumi-yuasa/'
const NII_E = 'https://acervo.mac.usp.br/acervo/index.php/Detail/entities/5540'
const TOS_HAM = 'https://hammer.ucla.edu/radical-women/artists/celeida-tostes'
const TOS_PASS = 'https://hammer.ucla.edu/radical-women/art/art/passagem-passage'
const TOS_LE = 'https://laescuela.art/en/campus/library/essays/the-radical-pedagogy-of-celeida-tostes-cristiana-tejo'

export const ARTISTAS_LEVA2: [string, A][] = [
  ['art-hamada', {
    ...vazio, relacionados: ['art-kawai', 'art-hamana', 'art-ueda', 'art-yamada'],
    nome: 'Shoji Hamada', nomeOriginal: '濱田 庄司', pais: ['Japão'], atuacao: 'Mashiko, Tochigi', nascimento: '9 de dezembro de 1894, Kawasaki (morreu em Mashiko; a Wikipedia dá 1978, o Japan Times 1977)',
    especialidade: 'Cerâmica utilitária do movimento mingei, em Mashiko',
    linguagem: 'Potes, tigelas e pratos de grés de uso diário, com barro e esmaltes locais, pinceladas rápidas de ferro, cera de reserva e esmaltes de cinza e kaki.',
    bio: 'Nasceu em Kawasaki em 1894 e estudou no Colégio Industrial de Tóquio com Itaya Hazan, junto com Kawai Kanjirō; os dois fizeram pesquisa de esmaltes em Kyoto (Wikipedia). Em 1920 foi para a Inglaterra com Bernard Leach e passou cerca de três anos em St Ives. Voltou ao Japão em 1923, viajou por olarias, ficou em Tsuboya, Okinawa, e se instalou em Mashiko, em Tochigi, em 1924 (Japan Times).\n\nUsava só barro da região e esmaltes feitos por ele, com pincéis de pelo de cachorro e bambu (Wikipedia). Em 1955 foi o primeiro artesão declarado Tesouro Nacional Vivo, e em 1961 sucedeu Yanagi Sōetsu na direção do Museu do Artesanato Popular do Japão. Recebeu a Ordem da Cultura (1968). A casa dele em Mashiko virou o Shoji Hamada Memorial Mashiko Sankōkan (1977), com a coleção de artesanato popular que ele juntou; a residência também foi remontada no Museu de Cerâmica de Mashiko.',
    caracteristicas: ['Mingei', 'Barro e esmaltes locais', 'Pincelada de ferro', 'Cera de reserva'],
    afinidade: 'A raiz mingei de Hamana, Ueda e Yamada: o pote de uso diário feito com materiais do lugar.',
    analise: {
      formas: 'Tigelas, pratos quadrados, chawan, jarros de água, yunomi.',
      paleta: 'Marrons de ferro, kaki (caqui), cinzas, brancos e pretos.',
      texturas: 'Pinceladas rápidas, escorridos de esmalte, sgraffito com o dedo.',
      reconhecivel: 'Pratos e tigelas de grés com pinceladas largas de ferro ou esmalte derramado em gesto.',
    },
    processos: [
      v('Argila', 'Só barro da região e esmaltes feitos por ele.', HAM_W),
      v('Esmaltes', 'Esmalte de sal, esmalte de cinza "kaki", cera de reserva, pincelada de ferro, placas e sgraffito com o dedo (títulos de slides de 1963).', HAM_W),
      v('Acabamentos', 'Pincéis feitos de pelo de cachorro e bambu.', HAM_W),
    ],
    estudar: ['Esmalte kaki e esmaltes de cinza.', 'Cera de reserva e pincelada de ferro.', 'Esmalte derramado em gesto único.', 'Trabalhar só com materiais do lugar.'],
    falas: [fala('Mashiko era boa e o povo bem simpático, mas tinha tendência à teimosia.', 'Mashiko was fine and the people quite nice, but they had a tendency toward stubbornness.', HAM_JT, 'Japan Times (2000)')],
    publicacoes: [f('Bernard Leach, Hamada, Potter (Kodansha)', undefined, 'Catálogos', '1975'), f('Susan Peterson, Shoji Hamada: A Potter\'s Way and Work (Kodansha)', undefined, 'Catálogos', '1974'), f('Shoji Hamada: Master Potter (Lund Humphries)', undefined, 'Catálogos', '1998')],
    fontes: [f('Wikipedia', HAM_W, 'Enciclopédias'), f('Japan Times — An unknown craftsman from Mashiko', HAM_JT, 'Reportagens', '2000'), f('Tate', 'https://www.tate.org.uk/art/artists/shoji-hamada-8795', 'Museus')],
    tecnicas: ['Torno', 'Placas', 'Cera de reserva', 'Pincelada'], materiais: ['Grés', 'Barro de Mashiko'], esmaltes: ['Kaki', 'Cinza', 'Sal', 'Ferro'], queimas: ['Redução'], tiposObra: ['Tigelas', 'Pratos', 'Chawan', 'Jarros'], esteticas: ['Mingei', 'Utilitária'],
    tags: ['japão', 'mingei', 'tesouro nacional vivo', 'referência histórica'],
  }],
  ['art-kawai', {
    ...vazio, relacionados: ['art-hamada', 'art-hamana', 'art-ueda'],
    nome: 'Kawai Kanjirō', nomeOriginal: '河井 寛次郎', pais: ['Japão'], atuacao: 'Gojōzaka, Kyoto', nascimento: '24 de agosto de 1890, Yasugi, Shimane (morreu em Kyoto, 1966)',
    especialidade: 'Cerâmica mingei de esmaltes vermelhos de cobre e marrons de ferro, forno noborigama',
    linguagem: 'Potes e vasos de formas robustas, com vermelho de cobre, marrom de ferro e azul de cobalto, decorados com engobe trilhado (tsutsugaki), cera de reserva e hakeme.',
    bio: 'Nasceu em Yasugi, Shimane, em 1890. Formou-se na Escola Politécnica Superior de Tóquio em 1914 e passou pelo Instituto de Pesquisa Cerâmica de Kyoto, onde aprendeu esmaltes químicos (Wikipedia; Britannica). Em 1920 construiu em Kyoto o próprio forno noborigama, o "Shōkeiyō", de oito câmaras; uma queima levava 48 horas, mais de 2.000 feixes de lenha e chegava a 1.350 °C (Wikipedia).\n\nEm 1925 fundou o movimento mingei com Yanagi Sōetsu e Hamada Shōji (Britannica). Recusou todas as honrarias oficiais, inclusive o título de Tesouro Nacional Vivo, e não assinava as peças (Wikipedia). Também fazia escultura em madeira. A casa-ateliê de Gojōzaka, em Kyoto, com o forno atrás, é hoje o museu Kawai Kanjirō\'s House, restaurado em 1973 pela família. Em 2026 a Japan Society de Nova York fez a primeira retrospectiva dele nos Estados Unidos, "House to House".',
    caracteristicas: ['Vermelho de cobre', 'Noborigama', 'Tsutsugaki', 'Mingei'],
    afinidade: 'O lado mais pesquisador de esmalte do mingei: cor forte e forma robusta.',
    analise: {
      formas: 'Potes, vasos, garrafas e caixas de formas encorpadas.',
      paleta: 'Vermelho de cobre (shinsha), marrom de ferro (tetsu-yu), azul de cobalto (gosu), verde de cromo.',
      reconhecivel: 'Vasos encorpados com vermelho de cobre e marrom de ferro.',
    },
    processos: [
      v('Queima', 'Forno noborigama de oito câmaras, construído em 1920; queima de 48 horas a 1.350 °C com mais de 2.000 feixes de lenha.', KAW_W),
      v('Esmaltes', 'Vermelho de cobre (shinsha), marrom de ferro (tetsu-yu), cromo e cobalto (gosu).', KAW_W),
      v('Acabamentos', 'Engobe trilhado (tsutsugaki), cera de reserva (rōnuki) e engobe branco a pincel (hakeme).', KAW_W),
    ],
    estudar: ['Vermelho de cobre em redução.', 'Engobe trilhado (tsutsugaki).', 'Hakeme com engobe branco.', 'O forno noborigama de câmaras.'],
    falas: [
      fala('Meu próprio trabalho é a minha melhor assinatura.', 'My work itself is my best signature.', KAW_W, 'citado em Yoshiko Uchida, We Do Not Work Alone (1953)'),
      fala('Quando você fica tão absorvido no trabalho que a beleza flui naturalmente, aí o trabalho vira obra de arte.', 'When you become so absorbed in your work that beauty flows naturally then your work truly becomes a work of art.', KAW_W, 'citado em Yoshiko Uchida (1953)'),
      fala('Toda obra de arte pertence a todos, porque é aquilo que cada pessoa vê nela.', 'Any work of art belongs to everyone, because it is whatever each person sees in it.', KAW_W, 'citado em Yoshiko Uchida (1953)'),
    ],
    publicacoes: [f('Yoshiko Uchida, We Do Not Work Alone (Kawai Kanjiro\'s House)', undefined, 'Catálogos', '1953'), f('Kawai Kanjirō: House to House — Japan Society, Nova York', undefined, 'Exposições', '2026')],
    fontes: [f('Wikipedia', KAW_W, 'Enciclopédias'), f('Britannica', KAW_B, 'Enciclopédias')],
    tecnicas: ['Torno', 'Tsutsugaki', 'Cera de reserva', 'Hakeme'], materiais: ['Grés', 'Porcelana'], esmaltes: ['Vermelho de cobre', 'Ferro', 'Cobalto', 'Celadon'], queimas: ['Noborigama a lenha, 1.350 °C'], tiposObra: ['Vasos', 'Potes', 'Esculturas em madeira'], esteticas: ['Mingei', 'Colorida'],
    tags: ['japão', 'mingei', 'referência histórica'],
  }],
  ['art-rosanjin', {
    ...vazio, relacionados: ['art-koie', 'art-kakurezaki', 'art-hamada'],
    nome: 'Kitaōji Rosanjin', nomeOriginal: '北大路 魯山人', pais: ['Japão'], atuacao: 'Kamakura (forno de Yamasaki)', nascimento: '23 de março de 1883, Kyoto (morreu em Yokohama, 1959)',
    especialidade: 'Louça para comida: Oribe, Shino, Kutani e porcelana pintada, feita para os próprios restaurantes',
    linguagem: 'Pratos, tigelas e travessas para servir comida, em muitos estilos (Oribe, Shino, Mino, Bizen, Kutani, azul e branco Ming), com pintura solta e caligráfica.',
    bio: 'Nasceu Kitaōji Fusajirō em Kyoto, em 1883, filho do sacerdote do santuário de Kamigamo; Rosanjin é pseudônimo (Wikipedia). Foi adotado aos seis anos por um gravador de xilogravura, estudou caligrafia em Tóquio e passou 1908–1910 no norte da China estudando caligrafia e entalhe de selos. Começou com a cerâmica por volta de 1915, em Kyoto e Kanazawa, e em 1926 montou um forno em Yamasaki, Kamakura, com Arakawa Toyozō.\n\nCozinheiro e dono de restaurante (o Bishoku Club e o Hoshigaoka Saryō), fazia a louça para servir a própria comida. Imitou e releu Mino, Shigaraki, Bizen, Kutani e a porcelana Ming, acrescentando elementos caligráficos (Wikipedia); a Mirviss o chama de "mestre de uma enorme variedade de esmaltes". Recusou o título de Tesouro Nacional Vivo (a Wikipedia dá 1959, a Mirviss 1955). Expôs no MoMA de Nova York em 1954 e conheceu Picasso e Chagall na Europa. O Adachi Museum of Art abriu em 2020 uma sala só para ele, com cerca de 500 peças.',
    caracteristicas: ['Louça para comida', 'Oribe', 'Pintura caligráfica', 'Muitos estilos'],
    afinidade: 'A cerâmica de mesa japonesa como arte: o prato pensado para a comida que vai nele.',
    analise: {
      formas: 'Pratos irregulares, travessas, tigelas, mukozuke e conjuntos.',
      paleta: 'Verde Oribe, branco Shino, vermelhos e dourados de Kutani, azul e branco.',
      reconhecivel: 'Pratos de Oribe e porcelana pintada com caranguejos, camélias e bambus em traço solto.',
    },
    processos: [
      v('Esmaltes', 'Releu Mino, Shigaraki, Bizen, Kutani e a porcelana azul e branca e colorida Ming, com elementos caligráficos.', ROS_W),
      v('Queima', 'Forno em Yamasaki, Kamakura, montado em 1926 com Arakawa Toyozō.', ROS_W),
    ],
    estudar: ['Louça pensada para um prato de comida específico.', 'Oribe verde com pintura de ferro.', 'Pintura caligráfica sobre cerâmica.', 'Conjuntos de pratos irregulares.'],
    falas: [fala('Sem ideias extraordinárias não pode haver resultados extraordinários.', 'Without extraordinary ideas there can be no extraordinary results.', ROS_M, 'Joan B Mirviss')],
    publicacoes: [f('Tradition Redefined: Rosanjin and His Rivals — Joan B Mirviss', undefined, 'Catálogos', '2021'), f('Individual no MoMA, Nova York', undefined, 'Exposições', '1954')],
    fontes: [f('Wikipedia', ROS_W, 'Enciclopédias'), f('Joan B Mirviss', ROS_M, 'Galerias'), f('National Crafts Museum (MOMAT)', 'https://www.momat.go.jp/craft-museum/en/artists/aki047', 'Museus'), f('Metropolitan Museum', 'https://artistproject.metmuseum.org/art/collection/search/853156', 'Museus')],
    tecnicas: ['Modelagem', 'Pintura sobre esmalte', 'Pincelada'], materiais: ['Grés', 'Porcelana'], esmaltes: ['Oribe', 'Shino', 'Kutani', 'Azul e branco'], tiposObra: ['Pratos', 'Travessas', 'Tigelas', 'Conjuntos de mesa'], esteticas: ['Rinpa', 'Caligráfica', 'Cerimônia do chá'],
    tags: ['japão', 'louça de mesa', 'referência histórica'],
  }],
  ['art-price', {
    ...vazio, relacionados: ['art-nagle', 'art-kuwata', 'art-peck'],
    nome: 'Ken Price', pais: ['Estados Unidos'], atuacao: 'Taos, Novo México', nascimento: '16 de fevereiro de 1935, Los Angeles (morreu em Taos, 2012)',
    especialidade: 'Esculturas de cerâmica pintadas com camadas de acrílica e lixadas',
    linguagem: 'Formas abstratas e orgânicas de barro queimado, sem esmalte, cobertas com dezenas de camadas de tinta acrílica colorida e lixadas até as cores de baixo aparecerem em manchas.',
    bio: 'Nasceu em Los Angeles em 1935. Estudou no Chouinard, no Santa Monica City College, formou-se na USC (1956), fez pós com Peter Voulkos no Otis e mestrado em cerâmica em Alfred (1959), onde foi "tentar desenvolver esmaltes de baixa temperatura e cores vivas" (Wikipedia). Fez a primeira individual na Ferus Gallery em 1960, ao lado de Larry Bell, Ed Ruscha e Robert Irwin.\n\nMudou-se para Taos, no Novo México, em 1970, e em 2002 voltou de vez para lá com a mulher, Happy, num ateliê junto da casa. Deixou de esmaltar: pintava o barro queimado com muitas camadas de acrílica, até uma centena em até sete cores, e lixava (a seco, desde o fim dos anos 1990) para revelar as cores de baixo. Foi professor de cerâmica na USC. Morreu em 2012, pouco antes da retrospectiva "Ken Price Sculpture", do LACMA com projeto de Frank Gehry, que foi também ao Nasher e ao Met.',
    caracteristicas: ['Acrílica em camadas', 'Lixamento', 'Formas orgânicas', 'Sem esmalte'],
    afinidade: 'Primo de Nagle e de Kuwata: escultura de cor em que a superfície é feita de camadas reveladas.',
    analise: {
      formas: 'Ovos, xícaras, volumes orgânicos e abstratos.',
      paleta: 'Cores vivas sobrepostas: vermelho, verde, rosa, amarelo, azul.',
      texturas: 'Superfície lixada que mostra pintas e manchas das camadas de baixo.',
      reconhecivel: 'Bolhas orgânicas de cor salpicada, como pele de réptil colorida.',
    },
    processos: [
      v('Pintura', 'Barro queimado sem esmalte, pintado com muitas camadas de acrílica (até cem, em até sete cores) e lixado para revelar as cores de baixo.', PRICE_W),
      v('Acabamentos', 'Lixamento a seco a partir do fim dos anos 1990.', PRICE_W),
    ],
    estudar: ['Camadas de cor reveladas por lixamento.', 'Forma orgânica abstrata em escala de mesa.', 'Trocar o esmalte por tinta depois da queima.'],
    falas: [
      fala('Desde que me lembro, sempre quis ser artista.', 'As far back as I can remember, I always wanted to be an artist.', PRICE_W, 'Wikipedia'),
      fala('Fui para Alfred tentar desenvolver alguns esmaltes de baixa temperatura e cores vivas.', 'I went to Alfred to try and develop some low-fire, brightly colored glazes', PRICE_W, 'Wikipedia'),
    ],
    publicacoes: [f('Ken Price Sculpture: A Retrospective — LACMA, Nasher e Metropolitan', undefined, 'Exposições', '2012')],
    fontes: [f('Wikipedia', PRICE_W, 'Enciclopédias'), f('Glenstone', 'https://www.glenstone.org/artists/ken-price', 'Museus'), f('National Gallery of Art', 'https://www.nga.gov/artists/5562-ken-price', 'Museus'), f('Tate', 'https://tate.org.uk/art/artists/ken-price-3070', 'Museus')],
    tecnicas: ['Modelagem', 'Pintura acrílica', 'Lixamento'], materiais: ['Barro queimado', 'Tinta acrílica'], tiposObra: ['Esculturas', 'Xícaras'], esteticas: ['Orgânica', 'Colorida', 'Pop'],
    tags: ['estados unidos', 'escultura', 'cor', 'referência histórica'],
  }],
  ['art-shokosuzuki', {
    ...vazio, relacionados: ['art-yuasa', 'art-kiminii', 'art-tsujimura', 'art-hamada'],
    nome: 'Shoko Suzuki', pais: ['Japão', 'Brasil'], atuacao: 'Cotia, São Paulo', nascimento: '1929, Tóquio (a Salon 94 também cita Yokohama)',
    especialidade: 'Cerâmica de alta temperatura em forno noborigama, esmaltes de cinza',
    linguagem: 'Tigelas, potes e vasos torneados em torno manual, com esmaltes de cinza, tons de terra e incisões simbólicas, na tradição da cerâmica japonesa.',
    bio: 'Nasceu em 1929 em Tóquio ("em Tóquio, onde nasci", disse ao Sesc). Foi aprendiz do mestre Tōko Karasugi por cerca de dez anos (Salon 94); "Não fiz faculdade, escola de arte, nada." Chegou ao Brasil em 1962, morou primeiro em Mauá e em 1964 se mudou para Cotia, onde construiu o primeiro forno noborigama com tijolos reaproveitados e fez a primeira abertura de forno (kamabiraki) em 1967 (Salon 94; Ocula). A Ocula a aponta como quem introduziu a queima de alta temperatura em noborigama no Brasil.\n\nTrabalha no torno manual, com esmaltes de cinza e argilas locais (Salon 94). Um AVC em 2015 a afastou do torno por um tempo; desde 2004 trabalha com a discípula Ivone Shirabata (Sesc, 2017). Diz não gostar de dar aula. Fez individuais na Galeria Achei (1968), na Galeria Bonino (1976) e no Museu da Casa Brasileira (2003); a Salon 94 cita também uma individual no MASP em 1975. Recebeu a Ordem do Sol Nascente em 2021 e hoje é representada pela Salon 94 (Nova York e Paris).',
    caracteristicas: ['Noborigama', 'Esmaltes de cinza', 'Torno manual', 'Tradição japonesa no Brasil'],
    afinidade: 'A ponte entre a cerâmica japonesa e o Brasil: alta temperatura e queima a lenha em Cotia.',
    analise: {
      formas: 'Tigelas, potes, vasos e chawan.',
      paleta: 'Tons de terra, verdes e cinzas de esmalte de cinza.',
      texturas: 'Incisões simbólicas, escorridos de cinza.',
    },
    processos: [
      v('Queima', 'Forno noborigama (de câmaras, a lenha) construído em Cotia com tijolos reaproveitados.', SUZ_S94),
      v('Esmaltes', 'Esmaltes de cinza e argilas locais; tons de terra e incisões simbólicas.', SUZ_S94),
      v('Torneamento', 'Torno manual.', SUZ_SESC),
    ],
    estudar: ['Esmaltes de cinza com cinzas locais.', 'O noborigama no Brasil.', 'Torno manual e ritmo lento.'],
    falas: [
      fala('O barro é vida... e pode ser espírito, também!', 'O barro é vida... e pode ser espírito, também!', SUZ_SESC, 'Sesc São Paulo (2017)'),
      fala('Vim para o Brasil trazendo tudo o que aprendi no Japão.', 'Vim para o Brasil trazendo tudo o que aprendi no Japão', SUZ_SESC, 'Sesc São Paulo (2017)'),
      fala('Acho que cheguei ao que queria.', 'Acho que cheguei ao que queria.', SUZ_SESC, 'Sesc São Paulo (2017)'),
      fala('Eu nunca pensei em ter um nome.', 'Eu nunca pensei, por exemplo, nome, eu nunca pensei em ter um nome.', SUZ_SESC, 'Sesc São Paulo (2017)'),
    ],
    publicacoes: [f('Liliana Morais, "Suzuki Shoko: relato da trajetória de vida de uma mulher ceramista entre o Brasil e o Japão" — Estudos Japoneses 32', 'https://revistas.usp.br/ej/article/view/143103', 'Artigos', '2012'), f('O barro é vida e pode ser espírito também — Sesc São Paulo', SUZ_SESC, 'Entrevistas', '2017'), f('Tocar a Terra — Instituto Tomie Ohtake', undefined, 'Exposições', '2024')],
    fontes: [f('Salon 94', SUZ_S94, 'Galerias'), f('Ocula', SUZ_OC, 'Galerias'), f('Sesc São Paulo', SUZ_SESC, 'Entrevistas')],
    tecnicas: ['Torno manual', 'Incisão'], materiais: ['Grés', 'Argilas locais'], esmaltes: ['Cinza'], queimas: ['Noborigama a lenha', 'Alta temperatura'], tiposObra: ['Tigelas', 'Potes', 'Vasos'], esteticas: ['Tradição japonesa', 'Terrosa'],
    tags: ['brasil', 'japão', 'nipo-brasileira', 'queima a lenha'],
  }],
  ['art-yuasa', {
    ...vazio, relacionados: ['art-shokosuzuki', 'art-kiminii'],
    nome: 'Megumi Yuasa', pais: ['Brasil'], atuacao: 'São Paulo', nascimento: '1938, São Paulo',
    especialidade: 'Escultura cerâmica com metais e pintura',
    linguagem: 'Cerâmica escultórica que parte da tradição japonesa e se afasta dela, incorporando metais e pintura.',
    bio: 'Nasceu em São Paulo em 1938 e começou na cerâmica em 1964 (Ocula). Em 1965 foi para uma fazenda em Goiás com a companheira, Naoko Yuasa, onde aprendeu a técnica. Em 1971 passou seis meses na Escola Brasil, a convite do pintor Luiz Paulo Baravelli. Em 1979 o casal comprou um terreno em Vila Campestre, na zona sul de São Paulo, e construiu um forno a lenha e diesel; no mesmo ano ele começou a dar aulas de cerâmica, depois também na Universidade de Caxias do Sul (1982) e no MARGS (1984).\n\nDe 1988 a cerca de 2008 o casal manteve um núcleo artístico na fábrica Cerâmica Aruan, em Itu, ensinando o ofício a jovens operários. Participou das 13ª e 14ª Bienais de São Paulo (1975 e 1977) e ganhou o prêmio da APCA de escultura em 1988. Em 2024 a Gomide&Co fez a primeira individual dele desde 1998, "entre terras", concebida por Alexandre da Cunha e Rachel Hoshino (Ocula).',
    caracteristicas: ['Escultura cerâmica', 'Metais e pintura', 'Ensino'],
    afinidade: 'A cerâmica nipo-brasileira que sai do pote e vira escultura.',
    processos: [
      v('Queima', 'Forno a lenha e diesel, construído em 1979 em Vila Campestre.', YUA_OC),
      v('Materiais', 'Cerâmica com metais e pintura.', YUA_OC),
    ],
    estudar: ['Cerâmica com metal.', 'Ensino em fábrica (Cerâmica Aruan, Itu).'],
    publicacoes: [f('entre terras — Gomide&Co', undefined, 'Exposições', '2024'), f('O Curso do Sol — Gomide&Co', undefined, 'Exposições', '2023'), f('13ª Bienal de São Paulo', undefined, 'Exposições', '1975')],
    fontes: [f('Ocula (Gomide&Co)', YUA_OC, 'Galerias')],
    tecnicas: ['Escultura'], materiais: ['Cerâmica', 'Metais', 'Tinta'], queimas: ['Forno a lenha e diesel'], tiposObra: ['Esculturas'], esteticas: ['Escultórica'],
    tags: ['brasil', 'nipo-brasileira', 'escultura'],
  }],
  ['art-kiminii', {
    ...vazio, relacionados: ['art-shokosuzuki', 'art-yuasa'],
    nome: 'Kimi Nii', pais: ['Japão', 'Brasil'], atuacao: 'Brasil', nascimento: 'Hiroshima (o MAC USP indica 1947)',
    especialidade: 'Escultura cerâmica',
    linguagem: 'Escultura cerâmica; o MAC USP guarda a "Esfera com Fendas" (1992).',
    bio: 'Fontes públicas escassas. O acervo do MAC USP registra nascimento em Hiroshima, com a data 1947, e residência no Brasil, e guarda a escultura "Esfera com Fendas" (1992, cerâmica, 40 × 44 × 44 cm), doada pela artista em 1994 e exposta no jardim interno do anexo da Cidade Universitária de 1991 a 2017. O trabalho também esteve nas exposições "Hiroshima, 1945/2005 – Testemunhos e Diálogos" (2005) e "A Presença Japonesa na Arte Brasileira: da Figura à Abstração" (2008), no MAC USP.\n\nNão encontramos biografia, formação, técnica ou falas em fontes confiáveis; o estudo fica aberto para você completar.',
    caracteristicas: ['Escultura cerâmica', 'Forma esférica'],
    afinidade: 'Mais uma voz da cerâmica nipo-brasileira, ainda pouco documentada.',
    fontes: [f('MAC USP — acervo', NII_E, 'Museus')],
    tecnicas: ['Escultura'], materiais: ['Cerâmica'], tiposObra: ['Esculturas'],
    tags: ['brasil', 'japão', 'nipo-brasileira', 'pouco documentado'],
  }],
  ['art-tostes', {
    ...vazio, relacionados: ['art-brennand', 'art-varejao'],
    nome: 'Celeida Tostes', pais: ['Brasil'], atuacao: 'Rio de Janeiro', nascimento: '26 de maio de 1929, Rio de Janeiro (morreu no Rio, 1995)',
    especialidade: 'Barro como corpo, performance e ensino coletivo',
    linguagem: 'Esculturas, mós, bastões e instalações de barro, de objetos pequenos amassados à mão a grandes peças, e a performance "Passagem" (1979), em que se cobriu de barro dentro de um grande pote.',
    bio: 'Nasceu no Rio de Janeiro em 1929. Estudou gravura com Oswaldo Goeldi na Escola Nacional de Belas Artes e se formou professora de desenho em 1957 (Wikipedia; La Escuela). Em 1958–60 estudou nos Estados Unidos, na USC e na New Mexico Highlands University, e estagiou com a ceramista Maria Martinez, de San Ildefonso, o que a levou ao barro (Hammer Museum). Em 1975 foi bolsista do British Council na escola de arte de Cardiff.\n\nEnsinou esmalte sobre metal no INEP/MEC a partir de 1960 e dirigiu a oficina de artes do fogo da Escola de Artes Visuais do Parque Lage (1975–1989). A partir de 1980, por cerca de 15 anos, ensinou cerâmica a moradores do Morro do Chapéu Mangueira; também trabalhou com mulheres presas (1978) e num projeto de azulejos em São Luís (1979) (La Escuela). Fazia esmaltes com folhas e capim. Em 1979 fez "Passagem", registrada em 21 fotografias de Henry Stahl. Ganhou o prêmio Gustavo Capanema no 5º Salão Nacional (1982). Em 1990 fundou o ateliê coletivo Casarão da Lapa com Angelo Venosa, Luiz Pizarro e Maurício Bentes. Morreu em 1995.',
    caracteristicas: ['Barro como corpo', 'Performance', 'Ensino comunitário', 'Mós e bastões'],
    afinidade: 'O barro como experiência do corpo e da comunidade, mais do que como objeto.',
    analise: {
      formas: 'Mós, bastões, guardiões, "amassadinhos" (bolinhas apertadas na mão), muros e aldeias.',
      paleta: 'Cores do barro cru e queimado.',
      reconhecivel: 'Instalações de muitos objetos de barro amassados à mão, e a performance "Passagem".',
    },
    processos: [
      v('Esmaltes', 'Esmaltes feitos com folhas de árvores e capim.', TOS_LE),
      v('Ideia', '"Passagem" (1979): performance registrada em 21 fotografias, feita na casa dela em Botafogo.', TOS_PASS),
      v('Pesquisa', 'Estágio com Maria Martinez (San Ildefonso), que a levou ao barro.', TOS_HAM),
    ],
    estudar: ['Esmalte de cinzas de folhas e capim.', 'Objetos amassados na mão em grande quantidade.', 'Ensino de cerâmica como prática coletiva.', 'A performance "Passagem".'],
    falas: [fala('Uma tentativa de voltar ao útero de uma mãe que ela nunca conheceu.', 'an attempt to return to the womb of a mother she never knew.', TOS_PASS, 'Hammer Museum (sobre "Passagem")')],
    series: [{ nome: 'Mós' }, { nome: 'Bastões' }, { nome: 'Guardiões' }, { nome: 'Amassadinhos' }],
    publicacoes: [f('Marcus de Lontra Costa e Raquel Silva (org.), Celeida Tostes (Memória Visual)', undefined, 'Catálogos', '2014'), f('Celeida Tostes: Artes do fogo, do sal e da paixão — CCBB Rio', undefined, 'Exposições', '2003'), f('Cristiana Tejo, The radical pedagogy of Celeida Tostes — La Escuela', TOS_LE, 'Artigos'), f('Radical Women: Latin American Art, 1960–1985 — Hammer Museum', TOS_HAM, 'Exposições', '2017')],
    fontes: [f('Hammer Museum', TOS_HAM, 'Museus'), f('Wikipedia', `${WP}Celeida_Tostes`, 'Enciclopédias'), f('La Escuela', TOS_LE, 'Artigos')],
    tecnicas: ['Modelagem', 'Performance', 'Instalação'], materiais: ['Barro'], esmaltes: ['Cinza de folhas e capim'], tiposObra: ['Esculturas', 'Instalações', 'Performance'], esteticas: ['Corporal', 'Ritual', 'Terrosa'],
    tags: ['brasil', 'performance', 'ensino', 'referência histórica'],
  }],
  ['art-hannahsimpson', {
    ...vazio, relacionados: ['art-kurihara', 'art-isabelsanchez', 'art-lottastudio'],
    nome: 'Hannah Simpson', pais: ['Reino Unido'], atuacao: 'Londres (Hannah Simpson Studio, desde 2020)',
    especialidade: 'Esculturas de "monstros" de grés modeladas à mão, pintadas com engobe e esmalte brilhante; também luminárias e vasos',
    linguagem: 'Criaturas bem-humoradas, de olhos saltados e bocas cheias de dentes, com superfícies muito trabalhadas: xadrez, pontilhado, "pelagem" de pingos de barro. Cores fortes e alegres.',
    bio: 'Artista e designer baseada em Londres. Estudou Belas Artes (escultura) na Loughborough University, com mostra de formatura em 2019, e fez estágio com o designer espanhol Nacho Carbonell, onde tomou gosto pelo design de móveis (Cluster; The Invisible Collection). Ainda na faculdade já fazia "monstros", só que de gesso e pelúcia.\n\nPassou ao barro depois de formada e aprendeu cerâmica sozinha durante a pandemia de Covid-19 (The Invisible Collection). Abriu o Hannah Simpson Studio em 2020 (Ad Lib Gallery). Os monstros são, para ela, a forma concreta de pensamentos difíceis e emoções negativas, transformados em seres acessíveis e engraçados (Ad Lib). Depois ampliou para luminárias e objetos da casa, pela ideia de que formas coloridas e alegres fazem bem à saúde mental (London Design Festival).\n\nFoi expositora da Cluster Crafts (2022), participou da Royal Academy Summer Exhibition (2024), do pop-up de Selfridges (2023) e da Affordable Art Fair, e é representada pela Ad Lib Gallery, em Wimbledon. Vende pela 1stdibs desde 2022.',
    caracteristicas: ['Monstros', 'Olhos saltados', 'Padrões pintados (xadrez, pontilhado)', 'Textura aplicada', 'Humor'],
    afinidade: 'Do mesmo campo de Kaori Kurihara e Isabel Sánchez: figura engraçada de cerâmica, com cor e padrão fazendo o personagem.',
    analise: {
      formas: 'Corpos de pé sobre pernas grossas, antenas com olhos, bocas abertas; também potes com tampa e vasos.',
      paleta: 'Laranja, verde-claro com vinho, amarelo pontilhado, azul-cobalto, rosa fosco com roxo brilhante.',
      texturas: 'Superfícies cobertas de pingos e gotas de barro (como pelo), ou lisas e pintadas em xadrez e pontos.',
      reconhecivel: 'Olhos brancos redondos com pupila preta e bocas largas cheias de dentes brancos.',
    },
    processos: [
      v('Construção', 'Peças construídas à mão em grés; também terracota nas luminárias.', 'https://adlibgallery.squarespace.com/hannah-simpson'),
      v('Superfície', 'Decoradas à mão com engobe (underglaze) e esmalte brilhante; em algumas, lustre de ouro 24 quilates pintado à mão.', 'https://adlibgallery.squarespace.com/hannah-simpson'),
      v('Tempo', 'Cada etapa é minuciosa e demorada; uma peça costuma levar semanas.', 'https://adlibgallery.squarespace.com/hannah-simpson'),
    ],
    estudar: ['Personagem resolvido pela superfície: o mesmo corpo vira outro bicho com outro padrão.', 'Textura de "pelo" feita com pingos de barro aplicados.', 'Engobe pintado à mão sob esmalte brilhante.', 'Olhos e dentes como assinatura.'],
    falas: [
      fala('Meu trabalho quer trazer algo incomum para o nosso dia a dia.', 'My work aims to bring something unusual into our daily lives.', 'https://www.cluster-london.com/hannah-simpson-cluster-crafts-2022-exhibitor', 'Cluster'),
      fala('Meu trabalho muitas vezes faz as pessoas rirem por instinto, ou quererem esticar a mão e tocar a superfície.', 'My work often makes people instinctively laugh, or want to reach out and try to touch the surface.', 'https://www.cluster-london.com/hannah-simpson-cluster-crafts-2022-exhibitor', 'Cluster'),
      fala('A ideia de brincadeira e alegria é o sentimento que quero criar com a minha arte.', 'The idea of play and joy is the feeling that I want to create with my art', 'https://artshow2019.lboro.ac.uk/students/hannah-simpson/', 'Loughborough Degree Show 2019'),
    ],
    publicacoes: [f('Royal Academy Summer Exhibition', undefined, 'Exposições', '2024'), f('Cluster Crafts', 'https://www.cluster-london.com/hannah-simpson-cluster-crafts-2022-exhibitor', 'Exposições', '2022')],
    fontes: [f('Site do estúdio', 'https://hannahsimpsonstudio.com/', 'Site oficial'), f('Ad Lib Gallery', 'https://adlibgallery.squarespace.com/hannah-simpson', 'Galerias'), f('London Design Festival', 'https://londondesignfestival.com/partners/hannah-simpson-studio', 'Feiras'), f('The Invisible Collection', 'https://theinvisiblecollection.com/clubroom-designers/hannah-simpson-studio', 'Lojas'), f('1stdibs', 'https://www.1stdibs.com/creators/hannah-simpson-studio/furniture', 'Lojas')],
    site: 'https://hannahsimpsonstudio.com/', instagram: 'hannahsimpsonstudio',
    retrato: 'https://images.squarespace-cdn.com/content/v1/53f4a27ae4b0d19096402194/8a8d35bd-688c-4f01-87e4-fe43dcd8d0df/hannah-simpson-artist-ad-lib-gallery.jpeg',
    tecnicas: ['Modelagem manual', 'Pintura com engobe', 'Textura aplicada'], materiais: ['Grés', 'Terracota', 'Engobe', 'Lustre de ouro'], esmaltes: ['Esmalte brilhante'], tiposObra: ['Esculturas', 'Luminárias', 'Vasos', 'Potes com tampa'], esteticas: ['Bem-humorada', 'Colorida', 'Pop', 'Figurativa'],
    tags: ['reino unido', 'escultura', 'monstros', 'cor'],
  }],
]

export const OBRAS_LEVA2: [string, O][] = [
  ['obra-hamada-chawan', { artistaId: 'art-hamada', titulo: 'Chawan (tigela de chá)', ano: 'c. 1965', materiais: 'Grés queimado em redução', imagem: 'https://media.tate.org.uk/art/images/work/T/T12/T12095_7.jpg', fonte: 'https://www.tate.org.uk/art/artworks/hamada-tea-bowl-t12095', credito: 'Tate (T12095)' }],
  ['obra-hamada-prato', { artistaId: 'art-hamada', titulo: 'Prato quadrado', ano: 'c. 1960', materiais: 'Grés queimado em redução', imagem: 'https://media.tate.org.uk/art/images/work/T/T12/T12096_7.jpg', fonte: 'https://www.tate.org.uk/art/artworks/hamada-square-dish-t12096', credito: 'Tate (T12096)' }],
  ['obra-hamada-yunomi', { artistaId: 'art-hamada', titulo: 'Yunomi', ano: 'c. 1955', imagem: 'https://media.tate.org.uk/art/images/work/T/T12/T12108_7.jpg', fonte: 'https://www.tate.org.uk/art/artworks/hamada-yunomi-t12108', credito: 'Tate (T12108)' }],
  ['obra-kawai-celadon-1924', { artistaId: 'art-kawai', titulo: 'Vaso de celadon com figura vermelho-sangue', ano: '1924', materiais: 'Porcelana celadon', fonte: KAW_B, credito: 'Britannica' }],
  ['obra-kawai-1937', { artistaId: 'art-kawai', titulo: 'Pote com capim e flores em vermelho de cobre e preto de ferro', ano: '1937', fonte: KAW_B, credito: 'Britannica' }],
  ['obra-rosanjin-caranguejo', { artistaId: 'art-rosanjin', titulo: 'Pratos com caranguejo pintado, Oribe', ano: '1957', materiais: 'Grés', esmaltacao: 'Oribe', imagem: 'https://www.momat.go.jp/craft-museum/wp-content/uploads/sites/2/2025/03/C0161007.jpg', fonte: 'https://www.momat.go.jp/craft-museum/en/collection/cr1220', credito: 'National Crafts Museum, Kanazawa (Cr1220)' }],
  ['obra-rosanjin-peonia', { artistaId: 'art-rosanjin', titulo: 'Tigela com peônias, esmaltes sobre vidrado', ano: 'c. 1935', materiais: 'Porcelana', imagem: 'https://www.momat.go.jp/craft-museum/wp-content/uploads/sites/2/2023/02/C0116006.jpg', fonte: 'https://www.momat.go.jp/craft-museum/en/collection/cr0072', credito: 'National Crafts Museum, Kanazawa (Cr0072)' }],
  ['obra-rosanjin-camelias', { artistaId: 'art-rosanjin', titulo: 'Tigela com camélias vermelhas e brancas', ano: 'c. 1940', dimensoes: '11,4 × 22,2 cm', materiais: 'Grés esmaltado', imagem: 'https://static-assets.artlogic.net/w_1600,h_1600,c_limit,f_auto,fl_lossy,q_auto/ws-artlogicwebsiteee0006/usr/images/feature_panels/images_and_objects/3742/11910-image.jpg', fonte: ROS_M, credito: 'Joan B Mirviss' }],
  ['obra-rosanjin-bambu', { artistaId: 'art-rosanjin', titulo: 'Cinco pratos com bambu na neve', ano: '1928', dimensoes: '3,5 × 19 × 17,8 cm', materiais: 'Grés esmaltado', fonte: 'https://artistproject.metmuseum.org/art/collection/search/853156', credito: 'Metropolitan Museum (2021.223a-e)', notas: 'Feitos à mão no estilo de Ogata Kenzan e da escola Rinpa.' }],
  ['obra-price-redegg', { artistaId: 'art-price', titulo: 'Red Egg', ano: '1968', dimensoes: '34,3 × 40,6 × 36,2 cm', materiais: 'Barro queimado e pintado', imagem: 'https://www.glenstone.org/medias/azure-54989.jpg?format=jpg&quality=80&width=1000', fonte: 'https://www.glenstone.org/artworks/red-egg', credito: 'Glenstone (© Estate of Ken Price, foto Fredrik Nilsen)' }],
  ['obra-price-california', { artistaId: 'art-price', titulo: 'California Cup', ano: '1991', materiais: 'Faiança esmaltada', fonte: 'https://www.nga.gov/artists/5562-ken-price', credito: 'National Gallery of Art (2015.23.2)' }],
  ['obra-kiminii-esfera', { artistaId: 'art-kiminii', titulo: 'Esfera com Fendas', ano: '1992', dimensoes: '40 × 44 × 44 cm', materiais: 'Cerâmica', fonte: 'https://acervo.mac.usp.br/acervo/index.php/Detail/objects/22064/lang/en_US', credito: 'MAC USP (1994.17.1), doação da artista' }],
  ['obra-tostes-passagem', { artistaId: 'art-tostes', titulo: 'Passagem', ano: '1979', tecnica: 'Performance registrada em 21 fotografias (Henry Stahl)', imagem: 'https://hammer.ucla.edu/sites/default/files/styles/archive_artwork/public/migrated-assets/media/Digital_archives/Radical_Women/Art/tostes_celeida_passagem.jpg?itok=l7OWh3m5', fonte: TOS_PASS, credito: 'Hammer Museum (Raquel Silva / Projeto Celeida Tostes)' }],
  // Fotos que faltavam na primeira leva
  ['obra-sottsass-shiva-met', { artistaId: 'art-sottsass', titulo: 'Vaso Shiva', ano: '1973', dimensoes: '23,8 × 18 × 7,4 cm', materiais: 'Cerâmica', imagem: 'https://collectionapi.metmuseum.org/api/collection/v1/iiif/739872/2263807/restricted', fonte: 'https://metmuseum.org/art/collection/search/739872', credito: 'Metropolitan Museum (2017.204), imagem de uso restrito' }],
  ['obra-hannahsimpson-tony', { artistaId: 'art-hannahsimpson', titulo: 'Tony (monstro)', ano: '2024', dimensoes: '54 × 30 × 15 cm', materiais: 'Cerâmica esmaltada, pintada à mão', imagem: 'https://a.1stdibscdn.com/tony-monster-sculpture-for-sale/f_67452/f_426825921733926592603/f_42682592_1733926593045_bg_processed.jpg', fonte: 'https://www.1stdibs.com/furniture/decorative-objects/sculptures/abstract-sculptures/tony-monster-sculpture/id-f_42682592', credito: 'Hannah Simpson Studio, via 1stdibs' }],
  ['obra-hannahsimpson-sylvia', { artistaId: 'art-hannahsimpson', titulo: 'Sylvia (monstro)', ano: '2024', dimensoes: '40 × 30 × 15 cm', materiais: 'Cerâmica com esmaltes em camadas, pintada à mão', imagem: 'https://a.1stdibscdn.com/sylvia-monster-sculpture-for-sale/f_67452/f_426828121733927370523/f_42682812_1733927371050_bg_processed.jpg', fonte: 'https://www.1stdibs.com/furniture/decorative-objects/sculptures/abstract-sculptures/sylvia-monster-sculpture/id-f_42682812', credito: 'Hannah Simpson Studio, via 1stdibs' }],
  ['obra-hannahsimpson-octopus', { artistaId: 'art-hannahsimpson', titulo: 'Octopus (monstro com tampa)', ano: '2022', dimensoes: '14 × 16 × 7 cm', materiais: 'Cerâmica rosa fosca com pintas roxas brilhantes; tampa removível', imagem: 'https://a.1stdibscdn.com/octopus-monster-sculpture-for-sale/f_67452/f_320624221672916037026/f_32062422_1672916037655_bg_processed.jpg', fonte: 'https://www.1stdibs.com/furniture/dining-entertaining/ceramics/octopus-monster-sculpture/id-f_32062422', credito: 'Hannah Simpson Studio, via 1stdibs' }],
  ['obra-hannahsimpson-bouquet', { artistaId: 'art-hannahsimpson', titulo: 'Monster Bouquet Vase', ano: '2024', dimensoes: '12,5 × 11 cm', materiais: 'Cerâmica pintada à mão com monstros, esmalte brilhante', imagem: 'https://a.1stdibscdn.com/monster-bouquet-vase-for-sale/f_67452/f_412613721724945422402/f_41261372_1724945422789_bg_processed.jpg', fonte: 'https://www.1stdibs.com/furniture/decorative-objects/sculptures/abstract-sculptures/monster-bouquet-vase/id-f_41261372', credito: 'Hannah Simpson Studio, via 1stdibs' }],
  ['obra-hannahsimpson-malvern', { artistaId: 'art-hannahsimpson', titulo: 'Malvern Table Lamp', ano: '2022', materiais: 'Terracota', imagem: 'https://images.squarespace-cdn.com/content/v1/5c5886f38d97401ca529db8a/b9098e15-7e25-4331-bc44-6b0a76f49e3e/Picture+1.png', fonte: 'https://www.cluster-london.com/hannah-simpson-cluster-crafts-2022-exhibitor', credito: 'Cluster Crafts 2022' }],
  ['obra-hannahsimpson-marge', { artistaId: 'art-hannahsimpson', titulo: 'Marge (monstro)', imagem: 'https://images.squarespace-cdn.com/content/v1/5c5886f38d97401ca529db8a/b8a22df0-4a92-4f51-be2a-6445561796d9/Marge+Monster+Sculpture4.png', fonte: 'https://www.cluster-london.com/hannah-simpson-cluster-crafts-2022-exhibitor', credito: 'Cluster Crafts 2022' }],
  ['obra-hannahsimpson-tony2019', { artistaId: 'art-hannahsimpson', titulo: 'Tony (trabalho de formatura)', ano: '2019', dimensoes: '130 × 110 cm', materiais: 'Gesso e pelúcia, com janela iluminada (não é cerâmica)', imagem: 'https://artshow2019.lboro.ac.uk/wp-content/uploads/2019/06/5328863-1100x879.png', fonte: 'https://artshow2019.lboro.ac.uk/students/hannah-simpson/', credito: 'Loughborough University, Degree Show 2019' }],
]

export const CAPAS_LEVA2: Record<string, string> = {
  'art-hamada': 'obra-hamada-chawan', 'art-rosanjin': 'obra-rosanjin-caranguejo', 'art-price': 'obra-price-redegg', 'art-tostes': 'obra-tostes-passagem',
  'art-hannahsimpson': 'obra-hannahsimpson-tony',
}

const HFI = 'https://hfgnext.s3.eu-west-3.amazonaws.com/img'
const VA = (id: string) => `https://framemark.vam.ac.uk/collections/${id}/full/!600,/0/default.jpg`
/** Fotos e dados que faltavam em obras já semeadas (entram também nas instalações novas). */
export const AJUSTES_OBRAS: Record<string, Partial<O>> = {
  'obra-kuramatsu-f3aj': { imagem: `${HFI}/4YLTG0000002r9u4AA-null.jpg`, notas: 'Vaso de porcelana rosa em nerikomi.' },
  'obra-kuramatsu-f3ak': { imagem: `${HFI}/4YLTG0000002rMn4AI-null.jpg`, notas: 'Tigela decorativa de porcelana.' },
  'obra-kuramatsu-f3al': { imagem: `${HFI}/4YLTG0000002rOP4AY-null.jpg`, notas: 'Tigela decorativa de porcelana em nerikomi.' },
  'obra-kuramatsu-f3an': { imagem: `${HFI}/4YLTG0000002rRd4AI-null.jpg`, notas: 'Pratinho de porcelana em nerikomi.' },
  'obra-kuramatsu-f3am': { imagem: `${HFI}/4YLTG0000002rQ14AI-null.jpg`, notas: 'Vaso de porcelana em nerikomi.' },
  'obra-rie-bule-1951': { imagem: VA('2006AN7816'), dimensoes: '16 × 22,7 cm', materiais: 'Grés, esmalte preto por fora e branco por dentro, alça de junco' },
  'obra-rie-tigela-1955': { imagem: VA('2006AN7792'), dimensoes: '9,6 × 25,5 cm', materiais: 'Porcelana, faixas de manganês e branco, decoração incisa' },
  'obra-rie-garrafa-1979': { imagem: VA('2007BR3931'), dimensoes: '38 × 17 × 17 cm', materiais: 'Grés com esmalte crateroso em espirais rosa, cinza e marrom' },
  'obra-woodman-hydrangea': { imagem: 'https://whitneymedia.org/assets/artwork/44868/2014_90a-b_vw1_cropped.jpg', dimensoes: '72,7 × 43,2 × 19,1 cm', materiais: 'Faiança esmaltada' },
  'obra-woodman-balustrade': { imagem: 'https://whitneymedia.org/assets/artwork/33611/2008_129_cropped.jpg', dimensoes: '76,2 × 112,7 cm (folha)', materiais: 'Monotipia e colagem (obra sobre papel)' },
  'obra-matsui-obachi-1972': { imagem: 'https://collectionapi.metmuseum.org/api/collection/v1/iiif/843266/1958280/restricted', notas: 'Faixas em preto e branco. Imagem de uso restrito do Met.' },
}
