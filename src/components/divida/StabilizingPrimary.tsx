"use client";

import { useState } from "react";
import { Callout, Controls, Panel, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { range } from "@/lib/random";
import { sStar } from "./dividaModel";
import { num, pct, sgn } from "./fmt";

export function StabilizingPrimary() {
  const [d, setD] = useState(78);
  const [r, setR] = useState(6.5);
  const [g, setG] = useState(2);
  const [s, setS] = useState(-0.5);
  const need = sStar(d, r / 100, g / 100);
  const gap = need - s;
  const xs = range(61).map((i) => -4 + i * 0.2);
  const line = (dd: number): [number, number][] => xs.map((x) => [x, sStar(dd, (g + x) / 100, g / 100)]);
  const pibBi = 12700;

  return (
    <div className="space-y-3">
      <Controls>
        <Slider className="min-w-44 flex-1" label="Dívida d" value={d} min={30} max={140} step={1} onChange={setD} format={(v) => pct(v, 0)} />
        <Slider className="min-w-44 flex-1" label="Juro real r" value={r} min={-2} max={12} step={0.1} onChange={setR} format={(v) => pct(v, 1)} />
        <Slider className="min-w-44 flex-1" label="Crescimento g" value={g} min={-3} max={6} step={0.1} onChange={setG} format={(v) => pct(v, 1)} />
        <Slider className="min-w-44 flex-1" label="Primário atual" value={s} min={-4} max={5} step={0.1} onChange={setS} format={(v) => sgn(v, 1)} />
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <Panel title="Primário necessário (% PIB) × diferença r − g">
          <LineChart
            height={280}
            xDomain={[-4, 8]}
            yDomain={[-4, 10]}
            xLabel="r − g (p.p.)"
            yFormat={(v) => `${v}%`}
            series={[
              { id: "d50", label: "dívida 50%", color: "#34d399", dashed: true, points: line(50) },
              { id: "dcur", label: `dívida ${num(d, 0)}%`, color: "#fb7185", width: 2.5, points: line(d) },
              { id: "d120", label: "dívida 120%", color: "#f87171", dashed: true, points: line(120) },
            ]}
            hMarkers={[{ y: s, label: `primário atual ${sgn(s, 1)}%`, color: gap > 0 ? "#f87171" : "#34d399" }]}
            markers={[{ x: 0, color: "#5a6275" }]}
            dots={[{ x: r - g, y: need, color: "#fb7185", label: `s* = ${num(need, 1)}%` }]}
          >
            {(sc) =>
              gap > 0 ? (
                <line x1={sc.x(r - g)} x2={sc.x(r - g)} y1={sc.y(s)} y2={sc.y(need)} stroke="#f87171" strokeWidth={3} opacity={0.7} />
              ) : null
            }
          </LineChart>
        </Panel>
        <div className="grid content-start gap-2">
          <Stat label="Primário que estabiliza s*" value={`${sgn(need, 2)}% PIB`} tone={need > 2 ? "warn" : "neutral"} />
          <Stat label="Esforço que falta" value={`${sgn(gap, 2)} p.p.`} tone={gap > 0 ? "bad" : "good"} hint={gap > 0 ? `≈ R$ ${num((gap / 100) * pibBi, 0)} bi por ano` : "dívida cai"} />
          <Stat label="Sensibilidade" value={`${num(d / (1 + g / 100) / 100, 2)} p.p.`} hint="de s* para cada 1 p.p. de r − g" />
        </div>
      </div>
      <Callout tone={gap > 0 ? "bad" : "ok"}>
        A reta fica mais inclinada quanto maior a dívida: com 120% do PIB, cada ponto de juro real a mais exige 1,2 p.p. de PIB
        de esforço fiscal. Dívida alta deixa o país refém dos juros.
      </Callout>
      <p className="font-mono text-[11px] text-faint">s* = d · (r − g)/(1 + g)</p>
      <p className="text-xs text-faint">
        Experimente: com d = 78%, ache o r que zera o esforço que falta (dica: cerca de 1,4%); depois suba a dívida para 120% e veja
        quanto mais o mesmo juro custa.
      </p>
    </div>
  );
}
