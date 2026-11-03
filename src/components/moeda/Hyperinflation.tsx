"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Callout, Controls, Panel, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { useTicker } from "@/lib/useTicker";
import { HYPER_CAP, hyperInit, hyperStep, type HyperParams, type HyperState } from "./moedaModel";
import { br, mesAno, pct } from "./num";

const T_MAX = 120; // jan/1985 → dez/1994
const Y0 = 1985;

export function Hyperinflation() {
  const [params, setParams] = useState<HyperParams>({ deficit: 4.5, alpha: 4, lambda: 0.3, iota0: 0.4 });
  const [seed, setSeed] = useState(7);
  const [state, setState] = useState<HyperState>(() => hyperInit(params, 7));
  const pending = useRef(0);
  const [freezes, setFreezes] = useState<number[]>([]);
  const [reforms, setReforms] = useState<number[]>([]);

  const step = () => {
    const shock = pending.current;
    pending.current = 0;
    setState((s) => (s.t >= T_MAX ? s : hyperStep(s, params, shock)));
  };
  const ticker = useTicker(step, { speed: 0.12 });
  const { running, pause } = ticker;
  useEffect(() => {
    if (state.t >= T_MAX && running) pause();
  }, [state.t, running, pause]);

  const reset = (newSeed = seed) => {
    ticker.pause();
    pending.current = 0;
    setFreezes([]);
    setReforms([]);
    setState(hyperInit(params, newSeed));
  };

  const h = state.history;
  const last = h[h.length - 1];
  const piM = (last?.pi ?? state.pi) * 100;
  const piA = ((1 + piM / 100) ** 12 - 1) * 100;
  const frozen = state.freeze > 0;
  const shortage = (Math.exp(state.gap) - 1) * 100;
  const capped = piM >= HYPER_CAP * 100 - 0.01;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0 space-y-3">
        <Controls>
          <Slider label="Déficit monetizado" value={params.deficit} min={0.5} max={8} step={0.1} onChange={(d) => setParams({ ...params, deficit: d })} format={(x) => `${br(x)}% PIB`} className="w-full sm:w-[48%]" />
          <Slider label="Velocidade das expectativas (λ)" value={params.lambda} min={0.05} max={0.8} step={0.05} onChange={(d) => setParams({ ...params, lambda: d })} format={(x) => br(x, 2)} className="w-full sm:w-[48%]" />
          <Slider label="Indexação de base" value={params.iota0} min={0} max={0.9} step={0.05} onChange={(d) => setParams({ ...params, iota0: d })} format={(x) => pct(x * 100, 0)} className="w-full sm:w-[48%]" />
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={ticker.toggle} disabled={state.t >= T_MAX}>
              {ticker.running ? "Pausar" : "▶ Rodar"}
            </Button>
            <Button onClick={ticker.tick} disabled={state.t >= T_MAX}>
              +1 mês
            </Button>
            <Button variant="ghost" onClick={() => reset()}>
              Reiniciar
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setSeed(seed + 1);
                reset(seed + 1);
              }}
            >
              Novo sorteio
            </Button>
          </div>
        </Controls>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => (pending.current += 0.15)} disabled={state.t >= T_MAX}>
            ⚡ Choque (+15 p.p.: petróleo, maxidesvalorização)
          </Button>
          <Button
            onClick={() => {
              setFreezes((f) => [...f, state.t]);
              setState((s) => ({ ...s, freeze: 9 }));
            }}
            disabled={frozen || state.t >= T_MAX}
          >
            🧊 Congelar preços (Plano Cruzado)
          </Button>
          <Button
            onClick={() => {
              setReforms((f) => [...f, state.t]);
              setState((s) => ({ ...s, reformed: true, pe: 0.02, pi: 0.02, gap: 0, freeze: 0 }));
            }}
            disabled={state.reformed || state.t >= T_MAX}
          >
            ✔ Ajuste fiscal + desindexação
          </Button>
        </div>
        <Panel title="Inflação mensal" right={<span className="font-mono text-xs text-faint">{mesAno(state.t, Y0)}</span>}>
          <LineChart
            height={280}
            xDomain={[0, T_MAX]}
            yDomain={[0, 100]}
            xLabel="mês"
            yLabel="% ao mês"
            xFormat={(t) => String(Y0 + Math.floor(t / 12))}
            yFormat={(t) => `${br(t, 0)}%`}
            hMarkers={[{ y: 80, label: "≈ 80% a.m. — mar/1990", color: "#f87171" }]}
            markers={[
              ...freezes.map((t) => ({ x: t, label: "congelamento", color: "#60a5fa" })),
              ...reforms.map((t) => ({ x: t, label: "ajuste", color: "#34d399" })),
            ]}
            bands={h.filter((x) => x.frozen).map((x) => ({ from: x.t, to: x.t + 1, color: "#60a5fa" }))}
            series={[
              { id: "pi", label: "Inflação observada", color: "#f87171", width: 2.5, points: h.map((x) => [x.t, x.pi * 100]) },
              { id: "mu", label: "Emissão de moeda", color: "#facc15", dashed: true, points: h.map((x) => [x.t, Math.min(x.mu * 100, 300)]) },
            ]}
            dots={last ? [{ x: last.t, y: Math.min(last.pi * 100, 100), color: "#f87171" }] : []}
          />
        </Panel>
        <p className="font-mono text-xs text-muted">
          πe ← πe + λ(π − πe) · V = e^(α·πe) · μ = d·V/m₀ · π = ι·π₋₁ + (1−ι)·μ + choque
        </p>
        <p className="text-xs text-faint">
          Experimente: rode alguns anos, aplique dois choques e depois congele os preços. Durante o congelamento a inflação “some”, mas a
          emissão continua e o desabastecimento cresce; quando o congelamento acaba, a inflação volta mais alta. Só o ajuste fiscal com
          desindexação quebra a espiral.
        </p>
      </div>
      <div className="grid content-start gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <Stat label="Inflação do mês" value={capped ? "> 150% a.m." : `${pct(piM)} a.m.`} tone={piM > 50 ? "bad" : piM > 10 ? "warn" : "good"} hint={`≈ ${piA > 1e6 ? "milhões de" : br(piA, 0)}% ao ano`} />
        <Stat label="Velocidade da moeda" value={`${br(state.V, 1)}×`} hint="vs. inflação zero: gente se livrando do dinheiro" tone={state.V > 3 ? "bad" : "neutral"} />
        <Stat label="Indexação efetiva" value={pct(state.iota * 100, 0)} hint="reajustes ficam mais frequentes" tone={state.iota > 0.85 ? "bad" : "neutral"} />
        <Stat label="Desabastecimento" value={frozen || shortage > 1 ? `${pct(shortage, 0)}` : "—"} hint="excesso de moeda sobre preços travados" tone={shortage > 10 ? "bad" : "neutral"} />
        {frozen && <Callout tone="info">Preços congelados: a inflação medida é zero, mas a moeda continua sendo emitida. Filas, ágio e produtos sumindo das prateleiras.</Callout>}
        {!frozen && piM > 50 && <Callout tone="bad">Hiperinflação: o déficit já não cabe na senhoriagem e cada alta de preços alimenta a próxima.</Callout>}
      </div>
    </div>
  );
}
