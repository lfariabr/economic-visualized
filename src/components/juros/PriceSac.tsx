"use client";

import { useMemo, useState } from "react";
import { Controls, Panel, Segmented, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { aaToAm, price, sac } from "./jurosModel";
import { br, brl, brlK, pct } from "./fmtBR";

export function PriceSac() {
  const [pv, setPv] = useState(400000);
  const [aa, setAa] = useState(11.5);
  const [anos, setAnos] = useState(30);
  const [renda, setRenda] = useState(15000);
  const [ver, setVer] = useState<"parcela" | "saldo" | "composicao">("parcela");
  const n = anos * 12;
  const im = aaToAm(aa);
  const P = useMemo(() => price(pv, im, n), [pv, im, n]);
  const S = useMemo(() => sac(pv, im, n), [pv, im, n]);
  const jurosP = P.reduce((a, b) => a + b.juros, 0);
  const jurosS = S.reduce((a, b) => a + b.juros, 0);
  const comprom = (x: number) => (x / renda) * 100;
  const step = Math.max(1, Math.floor(n / 120));
  const pick = <T,>(xs: T[]) => xs.filter((_, i) => i % step === 0 || i === xs.length - 1);

  const series =
    ver === "parcela"
      ? [
          { id: "p", label: "Price (parcela fixa)", color: "#22d3ee", points: pick(P).map((r) => [r.m, r.parcela] as [number, number]), width: 2.4 },
          { id: "s", label: "SAC (amortização constante)", color: "#fbbf24", points: pick(S).map((r) => [r.m, r.parcela] as [number, number]), width: 2.4 },
        ]
      : ver === "saldo"
        ? [
            { id: "p", label: "Price · saldo devedor", color: "#22d3ee", points: pick(P).map((r) => [r.m, r.saldo] as [number, number]), width: 2.4 },
            { id: "s", label: "SAC · saldo devedor", color: "#fbbf24", points: pick(S).map((r) => [r.m, r.saldo] as [number, number]), width: 2.4 },
          ]
        : [
            { id: "pj", label: "Price · juros", color: "#f87171", points: pick(P).map((r) => [r.m, r.juros] as [number, number]), area: true },
            { id: "pa", label: "Price · amortização", color: "#22d3ee", points: pick(P).map((r) => [r.m, r.amort] as [number, number]) },
            { id: "sj", label: "SAC · juros", color: "#f87171", points: pick(S).map((r) => [r.m, r.juros] as [number, number]), dashed: true },
            { id: "sa", label: "SAC · amortização", color: "#fbbf24", points: pick(S).map((r) => [r.m, r.amort] as [number, number]), dashed: true },
          ];

  const cruz = P.findIndex((r) => r.amort >= r.juros);

  return (
    <div className="space-y-3">
      <Controls>
        <Slider label="Financiado" value={pv} min={100000} max={1500000} step={10000} onChange={setPv} format={(v) => brlK(v)} className="w-full sm:w-64" />
        <Slider label="Juros" value={aa} min={6} max={16} step={0.1} onChange={setAa} format={(v) => `${pct(v)} a.a.`} className="w-full sm:w-64" />
        <Slider label="Prazo" value={anos} min={5} max={35} step={1} onChange={setAnos} format={(v) => `${v} anos`} className="w-full sm:w-64" />
        <Slider label="Renda" value={renda} min={3000} max={50000} step={500} onChange={setRenda} format={(v) => brlK(v)} className="w-full sm:w-64" />
        <Segmented
          value={ver}
          onChange={setVer}
          options={[
            { value: "parcela", label: "parcela" },
            { value: "saldo", label: "saldo devedor" },
            { value: "composicao", label: "juros × amortização" },
          ]}
        />
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Panel title="Financiamento imobiliário · Price × SAC">
          <LineChart
            series={series}
            xDomain={[1, n]}
            yDomain={ver === "saldo" ? [0, pv * 1.05] : undefined}
            xLabel="mês"
            xFormat={(v) => br(v, 0)}
            yFormat={(v) => brlK(v)}
            hMarkers={ver === "parcela" ? [{ y: renda * 0.3, label: "30% da renda", color: "#f87171" }] : []}
            markers={ver === "composicao" && cruz > 0 ? [{ x: cruz + 1, label: `Price: amortização passa juros no mês ${cruz + 1}`, color: "#8a93a8" }] : []}
          />
        </Panel>
        <div className="grid content-start gap-3">
          <Stat label="Taxa mensal" value={pct(im, 3)} hint={`${n} parcelas`} />
          <Stat
            label="1ª parcela · Price / SAC"
            value={`${brlK(P[0].parcela)} / ${brlK(S[0].parcela)}`}
            tone={comprom(S[0].parcela) > 30 ? "bad" : "neutral"}
            hint={`comprometimento: ${pct(comprom(P[0].parcela), 0)} / ${pct(comprom(S[0].parcela), 0)} da renda`}
          />
          <Stat label="Última parcela · Price / SAC" value={`${brlK(P[n - 1].parcela)} / ${brlK(S[n - 1].parcela)}`} />
          <Stat label="Juros totais · Price" value={brlK(jurosP)} tone="bad" hint={`${br(jurosP / pv, 2)}× o valor financiado`} />
          <Stat label="Juros totais · SAC" value={brlK(jurosS)} tone="warn" hint={`economia de ${brlK(jurosP - jurosS)} vs Price`} />
        </div>
      </div>
      <p className="font-mono text-xs text-faint">
        Price: PMT = PV·i / (1 − (1+i)⁻ⁿ) · SAC: amortização = PV/n, parcela = PV/n + saldo·i · juros do mês = saldo·i
      </p>
      <p className="text-xs text-faint">
        Experimente: aumente o prazo de 20 para 35 anos — a parcela do Price quase não cai, mas os juros totais disparam. Valores aproximados, sem seguros, taxas e TR.
      </p>
    </div>
  );
}
