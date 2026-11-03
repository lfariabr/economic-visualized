"use client";

import { useRef, useState } from "react";
import { Button, Callout, Controls, Panel, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { useTicker } from "@/lib/useTicker";
import { CREDITO0, creditoInicial, creditoStep, type CreditoState } from "./jurosModel";
import { br, pct, pp } from "./fmtBR";

const N = 28;

export function CreditoFeedback() {
  const [selicAlvo, setSelicAlvo] = useState(15);
  const [gamma, setGamma] = useState(2.5);
  const beta = 0.15;
  const hist = useRef<CreditoState[]>([creditoInicial()]);
  const params = { selicAlvo, gamma, beta };
  const step = () => {
    const h = hist.current;
    if (h.length > N) {
      t.pause();
      return;
    }
    h.push(creditoStep(h[h.length - 1], params));
  };
  const t = useTicker(step, { speed: 0.1 });
  const reset = () => {
    t.pause();
    hist.current = [creditoInicial()];
    t.refresh();
  };
  const h = hist.current;
  const cur = h[h.length - 1];
  const ganho = gamma * beta;
  const explode = ganho >= 1;
  const pts = (f: (s: CreditoState) => number) => h.map((s) => [s.t, f(s)] as [number, number]);

  return (
    <div className="space-y-3">
      <Controls>
        <Button variant="primary" onClick={t.toggle}>
          {t.running ? "❚❚ pausar" : "▶ trimestre a trimestre"}
        </Button>
        <Button onClick={t.tick}>+1 tri</Button>
        <Button variant="ghost" onClick={reset}>
          reiniciar
        </Button>
        <Slider label="Selic alvo do Copom" value={selicAlvo} min={6} max={18} step={0.25} onChange={setSelicAlvo} format={(v) => pct(v, 2)} className="w-full sm:w-72" />
        <Slider label="Repasse do calote ao spread (γ)" value={gamma} min={0} max={8} step={0.1} onChange={setGamma} format={(v) => br(v, 1)} className="w-full sm:w-72" />
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="grid min-w-0 gap-4">
          <Panel title={`Taxas · trimestre ${cur.t} de ${N}`}>
            <LineChart
              height={220}
              series={[
                { id: "taxa", label: "taxa ao tomador", color: "#f87171", points: pts((s) => s.taxa), width: 2.6 },
                { id: "spread", label: "spread", color: "#fbbf24", points: pts((s) => s.spread) },
                { id: "selic", label: "Selic", color: "#60a5fa", points: pts((s) => s.selic) },
              ]}
              xDomain={[0, N]}
              yDomain={[0, Math.max(45, ...h.map((s) => s.taxa)) * 1.05]}
              xFormat={(v) => `${br(v, 0)}`}
              xLabel="trimestre"
              yFormat={(v) => `${br(v, 0)}%`}
            />
          </Panel>
          <Panel title="Inadimplência (% da carteira, atraso > 90 dias)">
            <LineChart
              height={170}
              series={[{ id: "inad", label: "inadimplência", color: "#f87171", points: pts((s) => s.inad), area: true }]}
              xDomain={[0, N]}
              yDomain={[0, Math.max(8, ...h.map((s) => s.inad)) * 1.1]}
              xFormat={(v) => `${br(v, 0)}`}
              yFormat={(v) => `${br(v, 0)}%`}
              hMarkers={[{ y: CREDITO0.inad, label: "ponto de partida", color: "#5a6275" }]}
            />
          </Panel>
        </div>
        <div className="grid content-start gap-3">
          <Stat label="Selic" value={pct(cur.selic, 2)} hint="anda até 0,75 p.p. por reunião-trimestre" />
          <Stat label="Inadimplência" value={pct(cur.inad, 1)} tone={cur.inad > 6 ? "bad" : cur.inad > 4.5 ? "warn" : "good"} hint={pp(cur.inad - CREDITO0.inad)} />
          <Stat label="Taxa ao tomador" value={`${pct(cur.taxa, 1)} a.a.`} tone={cur.taxa > 40 ? "bad" : cur.taxa > 32 ? "warn" : "neutral"} hint={`spread ${br(cur.spread, 1)} p.p.`} />
          <Stat label="Estoque de crédito real" value={br(cur.credito, 1)} tone={cur.credito < 100 ? "bad" : "neutral"} hint="índice, início = 100" />
          <Stat
            label="Ganho do ciclo (γ·β)"
            value={br(ganho, 2)}
            tone={explode ? "bad" : ganho > 0.6 ? "warn" : "good"}
            hint={explode ? "≥ 1: espiral, não há equilíbrio" : `amplifica a alta em ${br(1 / (1 - ganho), 2)}×`}
          />
        </div>
      </div>
      {explode && cur.t > 4 && (
        <Callout tone="bad">
          Espiral de crédito: juro mais alto → mais calote → spread maior → juro ainda mais alto. Com ganho ≥ 1 o ciclo não converge — na vida real, o crédito simplesmente seca (racionamento).
        </Callout>
      )}
      <p className="font-mono text-xs text-faint">
        inadₜ₊₁ = inadₜ + 0,25·(L₀ + β·(taxaₜ − taxa₀) − inadₜ) · spread = S₀ + γ·(inad − L₀) · taxa = Selic + spread · multiplicador = 1/(1 − γβ)
      </p>
      <p className="text-xs text-faint">
        Experimente: dê play com Selic alvo 15% e γ = 2,5; reinicie, suba γ para 7 e dê play de novo. Modelo ilustrativo, parâmetros aproximados.
      </p>
    </div>
  );
}
