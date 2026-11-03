"use client";

import { useMemo, useState } from "react";
import { Button, Controls, Panel, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { amToAa, compostos, mesesParaDobrar } from "./jurosModel";
import { br, brl, brlK, pct } from "./fmtBR";

const PRESETS = [
  { label: "Poupança", am: 0.67 },
  { label: "CDI", am: 1.16 },
  { label: "Consignado", am: 1.85 },
  { label: "Cheque especial", am: 7.9 },
  { label: "Rotativo do cartão", am: 14.5 },
];

export function Compound() {
  const [am, setAm] = useState(1.16);
  const [meses, setMeses] = useState(60);
  const v0 = 1000;
  const { comp, simp } = useMemo(() => compostos(v0, am, meses), [am, meses]);
  const aa = amToAa(am);
  const simplesAa = am * 12;
  const final = comp[comp.length - 1][1];
  const finalS = simp[simp.length - 1][1];
  const dobra = mesesParaDobrar(am);
  const divida = am > 3;

  return (
    <div className="space-y-3">
      <Controls>
        <Slider label="Taxa mensal" value={am} min={0.1} max={16} step={0.01} onChange={setAm} format={(v) => `${br(v, 2)}%`} className="w-full sm:w-72" />
        <Slider label="Meses" value={meses} min={6} max={120} step={1} onChange={setMeses} format={(v) => `${v}`} className="w-full sm:w-64" />
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <Button key={p.label} variant={Math.abs(p.am - am) < 0.005 ? "primary" : "default"} onClick={() => setAm(p.am)} className="text-xs">
              {p.label}
            </Button>
          ))}
        </div>
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Panel title={`R$ 1.000 a ${br(am, 2)}% ao mês — ${divida ? "uma dívida" : "um investimento"}`}>
          <LineChart
            series={[
              { id: "c", label: "juros compostos", color: divida ? "#f87171" : "#22d3ee", points: comp, area: true, width: 2.5 },
              { id: "s", label: "juros simples", color: "#8a93a8", points: simp, dashed: true },
            ]}
            xDomain={[0, meses]}
            xLabel="mês"
            xFormat={(v) => br(v, 0)}
            yFormat={(v) => brlK(v)}
            hMarkers={[{ y: 2000, label: "dobrou", color: "#5a6275" }]}
            markers={Number.isFinite(dobra) && dobra <= meses ? [{ x: dobra, label: `dobra em ${br(dobra, 0)} meses`, color: "#fbbf24" }] : []}
          />
        </Panel>
        <div className="grid content-start gap-3">
          <Stat label="Taxa anual equivalente" value={pct(aa, 1)} tone={aa > 100 ? "bad" : aa > 30 ? "warn" : "neutral"} hint={`não é ${pct(simplesAa, 1)} (12 × mensal)`} />
          <Stat label={`Montante em ${meses} meses`} value={brlK(final)} tone={divida && final > 5000 ? "bad" : "neutral"} hint={`juros simples dariam ${brlK(finalS)}`} />
          <Stat label="Juros sobre juros" value={brlK(final - finalS)} hint="a diferença entre as duas curvas" />
          <Stat label="Tempo para dobrar" value={Number.isFinite(dobra) ? `${br(dobra, 1)} meses` : "—"} hint={`regra de 72: ≈ ${br(72 / am, 0)} meses`} />
          <Stat label="Em 1 ano, R$ 1.000 viram" value={brl(v0 * (1 + aa / 100), 0)} />
        </div>
      </div>
      <p className="font-mono text-xs text-faint">i_anual = (1 + i_mensal)¹² − 1 · i_mensal = (1 + i_anual)^(1/12) − 1 · M = C·(1 + i)ⁿ</p>
      <p className="text-xs text-faint">
        Experimente: clique em &quot;CDI&quot; e depois em &quot;Rotativo do cartão&quot; — a mesma fórmula que faz o investimento crescer devagar faz a dívida decolar.
      </p>
    </div>
  );
}
