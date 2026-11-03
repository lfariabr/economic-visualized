"use client";

import { useMemo, useState } from "react";
import { Controls, Panel, Segmented, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { aaToAm, amToAa, caminhoLiquido, cdiFromSelic, irRegressivo, poupancaAm, produtos } from "./jurosModel";
import { br, brl, pct } from "./fmtBR";

const V0 = 10000;

export function CdiInvest() {
  const [selic, setSelic] = useState(15);
  const [ipca, setIpca] = useState(4.8);
  const [meses, setMeses] = useState(24);
  const [cdb, setCdb] = useState<"100" | "110" | "120">("110");
  const [pre, setPre] = useState(13.5);
  const [real, setReal] = useState(7.5);

  const prods = useMemo(
    () => produtos({ selic, ipca, cdbPct: Number(cdb), lciPct: 92, pre, ipcaReal: real }),
    [selic, ipca, cdb, pre, real],
  );
  const paths = useMemo(() => prods.map((p) => ({ p, pts: caminhoLiquido(p, V0, meses) })), [prods, meses]);
  const finais = paths.map(({ p, pts }) => {
    const v = pts[pts.length - 1][1];
    const nominalAa = (((v / V0) ** (12 / meses)) - 1) * 100;
    const realAa = ((1 + nominalAa / 100) / (1 + ipca / 100) - 1) * 100;
    return { p, v, nominalAa, realAa };
  });
  const best = finais.reduce((a, b) => (b.v > a.v ? b : a));
  const poup = finais[0];
  const ir = irRegressivo(meses);
  const cdi = cdiFromSelic(selic);

  return (
    <div className="space-y-3">
      <Controls>
        <Slider label="Selic" value={selic} min={2} max={16} step={0.25} onChange={setSelic} format={(v) => pct(v, 2)} className="w-full sm:w-64" />
        <Slider label="IPCA" value={ipca} min={2} max={12} step={0.1} onChange={setIpca} format={(v) => pct(v)} className="w-full sm:w-64" />
        <Slider label="Prazo" value={meses} min={3} max={60} step={1} onChange={setMeses} format={(v) => `${v} meses`} className="w-full sm:w-64" />
        <Slider label="Pré" value={pre} min={6} max={18} step={0.1} onChange={setPre} format={(v) => pct(v)} className="w-full sm:w-64" />
        <Slider label="IPCA+" value={real} min={3} max={9} step={0.1} onChange={setReal} format={(v) => pct(v)} className="w-full sm:w-64" />
        <div className="flex items-center gap-2 text-muted">
          CDB
          <Segmented
            value={cdb}
            onChange={setCdb}
            options={[
              { value: "100", label: "100%" },
              { value: "110", label: "110%" },
              { value: "120", label: "120%" },
            ]}
          />
          do CDI
        </div>
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Panel title={`R$ 10.000 aplicados · valor líquido se resgatar no mês`}>
          <LineChart
            series={paths.map(({ p, pts }) => ({ id: p.id, label: p.label, color: p.color, points: pts, width: p.id === best.p.id ? 3 : 1.8 }))}
            xDomain={[0, meses]}
            yDomain={[V0 * 0.99, Math.max(...finais.map((f) => f.v)) * 1.02]}
            xLabel="mês"
            yFormat={(v) => `${br(v / 1000, 1)} mil`}
            hMarkers={[{ y: V0, label: "aplicado", color: "#5a6275" }]}
            xFormat={(v) => br(v, 0)}
            markers={[6, 12, 24].filter((m) => m < meses).map((m) => ({ x: m, label: `IR ${br(irRegressivo(m + 1), 1)}%`, color: "#5a6275" }))}
          />
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-xs">
              <thead className="text-faint">
                <tr>
                  <th className="py-1 font-normal">produto</th>
                  <th className="py-1 font-normal">bruto a.a.</th>
                  <th className="py-1 font-normal">líquido no fim</th>
                  <th className="py-1 font-normal">líquido a.a.</th>
                  <th className="py-1 font-normal">real a.a.</th>
                </tr>
              </thead>
              <tbody className="font-mono tabular-nums">
                {finais.map(({ p, v, nominalAa, realAa }) => (
                  <tr key={p.id} className="border-t border-line">
                    <td className="py-1 font-sans" style={{ color: p.color }}>
                      {p.label} <span className="text-faint">· {p.nota}</span>
                    </td>
                    <td>{pct(amToAa(p.am), 2)}</td>
                    <td className={p.id === best.p.id ? "text-ok" : undefined}>{brl(v, 0)}</td>
                    <td>{pct(nominalAa, 2)}</td>
                    <td className={realAa < 0 ? "text-bad" : realAa < 2 ? "text-warn" : undefined}>{pct(realAa, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <div className="grid content-start gap-3">
          <Stat label="CDI (taxa DI)" value={pct(cdi, 2)} hint={`≈ Selic − 0,10 · ${pct(aaToAm(cdi), 3)} a.m.`} />
          <Stat label={`IR no prazo de ${meses} meses`} value={pct(ir, 1)} hint="22,5% → 20% → 17,5% → 15% (sobre o rendimento)" />
          <Stat label="Melhor líquido" value={best.p.label} tone="good" hint={`${brl(best.v, 0)} no fim`} />
          <Stat
            label="Poupança, juro real"
            value={pct(poup.realAa, 2)}
            tone={poup.realAa < 0 ? "bad" : poup.realAa < 2 ? "warn" : "neutral"}
            hint={`rende ${pct(amToAa(poupancaAm(selic)), 2)} a.a. (${selic > 8.5 ? "regra 0,5% a.m." : "70% da Selic"})`}
          />
          <Stat
            label="CDB que empata com a LCI 92%"
            value={`${br(92 / (1 - ir / 100), 0)}% do CDI`}
            hint="isenção vale mais quando o IR é alto (prazo curto)"
          />
        </div>
      </div>
      <p className="font-mono text-xs text-faint">
        líquido = V₀ + (V_bruto − V₀)·(1 − IR(prazo)) · poupança = 0,5% a.m. + TR se Selic &gt; 8,5%, senão 70%·Selic + TR · real = (1+nominal)/(1+IPCA) − 1
      </p>
      <p className="text-xs text-faint">
        Experimente: baixe a Selic para 7% e veja a poupança mudar de regra; depois encurte o prazo para 5 meses e compare CDB 110% com LCI 92%. Premissa: Selic e IPCA constantes no prazo (valores aproximados).
      </p>
    </div>
  );
}
