"use client";

import { useMemo, useState } from "react";
import { Callout, Panel, Slider, Stat } from "@/components/ui";
import { Bars, LineChart } from "@/components/viz/Chart";
import { META, taylor, taylorPrinciple } from "./selicModel";
import { br, pct, pp } from "./num";

const SKY = "#38bdf8";

export function TaylorRule() {
  const [rStar, setRStar] = useState(5);
  const [pi, setPi] = useState(4.6);
  const [gap, setGap] = useState(0.5);
  const [aPi, setAPi] = useState(0.5);
  const [aY, setAY] = useState(0.5);
  const [actual, setActual] = useState(15);
  const [phi, setPhi] = useState(1.5);

  const i = taylor(rStar, pi, gap, aPi, aY);
  const diff = actual - i;
  const path = useMemo(() => taylorPrinciple(phi), [phi]);
  const ref = useMemo(() => taylorPrinciple(1.5), []);
  const last = path[path.length - 1];
  const violated = phi < 1;
  const spiral = last.pi > META + 3;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Calculadora da regra de Taylor">
          <div className="space-y-2.5">
            <Slider label="juro neutro r*" value={rStar} min={2} max={8} step={0.25} onChange={setRStar} format={(v) => pct(v, 2)} />
            <Slider label="inflação (Focus)" value={pi} min={0} max={12} step={0.1} onChange={setPi} format={(v) => pct(v)} />
            <Slider label="hiato do produto" value={gap} min={-4} max={4} step={0.1} onChange={setGap} format={(v) => pp(v)} />
            <Slider label="peso na inflação" value={aPi} min={0} max={1.5} step={0.05} onChange={setAPi} format={(v) => br(v, 2)} />
            <Slider label="peso no hiato" value={aY} min={0} max={1.5} step={0.05} onChange={setAY} format={(v) => br(v, 2)} />
            <Slider label="Selic de fato" value={actual} min={2} max={20} step={0.25} onChange={setActual} format={(v) => pct(v, 2)} />
          </div>
          <div className="mt-4">
            <Bars
              format={(v) => pp(v, 2)}
              max={Math.max(12, rStar + pi + 2)}
              rows={[
                { label: "juro neutro r*", value: rStar, color: "#5a6275" },
                { label: "inflação π", value: pi, color: "#f87171" },
                { label: `${br(aPi, 2)}·(π − 3%)`, value: aPi * (pi - META), color: "#fbbf24" },
                { label: `${br(aY, 2)}·hiato`, value: aY * gap, color: "#a78bfa" },
              ]}
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Stat label="Selic sugerida" value={pct(i, 2)} hint={`φ = 1 + ${br(aPi, 2)} = ${br(1 + aPi, 2)}`} />
            <Stat
              label="Selic de fato − regra"
              value={pp(diff, 2)}
              tone={Math.abs(diff) < 1 ? "good" : "warn"}
              hint={diff > 0 ? "mais apertado que a regra" : "mais frouxo que a regra"}
            />
          </div>
          <p className="mt-3 font-mono text-[11px] text-faint">i = r* + π + {br(aPi, 2)}·(π − π*) + {br(aY, 2)}·hiato · π* = 3%</p>
        </Panel>

        <Panel title="Princípio de Taylor: choque de +2 p.p. na inflação">
          <Slider
            label="resposta total φ"
            value={phi}
            min={0.3}
            max={2.5}
            step={0.05}
            onChange={setPhi}
            format={(v) => br(v, 2)}
          />
          <div className="mt-3">
            <LineChart
              height={220}
              xDomain={[0, 32]}
              yDomain={[-2, 20]}
              xLabel="trimestres"
              yFormat={(v) => `${br(v, 0)}%`}
              series={[
                { id: "pi", label: "inflação", color: violated ? "#f87171" : "#34d399", points: path.map((p) => [p.q, p.pi]), width: 2.5 },
                { id: "real", label: "juro real (i − π)", color: SKY, points: path.map((p) => [p.q, p.real]) },
                { id: "ref", label: "inflação com φ = 1,5", color: "#5a6275", points: ref.map((p) => [p.q, p.pi]), dashed: true },
              ]}
              hMarkers={[
                { y: META, label: "meta", color: "#34d399" },
                { y: 5, label: "r* = 5%", color: "#5a6275" },
              ]}
            />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Stat label="inflação após 8 anos" value={pct(last.pi)} tone={spiral ? "bad" : Math.abs(last.pi - META) < 0.5 ? "good" : "warn"} />
            <Stat label="juro real no fim" value={pct(last.real)} tone={last.real < 5 ? "bad" : "neutral"} hint="abaixo de r* estimula" />
          </div>
          <p className="mt-3 font-mono text-[11px] text-faint">i = r* + π* + φ·(π − π*) + 0,5·hiato · πᵉ = π (adaptativa)</p>
        </Panel>
      </div>
      {violated ? (
        <Callout tone="bad">
          Com φ = {br(phi, 2)} &lt; 1 o BC sobe a Selic <b>menos</b> do que a inflação subiu. O juro real cai, a economia aquece e a
          inflação sobe mais — uma espiral. É o que se viu no Brasil antes do Plano Real e, em versão branda, quando a política fica
          “atrás da curva”.
        </Callout>
      ) : (
        <Callout tone="info">
          Com φ &gt; 1 cada ponto a mais de inflação vira mais de um ponto de Selic: o juro <b>real</b> sobe e esfria a demanda. Esse é
          o princípio de Taylor — a condição para a regra estabilizar.
        </Callout>
      )}
      <p className="text-xs text-faint">
        Experimente: arraste φ para baixo de 1 e veja a inflação disparar enquanto o juro real afunda; na calculadora, coloque o hiato
        em −2 e veja quanto a regra pede de corte.
      </p>
    </div>
  );
}
