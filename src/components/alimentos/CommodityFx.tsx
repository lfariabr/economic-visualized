"use client";

import { useState } from "react";
import { Callout, Controls, Panel, Segmented, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { COMMODITIES, exportParity } from "./foodModel";
import { brl, nf, spct } from "./fmtBR";

const FX0 = 5.4;

export function CommodityFx() {
  const [id, setId] = useState("arroz");
  const [fx, setFx] = useState(FX0);
  const [ext, setExt] = useState(0);
  const c = COMMODITIES.find((x) => x.id === id) ?? COMMODITIES[0];
  const usd = c.usd * (1 + ext / 100);
  const base = exportParity(c.usd, FX0, c.freight);
  const now = exportParity(usd, fx, c.freight);
  const dDom = (now / base - 1) * 100;
  const dRetail = dDom * c.retailShare;

  const fxs = Array.from({ length: 31 }, (_, i) => 4 + i * 0.1);
  const series = [
    { id: "now", label: `US$ ${nf(usd, 1)} lá fora`, color: "#f59e0b", points: fxs.map((e) => [e, exportParity(usd, e, c.freight)] as [number, number]) },
    { id: "base", label: `US$ ${nf(c.usd, 1)} (base)`, color: "#8a93a8", dashed: true, points: fxs.map((e) => [e, exportParity(c.usd, e, c.freight)] as [number, number]) },
  ];

  return (
    <div className="space-y-3">
      <Controls>
        <Segmented value={id} options={COMMODITIES.map((x) => ({ value: x.id, label: x.label }))} onChange={setId} />
        <Slider label="Dólar (R$/US$)" value={fx} min={4} max={7} step={0.05} onChange={setFx} format={(v) => nf(v, 2)} className="w-full sm:w-72" />
        <Slider label="Preço internacional" value={ext} min={-40} max={60} step={5} onChange={setExt} format={(v) => spct(v, 0)} className="w-full sm:w-72" />
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Panel title={`${c.label}: preço no Brasil (R$ por ${c.unit})`}>
          <LineChart
            series={series}
            xDomain={[4, 7]}
            yDomain={[0, Math.max(...series.flatMap((s) => s.points.map((p) => p[1]))) * 1.1]}
            xLabel="dólar (R$/US$)"
            yLabel={`R$ / ${c.unit}`}
            height={280}
            markers={[{ x: fx, label: `R$ ${nf(fx, 2)}`, color: "#e7e9f0" }]}
            dots={[{ x: fx, y: now, color: "#f59e0b", label: brl(now, 0) }]}
            xFormat={(v) => nf(v, 1)}
            yFormat={(v) => nf(v, 0)}
          />
          <p className="mt-2 font-mono text-[11px] text-faint">preço interno ≈ preço internacional (US$) × câmbio − frete até o porto (paridade de exportação)</p>
        </Panel>
        <div className="grid grid-cols-2 content-start gap-3 lg:grid-cols-1">
          <Stat label="Paridade de exportação" value={brl(now, 0)} hint={`por ${c.unit}`} />
          <Stat label="Variação no campo" value={spct(dDom)} tone={dDom > 10 ? "bad" : dDom < -10 ? "good" : "neutral"} hint="vs. US$ base e R$ 5,40" />
          <Stat label={`Efeito no ${c.retailName}`} value={spct(dRetail)} tone={dRetail > 5 ? "bad" : dRetail < -5 ? "good" : "neutral"} hint={`matéria-prima ≈ ${nf(c.retailShare * 100, 0)}% do preço final`} />
          <Stat label="Receita do exportador" value={spct(dDom)} tone={dDom > 0 ? "good" : dDom < 0 ? "bad" : "neutral"} hint="em reais" />
        </div>
      </div>
      <Callout tone="info">
        Por que o Brasil exporta comida e o arroz fica caro? Porque o produtor pode vender lá fora por {brl(now, 0)}. Se o mercado interno pagar menos, a
        safra sai pelo porto até o preço daqui encostar na paridade. Dólar alto é boa notícia para quem exporta e má notícia para quem enche o carrinho — é
        o mesmo preço visto dos dois lados do balcão.
      </Callout>
      <p className="text-xs text-faint">
        Experimente: escolha “Café arábica”, suba o preço internacional para +50% e o dólar para R$ 6,20 (como em 2024–25) — veja quanto o café no mercado
        precisaria subir.
      </p>
    </div>
  );
}
