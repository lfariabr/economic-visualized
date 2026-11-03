"use client";

import { useState } from "react";
import { Bars } from "@/components/viz/Chart";
import { Button, Callout, Controls, Panel, Slider, Stat } from "@/components/ui";
import { COMP_2025, DPMFI, PIB, PRE_ROLL, shockImpact, type Composition, type Shocks } from "./dividaModel";
import { num, pct } from "./fmt";

const PARTS: { id: keyof Composition; label: string; color: string; titulo: string }[] = [
  { id: "selic", label: "Pós-fixada (Selic)", color: "#f87171", titulo: "LFT / Tesouro Selic" },
  { id: "pre", label: "Prefixada", color: "#60a5fa", titulo: "LTN, NTN-F" },
  { id: "ipca", label: "Índice de preços (IPCA+)", color: "#fbbf24", titulo: "NTN-B" },
  { id: "cambio", label: "Câmbio", color: "#34d399", titulo: "dívida externa / cambial" },
];

const r2 = (v: number) => Math.round(v * 100) / 100;

export function DebtComposition() {
  const [selic, setSelic] = useState(COMP_2025.selic * 100);
  const [pre, setPre] = useState(COMP_2025.pre * 100);
  const [cambio, setCambio] = useState(COMP_2025.cambio * 100);
  const ipca = Math.max(0, 100 - selic - pre - cambio);
  const c: Composition = { selic: selic / 100, pre: pre / 100, ipca: ipca / 100, cambio: cambio / 100 };
  const [sh, setSh] = useState<Shocks>({ selic: true, ipca: false, dolar: false });
  const imp = shockImpact(c, sh);
  const toggle = (k: keyof Shocks) => setSh((o) => ({ ...o, [k]: !o[k] }));
  const perSelicPoint = DPMFI * (c.selic + c.pre * PRE_ROLL) * 0.01;
  // limit sliders so the shares sum to ≤ 100
  const cap = (v: number, others: number) => Math.min(v, 100 - others);

  let acc = 0;
  return (
    <div className="space-y-3">
      <Controls>
        <span className="text-muted">Choques:</span>
        <Button variant={sh.selic ? "primary" : "default"} onClick={() => toggle("selic")}>Selic +3 p.p.</Button>
        <Button variant={sh.ipca ? "primary" : "default"} onClick={() => toggle("ipca")}>IPCA +5 p.p.</Button>
        <Button variant={sh.dolar ? "primary" : "default"} onClick={() => toggle("dolar")}>Dólar +30%</Button>
        <Button variant="ghost" onClick={() => { setSelic(COMP_2025.selic * 100); setPre(COMP_2025.pre * 100); setCambio(COMP_2025.cambio * 100); }}>
          Composição 2025 (aprox.)
        </Button>
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <Panel title={`DPMFi ≈ R$ ${num(DPMFI / 1000, 1)} tri · por indexador`}>
          <svg viewBox="0 0 400 30" className="w-full" preserveAspectRatio="none">
            {PARTS.map((p) => {
              const w = r2(c[p.id] * 400);
              const x = r2(acc);
              acc += w;
              return <rect key={p.id} x={x} y={0} width={w} height={30} fill={p.color} opacity={0.85} />;
            })}
          </svg>
          <div className="mt-2 grid gap-1 text-xs sm:grid-cols-2">
            {PARTS.map((p) => (
              <div key={p.id} className="flex items-center gap-2 text-muted">
                <span className="size-2.5 shrink-0 rounded-sm" style={{ background: p.color }} />
                <span className="min-w-0">
                  {p.label} · <span className="font-mono text-ink">{pct(c[p.id] * 100, 0)}</span>
                  <span className="text-faint"> · {p.titulo}</span>
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <Slider label="Selic" value={selic} min={0} max={80} onChange={(v) => setSelic(cap(v, pre + cambio))} format={(v) => pct(v, 0)} />
            <Slider label="Prefixada" value={pre} min={0} max={80} onChange={(v) => setPre(cap(v, selic + cambio))} format={(v) => pct(v, 0)} />
            <Slider label="Câmbio" value={cambio} min={0} max={30} onChange={(v) => setCambio(cap(v, selic + pre))} format={(v) => pct(v, 0)} />
          </div>
          <div className="mt-1 text-[11px] text-faint">IPCA+ = o restante</div>
          <div className="mt-5">
            <div className="mb-2 text-xs text-muted">Impacto no custo/estoque da dívida em 12 meses (R$ bi)</div>
            <Bars
              max={300}
              format={(v) => num(v, 0)}
              rows={[
                { label: "Selic +3 p.p.", value: imp.selic, color: "#f87171", note: "juros a mais" },
                { label: "IPCA +5 p.p.", value: imp.ipca, color: "#fbbf24", note: "correção do principal" },
                { label: "Dólar +30%", value: imp.dolar, color: "#34d399", note: "valor em reais" },
              ]}
            />
          </div>
        </Panel>
        <div className="grid content-start gap-2">
          <Stat label="Impacto total" value={`R$ ${num(imp.total, 0)} bi`} tone={imp.pctPib > 1.5 ? "bad" : imp.total > 0 ? "warn" : "neutral"} />
          <Stat label="Em % do PIB" value={pct(imp.pctPib, 2)} tone={imp.pctPib > 1.5 ? "bad" : "neutral"} />
          <Stat label="Cada 1 p.p. de Selic custa" value={`≈ R$ ${num(perSelicPoint, 0)} bi/ano`} hint="pós-fixados + prefixados que vencem em 12 meses" />
          <Stat label="PIB nominal" value={`R$ ${num(PIB / 1000, 1)} tri`} hint="valor aproximado" />
        </div>
      </div>
      <Callout tone="bad">
        Quase metade da dívida federal paga a Selic do dia. Quando o Copom sobe os juros para conter a inflação, a conta de juros
        do Tesouro sobe no mesmo mês: a política monetária esbarra na fiscal. A dívida cambial é pequena, e o Brasil tem
        reservas maiores que a dívida externa do governo — por isso a alta do dólar reduz a dívida <i>líquida</i>.
      </Callout>
      <p className="font-mono text-[11px] text-faint">
        Δcusto ≈ DPMFi × [(%Selic + %pré·{num(PRE_ROLL * 100, 0)}%)·ΔSelic + %IPCA·ΔIPCA + %câmbio·Δdólar]
      </p>
      <p className="text-xs text-faint">
        Experimente: com só o choque da Selic ligado, leve a fatia pós-fixada de 47% para 20% (o resto vira IPCA+) e veja o
        custo cair à metade — esse é o motivo de o Tesouro tentar alongar e prefixar a dívida.
      </p>
    </div>
  );
}
