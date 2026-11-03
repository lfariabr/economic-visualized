"use client";

import { DECIL_LABEL } from "./decis";

/** Barras agrupadas por décimo de renda (duas ou mais séries). */
export function DecileBars({
  series,
  format,
  height = 220,
}: {
  series: { id: string; label: string; color: string; values: number[] }[];
  format: (v: number) => string;
  height?: number;
}) {
  const W = 640;
  const pad = { l: 44, r: 10, t: 16, b: 26 };
  const ih = height - pad.t - pad.b;
  const iw = W - pad.l - pad.r;
  const max = Math.max(...series.flatMap((s) => s.values), 1e-9) * 1.12;
  const gw = iw / 10;
  const bw = (gw * 0.78) / series.length;
  const r2 = (v: number) => Math.round(v * 100) / 100;
  const y = (v: number) => r2(pad.t + ih - (v / max) * ih);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  return (
    <div className="min-w-0">
      <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {series.map((s) => (
          <span key={s.id} className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${height}`} className="w-full">
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#242a38" />
            <text x={pad.l - 6} y={y(t) + 3.5} textAnchor="end" fontSize={10.5} fill="#5a6275">
              {format(t)}
            </text>
          </g>
        ))}
        {DECIL_LABEL.map((l, d) => (
          <g key={l}>
            {series.map((s, k) => {
              const v = s.values[d];
              const x = r2(pad.l + d * gw + gw * 0.11 + k * bw);
              return (
                <rect key={s.id} x={x} y={y(v)} width={r2(bw - 1)} height={r2(Math.max(0, pad.t + ih - y(v)))} rx={2} fill={s.color} style={{ transition: "all 250ms" }}>
                  <title>{`${l} · ${s.label}: ${format(v)}`}</title>
                </rect>
              );
            })}
            <text x={r2(pad.l + d * gw + gw / 2)} y={height - 8} textAnchor="middle" fontSize={10.5} fill="#5a6275">
              {l}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
