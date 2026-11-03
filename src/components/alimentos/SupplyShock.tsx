"use client";

import { useRef, useState } from "react";
import { Button, Callout, Controls, Panel, Slider, Stat } from "@/components/ui";
import { demandQ, shockEquilibrium, supplyQ } from "./foodModel";
import { nf, spct } from "./fmtBR";

const W = 640;
const H = 340;
const PAD = { l: 52, r: 16, t: 14, b: 40 };
const QX: [number, number] = [0.4, 1.4];
const PY: [number, number] = [0.3, 3.2];
const sx = (q: number) => Math.round((PAD.l + ((q - QX[0]) / (QX[1] - QX[0])) * (W - PAD.l - PAD.r)) * 100) / 100;
const sy = (p0: number) => {
  const p = Math.min(PY[1] + 0.05, Math.max(PY[0], p0));
  return Math.round((H - PAD.b - ((p - PY[0]) / (PY[1] - PY[0])) * (H - PAD.t - PAD.b)) * 100) / 100;
};

function curve(fn: (p: number) => number) {
  const pts: string[] = [];
  for (let i = 0; i <= 80; i++) {
    const p = PY[0] + ((PY[1] - PY[0]) * i) / 80;
    const q = fn(p);
    if (q < QX[0] - 0.2 || q > QX[1] + 0.2) continue;
    pts.push(`${pts.length ? "L" : "M"}${sx(q)},${sy(p)}`);
  }
  return pts.join("");
}

const PRESETS = [
  { label: "Supersafra (+10%)", s: -0.1 },
  { label: "Seca no Sul (−12%)", s: 0.12 },
  { label: "El Niño (−20%)", s: 0.2 },
  { label: "Geada no café (−30%)", s: 0.3 },
];

export function SupplyShock() {
  const [s, setS] = useState(0.15);
  const [ed, setEd] = useState(0.25);
  const [es, setEs] = useState(0.15);
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef(false);

  const eq = shockEquilibrium(s, ed, es);
  const dP = (eq.P - 1) * 100;
  const dQ = (eq.Q - 1) * 100;
  const dR = (eq.revenue - 1) * 100;

  const onMove = (clientX: number) => {
    const el = svg.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = ((clientX - r.left) / r.width) * W;
    const q = QX[0] + ((px - PAD.l) / (W - PAD.l - PAD.r)) * (QX[1] - QX[0]);
    // a curva de oferta passa por Q = 1 − s quando P = 1
    setS(Math.round(Math.min(0.5, Math.max(-0.2, 1 - q)) * 100) / 100);
  };

  return (
    <div className="space-y-3">
      <Controls>
        <Slider label="Perda de safra" value={s} min={-0.2} max={0.5} step={0.01} onChange={setS} format={(v) => spct(-v * 100, 0)} className="w-full sm:w-72" />
        <Slider label="Elasticidade da demanda εd" value={ed} min={0.1} max={2} step={0.05} onChange={setEd} format={(v) => nf(v, 2)} className="w-full sm:w-72" />
        <Slider label="Elasticidade da oferta εs" value={es} min={0.05} max={1} step={0.05} onChange={setEs} format={(v) => nf(v, 2)} className="w-full sm:w-72" />
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <Button key={p.label} onClick={() => setS(p.s)} variant={Math.abs(s - p.s) < 0.001 ? "primary" : "default"}>
              {p.label}
            </Button>
          ))}
        </div>
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Panel title="Mercado de um alimento (índice: equilíbrio normal = 100)" right={<span className="text-xs text-faint">arraste a curva de oferta</span>}>
          <svg
            ref={svg}
            viewBox={`0 0 ${W} ${H}`}
            className="w-full touch-none select-none"
            onPointerDown={(e) => {
              drag.current = true;
              e.currentTarget.setPointerCapture(e.pointerId);
              onMove(e.clientX);
            }}
            onPointerMove={(e) => drag.current && onMove(e.clientX)}
            onPointerUp={() => (drag.current = false)}
          >
            {[0.5, 1, 1.5, 2, 2.5, 3].map((p) => (
              <g key={p}>
                <line x1={PAD.l} x2={W - PAD.r} y1={sy(p)} y2={sy(p)} stroke="#242a38" />
                <text x={PAD.l - 6} y={sy(p) + 3.5} textAnchor="end" fontSize={10.5} fill="#5a6275">
                  {Math.round(p * 100)}
                </text>
              </g>
            ))}
            {[0.5, 0.75, 1, 1.25].map((q) => (
              <text key={q} x={sx(q)} y={H - PAD.b + 15} textAnchor="middle" fontSize={10.5} fill="#5a6275">
                {Math.round(q * 100)}
              </text>
            ))}
            <text x={(PAD.l + W - PAD.r) / 2} y={H - 6} textAnchor="middle" fontSize={11} fill="#8a93a8">
              quantidade (safra normal = 100)
            </text>
            <text transform={`translate(13 ${(PAD.t + H - PAD.b) / 2}) rotate(-90)`} textAnchor="middle" fontSize={11} fill="#8a93a8">
              preço
            </text>
            {/* receita do produtor: retângulo P×Q */}
            <rect x={sx(QX[0])} y={sy(eq.P)} width={Math.max(0, sx(eq.Q) - sx(QX[0]))} height={Math.max(0, sy(PY[0]) - sy(eq.P))} fill={dR >= 0 ? "#34d399" : "#f87171"} opacity={0.08} />
            <path d={curve((p) => demandQ(p, ed))} fill="none" stroke="#60a5fa" strokeWidth={2.5} />
            <path d={curve((p) => supplyQ(p, es, 0))} fill="none" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="5 4" opacity={0.6} />
            <path d={curve((p) => supplyQ(p, es, s))} fill="none" stroke="#f59e0b" strokeWidth={3} style={{ cursor: "ew-resize" }} />
            <line x1={PAD.l} x2={sx(eq.Q)} y1={sy(eq.P)} y2={sy(eq.P)} stroke="#e7e9f0" strokeDasharray="3 4" opacity={0.5} />
            <line x1={sx(eq.Q)} x2={sx(eq.Q)} y1={sy(eq.P)} y2={H - PAD.b} stroke="#e7e9f0" strokeDasharray="3 4" opacity={0.5} />
            <circle cx={sx(1)} cy={sy(1)} r={4} fill="#8a93a8" stroke="#0a0c11" strokeWidth={1.5} />
            <circle cx={sx(eq.Q)} cy={sy(eq.P)} r={6} fill="#e7e9f0" stroke="#0a0c11" strokeWidth={1.5} />
            <text x={sx(eq.Q) + 9} y={sy(eq.P) - 8} fontSize={11} fill="#e7e9f0">
              P = {Math.round(eq.P * 100)}
            </text>
            <text x={sx(Math.min(1.3, demandQ(PY[1] - 0.2, ed))) + 6} y={sy(PY[1] - 0.2)} fontSize={11} fill="#60a5fa">
              demanda
            </text>
            <text x={W - PAD.r - 4} y={sy(PY[1] - 0.15)} textAnchor="end" fontSize={11} fill="#f59e0b">
              oferta (safra)
            </text>
            <text x={PAD.l + 6} y={H - PAD.b - 8} fontSize={10.5} fill={dR >= 0 ? "#34d399" : "#f87171"}>
              área = receita do produtor (P × Q)
            </text>
          </svg>
          <p className="mt-2 font-mono text-[11px] text-faint">Qd = P^(−εd) · Qs = (1 − s)·P^(εs) ⇒ P* = (1 − s)^(−1/(εd+εs)) · receita = P*^(1−εd)</p>
        </Panel>
        <div className="grid grid-cols-2 content-start gap-3 lg:grid-cols-1">
          <Stat label="Preço" value={spct(dP)} tone={dP > 15 ? "bad" : dP > 5 ? "warn" : "neutral"} hint="vs. safra normal" />
          <Stat label="Quantidade consumida" value={spct(dQ)} tone={dQ < -5 ? "warn" : "neutral"} />
          <Stat label="Receita dos produtores" value={spct(dR)} tone={dR > 0 ? "good" : dR < 0 ? "bad" : "neutral"} hint="no agregado" />
          <Stat label="Multiplicador" value={`${nf(1 / (ed + es), 1)}×`} hint="% de preço por 1% de safra" />
        </div>
      </div>
      {s > 0 && dR > 0 && (
        <Callout tone="bad">
          Com demanda inelástica (εd &lt; 1), perder {nf(s * 100, 0)}% da safra faz o preço subir {nf(dP, 0)}% — e a receita total dos produtores{" "}
          <b className="text-ink">aumenta</b>. Quem perdeu a lavoura inteira sofre; quem colheu ganha. O consumidor paga a conta.
        </Callout>
      )}
      {s < 0 && dR < 0 && (
        <Callout tone="info">
          Supersafra: o preço cai mais do que a quantidade sobe, e o faturamento do campo encolhe — o “paradoxo da abundância”.
        </Callout>
      )}
      <p className="text-xs text-faint">
        Experimente: clique em “Geada no café” e depois suba εd para 1,5 — a mesma quebra quase não mexe no preço e a receita do produtor passa a cair.
      </p>
    </div>
  );
}
