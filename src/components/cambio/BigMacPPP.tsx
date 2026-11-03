"use client";

import { useState } from "react";
import { Callout, Controls, Panel, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { BIGMAC, E0 } from "./fxModel";
import { brl, nf, pct, spct } from "./fmtBR";

export function BigMacPPP() {
  const [brlPrice, setBrl] = useState(BIGMAC.brl);
  const [usdPrice, setUsd] = useState(BIGMAC.usd);
  const [fx, setFx] = useState(E0);
  const [piBR, setPiBR] = useState(4.5);
  const [piUS, setPiUS] = useState(2.5);

  const implied = brlPrice / usdPrice;
  const val = (implied / fx - 1) * 100; // < 0: real subvalorizado
  const inUsd = brlPrice / fx;

  const years = Array.from({ length: 11 }, (_, i) => i);
  const ppp = years.map((y) => [2026 + y, fx * ((1 + piBR / 100) / (1 + piUS / 100)) ** y] as [number, number]);
  const impliedPath = years.map((y) => [2026 + y, implied * ((1 + piBR / 100) / (1 + piUS / 100)) ** y] as [number, number]);

  return (
    <div className="space-y-3">
      <Controls>
        <Slider label="Big Mac no Brasil" value={brlPrice} min={12} max={40} step={0.1} onChange={setBrl} format={(v) => brl(v, 2)} className="w-full sm:w-64" />
        <Slider label="Big Mac nos EUA" value={usdPrice} min={3} max={9} step={0.01} onChange={setUsd} format={(v) => `US$ ${nf(v, 2)}`} className="w-full sm:w-64" />
        <Slider label="Dólar de mercado" value={fx} min={3} max={8} step={0.05} onChange={setFx} format={(v) => `R$ ${nf(v, 2)}`} className="w-full sm:w-64" />
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Panel title="PPC absoluta: o câmbio do hambúrguer">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <div className="rounded-lg border border-line bg-panel-2/60 p-4 text-center">
              <div className="text-xs text-faint">Brasil</div>
              <div className="mt-1 font-mono text-2xl">{brl(brlPrice)}</div>
              <div className="mt-1 text-xs text-muted">= US$ {nf(inUsd, 2)} ao câmbio de mercado</div>
            </div>
            <div className="text-center font-mono text-sm text-muted">÷</div>
            <div className="rounded-lg border border-line bg-panel-2/60 p-4 text-center">
              <div className="text-xs text-faint">EUA</div>
              <div className="mt-1 font-mono text-2xl">US$ {nf(usdPrice, 2)}</div>
              <div className="mt-1 text-xs text-muted">preço médio</div>
            </div>
          </div>
          <div className="mt-5">
            <div className="mb-1 flex justify-between text-xs text-faint">
              <span>câmbio implícito R$ {nf(implied, 2)}</span>
              <span>mercado R$ {nf(fx, 2)}</span>
            </div>
            <svg viewBox="0 0 600 60" className="w-full">
              {(() => {
                const sx = (e: number) => Math.round((20 + ((e - 2) / 7) * 560) * 10) / 10;
                return (
                  <>
                    <line x1={20} x2={580} y1={30} y2={30} stroke="#242a38" strokeWidth={6} strokeLinecap="round" />
                    {[2, 3, 4, 5, 6, 7, 8, 9].map((e) => (
                      <text key={e} x={sx(e)} y={56} textAnchor="middle" fontSize={10} fill="#5a6275">
                        {e}
                      </text>
                    ))}
                    <line x1={sx(implied)} x2={sx(fx)} y1={30} y2={30} stroke={val < 0 ? "#60a5fa" : "#fbbf24"} strokeWidth={6} />
                    <circle cx={sx(implied)} cy={30} r={8} fill="#2dd4bf" stroke="#0a0c11" strokeWidth={2} />
                    <circle cx={sx(fx)} cy={30} r={8} fill="#e7e9f0" stroke="#0a0c11" strokeWidth={2} />
                    <text x={sx(implied)} y={14} textAnchor="middle" fontSize={10.5} fill="#2dd4bf">
                      PPC
                    </text>
                    <text x={sx(fx)} y={14} textAnchor="middle" fontSize={10.5} fill="#e7e9f0">
                      mercado
                    </text>
                  </>
                );
              })()}
            </svg>
          </div>
          <p className="mt-2 font-mono text-[11px] text-faint">câmbio PPC = P_BR ÷ P_EUA · desalinhamento = câmbio PPC ÷ câmbio de mercado − 1</p>
        </Panel>
        <div className="grid grid-cols-2 content-start gap-3 lg:grid-cols-1">
          <Stat label="Câmbio implícito (PPC)" value={`R$ ${nf(implied, 2)}`} />
          <Stat label="Real vs. dólar" value={spct(val)} tone={Math.abs(val) > 25 ? "warn" : "neutral"} hint={val < 0 ? "subvalorizado pela PPC" : "sobrevalorizado pela PPC"} />
          <Stat label="Big Mac brasileiro em US$" value={`US$ ${nf(inUsd, 2)}`} hint={`${pct((inUsd / usdPrice) * 100, 0)} do preço americano`} />
        </div>
      </div>
      <Panel title="PPC relativa: para onde o câmbio iria só pela diferença de inflação">
        <Controls className="mb-3 border-0 bg-transparent px-0 py-0">
          <Slider label="Inflação no Brasil" value={piBR} min={0} max={15} step={0.1} onChange={setPiBR} format={(v) => pct(v, 1)} className="w-full sm:w-64" />
          <Slider label="Inflação nos EUA" value={piUS} min={0} max={8} step={0.1} onChange={setPiUS} format={(v) => pct(v, 1)} className="w-full sm:w-64" />
        </Controls>
        <LineChart
          series={[
            { id: "ppp", label: "a partir do câmbio de mercado", color: "#e7e9f0", points: ppp },
            { id: "imp", label: "a partir do câmbio PPC", color: "#2dd4bf", dashed: true, points: impliedPath },
          ]}
          xDomain={[2026, 2036]}
          yDomain={[0, Math.max(10, Math.ceil(Math.max(...ppp.map((p) => p[1]))) + 1)]}
          height={200}
          xLabel="ano"
          xFormat={(v) => String(Math.round(v))}
          yFormat={(v) => nf(v, 0)}
        />
        <p className="mt-2 font-mono text-[11px] text-faint">E(t) = E(0)·[(1 + π_BR)/(1 + π_EUA)]^t — inflação maior aqui, real mais fraco no longo prazo</p>
      </Panel>
      <Callout tone="info">
        O Big Mac sai mais barato no Brasil porque metade do preço é aluguel, salário e serviço — coisas que não se comercializam entre países e são mais
        baratas em países de renda menor (efeito Balassa-Samuelson). Por isso a PPC é uma referência de longo prazo, não uma previsão do câmbio de amanhã.
      </Callout>
      <p className="text-xs text-faint">
        Experimente: ponha o dólar em R$ 4,13 — o câmbio em que o Big Mac custa o mesmo nos dois países — e depois suba a inflação brasileira para 10% e
        veja o câmbio “justo” dobrar em cerca de uma década. Preços aproximados de 2025.
      </p>
    </div>
  );
}
