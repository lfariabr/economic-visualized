"use client";

import { useState } from "react";
import { Callout, Controls, Panel, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { range } from "@/lib/random";
import { DEM_A, SUP_C, harberger } from "./lafferModel";
import { num } from "./fmt";

const W = 520;
const H = 320;
const P = { l: 44, r: 16, t: 14, b: 34 };
const QMAX = 100;
const PMAX = 100;
const r2 = (v: number) => Math.round(v * 100) / 100;
const X = (q: number) => r2(P.l + (q / QMAX) * (W - P.l - P.r));
const Y = (p: number) => r2(H - P.b - (p / PMAX) * (H - P.t - P.b));

export function DeadweightLoss() {
  const [T, setT] = useState(20);
  const [b, setB] = useState(0.8);
  const [d, setD] = useState(0.8);
  const h = harberger(T, b, d);
  const h2 = harberger(Math.min(80, T * 2), b, d);
  const qEnd = Math.min(QMAX, (DEM_A - 0) / b);
  const qSupEnd = Math.min(QMAX, (PMAX - SUP_C) / d);
  const ratio = h.rev > 0 ? (h.dwl / h.rev) * 100 : 0;

  const dwlCurve: [number, number][] = range(41).map((i) => [i * 2, harberger(i * 2, b, d).dwl]);
  const revCurve: [number, number][] = range(41).map((i) => [i * 2, harberger(i * 2, b, d).rev]);

  return (
    <div className="space-y-3">
      <Controls>
        <Slider className="min-w-52 flex-1" label="Imposto por unidade (R$)" value={T} min={0} max={80} step={1} onChange={setT} format={(v) => `R$ ${v}`} />
        <Slider className="min-w-52 flex-1" label="Inclinação da demanda" value={b} min={0.3} max={3} step={0.1} onChange={setB} format={(v) => num(v, 1)} />
        <Slider className="min-w-52 flex-1" label="Inclinação da oferta" value={d} min={0.3} max={3} step={0.1} onChange={setD} format={(v) => num(v, 1)} />
      </Controls>
      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-[1fr_1fr_240px]">
        <Panel title="Mercado com cunha tributária">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
            <line x1={P.l} y1={Y(0)} x2={W - P.r} y2={Y(0)} stroke="#242a38" />
            <line x1={P.l} y1={Y(0)} x2={P.l} y2={P.t} stroke="#242a38" />
            <text x={W - P.r} y={H - 8} textAnchor="end" fontSize={11} fill="#8a93a8">quantidade</text>
            <text x={P.l - 6} y={P.t + 8} textAnchor="end" fontSize={11} fill="#8a93a8">preço</text>
            {/* receita */}
            {h.qt > 0 && (
              <rect x={X(0)} y={Y(h.pc)} width={X(h.qt) - X(0)} height={Y(h.ps) - Y(h.pc)} fill="#60a5fa" opacity={0.22} />
            )}
            {/* peso morto */}
            {T > 0 && (
              <polygon
                points={`${X(h.qt)},${Y(h.pc)} ${X(h.qt)},${Y(Math.max(0, h.ps))} ${X(h.q0)},${Y(h.p0)}`}
                fill="#f87171"
                opacity={0.55}
              />
            )}
            <line x1={X(0)} y1={Y(DEM_A)} x2={X(qEnd)} y2={Y(DEM_A - b * qEnd)} stroke="#e7e9f0" strokeWidth={2} />
            <line x1={X(0)} y1={Y(SUP_C)} x2={X(qSupEnd)} y2={Y(SUP_C + d * qSupEnd)} stroke="#34d399" strokeWidth={2} />
            <text x={X(qEnd) - 4} y={Y(DEM_A - b * qEnd) - 6} textAnchor="end" fontSize={11} fill="#e7e9f0">demanda</text>
            <text x={X(qSupEnd) - 4} y={Y(SUP_C + d * qSupEnd) + 14} textAnchor="end" fontSize={11} fill="#34d399">oferta</text>
            <line x1={X(h.qt)} y1={Y(0)} x2={X(h.qt)} y2={Y(h.pc)} stroke="#8a93a8" strokeDasharray="3 4" />
            <line x1={X(h.q0)} y1={Y(0)} x2={X(h.q0)} y2={Y(h.p0)} stroke="#5a6275" strokeDasharray="2 4" />
            <text x={X(h.qt)} y={Y(0) + 14} textAnchor="middle" fontSize={10.5} fill="#8a93a8">Qₜ</text>
            <text x={X(h.q0)} y={Y(0) + 14} textAnchor="middle" fontSize={10.5} fill="#5a6275">Q₀</text>
            <text x={X(0) + 6} y={Y(h.pc) - 4} fontSize={10.5} fill="#60a5fa">consumidor paga {num(h.pc, 0)}</text>
            <text x={X(0) + 6} y={Y(Math.max(0, h.ps)) + 13} fontSize={10.5} fill="#60a5fa">produtor recebe {num(Math.max(0, h.ps), 0)}</text>
          </svg>
          <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-muted">
            <span><span className="mr-1 inline-block size-2.5 rounded-sm bg-info/60" />arrecadação</span>
            <span><span className="mr-1 inline-block size-2.5 rounded-sm bg-bad/70" />peso morto (trocas que deixam de existir)</span>
          </div>
        </Panel>
        <Panel title="Peso morto ∝ imposto²">
          <LineChart
            height={300}
            xDomain={[0, 80]}
            xLabel="imposto por unidade"
            series={[
              { id: "rev", label: "Arrecadação", color: "#60a5fa", points: revCurve },
              { id: "dwl", label: "Peso morto", color: "#f87171", points: dwlCurve, width: 2.5 },
            ]}
            dots={[
              { x: T, y: h.dwl, color: "#f87171" },
              { x: T, y: h.rev, color: "#60a5fa" },
            ]}
          />
        </Panel>
        <div className="grid content-start gap-2 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-4 2xl:col-span-1 2xl:grid-cols-1">
          <Stat label="Arrecadação" value={num(h.rev, 0)} />
          <Stat label="Peso morto" value={num(h.dwl, 0)} tone={ratio > 50 ? "bad" : ratio > 20 ? "warn" : "neutral"} />
          <Stat label="Peso morto por R$ arrecadado" value={`${num(ratio, 0)} centavos`} tone={ratio > 50 ? "bad" : "neutral"} />
          <Stat label="Se dobrar o imposto" value={`× ${num(h.dwl > 0 ? h2.dwl / h.dwl : 4, 1)}`} hint="peso morto multiplica por ~4" tone="warn" />
        </div>
      </div>
      <Callout tone="info">
        O triângulo vermelho é renda que some sem ir para ninguém: compras e vendas que valeriam a pena sem o imposto. Sua área é
        ½·T·ΔQ, e como ΔQ também cresce com T, o peso morto cresce com o <b>quadrado</b> da alíquota. Por isso muitas alíquotas
        baixas sobre bases largas costumam custar menos eficiência que poucas alíquotas altas.
      </Callout>
      <p className="font-mono text-[11px] text-faint">
        Qₜ = (a − c − T)/(b + d) · peso morto = ½·T·(Q₀ − Qₜ) = T²/(2(b+d))
      </p>
      <p className="text-xs text-faint">
        Experimente: dobre o imposto de R$ 20 para R$ 40 e veja o triângulo quadruplicar; depois deixe a demanda bem inclinada
        (3,0, inelástica, como combustível) e veja o triângulo encolher.
      </p>
    </div>
  );
}
