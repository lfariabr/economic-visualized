"use client";

import { useState } from "react";
import { Button, Callout, Controls, Panel, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { useTicker } from "@/lib/useTicker";
import { range } from "@/lib/random";
import { dynamicPath, peakRate, revenue } from "./lafferModel";
import { num, pct, sgn } from "./fmt";

const YEARS = 15;

export function DynamicLaffer() {
  const [t0, setT0] = useState(35);
  const [t1, setT1] = useState(50);
  const [eSR, setESR] = useState(0.3);
  const [eLR, setELR] = useState(1.6);
  const [lambda, setLambda] = useState(0.25);
  const [year, setYear] = useState(YEARS);

  const ticker = useTicker(
    () =>
      setYear((y) => {
        if (y >= YEARS) {
          ticker.pause();
          return YEARS;
        }
        return y + 1;
      }),
    { speed: 0.06 },
  );

  const path = dynamicPath(t0 / 100, t1 / 100, eSR, eLR, lambda, YEARS);
  const shown = path.filter((p) => p.year <= year);
  const cur = path[year];
  const firstLoss = path.find((p) => p.year > 0 && p.rev < 100);
  const lr = path[YEARS];
  const sr = path[1];

  const curveSR: [number, number][] = range(96).map((i) => [i, revenue(i / 100, eSR)]);
  const curveLR: [number, number][] = range(96).map((i) => [i, revenue(i / 100, eLR)]);
  const norm = (eps: number, t: number) => (revenue(t / 100, eps) / revenue(t0 / 100, eps)) * 100;

  return (
    <div className="space-y-3">
      <Controls>
        <Button variant="primary" onClick={() => (year >= YEARS ? (setYear(0), ticker.play()) : ticker.toggle())}>
          {ticker.running ? "❚❚ Pausar" : "▶ Simular anos"}
        </Button>
        <Button onClick={() => { ticker.pause(); setYear((y) => Math.min(YEARS, y + 1)); }}>+1 ano</Button>
        <Slider className="min-w-44 flex-1" label="Alíquota antes" value={t0} min={10} max={60} onChange={setT0} format={(v) => pct(v, 0)} />
        <Slider className="min-w-44 flex-1" label="Alíquota nova" value={t1} min={10} max={80} onChange={setT1} format={(v) => pct(v, 0)} />
      </Controls>
      <Controls>
        <Slider className="min-w-44 flex-1" label="ε curto prazo" value={eSR} min={0.05} max={1.5} step={0.05} onChange={setESR} format={(v) => num(v, 2)} />
        <Slider className="min-w-44 flex-1" label="ε longo prazo" value={eLR} min={0.2} max={4} step={0.1} onChange={setELR} format={(v) => num(v, 1)} />
        <Slider className="min-w-44 flex-1" label="Velocidade de ajuste" value={lambda} min={0.05} max={0.8} step={0.05} onChange={setLambda} format={(v) => `${num(v * 100, 0)}%/ano`} />
      </Controls>
      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-[1fr_1fr_240px]">
        <Panel title="Arrecadação ano a ano (antes = 100)">
          <LineChart
            height={260}
            xDomain={[0, YEARS]}
            yDomain={[40, 180]}
            xLabel="anos após a mudança"
            series={[
              { id: "rev", label: "Arrecadação", color: "#e7e9f0", width: 2.5, points: shown.map((p) => [p.year, p.rev]) },
              { id: "base", label: "Base", color: "#60a5fa", dashed: true, points: shown.map((p) => [p.year, p.base]) },
            ]}
            hMarkers={[{ y: 100, label: "arrecadação antes", color: "#8a93a8" }]}
            bands={firstLoss && firstLoss.year <= year ? [{ from: firstLoss.year - 0.5, to: YEARS, color: "#f87171", label: "perde receita" }] : []}
            dots={[{ x: cur.year, y: cur.rev, color: cur.rev < 100 ? "#f87171" : "#34d399" }]}
          />
        </Panel>
        <Panel title="Duas curvas de Laffer (antes = 100)">
          <LineChart
            height={260}
            xDomain={[0, 95]}
            yDomain={[0, 200]}
            xLabel="alíquota (%)"
            xFormat={(v) => `${v}%`}
            series={[
              { id: "sr", label: "Curto prazo", color: "#34d399", points: curveSR.map(([x]) => [x, norm(eSR, x)]) },
              { id: "lr", label: "Longo prazo", color: "#f87171", points: curveLR.map(([x]) => [x, norm(eLR, x)]) },
            ]}
            markers={[
              { x: peakRate(eSR) * 100, color: "#34d399" },
              { x: peakRate(eLR) * 100, label: `t* longo = ${pct(peakRate(eLR) * 100, 0)}`, color: "#f87171" },
            ]}
            dots={[
              { x: t1, y: norm(eSR, t1), color: "#34d399" },
              { x: t1, y: norm(eLR, t1), color: "#f87171" },
            ]}
          />
        </Panel>
        <div className="grid content-start gap-2 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-4 2xl:col-span-1 2xl:grid-cols-1">
          <Stat label={`Ano ${year}`} value={num(cur.rev, 0)} tone={cur.rev < 100 ? "bad" : "good"} hint="arrecadação (antes = 100)" />
          <Stat label="Efeito no 1º ano" value={`${sgn(sr.rev - 100, 0)}%`} tone={sr.rev >= 100 ? "good" : "bad"} />
          <Stat label="Efeito no longo prazo" value={`${sgn(lr.rev - 100, 0)}%`} tone={lr.rev >= 100 ? "good" : "bad"} />
          <Stat label="Receita fica abaixo da original" value={firstLoss ? `ano ${firstLoss.year}` : "nunca"} tone={firstLoss ? "bad" : "neutral"} />
        </div>
      </div>
      <Callout tone={firstLoss ? "bad" : "info"}>
        No curto prazo as pessoas e empresas mal reagem (contratos, hábitos); o aumento parece um sucesso. Com os anos, a base
        se ajusta: planejamento tributário, pejotização, informalidade, menos investimento, mudança de domicílio fiscal. A
        mesma alíquota pode estar no lado normal da curva de curto prazo e no lado proibitivo da de longo prazo.
      </Callout>
      <p className="font-mono text-[11px] text-faint">
        ln Bₖ = ε_LP·ln((1−t₁)/(1−t₀)) + (ε_CP − ε_LP)·ln((1−t₁)/(1−t₀))·(1−λ)^(k−1)
      </p>
      <p className="text-xs text-faint">
        Experimente: aperte ▶ com os valores padrão — a receita sobe no 1º ano e afunda depois. Depois reduza o ε de longo prazo
        para 0,6 e veja o aumento se sustentar.
      </p>
    </div>
  );
}
