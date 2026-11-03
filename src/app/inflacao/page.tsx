import { Fragment } from "react";
import { Callout, PageHeader, Section, Takeaways } from "@/components/ui";
import { ConceptList } from "@/components/ConceptList";
import { CHAPTER_COLOR } from "@/components/shell/nav";
import { inflacao } from "@/content/inflacao";
import { IpcaBasket } from "@/components/inflacao/IpcaBasket";
import { InflationTarget } from "@/components/inflacao/InflationTarget";
import { Inertia } from "@/components/inflacao/Inertia";
import { AsAd } from "@/components/inflacao/AsAd";
import { CoreInflation } from "@/components/inflacao/CoreInflation";
import { IndexComparison } from "@/components/inflacao/IndexComparison";
import { IncomeInflation } from "@/components/inflacao/IncomeInflation";
import { MoneyIllusion } from "@/components/inflacao/MoneyIllusion";

const TITLE = "IPCA & inércia";
export const metadata = {
  title: TITLE,
  openGraph: { title: `${TITLE} · Economia, visualizada` },
  twitter: { title: `${TITLE} · Economia, visualizada` },
};

export default function Page() {
  return (
    <>
      <PageHeader n="Capítulo 02" title={TITLE} color={CHAPTER_COLOR.inflacao}>
        Todo mês o IBGE coleta centenas de milhares de preços e os resume num número: o IPCA. Este capítulo abre esse número — a cesta e
        seus pesos, a meta de 3% com banda de 1,5 ponto, os núcleos que o Banco Central acompanha e a indexação que faz um choque durar
        meses. Também compara o IPCA com o IGP-M e o INPC e mostra por que a inflação não é igual para todo mundo. Pesos e parâmetros são
        valores aproximados, e os modelos são simplificados para fins educativos.
      </PageHeader>

      <div id="cesta-ipca">
        <Section
          title="A cesta do IPCA: quem puxa o índice"
          concepts={["ipca", "cesta-ipca", "contribuicao-ipca"]}
          intro="O IPCA é uma média ponderada: cada grupo entra com o peso que tem no orçamento das famílias. Alimentação e Transportes somam mais de 40% — e, dentro deles, gasolina e energia elétrica são os subitens que mais pesam."
        >
          <IpcaBasket />
        </Section>
      </div>

      <div id="meta">
        <Section
          title="Meta de 3%, banda de 1,5 p.p. e a carta aberta"
          concepts={["meta-de-inflacao", "meta-continua", "carta-aberta"]}
          intro="Choques aleatórios empurram a inflação para cima e para baixo; o BC reage com juros para trazê-la de volta à meta. Se o IPCA em 12 meses ficar fora do intervalo de 1,5% a 4,5% por seis meses seguidos, o presidente do BCB precisa escrever uma carta aberta."
        >
          <InflationTarget />
        </Section>
      </div>

      <div id="inercia">
        <Section
          title="Inércia: quando o choque de ontem vira a inflação de hoje"
          concepts={["inercia-inflacionaria", "indexacao"]}
          intro="Aluguel corrigido pelo IGP-M, salário mínimo pelo INPC, tarifas por contrato: uma parte da economia reajusta preços olhando para trás. Quanto maior essa parte, mais tempo um choque único leva para sumir."
        >
          <Inertia />
        </Section>
      </div>

      <div id="oferta-demanda">
        <Section
          title="Choque de oferta × choque de demanda"
          concepts={["inflacao-choque-de-oferta", "inflacao-choque-de-demanda", "estagflacao"]}
          intro="Nem toda inflação tem a mesma origem. Demanda aquecida move preço e produto juntos; uma seca ou o petróleo caro elevam preços enquanto derrubam a produção. A distinção define o dilema do Copom."
        >
          <AsAd />
        </Section>
      </div>

      <div id="nucleos">
        <Section
          title="Núcleos: separar o sinal do ruído"
          concepts={["nucleo-de-inflacao", "media-aparada", "precos-monitorados"]}
          intro="Em qualquer mês, alguns itens disparam e outros despencam por razões próprias — safra, bandeira tarifária, reajuste de plano de saúde. Os núcleos tentam enxergar a inflação de fundo, que é a que responde aos juros."
        >
          <CoreInflation />
        </Section>
      </div>

      <div id="indices">
        <Section
          title="IPCA × IGP-M × INPC: o mesmo dólar, índices diferentes"
          concepts={["igp-m", "inpc", "inflacao-repasse-cambial"]}
          intro="O IGP-M pesa 60% de preços no atacado, onde câmbio e commodities chegam quase inteiros. O IPCA mede o consumidor, onde serviços amortecem o choque. Em 2020–21 a diferença virou briga de inquilino com proprietário."
        >
          <IndexComparison />
        </Section>
      </div>

      <div id="renda">
        <Section
          title="A inflação dos pobres e a dos ricos"
          concepts={["inflacao-por-renda", "inpc"]}
          intro="O IPCA usa a cesta média. Mas quem ganha pouco gasta uma fatia muito maior com comida e conta de luz, e quem ganha mais gasta com escola, plano de saúde, carro e lazer. Mesmos preços, inflações diferentes."
        >
          <IncomeInflation />
        </Section>
      </div>

      <div id="juros-reais">
        <Section
          title="Ilusão monetária e juro real"
          concepts={["ilusao-monetaria", "juro-real"]}
          intro="O que importa é o poder de compra, não o número no contracheque ou no extrato. A equação de Fisher desconta a inflação de qualquer taxa nominal."
        >
          <MoneyIllusion />
          <div className="mt-4 max-w-3xl">
            <Callout tone="info">
              Com Selic perto de 15% e IPCA perto de 4,5%, o juro real brasileiro fica em torno de 10% ao ano — muito acima do neutro
              estimado pelo BCB. É o custo de trazer a inflação de volta para a meta.
            </Callout>
          </div>
        </Section>
      </div>

      <Takeaways
        items={[
          <Fragment key="t1">O IPCA é uma média ponderada: poucos subitens de peso alto — gasolina, energia, alimentos — explicam boa parte das surpresas do mês.</Fragment>,
          <Fragment key="t2">Indexação transforma choques temporários em inflação persistente; é por isso que o BC reage mesmo a choques de oferta quando as expectativas começam a subir.</Fragment>,
          <Fragment key="t3">Não existe uma inflação só: núcleos, IGP-M, INPC e a cesta de cada faixa de renda contam partes diferentes da mesma história.</Fragment>,
        ]}
      />
      <ConceptList chapter={inflacao} />
    </>
  );
}
