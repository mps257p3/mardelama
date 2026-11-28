/**
 * Base de conhecimento do laboratório de esmaltes (registros reais e editáveis).
 *
 * - Ids determinísticos: o mesmo registro nasce com o mesmo id em todos os aparelhos,
 *   e a sincronização não cria duplicatas.
 * - `atualizadoEm` fixo (SEED_T): qualquer edição do usuário é mais recente e sempre vence.
 * - Só cria o que ainda não existe; nunca sobrescreve dados do usuário.
 * - Informações não verificadas são marcadas como tal (status, "hipótese", "preliminar").
 */
import { db, type Base, type Comercial, type Compra, type Conteudo, type Curva, type Familia, type Fornecedor, type Ingrediente, type Material, type Receita, type Relacao } from './schema'

const SEED_T = Date.UTC(2026, 10, 19, 12, 0, 0)
const base = (id: string): Base => ({ id, criadoEm: SEED_T, atualizadoEm: SEED_T, excluido: 0, favorito: 0 })
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()

export const EXPERIMENTAL = 'Experimental — ainda não testada'
export const STATUS_RECEITA = [EXPERIMENTAL, 'Modelo de adição — base a selecionar', 'Em teste', 'Necessita revisão', 'Aprovada artisticamente', 'Reproduzida com sucesso', 'Arquivada'] as const

/* ------------------------------------------------------------------ famílias */

const FAM: (Omit<Familia, keyof Base | 'ordem'> & { antigo: string })[] = [
  { codigo: 'B01', nome: 'Transparente brilhante', antigo: 'Transparente', nomeEn: 'Transparent Glossy Glaze',
    descricao: 'Esmalte vítreo e transparente que deixa ver a argila, os engobes e os grafismos por baixo.',
    visuais: ['Superfície vítrea', 'Alta reflexão da luz', 'Transparência', 'Permite visualizar argila, engobes e grafismos'],
    materiais: ['silica', 'feldspato-potassico', 'caulim', 'carbonato-calcio', 'frita-boracica'],
    possibilidades: ['Transparente incolor', 'Mel', 'Âmbar', 'Azul transparente', 'Verde transparente', 'Celadon'], dificuldade: 2, prioridade: 'Alta' },
  { codigo: 'B02', nome: 'Branco opaco', antigo: 'Branco opaco', nomeEn: 'Opaque Glaze',
    descricao: 'Esmalte que oculta a cor da argila e serve de fundo para cores sólidas e tons pastéis.',
    visuais: ['Oculta a cor da argila', 'Permite desenvolver cores sólidas', 'Possibilita tons pastéis', 'Pode ser brilhante, fosco ou acetinado'],
    materiais: ['silicato-zirconio', 'oxido-estanho'],
    quimicas: 'Esmalte-base acrescido de opacificante (silicato de zircônio ou óxido de estanho).',
    possibilidades: ['Branco', 'Marfim', 'Rosa', 'Verde pastel', 'Azul-claro'], dificuldade: 2, prioridade: 'Média' },
  { codigo: 'B03', nome: 'Fosco', antigo: 'Fosco', nomeEn: 'Matte Glaze',
    descricao: 'Superfície de baixa reflexão, mineral, aveludada ou semelhante à pedra.',
    visuais: ['Baixa reflexão da luz', 'Aparência mineral', 'Superfície aveludada ou semelhante à pedra', 'Pode apresentar microcristalização'],
    materiais: ['dolomita', 'carbonato-magnesio-leve', 'carbonato-calcio', 'caulim', 'feldspato-potassico', 'silica'],
    possibilidades: ['Tons terrosos', 'Pedra', 'Musgo', 'Osso', 'Porcelana fosca'], dificuldade: 3, prioridade: 'Muito alta',
    cuidados: 'Não confundir um esmalte fosco maturado com um esmalte que não atingiu a fusão adequada.' },
  { codigo: 'B04', nome: 'Acetinado', antigo: 'Acetinado', nomeEn: 'Satin Glaze',
    descricao: 'Brilho intermediário, reflexão suave e aparência sedosa.',
    visuais: ['Brilho intermediário', 'Reflexão suave', 'Aparência sedosa', 'Superfície visualmente delicada'],
    materiais: ['feldspato-potassico', 'dolomita', 'silica', 'caulim', 'carbonato-calcio'], dificuldade: 3, prioridade: 'Alta' },
  { codigo: 'B05', nome: 'Retração', antigo: 'Retração (crawling)', nomeEn: 'Crawl Glaze / Crawling Glaze',
    descricao: 'Retração intencional do esmalte, formando ilhas e relevos e expondo parcialmente a argila.',
    visuais: ['Retração intencional', 'Formação de ilhas de esmalte', 'Exposição parcial da argila', 'Formação de relevos'],
    materiais: ['carbonato-magnesio-leve', 'sienito-nefelinico', 'argila-plastica', 'caulim'],
    variaveis: ['Tamanho das ilhas', 'Distância entre as ilhas', 'Altura do relevo', 'Espessura da aplicação', 'Grau de retração', 'Aderência', 'Brilho', 'Cor'],
    possibilidades: ['Pele de réptil', 'Escamas', 'Casca de árvore', 'Líquens', 'Carapaças'], dificuldade: 3, prioridade: 'Muito alta', usoInicial: 'Exclusivamente decorativo' },
  { codigo: 'B06', nome: 'Vulcânico', antigo: 'Vulcânico', nomeEn: 'Lava Glaze / Volcanic Glaze',
    descricao: 'Formação de bolhas durante a queima, gerando crateras, porosidade e relevos orgânicos.',
    visuais: ['Formação de bolhas durante a queima', 'Crateras', 'Porosidade', 'Relevos', 'Superfícies orgânicas'],
    materiais: ['carbeto-silicio', 'frita-boracica', 'feldspato-potassico', 'silica', 'caulim'],
    variaveis: ['Tamanho das crateras', 'Profundidade', 'Densidade de bolhas', 'Fluidez', 'Espessura', 'Cor'],
    possibilidades: ['Lava', 'Coral', 'Pedra vulcânica', 'Superfície lunar'], dificuldade: 4, prioridade: 'Muito alta', usoInicial: 'Exclusivamente decorativo' },
  { codigo: 'B07', nome: 'Cristalino', antigo: 'Cristalino', nomeEn: 'Crystalline Glaze',
    descricao: 'Crescimento de cristais durante a queima ou o resfriamento.',
    visuais: ['Crescimento de cristais durante a queima ou o resfriamento', 'Possibilidade de microcristais e macrocristais'],
    quimicas: 'Depende da composição e da curva térmica, especialmente do resfriamento.',
    materiais: ['oxido-zinco', 'silica', 'dioxido-titanio', 'rutilo', 'frita-boracica'],
    subcategorias: ['Macrocristalino', 'Microcristalino', 'Cristalino de resfriamento lento', 'Cristalino fosco', 'Cristalino brilhante'], dificuldade: 5, prioridade: 'Média' },
  { codigo: 'B08', nome: 'Fundente', antigo: 'Fundente', nomeEn: 'Flux Glaze',
    descricao: 'Alta fluidez; modifica o comportamento de outros esmaltes e favorece escorrimentos e transições.',
    visuais: ['Alta fluidez', 'Modifica o comportamento de outros esmaltes', 'Favorece escorrimentos e transições', 'Permite sobreposições reativas'],
    materiais: ['frita-boracica', 'frita-alcalina', 'feldspato-potassico', 'caulim'],
    subcategorias: ['Fundente transparente', 'Fundente translúcido', 'Fundente branco', 'Fundente colorido'], dificuldade: 3, prioridade: 'Alta',
    cuidados: 'Risco de escorrimento: testar em amostras pequenas e proteger as placas refratárias do forno (bolachas, cacos ou base de sacrifício).' },
  { codigo: 'B09', nome: 'Metálico', antigo: 'Metálico', nomeEn: 'Metallic Glaze',
    descricao: 'Aparência metálica, reflexos semelhantes aos de metais e superfícies envelhecidas.',
    visuais: ['Aparência metálica', 'Reflexos semelhantes aos de metais', 'Efeitos de oxidação', 'Superfícies envelhecidas'],
    materiais: ['oxido-ferro-vermelho', 'dioxido-manganes', 'oxido-cobre', 'rutilo'],
    possibilidades: ['Bronze', 'Cobre', 'Ferro', 'Grafite', 'Aço envelhecido'], dificuldade: 4, prioridade: 'Alta', usoInicial: 'Decorativo',
    cuidados: 'Diferenciar esmaltes de aparência metálica de lustres metálicos e de aplicações de ouro verdadeiro.' },
  { codigo: 'B10', nome: 'Craquelado', antigo: 'Craquelado', nomeEn: 'Crackle Glaze',
    descricao: 'Rede de fissuras na camada vítrea, causada pela diferença de expansão térmica entre argila e esmalte.',
    visuais: ['Rede de fissuras na camada vítrea', 'Aparência envelhecida ou mineral'],
    quimicas: 'Diferença de expansão térmica entre argila e esmalte.',
    materiais: ['feldspato-potassico', 'sienito-nefelinico', 'frita-alcalina', 'silica', 'caulim'], dificuldade: 3, prioridade: 'Média',
    cuidados: 'Não confundir craquelamento com retração: no craquelado, a camada de esmalte permanece sobre a argila, porém apresenta fissuras.' },
]
const famId = (codigo: string) => 'fam-' + codigo.toLowerCase()

/* ----------------------------------------------------------- matérias-primas */

type M = Omit<Material, keyof Base | 'fotos'> & { slug: string; compra?: { qtd: string; kg: number; valor?: number; cat: string } }
const SILICA_ALERTA = 'Contém sílica cristalina: o pó inalado é nocivo aos pulmões. Pesar com máscara PFF2/PFF3, preferir limpeza úmida e nunca varrer a seco.'
const METAL_ALERTA = 'Óxido metálico: evitar inalar o pó e o contato prolongado com a pele. Usar máscara, luvas e equipamentos exclusivos para cerâmica. Consultar a ficha de segurança.'
const NAO_VERIF = 'Composição real varia conforme fabricante e lote; consultar a ficha técnica do produto adquirido.'

const MAT: M[] = [
  // estruturais e fundentes
  { slug: 'silica', nome: 'Sílica (quartzo)', nomesAlternativos: 'Quartzo moído, sílica moída', nomeEn: 'Silica / Flint / Quartz', formula: 'SiO₂', categoria: 'Sílica', funcao: 'Formação da rede vítrea', fusao: 'Eleva o ponto de fusão; é o principal formador de vidro.', brilhoInf: 'Contribui para o brilho quando bem fundida.', cuidados: SILICA_ALERTA, compra: { qtd: '2 kg', kg: 2, valor: 20, cat: 'Bases minerais' } },
  { slug: 'feldspato-potassico', nome: 'Feldspato potássico', nomeEn: 'Potash Feldspar', formula: 'KAlSi₃O₈ (fórmula ideal)', categoria: 'Feldspatos', funcao: 'Fornecimento de fundentes, sílica e alumina', composicao: NAO_VERIF, cuidados: SILICA_ALERTA, compra: { qtd: '2 kg', kg: 2, valor: 26, cat: 'Bases minerais' } },
  { slug: 'feldspato-sodico', nome: 'Feldspato sódico (albita)', nomesAlternativos: 'Albita', nomeEn: 'Soda Feldspar / Albite', formula: 'NaAlSi₃O₈ (fórmula ideal)', categoria: 'Feldspatos', funcao: 'Fornecimento de fundentes, sílica e alumina', composicao: NAO_VERIF, cuidados: SILICA_ALERTA, compra: { qtd: '1 kg', kg: 1, valor: 10, cat: 'Bases minerais' } },
  { slug: 'sienito-nefelinico', nome: 'Sienito nefelínico', nomeEn: 'Nepheline Syenite', categoria: 'Fundentes', funcao: 'Fundente alcalino', funcaoSecundaria: 'Base das fórmulas de retração (RET) junto com o carbonato de magnésio leve.', composicao: NAO_VERIF, cuidados: SILICA_ALERTA, compra: { qtd: '2 kg', kg: 2, valor: 52, cat: 'Bases minerais' } },
  { slug: 'caulim', nome: 'Caulim', nomesAlternativos: 'Caulim lavado', nomeEn: 'Kaolin / China Clay', formula: 'Al₂Si₂O₅(OH)₄ (fórmula ideal da caulinita)', categoria: 'Argilas', funcao: 'Fornecimento de alumina e sílica', funcaoSecundaria: 'Ajuda a suspensão e a aderência do esmalte cru.', composicao: NAO_VERIF, cuidados: SILICA_ALERTA, compra: { qtd: '1 kg', kg: 1, valor: 19, cat: 'Bases minerais' } },
  { slug: 'argila-plastica', nome: 'Argila plástica (ball clay)', nomeEn: 'Ball Clay', categoria: 'Argilas', funcao: 'Plasticidade, suspensão e retração', composicao: NAO_VERIF, cuidados: SILICA_ALERTA },
  { slug: 'argila-sao-simao', nome: 'Argila São Simão', categoria: 'Argilas', funcao: 'Argila caulinítica de uso cerâmico; fonte de alumina e sílica.', composicao: NAO_VERIF, cuidados: SILICA_ALERTA, compra: { qtd: '1 kg', kg: 1, valor: 22, cat: 'Bases minerais' } },
  { slug: 'carbonato-calcio', nome: 'Carbonato de cálcio', nomesAlternativos: 'Calcita, whiting', nomeEn: 'Whiting / Calcium Carbonate', formula: 'CaCO₃', categoria: 'Carbonatos', funcao: 'Fonte de óxido de cálcio', fusao: 'Fundente importante em alta temperatura.', compra: { qtd: '1 kg', kg: 1, valor: 13, cat: 'Bases minerais' } },
  { slug: 'carbonato-magnesio-leve', nome: 'Carbonato de magnésio leve', nomeEn: 'Light Magnesium Carbonate', formula: 'Carbonato básico de magnésio (composição varia; consultar ficha)', categoria: 'Carbonatos', funcao: 'Fonte de magnésio, retração e efeitos foscos', texturaInf: 'Alta retração na secagem: base dos esmaltes de retração (crawl).', compra: { qtd: '1 kg', kg: 1, valor: 60, cat: 'Bases minerais' } },
  { slug: 'dolomita', nome: 'Dolomita', nomeEn: 'Dolomite', formula: 'CaMg(CO₃)₂ (fórmula ideal)', categoria: 'Carbonatos', funcao: 'Fonte de cálcio e magnésio', texturaInf: 'Favorece superfícies foscas e acetinadas.', compra: { qtd: '1 kg', kg: 1, valor: 10, cat: 'Bases minerais' } },
  { slug: 'frita-boracica', nome: 'Frita borácica', nomeEn: 'Boron Frit', categoria: 'Fritas', funcao: 'Fonte de boro e outros óxidos fundentes', composicao: 'Cadastrar o código comercial e a composição específica da frita adquirida.', compra: { qtd: '1 kg', kg: 1, valor: 55, cat: 'Bases minerais' } },
  { slug: 'frita-alcalina', nome: 'Frita alcalina', nomeEn: 'Alkaline Frit', categoria: 'Fritas', funcao: 'Fonte de óxidos fundentes alcalinos', composicao: 'Cadastrar o código comercial e a composição específica da frita adquirida.' },
  { slug: 'alumina', nome: 'Alumina', nomeEn: 'Alumina / Aluminum Oxide', formula: 'Al₂O₃', categoria: 'Outros', funcao: 'Controle da fusão e da viscosidade', compra: { qtd: '100 g', kg: 0.1, valor: 10, cat: 'Efeitos especiais' } },
  // modificadores e efeitos
  { slug: 'oxido-zinco', nome: 'Óxido de zinco', nomeEn: 'Zinc Oxide', formula: 'ZnO', categoria: 'Modificadores', funcao: 'Cristalização e modificação da fusão', cuidados: METAL_ALERTA, compra: { qtd: '500 g', kg: 0.5, valor: 45, cat: 'Efeitos especiais' } },
  { slug: 'silicato-zirconio', nome: 'Silicato de zircônio', nomesAlternativos: 'Zircônio, zirconita', nomeEn: 'Zircon / Zirconium Silicate', formula: 'ZrSiO₄', categoria: 'Opacificantes', funcao: 'Opacificação', cuidados: 'Evitar inalar o pó; usar máscara ao pesar.', compra: { qtd: '500 g', kg: 0.5, valor: 35, cat: 'Efeitos especiais' } },
  { slug: 'oxido-estanho', nome: 'Óxido de estanho', nomeEn: 'Tin Oxide', formula: 'SnO₂', categoria: 'Opacificantes', funcao: 'Opacificação' },
  { slug: 'dioxido-titanio', nome: 'Dióxido de titânio', nomeEn: 'Titanium Dioxide', formula: 'TiO₂', categoria: 'Modificadores', funcao: 'Opacidade, cristalização e efeitos reativos', compra: { qtd: '100 g', kg: 0.1, valor: 12, cat: 'Efeitos especiais' } },
  { slug: 'rutilo', nome: 'Rutilo', nomeEn: 'Rutile', formula: 'TiO₂ natural com ferro (composição varia)', categoria: 'Modificadores', funcao: 'Variações de cor, manchas e efeitos reativos', compra: { qtd: '100 g', kg: 0.1, valor: 16, cat: 'Efeitos especiais' } },
  { slug: 'carbeto-silicio', nome: 'Carbeto de silício', nomeEn: 'Silicon Carbide', formula: 'SiC', categoria: 'Modificadores', funcao: 'Formação de gases, crateras e efeitos vulcânicos', cuidados: 'Pó abrasivo: evitar inalação. Uso em pequenas quantidades e em testes controlados.', compra: { qtd: '100 g', kg: 0.1, valor: 30, cat: 'Efeitos especiais' } },
  // óxidos e colorantes
  { slug: 'oxido-ferro-vermelho', nome: 'Óxido de ferro vermelho', nomeEn: 'Red Iron Oxide', formula: 'Fe₂O₃', categoria: 'Óxidos', funcao: 'Colorante', corInf: 'Mel, ocre, ferrugem, marrom', cuidados: METAL_ALERTA,
    tonalidades: [{ nome: 'Mel', hex: '#C98B3A' }, { nome: 'Ocre', hex: '#B07A2A' }, { nome: 'Ferrugem', hex: '#8E4B26' }, { nome: 'Marrom', hex: '#5C3A24' }], compra: { qtd: '100 g', kg: 0.1, valor: 10, cat: 'Colorantes' } },
  { slug: 'oxido-ferro-preto', nome: 'Óxido de ferro preto', nomeEn: 'Black Iron Oxide', formula: 'Fe₃O₄', categoria: 'Óxidos', funcao: 'Colorante', corInf: 'Marrom, grafite, preto', cuidados: METAL_ALERTA,
    tonalidades: [{ nome: 'Marrom', hex: '#4E3527' }, { nome: 'Grafite', hex: '#3A3734' }, { nome: 'Preto', hex: '#1F1C1A' }], compra: { qtd: '100 g', kg: 0.1, valor: 15, cat: 'Colorantes' } },
  { slug: 'oxido-cobalto', nome: 'Óxido de cobalto', nomeEn: 'Cobalt Oxide', formula: 'Conforme especificação comercial', categoria: 'Óxidos', funcao: 'Colorante muito forte (pequenas quantidades)', corInf: 'Azul-claro, azul intenso, azul-escuro', cuidados: METAL_ALERTA,
    tonalidades: [{ nome: 'Azul-claro', hex: '#7C9CC4' }, { nome: 'Azul intenso', hex: '#2D4F9A' }, { nome: 'Azul-escuro', hex: '#1B2C5C' }], compra: { qtd: '100 g', kg: 0.1, valor: 118, cat: 'Colorantes' } },
  { slug: 'oxido-cobre', nome: 'Óxido de cobre negro', nomeEn: 'Black Copper Oxide', formula: 'CuO', categoria: 'Óxidos', funcao: 'Colorante', corInf: 'Verde, turquesa, verde-escuro', cuidados: METAL_ALERTA,
    tonalidades: [{ nome: 'Verde', hex: '#4F8A5B' }, { nome: 'Turquesa', hex: '#3E9A93' }, { nome: 'Verde-escuro', hex: '#2C4D38' }], compra: { qtd: '100 g', kg: 0.1, valor: 24, cat: 'Colorantes' } },
  { slug: 'carbonato-cobre', nome: 'Carbonato de cobre', nomeEn: 'Copper Carbonate', formula: 'Conforme especificação comercial', categoria: 'Carbonatos', funcao: 'Colorante', corInf: 'Verde e turquesa', cuidados: METAL_ALERTA,
    tonalidades: [{ nome: 'Verde', hex: '#5E9566' }, { nome: 'Turquesa', hex: '#4AA59C' }] },
  { slug: 'oxido-cromo', nome: 'Óxido de cromo verde', nomeEn: 'Chrome Oxide Green', formula: 'Cr₂O₃', categoria: 'Óxidos', funcao: 'Colorante', corInf: 'Verde, oliva, musgo', cuidados: METAL_ALERTA,
    tonalidades: [{ nome: 'Verde', hex: '#4D6B3C' }, { nome: 'Oliva', hex: '#6B6B3A' }, { nome: 'Musgo', hex: '#5A6640' }], compra: { qtd: '100 g', kg: 0.1, valor: 24, cat: 'Colorantes' } },
  { slug: 'dioxido-manganes', nome: 'Dióxido de manganês', nomeEn: 'Manganese Dioxide', formula: 'MnO₂', categoria: 'Óxidos', funcao: 'Colorante', corInf: 'Marrom, violeta, preto, efeitos metálicos', cuidados: METAL_ALERTA + ' Os vapores de manganês na queima exigem ventilação do forno.',
    tonalidades: [{ nome: 'Marrom', hex: '#5A3B2E' }, { nome: 'Violeta', hex: '#5E4459' }, { nome: 'Preto', hex: '#241E1F' }], compra: { qtd: '100 g', kg: 0.1, valor: 10, cat: 'Colorantes' } },
  // aditivos
  { slug: 'agua-destilada', nome: 'Água destilada ou deionizada', nomeEn: 'Distilled / Deionized Water', formula: 'H₂O', categoria: 'Aditivos', funcao: 'Veículo líquido: controla concentração e viscosidade', funcaoSecundaria: 'Preferir destilada ou deionizada para padronizar os testes.', compra: { qtd: '5 L', kg: 5, valor: 20, cat: 'Aditivos' } },
  { slug: 'goma-cmc', nome: 'Goma CMC', nomesAlternativos: 'Carboximetilcelulose', nomeEn: 'CMC Gum', categoria: 'Aditivos', funcao: 'Ligante e auxiliar de aplicação com pincel', funcaoSecundaria: 'Melhora a aderência ao biscoito, retarda a secagem e reduz o pó. Pode sofrer degradação microbiológica.', observacoes: 'Proporção experimental inicial: 0,3 a 1 g por 100 g de esmalte seco.', compra: { qtd: '100 g', kg: 0.1, valor: 30, cat: 'Aditivos' } },
  { slug: 'bentonita', nome: 'Bentonita', nomeEn: 'Bentonite', categoria: 'Aditivos', funcao: 'Suspensor: estabiliza a mistura', funcaoSecundaria: 'Pode aumentar a retração na secagem.', observacoes: 'Proporção experimental inicial: 1 a 2 g por 100 g de esmalte seco, quando necessário.', composicao: NAO_VERIF, compra: { qtd: '1 kg', kg: 1, valor: 19, cat: 'Aditivos' } },
  { slug: 'glicerina', nome: 'Glicerina', nomeEn: 'Glycerin', formula: 'C₃H₈O₃', categoria: 'Aditivos', funcao: 'Umectante', funcaoSecundaria: 'Pode modificar o tempo de secagem e o comportamento na aplicação.', observacoes: 'Sem dosagem universal cadastrada.', compra: { qtd: '100 ml', kg: 0.1, cat: 'Aditivos' } },
  // conservantes (materiais de estudo)
  { slug: 'conservante-bit', nome: 'Conservante à base de BIT', nomesAlternativos: 'Benzisotiazolinona (BIT), formulação comercial', nomeEn: 'BIT-based preservative', formula: 'BIT: C₇H₅NOS (princípio ativo)', categoria: 'Conservantes', funcao: 'Conservante industrial para sistemas aquosos (tintas e suspensões minerais)', funcaoSecundaria: 'Conservante prioritário para pesquisa.', observacoes: 'A concentração deve seguir a ficha técnica do produto adquirido, considerando o teor de princípio ativo. Sem dosagem automática.', cuidados: 'Conservante industrial: pode causar sensibilização da pele. Usar luvas e seguir a ficha de segurança.', compra: { qtd: '100 ml', kg: 0.1, cat: 'Aditivos' } },
  { slug: 'benzoato-sodio', nome: 'Benzoato de sódio', nomeEn: 'Sodium Benzoate', formula: 'C₇H₅NaO₂', categoria: 'Conservantes', funcao: 'Conservante (material de estudo)', funcaoSecundaria: 'Mais eficaz em formulações ácidas.' },
  { slug: 'sorbato-potassio', nome: 'Sorbato de potássio', nomeEn: 'Potassium Sorbate', formula: 'C₆H₇KO₂', categoria: 'Conservantes', funcao: 'Conservante (material de estudo)', funcaoSecundaria: 'Mais eficaz em formulações ácidas.' },
  { slug: 'fenoxietanol', nome: 'Fenoxietanol', nomeEn: 'Phenoxyethanol', formula: 'C₈H₁₀O₂', categoria: 'Conservantes', funcao: 'Conservante (material de estudo)', funcaoSecundaria: 'Utilizado em determinadas formulações aquosas.' },
  { slug: 'mit', nome: 'Metilisotiazolinona (MIT)', nomeEn: 'Methylisothiazolinone', formula: 'C₄H₅NOS', categoria: 'Conservantes', funcao: 'Conservante industrial (material de estudo)', cuidados: 'Risco de sensibilização da pele. Usar luvas.' },
  // massas cerâmicas
  { slug: 'massa-branca', nome: 'Argila branca', categoria: 'Massas cerâmicas', funcao: 'Massa cerâmica para placas de teste', observacoes: 'Registrar a temperatura de maturação da massa utilizada.' },
  { slug: 'massa-tabaco', nome: 'Argila tabaco', categoria: 'Massas cerâmicas', funcao: 'Massa cerâmica para placas de teste', observacoes: 'Registrar a temperatura de maturação da massa utilizada.' },
  { slug: 'massa-terracota', nome: 'Terracota', categoria: 'Massas cerâmicas', funcao: 'Massa cerâmica para placas de teste', observacoes: 'Registrar a temperatura de maturação da massa utilizada.' },
]
const matId = (slug: string) => 'mat-' + slug

/* ------------------------------------------------------------------ receitas */

type I = [slug: string, pct: number, classe?: Ingrediente['classe']]
const R: { cod: string; nome: string; fam: string[]; ings: I[]; agua?: number; objetivo?: string; referencia?: string; fonte?: string; status?: string; parametros?: string; tags?: string[] }[] = []
const PARAM_RET = 'Cone 6 como alvo. Temperatura de referência: aproximadamente 1220 °C, ajustada pelo trabalho térmico. Atmosfera de oxidação, resfriamento natural. Testar três espessuras de aplicação e diferentes massas cerâmicas. Uso decorativo.'
const HIP_RET = 'A classificação leve/intermediária/intensa é uma hipótese a ser verificada experimentalmente.'
R.push(
  { cod: 'RET-001', nome: 'Base de retração leve', fam: ['B05'], ings: [['sienito-nefelinico', 70], ['carbonato-magnesio-leve', 25], ['argila-plastica', 5]], objetivo: 'Investigar retração e formação de ilhas de esmalte. ' + HIP_RET, parametros: PARAM_RET },
  { cod: 'RET-002', nome: 'Base de retração intermediária', fam: ['B05'], ings: [['sienito-nefelinico', 60], ['carbonato-magnesio-leve', 35], ['argila-plastica', 5]], objetivo: HIP_RET, parametros: PARAM_RET },
  { cod: 'RET-003', nome: 'Base de retração intensa', fam: ['B05'], ings: [['sienito-nefelinico', 50], ['carbonato-magnesio-leve', 45], ['argila-plastica', 5]], objetivo: HIP_RET, parametros: PARAM_RET },
)
const CACTUS: I[] = [['oxido-cromo', 0.5, 'corante'], ['oxido-ferro-vermelho', 1.5, 'corante'], ['goma-cmc', 0.3, 'aditivo']]
const OBJ_CACTUS = 'Verde musgo, relevo, aparência mineral, textura semelhante à pele de réptil, acabamento predominantemente fosco.'
R.push(
  { cod: 'RET-004', nome: 'Cactus 01', fam: ['B05', 'B03'], ings: [['sienito-nefelinico', 60], ['carbonato-magnesio-leve', 35], ['argila-plastica', 5], ...CACTUS], agua: 100, objetivo: OBJ_CACTUS, referencia: 'Referência estética: Coyote Cactus Crawl MBG063 (não é reprodução confirmada).', parametros: PARAM_RET, tags: ['Musgo', 'Pele de réptil', 'Escamas'] },
  { cod: 'RET-004A', nome: 'Cactus 01 · variante sobre RET-001', fam: ['B05', 'B03'], ings: [['sienito-nefelinico', 70], ['carbonato-magnesio-leve', 25], ['argila-plastica', 5], ...CACTUS], agua: 100, objetivo: OBJ_CACTUS + ' Variante com a base de retração leve.', referencia: 'Referência estética: Coyote Cactus Crawl MBG063.', parametros: PARAM_RET, tags: ['Musgo', 'Pele de réptil'] },
  { cod: 'RET-004B', nome: 'Cactus 01 · variante sobre RET-003', fam: ['B05', 'B03'], ings: [['sienito-nefelinico', 50], ['carbonato-magnesio-leve', 45], ['argila-plastica', 5], ...CACTUS], agua: 100, objetivo: OBJ_CACTUS + ' Variante com a base de retração intensa.', referencia: 'Referência estética: Coyote Cactus Crawl MBG063.', parametros: PARAM_RET, tags: ['Musgo', 'Escamas'] },
  { cod: 'RET-005', nome: 'Ball Crawl', fam: ['B05'], ings: [['sienito-nefelinico', 50], ['carbonato-magnesio-leve', 50]], objetivo: 'Estudar a retração utilizando uma base de apenas dois ingredientes.', fonte: 'Receita de referência para investigação. Fonte bibliográfica específica ainda a confirmar.', parametros: PARAM_RET },
)
const FLX_ALERTA = 'Depende da escolha da frita específica e pode escorrer em excesso em alta temperatura. Testar em amostras pequenas, sobre placas refratárias de proteção.'
R.push(
  { cod: 'FLX-001', nome: 'Fundente transparente', fam: ['B08', 'B01'], ings: [['frita-boracica', 90], ['caulim', 10], ['goma-cmc', 0.5, 'aditivo']], agua: 95, referencia: 'Referência: Mayco Pottery Cascade (não é reprodução confirmada).', objetivo: FLX_ALERTA },
  { cod: 'FLX-002', nome: 'Fundente leitoso', fam: ['B08'], ings: [['frita-boracica', 85], ['caulim', 10], ['silicato-zirconio', 5], ['goma-cmc', 0.5, 'aditivo']], agua: 95, objetivo: FLX_ALERTA },
  { cod: 'FLX-003', nome: 'Fundente branco', fam: ['B08', 'B02'], ings: [['frita-boracica', 80], ['caulim', 10], ['silicato-zirconio', 10], ['goma-cmc', 0.5, 'aditivo']], agua: 95, referencia: 'Referência estética: Mayco White Cascade PC-602 (não é reprodução confirmada).', objetivo: FLX_ALERTA },
)
const VAR = 'Modelo experimental de adição a uma base transparente brilhante ainda a selecionar. Não é fórmula completa: escolha a base no editor.'
R.push(
  { cod: 'VAR-AZ', nome: 'Variação cromática · azul', fam: ['B01'], ings: [['oxido-cobalto', 0.5, 'corante']], objetivo: VAR, status: 'Modelo de adição — base a selecionar' },
  { cod: 'VAR-VD', nome: 'Variação cromática · verde', fam: ['B01'], ings: [['carbonato-cobre', 3, 'corante']], objetivo: VAR, status: 'Modelo de adição — base a selecionar' },
  { cod: 'VAR-MR', nome: 'Variação cromática · marrom', fam: ['B01'], ings: [['oxido-ferro-vermelho', 5, 'corante']], objetivo: VAR, status: 'Modelo de adição — base a selecionar' },
  { cod: 'VAR-BO', nome: 'Variação cromática · branco opaco', fam: ['B02'], ings: [['silicato-zirconio', 10, 'opacificante']], objetivo: VAR, status: 'Modelo de adição — base a selecionar' },
)
const recId = (cod: string) => 'rec-' + cod.toLowerCase()

/* ------------------------------------------------------------------ curvas */

const CURVAS: Omit<Curva, keyof Base>[] = [
  { codigo: 'CQ-001', nome: 'Resfriamento lento Crystal Nebula', tempInicial: 25, atmosfera: 'Oxidação', cone: '5–6', resfriamentoNatural: 1,
    segmentos: [{ taxa: 56, alvo: 104, patamar: 0 }, { taxa: 194, alvo: 1093, patamar: 0 }, { taxa: 83, alvo: 1204, patamar: 15 }, { taxa: -278, alvo: 1177, patamar: 15 }, { taxa: -69, alvo: 760, patamar: 0 }],
    status: 'Referência comercial transcrita, pendente de conferência com o rótulo original antes da utilização.', fonte: 'Coyote, série Slow Cool Crystal (convertida para Celsius).', observacoes: 'Após o último segmento, resfriamento natural.' },
  { codigo: 'CQ-002', nome: 'Referência cone 6', tempInicial: 25, atmosfera: 'Oxidação', cone: '6', resfriamentoNatural: 1, segmentos: [],
    status: 'Rampas e patamares ainda a definir.', observacoes: 'Temperatura máxima inicial de referência: aproximadamente 1220 °C. Não converter automaticamente a temperatura máxima em cone sem considerar o trabalho térmico.' },
  { codigo: 'CQ-003', nome: 'Biscoito 1050 °C', tempInicial: 25, atmosfera: 'Oxidação', cone: '04', resfriamentoNatural: 1,
    segmentos: [{ taxa: 60, alvo: 200, patamar: 0 }, { taxa: 114, alvo: 600, patamar: 0 }, { taxa: 180, alvo: 1050, patamar: 15 }],
    status: 'Sugestão publicada por terceiros; adaptar ao próprio forno.', fonte: 'Ateliê do Quintal Cerâmica (@ateliedoquintalceramica, Instagram)' },
  { codigo: 'CQ-004', nome: 'Esmalte 1260 °C', tempInicial: 40, atmosfera: 'Oxidação', cone: '8', resfriamentoNatural: 1,
    segmentos: [{ taxa: 190, alvo: 800, patamar: 0 }, { taxa: 133, alvo: 1200, patamar: 0 }, { taxa: 60, alvo: 1260, patamar: 20 }],
    status: 'Sugestão publicada por terceiros; adaptar ao próprio forno.', fonte: 'Ateliê do Quintal Cerâmica (@ateliedoquintalceramica, Instagram)' },
]
const curvaId = (cod: string) => 'crv-' + cod.toLowerCase()

/* ------------------------------------------------------ engenharia reversa */

const COM: (Omit<Comercial, keyof Base | 'familias' | 'fotos'> & { id: string; fam: string[]; curva?: string; receitas: string[] })[] = [
  { id: 'com-er-001', codigo: 'MBG164', fabricante: 'Coyote', nome: 'Crystal Nebula', serie: 'Slow Cool Crystal', fam: ['B07'], cone: '5–6', curva: 'CQ-001',
    declarados: ['Argila', 'Frita cerâmica', 'Pigmentos', 'Água', 'Conservantes'],
    hipoteses: ['Óxido de zinco', 'Sílica', 'Dióxido de titânio', 'Ferro', 'Rutilo'],
    instrucoes: 'Resfriamento controlado (ver CQ-001). Uso decorativo conforme referência estudada.', fontes: [], receitas: [],
    observacoes: 'ER-001. Referência estética: amarelo cristalino. Os possíveis ingredientes são hipóteses de investigação, não componentes confirmados.' },
  { id: 'com-er-002', codigo: 'PC-602', fabricante: 'Mayco', nome: 'White Cascade', serie: 'Pottery Cascade', fam: ['B08'], temperatura: 'Faixa original estudada: aproximadamente 999–1031 °C. Aplicações em temperaturas superiores apenas mediante testes.',
    declarados: [], documentacao: 'Dados preliminares da documentação da linha Pottery Cascade, pendentes de conferência da ficha original e da versão específica do produto: água 46,5–49,6%; frita cerâmica 40,3–42,9%; argila ou caulim 3,7–4%.',
    hipoteses: ['Frita borácica', 'Caulim', 'Silicato de zircônio (opacificação do branco)'],
    instrucoes: 'Funções: modificar a fluidez de outros esmaltes, produzir escorrimentos, criar transições, misturar esmaltes e produzir efeitos marmorizados.',
    fontes: ['https://www.maycocolors.com/product/pc-602-white-cascade/', 'https://www.ceramicraft.com.au/resources/mayco-pottery-cascades-glazes-safety-data-sheet.pdf'], receitas: ['FLX-001', 'FLX-002', 'FLX-003'], observacoes: 'ER-002.' },
  { id: 'com-er-003', codigo: 'MBG063', fabricante: 'Coyote', nome: 'Cactus Crawl', fam: ['B05'],
    declarados: [], hipoteses: ['Carbonato de magnésio leve', 'Sienito nefelínico', 'Caulim', 'Argila plástica', 'Óxido de cromo', 'Óxido de ferro'],
    instrucoes: 'Características estudadas: aplicação espessa, formação de rachaduras antes da queima, retração durante o processo, exposição parcial da argila.',
    fontes: [], receitas: ['RET-001', 'RET-002', 'RET-003', 'RET-004', 'RET-004A', 'RET-004B', 'RET-005'], observacoes: 'ER-003. Referência estética: verde musgo, escamas e textura mineral.' },
]

/* -------------------------------------------------- fornecedores e compras */

const FORN: (Omit<Fornecedor, keyof Base> & { id: string })[] = [
  { id: 'for-nova-farias', nome: 'Cerâmica Nova Farias', url: 'https://www.ceramicanovafarias.com.br/' },
  { id: 'for-risi', nome: 'Risi', url: 'https://risi.com.br/' },
  { id: 'for-benedito', nome: 'Ateliê da Benedito', url: 'https://www.ateliedabenedito.com.br/' },
  { id: 'for-faferia', nome: 'Faferia Cerâmica', url: 'https://faferiaceramica.com.br/' },
  { id: 'for-molda', nome: 'Molda Cerâmica', url: 'https://www.moldaceramica.com.br/' },
]
const EQUIP: [string, number][] = [
  ['Balança de precisão de 0,01 g', 70], ['Balança de bancada', 50], ['Peneira de 80 mesh', 80], ['20 potes com tampa (PEAD, boca larga)', 80],
  ['Mixer de uso exclusivo', 100], ['Máscaras PFF3', 50], ['Luvas e óculos', 40], ['Espátulas e colheres', 30],
]

/* ---------------------------------------------------------------- biblioteca */

const ul = (xs: string[]) => '<ul>' + xs.map((x) => `<li>${x}</li>`).join('') + '</ul>'
const tabela = (cab: string[], linhas: string[][]) => `<table><thead><tr>${cab.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${linhas.map((l) => '<tr>' + l.map((c) => `<td>${c}</td>`).join('') + '</tr>').join('')}</tbody></table>`

const BIB: (Omit<Conteudo, keyof Base | 'arquivos' | 'formato'> & { id: string })[] = [
  { id: 'bib-fundamentos', titulo: 'Fundamentos da formulação: os três grupos de um esmalte', categoria: 'Química cerâmica', tags: ['formulação', 'fundamentos'], corpo:
    '<p>Um esmalte cerâmico pode ser entendido em três grupos de ingredientes. É importante diferenciar a <b>química do esmalte queimado</b> (o vidro que se forma no forno) da <b>química da suspensão líquida</b> (o comportamento do esmalte no pote e na aplicação).</p>' +
    '<h3>1. Base mineral</h3><p>Conjunto de matérias-primas que, durante a queima, se fundem ou reagem formando o revestimento cerâmico. É responsável por:</p>' +
    ul(['Temperatura de maturação', 'Fluidez', 'Viscosidade durante a fusão', 'Brilho', 'Opacidade', 'Transparência', 'Expansão térmica', 'Retração', 'Cristalização', 'Textura', 'Resistência química']) +
    '<h3>2. Colorantes e modificadores</h3><p>Ingredientes que modificam a aparência e, em alguns casos, o comportamento físico e químico do esmalte:</p>' +
    ul(['Óxidos metálicos', 'Carbonatos metálicos', 'Pigmentos cerâmicos industriais', 'Opacificantes', 'Agentes de cristalização', 'Agentes de formação de bolhas', 'Modificadores de textura']) +
    '<h3>3. Aditivos de aplicação</h3><p>Ingredientes destinados principalmente a controlar o comportamento do esmalte antes da queima:</p>' +
    ul(['Água', 'Goma CMC', 'Bentonita', 'Glicerina', 'Conservantes', 'Suspensores', 'Ligantes', 'Defloculantes']) +
    '<p>Nas receitas do laboratório, a base mineral é normalizada em 100%. Colorantes, modificadores e aditivos são calculados como adição sobre o peso da base seca e não alteram os percentuais da base.</p>' },
  { id: 'bib-metodologia', titulo: 'Metodologia de desenvolvimento de esmaltes em quatro etapas', categoria: 'Esmaltes', tags: ['metodologia', 'pesquisa'], corpo:
    '<h3>Etapa 1 — Comportamento físico</h3><p>Desenvolver inicialmente uma base sem colorantes. Avaliar:</p>' + ul(['Fusão', 'Retração', 'Fluidez', 'Aderência', 'Cristalização', 'Formação de bolhas', 'Relevo', 'Textura']) +
    '<h3>Etapa 2 — Acabamento</h3>' + ul(['Fosco', 'Acetinado', 'Semibrilhante', 'Brilhante', 'Transparente', 'Translúcido', 'Opaco']) +
    '<h3>Etapa 3 — Cor</h3>' + ul(['Tipo de colorante', 'Concentração', 'Combinação de colorantes', 'Influência da argila', 'Influência da temperatura']) +
    '<h3>Etapa 4 — Preparação líquida</h3>' + ul(['Proporção de água', 'Suspensão', 'Viscosidade', 'Aplicação com pincel', 'Tempo de secagem', 'Aderência', 'Conservação']) +
    '<blockquote>As etapas não são completamente independentes: alterações de cor, acabamento e composição podem modificar o comportamento físico do esmalte.</blockquote>' +
    '<h3>Critérios de avaliação (0 a 5)</h3>' + ul(['Brilho', 'Opacidade', 'Fluidez', 'Retração', 'Textura', 'Relevo', 'Cristalização', 'Aderência', 'Uniformidade', 'Satisfação estética']) +
    '<h3>Status dos experimentos</h3>' + ul(['Planejado', 'Fórmula experimental', 'Preparado', 'Aguardando queima', 'Queimado', 'Em avaliação', 'Necessita revisão', 'Aprovado artisticamente', 'Reproduzido com sucesso', 'Arquivado']) +
    '<p><b>A aprovação estética não representa aprovação para contato com alimentos.</b></p>' },
  { id: 'bib-colorantes', titulo: 'Óxidos e colorantes: as cores não são fixas', categoria: 'Química cerâmica', tags: ['cor', 'óxidos'], corpo:
    tabela(['Material', 'Fórmula', 'Possíveis tonalidades'], [['Óxido de ferro vermelho', 'Fe₂O₃', 'Mel, ocre, ferrugem, marrom'], ['Óxido de ferro preto', 'Fe₃O₄', 'Marrom, grafite, preto'], ['Óxido de cobalto', 'Conforme especificação comercial', 'Azul-claro, azul intenso, azul-escuro'], ['Óxido de cobre negro', 'CuO', 'Verde, turquesa, verde-escuro'], ['Carbonato de cobre', 'Conforme especificação comercial', 'Verde e turquesa'], ['Óxido de cromo verde', 'Cr₂O₃', 'Verde, oliva, musgo'], ['Dióxido de manganês', 'MnO₂', 'Marrom, violeta, preto, efeitos metálicos']]) +
    '<p>As cores dependem da composição da base, da concentração, da argila, da atmosfera, da temperatura, da espessura e da curva de resfriamento. As amostras de cor nas fichas dos materiais são <b>referências ilustrativas</b>, não resultados garantidos.</p>' +
    '<h3>Estudos de variação cromática</h3><p>Modelos experimentais de adição a uma base transparente brilhante ainda a selecionar (cadastrados nas receitas como VAR-AZ, VAR-VD, VAR-MR e VAR-BO):</p>' +
    tabela(['Variação', 'Adição por 100 g de base'], [['Azul', '0,5 g de óxido de cobalto'], ['Verde', '3 g de carbonato de cobre'], ['Marrom', '5 g de óxido de ferro'], ['Branco opaco', '10 g de silicato de zircônio']]) },
  { id: 'bib-aditivos', titulo: 'Aditivos para esmaltes líquidos', categoria: 'Química cerâmica', tags: ['aditivos', 'conservantes', 'suspensão'], corpo:
    '<h3>Água</h3>' + ul(['Veículo líquido', 'Permite controlar concentração e viscosidade', 'Preferir água destilada ou deionizada para padronizar os testes']) +
    '<h3>Goma CMC</h3>' + ul(['Melhora a aplicação com pincel', 'Auxilia a aderência ao biscoito', 'Retarda a secagem durante a aplicação', 'Reduz o desprendimento de pó', 'Pode sofrer degradação microbiológica']) + '<p>Proporção experimental inicial: 0,3 a 1 g por 100 g de esmalte seco.</p>' +
    '<h3>Bentonita</h3>' + ul(['Auxilia a suspensão das partículas', 'Melhora a estabilidade da mistura', 'Pode aumentar a retração durante a secagem']) + '<p>Proporção experimental inicial: 1 a 2 g por 100 g de esmalte seco, quando necessário.</p>' +
    '<h3>Glicerina</h3><p>Atua como umectante e pode modificar o tempo de secagem e o comportamento na aplicação. Não há dosagem universal.</p>' +
    '<h3>Conservantes</h3><p>Controlam microrganismos, ajudam a preservar aditivos orgânicos e a manter a viscosidade. Não impedem necessariamente sedimentação ou alterações químicas.</p>' +
    tabela(['Conservante', 'Características'], [['Benzoato de sódio', 'Mais eficaz em formulações ácidas'], ['Sorbato de potássio', 'Mais eficaz em formulações ácidas'], ['Fenoxietanol', 'Utilizado em determinadas formulações aquosas'], ['Benzisotiazolinona — BIT', 'Conservante industrial para sistemas aquosos'], ['Metilisotiazolinona — MIT', 'Conservante industrial com risco de sensibilização']]) +
    '<p>Prioridade de pesquisa: formulação comercial à base de BIT, destinada a tintas e suspensões minerais. A concentração deve seguir a ficha técnica do produto adquirido (teor de princípio ativo e condições de uso). O app não sugere dosagens automáticas.</p>' },
  { id: 'bib-conservacao', titulo: 'Conservação e validade de esmaltes', categoria: 'Conservação e armazenamento', tags: ['conservação', 'validade'], corpo:
    '<h3>Esmaltes secos</h3>' + ul(['Geralmente têm boa estabilidade quando protegidos de umidade e contaminação', 'Algumas matérias-primas podem absorver umidade ou se alterar no armazenamento', 'Normalmente não precisam de conservantes microbiológicos']) +
    '<h3>Esmaltes líquidos sem conservante</h3><p>Referências estimativas:</p>' + tabela(['Composição', 'Prazo potencial'], [['Base mineral e água', 'Meses a anos'], ['Base mineral, água e bentonita', 'Meses a anos'], ['Base mineral, água e CMC', 'Semanas a meses'], ['Base mineral, água e goma arábica', 'Dias a semanas']]) +
    '<h3>Esmaltes líquidos com conservante</h3><p>Uma formulação adequadamente conservada pode atingir períodos prolongados de armazenamento, inclusive entre 1 e 3 anos em determinadas condições.</p>' +
    '<blockquote>Essas estimativas não constituem validade garantida. A duração depende de testes, formulação, pH, temperatura, contaminação e eficácia do conservante. O app não atribui validade automaticamente.</blockquote>' +
    '<h3>Sinais de alteração</h3><p><b>Microbiológicos:</b> mofo, mau cheiro, fermentação, degradação da goma.</p><p><b>Físicos e químicos:</b> alteração da viscosidade, perda de aderência, sedimentação excessiva, formação de grumos.</p>' +
    '<h3>Controle de cada lote</h3>' + ul(['Data de fabricação', 'Data de abertura', 'Tipo de conservante', 'Dosagem', 'Concentração do princípio ativo', 'Data da última inspeção', 'Estado de conservação', 'Peso restante', 'Histórico de ajustes', 'Prazo de validade informado ou validado, quando disponível']) },
  { id: 'bib-potes', titulo: 'Potes e organização física', categoria: 'Conservação e armazenamento', tags: ['armazenamento', 'potes', 'etiquetas'], corpo:
    '<p>Padrão de armazenamento: potes de plástico PEAD, boca larga, tampa de rosca e boa vedação.</p>' +
    tabela(['Volume', 'Finalidade'], [['100 ml', 'Testes e pequenas amostras'], ['250 ml', 'Biblioteca de esmaltes'], ['500 ml', 'Esmaltes de uso frequente'], ['1000 ml', 'Estoques maiores']]) +
    ul(['Potes brancos ou translúcidos', 'Vedação interna adequada', 'Evitar tampas metálicas', 'Deixar cerca de 20% de espaço livre para agitação', 'Identificação padronizada', 'Armazenamento em armário fechado']) +
    '<h3>Organização dos estoques</h3>' + ul(['Esmalte-base em pó: 1 kg', 'Esmalte colorido em pó: 250 g', 'Esmalte líquido: 250 ml']) +
    '<h3>Etiquetas</h3><p>Nome do esmalte, código, família, versão, lote, data de preparação, temperatura, cone, advertências e QR Code para a ficha do esmalte.</p>' },
  { id: 'bib-aplicacao', titulo: 'Técnicas de aplicação e combinações de esmaltes', categoria: 'Técnicas de aplicação', tags: ['aplicação', 'pincel', 'sobreposição'], corpo:
    ul(['Pincel', 'Imersão', 'Derramamento', 'Pulverização', 'Sobreposição', 'Aplicação localizada', 'Aplicação espessa', 'Aplicação em camadas', 'Combinação com engobes']) +
    '<p>Registrar em cada teste: número de demãos, peso aplicado, espessura e intervalo de secagem.</p>' +
    '<h3>Combinações</h3><p>Para sobreposições, registrar: esmalte inferior, esmalte superior, ordem de aplicação, número de camadas de cada esmalte, área de sobreposição, resultado visual e grau de escorrimento.</p>' },
  { id: 'bib-mascaramento', titulo: 'Mascaramento e reserva de esmaltação', categoria: 'Técnicas de aplicação', tags: ['mascaramento', 'reserva', 'látex', 'cera', 'fita', 'aplicação'], corpo:
    '<p>O mascaramento é uma técnica utilizada para proteger determinadas áreas da superfície cerâmica durante a aplicação de esmaltes. Permite preservar a argila aparente, delimitar cores, criar grafismos, estabelecer contrastes entre superfícies esmaltadas e não esmaltadas e realizar aplicações sucessivas de diferentes esmaltes.</p>' +
    '<p>Os principais materiais utilizados são o látex líquido, a cera de reserva e a fita adesiva. Cada um apresenta características específicas de aplicação, resistência e acabamento.</p>' +
    '<h3>Possibilidades expressivas</h3>' +
    ul(['Preservação da cor e da textura natural da argila.', 'Contraste entre superfícies brilhantes, foscas e não esmaltadas.', 'Criação de grafismos geométricos ou orgânicos.', 'Delimitação de diferentes cores e acabamentos.', 'Aplicação sequencial de esmaltes.', 'Criação de espaços negativos.', 'Valorização de relevos e detalhes escultóricos.', 'Construção de padrões visuais sobre superfícies tridimensionais.']) +
    tabela(['', 'Látex líquido', 'Cera de reserva', 'Fita adesiva'], [
      ['Melhor para', 'Superfícies irregulares, relevos, desenhos orgânicos', 'Bases de peças, argila aparente, pinceladas livres', 'Linhas precisas, faixas e padrões geométricos'],
      ['Antes da queima', 'Retirar por completo', 'Fica na peça e queima no forno', 'Retirar com cuidado'],
      ['Permite nova cor na área', 'Sim, depois de retirado', 'Pouco prático', 'Sim, depois de retirada'],
    ]) +
    '<h3>Látex líquido (Latex Resist)</h3>' +
    '<p>O látex líquido forma uma película flexível e impermeável que impede a deposição do esmalte diretamente sobre a área protegida. Sua principal vantagem é a possibilidade de remoção antes da queima, permitindo que a superfície seja novamente trabalhada ou receba outro esmalte.</p>' +
    '<p>É especialmente indicado para superfícies irregulares, esculturas, relevos, desenhos orgânicos e grafismos.</p>' +
    '<p><b>Modo de aplicação</b></p>' +
    '<ol><li>Limpar a superfície cerâmica, eliminando poeira e resíduos.</li><li>Aplicar o látex com pincel sobre as áreas que deseja proteger.</li><li>Deixar secar completamente, formando uma película contínua e elástica.</li><li>Aplicar o esmalte pelo método desejado.</li><li>Aguardar a secagem suficiente do esmalte.</li><li>Remover cuidadosamente a película de látex, evitando danificar as bordas esmaltadas.</li><li>Manter a área sem esmalte ou aplicar uma nova cor.</li></ol>' +
    '<p>O látex deve ser <b>completamente removido antes da queima</b>. Quando aplicado sobre esmaltes crus, existe o risco de desprendimento da camada inferior durante a remoção, sendo recomendável realizar testes prévios.</p>' +
    '<h3>Cera de reserva (Wax Resist)</h3>' +
    '<p>A cera de reserva cria uma barreira hidrofóbica que repele esmaltes à base de água. É indicada para proteger bases de peças, preservar áreas de argila aparente e criar desenhos com pinceladas livres.</p>' +
    '<p>Diferentemente do látex, a cera permanece na peça até a queima, quando é eliminada pela ação do calor. O forno deve possuir ventilação adequada.</p>' +
    '<p>Sua principal limitação é a dificuldade de remoção antes da queima, tornando menos prática a correção de erros ou a aplicação posterior de esmaltes sobre a área protegida.</p>' +
    '<p>Eventuais gotas de esmalte acumuladas sobre a cera devem ser removidas antes da queima.</p>' +
    '<p><b>Modo de aplicação</b></p>' +
    '<ol><li>Limpar a superfície cerâmica, eliminando poeira e resíduos.</li><li>Aplicar a cera com pincel sobre as áreas que deseja proteger, como a base da peça, bordas ou desenhos.</li><li>Deixar secar até que a cera forme uma camada firme.</li><li>Aplicar o esmalte pelo método desejado.</li><li>Remover com esponja úmida as gotas de esmalte acumuladas sobre a cera.</li><li>Levar ao forno com ventilação adequada; a cera é eliminada pela ação do calor.</li></ol>' +
    '<h3>Fita adesiva (Tape Resist)</h3>' +
    '<p>A fita adesiva permite criar linhas precisas, padrões geométricos, faixas e divisões entre diferentes cores de esmalte.</p>' +
    '<p>É particularmente eficiente em superfícies lisas e regulares, mas pode apresentar dificuldades de aderência em áreas muito texturizadas, curvas complexas ou superfícies com esmalte cru.</p>' +
    '<p>Deve ser <b>retirada antes da queima</b>, cuidadosamente, para evitar o desprendimento do esmalte nas bordas.</p>' +
    '<p><b>Modo de aplicação</b></p>' +
    '<ol><li>Limpar a superfície cerâmica, eliminando poeira e resíduos.</li><li>Posicionar a fita e pressionar bem as bordas, para que o esmalte não infiltre por baixo.</li><li>Aplicar o esmalte pelo método desejado.</li><li>Aguardar a secagem suficiente do esmalte.</li><li>Retirar a fita devagar, puxando rente à superfície, para não levantar o esmalte das bordas.</li><li>Retocar com pincel pequenas falhas nas bordas, se necessário, e conferir que não restou fita antes da queima.</li></ol>' +
    '<h3>Como registrar no teste</h3>' +
    ul(['Material de reserva: látex, cera ou fita.', 'Onde foi aplicado: sobre o biscoito, sobre esmalte cru ou entre camadas.', 'Esmaltes usados e ordem de aplicação.', 'Espessura ou número de demãos.', 'Quando a reserva foi retirada.', 'Resultado das bordas depois da queima: nítidas, suavizadas ou invadidas pelo esmalte.', 'Fotos antes e depois da queima.']) +
    '<h3>Cuidados técnicos</h3>' +
    '<p>O mascaramento controla a aplicação do esmalte, mas não necessariamente seu comportamento durante a queima. Esmaltes muito fluidos podem ultrapassar os limites estabelecidos pela reserva, invadindo áreas originalmente protegidas.</p>' +
    '<p>A espessura da aplicação, a temperatura, o trabalho térmico, a posição da peça e a interação entre esmaltes influenciam a definição final dos contornos.</p>' +
    '<p>Recomenda-se realizar testes considerando a massa cerâmica, o esmalte, o material de mascaramento e a curva de queima utilizada.</p>' +
    '<blockquote>O mascaramento não deve ser considerado uma barreira de contenção para esmaltes fluidos durante a queima.</blockquote>' },
  { id: 'bib-seguranca', titulo: 'Segurança do laboratório', categoria: 'Segurança no ateliê', tags: ['segurança'], corpo:
    ul(['<b>Sílica cristalina:</b> o pó inalado é nocivo aos pulmões. Pesar e misturar pós com máscara PFF2 ou PFF3.', '<b>Óxidos metálicos:</b> evitar inalação e contato prolongado com a pele.', '<b>Conservantes industriais:</b> podem causar sensibilização; usar luvas e seguir a ficha de segurança.', 'Usar proteção respiratória adequada, luvas e óculos.', 'Garantir ventilação e exaustão, inclusive do forno.', 'Fazer limpeza úmida. <b>Não varrer pós a seco.</b>', 'Usar equipamentos exclusivos para cerâmica (balanças, mixer, colheres).', 'Armazenar fora do alcance de crianças e animais.', 'Proteger as placas do forno contra escorrimentos.', 'Descartar corretamente os resíduos de esmaltes: <b>não descartar na rede de esgoto</b>. Decantar a água de lavagem e destinar o sedimento seco conforme orientação local.', 'Consultar as fichas de segurança (FISPQ) de cada material.']) +
    '<blockquote>Um esmalte não é seguro para contato com alimentos apenas por ser isento de chumbo ou por ter sido queimado em alta temperatura. A segurança depende da queima, da aplicação e de testes laboratoriais de lixiviação.</blockquote>' },
  { id: 'bib-calculo', titulo: 'Como o laboratório calcula as fórmulas', categoria: 'Esmaltes', tags: ['calculadora', 'fórmulas'], corpo:
    ul(['A base mineral é normalizada em 100%.', 'Colorantes, modificadores e aditivos são adições em gramas por 100 g de base seca e não alteram a base.', 'A água é calculada à parte, também por 100 g de base seca.', 'O volume da suspensão só é calculado quando há densidade medida (g/ml). Não se presume que 1 g de esmalte líquido corresponda a 1 ml.', 'Duplicar uma fórmula preserva a versão original.']) },
]

export const TEXTURAS_AUTORAIS = ['Pedra', 'Osso', 'Marfim', 'Musgo', 'Líquen', 'Casca de árvore', 'Pele de réptil', 'Escamas', 'Carapaça', 'Coral', 'Lava', 'Ferrugem', 'Bronze', 'Cobre oxidado', 'Grafite', 'Superfície lunar', 'Cristais', 'Nebulosa']

/* ---------------------------------------------------------------- execução */

async function adicionarFaltantes<T extends { id: string }>(tabela: string, itens: T[]) {
  const existentes = await db.table(tabela).bulkGet(itens.map((i) => i.id))
  const novos = itens.filter((_, k) => !existentes[k])
  if (novos.length) await db.table(tabela).bulkAdd(novos)
  return novos.length
}

/** Unifica famílias, grupos e curvas criados com ids aleatórios em versões anteriores (evita duplicatas entre aparelhos). */
async function unificarAntigos() {
  const t = Date.now()
  const familias = await db.familias.toArray()
  for (const f of FAM) {
    const novoId = famId(f.codigo!)
    const velhos = familias.filter((x) => x.id !== novoId && !x.excluido && (norm(x.nome) === norm(f.antigo) || norm(x.nome) === norm(f.nome)))
    for (const v of velhos) {
      for (const e of await db.esmaltes.where('familias').equals(v.id).toArray())
        await db.esmaltes.update(e.id, { familias: [...new Set(e.familias.map((x) => (x === v.id ? novoId : x)))], atualizadoEm: t })
      await db.familias.update(v.id, { excluido: 1, atualizadoEm: t })
    }
  }
  const { GRUPOS_INICIAIS } = await import('./seed')
  const grupos = await db.grupos.toArray()
  for (const nome of GRUPOS_INICIAIS) {
    const novoId = 'grp-' + norm(nome).replace(/ /g, '-')
    if (!grupos.some((g) => g.id === novoId)) await db.grupos.add({ ...base(novoId), nome })
    for (const v of grupos.filter((g) => g.id !== novoId && !g.excluido && norm(g.nome) === norm(nome))) {
      for (const r of await db.referencias.where('grupos').equals(v.id).toArray())
        await db.referencias.update(r.id, { grupos: [...new Set(r.grupos.map((x) => (x === v.id ? novoId : x)))], atualizadoEm: t })
      await db.grupos.update(v.id, { excluido: 1, atualizadoEm: t })
    }
  }
  // curvas da v2 da biblioteca (textos) com ids aleatórios: mantém uma só por título
  const conteudos = await db.conteudos.where('categoria').equals('Curvas de temperatura').toArray()
  for (const [titulo, id] of [['Queima de biscoito 1050 °C', 'bib-curva-biscoito-1050'], ['Queima de esmalte 1260 °C', 'bib-curva-esmalte-1260']]) {
    const xs = conteudos.filter((c) => c.titulo === titulo && c.id !== id && !c.excluido)
    if (!xs.length) continue
    if (!(await db.conteudos.get(id))) { const { id: _i, ...resto } = xs[0]; await db.conteudos.add({ ...resto, ...base(id), atualizadoEm: SEED_T }) }
    for (const x of xs) await db.conteudos.update(x.id, { excluido: 1, atualizadoEm: t })
  }
}

/** Textos da Biblioteca incluídos depois da primeira semente: entram em todo aparelho que ainda não os tem (pelo id fixo). */
const TEXTOS_POSTERIORES = ['bib-mascaramento']

/** Textos revisados depois de entrar nos aparelhos: atualiza uma vez por aparelho (marca no ajuste). */
const TEXTOS_REVISADOS: [string, string][] = [['bib-mascaramento', 'bib-mascaramento-v2']]

export async function semearConhecimento() {
  for (const [id, marca] of TEXTOS_REVISADOS) {
    if (await db.ajustes.get(marca)) continue
    const atual = await db.conteudos.get(id), novo = BIB.find((b) => b.id === id)
    if (atual && !atual.excluido && novo) await db.conteudos.update(id, { corpo: novo.corpo, tags: novo.tags, atualizadoEm: Date.now() })
    await db.ajustes.put({ chave: marca, valor: true })
  }
  await adicionarFaltantes('conteudos', BIB.filter((b) => TEXTOS_POSTERIORES.includes(b.id)).map(({ id, ...c }) => ({ ...base(id), ...c, formato: 'texto' as const, arquivos: [] })))
  if (await db.ajustes.get('seed-lab-v1')) return
  await unificarAntigos()

  // materiais: reaproveita um material que o usuário já tenha com o mesmo nome
  const atuais = (await db.materiais.toArray()).filter((m) => !m.excluido)
  const idDe = new Map<string, string>()
  const materiais: Material[] = []
  for (const { slug, compra, ...m } of MAT) {
    const igual = atuais.find((x) => norm(x.nome) === norm(m.nome))
    if (igual) { idDe.set(slug, igual.id); continue }
    idDe.set(slug, matId(slug))
    materiais.push({ ...base(matId(slug)), fotos: [], ...m, precoKg: compra?.valor && compra.kg ? +(compra.valor / compra.kg).toFixed(2) : undefined, precoEstimado: compra?.valor ? 1 : 0, verificado: 0 })
  }
  await adicionarFaltantes('materiais', materiais)

  await adicionarFaltantes('familias', FAM.map(({ antigo: _a, ...f }, ordem) => ({ ...base(famId(f.codigo!)), ...f, ordem, materiais: f.materiais?.map((s) => idDe.get(s) ?? matId(s)) })))
  // famílias relacionadas em cada material
  for (const f of FAM) for (const s of f.materiais ?? []) {
    const id = idDe.get(s); if (!id) continue
    const m = await db.materiais.get(id); if (!m || (m.familias ?? []).includes(famId(f.codigo!))) continue
    await db.materiais.update(id, { familias: [...(m.familias ?? []), famId(f.codigo!)] })
  }

  const nomeMat = new Map(MAT.map((m) => [m.slug, m.nome]))
  const receitas: Receita[] = R.map((r) => ({
    ...base(recId(r.cod)), nome: r.nome, codigo: r.cod, familias: r.fam.map(famId), status: r.status ?? EXPERIMENTAL, versaoAtual: 1,
    ingredientes: r.ings.map(([s, p, c]) => ({ materialId: idDe.get(s), nome: nomeMat.get(s)!, percentual: p, classe: c ?? 'base' })),
    aguaMlPor100g: r.agua, objetivo: r.objetivo, referencia: r.referencia, fonte: r.fonte, parametros: r.parametros, tags: r.tags ?? [], ehBase: r.cod.match(/^RET-00[1-3]$|^RET-005$/) ? 1 : 0,
    curvaId: r.cod.startsWith('RET') ? curvaId('CQ-002') : undefined,
  }))
  const criadas = await adicionarFaltantes('receitas', receitas)
  if (criadas) await adicionarFaltantes('versoes', receitas.map((r) => { const { id: _i, ...snap } = r; return { id: 'ver-' + r.id + '-1', receitaId: r.id, versao: 1, criadoEm: SEED_T, nota: 'Versão inicial (base de conhecimento)', snapshot: snap } }))

  await adicionarFaltantes('curvas', CURVAS.map((c) => ({ ...base(curvaId(c.codigo)), ...c })))
  await adicionarFaltantes('comerciais', COM.map(({ id, fam, curva, receitas: _r, ...c }) => ({ ...base(id), ...c, familias: fam.map(famId), fotos: [], curvaId: curva ? curvaId(curva) : undefined })))
  await adicionarFaltantes('fornecedores', FORN.map(({ id, ...f }) => ({ ...base(id), ...f })))

  const compras: Compra[] = []
  for (const m of MAT) if (m.compra) compras.push({ ...base('cmp-' + m.slug), nome: m.nome, categoria: m.compra.cat, materialId: idDe.get(m.slug), quantidade: m.compra.qtd, qtdKg: m.compra.kg, valorEstimado: m.compra.valor, status: 'planejada' })
  EQUIP.forEach(([nome, valor], k) => compras.push({ ...base('cmp-equip-' + k), nome, categoria: 'Equipamentos', quantidade: '1', valorEstimado: valor, status: 'planejada' }))
  await adicionarFaltantes('compras', compras)

  await adicionarFaltantes('conteudos', BIB.map(({ id, ...c }) => ({ ...base(id), ...c, formato: 'texto' as const, arquivos: [] })))

  // relações: engenharia reversa ↔ fórmulas
  const rels: Relacao[] = []
  for (const c of COM) for (const cod of c.receitas) rels.push({ id: `rel-${c.id}-${recId(cod)}`, aTipo: 'comercial', aId: c.id, bTipo: 'receita', bId: recId(cod), criadoEm: SEED_T, atualizadoEm: SEED_T, excluido: 0 })
  rels.push({ id: 'rel-bib-colorantes-var', aTipo: 'conteudo', aId: 'bib-colorantes', bTipo: 'receita', bId: recId('VAR-AZ'), criadoEm: SEED_T, atualizadoEm: SEED_T, excluido: 0 })
  await adicionarFaltantes('relacoes', rels)

  await db.ajustes.put({ chave: 'seed-lab-v1', valor: true })
}
