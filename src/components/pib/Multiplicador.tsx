"use client";

import { useEffect, useState } from "react";
import { Button, Callout, Controls, Panel, Segmented, Slider, Stat } from "@/components/ui";
import { useTicker } from "@/lib/useTicker";
import { br } from "./num";
import { leakRate, multiplier, spendingRounds } from "./pibModel";

const N = 14;
const G = 10; // R$ bi

const MODES = {
  gasto: { label: "Gasto público direto", first: G, color: "#e879f9" },
  pobres: { label: "Transferência aos mais pobres", first: 0.95 * G, color: "#34d399" },
  ricos: { label: "Transferência aos mais ricos", first: 0.35 * G, color: "#60a5fa" },
} as const;
type Mode = keyof typeof MODES;

/** Keynesian multiplier: rounds of spending after +R$ 10 bi. */
export function Multiplicador() {
  const [c, setC] = useState(0.75);
  const [t, setT] = useState(0.3);
  const [m, setM] = useState(0.12);
  const [mode, setMode] = useState<Mode>("gasto");
  const [shown, setShown] = useState(N);
  const ticker = useTicker(() => setShown((n) => Math.min(N, n + 1)), { speed: 0.04 });
  const { running, pause } = ticker;
  useEffect(() => {
    if (running && shown >= N) pause();
  }, [running, shown, pause]);

  const alpha = leakRate(c, t, m);
  const k = multiplier(c, t, m);
  const rounds = spendingRounds(MODES[mode].first, alpha, N);
  const visible = rounds.slice(0, shown);
  const total = visible.reduce((a, b) => a + b, 0);
  const totalFinal = MODES[mode].first * k;
  const impostos = totalFinal * t;

  // SVG bars
  const W = 640;
  const Hh = 220;
  const pad = { l: 40, r: 12, t: 14, b: 26 };
  const bw = (W - pad.l - pad.r) / N;
  const maxCum = G * Math.max(k, 1) * 1.05;
  const yC = (v: number) => Math.round((pad.t + (Hh - pad.t - pad.b) * (1 - v / maxCum)) * 100) / 100;
  const yB = (v: number) => Math.round((pad.t + (Hh - pad.t - pad.b) * (1 - v / G)) * 100) / 100;
  let cum = 0;
  const cumPts = visible.map((v, i) => {
    cum += v;
    return `${(pad.l + bw * (i + 0.5)).toFixed(2)},${yC(cum)}`;
  });

  return (
    <div className="space-y-3">
      <Controls>
        <Segmented value={mode} options={(Object.keys(MODES) as Mode[]).map((v) => ({ value: v, label: MODES[v].label }))} onChange={(v) => { setMode(v); setShown(N); }} />
        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={() => {
              setShown(1);
              ticker.play();
            }}
          >
            ▶ Animar rodadas
          </Button>
          <Button onClick={() => setShown((n) => Math.min(N, n + 1))} disabled={shown >= N}>
            +1 rodada
          </Button>
        </div>
      </Controls>
      <Controls>
        <Slider label="PMC (c)" value={c} min={0.3} max={0.95} step={0.01} onChange={setC} format={(v) => br(v, 2)} className="min-w-[200px] flex-1" />
        <Slider label="Impostos (t)" value={t} min={0} max={0.45} step={0.01} onChange={setT} format={(v) => br(v, 2)} className="min-w-[200px] flex-1" />
        <Slider label="Importação (m)" value={m} min={0} max={0.3} step={0.01} onChange={setM} format={(v) => br(v, 2)} className="min-w-[200px] flex-1" />
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <Panel title={`Rodadas de gasto após +R$ ${G} bi`}>
          <svg viewBox={`0 0 ${W} ${Hh}`} className="w-full">
            {[0, 0.25, 0.5, 0.75, 1].map((f) => (
              <g key={f}>
                <line x1={pad.l} x2={W - pad.r} y1={yB(G * f)} y2={yB(G * f)} stroke="#242a38" />
                <text x={pad.l - 6} y={yB(G * f) + 3.5} textAnchor="end" fontSize={10.5} fill="#5a6275">
                  {br(G * f, 1)}
                </text>
              </g>
            ))}
            {visible.map((v, i) => (
              <g key={i}>
                <rect
                  x={(pad.l + bw * i + 3).toFixed(2)}
                  y={yB(v)}
                  width={(bw - 6).toFixed(2)}
                  height={Math.max(0, Hh - pad.b - yB(v)).toFixed(2)}
                  rx={3}
                  fill={MODES[mode].color}
                  opacity={i === shown - 1 ? 1 : 0.6}
                />
                <text x={(pad.l + bw * (i + 0.5)).toFixed(2)} y={Hh - 10} textAnchor="middle" fontSize={10} fill="#5a6275">
                  {i + 1}ª
                </text>
              </g>
            ))}
            <polyline points={cumPts.join(" ")} fill="none" stroke="#e7e9f0" strokeWidth={2} />
            {cumPts.length > 0 && (
              <text x={Number(cumPts[cumPts.length - 1].split(",")[0]) - 4} y={yC(total) - 8} textAnchor="end" fontSize={11} fill="#e7e9f0">
                acumulado R$ {br(total, 1)} bi
              </text>
            )}
          </svg>
          <div className="mt-1 text-[11px] text-faint">barras: gasto novo em cada rodada (escala à esquerda) · linha: PIB acumulado (escala até k·10)</div>
          <div className="mt-2 font-mono text-[11px] text-faint">
            α = c·(1−t) − m = {br(alpha, 3)} · k = 1 / (1 − α) = {br(k, 2)} · ΔY = 1ª rodada × k
          </div>
        </Panel>
        <div className="grid content-start gap-2">
          <Stat label="Multiplicador k" value={br(k, 2)} tone={k < 1.2 ? "warn" : "good"} hint="cada R$ 1 vira R$ k de PIB" />
          <Stat label="ΔPIB total" value={`R$ ${br(totalFinal, 1)} bi`} hint={`após ${N}+ rodadas`} />
          <Stat label="Volta em impostos" value={`R$ ${br(impostos, 1)} bi`} hint={`${br((impostos / G) * 100, 0)}% do gasto inicial`} />
          <Panel title="Mesmos R$ 10 bi" bodyClassName="p-3">
            <div className="space-y-2">
              {(Object.keys(MODES) as Mode[]).map((v) => {
                const val = MODES[v].first * k;
                return (
                  <div key={v} className="text-xs">
                    <div className="flex justify-between text-muted">
                      <span>{v === "gasto" ? "gasto direto" : v === "pobres" ? "aos mais pobres" : "aos mais ricos"}</span>
                      <span className="font-mono">R$ {br(val, 1)} bi</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded bg-panel-2">
                      <div className="h-full rounded transition-[width]" style={{ width: `${((val / (G * k)) * 100).toFixed(1)}%`, background: MODES[v].color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
      </div>
      <Callout tone="info">
        Quem recebe importa. Uma família do Bolsa Família gasta quase tudo (PMC ~0,95) no mercado do bairro; uma família rica poupa a maior parte
        (PMC ~0,35). O mesmo R$ 10 bi gera quase três vezes mais PIB no primeiro caso. Mas o multiplicador também vaza para impostos (t) e
        importações (m) — e, se o BC sobe os juros em resposta, parte do efeito some (veja IS-LM abaixo).
      </Callout>
      <p className="text-xs text-faint">
        Experimente: clique em “Animar rodadas” e veja as barras encolherem; depois suba a importação para 0,30 e o multiplicador cai para perto de 1.
      </p>
    </div>
  );
}
