"use client";

import { useState } from "react";
import { Callout, Controls, Panel, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { nairuParts, type NairuInputs } from "./phillipsModel";
import { br, pct, pp } from "./num";

const INDIGO = "#818cf8";
const BETA = 0.5;

export function NairuReforms() {
  const [x, setX] = useState<NairuInputs>({ qualif: 0, intermed: 0, custos: 0.45, seguro: 0 });
  const [u, setU] = useState(5.8);
  const parts = nairuParts(x);
  const nairu = parts.reduce((a, p) => a + p.value, 0);
  const pressure = BETA * (nairu - u);
  const set = (k: keyof NairuInputs) => (v: number) => setX((s) => ({ ...s, [k]: v }));
  const W = 640;
  const sc = (v: number) => (v / 10) * (W - 20);
  let acc = 0;

  return (
    <div className="space-y-3">
      <Controls>
        <Slider className="min-w-52 flex-1" label="desemprego atual (PNAD)" value={u} min={4} max={14} step={0.1} onChange={setU} format={(v) => pct(v)} />
      </Controls>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Do que é feita a NAIRU (ilustrativo)">
          <div className="space-y-2">
            <Slider label="qualificação profissional" value={x.qualif} min={0} max={1} step={0.05} onChange={set("qualif")} format={(v) => pct(v * 100, 0)} />
            <Slider label="intermediação (SINE, plataformas)" value={x.intermed} min={0} max={1} step={0.05} onChange={set("intermed")} format={(v) => pct(v * 100, 0)} />
            <Slider label="menor custo de contratar/demitir" value={x.custos} min={0} max={1} step={0.05} onChange={set("custos")} format={(v) => pct(v * 100, 0)} />
            <Slider label="seguro-desemprego mais longo" value={x.seguro} min={0} max={1} step={0.05} onChange={set("seguro")} format={(v) => pct(v * 100, 0)} />
          </div>
          <svg viewBox={`0 0 ${W} 96`} className="mt-4 w-full">
            {parts.map((p) => {
              const x0 = 10 + sc(acc);
              acc += p.value;
              return (
                <g key={p.id}>
                  <rect x={Math.round(x0 * 10) / 10} y={10} width={Math.max(0, Math.round(sc(p.value) * 10) / 10)} height={26} fill={p.color} opacity={0.85} />
                  <text x={Math.round((x0 + sc(p.value) / 2) * 10) / 10} y={52} textAnchor="middle" fontSize={11} fill={p.color}>
                    {br(p.value, 1)}
                  </text>
                </g>
              );
            })}
            <line x1={10 + sc(u)} x2={10 + sc(u)} y1={4} y2={42} stroke="#e7e9f0" strokeWidth={2} />
            <text x={Math.min(10 + sc(u), W - 60)} y={74} textAnchor="middle" fontSize={11.5} fill="#e7e9f0">
              desemprego hoje {pct(u)}
            </text>
            <text x={10} y={92} fontSize={11} fill="#8a93a8">
              NAIRU = {pct(nairu)} (friccional + estrutural + institucional)
            </text>
          </svg>
        </Panel>
        <Panel title="Curva de curto prazo e vertical de longo prazo">
          <LineChart
            height={250}
            xDomain={[3, 14]}
            yDomain={[-2, 10]}
            xLabel="desemprego (%)"
            yLabel="inflação (%)"
            xFormat={(v) => br(v, 0)}
            yFormat={(v) => br(v, 0)}
            hover={false}
            legend={false}
            series={[
              { id: "sr", label: "curto prazo (πᵉ = 3%)", color: INDIGO, points: [[3, 3 - BETA * (3 - nairu)], [14, 3 - BETA * (14 - nairu)]] },
              { id: "old", label: "NAIRU antiga", color: "#3a4256", points: [[8, -2], [8, 10]], dashed: true },
            ]}
            markers={[{ x: nairu, label: `NAIRU ${pct(nairu)}`, color: "#34d399" }]}
            dots={[{ x: u, y: 3 + pressure, color: pressure > 0.25 ? "#f87171" : "#34d399", r: 6, label: `${pct(3 + pressure)}` }]}
          >
            {(s) => (
              <rect
                x={s.x(3)}
                y={s.pad.top}
                width={Math.max(0, s.x(nairu) - s.x(3))}
                height={s.height - s.pad.top - s.pad.bottom}
                fill="#f87171"
                opacity={0.06}
              />
            )}
          </LineChart>
        </Panel>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="NAIRU estimada" value={pct(nairu)} tone={nairu < 7 ? "good" : "neutral"} hint="faixa das estimativas: ~7–9%" />
        <Stat label="u − NAIRU" value={pp(u - nairu)} tone={u < nairu ? "warn" : "neutral"} />
        <Stat label="pressão na inflação" value={`${pp(pressure)}/ano`} tone={pressure > 0.25 ? "bad" : pressure < -0.25 ? "good" : "neutral"} hint="β·(NAIRU − u)" />
        <Stat label="empregos “sem inflação” a mais" value={`${br(((8 - nairu) / 100) * 109, 1)} mi`} hint="vs NAIRU de 8% · força de trabalho 109 mi" />
      </div>
      {u < nairu - 0.25 && (
        <Callout tone="bad">
          Com o desemprego abaixo da NAIRU, salários e preços tendem a acelerar: o BC precisa manter juros altos para esfriar o
          mercado de trabalho. Reformas que reduzem a NAIRU permitem o mesmo desemprego baixo sem pressão inflacionária.
        </Callout>
      )}
      <p className="font-mono text-[11px] text-faint">π = πᵉ − β·(u − NAIRU) · β = 0,5 · NAIRU = friccional + estrutural + institucional</p>
      <p className="text-xs text-faint">
        Experimente: com o desemprego em 5,8% (2025) a pressão é inflacionária. Leve qualificação e intermediação a 100% e veja a NAIRU
        cair abaixo do desemprego atual; depois alongue o seguro-desemprego — ele protege, mas alonga a busca.
      </p>
    </div>
  );
}
