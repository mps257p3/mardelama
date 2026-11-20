// IA do Repertório. A chave da Anthropic fica só aqui, na variável ANTHROPIC_API_KEY da Vercel.
// Três tarefas: interpretar uma busca em linguagem natural, sugerir a catalogação de uma imagem
// e sintetizar o repertório estético a partir do acervo. Nada é gravado aqui: o app mostra para revisão.
import Anthropic from '@anthropic-ai/sdk'

const MODELO = 'claude-opus-5-5'
const BETAS = ['server-side-fallback-2026-07-01']
const json = (dados, status = 200) => new Response(JSON.stringify(dados), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } })

const TIPOS = ['Fotografia', 'Ilustração', 'Escultura', 'Pintura', 'Artista', 'Obra de arte', 'Textura', 'Objeto', 'Forma', 'Paleta cromática', 'Link', 'Vídeo']
// Limites de tamanho ficam na descrição (o formato estruturado não aceita minItems/maxItems) e são aplicados ao final.
const lista = (desc) => ({ type: 'array', items: { type: 'string' }, description: desc })

const ESQUEMAS = {
  buscar: {
    type: 'object', additionalProperties: false, required: ['leitura', 'consultas'],
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
Transforme o pedido em consultas para acervos abertos de museus (Art Institute of Chicago, The Met, Wikimedia Commons). Varie os ângulos: obra, material, forma, técnica, época, natureza.` }],
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

const LIMITES = { evitar: 8, olhar: 4, ideias: 4, consultas: 16, tags: 10, grupos: 4, paleta: 8, aplicacoes: 4, temas: 8, linguagens: 8, formas: 8, texturas: 8, artistas: 10, tendencias: 6, proximos: 6 }
const HEX = /^#[0-9a-f]{6}$/i
function aparar(o) {
  for (const [k, n] of Object.entries(LIMITES)) if (Array.isArray(o[k])) o[k] = o[k].slice(0, n)
  if (Array.isArray(o.paleta)) o.paleta = o.paleta.filter((c) => HEX.test(c))
  return o
}

export async function GET() {
  return json({ configurada: !!process.env.ANTHROPIC_API_KEY })
}

export async function POST(req) {
  if (!process.env.ANTHROPIC_API_KEY) return json({ erro: 'IA não configurada: falta a chave ANTHROPIC_API_KEY na Vercel.' }, 503)
  let d
  try { d = await req.json() } catch { return json({ erro: 'Pedido inválido' }, 400) }
  const acao = d?.acao
  const p = ESQUEMAS[acao] && pedidoDe(acao, d)
  if (!p) return json({ erro: 'Ação desconhecida' }, 400)
  if ((acao === 'catalogar' || acao === 'explicar') && !d.imagem?.base64 && !/^https:\/\//.test(d.imagem?.url ?? '')) return json({ erro: 'Sem imagem' }, 400)

  const client = new Anthropic()
  try {
    const r = await client.beta.messages.create({
      model: MODELO,
      max_tokens: p.max,
      betas: BETAS,
      fallbacks: 'default',
      thinking: { type: 'adaptive' },
      output_config: { effort: p.esforco, format: { type: 'json_schema', schema: ESQUEMAS[acao] } },
      system: SISTEMA,
      messages: [{ role: 'user', content: p.conteudo }],
    })
    if (r.stop_reason === 'refusal') return json({ erro: 'A IA não quis responder a este pedido.' }, 422)
    if (r.stop_reason === 'max_tokens') return json({ erro: 'A resposta ficou longa demais. Tente de novo.' }, 502)
    const texto = r.content.find((b) => b.type === 'text')?.text
    if (!texto) return json({ erro: 'Resposta vazia' }, 502)
    return json({ resultado: aparar(JSON.parse(texto)) })
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return json({ erro: 'A chave da Anthropic foi recusada. Confira a variável ANTHROPIC_API_KEY na Vercel.' }, 503)
    if (e instanceof Anthropic.PermissionDeniedError) return json({ erro: 'A conta da Anthropic não tem permissão (crédito ou limite de gasto).' }, 503)
    if (e instanceof Anthropic.RateLimitError) return json({ erro: 'Muitos pedidos seguidos. Espere um pouco.' }, 429)
    if (e instanceof Anthropic.BadRequestError) return json({ erro: 'Pedido recusado pela API: ' + e.message }, 400)
    if (e instanceof Anthropic.APIError) return json({ erro: `A IA não respondeu (${e.status ?? 'rede'}).` }, 502)
    return json({ erro: 'Erro inesperado: ' + (e instanceof Error ? e.message : String(e)) }, 500)
  }
}
