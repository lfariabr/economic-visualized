import { Callout, PageHeader, Section, Takeaways } from "@/components/ui";
import { ConceptList } from "@/components/ConceptList";
import { CHAPTER_COLOR } from "@/components/shell/nav";
import { alimentos } from "@/content/alimentos";
import { SupplyShock } from "@/components/alimentos/SupplyShock";
import { Cobweb } from "@/components/alimentos/Cobweb";
import { CommodityFx } from "@/components/alimentos/CommodityFx";
import { CestaBasica } from "@/components/alimentos/CestaBasica";
import { PriceCeiling } from "@/components/alimentos/PriceCeiling";
import { CostChain } from "@/components/alimentos/CostChain";
import { ClimateBuffer } from "@/components/alimentos/ClimateBuffer";

const TITLE = "Preço dos alimentos";
export const metadata = {
  title: TITLE,
  openGraph: { title: `${TITLE} · Economia, visualizada` },
  twitter: { title: `${TITLE} · Economia, visualizada` },
};

export default function Page() {
  return (
    <>
      <PageHeader n="Capítulo 03" title={TITLE} color={CHAPTER_COLOR.alimentos}>
        O Brasil é uma das maiores potências agrícolas do mundo e, mesmo assim, o preço do arroz, do café e da carne vive dando sustos. A explicação
        está em poucos mecanismos: a demanda por comida quase não reage ao preço, o produtor planta olhando o passado, a cotação vem de fora em dólar e o
        custo atravessa uma cadeia longa até a gôndola. Aqui você mexe em cada um deles. Os modelos são simplificados e educativos, com valores
        aproximados de 2025 — servem para entender o mecanismo, não para prever preços.
      </PageHeader>

      <div id="inelastica">
        <Section
          title="Demanda inelástica: pouca safra, muito preço"
          concepts={["alimentos-elasticidade", "choque-de-oferta", "paradoxo-da-abundancia"]}
          intro="Quando a seca leva 15% da colheita, as pessoas não comem 15% menos — cortam um pouco e pagam bem mais. Arraste a curva de oferta e veja o preço disparar, e a receita do campo, curiosamente, subir."
        >
          <SupplyShock />
        </Section>
      </div>

      <div id="teia">
        <Section
          title="A teia de aranha: plantar olhando o retrovisor"
          concepts={["modelo-teia-de-aranha", "ciclo-do-boi"]}
          intro="Feijão caro este ano? Todo mundo planta feijão — e na próxima safra sobra feijão e o preço desaba. Rode as safras e veja quando o ciclo se acalma e quando ele se amplifica."
        >
          <Cobweb />
        </Section>
      </div>

      <div id="dolar-commodities">
        <Section
          title="Dólar e commodities: a comida tem preço em dólar"
          concepts={["paridade-de-exportacao", "commodities-agricolas"]}
          intro="Soja, milho, café e carne são cotados lá fora. O produtor sempre pode vender para o porto, então o preço aqui dentro gruda na cotação internacional convertida pelo câmbio."
        >
          <CommodityFx />
        </Section>
      </div>

      <div id="cesta-basica">
        <Section
          title="Cesta básica DIEESE × salário mínimo"
          concepts={["cesta-basica-dieese", "salario-minimo-necessario"]}
          intro="O DIEESE pesquisa todo mês o custo de 13 alimentos básicos. A pergunta que importa para uma família é simples: quantas horas de trabalho no salário mínimo pagam a comida do mês?"
        >
          <CestaBasica />
        </Section>
      </div>

      <div id="tabelamento">
        <Section
          title="Tabelamento: o preço baixa, a comida some"
          concepts={["tabelamento-de-precos", "escassez", "peso-morto", "mercado-paralelo"]}
          intro="Congelar o preço abaixo do equilíbrio parece resolver a alta. Mas, a esse preço, mais gente quer comprar e menos gente quer vender. Fixe um teto e deixe os meses passarem."
        >
          <PriceCeiling />
        </Section>
      </div>

      <div id="cadeia">
        <Section
          title="Do campo à gôndola: a cadeia de custos"
          concepts={["cadeia-de-custos", "insumos-dolarizados"]}
          intro="O preço do pacote de arroz não é só o grão. Tem adubo importado, diesel do trator, caminhão até o centro de distribuição, indústria, margem do supermercado e imposto. Mexa em cada elo."
        >
          <CostChain />
        </Section>
      </div>

      <div id="clima-estoques">
        <Section
          title="Choque climático, estoques da Conab e o IPCA"
          concepts={["estoques-reguladores", "custo-de-carregamento", "alimentos-ipca"]}
          intro="Um El Niño não dura um dia: a quebra chega, se espalha por meses e passa. Simule mês a mês o preço com e sem estoque regulador, e veja quanto o choque soma ao IPCA."
        >
          <ClimateBuffer />
          <div className="mt-4">
            <Callout tone="info">
              Choque de alimentos é, em geral, um choque de oferta temporário: subir a Selic não faz chover. O Copom costuma olhar através dele — mas reage
              se a alta contaminar expectativas e outros preços (efeitos de segunda ordem).
            </Callout>
          </div>
        </Section>
      </div>

      <Takeaways
        items={[
          <span key="t1">Demanda inelástica transforma pequenas quebras de safra em grandes altas de preço — e o preço, não a quantidade, faz o ajuste.</span>,
          <span key="t2">No Brasil o preço da comida é, em boa parte, o preço internacional em dólar convertido pelo câmbio: exportar mais não barateia o mercado interno.</span>,
          <span key="t3">Teto de preço não cria comida: troca alta por fila, escassez e mercado paralelo. Estoques e seguro amortecem, mas têm custo e limite.</span>,
        ]}
      />
      <ConceptList chapter={alimentos} />
    </>
  );
}
