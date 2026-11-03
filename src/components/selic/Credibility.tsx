"use client";

import { useMemo, useState } from "react";
import { Callout, Controls, Panel, Segmented, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { META, TOL, credSim, type CredPoint } from "./selicModel";
import { br, pct } from "./num";

const SKY = "#38bdf8";

const cost = (s: CredPoint[]) => s.reduce((a, p) => a + Math.max(0, -p.y), 0) / 4;

export function Credibility() {
  const [cred, setCred] = useState(0.5);
  const [mode, setMode] = useState<"ancorado" | "choque">("ancorado");
  const breakAt = mode === "choque" ? 8 : null;
  const sim = useMemo(() => credSim(cred, breakAt), [cred, breakAt]);
  const hi = useMemo(() => cost(credSim(0.9, null)), []);
  const lo = useMemo(() => cost(credSim(0.05, null)), []);
  const c = cost(sim);
  const last = sim[sim.length - 1];
  const peak = Math.max(...sim.map((p) => p.i));
  const firstIn = sim.findIndex((p) => Math.abs(p.pi - META) <= TOL);
  const drift = last.pie - META;
  const xFmt = (v: number) => `${2026 + Math.floor(v / 4)}`;

  return (
    <div className="space-y-3">
      <Controls>
        <Slider className="min-w-60 flex-1" label="credibilidade inicial" value={cred} min={0.05} max={0.95} step={0.05} onChange={setCred} format={(v) => pct(v * 100, 0)} />
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: "ancorado", label: "BC mantém a credibilidade" },
            { value: "choque", label: "perde credibilidade em 2028" },
          ]}
        />
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-4">
          <Panel title="Desinflação: de 8% até a meta">
            <LineChart
              height={240}
              xDomain={[0, 24]}
              yDomain={[0, 20]}
              xFormat={xFmt}
              yFormat={(v) => `${br(v, 0)}%`}
              series={[
                { id: "i", label: "Selic (regra de Taylor)", color: SKY, points: sim.map((p) => [p.q, p.i]), step: true },
                { id: "pi", label: "IPCA", color: "#f87171", points: sim.map((p) => [p.q, p.pi]), width: 2.5 },
                { id: "pie", label: "Focus 12m", color: "#60a5fa", points: sim.map((p) => [p.q, p.pie]), dashed: true },
              ]}
              hMarkers={[
                { y: META, label: "meta", color: "#34d399" },
                { y: META + TOL, color: "#5a6275" },
              ]}
              markers={breakAt !== null ? [{ x: breakAt, label: "credibilidade perdida", color: "#f87171" }] : []}
            />
          </Panel>
          <Panel title="Hiato do produto (o custo)">
            <LineChart
              height={150}
              xDomain={[0, 24]}
              yDomain={[-4, 1.5]}
              xFormat={xFmt}
              yFormat={(v) => `${br(v, 0)}%`}
              series={[{ id: "y", label: "hiato", color: "#a78bfa", points: sim.map((p) => [p.q, p.y]), area: true }]}
              hMarkers={[{ y: 0, color: "#5a6275" }]}
            />
          </Panel>
        </div>
        <div className="grid grid-cols-2 content-start gap-2 lg:grid-cols-1">
          <Stat label="custo da desinflação" value={`${br(c, 2)} hiato-anos`} tone={c > (hi + lo) / 2 ? "bad" : "good"} hint={`credibilidade 90%: ${br(hi, 2)} · 5%: ${br(lo, 2)}`} />
          <Stat label="Selic no pico" value={pct(peak)} tone={peak > 17 ? "warn" : "neutral"} />
          <Stat label="chega ao intervalo" value={firstIn >= 0 ? `${br(firstIn / 4, 2)} anos` : "não chega"} />
          <Stat
            label="Focus no fim"
            value={pct(last.pie)}
            tone={Math.abs(drift) > 0.5 ? "bad" : "good"}
            hint={Math.abs(drift) > 0.5 ? "desancorado" : "ancorado na meta"}
          />
        </div>
      </div>
      {mode === "choque" && (
        <Callout tone="bad">
          Depois da perda de credibilidade o mercado passa a projetar uma “meta implícita” mais alta. O Focus descola de 3% mesmo sem
          nenhum choque, a inflação acompanha, e a Selic precisa ficar mais alta por mais tempo — com mais hiato negativo — só para
          não perder mais terreno.
        </Callout>
      )}
      <p className="font-mono text-[11px] text-faint">
        πᵉ′ = c·âncora + (1 − c)·π · π′ = 0,5·π + 0,5·πᵉ′ + 0,3·hiato · hiato′ = 0,7·hiato − 0,15·(i − πᵉ − 5%) · custo = Σ hiato negativo / 4
      </p>
      <p className="text-xs text-faint">
        Experimente: compare credibilidade de 10% e de 90% — com a mesma regra, a inflação cai mais rápido e o custo em hiato é bem
        menor quando o Focus acredita na meta. Depois ative “perde credibilidade em 2028”.
      </p>
    </div>
  );
}
