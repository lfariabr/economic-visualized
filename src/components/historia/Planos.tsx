"use client";

import { useState } from "react";
import { Callout, Controls, Panel, Stat } from "@/components/ui";
import { mean } from "@/lib/random";
import { DATA, FONTE, PLANOS } from "./historiaData";
import { br, pct } from "./fmtBR";

const W = 640;
const H = 230;
const PAD = { l: 40, r: 10, t: 16, b: 34 };

export function Planos() {
  const [id, setId] = useState("cruzado");
  const p = PLANOS.find((x) => x.id === id) ?? PLANOS[0];
  const vmax = Math.ceil(Math.max(...p.mensal) / 10) * 10 + 10;
  const fixed = Math.max(vmax, 30);
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const bw = iw / p.mensal.length;
  const y = (v: number) => Math.round((PAD.t + ih - (Math.max(0, v) / fixed) * ih) * 100) / 100;
  const antes = mean(p.mensal.slice(0, 6));
  const depois3 = mean(p.mensal.slice(6, 9));
  const fim = p.mensal[p.mensal.length - 1];
  const anual = (m: number) => ((1 + m / 100) ** 12 - 1) * 100;
  const ticks = [0, fixed / 4, fixed / 2, (3 * fixed) / 4, fixed];

  return (
    <div className="space-y-3">
      <Controls>
        <div className="flex flex-wrap gap-1.5">
          {PLANOS.map((x) => (
            <button
              key={x.id}
              type="button"
              onClick={() => setId(x.id)}
              className="rounded-lg border px-3 py-1.5 text-sm transition"
              style={{
                borderColor: x.id === id ? (x.ok ? "#34d399" : "#fbbf24") : "#242a38",
                color: x.id === id ? "#e7e9f0" : "#8a93a8",
                background: x.id === id ? "#171b24" : undefined,
              }}
            >
              {x.nome.replace("Plano ", "")} <span className="font-mono text-xs text-faint">{x.ano}</span>
            </button>
          ))}
        </div>
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Panel title={`${p.nome} · inflação mensal antes e depois (IPCA, % a.m.)`} right={<span className="text-[11px] text-faint">{FONTE}</span>}>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="#242a38" />
                <text x={PAD.l - 6} y={y(t) + 3.5} textAnchor="end" fontSize={10.5} fill="#5a6275">
                  {br(t, 0)}%
                </text>
              </g>
            ))}
            <rect x={PAD.l + 6 * bw} y={PAD.t} width={12 * bw} height={ih} fill={p.ok ? "#34d399" : "#fbbf24"} opacity={0.06} />
            <line x1={PAD.l + 6 * bw} x2={PAD.l + 6 * bw} y1={PAD.t} y2={PAD.t + ih} stroke={p.ok ? "#34d399" : "#fbbf24"} strokeDasharray="4 3" />
            <text x={PAD.l + 6 * bw + 5} y={PAD.t + 11} fontSize={10.5} fill={p.ok ? "#34d399" : "#fbbf24"}>
              plano ({p.mes0})
            </text>
            {p.mensal.map((v, i) => {
              const bx = Math.round((PAD.l + i * bw + 2) * 100) / 100;
              const w = Math.round((bw - 4) * 100) / 100;
              const color = i < 6 ? "#f87171" : v > 10 ? "#fbbf24" : "#34d399";
              return (
                <g key={i}>
                  <rect x={bx} y={y(v)} width={w} height={Math.max(1, PAD.t + ih - y(v))} fill={color} opacity={0.85} rx={2} />
                  <text x={Math.round((bx + w / 2) * 100) / 100} y={y(v) - 3} textAnchor="middle" fontSize={9} fill="#8a93a8">
                    {br(v, v >= 10 ? 0 : 1)}
                  </text>
                  <text x={Math.round((bx + w / 2) * 100) / 100} y={H - PAD.b + 14} textAnchor="middle" fontSize={9.5} fill="#5a6275">
                    {i - 6 >= 0 ? `+${i - 6}` : i - 6}
                  </text>
                </g>
              );
            })}
            <text x={PAD.l + iw / 2} y={H - 4} textAnchor="middle" fontSize={11} fill="#8a93a8">
              meses em relação ao plano
            </text>
          </svg>
          <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <div className="text-xs font-semibold tracking-wide text-faint uppercase">O que fez</div>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-muted">
                {p.medidas.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs font-semibold tracking-wide text-faint uppercase">Quando · quem · moeda</div>
              <p className="mt-1 text-muted">
                {p.quando}. {p.governo}. {p.moeda}.
              </p>
            </div>
          </div>
        </Panel>
        <div className="grid content-start gap-3">
          <Stat label="Média 6 meses antes" value={`${pct(antes)} a.m.`} tone="bad" hint={`≈ ${br(anual(antes), 0)}% ao ano`} />
          <Stat label="Média 3 meses depois" value={`${pct(depois3)} a.m.`} tone="good" hint={`≈ ${br(anual(depois3), 0)}% ao ano`} />
          <Stat label="12 meses depois" value={`${pct(fim)} a.m.`} tone={fim > 10 ? "bad" : fim > 3 ? "warn" : "good"} hint={fim > antes * 0.6 ? "a inflação voltou" : "a queda se manteve"} />
          <Stat
            label="IPCA anual: ano antes → ano seguinte"
            value={`${br(DATA.ipca[p.ano - 1] ?? 0, 0)}% → ${br(DATA.ipca[p.ano + 1] ?? 0, 0)}%`}
            tone={p.ok ? "good" : "bad"}
          />
        </div>
      </div>
      <Callout tone={p.ok ? "ok" : "bad"}>{p.resultado}</Callout>
      <p className="font-mono text-xs text-faint">inflação anual equivalente = (1 + π_mensal)¹² − 1 · inércia: πₜ ≈ πₜ₋₁ quando contratos são reajustados pela inflação passada</p>
      <p className="text-xs text-faint">
        Experimente: compare o Cruzado com o Real — os dois derrubam a inflação no mês seguinte, mas só um mantém as barras verdes 12 meses depois. Valores mensais aproximados.
      </p>
    </div>
  );
}
