import { Callout, PageHeader, Section, Takeaways } from "@/components/ui";
import { ConceptList } from "@/components/ConceptList";
import { CHAPTER_COLOR } from "@/components/shell/nav";
import { laffer } from "@/content/laffer";
import { LafferCurve } from "@/components/laffer/LafferCurve";
import { BaseAgents } from "@/components/laffer/BaseAgents";
import { DeadweightLoss } from "@/components/laffer/DeadweightLoss";
import { TaxMix } from "@/components/laffer/TaxMix";
import { Regressivity } from "@/components/laffer/Regressivity";
import { CascadeVat, ReferenceRate } from "@/components/laffer/CascadeVat";
import { DynamicLaffer } from "@/components/laffer/DynamicLaffer";
import { IncomeTaxExemption } from "@/components/laffer/IncomeTaxExemption";

const TITLE = "Curva de Laffer & impostos";
export const metadata = {
  title: TITLE,
  openGraph: { title: `${TITLE} · Economia, visualizada` },
  twitter: { title: `${TITLE} · Economia, visualizada` },
};

export default function Page() {
  return (
    <>
      <PageHeader n="Capítulo 08" title={TITLE} color={CHAPTER_COLOR.laffer}>
        Todo imposto tem duas partes: a alíquota, que o governo escolhe, e a base, que reage. Quando a alíquota sobe, parte das
        pessoas trabalha menos, vai para a informalidade ou sonega — e a arrecadação deixa de subir na mesma proporção. Neste
        capítulo você move alíquotas e elasticidades e vê onde a curva de Laffer faz sentido (e onde não faz), por que impostos
        altos destroem valor, por que o sistema brasileiro pesa mais sobre os pobres e o que a Reforma Tributária muda. Os
        modelos são simplificados e os números, valores aproximados.
      </PageHeader>

      <div id="curva">
        <Section
          title="A curva de Laffer"
          concepts={["curva-de-laffer", "laffer-elasticidade-base", "lado-proibitivo"]}
          intro="Arrecadação é alíquota vezes base. Se a base encolhe quando a alíquota sobe, existe um pico. A posição desse pico depende inteiramente de quão sensível é a base — a elasticidade ε."
        >
          <LafferCurve />
        </Section>
      </div>

      <div id="base">
        <Section
          title="A base tributária reage"
          concepts={["informalidade", "sonegacao"]}
          intro="Por trás da curva há pessoas. Cada trabalhador desta população compara quatro opções — trabalhar formalmente e pagar, ir para a informalidade, sonegar ou não trabalhar — e escolhe a melhor para si. Ninguém desenhou a curva de Laffer: ela emerge."
        >
          <BaseAgents />
        </Section>
      </div>

      <div id="triangulo">
        <Section
          title="Peso morto: o custo que ninguém recebe"
          concepts={["peso-morto-harberger", "incidencia-tributaria"]}
          intro="Um imposto cria uma cunha entre o que o consumidor paga e o que o produtor recebe. A arrecadação é transferida ao governo; o triângulo de Harberger simplesmente desaparece."
        >
          <DeadweightLoss />
        </Section>
      </div>

      <div id="carga">
        <Section
          title="Carga tributária brasileira: tamanho e mix"
          concepts={["carga-tributaria", "tributos-sobre-consumo"]}
          intro="O Brasil arrecada cerca de 33% do PIB, perto da média da OCDE. A diferença está em o quê se tributa: muito consumo e folha, relativamente pouca renda e patrimônio."
        >
          <TaxMix />
        </Section>
      </div>

      <div id="incidencia">
        <Section
          title="Regressividade: quem paga, em % da renda"
          concepts={["regressividade", "cashback-tributario"]}
          intro="Uma alíquota igual sobre tudo o que se consome vira uma alíquota desigual sobre a renda. Compare duas formas de aliviar os pobres: isentar a cesta básica ou devolver imposto via cashback."
        >
          <Regressivity />
        </Section>
      </div>

      <div id="cascata">
        <Section
          title="Cascata × IVA e a alíquota de referência"
          concepts={["cumulatividade", "iva", "reforma-tributaria", "aliquota-de-referencia"]}
          intro="Um produto passa por várias empresas até chegar ao consumidor. Num imposto cumulativo, cada etapa paga imposto sobre o imposto anterior; num IVA, cada uma abate o que já foi pago. A Reforma Tributária (EC 132/2023) troca cinco tributos por CBS + IBS — mas cada exceção tem um preço."
        >
          <div className="space-y-6">
            <CascadeVat />
            <ReferenceRate />
          </div>
        </Section>
      </div>

      <div id="dinamica">
        <Section
          title="Laffer dinâmica: o curto prazo engana"
          concepts={["laffer-dinamica"]}
          intro="Logo após um aumento de alíquota, quase ninguém muda de comportamento e a receita sobe. Com o tempo, contratos são refeitos, empresas mudam de regime, capital migra. A elasticidade de longo prazo é bem maior que a de curto."
        >
          <DynamicLaffer />
        </Section>
      </div>

      <div id="isencao-ir">
        <Section
          title="Isenção do IR até R$ 5 mil e a compensação"
          concepts={["isencao-ir-5-mil", "tabela-progressiva", "imposto-minimo-alta-renda"]}
          intro="Em 2026 passou a valer a isenção de IR para rendas de até R$ 5 mil por mês, com redução parcial até R$ 7.350, financiada por um imposto mínimo sobre rendas acima de R$ 600 mil por ano. Calcule o seu IR e a conta do governo."
        >
          <div className="space-y-4">
            <IncomeTaxExemption />
            <Callout tone="accent">
              Política tributária é sempre uma troca: arrecadar mais, distorcer menos e distribuir melhor raramente andam juntos.
              Os modelos ajudam a ver o preço de cada escolha, não a escolher por você.
            </Callout>
          </div>
        </Section>
      </div>

      <Takeaways
        items={[
          <span key="t1">A curva de Laffer é verdadeira em princípio, mas o pico depende da elasticidade da base. Cortes “que se pagam” só existem no lado proibitivo.</span>,
          <span key="t2">O peso morto cresce com o quadrado da alíquota, e a base reage mais no longo prazo: bases largas e alíquotas baixas distorcem menos.</span>,
          <span key="t3">No Brasil o problema é mais o desenho que o tamanho: muito imposto sobre consumo, cumulatividade e exceções que elevam a alíquota de todos.</span>,
        ]}
      />
      <ConceptList chapter={laffer} />
    </>
  );
}
