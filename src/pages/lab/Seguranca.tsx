import { Link } from 'react-router-dom'
import { Voltar } from '../../ui/Voltar'

/**
 * Segurança no ateliê: reúne num lugar só as orientações que já estavam no item da Biblioteca
 * "Segurança do laboratório", organizadas por assunto. Separa o que o fabricante declara
 * sobre uso alimentar do que vale para a peça pronta.
 */
const SECOES: { t: string; itens: React.ReactNode[] }[] = [
  { t: 'Poeira de sílica', itens: [
    'A sílica cristalina inalada é nociva aos pulmões. O risco está no pó, não no esmalte já queimado.',
    'Pese e misture pós de máscara PFF2 ou PFF3.',
    <>Faça limpeza úmida, com pano ou esfregão molhado. <b>Não varra pós a seco</b>.</>,
    'Mantenha a bancada e o chão limpos para o pó não se acumular e voltar ao ar.',
  ] },
  { t: 'Óxidos e matérias-primas', itens: [
    'Óxidos e carbonatos metálicos (cobre, cobalto, manganês, cromo e outros): evite inalar e evite contato prolongado com a pele.',
    'Consulte a ficha de segurança (FISPQ) de cada material antes de usar pela primeira vez.',
    'Use equipamentos exclusivos para cerâmica: balanças, mixer, peneiras e colheres não voltam para a cozinha.',
  ] },
  { t: 'Equipamentos de proteção', itens: [
    'Máscara PFF2 ou PFF3 ao lidar com pó.',
    'Luvas para esmalte líquido, óxidos e conservantes.',
    'Óculos de proteção.',
    'Ventilação e exaustão no ateliê, inclusive do forno durante a queima.',
  ] },
  { t: 'Conservantes', itens: [
    'Conservantes industriais usados em esmaltes líquidos podem causar sensibilização na pele.',
    'Use luvas e siga a ficha de segurança do produto.',
  ] },
  { t: 'Armazenamento', itens: [
    'Potes fechados e etiquetados com o nome do material ou do esmalte.',
    'Fora do alcance de crianças e animais.',
    'Longe de alimentos e de utensílios de cozinha.',
  ] },
  { t: 'Descarte', itens: [
    <><b>Não descarte resíduos de esmalte na rede de esgoto.</b></>,
    'Deixe a água de lavagem decantar, reaproveite a água limpa de cima e deixe o sedimento secar.',
    'Destine o sedimento seco conforme a orientação local para resíduos.',
    'Proteja as placas do forno contra escorrimentos com placas de proteção ou bolachas.',
  ] },
]

const SECOES_FIM: { t: string; itens: React.ReactNode[] }[] = [
  { t: 'Testes de lixiviação', itens: [
    'É o teste de laboratório que mede quanto metal (como chumbo, cádmio e bário) sai do esmalte em contato com alimento ácido.',
    'O teste do limão ou do vinagre em casa só mostra mudanças visíveis na superfície. Se a placa não muda, isso não prova que o esmalte é seguro.',
    'Só o teste de lixiviação em laboratório libera um esmalte para louça.',
  ] },
  { t: 'Combinações de esmaltes', itens: [
    'A declaração do fabricante vale para o esmalte usado sozinho, como ele orienta.',
    'Quando dois esmaltes se sobrepõem, eles se misturam na queima e formam um vidrado novo, que não foi testado por ninguém.',
    'Na peça com sobreposição, a parte que toca o alimento só é segura se a combinação também for. Na dúvida, reserve a combinação para a parte de fora ou para peças decorativas.',
  ] },
]

function Bloco({ t, itens }: { t: string; itens: React.ReactNode[] }) {
  return (
    <section className="seg-secao">
      <h2>{t}</h2>
      <ul>{itens.map((x, i) => <li key={i}>{x}</li>)}</ul>
    </section>
  )
}

export default function Seguranca() {
  return (
    <div className="page leitura seg-pag">
      <Voltar to="/laboratorio">Esmaltaria</Voltar>
      <h1>Segurança no ateliê</h1>
      <p className="seg-intro">Manuseio, toxicidade, segurança alimentar e descarte.</p>

      {SECOES.map((s) => <Bloco key={s.t} {...s} />)}

      <section className="seg-secao">
        <h2>Segurança alimentar</h2>
        <div className="seg-duas">
          <div>
            <p className="esm-grupo">O que o fabricante declara</p>
            <p>Termos como <i>Food Safe</i>, <i>Dinnerware Safe</i> ou “sem chumbo” são declarações do fabricante sobre o esmalte, testado do jeito que ele indica: na argila, na temperatura, na espessura e na queima que ele recomenda. Food Safe e Dinnerware Safe não são a mesma coisa.</p>
            <p>Na ficha de cada esmalte, esses itens aparecem com o termo exato do fabricante, ou como “não verificado” quando ele não declara.</p>
          </div>
          <div>
            <p className="esm-grupo">O que vale para a sua peça</p>
            <p>A declaração não passa sozinha para a peça pronta. A segurança da peça depende da sua argila, da sua queima, da espessura aplicada e das combinações com outros esmaltes.</p>
            <p>Um esmalte não fica seguro para alimentos só por ser isento de chumbo ou por ter sido queimado em alta temperatura. Para louça, a peça precisa de teste de lixiviação.</p>
          </div>
        </div>
      </section>

      {SECOES_FIM.map((s) => <Bloco key={s.t} {...s} />)}

      <p className="seg-fonte">Texto original na Biblioteca: <Link to="/biblioteca/bib-seguranca">Segurança do laboratório</Link>.</p>
    </div>
  )
}
