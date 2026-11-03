import { PageHeader, Section, Takeaways } from "@/components/ui";
import { ConceptList } from "@/components/ConceptList";
import { CHAPTER_COLOR } from "@/components/shell/nav";
import { pib } from "@/content/pib";
import { DespesaPIB } from "@/components/pib/DespesaPIB";
import { Multiplicador } from "@/components/pib/Multiplicador";
import { ISLM } from "@/components/pib/ISLM";
import { CicloHiato } from "@/components/pib/CicloHiato";
import { Solow } from "@/components/pib/Solow";
import { RendaMedia } from "@/components/pib/RendaMedia";
import { BonusDemografico } from "@/components/pib/BonusDemografico";
import { RendaDistribuicao } from "@/components/pib/RendaDistribuicao";

const TITLE = "PIB & crescimento";
export const metadata = {
  title: TITLE,
  openGraph: { title: `${TITLE} · Economia, visualizada` },
  twitter: { title: `${TITLE} · Economia, visualizada` },
};

export default function Page() {
  return (
    <>
      <PageHeader n="Capítulo 10" title={TITLE} color={CHAPTER_COLOR.pib}>
        O PIB é a soma de tudo o que o país produz num período — cerca de R$ 11,7 trilhões em 2024 (valor aproximado, IBGE). Este capítulo olha
        para ele em duas escalas. No curto prazo, a demanda manda: consumo, investimento, gasto público e exportações puxam o PIB para cima ou
        para baixo do potencial, e juros e multiplicadores decidem o tamanho do efeito. No longo prazo, quem manda é a oferta: capital,
        trabalhadores e, sobretudo, produtividade. Os modelos aqui são simplificados e os números, aproximados — servem para enxergar mecanismos,
        não para prever.
      </PageHeader>

      <div id="otica-despesa">
        <Section
          title="De onde vem o PIB: Y = C + I + G + (X − M)"
          concepts={["pib-otica-despesa", "pib-fbcf"]}
          intro="Pela ótica da despesa, o PIB é quem compra o que foi produzido. As importações entram com sinal negativo porque já estão escondidas dentro de C, I e G — não foram produzidas aqui. Mexa nas fatias (base = 100) e compare com outras economias."
        >
          <DespesaPIB />
        </Section>
      </div>

      <div id="multiplicador">
        <Section
          title="O multiplicador: R$ 10 bi que viram mais (ou menos)"
          concepts={["multiplicador-keynesiano", "propensao-marginal-consumir", "vazamentos-multiplicador"]}
          intro="O governo gasta R$ 10 bi numa obra. O empreiteiro paga salários, os trabalhadores vão ao mercado, o mercado paga fornecedores… Cada rodada é menor que a anterior porque uma parte vaza para poupança, impostos e importações."
        >
          <Multiplicador />
        </Section>
      </div>

      <div id="is-lm">
        <Section
          title="IS-LM: juros e produto ao mesmo tempo"
          concepts={["is-lm", "crowding-out", "lm-horizontal"]}
          intro="A curva IS reúne os pares (juro, produto) em que a demanda iguala a produção: juro mais alto, menos investimento, menos PIB. A LM reúne os pares em que o mercado de moeda fecha. O cruzamento é o equilíbrio. Arraste as curvas."
        >
          <ISLM />
        </Section>
      </div>

      <div id="ciclo">
        <Section
          title="Ciclo econômico e hiato do produto"
          concepts={["pib-potencial", "hiato-do-produto", "recessao-tecnica-pib"]}
          intro="O PIB potencial cresce devagar e de forma estável; o PIB efetivo oscila em volta dele, empurrado por choques que se dissipam aos poucos. Quando o efetivo cai dois trimestres seguidos, a imprensa chama de recessão técnica."
        >
          <CicloHiato />
        </Section>
      </div>

      <div id="solow">
        <Section
          title="Modelo de Solow: por que investir não basta"
          concepts={["modelo-de-solow", "estado-estacionario", "ptf"]}
          intro="Duas economias com a mesma tecnologia e a mesma população, mas uma investe 17% do PIB (Brasil) e outra 35% (Coreia). Ambas partem do mesmo capital por trabalhador. O capital acumula até o investimento só repor a depreciação."
        >
          <Solow />
        </Section>
      </div>

      <div id="renda-media">
        <Section
          title="A armadilha da renda média"
          concepts={["armadilha-renda-media"]}
          intro="Medido como fração da renda per capita americana (em PPC), o Brasil chegou perto de 36% em 1980 e desde então oscila em torno de 25%. Coreia e China seguiram outro caminho. Projete o futuro brasileiro com diferentes taxas de crescimento."
        >
          <RendaMedia />
        </Section>
      </div>

      <div id="bonus-demografico">
        <Section
          title="Bônus demográfico: o vento a favor que está acabando"
          concepts={["bonus-demografico", "razao-de-dependencia"]}
          intro="Com a queda da fecundidade, a fatia da população em idade de trabalhar subiu por cinco décadas — e isso, sozinho, elevou o PIB per capita. Agora a população envelhece: menos trabalhadores por habitante, mais aposentados por contribuinte."
        >
          <BonusDemografico />
        </Section>
      </div>

      <div id="distribuicao">
        <Section
          title="PIB, PIB per capita, PPC — e a distribuição"
          concepts={["pib-per-capita", "ppc", "gini-lorenz"]}
          intro="Um PIB grande não significa um país rico, e uma renda média alta não significa que a maioria vive bem. Compare medidas de tamanho e de padrão de vida, e veja como a renda se distribui."
        >
          <RendaDistribuicao />
        </Section>
      </div>

      <Takeaways
        items={[
          "No curto prazo o PIB segue a demanda: o efeito de um gasto depende de quem recebe (PMC), dos vazamentos e de como o Banco Central reage com os juros.",
          "No longo prazo, só a produtividade sustenta o crescimento da renda per capita. Investir mais eleva o nível, não a taxa — e o bônus demográfico que ajudava o Brasil está acabando.",
          "PIB é tamanho, não bem-estar: renda per capita, PPC, IDH e Gini contam partes diferentes da história, e no Brasil a distribuição pesa tanto quanto a média.",
        ]}
      />
      <ConceptList chapter={pib} />
    </>
  );
}
