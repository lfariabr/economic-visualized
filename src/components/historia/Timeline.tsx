"use client";

import { useState } from "react";
import { Controls, Panel } from "@/components/ui";
import { ANO0, ANO1, FONTE, GOVERNOS, PLANOS, SERIES, pontos, valor, type SerieId } from "./historiaData";
import { br } from "./fmtBR";
import { fmtValor } from "./histFmt";

const W = 760;
const PL = 8;
const PR = 12;
const ROW = 74;
const GAP = 14;
const TOP = 40;
const r2 = (v: number) => Math.round(v * 100) / 100;

export function Timeline() {
  const [vis, setVis] = useState<SerieId[]>(["ipca", "selic", "dolar", "pib", "desemprego", "divida", "salario"]);
  const [log, setLog] = useState(true);
  const [planos, setPlanos] = useState(true);
  const [governos, setGovernos] = useState(true);
  const [hover, setHover] = useState<number | null>(null);

  const rows = SERIES.filter((s) => vis.includes(s.id));
  const H = TOP + rows.length * (ROW + GAP) + 22;
  const x = (a: number) => r2(PL + ((a - ANO0) / (ANO1 + 1 - ANO0)) * (W - PL - PR));
  const toggle = (id: SerieId) => setVis((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]));

  return (
    <div className="space-y-3">
      <Controls>
        <div className="flex flex-wrap gap-1.5">
          {SERIES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => toggle(s.id)}
              className="rounded-md border px-2 py-0.5 text-xs transition"
              style={{
                borderColor: vis.includes(s.id) ? s.color : "#242a38",
                color: vis.includes(s.id) ? s.color : "#5a6275",
              }}
            >
              {s.short}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-muted">
          <input type="checkbox" checked={log} onChange={(e) => setLog(e.target.checked)} /> IPCA em escala log
        </label>
        <label className="flex items-center gap-2 text-muted">
          <input type="checkbox" checked={planos} onChange={(e) => setPlanos(e.target.checked)} /> planos econômicos
        </label>
        <label className="flex items-center gap-2 text-muted">
          <input type="checkbox" checked={governos} onChange={(e) => setGovernos(e.target.checked)} /> governos
        </label>
      </Controls>
      <Panel title={hover !== null ? `Ano ${hover}` : "Brasil, 1980–2025 · passe o mouse para ler o ano"} right={<span className="text-[11px] text-faint">{FONTE}</span>}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full select-none"
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const px = ((e.clientX - r.left) / r.width) * W;
            const a = Math.floor(ANO0 + ((px - PL) / (W - PL - PR)) * (ANO1 + 1 - ANO0));
            setHover(a >= ANO0 && a <= ANO1 ? a : null);
          }}
          onMouseLeave={() => setHover(null)}
        >
          {governos &&
            GOVERNOS.map((g, i) => (
              <g key={`${g.nome}${g.de}`}>
                <rect x={x(g.de)} y={TOP - 18} width={x(Math.min(g.ate, ANO1 + 1)) - x(g.de)} height={H - TOP - 4} fill={i % 2 ? "#171b24" : "#11141b"} opacity={0.9} />
                <text x={r2((x(g.de) + x(Math.min(g.ate, ANO1 + 1))) / 2)} y={TOP - 6} textAnchor="middle" fontSize={9.5} fill="#5a6275">
                  {x(Math.min(g.ate, ANO1 + 1)) - x(g.de) > 40 ? g.nome : g.nome.slice(0, 3)}
                </text>
              </g>
            ))}
          {planos &&
            PLANOS.map((p, i) => (
              <g key={p.id}>
                <line x1={x(p.x)} x2={x(p.x)} y1={TOP - 34 + (i % 2) * 10} y2={H - 22} stroke={p.ok ? "#34d399" : "#fbbf24"} strokeDasharray="2 3" opacity={0.7} />
                <text x={x(p.x) + 2} y={TOP - 28 + (i % 2) * 10} fontSize={9.5} fill={p.ok ? "#34d399" : "#fbbf24"}>
                  {p.nome.replace("Plano ", "")}
                </text>
              </g>
            ))}
          {rows.map((s, ri) => {
            const y0 = TOP + ri * (ROW + GAP) + 14;
            const pts = pontos(s.id);
            const isLog = s.id === "ipca" && log;
            const tf = (v: number) => (isLog ? Math.log10(Math.max(v, 0.5)) : v);
            const vals = pts.map((p) => tf(p[1]));
            const lo = Math.min(0, ...vals);
            const hi = Math.max(...vals);
            const y = (v: number) => r2(y0 + ROW - 10 - ((tf(v) - lo) / (hi - lo || 1)) * (ROW - 22));
            const d = pts.map((p, i) => `${i ? "L" : "M"}${r2(x(p[0] + 0.5))},${y(p[1])}`).join("");
            const hv = hover !== null ? valor(s.id, hover) : undefined;
            const ticks = isLog ? [1, 10, 100, 1000] : [lo, hi].map((t) => Number(t.toPrecision(2)));
            return (
              <g key={s.id}>
                <text x={PL + 4} y={y0 - 2} fontSize={11} fill={s.color} fontWeight={600}>
                  {s.label}
                  {s.note && <tspan fill="#5a6275" fontWeight={400}>{`  · ${s.note}`}</tspan>}
                  {hv !== undefined && <tspan fill="#e7e9f0">{`   ${hover}: ${fmtValor(s.id, hv)}`}</tspan>}
                </text>
                {ticks.map((t) => (
                  <g key={t}>
                    <line x1={PL} x2={W - PR} y1={y(isLog ? t : t)} y2={y(isLog ? t : t)} stroke="#242a38" />
                    <text x={W - PR} y={y(t) - 2} textAnchor="end" fontSize={9} fill="#5a6275">
                      {isLog ? `${br(t, 0)}%` : br(t, s.id === "dolar" ? 1 : 0)}
                    </text>
                  </g>
                ))}
                {s.id === "pib" && <line x1={PL} x2={W - PR} y1={y(0)} y2={y(0)} stroke="#5a6275" strokeDasharray="3 3" />}
                <path d={d} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" />
                {hv !== undefined && hover !== null && <circle cx={x(hover + 0.5)} cy={y(hv)} r={3.5} fill={s.color} stroke="#0a0c11" strokeWidth={1.5} />}
              </g>
            );
          })}
          {[1980, 1985, 1990, 1995, 2000, 2005, 2010, 2015, 2020, 2025].map((a) => (
            <text key={a} x={x(a + 0.5)} y={H - 6} textAnchor="middle" fontSize={10} fill="#5a6275">
              {a}
            </text>
          ))}
          {hover !== null && <line x1={x(hover + 0.5)} x2={x(hover + 0.5)} y1={TOP - 18} y2={H - 20} stroke="#8a93a8" strokeWidth={1} pointerEvents="none" />}
        </svg>
      </Panel>
      <p className="text-xs text-faint">
        Experimente: desligue a escala log do IPCA — a hiperinflação de 1989–94 achata todo o resto; ligue de novo e veja os planos (linhas amarelas) derrubando a inflação por meses, até o Real (verde). Dados aproximados.
      </p>
    </div>
  );
}
