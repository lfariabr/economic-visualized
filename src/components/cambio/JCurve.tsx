"use client";

import { useRef, useState } from "react";
import { Button, Callout, Controls, Panel, Segmented, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { useTicker } from "@/lib/useTicker";
import { J_QUARTERS, jCurve, type JParams } from "./fxModel";
import { nf } from "./fmtBR";

export function JCurve() {
  const [d, setD] = useState(0.3);
  const [ex, setEx] = useState(0.8);
  const [em, setEm] = useState(0.6);
  const [speed, setSpeed] = useState(0.3);
  const [pricing, setPricing] = useState<JParams["pricing"]>("reais");
  const q = useRef(J_QUARTERS);
  const ticker = useTicker(
    () => {
      if (q.current >= J_QUARTERS) return ticker.pause();
      q.current += 1;
    },
    { speed: 1 / 18 },
  );
  const now = q.current;
  const rows = jCurve({ d, ex, em, speed, pricing, X0: 100, M0: 95 });
  const shown = rows.slice(0, now + 1);
  const cur = shown[shown.length - 1];
  const ml = ex + em > 1;
  const trough = Math.min(...rows.map((r) => r.tb));
  const recover = rows.find((r) => r.t > 1 && r.tb >= rows[0].tb)?.t;
  const fmtQ = (t: number) => (t === 0 ? "antes" : `T${t}`);

  return (
    <div className="space-y-3">
      <Controls>
        <Button variant="primary" onClick={() => (now >= J_QUARTERS ? ((q.current = 0), ticker.play()) : ticker.toggle())}>
          {ticker.running ? "Pausar" : "Desvalorizar e rodar"}
        </Button>
        <Button onClick={() => (now < J_QUARTERS ? ticker.tick() : undefined)}>+1 trimestre</Button>
        <Button variant="ghost" onClick={() => ((q.current = 0), ticker.refresh())}>
          Início
        </Button>
        <Segmented
          value={pricing}
          options={[
            { value: "reais", label: "Pauta de manufaturados (preço em R$)" },
            { value: "dolar", label: "Pauta de commodities (preço em US$)" },
          ]}
          onChange={setPricing}
        />
        <Slider label="Desvalorização do real" value={d} min={0.05} max={0.6} step={0.05} onChange={setD} format={(v) => `${nf(v * 100, 0)}%`} className="w-full sm:w-60" />
        <Slider label="Elasticidade exportações εx" value={ex} min={0} max={2} step={0.05} onChange={setEx} format={(v) => nf(v, 2)} className="w-full sm:w-60" />
        <Slider label="Elasticidade importações εm" value={em} min={0} max={2} step={0.05} onChange={setEm} format={(v) => nf(v, 2)} className="w-full sm:w-60" />
        <Slider label="Velocidade de ajuste" value={speed} min={0.05} max={0.8} step={0.05} onChange={setSpeed} format={(v) => `${nf(v * 100, 0)}%/tri`} className="w-full sm:w-60" />
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Panel title="Saldo comercial (US$ bi por trimestre)">
          <LineChart
            series={[
              { id: "tb", label: "saldo", color: "#2dd4bf", points: shown.map((r) => [r.t, r.tb]), width: 2.5, area: true },
            ]}
            xDomain={[0, J_QUARTERS]}
            yDomain={[Math.min(-10, Math.floor(trough) - 4), Math.max(25, ...rows.map((r) => r.tb + 4))]}
            height={270}
            xLabel="trimestre"
            hMarkers={[{ y: 0, label: "equilíbrio", color: "#8a93a8" }]}
            markers={[{ x: 1, label: "desvalorização", color: "#fbbf24" }]}
            dots={[{ x: cur.t, y: cur.tb, color: cur.tb < rows[0].tb ? "#f87171" : "#34d399" }]}
            xFormat={(v) => fmtQ(Math.round(v))}
            yFormat={(v) => nf(v, 0)}
          />
          <p className="mt-2 font-mono text-[11px] text-faint">
            Qx = (1+d)^(εx·a) · Qm = (1+d)^(−εm·a) · a(t) = 1 − (1 − v)^(t−1) · saldo = X0·Qx·[1/(1+d) se preço em R$] − M0·Qm
          </p>
        </Panel>
        <div className="grid grid-cols-2 content-start gap-3 lg:grid-cols-1">
          <Stat label="Trimestre" value={fmtQ(now)} hint={`X ${nf(cur.X, 1)} · M ${nf(cur.M, 1)}`} />
          <Stat label="Saldo agora" value={`US$ ${nf(cur.tb, 1)} bi`} tone={cur.tb < 0 ? "bad" : cur.tb < rows[0].tb ? "warn" : "good"} hint={`antes: US$ ${nf(rows[0].tb, 1)} bi`} />
          <Stat label="Fundo do J" value={`US$ ${nf(trough, 1)} bi`} tone={trough < 0 ? "bad" : "neutral"} />
          <Stat label="Marshall-Lerner" value={ml ? "satisfeita" : "não satisfeita"} tone={ml ? "good" : "bad"} hint={`εx + εm = ${nf(ex + em, 2)} ${ml ? ">" : "<"} 1`} />
          <Stat label="Recupera o saldo inicial" value={recover !== undefined ? fmtQ(recover) : "nunca"} tone={recover !== undefined ? "neutral" : "bad"} />
        </div>
      </div>
      {pricing === "reais" && !ml && (
        <Callout tone="bad">
          Se exportações e importações reagem pouco ao preço (εx + εm &lt; 1, condição de Marshall-Lerner violada), a desvalorização só piora o saldo: o
          país vende o mesmo volume mais barato em dólar e continua importando quase igual.
        </Callout>
      )}
      {pricing === "dolar" && (
        <Callout tone="info">
          Para quem exporta commodities cotadas em dólar — caso de boa parte da pauta brasileira — não há o “mergulho” do J: o preço em dólar não cai, e a
          desvalorização melhora o saldo desde o início, pela queda das importações e pelo estímulo ao volume.
        </Callout>
      )}
      <p className="text-xs text-faint">
        Experimente: rode com a pauta de manufaturados e veja o J; depois zere as elasticidades para 0,3 e 0,3 — o saldo afunda e não volta. Troque para
        commodities e o J desaparece.
      </p>
    </div>
  );
}
