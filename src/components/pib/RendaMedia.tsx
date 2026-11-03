"use client";

import { useState } from "react";
import { LineChart, type Series } from "@/components/viz/Chart";
import { Callout, Controls, Panel, Segmented, Slider, Stat } from "@/components/ui";
import { br } from "./num";
import { RELATIVE_INCOME } from "./pibModel";

const G_US = 1.5;
const PRESETS = [
  { value: "0.6", label: "ritmo 2014–24 (~0,6%)" },
  { value: "0.9", label: "média 1980–2024 (~0,9%)" },
  { value: "3", label: "Chile anos 90 (~3%)" },
  { value: "5", label: "ritmo coreano (~5%)" },
];

/** Middle-income trap: GDP per capita (PPP) relative to the US, stylized. */
export function RendaMedia() {
  const [gBr, setGBr] = useState(0.6);
  const [on, setOn] = useState<Record<string, boolean>>({ brasil: true, coreia: true, chile: true, mexico: false, china: true });
  const brasil = RELATIVE_INCOME.find((c) => c.id === "brasil")!;
  const last = brasil.pts[brasil.pts.length - 1];
  const proj: [number, number][] = [];
  for (let y = last[0]; y <= 2060; y++) proj.push([y, Math.min(120, last[1] * ((1 + gBr / 100) / (1 + G_US / 100)) ** (y - last[0]))]);
  const rel2050 = proj.find((p) => p[0] === 2050)?.[1] ?? 0;
  const ratio = (1 + gBr / 100) / (1 + G_US / 100);
  const yearsTo50 = ratio > 1 ? Math.log(50 / last[1]) / Math.log(ratio) : Infinity;

  const series: Series[] = [
    ...RELATIVE_INCOME.filter((c) => on[c.id]).map((c) => ({ id: c.id, label: c.label, color: c.color, points: c.pts, width: c.id === "brasil" ? 2.8 : 1.8 })),
    { id: "proj", label: `Brasil projetado (${br(gBr, 1)}% a.a.)`, color: "#4ade80", dashed: true, points: proj },
  ];

  return (
    <div className="space-y-3">
      <Controls>
        <div className="flex flex-wrap gap-1.5">
          {RELATIVE_INCOME.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setOn({ ...on, [c.id]: !on[c.id] })}
              className="rounded-md border px-2 py-0.5 text-xs transition"
              style={{ borderColor: on[c.id] ? c.color : "#242a38", color: on[c.id] ? c.color : "#5a6275" }}
            >
              {c.label}
            </button>
          ))}
        </div>
        <Slider label="PIB per capita do Brasil daqui em diante" value={gBr} min={0} max={6} step={0.1} onChange={setGBr} format={(v) => `${br(v, 1)}% a.a.`} className="min-w-[280px] flex-1" />
        <Segmented value={String(gBr)} options={PRESETS} onChange={(v) => setGBr(Number(v))} />
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <Panel title="PIB per capita (PPC) em % do dos EUA — estilizado">
          <LineChart
            series={series}
            xDomain={[1960, 2060]}
            yDomain={[0, 80]}
            height={300}
            xFormat={(v) => String(v)}
            yFormat={(v) => `${br(v, 0)}%`}
            markers={[{ x: 2024, label: "hoje", color: "#8a93a8" }]}
          >
            {(sc) => (
              <g pointerEvents="none">
                <rect x={sc.pad.left} y={sc.y(50)} width={sc.width - sc.pad.left - sc.pad.right} height={sc.y(20) - sc.y(50)} fill="#fbbf24" opacity={0.06} />
                <text x={sc.pad.left + 6} y={sc.y(50) + 13} fontSize={10.5} fill="#fbbf24">
                  faixa de renda média
                </text>
              </g>
            )}
          </LineChart>
          <div className="mt-2 font-mono text-[11px] text-faint">
            relativoₜ = relativo₂₀₂₄ · ((1 + g_BR) / (1 + g_EUA))^(t − 2024) · g_EUA = 1,5% a.a. · dados aproximados (Penn World Table / FMI), suavizados
          </div>
        </Panel>
        <div className="grid content-start gap-2">
          <Stat label="Brasil hoje" value={`${br(last[1], 0)}% dos EUA`} hint="era ~36% em 1980" tone="warn" />
          <Stat label="Em 2050" value={`${br(rel2050, 0)}% dos EUA`} tone={rel2050 > last[1] + 3 ? "good" : rel2050 < last[1] - 1 ? "bad" : "warn"} />
          <Stat
            label="Até 50% dos EUA"
            value={Number.isFinite(yearsTo50) ? `${br(yearsTo50, 0)} anos` : "nunca"}
            tone={!Number.isFinite(yearsTo50) || yearsTo50 > 60 ? "bad" : yearsTo50 > 30 ? "warn" : "good"}
            hint="limiar aproximado de país rico"
          />
          <Stat label="Coreia" value="8% → 68%" hint="1960 → 2024" tone="good" />
        </div>
      </div>
      <Callout tone="info">
        Sair da pobreza é relativamente “fácil”: tirar gente do campo para a fábrica, copiar tecnologia, acumular capital. Passar da renda média
        exige outra coisa — produtividade (educação de qualidade, inovação, instituições, ambiente de negócios). O Brasil cresceu rápido até
        1980 e depois ficou parado na faixa amarela; a Coreia continuou subindo.
      </Callout>
      <p className="text-xs text-faint">
        Experimente: com o ritmo dos últimos dez anos (~0,6%), veja o Brasil <em>se afastar</em> dos EUA; depois escolha “ritmo coreano” e veja em
        quantos anos a linha tracejada sai da faixa amarela.
      </p>
    </div>
  );
}
