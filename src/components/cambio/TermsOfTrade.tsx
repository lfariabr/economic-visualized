"use client";

import { useRef, useState } from "react";
import { Button, Callout, Controls, Panel, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { useTicker } from "@/lib/useTicker";
import { TOT_PATH, dutch } from "./fxModel";
import { nf, pct } from "./fmtBR";

const Y0 = TOT_PATH[0][0];
const Y1 = TOT_PATH[TOT_PATH.length - 1][0];

export function TermsOfTrade() {
  const [beta, setBeta] = useState(0.5);
  const [save, setSave] = useState(0);
  const idx = useRef(TOT_PATH.length - 1);
  const ticker = useTicker(
    () => {
      if (idx.current >= TOT_PATH.length - 1) return ticker.pause();
      idx.current += 1;
    },
    { speed: 1 / 16 },
  );
  const i = idx.current;
  const rows = dutch(beta, save);
  const noSave = dutch(beta, 0);
  const shown = rows.slice(0, i + 1);
  const cur = shown[shown.length - 1];
  const lost = rows[0].ind - cur.ind;

  return (
    <div className="space-y-3">
      <Controls>
        <Button variant="primary" onClick={() => (i >= TOT_PATH.length - 1 ? ((idx.current = 0), ticker.play()) : ticker.toggle())}>
          {ticker.running ? "Pausar" : `Rodar ${Y0}–${Y1}`}
        </Button>
        <Button onClick={() => (i < TOT_PATH.length - 1 ? ticker.tick() : undefined)}>+1 ano</Button>
        <Button variant="ghost" onClick={() => ((idx.current = 0), ticker.refresh())}>
          {Y0}
        </Button>
        <Slider label="Sensibilidade do câmbio aos termos de troca β" value={beta} min={0} max={1} step={0.05} onChange={setBeta} format={(v) => nf(v, 2)} className="w-full sm:w-80" />
        <Slider label="Receita poupada (fundo soberano / reservas)" value={save} min={0} max={0.9} step={0.05} onChange={setSave} format={(v) => pct(v * 100, 0)} className="w-full sm:w-80" />
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-4">
          <Panel title={`Termos de troca e força do real (2000 = 100) · ${cur.year}`}>
            <LineChart
              series={[
                { id: "tot", label: "termos de troca", color: "#fbbf24", points: shown.map((r) => [r.year, r.tot]) },
                { id: "er", label: "força do real (inverso do câmbio real)", color: "#2dd4bf", width: 2.5, points: shown.map((r) => [r.year, (100 * rows[0].Er) / r.Er]) },
              ]}
              xDomain={[Y0, Y1]}
              yDomain={[50, 250]}
              height={220}
              xLabel="ano"
              bands={[{ from: 2003, to: 2011, color: "#fbbf24", label: "boom das commodities" }]}
              xFormat={(v) => String(Math.round(v))}
              yFormat={(v) => nf(v, 0)}
            />
          </Panel>
          <Panel title="Indústria de transformação (% do PIB, estilizado)">
            <LineChart
              series={[
                { id: "ind", label: "com a poupança escolhida", color: "#a78bfa", width: 2.5, points: shown.map((r) => [r.year, r.ind]) },
                ...(save > 0 ? [{ id: "ns", label: "sem poupar nada", color: "#5a6275", dashed: true, points: noSave.slice(0, i + 1).map((r) => [r.year, r.ind] as [number, number]) }] : []),
              ]}
              xDomain={[Y0, Y1]}
              yDomain={[6, 20]}
              height={180}
              xLabel="ano"
              xFormat={(v) => String(Math.round(v))}
              yFormat={(v) => nf(v, 0) + "%"}
            />
          </Panel>
        </div>
        <div className="grid grid-cols-2 content-start gap-3 lg:grid-cols-1">
          <Stat label="Ano" value={String(cur.year)} />
          <Stat label="Termos de troca" value={nf(cur.tot, 0)} tone={cur.tot > 160 ? "good" : "neutral"} hint="preço exportado ÷ importado" />
          <Stat label="Câmbio real" value={`R$ ${nf(cur.Er, 2)}`} tone={cur.Er < 2.3 ? "warn" : "neutral"} hint="real forte = R$ baixo" />
          <Stat label="Indústria" value={pct(cur.ind, 1)} tone={lost > 4 ? "bad" : lost > 2 ? "warn" : "neutral"} hint={`${nf(-lost, 1)} p.p. desde ${Y0}`} />
        </div>
      </div>
      {lost > 3 && (
        <Callout tone="bad">
          Doença holandesa: a enxurrada de dólares das commodities valoriza o real, e a indústria, que concorre com importados, perde competitividade. Quando
          o boom passa, a capacidade fechada não volta sozinha (histerese). É uma das explicações — debatidas — para a desindustrialização brasileira; custo
          de produção, tributos e produtividade também pesam.
        </Callout>
      )}
      <p className="font-mono text-[11px] text-faint">
        ln E_real = ln E_ref − β·(1 − poupança)·ln(ToT/100) · Δindústria = 1,2·ln(E_real/E_ref) se o real está forte, 0,5·ln(…) se está fraco
      </p>
      <p className="text-xs text-faint">
        Experimente: rode 2000–2024 com β = 0,5 e veja a indústria encolher durante o boom. Depois poupe 70% da receita extra (como o fundo soberano da
        Noruega) e rode de novo. Termos de troca estilizados, não a série oficial.
      </p>
    </div>
  );
}
