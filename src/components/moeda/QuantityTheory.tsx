"use client";

import { useState } from "react";
import { Button, Controls, Panel, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { useTicker } from "@/lib/useTicker";
import { qtmInflation, qtmPath } from "./moedaModel";
import { br, pct } from "./num";

const YEARS = 20;

const PRESETS = [
  { label: "Brasil hoje", mu: 8, v: 0, y: 2.5 },
  { label: "Emissão acelerada", mu: 30, v: 0, y: 2 },
  { label: "Fuga da moeda", mu: 30, v: 15, y: 0 },
  { label: "Moeda cresce = PIB", mu: 3, v: 0, y: 3 },
];

export function QuantityTheory() {
  const [mu, setMu] = useState(8);
  const [v, setV] = useState(0);
  const [y, setY] = useState(2.5);
  const [year, setYear] = useState(YEARS);
  const ticker = useTicker(
    () =>
      setYear((yy) => {
        if (yy >= YEARS) {
          ticker.pause();
          return yy;
        }
        return yy + 1;
      }),
    { speed: 0.08 },
  );

  const path = qtmPath(mu, v, y, YEARS);
  const shown = path.slice(0, year + 1);
  const pi = qtmInflation(mu, v, y);
  const now = shown[shown.length - 1];
  const approx = mu + v - y;
  const maxP = Math.max(...path.map((p) => Math.max(p.P, p.M, p.Y)));

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0 space-y-3">
        <Controls>
          <Slider label="Moeda (M)" value={mu} min={0} max={40} step={0.5} onChange={setMu} format={(x) => `${pct(x)} a.a.`} className="w-full sm:w-[45%]" />
          <Slider label="Velocidade (V)" value={v} min={-5} max={20} step={0.5} onChange={setV} format={(x) => `${pct(x)} a.a.`} className="w-full sm:w-[45%]" />
          <Slider label="PIB real (Y)" value={y} min={-4} max={8} step={0.5} onChange={setY} format={(x) => `${pct(x)} a.a.`} className="w-full sm:w-[45%]" />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              onClick={() => {
                if (year >= YEARS) setYear(0);
                ticker.toggle();
              }}
            >
              {ticker.running ? "Pausar" : "▶ Animar anos"}
            </Button>
            <Button variant="ghost" onClick={() => setYear(YEARS)}>
              Mostrar tudo
            </Button>
          </div>
        </Controls>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <Button
              key={p.label}
              variant="default"
              className="text-xs"
              onClick={() => {
                setMu(p.mu);
                setV(p.v);
                setY(p.y);
              }}
            >
              {p.label}
            </Button>
          ))}
        </div>
        <Panel title="Índices (ano 0 = 100) — escala logarítmica" right={<span className="font-mono text-xs text-faint">ano {year}</span>}>
          <LineChart
            height={260}
            xDomain={[0, YEARS]}
            yDomain={[Math.log10(Math.min(50, ...path.map((p) => p.Y))), Math.log10(Math.max(200, maxP * 1.1))]}
            xLabel="anos"
            yFormat={(t) => br(10 ** t, 0)}
            series={[
              { id: "P", label: "Nível de preços (P)", color: "#f87171", width: 2.5, points: shown.map((p) => [p.t, Math.log10(p.P)]) },
              { id: "M", label: "Moeda (M)", color: "#facc15", points: shown.map((p) => [p.t, Math.log10(p.M)]) },
              { id: "Y", label: "PIB real (Y)", color: "#34d399", points: shown.map((p) => [p.t, Math.log10(p.Y)]) },
              { id: "V", label: "Velocidade (V)", color: "#60a5fa", dashed: true, points: shown.map((p) => [p.t, Math.log10(p.V)]) },
            ]}
            dots={[{ x: now.t, y: Math.log10(now.P), color: "#f87171" }]}
          />
        </Panel>
        <p className="font-mono text-xs text-muted">
          M·V = P·Y ⇒ (1+π) = (1+μ)(1+v)/(1+y) ≈ μ + v − y = {br(approx)}%
        </p>
        <p className="text-xs text-faint">
          Experimente: deixe a velocidade em 0 e iguale moeda ao PIB (3% e 3%) — inflação zero. Depois suba a moeda para 30%: os preços
          disparam na mesma proporção. Agora clique em “Fuga da moeda”: quando as pessoas giram o dinheiro mais rápido, a inflação passa da emissão.
        </p>
      </div>
      <div className="grid content-start gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <Stat label="Inflação implícita" value={`${pct(pi)} a.a.`} tone={pi > 4.5 ? "bad" : pi < 1.5 ? "warn" : "good"} hint="meta do BCB: 3% ± 1,5 p.p." />
        <Stat label={`Preços no ano ${year}`} value={br(now.P, 0)} hint="ano 0 = 100" tone={now.P > 200 ? "bad" : "neutral"} />
        <Stat label="Moeda além do PIB" value={`${br(mu - y)} p.p.`} hint="crescimento de M acima de Y" tone={mu - y > 5 ? "bad" : "neutral"} />
        <Stat label="Poder de compra de R$ 100" value={`R$ ${br((100 / now.P) * 100, 2)}`} hint={`após ${year} anos`} />
      </div>
    </div>
  );
}
