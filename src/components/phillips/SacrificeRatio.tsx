"use client";

import { useMemo, useState } from "react";
import { Callout, Controls, Panel, Segmented, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { META, NAIRU, sacrifice } from "./phillipsModel";
import { br, pct } from "./num";

export function SacrificeRatio() {
  const [strategy, setStrategy] = useState<"gradual" | "choque">("gradual");
  const [cred, setCred] = useState(0.2);
  const [hyst, setHyst] = useState(false);
  const res = useMemo(() => sacrifice({ strategy, cred, hysteresis: hyst }), [strategy, cred, hyst]);
  const other = useMemo(
    () => sacrifice({ strategy: strategy === "gradual" ? "choque" : "gradual", cred, hysteresis: hyst }),
    [strategy, cred, hyst],
  );
  const p = res.path;
  const yMax = Math.max(24, Math.ceil(res.peak + 1));

  return (
    <div className="space-y-3">
      <Controls>
        <Segmented
          value={strategy}
          onChange={setStrategy}
          options={[
            { value: "gradual", label: "gradualismo (5 anos)" },
            { value: "choque", label: "tratamento de choque (1 ano)" },
          ]}
        />
        <Slider className="min-w-52 flex-1" label="credibilidade" value={cred} min={0} max={0.95} step={0.05} onChange={setCred} format={(v) => pct(v * 100, 0)} />
        <Segmented
          value={hyst ? "on" : "off"}
          onChange={(v) => setHyst(v === "on")}
          options={[
            { value: "off", label: "sem histerese" },
            { value: "on", label: "com histerese" },
          ]}
        />
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Panel title="Desinflação de 10% para 3%">
          <LineChart
            height={270}
            xDomain={[0, 10]}
            yDomain={[0, yMax]}
            xLabel="ano"
            yFormat={(v) => `${br(v, 0)}%`}
            series={[
              { id: "pi", label: "inflação", color: "#f87171", points: p.map((d) => [d.t, d.pi]), width: 2.5 },
              { id: "pie", label: "expectativa", color: "#60a5fa", points: p.map((d) => [d.t, d.pie]), dashed: true },
              { id: "u", label: "desemprego", color: "#fbbf24", points: p.map((d) => [d.t, d.u]), width: 2.5, area: true },
              { id: "n", label: "NAIRU", color: "#34d399", points: p.map((d) => [d.t, d.nairu]), dashed: true },
            ]}
            hMarkers={[{ y: META, label: "meta", color: "#34d399" }]}
          />
          <p className="mt-2 font-mono text-[11px] text-faint">
            πᵉ = c·alvo + (1 − c)·π₋₁ · u = NAIRU + (πᵉ − alvo)/β · β = 0,5 · sacrifício = Σ(u − 8%) / Δπ
            {hyst ? " · NAIRU′ = NAIRU + 0,2·(u − NAIRU) − 0,15·(NAIRU − 8%)" : ""}
          </p>
        </Panel>
        <div className="grid grid-cols-2 content-start gap-2 lg:grid-cols-1">
          <Stat label="taxa de sacrifício" value={br(res.ratio, 2)} tone={res.ratio > 2.5 ? "bad" : res.ratio < 1 ? "good" : "warn"} hint="pontos-ano de desemprego por p.p. de inflação" />
          <Stat label="desemprego-anos" value={br(res.excess, 1)} hint={`${br((res.excess / 100) * 109, 1)} mi pessoas-ano`} />
          <Stat label="pico de desemprego" value={pct(res.peak)} tone={res.peak > 14 ? "bad" : "warn"} />
          <Stat
            label={strategy === "gradual" ? "se fosse choque" : "se fosse gradual"}
            value={br(other.ratio, 2)}
            hint={`pico ${pct(other.peak)}`}
          />
          <Stat label="NAIRU no fim" value={pct(p[p.length - 1].nairu)} tone={p[p.length - 1].nairu > NAIRU + 0.3 ? "bad" : "neutral"} />
        </div>
      </div>
      <Callout tone="info">
        No modelo linear sem histerese, o custo <b>total</b> é o mesmo nas duas estratégias — o que muda é a distribuição: o choque
        concentra a dor num ano, o gradualismo a espalha. O que realmente barateia a desinflação é a <b>credibilidade</b>: se as
        pessoas acreditam no alvo, as expectativas caem sozinhas. A histerese inverte o argumento — picos de desemprego deixam cicatrizes
        e tornam o choque mais caro. O Plano Real (1994) combinou choque com uma âncora crível e teve custo baixo para uma inflação de
        quatro dígitos.
      </Callout>
      <p className="text-xs text-faint">
        Experimente: com credibilidade 0%, compare gradualismo e choque (mesma taxa, picos muito diferentes). Depois suba a
        credibilidade para 80% e veja o custo despencar; ative a histerese e veja a NAIRU subir e ficar alta.
      </p>
    </div>
  );
}
