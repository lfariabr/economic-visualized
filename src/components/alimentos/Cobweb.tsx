"use client";

import { useRef, useState } from "react";
import { Button, Callout, Controls, Panel, Segmented, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { useTicker } from "@/lib/useTicker";
import { cobweb } from "./foodModel";
import { nf } from "./fmtBR";

const N = 24;
const W = 360;
const H = 300;
const PAD = { l: 40, r: 12, t: 12, b: 32 };
const DOM: [number, number] = [40, 160];
const s = (v: number, a: number, b: number) => Math.round((a + ((Math.min(DOM[1], Math.max(DOM[0], v)) - DOM[0]) / (DOM[1] - DOM[0])) * (b - a)) * 100) / 100;
const sx = (q: number) => s(q, PAD.l, W - PAD.r);
const sy = (p: number) => s(p, H - PAD.b, PAD.t);

const CASES = {
  feijao: { label: "Feijão (ciclo curto)", delta: 0.8, beta: 1.0 },
  boi: { label: "Ciclo do boi", delta: 1.0, beta: 1.0 },
  estavel: { label: "Mercado estável", delta: 0.5, beta: 1.0 },
} as const;
type CaseKey = keyof typeof CASES;

export function Cobweb() {
  const [delta, setDelta] = useState(0.8);
  const [beta, setBeta] = useState(1);
  const [shock, setShock] = useState(30);
  const [preset, setPreset] = useState<CaseKey>("feijao");
  const t = useRef(1);
  const path = cobweb(delta, beta, 100 + shock, N);
  const ticker = useTicker(
    () => {
      if (t.current >= N) {
        ticker.pause();
        return;
      }
      t.current += 1;
    },
    { speed: 1 / 30 },
  );
  const now = Math.min(t.current, N);
  const shown = path.slice(0, now + 1);
  const ratio = delta / beta;
  const status = ratio < 0.97 ? "converge" : ratio > 1.03 ? "explode" : "oscila sem parar";
  const last = shown[shown.length - 1];

  // caminho da teia: (Q_t, P_{t-1}) → (Q_t, P_t) → (Q_{t+1}, P_t) …
  let web = `M${sx(100)},${sy(shown[0].P)}`;
  for (let i = 1; i < shown.length; i++) {
    web += `L${sx(shown[i].Q)},${sy(shown[i - 1].P)}L${sx(shown[i].Q)},${sy(shown[i].P)}`;
  }

  const reset = () => {
    t.current = 1;
    ticker.refresh();
  };

  return (
    <div className="space-y-3">
      <Controls>
        <Button variant="primary" onClick={() => (t.current >= N ? (reset(), ticker.play()) : ticker.toggle())}>
          {ticker.running ? "Pausar" : "Rodar safras"}
        </Button>
        <Button onClick={() => (t.current < N ? ticker.tick() : undefined)}>+1 safra</Button>
        <Button variant="ghost" onClick={reset}>
          Reiniciar
        </Button>
        <Segmented
          value={preset}
          options={(Object.keys(CASES) as CaseKey[]).map((k) => ({ value: k, label: CASES[k].label }))}
          onChange={(k) => {
            setPreset(k);
            setDelta(CASES[k].delta);
            setBeta(CASES[k].beta);
            reset();
          }}
        />
        <Slider label="Resposta da oferta δ" value={delta} min={0.2} max={1.5} step={0.05} onChange={(v) => (setDelta(v), reset())} format={(v) => nf(v, 2)} className="w-full sm:w-64" />
        <Slider label="Resposta da demanda β" value={beta} min={0.4} max={1.5} step={0.05} onChange={(v) => (setBeta(v), reset())} format={(v) => nf(v, 2)} className="w-full sm:w-64" />
        <Slider label="Choque inicial no preço" value={shock} min={-40} max={50} step={5} onChange={(v) => (setShock(v), reset())} format={(v) => `${v > 0 ? "+" : ""}${v}%`} className="w-full sm:w-64" />
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,360px)_1fr_220px]">
        <Panel title="Teia de aranha">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
            {[60, 80, 100, 120, 140].map((v) => (
              <g key={v}>
                <line x1={PAD.l} x2={W - PAD.r} y1={sy(v)} y2={sy(v)} stroke="#242a38" />
                <text x={PAD.l - 5} y={sy(v) + 3.5} textAnchor="end" fontSize={10} fill="#5a6275">
                  {v}
                </text>
                <text x={sx(v)} y={H - PAD.b + 14} textAnchor="middle" fontSize={10} fill="#5a6275">
                  {v}
                </text>
              </g>
            ))}
            <text x={(PAD.l + W - PAD.r) / 2} y={H - 4} textAnchor="middle" fontSize={10.5} fill="#8a93a8">
              quantidade plantada
            </text>
            {/* demanda: P = 100 − (Q − 100)/β ; oferta: Q = 100 + δ(P − 100) */}
            <line x1={sx(40)} y1={sy(100 + 60 / beta)} x2={sx(160)} y2={sy(100 - 60 / beta)} stroke="#60a5fa" strokeWidth={2} />
            <line x1={sx(100 - 60 * delta)} y1={sy(40)} x2={sx(100 + 60 * delta)} y2={sy(160)} stroke="#f59e0b" strokeWidth={2} />
            <text x={sx(44)} y={sy(Math.min(155, 100 + 56 / beta))} fontSize={10.5} fill="#60a5fa">
              demanda
            </text>
            <text x={sx(Math.min(150, 100 + 55 * delta))} y={sy(152) + 10} textAnchor="end" fontSize={10.5} fill="#f59e0b">
              oferta
            </text>
            <path d={web} fill="none" stroke={ratio > 1.03 ? "#f87171" : "#e7e9f0"} strokeWidth={1.5} opacity={0.85} />
            <circle cx={sx(last.Q)} cy={sy(last.P)} r={5} fill="#e7e9f0" stroke="#0a0c11" strokeWidth={1.5} />
          </svg>
        </Panel>
        <Panel title="Preço por safra">
          <LineChart
            series={[{ id: "p", label: "preço", color: "#f59e0b", points: shown.map((r) => [r.t, r.P]) }]}
            xDomain={[0, N]}
            yDomain={[0, 200]}
            height={280}
            xLabel="safra"
            hMarkers={[{ y: 100, label: "equilíbrio", color: "#8a93a8" }]}
            dots={[{ x: last.t, y: Math.min(200, last.P), color: "#e7e9f0" }]}
            xFormat={(v) => String(Math.round(v))}
            yFormat={(v) => String(Math.round(v))}
          />
        </Panel>
        <div className="grid grid-cols-2 content-start gap-3 lg:grid-cols-1">
          <Stat label="Safra" value={`${now}/${N}`} />
          <Stat label="Preço atual" value={nf(last.P, 0)} tone={Math.abs(last.P - 100) > 30 ? "bad" : Math.abs(last.P - 100) > 10 ? "warn" : "good"} />
          <Stat label="δ / β" value={nf(ratio, 2)} tone={ratio > 1.03 ? "bad" : ratio < 0.97 ? "good" : "warn"} hint={status} />
        </div>
      </div>
      {ratio > 1.03 && now > 6 && (
        <Callout tone="bad">
          A oferta reage mais que a demanda (δ &gt; β): cada safra corrige demais a anterior e a oscilação cresce. Na vida real, isso termina em quebradeira
          de produtores, estoques encalhados ou falta — e é por isso que existem contratos futuros, seguro rural e preço mínimo.
        </Callout>
      )}
      <p className="font-mono text-[11px] text-faint">Qt = 100 + δ·(P(t−1) − 100) · Pt = 100 − (Qt − 100)/β ⇒ Pt − 100 = −(δ/β)·(P(t−1) − 100)</p>
      <p className="text-xs text-faint">
        Experimente: escolha “Feijão”, rode, e depois suba δ para 1,2 — o preço passa a alternar entre fartura e escassez cada vez mais violentas.
      </p>
    </div>
  );
}
