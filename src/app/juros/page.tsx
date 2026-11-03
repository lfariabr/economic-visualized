import { Callout, PageHeader, Section, Takeaways } from "@/components/ui";
import { ConceptList } from "@/components/ConceptList";
import { CHAPTER_COLOR } from "@/components/shell/nav";
import { juros } from "@/content/juros";
import { CdiInvest } from "@/components/juros/CdiInvest";
import { Compound } from "@/components/juros/Compound";
import { SpreadDecomp } from "@/components/juros/SpreadDecomp";
import { Rotativo } from "@/components/juros/Rotativo";
import { PriceSac } from "@/components/juros/PriceSac";
import { YieldCurve } from "@/components/juros/YieldCurve";
import { MarkToMarket } from "@/components/juros/MarkToMarket";
import { CreditoFeedback } from "@/components/juros/CreditoFeedback";

const TITLE = "CDI, juros & crédito";
export const metadata = {
  title: TITLE,
  openGraph: { title: `${TITLE} · Economia, visualizada` },
  twitter: { title: `${TITLE} · Economia, visualizada` },
};

export default function Page() {
  return (
    <>
      <PageHeader n="Capítulo 05" title={TITLE} color={CHAPTER_COLOR.juros}>
        O Copom decide uma taxa — a Selic — mas ninguém na rua paga ou recebe exatamente a Selic. Ela vira CDI no mercado
        interbancário, vira rendimento de CDB, LCI e Tesouro depois do imposto, e vira juro de cartão, cheque especial e
        financiamento depois de passar por inadimplência, custos, impostos e margem dos bancos. Neste capítulo você mexe
        em cada elo dessa cadeia. Os valores padrão são aproximados para o Brasil de 2025/2026 e os modelos são
        simplificados, para fins didáticos — não são recomendação de investimento.
      </PageHeader>

      <div id="investimentos">
        <Section
          title="Da Selic ao CDI: quanto rende cada aplicação"
          concepts={["cdi", "percentual-do-cdi", "ir-regressivo", "regra-da-poupanca", "tesouro-direto-titulos"]}
          intro={
            <>
              O CDI acompanha a Selic quase sem diferença, e a renda fixa privada paga um percentual dele. O que separa as
              aplicações é o imposto (que cai com o prazo), a isenção de LCI/LCA e poupança, e a regra própria da
              poupança. Compare o valor <em>líquido</em> e o juro <em>real</em>, descontada a inflação.
            </>
          }
        >
          <CdiInvest />
        </Section>
      </div>

      <div id="compostos">
        <Section
          title="Juros compostos: o mesmo motor para riqueza e para dívida"
          concepts={["juros-compostos", "taxa-equivalente"]}
          intro="Juros sobre juros transformam diferenças pequenas na taxa mensal em diferenças gigantes ao longo do tempo. Converter taxa mensal em anual exige potência, não multiplicação."
        >
          <Compound />
        </Section>
      </div>

      <div id="spread">
        <Section
          title="Decompondo o spread bancário"
          concepts={["spread-bancario", "juros-compulsorio"]}
          intro="Por que o crédito no Brasil custa tanto mesmo quando a Selic cai? A taxa ao tomador precisa cobrir captação, calotes esperados, compulsório, custos de operação e impostos antes de sobrar margem. Mexa em cada componente."
        >
          <SpreadDecomp />
          <div className="mt-4">
            <Callout tone="info">
              O componente que mais pesa no spread brasileiro, segundo o BCB, é a inadimplência — ligada a garantias
              fracas, recuperação lenta de crédito na Justiça e pouca informação sobre o tomador. Medidas como Cadastro
              Positivo, duplicata eletrônica e o Marco das Garantias atacam essa fatia, não a Selic.
            </Callout>
          </div>
        </Section>
      </div>

      <div id="rotativo">
        <Section
          title="Rotativo, cheque especial e consignado: a bola de neve"
          concepts={["rotativo-cartao", "cheque-especial", "consignado"]}
          intro="A mesma dívida, mês a mês, em três linhas de crédito. O rotativo do cartão cobra centenas de por cento ao ano; o consignado, com desconto em folha, cobra uma fração disso. Veja a armadilha do pagamento mínimo e o efeito do teto de 2024."
        >
          <Rotativo />
        </Section>
      </div>

      <div id="price-sac">
        <Section
          title="Financiamento imobiliário: Tabela Price × SAC"
          concepts={["tabela-price", "sac"]}
          intro="Mesmo valor, mesma taxa, mesmo prazo — e juros totais bem diferentes. No Price a parcela é fixa; no SAC a amortização é fixa e a parcela começa alta e cai."
        >
          <PriceSac />
        </Section>
      </div>

      <div id="curva">
        <Section
          title="A curva de juros: o que o mercado espera da Selic"
          concepts={["curva-de-juros-ettj", "premio-de-risco-fiscal"]}
          intro="Cada prazo tem sua taxa. Num modelo simples, a taxa de um vértice é a média da Selic esperada até lá mais um prêmio que cresce com o prazo. Expectativa de cortes inverte a curva; risco fiscal a inclina."
        >
          <YieldCurve />
        </Section>
      </div>

      <div id="marcacao">
        <Section
          title="Marcação a mercado: quando o juro sobe, o título cai"
          concepts={["marcacao-a-mercado", "juros-duration"]}
          intro="Um Tesouro Prefixado promete R$ 1.000 no vencimento. Se a taxa de mercado sobe, esse fluxo fixo vale menos hoje. Quanto mais longo o título (maior a duration), maior a oscilação."
        >
          <MarkToMarket />
        </Section>
      </div>

      <div id="inadimplencia">
        <Section
          title="Crédito e inadimplência: o ciclo que se realimenta"
          concepts={["juros-inadimplencia", "selecao-adversa"]}
          intro="Quando a Selic sobe, as parcelas pesam mais na renda, a inadimplência cresce com defasagem e os bancos repassam o risco ao spread — o que encarece ainda mais o crédito. O tamanho do repasse decide se o ciclo se acalma ou vira espiral."
        >
          <CreditoFeedback />
        </Section>
      </div>

      <Takeaways
        items={[
          <span key="t1">
            O que importa numa aplicação é o rendimento <strong>líquido e real</strong>: imposto, isenção, prazo e
            inflação mudam o ranking — e com Selic alta a poupança fica bem atrás do CDI.
          </span>,
          <span key="t2">
            A Selic é só uma fatia do juro do crédito. Inadimplência, custos e impostos formam o spread, por isso
            juros de cartão e cheque especial continuam altíssimos mesmo com Selic baixa.
          </span>,
          <span key="t3">
            Juros compostos trabalham a favor de quem aplica e contra quem deve; prazo longo amplia tudo — juros do
            financiamento e oscilação de preço dos títulos prefixados e IPCA+.
          </span>,
        ]}
      />
      <ConceptList chapter={juros} />
    </>
  );
}
