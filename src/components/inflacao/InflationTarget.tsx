"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Callout, Controls, Panel, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { useTicker } from "@/lib/useTicker";
import { BAND, META, metaSim } from "./inflacaoModel";
import { br, mesAno, pct } from "./num";

const T = 60;
const Y0 = 2025;

export function InflationTarget() {
  const [seed, setSeed] = useState(2);
  const [sigma, setSigma] = useState(0.1);
  const [strength, setStrength] = useState(0.5);
  const [shocks, setShocks] = useState<Record<number, number>>({});
  const [t, setT] = useState(0);
  const sim = useMemo(() => metaSim(seed, sigma, strength, T, shocks), [seed, sigma, strength, shocks]);
  const ticker = useTicker(() => setT((x) => Math.min(T - 1, x + 1)), { speed: 0.12 });
  const { running, pause } = ticker;
  useEffect(() => {
    if (t >= T - 1 && running) pause();
  }, [t, running, pause]);

  const shown = sim.slice(0, t + 1);
  const cur = sim[t];
  const cartas = shown.filter((m) => m.carta);
  const outMonths = shown.filter((m) => m.out).length;

  const shock = () =>
    setShocks((s) => {
      const n = { ...s };
      for (let k = 1; k <= 3; k++) n[t + k] = (n[t + k] ?? 0) + 0.4;
      return n;
    });

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0 space-y-3">
        <Controls>
          <Slider label="Volatilidade dos choques" value={sigma} min={0.02} max={0.3} step={0.01} onChange={setSigma} format={(x) => `${br(x, 2)} p.p.`} className="w-full sm:w-[48%]" />
          <Slider label="Reação do BC (juros)" value={strength} min={0} max={1} step={0.05} onChange={setStrength} format={(x) => pct(x * 100, 0)} className="w-full sm:w-[48%]" />
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => (t >= T - 1 ? (setT(0), ticker.play()) : ticker.toggle())}>
              {ticker.running ? "Pausar" : "▶ Rodar meses"}
            </Button>
            <Button onClick={ticker.tick} disabled={t >= T - 1}>
              +1 mês
            </Button>
            <Button onClick={shock} disabled={t >= T - 3}>
              ⚡ Choque de oferta
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setSeed(seed + 1);
                setShocks({});
                setT(0);
              }}
            >
              Novo sorteio
            </Button>
          </div>
        </Controls>
        <Panel title="IPCA acumulado em 12 meses" right={<span className="font-mono text-xs text-faint">{mesAno(t, Y0)}</span>}>
          <LineChart
            height={270}
            xDomain={[0, T - 1]}
            yDomain={[0, 8]}
            xFormat={(x) => mesAno(x, Y0)}
            yFormat={(x) => `${br(x, 0)}%`}
            hMarkers={[
              { y: META + BAND, label: "teto 4,5%", color: "#f87171" },
              { y: META, label: "meta 3%", color: "#34d399" },
              { y: META - BAND, label: "piso 1,5%", color: "#f87171" },
            ]}
            markers={cartas.map((c) => ({ x: c.t, label: "carta aberta", color: "#fbbf24" }))}
            bands={shown.filter((m) => m.out).map((m) => ({ from: m.t - 0.5, to: m.t + 0.5, color: "#f87171" }))}
            series={[{ id: "y", label: "IPCA 12m", color: "#fb923c", width: 2.5, points: shown.map((m) => [m.t, m.y12]) }]}
            dots={[{ x: cur.t, y: cur.y12, color: cur.out ? "#f87171" : "#fb923c" }]}
          >
            {(s) => (
              <rect
                x={s.pad.left}
                width={s.width - s.pad.left - s.pad.right}
                y={s.y(META + BAND)}
                height={Math.max(0, s.y(META - BAND) - s.y(META + BAND))}
                fill="#34d399"
                opacity={0.06}
                pointerEvents="none"
              />
            )}
          </LineChart>
        </Panel>
        <p className="font-mono text-xs text-muted">πₘ = π* + ρ(πₘ₋₁ − π*) + ε · ρ = 0,92 − 0,4 × reação · carta se fora da banda por 6 meses seguidos</p>
        <p className="text-xs text-faint">
          Experimente: rode com a reação do BC em 0% e aplique dois choques seguidos — a inflação fica meses acima do teto e sai uma carta
          aberta. Repita com reação de 100%: o mesmo choque passa mais rápido.
        </p>
      </div>
      <div className="grid content-start gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <Stat label="IPCA 12 meses" value={pct(cur.y12, 2)} tone={cur.out ? "bad" : "good"} hint={mesAno(t, Y0)} />
        <Stat label="Meses seguidos fora da banda" value={`${cur.streak}`} tone={cur.streak >= 6 ? "bad" : cur.streak > 0 ? "warn" : "neutral"} hint="6 meses → carta aberta" />
        <Stat label="Cartas abertas" value={`${cartas.length}`} tone={cartas.length ? "bad" : "good"} hint={`${outMonths} de ${t + 1} meses fora da banda`} />
        {cur.carta ? (
          <Callout tone="bad">
            Carta aberta: o presidente do BCB explica ao ministro da Fazenda por que a inflação saiu da banda, o que será feito e em quanto
            tempo ela deve voltar.
          </Callout>
        ) : (
          <Callout tone="info">
            Desde 2025 a meta é contínua: não se olha só dezembro. O IPCA em 12 meses é acompanhado todo mês, e seis meses seguidos fora do
            intervalo configuram descumprimento.
          </Callout>
        )}
      </div>
    </div>
  );
}
