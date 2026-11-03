import { PageHeader, Section, Takeaways } from "@/components/ui";
import { ConceptList } from "@/components/ConceptList";
import { CHAPTER_COLOR } from "@/components/shell/nav";
import { phillips } from "@/content/phillips";
import { OriginalCurve } from "@/components/phillips/OriginalCurve";
import { Accelerationist } from "@/components/phillips/Accelerationist";
import { NairuReforms } from "@/components/phillips/NairuReforms";
import { SacrificeRatio } from "@/components/phillips/SacrificeRatio";
import { OkunLaw } from "@/components/phillips/OkunLaw";
import { LaborMarket } from "@/components/phillips/LaborMarket";
import { FlatCurve } from "@/components/phillips/FlatCurve";

const TITLE = "Phillips & desemprego";
export const metadata = {
  title: TITLE,
  openGraph: { title: `${TITLE} · Economia, visualizada` },
  twitter: { title: `${TITLE} · Economia, visualizada` },
};

export default function Page() {
  return (
    <>
      <PageHeader n="Capítulo 06" title={TITLE} color={CHAPTER_COLOR.phillips}>
        Por que o BC sobe juros quando o desemprego está baixo? Porque, no curto prazo, mercado de trabalho apertado pressiona salários
        e preços — é a curva de Phillips. Mas esse trade-off depende do que as pessoas esperam: tentar comprar desemprego baixo com
        inflação funciona por pouco tempo e termina em inflação mais alta. Aqui você vê a curva se deslocar, mede o custo de desinflar e
        aprende a ler a PNAD além da taxa de desemprego. Modelos simplificados, valores aproximados.
      </PageHeader>

      <div id="curva-original">
        <Section
          title="A curva de Phillips original"
          concepts={["phillips-original", "phillips-estagflacao"]}
          intro={
            <>
              Nos dados dos anos 50 e 60, anos de desemprego baixo eram anos de inflação alta. Parecia um cardápio à disposição do
              governo. Escolha um ponto na curva — e depois veja o que aconteceu quando as expectativas começaram a se mexer.
            </>
          }
        >
          <OriginalCurve />
        </Section>
      </div>

      <div id="aceleracionista">
        <Section
          title="Phillips aceleracionista: a curva sobe todo ano"
          concepts={["phillips-aceleracionista", "phillips-longo-prazo", "phillips-expectativas-adaptativas", "phillips-expectativas-racionais"]}
          intro={
            <>
              Friedman e Phelps: o que reduz o desemprego é a inflação <em>acima da esperada</em>. Um governo que insiste em manter o
              desemprego abaixo da taxa natural precisa surpreender todo ano — e cada surpresa vira a expectativa do ano seguinte. Rode
              os anos e acompanhe a trilha.
            </>
          }
        >
          <Accelerationist />
        </Section>
      </div>

      <div id="desemprego-natural">
        <Section
          title="NAIRU: o desemprego que não acelera a inflação"
          concepts={["nairu", "desemprego-friccional"]}
          intro={
            <>
              A taxa natural não é natural no sentido de fixa: depende de quanto tempo se leva para achar emprego, do descasamento de
              habilidades e das regras do mercado de trabalho. Reformas a movem; juros, não.
            </>
          }
        >
          <NairuReforms />
        </Section>
      </div>

      <div id="sacrificio">
        <Section
          title="Taxa de sacrifício: quanto custa desinflar"
          concepts={["phillips-sacrificio", "gradualismo-vs-choque", "histerese"]}
          intro={
            <>
              Para levar a inflação de 10% para 3% com expectativas que olham para trás, é preciso desemprego acima da NAIRU por algum
              tempo. Compare estratégias e veja o papel da credibilidade.
            </>
          }
        >
          <SacrificeRatio />
        </Section>
      </div>

      <div id="okun">
        <Section
          title="Lei de Okun: PIB e desemprego"
          concepts={["lei-de-okun"]}
          intro={
            <>
              Crescer pouco faz o desemprego subir; crescer muito faz cair. Ajuste a reta de Okun aos dados brasileiros recentes e use-a
              para traduzir uma hipótese de PIB em desemprego.
            </>
          }
        >
          <OkunLaw />
        </Section>
      </div>

      <div id="mercado-de-trabalho">
        <Section
          title="O mercado de trabalho brasileiro além da taxa de desemprego"
          concepts={["taxa-de-participacao", "phillips-informalidade", "desalento", "subocupacao"]}
          intro={
            <>
              A taxa de desemprego da PNAD Contínua conta só quem procurou emprego. Fora dela ficam os desalentados; dentro dos ocupados
              estão milhões de informais e subocupados. Mexa nas peças e veja como o mesmo mercado pode parecer melhor ou pior.
            </>
          }
        >
          <LaborMarket />
        </Section>
      </div>

      <div id="achatada">
        <Section
          title="Curva de Phillips achatada"
          concepts={["phillips-achatada"]}
          intro={
            <>
              Estimativas recentes, no Brasil e fora, sugerem que a inflação reage menos ao desemprego do que antes. Isso tem um lado
              bom (estabilidade) e um caro: para desinflar pelo mercado de trabalho, o BC precisa de recessões maiores.
            </>
          }
        >
          <FlatCurve />
        </Section>
      </div>

      <Takeaways
        items={[
          <span key="t1">
            O trade-off inflação × desemprego existe no <b>curto prazo</b> e depende das expectativas. No longo prazo a curva é
            vertical na NAIRU.
          </span>,
          <span key="t2">
            Desinflar custa desemprego; a <b>credibilidade</b> reduz a conta, e a histerese pode torná-la permanente. Desemprego baixo
            duradouro vem de reformas que baixam a NAIRU.
          </span>,
          <span key="t3">
            A taxa de desemprego é só uma janela: <b>participação, desalento, informalidade e subocupação</b> mudam a leitura do mercado
            de trabalho.
          </span>,
        ]}
      />
      <ConceptList chapter={phillips} />
    </>
  );
}
