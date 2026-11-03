"use client";

import { LineChart } from "@/components/viz/Chart";
import { Button, Controls, Panel, Slider } from "@/components/ui";
import { br, pct } from "./num";
import { metric, MetricStat } from "./dashboard";
import { DEFAULT_CONTROLS, QUARTERS, quarterLabel, quarterYear, TETO } from "./simuladorModel";
import { useSimulador } from "./useSimulador";

const SHOWN = ["ipca", "pib", "desemprego", "divida"].map(metric);

/** Compact version of the Simulador Brasil for the home page. */
export function MiniSimulador() {
  const sim = useSimulador(DEFAULT_CONTROLS, { speed: 0.15 });
  const { controls: c, current: s, states } = sim;
  const x = (t: number) => quarterYear(t);
  const lastEvent = sim.events[sim.events.length - 1];

  return (
    <Panel
      title="Você é o governo e o Banco Central"
      right={<span className="font-mono text-xs text-faint">{quarterLabel(s.t)}</span>}
    >
      <div className="space-y-3">
        <Controls className="!px-3 !py-2">
          <Slider
            label={c.taylor ? "Selic (auto)" : "Selic"}
            value={c.taylor ? s.selic : c.selic}
            min={2}
            max={26}
            step={0.25}
            onChange={(v) => sim.setControls({ taylor: false, selic: v })}
            format={(v) => pct(v, 2)}
            className="min-w-[220px] flex-1"
          />
          <Slider
            label="Gasto"
            value={c.gasto}
            min={27}
            max={40}
            step={0.1}
            onChange={(v) => sim.setControls({ gasto: v })}
            format={(v) => `${br(v)}% PIB`}
            className="min-w-[220px] flex-1"
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={sim.toggle}>
              {sim.running ? "❚❚ Pausar" : sim.done ? "↺ De novo" : "▶ Rodar 10 anos"}
            </Button>
            <Button onClick={() => sim.shock("confianca")} disabled={sim.done}>
              Crise de confiança
            </Button>
            <Button variant="ghost" onClick={sim.reset}>
              Reiniciar
            </Button>
          </div>
        </Controls>
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <div className="min-w-0">
            <LineChart
              series={[
                { id: "ipca", label: "IPCA 12m", color: "#fb923c", points: states.map((st) => [x(st.t), st.ipca12]) },
                { id: "selic", label: "Selic", color: "#38bdf8", points: states.map((st) => [x(st.t), st.selic]) },
                { id: "des", label: "Desemprego", color: "#fbbf24", points: states.map((st) => [x(st.t), st.desemprego]) },
              ]}
              xDomain={[x(0), x(QUARTERS)]}
              yDomain={[0, Math.max(20, ...states.map((st) => Math.max(st.ipca12, st.selic, st.desemprego) + 2))]}
              height={220}
              xFormat={(v) => String(Math.round(v))}
              yFormat={(v) => `${br(v, 0)}%`}
              hMarkers={[{ y: TETO, label: "teto da meta", color: "#f87171" }]}
              markers={sim.shocks.map((k) => ({ x: x(k.t), label: "crise", color: "#8a93a8" }))}
            />
          </div>
          <div className="grid grid-cols-2 content-start gap-2">
            {SHOWN.map((m) => (
              <MetricStat key={m.id} m={m} s={s} />
            ))}
          </div>
        </div>
        <p className="text-xs text-faint">
          {lastEvent ? (
            <span className={lastEvent.tone === "ok" ? "text-ok" : lastEvent.tone === "bad" ? "text-bad" : "text-warn"}>
              {quarterLabel(lastEvent.t)}: {lastEvent.text}
            </span>
          ) : (
            "Experimente: rode com o Copom no automático; depois arraste a Selic para 8% (você assume o BC) e veja a inflação desancorar."
          )}
        </p>
      </div>
    </Panel>
  );
}
