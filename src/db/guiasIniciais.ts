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

export const GUIA_NERIKOMI = 'bib-guia-nerikomi-torno'

const ul = (xs: string[]) => '<ul>' + xs.map((x) => `<li>${x}</li>`).join('') + '</ul>'
const nerikomi = [
  '<p><strong>Incrustação de argilas coloridas com deformação no torno</strong></p>',
  '<p>Categoria: Decoração de massa cerâmica<br>Família: Nerikomi / Neriage / Agateware<br>Aplicação: Argila crua<br>Efeito: Grafismos orgânicos, abstratos e marmorizados.</p>',
  '<h3>Descrição da técnica</h3>',
  '<p>A técnica consiste na aplicação de pequenas porções de argilas coloridas sobre uma massa cerâmica base, antes da modelagem no torno. Durante a abertura e o levantamento das paredes da peça, os desenhos são esticados e deformados, criando padrões orgânicos e imprevisíveis.</p>',
  '<p>Diferentemente da decoração com engobes ou esmaltes, as cores são incorporadas à própria massa cerâmica.</p>',
  '<h3>Materiais</h3>',
  ul(['Argila base, preferencialmente com uma cor contrastante.', 'Argila branca.', 'Pigmentos cerâmicos compatíveis com a temperatura de queima.', 'Torno cerâmico.', 'Espátula ou raspadeira.', 'Esponja.']),
  '<h3>Passo a passo</h3>',
  '<p><strong>1. Preparação das massas coloridas</strong><br>Misture pigmentos cerâmicos à argila branca até obter uma coloração homogênea. Modele pequenos rolinhos de diferentes cores e espessuras.</p>',
  '<p>Como referência inicial, considerando o peso seco da argila:</p>',
  ul(['Tons pastéis: 1 a 3% de pigmento.', 'Tons intermediários: 3 a 6%.', 'Tons intensos: 6 a 10%.', 'Tons muito saturados: 10 a 15%.']),
  '<p>As proporções devem ser ajustadas conforme o pigmento e a temperatura de queima.</p>',
  '<p><strong>2. Preparação da massa base</strong><br>Prepare uma porção de argila que será utilizada para modelar a peça. Massas escuras proporcionam maior contraste com as argilas coloridas.</p>',
  '<p><strong>3. Construção do desenho</strong><br>Distribua os rolinhos coloridos sobre a superfície externa da massa base, formando linhas, curvas, manchas ou desenhos abstratos.</p>',
  '<p><strong>4. Incorporação das cores</strong><br>Pressione e alise os rolinhos até que estejam incorporados à massa principal, eliminando possíveis bolsas de ar e garantindo uma boa união entre as argilas.</p>',
  '<p><strong>5. Modelagem no torno</strong><br>Centralize, abra e modele a peça. Durante o levantamento e a expansão das paredes, as argilas coloridas serão esticadas e deformadas, transformando o desenho original.</p>',
  '<p>Quanto maior a manipulação da massa, maior será a deformação dos grafismos.</p>',
  '<p><strong>6. Revelação do desenho</strong><br>Utilize uma raspadeira para remover a camada superficial de barbotina formada durante a modelagem. Isso recupera a definição das cores e evidencia os contrastes entre as diferentes massas.</p>',
  '<p><strong>7. Secagem e queima</strong><br>Deixe a peça secar lentamente e de maneira uniforme. Realize a queima de acordo com as características das argilas e dos pigmentos utilizados.</p>',
  '<p><strong>8. Esmaltação</strong><br>Opcionalmente, aplique um esmalte transparente brilhante, acetinado ou fosco, compatível com as massas utilizadas. O esmalte transparente brilhante tende a intensificar as cores e os contrastes.</p>',
  '<h3>Efeitos produzidos</h3>',
  ul(['Alongamento e deformação dos desenhos.', 'Grafismos abstratos e orgânicos.', 'Manchas irregulares de cor.', 'Contrastes entre diferentes massas cerâmicas.', 'Efeitos marmorizados.', 'Sensação de movimento.', 'Integração entre decoração e estrutura da peça.']),
  '<h3>Cuidados técnicos</h3>',
  ul(['Utilizar argilas com retrações e temperaturas de maturação compatíveis.', 'Manter todas as massas com umidade e plasticidade semelhantes.', 'Evitar diferenças excessivas na quantidade de chamote.', 'Utilizar pigmentos resistentes à temperatura de queima.', 'Evitar o excesso de água durante a modelagem.', 'Promover uma secagem lenta e uniforme.', 'Realizar testes de compatibilidade antes de produzir peças maiores.']),
  '<h3>Possibilidades de exploração</h3>',
  '<p>A técnica também pode ser aplicada à modelagem manual e escultórica, incorporando grafismos diretamente à superfície da argila. É possível combinar massas naturais e pigmentadas, explorar diferentes espessuras de incrustação e criar contrastes entre áreas esmaltadas e não esmaltadas.</p>',
  '<h3>Termos para pesquisa</h3>',
  ul(['Colored Clay Inlay', 'Colored Clay Wheel Throwing', 'Nerikomi Pottery', 'Neriage Pottery', 'Agateware', 'Colored Clay Surface Decoration']),
  '<p>Referência: @sunriseceramics.co</p>',
  '<blockquote>Observação: A descrição foi elaborada a partir das imagens do processo. As proporções de pigmentos são sugestões para experimentação, não a formulação original do artista. A temperatura de queima e a composição do esmalte utilizado não foram confirmadas.</blockquote>',
].join('\n')

export async function semearGuias() {
  if (!(await db.ajustes.get('seed-guia-nerikomi-v1'))) {
    if (!(await db.conteudos.get(GUIA_NERIKOMI))) {
      const t = Date.UTC(2026, 10, 26, 17, 20)
      await db.conteudos.add({
        id: GUIA_NERIKOMI, criadoEm: t, atualizadoEm: t, excluido: 0, favorito: 0,
        titulo: 'Nerikomi no torno (Neriage)', categoria: 'Técnicas de decoração', formato: 'texto', corpo: nerikomi, arquivos: [],
        autor: '@sunriseceramics.co (referência)', tags: ['nerikomi', 'neriage', 'agateware', 'argila colorida', 'torno', 'decoração de massa'],
      })
    }
    await db.ajustes.put({ chave: 'seed-guia-nerikomi-v1', valor: true })
  }
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
