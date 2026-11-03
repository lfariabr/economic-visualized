"use client";

import { useState } from "react";
import { Callout, Controls, Panel, Segmented, Slider, Stat } from "@/components/ui";
import { EXCEPTIONS, RATE_NO_EXC, cascade, referenceRate } from "./lafferModel";
import { num, pct } from "./fmt";

const STAGE_NAMES = ["Insumo", "Indústria", "Fábrica", "Distribuidor", "Atacado", "Varejo"];
const TOTAL_VA = 500;
const r2 = (v: number) => Math.round(v * 100) / 100;

export function CascadeVat() {
  const [n, setN] = useState(4);
  const [rc, setRc] = useState(5);
  const [rv, setRv] = useState(22);
  const [regime, setRegime] = useState<"cum" | "iva">("cum");
  const c = cascade(n, TOTAL_VA, rc / 100, rv / 100);
  const names = STAGE_NAMES.slice(STAGE_NAMES.length - n);
  const effVat = rv;
  const effCum = c.effCum * 100;
  // imposto sobre imposto: o que excede a alíquota nominal aplicada só ao valor adicionado
  const taxOnTax = c.totalCum - (rc / 100) * TOTAL_VA;

  const W = 560;
  const H = 230;
  const P = { l: 40, r: 10, t: 14, b: 30 };
  const iw = W - P.l - P.r;
  const ih = H - P.t - P.b;
  const ymax = 900;
  const Y = (v: number) => r2(P.t + ih - (v / ymax) * ih);
  const bw = iw / n;

  let embedded = 0;
  return (
    <div className="space-y-3">
      <Controls>
        <Segmented value={regime} onChange={setRegime} options={[{ value: "cum", label: "Cumulativo (cascata)" }, { value: "iva", label: "IVA com créditos" }]} />
        <Slider className="min-w-44 flex-1" label="Etapas da cadeia" value={n} min={2} max={6} onChange={setN} />
        {regime === "cum" ? (
          <Slider className="min-w-52 flex-1" label="Alíquota cumulativa" value={rc} min={1} max={15} step={0.5} onChange={setRc} format={(v) => pct(v, 1)} />
        ) : (
          <Slider className="min-w-52 flex-1" label="Alíquota do IVA" value={rv} min={5} max={35} step={0.5} onChange={setRv} format={(v) => pct(v, 1)} />
        )}
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <Panel title={`Preço acumulado ao longo da cadeia · valor adicionado total R$ ${TOTAL_VA}`}>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
            {[0, 300, 600, 900].map((t) => (
              <g key={t}>
                <line x1={P.l} x2={W - P.r} y1={Y(t)} y2={Y(t)} stroke="#242a38" />
                <text x={P.l - 6} y={Y(t) + 3.5} textAnchor="end" fontSize={10.5} fill="#5a6275">{t}</text>
              </g>
            ))}
            {c.rows.map((row, i) => {
              const pre = row.pricePre;
              let tax: number;
              let stageTax: number;
              if (regime === "cum") {
                tax = row.priceCum - pre;
                stageTax = row.taxCum;
              } else {
                embedded += row.taxVat;
                tax = embedded;
                stageTax = row.taxVat;
              }
              const x = r2(P.l + i * bw + bw * 0.15);
              const w = r2(bw * 0.7);
              return (
                <g key={i}>
                  <rect x={x} y={Y(pre)} width={w} height={r2(Y(0) - Y(pre))} fill="#8a93a8" opacity={0.5} />
                  <rect x={x} y={Y(pre + tax)} width={w} height={r2(Y(pre) - Y(pre + tax))} fill={regime === "cum" ? "#f87171" : "#60a5fa"} opacity={0.85} />
                  <text x={x + w / 2} y={Y(pre + tax) - 4} textAnchor="middle" fontSize={10} fill="#e7e9f0">{num(pre + tax, 0)}</text>
                  <text x={x + w / 2} y={H - P.b + 13} textAnchor="middle" fontSize={10} fill="#5a6275">{names[i]}</text>
                  <text x={x + w / 2} y={H - P.b + 25} textAnchor="middle" fontSize={9.5} fill="#5a6275">paga {num(stageTax, 0)}</text>
                </g>
              );
            })}
          </svg>
          <div className="mt-1 flex gap-4 text-xs text-muted">
            <span><span className="mr-1 inline-block size-2.5 rounded-sm bg-muted/50" />valor adicionado acumulado</span>
            <span><span className={`mr-1 inline-block size-2.5 rounded-sm ${regime === "cum" ? "bg-bad/80" : "bg-info/80"}`} />imposto embutido</span>
          </div>
        </Panel>
        <div className="grid content-start gap-2">
          {regime === "cum" ? (
            <>
              <Stat label="Carga efetiva no preço final" value={pct(effCum, 1)} tone={effCum > rc * 1.5 ? "bad" : "warn"} hint={`alíquota nominal ${pct(rc, 1)}`} />
              <Stat label="Imposto sobre imposto" value={`R$ ${num(taxOnTax, 0)}`} tone="bad" hint="cresce com o número de etapas" />
              <Stat label="Carga efetiva ÷ nominal" value={`× ${num(effCum / rc, 2)}`} tone={effCum / rc > 1.5 ? "bad" : "warn"} hint={`um IVA de ${pct(effCum, 1)} arrecadaria o mesmo`} />
            </>
          ) : (
            <>
              <Stat label="Carga efetiva no preço final" value={pct(effVat, 1)} tone="good" hint="igual à alíquota, com qualquer nº de etapas" />
              <Stat label="Imposto total" value={`R$ ${num(c.totalVat, 0)}`} />
              <Stat label="Transparência" value="total" tone="good" hint="cada etapa abate o imposto já pago (crédito)" />
            </>
          )}
        </div>
      </div>
      <p className="font-mono text-[11px] text-faint">
        cascata: pᵢ = (pᵢ₋₁ + VAᵢ)(1 + τ) · IVA: impostoᵢ = τ·pᵢ − τ·pᵢ₋₁ = τ·VAᵢ
      </p>
      <p className="text-xs text-faint">
        Experimente: no regime cumulativo, passe de 2 para 6 etapas com a mesma alíquota e veja a carga efetiva subir sozinha;
        no IVA, o número de etapas não muda nada — por isso a cascata premia empresas verticalizadas.
      </p>
    </div>
  );
}

export function ReferenceRate() {
  const [active, setActive] = useState<Set<string>>(() => new Set(EXCEPTIONS.map((e) => e.id)));
  const rate = referenceRate(active);
  const toggle = (id: string) =>
    setActive((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  // cumulative path: adding exceptions one by one in list order
  const steps = EXCEPTIONS.map((_, i) => referenceRate(new Set(EXCEPTIONS.slice(0, i + 1).map((e) => e.id))));
  const max = 32;

  return (
    <div className="space-y-3">
      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <Panel title="Regimes diferenciados (clique para ligar/desligar)">
          <div className="grid gap-1.5 sm:grid-cols-2">
            {EXCEPTIONS.map((e) => {
              const on = active.has(e.id);
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => toggle(e.id)}
                  className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${on ? "border-warn/60 bg-warn/10 text-ink" : "border-line bg-panel-2 text-muted"}`}
                >
                  <span className="min-w-0">
                    {e.label}
                    <span className="block text-[11px] text-faint">
                      {pct(e.share * 100, 0)} da base · {e.note}
                    </span>
                  </span>
                  <span className="font-mono text-xs">{on ? "ligado" : "—"}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-4">
            <div className="mb-1 text-xs text-muted">Alíquota padrão conforme as exceções se acumulam</div>
            <svg viewBox="0 0 560 70" className="w-full">
              {[RATE_NO_EXC, ...steps].map((v, i) => {
                const w = 560 / (steps.length + 1);
                const h = r2((v / max) * 52);
                return (
                  <g key={i}>
                    <rect x={r2(i * w + 4)} y={r2(56 - h)} width={r2(w - 8)} height={h} fill={i === 0 ? "#34d399" : "#fbbf24"} opacity={0.3 + (i / steps.length) * 0.6} />
                    <text x={r2(i * w + w / 2)} y={r2(52 - h)} textAnchor="middle" fontSize={10} fill="#e7e9f0">{num(v, 1)}</text>
                    <text x={r2(i * w + w / 2)} y={68} textAnchor="middle" fontSize={9} fill="#5a6275">{i === 0 ? "nenhuma" : `+${i}`}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        </Panel>
        <div className="grid content-start gap-2">
          <Stat label="Alíquota padrão (CBS + IBS)" value={pct(rate, 1)} tone={rate > 27 ? "bad" : rate > 24 ? "warn" : "good"} hint="valores aproximados" />
          <Stat label="Sem nenhuma exceção" value={pct(RATE_NO_EXC, 1)} />
          <Stat label="Custo das exceções para quem não tem" value={`+${num(rate - RATE_NO_EXC, 1)} p.p.`} tone={rate - RATE_NO_EXC > 4 ? "bad" : "neutral"} />
        </div>
      </div>
      <Callout tone="accent">
        A arrecadação precisa ser a mesma (a reforma é “neutra”). Cada setor que ganha alíquota reduzida encolhe a base, e a
        conta volta para todo o resto como alíquota padrão maior. Com o pacote aprovado na EC 132/2023 e na LC 214/2025, a
        alíquota de referência estimada ficou perto de 28% — entre as mais altas do mundo para um IVA.
      </Callout>
      <p className="font-mono text-[11px] text-faint">t_padrão = t_sem_exceções / (1 − Σ participaçãoᵢ × reduçãoᵢ)</p>
      <p className="text-xs text-faint">
        Experimente: desligue todas as exceções e veja a alíquota cair para 21%; ligue só saúde e educação e note que todos os
        outros produtos passam a pagar mais.
      </p>
    </div>
  );
}
