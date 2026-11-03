"use client";

import { useState } from "react";
import { Callout, Controls, Panel, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { dsr, dsrDistribuicao, taxaMediaAA, type DsrParams } from "./creditoModel";
import { br, pct, pp } from "./fmt";

const ENDIVIDADAS = 78; // % das famílias (Peic, aprox.)

export function Comprometimento() {
  const [selic, setSelic] = useState(15);
  const [endividamento, setEndividamento] = useState(48);
  const [spread, setSpread] = useState(15);
  const [prazo, setPrazo] = useState(28);
  const [repactua, setRepactua] = useState(40);
  const [limiar, setLimiar] = useState(40);

  const base: DsrParams = { selic, endividamento, spread, prazo, repactua };
  const d = dsr(base);
  const ref = dsr({ ...base, selic: 15 });
  const curva = (k: "total" | "juros") =>
    Array.from({ length: 47 }, (_, i) => {
      const s = 2 + i * 0.5;
      return [s, dsr({ ...base, selic: s })[k]] as [number, number];
    });
  const { dens, cdf } = dsrDistribuicao(d.total);
  const acima = 100 * (1 - cdf(limiar));
  const muito = 100 * (1 - cdf(limiar * 1.5));
  const famAcima = (ENDIVIDADAS * acima) / 100;
  const famMuito = (ENDIVIDADAS * muito) / 100;
  const xs = Array.from({ length: 101 }, (_, i) => i);
  const densPts = xs.map((x) => [x, 100 * dens(x)] as [number, number]);
  const dmax = Math.max(...densPts.map((p) => p[1])) * 1.15;

  const barras = [
    { label: "sem dívida", v: 100 - ENDIVIDADAS, c: "#242a38" },
    { label: "endividadas, folga", v: ENDIVIDADAS - famAcima, c: "#34d399" },
    { label: `DSR > ${br(limiar, 0)}%: atraso provável`, v: famAcima - famMuito, c: "#fbbf24" },
    { label: `DSR > ${br(limiar * 1.5, 0)}%: sem condições de pagar`, v: famMuito, c: "#f87171" },
  ];

  return (
    <div className="space-y-3">
      <Controls>
        <Slider label="Selic" value={selic} min={2} max={25} step={0.25} onChange={setSelic} format={(v) => pct(v, 2)} className="w-full sm:w-64" />
        <Slider label="Dívida ÷ renda anual" value={endividamento} min={15} max={80} step={1} onChange={setEndividamento} format={(v) => pct(v, 0)} className="w-full sm:w-72" />
        <Slider label="Spread médio" value={spread} min={3} max={40} step={0.5} onChange={setSpread} format={(v) => `${br(v, 1)} p.p.`} className="w-full sm:w-64" />
        <Slider label="Prazo médio" value={prazo} min={6} max={120} step={1} onChange={setPrazo} format={(v) => `${br(v, 0)} meses`} className="w-full sm:w-64" />
        <Slider label="Carteira já com a taxa nova" value={repactua} min={0} max={100} step={5} onChange={setRepactua} format={(v) => pct(v, 0)} className="w-full sm:w-72" />
        <Slider label="DSR suportável" value={limiar} min={20} max={60} step={1} onChange={setLimiar} format={(v) => pct(v, 0)} className="w-full sm:w-64" />
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="grid min-w-0 gap-4 xl:grid-cols-2">
          <Panel title="Comprometimento médio × Selic">
            <LineChart
              height={290}
              width={440}
              series={[
                { id: "tot", label: "DSR total (juros + amortização)", color: "#f472b6", points: curva("total"), width: 2.6 },
                { id: "jur", label: "só juros", color: "#fbbf24", points: curva("juros") },
              ]}
              xDomain={[2, 25]}
              yDomain={[0, Math.max(40, d.total * 1.25)]}
              xLabel="Selic (% a.a.)"
              xFormat={(v) => br(v, 0)}
              yFormat={(v) => `${br(v, 0)}%`}
              hMarkers={[{ y: 28, label: "BCB ≈ 28% (aprox.)", color: "#5a6275" }]}
              dots={[
                { x: selic, y: d.total, color: "#f472b6", label: pct(d.total, 1) },
                { x: selic, y: d.juros, color: "#fbbf24" },
              ]}
            />
          </Panel>
          <Panel title="Como o DSR se espalha entre as famílias endividadas">
            <LineChart
              height={290}
              width={440}
              legend={false}
              series={[{ id: "dens", label: "famílias", color: "#8a93a8", points: densPts, area: true }]}
              xDomain={[0, 100]}
              yDomain={[0, dmax]}
              xLabel="DSR da família (% da renda)"
              xFormat={(v) => `${br(v, 0)}%`}
              yFormat={() => ""}
              markers={[{ x: limiar, label: "suportável", color: "#fbbf24" }]}
            >
              {(s) => {
                const pts = densPts.filter((p) => p[0] >= limiar);
                if (pts.length < 2) return null;
                const dpath =
                  `M${s.x(pts[0][0])},${s.y(0)}` + pts.map((p) => `L${s.x(p[0])},${s.y(p[1])}`).join("") + `L${s.x(pts[pts.length - 1][0])},${s.y(0)}Z`;
                return <path d={dpath} fill="#f87171" opacity={0.35} />;
              }}
            </LineChart>
          </Panel>
          <div className="xl:col-span-2">
            <Panel title="100 famílias: endividada ≠ inadimplente">
              <div className="flex h-7 w-full overflow-hidden rounded-md">
                {barras.map((b) => (
                  <div
                    key={b.label}
                    className="h-full transition-[width] duration-300"
                    style={{ width: `${Math.round(Math.max(0, b.v) * 100) / 100}%`, background: b.c }}
                    title={`${b.label}: ${br(b.v, 0)}`}
                  />
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                {barras.map((b) => (
                  <span key={b.label} className="inline-flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: b.c, border: "1px solid #5a6275" }} />
                    {b.label}: <b className="font-mono text-ink">{br(Math.max(0, b.v), 0)}</b>
                  </span>
                ))}
              </div>
            </Panel>
          </div>
        </div>
        <div className="grid content-start gap-3">
          <Stat label="DSR médio" value={pct(d.total, 1)} tone={d.total > 32 ? "bad" : d.total > 28.5 ? "warn" : "neutral"} hint={`${pp(d.total - ref.total)} vs. Selic 15%`} />
          <Stat label="…dos quais juros" value={pct(d.juros, 1)} hint={`amortização: ${pct(d.amort, 1)}`} />
          <Stat label="Taxa média da carteira" value={`${pct(taxaMediaAA(base), 1)} a.a.`} hint={`${br(d.iam, 2)}% a.m.`} />
          <Stat label="Endividadas acima do suportável" value={pct(acima, 0)} tone={acima > 30 ? "bad" : acima > 20 ? "warn" : "good"} hint={`≈ ${br(famAcima, 0)} de cada 100 famílias`} />
        </div>
      </div>
      {acima > 30 && (
        <Callout tone="bad">
          Com DSR médio de {pct(d.total, 1)}, quase um terço das endividadas já compromete mais do que aguenta. A média esconde a cauda: é nela que
          um aumento pequeno da Selic ou do preço da comida vira atraso.
        </Callout>
      )}
      <p className="font-mono text-xs text-faint">
        DSR = (D/Y)·12 · i / (1 − (1+i)⁻ⁿ) · i = taxa média mensal = [φ·(Selic + spread) + (1 − φ)·(15% + spread)]/12 (aprox.) · DSR da família ~
        log-normal(média, σ = 0,55)
      </p>
      <p className="text-xs text-faint">
        Experimente: leve a Selic de 2% a 15% — o DSR médio sobe pouco, mas a fatia de juros sobe e a cauda vermelha engorda; agora suba a
        “carteira já com a taxa nova” para 100% e alongue o prazo. Valores aproximados.
      </p>
    </div>
  );
}
