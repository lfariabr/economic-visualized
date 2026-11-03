"use client";

import { useMemo, useState } from "react";
import { Controls, Panel, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { scoreModelo, type ScoreParams } from "./creditoModel";
import { br, pct } from "./fmt";

const RHO = 0.3;

export function CadastroPositivo() {
  const [qualidade, setQualidade] = useState(20);
  const [fatiaRuim, setFatiaRuim] = useState(25);
  const [custo, setCusto] = useState(20);
  const base: ScoreParams = { qualidade, pdBom: 3, pdRuim: 25, fatiaRuim, custo, rho: RHO };
  const m = scoreModelo(base);

  const ss = Array.from({ length: 121 }, (_, i) => -4 + i * (8 / 120));
  const densB = ss.map((s) => [s, 100 * m.dens(s).bom] as [number, number]);
  const densR = ss.map((s) => [s, 100 * m.dens(s).ruim] as [number, number]);
  const taxa = ss.map((s) => [s, m.taxaScore(s)] as [number, number]);

  const pk = JSON.stringify({ fatiaRuim, custo });
  const curvas = useMemo(() => {
    const b = JSON.parse(pk) as { fatiaRuim: number; custo: number };
    const qs = Array.from({ length: 21 }, (_, i) => i * 5);
    const r = qs.map((q) => scoreModelo({ qualidade: q, pdBom: 3, pdRuim: 25, fatiaRuim: b.fatiaRuim, custo: b.custo, rho: RHO }));
    return {
      bons: qs.map((q, i) => [q, r[i].taxaBons] as [number, number]),
      ruins: qs.map((q, i) => [q, r[i].taxaRuins] as [number, number]),
    };
  }, [pk]);
  const subsidio = m.taxaBons - m.justaBons;

  return (
    <div className="space-y-3">
      <Controls>
        <Slider label="Qualidade da informação" value={qualidade} min={0} max={100} step={5} onChange={setQualidade} format={(v) => pct(v, 0)} className="w-full sm:w-80" />
        <Slider label="Fatia de maus pagadores" value={fatiaRuim} min={5} max={50} step={1} onChange={setFatiaRuim} format={(v) => pct(v, 0)} className="w-full sm:w-72" />
        <Slider label="Custo de captação + operação" value={custo} min={5} max={35} step={1} onChange={setCusto} format={(v) => `${br(v, 0)}% a.a.`} className="w-full sm:w-80" />
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="grid min-w-0 gap-4 xl:grid-cols-2">
          <Panel title="O que o banco enxerga: score de cada tipo">
            <LineChart
              height={180}
              width={440}
              series={[
                { id: "b", label: "bons pagadores (calote 3%)", color: "#34d399", points: densB, area: true },
                { id: "r", label: "maus pagadores (calote 25%)", color: "#f87171", points: densR, area: true },
              ]}
              xDomain={[-4, 4]}
              yDomain={[0, 42]}
              xFormat={(v) => br(v, 0)}
              yFormat={() => ""}
              hover={false}
            />
            <div className="mt-2">
              <LineChart
                height={170}
                width={440}
                legend={false}
                series={[{ id: "t", label: "taxa justa", color: "#f472b6", points: taxa, width: 2.4 }]}
                xDomain={[-4, 4]}
                yDomain={[0, 60]}
                xLabel="score (baixo → alto)"
                yLabel="taxa % a.a."
                xFormat={(v) => br(v, 0)}
                yFormat={(v) => `${br(v, 0)}%`}
                hMarkers={[{ y: m.pooled, label: "taxa única, sem informação", color: "#5a6275" }]}
              />
            </div>
          </Panel>
          <Panel title="Taxa média paga por tipo × qualidade da informação">
            <LineChart
              height={380}
              width={440}
              series={[
                { id: "rb", label: "bons pagadores", color: "#34d399", points: curvas.bons, width: 2.4 },
                { id: "rr", label: "maus pagadores", color: "#f87171", points: curvas.ruins, width: 2.4 },
              ]}
              xDomain={[0, 100]}
              yDomain={[0, 60]}
              xLabel="qualidade da informação (%)"
              xFormat={(v) => br(v, 0)}
              yFormat={(v) => `${br(v, 0)}%`}
              hMarkers={[
                { y: m.justaBons, label: "justa p/ bons", color: "#34d399" },
                { y: m.justaRuins, label: "justa p/ maus", color: "#f87171" },
              ]}
              dots={[
                { x: qualidade, y: m.taxaBons, color: "#34d399" },
                { x: qualidade, y: m.taxaRuins, color: "#f87171" },
              ]}
            />
          </Panel>
        </div>
        <div className="grid content-start gap-3">
          <Stat label="Taxa média dos bons" value={`${pct(m.taxaBons, 1)} a.a.`} tone={subsidio > 3 ? "warn" : "good"} hint={`spread: ${br(m.taxaBons - custo, 1)} p.p.`} />
          <Stat label="Taxa média dos maus" value={`${pct(m.taxaRuins, 1)} a.a.`} hint={`justa: ${pct(m.justaRuins, 1)}`} />
          <Stat
            label="Subsídio cruzado"
            value={`${br(subsidio, 1)} p.p.`}
            tone={subsidio > 3 ? "bad" : subsidio > 1 ? "warn" : "good"}
            hint="quanto o bom pagador paga a mais por ser confundido"
          />
          <Stat label="Bons com score acima da média" value={pct(m.acerto, 0)} hint="50% = informação inútil" />
        </div>
      </div>
      <p className="font-mono text-xs text-faint">
        score ~ N(±d/2, 1), d = 3,2·qualidade · PD(s) = P(mau | s)·25% + P(bom | s)·3% · taxa justa: (1+r)(1−PD) + PD·ρ = 1 + c
      </p>
      <p className="text-xs text-faint">
        Experimente: com qualidade 0% todos pagam a mesma taxa; leve a qualidade a 90% (o efeito do Cadastro Positivo com adesão automática) e veja a
        taxa dos bons descer e a dos maus subir. Modelo ilustrativo.
      </p>
    </div>
  );
}
