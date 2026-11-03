"use client";

import { useMemo, useState } from "react";
import { LineChart } from "@/components/viz/Chart";
import { Callout, Controls, Panel, Segmented, Slider, Stat } from "@/components/ui";
import { br, pct, signed } from "./num";
import { arrecadacaoPotencial, DEFAULT_CONTROLS, QUARTERS, quarterYear, runScenario } from "./simuladorModel";

/** Debt ↔ risk ↔ rates feedback loop: same fiscal policy with the loop on and off. */
export function CicloVicioso() {
  const [gasto, setGasto] = useState(33.5);
  const [elo, setElo] = useState<"on" | "off">("on");
  const runs = useMemo(() => {
    const c = { ...DEFAULT_CONTROLS, gasto };
    return {
      on: runScenario(c, { opts: { feedback: 1 } }).states,
      off: runScenario(c, { opts: { feedback: 0 } }).states,
    };
  }, [gasto]);
  const main = elo === "on" ? runs.on : runs.off;
  const lastOn = runs.on[QUARTERS];
  const lastOff = runs.off[QUARTERS];
  const last = main[QUARTERS];
  const primario0 = arrecadacaoPotencial(DEFAULT_CONTROLS.carga) - gasto;
  const x = (t: number) => quarterYear(t);
  const yMax = Math.max(100, ...runs.on.map((s) => s.divida), ...runs.off.map((s) => s.divida)) + 5;

  return (
    <div className="space-y-3">
      <Controls>
        <Slider
          label="Gasto primário"
          value={gasto}
          min={30}
          max={37}
          step={0.1}
          onChange={setGasto}
          format={(v) => `${br(v)}%`}
          className="min-w-[260px] flex-1"
        />
        <div className="flex items-center gap-2 text-xs text-muted">
          elo dívida → risco → juros
          <Segmented
            value={elo}
            options={[
              { value: "on", label: "ligado" },
              { value: "off", label: "desligado" },
            ]}
            onChange={setElo}
          />
        </div>
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <Panel title="Dívida bruta (% do PIB) e risco-país">
          <LineChart
            series={[
              { id: "on", label: "com o ciclo vicioso", color: "#fb7185", points: runs.on.map((s) => [x(s.t), s.divida]), width: elo === "on" ? 2.5 : 1.5 },
              { id: "off", label: "sem o elo (risco fixo)", color: "#8a93a8", dashed: true, points: runs.off.map((s) => [x(s.t), s.divida]) },
              { id: "risco", label: "risco-país ÷ 5 (com elo)", color: "#a78bfa", points: runs.on.map((s) => [x(s.t), s.risco / 5]), width: 1.5 },
            ]}
            xDomain={[x(0), x(QUARTERS)]}
            yDomain={[0, yMax]}
            height={260}
            xFormat={(v) => String(Math.round(v))}
            yFormat={(v) => br(v, 0)}
            hMarkers={[{ y: 90, label: "90% do PIB", color: "#f87171" }]}
          />
          <div className="mt-2 font-mono text-[11px] text-faint">
            dₜ₊₁ = dₜ·(1+i)/(1+g) − primário · risco = f(dívida, primário) · i = f(Selic, risco) · Selic = r*(risco) + …
          </div>
        </Panel>
        <div className="grid content-start gap-2">
          <Stat label="Primário inicial" value={`${signed(primario0)}% PIB`} tone={primario0 >= 1.2 ? "good" : primario0 < 0 ? "bad" : "warn"} />
          <Stat label="Dívida em 2035" value={pct(last.divida)} tone={last.divida > 90 ? "bad" : "good"} hint={elo === "on" ? "com o ciclo" : "sem o ciclo"} />
          <Stat
            label="Contribuição do ciclo"
            value={`${signed(lastOn.divida - lastOff.divida)} p.p.`}
            tone={lastOn.divida - lastOff.divida > 5 ? "bad" : "neutral"}
            hint="dívida a mais por causa do risco"
          />
          <Stat label="Selic em 2035" value={pct(last.selic, 2)} hint={`risco ${br(last.risco, 0)} pts`} />
        </div>
      </div>
      {lastOn.divida - lastOff.divida > 8 && (
        <Callout tone="bad">
          O medo vira realidade: dívida alta → risco-país sobe → juros da dívida e Selic neutra sobem → dívida cresce mais rápido. A mesma
          política fiscal termina {br(lastOn.divida - lastOff.divida, 0)} p.p. do PIB pior só por causa do elo.
        </Callout>
      )}
      <p className="text-xs text-faint">
        Experimente: com o gasto em 33,5% (déficit), alterne o elo e veja a distância entre as linhas; depois baixe o gasto para ~31,5% (primário
        perto de 1,5%) e veja as duas curvas se estabilizarem juntas.
      </p>
    </div>
  );
}
