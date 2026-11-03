"use client";

import { useState } from "react";
import { Callout, Controls, Panel, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { ANO0, ANO1, FONTE, PLANOS, moedaDoAno, nivelPrecos } from "./historiaData";
import { br } from "./fmtBR";

const sup = (n: number) =>
  String(n)
    .split("")
    .map((c) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(c)] ?? c)
    .join("");

/** compact pt-BR for very large / small numbers */
function grande(v: number) {
  const a = Math.abs(v);
  if (a >= 1e15 || (a > 0 && a < 0.01)) {
    const e = Math.floor(Math.log10(a));
    return `${br(v / 10 ** e, 2)} × 10${e < 0 ? "⁻" : ""}${sup(Math.abs(e))}`;
  }
  if (a >= 1e12) return `${br(v / 1e12, 2)} trilhões`;
  if (a >= 1e9) return `${br(v / 1e9, 2)} bilhões`;
  if (a >= 1e6) return `${br(v / 1e6, 2)} milhões`;
  return br(v, 2);
}

export function Deflator() {
  const [a, setA] = useState(1995);
  const [b, setB] = useState(ANO1);
  const [m, setM] = useState(100);
  const ma = moedaDoAno(a);
  const mb = moedaDoAno(b);
  const fator = nivelPrecos(b) / nivelPrecos(a);
  // M in currency of year A → reais-equivalent → inflate → currency of year B
  const emB = (m / ma.porReal) * fator * mb.porReal;
  const acum = (fator - 1) * 100;
  const de = Math.min(a, b);
  const ate = Math.max(a, b);
  const serie: [number, number][] = [];
  for (let y = de; y <= ate; y++) serie.push([y, Math.log10(nivelPrecos(y) / nivelPrecos(de))]);
  const planosNoPeriodo = PLANOS.filter((p) => p.ano > de && p.ano <= ate);
  const yFmt = (v: number) => (v < 1 ? `×${br(10 ** v, 1)}` : v < 3 ? `×${br(10 ** v, 0)}` : `×10${sup(Math.round(v))}`);

  return (
    <div className="space-y-3">
      <Controls>
        <Slider label="Valor" value={m} min={10} max={1000} step={10} onChange={setM} format={(v) => br(v, 0)} className="w-full sm:w-60" />
        <Slider label="Em (fim de)" value={a} min={ANO0} max={ANO1} step={1} onChange={setA} format={(v) => String(v)} className="w-full sm:w-64" />
        <Slider label="Equivale em" value={b} min={ANO0} max={ANO1} step={1} onChange={setB} format={(v) => String(v)} className="w-full sm:w-64" />
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Panel title={`Inflação acumulada (IPCA) de ${de} a ${ate} · escala log`} right={<span className="text-[11px] text-faint">{FONTE}</span>}>
          <LineChart
            series={[{ id: "p", label: "nível de preços (múltiplo)", color: "#a78bfa", points: serie, area: true, width: 2.4 }]}
            xDomain={[de, Math.max(ate, de + 1)]}
            yDomain={[0, Math.max(0.5, (serie[serie.length - 1]?.[1] ?? 0) * 1.08)]}
            xFormat={(v) => br(v, 0)}
            yFormat={yFmt}
            markers={planosNoPeriodo.map((p) => ({ x: p.ano, label: p.nome.replace("Plano ", ""), color: p.ok ? "#34d399" : "#fbbf24" }))}
          />
        </Panel>
        <div className="grid content-start gap-3">
          <Stat
            label={`${ma.simbolo} ${br(m, 0)} em ${a} valem em ${b}`}
            value={`${mb.simbolo} ${grande(emB)}`}
            tone={b > a ? "warn" : "neutral"}
            hint={`${ma.nome} → ${mb.nome}`}
          />
          <Stat label="Inflação acumulada" value={Math.abs(acum) > 1e6 ? `${grande(acum)}%` : `${br(acum, 1)}%`} tone={acum > 100 ? "bad" : "neutral"} hint={`preços multiplicados por ${grande(fator)}`} />
          <Stat label="Poder de compra perdido" value={b > a ? `${br((1 - 1 / fator) * 100, 1)}%` : "—"} hint="do dinheiro guardado sem render nada" tone={b > a && fator > 2 ? "bad" : "neutral"} />
          <Stat label="Conversão de moeda" value={ma.porReal === mb.porReal ? "nenhuma" : `÷ ${grande(Math.max(ma.porReal, mb.porReal) / Math.min(ma.porReal, mb.porReal))}`} hint="cortes de três zeros e o 2.750 da URV" />
        </div>
      </div>
      {a < 1994 && b >= 1994 && (
        <Callout tone="info">
          Entre {a} e {b} o Brasil trocou de moeda {[1986, 1989, 1990, 1993, 1994].filter((y) => y > a && y <= b).length} vez(es). A conta converte {ma.nome} para Real (1 R$ = 2.750 CR$, e cada corte de três zeros antes disso) e depois corrige pelo IPCA de cada ano.
        </Callout>
      )}
      <p className="font-mono text-xs text-faint">valor_B = valor_A · P_B / P_A · P_t = Πₛ≤ₜ (1 + IPCAₛ) · moedas: Cr$ → Cz$ (÷1000, 1986) → NCz$ (÷1000, 1989) → Cr$ (1990) → CR$ (÷1000, 1993) → R$ (÷2750, 1994)</p>
      <p className="text-xs text-faint">
        Experimente: coloque &quot;Em&quot; 1985 e &quot;Equivale em&quot; 1995 — veja a explosão de preços em dez anos; depois compare 1995 → 2025 (R$ 100 de 1995 valem cerca de R$ 600 em 2025). IPCA anual aproximado.
      </p>
    </div>
  );
}
