"use client";

import { useState } from "react";
import { Callout, Controls, Panel, Segmented, Slider, Stat } from "@/components/ui";
import { DISCR0, RUBRICAS, SHUTDOWN, rigidity } from "./dividaModel";
import { num, pct } from "./fmt";

const W = 620;
const H = 300;
const P = { l: 46, r: 10, t: 14, b: 28 };
const r2 = (v: number) => Math.round(v * 100) / 100;

export function BudgetRigidity() {
  const [sm, setSm] = useState(2.5);
  const [receita, setReceita] = useState(2.5);
  const [demog, setDemog] = useState(2);
  const [pisos, setPisos] = useState<"rec" | "inf">("rec");
  const [smLink, setSmLink] = useState<"sim" | "nao">("sim");
  const { rows, limite } = rigidity({ sm, receita, demog, years: 10, pisos: pisos === "rec", smLink: smLink === "sim" });
  const shutdown = rows.find((r) => r.discr < SHUTDOWN);
  const last = rows[rows.length - 1];

  const ymax = 3600;
  const iw = W - P.l - P.r;
  const ih = H - P.t - P.b;
  const bw = iw / rows.length;
  const Y = (v: number) => r2(P.t + ih - (Math.min(v, ymax) / ymax) * ih);

  return (
    <div className="space-y-3">
      <Controls>
        <Slider className="min-w-44 flex-1" label="Salário mínimo (ganho real)" value={sm} min={0} max={5} step={0.1} onChange={setSm} format={(v) => `${pct(v, 1)}/ano`} />
        <Slider className="min-w-44 flex-1" label="Receita (cresc. real)" value={receita} min={-1} max={5} step={0.1} onChange={setReceita} format={(v) => `${pct(v, 1)}/ano`} />
        <Slider className="min-w-44 flex-1" label="Envelhecimento (Previdência)" value={demog} min={0} max={4} step={0.1} onChange={setDemog} format={(v) => `+${pct(v, 1)}/ano`} />
      </Controls>
      <Controls>
        <div className="flex items-center gap-2 text-muted">
          Pisos de saúde/educação
          <Segmented value={pisos} onChange={setPisos} options={[{ value: "rec", label: "% da receita" }, { value: "inf", label: "+0,6% real" }]} />
        </div>
        <div className="flex items-center gap-2 text-muted">
          Benefícios atrelados ao mínimo
          <Segmented value={smLink} onChange={setSmLink} options={[{ value: "sim", label: "sim" }, { value: "nao", label: "não" }]} />
        </div>
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <Panel title="Despesa primária federal sob o limite (R$ bi de 2025)">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
            {[0, 1000, 2000, 3000].map((t) => (
              <g key={t}>
                <line x1={P.l} x2={W - P.r} y1={Y(t)} y2={Y(t)} stroke="#242a38" />
                <text x={P.l - 6} y={Y(t) + 3.5} textAnchor="end" fontSize={10.5} fill="#5a6275">{num(t, 0)}</text>
              </g>
            ))}
            {rows.map((row, i) => {
              const x = r2(P.l + i * bw + bw * 0.12);
              const w = r2(bw * 0.76);
              let acc = 0;
              const bad = row.discr < SHUTDOWN;
              return (
                <g key={row.year}>
                  {RUBRICAS.map((rb) => {
                    const v = row.parts[rb.id];
                    const y0 = Y(acc);
                    acc += v;
                    const y1 = Y(acc);
                    return <rect key={rb.id} x={x} y={y1} width={w} height={r2(y0 - y1)} fill={rb.color} opacity={0.75} />;
                  })}
                  {row.discr > 0 && (
                    <rect x={x} y={Y(acc + row.discr)} width={w} height={r2(Y(acc) - Y(acc + row.discr))} fill={bad ? "#f87171" : "#34d399"} opacity={bad ? 1 : 0.9} />
                  )}
                  <line x1={x - 2} x2={x + w + 2} y1={Y(row.limite)} y2={Y(row.limite)} stroke="#e7e9f0" strokeWidth={1.5} />
                  <text x={x + w / 2} y={H - P.b + 14} textAnchor="middle" fontSize={10} fill="#5a6275">{String(row.year).slice(2)}</text>
                  {row.discr < 0 && (
                    <text x={x + w / 2} y={Y(acc) - 4} textAnchor="middle" fontSize={9.5} fill="#f87171">estoura</text>
                  )}
                </g>
              );
            })}
          </svg>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">
            {RUBRICAS.map((rb) => (
              <span key={rb.id} className="inline-flex items-center gap-1">
                <span className="size-2.5 rounded-sm" style={{ background: rb.color, opacity: 0.75 }} />
                {rb.label}
              </span>
            ))}
            <span className="inline-flex items-center gap-1">
              <span className="size-2.5 rounded-sm bg-ok" />
              Discricionárias (investimento, custeio)
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-0.5 w-3 bg-ink" />
              limite do arcabouço
            </span>
          </div>
        </Panel>
        <div className="grid content-start gap-2">
          <Stat label="Limite cresce" value={`${pct(limite, 2)}/ano`} hint="70% da receita, entre 0,6% e 2,5%" />
          <Stat label="Discricionárias 2025" value={`R$ ${num(DISCR0, 0)} bi`} />
          <Stat label="Discricionárias 2035" value={`R$ ${num(last.discr, 0)} bi`} tone={last.discr < SHUTDOWN ? "bad" : "good"} />
          <Stat
            label="“Shutdown” (abaixo de R$ 120 bi)"
            value={shutdown ? String(shutdown.year) : "não ocorre"}
            tone={shutdown ? "bad" : "good"}
            hint="máquina pública sem verba para funcionar"
          />
        </div>
      </div>
      <Callout tone={shutdown ? "bad" : "ok"}>
        Mais de 90% da despesa federal é obrigatória: Previdência, salários, BPC, pisos constitucionais. Se essas rubricas crescem
        mais rápido que o limite total, a diferença sai do único pedaço ajustável — investimento, bolsas, fiscalização, manutenção.
        Quando ele chega perto de zero, ministérios param: o “shutdown” brasileiro é por asfixia, não por falta de lei.
      </Callout>
      <p className="font-mono text-[11px] text-faint">discricionárias = limite × (1 + Δlim)ᵏ − Σ obrigatóriasᵢ × (1 + gᵢ)ᵏ</p>
      <p className="text-xs text-faint">
        Experimente: com os valores padrão, ache o ano do shutdown; depois desvincule os benefícios do salário mínimo e os pisos
        da receita e veja quantos anos se ganha. Valores aproximados.
      </p>
    </div>
  );
}
