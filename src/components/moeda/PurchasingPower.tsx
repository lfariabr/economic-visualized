"use client";

import { useState } from "react";
import { Button, Callout, Controls, Panel, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { range } from "@/lib/random";
import { br, brl, pct } from "./num";

const PRESETS = [
  { label: "Meta (3%)", pi: 3 },
  { label: "IPCA 2025 (~4,5%)", pi: 4.5 },
  { label: "IPCA 2015 (10,7%)", pi: 10.7 },
  { label: "Anos 70 (~40%)", pi: 40 },
];

export function PurchasingPower() {
  const [pi, setPi] = useState(4.5);
  const [years, setYears] = useState(20);
  const value = (n: number) => 100 / (1 + pi / 100) ** n;
  const pts = range(years * 4 + 1).map((i) => [i / 4, value(i / 4)] as [number, number]);
  const ref = range(years * 4 + 1).map((i) => [i / 4, 100 / 1.03 ** (i / 4)] as [number, number]);
  const half = pi > 0 ? Math.log(2) / Math.log(1 + pi / 100) : Infinity;
  const rule = pi > 0 ? 70 / pi : Infinity;
  const end = value(years);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0 space-y-3">
        <Controls>
          <Slider label="Inflação anual" value={pi} min={0} max={50} step={0.1} onChange={setPi} format={(x) => pct(x)} className="w-full sm:w-[48%]" />
          <Slider label="Anos" value={years} min={1} max={40} onChange={setYears} format={(x) => `${x} anos`} className="w-full sm:w-[48%]" />
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Button key={p.label} className="text-xs" onClick={() => setPi(p.pi)}>
                {p.label}
              </Button>
            ))}
          </div>
        </Controls>
        <Panel title="O que R$ 100 de hoje compram no futuro">
          <LineChart
            height={250}
            xDomain={[0, years]}
            yDomain={[0, 100]}
            xLabel="anos"
            yFormat={(t) => `R$ ${br(t, 0)}`}
            xFormat={(t) => br(t, 0)}
            hMarkers={[{ y: 50, label: "metade", color: "#fbbf24" }]}
            markers={half <= years ? [{ x: half, label: `${br(half, 1)} anos`, color: "#fbbf24" }] : []}
            series={[
              { id: "v", label: `inflação de ${pct(pi)}`, color: "#f87171", width: 2.5, area: true, points: pts },
              { id: "r", label: "na meta (3%)", color: "#5a6275", dashed: true, points: ref },
            ]}
            dots={[{ x: years, y: end, color: "#f87171" }]}
          />
        </Panel>
        <p className="font-mono text-xs text-muted">valor real = 100 / (1+π)ⁿ · meia-vida = ln 2 / ln(1+π) ≈ 70 / π</p>
        <p className="text-xs text-faint">
          Experimente: compare 3% e 4,5% ao longo de 30 anos — 1,5 p.p. a mais parece pouco, mas no fim você fica com cerca de um terço a
          menos. Depois teste 40%: em dois anos, metade do dinheiro some.
        </p>
      </div>
      <div className="grid content-start gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <Stat label={`R$ 100 daqui a ${years} anos`} value={brl(end)} tone={end < 50 ? "bad" : end < 75 ? "warn" : "neutral"} hint="em poder de compra de hoje" />
        <Stat label="Preços sobem" value={`${br((100 / end - 1) * 100, 0)}%`} hint="no período" />
        <Stat label="Poder de compra cai à metade em" value={Number.isFinite(half) ? `${br(half, 1)} anos` : "nunca"} hint={Number.isFinite(rule) ? `regra dos 70: ${br(rule, 1)} anos` : undefined} />
        <Callout tone="info">
          Em 1993 o IPCA foi de cerca de 2.477%: R$ 100 viravam algo como R$ 4 de poder de compra em doze meses. Por isso quem recebia
          salário corria ao supermercado no mesmo dia.
        </Callout>
      </div>
    </div>
  );
}
