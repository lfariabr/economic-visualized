import Link from "next/link";
import { Callout, PageHeader, Section, Takeaways } from "@/components/ui";
import { ConceptList } from "@/components/ConceptList";
import { CHAPTER_COLOR } from "@/components/shell/nav";
import { inadimplencia } from "@/content/inadimplencia";
import { SimuladorFamilias } from "@/components/inadimplencia/SimuladorFamilias";
import { DesenrolaSim } from "@/components/inadimplencia/DesenrolaSim";
import { BolaDeNeve } from "@/components/inadimplencia/BolaDeNeve";
import { Comprometimento } from "@/components/inadimplencia/Comprometimento";
import { SelecaoAdversa } from "@/components/inadimplencia/SelecaoAdversa";
import { CadastroPositivo } from "@/components/inadimplencia/CadastroPositivo";
import { CicloCredito } from "@/components/inadimplencia/CicloCredito";

const TITLE = "Inadimplência & Desenrola";
export const metadata = {
  title: TITLE,
  openGraph: { title: `${TITLE} · Economia, visualizada` },
  twitter: { title: `${TITLE} · Economia, visualizada` },
};

export default function Page() {
  return (
    <>
      <PageHeader n="Capítulo 13" title={TITLE} color={CHAPTER_COLOR.inadimplencia}>
        Quase oito em cada dez famílias brasileiras têm alguma dívida, cerca de três em cada dez estão com conta atrasada e a Serasa conta em torno
        de 70 milhões de CPFs negativados (valores aproximados). Ter dívida não é o problema; o problema é quando a parcela passa do que sobra da
        renda. Neste capítulo você simula 300 famílias mês a mês, aplica choques de desemprego, comida cara e Selic, e depois lança um programa de
        renegociação no estilo do Desenrola — para ver quem sai do vermelho, quem volta e o que acontece quando todo mundo passa a esperar a
        próxima rodada. Os modelos são simplificados e didáticos, não previsões.
      </PageHeader>

      <div id="sim-familias">
        <Section
          title="Simulador de inadimplência: 300 famílias, mês a mês"
          concepts={["inadimplencia-taxa", "inadimplencia-negativacao", "inadimplencia-choque-de-renda", "inadimplencia-exclusao-credito", "inadimplencia-espiral-spread"]}
          intro={
            <>
              Cada ponto é uma família com renda, gastos essenciais e uma dívida — cartão rotativo, cheque especial, consignado, crédito pessoal ou
              financiamento. Todo mês ela recebe (ou não, se perdeu o emprego), paga o essencial e tenta pagar a parcela. Se não dá, tapa o buraco no
              cartão enquanto há limite; depois atrasa; com mais de 90 dias, é negativada e perde o crédito.
            </>
          }
        >
          <SimuladorFamilias />
        </Section>
      </div>

      <div id="desenrola-sim">
        <Section
          title="Programa de renegociação: lançando o Desenrola"
          concepts={["desenrola", "inadimplencia-fgo", "inadimplencia-leilao-descontos", "inadimplencia-limpa-nome", "inadimplencia-reincidencia", "risco-moral-credito"]}
          intro={
            <>
              As mesmas famílias, agora com um programa no mês 6: negativadas de baixa renda podem trocar a dívida por uma nova, com desconto e juro
              limitado, garantida pelo governo. Os dois cenários usam o mesmo sorteio de choques, então a diferença entre as curvas é o efeito do
              programa. O padrão segue o Desenrola de 2023 — Faixa 1 para renda até 2 salários mínimos ou CadÚnico, dívidas de até R$ 5 mil,
              leilão de descontos, juros de até 1,99% a.m. e garantia do FGO; a Faixa 2 (renegociação direta com os bancos) fica de fora do
              modelo.
            </>
          }
        >
          <DesenrolaSim />
          <div className="mt-4">
            <Callout tone="info">
              “Desenrola 2” e “Desenrola 3” aqui são rodadas hipotéticas, com os mesmos parâmetros ajustáveis — não descrevem regras legais de
              versões futuras. O ponto é o mecanismo: se a família acredita que haverá outra rodada, pagar em dia hoje deixa de compensar.
            </Callout>
          </div>
        </Section>
      </div>

      <div id="rotativo-armadilha">
        <Section
          title="Por que o rotativo leva à inadimplência"
          concepts={["inadimplencia-armadilha-minimo"]}
          intro={
            <>
              Uma única família, uma fatura de cartão e um orçamento que não fecha. Pagando só o mínimo, quase tudo vira juros; o rombo do mês entra
              por cima e o mínimo exigido cresce até passar do que sobra. A comparação entre rotativo, cheque especial e consignado está no capítulo
              de{" "}
              <Link href="/juros#rotativo" className="text-info underline-offset-2 hover:underline">
                CDI, juros &amp; crédito
              </Link>
              .
            </>
          }
        >
          <BolaDeNeve />
        </Section>
      </div>

      <div id="comprometimento">
        <Section
          title="Endividamento × comprometimento de renda"
          concepts={["inadimplencia-endividado-vs-inadimplente", "inadimplencia-comprometimento-renda", "superendividamento"]}
          intro="Estar endividado é ter dívida; estar inadimplente é não conseguir pagá-la. O que liga um ao outro é o comprometimento de renda (DSR): quanto da renda mensal vai para juros e amortização. A média nacional fica perto de 28%, mas a média esconde a cauda de famílias muito apertadas."
        >
          <Comprometimento />
          <div className="mt-4">
            <Callout tone="accent">
              Para quem está na cauda vermelha, a Lei do Superendividamento (14.181/2021) permite juntar todas as dívidas de consumo numa
              repactuação única com os credores, preservando um mínimo existencial — uma saída que olha para a soma das parcelas, não para cada
              dívida isolada.
            </Callout>
          </div>
        </Section>
      </div>

      <div id="jogo-do-banco">
        <Section
          title="Risco moral e seleção adversa: o jogo do banco"
          concepts={["inadimplencia-selecao-adversa", "inadimplencia-racionamento-credito"]}
          intro="Você é o banco. Há 200 candidatos — bons, médios e arriscados — mas você não sabe quem é quem. Escolha a taxa: juro alto cobre o risco, só que espanta quem tem alternativa e aperta o orçamento de quem fica. Encontre o ponto a partir do qual subir o juro dá prejuízo."
        >
          <SelecaoAdversa />
        </Section>
      </div>

      <div id="score">
        <Section
          title="Cadastro Positivo e score: informação baixa o spread"
          concepts={["cadastro-positivo", "inadimplencia-score-credito"]}
          intro="Sem informação, o banco cobra de todos a taxa média — e o bom pagador paga pelo calote dos outros. Com histórico de pagamentos, o score separa os tipos e a taxa de cada um se aproxima do seu próprio risco."
        >
          <CadastroPositivo />
        </Section>
      </div>

      <div id="ciclo">
        <Section
          title="Ciclo do crédito: o boom de 2010–14 e o bust de 2015–16"
          concepts={["inadimplencia-ciclo-credito"]}
          intro="Crédito cresce rápido quando a economia vai bem e os bancos estão otimistas; a dívida e as parcelas sobem junto. Quando o juro sobe e o emprego cai, a conta chega com atraso: inadimplência alta, crédito cortado, consumo travado."
        >
          <CicloCredito />
        </Section>
      </div>

      <Takeaways
        items={[
          <span key="t1">
            Inadimplência é, antes de tudo, um problema de <strong>fluxo</strong>: a parcela passa da renda que sobra. Desemprego e comida cara
            empurram mais famílias para o vermelho do que a Selic sozinha — e quem é negativado perde o colchão do crédito.
          </span>,
          <span key="t2">
            Renegociar com desconto e garantia (como no Desenrola) limpa o estoque e devolve acesso a crédito, mas não cria renda: parte volta a
            atrasar, e a garantia vira custo fiscal na medida da reincidência.
          </span>,
          <span key="t3">
            Rodadas repetidas criam <strong>risco moral</strong>; juro alto demais cria <strong>seleção adversa</strong>. Informação melhor
            (Cadastro Positivo) e garantias reduzem o spread de forma mais durável que perdões periódicos.
          </span>,
        ]}
      />
      <ConceptList chapter={inadimplencia} />
    </>
  );
}
