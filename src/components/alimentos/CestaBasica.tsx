"use client";

import { useState } from "react";
import { Button, Callout, Controls, Panel, Slider, Stat } from "@/components/ui";
import { Bars } from "@/components/viz/Chart";
import { BASKET, basketStats } from "./foodModel";
import { brl, nf, pct } from "./fmtBR";

const base = Object.fromEntries(BASKET.map((b) => [b.id, b.price])) as Record<string, number>;
const SM0 = 1518;

const SHOCKS = [
  { label: "Café +50% (2025)", id: "cafe", mult: 1.5 },
  { label: "Carne +20% (ciclo do boi)", id: "carne", mult: 1.2 },
  { label: "Tomate +80% (chuvas)", id: "tomate", mult: 1.8 },
  { label: "Arroz +40% (enchentes RS 2024)", id: "arroz", mult: 1.4 },
];

export function CestaBasica() {
  const [prices, setPrices] = useState<Record<string, number>>(base);
  const [wage, setWage] = useState(SM0);
  const st = basketStats(prices, wage);
  const set = (id: string, v: number) => setPrices((p) => ({ ...p, [id]: v }));
  const share = st.shareNet * 100;
  const color = (id: string) => (Math.abs((prices[id] ?? 0) - base[id]) > 0.001 ? "#f87171" : "#f59e0b");

  return (
    <div className="space-y-3">
      <Controls>
        <Slider label="Salário mínimo" value={wage} min={1000} max={3000} step={10} onChange={setWage} format={(v) => brl(v, 0)} className="w-full sm:w-80" />
        <div className="flex flex-wrap gap-2">
          {SHOCKS.map((s) => (
            <Button key={s.id} onClick={() => set(s.id, Math.round(base[s.id] * s.mult * 10) / 10)}>
              {s.label}
            </Button>
          ))}
          <Button variant="ghost" onClick={() => (setPrices(base), setWage(SM0))}>
            Restaurar
          </Button>
        </div>
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Panel title="Cesta básica (13 itens, quantidades DIEESE · São Paulo)">
          <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {BASKET.map((b) => (
              <Slider
                key={b.id}
                label={<span className="inline-block w-28 truncate">{b.label} <span className="text-faint">{nf(b.qty, b.qty % 1 ? 2 : 0)} {b.unit}</span></span>}
                value={prices[b.id]}
                min={Math.round(b.price * 0.4 * 10) / 10}
                max={b.max}
                step={0.1}
                onChange={(v) => set(b.id, v)}
                format={(v) => brl(v, 2)}
              />
            ))}
          </div>
          <div className="mt-4 border-t border-line pt-4">
            <div className="mb-2 text-xs text-faint">quanto cada item pesa no custo mensal (vermelho = preço alterado)</div>
            <Bars
              rows={[...st.items].sort((a, b) => b.cost - a.cost).map((i) => ({ label: i.label, value: i.cost, color: color(i.id) }))}
              format={(v) => brl(v, 0)}
            />
          </div>
          <p className="mt-3 font-mono text-[11px] text-faint">horas = cesta ÷ SM × 220 · % SM líquido = cesta ÷ (SM × 0,925) · SM necessário = 3 × cesta ÷ 0,3571</p>
        </Panel>
        <div className="grid grid-cols-2 content-start gap-3 lg:grid-cols-1">
          <Stat label="Custo da cesta" value={brl(st.total, 2)} hint="por mês, 1 adulto" />
          <Stat label="Horas de trabalho" value={`${Math.floor(Math.round(st.hours * 60) / 60)}h${String(Math.round(st.hours * 60) % 60).padStart(2, "0")}`} tone={st.hours > 130 ? "bad" : st.hours > 110 ? "warn" : "good"} hint="jornada de 220 h/mês" />
          <Stat label="% do SM líquido" value={pct(share)} tone={share > 60 ? "bad" : share > 50 ? "warn" : "good"} hint="após 7,5% de INSS" />
          <Stat label="SM necessário (DIEESE)" value={brl(st.needed, 0)} hint={`${nf(st.needed / wage, 1)}× o mínimo atual`} />
        </div>
      </div>
      {share > 50 && (
        <Callout tone="bad">
          A comida de um adulto já consome {pct(share, 0)} do salário mínimo líquido. Numa família, sobra pouco para aluguel, transporte e luz — por isso
          alta de alimentos pesa mais para os mais pobres do que o IPCA médio sugere.
        </Callout>
      )}
      <p className="text-xs text-faint">
        Experimente: aplique os quatro choques e veja as horas de trabalho passarem de 130 — depois suba o salário mínimo até a cesta voltar para menos de
        metade dele. Preços aproximados de 2025; SM de R$ 1.518.
      </p>
    </div>
  );
}
