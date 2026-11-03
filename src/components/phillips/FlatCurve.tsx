"use client";

import { useState } from "react";
import { Callout, Controls, Panel, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { META } from "./phillipsModel";
import { br, pct, pp } from "./num";

const INDIGO = "#818cf8";
const U_STAR = 7.5;
const FT = 109;
const OKUN = 2; // p.p. de hiato por p.p. de desemprego acima da NAIRU

export function FlatCurve() {
  const [beta, setBeta] = useState(0.25);
  const [pi0, setPi0] = useState(5);
  const [years, setYears] = useState(2);
  const dPi = pi0 - META;
  // π cai β·(u − u*) por ano (πᵉ adaptativa) → excesso médio de desemprego por ano
  const excessPerYear = dPi / beta / years;
  const uNeeded = U_STAR + excessPerYear;
  const jobs = (excessPerYear / 100) * FT;
  const gdp = excessPerYear * OKUN;
  const total = dPi / beta;
  const steepU = U_STAR + dPi / 0.8 / years;
  const pain = uNeeded > 11;
  const line = (b: number, pie: number): [number, number][] => [
    [3, pie - b * (3 - U_STAR)],
    [16, pie - b * (16 - U_STAR)],
  ];

  return (
    <div className="space-y-3">
      <Controls>
        <Slider className="min-w-52 flex-1" label="inclinação β" value={beta} min={0.1} max={1} step={0.05} onChange={setBeta} format={(v) => br(v, 2)} />
        <Slider className="min-w-52 flex-1" label="inflação hoje" value={pi0} min={3.5} max={10} step={0.1} onChange={setPi0} format={(v) => pct(v)} />
        <Slider className="min-w-52 flex-1" label="prazo para a meta" value={years} min={1} max={4} step={0.5} onChange={setYears} format={(v) => `${br(v, 1)} anos`} />
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Panel title="Quanto desemprego compra cada ponto de inflação">
          <LineChart
            height={280}
            xDomain={[3, 16]}
            yDomain={[-4, 10]}
            xLabel="desemprego (%)"
            yLabel="inflação deste ano (%)"
            xFormat={(v) => br(v, 0)}
            yFormat={(v) => br(v, 0)}
            hover={false}
            series={[
              { id: "flat", label: `curva atual (β = ${br(beta, 2)})`, color: INDIGO, points: line(beta, pi0), width: 2.5 },
              { id: "steep", label: "curva íngreme (β = 0,8)", color: "#5a6275", points: line(0.8, pi0), dashed: true },
            ]}
            markers={[{ x: U_STAR, label: "NAIRU", color: "#34d399" }]}
            hMarkers={[{ y: pi0 - dPi / years, label: "inflação alvo do 1º ano", color: "#34d399" }]}
            dots={[
              { x: Math.min(uNeeded, 15.9), y: pi0 - dPi / years, color: pain ? "#f87171" : "#fbbf24", r: 6.5, label: `${pct(uNeeded)}` },
              { x: Math.min(steepU, 15.9), y: pi0 - dPi / years, color: "#8a93a8", r: 4 },
            ]}
          >
            {(s) => (
              <rect x={s.x(11)} y={s.pad.top} width={s.x(16) - s.x(11)} height={s.height - s.pad.top - s.pad.bottom} fill="#f87171" opacity={0.07} />
            )}
          </LineChart>
          <p className="mt-2 font-mono text-[11px] text-faint">
            Δπ por ano = −β·(u − u*) → u necessário = u* + (π − 3%)/(β·anos) · Okun: 1 p.p. de desemprego ≈ {OKUN} p.p. de PIB
          </p>
        </Panel>
        <div className="grid grid-cols-2 content-start gap-2 lg:grid-cols-1">
          <Stat label="desemprego necessário" value={pct(uNeeded)} tone={pain ? "bad" : "warn"} hint={`com β = 0,8: ${pct(steepU)}`} />
          <Stat label="empregos a menos" value={`${br(jobs, 1)} mi`} tone={jobs > 3 ? "bad" : "warn"} hint="por ano, vs NAIRU" />
          <Stat label="hiato do PIB" value={pp(-gdp)} tone={gdp > 4 ? "bad" : "warn"} hint="por ano, via Okun" />
          <Stat label="desemprego-anos total" value={br(total, 1)} hint="não depende do prazo (modelo linear)" />
        </div>
      </div>
      {pain && (
        <Callout tone="bad">
          Com a curva achatada, cada ponto de inflação exige muito desemprego: tirar {pp(dPi)} em {br(years, 1)} ano(s) pediria{" "}
          {pct(uNeeded)} de desemprego. É por isso que, com β baixo, o BC depende mais de expectativas ancoradas e de canais como o câmbio
          — e por que choques de oferta pedem paciência em vez de recessão.
        </Callout>
      )}
      <p className="text-xs text-faint">
        Experimente: com β = 0,8 baixar a inflação de 5% para 3% em dois anos custa pouco; leve β para 0,15 e veja o desemprego
        necessário entrar na zona vermelha. Alongue o prazo para quatro anos para espalhar o custo.
      </p>
    </div>
  );
}
