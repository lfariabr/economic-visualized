"use client";

import { useState } from "react";
import { Callout, Controls, Panel } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { CRISES, FONTE, SERIE, pontos } from "./historiaData";
import { fmtValor } from "./histFmt";
import { br } from "./fmtBR";

export function Crises() {
  const [id, setId] = useState("1999");
  const c = CRISES.find((x) => x.id === id) ?? CRISES[0];

  return (
    <div className="space-y-3">
      <Controls>
        <div className="flex flex-wrap gap-1.5">
          {CRISES.map((x) => (
            <button
              key={x.id}
              type="button"
              onClick={() => setId(x.id)}
              className={
                "rounded-lg border px-3 py-1.5 text-sm transition " +
                (x.id === id ? "border-bad/70 bg-panel-2 text-ink" : "border-line text-muted hover:text-ink")
              }
            >
              {x.nome}
            </button>
          ))}
        </div>
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          {c.series.map((sid, i) => {
            const s = SERIE[sid];
            const pts = pontos(sid, c.de, c.ate).map((p) => [p[0] + 0.5, p[1]] as [number, number]);
            const vals = pts.map((p) => p[1]);
            const lo = Math.min(...vals);
            const hi = Math.max(...vals);
            const span = hi - lo || 1;
            const peak = pts.reduce((a, b) => (b[1] > a[1] ? b : a), pts[0]);
            const trough = pts.reduce((a, b) => (b[1] < a[1] ? b : a), pts[0]);
            const showTrough = sid === "pib";
            return (
              <Panel key={`${c.id}-${sid}`} title={s.label}>
                <LineChart
                  height={190}
                  series={[{ id: sid, label: s.label, color: s.color, points: pts, area: sid !== "pib", width: 2.4 }]}
                  xDomain={[c.de, c.ate + 1]}
                  yDomain={[Math.min(0, lo - span * 0.15), hi + span * 0.25]}
                  xFormat={(v) => br(v, 0)}
                  yFormat={(v) => (sid === "dolar" ? br(v, 1) : br(v, 0))}
                  markers={c.eventos.map((e) => ({ x: e.x, label: i === 0 ? e.label : undefined, color: "#5a6275" }))}
                  dots={[
                    showTrough
                      ? { x: trough[0], y: trough[1], color: "#f87171", label: fmtValor(sid, trough[1]) }
                      : { x: peak[0], y: peak[1], color: s.color, label: fmtValor(sid, peak[1]) },
                  ]}
                  hMarkers={sid === "pib" ? [{ y: 0, color: "#5a6275" }] : []}
                />
              </Panel>
            );
          })}
        </div>
        <div className="grid content-start gap-3">
          <Panel title={c.nome}>
            <p className="text-sm leading-relaxed text-muted">{c.resumo}</p>
            <ul className="mt-3 space-y-1.5 text-sm">
              {c.numeros.map((n) => (
                <li key={n} className="rounded-md border border-line bg-panel-2/60 px-2.5 py-1.5 font-mono text-xs text-ink">
                  {n}
                </li>
              ))}
            </ul>
            <div className="mt-3 text-[11px] text-faint">{FONTE} · médias anuais (o pico intra-ano foi maior)</div>
          </Panel>
        </div>
      </div>
      <Callout tone="info">
        Repare no padrão: quase toda crise brasileira combina choque de confiança (externo ou fiscal), câmbio depreciando e Selic subindo para conter a inflação — o que pesa sobre o PIB e o emprego no ano seguinte.
      </Callout>
      <p className="text-xs text-faint">
        Experimente: alterne entre &quot;2002&quot; e &quot;2024–25&quot; — dólar e Selic sobem juntos nos dois episódios de medo fiscal; já em &quot;2015–16&quot; olhe o PIB e o desemprego. Séries anuais aproximadas.
      </p>
    </div>
  );
}
