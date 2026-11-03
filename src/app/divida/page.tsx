import { PageHeader, Section, Takeaways } from "@/components/ui";
import { ConceptList } from "@/components/ConceptList";
import { CHAPTER_COLOR } from "@/components/shell/nav";
import { divida } from "@/content/divida";
import { DebtDynamics } from "@/components/divida/DebtDynamics";
import { StabilizingPrimary } from "@/components/divida/StabilizingPrimary";
import { Snowball } from "@/components/divida/Snowball";
import { DebtComposition } from "@/components/divida/DebtComposition";
import { FiscalFramework } from "@/components/divida/FiscalFramework";
import { BudgetRigidity } from "@/components/divida/BudgetRigidity";
import { Rollover } from "@/components/divida/Rollover";
import { CountryComparison, InflationErosion } from "@/components/divida/InflationAndWorld";

const TITLE = "Dívida pública";
export const metadata = {
  title: TITLE,
  openGraph: { title: `${TITLE} · Economia, visualizada` },
  twitter: { title: `${TITLE} · Economia, visualizada` },
};

export default function Page() {
  return (
    <>
      <PageHeader n="Capítulo 09" title={TITLE} color={CHAPTER_COLOR.divida}>
        O governo brasileiro deve perto de 78% do PIB e paga cerca de 8% do PIB por ano em juros. Se isso é sustentável depende
        de uma corrida entre três números: o juro real r, o crescimento g e o resultado primário s. Aqui você mexe nesses
        números, liga o prêmio de risco, aplica choques na Selic, no IPCA e no dólar, testa o arcabouço fiscal e vê o orçamento
        ser engolido pelas despesas obrigatórias. Os modelos são simplificados e usam valores aproximados; nada aqui é previsão.
      </PageHeader>

      <div id="dinamica">
        <Section
          title="A dinâmica da dívida"
          concepts={["divida-bruta", "divida-r-menos-g", "resultado-primario", "divida-equacao-dinamica"]}
          intro="A cada ano, a dívida cresce com os juros, é diluída pelo crescimento do PIB e diminui com o superávit primário. Quando o juro real supera o crescimento, ficar parado já é andar para trás."
        >
          <DebtDynamics />
        </Section>
      </div>

      <div id="primario">
        <Section
          title="O primário que estabiliza"
          concepts={["primario-estabilizador"]}
          intro="Existe um superávit exato que mantém a dívida/PIB constante. Ele cresce com a diferença r − g e com o próprio tamanho da dívida — é por isso que dívida alta é perigosa mesmo sem crise."
        >
          <StabilizingPrimary />
        </Section>
      </div>

      <div id="feedback">
        <Section
          title="Bola de neve e dominância fiscal"
          concepts={["bola-de-neve", "dominancia-fiscal"]}
          intro="No mundo real o juro não é fixo: credores cobram mais de quem deve mais. Esse prêmio de risco cria um ponto de não retorno. Abaixo dele, a dívida volta; acima, ela se alimenta sozinha."
        >
          <Snowball />
        </Section>
      </div>

      <div id="composicao">
        <Section
          title="Do que a dívida é feita"
          concepts={["dpmfi", "selic-e-fiscal"]}
          intro="Os títulos do Tesouro pagam de formas diferentes: Selic do dia, taxa fixa, IPCA mais um juro, ou variação do dólar. Cada indexador transmite um choque diferente para a conta de juros."
        >
          <DebtComposition />
        </Section>
      </div>

      <div id="arcabouco">
        <Section
          title="Arcabouço fiscal × teto de gastos"
          concepts={["arcabouco-fiscal", "teto-de-gastos"]}
          intro="Duas regras para conter a despesa. O teto (EC 95) congelava o gasto real; o arcabouço (LC 200/2023) deixa o gasto crescer com a receita, dentro de uma faixa, e persegue metas de primário com tolerância. Sorteie anos bons e ruins de arrecadação e compare."
        >
          <FiscalFramework />
        </Section>
      </div>

      <div id="obrigatorio">
        <Section
          title="Obrigatórias engolem o orçamento"
          concepts={["despesa-obrigatoria", "vinculacao-salario-minimo"]}
          intro="Sob um limite total, o que cresce mais rápido toma espaço do resto. Previdência e BPC sobem com o envelhecimento e o salário mínimo; saúde e educação têm pisos vinculados à receita. Sobra cada vez menos para investimento e custeio."
        >
          <BudgetRigidity />
        </Section>
      </div>

      <div id="rolagem">
        <Section
          title="Rolagem, prazo e crise de confiança"
          concepts={["risco-de-rolagem", "colchao-de-liquidez"]}
          intro="O Tesouro não paga a dívida, ele a rola: emite títulos novos para pagar os que vencem. Se a confiança some, o refinanciamento sai mais caro — e quanto mais curta a dívida, mais rápido o estrago chega."
        >
          <Rollover />
        </Section>
      </div>

      <div id="inflacao">
        <Section
          title="Inflação ajuda? E o resto do mundo?"
          concepts={["imposto-inflacionario-divida", "juros-nominais-pib"]}
          intro="Inflação pode corroer dívidas — mas só a parte fixa em reais, e só de surpresa. E na comparação internacional, o Brasil não deve tanto; o que impressiona é quanto paga de juros."
        >
          <div className="space-y-6">
            <InflationErosion />
            <CountryComparison />
          </div>
        </Section>
      </div>

      <Takeaways
        items={[
          <span key="t1">A sustentabilidade depende de r − g e do primário, não do tamanho da dívida sozinho. Com r − g alto, mesmo dívidas médias exigem superávits grandes.</span>,
          <span key="t2">O prêmio de risco cria um ponto de não retorno; credibilidade fiscal é o que mantém a economia longe dele.</span>,
          <span key="t3">Composição, prazo e rigidez orçamentária importam tanto quanto o nível: dívida curta e atrelada à Selic e despesas obrigatórias crescentes deixam pouco espaço para errar.</span>,
        ]}
      />
      <ConceptList chapter={divida} />
    </>
  );
}
