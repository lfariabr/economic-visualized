import { Callout, PageHeader, Section, Takeaways } from "@/components/ui";
import { ConceptList } from "@/components/ConceptList";
import { CHAPTER_COLOR } from "@/components/shell/nav";
import { programas } from "@/content/programas";
import { BolsaFamiliaSim } from "@/components/programas/BolsaFamiliaSim";
import { Focalizacao } from "@/components/programas/Focalizacao";
import { ValeGas } from "@/components/programas/ValeGas";
import { Multiplicador } from "@/components/programas/Multiplicador";
import { BolsaEmpresario } from "@/components/programas/BolsaEmpresario";
import { CreditoSubsidiado } from "@/components/programas/CreditoSubsidiado";
import { SubsidioPreco } from "@/components/programas/SubsidioPreco";
import { Alocador } from "@/components/programas/Alocador";

const TITLE = "Programas sociais & subsídios";
export const metadata = {
  title: TITLE,
  openGraph: { title: `${TITLE} · Economia, visualizada` },
  twitter: { title: `${TITLE} · Economia, visualizada` },
};

export default function Page() {
  return (
    <>
      <PageHeader n="Capítulo 14" title={TITLE} color={CHAPTER_COLOR.programas}>
        O Estado transfere renda o tempo todo: para famílias pobres, pelo Bolsa Família e pelo vale-gás, e para empresas e
        setores, por isenções, regimes especiais e crédito barato. Neste capítulo os dois lados passam pelo mesmo teste: quanto
        custa, quem recebe de fato, que incentivos cria e o que se compraria com o mesmo dinheiro. Você vai montar uma família e
        ver o degrau da pobreza, calibrar a fiscalização do CadÚnico, cortar gastos tributários e distribuir R$ 100 bi. Modelos
        simplificados, valores aproximados.
      </PageHeader>

      <div id="simulador-bf">
        <Section
          title="Bolsa Família: simulador de benefício e o degrau"
          concepts={["bolsa-familia", "programas-beneficio-primeira-infancia", "regra-de-protecao", "armadilha-da-pobreza", "programas-taxa-marginal-efetiva", "programas-taxa-de-retirada"]}
          intro="Monte uma família e informe a renda do trabalho. O gráfico mostra a renda total em cada nível de renda do trabalho. Onde a curva cai, ganhar mais faz a família ficar com menos — a taxa marginal efetiva passa de 100%."
        >
          <div className="space-y-4">
            <BolsaFamiliaSim />
            <Callout tone="info">
              Não existe desenho sem custo. Corte seco é barato e simples, mas pune quem consegue um emprego. Retirada gradual
              resolve o incentivo, mas estende o benefício para famílias bem acima da linha. A regra de proteção é um meio-termo:
              degraus menores, por tempo limitado. Em 2025 ela foi encurtada e ganhou teto fixo (aprox.); aqui usamos meio salário
              mínimo.
            </Callout>
          </div>
        </Section>
      </div>

      <div id="foco">
        <Section
          title="Foco × cobertura: os dois erros do CadÚnico"
          concepts={["cadunico", "focalizacao", "programas-erros-de-focalizacao"]}
          intro="A renda no CadÚnico é em grande parte autodeclarada. Fiscalizar mais pega quem subdeclara, mas custa dinheiro e afasta famílias pobres que não conseguem cumprir as exigências. Cada quadrado é um domicílio."
        >
          <Focalizacao />
        </Section>
      </div>

      <div id="vale-gas">
        <Section
          title="Vale-gás: dinheiro, botijão ou preço menor para todos?"
          concepts={["auxilio-gas", "programas-especie-vs-dinheiro"]}
          intro="O botijão de 13 kg custa por volta de R$ 100–110 e pesa muito no orçamento dos mais pobres. Há três formas de ajudar: dar dinheiro, dar o botijão ou baratear o gás para todo mundo. Mesmo orçamento, resultados muito diferentes."
        >
          <ValeGas />
        </Section>
      </div>

      <div id="multiplicador">
        <Section
          title="Multiplicador: o que R$ 1 vira no PIB"
          concepts={["programas-multiplicador-transferencias"]}
          intro="Cada real gasto pelo governo vira renda de alguém, que gasta parte dela, que vira renda de outro… O tamanho dessa cadeia depende de quem recebe primeiro."
        >
          <Multiplicador />
        </Section>
      </div>

      <div id="empresas">
        <Section
          title="“Bolsa empresário”: gastos tributários e subsídios a empresas"
          concepts={["gastos-tributarios", "bolsa-empresario", "programas-simples-nacional", "zona-franca-de-manaus", "programas-desoneracao-folha"]}
          intro="A União deixa de arrecadar cerca de R$ 540 bi por ano em isenções e regimes especiais — mais de três vezes o Bolsa Família. Parte vai para pessoas físicas e entidades; a maior parte, para empresas e setores. Corte o que quiser e veja o que isso compra."
        >
          <BolsaEmpresario />
        </Section>
      </div>

      <div id="credito">
        <Section
          title="Crédito subsidiado: BNDES, TJLP e TLP"
          concepts={["tjlp-tlp", "programas-adicionalidade"]}
          intro="Entre 2009 e 2014 o Tesouro emprestou mais de R$ 400 bi ao BNDES. Ele captava pagando perto da Selic e o banco emprestava à TJLP, bem mais baixa. A diferença é um subsídio que não aparecia como despesa — e a pergunta é se ele gerou investimento que não existiria de outra forma."
        >
          <CreditoSubsidiado />
        </Section>
      </div>

      <div id="preco">
        <Section
          title="Subsídio a preço: combustível mais barato para quem?"
          concepts={["programas-subsidio-ao-preco"]}
          intro="Cortar imposto sobre gasolina ou diesel baixa o preço para todo mundo. Mas quem consome mais combustível ganha mais. Compare com uma transferência focalizada do mesmo custo."
        >
          <SubsidioPreco />
        </Section>
      </div>

      <div id="alocador">
        <Section
          title="Comparador: onde colocar R$ 100 bi?"
          concepts={["focalizacao", "programas-multiplicador-transferencias", "bolsa-empresario"]}
          intro="Você tem R$ 100 bi extras. Distribua entre programas sociais, apoio a empresas, investimento e abatimento da dívida, e veja os efeitos sobre pobreza, PIB, dívida e desigualdade. Não há alocação que vença em tudo."
        >
          <Alocador />
        </Section>
      </div>

      <Takeaways
        items={[
          <span key="t1">Todo programa de renda enfrenta a mesma troca entre valor do benefício, incentivo a trabalhar e custo. Corte abrupto cria armadilha; retirada lenta amplia o programa.</span>,
          <span key="t2">Subsídio geral de preço e crédito barato espalham o dinheiro por quem consome ou investe mais; transferências focalizadas chegam mais aos pobres, mas pagam com erros de inclusão e exclusão.</span>,
          <span key="t3">Gastos tributários custam tanto quanto despesas, mas são menos vistos e menos avaliados. A mesma régua — custo, quem recebe, resultado — deveria valer para o Bolsa Família e para o “bolsa empresário”.</span>,
        ]}
      />
      <ConceptList chapter={programas} />
    </>
  );
}
