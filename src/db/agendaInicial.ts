import { db, type Exposicao } from './schema'

/** Exposições de cerâmica na cidade de São Paulo, conferidas em 21/11/2026. Ids fixos: não duplicam entre aparelhos. */
const T = Date.UTC(2026, 10, 21, 3)
const CONF = '21/11/2026'
const ELLE = 'https://elle.com.br/cultura/exposicoes-em-sao-paulo-novembro-2026'
type E = Omit<Exposicao, 'criadoEm' | 'atualizadoEm' | 'excluido' | 'favorito' | 'origem' | 'conferidoEm'>

const EXPOSICOES: E[] = [
  {
    id: 'expo-japan-house-ceramica-em-curso', titulo: 'Cerâmica em curso', local: 'Japan House São Paulo', endereco: 'Avenida Paulista, 52, 2º andar, Bela Vista',
    inicio: '2026-10-06', fim: '2027-05-30', gratuita: true,
    curadoria: 'Natasha Barzaghi Geenen e Carolina De Angelis',
    descricao: 'Mostra sobre os seis fornos antigos do Japão (Bizen, Echizen, Seto, Shigaraki, Tamba e Tokoname), conhecidos juntos como Rokkoyō, com produção contínua desde o século XII. Terça a sexta, 10h às 18h; sábados, domingos e feriados, 10h às 19h.',
    url: 'https://japanhousesp.com.br/en/exhibition/ceramics-in-progress/', fonte: 'https://quegostoso.tur.br/2026/10/11/ceramica-japonesa-ganha-mostra-na-japan-house/',
  },
  {
    id: 'expo-ovo-massa-2026', titulo: 'Massa', local: 'Loja da ,ovo', endereco: 'Rua Estados Unidos, 2.104, Jardins',
    inicio: '2026-11-24', fim: '2026-12-23',
    artistas: 'Ana Takeda, Heloisa Galvão, Hideko Honma, Kimi Nii, Megumi Yuasa, Nydia Rocha e Paula Juchem', curadoria: 'Gerson de Oliveira',
    descricao: 'Coletiva com a cerâmica como material principal, reunindo nomes históricos e contemporâneos da cerâmica feita em São Paulo.',
    fonte: ELLE,
  },
  {
    id: 'expo-mendes-wood-kansai-noguchi-syotatsu', titulo: 'Kansai Noguchi & Syotatsu', local: 'Mendes Wood DM', endereco: 'Rua Barra Funda, 216, Barra Funda',
    inicio: '2026-11-28', fimAprox: 'até janeiro de 2027',
    artistas: 'Kansai Noguchi e Syotatsu',
    descricao: 'Exposição em dupla com cerâmica e pintura com materiais naturais. A fonte não informa o dia de encerramento.',
    url: 'https://mendeswooddm.com/', fonte: ELLE,
  },
]

export async function semearAgenda() {
  if (await db.ajustes.get('seed-agenda-v1')) return
  const existentes = new Set((await db.exposicoes.toArray()).map((x) => x.id))
  const novas = EXPOSICOES.filter((e) => !existentes.has(e.id)).map((e): Exposicao => ({ ...e, criadoEm: T, atualizadoEm: T, excluido: 0, favorito: 0, origem: 'curadoria', conferidoEm: CONF }))
  if (novas.length) await db.exposicoes.bulkAdd(novas)
  await db.ajustes.put({ chave: 'seed-agenda-v1', valor: true })
}
