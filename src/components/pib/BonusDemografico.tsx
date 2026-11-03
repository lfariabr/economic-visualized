"use client";

import { useEffect, useState } from "react";
import { LineChart } from "@/components/viz/Chart";
import { Button, Callout, Controls, Panel, Slider, Stat } from "@/components/ui";
import { useTicker } from "@/lib/useTicker";
import { br } from "./num";
import { DEMOGRAFIA, interp } from "./pibModel";

const Y0 = 1960;
const Y1 = 2070;
const YEARS = Array.from({ length: Y1 - Y0 + 1 }, (_, i) => Y0 + i);
/** RGPS-like pension spending scale: 2020 ≈ 8% do PIB with 9,5% idosos / 70% PIA */
const PREV_K = 8 / (9.5 / 70);

/** Working-age share rising then falling; contribution to growth and to pension spending. */
export function BonusDemografico() {
  const [year, setYear] = useState(2025);
  const [prod, setProd] = useState(1);
  const [gener, setGener] = useState(1);
  const ticker = useTicker(() => setYear((y) => Math.min(Y1, y + 1)), { speed: 0.2 });
  const { running, pause } = ticker;
  useEffect(() => {
    if (running && year >= Y1) pause();
  }, [running, year, pause]);

  const pia = (y: number) => interp(DEMOGRAFIA, "pia", y);
  const idosos = (y: number) => interp(DEMOGRAFIA, "idosos", y);
  const demog = (y: number) => (Math.log(pia(y + 5) / pia(y - 5)) / 10) * 100;
  const prev = (y: number) => {
    const base = PREV_K * (idosos(y) / pia(y));
    // a partir de hoje a "generosidade" escala os benefícios novos
    return y <= 2025 ? base : base * (1 - (1 - gener) * Math.min(1, (y - 2025) / 25));
  };
  const ratio = pia(year) / idosos(year);
  const cur = demog(year);
  const past = YEARS.filter((y) => y <= year);

  return (
    <div className="space-y-3">
      <Controls>
        <Button
          variant="primary"
          onClick={() => {
            setYear(Y0);
            ticker.play();
          }}
        >
          ▶ 1960 → 2070
        </Button>
        <Slider label="Ano" value={year} min={Y0} max={Y1} step={1} onChange={setYear} format={(v) => String(v)} className="min-w-[220px] flex-1" />
        <Slider label="Produtividade por trabalhador" value={prod} min={0} max={3} step={0.1} onChange={setProd} format={(v) => `${br(v, 1)}% a.a.`} className="min-w-[240px] flex-1" />
      </Controls>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="População por idade (% do total) — IBGE, estilizado">
          <LineChart
            series={[
              { id: "pia", label: "15–64 anos (idade ativa)", color: "#e879f9", points: YEARS.map((y) => [y, pia(y)]) },
              { id: "id", label: "65+ anos", color: "#fbbf24", points: YEARS.map((y) => [y, idosos(y)]) },
            ]}
            xDomain={[Y0, Y1]}
            yDomain={[0, 80]}
            height={240}
            xFormat={(v) => String(v)}
            yFormat={(v) => `${br(v, 0)}%`}
            markers={[{ x: year, label: String(year), color: "#e7e9f0" }]}
            bands={[{ from: 1970, to: 2025, color: "#34d399", label: "bônus" }, { from: 2025, to: Y1, color: "#f87171", label: "ônus" }]}
            dots={[
              { x: year, y: pia(year), color: "#e879f9" },
              { x: year, y: idosos(year), color: "#fbbf24" },
            ]}
          />
        </Panel>
        <Panel title="Crescimento do PIB per capita (% a.a.)">
          <LineChart
            series={[
              { id: "tot", label: "total = produtividade + demografia", color: "#4ade80", points: past.map((y) => [y, prod + demog(y)]) },
              { id: "dem", label: "contribuição da demografia", color: "#e879f9", points: past.map((y) => [y, demog(y)]) },
            ]}
            xDomain={[Y0, Y1]}
            yDomain={[-1, Math.max(3.5, prod + 1.2)]}
            height={240}
            xFormat={(v) => String(v)}
            yFormat={(v) => br(v, 1)}
            hMarkers={[{ y: 0, color: "#8a93a8" }]}
          />
          <div className="mt-2 font-mono text-[11px] text-faint">
            g(PIB per capita) ≈ g(produto por trabalhador) + Δln(PIA / população)
          </div>
        </Panel>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <Panel title="Gasto previdenciário (RGPS, % do PIB) — mesma regra de benefício de hoje">
          <Slider label="Generosidade dos benefícios novos" value={gener} min={0.5} max={1} step={0.05} onChange={setGener} format={(v) => `${br(v * 100, 0)}%`} className="mb-2" />
          <LineChart
            series={[{ id: "prev", label: "gasto", color: "#fbbf24", area: true, points: YEARS.filter((y) => y >= 1980).map((y) => [y, prev(y)]) }]}
            xDomain={[1980, Y1]}
            yDomain={[0, 32]}
            height={200}
            xFormat={(v) => String(v)}
            yFormat={(v) => `${br(v, 0)}%`}
            markers={[{ x: year, color: "#e7e9f0" }]}
            hMarkers={[{ y: 8, label: "hoje ~8%", color: "#8a93a8" }]}
          />
          <div className="mt-2 font-mono text-[11px] text-faint">gasto ≈ k · (idosos / pessoas em idade ativa) · generosidade</div>
        </Panel>
        <div className="grid content-start gap-2">
          <Stat label="Idade ativa (15–64)" value={`${br(pia(year), 1)}%`} hint={String(year)} />
          <Stat label="Bônus no crescimento" value={`${cur >= 0 ? "+" : ""}${br(cur, 2)} p.p.`} tone={cur < 0 ? "bad" : "good"} hint={cur < 0 ? "a demografia agora freia" : "a demografia empurra"} />
          <Stat label="Pessoas em idade ativa por idoso" value={br(ratio, 1)} tone={ratio < 4 ? "bad" : ratio < 7 ? "warn" : "good"} hint="era ~17 em 1970" />
          <Stat label="Gasto previdenciário" value={`${br(prev(year), 1)}% PIB`} tone={prev(year) > 12 ? "bad" : "neutral"} />
        </div>
      </div>
      <Callout tone="info">
        Entre 1970 e ~2025 a fatia em idade ativa subiu de 54% para 70%: mais gente trabalhando por habitante empurrou o PIB per capita sem
        esforço de produtividade. A janela está se fechando: a fatia já parou de subir e, a partir dos anos 2030, cai cada vez mais rápido — a demografia passa a subtrair, e o número de pessoas em idade ativa por idoso
        cai de ~7 para ~2 — por isso a reforma da Previdência (2019) e por isso o crescimento futuro depende quase só de produtividade.
      </Callout>
      <p className="text-xs text-faint">
        Experimente: aperte ▶ e veja a linha rosa cruzar o zero por volta de 2025 e afundar nos anos 2030; depois zere a produtividade — sem ela, o PIB per capita
        brasileiro passa a cair só pela demografia.
      </p>
    </div>
  );
}
