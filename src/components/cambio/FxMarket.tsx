"use client";

import { useState } from "react";
import { Button, Callout, Controls, Panel, Slider, Stat } from "@/components/ui";
import { E0, FX_BASE, FX_SLOPE, fxMarket, type FxFlows } from "./fxModel";
import { nf, spct } from "./fmtBR";

const W = 600;
const H = 320;
const PAD = { l: 50, r: 16, t: 14, b: 38 };
const QD: [number, number] = [20, 60];
const ED: [number, number] = [3.5, 8];
const r2 = (v: number) => Math.round(v * 100) / 100;
const sx = (q: number) => r2(PAD.l + ((q - QD[0]) / (QD[1] - QD[0])) * (W - PAD.l - PAD.r));
const sy = (e: number) => r2(H - PAD.b - ((Math.min(ED[1] + 2, Math.max(ED[0] - 2, e)) - ED[0]) / (ED[1] - ED[0])) * (H - PAD.t - PAD.b));

const SUPPLY: { k: keyof FxFlows; label: string; max: number }[] = [
  { k: "exports", label: "Exportações", max: 45 },
  { k: "fdi", label: "Investimento direto (IDP)", max: 15 },
  { k: "portfolio", label: "Portfólio (bolsa, renda fixa)", max: 12 },
  { k: "remitIn", label: "Remessas recebidas", max: 3 },
];
const DEMAND: { k: keyof FxFlows; label: string; max: number }[] = [
  { k: "imports", label: "Importações", max: 40 },
  { k: "profits", label: "Lucros e dividendos enviados", max: 12 },
  { k: "tourism", label: "Turismo no exterior", max: 5 },
  { k: "outflow", label: "Saída de capital / hedge", max: 20 },
];

const PRESETS: { label: string; f: Partial<FxFlows> }[] = [
  { label: "Boom de commodities", f: { exports: 38, fdi: 9, portfolio: 5 } },
  { label: "Crise fiscal (fuga de capital)", f: { portfolio: -2, outflow: 14 } },
  { label: "Pandemia (2020)", f: { exports: 26, fdi: 3, portfolio: -3, outflow: 12, tourism: 0.3 } },
];

export function FxMarket() {
  const [f, setF] = useState<FxFlows>(FX_BASE);
  const eq = fxMarket(f);
  const base = fxMarket(FX_BASE);
  const dE = (eq.E / E0 - 1) * 100;
  const set = (k: keyof FxFlows) => (v: number) => setF((s) => ({ ...s, [k]: v }));
  const line = (q0: number, slope: number) => {
    // E = 5,40 + (Q − q0)/slope
    const e = (q: number) => E0 + (q - q0) / slope;
    return `M${sx(QD[0])},${sy(e(QD[0]))}L${sx(QD[1])},${sy(e(QD[1]))}`;
  };

  return (
    <div className="space-y-3">
      <Controls>
        {PRESETS.map((p) => (
          <Button key={p.label} onClick={() => setF({ ...FX_BASE, ...p.f })}>
            {p.label}
          </Button>
        ))}
        <Button variant="ghost" onClick={() => setF(FX_BASE)}>
          Base
        </Button>
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Panel title="Mercado de câmbio (US$ bi por mês)">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
            <defs>
              <clipPath id="fxm-clip">
                <rect x={PAD.l} y={PAD.t} width={W - PAD.l - PAD.r} height={H - PAD.t - PAD.b} />
              </clipPath>
            </defs>
            {[4, 5, 6, 7, 8].map((e) => (
              <g key={e}>
                <line x1={PAD.l} x2={W - PAD.r} y1={sy(e)} y2={sy(e)} stroke="#242a38" />
                <text x={PAD.l - 6} y={sy(e) + 3.5} textAnchor="end" fontSize={10.5} fill="#5a6275">
                  {nf(e, 2)}
                </text>
              </g>
            ))}
            {[20, 30, 40, 50, 60].map((q) => (
              <text key={q} x={sx(q)} y={H - PAD.b + 15} textAnchor="middle" fontSize={10.5} fill="#5a6275">
                {q}
              </text>
            ))}
            <text x={(PAD.l + W - PAD.r) / 2} y={H - 5} textAnchor="middle" fontSize={11} fill="#8a93a8">
              dólares negociados (US$ bi/mês)
            </text>
            <text transform={`translate(13 ${(PAD.t + H - PAD.b) / 2}) rotate(-90)`} textAnchor="middle" fontSize={11} fill="#8a93a8">
              R$ por US$
            </text>
            <g clipPath="url(#fxm-clip)">
              <path d={line(base.s0, FX_SLOPE.sigma)} stroke="#2dd4bf" strokeDasharray="5 4" opacity={0.45} fill="none" />
              <path d={line(base.d0, -FX_SLOPE.delta)} stroke="#f87171" strokeDasharray="5 4" opacity={0.45} fill="none" />
              <path d={line(eq.s0, FX_SLOPE.sigma)} stroke="#2dd4bf" strokeWidth={2.5} fill="none" />
              <path d={line(eq.d0, -FX_SLOPE.delta)} stroke="#f87171" strokeWidth={2.5} fill="none" />
            </g>
            <line x1={PAD.l} x2={sx(eq.Q)} y1={sy(eq.E)} y2={sy(eq.E)} stroke="#e7e9f0" strokeDasharray="3 4" opacity={0.5} />
            <circle cx={sx(eq.Q)} cy={sy(eq.E)} r={6} fill="#e7e9f0" stroke="#0a0c11" strokeWidth={1.5} />
            <text x={sx(eq.Q) + 9} y={sy(eq.E) - 8} fontSize={11.5} fill="#e7e9f0">
              R$ {nf(eq.E, 2)}
            </text>
            <text x={sx(eq.s0 + FX_SLOPE.sigma * (3.9 - E0)) - 6} y={sy(3.9)} textAnchor="end" fontSize={11} fill="#2dd4bf">
              oferta de dólares
            </text>
            <text x={sx(eq.d0 - FX_SLOPE.delta * (3.9 - E0)) + 6} y={sy(3.9)} fontSize={11} fill="#f87171">
              demanda por dólares
            </text>
          </svg>
          <p className="mt-2 font-mono text-[11px] text-faint">
            oferta = exportações + IDP + portfólio + remessas + σ·(E − 5,40) · demanda = importações + lucros + turismo + saídas − δ·(E − 5,40) · E* = 5,40 +
            (D₀ − S₀)/(σ + δ)
          </p>
        </Panel>
        <div className="grid grid-cols-2 content-start gap-3 lg:grid-cols-1">
          <Stat label="Dólar" value={`R$ ${nf(eq.E, 2)}`} tone={eq.E > 6 ? "bad" : eq.E < 4.8 ? "good" : "neutral"} hint={spct(dE) + " vs. R$ 5,40"} />
          <Stat label="Entram (a R$ 5,40)" value={`US$ ${nf(eq.s0, 1)} bi`} />
          <Stat label="Saem (a R$ 5,40)" value={`US$ ${nf(eq.d0, 1)} bi`} />
          <Stat label="Excesso de demanda" value={`US$ ${nf(eq.d0 - eq.s0, 1)} bi`} tone={eq.d0 - eq.s0 > 2 ? "bad" : eq.d0 - eq.s0 < -2 ? "good" : "neutral"} hint="o câmbio ajusta até zerar" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Quem traz dólares (oferta)">
          <div className="space-y-2">
            {SUPPLY.map((s) => (
              <Slider key={s.k} label={<span className="inline-block w-44">{s.label}</span>} value={f[s.k]} min={s.k === "portfolio" ? -5 : 0} max={s.max} step={0.5} onChange={set(s.k)} format={(v) => nf(v, 1)} />
            ))}
          </div>
        </Panel>
        <Panel title="Quem procura dólares (demanda)">
          <div className="space-y-2">
            {DEMAND.map((s) => (
              <Slider key={s.k} label={<span className="inline-block w-44">{s.label}</span>} value={f[s.k]} min={0} max={s.max} step={0.5} onChange={set(s.k)} format={(v) => nf(v, 1)} />
            ))}
          </div>
        </Panel>
      </div>
      {eq.E > 6 && (
        <Callout tone="bad">
          Saem mais dólares do que entram a R$ 5,40; o preço do dólar sobe até que importar e mandar dinheiro para fora fique caro o bastante — e exportar,
          lucrativo o bastante — para fechar a conta.
        </Callout>
      )}
      <p className="text-xs text-faint">
        Experimente: clique em “Crise fiscal” e veja o dólar subir sem que nada mude no comércio — só o capital. Depois aumente as exportações até trazer o
        câmbio de volta a R$ 5,40.
      </p>
    </div>
  );
}
