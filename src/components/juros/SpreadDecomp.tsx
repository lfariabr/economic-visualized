"use client";

import { useState } from "react";
import { Button, Controls, Panel, Slider, Stat } from "@/components/ui";
import { spread, type SpreadIn } from "./jurosModel";
import { br, pct } from "./fmtBR";

const PRESETS: { label: string; v: SpreadIn }[] = [
  { label: "Brasil hoje (aprox.)", v: { selic: 15, inad: 5, admin: 4, compuls: 5, margem: 5, imposto: 40 } },
  { label: "Brasil 2020 (Selic 2%)", v: { selic: 2, inad: 4.5, admin: 4, compuls: 5, margem: 5, imposto: 40 } },
  { label: "Mais garantias/cadastro", v: { selic: 15, inad: 2, admin: 3, compuls: 5, margem: 3.5, imposto: 40 } },
  { label: "País de juros baixos", v: { selic: 4.5, inad: 1.5, admin: 2, compuls: 1, margem: 2, imposto: 25 } },
];

const PARTS = [
  { k: "captacao", label: "Custo de captação (CDI)", color: "#60a5fa" },
  { k: "compulsorio", label: "Compulsório", color: "#5a6275" },
  { k: "inadimplencia", label: "Inadimplência", color: "#f87171" },
  { k: "admin", label: "Custo administrativo", color: "#fbbf24" },
  { k: "impostos", label: "Impostos", color: "#a78bfa" },
  { k: "margem", label: "Margem do banco", color: "#34d399" },
] as const;

export function SpreadDecomp() {
  const [v, setV] = useState<SpreadIn>(PRESETS[0].v);
  const set = (k: keyof SpreadIn) => (x: number) => setV((o) => ({ ...o, [k]: x }));
  const r = spread(v);
  const max = 50;
  const W = 640;
  const scale = (x: number) => (x / max) * (W - 20);
  let acc = 0;

  return (
    <div className="space-y-3">
      <Controls>
        {PRESETS.map((p) => (
          <Button key={p.label} onClick={() => setV(p.v)} className="text-xs">
            {p.label}
          </Button>
        ))}
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Panel title="Do CDI à taxa que você paga (p.p. ao ano)">
          <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
            <Slider label="Selic" value={v.selic} min={2} max={16} step={0.25} onChange={set("selic")} format={(x) => pct(x, 2)} />
            <Slider label="Perda c/ calote" value={v.inad} min={0.5} max={12} step={0.1} onChange={set("inad")} format={(x) => pct(x)} />
            <Slider label="Custo admin." value={v.admin} min={1} max={8} step={0.1} onChange={set("admin")} format={(x) => pct(x)} />
            <Slider label="Compulsório" value={v.compuls} min={0} max={30} step={1} onChange={set("compuls")} format={(x) => pct(x, 0)} />
            <Slider label="Margem líquida" value={v.margem} min={0} max={12} step={0.1} onChange={set("margem")} format={(x) => `${br(x)} p.p.`} />
            <Slider label="Impostos s/ lucro" value={v.imposto} min={15} max={50} step={1} onChange={set("imposto")} format={(x) => pct(x, 0)} />
          </div>
          <svg viewBox={`0 0 ${W} 120`} className="mt-4 w-full">
            {PARTS.map((p) => {
              const val = r[p.k];
              const x = 10 + scale(acc);
              const w = Math.max(0, scale(val));
              acc += val;
              return (
                <g key={p.k}>
                  <rect x={Math.round(x * 100) / 100} y={20} width={Math.round(w * 100) / 100} height={44} fill={p.color} opacity={0.85} />
                  {w > 34 && (
                    <text x={Math.round((x + w / 2) * 100) / 100} y={47} textAnchor="middle" fontSize={11} fill="#0a0c11" fontWeight={600}>
                      {br(val, 1)}
                    </text>
                  )}
                </g>
              );
            })}
            <line x1={10 + scale(r.captacao)} x2={10 + scale(r.captacao)} y1={12} y2={72} stroke="#e7e9f0" strokeDasharray="3 3" />
            <text x={10 + scale(r.captacao) + 4} y={12} fontSize={10.5} fill="#8a93a8">
              ← captação · spread →
            </text>
            {[0, 10, 20, 30, 40, 50].map((t) => (
              <g key={t}>
                <line x1={10 + scale(t)} x2={10 + scale(t)} y1={70} y2={76} stroke="#5a6275" />
                <text x={10 + scale(t)} y={90} textAnchor="middle" fontSize={10.5} fill="#5a6275">
                  {t}%
                </text>
              </g>
            ))}
            {r.taxa > max && (
              <text x={W - 10} y={110} textAnchor="end" fontSize={11} fill="#f87171">
                taxa fora da escala: {pct(r.taxa)}
              </text>
            )}
          </svg>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            {PARTS.map((p) => (
              <span key={p.k} className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm" style={{ background: p.color }} />
                {p.label}: <span className="font-mono">{br(r[p.k], 1)}</span>
              </span>
            ))}
          </div>
        </Panel>
        <div className="grid content-start gap-3">
          <Stat label="Taxa ao tomador" value={`${pct(r.taxa)} a.a.`} tone={r.taxa > 30 ? "bad" : r.taxa > 18 ? "warn" : "good"} />
          <Stat label="Spread bancário" value={`${br(r.spread)} p.p.`} tone={r.spread > 15 ? "bad" : r.spread > 8 ? "warn" : "good"} hint="taxa − custo de captação" />
          <Stat
            label="Maior fatia do spread"
            value={PARTS.slice(1).reduce((a, b) => (r[b.k] > r[a.k] ? b : a)).label}
            hint="BCB (REB) aponta inadimplência como o maior componente"
          />
          <Stat label="Spread / taxa" value={pct((r.spread / r.taxa) * 100, 0)} hint="quanto da taxa não é Selic" />
        </div>
      </div>
      <p className="font-mono text-xs text-faint">
        (1 − perda)·(1 + i) = 1 + CDI + compulsório → i_base · taxa = i_base + custo adm. + margem/(1 − t)
      </p>
      <p className="text-xs text-faint">
        Experimente: clique em &quot;Brasil 2020 (Selic 2%)&quot; — a Selic despenca, mas o spread quase não muda. Depois reduza a perda com calote para 2% e veja o spread cair de verdade.
      </p>
    </div>
  );
}
