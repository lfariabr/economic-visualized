"use client";

import { useState } from "react";
import { Button, Controls, Panel, Slider, Stat } from "@/components/ui";
import { INCOME_GROUPS, basketInflation, type IncomeId } from "./inflacaoModel";
import { br, pct } from "./num";

type Vars = Record<IncomeId, number>;
const PRESETS: { label: string; v: Vars }[] = [
  { label: "Alimentos e energia sobem", v: { alim: 12, hab: 10, transp: 6, saude: 4, serv: 4 } },
  { label: "Serviços sobem, comida cai", v: { alim: -2, hab: 4, transp: 4, saude: 8, serv: 7 } },
  { label: "Combustível dispara", v: { alim: 4, hab: 4, transp: 20, saude: 4, serv: 4 } },
  { label: "Tudo igual (4%)", v: { alim: 4, hab: 4, transp: 4, saude: 4, serv: 4 } },
];

export function IncomeInflation() {
  const [vars, setVars] = useState<Vars>(PRESETS[0].v);
  const pobre = basketInflation(vars, "pobre");
  const rico = basketInflation(vars, "rico");
  const gap = pobre - rico;
  const max = Math.max(30, ...INCOME_GROUPS.map((g) => g.pobre), ...INCOME_GROUPS.map((g) => g.rico));

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0 space-y-3">
        <Controls>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Button key={p.label} className="text-xs" onClick={() => setVars(p.v)}>
                {p.label}
              </Button>
            ))}
          </div>
        </Controls>
        <Panel title="Peso de cada grupo no orçamento e inflação do grupo">
          <div className="space-y-3">
            {INCOME_GROUPS.map((g) => (
              <div key={g.id} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-center">
                <Slider label={g.label} value={vars[g.id]} min={-5} max={25} step={0.5} onChange={(v) => setVars({ ...vars, [g.id]: v })} format={(v) => pct(v)} />
                <div className="space-y-1 text-[11px]">
                  {(["pobre", "rico"] as const).map((who) => (
                    <div key={who} className="flex items-center gap-2">
                      <span className="w-20 shrink-0 text-faint">{who === "pobre" ? "renda baixa" : "renda alta"}</span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded bg-panel-2">
                        <div className="h-full rounded" style={{ width: `${Math.round((g[who] / max) * 10000) / 100}%`, background: who === "pobre" ? "#fb923c" : "#60a5fa" }} />
                      </div>
                      <span className="w-8 text-right font-mono tabular-nums">{g[who]}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <p className="font-mono text-xs text-muted">inflação sentida = Σ peso no orçamento × inflação do grupo</p>
        <p className="text-xs text-faint">
          Experimente: “Alimentos e energia sobem” pesa muito mais para quem ganha pouco; “Serviços sobem, comida cai” inverte o sinal.
          A mesma inflação oficial esconde experiências bem diferentes.
        </p>
      </div>
      <div className="grid content-start gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <Stat label="Inflação da renda baixa" value={pct(pobre, 2)} tone={gap > 0.5 ? "bad" : "neutral"} />
        <Stat label="Inflação da renda alta" value={pct(rico, 2)} tone={gap < -0.5 ? "bad" : "neutral"} />
        <Stat label="Diferença" value={`${gap >= 0 ? "+" : ""}${br(gap, 2)} p.p.`} hint={gap >= 0 ? "pesa mais para os mais pobres" : "pesa mais para os mais ricos"} tone={Math.abs(gap) > 1 ? "warn" : "neutral"} />
        <p className="text-xs leading-relaxed text-faint">
          Pesos ilustrativos, inspirados no Indicador de Inflação por Faixa de Renda do Ipea, que calcula a inflação de seis faixas a partir
          dos microdados do IPCA.
        </p>
      </div>
    </div>
  );
}
