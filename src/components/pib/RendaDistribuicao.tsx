"use client";

import { useState } from "react";
import { Bars, LineChart } from "@/components/viz/Chart";
import { Callout, Controls, Panel, Segmented, Slider, Stat } from "@/components/ui";
import { br } from "./num";
import { DISTRIBUICOES, gini, lorenz, PAISES, redistribute } from "./pibModel";

type Metric = "pib" | "pc" | "ppc" | "idh";
const METRICS: { value: Metric; label: string }[] = [
  { value: "pib", label: "PIB total" },
  { value: "pc", label: "per capita (US$)" },
  { value: "ppc", label: "per capita PPC" },
  { value: "idh", label: "IDH" },
];

const val = (p: (typeof PAISES)[number], m: Metric) =>
  m === "pib" ? p.pibUsd : m === "pc" ? (p.pibUsd * 1e12) / (p.pop * 1e6) / 1000 : m === "ppc" ? p.ppcPc : p.idh;
const fmt = (v: number, m: Metric) => (m === "pib" ? `${br(v, 1)} tri` : m === "idh" ? br(v, 3) : `${br(v, 1)} mil`);

/** GDP vs GDP per capita vs PPP, and a Lorenz curve / Gini explorer. */
export function RendaDistribuicao() {
  const [m, setM] = useState<Metric>("pib");
  const [dist, setDist] = useState("brasil");
  const [transf, setTransf] = useState(0);
  const rows = [...PAISES].sort((a, b) => val(b, m) - val(a, m));
  const rank = rows.findIndex((p) => p.id === "brasil") + 1;
  const brasil = PAISES.find((p) => p.id === "brasil")!;
  const pcNominal = val(brasil, "pc");

  const deciles = redistribute(DISTRIBUICOES[dist].deciles, transf);
  const g = gini(deciles);
  const g0 = gini(DISTRIBUICOES[dist].deciles);
  const L = lorenz(deciles);
  const top10 = deciles[9];
  const bottom50 = deciles.slice(0, 5).reduce((a, b) => a + b, 0);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="min-w-0 space-y-3">
        <Controls>
          <Segmented value={m} options={METRICS} onChange={setM} />
        </Controls>
        <Panel title={`${METRICS.find((x) => x.value === m)?.label} · 2024, aprox.`}>
          <Bars
            rows={rows.map((p) => ({ label: p.label, value: val(p, m), color: p.id === "brasil" ? "#4ade80" : "#5a6275" }))}
            format={(v) => fmt(v, m)}
            max={m === "idh" ? 1 : undefined}
          />
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Stat label="Brasil no ranking" value={`${rank}º de ${PAISES.length}`} tone={rank <= 3 ? "good" : rank >= 7 ? "warn" : "neutral"} />
            <Stat label="Per capita" value={`US$ ${br(pcNominal, 1)} mil`} hint="nominal, câmbio de mercado" />
            <Stat label="PPC / nominal" value={`${br(brasil.ppcPc / pcNominal, 1)}×`} hint="vida mais barata em R$" />
          </div>
          <div className="mt-2 font-mono text-[11px] text-faint">per capita = PIB / população · PPC = mesma cesta de bens comparada a preços locais</div>
        </Panel>
      </div>
      <div className="min-w-0 space-y-3">
        <Controls>
          <Segmented
            value={dist}
            options={Object.entries(DISTRIBUICOES).map(([value, d]) => ({ value, label: d.label }))}
            onChange={(v) => {
              setDist(v);
              setTransf(0);
            }}
          />
          <Slider label="Transferir do 10% mais rico aos 50% mais pobres" value={transf} min={0} max={40} step={1} onChange={setTransf} format={(v) => `${v}%`} className="w-full" />
        </Controls>
        <Panel title="Curva de Lorenz">
          <LineChart
            series={[
              { id: "eq", label: "igualdade perfeita", color: "#5a6275", dashed: true, points: [[0, 0], [100, 100]] },
              { id: "l", label: DISTRIBUICOES[dist].label, color: "#e879f9", area: true, points: L },
            ]}
            xDomain={[0, 100]}
            yDomain={[0, 100]}
            height={260}
            xLabel="% da população (mais pobres → mais ricos)"
            yLabel="% da renda acumulada"
            xFormat={(v) => `${v}`}
            yFormat={(v) => `${v}`}
            dots={L.slice(1, -1).map(([x, y]) => ({ x, y, color: "#e879f9", r: 2.5 }))}
          />
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Stat label="Gini" value={br(g, 3)} tone={g > 0.5 ? "bad" : g > 0.38 ? "warn" : "good"} hint={transf ? `antes ${br(g0, 3)}` : "0 = igual, 1 = um tem tudo"} />
            <Stat label="10% mais ricos" value={`${br(top10, 1)}%`} hint="da renda total" />
            <Stat label="50% mais pobres" value={`${br(bottom50, 1)}%`} hint="da renda total" />
          </div>
          <div className="mt-2 font-mono text-[11px] text-faint">Gini = 1 − 2·(área sob a curva de Lorenz) · dados por decil aproximados (PNAD/IBGE, Banco Mundial)</div>
        </Panel>
      </div>
      <div className="lg:col-span-2">
        <Callout tone="info">
          O Brasil tem um PIB grande (top 10 do mundo) mas uma renda por pessoa média — e, em PPC, ela sobe porque serviços e comida são mais
          baratos aqui. A média ainda esconde a distribuição: com Gini perto de 0,52, os 10% mais ricos ficam com cerca de 40% da renda. Por isso o
          IDH (que junta renda, saúde e educação, Brasil ~0,76) e o Gini complementam o PIB.
        </Callout>
        <p className="mt-2 text-xs text-faint">
          Experimente: alterne entre “PIB total” e “per capita PPC” e veja o Brasil cair no ranking; depois transfira 20% da renda do topo para a
          metade mais pobre e veja o Gini brasileiro chegar perto do dos EUA.
        </p>
      </div>
    </div>
  );
}
