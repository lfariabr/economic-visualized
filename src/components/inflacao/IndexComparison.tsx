"use client";

import { useState } from "react";
import { Button, Controls, Panel, Slider, Stat } from "@/components/ui";
import { Bars } from "@/components/viz/Chart";
import { indices } from "./inflacaoModel";
import { br, brl, pct } from "./num";

const PRESETS = [
  { label: "Tranquilo", dolar: 0, cmd: 0, dom: 4 },
  { label: "2020–21: dólar e commodities", dolar: 25, cmd: 35, dom: 4 },
  { label: "Real se valoriza", dolar: -15, cmd: -5, dom: 4 },
];

export function IndexComparison() {
  const [dolar, setDolar] = useState(0);
  const [cmd, setCmd] = useState(0);
  const [dom, setDom] = useState(4);
  const [rent, setRent] = useState(2000);
  const ix = indices(dolar, cmd, dom);
  const gap = ix.igpm - ix.ipca;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0 space-y-3">
        <Controls>
          <Slider label="Dólar (R$/US$)" value={dolar} min={-25} max={40} onChange={setDolar} format={(x) => `${x > 0 ? "+" : ""}${pct(x, 0)}`} className="w-full sm:w-[48%]" />
          <Slider label="Commodities em US$" value={cmd} min={-30} max={60} onChange={setCmd} format={(x) => `${x > 0 ? "+" : ""}${pct(x, 0)}`} className="w-full sm:w-[48%]" />
          <Slider label="Inflação doméstica (serviços)" value={dom} min={0} max={10} step={0.5} onChange={setDom} format={(x) => pct(x)} className="w-full sm:w-[48%]" />
          <Slider label="Aluguel atual" value={rent} min={800} max={6000} step={100} onChange={setRent} format={(x) => brl(x, 0)} className="w-full sm:w-[48%]" />
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Button
                key={p.label}
                className="text-xs"
                onClick={() => {
                  setDolar(p.dolar);
                  setCmd(p.cmd);
                  setDom(p.dom);
                }}
              >
                {p.label}
              </Button>
            ))}
          </div>
        </Controls>
        <Panel title="Variação em 12 meses de cada índice">
          <Bars
            max={Math.max(10, ix.ipa, ix.igpm, ix.ipca) * 1.05}
            format={(v) => pct(v)}
            rows={[
              { label: "IPCA (meta do BC)", value: Math.max(0, ix.ipca), color: "#fb923c", note: ix.ipca < 0 ? pct(ix.ipca) : undefined },
              { label: "INPC (salário mínimo)", value: Math.max(0, ix.inpc), color: "#facc15", note: ix.inpc < 0 ? pct(ix.inpc) : undefined },
              { label: "IGP-M (aluguel)", value: Math.max(0, ix.igpm), color: "#f87171", note: ix.igpm < 0 ? pct(ix.igpm) : undefined },
              { label: "  IPA (atacado, 60%)", value: Math.max(0, ix.ipa), color: "#f8717188", note: ix.ipa < 0 ? pct(ix.ipa) : undefined },
              { label: "  INCC (construção, 10%)", value: Math.max(0, ix.incc), color: "#f8717188" },
            ]}
          />
        </Panel>
        <p className="font-mono text-xs text-muted">
          IGP-M = 0,6·IPA + 0,3·IPC + 0,1·INCC · choque externo Δ = (1+dólar)(1+commodities) − 1 = {pct(ix.delta)}
        </p>
        <p className="text-xs text-faint">
          Experimente: clique em “2020–21”. O IPCA vai a uns 9–10%, mas o IGP-M passa de 30% — porque o atacado repassa quase todo o
          câmbio e as commodities. Muitos contratos de aluguel trocaram o IGP-M pelo IPCA depois disso.
        </p>
      </div>
      <div className="grid content-start gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <Stat label="IGP-M − IPCA" value={`${br(gap)} p.p.`} tone={Math.abs(gap) > 5 ? "bad" : "neutral"} />
        <Stat label="Aluguel reajustado pelo IGP-M" value={brl(rent * (1 + ix.igpm / 100), 0)} tone={ix.igpm > 10 ? "bad" : "neutral"} hint={`${ix.igpm >= 0 ? "+" : ""}${brl((rent * ix.igpm) / 100, 0)} por mês`} />
        <Stat label="Aluguel reajustado pelo IPCA" value={brl(rent * (1 + ix.ipca / 100), 0)} hint={`${ix.ipca >= 0 ? "+" : ""}${brl((rent * ix.ipca) / 100, 0)} por mês`} />
        <p className="text-xs leading-relaxed text-faint">
          IPCA e INPC são do IBGE (consumidor; o INPC cobre famílias de 1 a 5 salários mínimos). O IGP-M é da FGV e pesa muito preços no
          atacado. Coeficientes de repasse ilustrativos.
        </p>
      </div>
    </div>
  );
}
