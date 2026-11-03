"use client";

import { useState } from "react";
import { Button, Controls, Panel, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { inertiaPath } from "./inflacaoModel";
import { br, pct } from "./num";

const T = 24;
const AT = 2;
const BASE = 3;

const PRESETS = [
  { label: "Sem indexação", iota: 0 },
  { label: "Brasil hoje (~0,4)", iota: 0.4 },
  { label: "Anos 80 (~0,9)", iota: 0.9 },
];

export function Inertia() {
  const [aluguel, setAluguel] = useState(15);
  const [salario, setSalario] = useState(15);
  const [contratos, setContratos] = useState(10);
  const [shock, setShock] = useState(4);
  const iota = Math.min(0.97, (aluguel + salario + contratos) / 100);
  const path = inertiaPath(iota, shock, BASE, T, AT);
  const zero = inertiaPath(0, shock, BASE, T, AT);
  const halfLife = iota > 0 ? Math.log(0.5) / Math.log(iota) : 0;
  const excess = shock / (1 - iota); // p.p.·trimestre acumulados
  const after4 = path[AT + 4];

  const setIota = (target: number) => {
    const total = target * 100;
    setAluguel(Math.round(total * 0.375));
    setSalario(Math.round(total * 0.375));
    setContratos(Math.round(total * 0.25));
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0 space-y-3">
        <Controls>
          <Slider label="Aluguéis (IGP-M/IPCA)" value={aluguel} min={0} max={40} onChange={setAluguel} format={(x) => pct(x, 0)} className="w-full sm:w-[48%]" />
          <Slider label="Salários indexados" value={salario} min={0} max={40} onChange={setSalario} format={(x) => pct(x, 0)} className="w-full sm:w-[48%]" />
          <Slider label="Contratos e tarifas" value={contratos} min={0} max={30} onChange={setContratos} format={(x) => pct(x, 0)} className="w-full sm:w-[48%]" />
          <Slider label="Choque único" value={shock} min={0} max={10} step={0.5} onChange={setShock} format={(x) => `+${br(x)} p.p.`} className="w-full sm:w-[48%]" />
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Button key={p.label} className="text-xs" onClick={() => setIota(p.iota)}>
                {p.label}
              </Button>
            ))}
          </div>
        </Controls>
        <Panel title="Inflação após um choque único (anualizada, % a.a.)">
          <LineChart
            height={250}
            xDomain={[0, T - 1]}
            yDomain={[0, BASE + Math.max(6, shock + 1)]}
            xLabel="trimestre"
            yFormat={(x) => br(x, 0)}
            markers={[{ x: AT, label: "choque", color: "#fbbf24" }]}
            hMarkers={[{ y: BASE, label: "inflação de base", color: "#5a6275" }]}
            series={[
              { id: "i", label: `indexação ${pct(iota * 100, 0)}`, color: "#fb923c", width: 2.5, area: true, points: path.map((p, i) => [i, p]) },
              { id: "z", label: "sem indexação", color: "#5a6275", dashed: true, points: zero.map((p, i) => [i, p]) },
            ]}
          />
        </Panel>
        <p className="font-mono text-xs text-muted">π_t = ι·π_(t−1) + (1−ι)·π_base + choque · meia-vida = ln 0,5 / ln ι</p>
        <p className="text-xs text-faint">
          Experimente: clique em “Sem indexação” — o choque de 4 p.p. some no trimestre seguinte. Agora “Anos 80”: dois anos depois ele
          ainda está lá, e a inflação extra acumulada é seis vezes maior do que com a indexação de hoje.
        </p>
      </div>
      <div className="grid content-start gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <Stat label="Grau de indexação (ι)" value={pct(iota * 100, 0)} tone={iota > 0.7 ? "bad" : iota > 0.4 ? "warn" : "neutral"} hint="soma das fatias indexadas" />
        <Stat label="Meia-vida do choque" value={iota > 0 ? `${br(halfLife, 1)} trim.` : "imediata"} tone={halfLife > 4 ? "bad" : "neutral"} />
        <Stat label="Inflação 1 ano depois" value={`${pct(after4)}`} hint={`base: ${pct(BASE)}`} tone={after4 - BASE > 1 ? "warn" : "neutral"} />
        <Stat label="Inflação extra acumulada" value={`${br(excess, 1)} p.p.`} hint={`vs. ${br(shock, 1)} p.p. do choque original`} tone={excess > 2 * shock ? "bad" : "neutral"} />
      </div>
    </div>
  );
}
