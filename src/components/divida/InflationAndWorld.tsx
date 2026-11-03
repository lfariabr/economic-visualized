"use client";

import { useState } from "react";
import { Bars } from "@/components/viz/Chart";
import { Callout, Controls, Panel, Segmented, Slider, Stat } from "@/components/ui";
import { COMP_2025, inflationEffect, type Composition } from "./dividaModel";
import { num, pct, sgn } from "./fmt";

const ALL_PRE: Composition = { selic: 0, pre: 1, ipca: 0, cambio: 0 };

export function InflationErosion() {
  const [pi, setPi] = useState(10);
  const [piE, setPiE] = useState(4.5);
  const [mode, setMode] = useState<"surpresa" | "antecipada">("surpresa");
  const [comp, setComp] = useState<"br" | "pre">("br");
  const c = comp === "br" ? COMP_2025 : ALL_PRE;
  const eff = inflationEffect(78, c, pi, mode === "antecipada" ? pi : piE, true);
  const helps = eff.total < -0.05;

  return (
    <div className="space-y-3">
      <Controls>
        <Slider className="min-w-44 flex-1" label="Inflação realizada" value={pi} min={0} max={40} step={0.5} onChange={setPi} format={(v) => pct(v, 1)} />
        <Slider className="min-w-44 flex-1" label="Inflação esperada (Focus)" value={piE} min={0} max={40} step={0.5} onChange={setPiE} format={(v) => pct(v, 1)} />
        <Segmented value={mode} onChange={setMode} options={[{ value: "surpresa", label: "surpresa" }, { value: "antecipada", label: "antecipada" }]} />
        <Segmented value={comp} onChange={setComp} options={[{ value: "br", label: "dívida de hoje" }, { value: "pre", label: "toda prefixada" }]} />
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <Panel title="Efeito da inflação na dívida/PIB em 1 ano (p.p.)">
          <Bars
            max={5}
            format={(v) => num(v, 2)}
            rows={[
              { label: "Prefixada (corrói)", value: Math.abs(eff.pre), color: "#34d399", note: eff.pre < 0 ? "reduz" : "—" },
              { label: "IPCA+ (indexada)", value: 0, color: "#fbbf24", note: "neutra" },
              { label: "Selic (BC reage)", value: eff.selic, color: "#f87171", note: eff.selic > 0 ? "aumenta" : "—" },
            ]}
          />
          <div className="mt-3 text-[11px] text-faint">verde reduz a dívida, vermelho aumenta · dívida inicial 78% do PIB</div>
        </Panel>
        <div className="grid content-start gap-2">
          <Stat label="Inflação não antecipada" value={`${sgn(mode === "antecipada" ? 0 : pi - piE, 1)} p.p.`} />
          <Stat label="Efeito líquido" value={`${sgn(eff.total, 2)} p.p.`} tone={helps ? "good" : eff.total > 0.05 ? "bad" : "neutral"} hint={helps ? "a inflação corroeu a dívida" : "quase nada (ou piora)"} />
        </div>
      </div>
      <Callout tone="info">
        Inflação só “paga” dívida que está fixa em reais e só quando pega o credor de surpresa. Se é antecipada, o juro do
        título já embute a inflação. E no Brasil a maior parte da dívida é indexada (IPCA, Selic) — herança da era da
        hiperinflação, quando ninguém aceitava prefixado. Surpreender com inflação ainda custa credibilidade e juros maiores depois.
      </Callout>
      <p className="font-mono text-[11px] text-faint">Δd_pré ≈ −d·%pré·(π − πᵉ)/(1 + π) · Δd_Selic ≈ d·%Selic·0,5·(π − πᵉ)</p>
      <p className="text-xs text-faint">
        Experimente: com inflação de 10% e expectativa de 4,5%, troque para “toda prefixada” — a dívida cai quase 4 p.p.; depois
        marque “antecipada” e o ganho some.
      </p>
    </div>
  );
}

/** valores aproximados, dívida bruta do governo geral em % do PIB (~2024/25) e juros nominais líquidos pagos */
const COUNTRIES: { name: string; debt: number; juros: number }[] = [
  { name: "Japão", debt: 236, juros: 0.5 },
  { name: "Itália", debt: 135, juros: 3.9 },
  { name: "EUA", debt: 121, juros: 3.9 },
  { name: "França", debt: 113, juros: 2.0 },
  { name: "Reino Unido", debt: 101, juros: 3.1 },
  { name: "China", debt: 88, juros: 0.8 },
  { name: "Índia", debt: 82, juros: 5.2 },
  { name: "Brasil", debt: 78, juros: 8.0 },
  { name: "Argentina", debt: 80, juros: 2.5 },
  { name: "Alemanha", debt: 63, juros: 0.9 },
  { name: "México", debt: 58, juros: 3.4 },
  { name: "Chile", debt: 42, juros: 1.1 },
];

export function CountryComparison() {
  const [view, setView] = useState<"debt" | "juros">("debt");
  const sorted = [...COUNTRIES].sort((a, b) => b[view] - a[view]);
  return (
    <div className="space-y-3">
      <Controls>
        <Segmented value={view} onChange={setView} options={[{ value: "debt", label: "Dívida bruta (% PIB)" }, { value: "juros", label: "Juros pagos (% PIB)" }]} />
        <span className="text-xs text-faint">valores aproximados; metodologias diferem (Brasil: DBGG do BCB ≈ 78%; pelo FMI ≈ 90%)</span>
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <Panel title={view === "debt" ? "Dívida bruta do governo geral" : "Juros nominais pagos pelo governo"}>
          <Bars
            max={view === "debt" ? 240 : 9}
            format={(v) => pct(v, view === "debt" ? 0 : 1)}
            rows={sorted.map((c) => ({ label: c.name, value: c[view], color: c.name === "Brasil" ? "#fb7185" : "#5a6275" }))}
          />
        </Panel>
        <div className="grid content-start gap-2">
          <Stat label="Brasil · dívida" value="≈ 78% PIB" hint="no meio da tabela" />
          <Stat label="Brasil · juros" value="≈ 8% PIB" tone="bad" hint="entre os maiores do mundo" />
          <Stat label="Japão · juros" value={`≈ ${num(0.5, 1)}% PIB`} tone="good" hint="com 3× a dívida" />
        </div>
      </div>
      <Callout tone="bad">
        O problema brasileiro não é tanto o tamanho da dívida, e sim o preço: juro real alto, dívida curta e indexada. Por isso
        o mesmo nível de dívida que é tranquilo no Japão ou na Alemanha é delicado aqui — r − g é o que manda.
      </Callout>
      <p className="text-xs text-faint">
        Experimente: alterne para “juros pagos” e veja o Brasil pular do meio da tabela para o topo.
      </p>
    </div>
  );
}
