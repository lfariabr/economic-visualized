"use client";

import { useMemo, useState } from "react";
import { Button, Controls, Panel, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { range } from "@/lib/random";
import { coreMonth, exMean, trimmedMean, weightedMean } from "./inflacaoModel";
import { br, mesAno } from "./num";

const T = 24;
const Y0 = 2024;
const KIND_COLOR = { alim: "#34d399", monit: "#60a5fa", livre: "#fb923c" } as const;
const sd = (xs: number[]) => {
  const m = xs.reduce((a, b) => a + b, 0) / xs.length;
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length);
};

export function CoreInflation() {
  const [seed, setSeed] = useState(1);
  const [t, setT] = useState(T - 1);
  const [trim, setTrim] = useState(20);
  const months = useMemo(() => range(T).map((k) => coreMonth(seed, k)), [seed]);
  const series = months.map((items, k) => ({ k, cheia: weightedMean(items), ma: trimmedMean(items, trim).value, ex: exMean(items) }));
  const items = months[t];
  const { kept } = trimmedMean(items, trim);
  const cur = series[t];
  const sorted = [...items].sort((a, b) => a.v - b.v);
  const tw = sorted.reduce((a, i) => a + i.w, 0);

  // svg
  const W = 640,
    H = 240,
    L = 40,
    R = 10,
    TOP = 12,
    B = 24;
  const vmin = Math.min(-3, ...sorted.map((i) => i.v)),
    vmax = Math.max(3, ...sorted.map((i) => i.v));
  const r2 = (v: number) => Math.round(v * 100) / 100;
  const sx = (w: number) => r2(L + (w / tw) * (W - L - R));
  const sy = (v: number) => r2(TOP + (1 - (v - vmin) / (vmax - vmin)) * (H - TOP - B));
  let acc = 0;
  const loW = (tw * trim) / 100;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0 space-y-3">
        <Controls>
          <Slider label="Mês" value={t} min={0} max={T - 1} onChange={setT} format={(x) => mesAno(x, Y0)} className="w-full sm:w-[48%]" />
          <Slider label="Corte em cada cauda" value={trim} min={0} max={45} onChange={setTrim} format={(x) => `${x}%`} className="w-full sm:w-[48%]" />
          <Button variant="ghost" onClick={() => setSeed(seed + 1)}>
            Novo sorteio
          </Button>
        </Controls>
        <Panel title="Variação dos itens no mês, ordenada (largura = peso)" right={<span className="font-mono text-xs text-faint">{mesAno(t, Y0)}</span>}>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
            <rect x={sx(0)} y={TOP} width={sx(loW) - sx(0)} height={H - TOP - B} fill="#f87171" opacity={0.08} />
            <rect x={sx(tw - loW)} y={TOP} width={sx(tw) - sx(tw - loW)} height={H - TOP - B} fill="#f87171" opacity={0.08} />
            {[vmin, 0, vmax].map((v) => (
              <g key={v}>
                <line x1={L} x2={W - R} y1={sy(v)} y2={sy(v)} stroke={v === 0 ? "#5a6275" : "#242a38"} />
                <text x={L - 5} y={sy(v) + 3.5} fontSize={10.5} fill="#5a6275" textAnchor="end">
                  {br(v, 0)}%
                </text>
              </g>
            ))}
            {sorted.map((it) => {
              const x0 = sx(acc);
              acc += it.w;
              const x1 = sx(acc);
              const on = kept.has(it.name);
              const y0 = sy(Math.max(0, it.v)),
                y1 = sy(Math.min(0, it.v));
              return (
                <g key={it.name}>
                  <rect x={x0 + 0.5} y={y0} width={Math.max(0.5, r2(x1 - x0 - 1))} height={Math.max(0.5, r2(y1 - y0))} fill={KIND_COLOR[it.kind]} opacity={on ? 0.9 : 0.25}>
                    <title>{`${it.name}: ${br(it.v, 2)}% (peso ${br(it.w, 1)})`}</title>
                  </rect>
                  {Math.abs(it.v) > 2.5 && (
                    <text x={r2((x0 + x1) / 2)} y={it.v > 0 ? y0 - 4 : y1 + 11} fontSize={9.5} fill="#8a93a8" textAnchor="middle">
                      {it.name.split(" ")[0]}
                    </text>
                  )}
                </g>
              );
            })}
            <line x1={L} x2={W - R} y1={sy(cur.cheia)} y2={sy(cur.cheia)} stroke="#f87171" strokeDasharray="4 3" />
            <line x1={L} x2={W - R} y1={sy(cur.ma)} y2={sy(cur.ma)} stroke="#facc15" strokeWidth={1.5} />
            <text x={W - R - 4} y={sy(cur.cheia) - 4} fontSize={10.5} fill="#f87171" textAnchor="end">
              cheia
            </text>
            <text x={L + 4} y={sy(cur.ma) - 4} fontSize={10.5} fill="#facc15">
              média aparada
            </text>
          </svg>
          <div className="mt-1 flex flex-wrap gap-4 text-xs text-muted">
            {(["alim", "monit", "livre"] as const).map((k) => (
              <span key={k} className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm" style={{ background: KIND_COLOR[k] }} />
                {{ alim: "alimentos no domicílio", monit: "monitorados", livre: "demais livres" }[k]}
              </span>
            ))}
            <span className="text-faint">área vermelha: itens cortados</span>
          </div>
        </Panel>
        <Panel title="Inflação mensal: cheia × núcleos">
          <LineChart
            height={200}
            xDomain={[0, T - 1]}
            xFormat={(x) => mesAno(x, Y0)}
            yFormat={(x) => `${br(x, 1)}%`}
            markers={[{ x: t, color: "#5a6275" }]}
            series={[
              { id: "c", label: "IPCA cheio", color: "#f87171", points: series.map((s) => [s.k, s.cheia]) },
              { id: "m", label: "Média aparada", color: "#facc15", width: 2.5, points: series.map((s) => [s.k, s.ma]) },
              { id: "e", label: "Exclusão (EX)", color: "#60a5fa", dashed: true, points: series.map((s) => [s.k, s.ex]) },
            ]}
          />
        </Panel>
        <p className="font-mono text-xs text-muted">média aparada: ordena variações, corta {trim}% do peso em cada cauda, média ponderada do resto</p>
        <p className="text-xs text-faint">
          Experimente: arraste o mês e veja como o tomate ou a gasolina sozinhos movem a inflação cheia. Depois leve o corte a 0% — o
          “núcleo” vira a própria cheia, com todo o ruído.
        </p>
      </div>
      <div className="grid content-start gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <Stat label="IPCA cheio no mês" value={`${br(cur.cheia, 2)}%`} />
        <Stat label="Média aparada" value={`${br(cur.ma, 2)}%`} tone="good" hint={`núcleo verdadeiro do modelo: 0,35%`} />
        <Stat label="Exclusão (sem alimentos e monitorados)" value={`${br(cur.ex, 2)}%`} />
        <Stat
          label="Volatilidade (desvio-padrão)"
          value={`${br(sd(series.map((s) => s.cheia)), 2)} × ${br(sd(series.map((s) => s.ma)), 2)}`}
          hint="cheia × média aparada, em p.p."
        />
      </div>
    </div>
  );
}
