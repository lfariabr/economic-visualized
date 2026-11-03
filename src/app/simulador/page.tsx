import { Callout, PageHeader, Section, Takeaways } from "@/components/ui";
import { ConceptList } from "@/components/ConceptList";
import { CHAPTER_COLOR } from "@/components/shell/nav";
import { simulador } from "@/content/simulador";
import { SimuladorBrasil } from "@/components/simulador/SimuladorBrasil";
import { CicloVicioso } from "@/components/simulador/CicloVicioso";
import { ChoqueAlimentos } from "@/components/simulador/ChoqueAlimentos";
import { TradeOffs } from "@/components/simulador/TradeOffs";
import { CambioRepasse } from "@/components/simulador/CambioRepasse";

const TITLE = "Simulador Brasil";
export const metadata = {
  title: TITLE,
  openGraph: { title: `${TITLE} · Economia, visualizada` },
  twitter: { title: `${TITLE} · Economia, visualizada` },
};

export default function Page() {
  return (
    <>
      <PageHeader n="Capítulo 11" title={TITLE} color={CHAPTER_COLOR.simulador}>
        Agora você é o governo <em>e</em> o Banco Central. Os capítulos anteriores mostraram cada engrenagem isolada — Selic, Phillips, câmbio,
        Laffer, dívida. Aqui elas estão ligadas num só modelo trimestral, que parte de valores aproximados do Brasil no fim de 2025: Selic
        15%, IPCA ~5%, dólar R$ 5,40, dívida bruta 78% do PIB, desemprego ~6%. Mexa nos juros, no gasto e nos impostos, aplique choques e
        veja os problemas aparecerem — quase sempre num lugar diferente de onde você mexeu. O modelo é educacional e simplificado: serve para
        entender mecanismos, não para prever o futuro.
      </PageHeader>

      <div id="simulador">
        <Section
          title="O simulador: 10 anos, 40 trimestres"
          concepts={[
            "simulador-modelo-integrado",
            "simulador-transmissao-monetaria",
            "simulador-hiato-is",
            "simulador-phillips-expectativas",
            "simulador-credibilidade",
            "simulador-carta-aberta",
            "simulador-recessao-tecnica",
            "simulador-arrecadacao-laffer",
          ]}
          intro={
            <>
              Escolha um cenário pronto ou ajuste os controles e aperte ▶. A cada trimestre o modelo resolve, em ordem: Copom decide a Selic →
              juro real move o hiato (IS) → hiato move o desemprego (Okun) e a inflação (Phillips + expectativas + repasse cambial) → câmbio
              segue a paridade de juros e o risco → dívida segue d′ = d·(1+i)/(1+g) − primário → risco-país reage à dívida. Indicadores ficam
              vermelhos quando quebram, e o diário de bordo registra cada alarme.
            </>
          }
        >
          <SimuladorBrasil />
          <div className="mt-4 max-w-3xl">
            <Callout tone="info">
              Repare que o status quo — Copom seguindo a regra, déficit primário pequeno — não explode, mas a dívida sobe uns 3 a 4 pontos
              do PIB por ano e o risco-país vai subindo junto: o juro real que o Brasil paga sobre a dívida é maior que o crescimento. É o mesmo diagnóstico das projeções da
              IFI e do Tesouro: estabilizar exige primário em torno de 1,5% a 2% do PIB.
            </Callout>
          </div>
        </Section>
      </div>

      <div id="ciclo-vicioso">
        <Section
          title="O ciclo vicioso fiscal-monetário"
          concepts={["simulador-ciclo-vicioso", "simulador-dominancia-fiscal", "simulador-juro-neutro"]}
          intro="Dívida não cresce só pelo déficit: ela cresce pelos juros, e os juros dependem de quanto o mercado confia que a dívida será paga. Aqui a mesma política fiscal roda duas vezes — com e sem o elo dívida → risco-país → juros."
        >
          <CicloVicioso />
        </Section>
      </div>

      <div id="choque-alimentos">
        <Section
          title="Por que choque de alimentos não se resolve com juros"
          concepts={["simulador-choque-de-oferta", "simulador-nucleo-inflacao"]}
          intro="Uma seca faz a comida subir e o IPCA estourar o teto. O que o BC deve fazer? Comparamos dois Copoms idênticos, exceto por um detalhe: um reage ao IPCA cheio, o outro ao núcleo (sem alimentos)."
        >
          <ChoqueAlimentos />
        </Section>
      </div>

      <div id="cambio-repasse">
        <Section
          title="Crise de confiança: câmbio, repasse e reservas"
          concepts={["simulador-risco-pais", "simulador-paridade-juros", "simulador-repasse-cambial", "simulador-intervencao-cambial"]}
          intro="O risco-país salta (um susto fiscal, uma crise lá fora). O real se desvaloriza, o dólar mais caro chega aos preços. O BC pode queimar reservas para segurar a cotação — por quanto tempo e a que custo?"
        >
          <CambioRepasse />
        </Section>
      </div>

      <div id="trade-offs">
        <Section
          title="Trade-offs: não existe almoço grátis"
          concepts={["simulador-trade-off", "simulador-regra-de-taylor", "simulador-okun"]}
          intro="Cada ponto abaixo é uma década inteira simulada com o mesmo choque do petróleo, variando só a dureza do Copom. Juntos, eles desenham a fronteira de escolhas possíveis — e o gasto público decide onde essa fronteira fica."
        >
          <TradeOffs />
        </Section>
      </div>

      <Takeaways
        items={[
          "Tudo está ligado: juro mexe no câmbio, câmbio mexe na inflação, inflação mexe na dívida, dívida mexe no risco e o risco volta para o juro. Uma decisão nunca afeta só uma variável.",
          "Os efeitos chegam com defasagem e de forma não linear: o custo de uma política aparece trimestres depois, muitas vezes noutro indicador, e piora rápido quando a credibilidade se perde.",
          "Política monetária e fiscal precisam remar juntas. Com primário fraco, o BC carrega o peso sozinho com juros altos; com BC leniente, a inflação desfaz qualquer ganho fiscal.",
        ]}
      />
      <ConceptList chapter={simulador} />
    </>
  );
}
