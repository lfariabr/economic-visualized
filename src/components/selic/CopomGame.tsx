"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Callout, Controls, Panel, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { useTicker } from "@/lib/useTicker";
import {
  COPOM_QUARTERS,
  META,
  TOL,
  copomEvents,
  copomInitial,
  copomLoss,
  copomStep,
  quarterLabel,
  taylor,
  type CopomPoint,
} from "./selicModel";
import { br, pct, pp } from "./num";

const SKY = "#38bdf8";
const MOVES = [-1, -0.5, -0.25, 0, 0.25, 0.5, 1];

function grade(avg: number) {
  if (avg < 1) return { label: "excelente", tone: "good" as const };
  if (avg < 2.5) return { label: "bom", tone: "good" as const };
  if (avg < 5) return { label: "regular", tone: "warn" as const };
  return { label: "ruim", tone: "bad" as const };
}

export function CopomGame() {
  const [seed, setSeed] = useState(1);
  const [hist, setHist] = useState<CopomPoint[]>(() => [copomInitial()]);
  const events = useMemo(() => copomEvents(seed), [seed]);
  const now = hist[hist.length - 1];
  const done = now.q >= COPOM_QUARTERS;

  const decide = (h: CopomPoint[], selic: number) =>
    h[h.length - 1].q >= COPOM_QUARTERS ? h : [...h, copomStep(h, Math.max(0, selic), seed, events)];

  const taylorNext = (p: CopomPoint) => Math.round(taylor(5, p.pie, p.gap) * 4) / 4;

  const auto = useTicker(
    () =>
      setHist((h) => {
        const n = h[h.length - 1];
        if (n.q >= COPOM_QUARTERS) return h;
        return decide(h, taylorNext(n));
      }),
    { speed: 1 / 18 },
  );
  const { running, pause } = auto;
  useEffect(() => {
    if (done && running) pause();
  }, [done, running, pause]);

  const reset = (s = seed) => {
    auto.pause();
    setSeed(s);
    setHist([copomInitial()]);
  };

  const avgLoss = hist.reduce((a, p) => a + copomLoss(p), 0) / hist.length;
  const g = grade(avgLoss);
  const outBand = Math.abs(now.pi - META) > TOL;
  const sugg = taylorNext(now);
  const realRate = now.selic - now.pie;
  const quartersOut = hist.filter((p) => Math.abs(p.pi - META) > TOL).length;

  const xs = (k: keyof CopomPoint) => hist.map((p) => [p.q, p[k] as number] as [number, number]);
  const evMarkers = hist.filter((p) => p.event).map((p) => ({ x: p.q, label: p.event, color: "#fbbf24" }));
  const xFmt = (v: number) => (Number.isInteger(v) ? quarterLabel(v) : "");

  return (
    <div className="space-y-3">
      <Controls>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-muted">Decisão do Copom:</span>
          {MOVES.map((m) => (
            <Button
              key={m}
              variant={m === 0 ? "primary" : "default"}
              disabled={done || auto.running}
              onClick={() => setHist((h) => decide(h, h[h.length - 1].selic + m))}
            >
              {m === 0 ? "manter" : `${m > 0 ? "+" : "−"}${br(Math.abs(m), 2)}`}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button disabled={done || auto.running} onClick={() => setHist((h) => decide(h, taylorNext(h[h.length - 1])))}>
            seguir Taylor ({pct(sugg, 2)})
          </Button>
          <Button variant="ghost" disabled={done} onClick={auto.toggle}>
            {auto.running ? "❚❚ pausar" : "▶ piloto automático"}
          </Button>
          <Button variant="ghost" onClick={() => reset()}>
            ↺ recomeçar
          </Button>
          <Button variant="ghost" onClick={() => reset(seed + 1)}>
            novo cenário
          </Button>
        </div>
      </Controls>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-4">
          <Panel
            title={`Selic, IPCA e expectativas · ${quarterLabel(Math.min(now.q, COPOM_QUARTERS - 1))}`}
            right={<span className="font-mono text-xs text-faint">rodada {now.q}/{COPOM_QUARTERS}</span>}
          >
            <LineChart
              height={250}
              xDomain={[0, COPOM_QUARTERS]}
              yDomain={[-2, 18]}
              xFormat={xFmt}
              yFormat={(v) => `${br(v, 0)}%`}
              series={[
                { id: "selic", label: "Selic", color: SKY, points: xs("selic"), step: true, width: 2.5 },
                { id: "pi", label: "IPCA 12m", color: "#f87171", points: xs("pi") },
                { id: "pie", label: "Focus (expectativa)", color: "#60a5fa", points: xs("pie"), dashed: true },
              ]}
              hMarkers={[
                { y: META, label: "meta 3%", color: "#34d399" },
                { y: META + TOL, color: "#5a6275" },
                { y: META - TOL, color: "#5a6275" },
              ]}
              markers={evMarkers}
              dots={[{ x: now.q, y: now.pi, color: outBand ? "#f87171" : "#34d399" }]}
            >
              {(s) => (
                <rect
                  x={s.pad.left}
                  width={s.width - s.pad.left - s.pad.right}
                  y={s.y(META + TOL)}
                  height={s.y(META - TOL) - s.y(META + TOL)}
                  fill="#34d399"
                  opacity={0.07}
                />
              )}
            </LineChart>
          </Panel>
          <Panel title="Atividade: hiato do produto e desemprego">
            <LineChart
              height={170}
              xDomain={[0, COPOM_QUARTERS]}
              yDomain={[-6, 10]}
              xFormat={xFmt}
              yFormat={(v) => `${br(v, 0)}%`}
              series={[
                { id: "gap", label: "hiato do produto", color: "#a78bfa", points: xs("gap"), area: true },
                { id: "u", label: "desemprego", color: "#fbbf24", points: xs("u") },
              ]}
              hMarkers={[{ y: 0, color: "#5a6275" }]}
              markers={evMarkers}
            />
          </Panel>
        </div>
        <div className="grid grid-cols-2 content-start gap-2 lg:grid-cols-1">
          <Stat label="Selic" value={pct(now.selic, 2)} hint={`juro real ex-ante ${pct(realRate)}`} />
          <Stat
            label="IPCA 12m"
            value={pct(now.pi)}
            tone={outBand ? "bad" : "good"}
            hint={outBand ? "fora do intervalo 1,5–4,5%" : "dentro do intervalo"}
          />
          <Stat label="Focus 12m" value={pct(now.pie)} tone={Math.abs(now.pie - META) > 1 ? "warn" : "neutral"} />
          <Stat label="Hiato" value={pp(now.gap)} tone={now.gap < -2 ? "bad" : now.gap > 2 ? "warn" : "neutral"} hint={`desemprego ${pct(now.u)}`} />
          <Stat
            label="Credibilidade"
            value={`${br(now.cred * 100, 0)}%`}
            tone={now.cred < 0.3 ? "bad" : now.cred > 0.6 ? "good" : "neutral"}
            hint="peso da meta nas expectativas"
          />
          <Stat label="Nota" value={g.label} tone={g.tone} hint={`perda média ${br(avgLoss, 2)} · ${quartersOut} tri fora`} />
        </div>
      </div>
      {done && (
        <Callout tone={g.tone === "bad" ? "bad" : g.tone === "warn" ? "accent" : "ok"}>
          Fim do mandato (2030). Perda média <b>{br(avgLoss, 2)}</b> = média de (π − 3)² + 0,5·hiato². A inflação ficou fora do
          intervalo em {quartersOut} de {COPOM_QUARTERS + 1} trimestres.{" "}
          {g.tone === "bad"
            ? "Juro alto demais por tempo demais vira recessão; baixo demais, desancora as expectativas."
            : "Note como as decisões precisaram se antecipar: o juro de hoje só pesa na inflação dois ou três trimestres depois."}
        </Callout>
      )}
      <p className="font-mono text-[11px] text-faint">
        hiato′ = 0,72·hiato − 0,09·(i − πᵉ − r*) − 0,07·(i₋₁ − πᵉ₋₁ − r*) + ε · π′ = 0,45·π + 0,55·πᵉ + 0,3·hiato + choque · πᵉ′ = c·3% + (1−c)·(adaptativa) · r* = 5%
      </p>
      <p className="text-xs text-faint">
        Experimente: mantenha a Selic em 15% por todas as rodadas e veja a recessão (e a inflação abaixo do piso); depois recomece e
        tente cortar cedo demais — a credibilidade cai e o Focus se solta da meta.
      </p>
    </div>
  );
}
