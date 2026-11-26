// IA do Repertório. A chave da Anthropic fica só aqui, na variável ANTHROPIC_API_KEY da Vercel.
// Três tarefas: interpretar uma busca em linguagem natural, sugerir a catalogação de uma imagem
// e sintetizar o repertório estético a partir do acervo. Nada é gravado aqui: o app mostra para revisão.
import Anthropic from '@anthropic-ai/sdk'
import { exigirLogin } from './_login.js'

const MODELO = 'claude-opus-5-5'
// Só para entender uma busca (traduzir o pedido em termos de museu): rápida e barata, escolha do Marcelo em 23/11/2026.
const MODELO_RAPIDO = 'claude-haiku-5-5'
const RAPIDAS = new Set(['buscar'])
const BETAS = ['server-side-fallback-2026-07-01']
const json = (dados, status = 200) => new Response(JSON.stringify(dados), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } })

// Quanto cada pedido gastou: tokens e buscas na web, somados entre as voltas. O app guarda e mostra em Ajustes.
function somarUso(total, r) {
  const u = r?.usage; if (!u) return total
  const t = total ?? { modelo: r.model, entrada: 0, saida: 0, cacheLido: 0, cacheEscrito: 0, buscas: 0, leituras: 0 }
  t.modelo = r.model || t.modelo
  t.entrada += u.input_tokens ?? 0; t.saida += u.output_tokens ?? 0
  t.cacheLido += u.cache_read_input_tokens ?? 0; t.cacheEscrito += u.cache_creation_input_tokens ?? 0
  t.buscas += u.server_tool_use?.web_search_requests ?? 0; t.leituras += u.server_tool_use?.web_fetch_requests ?? 0
  return t
}

const TIPOS = ['Fotografia', 'Ilustração', 'Escultura', 'Pintura', 'Artista', 'Obra de arte', 'Textura', 'Objeto', 'Forma', 'Paleta cromática', 'Link', 'Vídeo']
// mesma lista de src/lib/ideias.ts
const EFEITOS = ['Escorrido', 'Camadas sobrepostas', 'Crawl (retraído)', 'Cristais', 'Craquelê', 'Variegado', 'Manchado', 'Gotas', 'Fosco', 'Acetinado', 'Brilhante', 'Texturizado', 'Lunar / crateras', 'Breaking (borda clara)', 'Gradiente', 'Pintado / pincelado', 'Engobe', 'Óxidos', 'Cinzas', 'Redução', 'Lustre / metálico']
// Limites de tamanho ficam na descrição (o formato estruturado não aceita minItems/maxItems) e são aplicados ao final.
const lista = (desc) => ({ type: 'array', items: { type: 'string' }, description: desc })

const ESQUEMAS = {
  buscar: {
    type: 'object', additionalProperties: false, required: ['leitura', 'consultas', 'outras_linguas'],
    properties: {
      leitura: { type: 'string', description: 'Uma frase curta em português dizendo como o pedido foi entendido.' },
      consultas: {
        type: 'array', description: 'De 3 a 6 consultas.',
        items: {
          type: 'object', additionalProperties: false, required: ['q', 'universo'],
          properties: {
            q: { type: 'string', description: 'Consulta curta em inglês (2 a 4 palavras), como se digita na busca de um acervo de museu.' },
            universo: { type: 'string', description: 'Um dos universos criativos informados.' },
          },
        },
      },
      outras_linguas: {
        type: 'array', description: 'A mesma busca nos idiomas em que os acervos europeus catalogam: uma consulta curta para cada idioma (nl, da, fr, de, it, es, pt).',
        items: {
          type: 'object', additionalProperties: false, required: ['lingua', 'q'],
          properties: {
            lingua: { type: 'string', enum: ['nl', 'da', 'fr', 'de', 'it', 'es', 'pt'] },
            q: { type: 'string', description: 'Consulta curta (1 a 3 palavras) nesse idioma, com o termo que um catalogador de museu usaria.' },
          },
        },
      },
    },
  },
  catalogar: {
    type: 'object', additionalProperties: false,
    required: ['titulo', 'descricao', 'tipo', 'tags', 'grupos', 'paleta', 'aplicacoes', 'atribuicao'],
    properties: {
      titulo: { type: 'string', description: 'Título descritivo curto em português. Se o título dado já é bom, repita-o.' },
      descricao: { type: 'string', description: 'Duas ou três frases sobre o que se vê: forma, material aparente, superfície, cor, gesto.' },
      tipo: { type: 'string', enum: TIPOS },
      tags: lista('Até 10 tags em português, minúsculas, específicas (técnica, forma, textura, tema).'),
      grupos: lista('Até 4 nomes de grupos existentes que combinam. Só nomes da lista dada; vazio se nenhum servir.'),
      paleta: lista('Até 5 cores dominantes em hexadecimal #rrggbb.'),
      aplicacoes: lista('Até 4 ideias curtas de como isso pode virar estudo ou peça de cerâmica.'),
      atribuicao: {
        type: 'object', additionalProperties: false, required: ['autor', 'certeza', 'nota'],
        properties: {
          autor: { type: 'string', description: 'Autor só se ele veio nos dados informados. Caso contrário, string vazia.' },
          certeza: { type: 'string', enum: ['informada', 'desconhecida'] },
          nota: { type: 'string', description: 'O que se pode dizer sobre a origem sem inventar (ex.: "Parece cerâmica japonesa, autoria não identificada").' },
        },
      },
    },
  },
  gosto: {
    type: 'object', additionalProperties: false, required: ['resumo', 'consultas', 'evitar'],
    properties: {
      resumo: { type: 'string', description: 'Duas ou três frases em segunda pessoa sobre o gosto visual da pessoa, concretas (formas, superfícies, temas, épocas).' },
      consultas: {
        type: 'array', description: 'De 10 a 16 consultas para acervos de museus: metade perto do gosto, metade um passo além (vizinhos que ela provavelmente vai gostar e ainda não viu).',
        items: {
          type: 'object', additionalProperties: false, required: ['q', 'universo', 'porque'],
          properties: {
            q: { type: 'string', description: 'Consulta curta em inglês (2 a 4 palavras), como se digita na busca de um acervo de museu.' },
            universo: { type: 'string', description: 'Um dos universos criativos informados.' },
            porque: { type: 'string', description: 'Motivo em português, curto (até 8 palavras), ligado ao gosto. Ex.: "texturas craqueladas que você curte".' },
          },
        },
      },
      evitar: lista('Até 8 termos curtos em inglês, minúsculas, que aparecem nas recusas e devem ser evitados.'),
    },
  },
  afins: {
    type: 'object', additionalProperties: false, required: ['afins'],
    properties: {
      afins: {
        type: 'array', description: 'De 12 a 20 artistas que NÃO estão na lista de estudos.',
        items: {
          type: 'object', additionalProperties: false, required: ['nome', 'consulta', 'perto_de', 'porque'],
          properties: {
            nome: { type: 'string', description: 'Nome do artista como aparece em museus e revistas (grafia ocidental).' },
            consulta: { type: 'string', description: 'Consulta curta em inglês para achar obras dele: em geral só o nome; nome + material se o nome for comum.' },
            perto_de: { type: 'string', description: 'Qual artista dos estudos ele lembra (um nome da lista).' },
            porque: { type: 'string', description: 'Motivo em português, até 8 palavras, concreto (superfície, forma, tema).' },
          },
        },
      },
    },
  },
  explicar: {
    type: 'object', additionalProperties: false, required: ['oque', 'tecnica', 'origem', 'olhar', 'ideias'],
    properties: {
      oque: { type: 'string', description: 'Uma ou duas frases: o que é a peça.' },
      tecnica: { type: 'string', description: 'Como provavelmente foi feita: material, construção (torno, placa, acordelado, molde, entalhe), superfície, esmalte ou engobe, queima. Diga "provavelmente" quando for leitura da imagem.' },
      origem: { type: 'string', description: 'Contexto cultural e histórico, só a partir dos dados informados e do que é bem estabelecido sobre essa tradição. Sem inventar procedência.' },
      olhar: lista('Até 4 detalhes para observar com atenção na peça (forma, proporção, textura, gesto, cor).'),
      ideias: lista('Até 4 ideias concretas de estudo ou peça para o ateliê de um ceramista, partindo desta obra.'),
    },
  },
  perfil: {
    type: 'object', additionalProperties: false,
    required: ['sintese', 'paleta', 'temas', 'linguagens', 'formas', 'texturas', 'artistas', 'tendencias', 'evolucao', 'proximos'],
    properties: {
      sintese: { type: 'string', description: 'Um parágrafo curto, em segunda pessoa, sobre o repertório.' },
      paleta: lista('Até 8 cores recorrentes em hexadecimal #rrggbb.'),
      temas: lista('Até 8 temas recorrentes.'),
      linguagens: lista('Até 8 linguagens visuais e estéticas.'),
      formas: lista('Até 8 formas e volumes preferidos.'),
      texturas: lista('Até 8 texturas e superfícies preferidas.'),
      artistas: lista('Até 10 artistas que aparecem nos dados (nunca inventar nomes).'),
      tendencias: lista('Até 6 tendências percebidas.'),
      evolucao: { type: 'string', description: 'Como o interesse mudou entre o mais antigo e o mais recente. Vazio se não houver dados.' },
      proximos: lista('Até 6 consultas curtas em inglês para explorar a seguir, perto e um pouco além do repertório.'),
    },
  },
}
// inspiração vinda do acervo (pastas do Pinterest, Instagram, referências)
ESQUEMAS.acervo = {
  type: 'object', additionalProperties: false, required: ['leitura', 'consultas'],
  properties: {
    leitura: { type: 'string', description: 'Uma frase em segunda pessoa sobre o que as pastas e referências mostram do repertório visual da pessoa.' },
    consultas: {
      type: 'array', description: 'De 12 a 16 consultas para acervos de museus e coleções abertas, inspiradas nas pastas. Metade próxima do que já está nas pastas, metade um passo além (o que um bom curador mostraria a quem montou essas pastas).',
      items: {
        type: 'object', additionalProperties: false, required: ['q', 'universo', 'pasta', 'porque'],
        properties: {
          q: { type: 'string', description: 'Consulta curta em inglês (2 a 4 palavras), específica e visual (artista, técnica, forma, movimento), nunca genérica como "art" ou "design".' },
          universo: { type: 'string', description: 'Um dos universos criativos informados.' },
          pasta: { type: 'string', description: 'Nome exato da pasta (ou "acervo") que inspirou a consulta.' },
          porque: { type: 'string', description: 'Motivo em português, curto (até 8 palavras).' },
        },
      },
    },
  },
}
// busca por foto: mesma resposta da busca por texto
ESQUEMAS.foto = ESQUEMAS.buscar
// curtidas agrupadas em temas
ESQUEMAS.agrupar = {
  type: 'object', additionalProperties: false, required: ['temasCurtidas'],
  properties: {
    temasCurtidas: {
      type: 'array', description: 'De 3 a 8 temas que ligam as obras curtidas.',
      items: {
        type: 'object', additionalProperties: false, required: ['nome', 'descricao', 'ids', 'consulta'],
        properties: {
          nome: { type: 'string', description: 'Nome curto e concreto do tema em português (2 a 4 palavras), como "superfícies craqueladas" ou "bichos híbridos".' },
          descricao: { type: 'string', description: 'Uma frase dizendo o que une essas obras: forma, superfície, gesto, cor, época.' },
          ids: lista('Ids das obras curtidas que pertencem ao tema (só ids da lista dada; uma obra pode estar em mais de um tema).'),
          consulta: { type: 'string', description: 'Consulta curta em inglês para buscar mais obras desse tema nos acervos.' },
        },
      },
    },
  },
}

// o que foi compartilhado de outro app: transcreve, resume e sugere para onde vai
ESQUEMAS.receber = {
  type: 'object', additionalProperties: false, required: ['titulo', 'transcricao', 'resumo', 'autor', 'destino', 'porque', 'tags', 'esmalte', 'perguntas'],
  properties: {
    titulo: { type: 'string', description: 'Título curto e descritivo em português (até 8 palavras).' },
    transcricao: { type: 'string', description: 'Todo o texto legível nas imagens (legendas, nomes, @perfis, preços, títulos), copiado como está, sem os botões e menus do aplicativo. Vazio se não houver texto.' },
    resumo: { type: 'string', description: 'Uma ou duas frases dizendo o que é o conteúdo.' },
    autor: { type: 'string', description: 'Artista, ateliê ou perfil, só se aparecer no conteúdo (ex.: @perfil). Prefira o nome do artista ao @ quando os dois aparecem. Senão, vazio.' },
    destino: { type: 'string', enum: ['ideia', 'referencia', 'nota', 'artista'], description: 'ideia = esmaltação ou superfície cerâmica que dá vontade de testar; referencia = imagem de inspiração visual (forma, obra, objeto, natureza); artista = obras ou perfil de um artista identificado, para estudar o trabalho dele; nota = texto, aula, receita, informação ou lembrete.' },
    porque: { type: 'string', description: 'Motivo do destino, até 12 palavras.' },
    tags: lista('Até 6 tags em português, minúsculas.'),
    esmalte: {
      type: 'object', additionalProperties: false, required: ['materiais', 'como', 'efeitos', 'queima', 'argila', 'notas'],
      description: 'Só quando o destino é ideia; senão, tudo vazio.',
      properties: {
        materiais: lista('Esmaltes, pigmentos e materiais prováveis, um por item, no formato "Nome: para que serve". Concretos: tipo de esmalte, óxidos ou pigmentos, base, argila.'),
        como: { type: 'string', description: 'Passo a passo provável, começando com "Hipótese:" e com os passos separados por ponto e vírgula.' },
        efeitos: { type: 'array', items: { type: 'string', enum: EFEITOS }, description: 'Efeitos de superfície que aparecem.' },
        queima: { type: 'string', description: 'Queima provável (temperatura, atmosfera). Diga que é provável quando não estiver escrito.' },
        argila: { type: 'string', description: 'Argila aparente.' },
        notas: { type: 'string', description: 'Parágrafos curtos separados por linha em branco, cada um começando com um rótulo curto e dois-pontos (ex.: "Cuidados: ...", "Primeiro teste: ..."). Prático, sem falar de IA e sem descrever a imagem.' },
      },
    },
    perguntas: {
      type: 'array', description: 'Até 3 perguntas curtas para a pessoa, só sobre o que falta e muda o preenchimento (ex.: quem fez, se a peça é dela, temperatura que ela usa, o que ela quer testar). Vazio se nada importante faltar ou se já foi respondido.',
      items: {
        type: 'object', additionalProperties: false, required: ['pergunta', 'opcoes'],
        properties: {
          pergunta: { type: 'string', description: 'Pergunta curta, direta, em português.' },
          opcoes: lista('De 0 a 4 respostas prováveis e curtas, para tocar em vez de digitar.'),
        },
      },
    },
  },
}

const SISTEMA = `Você ajuda um ceramista brasileiro a organizar e ampliar seu repertório de referências visuais.
Escreva em português do Brasil, num tom editorial, sóbrio e preciso.
Nunca invente autoria, data, coleção ou procedência: só repita o que veio nos dados. Se não houver, diga que é desconhecido.
A curadoria é transversal: cerâmica, escultura, design, arquitetura, natureza, tecidos, fotografia, arte popular.`

function pedidoDe(acao, d) {
  if (acao === 'buscar') {
    return {
      esforco: 'low', max: 2000,
      conteudo: [{ type: 'text', text: `Universos disponíveis: ${(d.universos ?? []).join(', ')}.
Termos que a pessoa costuma curtir: ${(d.gosto ?? []).slice(0, 20).join(', ') || 'nenhum ainda'}.
Pedido: "${String(d.pedido ?? '').slice(0, 400)}"
O pedido pode vir em português ou em qualquer idioma. Transforme-o em consultas em inglês para acervos abertos de museus (Art Institute of Chicago, The Met, Cleveland, V&A, Smithsonian, Library of Congress, Wikimedia Commons). Varie os ângulos: obra, material, forma, técnica, época, natureza.
Em outras_linguas, traduza o núcleo do pedido para holandês (Rijksmuseum), dinamarquês (SMK), francês, alemão, italiano, espanhol e português (Europeana e Wikimedia), com o termo técnico que o acervo usaria (ex.: esmalte cerâmico = glazuur, glasur, glaçure, Glasur, smalto, esmalte).` }],
    }
  }
  if (acao === 'foto') {
    const img = d.imagem ?? {}
    return {
      esforco: 'low', max: 2500,
      conteudo: [
        { type: 'image', source: { type: 'base64', media_type: img.tipo || 'image/jpeg', data: img.base64 } },
        { type: 'text', text: `Universos disponíveis: ${(d.universos ?? []).join(', ')}.
Termos que a pessoa costuma curtir: ${(d.gosto ?? []).slice(0, 20).join(', ') || 'nenhum ainda'}.
${d.nota ? 'O que a pessoa quer com a foto: "' + String(d.nota).slice(0, 200) + '"\n' : ''}Um ceramista fotografou isto (uma peça dele, um objeto, uma textura, algo na rua) e quer achar obras parecidas em acervos de museus.
Em "leitura", diga em uma frase o que você vê que guiou a busca (forma, superfície, cor, técnica aparente). Monte consultas em inglês que achem obras com a mesma forma, superfície, técnica ou tema, de épocas e culturas variadas. Em outras_linguas, o núcleo da busca nos idiomas pedidos.` },
      ],
    }
  }
  if (acao === 'acervo') {
    const imgs = (d.imagens ?? []).filter((u) => /^https:\/\//.test(u)).slice(0, 12)
    return {
      esforco: 'low', max: 5000,
      conteudo: [
        ...imgs.map((url) => ({ type: 'image', source: { type: 'url', url } })),
        { type: 'text', text: `Universos disponíveis: ${(d.universos ?? []).join(', ')}.
${imgs.length ? 'As imagens acima são amostras das pastas (uma por pasta, na ordem da lista).\n' : ''}Pastas e referências que um ceramista guardou (Pinterest, Instagram, acervo próprio), com nome da pasta e exemplos do que tem nela:
${JSON.stringify(d.pastas ?? []).slice(0, 24000)}
Consultas que já foram feitas recentemente (evite repetir): ${(d.recentes ?? []).slice(0, 40).join(', ') || 'nenhuma'}.
A partir disso, proponha consultas para um feed de descoberta que traga coisas novas e interessantes, ligadas a essas pastas. Prefira nomes de artistas, movimentos, técnicas e formas específicas a termos genéricos.` },
      ],
    }
  }
  if (acao === 'receber') {
    const imgs = (d.imagens ?? []).filter((x) => x?.base64).slice(0, 4)
    return {
      esforco: 'low', max: 6000,
      conteudo: [
        ...imgs.map((x) => ({ type: 'image', source: { type: 'base64', media_type: x.tipo || 'image/jpeg', data: x.base64 } })),
        { type: 'text', text: `Um ceramista compartilhou isto para o app do ateliê, vindo de outro aplicativo (Instagram, site, galeria de fotos, WhatsApp).
${d.titulo ? 'Título recebido: "' + String(d.titulo).slice(0, 300) + '"\n' : ''}${d.texto ? (d.pdf ? 'Texto do PDF (inteiro ou o começo): "' + String(d.texto).slice(0, 24000) + '"\nNo caso do PDF, deixe "transcricao" vazio: o texto já é guardado inteiro.\n' : 'Texto recebido: "' + String(d.texto).slice(0, 3000) + '"\n') : ''}${d.url ? 'Link: ' + String(d.url).slice(0, 500) + '\n' : ''}${d.previa ? 'Prévia do link: ' + JSON.stringify(d.previa).slice(0, 600) + '\n' : ''}${imgs.length ? (d.pdf ? 'As imagens acima são figuras recortadas do PDF.' : 'As imagens acima são o que foi compartilhado (muitas vezes prints de tela).') + ' Todas são do mesmo assunto e vão juntas para a mesma ficha' + ((d.total ?? 0) > imgs.length ? ` (foram ${d.total} fotos; você vê as ${imgs.length} primeiras)` : '') + '.\n' : ''}${(d.respostas ?? []).length ? 'Respostas da pessoa às suas perguntas (use para preencher e não pergunte de novo; "Não sei" quer dizer que ela não sabe): ' + JSON.stringify(d.respostas).slice(0, 1500) + '\n' : ''}${d.pesquisa ? 'Pesquisa na internet sobre o que ela não sabia (use para preencher; coloque um parágrafo "Fontes:" com os links nas notas de esmalte quando for ideia, ou no resumo nos outros casos): ' + String(d.pesquisa).slice(0, 4000) + '\n' : ''}
Transcreva o texto que aparece, diga o que é e sugira para onde vai no app. Se for uma esmaltação ou superfície cerâmica, preencha "esmalte" com tudo o que der, começando pelos esmaltes e materiais prováveis: é a informação mais útil para ele. Se faltar algo que só ele sabe, pergunte em "perguntas".` },
      ],
    }
  }
  if (acao === 'afins') {
    return {
      esforco: 'low', max: 5000,
      conteudo: [{ type: 'text', text: `Artistas que um ceramista brasileiro estuda (nome, país, técnicas e estética):
${JSON.stringify(d.estudos ?? []).slice(0, 20000)}
Outros nomes que ele já conhece (não repita): ${(d.conhecidos ?? []).slice(0, 200).join(', ') || 'nenhum'}.
Sugira artistas reais na mesma linha desses estudos, mas que não estão na lista: parentes de linguagem, superfície, forma ou tema, de qualquer país e época, com preferência por quem está produzindo hoje e tem obra publicada em museus, galerias ou revistas. Varie: não sugira só ceramistas japoneses nem só os mais famosos. Nunca invente nomes; se não tiver certeza de que o artista existe, não inclua.` }],
    }
  }
  if (acao === 'agrupar') {
    return {
      esforco: 'low', max: 5000,
      conteudo: [{ type: 'text', text: `Obras que um ceramista curtiu no feed de descoberta (id, título, autor, termos):
${JSON.stringify(d.curtidas ?? []).slice(0, 30000)}
Agrupe essas obras em temas visuais que ajudem a pessoa a entender o próprio gosto e a organizar referências. Prefira temas de forma, superfície, gesto e assunto a categorias genéricas de museu. Use só ids da lista.` }],
    }
  }
  if (acao === 'catalogar') {
    const img = d.imagem ?? {}
    const fonteImg = img.base64 ? { type: 'base64', media_type: img.tipo || 'image/jpeg', data: img.base64 } : { type: 'url', url: img.url }
    return {
      esforco: 'low', max: 3000,
      conteudo: [
        { type: 'image', source: fonteImg },
        { type: 'text', text: `Dados já registrados: ${JSON.stringify({ titulo: d.titulo, autor: d.autor, fonte: d.fonte, descricao: d.descricao, tags: d.tags }).slice(0, 1500)}
Grupos existentes: ${(d.grupos ?? []).join(', ') || 'nenhum'}.
Sugira a catalogação desta referência. A pessoa revisa antes de salvar.` },
      ],
    }
  }
  if (acao === 'gosto') {
    return {
      esforco: 'low', max: 4000,
      conteudo: [{ type: 'text', text: `Universos disponíveis: ${(d.universos ?? []).join(', ')}.
Dados do feed de descoberta de um ceramista (obras de museus):
${JSON.stringify({ curtidas: d.curtidas, salvas: d.salvas, recusadas: d.recusadas, termosFortes: d.termos, referenciasDoAcervo: d.referencias }).slice(0, 20000)}
Leia o gosto visual dele e proponha novas consultas para o feed. Não repita consultas já óbvias pelos termos fortes; busque o que liga as obras curtidas (forma, superfície, gesto, época, cultura).` }],
    }
  }
  if (acao === 'explicar') {
    const img = d.imagem ?? {}
    const fonteImg = img.base64 ? { type: 'base64', media_type: img.tipo || 'image/jpeg', data: img.base64 } : { type: 'url', url: img.url }
    return {
      esforco: 'low', max: 3000,
      conteudo: [
        { type: 'image', source: fonteImg },
        { type: 'text', text: `Dados do acervo de origem: ${JSON.stringify({ titulo: d.titulo, autor: d.autor, data: d.data, museu: d.fonte, termos: d.termos }).slice(0, 1500)}
O que a pessoa costuma curtir: ${(d.gosto ?? []).slice(0, 15).join(', ') || 'ainda não se sabe'}.
Explique esta obra para um ceramista: o que é, como foi feita, de onde vem, o que observar e como ela pode inspirar o trabalho dele no ateliê.` },
      ],
    }
  }
  if (acao === 'perfil') {
    return {
      esforco: 'medium', max: 6000,
      conteudo: [{ type: 'text', text: `Resumo do acervo e das interações:
${JSON.stringify(d.resumo ?? {}).slice(0, 24000)}
Correções que a pessoa já fez (respeite): ${JSON.stringify(d.correcoes ?? {}).slice(0, 3000)}
Descreva o repertório estético dela a partir desses dados.` }],
    }
  }
}

const LIMITES = { perguntas: 3, evitar: 8, olhar: 4, ideias: 4, consultas: 16, tags: 10, grupos: 4, paleta: 8, aplicacoes: 4, temas: 8, linguagens: 8, formas: 8, texturas: 8, artistas: 10, tendencias: 6, proximos: 6, afins: 20 }
const HEX = /^#[0-9a-f]{6}$/i
function aparar(o) {
  for (const [k, n] of Object.entries(LIMITES)) if (Array.isArray(o[k])) o[k] = o[k].slice(0, n)
  if (Array.isArray(o.paleta)) o.paleta = o.paleta.filter((c) => HEX.test(c))
  return o
}

// Pesquisa de artista com busca na web. Só roda quando a pessoa aperta o botão (custa alguns centavos).
// A resposta vem em JSON dentro do texto (a busca na web e o formato estruturado não são combinados aqui)
// e é validada antes de voltar para o app, que mostra tudo para revisão antes de gravar.
const SISTEMA_ARTISTA = `Você pesquisa ceramistas contemporâneos para o ateliê de um ceramista brasileiro.
Escreva em português do Brasil, sóbrio e preciso.
Use a busca na web. Prefira, nesta ordem: site oficial do artista, museus, galerias que o representam, entrevistas publicadas, livros e catálogos.
Regras: nunca apresente hipótese como fato. Cada informação técnica recebe uma certeza:
"verificado" (dito pelo artista ou por fonte confiável, com link), "interpretacao" (leitura baseada em fontes, com link) ou "hipotese" (dedução sua, sem fonte).
Não invente receitas, temperaturas, datas, prêmios nem obras. Se não achar, deixe vazio.
Imagens: só endereços diretos de imagem que você viu em páginas oficiais, museus ou galerias, sempre com a página de origem e o crédito.`

const FORMATO_ARTISTA = `Responda no fim com um único bloco JSON, sem texto depois, neste formato:
{"nomeOriginal":"","pais":[],"atuacao":"","nascimento":"","especialidade":"","linguagem":"","bio":"","caracteristicas":[],
"tecnicas":[],"materiais":[],"esmaltes":[],"queimas":[],"esteticas":[],"tiposObra":[],"site":"","instagram":"",
"processos":[{"tema":"Esmaltes","texto":"","certeza":"verificado","fonte":"https://..."}],
"estudar":[],"publicacoes":[{"titulo":"","url":"","tipo":"","ano":""}],"fontes":[{"titulo":"","url":"","tipo":""}],
"obras":[{"titulo":"","ano":"","dimensoes":"","materiais":"","imagem":"https://...","fonte":"https://...","credito":""}],
"nome":"","tags":[],"relacionados":[],"avisos":[]}
Em "nome", o nome do artista como é conhecido internacionalmente. Em "tags", até 3 etiquetas curtas em português (ex.: superfície mineral, pulverização). Em "relacionados", só nomes da lista de artistas do acervo informada que tenham afinidade real (técnica, superfície, tradição).
Temas possíveis de processos: Modelagem, Torneamento, Construção manual, Argila, Engobes, Esmaltes, Aplicação de camadas, Queima, Atmosfera do forno, Acabamentos.
Até 8 processos, 6 obras, 8 fontes. Em "avisos", diga o que ficou incerto ou conflitante entre fontes.`

const so = (v, n = 400) => (typeof v === 'string' ? v.trim().slice(0, n) : '')
const url = (v) => (typeof v === 'string' && /^https:\/\/[^\s]+$/.test(v.trim()) ? v.trim() : '')
const textos = (v, n) => (Array.isArray(v) ? v.map((x) => so(x, 300)).filter(Boolean).slice(0, n) : [])
const CERTEZAS = ['verificado', 'interpretacao', 'hipotese']

function limparArtista(o) {
  const r = {
    nomeOriginal: so(o.nomeOriginal, 120), pais: textos(o.pais, 4), atuacao: so(o.atuacao, 200), nascimento: so(o.nascimento, 120),
    especialidade: so(o.especialidade, 200), linguagem: so(o.linguagem, 600), bio: so(o.bio, 2500), caracteristicas: textos(o.caracteristicas, 8),
    tecnicas: textos(o.tecnicas, 8), materiais: textos(o.materiais, 8), esmaltes: textos(o.esmaltes, 8), queimas: textos(o.queimas, 6),
    esteticas: textos(o.esteticas, 8), tiposObra: textos(o.tiposObra, 8), site: url(o.site), instagram: so(o.instagram, 60).replace(/^@/, ''),
    estudar: textos(o.estudar, 8), avisos: textos(o.avisos, 6),
    nome: so(o.nome, 120), tags: textos(o.tags, 3), relacionados: textos(o.relacionados, 6),
  }
  r.processos = (Array.isArray(o.processos) ? o.processos : []).slice(0, 8).map((p) => ({
    tema: so(p?.tema, 40) || 'Esmaltes', texto: so(p?.texto, 600), fonte: url(p?.fonte) || undefined,
    certeza: CERTEZAS.includes(p?.certeza) ? p.certeza : 'hipotese',
  })).filter((p) => p.texto).map((p) => (p.certeza !== 'hipotese' && !p.fonte ? { ...p, certeza: 'hipotese' } : p))
  const fonte = (f) => ({ titulo: so(f?.titulo, 200) || url(f?.url), url: url(f?.url) || undefined, tipo: so(f?.tipo, 40) || undefined, ano: so(f?.ano, 10) || undefined })
  r.publicacoes = (Array.isArray(o.publicacoes) ? o.publicacoes : []).slice(0, 8).map(fonte).filter((f) => f.titulo)
  r.fontes = (Array.isArray(o.fontes) ? o.fontes : []).slice(0, 8).map(fonte).filter((f) => f.titulo)
  r.obras = (Array.isArray(o.obras) ? o.obras : []).slice(0, 6).map((x) => ({
    titulo: so(x?.titulo, 160), ano: so(x?.ano, 20), dimensoes: so(x?.dimensoes, 80), materiais: so(x?.materiais, 160),
    imagem: url(x?.imagem), fonte: url(x?.fonte), credito: so(x?.credito, 120),
  })).filter((x) => x.imagem && x.fonte)
  return r
}

// "Não sei" nas perguntas da tela Recebido: pesquisa na web o que a pessoa não sabia, antes de preencher.
// Devolve um resumo curto com as fontes; a leitura estruturada usa isso em seguida.
const NAO_SEI = /^n[ãa]o sei$/i
async function pesquisarDuvidas(d) {
  const duvidas = (d.pesquisar === true ? d.respostas ?? [] : []).filter((x) => NAO_SEI.test(String(x?.resposta ?? '').trim())).map((x) => so(x.pergunta, 200)).filter(Boolean).slice(0, 3)
  if (!duvidas.length) return ''
  const ctx = d.contexto ?? {}
  const img = (d.imagens ?? []).find((x) => x?.base64)
  const client = new Anthropic()
  const mensagens = [{ role: 'user', content: [
    ...(img ? [{ type: 'image', source: { type: 'base64', media_type: img.tipo || 'image/jpeg', data: img.base64 } }] : []),
    { type: 'text', text: `Um ceramista brasileiro compartilhou isto para o app do ateliê.
O que já se sabe: ${JSON.stringify({ titulo: so(ctx.titulo, 200), autor: so(ctx.autor, 120), resumo: so(ctx.resumo, 400), texto: so(ctx.transcricao, 1200), link: url(d.url) }).slice(0, 2500)}
Ele não sabe responder: ${duvidas.map((q) => '"' + q + '"').join('; ')}.
Pesquise na web (site do artista, loja, Instagram público, entrevistas, fornecedores de esmalte, artigos técnicos) e responda cada pergunta em português, em uma ou duas frases, dizendo quando é confirmado por fonte e quando é a prática mais comum. Termine com "Fontes:" e os links usados. Nunca invente.` },
  ] }]
  try {
    let r
    for (let i = 0; i < 3; i++) {
      r = await client.beta.messages.create({
        model: MODELO, max_tokens: 4000, betas: BETAS, fallbacks: 'default',
        thinking: { type: 'adaptive' }, output_config: { effort: 'low' },
        tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 4 }, { type: 'web_fetch_20260209', name: 'web_fetch', max_uses: 3 }],
        messages: mensagens,
      })
      d.uso = somarUso(d.uso, r)
      if (r.stop_reason !== 'pause_turn') break
      mensagens.push({ role: 'assistant', content: r.content })
    }
    return r.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim().slice(0, 4000)
  } catch (e) {
    console.warn('Pesquisa do Recebido falhou:', e instanceof Error ? e.message : e)
    return ''
  }
}

async function pesquisarArtista(d) {
  const nome = so(d?.nome, 120)
  const link = url(d?.url)
  if (!nome && !link) return json({ erro: 'Informe o nome do artista ou um link' }, 400)
  const catalogo = textos(d?.catalogo, 300).join(', ')
  const alvo = nome ? `o ceramista ${nome}` : `o artista apresentado nesta página: ${link} (comece abrindo a página e confirme quem é)`
  const client = new Anthropic()
  const mensagens = [{ role: 'user', content: `Pesquise ${alvo}.${d.contexto ? ' O que já se sabe: ' + so(d.contexto, 1500) : ''}${catalogo ? '\nArtistas já no acervo: ' + catalogo + '.' : ''}\n\n${FORMATO_ARTISTA}` }]
  let uso
  try {
    let r
    // a busca roda no servidor da Anthropic; se ela pausar no meio, continuamos a mesma conversa (até 3 vezes)
    for (let i = 0; i < 3; i++) {
      r = await client.beta.messages.create({
        model: MODELO, max_tokens: 12000, betas: BETAS, fallbacks: 'default',
        thinking: { type: 'adaptive' }, output_config: { effort: 'medium' },
        system: SISTEMA_ARTISTA,
        tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 6 }, { type: 'web_fetch_20260209', name: 'web_fetch', max_uses: 5 }],
        messages: mensagens,
      })
      uso = somarUso(uso, r)
      if (r.stop_reason !== 'pause_turn') break
      mensagens.push({ role: 'assistant', content: r.content })
    }
    if (r.stop_reason === 'refusal') return json({ erro: 'A IA não quis responder a este pedido.' }, 422)
    const texto = r.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n')
    const ini = texto.indexOf('{'), fim = texto.lastIndexOf('}')
    if (ini < 0 || fim <= ini) return json({ erro: 'A pesquisa não trouxe um resultado legível. Tente de novo.' }, 502)
    let o
    try { o = JSON.parse(texto.slice(ini, fim + 1)) } catch { return json({ erro: 'A pesquisa veio incompleta. Tente de novo.' }, 502) }
    return json({ resultado: limparArtista(o), uso })
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return json({ erro: 'A chave da Anthropic foi recusada. Confira a variável ANTHROPIC_API_KEY na Vercel.' }, 503)
    if (e instanceof Anthropic.PermissionDeniedError) return json({ erro: 'A conta da Anthropic não tem permissão (crédito, limite de gasto ou busca na web desligada no Console).' }, 503)
    if (e instanceof Anthropic.RateLimitError) return json({ erro: 'Muitos pedidos seguidos. Espere um pouco.' }, 429)
    if (e instanceof Anthropic.BadRequestError) return json({ erro: /credit balance/i.test(e.message) ? 'Acabou o crédito da Anthropic. Compre créditos em console.anthropic.com › Settings › Billing.' : 'Pedido recusado pela API: ' + e.message }, /credit balance/i.test(e.message) ? 402 : 400)
    if (e instanceof Anthropic.APIError) return json({ erro: `A IA não respondeu (${e.status ?? 'rede'}).` }, 502)
    return json({ erro: 'Erro inesperado: ' + (e instanceof Error ? e.message : String(e)) }, 500)
  }
}

// Engenharia reversa a partir de um print (rótulo, pote, catálogo, post com a peça): identifica o esmalte
// comercial e pesquisa na web a ficha do fabricante e a ficha de segurança. Mesmo esquema da pesquisa de artista.
const SISTEMA_COMERCIAL = `Você ajuda um ceramista brasileiro a estudar esmaltes comerciais (engenharia reversa), em português do Brasil, sóbrio e preciso.
Use a busca na web. Prefira, nesta ordem: página do produto no site do fabricante, ficha técnica, ficha de segurança (FISPQ/SDS), lojas e distribuidores, fóruns e artigos técnicos (Glazy, Digitalfire, Ceramic Arts Network).
Regras: separe sempre o que é declarado pelo fabricante, o que vem de documentação técnica e o que é hipótese sua. Nunca apresente hipótese como fato. Não invente códigos, temperaturas nem composições. Se não achar, deixe vazio.`

const FORMATO_COMERCIAL = `Responda no fim com um único bloco JSON, sem texto depois, neste formato:
{"fabricante":"","nome":"","codigo":"","serie":"","cone":"","temperatura":"","instrucoes":"","declarados":[],"documentacao":"","hipoteses":[],"fontes":[],"observacoes":"","avisos":[]}
"declarados": só o que o fabricante diz no rótulo ou na página do produto (ex.: "Sem chumbo", "Cone 5-6", "Indicado para utilitários"), até 10.
"documentacao": o que a ficha técnica ou a ficha de segurança diz (componentes e faixas de porcentagem, números CAS), com a observação "Preliminar: conferir a versão do produto" e o link.
"hipoteses": possíveis ingredientes e o papel de cada um, no formato "Ingrediente: por que se suspeita", até 8. Sempre hipótese.
"instrucoes": aplicação e queima recomendadas pelo fabricante (camadas, espessura, curva), se houver.
"fontes": só links https que você abriu, até 8.
"observacoes": como o efeito provavelmente se forma e o que testar primeiro, em parágrafos curtos.
"avisos": o que ficou incerto, por exemplo se o print não mostra o nome do produto e a identificação é provável, não certa.`

function limparComercial(o) {
  return {
    fabricante: so(o.fabricante, 120), nome: so(o.nome, 160), codigo: so(o.codigo, 60), serie: so(o.serie, 120),
    cone: so(o.cone, 40), temperatura: so(o.temperatura, 80), instrucoes: so(o.instrucoes, 2000),
    declarados: textos(o.declarados, 10), documentacao: so(o.documentacao, 3000), hipoteses: textos(o.hipoteses, 8),
    fontes: (Array.isArray(o.fontes) ? o.fontes : []).map(url).filter(Boolean).slice(0, 8),
    observacoes: so(o.observacoes, 2500), avisos: textos(o.avisos, 6),
  }
}

async function pesquisarComercial(d) {
  const imgs = (d.imagens ?? []).filter((x) => x?.base64).slice(0, 4)
  const extra = so(d.texto, 1000)
  if (!imgs.length && !extra) return json({ erro: 'Mande um print ou escreva o nome do esmalte' }, 400)
  const client = new Anthropic()
  const mensagens = [{ role: 'user', content: [
    ...imgs.map((x) => ({ type: 'image', source: { type: 'base64', media_type: x.tipo || 'image/jpeg', data: x.base64 } })),
    { type: 'text', text: `${imgs.length ? 'Estes prints são de um esmalte comercial (rótulo, pote, catálogo, loja ou post mostrando uma peça).' : ''}${extra ? '\nO que ele escreveu: ' + extra : ''}
Identifique o produto (fabricante, nome, código) pelo que aparece e pesquise na web a página do fabricante, a ficha técnica e a ficha de segurança. Se o print só mostrar uma peça esmaltada, diga qual esmalte comercial é mais provável e deixe isso claro em "avisos".

${FORMATO_COMERCIAL}` },
  ] }]
  let uso
  try {
    let r
    for (let i = 0; i < 3; i++) {
      r = await client.beta.messages.create({
        model: MODELO, max_tokens: 10000, betas: BETAS, fallbacks: 'default',
        thinking: { type: 'adaptive' }, output_config: { effort: 'medium' },
        system: SISTEMA_COMERCIAL,
        tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 6 }, { type: 'web_fetch_20260209', name: 'web_fetch', max_uses: 5 }],
        messages: mensagens,
      })
      uso = somarUso(uso, r)
      if (r.stop_reason !== 'pause_turn') break
      mensagens.push({ role: 'assistant', content: r.content })
    }
    if (r.stop_reason === 'refusal') return json({ erro: 'A IA não quis responder a este pedido.' }, 422)
    const texto = r.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n')
    const ini = texto.indexOf('{'), fim = texto.lastIndexOf('}')
    if (ini < 0 || fim <= ini) return json({ erro: 'A pesquisa não trouxe um resultado legível. Tente de novo.' }, 502)
    let o
    try { o = JSON.parse(texto.slice(ini, fim + 1)) } catch { return json({ erro: 'A pesquisa veio incompleta. Tente de novo.' }, 502) }
    return json({ resultado: limparComercial(o), uso })
  } catch (e) {
    return erroDaIA(e)
  }
}

function erroDaIA(e) {
  if (e instanceof Anthropic.AuthenticationError) return json({ erro: 'A chave da Anthropic foi recusada. Confira a variável ANTHROPIC_API_KEY na Vercel.' }, 503)
  if (e instanceof Anthropic.PermissionDeniedError) return json({ erro: 'A conta da Anthropic não tem permissão (crédito, limite de gasto ou busca na web desligada no Console).' }, 503)
  if (e instanceof Anthropic.RateLimitError) return json({ erro: 'Muitos pedidos seguidos. Espere um pouco.' }, 429)
  if (e instanceof Anthropic.BadRequestError) return json({ erro: /credit balance/i.test(e.message) ? 'Acabou o crédito da Anthropic. Compre créditos em console.anthropic.com › Settings › Billing.' : 'Pedido recusado pela API: ' + e.message }, /credit balance/i.test(e.message) ? 402 : 400)
  if (e instanceof Anthropic.APIError) return json({ erro: `A IA não respondeu (${e.status ?? 'rede'}).` }, 502)
  return json({ erro: 'Erro inesperado: ' + (e instanceof Error ? e.message : String(e)) }, 500)
}

export async function GET() {
  return json({ configurada: !!process.env.ANTHROPIC_API_KEY })
}

export async function POST(req) {
  if (!process.env.ANTHROPIC_API_KEY) return json({ erro: 'IA não configurada: falta a chave ANTHROPIC_API_KEY na Vercel.' }, 503)
  // só quem está logado no app gasta o crédito da Anthropic
  const login = await exigirLogin(req); if (login.erro) return login.erro
  let d
  try { d = await req.json() } catch { return json({ erro: 'Pedido inválido' }, 400) }
  const acao = d?.acao
  if (acao === 'artista') return pesquisarArtista(d)
  if (acao === 'comercial') return pesquisarComercial(d)
  if (acao === 'receber' && d.pesquisar) d.pesquisa = await pesquisarDuvidas(d)
  const p = ESQUEMAS[acao] && pedidoDe(acao, d)
  if (!p) return json({ erro: 'Ação desconhecida' }, 400)
  if (acao === 'foto' && !d.imagem?.base64) return json({ erro: 'Sem imagem' }, 400)
  if (acao === 'receber' && !(d.imagens ?? []).some((x) => x?.base64) && !d.texto && !d.url) return json({ erro: 'Nada para ler' }, 400)
  if ((acao === 'catalogar' || acao === 'explicar') && !d.imagem?.base64 && !/^https:\/\//.test(d.imagem?.url ?? '')) return json({ erro: 'Sem imagem' }, 400)

  const client = new Anthropic()
  const base = {
    max_tokens: p.max,
    thinking: { type: 'adaptive' },
    output_config: { effort: p.esforco, format: { type: 'json_schema', schema: ESQUEMAS[acao] } },
    system: SISTEMA,
    messages: [{ role: 'user', content: p.conteudo }],
  }
  const forte = () => client.beta.messages.create({ ...base, model: MODELO, betas: BETAS, fallbacks: 'default' })
  try {
    let r
    if (RAPIDAS.has(acao)) {
      // a IA rápida não tem reserva automática: se ela recusar ou falhar, a mais forte responde
      try { r = await client.messages.create({ ...base, model: MODELO_RAPIDO }); d.uso = somarUso(d.uso, r) } catch (e) {
        if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) throw e
        console.warn('IA rápida falhou, usando a mais forte:', e instanceof Error ? e.message : e)
        r = undefined
      }
      if (!r || r.stop_reason === 'refusal' || r.stop_reason === 'max_tokens') { r = await forte(); d.uso = somarUso(d.uso, r) }
    } else { r = await forte(); d.uso = somarUso(d.uso, r) }
    if (r.stop_reason === 'refusal') return json({ erro: 'A IA não quis responder a este pedido.', uso: d.uso }, 422)
    if (r.stop_reason === 'max_tokens') return json({ erro: 'A resposta ficou longa demais. Tente de novo.', uso: d.uso }, 502)
    const texto = r.content.find((b) => b.type === 'text')?.text
    if (!texto) return json({ erro: 'Resposta vazia', uso: d.uso }, 502)
    return json({ resultado: aparar(JSON.parse(texto)), uso: d.uso })
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return json({ erro: 'A chave da Anthropic foi recusada. Confira a variável ANTHROPIC_API_KEY na Vercel.' }, 503)
    if (e instanceof Anthropic.PermissionDeniedError) return json({ erro: 'A conta da Anthropic não tem permissão (crédito ou limite de gasto).' }, 503)
    if (e instanceof Anthropic.RateLimitError) return json({ erro: 'Muitos pedidos seguidos. Espere um pouco.' }, 429)
    if (e instanceof Anthropic.BadRequestError) return json({ erro: /credit balance/i.test(e.message) ? 'Acabou o crédito da Anthropic. Compre créditos em console.anthropic.com › Settings › Billing.' : 'Pedido recusado pela API: ' + e.message }, /credit balance/i.test(e.message) ? 402 : 400)
    if (e instanceof Anthropic.APIError) return json({ erro: `A IA não respondeu (${e.status ?? 'rede'}).` }, 502)
    return json({ erro: 'Erro inesperado: ' + (e instanceof Error ? e.message : String(e)) }, 500)
  }
}
