"use client";

import { useState } from "react";
import { Button, Callout, Controls, Panel, Slider, Stat } from "@/components/ui";
import { efeito, GINI_BASE, PIB, POBREZA_BASE, POP, total, USOS, type Uso } from "./alocadorModel";
import { num, sgn } from "./fmt";

const ORC = 100;
type Gastos = Omit<Record<Uso, number>, "divida">;
const GASTOS: Exclude<Uso, "divida">[] = ["bf", "gas", "deson", "cred", "inv"];

const PRESETS: { label: string; v: Gastos }[] = [
  { label: "Tudo no Bolsa Família", v: { bf: 100, gas: 0, deson: 0, cred: 0, inv: 0 } },
  { label: "Tudo para empresas", v: { bf: 0, gas: 0, deson: 50, cred: 50, inv: 0 } },
  { label: "Tudo em investimento", v: { bf: 0, gas: 0, deson: 0, cred: 0, inv: 100 } },
  { label: "Abater dívida", v: { bf: 0, gas: 0, deson: 0, cred: 0, inv: 0 } },
  { label: "Misto", v: { bf: 30, gas: 5, deson: 10, cred: 5, inv: 25 } },
];

export function Alocador() {
  const [g, setG] = useState<Gastos>({ bf: 20, gas: 5, deson: 15, cred: 10, inv: 20 });
  const soma = GASTOS.reduce((a, k) => a + g[k], 0);
  const fator = soma > ORC ? ORC / soma : 1;
  const aloc: Record<Uso, number> = {
    bf: g.bf * fator,
    gas: g.gas * fator,
    deson: g.deson * fator,
    cred: g.cred * fator,
    inv: g.inv * fator,
    divida: Math.max(0, ORC - soma),
  };
  const t = total(aloc);
  const ref = efeito("divida", ORC).dDivida;
  const dPobreza = (t.pobreza / 1000 / POP) * 100;

  const W = 640;
  let acc = 0;
  const r2 = (v: number) => Math.round(v * 100) / 100;

  return (
    <div className="space-y-3">
      <Controls>
        {PRESETS.map((p) => (
          <Button key={p.label} onClick={() => setG(p.v)}>
            {p.label}
          </Button>
        ))}
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Panel title={`Distribua R$ ${ORC} bi — o que sobrar vai para abater dívida`}>
          <svg viewBox={`0 0 ${W} 40`} className="w-full">
            {USOS.map((u) => {
              const x = r2((acc / ORC) * W);
              const w = r2((aloc[u.id] / ORC) * W);
              acc += aloc[u.id];
              return <rect key={u.id} x={x} y={4} width={Math.max(0, w - 1)} height={32} rx={3} fill={u.color} style={{ transition: "all 250ms" }} />;
            })}
          </svg>
          <div className="mt-3 grid gap-2">
            {GASTOS.map((k) => {
              const u = USOS.find((x) => x.id === k);
              return (
                <Slider
                  key={k}
                  label={
                    <span className="inline-flex w-40 items-center gap-1.5">
                      <span className="size-2.5 rounded-sm" style={{ background: u?.color }} />
                      {u?.label}
                    </span>
                  }
                  value={g[k]}
                  min={0}
                  max={100}
                  step={5}
                  onChange={(v) => setG((s) => ({ ...s, [k]: v }))}
                  format={(v) => `R$ ${num(v * fator, 0)} bi`}
                />
              );
            })}
            <div className="flex items-center justify-between text-sm text-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-[#8a93a8]" /> Abater dívida (sobra)
              </span>
              <span className="font-mono text-xs">R$ {num(aloc.divida, 0)} bi</span>
            </div>
            {soma > ORC && <p className="text-xs text-warn">Você passou de R$ {ORC} bi; os valores foram reduzidos proporcionalmente.</p>}
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[460px] text-xs">
              <thead className="text-faint">
                <tr className="border-b border-line text-left">
                  <th className="py-1 font-normal">uso</th>
                  <th className="py-1 text-right font-normal">R$ bi</th>
                  <th className="py-1 text-right font-normal">saem da pobreza</th>
                  <th className="py-1 text-right font-normal">PIB curto prazo</th>
                  <th className="py-1 text-right font-normal">dívida/PIB</th>
                  <th className="py-1 text-right font-normal">Gini (pts)</th>
                </tr>
              </thead>
              <tbody className="font-mono tabular-nums">
                {USOS.map((u) => {
                  const e = efeito(u.id, aloc[u.id]);
                  return (
                    <tr key={u.id} className="border-b border-line/50">
                      <td className="py-1 font-sans text-muted">{u.label}</td>
                      <td className="py-1 text-right">{num(aloc[u.id], 0)}</td>
                      <td className="py-1 text-right">{num(e.pobreza, 0)} mil</td>
                      <td className="py-1 text-right">{sgn((e.dPib / PIB) * 100, 2)}%</td>
                      <td className="py-1 text-right">{sgn(e.dDivida, 2)}</td>
                      <td className="py-1 text-right">{sgn(e.dGini, 2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
        <div className="grid content-start gap-2">
          <Stat label="Taxa de pobreza" value={`${num(POBREZA_BASE - dPobreza, 1)}%`} tone={dPobreza > 2 ? "good" : dPobreza > 0.5 ? "neutral" : "warn"} hint={`${sgn(-dPobreza, 2)} p.p. · ${num(t.pobreza / 1000, 2)} mi de pessoas`} />
          <Stat label="PIB (curto prazo)" value={`${sgn((t.dPib / PIB) * 100, 2)}%`} tone={t.dPib / PIB > 0.008 ? "good" : "neutral"} hint="efeito transitório" />
          <Stat label="Dívida/PIB em ~2 anos" value={`${sgn(t.dDivida, 2)} p.p.`} tone={t.dDivida < ref * 0.8 ? "good" : t.dDivida > ref * 0.5 ? "warn" : "neutral"} hint={`abater tudo: ${sgn(ref, 2)} p.p.`} />
          <Stat label="Gini" value={num(GINI_BASE + t.dGini / 100, 3)} tone={t.dGini < -0.5 ? "good" : t.dGini > 0 ? "bad" : "neutral"} hint={`${sgn(t.dGini, 2)} pontos (base ~0,518)`} />
        </div>
      </div>
      <Callout tone="bad">
        Modelo estilizado. Os coeficientes são ilustrativos, escolhidos para refletir a ordem de grandeza da literatura (Ipea,
        avaliações do Bolsa Família, estudos sobre desoneração e crédito direcionado) — não são estimativas oficiais. Ficam de
        fora efeitos de longo prazo importantes: investimento público bem escolhido aumenta o PIB potencial, desoneração pode
        reduzir informalidade, dívida menor pode baixar o prêmio de risco e a Selic.
      </Callout>
      <p className="font-mono text-[11px] text-faint">
        pobreza_BF = 5 mi·(1 − e^(−x/80)) · ΔPIB = Σ kᵢ·xᵢ · Δd ≈ −(1,25·x_dív + 0,3·(0,33 + d)·ΔPIB)/PIB · ΔGini_BF = −2,2·(1 − e^(−x/120))
      </p>
      <p className="text-xs text-faint">
        Experimente: compare “Tudo no Bolsa Família” com “Tudo para empresas” e “Abater dívida” — cada um ganha em uma coluna e
        perde em outra. Note que o efeito do BF na pobreza tem retornos decrescentes: os primeiros R$ 20 bi fazem mais que os
        últimos R$ 20 bi.
      </p>
    </div>
  );
}
