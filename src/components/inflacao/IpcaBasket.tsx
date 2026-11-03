"use client";

import { useState } from "react";
import { Button, Controls, Panel, Slider, Stat } from "@/components/ui";
import { BAND, IPCA_GROUPS, META, SUBITEMS, headline, type GroupId } from "./inflacaoModel";
import { br, pct } from "./num";

type Vars = Record<GroupId, number>;
const BASE = Object.fromEntries(IPCA_GROUPS.map((g) => [g.id, g.v])) as Vars;
const W = Object.fromEntries(IPCA_GROUPS.map((g) => [g.id, g.w])) as Record<GroupId, number>;

export function IpcaBasket() {
  const [vars, setVars] = useState<Vars>(BASE);
  const [gas, setGas] = useState(0);
  const [energia, setEnergia] = useState(0);

  // choques em subitens repassam ao grupo na proporção do peso do subitem
  const eff: Vars = {
    ...vars,
    transp: vars.transp + (gas * SUBITEMS.gasolina) / W.transp,
    hab: vars.hab + (energia * SUBITEMS.energia) / W.hab,
  };
  const ipca = headline(eff);
  const contrib = IPCA_GROUPS.map((g) => ({ ...g, c: (g.w * eff[g.id]) / 100 }));
  const maxAbs = Math.max(1, ...contrib.map((c) => Math.abs(c.c)));
  const energyFuel = (gas * SUBITEMS.gasolina + energia * SUBITEMS.energia) / 100;
  const out = ipca > META + BAND || ipca < META - BAND;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0 space-y-3">
        <Controls>
          <Slider label="⛽ Gasolina (choque)" value={gas} min={-20} max={40} step={1} onChange={setGas} format={(x) => `${x > 0 ? "+" : ""}${pct(x, 0)}`} className="w-full sm:w-[48%]" />
          <Slider label="⚡ Energia elétrica (bandeira)" value={energia} min={-20} max={40} step={1} onChange={setEnergia} format={(x) => `${x > 0 ? "+" : ""}${pct(x, 0)}`} className="w-full sm:w-[48%]" />
          <div className="flex flex-wrap gap-2">
            <Button className="text-xs" onClick={() => setVars({ ...vars, alim: vars.alim + 8 })}>
              🌵 Seca: alimentos +8 p.p.
            </Button>
            <Button className="text-xs" onClick={() => setEnergia(25)}>
              🔴 Bandeira vermelha
            </Button>
            <Button
              variant="ghost"
              className="text-xs"
              onClick={() => {
                setVars(BASE);
                setGas(0);
                setEnergia(0);
              }}
            >
              Restaurar
            </Button>
          </div>
        </Controls>
        <Panel title="Variação em 12 meses por grupo → contribuição para o IPCA">
          <div className="space-y-2.5">
            {contrib.map((g) => (
              <div key={g.id} className="grid grid-cols-1 items-center gap-x-3 gap-y-1 text-sm sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)]">
                <Slider
                  label={
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-2 rounded-full" style={{ background: g.color }} />
                      <span className="truncate">{g.label}</span>
                      <span className="font-mono text-[10.5px] text-faint">{br(g.w, 1)}%</span>
                    </span>
                  }
                  value={vars[g.id]}
                  min={-10}
                  max={25}
                  step={0.5}
                  onChange={(v) => setVars({ ...vars, [g.id]: v })}
                  format={(v) => pct(v)}
                  className="sm:col-span-2"
                />
                <div className="flex items-center gap-2">
                  <div className="relative h-4 flex-1 rounded bg-panel-2">
                    <div className="absolute inset-y-0 left-1/2 w-px bg-line" />
                    <div
                      className="absolute inset-y-0 rounded"
                      style={{
                        background: g.color,
                        left: g.c >= 0 ? "50%" : `${50 - (Math.abs(g.c) / maxAbs) * 50}%`,
                        width: `${Math.round((Math.abs(g.c) / maxAbs) * 5000) / 100}%`,
                      }}
                    />
                  </div>
                  <span className="w-14 text-right font-mono text-xs tabular-nums">{br(g.c, 2)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-right text-[11px] text-faint">contribuição em pontos percentuais · peso aproximado (IBGE)</div>
        </Panel>
        <p className="font-mono text-xs text-muted">IPCA = Σ pesoᵢ × variaçãoᵢ · contribuição = peso × variação</p>
        <p className="text-xs text-faint">
          Experimente: dê +30% na gasolina. Um único subitem com 5% de peso adiciona 1,5 p.p. ao índice — mais do que zerar a inflação de
          Vestuário, Comunicação e Artigos de residência juntos.
        </p>
      </div>
      <div className="grid content-start gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <Stat label="IPCA em 12 meses" value={pct(ipca, 2)} tone={out ? "bad" : "good"} hint={`meta ${br(META, 1)}% · teto ${br(META + BAND, 1)}%`} />
        <Stat label="Gasolina + energia" value={`${br(energyFuel, 2)} p.p.`} hint="contribuição dos dois subitens" tone={Math.abs(energyFuel) > 0.75 ? "warn" : "neutral"} />
        <Stat label="Maior contribuição" value={[...contrib].sort((a, b) => b.c - a.c)[0].label} hint={`${br([...contrib].sort((a, b) => b.c - a.c)[0].c, 2)} p.p.`} />
        <p className="text-xs leading-relaxed text-faint">
          Pesos e variações iniciais são valores aproximados para 2025. O IBGE atualiza os pesos com a Pesquisa de Orçamentos Familiares (POF).
        </p>
      </div>
    </div>
  );
}
