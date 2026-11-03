"use client";

import { useState } from "react";
import { Button, Callout, Controls, Panel, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { useTicker } from "@/lib/useTicker";
import { debtPath, sStar } from "./dividaModel";
import { num, pct, sgn } from "./fmt";

const YEARS = 20;
const D0 = 78;

export function DebtDynamics() {
  const [r, setR] = useState(6.5);
  const [g, setG] = useState(2);
  const [s, setS] = useState(-0.5);
  const [year, setYear] = useState(YEARS);

  const ticker = useTicker(
    () =>
      setYear((y) => {
        if (y >= YEARS) {
          ticker.pause();
          return YEARS;
        }
        return y + 1;
      }),
    { speed: 0.08 },
  );

  const path = debtPath(D0, r / 100, g / 100, s, YEARS);
  const shown = path.slice(0, year + 1);
  const dNow = path[year][1];
  const dEnd = path[YEARS][1];
  const gap = r - g;
  const need = sStar(D0, r / 100, g / 100);
  const exploding = dEnd > D0 + 5;
  const stable = Math.abs(dEnd - D0) <= 5;
  const ref: [number, number][] = debtPath(D0, r / 100, g / 100, need, YEARS);

  return (
    <div className="space-y-3">
      <Controls>
        <Button variant="primary" onClick={() => (year >= YEARS ? (setYear(0), ticker.play()) : ticker.toggle())}>
          {ticker.running ? "❚❚ Pausar" : "▶ Rodar 20 anos"}
        </Button>
        <Button onClick={() => { ticker.pause(); setYear((y) => Math.min(YEARS, y + 1)); }}>+1 ano</Button>
        <Button variant="ghost" onClick={() => { setR(6.5); setG(2); setS(-0.5); }}>Brasil 2025 (aprox.)</Button>
      </Controls>
      <Controls>
        <Slider className="min-w-48 flex-1" label="Juro real r" value={r} min={-2} max={12} step={0.1} onChange={setR} format={(v) => pct(v, 1)} />
        <Slider className="min-w-48 flex-1" label="Crescimento real g" value={g} min={-3} max={6} step={0.1} onChange={setG} format={(v) => pct(v, 1)} />
        <Slider className="min-w-48 flex-1" label="Primário s (% PIB)" value={s} min={-4} max={5} step={0.1} onChange={setS} format={(v) => sgn(v, 1)} />
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <Panel title="Dívida bruta, % do PIB">
          <LineChart
            height={290}
            xDomain={[0, YEARS]}
            yDomain={[0, 240]}
            xLabel="anos"
            xFormat={(v) => String(2025 + v)}
            yFormat={(v) => `${v}%`}
            series={[
              { id: "d", label: "Dívida/PIB", color: exploding ? "#f87171" : "#fb7185", width: 2.5, area: true, points: shown },
              { id: "ref", label: "Com o primário que estabiliza", color: "#8a93a8", dashed: true, points: ref },
            ]}
            hMarkers={[
              { y: 90, label: "zona de perigo (> 90%)", color: "#f87171" },
              { y: D0, label: "hoje ≈ 78%", color: "#5a6275" },
            ]}
            dots={[{ x: year, y: dNow, color: dNow > 90 ? "#f87171" : "#34d399", label: pct(dNow, 0) }]}
          >
            {(sc) => (
              <rect
                x={sc.pad.left}
                y={sc.pad.top}
                width={sc.width - sc.pad.left - sc.pad.right}
                height={Math.max(0, sc.y(90) - sc.pad.top)}
                fill="#f87171"
                opacity={0.07}
              />
            )}
          </LineChart>
        </Panel>
        <div className="grid content-start gap-2">
          <Stat label="r − g" value={`${sgn(gap, 1)} p.p.`} tone={gap > 0 ? "bad" : "good"} hint={gap > 0 ? "juro corre mais que o PIB" : "o PIB corre mais que o juro"} />
          <Stat label={`Dívida em ${2025 + year}`} value={pct(dNow, 1)} tone={dNow > 90 ? "bad" : dNow > D0 ? "warn" : "good"} />
          <Stat label="Primário que estabiliza" value={`${sgn(need, 2)}% PIB`} tone={s >= need ? "good" : "bad"} hint={`você está em ${sgn(s, 1)}%`} />
          <Stat label="Em 20 anos" value={pct(dEnd, 0)} tone={exploding ? "bad" : stable ? "neutral" : "good"} hint={exploding ? "trajetória explosiva" : stable ? "estável" : "em queda"} />
        </div>
      </div>
      <Callout tone={exploding ? "bad" : "ok"}>
        {exploding ? (
          <>
            Com r − g = {sgn(gap, 1)} p.p., cada ano os juros adicionam ≈ {num((D0 * gap) / 100, 1)} p.p. do PIB à dívida, e o
            primário de {sgn(s, 1)}% não cobre. A dívida vira bola de neve: quanto maior, mais juros, maior ainda.
          </>
        ) : (
          <>
            O primário cobre a diferença entre juros e crescimento. Repare que, com r &lt; g, até déficits pequenos são
            sustentáveis — por isso países com juro real baixo convivem com dívidas maiores.
          </>
        )}
      </Callout>
      <p className="font-mono text-[11px] text-faint">dₜ₊₁ = dₜ · (1 + r)/(1 + g) − s</p>
      <p className="text-xs text-faint">
        Experimente: aperte ▶ com os valores de 2025 e veja a linha cruzar a zona vermelha; depois leve o primário a +3,5% (o que estabiliza) ou combine juro real de 3% com primário de +1% e veja a dívida dobrar a curva.
      </p>
    </div>
  );
}
