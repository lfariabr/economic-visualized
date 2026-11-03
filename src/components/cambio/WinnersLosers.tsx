"use client";

import { useState } from "react";
import { Controls, Panel, Slider, Stat } from "@/components/ui";
import { E0, winners } from "./fxModel";
import { brl, nf, spct } from "./fmtBR";

export function WinnersLosers() {
  const [E, setE] = useState(6.2);
  const rows = winners(E);
  const lim = 100;

  return (
    <div className="space-y-3">
      <Controls>
        <Slider label="Dólar" value={E} min={4} max={7.5} step={0.05} onChange={setE} format={(v) => `R$ ${nf(v, 2)}`} className="w-full sm:w-96" />
        <span className="text-xs text-faint">comparação com R$ 5,40</span>
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Panel title={`Quem ganha e quem perde com o dólar a R$ ${nf(E, 2)}`}>
          <div className="space-y-2.5">
            {rows.map((r) => {
              const good = r.goodWhenUp ? r.value > 0.05 : r.value < -0.05;
              const bad = r.goodWhenUp ? r.value < -0.05 : r.value > 0.05;
              const color = good ? "#34d399" : bad ? "#f87171" : "#5a6275";
              const w = Math.round((Math.min(lim, Math.abs(r.value)) / lim) * 5000) / 100;
              return (
                <div key={r.id} className="grid grid-cols-[minmax(110px,190px)_1fr_auto] items-center gap-3 text-sm">
                  <div className="min-w-0 truncate text-muted" title={r.label}>
                    {r.label}
                  </div>
                  <div className="relative h-5 rounded bg-panel-2">
                    <div className="absolute inset-y-0 left-1/2 w-px bg-line" />
                    <div
                      className="absolute inset-y-0 rounded transition-all duration-300"
                      style={{ background: color, width: `${w}%`, left: r.value >= 0 ? "50%" : `${50 - w}%` }}
                    />
                  </div>
                  <div className="w-24 text-right font-mono text-xs tabular-nums" style={{ color }}>
                    {spct(r.value, 0)}
                    <div className="text-[10px] text-faint">{r.note}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-3 font-mono text-[11px] text-faint">
            exportador: receita × E, 35% do custo dolarizado · importador: custo × E, repassa metade · repasse ao IPCA ≈ 0,1 · barras limitadas a ±100%
          </p>
        </Panel>
        <div className="grid grid-cols-2 content-start gap-3 lg:grid-cols-1">
          <Stat label="Viagem a Orlando (US$ 3.000)" value={brl(3000 * E, 0)} tone={E > E0 ? "bad" : "good"} />
          <Stat label="Saca de soja (US$ 23)" value={brl(23 * E, 0)} tone={E > E0 ? "good" : "bad"} />
          <Stat label="iPhone (US$ 1.000 + impostos)" value={brl(1000 * E * 1.6, 0)} tone={E > E0 ? "bad" : "good"} />
          <Stat label="Reservas do BC (US$ 340 bi)" value={`R$ ${nf((340 * E) / 1000, 2)} tri`} hint="lucro/prejuízo cambial vai ao Tesouro" />
        </div>
      </div>
      <p className="text-xs text-faint">
        Experimente: arraste o dólar de R$ 4 até R$ 7 e observe as barras trocarem de cor — não existe câmbio “bom para todos”, só câmbio bom para alguém.
        Exposições estilizadas.
      </p>
    </div>
  );
}
