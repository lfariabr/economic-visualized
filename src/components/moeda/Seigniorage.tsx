"use client";

import { useState } from "react";
import { Callout, Controls, Panel, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { range } from "@/lib/random";
import { caganDemand, seigniorage, seigniorageRoots } from "./moedaModel";
import { br, pct } from "./num";

const annual = (pm: number) => ((1 + pm) ** 12 - 1) * 100;

export function Seigniorage() {
  const [deficit, setDeficit] = useState(3);
  const [alpha, setAlpha] = useState(4);
  const peakPi = 1 / alpha;
  const peakS = seigniorage(peakPi, alpha);
  const roots = seigniorageRoots(deficit, alpha);
  const low = roots[0];
  const high = roots[1];
  const xmax = 1;
  const curve = range(201).map((i) => {
    const p = (i / 200) * xmax;
    return [p * 100, seigniorage(p, alpha)] as [number, number];
  });
  const demand = range(201).map((i) => {
    const p = (i / 200) * xmax;
    return [p * 100, caganDemand(p, alpha)] as [number, number];
  });
  const noEq = roots.length === 0;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0 space-y-3">
        <Controls>
          <Slider label="Déficit a financiar com emissão" value={deficit} min={0} max={10} step={0.1} onChange={setDeficit} format={(x) => `${br(x)}% PIB`} className="w-full sm:w-[48%]" />
          <Slider label="Sensibilidade da demanda por moeda (α)" value={alpha} min={1.5} max={10} step={0.5} onChange={setAlpha} format={(x) => br(x)} className="w-full sm:w-[48%]" />
        </Controls>
        <Panel title="Curva de Laffer da senhoriagem">
          <LineChart
            height={280}
            xDomain={[0, xmax * 100]}
            yDomain={[0, Math.max(8, peakS * 1.25, deficit * 1.15)]}
            xLabel="inflação mensal (% a.m.)"
            yLabel="% do PIB ao ano"
            xFormat={(t) => `${br(t, 0)}%`}
            yFormat={(t) => br(t, 0)}
            bands={[{ from: peakPi * 100, to: xmax * 100, color: "#f87171", label: "lado errado da curva" }]}
            series={[
              { id: "s", label: "Receita real da senhoriagem", color: "#facc15", width: 2.5, area: true, points: curve },
              { id: "m", label: "Base monetária real desejada (% PIB)", color: "#60a5fa", dashed: true, points: demand },
            ]}
            hMarkers={[{ y: deficit, label: `déficit ${br(deficit)}% PIB`, color: noEq ? "#f87171" : "#e7e9f0" }]}
            dots={[
              { x: peakPi * 100, y: peakS, color: "#fbbf24", label: "pico" },
              ...(low !== undefined ? [{ x: low * 100, y: deficit, color: "#34d399", label: "estável" }] : []),
              ...(high !== undefined && high <= xmax ? [{ x: high * 100, y: deficit, color: "#f87171", label: "instável" }] : []),
            ]}
          />
        </Panel>
        <p className="font-mono text-xs text-muted">m(π) = m₀·e^(−απ) · S(π) = 12·π·m(π) · pico em π* = 1/α = {pct(peakPi * 100)} a.m.</p>
        <p className="text-xs text-faint">
          Experimente: suba o déficit devagar até passar do pico da curva. Não existe mais inflação que financie o governo — a linha do déficit
          fica acima de toda a curva e o resultado é hiperinflação. Depois aumente α (gente que foge mais rápido do dinheiro) e veja o pico encolher.
        </p>
      </div>
      <div className="grid content-start gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <Stat
          label="Inflação de equilíbrio"
          value={noEq ? "sem equilíbrio" : `${pct(low * 100)} a.m.`}
          tone={noEq ? "bad" : low > 0.1 ? "warn" : "neutral"}
          hint={noEq ? "o déficit supera a senhoriagem máxima" : `≈ ${br(annual(low), 0)}% ao ano`}
        />
        <Stat label="Senhoriagem máxima" value={`${br(peakS)}% PIB`} hint={`com inflação de ${br(peakPi * 100, 0)}% a.m.`} />
        <Stat label="Base real no equilíbrio" value={noEq ? "—" : `${br(caganDemand(low, alpha))}% PIB`} hint="m₀ = 6% do PIB com inflação zero" />
        {noEq ? (
          <Callout tone="bad">
            Imprimir mais não arrecada mais: cada ponto de inflação faz o público reduzir seus saldos em reais, e a base sobre a qual o
            “imposto inflacionário” incide encolhe mais rápido do que a alíquota sobe.
          </Callout>
        ) : (
          <Callout tone="info">
            Dois equilíbrios financiam o mesmo déficit: um com inflação baixa e base grande, outro com inflação altíssima e base minúscula.
            Uma economia que cai no lado direito da curva paga muito mais inflação pela mesma receita.
          </Callout>
        )}
      </div>
    </div>
  );
}
