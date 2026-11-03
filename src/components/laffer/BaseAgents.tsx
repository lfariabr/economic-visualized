"use client";

import { useMemo, useState } from "react";
import { Button, Controls, Panel, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { useTicker } from "@/lib/useTicker";
import { range } from "@/lib/random";
import { CHOICES, CHOICE_COLOR, CHOICE_LABEL, choose, makeAgents, population, type Choice } from "./lafferModel";
import { num, pct } from "./fmt";

const COLS = 24;
const ROWS = 10;
const N = COLS * ROWS;

export function BaseAgents() {
  const agents = useMemo(() => makeAgents(N, 7), []);
  const [t, setT] = useState(0.1);
  const [fisc, setFisc] = useState(0.2);

  const ticker = useTicker(
    () => {
      setT((v) => {
        const nv = Math.round((v + 0.005) * 1000) / 1000;
        if (nv >= 0.85) {
          ticker.pause();
          return 0.85;
        }
        return nv;
      });
    },
    { speed: 0.5 },
  );

  const choices = agents.map((a) => choose(a, t, fisc));
  const { counts, rev } = population(agents, t, fisc);
  const curves = useMemo(() => {
    const pts = range(86).map((i) => ({ t: i, ...population(agents, i / 100, fisc) }));
    const maxRev = Math.max(...pts.map((p) => p.rev));
    return {
      maxRev,
      series: [
        { id: "rev", label: "Arrecadação (% do máx.)", color: "#e7e9f0", width: 2.5, points: pts.map((p) => [p.t, (p.rev / maxRev) * 100] as [number, number]) },
        ...CHOICES.map((c) => ({
          id: c,
          label: CHOICE_LABEL[c],
          color: CHOICE_COLOR[c],
          dashed: c !== "formal",
          points: pts.map((p) => [p.t, (p.counts[c] / N) * 100] as [number, number]),
        })),
      ],
    };
  }, [agents, fisc]);

  const share = (c: Choice) => (counts[c] / N) * 100;
  const escape = share("informal") + share("sonega");

  return (
    <div className="space-y-3">
      <Controls>
        <Button variant="primary" onClick={() => (t >= 0.85 ? (setT(0), ticker.play()) : ticker.toggle())}>
          {ticker.running ? "❚❚ Pausar" : "▶ Subir alíquota"}
        </Button>
        <Button onClick={() => { ticker.pause(); setT(0.1); }}>↺ Reiniciar</Button>
        <Slider className="min-w-52 flex-1" label="Alíquota" value={t * 100} min={0} max={85} step={0.5} onChange={(v) => setT(v / 100)} format={(v) => pct(v, 0)} />
        <Slider className="min-w-52 flex-1" label="Fiscalização (prob. de pegar)" value={fisc * 100} min={0} max={60} step={1} onChange={(v) => setFisc(v / 100)} format={(v) => pct(v, 0)} />
      </Controls>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={`${N} trabalhadores · alíquota ${pct(t * 100, 1)}`}>
          <svg viewBox={`0 0 ${COLS * 20} ${ROWS * 20}`} className="w-full">
            {agents.map((a, i) => {
              const c = choices[i];
              const r = Math.round((3 + Math.min(1.6, a.w) * 3.6) * 100) / 100;
              return (
                <circle
                  key={i}
                  cx={(i % COLS) * 20 + 10}
                  cy={Math.floor(i / COLS) * 20 + 10}
                  r={r}
                  fill={CHOICE_COLOR[c]}
                  opacity={c === "inativo" ? 0.5 : 0.9}
                  style={{ transition: "fill 300ms" }}
                />
              );
            })}
          </svg>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            {CHOICES.map((c) => (
              <span key={c} className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-full" style={{ background: CHOICE_COLOR[c] }} />
                {CHOICE_LABEL[c]} · {pct(share(c), 0)}
              </span>
            ))}
          </div>
          <div className="mt-1 text-[11px] text-faint">tamanho da bolinha = renda potencial</div>
        </Panel>
        <Panel title="O que emerge quando a alíquota sobe">
          <LineChart
            height={250}
            xDomain={[0, 85]}
            yDomain={[0, 100]}
            xLabel="alíquota (%)"
            xFormat={(v) => `${v}%`}
            yFormat={(v) => `${v}%`}
            series={curves.series}
            markers={[{ x: t * 100, color: "#8a93a8" }]}
          />
        </Panel>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Formais" value={pct(share("formal"), 0)} tone={share("formal") < 50 ? "bad" : "good"} />
        <Stat label="Informal + sonegação" value={pct(escape, 0)} tone={escape > 35 ? "bad" : escape > 15 ? "warn" : "neutral"} />
        <Stat label="Arrecadação" value={pct((rev / curves.maxRev) * 100, 0)} hint="do máximo da curva" />
        <Stat label="Receita por formal" value={num(counts.formal ? rev / counts.formal : 0, 2)} hint="quem fica paga a conta" />
      </div>
      <p className="font-mono text-[11px] text-faint">
        cada agente escolhe o maior entre: w(1−t) · w(1−φ) · w(1 − p·t·1,75 − m) · reserva
      </p>
      <p className="text-xs text-faint">
        Experimente: aperte ▶ e acompanhe as bolinhas verdes virarem amarelas e vermelhas; depois suba a fiscalização para 50%
        e repita: a sonegação some, mas a informalidade continua.
      </p>
    </div>
  );
}
