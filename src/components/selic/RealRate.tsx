"use client";

import { useState } from "react";
import { Callout, Controls, Panel, Slider, Stat } from "@/components/ui";
import { Bars } from "@/components/viz/Chart";
import { COUNTRIES, fisher } from "./selicModel";
import { br, pct, pp } from "./num";

const SKY = "#38bdf8";
const PARTS = [
  { id: "global", label: "juro real global", color: "#5a6275", min: 0, max: 2.5, def: 1 },
  { id: "fiscal", label: "prêmio de risco fiscal", color: "#f87171", min: 0, max: 4, def: 1.5 },
  { id: "direc", label: "crédito direcionado", color: "#fbbf24", min: 0, max: 2.5, def: 1 },
  { id: "poup", label: "poupança doméstica baixa", color: "#a78bfa", min: 0, max: 2.5, def: 1 },
  { id: "hist", label: "histórico de inflação / indexação", color: "#60a5fa", min: 0, max: 1.5, def: 0.5 },
] as const;
type PartId = (typeof PARTS)[number]["id"];

export function RealRate() {
  const [selic, setSelic] = useState(15);
  const [focus, setFocus] = useState(4.5);
  const [parts, setParts] = useState<Record<PartId, number>>(
    () => Object.fromEntries(PARTS.map((p) => [p.id, p.def])) as Record<PartId, number>,
  );
  const real = fisher(selic, focus);
  const neutral = PARTS.reduce((a, p) => a + parts[p.id], 0);
  const stance = real - neutral;

  const rows = [
    { name: "Brasil", i: selic, pie: focus, br: true },
    ...COUNTRIES.map((c) => ({ ...c, br: false })),
  ]
    .map((c) => ({ ...c, r: fisher(c.i, c.pie) }))
    .sort((a, b) => b.r - a.r);
  const rank = rows.findIndex((r) => r.br) + 1;

  const W = 640;
  const scale = (v: number) => (v / 8) * (W - 20);
  let acc = 0;

  return (
    <div className="space-y-3">
      <Controls>
        <Slider className="min-w-56 flex-1" label="Selic" value={selic} min={2} max={20} step={0.25} onChange={setSelic} format={(v) => pct(v, 2)} />
        <Slider className="min-w-56 flex-1" label="Focus IPCA 12m" value={focus} min={2} max={10} step={0.1} onChange={setFocus} format={(v) => pct(v)} />
      </Controls>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Juro real ex-ante pelo mundo" right={<span className="font-mono text-[11px] text-faint">valores aproximados, 2025</span>}>
          <Bars
            max={Math.max(12, ...rows.map((r) => r.r))}
            format={(v) => pct(v)}
            rows={rows.map((r) => ({
              label: r.br ? "Brasil ◀" : r.name,
              value: Math.max(0, r.r),
              color: r.br ? SKY : r.r < 0 ? "#5a6275" : "#3a4256",
              note: r.r < 0 ? `real ${pct(r.r)}` : undefined,
            }))}
          />
          <p className="mt-3 font-mono text-[11px] text-faint">r = (1 + i) / (1 + πᵉ) − 1 · πᵉ = expectativa 12 meses</p>
        </Panel>
        <Panel title="Por que o juro neutro brasileiro é alto? (decomposição ilustrativa)">
          <div className="space-y-2">
            {PARTS.map((p) => (
              <Slider
                key={p.id}
                label={<span style={{ color: p.color }}>{p.label}</span>}
                value={parts[p.id]}
                min={p.min}
                max={p.max}
                step={0.25}
                onChange={(v) => setParts((s) => ({ ...s, [p.id]: v }))}
                format={(v) => pp(v, 2)}
              />
            ))}
          </div>
          <svg viewBox={`0 0 ${W} 74`} className="mt-4 w-full">
            {PARTS.map((p) => {
              const x = 10 + scale(acc);
              const w = scale(parts[p.id]);
              acc += parts[p.id];
              return <rect key={p.id} x={Math.round(x * 10) / 10} y={10} width={Math.max(0, Math.round(w * 10) / 10)} height={24} fill={p.color} opacity={0.85} />;
            })}
            <line x1={10 + Math.min(scale(real), W - 12)} x2={10 + Math.min(scale(real), W - 12)} y1={4} y2={42} stroke={SKY} strokeWidth={2.5} />
            <text x={Math.min(10 + scale(real), W - 14)} y={58} textAnchor={real > 6.5 ? "end" : "middle"} fontSize={12} fill={SKY}>
              juro real hoje {pct(real)}
            </text>
            <text x={10 + Math.min(scale(neutral), W - 30)} y={70} textAnchor="middle" fontSize={11} fill="#8a93a8">
              neutro {pct(neutral)}
            </text>
          </svg>
        </Panel>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="juro real Brasil" value={pct(real)} tone={real > 8 ? "warn" : "neutral"} hint={`${rank}º de ${rows.length} países`} />
        <Stat label="juro neutro (r*)" value={pct(neutral)} hint="soma dos componentes" />
        <Stat
          label="postura"
          value={pp(stance)}
          tone={stance > 2 ? "warn" : stance < -1 ? "bad" : "good"}
          hint={stance > 0.5 ? "contracionista" : stance < -0.5 ? "expansionista" : "neutra"}
        />
        <Stat label="custo real da dívida" value={pct(real * 0.78)} tone="warn" hint="% do PIB/ano se 78% de dívida pagasse a Selic" />
      </div>
      <Callout tone="info">
        Juro real alto não é só “vontade do BC”: o neutro brasileiro carrega um prêmio pela incerteza fiscal, um pedaço do crédito que
        não responde à Selic (BNDES, rural, imobiliário — a “meia-entrada” que o resto paga) e pouca poupança doméstica. Reduzir esses
        componentes baixa o juro de equilíbrio sem precisar forçar a Selic.
      </Callout>
      <p className="text-xs text-faint">
        Experimente: zere o prêmio de risco fiscal e o crédito direcionado — o neutro cai para perto do de outros emergentes, e a
        mesma Selic passa a ser muito mais contracionista.
      </p>
    </div>
  );
}
