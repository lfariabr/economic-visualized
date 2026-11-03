"use client";

import { useState } from "react";
import { Callout, Controls, Panel, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { range } from "@/lib/random";
import { base, peakRate, revenue } from "./lafferModel";
import { num, pct, sgn } from "./fmt";

export function LafferCurve() {
  const [eps, setEps] = useState(1);
  const [t, setT] = useState(0.3);
  const tStar = peakRate(eps);
  const R = revenue(t, eps);
  const Rmax = revenue(tStar, eps);
  const cut = Math.max(0, t - 0.05);
  const dCut = revenue(cut, eps) - R;
  const prohibitive = t > tStar;
  const curve: [number, number][] = range(101).map((i) => [i, revenue(i / 100, eps)]);
  const baseCurve: [number, number][] = range(101).map((i) => [i, base(i / 100, eps) / 2]);

  return (
    <div className="space-y-3">
      <Controls>
        <Slider className="min-w-60 flex-1" label="Elasticidade da base ε" value={eps} min={0.2} max={4} step={0.1} onChange={setEps} format={(v) => num(v, 1)} />
        <Slider className="min-w-60 flex-1" label="Alíquota t" value={t * 100} min={0} max={95} step={1} onChange={(v) => setT(v / 100)} format={(v) => pct(v, 0)} />
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <Panel title="Arrecadação × alíquota">
          <LineChart
            height={280}
            xDomain={[0, 100]}
            yDomain={[0, 60]}
            xLabel="alíquota (%)"
            yLabel="arrecadação (índice)"
            xFormat={(v) => `${v}%`}
            yFormat={(v) => num(v, 0)}
            bands={[{ from: tStar * 100, to: 100, color: "#f87171", label: "lado proibitivo" }]}
            series={[
              { id: "r", label: "Arrecadação R(t) = t·B(t)", color: "#e7e9f0", points: curve, width: 2.5 },
              { id: "b", label: "Base B(t) ÷ 2", color: "#60a5fa", points: baseCurve, dashed: true },
            ]}
            markers={[{ x: tStar * 100, label: `t* = ${pct(tStar * 100, 0)}`, color: "#fbbf24" }]}
            dots={[
              { x: t * 100, y: R, color: prohibitive ? "#f87171" : "#34d399", label: "você" },
              { x: cut * 100, y: revenue(cut, eps), color: "#8a93a8", r: 3 },
            ]}
          />
          <div className="mt-1 font-mono text-[11px] text-faint">
            R(t) = t · B₀(1−t)^ε · pico em t* = 1/(1+ε)
          </div>
        </Panel>
        <div className="grid content-start gap-2">
          <Stat label="Arrecadação" value={num(R, 1)} hint={`${pct((R / Rmax) * 100, 0)} do máximo possível`} />
          <Stat label="Base tributária" value={num(base(t, eps), 0)} hint="100 = base sem imposto" />
          <Stat label="Alíquota de pico t*" value={pct(tStar * 100, 0)} tone="warn" />
          <Stat
            label="Cortar 5 p.p. muda a arrecadação"
            value={sgn(dCut, 1)}
            tone={dCut > 0 ? "good" : "bad"}
            hint={dCut > 0 ? "corte se paga (lado proibitivo)" : "corte perde receita"}
          />
        </div>
      </div>
      <Callout tone={prohibitive ? "bad" : "info"}>
        {prohibitive ? (
          <>
            Você está no <b className="text-bad">lado proibitivo</b>: a alíquota passou de t* e a base encolhe mais rápido do que a
            alíquota sobe. Aqui, e só aqui, cortar imposto aumenta a arrecadação.
          </>
        ) : (
          <>
            Você está no <b className="text-ok">lado normal</b>: subir a alíquota ainda aumenta a receita (com rendimentos
            decrescentes), e cortar perde arrecadação. A pergunta empírica é sempre <i>quanto vale ε</i>.
          </>
        )}
      </Callout>
      <p className="text-xs text-faint">
        Experimente: com ε = 1, leve a alíquota a 70% e veja o corte de 5 p.p. ficar verde; depois baixe ε para 0,3 e note o
        pico fugir para 77%.
      </p>
    </div>
  );
}
