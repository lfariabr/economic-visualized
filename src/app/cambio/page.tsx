import { PageHeader, Section, Takeaways } from "@/components/ui";
import { ConceptList } from "@/components/ConceptList";
import { CHAPTER_COLOR } from "@/components/shell/nav";
import { cambio } from "@/content/cambio";
import { FxMarket } from "@/components/cambio/FxMarket";
import { CarryTrade } from "@/components/cambio/CarryTrade";
import { PassThrough } from "@/components/cambio/PassThrough";
import { BigMacPPP } from "@/components/cambio/BigMacPPP";
import { SpeculativeAttack } from "@/components/cambio/SpeculativeAttack";
import { JCurve } from "@/components/cambio/JCurve";
import { TermsOfTrade } from "@/components/cambio/TermsOfTrade";
import { WinnersLosers } from "@/components/cambio/WinnersLosers";

const TITLE = "Dólar & câmbio";
export const metadata = {
  title: TITLE,
  openGraph: { title: `${TITLE} · Economia, visualizada` },
  twitter: { title: `${TITLE} · Economia, visualizada` },
};

export default function Page() {
  return (
    <>
      <PageHeader n="Capítulo 07" title={TITLE} color={CHAPTER_COLOR.cambio}>
        Desde 1999 o Brasil tem câmbio flutuante: o dólar é um preço que sobe e desce com quem traz e quem leva moeda estrangeira. Neste capítulo você vê
        de onde vêm esses fluxos, por que juros e risco-país mexem tanto com eles, como a alta do dólar chega ao IPCA, por que o câmbio fixo quebrou em
        1999 e quem ganha ou perde com cada cotação. Os modelos são simplificados e educativos, com valores aproximados de 2025–26 (dólar ≈ R$ 5,40,
        Selic ≈ 15%, reservas ≈ US$ 340 bi) — mostram mecanismos, não preveem o dólar.
      </PageHeader>

      <div id="mercado-cambio">
        <Section
          title="O mercado de câmbio: quem traz e quem leva dólares"
          concepts={["taxa-de-cambio", "cambio-oferta-demanda"]}
          intro="Todo dólar vendido por alguém é comprado por outro. Exportador e investidor estrangeiro vendem dólares; importador, turista e empresa que remete lucros compram. O câmbio é o preço que fecha essa conta."
        >
          <FxMarket />
        </Section>
      </div>

      <div id="carry-trade">
        <Section
          title="Juros, risco-país e carry trade"
          concepts={["paridade-descoberta-de-juros", "carry-trade", "risco-pais", "dolar-futuro"]}
          intro="Por que o dólar cai quando o Copom sobe a Selic e dispara quando o mercado duvida das contas públicas? Porque o capital estrangeiro compara o juro daqui com o de lá, descontado o risco. Mexa nos três e veja o dinheiro atravessar."
        >
          <CarryTrade />
        </Section>
      </div>

      <div id="repasse">
        <Section
          title="Repasse cambial: do dólar ao IPCA"
          concepts={["repasse-cambial", "bens-comercializaveis"]}
          intro="Uma alta do dólar não chega ao IPCA de uma vez. Passa primeiro pelos bens comercializáveis, com defasagem, e pode ganhar inércia. Simule mês a mês e veja se o IPCA fura o teto da meta."
        >
          <PassThrough />
        </Section>
      </div>

      <div id="ppc">
        <Section
          title="Paridade do poder de compra e o Índice Big Mac"
          concepts={["cambio-ppc", "indice-big-mac"]}
          intro="Se um Big Mac custa R$ 23,90 aqui e US$ 5,79 lá, o câmbio que iguala os dois é cerca de R$ 4,13. Compare com o dólar de mercado e veja se o real está “barato” ou “caro”."
        >
          <BigMacPPP />
        </Section>
      </div>

      <div id="ataque">
        <Section
          title="Reservas, ataque especulativo e o fim da âncora (1999)"
          concepts={["reservas-internacionais", "ataque-especulativo", "cambio-fixo-flutuante", "swap-cambial"]}
          intro="De 1994 a 1999 o real tinha câmbio quase fixo. Após as crises da Ásia e da Rússia, o capital fugiu, as reservas sangraram e a âncora quebrou em janeiro de 1999. Compare com hoje: câmbio flutuante, reservas de US$ 340 bi e swaps cambiais."
        >
          <SpeculativeAttack />
        </Section>
      </div>

      <div id="curva-j">
        <Section
          title="Balança comercial e a curva J"
          concepts={["curva-j", "marshall-lerner"]}
          intro="Uma desvalorização deveria melhorar o saldo comercial. Mas no começo os contratos já estão fechados: o país vende o mesmo volume mais barato e o saldo piora. Ande trimestre a trimestre."
        >
          <JCurve />
        </Section>
      </div>

      <div id="termos-de-troca">
        <Section
          title="Termos de troca e doença holandesa"
          concepts={["termos-de-troca", "doenca-holandesa"]}
          intro="Entre 2003 e 2011 soja e minério ficaram caríssimos, o real se valorizou e o dólar chegou a R$ 1,55. Bom para o consumidor, duro para a indústria. Rode os anos."
        >
          <TermsOfTrade />
        </Section>
      </div>

      <div id="ganhadores">
        <Section
          title="Exportador, importador, turista: quem ganha com o dólar?"
          concepts={["cambio-ganhadores-perdedores"]}
          intro="O mesmo número na tela do jornal é notícia boa para uns e ruim para outros. Arraste o dólar e veja quem comemora."
        >
          <WinnersLosers />
        </Section>
      </div>

      <Takeaways
        items={[
          <span key="t1">O câmbio flutuante é um preço que fecha a conta entre quem traz e quem leva dólares — e os fluxos de capital, sensíveis a juros e risco, mandam no curto prazo.</span>,
          <span key="t2">Dólar alto vira inflação com defasagem via comercializáveis; quanto mais ancoradas as expectativas, menor o repasse e menor o trabalho do Copom.</span>,
          <span key="t3">Câmbio fixo sem reservas é aposta de mão única contra o BC; câmbio flutuante com reservas grandes transforma ataques em desvalorização, não em colapso.</span>,
        ]}
      />
      <ConceptList chapter={cambio} />
    </>
  );
}
