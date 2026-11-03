"use client";

import { useState } from "react";
import { Button, Callout, Controls, Panel, Segmented, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { useTicker } from "@/lib/useTicker";
import { snowballPath, tippingPoint } from "./dividaModel";
import { num, pct, sgn } from "./fmt";

const YEARS = 20;
const D0 = 78;
const R0 = 4;

export function Snowball() {
  const [fb, setFb] = useState<"on" | "off">("on");
  const [kappa, setKappa] = useState(0.12);
  const [thr, setThr] = useState(80);
  const [s, setS] = useState(2);
  const [g, setG] = useState(2);
  const [shock, setShock] = useState(false);
  const [year, setYear] = useState(YEARS);
  const on = fb === "on";

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

  const run = (feedback: boolean) =>
    snowballPath(D0, R0 / 100, g / 100, s, kappa, thr, feedback, YEARS, shock ? 3 : null, 10);
  const main = run(on);
  const alt = run(!on);
  const tip = tippingPoint(R0 / 100, g / 100, s, kappa, thr, on);
  const dNow = main.debt[year][1];
  const rNow = main.rate[year][1];
  const exploding = main.debt[YEARS][1] - main.debt[YEARS - 5][1] > 2;
  const cut = <T,>(xs: T[]) => xs.slice(0, year + 1);

  return (
    <div className="space-y-3">
      <Controls>
        <Button variant="primary" onClick={() => (year >= YEARS ? (setYear(0), ticker.play()) : ticker.toggle())}>
          {ticker.running ? "❚❚ Pausar" : "▶ Rodar"}
        </Button>
        <Button variant={shock ? "primary" : "default"} onClick={() => setShock((v) => !v)}>
          {shock ? "✓ " : ""}Choque: +10 p.p. de dívida no ano 3
        </Button>
        <div className="flex items-center gap-2 text-muted">
          Prêmio de risco endógeno
          <Segmented value={fb} onChange={setFb} options={[{ value: "on", label: "ligado" }, { value: "off", label: "desligado" }]} />
        </div>
      </Controls>
      <Controls>
        <Slider className="min-w-44 flex-1" label="κ (p.p. de juro por p.p. de dívida)" value={kappa} min={0} max={0.3} step={0.01} onChange={setKappa} format={(v) => num(v, 2)} />
        <Slider className="min-w-44 flex-1" label="Limiar de desconfiança" value={thr} min={50} max={110} step={1} onChange={setThr} format={(v) => pct(v, 0)} />
        <Slider className="min-w-44 flex-1" label="Primário" value={s} min={-2} max={5} step={0.1} onChange={setS} format={(v) => sgn(v, 1)} />
        <Slider className="min-w-44 flex-1" label="Crescimento g" value={g} min={-2} max={5} step={0.1} onChange={setG} format={(v) => pct(v, 1)} />
      </Controls>
      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-[1fr_1fr_240px]">
        <Panel title="Dívida/PIB (%)">
          <LineChart
            height={260}
            xDomain={[0, YEARS]}
            yDomain={[40, 200]}
            xLabel="anos"
            yFormat={(v) => `${v}%`}
            series={[
              { id: "m", label: on ? "com prêmio de risco" : "sem prêmio de risco", color: exploding ? "#f87171" : "#fb7185", width: 2.5, points: cut(main.debt) },
              { id: "a", label: on ? "sem prêmio de risco" : "com prêmio de risco", color: "#8a93a8", dashed: true, points: cut(alt.debt) },
            ]}
            hMarkers={tip !== null && tip < 200 ? [{ y: tip, label: `ponto de não retorno ≈ ${num(tip, 0)}%`, color: "#fbbf24" }] : []}
            markers={shock ? [{ x: 3, label: "choque", color: "#f87171" }] : []}
            dots={[{ x: year, y: Math.min(dNow, 199), color: exploding ? "#f87171" : "#34d399" }]}
          />
        </Panel>
        <Panel title="Juro real exigido pelo mercado (%)">
          <LineChart
            height={260}
            xDomain={[0, YEARS]}
            yDomain={[0, 20]}
            xLabel="anos"
            yFormat={(v) => `${v}%`}
            series={[{ id: "r", label: "r", color: "#fbbf24", width: 2.5, points: cut(main.rate) }]}
            hMarkers={[{ y: R0, label: "juro sem prêmio", color: "#5a6275" }]}
          />
        </Panel>
        <div className="grid content-start gap-2 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-4 2xl:col-span-1 2xl:grid-cols-1">
          <Stat label={`Dívida no ano ${year}`} value={pct(dNow, 0)} tone={dNow > 100 ? "bad" : dNow > D0 ? "warn" : "good"} />
          <Stat label="Juro real" value={pct(rNow, 1)} tone={rNow > 8 ? "bad" : "neutral"} />
          <Stat
            label="Ponto de não retorno"
            value={tip === null ? "não há" : tip === 0 ? "já passou" : pct(tip, 0)}
            tone={tip !== null && tip < 100 ? "warn" : "neutral"}
            hint="acima dele a dívida cresce sozinha"
          />
        </div>
      </div>
      <Callout tone={exploding ? "bad" : "info"}>
        {exploding ? (
          <>
            <b className="text-bad">Bola de neve.</b> A dívida passou do ponto de não retorno: o mercado cobra mais para rolar, o
            juro maior aumenta a dívida, que eleva o prêmio de novo. O mesmo primário que bastava antes já não basta. No limite,
            surge a tentação de usar a política monetária para aliviar o Tesouro — a dominância fiscal.
          </>
        ) : (
          <>
            Com primário de {sgn(s, 1)}% a dívida fica contida. Mas repare no ponto de não retorno: um choque (recessão, socorro a bancos, desvalorização) que empurre a dívida para além dele muda tudo quando o prêmio de risco reage à dívida.
          </>
        )}
      </Callout>
      <p className="font-mono text-[11px] text-faint">r(d) = r₀ + κ · max(0, d − limiar) · dₜ₊₁ = dₜ(1 + r(dₜ))/(1 + g) − s</p>
      <p className="text-xs text-faint">
        Experimente: ligue o choque e aperte ▶; depois desligue o prêmio de risco e veja a mesma economia se recuperar. Por fim,
        suba o primário até o ponto de não retorno passar de 100%.
      </p>
    </div>
  );
}
