"use client";

import { useEffect, useState } from "react";
import { LineChart } from "@/components/viz/Chart";
import { Button, Callout, Controls, Panel, Slider, Stat } from "@/components/ui";
import { useTicker } from "@/lib/useTicker";
import { br } from "./num";
import { solowKStar, solowPath, type SolowParams } from "./pibModel";

const YEARS = 80;
const ALPHA = 0.4;
const S_COREIA = 0.35;

/** Solow: capital per worker converges to a steady state; only TFP growth sustains growth. */
export function Solow() {
  const [s, setS] = useState(0.17);
  const [delta, setDelta] = useState(0.05);
  const [n, setN] = useState(0.008);
  const [g, setG] = useState(0.005);
  const [year, setYear] = useState(YEARS);
  const ticker = useTicker(() => setYear((y) => Math.min(YEARS, y + 1)), { speed: 0.25 });
  const { running, pause } = ticker;
  useEffect(() => {
    if (running && year >= YEARS) pause();
  }, [running, year, pause]);

  const pBr: SolowParams = { s, delta, n, g, alpha: ALPHA };
  const pKr: SolowParams = { ...pBr, s: S_COREIA };
  const br0 = solowPath(pBr, YEARS);
  const kr0 = solowPath(pKr, YEARS);
  const noTfp = solowPath({ ...pBr, g: 0 }, YEARS);
  const b = br0[year];
  const k = kr0[year];
  const A = b.A;
  const kStarBr = solowKStar(pBr, A);
  const kStarKr = solowKStar(pKr, A);
  const kMax = Math.max(kStarKr * 1.25, k.k * 1.1, 4);
  const grid = Array.from({ length: 61 }, (_, i) => (i / 60) * kMax);
  const f = (kk: number) => A * kk ** ALPHA;
  const lr = (g / (1 - ALPHA)) * 100;

  return (
    <div className="space-y-3">
      <Controls>
        <Button
          variant="primary"
          onClick={() => {
            setYear(0);
            ticker.play();
          }}
        >
          ▶ Rodar {YEARS} anos
        </Button>
        <Slider label="Ano" value={year} min={0} max={YEARS} step={1} onChange={setYear} format={(v) => `t = ${v}`} className="min-w-[220px] flex-1" />
      </Controls>
      <Controls>
        <Slider label="Poupança s" value={s} min={0.05} max={0.45} step={0.01} onChange={setS} format={(v) => `${br(v * 100, 0)}% PIB`} className="min-w-[200px] flex-1" />
        <Slider label="Depreciação δ" value={delta} min={0.02} max={0.1} step={0.005} onChange={setDelta} format={(v) => `${br(v * 100, 1)}%`} className="min-w-[200px] flex-1" />
        <Slider label="População n" value={n} min={-0.01} max={0.03} step={0.001} onChange={setN} format={(v) => `${br(v * 100, 1)}%`} className="min-w-[200px] flex-1" />
        <Slider label="PTF g" value={g} min={0} max={0.03} step={0.001} onChange={setG} format={(v) => `${br(v * 100, 1)}% a.a.`} className="min-w-[200px] flex-1" />
      </Controls>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={`Diagrama de Solow (ano ${year})`}>
          <LineChart
            series={[
              { id: "f", label: "produção y = A·k^α", color: "#5a6275", points: grid.map((kk) => [kk, f(kk)]) },
              { id: "sbr", label: `investimento Brasil (${br(s * 100, 0)}%)`, color: "#4ade80", points: grid.map((kk) => [kk, s * f(kk)]) },
              { id: "skr", label: "investimento Coreia (35%)", color: "#60a5fa", dashed: true, points: grid.map((kk) => [kk, S_COREIA * f(kk)]) },
              { id: "dep", label: "(δ + n)·k", color: "#f87171", points: grid.map((kk) => [kk, (delta + n) * kk]) },
            ]}
            xDomain={[0, kMax]}
            yDomain={[0, f(kMax) * 0.75]}
            height={260}
            xLabel="capital por trabalhador k"
            xFormat={(v) => br(v, 0)}
            yFormat={(v) => br(v, 1)}
            markers={[
              { x: kStarBr, label: "k* Brasil", color: "#4ade80" },
              { x: kStarKr, label: "k* Coreia", color: "#60a5fa" },
            ]}
            dots={[
              { x: b.k, y: s * f(b.k), color: "#4ade80" },
              { x: k.k, y: S_COREIA * f(k.k), color: "#60a5fa" },
            ]}
          />
        </Panel>
        <Panel title="Renda por trabalhador ao longo do tempo">
          <LineChart
            series={[
              { id: "kr", label: "Coreia (s = 35%)", color: "#60a5fa", points: kr0.slice(0, year + 1).map((p) => [p.t, p.y]) },
              { id: "br", label: `Brasil (s = ${br(s * 100, 0)}%)`, color: "#4ade80", points: br0.slice(0, year + 1).map((p) => [p.t, p.y]) },
              { id: "nt", label: "Brasil sem PTF", color: "#8a93a8", dashed: true, points: noTfp.slice(0, year + 1).map((p) => [p.t, p.y]) },
            ]}
            xDomain={[0, YEARS]}
            yDomain={[0, Math.max(...kr0.map((p) => p.y), ...br0.map((p) => p.y)) * 1.05]}
            height={260}
            xLabel="anos"
            xFormat={(v) => br(v, 0)}
            yFormat={(v) => br(v, 1)}
          />
        </Panel>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Crescimento Brasil" value={`${br(b.growth, 2)}% a.a.`} tone={b.growth < 1 ? "warn" : "good"} hint={`ano ${year}`} />
        <Stat label="Crescimento Coreia" value={`${br(k.growth, 2)}% a.a.`} />
        <Stat label="Longo prazo (ambos)" value={`${br(lr, 2)}% a.a.`} tone={lr < 0.5 ? "bad" : "good"} hint="g / (1 − α): só a PTF" />
        <Stat label="Coreia / Brasil" value={`${br(k.y / b.y, 2)}×`} hint="renda por trabalhador" />
        <Stat label="Brasil sem PTF" value={`${br(noTfp[year].growth, 2)}% a.a.`} tone={noTfp[year].growth < 0.3 ? "bad" : "neutral"} hint="converge e para" />
      </div>
      <div className="font-mono text-[11px] text-faint">
        y = A·k^α (α = 0,4) · kₜ₊₁ = kₜ + s·yₜ − (δ + n)·kₜ · Aₜ₊₁ = Aₜ·(1 + g) · k* = (s·A / (δ + n))^(1/(1−α))
      </div>
      <Callout tone="info">
        Poupar e investir mais (Coreia) leva a um nível de renda mais alto — mas, no longo prazo, as duas economias crescem à mesma taxa: a da
        produtividade (PTF). Capital tem retornos decrescentes: cada máquina extra rende menos, até que a depreciação come todo o investimento
        novo. A PTF brasileira está praticamente parada desde os anos 1980; é por isso que o país cresce pouco mesmo quando investe.
      </Callout>
      <p className="text-xs text-faint">
        Experimente: zere a PTF e aperte “Rodar” — as duas curvas achatam; suba a poupança do Brasil para 35% e veja que ele alcança o nível da
        Coreia, não a taxa de crescimento (que só a PTF muda).
      </p>
    </div>
  );
}
