"use client";

import { useMemo, useState } from "react";
import { Button, Callout, Controls, Panel, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { premioTermo, selicEsperada, taxaVertice, type CurvaIn } from "./jurosModel";
import { br, pct } from "./fmtBR";

const CENARIOS: { id: string; label: string; c: CurvaIn; nota: string }[] = [
  { id: "hoje", label: "Hoje (aprox.)", c: { s0: 15, sLongo: 11.5, kappa: 1.5, premio: 1.8 }, nota: "Selic alta, mercado espera cortes graduais e cobra prêmio pelo risco fiscal." },
  { id: "corte", label: "Copom vai cortar logo", c: { s0: 15, sLongo: 10, kappa: 0.8, premio: 0.8 }, nota: "Expectativa de cortes rápidos: vértices longos abaixo da Selic → curva invertida." },
  { id: "fiscal", label: "Risco fiscal", c: { s0: 15, sLongo: 13.5, kappa: 2, premio: 4.5 }, nota: "Dúvidas sobre a dívida: investidores exigem prêmio maior para emprestar por prazos longos → curva inclinada." },
  { id: "alta", label: "Copom vai subir", c: { s0: 10.5, sLongo: 12, kappa: 1, premio: 1.5 }, nota: "Inflação desancorada: mercado precifica altas da Selic → curva positivamente inclinada no curto prazo." },
  { id: "calmo", label: "Juros baixos e estáveis", c: { s0: 7, sLongo: 7.5, kappa: 2, premio: 1.2 }, nota: "Política monetária estável: curva levemente positiva, só o prêmio de prazo." },
];

const VERTICES = [0.25, 0.5, 1, 2, 3, 5, 10];

export function YieldCurve() {
  const [c, setC] = useState<CurvaIn>(CENARIOS[0].c);
  const [cen, setCen] = useState("hoje");
  const set = (k: keyof CurvaIn) => (x: number) => {
    setCen("");
    setC((o) => ({ ...o, [k]: x }));
  };
  const pts = useMemo(() => Array.from({ length: 101 }, (_, i) => 0.1 + (i / 100) * 9.9).map((t) => [t, taxaVertice(c, t)] as [number, number]), [c]);
  const exp = useMemo(() => Array.from({ length: 101 }, (_, i) => (i / 100) * 10).map((t) => [t, selicEsperada(c, t)] as [number, number]), [c]);
  const prem = useMemo(() => Array.from({ length: 101 }, (_, i) => 0.1 + (i / 100) * 9.9).map((t) => [t, taxaVertice(c, t) - premioTermo(c, t)] as [number, number]), [c]);
  const y1 = taxaVertice(c, 1);
  const y10 = taxaVertice(c, 10);
  const incl = y10 - y1;
  const formato = incl < -0.25 ? "invertida" : incl > 1.5 ? "inclinada" : "quase plana";
  const all = [...pts, ...exp].map((p) => p[1]);
  const cenario = CENARIOS.find((x) => x.id === cen);

  return (
    <div className="space-y-3">
      <Controls>
        {CENARIOS.map((x) => (
          <Button
            key={x.id}
            variant={cen === x.id ? "primary" : "default"}
            className="text-xs"
            onClick={() => {
              setC(x.c);
              setCen(x.id);
            }}
          >
            {x.label}
          </Button>
        ))}
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Panel title="Estrutura a termo (ETTJ) · DI futuro por vértice">
          <div className="mb-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
            <Slider label="Selic hoje" value={c.s0} min={2} max={16} step={0.25} onChange={set("s0")} format={(v) => pct(v, 2)} />
            <Slider label="Selic esperada (longo prazo)" value={c.sLongo} min={4} max={16} step={0.25} onChange={set("sLongo")} format={(v) => pct(v, 2)} />
            <Slider label="Velocidade (anos)" value={c.kappa} min={0.3} max={4} step={0.1} onChange={set("kappa")} format={(v) => br(v, 1)} />
            <Slider label="Prêmio de risco/prazo" value={c.premio} min={0} max={6} step={0.1} onChange={set("premio")} format={(v) => `${br(v)} p.p.`} />
          </div>
          <LineChart
            series={[
              { id: "c", label: "curva de juros (DI futuro)", color: "#22d3ee", points: pts, width: 2.8 },
              { id: "m", label: "só expectativa (sem prêmio)", color: "#8a93a8", points: prem, dashed: true },
              { id: "e", label: "Selic esperada no ano t", color: "#fbbf24", points: exp, dashed: true, width: 1.5 },
            ]}
            xDomain={[0, 10]}
            yDomain={[Math.floor(Math.min(...all) - 1), Math.ceil(Math.max(...all) + 1)]}
            xLabel="prazo (anos)"
            xFormat={(v) => `${br(v, 0)}a`}
            yFormat={(v) => `${br(v, 0)}%`}
            dots={VERTICES.map((t) => ({ x: t, y: taxaVertice(c, t), color: "#22d3ee", r: 3.5 }))}
            hMarkers={[{ y: c.s0, label: `Selic ${pct(c.s0, 2)}`, color: "#5a6275" }]}
          />
        </Panel>
        <div className="grid content-start gap-3">
          <Stat label="DI 1 ano" value={pct(y1, 2)} />
          <Stat label="DI 10 anos" value={pct(y10, 2)} />
          <Stat
            label="Inclinação (10a − 1a)"
            value={`${incl > 0 ? "+" : ""}${br(incl, 2)} p.p.`}
            tone={incl < -0.25 ? "warn" : incl > 2.5 ? "bad" : "neutral"}
            hint={`curva ${formato}`}
          />
          <Stat label="Prêmio no vértice de 10 anos" value={`${br(premioTermo(c, 10), 2)} p.p.`} hint="o que não é expectativa de Selic" />
        </div>
      </div>
      {cenario && <Callout tone="info">{cenario.nota}</Callout>}
      <p className="font-mono text-xs text-faint">
        y(τ) = (1/τ)∫₀^τ E[Selic(t)] dt + prêmio(τ) · E[Selic(t)] = S∞ + (S₀ − S∞)·e^(−t/κ) · prêmio(τ) = p·(1 − e^(−τ/2,5))
      </p>
      <p className="text-xs text-faint">
        Experimente: clique em &quot;Copom vai cortar logo&quot; (curva invertida) e depois em &quot;Risco fiscal&quot; — com a mesma Selic de hoje, a ponta longa sobe vários pontos.
      </p>
    </div>
  );
}
