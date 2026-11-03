"use client";

import { useEffect, useState } from "react";
import { Button, Controls, Panel, Slider, Stat } from "@/components/ui";
import { useTicker } from "@/lib/useTicker";
import { lendingRounds, multiplier } from "./moedaModel";
import { br, pct } from "./num";

const B = 100;
const ROUNDS = 14;

export function MoneyMultiplier() {
  const [r, setR] = useState(21);
  const [e, setE] = useState(3);
  const [c, setC] = useState(25);
  const [shown, setShown] = useState(ROUNDS);
  const ticker = useTicker(() => setShown((s) => Math.min(ROUNDS, s + 1)), { speed: 0.06 });
  const { running, pause } = ticker;
  useEffect(() => {
    if (shown >= ROUNDS && running) pause();
  }, [shown, running, pause]);

  const rounds = lendingRounds(B, c / 100, r / 100, e / 100, ROUNDS);
  const m = multiplier(c / 100, r / 100, e / 100);
  const m1 = B * m;
  const visible = rounds.slice(0, shown);
  const curM1 = shown >= ROUNDS ? m1 : (visible.at(-1)?.m1 ?? B) + (visible.at(-1)?.loan ?? 0);
  const maxD = rounds[0].deposit;

  // svg bars
  const W = 640,
    H = 230,
    padL = 36,
    padB = 22,
    bw = (W - padL - 10) / ROUNDS;
  const ys = (v: number) => Math.round((H - padB - (v / maxD) * (H - padB - 12)) * 100) / 100;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0 space-y-3">
        <Controls>
          <Slider label="Compulsório (BCB)" value={r} min={0} max={60} step={1} onChange={setR} format={(x) => pct(x, 0)} className="w-full sm:w-[48%]" />
          <Slider label="Reserva voluntária" value={e} min={0} max={20} step={1} onChange={setE} format={(x) => pct(x, 0)} className="w-full sm:w-[48%]" />
          <Slider label="Papel-moeda / depósitos" value={c} min={0} max={100} step={1} onChange={setC} format={(x) => pct(x, 0)} className="w-full sm:w-[48%]" />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              onClick={() => {
                setShown(0);
                ticker.play();
              }}
            >
              ▶ Rodadas de crédito
            </Button>
          </div>
        </Controls>
        <Panel title={`Depósito → reserva → empréstimo → novo depósito (base de R$ ${B})`}>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
            {[0, 0.5, 1].map((f) => (
              <g key={f}>
                <line x1={padL} x2={W - 10} y1={ys(maxD * f)} y2={ys(maxD * f)} stroke="#242a38" />
                <text x={padL - 4} y={ys(maxD * f) + 3.5} fontSize={10.5} fill="#5a6275" textAnchor="end">
                  {br(maxD * f, 0)}
                </text>
              </g>
            ))}
            {visible.map((rd) => {
              const x = Math.round((padL + rd.k * bw + 3) * 100) / 100;
              const w = Math.round((bw - 6) * 100) / 100;
              return (
                <g key={rd.k}>
                  <rect x={x} y={ys(rd.deposit)} width={w} height={Math.max(0, ys(rd.reserves) - ys(rd.deposit))} fill="#facc15" opacity={0.8} />
                  <rect x={x} y={ys(rd.reserves)} width={w} height={Math.max(0, H - padB - ys(rd.reserves))} fill="#f87171" opacity={0.8} />
                  <text x={x + w / 2} y={H - 6} fontSize={10} fill="#5a6275" textAnchor="middle">
                    {rd.k + 1}
                  </text>
                </g>
              );
            })}
          </svg>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-[#f87171]" /> fica parado como reserva (compulsório + voluntária)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-[#facc15]" /> emprestado — e volta ao sistema
            </span>
          </div>
        </Panel>
        <p className="font-mono text-xs text-muted">m = (1 + c) / (c + r + e) = {br(m, 2)} · M1 = m · base</p>
        <p className="text-xs text-faint">
          Experimente: suba o compulsório de 21% para 45% e veja as barras amarelas encolherem e o multiplicador cair — é assim que o BCB
          “enxuga” crédito sem mexer na Selic. Depois zere o papel-moeda: quanto menos dinheiro fica no bolso, mais o crédito se multiplica.
        </p>
      </div>
      <div className="grid content-start gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <Stat label="Multiplicador" value={`${br(m, 2)}×`} tone={m > 3 ? "warn" : "neutral"} />
        <Stat label="Meios de pagamento (M1)" value={`R$ ${br(curM1, 0)}`} hint={`limite: R$ ${br(m1, 0)} a partir de R$ ${B} de base`} />
        <Stat label="Moeda criada pelos bancos" value={`R$ ${br(m1 - B, 0)}`} hint="crédito que virou depósito" />
        <Stat label="Rodada" value={`${shown} de ${ROUNDS}`} />
      </div>
    </div>
  );
}
