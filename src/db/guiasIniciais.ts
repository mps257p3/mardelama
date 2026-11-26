import { db } from './schema'

/** Guias passo a passo da Biblioteca (texto em HTML, id fixo, uma vez por aparelho). */
export const GUIA_VINAGRE = 'bib-guia-vinagre-esmalte'

const corpo = `
<p>O vinagre branco é o floculante mais simples que existe: ele faz as partículas do esmalte líquido se juntarem um pouco. O esmalte fica mais encorpado, para de assentar duro no fundo do balde e de escorrer da peça, e a camada sai mais uniforme, até em parede vertical. Ele queima por inteiro no forno e não muda a cor do esmalte.</p>
<h3>Quando usar</h3>
<ul>
<li>O esmalte assentou duro no fundo do balde e dá trabalho para misturar.</li>
<li>Na imersão, o esmalte escorre rápido e a camada fica fina, mesmo com a densidade certa.</li>
<li>Esmaltes com muita frita e pouca argila, como os fundentes FLX (só frita e caulim), que assentam com facilidade.</li>
</ul>
<p>Não use em esmalte comercial de pincel (Mayco, Amaco, Coyote e parecidos): eles já vêm com gomas e o ponto certo.</p>
<h3>Material</h3>
<ul>
<li>Vinagre branco comum (de álcool, sem cor).</li>
<li>Conta-gotas ou seringa sem agulha.</li>
<li>Esmalte já peneirado, num balde ou pote com medida.</li>
<li>Colher, espátula ou mixer para mexer.</li>
</ul>
<h3>Passo a passo (para 1 litro de esmalte)</h3>
<ol>
<li>Mexa bem o esmalte até não sobrar nada no fundo.</li>
<li>Pingue 5 gotas de vinagre.</li>
<li>Mexa por 1 a 2 minutos e espere 10 minutos: o efeito não é imediato.</li>
<li>Teste o ponto: mergulhe o dedo ou uma plaquinha de biscoito. O esmalte deve cobrir por igual e escorrer devagar, sem pingar rápido nem deixar falhas.</li>
<li>Se ainda estiver ralo, repita: mais 5 gotas, mexa, espere 10 minutos e teste de novo.</li>
<li>Pare assim que o ponto chegar. Se já foram muitas rodadas e nada muda, o problema provavelmente é outro (água demais ou pouca argila na receita).</li>
<li>Anote quanto usou na fórmula: Preparo e queima › Aditivo líquido, por exemplo "Vinagre branco · 5 gotas/litro". Assim o próximo balde sai igual.</li>
</ol>
<h3>Se passou do ponto</h3>
<p>Sinais: o esmalte virou um gel, deixa marca de pincel ou de dedo, a camada fica grossa demais e pode rachar ou descascar ao secar. Para corrigir, junte um pouco de água ou 1 a 2 gotas de defloculante (silicato de sódio ou Darvan) e mexa bem.</p>
<h3>Cuidados</h3>
<ul>
<li>Vá sempre aos poucos e espere entre uma rodada e outra.</li>
<li>Confira o ponto de novo antes de cada uso: depois de dias parado, o esmalte pode mudar.</li>
<li>Para o mesmo efeito há também o sal de Epsom (sulfato de magnésio): dissolva em um pouco de água quente até não dissolver mais e junte a solução de colher de chá em colher de chá.</li>
<li>Isto não tem nada a ver com o teste do vinagre na peça queimada, que serve para ver se a superfície resiste a comida ácida (ver Glossário › Teste do vinagre).</li>
</ul>
`.trim()

export async function semearGuias() {
  if (await db.ajustes.get('seed-guia-vinagre-v1')) return
  if (!(await db.conteudos.get(GUIA_VINAGRE))) {
    const t = Date.UTC(2026, 10, 26, 17)
    await db.conteudos.add({
      id: GUIA_VINAGRE, criadoEm: t, atualizadoEm: t, excluido: 0, favorito: 0,
      titulo: 'Como usar vinagre no esmalte', categoria: 'Técnicas de aplicação', formato: 'texto', corpo, arquivos: [],
      tags: ['vinagre', 'floculação', 'floculante', 'esmalte', 'preparo'],
    })
  }
  await db.ajustes.put({ chave: 'seed-guia-vinagre-v1', valor: true })
}
