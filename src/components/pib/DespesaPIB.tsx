"use client";

import { useState } from "react";
import { Button, Controls, Panel, Segmented, Slider, Stat } from "@/components/ui";
import { br } from "./num";

type Key = "C" | "I" | "G" | "X" | "M";
type Shares = Record<Key, number>;

const COUNTRIES: Record<string, { label: string; s: Shares }> = {
  brasil: { label: "Brasil", s: { C: 63, I: 17, G: 19, X: 18, M: 17 } },
  china: { label: "China", s: { C: 39, I: 42, G: 17, X: 20, M: 18 } },
  eua: { label: "EUA", s: { C: 68, I: 21, G: 14, X: 11, M: 14 } },
  coreia: { label: "Coreia", s: { C: 48, I: 31, G: 18, X: 44, M: 41 } },
};

const META: Record<Key, { label: string; color: string; hint: string }> = {
  C: { label: "Consumo das famílias", color: "#e879f9", hint: "supermercado, aluguel, serviços" },
  I: { label: "Investimento (FBCF)", color: "#60a5fa", hint: "máquinas, obras, construção" },
  G: { label: "Consumo do governo", color: "#f87171", hint: "salários de servidores, SUS, escolas" },
  X: { label: "Exportações", color: "#34d399", hint: "soja, minério, petróleo, aviões" },
  M: { label: "Importações", color: "#fbbf24", hint: "subtraídas: já estão em C, I, G" },
};

const PIB_BR = 11.7; // R$ trilhões, aproximado (2024)

/** Y = C + I + G + (X − M), with Brazil's approximate shares. */
export function DespesaPIB() {
  const [country, setCountry] = useState("brasil");
  const [s, setS] = useState<Shares>(COUNTRIES.brasil.s);
  const base = COUNTRIES[country].s;
  const Y = s.C + s.I + s.G + s.X - s.M;
  const Y0 = base.C + base.I + base.G + base.X - base.M;
  const growth = (Y / Y0 - 1) * 100;
  const scaleMax = Math.max(110, s.C + s.I + s.G + s.X) * 1.03;
  const pos: Key[] = ["C", "I", "G", "X"];
  const w = (v: number) => `${Math.max(0, (v / scaleMax) * 100).toFixed(2)}%`;

  const pick = (k: string) => {
    setCountry(k);
    setS(COUNTRIES[k].s);
  };

  return (
    <div className="space-y-3">
      <Controls>
        <Segmented value={country} options={Object.entries(COUNTRIES).map(([value, c]) => ({ value, label: c.label }))} onChange={pick} />
        <Button variant="ghost" onClick={() => setS(base)}>
          Restaurar
        </Button>
        <Button onClick={() => setS({ ...s, C: base.C * 0.95 })}>Famílias cortam 5% do consumo</Button>
        <Button onClick={() => setS({ ...s, X: base.X * 0.8 })}>Exportações caem 20%</Button>
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <Panel title="PIB pela ótica da despesa (base = 100)">
          <div className="space-y-4">
            <div>
              <div className="mb-1 text-[11px] text-faint uppercase">Demanda total (C + I + G + X)</div>
              <div className="flex h-9 overflow-hidden rounded-md bg-panel-2">
                {pos.map((k) => (
                  <div
                    key={k}
                    className="flex items-center justify-center overflow-hidden font-mono text-[11px] text-black/80 transition-[width] duration-300"
                    style={{ width: w(s[k]), background: META[k].color }}
                    title={META[k].label}
                  >
                    {s[k] >= 8 ? `${k} ${br(s[k], 0)}` : ""}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1 text-[11px] text-faint uppercase">menos importações (M)</div>
              <div className="flex h-6 overflow-hidden rounded-md bg-panel-2">
                <div
                  className="ml-auto flex items-center justify-center font-mono text-[11px] text-black/80 transition-[width] duration-300"
                  style={{ width: w(s.M), background: META.M.color, marginRight: `${(100 - ((s.C + s.I + s.G + s.X) / scaleMax) * 100).toFixed(2)}%` }}
                >
                  −{br(s.M, 0)}
                </div>
              </div>
            </div>
            <div>
              <div className="mb-1 text-[11px] text-faint uppercase">= PIB</div>
              <div className="flex h-9 overflow-hidden rounded-md bg-panel-2">
                <div
                  className="flex items-center justify-center font-mono text-xs font-semibold text-black transition-[width] duration-300"
                  style={{ width: w(Y), background: "#e7e9f0" }}
                >
                  Y = {br(Y, 1)}
                </div>
              </div>
            </div>
            <div className="grid gap-x-6 gap-y-2 pt-2 md:grid-cols-2">
              {(Object.keys(META) as Key[]).map((k) => (
                <Slider
                  key={k}
                  label={
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-2 rounded-full" style={{ background: META[k].color }} />
                      {META[k].label}
                    </span>
                  }
                  value={s[k]}
                  min={0}
                  max={70}
                  step={0.5}
                  onChange={(v) => setS({ ...s, [k]: v })}
                  format={(v) => br(v, 1)}
                />
              ))}
            </div>
          </div>
          <div className="mt-3 font-mono text-[11px] text-faint">
            Y = C + I + G + (X − M) = {br(s.C, 1)} + {br(s.I, 1)} + {br(s.G, 1)} + ({br(s.X, 1)} − {br(s.M, 1)}) = {br(Y, 1)}
          </div>
        </Panel>
        <div className="grid content-start gap-2">
          <Stat label="PIB vs. base" value={`${growth >= 0 ? "+" : ""}${br(growth, 1)}%`} tone={growth < -0.05 ? "bad" : growth > 0.05 ? "good" : "neutral"} hint={growth < -2 ? "recessão" : "variação do PIB"} />
          {country === "brasil" && <Stat label="Em reais" value={`R$ ${br((PIB_BR * Y) / 100, 2)} tri`} hint="PIB 2024 ≈ R$ 11,7 tri (IBGE, aprox.)" />}
          <Stat label="Investimento / PIB" value={`${br((s.I / Y) * 100, 1)}%`} tone={(s.I / Y) * 100 < 20 ? "warn" : "good"} hint="Brasil ~17%; Ásia 30%+" />
          <Stat label="Exportações líquidas" value={`${br(s.X - s.M, 1)}`} tone={s.X - s.M < 0 ? "warn" : "neutral"} hint="X − M (superávit comercial se > 0)" />
          <div className="rounded-lg border border-line bg-panel-2/40 p-3 text-xs leading-relaxed text-faint">
            {(Object.keys(META) as Key[]).map((k) => (
              <div key={k}>
                <b className="font-mono" style={{ color: META[k].color }}>
                  {k}
                </b>{" "}
                {META[k].hint}
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="text-xs text-faint">
        Experimente: compare Brasil e China — veja o tamanho do investimento; depois clique em “Famílias cortam 5% do consumo” e note que, sendo
        63% do PIB, o consumo sozinho derruba o PIB em mais de 3%.
      </p>
    </div>
  );
}
