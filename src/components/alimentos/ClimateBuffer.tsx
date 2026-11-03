"use client";

import { useMemo, useRef, useState } from "react";
import { Button, Callout, Controls, Panel, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { useTicker } from "@/lib/useTicker";
import { BUFFER_MONTHS, FOOD_WEIGHT, buffer, volatility } from "./foodModel";
import { nf, spct } from "./fmtBR";

export function ClimateBuffer() {
  const [ed, setEd] = useState(0.3);
  const [band, setBand] = useState(8);
  const [capacity, setCapacity] = useState(0.4);
  const [shockSize, setShockSize] = useState(0.15);
  const [shocks, setShocks] = useState<number[]>([]);
  const [seed, setSeed] = useState(7);
  const t = useRef(0);
  const ticker = useTicker(
    () => {
      if (t.current >= BUFFER_MONTHS) return ticker.pause();
      t.current += 1;
    },
    { speed: 1 / 12 },
  );
  const now = t.current;

  const free = useMemo(() => buffer({ ed, band, capacity, policy: false, shocks, shockSize, seed }), [ed, band, capacity, shocks, shockSize, seed]);
  const pol = useMemo(() => buffer({ ed, band, capacity, policy: true, shocks, shockSize, seed }), [ed, band, capacity, shocks, shockSize, seed]);
  const upto = <T,>(xs: T[]) => xs.slice(0, now + 1);
  const f = free[now];
  const p = pol[now];
  const contribFree = (f.ipca12Free * FOOD_WEIGHT);
  const contribPol = (p.ipca12 * FOOD_WEIGHT);
  const volFree = volatility(upto(free).map((r) => r.pFree));
  const volPol = volatility(upto(pol).map((r) => r.p));

  const reset = () => {
    t.current = 0;
    setShocks([]);
    ticker.pause();
    ticker.refresh();
  };

  return (
    <div className="space-y-3">
      <Controls>
        <Button variant="primary" onClick={() => (now >= BUFFER_MONTHS ? ((t.current = 0), ticker.play()) : ticker.toggle())}>
          {ticker.running ? "Pausar" : "Rodar meses"}
        </Button>
        <Button onClick={() => (now < BUFFER_MONTHS ? ticker.tick() : undefined)}>+1 mês</Button>
        <Button onClick={() => setShocks((s) => (s.includes(now) ? s : [...s, now]))}>Aplicar choque climático agora</Button>
        <Button variant="ghost" onClick={() => setSeed((s) => s + 1)}>
          Outro clima
        </Button>
        <Button variant="ghost" onClick={reset}>
          Reiniciar
        </Button>
        <Slider label="Tamanho do choque" value={shockSize} min={0.05} max={0.3} step={0.01} onChange={setShockSize} format={(v) => `−${nf(v * 100, 0)}%`} className="w-full sm:w-60" />
        <Slider label="Elasticidade da demanda" value={ed} min={0.15} max={1} step={0.05} onChange={setEd} format={(v) => nf(v, 2)} className="w-full sm:w-60" />
        <Slider label="Banda de intervenção ±" value={band} min={2} max={25} step={1} onChange={setBand} format={(v) => `${v}%`} className="w-full sm:w-60" />
        <Slider label="Capacidade dos armazéns" value={capacity} min={0} max={1} step={0.02} onChange={setCapacity} format={(v) => `${nf(v * 100, 0)}% de 1 mês`} className="w-full sm:w-60" />
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-4">
          <Panel title={`Preço dos alimentos (índice) · mês ${now}`}>
            <LineChart
              series={[
                { id: "free", label: "mercado livre", color: "#f87171", points: upto(free).map((r) => [r.t, r.pFree]) },
                { id: "pol", label: "com estoque regulador", color: "#f59e0b", points: upto(pol).map((r) => [r.t, r.p]), width: 2.5 },
                { id: "trend", label: "tendência", color: "#5a6275", dashed: true, points: free.map((r) => [r.t, 100 * 1.0035 ** r.t]) },
              ]}
              xDomain={[0, BUFFER_MONTHS]}
              yDomain={[80, 180]}
              height={230}
              xLabel="mês"
              markers={shocks.map((s) => ({ x: s, label: "choque", color: "#fbbf24" }))}
              xFormat={(v) => String(Math.round(v))}
              yFormat={(v) => String(Math.round(v))}
            />
          </Panel>
          <Panel title="Contribuição dos alimentos ao IPCA em 12 meses (p.p.)">
            <LineChart
              series={[
                { id: "free", label: "mercado livre", color: "#f87171", points: upto(free).map((r) => [r.t, r.ipca12Free * FOOD_WEIGHT]) },
                { id: "pol", label: "com estoque regulador", color: "#f59e0b", points: upto(pol).map((r) => [r.t, r.ipca12 * FOOD_WEIGHT]), width: 2.5 },
                { id: "stock", label: "estoque (1 = 10% de 1 mês)", color: "#60a5fa", dashed: true, points: upto(pol).map((r) => [r.t, r.stock * 10]) },
              ]}
              xDomain={[0, BUFFER_MONTHS]}
              yDomain={[-3, 8]}
              height={200}
              xLabel="mês"
              hMarkers={[{ y: 0.95, label: "normal ≈ 0,9 p.p.", color: "#5a6275" }]}
              xFormat={(v) => String(Math.round(v))}
              yFormat={(v) => nf(v, 0)}
            />
          </Panel>
        </div>
        <div className="grid grid-cols-2 content-start gap-3 lg:grid-cols-1">
          <Stat label="Alimentos 12m · livre" value={spct(f.ipca12Free)} tone={f.ipca12Free > 10 ? "bad" : f.ipca12Free > 6 ? "warn" : "neutral"} hint={`→ ${nf(contribFree, 2)} p.p. no IPCA`} />
          <Stat label="Alimentos 12m · Conab" value={spct(p.ipca12)} tone={p.ipca12 > 10 ? "bad" : p.ipca12 > 6 ? "warn" : "good"} hint={`→ ${nf(contribPol, 2)} p.p. no IPCA`} />
          <Stat label="Volatilidade mensal" value={`${nf(volFree, 1)} → ${nf(volPol, 1)}`} tone={volPol < volFree * 0.8 ? "good" : "neutral"} hint="desvio-padrão, % ao mês" />
          <Stat label="Estoque público" value={`${nf(p.stock * 100, 1)}%`} tone={p.stock < 0.01 && capacity > 0 ? "bad" : "neutral"} hint="de um mês de consumo" />
          <Stat label="Custo de carregamento" value={`${nf(p.cost, 1)}`} tone={p.cost > 20 ? "warn" : "neutral"} hint="acumulado, % de 1 mês de safra" />
        </div>
      </div>
      {shocks.length > 0 && p.stock < 0.005 && capacity > 0 && f.pFree > 100 * 1.0035 ** now * (1 + band / 100) && (
        <Callout tone="bad">O armazém esvaziou: daqui em diante o estoque regulador não segura mais nada e o preço volta a seguir o mercado livre.</Callout>
      )}
      <p className="font-mono text-[11px] text-faint">
        P = 100·1,0035^t·X^(−1/εd) · se P &gt; teto, Conab vende; se P &lt; piso, compra · contribuição ao IPCA ≈ 21% × inflação de alimentos 12m
      </p>
      <p className="text-xs text-faint">
        Experimente: rode até o mês 12, aplique um choque de −20% e compare as duas curvas. Depois zere a capacidade dos armazéns (sem estoque, sem
        amortecedor) ou dobre o choque até o estoque acabar. Modelo educativo, não previsão.
      </p>
    </div>
  );
}
