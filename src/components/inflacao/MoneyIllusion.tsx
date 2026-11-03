"use client";

import { useState } from "react";
import { Controls, Panel, Slider, Stat } from "@/components/ui";
import { Bars } from "@/components/viz/Chart";
import { realRate } from "./inflacaoModel";
import { br, brl, pct } from "./num";

export function MoneyIllusion() {
  const [raise, setRaise] = useState(5);
  const [pi, setPi] = useState(4.5);
  const [selic, setSelic] = useState(15);
  const salary = 3000;
  const realRaise = realRate(raise, pi);
  const nominalNew = salary * (1 + raise / 100);
  const realNew = nominalNew / (1 + pi / 100);
  const rReal = realRate(selic, pi);
  // regra da poupança: Selic > 8,5% → 0,5% a.m. + TR; senão 70% da Selic + TR (TR ≈ 1,5% a.a., aproximada)
  const TR = 1.5;
  const poupanca = selic > 8.5 ? 6.17 + TR : 0.7 * selic + TR;
  const rPoup = realRate(poupanca, pi);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0 space-y-3">
        <Controls>
          <Slider label="Reajuste do salário" value={raise} min={0} max={20} step={0.5} onChange={setRaise} format={(x) => pct(x)} className="w-full sm:w-[48%]" />
          <Slider label="Inflação (IPCA 12m)" value={pi} min={0} max={20} step={0.1} onChange={setPi} format={(x) => pct(x)} className="w-full sm:w-[48%]" />
          <Slider label="Selic / CDI" value={selic} min={2} max={20} step={0.25} onChange={setSelic} format={(x) => pct(x, 2)} className="w-full sm:w-[48%]" />
        </Controls>
        <div className="grid gap-3 md:grid-cols-2">
          <Panel title={`Salário de ${brl(salary, 0)}`}>
            <Bars
              max={salary * 1.25}
              format={(v) => brl(v, 0)}
              rows={[
                { label: "Hoje", value: salary, color: "#5a6275" },
                { label: "No contracheque", value: nominalNew, color: "#facc15" },
                { label: "Em poder de compra", value: realNew, color: realNew < salary ? "#f87171" : "#34d399" },
              ]}
            />
          </Panel>
          <Panel title="Juro nominal × juro real (a.a.)">
            <Bars
              max={Math.max(20, selic)}
              format={(v) => pct(v)}
              rows={[
                { label: "CDI nominal", value: selic, color: "#facc15" },
                { label: "CDI real", value: Math.max(0, rReal), color: rReal > 0 ? "#34d399" : "#f87171", note: rReal < 0 ? pct(rReal) : undefined },
                { label: "Poupança real", value: Math.max(0, rPoup), color: rPoup > 0 ? "#34d399" : "#f87171", note: rPoup < 0 ? pct(rPoup) : undefined },
              ]}
            />
          </Panel>
        </div>
        <p className="font-mono text-xs text-muted">real = (1 + nominal) / (1 + inflação) − 1 (equação de Fisher)</p>
        <p className="text-xs text-faint">
          Experimente: ponha reajuste de 10% e inflação de 12% — o contracheque sobe R$ 300, mas o poder de compra cai. Depois baixe a Selic
          para 4% com IPCA de 4,5%: o juro real fica negativo, como em 2020–21.
        </p>
      </div>
      <div className="grid content-start gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <Stat label="Aumento real do salário" value={`${realRaise >= 0 ? "+" : ""}${pct(realRaise, 2)}`} tone={realRaise < 0 ? "bad" : "good"} hint={realRaise < 0 ? "o “aumento” é uma perda" : undefined} />
        <Stat label="Juro real do CDI" value={pct(rReal, 2)} tone={rReal < 0 ? "bad" : rReal > 7 ? "warn" : "good"} hint="juro real alto freia a economia" />
        <Stat label="Poupança" value={`${pct(rPoup, 2)} real`} tone={rPoup < 0 ? "bad" : "neutral"} hint={selic > 8.5 ? "0,5% a.m. + TR (Selic acima de 8,5%)" : "70% da Selic + TR"} />
      </div>
    </div>
  );
}
