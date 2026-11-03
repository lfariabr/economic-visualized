"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Callout, Controls, Panel, Segmented, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { useTicker } from "@/lib/useTicker";
import { REAL_ITEMS, REAL_MONTHS, REAL_START, URV_START, realSim } from "./moedaModel";
import { br, mesAno, pct } from "./num";

const Y0 = 1993;
type Mode = "urv" | "corte";

export function PlanoReal() {
  const [mode, setMode] = useState<Mode>("urv");
  const [t, setT] = useState(10);
  const sims = useMemo(() => ({ urv: realSim("urv"), corte: realSim("corte") }), []);
  const sim = sims[mode];
  const ticker = useTicker(() => setT((x) => Math.min(x + 1, REAL_MONTHS - 1)), { speed: 0.1 });
  const { running, pause } = ticker;
  useEffect(() => {
    if (t >= REAL_MONTHS - 1 && running) pause();
  }, [t, running, pause]);

  const shown = sim.slice(0, t + 1);
  const cur = sim[t];
  const phase =
    mode === "urv"
      ? t < URV_START
        ? "inercia"
        : t < REAL_START
          ? "urv"
          : "real"
      : t < REAL_START
        ? "inercia"
        : t < REAL_START + 4
          ? "congelado"
          : "volta";

  const phaseText: Record<string, string> = {
    inercia:
      "Cada preço é reajustado pela inflação passada, mas em datas diferentes: o salário a cada 2 meses, o aluguel a cada 4, o ônibus a cada 3. Entre reajustes, o valor real derrete. Ninguém quer ficar para trás, e a inflação de ontem vira a de hoje.",
    urv: "Março de 1994: preços, salários e contratos passam a ser cotados em URV, uma unidade de conta corrigida diariamente. Em cruzeiros reais a inflação continua, mas os preços relativos ficam alinhados — todos andam juntos.",
    real: "1º de julho de 1994: 1 URV = R$ 1,00 = CR$ 2.750,00. Como ninguém está “atrasado” no momento da troca, ninguém precisa recuperar perdas — a memória inflacionária é apagada.",
    congelado:
      "Corte de zeros e congelamento, sem URV: a inflação medida vai a zero, mas quem foi congelado logo depois de um reajuste ficou no pico, e quem estava às vésperas do reajuste ficou no vale.",
    volta: "Fim do congelamento: cada um reajusta pela inflação acumulada desde o último aumento — e a inércia volta, como nos planos Cruzado, Bresser e Verão.",
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0 space-y-3">
        <Controls>
          <Segmented<Mode>
            value={mode}
            onChange={setMode}
            options={[
              { value: "urv", label: "Plano Real (com URV)" },
              { value: "corte", label: "Só cortar zeros e congelar" },
            ]}
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => (t >= REAL_MONTHS - 1 ? (setT(0), ticker.play()) : ticker.toggle())}>
              {ticker.running ? "Pausar" : "▶ Rodar"}
            </Button>
            <Button onClick={() => setT((x) => Math.max(0, x - 1))}>◀ mês</Button>
            <Button onClick={() => setT((x) => Math.min(REAL_MONTHS - 1, x + 1))}>mês ▶</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" className="text-xs" onClick={() => setT(URV_START - 1)}>
              1 · inércia
            </Button>
            <Button variant="ghost" className="text-xs" onClick={() => setT(REAL_START - 1)}>
              2 · URV
            </Button>
            <Button variant="ghost" className="text-xs" onClick={() => setT(REAL_START + 6)}>
              3 · Real
            </Button>
          </div>
        </Controls>
        <Panel title="Preço relativo de cada item (100 = média dos preços)" right={<span className="font-mono text-xs text-faint">{mesAno(t, Y0)}</span>}>
          <LineChart
            height={240}
            xDomain={[0, REAL_MONTHS - 1]}
            yDomain={[50, 190]}
            xFormat={(x) => mesAno(x, Y0)}
            yFormat={(x) => br(x, 0)}
            markers={[
              ...(mode === "urv" ? [{ x: URV_START, label: "URV", color: "#60a5fa" }] : []),
              { x: REAL_START, label: mode === "urv" ? "Real" : "congela", color: mode === "urv" ? "#34d399" : "#60a5fa" },
            ]}
            series={REAL_ITEMS.map((it, i) => ({ id: it.id, label: it.label, color: it.color, step: true, points: shown.map((m) => [m.t, m.real[i]] as [number, number]) }))}
          />
        </Panel>
        <Panel title="Inflação mensal">
          <LineChart
            height={160}
            xDomain={[0, REAL_MONTHS - 1]}
            yDomain={[0, 50]}
            xFormat={(x) => mesAno(x, Y0)}
            yFormat={(x) => `${br(x, 0)}%`}
            series={[{ id: "pi", label: "inflação", color: "#f87171", area: true, points: shown.map((m) => [m.t, m.pi]) }]}
            markers={[{ x: REAL_START, color: "#5a6275" }]}
          />
        </Panel>
        <p className="font-mono text-xs text-muted">reajuste: pᵢ ← pᵢ · I₋₁ / I(último reajuste) · índice I = média geométrica dos pᵢ</p>
        <p className="text-xs text-faint">
          Experimente: avance mês a mês em 1993 e veja o serrote dos preços relativos. Depois passe pela URV e pela troca de moeda. Em
          seguida mude para “Só cortar zeros e congelar” e rode até o fim: o serrote e a inflação voltam.
        </p>
      </div>
      <div className="grid content-start gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <Stat label="Inflação do mês" value={`${pct(cur.pi)} a.m.`} tone={cur.pi > 10 ? "bad" : cur.pi > 1.5 ? "warn" : "good"} hint={mesAno(t, Y0)} />
        <Stat label="Instabilidade dos preços relativos" value={pct(cur.dispersion, 0)} hint="quanto os preços relativos mudam no mês" tone={cur.dispersion > 20 ? "bad" : "neutral"} />
        <Stat
          label="Unidade de conta"
          value={mode === "urv" ? (t < URV_START ? "CR$" : t < REAL_START ? "URV" : "R$") : t < REAL_START ? "CR$" : "R$"}
          hint={mode === "urv" && t >= URV_START && t < REAL_START ? "moeda (CR$) e unidade de conta separadas" : undefined}
        />
        <Callout tone={phase === "volta" ? "bad" : phase === "real" ? "ok" : "info"}>{phaseText[phase]}</Callout>
      </div>
    </div>
  );
}
