"use client";

import { useState } from "react";
import { Bars, LineChart } from "@/components/viz/Chart";
import { Callout, Controls, Panel, Segmented, Slider, Stat } from "@/components/ui";
import { range } from "@/lib/random";
import { num, pct } from "./fmt";

/** Multiplicadores de curto prazo sobre o PIB (aprox., Ipea 2013 e literatura; variam com o ciclo). */
const ITENS = [
  { id: "bf", label: "Bolsa Família", k: 1.78, color: "#34d399" },
  { id: "bpc", label: "BPC", k: 1.19, color: "#4ade80" },
  { id: "seg", label: "Seguro-desemprego", k: 1.06, color: "#60a5fa" },
  { id: "inv", label: "Investimento público", k: 1.5, color: "#c084fc" },
  { id: "juros", label: "Juros da dívida", k: 0.71, color: "#f87171" },
  { id: "prev", label: "Previdência (RGPS)", k: 0.52, color: "#fbbf24" },
] as const;
type ItemId = (typeof ITENS)[number]["id"];

/** fração de cada real de renda que volta a ser gasta internamente na rodada seguinte */
const Q = 0.44;
const PIB = 12700; // R$ bi, aprox. 2025
const CARGA = 0.33;

export function Multiplicador() {
  const [item, setItem] = useState<ItemId>("bf");
  const [gasto, setGasto] = useState(10);
  const [ocios, setOcios] = useState(1);

  const ciclo = 0.35 + 0.65 * ocios; // em pleno emprego, preços e Selic anulam boa parte do efeito
  const sel = ITENS.find((i) => i.id === item) ?? ITENS[0];
  const a = (k: number) => k * (1 - Q); // gasto da 1ª rodada por real transferido

  const series = ITENS.map((it) => {
    let acc = 0;
    return {
      id: it.id,
      label: it.label,
      color: it.color,
      width: it.id === item ? 3 : 1.3,
      dashed: it.id !== item,
      points: range(9).map((j) => {
        if (j > 0) acc += gasto * a(it.k) * Q ** (j - 1) * ciclo;
        return [j, acc] as [number, number];
      }),
    };
  });

  const dPib = gasto * sel.k * ciclo;
  const volta = dPib * CARGA;

  return (
    <div className="space-y-3">
      <Controls>
        <Segmented value={item} onChange={setItem} options={ITENS.map((i) => ({ value: i.id, label: i.label }))} />
        <Slider className="min-w-52 flex-1" label="Gasto extra (R$ bi)" value={gasto} min={1} max={50} onChange={setGasto} format={(v) => `R$ ${v} bi`} />
        <Slider className="min-w-52 flex-1" label="Ociosidade da economia" value={ocios * 100} min={0} max={100} step={5} onChange={(v) => setOcios(v / 100)} format={(v) => (v < 25 ? "pleno emp." : v > 75 ? "com folga" : pct(v, 0))} />
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Panel title="PIB acumulado, rodada a rodada (R$ bi)">
          <LineChart
            height={250}
            xDomain={[0, 8]}
            yDomain={[0, Math.max(5, gasto * 1.78 * 1.1)]}
            xLabel="rodada de gasto"
            xFormat={(v) => num(v, 0)}
            yFormat={(v) => num(v, 0)}
            series={series}
            hMarkers={[{ y: gasto, label: "R$ gasto pelo governo", color: "#5a6275" }]}
          />
          <div className="mt-4">
            <Bars
              max={1.78}
              format={(v) => num(v, 2)}
              rows={ITENS.map((it) => ({ label: it.label, value: it.k * ciclo, color: it.color, note: `lit.: ${num(it.k, 2)}` }))}
            />
          </div>
        </Panel>
        <div className="grid content-start gap-2">
          <Stat label="Multiplicador efetivo" value={num(sel.k * ciclo, 2)} tone={sel.k * ciclo >= 1 ? "good" : "warn"} hint="R$ de PIB por R$ gasto" />
          <Stat label="PIB adicional" value={`R$ ${num(dPib, 1)} bi`} hint={`${pct((dPib / PIB) * 100, 2)} do PIB`} />
          <Stat label="Imposto que volta" value={`R$ ${num(volta, 1)} bi`} hint="carga ~33% sobre o PIB extra" />
          <Stat label="Custo líquido" value={`R$ ${num(gasto - volta, 1)} bi`} tone={gasto - volta > 0 ? "warn" : "good"} hint="o gasto não se paga sozinho" />
        </div>
      </div>
      <Callout tone="info">
        Quem recebe Bolsa Família gasta quase tudo, e rápido, em bens produzidos aqui; quem recebe juros da dívida tende a
        poupar. Por isso o multiplicador do primeiro é maior. Mas multiplicador alto não significa “se paga”: a maior parte do
        custo continua lá, e com a economia aquecida o Banco Central reage com Selic mais alta. O efeito de longo prazo depende
        de outra coisa — capacidade produtiva (veja <a className="text-accent underline" href="/pib">/pib</a>).
      </Callout>
      <p className="font-mono text-[11px] text-faint">
        ΔPIB = G · a · (1 + q + q² + …) = G · a/(1 − q) = G · k · ciclo · q = {num(Q, 2)} · k(BF) ≈ 1,78 (Ipea, aprox.)
      </p>
      <p className="text-xs text-faint">
        Experimente: compare Bolsa Família e juros da dívida com R$ 10 bi; depois leve a ociosidade para “pleno emp.” e veja
        todos os multiplicadores encolherem — e o custo líquido continuar positivo.
      </p>
    </div>
  );
}
