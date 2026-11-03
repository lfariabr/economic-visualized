"use client";

import { useState } from "react";
import { Bars } from "@/components/viz/Chart";
import { Button, Callout, Controls, Panel, Slider, Stat } from "@/components/ui";
import { num, pct } from "./fmt";

type Cat = "consumo" | "renda" | "folha" | "patrimonio" | "outros";
const CATS: { id: Cat; label: string; color: string }[] = [
  { id: "consumo", label: "Consumo (bens e serviços)", color: "#f87171" },
  { id: "renda", label: "Renda e lucro", color: "#60a5fa" },
  { id: "folha", label: "Folha / previdência", color: "#fbbf24" },
  { id: "patrimonio", label: "Patrimônio", color: "#34d399" },
  { id: "outros", label: "Outros", color: "#5a6275" },
];

/** % do PIB, valores aproximados (Receita Federal, CTB ~2023) */
const BRASIL: Record<Cat, number> = { consumo: 13.6, renda: 7.4, folha: 8.9, patrimonio: 1.6, outros: 0.9 };
/** média OCDE aproximada (Revenue Statistics) */
const OCDE: Record<Cat, number> = { consumo: 10.9, renda: 12.0, folha: 9.4, patrimonio: 1.9, outros: 0.2 };
const CONSUMO_DET: { label: string; v: number }[] = [
  { label: "ICMS (estadual)", v: 6.9 },
  { label: "PIS/Cofins", v: 3.6 },
  { label: "ISS (municipal)", v: 1.1 },
  { label: "IPI", v: 0.7 },
  { label: "IOF, II, CIDE…", v: 1.3 },
];

const total = (m: Record<Cat, number>) => CATS.reduce((s, c) => s + m[c.id], 0);

function StackBar({ m, label }: { m: Record<Cat, number>; label: string }) {
  const tot = total(m);
  let acc = 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="font-mono">{pct(tot, 1)} do PIB</span>
      </div>
      <svg viewBox="0 0 400 26" className="w-full" preserveAspectRatio="none">
        {CATS.map((c) => {
          const w = Math.round(((m[c.id] / tot) * 400) * 100) / 100;
          const x = Math.round(acc * 100) / 100;
          acc += w;
          return (
            <g key={c.id}>
              <rect x={x} y={0} width={w} height={26} fill={c.color} opacity={0.85} />
            </g>
          );
        })}
      </svg>
      <div className="mt-1 grid grid-cols-5 gap-1 font-mono text-[10.5px] text-faint">
        {CATS.map((c) => (
          <span key={c.id} style={{ color: c.color }}>
            {pct((m[c.id] / tot) * 100, 0)}
          </span>
        ))}
      </div>
    </div>
  );
}

export function TaxMix() {
  const [m, setM] = useState<Record<Cat, number>>(BRASIL);
  const tot = total(m);
  const consShare = (m.consumo / tot) * 100;
  const set = (k: Cat) => (v: number) => setM((o) => ({ ...o, [k]: v }));
  const ocdeMix = () => {
    const t = total(m);
    const to = total(OCDE);
    setM(Object.fromEntries(CATS.map((c) => [c.id, Math.round((OCDE[c.id] / to) * t * 10) / 10])) as Record<Cat, number>);
  };
  const scale = m.consumo / BRASIL.consumo;

  return (
    <div className="space-y-3">
      <Controls>
        <Button onClick={() => setM(BRASIL)}>Brasil (aprox.)</Button>
        <Button onClick={ocdeMix}>Mesma carga, mix da OCDE</Button>
        <span className="text-xs text-faint">valores aproximados, % do PIB</span>
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Panel title="Composição da carga tributária">
          <div className="space-y-5">
            <StackBar m={m} label="Seu Brasil" />
            <StackBar m={OCDE} label="Média OCDE (aprox.)" />
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
              {CATS.map((c) => (
                <span key={c.id} className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-sm" style={{ background: c.color }} />
                  {c.label}
                </span>
              ))}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {CATS.filter((c) => c.id !== "outros").map((c) => (
                <Slider key={c.id} label={c.label.split(" ")[0]} value={m[c.id]} min={0} max={20} step={0.1} onChange={set(c.id)} format={(v) => pct(v, 1)} />
              ))}
            </div>
          </div>
        </Panel>
        <div className="grid content-start gap-2">
          <Stat label="Carga total" value={pct(tot, 1)} tone={tot > 36 ? "bad" : tot > 30 ? "warn" : "neutral"} hint="Brasil ≈ 32–33% · OCDE ≈ 34% · América Latina ≈ 21%" />
          <Stat label="Peso do consumo" value={pct(consShare, 0)} tone={consShare > 38 ? "warn" : "good"} hint="OCDE ≈ 32%" />
          <Stat label="Peso da renda" value={pct((m.renda / tot) * 100, 0)} hint="OCDE ≈ 35%" />
          <Panel title="Dentro do consumo" bodyClassName="p-3">
            <Bars rows={CONSUMO_DET.map((r) => ({ label: r.label, value: r.v * scale, color: "#f87171" }))} max={8} format={(v) => pct(v, 1)} />
          </Panel>
        </div>
      </div>
      <Callout tone="info">
        O Brasil não arrecada muito mais que a média da OCDE; a diferença está no <b>mix</b>. Aqui o consumo pesa bem mais e a
        renda bem menos. Imposto sobre consumo é fácil de cobrar e pouco visível, mas pesa mais sobre quem consome toda a renda.
        Cinco tributos sobre consumo, com regras diferentes por estado e município, são a matéria-prima do contencioso.
      </Callout>
      <p className="text-xs text-faint">
        Experimente: clique em “mix da OCDE” e veja o consumo cair de ~42% para ~32% da carga sem mudar o total. Depois suba renda e patrimônio sem cortar consumo e veja a carga total passar de 36% e ficar vermelha.
      </p>
    </div>
  );
}
