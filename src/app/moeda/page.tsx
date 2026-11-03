import { Fragment } from "react";
import { Callout, PageHeader, Section, Takeaways } from "@/components/ui";
import { ConceptList } from "@/components/ConceptList";
import { CHAPTER_COLOR } from "@/components/shell/nav";
import { moeda } from "@/content/moeda";
import { QuantityTheory } from "@/components/moeda/QuantityTheory";
import { Seigniorage } from "@/components/moeda/Seigniorage";
import { Hyperinflation } from "@/components/moeda/Hyperinflation";
import { PlanoReal } from "@/components/moeda/PlanoReal";
import { PurchasingPower } from "@/components/moeda/PurchasingPower";
import { MoneyMultiplier } from "@/components/moeda/MoneyMultiplier";
import { Credibility } from "@/components/moeda/Credibility";

const TITLE = "Moeda & inflação";
export const metadata = {
  title: TITLE,
  openGraph: { title: `${TITLE} · Economia, visualizada` },
  twitter: { title: `${TITLE} · Economia, visualizada` },
};

export default function Page() {
  return (
    <>
      <PageHeader n="Capítulo 01" title={TITLE} color={CHAPTER_COLOR.moeda}>
        Entre 1980 e 1994 o Brasil teve cinco moedas, seis planos de estabilização e uma inflação acumulada de trilhões por cento. Este
        capítulo monta, peça por peça, os mecanismos por trás disso: a relação entre moeda e preços, o governo financiando déficit com
        emissão, a indexação que faz a inflação de ontem virar a de hoje e a engenharia da URV que finalmente quebrou a inércia. Todos os
        modelos são simplificados e educativos, com valores aproximados — servem para ver o mecanismo, não para prever.
      </PageHeader>

      <div id="quantitativa">
        <Section
          title="MV = PY: quando a moeda cresce mais que a economia"
          concepts={["teoria-quantitativa", "moeda-velocidade"]}
          intro="A teoria quantitativa é uma contabilidade: o total gasto (moeda × quantas vezes ela gira) é igual ao valor do que foi produzido (preços × quantidade). Se a moeda cresce mais rápido que a produção e a velocidade não compensa, a diferença aparece nos preços."
        >
          <QuantityTheory />
        </Section>
      </div>

      <div id="senhoriagem">
        <Section
          title="Senhoriagem: o imposto que ninguém vota"
          concepts={["senhoriagem", "imposto-inflacionario", "laffer-senhoriagem", "demanda-por-moeda-cagan"]}
          intro="Um governo que não consegue cobrir o déficit com impostos ou dívida pode emitir moeda. A receita real é a inflação vezes os saldos que as pessoas mantêm em reais — mas quanto maior a inflação, menos reais elas guardam. Daí uma curva com pico."
        >
          <Seigniorage />
        </Section>
      </div>

      <div id="hiperinflacao">
        <Section
          title="A espiral da hiperinflação brasileira"
          concepts={["hiperinflacao", "expectativas-adaptativas", "moeda-velocidade", "congelamento-de-precos"]}
          intro="Junte três ingredientes: déficit financiado com emissão, expectativas que seguem a inflação passada e contratos indexados. Cada choque eleva a inflação, que eleva as expectativas, que aumentam a velocidade da moeda e exigem mais emissão para o mesmo déficit. Os congelamentos dos anos 80 atacavam o sintoma."
        >
          <Hyperinflation />
        </Section>
      </div>

      <div id="plano-real">
        <Section
          title="Plano Real: a URV contra a inércia"
          concepts={["inflacao-inercial", "urv", "plano-real", "desindexacao"]}
          intro="Com inflação de 30–40% ao mês, cada preço era reajustado em uma data diferente. No momento de qualquer congelamento, alguns estavam no pico e outros no vale — e quem ficou para trás queria recuperar a perda. A URV resolveu isso alinhando todos os preços numa unidade estável antes de trocar a moeda."
        >
          <PlanoReal />
        </Section>
      </div>

      <div id="poder-de-compra">
        <Section
          title="Poder de compra: o efeito dos juros compostos ao contrário"
          concepts={["poder-de-compra", "regra-dos-70"]}
          intro="Mesmo inflação “baixa” é composta: cada ano incide sobre os preços já reajustados. Por isso a diferença entre 3% e 4,5% importa tanto em décadas."
        >
          <PurchasingPower />
        </Section>
      </div>

      <div id="multiplicador">
        <Section
          title="Bancos criam moeda: o multiplicador e o compulsório"
          concepts={["base-monetaria", "multiplicador-monetario", "deposito-compulsorio"]}
          intro="O BCB emite a base monetária, mas a maior parte do dinheiro é criada pelos bancos: cada empréstimo vira um depósito em outro banco, que empresta de novo. O depósito compulsório define quanto fica parado a cada volta."
        >
          <MoneyMultiplier />
          <div className="mt-4 max-w-3xl">
            <Callout tone="info">
              Hoje o BCB conduz a política monetária pela Selic, não pela quantidade de moeda — o multiplicador ajuda a entender o crédito,
              mas na prática ele varia muito e não é controlado diretamente.
            </Callout>
          </div>
        </Section>
      </div>

      <div id="credibilidade">
        <Section
          title="Expectativas e credibilidade: anunciado versus surpresa"
          concepts={["credibilidade-monetaria", "taxa-de-sacrificio", "expectativas-adaptativas"]}
          intro="A mesma redução no crescimento da moeda pode custar uma recessão ou quase nada. A diferença está nas expectativas: se as pessoas acreditam no anúncio, reajustam preços e salários de acordo, e a economia não precisa “descobrir” a nova inflação pela dor."
        >
          <Credibility />
        </Section>
      </div>

      <Takeaways
        items={[
          <Fragment key="t1">No longo prazo, inflação persistente exige moeda crescendo acima da produção — e por trás da emissão, quase sempre, um déficit.</Fragment>,
          <Fragment key="t2">Indexação e expectativas transformam choques em inércia: a inflação passada se reproduz sozinha até que algo alinhe os preços relativos.</Fragment>,
          <Fragment key="t3">Congelar preços trata o sintoma; o Plano Real funcionou porque combinou ajuste fiscal, desindexação via URV e, depois, credibilidade.</Fragment>,
        ]}
      />
      <ConceptList chapter={moeda} />
    </>
  );
}
