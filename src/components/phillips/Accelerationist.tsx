"use client";

import { useEffect, useState } from "react";
import { Button, Callout, Controls, Panel, Segmented, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { useTicker } from "@/lib/useTicker";
import { accelStep, type AccelYear } from "./phillipsModel";
import { br, pct, pp } from "./num";

const INDIGO = "#818cf8";
const BETA = 0.6;
const MAX_YEARS = 12;
const start = (n: number): AccelYear[] => [{ t: 0, u: n, pi: 3, pie: 3, surprise: false }];

export function Accelerationist() {
  const [nairu, setNairu] = useState(8);
  const [uTarget, setUTarget] = useState(5.5);
  const [mode, setMode] = useState<"adaptativas" | "racionais">("adaptativas");
  const [hist, setHist] = useState<AccelYear[]>(() => start(8));
  const now = hist[hist.length - 1];
  const done = now.t >= MAX_YEARS;

  const advance = (surprise = false) =>
    setHist((h) => (h[h.length - 1].t >= MAX_YEARS ? h : [...h, accelStep(h, { uTarget, beta: BETA, nairu, mode, surprise })]));
  const ticker = useTicker(() => advance(), { speed: 1 / 30 });
  const { running, pause } = ticker;
  useEffect(() => {
    if (done && running) pause();
  }, [done, running, pause]);

  const reset = (n = nairu) => {
    ticker.pause();
    setHist(start(n));
  };

  const avgU = hist.length > 1 ? hist.slice(1).reduce((a, p) => a + p.u, 0) / (hist.length - 1) : now.u;
  const piMax = Math.max(20, Math.ceil(now.pi + 2));
  // curvas de curto prazo de cada ano: π = πᵉ − β(u − u*)
  const srCurves = hist.slice(-6).map((p) => ({
    id: `sr${p.t}`,
    label: `CP ano ${p.t}`,
    color: p.t === now.t ? INDIGO : "#3a4256",
    points: [
      [2, p.pie - BETA * (2 - nairu)],
      [13, p.pie - BETA * (13 - nairu)],
    ] as [number, number][],
    dashed: p.t !== now.t,
    width: p.t === now.t ? 2 : 1,
  }));

  return (
    <div className="space-y-3">
      <Controls>
        <Segmented
          value={mode}
          onChange={(v) => {
            setMode(v);
            reset();
          }}
          options={[
            { value: "adaptativas", label: "expectativas adaptativas" },
            { value: "racionais", label: "expectativas racionais" },
          ]}
        />
        <Slider className="min-w-52 flex-1" label="meta de desemprego do governo" value={uTarget} min={4} max={10} step={0.25} onChange={setUTarget} format={(v) => pct(v, 2)} />
        <Slider className="min-w-52 flex-1" label="NAIRU" value={nairu} min={6} max={10} step={0.25} onChange={(v) => { setNairu(v); reset(v); }} format={(v) => pct(v, 2)} />
      </Controls>
      <Controls>
        <Button variant="primary" disabled={done} onClick={ticker.toggle}>
          {ticker.running ? "❚❚ pausar" : "▶ rodar anos"}
        </Button>
        <Button disabled={done || ticker.running} onClick={() => advance()}>
          +1 ano
        </Button>
        <Button disabled={done || ticker.running} onClick={() => advance(true)}>
          estímulo surpresa
        </Button>
        <Button variant="ghost" onClick={() => reset()}>
          ↺ recomeçar
        </Button>
        <span className="font-mono text-xs text-faint">ano {now.t}/{MAX_YEARS}</span>
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="grid min-w-0 gap-4">
          <Panel title="Plano de Phillips: a trilha dos anos">
            <LineChart
              height={280}
              xDomain={[2, 13]}
              yDomain={[-2, piMax]}
              xLabel="desemprego (%)"
              yLabel="inflação (%)"
              xFormat={(v) => br(v, 0)}
              yFormat={(v) => br(v, 0)}
              legend={false}
              hover={false}
              series={[
                ...srCurves,
                { id: "trail", label: "trilha", color: "#f87171", points: hist.map((p) => [p.u, p.pi]) },
              ]}
              markers={[
                { x: nairu, label: "longo prazo: vertical na NAIRU", color: "#34d399" },
                { x: uTarget, label: "alvo", color: "#fbbf24" },
              ]}
              dots={hist.map((p) => ({
                x: p.u,
                y: p.pi,
                color: p.t === now.t ? "#f87171" : p.surprise ? "#fbbf24" : "#8a93a8",
                r: p.t === now.t ? 6 : 3.5,
                label: p.t === now.t && p.t > 0 ? `ano ${p.t}` : undefined,
              }))}
            />
          </Panel>
          <Panel title="Ao longo do tempo">
            <LineChart
              height={160}
              xDomain={[0, MAX_YEARS]}
              yDomain={[0, piMax]}
              xLabel="ano"
              yFormat={(v) => br(v, 0)}
              series={[
                { id: "pi", label: "inflação", color: "#f87171", points: hist.map((p) => [p.t, p.pi]), width: 2.5 },
                { id: "pie", label: "expectativa", color: "#60a5fa", points: hist.map((p) => [p.t, p.pie]), dashed: true },
                { id: "u", label: "desemprego", color: "#fbbf24", points: hist.map((p) => [p.t, p.u]) },
              ]}
            />
          </Panel>
        </div>
        <div className="grid grid-cols-2 content-start gap-2 lg:grid-cols-1">
          <Stat label="inflação" value={pct(now.pi)} tone={now.pi > 6 ? "bad" : now.pi > 4.5 ? "warn" : "good"} />
          <Stat label="expectativa" value={pct(now.pie)} hint="o que reajustes embutem" />
          <Stat label="desemprego" value={pct(now.u)} tone={now.u < nairu - 0.1 ? "warn" : "neutral"} hint={`NAIRU ${pct(nairu, 2)}`} />
          <Stat label="desemprego médio obtido" value={pct(avgU)} hint={mode === "racionais" ? "o estímulo é antecipado" : "comprado com inflação"} />
          <Stat label="aceleração por ano" value={pp(BETA * (nairu - uTarget))} tone={uTarget < nairu ? "bad" : "good"} hint="β·(u* − u alvo)" />
        </div>
      </div>
      {now.t >= 3 && uTarget < nairu && (
        <Callout tone="bad">
          {mode === "adaptativas"
            ? `Manter o desemprego em ${pct(uTarget, 2)}, abaixo da NAIRU, só funciona surpreendendo as pessoas todo ano. Como as expectativas seguem a inflação passada, a curva de curto prazo sobe a cada ano e a inflação acelera ${pp(BETA * (nairu - uTarget))} por ano — sem limite.`
            : "Com expectativas racionais o estímulo anunciado é antecipado nos reajustes: o desemprego fica na NAIRU e só sobra a inflação. Apenas uma surpresa (botão “estímulo surpresa”) reduz o desemprego, por um ano."}
        </Callout>
      )}
      <p className="font-mono text-[11px] text-faint">
        π = πᵉ − β·(u − u*) · β = 0,6 · adaptativas: πᵉ = π₋₁ · racionais: πᵉ = política anunciada
      </p>
      <p className="text-xs text-faint">
        Experimente: coloque a meta do governo em 5% e rode 12 anos — a trilha sobe em escada. Troque para expectativas racionais: a
        trilha vira uma linha vertical sobre a NAIRU.
      </p>
    </div>
  );
}
