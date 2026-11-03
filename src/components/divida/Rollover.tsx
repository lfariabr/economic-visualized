"use client";

import { useState } from "react";
import { Callout, Controls, Panel, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { DPMFI, PIB, rolloverSim } from "./dividaModel";
import { num, pct } from "./fmt";

const YEARS = 6;
const BASE = 12;
const DEBT = 78;

export function Rollover() {
  const [short, setShort] = useState(20);
  const [selic, setSelic] = useState(47);
  const [spike, setSpike] = useState(5);
  const [duration, setDuration] = useState(2);
  const [cushion, setCushion] = useState(6);

  const common = { spike, duration, cushion, years: YEARS, base: BASE, debt: DEBT };
  const mine = rolloverSim({ ...common, short: short / 100, selic: selic / 100 });
  const longer = rolloverSim({ ...common, short: 0.08, selic: 0.1 });
  const extra = (p: typeof mine) => p.slice(1).reduce((s, y) => s + (y.cost - p[0].cost), 0);
  const extraMine = extra(mine);
  const extraLong = extra(longer);
  const vencimentos = (short / 100) * DPMFI;
  const deficitNominal = 0.08 * PIB;
  const necessidade = vencimentos + deficitNominal;

  return (
    <div className="space-y-3">
      <Controls>
        <Slider className="min-w-44 flex-1" label="Vence em 12 meses (prefixada/IPCA+)" value={short} min={5} max={40} onChange={setShort} format={(v) => pct(v, 0)} />
        <Slider className="min-w-44 flex-1" label="Atrelada à Selic" value={selic} min={0} max={70} onChange={setSelic} format={(v) => pct(v, 0)} />
        <Slider className="min-w-44 flex-1" label="Colchão de liquidez" value={cushion} min={0} max={12} onChange={setCushion} format={(v) => `${v} meses`} />
      </Controls>
      <Controls>
        <span className="text-muted">Crise de confiança:</span>
        <Slider className="min-w-44 flex-1" label="Alta dos juros" value={spike} min={0} max={10} step={0.5} onChange={setSpike} format={(v) => `+${num(v, 1)} p.p.`} />
        <Slider className="min-w-44 flex-1" label="Duração" value={duration} min={1} max={4} onChange={setDuration} format={(v) => `${v} ${v > 1 ? "anos" : "ano"}`} />
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <Panel title="Juro nominal médio pago sobre o estoque (%)">
          <LineChart
            height={260}
            xDomain={[0, YEARS]}
            yDomain={[10, 24]}
            xLabel="anos desde o início da crise"
            yFormat={(v) => `${v}%`}
            series={[
              { id: "m", label: "Sua estrutura", color: "#fb7185", width: 2.5, points: mine.map((y) => [y.year, y.avg]) },
              { id: "l", label: "Dívida longa e prefixada (8% vence, 10% Selic)", color: "#60a5fa", dashed: true, points: longer.map((y) => [y.year, y.avg]) },
              { id: "mk", label: "Taxa de mercado", color: "#8a93a8", step: true, dashed: true, points: mine.map((y) => [y.year, BASE + (y.year >= 1 && y.year <= duration ? spike : 0)]) },
            ]}
            bands={[{ from: 0.5, to: duration + 0.5, color: "#f87171", label: "crise" }]}
          />
        </Panel>
        <div className="grid content-start gap-2">
          <Stat
            label="Sente a nova taxa em 12 meses"
            value={pct(Math.min(100, short + selic), 0)}
            tone={short + selic > 50 ? "bad" : "neutral"}
            hint="vencimentos + pós-fixados · prazo médio da DPF ≈ 4 anos"
          />
          <Stat label="Precisa rolar em 12 meses" value={`R$ ${num(necessidade / 1000, 2)} tri`} tone={short > 25 ? "bad" : "warn"} hint="vencimentos + déficit nominal (~8% PIB)" />
          <Stat label="Juros extras na crise" value={`${num(extraMine, 1)} p.p. do PIB`} tone={extraMine > 2 ? "bad" : "warn"} hint="soma dos anos" />
          <Stat label="Com dívida longa" value={`${num(extraLong, 1)} p.p. do PIB`} tone="good" />
        </div>
      </div>
      <Callout tone={extraMine > 2 ? "bad" : "info"}>
        Dívida curta ou atrelada à Selic é como um financiamento de juros flutuantes: barata quando tudo vai bem, cara quando a
        confiança some — justamente quando o governo mais precisa rolar. O colchão de liquidez do Tesouro (caixa para vários
        meses de vencimentos) permite ficar fora do mercado nos piores momentos, como em 2015 e na pandemia de 2020.
      </Callout>
      <p className="font-mono text-[11px] text-faint">
        i_médioₜ = (1 − %Selic)·[i_fixoₜ₋₁(1 − ρ) + i_mercadoₜ·ρ] + %Selic·i_mercadoₜ · ρ = fração que vence no ano
      </p>
      <p className="text-xs text-faint">
        Experimente: suba “vence em 12 meses” para 35% e zere o colchão — os juros extras disparam. Depois ponha a fatia Selic em
        10% e veja a curva vermelha se aproximar da azul.
      </p>
    </div>
  );
}
