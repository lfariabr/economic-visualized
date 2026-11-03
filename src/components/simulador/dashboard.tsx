"use client";

import { LineChart, type Series } from "@/components/viz/Chart";
import { Stat } from "@/components/ui";
import { br, brl, pct, signed } from "./num";
import { PISO, QUARTERS, quarterYear, SHOCKS, TETO, type State } from "./simuladorModel";
import type { ShockMark } from "./useSimulador";

export type Tone = "good" | "bad" | "warn" | "neutral";

export type Metric = {
  id: string;
  label: string;
  color: string;
  get: (s: State) => number;
  value: (s: State) => string;
  tone: (s: State) => Tone;
  hint?: (s: State) => string;
  unit: (v: number) => string;
  domain?: [number, number];
  guides?: { y: number; label?: string; color?: string }[];
};

export const METRICS: Metric[] = [
  {
    id: "ipca",
    label: "IPCA 12m",
    color: "#fb923c",
    get: (s) => s.ipca12,
    value: (s) => pct(s.ipca12),
    tone: (s) => (s.ipca12 > TETO || s.ipca12 < PISO ? "bad" : s.ipca12 > 3.75 ? "warn" : "good"),
    hint: (s) => `expectativa ${pct(s.expect)}`,
    unit: (v) => `${br(v, 0)}%`,
    guides: [
      { y: TETO, label: "teto 4,5", color: "#f87171" },
      { y: 3, label: "meta 3", color: "#34d399" },
      { y: PISO, color: "#f87171" },
    ],
  },
  {
    id: "selic",
    label: "Selic",
    color: "#38bdf8",
    get: (s) => s.selic,
    value: (s) => pct(s.selic, 2),
    tone: (s) => (s.selic > 20 ? "bad" : s.selic > 14 ? "warn" : "neutral"),
    hint: (s) => `juro real ${pct(s.juroReal)}`,
    unit: (v) => `${br(v, 0)}%`,
  },
  {
    id: "dolar",
    label: "Dólar",
    color: "#2dd4bf",
    get: (s) => s.dolar,
    value: (s) => brl(s.dolar),
    tone: (s) => (s.dolar > 6.5 ? "bad" : s.dolar > 5.9 ? "warn" : "neutral"),
    hint: (s) => `reservas US$ ${br(s.reservas, 0)} bi`,
    unit: (v) => br(v, 1),
  },
  {
    id: "pib",
    label: "PIB 12m",
    color: "#e879f9",
    get: (s) => s.pib12,
    value: (s) => `${signed(s.pib12)}%`,
    tone: (s) => (s.pib12 < 0 ? "bad" : s.pib12 < 1 ? "warn" : s.pib12 >= 1.5 ? "good" : "neutral"),
    hint: (s) => `hiato ${signed(s.hiato)}%`,
    unit: (v) => `${br(v, 0)}%`,
    guides: [{ y: 0, color: "#8a93a8" }],
  },
  {
    id: "desemprego",
    label: "Desemprego",
    color: "#fbbf24",
    get: (s) => s.desemprego,
    value: (s) => pct(s.desemprego),
    tone: (s) => (s.desemprego > 9 ? "bad" : s.desemprego > 7.5 ? "warn" : s.desemprego < 7 ? "good" : "neutral"),
    hint: () => "PNAD Contínua",
    unit: (v) => `${br(v, 0)}%`,
  },
  {
    id: "divida",
    label: "Dívida / PIB",
    color: "#fb7185",
    get: (s) => s.divida,
    value: (s) => pct(s.divida),
    tone: (s) => (s.divida > 90 ? "bad" : s.divida > 82 ? "warn" : "neutral"),
    hint: (s) => `primário ${signed(s.primario)}% PIB`,
    unit: (v) => `${br(v, 0)}%`,
    guides: [{ y: 90, label: "90%", color: "#f87171" }],
  },
  {
    id: "risco",
    label: "Risco-país",
    color: "#a78bfa",
    get: (s) => s.risco,
    value: (s) => `${br(s.risco, 0)} pts`,
    tone: (s) => (s.risco > 400 ? "bad" : s.risco > 250 ? "warn" : "good"),
    hint: () => "CDS/EMBI, pontos-base",
    unit: (v) => br(v, 0),
    guides: [{ y: 400, label: "400", color: "#f87171" }],
  },
  {
    id: "cesta",
    label: "Cesta básica",
    color: "#f59e0b",
    get: (s) => s.cesta,
    value: (s) => brl(s.cesta, 0),
    tone: (s) => (s.cesta12 > 10 ? "bad" : s.cesta12 > 6 ? "warn" : "neutral"),
    hint: (s) => `${signed(s.cesta12)}% em 12m`,
    unit: (v) => br(v, 0),
  },
];

export const metric = (id: string) => METRICS.find((m) => m.id === id) ?? METRICS[0];

export function MetricStat({ m, s }: { m: Metric; s: State }) {
  return <Stat label={m.label} value={m.value(s)} tone={m.tone(s)} hint={m.hint?.(s)} />;
}

const shockLabel = (k: ShockMark["kind"]) => SHOCKS.find((x) => x.kind === k)?.label.split(" ")[0] ?? k;

export function MetricChart({
  m,
  states,
  shocks = [],
  height = 170,
  width = 360,
  extra = [],
}: {
  m: Metric;
  states: State[];
  shocks?: ShockMark[];
  height?: number;
  width?: number;
  extra?: Series[];
}) {
  const pts: [number, number][] = states.map((s) => [quarterYear(s.t), m.get(s)]);
  const vals = pts.map((p) => p[1]).concat(extra.flatMap((s) => s.points.map((p) => p[1])));
  const guideYs = (m.guides ?? []).map((g) => g.y);
  let lo = Math.min(...vals, ...guideYs);
  let hi = Math.max(...vals, ...guideYs);
  const span = hi - lo || Math.abs(hi) * 0.2 || 1;
  lo -= span * 0.12;
  hi += span * 0.12;
  if (m.id === "desemprego" || m.id === "divida" || m.id === "cesta" || m.id === "dolar" || m.id === "risco") lo = Math.max(0, lo);
  const last = states[states.length - 1];
  return (
    <LineChart
      series={[{ id: m.id, label: m.label, color: m.color, points: pts, area: false }, ...extra]}
      xDomain={[quarterYear(0), quarterYear(QUARTERS)]}
      yDomain={[lo, hi]}
      height={height}
      width={width}
      legend={extra.length > 0}
      xFormat={(v) => String(Math.round(v))}
      yFormat={m.unit}
      hMarkers={m.guides}
      markers={shocks.map((k) => ({ x: quarterYear(k.t), label: shockLabel(k.kind), color: "#8a93a8" }))}
      dots={[{ x: quarterYear(last.t), y: m.get(last), color: m.color, r: 3.5 }]}
    />
  );
}
