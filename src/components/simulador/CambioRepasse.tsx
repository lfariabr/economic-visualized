"use client";

import { useMemo, useState } from "react";
import { LineChart } from "@/components/viz/Chart";
import { Callout, Controls, Panel, Slider, Stat } from "@/components/ui";
import { br, brl, pct } from "./num";
import { DEFAULT_CONTROLS, quarterYear, runScenario, TETO, type State } from "./simuladorModel";

const H = 24;
const T0 = 2;

/** Confidence crisis: the real depreciates, pass-through hits IPCA; reserves can buy time. */
export function CambioRepasse() {
  const [interv, setInterv] = useState(15);
  const [dur, setDur] = useState(4);
  const runs = useMemo(() => {
    const shocks = [{ t: T0, kind: "confianca" as const, scale: 1.3 }];
    const withI = (s: State) => ({ ...DEFAULT_CONTROLS, intervencao: s.t >= T0 && s.t < T0 + dur ? interv : 0 });
    return {
      sem: runScenario(DEFAULT_CONTROLS, { quarters: H, shocks }).states,
      com: runScenario(withI, { quarters: H, shocks }).states,
    };
  }, [interv, dur]);
  const x = (t: number) => quarterYear(t);
  const pts = (ss: State[], f: (s: State) => number): [number, number][] => ss.map((s) => [x(s.t), f(s)]);
  const peakE = (ss: State[]) => Math.max(...ss.map((s) => s.dolar));
  const peakPi = (ss: State[]) => Math.max(...ss.map((s) => s.ipca12));
  const lastCom = runs.com[H];

  return (
    <div className="space-y-3">
      <Controls>
        <Slider label="Venda de reservas" value={interv} min={0} max={30} step={1} onChange={setInterv} format={(v) => `US$ ${br(v, 0)} bi/tri`} className="min-w-[260px] flex-1" />
        <Slider label="Por quantos trimestres" value={dur} min={1} max={12} step={1} onChange={setDur} format={(v) => `${v} tri`} className="min-w-[220px] flex-1" />
      </Controls>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Dólar (R$)">
          <LineChart
            series={[
              { id: "sem", label: "BC não intervém", color: "#8a93a8", dashed: true, points: pts(runs.sem, (s) => s.dolar) },
              { id: "com", label: "BC vende reservas", color: "#2dd4bf", points: pts(runs.com, (s) => s.dolar) },
            ]}
            xDomain={[x(0), x(H)]}
            yDomain={[4.5, Math.max(7, peakE(runs.sem) + 0.3)]}
            height={220}
            xFormat={(v) => String(Math.round(v))}
            yFormat={(v) => br(v, 1)}
            markers={[{ x: x(T0), label: "crise", color: "#a78bfa" }]}
            bands={[{ from: x(T0), to: x(T0 + dur), color: "#2dd4bf", label: "intervenção" }]}
          />
        </Panel>
        <Panel title="IPCA 12 meses (%)">
          <LineChart
            series={[
              { id: "sem", label: "BC não intervém", color: "#8a93a8", dashed: true, points: pts(runs.sem, (s) => s.ipca12) },
              { id: "com", label: "BC vende reservas", color: "#fb923c", points: pts(runs.com, (s) => s.ipca12) },
            ]}
            xDomain={[x(0), x(H)]}
            yDomain={[0, Math.max(8, peakPi(runs.sem) + 1)]}
            height={220}
            xFormat={(v) => String(Math.round(v))}
            yFormat={(v) => `${br(v, 0)}%`}
            hMarkers={[{ y: TETO, label: "teto", color: "#f87171" }]}
            markers={[{ x: x(T0), label: "crise", color: "#a78bfa" }]}
          />
        </Panel>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Pico do dólar (sem)" value={brl(peakE(runs.sem))} tone={peakE(runs.sem) > 6.5 ? "bad" : "warn"} />
        <Stat label="Pico do dólar (com)" value={brl(peakE(runs.com))} tone={peakE(runs.com) > 6.5 ? "bad" : "warn"} />
        <Stat label="Pico do IPCA (com)" value={pct(peakPi(runs.com))} hint={`sem: ${pct(peakPi(runs.sem))}`} tone={peakPi(runs.com) > TETO ? "bad" : "good"} />
        <Stat label="Reservas ao fim" value={`US$ ${br(lastCom.reservas, 0)} bi`} tone={lastCom.reservas < 200 ? "bad" : "neutral"} hint="começa em US$ 345 bi" />
      </div>
      <Callout tone="info">
        Paridade descoberta: E[Δcâmbio] ≈ (juro externo + risco-país) − Selic. Quando o risco salta, o real precisa se desvalorizar até o
        retorno esperado voltar a compensar. Vender reservas suaviza o pico e reduz o repasse para os preços, mas não muda a causa: quando a
        intervenção acaba e o risco segue alto, o dólar volta a subir. Reserva compra tempo, não credibilidade.
      </Callout>
      <p className="text-xs text-faint">Experimente: zere a intervenção e compare o pico; depois venda US$ 30 bi por 12 trimestres e veja quanto das reservas vai embora para um efeito que some no fim.</p>
    </div>
  );
}
