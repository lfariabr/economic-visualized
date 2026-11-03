"use client";

import { useMemo, useState } from "react";
import { Button, Controls, Panel, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { BR_YEARS, okunFit, okunPoints, okunRmse } from "./phillipsModel";
import { br, pct, pp } from "./num";

const INDIGO = "#818cf8";

export function OkunLaw() {
  const [k, setK] = useState(0.3);
  const [gStar, setGStar] = useState(2.5);
  const [g26, setG26] = useState(1.8);
  const pts = useMemo(() => okunPoints(), []);
  const fit = useMemo(() => okunFit(), []);
  const rmse = okunRmse(k, gStar);
  const best = okunRmse(fit.k, fit.gStar);
  const last = BR_YEARS[BR_YEARS.length - 1];
  const du26 = -k * (g26 - gStar);
  const u26 = last.u + du26;

  return (
    <div className="space-y-3">
      <Controls>
        <Slider className="min-w-52 flex-1" label="coeficiente de Okun k" value={k} min={0.1} max={1} step={0.01} onChange={setK} format={(v) => br(v, 2)} />
        <Slider className="min-w-52 flex-1" label="PIB que estabiliza o desemprego g*" value={gStar} min={0} max={4} step={0.1} onChange={setGStar} format={(v) => pct(v)} />
        <Button
          onClick={() => {
            setK(Math.round(fit.k * 100) / 100);
            setGStar(Math.round(fit.gStar * 10) / 10);
          }}
        >
          ajustar aos dados
        </Button>
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Panel title="Brasil 2013–2025: crescimento do PIB × variação do desemprego" right={<span className="font-mono text-[11px] text-faint">IBGE, aproximado</span>}>
          <LineChart
            height={290}
            xDomain={[-4.5, 6]}
            yDomain={[-4.5, 3.5]}
            xLabel="crescimento do PIB (%)"
            yLabel="Δ desemprego (p.p.)"
            xFormat={(v) => br(v, 0)}
            yFormat={(v) => br(v, 0)}
            hover={false}
            legend={false}
            series={[
              {
                id: "okun",
                label: "Okun",
                color: INDIGO,
                points: [
                  [-4.5, -k * (-4.5 - gStar)],
                  [6, -k * (6 - gStar)],
                ],
                width: 2.5,
              },
            ]}
            hMarkers={[{ y: 0, color: "#5a6275" }]}
            markers={[{ x: gStar, label: `g* = ${pct(gStar)}`, color: INDIGO }]}
            dots={[
              ...pts.map((p) => {
                const err = Math.abs(p.du + k * (p.g - gStar));
                return {
                  x: p.g,
                  y: p.du,
                  color: err > 1.5 ? "#f87171" : "#8a93a8",
                  r: 4,
                  label: [2015, 2016, 2020, 2021, 2022, 2024].includes(p.year) ? String(p.year) : undefined,
                };
              }),
              { x: g26, y: du26, color: "#fbbf24", r: 6, label: "2026?" },
            ]}
          />
          <p className="mt-2 font-mono text-[11px] text-faint">Δu = −k·(g − g*) · pontos vermelhos: erro &gt; 1,5 p.p.</p>
          <div className="mt-3">
            <Slider label="PIB em 2026 (hipótese)" value={g26} min={-4} max={6} step={0.1} onChange={setG26} format={(v) => pct(v)} />
          </div>
        </Panel>
        <div className="grid grid-cols-2 content-start gap-2 lg:grid-cols-1">
          <Stat label="erro do ajuste (RMSE)" value={`${br(rmse, 2)} p.p.`} tone={rmse < best + 0.05 ? "good" : rmse > best + 0.5 ? "bad" : "warn"} hint={`melhor reta: ${br(best, 2)}`} />
          <Stat label="melhor k (MQO)" value={br(fit.k, 2)} hint={`g* ≈ ${pct(fit.gStar)}`} />
          <Stat label="desemprego em 2026" value={pct(u26)} tone={du26 > 0.3 ? "bad" : du26 < -0.3 ? "good" : "neutral"} hint={`${pp(du26)} sobre ${pct(last.u)} de 2025`} />
          <Stat label="recessão de −3% custa" value={pp(k * (3 + gStar))} tone="bad" hint="a mais de desemprego em um ano" />
        </div>
      </div>
      <p className="text-xs text-faint">
        Experimente: tente acertar a reta à mão (RMSE mínimo) e depois clique em “ajustar aos dados”. Note 2021 e 2022: com o PIB
        crescendo, o desemprego quase não caiu num ano e despencou no outro — a volta de quem saiu da força de trabalho na pandemia
        distorce a regra.
      </p>
    </div>
  );
}
