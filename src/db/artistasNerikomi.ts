import type { Artista, Obra, Processo, Fonte } from './schema'

/**
 * Estudos de artistas de nerikomi / neriage (argila colorida na massa).
 * Fontes conferidas em 26/11/2026 em museus, galerias, Homo Faber, Ceramics Monthly e sites oficiais.
 * Regra da casa: o que não está numa fonte fica vazio; conflitos entre fontes aparecem no texto.
 */
const v = (tema: string, texto: string, fonte?: string): Processo => ({ tema, texto, certeza: 'verificado', fonte })
const leitura = (tema: string, texto: string): Processo => ({ tema, texto, certeza: 'interpretacao' })
const f = (titulo: string, url?: string, tipo?: string, ano?: string): Fonte => ({ titulo, url, tipo, ano })

type A = Omit<Artista, 'id' | 'criadoEm' | 'atualizadoEm' | 'excluido' | 'favorito' | 'origem' | 'revisadoEm' | 'relacionados'> & { relacionados?: string[] }
type O = Omit<Obra, 'id' | 'criadoEm' | 'atualizadoEm' | 'excluido' | 'favorito' | 'tags'> & { tags?: string[] }
const vazio = { tecnicas: [], materiais: [], esmaltes: [], queimas: [], esteticas: [], tiposObra: [], tags: [], publicacoes: [], fontes: [], estudar: [], processos: [], caracteristicas: [] }

const NERIKOMI = ['art-matsui-kosei', 'art-hoadley', 'art-feibleman', 'art-maeda', 'art-tenkortenaar', 'art-kuramatsu', 'art-joris', 'art-rapaport']
const outros = (id: string) => NERIKOMI.filter((x) => x !== id)

const HF = 'https://www.homofaber.com/en'
const CM_MAEDA = 'https://ceramicartsnetwork.org/ceramics-monthly/ceramics-monthly-article/Simple-Elegance-with-Eiko-Maeda-208523'
const CM_MARIA = 'https://ceramicartsnetwork.org/ceramics-monthly/ceramics-monthly-article/working-potter-maria-ten-kortenaar'
const MIRV = 'https://artlogicwebsiteee0006.web-eu-060.artlogic.net/artists/144-matsui-ksei/biography'

export const ARTISTAS_NERIKOMI: [string, A][] = [
  ['art-matsui-kosei', {
    ...vazio, relacionados: outros('art-matsui-kosei'),
    nome: 'Matsui Kosei', nomeOriginal: '松井 康成', pais: ['Japão'], atuacao: 'Templo Gessō-ji, Kasama (Ibaraki)', nascimento: '1927, província de Nagano (morreu em 2003)',
    especialidade: 'Neriage (練上): grés marmorizado com argilas coloridas',
    linguagem: 'Potes e tigelas de grés em que o desenho está na própria massa: faixas, mármores e flores feitos de argilas coloridas sobrepostas, às vezes com a superfície raspada e fissurada.',
    bio: 'Nasceu em 1927 na província de Nagano e formou-se em Letras na Universidade Meiji em 1952 (Joan B Mirviss). Em 1957 tornou-se sacerdote-chefe do templo Gessō-ji, em Kasama: a Mirviss e o Met dizem que foi o 24º; a Kuroda Tōen diz o 23º. Em 1960 construiu um forno no terreno do templo (Mirviss).\n\nEstudou cerâmica antiga da China, da Coreia e do Japão, fazendo réplicas, e depois trabalhou com Tamura Kōichi (Mirviss dá 1967; o Met e o V&A dizem "fim dos anos 1960"). Entrou na Nihon Kōgeikai em 1971, ganhou o prêmio de ouro da Japan Ceramic Society em 1990 e foi declarado Tesouro Nacional Vivo pelo neriage em 1993 (Mirviss, Met, V&A, Kuroda Tōen). Morreu em 2003. O Met e o V&A lembram que a técnica vem da China dos Tang e dos fornos de Cizhou na dinastia Song. Em 2013 o New Otani Art Museum, em Tóquio, fez uma retrospectiva com ferramentas e fotografias dele (Japan Times).',
    caracteristicas: ['Neriage', 'Grés marmorizado', 'Superfície raspada e fissurada', 'Potes grandes (tsubo)'],
    afinidade: 'O mestre japonês do neriage: o desenho não é pintado, é construído com a argila colorida e revelado pelo torno e pela raspagem.',
    analise: {
      formas: 'Potes globulares (tsubo), tigelas grandes, copos de saquê e de chá.',
      paleta: 'Preto e branco em faixas, azuis e cinzas em flores, tons de terra.',
      texturas: 'Superfícies lisas e outras raspadas com escova de arame ou pente, que abrem fissuras.',
      reconhecivel: 'Potes grandes em que o padrão colorido atravessa a parede inteira da peça.',
    },
    processos: [
      v('Argila colorida', 'Neriage (練上): argilas de cores diferentes sobrepostas e trabalhadas juntas, em grés.', 'https://www.metmuseum.org/en/art/collection/search/843266'),
      v('Superfície', 'Shōretsu (嘯裂): esfregar a superfície da argila com escova de arame ou pente.', MIRV),
      v('Torneamento', 'Shōretsu (象裂): duas ou três camadas de argila em volta de um tubo no torno, superfície penteada e o torno girando, o que abre fissuras.', MIRV),
      leitura('Queima', 'As fontes consultadas não dizem o tipo de forno nem a temperatura.'),
    ],
    estudar: ['Como empilhar argilas coloridas sem trincar na secagem.', 'A raspagem com escova e pente para revelar o padrão.', 'Neriage no torno com camadas em volta de um tubo.', 'Réplicas de peças antigas como escola de técnica.'],
    series: [{ nome: 'Shōretsu (嘯裂)', desc: 'Superfície raspada com escova ou pente.' }, { nome: 'Shōretsu (象裂)', desc: 'Camadas no torno com fissuras.' }],
    publicacoes: [
      f('Living National Treasure Matsui Kosei: A Retrospective — Japan Times', 'https://japantimes.co.jp/culture/2013/07/10/arts/openings-in-tokyo/living-national-treasure-matsui-kosei-a-retrospective', 'Exposições', '2013'),
      f('Rupert Faulkner, Japanese Studio Crafts: Tradition and the Avant-Garde (Laurence King), prancha 18', undefined, 'Catálogos', '1995'),
      f('松井康成 練上作品集 (catálogo de obras em neriage)', undefined, 'Catálogos'),
    ],
    fontes: [f('Joan B Mirviss — biografia', MIRV, 'Galerias'), f('Kuroda Tōen', 'https://www.kurodatoen.co.jp/cp_lineupcat/koseimatsui', 'Galerias'), f('The Met — Large Bowl (Ōbachi)', 'https://www.metmuseum.org/en/art/collection/search/843266', 'Museus'), f('V&A — Jar', 'https://collections.vam.ac.uk/item/O24657/jar-matsui-kosei/', 'Museus'), f('Dai Ichi Arts', 'https://www.daiichiarts.com/artworks/categories/21/4705-matsui-kosei-jar-with-marble-design-1988/', 'Galerias')],
    tecnicas: ['Neriage', 'Nerikomi', 'Torno', 'Raspagem'], materiais: ['Grés', 'Argilas coloridas'], tiposObra: ['Potes', 'Tigelas', 'Copos'], esteticas: ['Marmorizada', 'Tradição reinterpretada'],
    tags: ['japão', 'nerikomi', 'neriage', 'tesouro nacional vivo'],
  }],
  ['art-hoadley', {
    ...vazio, relacionados: outros('art-hoadley'),
    nome: 'Thomas Hoadley', pais: ['Estados Unidos'], atuacao: 'Lanesborough, Massachusetts', nascimento: '1949, North Adams, Massachusetts',
    especialidade: 'Vasos e tigelas de porcelana colorida em nerikomi, com folha de ouro',
    linguagem: 'Tigelas e vasos de parede fina e translúcida, montados com fatias de porcelana colorida em padrões geométricos e arabescos, sem esmalte, às vezes com um retângulo de folha de ouro.',
    bio: 'Nasceu em 1949 em North Adams, Massachusetts, e cresceu em New Hampshire (Smithsonian American Art Museum; Delaware Art Museum). Estudou na Skowhegan School of Painting and Sculpture (1970), formou-se no Amherst College (1971) e fez mestrado em cerâmica na Illinois State University (1977) (The Marks Project). Foi aprendiz de Malcolm Wright em Vermont, que lhe apresentou a cerâmica de Karatsu, e conheceu o nerikomi durante o mestrado (SAAM). Uma fonte diz que antes trabalhou num escritório de arquitetura em Boston (Patina Gallery).\n\nTrabalha em Lanesborough, Massachusetts. O Homo Faber diz que começou a carreira em 1973 e abriu a oficina em 1978. Faz uns 50 a 60 trabalhos por ano, e uma tigela pode levar duas semanas (SAAM; Patina). Também pinta abstrato (Delaware Art Museum). Ganhou a medalha de bronze no International Ceramics Festival Mino \'95, no Japão, uma bolsa de artista de Massachusetts e duas do NEA. Uma tigela de 1993 está na White House Collection of American Crafts (Clinton Library), e há obras no Philadelphia Museum of Art, no LACMA, no MFA Boston e na Renwick (SAAM; The Marks Project).',
    caracteristicas: ['Nerikomi em porcelana', 'Paredes finas e translúcidas', 'Sem esmalte, lixado', 'Folha de ouro'],
    afinidade: 'Nerikomi como arquitetura: o padrão e a estrutura da peça são a mesma coisa.',
    analise: {
      formas: 'Tigelas e vasos abertos, alguns com base preta circular.',
      paleta: 'Preto, branco e cinza; azuis e cinzas; acentos de folha de ouro.',
      texturas: 'Superfície fosca, lixada, sem esmalte.',
      composicao: 'Painéis retangulares e "arabescos" de fatias de nerikomi repetidas.',
      reconhecivel: 'Tigelas finas de porcelana com faixas geométricas coloridas e um pequeno retângulo dourado.',
    },
    processos: [
      v('Argila colorida', 'Porcelana branca colorida com óxidos e corantes (stains) amassados na argila úmida.', 'https://www.patina-gallery.com/blogs/artists/thomas-hoadley'),
      v('Construção manual', 'Camadas coloridas empilhadas formam "pães" (loaves), que são cortados em placas e montados, muitas vezes num molde. Pães de cerca de 4,5 kg com milhares de camadas.', 'https://americanart.si.edu/artist/thomas-hoadley-2250'),
      v('Acabamentos', 'Depois da primeira queima lixa as peças com água; elas vão à queima alta e são lixadas de novo. Quando a peça está seca, antes de queimar, passa horas lixando.', `${HF}/artisans/thomas_hoadley-ceramics-hancock_ma`),
      v('Esmaltes', 'Sem esmalte.', 'https://www.themarksproject.org/print/marks/hoadley'),
    ],
    estudar: ['O "pão" de camadas e o corte em fatias.', 'Montagem em molde de placas de nerikomi.', 'Lixar antes e depois da queima para revelar o padrão.', 'Folha de ouro como contraponto ao padrão.'],
    falas: [
      { texto: 'O mundo precisa de beleza.', original: 'The world needs beauty', fonte: `${HF}/artisans/thomas_hoadley-ceramics-hancock_ma`, veiculo: 'Homo Faber' },
      { texto: 'Aprendi a ser paciente e a levar meu tempo para criar cada trabalho com cuidado.', original: 'I have learned to be patient and to take my time in carefully creating my works.', fonte: `${HF}/artisans/thomas_hoadley-ceramics-hancock_ma`, veiculo: 'Homo Faber' },
      { texto: 'Quando as peças estão prontas e ainda secas, passo horas lixando cada uma.', original: 'When my pieces are finished and still bone dry, I spend hours sanding each one.', fonte: `${HF}/artisans/thomas_hoadley-ceramics-hancock_ma`, veiculo: 'Homo Faber' },
      { texto: 'O que primeiro me atraiu no nerikomi foi a união orgânica entre padrão e estrutura…', original: 'My initial attraction to the nerikomi technique came from its organic union of pattern and structure…', fonte: 'https://www.patina-gallery.com/blogs/artists/thomas-hoadley', veiculo: 'Patina Gallery' },
    ],
    series: [{ nome: 'Arabesque' }],
    publicacoes: [f('"Colored Clay: Pattern and Color" — The Studio Potter (artigo dele)', undefined, 'Revistas', '1994'), f('The Complete Potter: Porcelain e Contemporary Porcelain (livros que mostram o trabalho)', undefined, 'Catálogos', '1994'), f('Graceful Vessels in Space — Patina Gallery', 'https://klimt02.net/events/exhibitions/graceful-vessels-space-thomas-hoadley-patina-gallery', 'Exposições')],
    fontes: [f('Site oficial', 'https://thomashoadley.com/', 'Site oficial'), f('Homo Faber', `${HF}/artisans/thomas_hoadley-ceramics-hancock_ma`, 'Guias'), f('Smithsonian American Art Museum', 'https://americanart.si.edu/artist/thomas-hoadley-2250', 'Museus'), f('The Marks Project', 'https://www.themarksproject.org/print/marks/hoadley', 'Referência'), f('Patina Gallery', 'https://www.patina-gallery.com/blogs/artists/thomas-hoadley', 'Galerias')],
    site: 'https://thomashoadley.com/', instagram: 'thoshoadley',
    tecnicas: ['Nerikomi', 'Construção manual', 'Molde', 'Lixamento'], materiais: ['Porcelana', 'Óxidos e corantes', 'Folha de ouro'], tiposObra: ['Tigelas', 'Vasos'], esteticas: ['Geométrica', 'Gráfica'],
    tags: ['estados unidos', 'nerikomi', 'porcelana'],
  }],
  ['art-feibleman', {
    ...vazio, relacionados: outros('art-feibleman'),
    nome: 'Dorothy Feibleman', pais: ['Estados Unidos', 'Reino Unido', 'Japão'], atuacao: 'Inglaterra e Tokoname (Japão); as fontes divergem sobre a base atual', nascimento: '1951, Indianápolis',
    especialidade: 'Nerikomi em porcelana translúcida, branco sobre branco',
    linguagem: 'Peças de porcelana translúcida e sem esmalte, em que o desenho é feito com porcelanas de brancos diferentes ou de cores, laminadas e montadas.',
    bio: 'Nasceu em Indianápolis em 1951, formou-se em cerâmica (BFA) no Rochester Institute of Technology em 1973 e no mesmo ano mudou-se para a Inglaterra para montar o próprio ateliê (Wikipedia; John Michael Kohler Arts Center). O blog dela diz que, depois de 2000, abriu uma oficina independente em Tokoname, no Japão, e que continuava lá em 2019; a Wikipedia diz que vive na Inglaterra.\n\nDeu aulas e palestras nas universidades de artes de Kyoto e de Tóquio, na Tsinghua, em Jingdezhen e na RISD (JMKAC). Foi artista residente no programa Arts/Industry do Kohler em 1996 e artista convidada em Shigaraki em 1997 e 1999. Ganhou o prêmio de design INAX (1993) e, no festival de Mino, prata na seção de design (1998) e ouro (2002) (blog). Tem obras no Met, no V&A, no Museu de Stuttgart, no Ulster Museum, em Kecskemét e no museu de cerâmica de Shigaraki (Wikipedia; JMKAC). Foi jurada convidada do Great Pottery Throwdown em 2020. O blog diz que o nerikomi "branco sobre branco" translúcido não existia antes dela.',
    caracteristicas: ['Porcelana translúcida', 'Branco sobre branco', 'Sem esmalte', 'Laminação de brancos diferentes'],
    afinidade: 'O nerikomi levado ao limite da luz: o padrão aparece pela diferença entre brancos e pela translucidez.',
    analise: {
      formas: 'Tigelas, chawan, sakazuki (copinhos de saquê), joias e peças geométricas.',
      paleta: 'Brancos diferentes; também porcelanas coloridas.',
      reconhecivel: 'Porcelana muito fina, em que o desenho só aparece contra a luz.',
    },
    processos: [
      v('Argila colorida', 'Laminação de porcelanas brancas diferentes. Desde 1995 tinge cada branco com um corante que queima no forno, só para distingui-los durante o trabalho.', 'https://dorothyfeibleman.blogspot.com/2019/09'),
      v('Queima', 'Queima a porcelana sem esmalte, em areia de sílica dentro de caixas refratárias (saggars), pelo menos desde 1975.', 'https://dorothyfeibleman.blogspot.com/2019/09'),
      v('Argila', 'Em 1984 uma porcelana translúcida colorida dela foi vendida pela Podmore/Potterycrafts.', 'https://dorothyfeibleman.blogspot.com/2019/09'),
    ],
    estudar: ['Corante que queima para distinguir brancos durante a laminação.', 'Queima em areia de sílica dentro de caixa refratária.', 'Padrão pela translucidez em vez da cor.'],
    publicacoes: [f('Begin Japanology (NHK World), temporada 4', undefined, 'Vídeos', '2011'), f('"No Grout" — John Michael Kohler Arts Center', 'https://jmkac.org/?p=36894', 'Exposições', '2024'), f('Nerikomi troubleshooting (blog da artista)', 'https://dorothyfeibleman.blogspot.com/2019/09', 'Artigos', '2019')],
    fontes: [f('Wikipedia', 'https://en.wikipedia.org/wiki/Dorothy_Feibleman', 'Enciclopédias'), f('Blog da artista', 'https://dorothyfeibleman.blogspot.com/', 'Site oficial'), f('John Michael Kohler Arts Center', 'https://jmkac.org/?p=36894', 'Instituições')],
    site: 'http://www.dorothyfeibleman.com/',
    tecnicas: ['Nerikomi', 'Laminação'], materiais: ['Porcelana translúcida'], queimas: ['Queima em caixa refratária (saggar) com areia de sílica'], tiposObra: ['Tigelas', 'Chawan', 'Sakazuki', 'Joias'], esteticas: ['Minimalista', 'Geométrica'],
    tags: ['estados unidos', 'reino unido', 'nerikomi', 'porcelana'],
  }],
  ['art-maeda', {
    ...vazio, relacionados: outros('art-maeda'),
    nome: 'Eiko Maeda', pais: ['Japão', 'Canadá'], atuacao: 'Ontário (região de Toronto), Canadá', nascimento: 'Tóquio',
    especialidade: 'Tigelas e pratos de porcelana em nerikomi, com padrões florais',
    linguagem: 'Tigelas e pratos de porcelana em nerikomi, feitos à mão em molde de gesso, com flores e geometrias coloridas que atravessam a peça e ficam translúcidas.',
    bio: 'Nasceu e cresceu em Tóquio e formou-se em Belas Artes (1984) na Joshibi University of Art and Design, onde estudou laca (urushi) (Ceramics Monthly; currículo). Chegou a Montreal em 2004 como imigrante, com a filha adolescente, e estudou cerâmica no Visual Arts Center de Montreal de 2006 a 2010; depois mudou-se para a região de Toronto, em Ontário (Artaxis; currículo). Começou com grés no torno, vendido em feiras, num ateliê no porão (Ceramics Monthly).\n\nDepois de viagens ao Japão, passou ao nerikomi como aprendiz de Eiji Murofushi, em Fuji, com bolsa do Ontario Arts Council (2014) (Ceramics Monthly; Artaxis). Usava a argila japonesa de Murofushi e depois passou à porcelana Frost, da Laguna, para queimar em forno elétrico; queima em cone 6 e perde cerca de 25% de cada fornada com trincas, o que aceita em troca da translucidez (Ceramics Monthly). Ganhou o prêmio de excelência em cerâmica do Toronto Outdoor Art Fair em 2020.',
    caracteristicas: ['Nerikomi em porcelana', 'Flores e fogos de artifício', 'Molde de gesso', 'Translucidez'],
    afinidade: 'Nerikomi delicado e decorativo, de tradição japonesa, feito com recursos de ateliê pequeno e forno elétrico.',
    analise: {
      formas: 'Tigelas, pares de tigelas, pratos ovais e travessas.',
      paleta: 'Vermelho, rosa, amarelo, azul e branco.',
      composicao: 'Padrões florais e radiais, repetidos a partir de canudos (canes) cortados em fatias.',
      reconhecivel: 'Tigelas de porcelana com flores coloridas que atravessam a parede.',
    },
    processos: [
      v('Argila colorida', 'Porcelana colorida com pigmentos, corantes ou óxidos, em camadas empilhadas em placas ou rolos, dobradas, prensadas em toras, fatiadas e arranjadas.', CM_MAEDA),
      v('Modelagem', 'Faz canudos (canes) de padrão e corta fatias finas para montar as peças, em geral prensadas em moldes de gesso.', CM_MAEDA),
      v('Argila', 'Começou com a argila japonesa de Eiji Murofushi; depois passou à porcelana Frost (Laguna), para forno elétrico.', CM_MAEDA),
      v('Queima', 'Cone 6, forno elétrico. Cerca de 25% da fornada trinca.', CM_MAEDA),
    ],
    estudar: ['Canudos (canes) de padrão floral.', 'Prensar fatias em molde de gesso.', 'Porcelana de cone 6 para nerikomi em forno elétrico.', 'Aceitar perdas em troca de paredes finas.'],
    falas: [
      { texto: 'Não é só um trabalho para mim; é que eu quero mostrar quem eu sou.', original: "It's not just a job for me, it's rather that I want to show who I am.", fonte: CM_MAEDA, veiculo: 'Ceramics Monthly (2019)' },
      { texto: 'Procuro expressar a elegância, a beleza feminina, a delicadeza e a modéstia da cultura japonesa.', original: 'I strive to express the elegance, feminine beauty, delicacy, and modesty of Japanese culture.', fonte: CM_MAEDA, veiculo: 'Ceramics Monthly (2019)' },
      { texto: 'Não gosto de coisas complicadas; a vida e o mundo já são complicados demais.', original: "I don't like complicated things; life and the world are already complicated enough.", fonte: CM_MAEDA, veiculo: 'Ceramics Monthly (2019)' },
      { texto: 'O nerikomi me ensinou muitas coisas: tem muito potencial e exige muita prática.', original: 'Nerikomi has taught me many different things—it has a lot of potential, and requires a lot of practice.', fonte: CM_MAEDA, veiculo: 'Ceramics Monthly (2019)' },
      { texto: 'Me apaixonei pelo nerikomi e por suas possibilidades ilimitadas de expressão.', original: 'I fell in love with nerikomi and its unlimited possibilities of expression.', fonte: 'https://www.rosenfieldcollection.com/artist/eiko-maeda/', veiculo: 'The Rosenfield Collection' },
    ],
    publicacoes: [f('Simple Elegance with Eiko Maeda — Ceramics Monthly', CM_MAEDA, 'Revistas', '2019'), f('Meet the artist using a secret Japanese technique — CBC Arts', 'https://amp.cbc.ca/arts/exhibitionists/meet-the-artist-using-a-secret-japanese-technique-to-create-amazing-porcelain-ceramics-1.4052713', 'Vídeos')],
    fontes: [f('Site oficial', 'https://eikoceramics.jimdofree.com/', 'Site oficial'), f('Artaxis', 'https://artaxis.org/eiko-maeda/', 'Guias'), f('The Rosenfield Collection', 'https://www.rosenfieldcollection.com/artist/eiko-maeda/', 'Galerias'), f('L.A. Pai Gallery', 'https://www.lapaigallery.com/collections/eiko-maeda', 'Galerias')],
    site: 'https://eikoceramics.jimdofree.com/', instagram: 'eikoceramics',
    tecnicas: ['Nerikomi', 'Molde', 'Construção manual'], materiais: ['Porcelana'], queimas: ['Cone 6, forno elétrico'], tiposObra: ['Tigelas', 'Pratos', 'Travessas'], esteticas: ['Floral', 'Delicada'],
    tags: ['japão', 'canadá', 'nerikomi', 'porcelana'],
  }],
  ['art-tenkortenaar', {
    ...vazio, relacionados: outros('art-tenkortenaar'),
    nome: 'Maria ten Kortenaar', pais: ['Holanda'], atuacao: 'Zaandam (antes Amsterdã)', nascimento: '7 de abril de 1955, Amsterdã',
    especialidade: 'Cilindros de porcelana colorida em nerikomi, sem esmalte',
    linguagem: 'Cilindros de porcelana de Limoges colorida na massa, montados à mão com quadradinhos coloridos como tijolos, raspados até ficarem lisos e nunca esmaltados.',
    bio: 'Nasceu em Amsterdã em 1955 (currículo da AIC-IAC). Formou-se ourives na Gerrit Rietveld Academie em 1985, com o ourives e escultor Jaap de Vries; a Ceramics Monthly diz que antes foi fisioterapeuta. Começou com o barro em 1995 e é autodidata na cerâmica, com aulas de torno com Tineke van Gils e cursos com Rob Brandt, Karin Heeman, Henk Wolvers e Dorothy Feibleman (Artaxis; Ceramics Monthly). Em 2000 foi a Tokoname, no Japão, numa delegação de intercâmbio, e desde 2005 trabalha só com porcelana: a Ceramics Monthly liga a decisão ao celadon visto no Japão, o Homo Faber fala de uma viagem à China.\n\nViveu 40 anos no centro de Amsterdã e mudou-se para Zaandam por volta de 2022 (Ceramics Monthly, 2025). Faz no máximo uns 80 trabalhos por ano, e 90% das vendas passam por galerias. Ganhou o prêmio especial da 5ª Bienal Mundial de Cerâmica da Coreia (2009) e menções honrosas em Mino (2014 e 2017), e é membro da Academia Internacional de Cerâmica (AIC-IAC). Tem obras no museu de Yingge (Taipei), em Icheon, no Sanbao (Jingdezhen), em Gifu, em Yixing e na Fondation Bernardaud (Limoges).',
    caracteristicas: ['Cilindros', 'Porcelana de Limoges colorida', 'Sem esmalte', 'Montagem em "tijolinhos"'],
    afinidade: 'Nerikomi como diário: cada cilindro tem o título de uma lembrança, e a cor vem de paisagens e flores.',
    analise: {
      formas: 'Sempre cilindros.',
      paleta: 'Roxos, vermelhos, rosas, azuis de lago, laranjas de pôr do sol.',
      texturas: 'Superfície lisa, raspada à mão, sem esmalte.',
      composicao: 'Mosaicos de quadradinhos coloridos que formam flores ("Flowerbomb"), lagos e céus.',
      reconhecivel: 'Cilindros de porcelana com flores em mosaico colorido na própria massa.',
    },
    processos: [
      v('Construção manual', 'Faz uma placa colorida, corta em quadradinhos e "assenta" os quadrados como tijolos para formar cilindros. Sem torno e sem molde.', CM_MARIA),
      v('Acabamentos', 'Raspa as peças à mão com uma raspadeira de aço inox quando estão quase secas. Nunca esmalta.', CM_MARIA),
      v('Secagem', 'Seca as peças a 80 °C por seis horas antes da queima.', CM_MARIA),
      v('Queima', '1250 °C em forno elétrico. Cerca de 15% quebra e é descartado.', CM_MARIA),
      v('Argila', 'Porcelana de Limoges com pigmentos misturados na massa; outra argila é "tabu" no ateliê.', CM_MARIA),
    ],
    estudar: ['Montar cilindros com quadradinhos coloridos, como tijolos.', 'Raspagem a seco com raspadeira de inox.', 'Secagem forçada a 80 °C antes da queima.', 'Títulos como lembranças pessoais.'],
    falas: [
      { texto: 'Traduzo o que vejo, sinto ou vivo no dia a dia nas minhas obras de porcelana, como um diário.', original: 'I translate what I see, feel or experience in daily life into my porcelain artworks, like a diary.', fonte: `${HF}/artisans/ten-kortenaar-maria-rkz3br`, veiculo: 'Homo Faber' },
      { texto: 'Não é sobre tradição ou inovação, é sobre arte.', original: 'It is not about tradition or innovation, it is about art.', fonte: `${HF}/artisans/ten-kortenaar-maria-rkz3br`, veiculo: 'Homo Faber' },
      { texto: 'Nunca esmalto meu trabalho, porque meus cilindros não são vasos de flor, e sim objetos independentes.', original: 'I never glaze my work, because my cylinders are not flower vases, but independent objects.', fonte: CM_MARIA, veiculo: 'Ceramics Monthly (2025)' },
      { texto: 'A porcelana tem memória.', original: 'porcelain has a memory.', fonte: CM_MARIA, veiculo: 'Ceramics Monthly (2025)' },
      { texto: 'Meus objetos são mais arte do que artesanato.', original: 'My objects are more art than craft.', fonte: CM_MARIA, veiculo: 'Ceramics Monthly (2025)' },
    ],
    series: [{ nome: 'Flowerbomb' }, { nome: 'Reflections' }, { nome: 'Waterlily' }],
    publicacoes: [f('Working Potter: Maria ten Kortenaar — Ceramics Monthly', CM_MARIA, 'Revistas', '2025'), f('"In studio with Maria ten Kortenaar" — New Ceramics #4', undefined, 'Revistas', '2020'), f('Ceramics Art and Perception #77 (Gabi Dewald)', undefined, 'Revistas', '2009'), f('Piet Augustijn, Contemporary Dutch Ceramics', undefined, 'Catálogos', '2008')],
    fontes: [f('Site oficial', 'https://mariatenkortenaar.com/', 'Site oficial'), f('Homo Faber', `${HF}/artisans/ten-kortenaar-maria-rkz3br`, 'Guias'), f('Artaxis', 'https://artaxis.org/maria-ten-kortenaar/', 'Guias'), f('Capriolus', 'https://capriolus.nl/en/database/ceramic-artists/kortenaar-maria-ten/', 'Galerias'), f('Currículo (AIC-IAC)', 'https://www.aic-iac.org/wp-content/uploads/Biography-Maria-ten-Kortenaar.pdf', 'Instituições')],
    site: 'https://mariatenkortenaar.com/', instagram: 'mariatenkortenaar',
    tecnicas: ['Nerikomi', 'Construção manual', 'Raspagem'], materiais: ['Porcelana de Limoges', 'Pigmentos'], queimas: ['1250 °C, forno elétrico'], tiposObra: ['Cilindros', 'Objetos'], esteticas: ['Floral', 'Colorida', 'Mosaico'],
    tags: ['holanda', 'nerikomi', 'porcelana'],
  }],
  ['art-kuramatsu', {
    ...vazio, relacionados: outros('art-kuramatsu'),
    nome: 'Yuko Kuramatsu', pais: ['Japão', 'França'], atuacao: 'Poitiers, França',
    especialidade: 'Porcelana em nerikomi com motivos tradicionais japoneses',
    linguagem: 'Pratos, vasos e peças de porcelana tingida na massa, com motivos japoneses tradicionais (ameixeira na neve, asanoha, água) compostos linha a linha.',
    bio: 'Ceramista de herança franco-japonesa que trabalha em Poitiers, na França. Segundo o Homo Faber, começou a carreira em 2016 e passou a dar aulas em 2024. Usa nerikomi com porcelana tingida com óxidos, em queima de alta temperatura, e compõe os desenhos "linha a linha e peça a peça", relendo motivos, poemas e votos japoneses para o público europeu.\n\nAs obras citadas no Homo Faber são "Ameixeira coberta de neve", "Início da primavera", "Hana, Fleur", um prato com motivo asanoha e o vaso "Água que sussurra". As fontes consultadas não trazem ano de nascimento, formação, temperatura exata de queima, prêmios nem publicações; o site oficial (yukokuramatsu.com) pode ter mais.',
    caracteristicas: ['Nerikomi em porcelana', 'Motivos japoneses', 'Óxidos na massa'],
    afinidade: 'Padrões tradicionais japoneses feitos em nerikomi em vez de pintura.',
    analise: { formas: 'Pratos e vasos.', composicao: 'Motivos tradicionais japoneses (asanoha, ameixeira, água), montados linha a linha.' },
    processos: [
      v('Argila colorida', 'Porcelana tingida com óxidos, em camadas; o padrão vai de um lado a outro da peça.', `${HF}/artisans/homofaber-ffbnvk`),
      v('Queima', 'Alta temperatura (o número exato não é informado).', `${HF}/artisans/homofaber-ffbnvk`),
    ],
    estudar: ['Traduzir um padrão tradicional (asanoha) em nerikomi.', 'Compor o desenho linha a linha.'],
    falas: [
      { texto: 'Meus padrões não são pintados nem impressos: são tingidos de ponta a ponta.', original: 'My patterns are neither painted nor printed—they are tinted throughout.', fonte: `${HF}/artisans/homofaber-ffbnvk`, veiculo: 'Homo Faber' },
      { texto: 'É uma técnica muito específica e rara, que depende de usar óxidos coloridos na porcelana.', original: 'It is a very specific and rare technique that relies on using coloured oxides in porcelain.', fonte: `${HF}/artisans/homofaber-ffbnvk`, veiculo: 'Homo Faber' },
    ],
    fontes: [f('Site oficial', 'https://www.yukokuramatsu.com/', 'Site oficial'), f('Homo Faber', `${HF}/artisans/homofaber-ffbnvk`, 'Guias')],
    site: 'https://www.yukokuramatsu.com/', instagram: 'yuko_kuramatsu',
    tecnicas: ['Nerikomi'], materiais: ['Porcelana', 'Óxidos'], tiposObra: ['Pratos', 'Vasos'], esteticas: ['Tradição reinterpretada', 'Gráfica'],
    tags: ['japão', 'frança', 'nerikomi', 'porcelana'],
  }],
  ['art-joris', {
    ...vazio, relacionados: outros('art-joris'),
    nome: 'Françoise Joris', pais: ['Bélgica'], atuacao: 'Tarcienne, Bélgica', nascimento: 'República Democrática do Congo',
    especialidade: 'Tigelas finas de porcelana-papel em nerikomi',
    linguagem: 'Tigelas finas e translúcidas de porcelana com papel ou fibras, coloridas na massa, com linhas finas de cor que se encostam, se repetem e às vezes param.',
    bio: 'Nasceu na República Democrática do Congo, onde passou a infância "brincando com barro" (Homo Faber). O Homo Faber diz que começou a carreira em 2008. Ela conta que fez o percurso clássico: torno, carimbos, placas, moldes, esmaltes Shino de alta temperatura e argilas brunidas e com terra sigilata; depois de mais de dez anos de experiências chegou às tigelas finas e translúcidas, e então introduziu a cor pelo nerikomi, com adaptações próprias (JTW Ceramics).\n\nUsa porcelana com polpa de papel ou fibras de celulose ou linho, que dão corpo e maleabilidade, e queima a 1250 °C (Homo Faber; JTW). Recebeu duas menções honrosas no Concurso Internacional de Cerâmica de Mino (9ª e 11ª edições). Ano de nascimento e formação não aparecem nas fontes.',
    caracteristicas: ['Porcelana-papel', 'Paredes finas e translúcidas', 'Linhas finas de cor', 'Nerikomi adaptado'],
    afinidade: 'Nerikomi como desenho de linha: cor fina, quase gráfica, em tigelas leves que parecem tecido.',
    analise: {
      formas: 'Tigelas abertas e ondulantes, de borda irregular.',
      paleta: 'Linhas de cor sobre o branco da porcelana.',
      composicao: 'Linhas finas que se encostam, se repetem e às vezes param.',
      reconhecivel: 'Tigelas leves e onduladas com linhas coloridas finas na massa.',
    },
    processos: [
      v('Argila', 'Porcelana com polpa de papel ou fibras de celulose ou linho (não em todas as peças), para dar corpo e maleabilidade.', 'https://jtwceramics.com/2020/12/23/francoise-joris-artist-profile/'),
      v('Argila colorida', 'Porcelana colorida na massa, sem decalque nem pintura à mão; nerikomi adaptado para linhas finas de cor.', 'https://www.ceramicsnow.org/artworks/francoise-joris-nerikomi/'),
      v('Queima', '1250 °C.', `${HF}/artisans/franoise-joris-porcelain-crafting-belgium`),
    ],
    estudar: ['Porcelana-papel para paredes finas.', 'Linhas finas de cor em vez de blocos.', 'Bordas onduladas e irregulares.'],
    falas: [
      { texto: 'Tenho, desde criança, uma necessidade visceral de tocar e modelar o barro.', original: 'I have had the visceral need to touch and shape clay since my childhood,', fonte: `${HF}/artisans/franoise-joris-porcelain-crafting-belgium`, veiculo: 'Homo Faber' },
      { texto: 'Adoro o momento em que começo uma obra nova, porque não tenho um plano preconcebido.', original: 'I love the moment when I start a new artwork, because I do not have a preconceived plan.', fonte: `${HF}/artisans/franoise-joris-porcelain-crafting-belgium`, veiculo: 'Homo Faber' },
      { texto: 'Minha porcelana é colorida na massa; não há decalque nem pintura à mão.', original: 'My porcelain is colored in the mass, there is no transfer, nor coloring by hand.', fonte: 'https://jtwceramics.com/2020/12/23/francoise-joris-artist-profile/', veiculo: 'JTW Ceramics (2020)' },
      { texto: 'A natureza é uma fonte inesgotável de inspiração.', original: 'Nature is an inexhaustible source of inspiration.', fonte: 'https://www.ceramicsnow.org/artworks/francoise-joris-nature/', veiculo: 'Ceramics Now' },
    ],
    series: [{ nome: 'Nerikomi', desc: '2018–2020' }, { nome: 'Nature', desc: '2016–2018' }],
    publicacoes: [f('Françoise Joris — artist profile (JTW Ceramics)', 'https://jtwceramics.com/2020/12/23/francoise-joris-artist-profile/', 'Entrevistas', '2020')],
    fontes: [f('Homo Faber', `${HF}/artisans/franoise-joris-porcelain-crafting-belgium`, 'Guias'), f('Ceramics Now — Nerikomi', 'https://www.ceramicsnow.org/artworks/francoise-joris-nerikomi/', 'Revistas'), f('Ceramics Now — Nature', 'https://www.ceramicsnow.org/artworks/francoise-joris-nature/', 'Revistas')],
    tecnicas: ['Nerikomi', 'Construção manual'], materiais: ['Porcelana-papel', 'Fibras de celulose ou linho'], queimas: ['1250 °C'], tiposObra: ['Tigelas'], esteticas: ['Orgânica', 'Linear'],
    tags: ['bélgica', 'nerikomi', 'porcelana'],
  }],
  ['art-rapaport', {
    ...vazio, relacionados: outros('art-rapaport'),
    nome: 'Cary Rapaport', pais: ['Estados Unidos', 'Bélgica'], atuacao: 'Lier, Bélgica (antes Boston)',
    especialidade: 'Esculturas de parede em nerikomi (planetas) e tigelas marmorizadas',
    linguagem: 'Meias esferas de porcelana em nerikomi que reproduzem planetas a partir de fotografias da NASA, penduradas na parede, além de tigelas e pratos marmorizados.',
    bio: 'Escultor(a) que trabalha com cerâmica, vidro de maçarico e plasma iluminado (site oficial). Formou-se em Belas Artes na School of the Museum of Fine Arts, em Boston; o currículo diz 2011 e ligada à Tufts, a página "sobre" diz 2010. Fez em 2017 um curso de argila colorida (nerikomi) com Chris Campbell, no Spruill Center for the Arts, em Atlanta, de quem aprendeu o degradê Skinner (Skinner blend).\n\nFoi membro do coletivo Feet of Clay, em Brookline (2013–2023), assistente de ateliê de Wayne Strattman (2018–2023) e deu aula de padrões em argila colorida em 2020. Venceu o concurso SOLO2020 e fez a individual "Planetary Porcelain" na Bromfield Gallery, em Boston, em janeiro de 2020. Mudou-se para a Bélgica em 2023 e saiu na revista holandesa KLEI em 2024.',
    caracteristicas: ['Nerikomi escultórico', 'Planetas de parede', 'Degradê Skinner'],
    afinidade: 'Nerikomi fora da louça: o padrão vira imagem (planetas), e a peça vai para a parede.',
    analise: { formas: 'Meias esferas de parede, tigelas e pratos.', paleta: 'Cores dos planetas fotografados pela NASA.', reconhecivel: 'Planetas de porcelana em nerikomi pendurados na parede.' },
    processos: [
      v('Argila colorida', 'Porcelana colorida em camadas, comprimida à mão. O padrão está dentro da argila, então cada etapa do processo o transforma.', 'https://www.caryrapaport.com/nerikomi'),
      v('Moldes', 'As meias esferas são formadas em molde de gesso, que tira a umidade da argila.', 'https://www.caryrapaport.com/nerikomi'),
      v('Cor', 'Degradê Skinner (Skinner blend), aprendido com Chris Campbell.', 'https://www.caryrapaport.com/nerikomi'),
    ],
    estudar: ['Degradê Skinner em argila colorida.', 'Molde de gesso para meias esferas.', 'Padrão como imagem (paisagem, planeta).'],
    falas: [
      { texto: 'Os padrões estão dentro da argila, não só na superfície, então cada etapa do processo transforma o padrão.', original: 'The patterns are embedded within the clay, not only on the surface, so every step of the process transforms the pattern.', fonte: 'https://www.caryrapaport.com/nerikomi', veiculo: 'Site oficial' },
      { texto: 'Me interessa explorar as possibilidades escultóricas do nerikomi.', original: "I'm interested in exploring the sculptural possibilities of nerikomi.", fonte: 'https://www.caryrapaport.com/nerikomi', veiculo: 'Site oficial' },
      { texto: 'O nerikomi é um processo que exige muito tempo.', original: 'Nerikomi is a time-intensive process.', fonte: 'https://www.caryrapaport.com/nerikomi', veiculo: 'Site oficial' },
    ],
    series: [{ nome: 'Planetary Porcelain', desc: 'Planetas em nerikomi, Bromfield Gallery, 2020.' }],
    publicacoes: [f('KLEI Keramiek Magazine (Holanda)', undefined, 'Revistas', '2024'), f('Planetary Porcelain — Bromfield Gallery (individual)', undefined, 'Exposições', '2020')],
    fontes: [f('Site oficial — Nerikomi', 'https://www.caryrapaport.com/nerikomi', 'Site oficial'), f('Currículo', 'https://www.caryrapaport.com/caryrapaport-cv', 'Site oficial')],
    site: 'https://www.caryrapaport.com/', instagram: 'caryrapaport',
    tecnicas: ['Nerikomi', 'Molde', 'Degradê Skinner'], materiais: ['Porcelana'], tiposObra: ['Esculturas de parede', 'Tigelas', 'Pratos'], esteticas: ['Cósmica', 'Marmorizada'],
    tags: ['estados unidos', 'bélgica', 'nerikomi', 'porcelana'],
  }],
]

const SQ = 'https://images.squarespace-cdn.com/content/v1/59cd4b8a2278e7d5bd5f6164'
const CN = 'https://www.ceramicsnow.org/wp-content/uploads/2020/10'
const CMI = 'https://ceramicartsnetwork.org/images/default-source/cm-web-updates/june-july-august-2025'
export const OBRAS_NERIKOMI: [string, O][] = [
  ['obra-matsui-jar-vam', { artistaId: 'art-matsui-kosei', titulo: 'Jar (pote)', ano: '1988', dimensoes: 'Altura 28,1 cm; diâmetro 30,5 cm', materiais: 'Grés com neriage floral em azul e cinza', tecnica: 'Neriage', imagem: 'https://framemark.vam.ac.uk/collections/2006AT8129/full/!600,/0/default.jpg', fonte: 'https://collections.vam.ac.uk/item/O24657/jar-matsui-kosei/', credito: 'Victoria and Albert Museum, Londres (FE.1&BOX-1989), doação do artista' }],
  ['obra-matsui-marble-1988', { artistaId: 'art-matsui-kosei', titulo: 'Pote com desenho de mármore', ano: '1988', dimensoes: '29,8 × 31,2 cm', materiais: 'Grés marmorizado', tecnica: 'Neriage', imagem: 'https://static-assets.artlogic.net/w_1600,h_1600,c_limit,f_auto,fl_lossy,q_auto/artlogicstorage/daiichiarts/images/view/64f30d5dede63d91abbc5a4df11202a1j/daiichiarts-modern-contemporaryjapaneseceramics-matsui-kosei-jar-with-marble-design-1988.jpg', fonte: 'https://www.daiichiarts.com/artworks/categories/21/4705-matsui-kosei-jar-with-marble-design-1988/', credito: 'Dai Ichi Arts', notas: 'Título original 練上風白地壷. Publicado em 松井康成 練上作品集.' }],
  ['obra-matsui-obachi-1972', { artistaId: 'art-matsui-kosei', titulo: 'Tigela grande (Ōbachi)', ano: '1972', dimensoes: '19,7 × 43,2 × 41,9 cm', materiais: 'Grés marmorizado', tecnica: 'Neriage', fonte: 'https://www.metmuseum.org/en/art/collection/search/843266', credito: 'The Metropolitan Museum of Art (2020.126)', notas: 'Faixas em preto e branco. A imagem do Met tem uso restrito; veja na página do museu.' }],
  ['obra-matsui-shoretsu', { artistaId: 'art-matsui-kosei', titulo: 'Pote de neriage shōretsu (練上嘯裂壺)', tecnica: 'Neriage, superfície raspada', imagem: 'https://www.kurodatoen.co.jp/wp-content/uploads/2018/03/photo_main01-24-250x250.jpg', fonte: 'https://www.kurodatoen.co.jp/cp_lineupcat/koseimatsui', credito: 'Kuroda Tōen' }],
  ['obra-hoadley-arabesque', { artistaId: 'art-hoadley', titulo: 'Large porcelain arabesque', materiais: 'Porcelana colorida, folha de ouro', tecnica: 'Nerikomi (cinco fatias de padrão)', imagem: 'https://api.homofaber.com/uploads/obj_4_8_Courtesy_of_Thoma_Hoadley_aa530f7378.jpg', fonte: `${HF}/objects/a1VTG000002LPDc2AO`, credito: 'Homo Faber, cortesia de Thomas Hoadley' }],
  ['obra-hoadley-smallbowl', { artistaId: 'art-hoadley', titulo: 'Small bowl', materiais: 'Porcelana colorida, folha de ouro', tecnica: 'Nerikomi', imagem: 'https://api.homofaber.com/uploads/obj_3_3_Courtesy_of_Thoma_Hoadley_4c12d0eeb4.jpg', fonte: `${HF}/objects/a1VTG000002LPDb2AO`, credito: 'Homo Faber, cortesia de Thomas Hoadley', notas: 'Base preta circular, cinco painéis retangulares em preto, branco e cinza.' }],
  ['obra-hoadley-whitehouse-1993', { artistaId: 'art-hoadley', titulo: 'Nerikomi Bowl', ano: '1993', materiais: 'Porcelana colorida, sem esmalte', tecnica: 'Nerikomi, placas', imagem: 'https://www.themarksproject.org/sites/default/files/marks/full-view/_hoadley_nerikomi-bowl_1993_1.1_the-white-house-collection_photo-john-bigelow-taylor_2014.jpg', fonte: 'https://www.themarksproject.org/print/marks/hoadley', credito: 'The White House Collection of American Crafts, Clinton Library (foto John Bigelow Taylor)' }],
  ['obra-feibleman-mino-1998', { artistaId: 'art-feibleman', titulo: 'Peça de porcelana colorida (prata em Mino, design)', ano: '1998', materiais: 'Porcelana translúcida', tecnica: 'Nerikomi', imagem: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjNM9y5VN5ynYQH8Si-0nVMphY4lGZW-BKA7Q9SHw0sOHki-8dMMAERzzwWUXsVYQEbsLZu6MiAowsH8ntYWnEQ60Y0yaTkhPlrH-fUofiUaO77AJzqlKW-3NgmH58YNHKt0mct1_V14e8X/s320/Mino-Aida-silver+1998.jpg', fonte: 'https://dorothyfeibleman.blogspot.com/2019/09', credito: 'Blog da artista' }],
  ['obra-feibleman-sakazuki', { artistaId: 'art-feibleman', titulo: 'Sakazuki geométrico', ano: 'c. 2003', materiais: 'Porcelana', tecnica: 'Nerikomi', imagem: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhHbLZ3JrI5vo5jOviztY4BAyRtdqT2qQZLkahpmKwD2ipkekP6TBDsRdO7sqthfIuyMdbVepjPPcA341zNPR51wpnKs6NpV9qjHHqRhn-MrQN0msdMynCYmQohFoENRcXFe8cjcq9krCmr/s400/geometric+sakazuki+and+templom+roof.png', fonte: 'https://dorothyfeibleman.blogspot.com/2019/09', credito: 'Blog da artista (foto Tomoki Fuji)', notas: 'Mostrado no Ichinokura Sakazuki Museum. Título tirado do nome do arquivo.' }],
  ['obra-feibleman-1999', { artistaId: 'art-feibleman', titulo: 'Peça de vários brancos de porcelana', ano: '1999', materiais: 'Porcelanas brancas diferentes', tecnica: 'Nerikomi branco sobre branco', imagem: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhHbLZ3JrI5vo5jOviztY4BAyRtdqT2qQZLkahpmKwD2ipkekP6TBDsRdO7sqthfIuyMdbVepjPPcA341zNPR51wpnKs6NpV9qjHHqRhn-MrQN0msdMynCYmQohFoENRcXFe8cjcq9krCmr/s400/1999+geo+and+romanian+gate.png', fonte: 'https://dorothyfeibleman.blogspot.com/2019/09', credito: 'Blog da artista', notas: 'Feita em parte na Inglaterra e no Japão (1998–99) e terminada no Seto Ceramic and Glass Studio em 2000.' }],
  ['obra-feibleman-chawan', { artistaId: 'art-feibleman', titulo: 'Parede de chawan "estrela"', ano: 'c. 2005', tecnica: 'Nerikomi', imagem: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiKxJ1rJen1T-dnUR6JMg5dHsDYdIX-hn9wtgGvB9C04pecf6HNjTENc2N0Y7HmxzngU5t9q6Q5gAV9wWQLInb546LtRx_UFs4LPVlOu-uiwnmvYndcrY5af-Tn7fUNz4LMHLf8kRHmrnOr/s400/star+teabowl+wall+df.+c+2005.jpg', fonte: 'https://dorothyfeibleman.blogspot.com/2019/09', credito: 'Blog da artista (foto Dorothy Feibleman)', notas: 'Título tirado do nome do arquivo.' }],
  ['obra-maeda-rose-bowls', { artistaId: 'art-maeda', titulo: 'Par de tigelas rosa', ano: '2017', dimensoes: '41 cm de diâmetro', materiais: 'Porcelana', tecnica: 'Nerikomi, construção manual', queima: 'Cone 6', imagem: 'https://ceramicartsnetwork.org/images/default-source/uploadedimages/wp-content/uploads/2019/01/maeda-rose-bowls-pair.jpg?sfvrsn=39553efb_0', fonte: CM_MAEDA, credito: 'Ceramics Monthly (foto General Fine Craft)' }],
  ['obra-maeda-oval-dish', { artistaId: 'art-maeda', titulo: 'Prato oval', ano: '2018', dimensoes: '69 cm de comprimento', materiais: 'Porcelana', tecnica: 'Nerikomi, construção manual', queima: 'Cone 6', imagem: 'https://ceramicartsnetwork.org/images/default-source/uploadedimages/wp-content/uploads/2019/01/maeda-oval-dish-2b.jpg?sfvrsn=f0825de7_0', fonte: CM_MAEDA, credito: 'Ceramics Monthly (foto General Fine Craft)' }],
  ['obra-maeda-red-bowl', { artistaId: 'art-maeda', titulo: 'Tigela floral vermelha', dimensoes: '18,5 × 19 × 9 cm', materiais: 'Porcelana', tecnica: 'Nerikomi', imagem: 'https://www.lapaigallery.com/cdn/shop/products/19922_2602.png', fonte: 'https://www.lapaigallery.com/products/eiko-maeda-13', credito: 'L.A. Pai Gallery, Ottawa' }],
  ['obra-maeda-flower-bowl', { artistaId: 'art-maeda', titulo: 'Flower Bowl (B1022)', materiais: 'Porcelana', tecnica: 'Nerikomi', imagem: 'https://www.rosenfieldcollection.com/wp-content/uploads/2026/11/b1022f-440x440.jpeg', fonte: 'https://www.rosenfieldcollection.com/artist/eiko-maeda/', credito: 'The Rosenfield Collection' }],
  ['obra-maeda-peach-plate', { artistaId: 'art-maeda', titulo: 'Prato com flores de pessegueiro (P728)', materiais: 'Porcelana', tecnica: 'Nerikomi', imagem: 'https://www.rosenfieldcollection.com/wp-content/uploads/2023/05/p728t-440x440.jpeg', fonte: 'https://www.rosenfieldcollection.com/artist/eiko-maeda/', credito: 'The Rosenfield Collection' }],
  ['obra-tenkortenaar-flowerbomb-purple', { artistaId: 'art-tenkortenaar', titulo: 'Flowerbomb Purple', ano: '2024', dimensoes: '22 cm de diâmetro', materiais: 'Porcelana de Limoges colorida', tecnica: 'Nerikomi, construção manual', serie: 'Flowerbomb', imagem: `${CMI}/maria-ten-kortenaar-00-0625cm.jpg?sfvrsn=35c26307_3`, fonte: CM_MARIA, credito: 'Ceramics Monthly (2025)', notas: 'A Kellie Miller Arts dá 2023 e 12 × 22 cm.' }],
  ['obra-tenkortenaar-flowerbomb-red', { artistaId: 'art-tenkortenaar', titulo: 'Flowerbomb em vermelho e rosa', ano: '2023', dimensoes: '18 cm de altura', materiais: 'Porcelana de Limoges colorida', tecnica: 'Nerikomi, construção manual', serie: 'Flowerbomb', imagem: `${CMI}/maria-ten-kortenaar-05-0625cm.jpg?sfvrsn=62516686_3`, fonte: CM_MARIA, credito: 'Ceramics Monthly (2025)' }],
  ['obra-tenkortenaar-pond', { artistaId: 'art-tenkortenaar', titulo: 'In the Pond (No lago)', ano: '2025', dimensoes: '23 cm de diâmetro', materiais: 'Porcelana de Limoges colorida', tecnica: 'Nerikomi, construção manual', imagem: `${CMI}/maria-ten-kortenaar-08-0625cm.jpg?sfvrsn=b1910bd3_3`, fonte: CM_MARIA, credito: 'Ceramics Monthly (2025)' }],
  ['obra-tenkortenaar-daybreak', { artistaId: 'art-tenkortenaar', titulo: 'Daybreak (Amanhecer)', ano: '2019', dimensoes: '17 cm de altura cada', materiais: 'Porcelana de Limoges colorida', tecnica: 'Nerikomi, construção manual', imagem: `${CMI}/maria-ten-kortenaar-04-0625cm.jpg?sfvrsn=e9f1aadc_3`, fonte: CM_MARIA, credito: 'Ceramics Monthly (2025)' }],
  ['obra-tenkortenaar-sunset', { artistaId: 'art-tenkortenaar', titulo: 'Sunset (Pôr do sol)', ano: '2019', dimensoes: '20 cm de altura', materiais: 'Porcelana de Limoges colorida', tecnica: 'Nerikomi, construção manual', imagem: `${CMI}/maria-ten-kortenaar-01-0625cm.jpg?sfvrsn=94b1de7a_3`, fonte: CM_MARIA, credito: 'Ceramics Monthly (2025)' }],
  ['obra-tenkortenaar-bigflowerbomb', { artistaId: 'art-tenkortenaar', titulo: 'Big Flowerbomb', materiais: 'Porcelana com incrustação (nerikomi)', serie: 'Flowerbomb', imagem: 'https://hfgnext.s3.eu-west-3.amazonaws.com/img/4YL7Q000000PX1RWAW-headergd.jpg', fonte: `${HF}/objects/a1VTG000000f1Zj2AI`, credito: 'Homo Faber', notas: 'Inspirada numa visita a Wakehurst.' }],
  ...([['f3aj2AA', 'Ameixeira coberta de neve'], ['f3ak2AA', 'Início da primavera'], ['f3al2AA', 'Hana, Fleur'], ['f3an2AA', 'Prato com motivo asanoha'], ['f3am2AA', 'Vaso "Água que sussurra"']] as const).map(([k, t]): [string, O] => [`obra-kuramatsu-${k.slice(0, 4).toLowerCase()}`, {
    artistaId: 'art-kuramatsu', titulo: t, materiais: 'Porcelana tingida com óxidos', tecnica: 'Nerikomi', fonte: `${HF}/objects/a1VTG000000${k}`, credito: 'Homo Faber', notas: 'Veja a imagem na página do Homo Faber.',
  }]),
  ...([['flight', 'Flight', '2018', '22/20 × 20/16 cm', 'Nerikomi-7'], ['emotion', 'Emotion', '2018', '15 × 19 × 14 cm', 'Nerikomi-3'], ['undulation', 'Undulation', '2019', '25 × 22 cm', 'Nerikomi-12'], ['sem-titulo-2019', 'Sem título', '2019', '29 × 17 cm', 'Nerikomi-13'], ['sem-titulo-2018', 'Sem título', '2018', '18 × 15 cm', 'Nerikomi-2']] as const).map(([k, t, ano, dim, arq]): [string, O] => [`obra-joris-${k}`, {
    artistaId: 'art-joris', titulo: t, ano, dimensoes: dim, materiais: 'Porcelana-papel', tecnica: 'Nerikomi', serie: 'Nerikomi', imagem: `${CN}/${arq}-Medium.jpg`, fonte: 'https://www.ceramicsnow.org/artworks/francoise-joris-nerikomi/', credito: 'Ceramics Now',
  }]),
  ...([['mercury', 'Mercúrio', '1561861508159-5VFTBNAMTGYOKJOZPYBO/Mercury.jpg'], ['venus', 'Vênus', '1561861564804-OSYDI4IG1TG8AB40V9CM/Venus.jpg'], ['earth', 'Terra', '1561861597990-CBXOVC30843CHRDE1ER5/Earth.jpg'], ['jupiter', 'Júpiter', '1561861707799-0TWNEQLLP40O397RFD55/Jupiter+B.jpg']] as const).map(([k, t, arq]): [string, O] => [`obra-rapaport-${k}`, {
    artistaId: 'art-rapaport', titulo: t, materiais: 'Porcelana', tecnica: 'Nerikomi, molde de gesso', serie: 'Planetary Porcelain', imagem: `${SQ}/${arq}`, fonte: 'https://www.caryrapaport.com/nerikomi', credito: 'Cary Rapaport, site oficial',
  }]),
  ['obra-rapaport-green-bowl', { artistaId: 'art-rapaport', titulo: 'Tigela marmorizada verde', tecnica: 'Nerikomi', imagem: `${SQ}/1716804236829-TX7NZTR7EESM9LBA2WJM/IMG_9960.JPG`, fonte: 'https://www.caryrapaport.com/nerikomi', credito: 'Cary Rapaport, site oficial' }],
]

export const CAPAS_NERIKOMI: Record<string, string> = {
  'art-matsui-kosei': 'obra-matsui-jar-vam', 'art-hoadley': 'obra-hoadley-arabesque', 'art-feibleman': 'obra-feibleman-1999', 'art-maeda': 'obra-maeda-rose-bowls',
  'art-tenkortenaar': 'obra-tenkortenaar-flowerbomb-purple', 'art-joris': 'obra-joris-flight', 'art-rapaport': 'obra-rapaport-jupiter',
}
