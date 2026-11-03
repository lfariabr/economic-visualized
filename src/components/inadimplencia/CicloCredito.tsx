"use client";

import { useMemo, useState } from "react";
import { Button, Callout, Controls, Panel, Segmented, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { useTicker } from "@/lib/useTicker";
import { ANOS, TRIMESTRES, ciclo } from "./creditoModel";
import { br, pct } from "./fmt";

const BANDS = [
  { from: 2010, to: 2014.5, color: "#34d399", label: "boom" },
  { from: 2015, to: 2017, color: "#f87171", label: "bust" },
];

const triLabel = (ano: number) => `${Math.floor(ano + 1e-9)}·T${Math.round((ano - Math.floor(ano + 1e-9)) * 4) + 1}`;

export function CicloCredito() {
  const [otimismo, setOtimismo] = useState(60);
  const [reacao, setReacao] = useState(50);
  const [publicos, setPublicos] = useState(true);
  const [prazo, setPrazo] = useState(36);
  const [q, setQ] = useState(TRIMESTRES);
  const t = useTicker(
    () =>
      setQ((x) => {
        if (x >= TRIMESTRES) {
          t.pause();
          return TRIMESTRES;
        }
        return x + 1;
      }),
    { speed: 0.12 },
  );
  const serie = useMemo(() => ciclo({ otimismo, reacao, publicos, prazo }), [otimismo, reacao, publicos, prazo]);
  const vis = serie.slice(0, q + 1);
  const cur = serie[q];
  const pico = serie.reduce((b, x) => (x.credito > b.credito ? x : b), serie[0]);
  const picoInad = serie.reduce((b, x) => (x.inad > b.inad ? x : b), serie[0]);
  const pts = (f: (x: (typeof serie)[number]) => number) => vis.map((x) => [x.ano, f(x)] as [number, number]);
  const xd: [number, number] = [ANOS[0], ANOS[ANOS.length - 1]];

  return (
    <div className="space-y-3">
      <Controls>
        <Button variant="primary" onClick={() => (q >= TRIMESTRES ? (setQ(0), t.play()) : t.toggle())}>
          {t.running ? "❚❚ pausar" : "▶ trimestre a trimestre"}
        </Button>
        <Button onClick={() => (t.pause(), setQ((x) => Math.min(TRIMESTRES, x + 1)))}>+1 tri</Button>
        <div className="flex items-center gap-2 text-xs text-muted">
          bancos públicos:
          <Segmented
            value={publicos ? "sim" : "nao"}
            onChange={(v) => setPublicos(v === "sim")}
            options={[
              { value: "sim", label: "aceleram e depois recuam" },
              { value: "nao", label: "neutros" },
            ]}
          />
        </div>
        <Slider label="Otimismo no boom" value={otimismo} min={0} max={100} step={5} onChange={setOtimismo} format={(v) => pct(v, 0)} className="w-full sm:w-64" />
        <Slider label="Reação dos bancos ao calote" value={reacao} min={0} max={100} step={5} onChange={setReacao} format={(v) => pct(v, 0)} className="w-full sm:w-72" />
        <Slider label="Prazo médio" value={prazo} min={12} max={72} step={1} onChange={setPrazo} format={(v) => `${br(v, 0)} meses`} className="w-full sm:w-64" />
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="grid min-w-0 gap-4">
          <Panel title={`Crédito às famílias e comprometimento · ${triLabel(cur.ano)}`}>
            <LineChart
              height={220}
              series={[
                { id: "cred", label: "dívida das famílias (% da renda anual)", color: "#60a5fa", points: pts((x) => x.credito), width: 2.6 },
                { id: "dsr", label: "comprometimento de renda (DSR, %)", color: "#f472b6", points: pts((x) => x.dsr) },
              ]}
              xDomain={xd}
              yDomain={[0, 60]}
              xFormat={(v) => br(v, 0)}
              yFormat={(v) => `${br(v, 0)}%`}
              bands={BANDS}
            />
          </Panel>
          <Panel title="Inadimplência, desemprego e Selic">
            <LineChart
              height={200}
              series={[
                { id: "inad", label: "inadimplência PF (%)", color: "#f87171", points: pts((x) => x.inad), width: 2.6, area: true },
                { id: "des", label: "desemprego (%)", color: "#fbbf24", points: pts((x) => x.desemp) },
                { id: "selic", label: "Selic (% a.a.)", color: "#8a93a8", points: pts((x) => x.selic), dashed: true },
              ]}
              xDomain={xd}
              yDomain={[0, 16]}
              xFormat={(v) => br(v, 0)}
              yFormat={(v) => `${br(v, 0)}%`}
              bands={BANDS}
            />
          </Panel>
        </div>
        <div className="grid content-start gap-3">
          <Stat label="Dívida ÷ renda" value={pct(cur.credito, 1)} tone={cur.credito > 45 ? "warn" : "neutral"} hint={`pico: ${pct(pico.credito, 1)} em ${triLabel(pico.ano)}`} />
          <Stat label="Comprometimento (DSR)" value={pct(cur.dsr, 1)} tone={cur.dsr > 24 ? "bad" : cur.dsr > 21 ? "warn" : "neutral"} />
          <Stat label="Inadimplência" value={pct(cur.inad, 1)} tone={cur.inad > 6.5 ? "bad" : cur.inad > 5 ? "warn" : "good"} hint={`pico: ${pct(picoInad.inad, 1)} em ${triLabel(picoInad.ano)}`} />
          <Stat label="PIB (ritmo anual)" value={`${cur.pib > 0 ? "+" : ""}${pct(cur.pib, 1)}`} tone={cur.pib < 0 ? "bad" : "neutral"} hint={`desemprego ${pct(cur.desemp, 1)} · Selic ${pct(cur.selic, 1)}`} />
        </div>
      </div>
      {q >= 30 && cur.ano >= 2015.5 && (
        <Callout tone="info">
          O boom deixou as famílias com mais dívida e parcelas maiores bem na hora em que a Selic subiu e o desemprego disparou. A inadimplência
          sobe com atraso; os bancos reagem cortando crédito — e a dívida ÷ renda cai não porque as famílias ficaram ricas, mas porque o crédito
          secou. A desalavancagem prolonga a recessão.
        </Callout>
      )}
      <p className="font-mono text-xs text-faint">
        gₜ = 0,4 + 0,9·otimismo·PIBₜ⁺ − 0,12·(Selic − 10) − 1,6·reação·(inad − 5)⁺ + públicos · DSR = (D/Y)·12·i/(1 − (1+i)⁻ⁿ) · inadₜ₊₁ = inadₜ + 0,3·(3 +
        0,3·(DSR − 16)⁺ + 0,3·(desemp − 7) − inadₜ)
      </p>
      <p className="text-xs text-faint">
        Experimente: dê play com otimismo 60%; depois suba o otimismo para 100% e a reação para 0% — o boom fica maior e o bust mais doloroso.
        Selic, desemprego e PIB são valores anuais aproximados de 2008–2019; o resto é um ciclo estilizado, não a série do BCB.
      </p>
    </div>
  );
}
