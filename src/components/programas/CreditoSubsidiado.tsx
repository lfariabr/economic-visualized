"use client";

import { useState } from "react";
import { LineChart } from "@/components/viz/Chart";
import { Button, Controls, Panel, Segmented, Slider, Stat } from "@/components/ui";
import { useTicker } from "@/lib/useTicker";
import { BNDES_HIST, financiado, subsidioAnual, tlpAprox, type Regime } from "./creditoModel";
import { num, pct } from "./fmt";

const LAST = BNDES_HIST.length - 1;

export function CreditoSubsidiado() {
  const [idx, setIdx] = useState(LAST);
  const [regime, setRegime] = useState<Regime>("tjlp");
  const [deQualquerJeito, setDQJ] = useState(0.6);
  const [mult, setMult] = useState(1);

  const ticker = useTicker(
    () =>
      setIdx((i) => {
        if (i >= LAST) {
          ticker.pause();
          return LAST;
        }
        return i + 1;
      }),
    { speed: 0.04 },
  );

  const h = BNDES_HIST[idx];
  const sub = (r: Regime) => BNDES_HIST.map((x) => [x.ano, subsidioAnual(x, r) * mult] as [number, number]);
  const ate = BNDES_HIST.slice(0, idx + 1);
  const acum = ate.reduce((a, x) => a + subsidioAnual(x, regime) * mult, 0);
  const finAte = ate.reduce((a, x, i) => a + (i ? Math.max(0, x.saldo - ate[i - 1].saldo) : x.saldo), 0) * mult;
  const adicional = finAte * (1 - deQualquerJeito);
  const custoPorReal = adicional > 0 ? acum / adicional : Infinity;
  const taxa = regime === "tjlp" ? h.tjlp : tlpAprox(h.ipca);
  const subAno = subsidioAnual(h, regime) * mult;

  return (
    <div className="space-y-3">
      <Controls>
        <Button variant="primary" onClick={() => (idx >= LAST ? (setIdx(0), ticker.play()) : ticker.toggle())}>
          {ticker.running ? "❚❚ Pausar" : "▶ Rodar 2007–2024"}
        </Button>
        <Slider className="min-w-52 flex-1" label="Ano" value={BNDES_HIST[idx].ano} min={2007} max={2024} onChange={(v) => setIdx(v - 2007)} format={(v) => String(v)} />
        <Segmented
          value={regime}
          onChange={setRegime}
          options={[
            { value: "tjlp", label: "histórico (TJLP)" },
            { value: "tlp", label: "e se fosse TLP desde 2007?" },
          ]}
        />
      </Controls>
      <Controls>
        <Slider className="min-w-60 flex-1" label="Projetos que sairiam de qualquer jeito" value={deQualquerJeito * 100} min={0} max={100} step={5} onChange={(v) => setDQJ(v / 100)} format={(v) => pct(v, 0)} />
        <Slider className="min-w-60 flex-1" label="Escala do saldo (× histórico)" value={mult} min={0.25} max={2} step={0.05} onChange={setMult} format={(v) => `${num(v, 2)}×`} />
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="grid min-w-0 gap-4">
          <Panel title="Quanto o Tesouro paga × quanto o BNDES cobra (% a.a.)">
            <LineChart
              height={200}
              xDomain={[2007, 2024]}
              yDomain={[0, 16]}
              xFormat={(v) => String(v)}
              yFormat={(v) => `${v}%`}
              series={[
                { id: "selic", label: "Selic (custo de captação do Tesouro)", color: "#f87171", width: 2.5, points: BNDES_HIST.map((x) => [x.ano, x.selic]) },
                { id: "tjlp", label: "TJLP", color: "#fbbf24", dashed: regime !== "tjlp", points: BNDES_HIST.map((x) => [x.ano, x.tjlp]) },
                { id: "tlp", label: "TLP ≈ IPCA + 5%", color: "#60a5fa", dashed: regime !== "tlp", points: BNDES_HIST.map((x) => [x.ano, tlpAprox(x.ipca)]) },
              ]}
              markers={[
                { x: 2018, label: "TLP (Lei 13.483/2017)", color: "#60a5fa" },
                { x: h.ano, color: "#e7e9f0" },
              ]}
            />
          </Panel>
          <Panel title="Subsídio implícito por ano (R$ bi) = (Selic − taxa) × saldo">
            <LineChart
              height={190}
              xDomain={[2007, 2024]}
              xFormat={(v) => String(v)}
              yFormat={(v) => num(v, 0)}
              series={[
                { id: "s1", label: "com TJLP (histórico)", color: "#fbbf24", area: regime === "tjlp", width: regime === "tjlp" ? 2.5 : 1.3, points: sub("tjlp") },
                { id: "s2", label: "se fosse TLP", color: "#60a5fa", area: regime === "tlp", width: regime === "tlp" ? 2.5 : 1.3, points: sub("tlp") },
              ]}
              bands={[{ from: 2009, to: 2015, color: "#f87171", label: "pico dos aportes" }]}
              markers={[{ x: h.ano, color: "#e7e9f0" }]}
              hMarkers={[{ y: 0, color: "#5a6275" }]}
            />
          </Panel>
        </div>
        <div className="grid content-start gap-2">
          <Stat label={`Saldo do Tesouro no BNDES (${h.ano})`} value={`R$ ${num(h.saldo * mult, 0)} bi`} hint="valores aproximados" />
          <Stat label="Spread Selic − taxa" value={`${num(h.selic - taxa, 1)} p.p.`} tone={h.selic - taxa > 4 ? "bad" : h.selic - taxa > 1 ? "warn" : "good"} />
          <Stat label="Subsídio no ano" value={`R$ ${num(subAno, 1)} bi`} tone={subAno > 20 ? "bad" : subAno > 5 ? "warn" : "neutral"} />
          <Stat label={`Subsídio acumulado até ${h.ano}`} value={`R$ ${num(acum, 0)} bi`} tone={acum > 150 ? "bad" : "neutral"} />
          <Stat label="Investimento adicional" value={`R$ ${num(adicional, 0)} bi`} hint={`de ~R$ ${num(finAte, 0)} bi financiados`} />
          <Stat
            label="Subsídio por R$ adicional"
            value={Number.isFinite(custoPorReal) ? `R$ ${num(custoPorReal, 2)}` : "∞"}
            tone={custoPorReal > 0.6 ? "bad" : custoPorReal > 0.3 ? "warn" : "good"}
            hint="se 100% sairia de qualquer jeito, o subsídio é pura transferência"
          />
        </div>
      </div>
      <p className="font-mono text-[11px] text-faint">
        subsídio = (i_captação − i_empréstimo) × saldo · TLP = IPCA + juro real NTN-B 5a · custo por R$ adicional = Σ subsídio ÷ [(1 − s) × financiado] · financiado total ≈ R$ {num(financiado, 0)} bi
      </p>
      <p className="text-xs text-faint">
        Experimente: aperte ▶ e veja o subsídio crescer junto com os aportes de 2009–2015, quando a Selic ficou bem acima da
        TJLP. Troque para “TLP desde 2007”: o spread quase some. Depois suba “projetos que sairiam de qualquer jeito” para 80% —
        cada real de investimento realmente novo passa a custar muito mais.
      </p>
    </div>
  );
}
