import { Callout, PageHeader, Section, Takeaways } from "@/components/ui";
import { ConceptList } from "@/components/ConceptList";
import { CHAPTER_COLOR } from "@/components/shell/nav";
import { selic } from "@/content/selic";
import { CopomGame } from "@/components/selic/CopomGame";
import { TaylorRule } from "@/components/selic/TaylorRule";
import { PolicyLags } from "@/components/selic/PolicyLags";
import { TransmissionChannels } from "@/components/selic/TransmissionChannels";
import { RealRate } from "@/components/selic/RealRate";
import { Credibility } from "@/components/selic/Credibility";
import { FiscalDominance } from "@/components/selic/FiscalDominance";

const TITLE = "Selic & Copom";
export const metadata = {
  title: TITLE,
  openGraph: { title: `${TITLE} · Economia, visualizada` },
  twitter: { title: `${TITLE} · Economia, visualizada` },
};

export default function Page() {
  return (
    <>
      <PageHeader n="Capítulo 04" title={TITLE} color={CHAPTER_COLOR.selic}>
        A cada 45 dias o Copom decide a Selic, o juro básico da economia. O objetivo é um só: levar o IPCA para a meta de 3%. O
        problema é que o juro age devagar, por vários canais ao mesmo tempo, e depende do que as pessoas esperam que o BC faça. Neste
        capítulo você senta na cadeira do Copom, testa a regra de Taylor e vê quando subir o juro funciona — e quando sai pela
        culatra. Os modelos são simplificados e os valores, aproximados (Brasil 2025/2026): servem para mostrar mecanismos, não para
        prever.
      </PageHeader>

      <div id="copom">
        <Section
          title="Você é o Copom"
          concepts={["selic-copom", "selic-meta-inflacao", "selic-hiato", "selic-curva-is"]}
          intro={
            <>
              Começamos em 2026 com Selic de 15%, IPCA acima da meta e economia ainda aquecida. Cada rodada é um trimestre: você escolhe
              a Selic, a economia responde com defasagem e choques aleatórios (petróleo, seca, crise de confiança) aparecem no caminho.
              O placar pune inflação longe da meta <em>e</em> hiato do produto — recessão também conta.
            </>
          }
        >
          <CopomGame />
        </Section>
      </div>

      <div id="taylor">
        <Section
          title="A regra de Taylor"
          concepts={["selic-taylor", "principio-de-taylor", "selic-juro-neutro"]}
          intro={
            <>
              Uma régua simples para a Selic: juro neutro, mais a inflação, mais uma reação ao desvio da meta e ao hiato. O detalhe
              crucial é o coeficiente total φ sobre a inflação — se for menor que 1, a regra desestabiliza em vez de estabilizar.
            </>
          }
        >
          <TaylorRule />
        </Section>
      </div>

      <div id="defasagens">
        <Section
          title="Defasagens: o juro de hoje é a inflação de daqui a um ano"
          concepts={["defasagens-monetarias"]}
          intro={
            <>
              Um aumento da Selic encarece o crédito em semanas, freia a atividade em alguns meses e só atinge o pico de efeito na
              inflação entre 6 e 18 meses depois. Um BC que olha só o retrovisor reage tarde e exagera.
            </>
          }
        >
          <PolicyLags />
        </Section>
      </div>

      <div id="transmissao">
        <Section
          title="Canais de transmissão"
          concepts={["selic-canais-de-transmissao", "selic-credito-direcionado", "selic-repasse-cambial"]}
          intro={
            <>
              A Selic não muda preços diretamente. Ela passa pelo crédito, pelo câmbio, pelo preço de ações e imóveis e pelas
              expectativas. Cada canal tem uma potência — e no Brasil alguns deles são parcialmente bloqueados.
            </>
          }
        >
          <TransmissionChannels />
        </Section>
      </div>

      <div id="juro-real">
        <Section
          title="Juro real ex-ante: por que o do Brasil é tão alto"
          concepts={["selic-juro-real", "selic-juro-neutro"]}
          intro={
            <>
              O que pesa nas decisões é o juro descontado da inflação esperada pelo Focus. Com Selic de 15% e expectativa de 4,5%, o
              juro real passa de 10% — entre os maiores do mundo. Parte disso é aperto deliberado; parte é um juro neutro elevado.
            </>
          }
        >
          <RealRate />
        </Section>
      </div>

      <div id="credibilidade">
        <Section
          title="Credibilidade e expectativas desancoradas"
          concepts={["selic-credibilidade", "selic-focus", "selic-desancoragem"]}
          intro={
            <>
              A mesma regra de juros produz desinflações muito diferentes dependendo de quanto o mercado acredita na meta. Quando o
              Focus se solta, o BC precisa de mais juro e mais recessão para chegar ao mesmo lugar.
            </>
          }
        >
          <Credibility />
        </Section>
      </div>

      <div id="dominancia">
        <Section
          title="Dominância fiscal: quando subir o juro piora a inflação"
          concepts={["selic-dominancia-fiscal", "selic-premio-de-risco"]}
          intro={
            <>
              Com dívida alta e boa parte dela atrelada à Selic, cada aumento de juro aumenta o custo da dívida. Se o mercado passa a
              duvidar da solvência, o prêmio de risco sobe mais que o próprio juro, o real se deprecia e a inflação sobe. Compare os
              dois regimes.
            </>
          }
        >
          <div className="space-y-4">
            <FiscalDominance />
            <Callout tone="info">
              É um debate real: em 2002–03 e de novo em 2015 e no fim de 2024, parte dos economistas argumentou que o Brasil estava
              perto desse regime. A maioria das estimativas indica que a Selic ainda funciona, mas com potência menor quando o risco
              fiscal sobe.
            </Callout>
          </div>
        </Section>
      </div>

      <Takeaways
        items={[
          <span key="t1">
            A Selic age com <b>defasagem</b> de 6 a 18 meses. Decidir olhando a inflação de hoje leva a apertar e afrouxar demais; o
            Copom precisa mirar projeções.
          </span>,
          <span key="t2">
            O que importa é o <b>juro real</b> contra o <b>juro neutro</b>, e a regra só estabiliza se o juro subir mais que a
            inflação (princípio de Taylor).
          </span>,
          <span key="t3">
            A potência do juro depende de <b>credibilidade</b>, dos canais de transmissão e das contas públicas. Sem âncora fiscal, o
            aperto monetário pode sair pela culatra.
          </span>,
        ]}
      />
      <ConceptList chapter={selic} />
    </>
  );
}
