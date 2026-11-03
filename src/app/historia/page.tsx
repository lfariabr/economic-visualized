import { Callout, PageHeader, Section, Takeaways } from "@/components/ui";
import { ConceptList } from "@/components/ConceptList";
import { CHAPTER_COLOR } from "@/components/shell/nav";
import { historia } from "@/content/historia";
import { Timeline } from "@/components/historia/Timeline";
import { Planos } from "@/components/historia/Planos";
import { Tripe } from "@/components/historia/Tripe";
import { Crises } from "@/components/historia/Crises";
import { Correlacoes } from "@/components/historia/Correlacoes";
import { Deflator } from "@/components/historia/Deflator";

const TITLE = "Brasil 1980–2026";
export const metadata = {
  title: TITLE,
  openGraph: { title: `${TITLE} · Economia, visualizada` },
  twitter: { title: `${TITLE} · Economia, visualizada` },
};

export default function Page() {
  return (
    <>
      <PageHeader n="Capítulo 12" title={TITLE} color={CHAPTER_COLOR.historia}>
        Este capítulo junta tudo com dados reais (aproximados) de quatro décadas: a hiperinflação e os planos que
        tentaram vencê-la, o Plano Real, o tripé macroeconômico de 1999 e as crises que vieram depois — até a Selic de 15%
        de 2025. As séries são anuais e foram digitadas à mão a partir de IBGE, BCB e Ipeadata, com arredondamentos e
        mudanças de metodologia não tratadas; servem para ver padrões, não para pesquisa. Leia cada gráfico com os
        modelos dos capítulos anteriores na cabeça.
      </PageHeader>

      <div id="linha-do-tempo">
        <Section
          title="Linha do tempo: sete séries, 46 anos"
          concepts={["hiperinflacao-brasileira", "historia-salario-minimo-real"]}
          intro="Todas as séries no mesmo eixo de anos, com os governos ao fundo e os planos econômicos marcados. Passe o mouse para ler os valores de um ano em todas as séries ao mesmo tempo."
        >
          <Timeline />
        </Section>
      </div>

      <div id="planos">
        <Section
          title="Os planos econômicos, um por um"
          concepts={["historia-inflacao-inercial", "historia-congelamento", "plano-cruzado", "confisco-da-poupanca", "plano-real-1994", "urv-1994"]}
          intro="Entre 1986 e 1991 o Brasil tentou cinco vezes derrubar a inflação por decreto. Escolha um plano para ver o que ele fez e a inflação mensal seis meses antes e doze meses depois."
        >
          <Planos />
        </Section>
      </div>

      <div id="tripe">
        <Section
          title="O tripé macroeconômico (1999)"
          concepts={["tripe-macroeconomico", "historia-ancora-cambial", "historia-metas-de-inflacao"]}
          intro="Depois da crise de 1999 o país trocou a âncora cambial por três pilares: metas de inflação, câmbio flutuante e superávit primário. Compare os períodos e teste, num modelo de brinquedo, como cada regime reage à mesma fuga de capitais."
        >
          <Tripe />
        </Section>
      </div>

      <div id="crises">
        <Section
          title="Crises: zoom em sete episódios"
          concepts={["crise-1999", "historia-risco-pais", "recessao-2015-16", "choque-pandemia"]}
          intro="Escolha uma crise e os gráficos se ajustam à janela do episódio, com os principais eventos marcados."
        >
          <Crises />
        </Section>
      </div>

      <div id="correlacoes">
        <Section
          title="Explorador de correlações"
          concepts={["correlacao-causalidade"]}
          intro="Escolha duas séries e veja cada ano como um ponto. A cor indica a década; a reta tracejada é a tendência linear e r mede a força da relação."
        >
          <Correlacoes />
        </Section>
      </div>

      <div id="quanto-valia">
        <Section
          title="Quanto valia R$ 100?"
          concepts={["deflacionar", "troca-de-moedas"]}
          intro="Corrija qualquer valor entre dois anos pelo IPCA acumulado — atravessando, se preciso, as seis moedas do período."
        >
          <Deflator />
          <div className="mt-4">
            <Callout tone="accent">
              Para cálculos oficiais, use a Calculadora do Cidadão do Banco Central, que trabalha com índices mensais. Aqui usamos
              o IPCA anual aproximado, então os resultados são só uma ordem de grandeza.
            </Callout>
          </div>
        </Section>
      </div>

      <Takeaways
        items={[
          <span key="t1">
            Congelar preços derruba a inflação do mês seguinte, não a inflação. O Real funcionou porque atacou a{" "}
            <strong>inércia</strong> (URV) e veio com ajuste fiscal e âncora — sem confisco nem tabelamento.
          </span>,
          <span key="t2">
            O tripé trocou crises cambiais com reservas queimadas por um câmbio que oscila e um BC que reage à inflação.
            Quando um pilar fraqueja — sobretudo o fiscal — juros e dólar fazem o ajuste.
          </span>,
          <span key="t3">
            Quase toda crise brasileira repete o roteiro choque de confiança → dólar ↑ → inflação ↑ → Selic ↑ → PIB ↓.
            Correlações nos dados mostram isso, mas a causalidade vem dos modelos.
          </span>,
        ]}
      />
      <ConceptList chapter={historia} />
    </>
  );
}
