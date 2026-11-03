"use client";

import { useRef, useState } from "react";
import { Button, Callout, Controls, Panel, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { useTicker } from "@/lib/useTicker";
import { PASS_MONTHS, PASS_T0, passThrough } from "./fxModel";
import { nf, pct, spct } from "./fmtBR";

export function PassThrough() {
  const [shock, setShock] = useState(20);
  const [phi, setPhi] = useState(0.25);
  const [lag, setLag] = useState(4);
  const [weight, setWeight] = useState(0.33);
  const [inertia, setInertia] = useState(0.2);
  const [base12, setBase12] = useState(4.5);
  const t = useRef(PASS_MONTHS);
  const ticker = useTicker(
    () => {
      if (t.current >= PASS_MONTHS) return ticker.pause();
      t.current += 1;
    },
    { speed: 1 / 10 },
  );
  const now = t.current;
  const rows = passThrough({ shock, phi, lag, weight, inertia, base12 });
  const shown = rows.slice(0, now + 1);
  const peak = shown.reduce((a, r) => Math.max(a, r.ipca12), 0);
  const cur = shown[shown.length - 1];
  const total = rows.reduce((a, r) => a + (r.m - r.mBase), 0);
  const out = peak > 4.5;

  return (
    <div className="space-y-3">
      <Controls>
        <Button variant="primary" onClick={() => (now >= PASS_MONTHS ? ((t.current = 0), ticker.play()) : ticker.toggle())}>
          {ticker.running ? "Pausar" : "Animar meses"}
        </Button>
        <Button onClick={() => ((t.current = 0), ticker.refresh())} variant="ghost">
          Mês 0
        </Button>
        <Slider label="Alta do dólar" value={shock} min={-20} max={50} step={1} onChange={setShock} format={(v) => spct(v, 0)} className="w-full sm:w-60" />
        <Slider label="Repasse aos comercializáveis φ" value={phi} min={0} max={0.8} step={0.05} onChange={setPhi} format={(v) => pct(v * 100, 0)} className="w-full sm:w-60" />
        <Slider label="Defasagem média" value={lag} min={0.5} max={12} step={0.5} onChange={setLag} format={(v) => `${nf(v, 1)} meses`} className="w-full sm:w-60" />
        <Slider label="Peso dos comercializáveis" value={weight} min={0.2} max={0.5} step={0.01} onChange={setWeight} format={(v) => pct(v * 100, 0)} className="w-full sm:w-60" />
        <Slider label="Inércia (2ª ordem)" value={inertia} min={0} max={0.9} step={0.05} onChange={setInertia} format={(v) => nf(v, 2)} className="w-full sm:w-60" />
        <Slider label="IPCA de partida" value={base12} min={2} max={7} step={0.1} onChange={setBase12} format={(v) => pct(v, 1)} className="w-full sm:w-60" />
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-4">
          <Panel title="IPCA acumulado em 12 meses">
            <LineChart
              series={[
                { id: "ipca", label: "com choque cambial", color: "#2dd4bf", points: shown.map((r) => [r.t, r.ipca12]), width: 2.5 },
                { id: "base", label: "sem choque", color: "#8a93a8", dashed: true, points: rows.map((r) => [r.t, r.ipca12Base]) },
                { id: "teto", label: "teto da meta (4,5%)", color: "#f87171", dashed: true, points: [[0, 4.5], [PASS_MONTHS, 4.5]], width: 1 },
                { id: "piso", label: "piso (1,5%)", color: "#5a6275", dashed: true, points: [[0, 1.5], [PASS_MONTHS, 1.5]], width: 1 },
              ]}
              xDomain={[0, PASS_MONTHS]}
              yDomain={[0, Math.max(8, Math.ceil(peak + 1))]}
              height={240}
              xLabel="mês"
              hMarkers={[{ y: 3, label: "meta 3%", color: "#34d399" }]}
              markers={[{ x: PASS_T0, label: `dólar ${spct(shock, 0)}`, color: "#fbbf24" }]}
              dots={[{ x: cur.t, y: cur.ipca12, color: out && cur.ipca12 > 4.5 ? "#f87171" : "#2dd4bf" }]}
              xFormat={(v) => String(Math.round(v))}
              yFormat={(v) => nf(v, 0) + "%"}
            />
          </Panel>
          <Panel title="Inflação mensal extra causada pelo dólar (p.p.)">
            <LineChart
              series={[{ id: "extra", label: "extra", color: "#fbbf24", area: true, points: shown.map((r) => [r.t, r.m - r.mBase]) }]}
              xDomain={[0, PASS_MONTHS]}
              yDomain={[Math.min(0, ...rows.map((r) => r.m - r.mBase)) * 1.1, Math.max(0.05, ...rows.map((r) => r.m - r.mBase)) * 1.2]}
              height={150}
              xFormat={(v) => String(Math.round(v))}
              yFormat={(v) => nf(v, 2)}
            />
          </Panel>
        </div>
        <div className="grid grid-cols-2 content-start gap-3 lg:grid-cols-1">
          <Stat label="Mês" value={`${now}/${PASS_MONTHS}`} />
          <Stat label="IPCA 12m agora" value={pct(cur.ipca12, 2)} tone={cur.ipca12 > 4.5 ? "bad" : cur.ipca12 < 1.5 ? "warn" : "good"} />
          <Stat label="Pico do IPCA 12m" value={pct(peak, 2)} tone={out ? "bad" : "good"} hint={out ? "estoura o teto da meta" : "dentro da banda"} />
          <Stat label="Repasse total ao IPCA" value={`${nf(total, 2)} p.p.`} hint={`coeficiente ≈ ${nf(shock ? total / shock : 0, 2)}`} />
        </div>
      </div>
      {out && (
        <Callout tone="bad">
          A alta do dólar chega primeiro a combustíveis, trigo, eletrônicos e carros; com inércia, contamina serviços e contratos indexados. O Copom não
          reage ao choque em si, mas à ameaça de ele desancorar as expectativas — e por isso costuma subir a Selic quando o dólar dispara.
        </Callout>
      )}
      <p className="font-mono text-[11px] text-faint">
        IPCA mensal = base + peso·φ·Δcâmbio·(1 − λ)·λ^k + inércia·(extra do mês anterior) · λ = L/(1 + L) · repasse total = peso·φ·Δcâmbio/(1 − inércia)
      </p>
      <p className="text-xs text-faint">
        Experimente: com a alta de 20% e o IPCA partindo de 4,5%, reduza o repasse φ para 10% (expectativas ancoradas) e depois suba a inércia para 0,8 —
        compare quanto tempo o IPCA passa acima do teto.
      </p>
    </div>
  );
}
