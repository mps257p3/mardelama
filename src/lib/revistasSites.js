// Catálogo das revistas de arte lidas pelo RSS (api/revistas.js usa no servidor; o app usa no painel Fontes e no sorteio).
// secao: grupo no painel Fontes. tipo: universo que a revista cobre (ceramica | ilustracao | arte).
// grupo: termo que a obra recebe (ajuda os temas Ilustradores/Cerâmica a reconhecê-la). lingua: idioma da busca.
// recentes: endereços do feed de novidades, quando não é o /feed/ padrão do WordPress.

export const SECOES = [
  { id: 'ceramica', nome: 'Revistas de cerâmica' },
  { id: 'ilustracao', nome: 'Ilustração e design' },
  { id: 'design', nome: 'Design, embalagem e paisagismo' },
  { id: 'internacional', nome: 'Arte contemporânea internacional' },
  { id: 'brasil', nome: 'Revistas brasileiras' },
  { id: 'japao', nome: 'Revistas japonesas' },
]

export const SITES = {
  // cerâmica
  artaxis: { nome: 'Artaxis', base: 'https://artaxis.org', grupo: 'ceramics', secao: 'ceramica', tipo: 'ceramica' },
  ceramicsnow: { nome: 'Ceramics Now', base: 'https://www.ceramicsnow.org', grupo: 'ceramics', secao: 'ceramica', tipo: 'ceramica' },
  ceramicreview: { nome: 'Ceramic Review', base: 'https://www.ceramicreview.com', grupo: 'ceramics', secao: 'ceramica', tipo: 'ceramica' },
  can: { nome: 'Ceramic Arts Network (Ceramics Monthly)', base: 'https://ceramicartsnetwork.org', grupo: 'ceramics', secao: 'ceramica', tipo: 'ceramica' },
  studiopotter: { nome: 'Studio Potter', base: 'https://studiopotter.org', grupo: 'ceramics', secao: 'ceramica', tipo: 'ceramica' },
  // ilustração e cultura visual
  colossal: { nome: 'Colossal', base: 'https://www.thisiscolossal.com', grupo: 'contemporary art', secao: 'ilustracao', tipo: 'arte' },
  booooooom: { nome: 'BOOOOOOOM!', base: 'https://www.booooooom.com', grupo: 'contemporary art', secao: 'ilustracao', tipo: 'ilustracao' },
  '3x3': { nome: '3x3 Magazine', base: 'https://www.3x3mag.com', grupo: 'illustration', secao: 'ilustracao', tipo: 'ilustracao' },
  creativeboom: { nome: 'Creative Boom', base: 'https://www.creativeboom.com', grupo: 'illustration', secao: 'ilustracao', tipo: 'ilustracao', recentes: ['https://www.creativeboom.com/illustration/feed/', 'https://www.creativeboom.com/feed/'] },
  illustrationage: { nome: 'Illustration Age', base: 'https://illustrationage.com', grupo: 'illustration', secao: 'ilustracao', tipo: 'ilustracao' },
  wepresent: { nome: 'WePresent', base: 'https://wepresent.wetransfer.com', grupo: 'illustration', secao: 'ilustracao', tipo: 'ilustracao', recentes: ['https://wepresent.wetransfer.com/rss.xml', 'https://wepresent.wetransfer.com/feed', 'https://wepresent.wetransfer.com/rss'] },
  juxtapoz: { nome: 'Juxtapoz', base: 'https://www.juxtapoz.com', grupo: 'illustration', secao: 'ilustracao', tipo: 'ilustracao' },
  hifructose: { nome: 'Hi-Fructose', base: 'https://hifructose.com', grupo: 'illustration', secao: 'ilustracao', tipo: 'ilustracao' },
  beautifulbizarre: { nome: 'Beautiful Bizarre', base: 'https://beautifulbizarre.net', grupo: 'illustration', secao: 'ilustracao', tipo: 'ilustracao' },
  rawvision: { nome: 'Raw Vision', base: 'https://rawvision.com', grupo: 'outsider art', secao: 'ilustracao', tipo: 'ilustracao' },
  // design, embalagem e paisagismo
  dieline: { nome: 'Dieline (embalagem)', base: 'https://thedieline.com', grupo: 'packaging design', secao: 'design', tipo: 'ilustracao' },
  landezine: { nome: 'Landezine (paisagismo)', base: 'https://landezine.com', grupo: 'landscape architecture', secao: 'design', tipo: 'arte' },
  // arte contemporânea internacional
  elephant: { nome: 'Elephant', base: 'https://elephant.art', grupo: 'contemporary art', secao: 'internacional', tipo: 'arte' },
  bomb: { nome: 'BOMB', base: 'https://bombmagazine.org', grupo: 'contemporary art', secao: 'internacional', tipo: 'arte' },
  frieze: { nome: 'Frieze', base: 'https://www.frieze.com', grupo: 'contemporary art', secao: 'internacional', tipo: 'arte' },
  artreview: { nome: 'ArtReview', base: 'https://artreview.com', grupo: 'contemporary art', secao: 'internacional', tipo: 'arte' },
  artforum: { nome: 'Artforum', base: 'https://www.artforum.com', grupo: 'contemporary art', secao: 'internacional', tipo: 'arte' },
  flashart: { nome: 'Flash Art', base: 'https://flash---art.com', grupo: 'contemporary art', secao: 'internacional', tipo: 'arte' },
  artmonthly: { nome: 'Art Monthly', base: 'https://www.artmonthly.co.uk', grupo: 'contemporary art', secao: 'internacional', tipo: 'arte' },
  // brasileiras (busca traduzida para o português)
  select: { nome: 'seLecT', base: 'https://select.art.br', grupo: 'contemporary art', secao: 'brasil', tipo: 'arte', lingua: 'pt' },
  amarello: { nome: 'Amarello', base: 'https://amarello.com.br', grupo: 'contemporary art', secao: 'brasil', tipo: 'arte', lingua: 'pt' },
  dasartes: { nome: 'DASartes', base: 'https://dasartes.com.br', grupo: 'contemporary art', secao: 'brasil', tipo: 'arte', lingua: 'pt' },
  artebrasileiros: { nome: 'ARTE!Brasileiros', base: 'https://artebrasileiros.com.br', grupo: 'contemporary art', secao: 'brasil', tipo: 'arte', lingua: 'pt' },
  continente: { nome: 'Revista Continente', base: 'https://revistacontinente.com.br', grupo: 'contemporary art', secao: 'brasil', tipo: 'arte', lingua: 'pt' },
  zum: { nome: 'ZUM', base: 'https://revistazum.com.br', grupo: 'photograph', secao: 'brasil', tipo: 'arte', lingua: 'pt' },
  piseagrama: { nome: 'PISEAGRAMA', base: 'https://piseagrama.org', grupo: 'contemporary art', secao: 'brasil', tipo: 'arte', lingua: 'pt' },
  recorte: { nome: 'Recorte', base: 'https://revistarecorte.com.br', grupo: 'contemporary art', secao: 'brasil', tipo: 'arte', lingua: 'pt' },
  carbono: { nome: 'Carbono (arquivo)', base: 'https://revistacarbono.com', grupo: 'contemporary art', secao: 'brasil', tipo: 'arte', lingua: 'pt' },
  tatui: { nome: 'Tatuí (arquivo)', base: 'https://www.revistatatui.com.br', grupo: 'contemporary art', secao: 'brasil', tipo: 'arte', lingua: 'pt' },
  // japonesas (busca traduzida para o japonês nas que publicam em japonês)
  bijutsutecho: { nome: 'Bijutsu Techo', base: 'https://bijutsutecho.com', grupo: 'contemporary art', secao: 'japao', tipo: 'arte', lingua: 'ja', recentes: ['https://bijutsutecho.com/rss', 'https://bijutsutecho.com/feed', 'https://bijutsutecho.com/rss.xml', 'https://bijutsutecho.com/feed.xml'] },
  tosetsu: { nome: 'Tosetsu (陶説)', base: 'https://www.j-ceramics.or.jp', grupo: 'ceramics', secao: 'japao', tipo: 'ceramica', lingua: 'ja' },
  illustrationmag: { nome: 'illustration (イラストレーション)', base: 'https://illustration-mag.jp', grupo: 'illustration', secao: 'japao', tipo: 'ilustracao', lingua: 'ja' },
  idea: { nome: 'IDEA', base: 'https://www.idea-mag.com/en', grupo: 'graphic design', secao: 'japao', tipo: 'ilustracao' },
  axis: { nome: 'AXIS', base: 'https://www.axismag.jp', grupo: 'design', secao: 'japao', tipo: 'ilustracao', lingua: 'ja' },
  soen: { nome: 'SO-EN', base: 'https://soen.tokyo', grupo: 'textile', secao: 'japao', tipo: 'ilustracao', lingua: 'ja' },
  casabrutus: { nome: 'Casa BRUTUS', base: 'https://casabrutus.com', grupo: 'design', secao: 'japao', tipo: 'arte', lingua: 'ja' },
  pen: { nome: 'Pen', base: 'https://www.pen-online.jp', grupo: 'design', secao: 'japao', tipo: 'arte', lingua: 'ja' },
  ginza: { nome: 'GINZA', base: 'https://ginzamag.com', grupo: 'contemporary art', secao: 'japao', tipo: 'arte', lingua: 'ja' },
  brutus: { nome: 'BRUTUS', base: 'https://brutus.jp', grupo: 'contemporary art', secao: 'japao', tipo: 'arte', lingua: 'ja' },
  spoontamago: { nome: 'Spoon & Tamago', base: 'https://spoon-tamago.com', grupo: 'contemporary art', secao: 'japao', tipo: 'arte' },
  tokyoartbeat: { nome: 'Tokyo Art Beat', base: 'https://www.tokyoartbeat.com/en', grupo: 'contemporary art', secao: 'japao', tipo: 'arte', recentes: ['https://www.tokyoartbeat.com/en/rss', 'https://www.tokyoartbeat.com/en/feed', 'https://www.tokyoartbeat.com/rss.xml'] },
}

/** Revistas pedidas que não têm caminho aberto (só loja ou página de catálogo, sem RSS). */
export const SEM_CAMINHO = [
  { nome: 'Geijutsu Shincho', motivo: 'O site da Shinchosha só mostra o sumário de cada edição, sem RSS nem imagens das matérias.' },
  { nome: 'Hono Geijutsu', motivo: 'O link é a loja da editora (Abe Publishing): só capas à venda, sem RSS.' },
]
