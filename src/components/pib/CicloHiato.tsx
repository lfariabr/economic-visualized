"use client";

import { useEffect, useRef, useState } from "react";
import { LineChart } from "@/components/viz/Chart";
import { Button, Callout, Controls, Panel, Slider, Stat } from "@/components/ui";
import { rng, type Rng } from "@/lib/random";
import { useTicker } from "@/lib/useTicker";
import { br } from "./num";
import { cycleInit, cycleStep, type CycleState } from "./pibModel";

const N = 48;
const qx = (t: number) => 2026 + t / 4;
const PREFILL = 8;
const DEFAULTS = { persist: 0.8, vol: 0.6, potG: 2, shock: 0 };

function prefill(r: Rng, p: { persist: number; vol: number; potG: number } = DEFAULTS): CycleState[] {
  const st = [cycleInit()];
  for (let i = 0; i < PREFILL; i++) st.push(cycleStep(st[i], r.normal(), { ...p, shock: 0 }));
  return st;
}

/** Potential vs actual GDP, output gap, technical recessions (2 negative quarters). */
export function CicloHiato() {
  const [persist, setPersist] = useState(0.8);
  const [vol, setVol] = useState(0.6);
  const [potG, setPotG] = useState(2);
  const [seed, setSeed] = useState(3);
  const rngRef = useRef<Rng>(rng(3));
  const states = useRef<CycleState[] | null>(null);
  if (states.current === null) states.current = prefill(rngRef.current);
  const pending = useRef<number[]>([]);
  const shockMarks = useRef<{ t: number; label: string }[]>([]);
  const params = useRef({ persist, vol, potG });
  params.current = { persist, vol, potG };

  const ticker = useTicker(
    () => {
      const st = states.current!;
      const last = st[st.length - 1];
      if (last.t >= N) return;
      const shock = pending.current.shift() ?? 0;
      st.push(cycleStep(last, rngRef.current.normal(), { ...params.current, shock }));
    },
    { speed: 0.1 },
  );
  const cur = states.current![states.current!.length - 1];
  const done = cur.t >= N;
  const { running, pause } = ticker;
  useEffect(() => {
    if (done && running) pause();
  }, [done, running, pause]);

  const reset = (s = seed) => {
    rngRef.current = rng(s);
    states.current = prefill(rngRef.current, params.current);
    pending.current = [];
    shockMarks.current = [];
    ticker.refresh();
  };
  const shock = (seq: number[], label: string) => {
    pending.current = seq.map((v, i) => v + (pending.current[i] ?? 0)).concat(pending.current.slice(seq.length));
    shockMarks.current.push({ t: cur.t, label });
    ticker.refresh();
  };

  const st = states.current!;
  // recession bands
  const bands: { from: number; to: number; color: string; label?: string }[] = [];
  let start: number | null = null;
  for (let i = 1; i < st.length; i++) {
    if (st[i].recession && start === null) start = i - 2;
    if (!st[i].recession && start !== null) {
      bands.push({ from: qx(start), to: qx(i - 1), color: "#f87171", label: "recessão" });
      start = null;
    }
  }
  if (start !== null) bands.push({ from: qx(start), to: qx(st.length - 1), color: "#f87171", label: "recessão" });
  const yoy = st.length > 4 ? (cur.pib / st[st.length - 5].pib - 1) * 100 : 0;
  const lo = Math.min(...st.map((s) => Math.min(s.pib, s.pot))) - 2;
  const hi = Math.max(...st.map((s) => Math.max(s.pib, s.pot))) + 2;
  const markers = shockMarks.current.map((m) => ({ x: qx(m.t), label: m.label, color: "#8a93a8" }));

  return (
    <div className="space-y-3">
      <Controls>
        <Button variant="primary" onClick={() => (done ? (reset(), ticker.play()) : ticker.toggle())}>
          {ticker.running ? "❚❚ Pausar" : done ? "↺ De novo" : "▶ Rodar"}
        </Button>
        <Button onClick={ticker.tick} disabled={done || ticker.running}>
          +1 trimestre
        </Button>
        <Button variant="ghost" onClick={() => reset()}>
          Reiniciar
        </Button>
        <span className="text-xs text-muted">Choque:</span>
        <Button onClick={() => shock([-8, 1.5, 1], "pandemia")} disabled={done}>
          Pandemia
        </Button>
        <Button onClick={() => shock([-0.9, -0.9, -0.9, -0.9, -0.6], "crise")} disabled={done}>
          Crise prolongada
        </Button>
        <Button onClick={() => shock([1.2, 0.8, 0.5], "boom")} disabled={done}>
          Boom de commodities
        </Button>
      </Controls>
      <Controls>
        <Slider label="Persistência ρ" value={persist} min={0.3} max={0.97} step={0.01} onChange={setPersist} format={(v) => br(v, 2)} className="min-w-[200px] flex-1" />
        <Slider label="Volatilidade σ" value={vol} min={0} max={1.5} step={0.05} onChange={setVol} format={(v) => br(v, 2)} className="min-w-[200px] flex-1" />
        <Slider label="PIB potencial" value={potG} min={0} max={5} step={0.1} onChange={setPotG} format={(v) => `${br(v, 1)}% a.a.`} className="min-w-[200px] flex-1" />
        <label className="flex items-center gap-2 text-xs text-muted">
          semente
          <input
            type="number"
            value={seed}
            min={1}
            max={999}
            onChange={(e) => {
              const v = Math.max(1, Math.min(999, Number(e.target.value) || 1));
              setSeed(v);
              reset(v);
            }}
            className="w-16 rounded-md border border-line bg-panel-2 px-2 py-1 font-mono text-xs text-ink"
          />
        </label>
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <div className="grid min-w-0 gap-4">
          <Panel title="PIB efetivo × PIB potencial (índice)">
            <LineChart
              series={[
                { id: "pot", label: "PIB potencial", color: "#8a93a8", dashed: true, points: st.map((s) => [qx(s.t), s.pot]) },
                { id: "pib", label: "PIB efetivo", color: "#e879f9", points: st.map((s) => [qx(s.t), s.pib]) },
              ]}
              xDomain={[qx(0), qx(N)]}
              yDomain={[lo, hi]}
              height={220}
              xFormat={(v) => String(Math.round(v))}
              yFormat={(v) => br(v, 0)}
              bands={bands}
              markers={markers}
            />
          </Panel>
          <Panel title="Hiato do produto (% do potencial)">
            <LineChart
              series={[{ id: "hiato", label: "hiato", color: "#e879f9", area: true, points: st.map((s) => [qx(s.t), s.hiato]) }]}
              xDomain={[qx(0), qx(N)]}
              yDomain={[Math.min(-4, ...st.map((s) => s.hiato - 1)), Math.max(4, ...st.map((s) => s.hiato + 1))]}
              height={160}
              xFormat={(v) => String(Math.round(v))}
              yFormat={(v) => `${br(v, 0)}%`}
              hMarkers={[{ y: 0, color: "#8a93a8" }]}
              bands={bands}
            />
            <div className="mt-2 font-mono text-[11px] text-faint">
              hiatoₜ₊₁ = ρ·hiatoₜ + σ·εₜ + choque · PIB = potencial·(1 + hiato) · recessão técnica = 2 trimestres de PIB t/t &lt; 0
            </div>
          </Panel>
        </div>
        <div className="grid content-start gap-2">
          <Stat label="Trimestre" value={`T${(cur.t % 4) + 1} ${2026 + Math.floor(cur.t / 4)}`} hint={`${cur.t} de ${N}`} />
          <Stat label="Hiato" value={`${br(cur.hiato, 1)}%`} tone={cur.hiato < -2 ? "bad" : cur.hiato > 2 ? "warn" : "good"} hint={cur.hiato > 1.5 ? "economia aquecida: pressão inflacionária" : cur.hiato < -1.5 ? "ociosidade: desemprego alto" : "perto do potencial"} />
          <Stat label="PIB t/t" value={`${br(cur.qoq, 2)}%`} tone={cur.qoq < 0 ? "bad" : "neutral"} hint={cur.neg > 0 ? `${cur.neg} trimestre(s) seguidos de queda` : "dessazonalizado"} />
          <Stat label="PIB 12 meses" value={`${br(yoy, 1)}%`} tone={yoy < 0 ? "bad" : "neutral"} />
          <Stat label="Recessões" value={String(bands.length)} tone={bands.length ? "bad" : "good"} hint="pela regra dos 2 trimestres" />
        </div>
      </div>
      {cur.recession && (
        <Callout tone="bad">
          Recessão técnica: dois trimestres seguidos de PIB em queda. No Brasil quem data oficialmente os ciclos é o CODACE (FGV), olhando também
          emprego, renda e produção industrial.
        </Callout>
      )}
      <p className="text-xs text-faint">
        Experimente: rode com σ = 0 (sem ruído) e aperte “Crise prolongada” — o hiato afunda por um ano e a faixa vermelha aparece; depois troque a
        semente e veja recessões surgirem só do acaso quando σ e ρ são altos.
      </p>
    </div>
  );
}
