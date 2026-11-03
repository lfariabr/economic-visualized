"use client";

import { useState } from "react";
import { Callout, Controls, Panel, Segmented, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { credPath } from "./moedaModel";
import { br, pct } from "./num";

type Dir = "desinflacao" | "expansao";
const CHANGE = 4;

export function Credibility() {
  const [dir, setDir] = useState<Dir>("desinflacao");
  const [cred, setCred] = useState(0.2);
  const [mu0, mu1] = dir === "desinflacao" ? [10, 4] : [4, 10];
  const path = credPath(mu0, mu1, cred, 0.4, 24, CHANGE);
  const full = credPath(mu0, mu1, 1, 0.4, 24, CHANGE);
  const none = credPath(mu0, mu1, 0, 0.4, 24, CHANGE);
  const loss = path.reduce((a, q) => a + Math.min(0, q.y), 0) / 4; // % PIB-ano
  const boom = path.reduce((a, q) => a + Math.max(0, q.y), 0) / 4;
  const minY = Math.min(...path.map((q) => q.y));
  const t8 = path[CHANGE + 4];

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0 space-y-3">
        <Controls>
          <Segmented<Dir>
            value={dir}
            onChange={setDir}
            options={[
              { value: "desinflacao", label: "Desinflação: moeda 10% → 4%" },
              { value: "expansao", label: "Expansão: moeda 4% → 10%" },
            ]}
          />
          <Slider label="Credibilidade do anúncio" value={cred} min={0} max={1} step={0.05} onChange={setCred} format={(x) => pct(x * 100, 0)} className="w-full sm:w-[48%]" />
        </Controls>
        <div className="grid gap-3 md:grid-cols-2">
          <Panel title="Inflação (% a.a.)">
            <LineChart
              height={200}
              xDomain={[0, 23]}
              yDomain={[0, 14]}
              xLabel="trimestre"
              yFormat={(t) => br(t, 0)}
              markers={[{ x: CHANGE, label: "anúncio", color: "#8a93a8" }]}
              series={[
                { id: "pi", label: "inflação", color: "#f87171", width: 2.5, points: path.map((q) => [q.t, q.pi]) },
                { id: "pe", label: "expectativa", color: "#60a5fa", dashed: true, points: path.map((q) => [q.t, q.pe]) },
              ]}
            />
          </Panel>
          <Panel title="Hiato do produto (% do potencial)">
            <LineChart
              height={200}
              xDomain={[0, 23]}
              yDomain={[-8, 8]}
              xLabel="trimestre"
              yFormat={(t) => br(t, 0)}
              markers={[{ x: CHANGE, color: "#8a93a8" }]}
              hMarkers={[{ y: 0, color: "#5a6275" }]}
              series={[
                { id: "y", label: "com essa credibilidade", color: "#facc15", width: 2.5, area: true, points: path.map((q) => [q.t, q.y]) },
                { id: "y0", label: "sem credibilidade", color: "#5a6275", dashed: true, points: none.map((q) => [q.t, q.y]) },
                { id: "y1", label: "crível", color: "#34d399", dashed: true, points: full.map((q) => [q.t, q.y]) },
              ]}
            />
          </Panel>
        </div>
        <p className="font-mono text-xs text-muted">πe = c·μ_anunciado + (1−c)·π₋₁ · π = πe + κ·y · y = y₋₁ + (μ − π)</p>
        <p className="text-xs text-faint">
          Experimente: com credibilidade 0%, a desinflação custa uma recessão; arraste para 100% e a mesma queda da moeda sai quase de graça.
          Na expansão, o crescimento só aparece enquanto é surpresa — com 100% de credibilidade, vem só a inflação.
        </p>
      </div>
      <div className="grid content-start gap-3 sm:grid-cols-2 lg:grid-cols-1">
        {dir === "desinflacao" ? (
          <Stat label="PIB perdido (soma)" value={`${br(-loss, 1)}% PIB`} tone={-loss > 1 ? "bad" : "good"} hint="taxa de sacrifício da desinflação" />
        ) : (
          <Stat label="Ganho temporário de PIB" value={`${br(boom, 1)}% PIB`} tone={boom > 0.5 ? "warn" : "neutral"} hint="só enquanto a expansão surpreende" />
        )}
        <Stat label="Pior hiato" value={`${br(minY, 1)}%`} tone={minY < -2 ? "bad" : "neutral"} />
        <Stat label="Inflação 1 ano depois" value={pct(t8.pi)} hint={`meta implícita: ${pct(mu1)}`} />
        <Callout tone="info">
          A mesma política monetária tem efeitos diferentes conforme as pessoas acreditam nela. Por isso o BCB publica atas, a meta e o
          relatório de política monetária — e por isso o boletim Focus é acompanhado tão de perto.
        </Callout>
      </div>
    </div>
  );
}
