"use client";

import { useState } from "react";
import { Button, Controls, Panel, Segmented, Slider, Stat } from "@/components/ui";
import { CHAIN_BASE, CHAIN_PROFILES, chain, type ChainInputs } from "./foodModel";
import { brl, nf, pct, spct } from "./fmtBR";

const COLORS: Record<string, string> = {
  campo: "#a3e635",
  fert: "#2dd4bf",
  diesel: "#fb923c",
  frete: "#f59e0b",
  industria: "#a78bfa",
  margem: "#60a5fa",
  impostos: "#f87171",
};

export function CostChain() {
  const [pid, setPid] = useState("arroz");
  const [x, setX] = useState<ChainInputs>(CHAIN_BASE);
  const prof = CHAIN_PROFILES.find((p) => p.id === pid) ?? CHAIN_PROFILES[0];
  const now = chain(prof, x);
  const base = chain(prof, CHAIN_BASE);
  const d = (now.price / base.price - 1) * 100;
  const up = (k: keyof ChainInputs) => (v: number) => setX((s) => ({ ...s, [k]: v }));
  // elasticidade do preço final ao dólar: Δ% preço por +10% no dólar
  const fxUp = chain(prof, { ...x, fx: x.fx * 1.1 });
  const fxEl = (fxUp.price / now.price - 1) * 100;
  const max = Math.max(now.price, base.price);

  const bar = (r: ReturnType<typeof chain>, label: string) => (
    <div>
      <div className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="font-mono tabular-nums text-ink">{brl(r.price)}</span>
      </div>
      <div className="flex h-8 overflow-hidden rounded bg-panel-2" style={{ width: `${Math.round((r.price / max) * 10000) / 100}%` }}>
        {r.parts.map((p) => (
          <div key={p.id} title={`${p.label}: ${brl(p.value)}`} className="h-full transition-[width] duration-300" style={{ width: `${Math.round((p.value / r.price) * 10000) / 100}%`, background: COLORS[p.id] }} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <Controls>
        <Segmented value={pid} options={CHAIN_PROFILES.map((p) => ({ value: p.id, label: p.label }))} onChange={setPid} />
        <Slider label="Dólar" value={x.fx} min={4} max={7.5} step={0.05} onChange={up("fx")} format={(v) => `R$ ${nf(v, 2)}`} className="w-full sm:w-64" />
        <Slider label="Adubo/trigo (índice US$)" value={x.fertIdx} min={50} max={250} step={5} onChange={up("fertIdx")} format={(v) => nf(v, 0)} className="w-full sm:w-64" />
        <Slider label="Diesel (R$/L)" value={x.diesel} min={4} max={10} step={0.1} onChange={up("diesel")} format={(v) => brl(v, 2)} className="w-full sm:w-64" />
        <Slider label="Margem atacado+varejo" value={x.margin} min={0.1} max={0.6} step={0.01} onChange={up("margin")} format={(v) => pct(v * 100, 0)} className="w-full sm:w-64" />
        <Slider label="Impostos no preço" value={x.tax} min={0} max={0.3} step={0.01} onChange={up("tax")} format={(v) => pct(v * 100, 0)} className="w-full sm:w-64" />
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setX({ ...CHAIN_BASE, fx: 5.4, fertIdx: 230, diesel: 7.5 })}>Guerra na Ucrânia (2022)</Button>
          <Button onClick={() => setX({ ...CHAIN_BASE, tax: 0 })}>Desoneração da cesta</Button>
          <Button variant="ghost" onClick={() => setX(CHAIN_BASE)}>
            Base
          </Button>
        </div>
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Panel title={`Do campo à gôndola · ${prof.label} (R$ por ${prof.unit})`}>
          <div className="space-y-4">
            {bar(base, "base (dólar R$ 5,40, diesel R$ 6,20)")}
            {bar(now, "cenário atual")}
          </div>
          <div className="mt-4 grid gap-1.5 text-sm sm:grid-cols-2">
            {now.parts.map((p, i) => {
              const b = base.parts[i].value;
              const dd = (p.value / b - 1) * 100;
              return (
                <div key={p.id} className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2 text-muted">
                    <span className="size-2.5 shrink-0 rounded-sm" style={{ background: COLORS[p.id] }} />
                    <span className="truncate">{p.label}</span>
                  </span>
                  <span className={`font-mono text-xs tabular-nums ${dd > 1 ? "text-bad" : dd < -1 ? "text-ok" : "text-faint"}`}>
                    {brl(p.value)} {Math.abs(dd) > 0.5 ? `(${spct(dd, 0)})` : ""}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 font-mono text-[11px] text-faint">
            custo = campo + fert.·(E/5,40)·índice + diesel + frete·(0,4 + 0,6·diesel/6,20) + indústria · preço = custo·(1 + margem) ÷ (1 − impostos)
          </p>
        </Panel>
        <div className="grid grid-cols-2 content-start gap-3 lg:grid-cols-1">
          <Stat label="Preço na gôndola" value={brl(now.price)} />
          <Stat label="vs. base" value={spct(d)} tone={d > 10 ? "bad" : d > 3 ? "warn" : d < -3 ? "good" : "neutral"} />
          <Stat label="Dólar +10% ⇒ preço" value={spct(fxEl)} hint="repasse via fertilizante" />
          <Stat label="Parte do produtor rural" value={pct(((now.parts[0].value + now.parts[1].value + now.parts[2].value) / now.price) * 100, 0)} hint="do preço final" />
        </div>
      </div>
      <p className="text-xs text-faint">
        Experimente: compare “Arroz” e “Pão francês” com o dólar a R$ 7 — no pão, a maior parte do preço é padaria, energia e imposto, e o choque cambial chega diluído.
        Depois clique em “Guerra na Ucrânia”: fertilizante e diesel juntos sobem o arroz bem mais que o dólar sozinho.
      </p>
    </div>
  );
}
