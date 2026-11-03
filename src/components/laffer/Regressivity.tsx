"use client";

import { useState } from "react";
import { Callout, Controls, Panel, Segmented, Slider, Stat } from "@/components/ui";
import { incidence, policyCost } from "./incidenceModel";
import { brl, num, pct } from "./fmt";

const W = 560;
const H = 260;
const P = { l: 40, r: 10, t: 16, b: 34 };
const r2 = (v: number) => Math.round(v * 100) / 100;

export function Regressivity() {
  const [aliq, setAliq] = useState(22);
  const [isenta, setIsenta] = useState<"sim" | "nao">("nao");
  const [cashback, setCashback] = useState(0);
  const [view, setView] = useState<"pct" | "rs">("pct");
  const p = { aliq: aliq / 100, isentaCesta: isenta === "sim", cashback: cashback / 100 };
  const rows = incidence(p);
  const cost = policyCost(p);

  const ymax = view === "pct" ? 40 : Math.max(20, ...rows.map((r) => r.beneficio)) * 1.1;
  const iw = W - P.l - P.r;
  const ih = H - P.t - P.b;
  const bw = iw / 10;
  const Y = (v: number) => r2(P.t + ih - (Math.min(v, ymax) / ymax) * ih);
  const ticks = view === "pct" ? [0, 10, 20, 30, 40] : [0, ymax / 4, ymax / 2, (3 * ymax) / 4].map((v) => Math.round(v));

  return (
    <div className="space-y-3">
      <Controls>
        <Slider className="min-w-52 flex-1" label="Alíquota sobre consumo" value={aliq} min={5} max={35} step={1} onChange={setAliq} format={(v) => pct(v, 0)} />
        <div className="flex items-center gap-2 text-muted">
          Cesta básica isenta
          <Segmented value={isenta} onChange={setIsenta} options={[{ value: "nao", label: "não" }, { value: "sim", label: "sim" }]} />
        </div>
        <Slider className="min-w-52 flex-1" label="Cashback p/ 30% mais pobres" value={cashback} min={0} max={100} step={5} onChange={setCashback} format={(v) => pct(v, 0)} />
        <Segmented value={view} onChange={setView} options={[{ value: "pct", label: "% da renda" }, { value: "rs", label: "benefício R$/mês" }]} />
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <Panel title={view === "pct" ? "Imposto pago, % da renda, por décimo" : "Quanto cada décimo ganha com a política (R$/mês por pessoa)"}>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
            {ticks.map((t) => (
              <g key={t}>
                <line x1={P.l} x2={W - P.r} y1={Y(t)} y2={Y(t)} stroke="#242a38" />
                <text x={P.l - 6} y={Y(t) + 3.5} textAnchor="end" fontSize={10.5} fill="#5a6275">
                  {view === "pct" ? `${t}%` : num(t, 0)}
                </text>
              </g>
            ))}
            {rows.map((r, i) => {
              const x = r2(P.l + i * bw + bw * 0.15);
              const w = r2(bw * 0.7);
              if (view === "rs") {
                return (
                  <g key={i}>
                    <rect x={x} y={Y(r.beneficio)} width={w} height={r2(Y(0) - Y(r.beneficio))} fill={i < 3 ? "#34d399" : "#8a93a8"} opacity={0.85} />
                    <text x={x + w / 2} y={Y(r.beneficio) - 4} textAnchor="middle" fontSize={10} fill="#8a93a8">{num(r.beneficio, 0)}</text>
                    <text x={x + w / 2} y={H - P.b + 14} textAnchor="middle" fontSize={10.5} fill="#5a6275">{r.decil}º</text>
                  </g>
                );
              }
              const yc = Y(r.pctConsumo);
              const yt = Y(r.pctTotal);
              return (
                <g key={i}>
                  <rect x={x} y={yc} width={w} height={r2(Y(0) - yc)} fill="#f87171" opacity={0.85} />
                  <rect x={x} y={yt} width={w} height={r2(yc - yt)} fill="#60a5fa" opacity={0.85} />
                  <text x={x + w / 2} y={yt - 4} textAnchor="middle" fontSize={10} fill="#8a93a8">{num(r.pctTotal, 0)}</text>
                  <text x={x + w / 2} y={H - P.b + 14} textAnchor="middle" fontSize={10.5} fill="#5a6275">{r.decil}º</text>
                </g>
              );
            })}
            <text x={P.l + iw / 2} y={H - 4} textAnchor="middle" fontSize={11} fill="#8a93a8">décimo de renda (1º = 10% mais pobres)</text>
          </svg>
          {view === "pct" && (
            <div className="mt-1 flex gap-4 text-xs text-muted">
              <span><span className="mr-1 inline-block size-2.5 rounded-sm bg-bad/80" />impostos sobre consumo</span>
              <span><span className="mr-1 inline-block size-2.5 rounded-sm bg-info/80" />imposto de renda</span>
            </div>
          )}
        </Panel>
        <div className="grid content-start gap-2">
          <Stat label="1º décimo paga" value={pct(rows[0].pctTotal, 1)} tone={rows[0].pctTotal > rows[9].pctTotal ? "bad" : "good"} hint="da renda" />
          <Stat label="10º décimo paga" value={pct(rows[9].pctTotal, 1)} hint="da renda" />
          <Stat label="Custo da política" value={pct(cost.custoPct, 1)} hint="da arrecadação sobre consumo" />
          <Stat label="Benefício que chega aos 30% mais pobres" value={pct(cost.focoPobres, 0)} tone={cost.focoPobres > 50 ? "good" : cost.custoPct > 0 ? "warn" : "neutral"} />
          <Stat label="Alíquota para repor a receita" value={pct(cost.aliqNeutra * 100, 1)} />
          <div className="text-[11px] text-faint">renda do 1º décimo ≈ {brl(rows[0].renda, 0)}/mês · 10º ≈ {brl(rows[9].renda, 0)}/mês (aprox.)</div>
        </div>
      </div>
      <Callout tone={rows[0].pctTotal > rows[9].pctTotal ? "bad" : "ok"}>
        Quem ganha pouco gasta toda a renda e paga imposto sobre consumo em tudo; quem ganha muito poupa parte e paga, em
        proporção, menos. Isentar a cesta básica ajuda os pobres, mas dá ainda mais reais para os ricos, que também compram comida.
        O cashback da Reforma Tributária (EC 132/2023) mira só quem está no CadÚnico: custa menos por real que chega aos pobres.
      </Callout>
      <p className="font-mono text-[11px] text-faint">imposto/renda = alíquota × (consumo/renda) − devolução + IR efetivo</p>
      <p className="text-xs text-faint">
        Experimente: ligue “cesta básica isenta” e mude a visão para “benefício R$/mês” — o 10º décimo ganha mais. Depois desligue e ponha cashback em 100%: custa cerca de metade e quase todo o benefício chega aos 30% mais pobres.
      </p>
    </div>
  );
}
