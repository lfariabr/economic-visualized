"use client";

import { useState } from "react";
import { Callout, Controls, Panel, Segmented, Slider, Stat } from "@/components/ui";
import { DecileBars } from "./DecileBars";
import { CADUNICO_SHARE, DIESEL_SHARE, GASOLINA_SHARE, porDomicilio, somaBaixo } from "./decis";
import { brl, num, pct } from "./fmt";

const COMB = {
  gasolina: { label: "gasolina", q0: 45, preco: 6.3, co2: 2.3, share: GASOLINA_SHARE, corte2022: 1.1 },
  diesel: { label: "diesel", q0: 66, preco: 6.0, co2: 2.7, share: DIESEL_SHARE, corte2022: 0.35 },
} as const;
type Comb = keyof typeof COMB;

export function SubsidioPreco() {
  const [comb, setComb] = useState<Comb>("gasolina");
  const [corte, setCorte] = useState(1.1);
  const [repasse, setRepasse] = useState(0.8);
  const [elast, setElast] = useState(0.3);
  const [metric, setMetric] = useState<"rs" | "pct">("rs");

  const c = COMB[comb];
  const dp = corte * repasse;
  const q1 = c.q0 * (1 + elast * (dp / c.preco)); // bi litros/ano
  const custo = corte * q1; // R$ bi/ano
  const aoConsumidor = dp * q1;
  const margens = custo - aoConsumidor;
  const geral = porDomicilio(aoConsumidor, c.share);
  const focal = porDomicilio(custo, CADUNICO_SHARE);
  const pick = (xs: { mensal: number; pctRenda: number }[]) => xs.map((d) => (metric === "rs" ? d.mensal : d.pctRenda));
  const share40 = (somaBaixo(c.share, 4) * aoConsumidor) / custo;
  const extraL = q1 - c.q0;

  return (
    <div className="space-y-3">
      <Controls>
        <Segmented
          value={comb}
          onChange={(v) => {
            setComb(v);
            setCorte(COMB[v].corte2022);
          }}
          options={[
            { value: "gasolina", label: "gasolina" },
            { value: "diesel", label: "diesel" },
          ]}
        />
        <Slider className="min-w-52 flex-1" label="Corte de tributo" value={corte} min={0} max={1.5} step={0.05} onChange={setCorte} format={(v) => `${brl(v, 2)}/l`} />
        <Slider className="min-w-52 flex-1" label="Repasse ao preço na bomba" value={repasse * 100} min={30} max={100} step={5} onChange={(v) => setRepasse(v / 100)} format={(v) => pct(v, 0)} />
        <Slider className="min-w-52 flex-1" label="Elasticidade-preço" value={elast} min={0} max={0.8} step={0.05} onChange={setElast} format={(v) => num(v, 2)} />
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Panel
          title={`Quem ganha com ${brl(custo, 1)} bi/ano`}
          right={
            <Segmented
              value={metric}
              onChange={setMetric}
              options={[
                { value: "pct", label: "% da renda" },
                { value: "rs", label: "R$/mês" },
              ]}
            />
          }
        >
          <DecileBars
            format={(v) => (metric === "rs" ? num(v, 0) : `${num(v, 1)}%`)}
            series={[
              { id: "g", label: `Corte de imposto sobre ${c.label}`, color: "#f87171", values: pick(geral) },
              { id: "f", label: "Mesmo custo em transferência focalizada", color: "#34d399", values: pick(focal) },
            ]}
          />
          <p className="mt-2 text-[11px] text-faint">
            décimos de renda domiciliar (D1 = 10% mais pobres) · distribuição do consumo estilizada a partir da POF · diesel conta
            o efeito indireto via frete
          </p>
        </Panel>
        <div className="grid content-start gap-2">
          <Stat label="Queda no preço" value={`${brl(dp, 2)}/l`} hint={`${pct((dp / c.preco) * 100, 1)} do preço de ~${brl(c.preco, 2)}`} />
          <Stat label="Custo fiscal" value={`R$ ${num(custo, 1)} bi/ano`} tone={custo > 30 ? "bad" : custo > 10 ? "warn" : "neutral"} />
          <Stat label="Fica nas margens" value={`R$ ${num(margens, 1)} bi`} tone={margens > 5 ? "warn" : "neutral"} hint="corte não repassado ao consumidor" />
          <Stat label="Vai aos 40% mais pobres" value={pct(share40 * 100, 0)} tone={share40 < 0.2 ? "bad" : "warn"} hint={`× ${pct(somaBaixo(CADUNICO_SHARE, 4) * 100, 0)} na transferência focalizada`} />
          <Stat label="Consumo extra" value={`+${num(extraL, 2)} bi l`} hint={`≈ +${num(extraL * c.co2, 1)} Mt de CO₂/ano`} />
        </div>
      </div>
      <Callout tone="info">
        Em 2022, para conter a inflação dos combustíveis, o governo zerou PIS/Cofins sobre gasolina e diesel e a LC 194 limitou
        o ICMS a cerca de 17–18%. O preço caiu rápido e a inflação também — um benefício real e visível. O custo, somando União e
        estados, passou de dezenas de bilhões por ano, e a maior parte foi para quem mais consome: famílias com carro e
        empresas. Subsídio ao preço também ataca o sinal de escassez: a demanda sobe justamente quando o produto está caro.
      </Callout>
      <p className="font-mono text-[11px] text-faint">
        Δp = corte × repasse · Q₁ = Q₀ · (1 + ε · Δp/p) · custo = corte × Q₁ · ganho do décimo d = Δp × Q₁ × participação_d
      </p>
      <p className="text-xs text-faint">
        Experimente: com gasolina, veja em “R$/mês” como o D10 ganha muito mais que o D1. Mude para “% da renda” — mesmo assim a
        transferência focalizada dá aos mais pobres dezenas de vezes mais. Baixe o repasse para 50%: metade do custo fiscal fica
        no caminho.
      </p>
    </div>
  );
}
