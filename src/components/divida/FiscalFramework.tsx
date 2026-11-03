"use client";

import { useState } from "react";
import { Button, Callout, Controls, Panel, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { fiscalSim } from "./dividaModel";
import { num, pct, sgn } from "./fmt";

const YEARS = 10;

export function FiscalFramework() {
  const [g, setG] = useState(2);
  const [revTrend, setRevTrend] = useState(2.5);
  const [sd, setSd] = useState(1.5);
  const [seed, setSeed] = useState(3);
  const [recession, setRecession] = useState(false);
  const sim = fiscalSim({ g, revTrend, sd, seed, shockYear: recession ? 3 : null, years: YEARS });
  const yrs = sim.slice(1);
  const met = yrs.filter((y) => y.primArc >= y.meta - 0.25).length;
  const punished = yrs.filter((y) => y.punido).length;
  const last = sim[YEARS];

  return (
    <div className="space-y-3">
      <Controls>
        <Button onClick={() => setSeed((s) => s + 1)}>🎲 Novo sorteio de receitas</Button>
        <Button variant={recession ? "primary" : "default"} onClick={() => setRecession((v) => !v)}>
          {recession ? "✓ " : ""}Recessão em 2028
        </Button>
        <Slider className="min-w-44 flex-1" label="PIB real" value={g} min={-1} max={5} step={0.1} onChange={setG} format={(v) => `${pct(v, 1)}/ano`} />
        <Slider className="min-w-44 flex-1" label="Receita real (tendência)" value={revTrend} min={-1} max={6} step={0.1} onChange={setRevTrend} format={(v) => `${pct(v, 1)}/ano`} />
        <Slider className="min-w-44 flex-1" label="Volatilidade da receita" value={sd} min={0} max={4} step={0.1} onChange={setSd} format={(v) => `± ${num(v, 1)} p.p.`} />
      </Controls>
      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-[1fr_1fr_240px]">
        <Panel title="Resultado primário (% PIB) e meta">
          <LineChart
            height={260}
            xDomain={[2025, 2025 + YEARS]}
            yDomain={[-3, 5]}
            xFormat={(v) => String(v)}
            yFormat={(v) => `${v}%`}
            series={[
              { id: "meta", label: "Meta", color: "#8a93a8", dashed: true, step: true, points: sim.map((y) => [y.year, y.meta]) },
              { id: "arc", label: "Arcabouço (LC 200)", color: "#fb7185", width: 2.5, points: sim.map((y) => [y.year, y.primArc]) },
              { id: "teto", label: "Teto (EC 95)", color: "#60a5fa", points: sim.map((y) => [y.year, y.primTeto]) },
            ]}
            dots={yrs.filter((y) => y.primArc < y.meta - 0.25).map((y) => ({ x: y.year, y: y.primArc, color: "#f87171", r: 4 }))}
          >
            {(sc) => {
              const top = sim.map((y) => `${sc.x(y.year)},${sc.y(y.meta + 0.25)}`);
              const bot = [...sim].reverse().map((y) => `${sc.x(y.year)},${sc.y(y.meta - 0.25)}`);
              return <polygon points={[...top, ...bot].join(" ")} fill="#8a93a8" opacity={0.15} />;
            }}
          </LineChart>
        </Panel>
        <Panel title="Despesa primária (% PIB)">
          <LineChart
            height={260}
            xDomain={[2025, 2025 + YEARS]}
            yDomain={[14, 21]}
            xFormat={(v) => String(v)}
            yFormat={(v) => `${v}%`}
            series={[
              { id: "rec", label: "Receita", color: "#34d399", dashed: true, points: sim.map((y) => [y.year, y.receita]) },
              { id: "arc", label: "Arcabouço", color: "#fb7185", width: 2.5, points: sim.map((y) => [y.year, y.despesaArc]) },
              { id: "teto", label: "Teto", color: "#60a5fa", points: sim.map((y) => [y.year, y.despesaTeto]) },
            ]}
          />
        </Panel>
        <div className="grid content-start gap-2 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-4 2xl:col-span-1 2xl:grid-cols-1">
          <Stat label="Anos dentro da meta (±0,25)" value={`${met} de ${YEARS}`} tone={met >= 8 ? "good" : met >= 5 ? "warn" : "bad"} />
          <Stat label="Anos com gatilho (gasto a 50%)" value={String(punished)} tone={punished > 0 ? "warn" : "neutral"} />
          <Stat label="Despesa em 2035 · arcabouço" value={pct(last.despesaArc, 1)} />
          <Stat label="Despesa em 2035 · teto" value={pct(last.despesaTeto, 1)} tone={last.despesaTeto < 16 ? "warn" : "neutral"} hint="gasto real congelado" />
        </div>
      </div>
      <Panel title="Crescimento real da despesa permitido pelo arcabouço (% ao ano)" bodyClassName="p-3">
        <div className="grid grid-cols-5 gap-1 sm:grid-cols-10">
          {yrs.map((y) => (
            <div key={y.year} className="rounded-md border border-line bg-panel-2 px-1.5 py-1 text-center">
              <div className="text-[10px] text-faint">{y.year}</div>
              <div className={`font-mono text-xs ${y.limiteArc <= 0.6 ? "text-warn" : y.limiteArc >= 2.5 ? "text-info" : "text-ink"}`}>{num(y.limiteArc, 1)}</div>
              <div className="text-[9.5px] text-faint">rec. {sgn(y.revGrowth, 1)}</div>
            </div>
          ))}
        </div>
      </Panel>
      <Callout tone="info">
        O teto (2017–2023) congelava a despesa real: o gasto caía como % do PIB, mas espremia tudo o que não é obrigatório e
        acabou furado por emendas constitucionais. O arcabouço deixa o gasto crescer 70% da receita (50% se a meta for
        descumprida), sempre entre 0,6% e 2,5% reais — mais flexível, mas o primário passa a depender de a receita crescer.
      </Callout>
      <p className="font-mono text-[11px] text-faint">
        Δgastoₜ = clamp(0,7 × Δreceitaₜ₋₁, 0,6%, 2,5%) · 0,5 em vez de 0,7 se primário &lt; meta − 0,25 · teto: Δgasto = 0
      </p>
      <p className="text-xs text-faint">
        Experimente: ligue “Recessão em 2028” e veja o primário cair fora da banda enquanto o gasto continua crescendo pelo piso de
        0,6%; depois suba a receita para 4% ao ano: no arcabouço o gasto sobe junto (até 2,5%); no teto, todo o ganho vira superávit.
      </p>
    </div>
  );
}
