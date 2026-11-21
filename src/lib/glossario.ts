/**
 * Glossário de termos cerâmicos. Definições curtas e factuais, sem receitas.
 * `chaves` são as grafias procuradas nos textos (perfis de artistas) para criar os links automáticos.
 * Termos genéricos demais (torno, placa…) ficam fora da busca automática.
 */
export type CatGlossario = 'Esmaltes e superfícies' | 'Queima e fornos' | 'Formas' | 'Técnicas' | 'Materiais' | 'Tradições e estética'

export interface Termo {
  id: string
  termo: string
  original?: string
  cat: CatGlossario
  def: string
  chaves?: string[]
  ver?: string[]
}

export const CATS_GLOSSARIO: CatGlossario[] = ['Esmaltes e superfícies', 'Queima e fornos', 'Formas', 'Técnicas', 'Materiais', 'Tradições e estética']

export const GLOSSARIO: Termo[] = [
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
