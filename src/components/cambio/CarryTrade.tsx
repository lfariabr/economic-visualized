"use client";

import { useRef, useState } from "react";
import { Button, Callout, Controls, Panel, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { useTicker } from "@/lib/useTicker";
import { E0, UIP, uipStep, uipTarget } from "./fxModel";
import { nf, pct, spct } from "./fmtBR";

type Row = { t: number; E: number; flow: number };
const MAX_T = 60;

export function CarryTrade() {
  const [selic, setSelic] = useState(15);
  const [fed, setFed] = useState(4);
  const [risk, setRisk] = useState(2);
  const hist = useRef<Row[]>([{ t: 0, E: E0, flow: 0 }]);
  const phase = useRef(0);
  const carry = selic - fed - risk;
  const carryRef = useRef(carry);
  carryRef.current = carry;

  const stepMonth = () => {
    const h = hist.current;
    const last = h[h.length - 1];
    const s = uipStep(last.E, carryRef.current);
    const next = { t: last.t + 1, E: s.E, flow: s.flow };
    hist.current = h.length > MAX_T ? [...h.slice(1), next] : [...h, next];
  };
  const ticker = useTicker(
    () => {
      phase.current += 1;
      if (phase.current % 20 === 0) stepMonth();
    },
    { speed: 1 },
  );

  const h = hist.current;
  const last = h[h.length - 1];
  const target = uipTarget(carry);
  const flowNow = uipStep(last.E, carry).flow;
  const fwd = last.E * ((1 + selic / 100) / (1 + fed / 100));
  const t0 = h[0].t;

  // partículas: n proporcional ao fluxo; direção pelo sinal
  const n = Math.min(26, Math.round(Math.abs(flowNow) * 2.2));
  const dir = flowNow >= 0 ? 1 : -1;
  const frame = phase.current;

  const reset = () => {
    hist.current = [{ t: 0, E: E0, flow: 0 }];
    setSelic(15);
    setFed(4);
    setRisk(2);
    ticker.refresh();
  };

  return (
    <div className="space-y-3">
      <Controls>
        <Button variant="primary" onClick={ticker.toggle}>
          {ticker.running ? "Pausar" : "Rodar meses"}
        </Button>
        <Button onClick={() => (stepMonth(), ticker.refresh())}>+1 mês</Button>
        <Button onClick={() => setRisk((r) => Math.min(10, r + 3))}>Crise de confiança (risco +3 p.p.)</Button>
        <Button onClick={() => setFed((f) => Math.min(10, f + 2))}>Fed sobe 2 p.p.</Button>
        <Button onClick={() => setSelic((s) => Math.max(2, s - 3))}>Copom corta 3 p.p.</Button>
        <Button variant="ghost" onClick={reset}>
          Reiniciar
        </Button>
        <Slider label="Selic" value={selic} min={2} max={20} step={0.25} onChange={setSelic} format={(v) => pct(v, 2)} className="w-full sm:w-60" />
        <Slider label="Fed funds" value={fed} min={0} max={10} step={0.25} onChange={setFed} format={(v) => pct(v, 2)} className="w-full sm:w-60" />
        <Slider label="Risco-país (CDS 5a)" value={risk} min={0.5} max={10} step={0.25} onChange={setRisk} format={(v) => `${nf(v * 100, 0)} bps`} className="w-full sm:w-60" />
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-4">
          <Panel title="Fluxo de capital estrangeiro">
            <svg viewBox="0 0 600 120" className="w-full">
              <rect x={10} y={30} width={110} height={60} rx={10} fill="#171b24" stroke="#242a38" />
              <text x={65} y={56} textAnchor="middle" fontSize={13} fill="#e7e9f0">
                EUA
              </text>
              <text x={65} y={74} textAnchor="middle" fontSize={11} fill="#8a93a8">
                {pct(fed, 2)}
              </text>
              <rect x={480} y={30} width={110} height={60} rx={10} fill="#171b24" stroke="#242a38" />
              <text x={535} y={56} textAnchor="middle" fontSize={13} fill="#e7e9f0">
                Brasil
              </text>
              <text x={535} y={74} textAnchor="middle" fontSize={11} fill="#8a93a8">
                {pct(selic, 1)} − {pct(risk, 1)}
              </text>
              <line x1={130} x2={470} y1={60} y2={60} stroke="#242a38" strokeWidth={18} strokeLinecap="round" />
              {Array.from({ length: n }, (_, i) => {
                const u = (((i / Math.max(1, n)) + (frame * 0.006 * (1 + Math.abs(flowNow) / 4))) % 1 + 1) % 1;
                const x = dir > 0 ? 135 + u * 330 : 465 - u * 330;
                const y = 60 + ((i * 7) % 11) - 5;
                return <circle key={i} cx={Math.round(x * 10) / 10} cy={y} r={3.2} fill={dir > 0 ? "#34d399" : "#f87171"} />;
              })}
              <text x={300} y={20} textAnchor="middle" fontSize={11.5} fill={Math.abs(flowNow) < 0.2 ? "#8a93a8" : flowNow > 0 ? "#34d399" : "#f87171"}>
                {Math.abs(flowNow) < 0.2 ? "fluxo equilibrado" : flowNow > 0 ? `entrando US$ ${nf(flowNow, 1)} bi/mês →` : `← saindo US$ ${nf(-flowNow, 1)} bi/mês`}
              </text>
              <text x={300} y={108} textAnchor="middle" fontSize={11} fill="#8a93a8">
                carry líquido = {nf(selic, 2)} − {nf(fed, 2)} − {nf(risk, 2)} = {nf(carry, 2)} p.p.
              </text>
            </svg>
          </Panel>
          <Panel title="Dólar (R$/US$) mês a mês">
            <LineChart
              series={[
                { id: "e", label: "dólar à vista", color: "#2dd4bf", points: h.map((r) => [r.t, r.E]), width: 2.5 },
                { id: "tgt", label: "equilíbrio para o carry atual", color: "#8a93a8", dashed: true, points: [[t0, target], [Math.max(t0 + MAX_T, last.t), target]] },
              ]}
              xDomain={[t0, Math.max(t0 + MAX_T, last.t)]}
              yDomain={[3.5, 8]}
              height={220}
              xLabel="mês"
              xFormat={(v) => String(Math.round(v))}
              yFormat={(v) => nf(v, 1)}
              dots={[{ x: last.t, y: last.E, color: "#2dd4bf" }]}
            />
          </Panel>
        </div>
        <div className="grid grid-cols-2 content-start gap-3 lg:grid-cols-1">
          <Stat label="Dólar" value={`R$ ${nf(last.E, 2)}`} tone={last.E > 6 ? "bad" : last.E < 5 ? "good" : "neutral"} hint={`tende a R$ ${nf(target, 2)}`} />
          <Stat label="Diferencial de juros" value={`${nf(selic - fed, 2)} p.p.`} hint="Selic − Fed" />
          <Stat label="Carry líquido de risco" value={`${nf(carry, 2)} p.p.`} tone={carry < UIP.c0 - 2 ? "bad" : carry > UIP.c0 + 2 ? "good" : "neutral"} hint={`base ≈ ${nf(UIP.c0, 0)} p.p.`} />
          <Stat label="Dólar futuro 12m" value={`R$ ${nf(fwd, 2)}`} hint={`paridade coberta: ${spct((fwd / last.E - 1) * 100)}`} />
        </div>
      </div>
      {carry < UIP.c0 - 2 && (
        <Callout tone="bad">
          O prêmio por correr risco no Brasil encolheu: o investidor desmonta o carry trade, vende reais e compra dólares. O dólar sobe até o real ficar
          “barato” o bastante para compensar — aí o fluxo para de sair.
        </Callout>
      )}
      <p className="font-mono text-[11px] text-faint">
        UIP: i − i* = ρ + E[Δe] · carry = Selic − Fed − risco · fluxo = κ·(carry − carry exigido(E)) · dólar futuro = E·(1 + i)/(1 + i*)
      </p>
      <p className="text-xs text-faint">
        Experimente: rode os meses e clique em “Crise de confiança” duas vezes — o capital foge e o dólar passa de R$ 6. Depois suba a Selic até o fluxo
        voltar a entrar.
      </p>
    </div>
  );
}
