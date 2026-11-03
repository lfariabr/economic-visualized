"use client";

import { useMemo, useState } from "react";
import { LineChart } from "@/components/viz/Chart";
import { Callout, Controls, Panel, Slider, Stat } from "@/components/ui";
import { br, pct } from "./num";
import { DEFAULT_CONTROLS, GASTO_BASE, runScenario } from "./simuladorModel";

const PESOS = [0.6, 0.8, 1, 1.25, 1.5, 2, 2.5, 3, 3.5, 4];

type Point = { peso: number; pi: number; u: number; divida: number };

function frontier(gasto: number): Point[] {
  return PESOS.map((peso) => {
    const st = runScenario({ ...DEFAULT_CONTROLS, gasto }, { shocks: [{ t: 3, kind: "petroleo", scale: 1.5 }], opts: { taylorPeso: peso } }).states.slice(1);
    const avg = (f: (i: number) => number) => st.reduce((a, _, i) => a + f(i), 0) / st.length;
    return { peso, pi: avg((i) => st[i].ipca12), u: avg((i) => st[i].desemprego), divida: st[st.length - 1].divida };
  });
}

const debtColor = (d: number) => (d > 120 ? "#f87171" : d > 95 ? "#fbbf24" : "#34d399");

/** Each policy choice is a point: you can move along the frontier, not escape it. */
export function TradeOffs() {
  const [gasto, setGasto] = useState(GASTO_BASE);
  const [idx, setIdx] = useState(4);
  const cur = useMemo(() => frontier(gasto), [gasto]);
  const base = useMemo(() => frontier(GASTO_BASE), []);
  const sel = cur[idx];
  const all = [...cur, ...base];
  const xs: [number, number] = [Math.min(...all.map((p) => p.u)) - 0.1, Math.max(...all.map((p) => p.u)) + 0.1];
  const ys: [number, number] = [Math.max(0, Math.min(2.5, ...all.map((p) => p.pi)) - 0.3), Math.max(...all.map((p) => p.pi)) + 0.5];

  return (
    <div className="space-y-3">
      <Controls>
        <Slider
          label="Dureza do BC (Taylor)"
          value={idx}
          min={0}
          max={PESOS.length - 1}
          step={1}
          onChange={setIdx}
          format={(v) => `${br(PESOS[v], 2)}·π`}
          className="min-w-[260px] flex-1"
        />
        <Slider label="Gasto primário" value={gasto} min={30} max={37} step={0.5} onChange={setGasto} format={(v) => `${br(v)}% PIB`} className="min-w-[240px] flex-1" />
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <Panel title="10 anos com choque do petróleo: inflação média × desemprego médio">
          <LineChart
            series={[
              { id: "cur", label: `gasto ${br(gasto)}%`, color: "#4ade80", points: [...cur].sort((a, b) => a.u - b.u).map((p) => [p.u, p.pi]) },
              { id: "base", label: `gasto ${br(GASTO_BASE)}% (referência)`, color: "#5a6275", dashed: true, points: [...base].sort((a, b) => a.u - b.u).map((p) => [p.u, p.pi]) },
            ]}
            xDomain={xs}
            yDomain={ys}
            height={280}
            xLabel="desemprego médio (%)"
            yLabel="IPCA médio (%)"
            xFormat={(v) => br(v, 2)}
            yFormat={(v) => br(v, 1)}
            hover={false}
            hMarkers={[{ y: 3, label: "meta 3%", color: "#34d399" }]}
            dots={cur.map((p, i) => ({ x: p.u, y: p.pi, color: debtColor(p.divida), r: i === idx ? 7 : 3.5, label: i === idx ? `${br(p.peso, 2)}·π` : undefined }))}
          />
          <div className="mt-2 font-mono text-[11px] text-faint">Selic = r*(risco) + E[π] + φ·(π − 3) + 0,5·hiato · cor do ponto = dívida em 2035</div>
        </Panel>
        <div className="grid content-start gap-2">
          <Stat label="IPCA médio" value={pct(sel.pi, 2)} tone={sel.pi > 4.5 ? "bad" : sel.pi > 3.5 ? "warn" : "good"} />
          <Stat label="Desemprego médio" value={pct(sel.u, 2)} tone={sel.u > 7.5 ? "bad" : "neutral"} />
          <Stat label="Dívida em 2035" value={pct(sel.divida)} tone={sel.divida > 120 ? "bad" : sel.divida > 95 ? "warn" : "good"} />
          <Stat label="Regra do Copom" value={`φ = ${br(sel.peso, 2)}`} hint={sel.peso < 1 ? "BC tolerante: reage pouco" : sel.peso >= 2.5 ? "BC linha-dura" : "reação moderada"} />
        </div>
      </div>
      <Callout>
        Não existe almoço grátis: um BC mais duro compra inflação menor com um pouco mais de desemprego — e juros maiores pesam na dívida.
        Gastar mais desloca a curva inteira para cima: mais inflação para o mesmo desemprego, e a dívida (cor dos pontos) piora.
      </Callout>
      <p className="text-xs text-faint">Experimente: deslize a dureza de 0,6 a 4 e acompanhe o ponto; depois baixe o gasto para 31,5% (pontos ficam verdes: a dívida estabiliza) e suba para 37% (a curva sobe e tudo fica vermelho).</p>
    </div>
  );
}
