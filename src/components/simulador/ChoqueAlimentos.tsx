"use client";

import { useMemo, useState } from "react";
import { LineChart } from "@/components/viz/Chart";
import { Callout, Controls, Panel, Slider, Stat } from "@/components/ui";
import { br, pct, signed } from "./num";
import { DEFAULT_CONTROLS, PISO, quarterYear, runScenario, TETO, type State } from "./simuladorModel";

const H = 20;

/** Supply shock: BC reacts to headline IPCA vs. looks through to the core. */
export function ChoqueAlimentos() {
  const [forca, setForca] = useState(1.5);
  const [peso, setPeso] = useState(2.5);
  const runs = useMemo(() => {
    const shocks = [{ t: 2, kind: "seca" as const, scale: forca }];
    return {
      base: runScenario(DEFAULT_CONTROLS, { quarters: H }).states,
      cheio: runScenario(DEFAULT_CONTROLS, { quarters: H, shocks, opts: { taylorPeso: peso } }).states,
      nucleo: runScenario(DEFAULT_CONTROLS, { quarters: H, shocks, opts: { taylorPeso: peso, taylorNucleo: true } }).states,
    };
  }, [forca, peso]);
  const x = (t: number) => quarterYear(t);
  const pts = (ss: State[], f: (s: State) => number): [number, number][] => ss.map((s) => [x(s.t), f(s)]);
  const peak = (ss: State[]) => Math.max(...ss.map((s) => s.ipca12));
  const extraU = (ss: State[]) => ss.reduce((a, s, i) => a + (s.desemprego - runs.base[i].desemprego), 0) / 4;
  const above = (ss: State[]) => ss.filter((s) => s.ipca12 > TETO).length;
  const custo = extraU(runs.cheio) - extraU(runs.nucleo);
  const ganho = peak(runs.nucleo) - peak(runs.cheio);

  return (
    <div className="space-y-3">
      <Controls>
        <Slider label="Tamanho da seca" value={forca} min={0.5} max={3} step={0.1} onChange={setForca} format={(v) => `${br(v)}×`} className="min-w-[240px] flex-1" />
        <Slider label="Agressividade do BC" value={peso} min={1.1} max={4} step={0.1} onChange={setPeso} format={(v) => `${br(v)}·π`} className="min-w-[240px] flex-1" />
      </Controls>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="IPCA 12 meses">
          <LineChart
            series={[
              { id: "cheio", label: "BC reage ao índice cheio", color: "#38bdf8", points: pts(runs.cheio, (s) => s.ipca12) },
              { id: "nucleo", label: "BC olha o núcleo", color: "#fb923c", points: pts(runs.nucleo, (s) => s.ipca12) },
              { id: "base", label: "sem seca", color: "#5a6275", dashed: true, points: pts(runs.base, (s) => s.ipca12) },
            ]}
            xDomain={[x(0), x(H)]}
            yDomain={[0, Math.max(10, peak(runs.nucleo) + 1)]}
            height={220}
            xFormat={(v) => String(Math.round(v))}
            yFormat={(v) => `${br(v, 0)}%`}
            hMarkers={[
              { y: TETO, label: "teto", color: "#f87171" },
              { y: PISO, color: "#f87171" },
            ]}
            markers={[{ x: x(2), label: "seca", color: "#f59e0b" }]}
          />
        </Panel>
        <Panel title="Desemprego (%)">
          <LineChart
            series={[
              { id: "cheio", label: "BC reage ao índice cheio", color: "#38bdf8", points: pts(runs.cheio, (s) => s.desemprego) },
              { id: "nucleo", label: "BC olha o núcleo", color: "#fb923c", points: pts(runs.nucleo, (s) => s.desemprego) },
              { id: "base", label: "sem seca", color: "#5a6275", dashed: true, points: pts(runs.base, (s) => s.desemprego) },
            ]}
            xDomain={[x(0), x(H)]}
            yDomain={[5, Math.max(9, ...runs.cheio.map((s) => s.desemprego + 0.5))]}
            height={220}
            xFormat={(v) => String(Math.round(v))}
            yFormat={(v) => `${br(v, 1)}%`}
            markers={[{ x: x(2), label: "seca", color: "#f59e0b" }]}
          />
        </Panel>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Pico do IPCA (reage)" value={pct(peak(runs.cheio))} tone="warn" hint={`${above(runs.cheio)} tri acima do teto`} />
        <Stat label="Pico do IPCA (núcleo)" value={pct(peak(runs.nucleo))} tone="warn" hint={`${above(runs.nucleo)} tri acima do teto`} />
        <Stat label="Inflação evitada" value={`${br(ganho, 2)} p.p.`} hint="no pico, por reagir ao cheio" />
        <Stat label="Desemprego extra" value={`${signed(custo, 2)} p.p.·ano`} tone={custo > 0.2 ? "bad" : "neutral"} hint="custo de reagir ao cheio" />
      </div>
      <Callout tone="info">
        A seca sobe o preço da comida <em>uma vez</em>; ela some do IPCA 12m sozinha quando a safra volta. Juro alto não faz chover: ele age
        sobre a demanda com 6 a 9 meses de defasagem, quando o choque já está passando. O BC só precisa reagir se o choque contaminar as
        expectativas e os outros preços (efeitos de segunda ordem) — por isso o Copom acompanha os núcleos.
      </Callout>
      <p className="text-xs text-faint">
        Experimente: aumente a agressividade para 4 e compare quanto de inflação o BC evita no pico com quanto desemprego ele cria depois.
      </p>
    </div>
  );
}
