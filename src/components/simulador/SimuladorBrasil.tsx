"use client";

import clsx from "clsx";
import { Button, Callout, Controls, Panel, Segmented, Slider } from "@/components/ui";
import { br, pct, signed } from "./num";
import { MetricChart, METRICS, MetricStat } from "./dashboard";
import {
  arrecadacaoPotencial,
  DEFAULT_CONTROLS,
  PRESETS,
  QUARTERS,
  quarterLabel,
  SHOCKS,
  taylorSelic,
} from "./simuladorModel";
import { useSimulador } from "./useSimulador";

const SPEEDS = [
  { value: "0.05", label: "devagar" },
  { value: "0.12", label: "normal" },
  { value: "0.4", label: "rápido" },
];

export function SimuladorBrasil() {
  const sim = useSimulador(DEFAULT_CONTROLS, { speed: 0.12 });
  const { controls: c, current: s, states } = sim;
  const receita = arrecadacaoPotencial(c.carga);
  const problems = METRICS.filter((m) => m.tone(s) === "bad");
  const year = (s.t / 4).toFixed(0);

  return (
    <div className="space-y-4">
      <Panel title="Cenários prontos" bodyClassName="p-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => sim.loadPreset(p.controls)}
              className="rounded-lg border border-line bg-panel-2/60 px-3 py-2 text-left transition hover:border-faint"
            >
              <div className="text-sm font-medium text-ink">{p.label}</div>
              <div className="mt-0.5 text-[11.5px] leading-snug text-faint">{p.blurb}</div>
            </button>
          ))}
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-4">
          <Controls className="flex-col !items-stretch">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="primary" onClick={sim.toggle}>
                {sim.running ? "❚❚ Pausar" : sim.done ? "↺ Rodar de novo" : "▶ Rodar"}
              </Button>
              <Button onClick={sim.stepOnce} disabled={sim.done || sim.running}>
                +1 trimestre
              </Button>
              <Button variant="ghost" onClick={sim.reset}>
                Reiniciar
              </Button>
              <Segmented value={String(sim.speed)} options={SPEEDS} onChange={(v) => sim.setSpeed(Number(v))} />
              <label className="ml-auto flex items-center gap-2 text-xs text-muted">
                semente
                <input
                  type="number"
                  value={sim.seed}
                  min={1}
                  max={999}
                  onChange={(e) => sim.setSeed(Math.max(1, Math.min(999, Number(e.target.value) || 1)))}
                  className="w-16 rounded-md border border-line bg-panel-2 px-2 py-1 font-mono text-xs text-ink"
                />
              </label>
            </div>
            <div className="grid gap-x-8 gap-y-3 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                  Copom:
                  <Segmented
                    value={c.taylor ? "auto" : "manual"}
                    options={[
                      { value: "auto", label: "regra de Taylor" },
                      { value: "manual", label: "você decide" },
                    ]}
                    onChange={(v) => sim.setControls({ taylor: v === "auto" })}
                  />
                </div>
                {c.taylor ? (
                  <div className="text-xs text-faint">
                    Selic automática: <span className="font-mono text-ink">{pct(s.selic, 2)}</span> · a regra pede{" "}
                    <span className="font-mono">{pct(taylorSelic(s), 1)}</span> e o BC anda aos poucos
                  </div>
                ) : (
                  <Slider label="Selic" value={c.selic} min={2} max={26} step={0.25} onChange={(v) => sim.setControls({ selic: v })} format={(v) => pct(v, 2)} />
                )}
              </div>
              <Slider
                label="Gasto primário"
                value={c.gasto}
                min={27}
                max={40}
                step={0.1}
                onChange={(v) => sim.setControls({ gasto: v })}
                format={(v) => `${br(v)}% PIB`}
              />
              <Slider
                label="Carga tributária"
                value={c.carga}
                min={25}
                max={45}
                step={0.1}
                onChange={(v) => sim.setControls({ carga: v })}
                format={(v) => `${br(v)}% PIB`}
              />
              <Slider
                label="Venda de reservas"
                value={c.intervencao}
                min={0}
                max={30}
                step={1}
                onChange={(v) => sim.setControls({ intervencao: v })}
                format={(v) => `US$ ${br(v, 0)} bi/tri`}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted">Aplicar choque:</span>
              {SHOCKS.map((k) => (
                <Button key={k.kind} onClick={() => sim.shock(k.kind)} disabled={sim.done} className="!px-2.5 !py-1 text-xs">
                  <span title={k.blurb}>{k.label}</span>
                </Button>
              ))}
            </div>
            <div className="font-mono text-[11px] text-faint">
              arrecadação potencial ≈ {br(receita)}% PIB · primário ≈ {signed(s.primario)}% · Selic → juro real → hiato → desemprego, inflação → câmbio,
              risco → dívida
            </div>
          </Controls>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {METRICS.map((m) => (
              <div
                key={m.id}
                className={clsx("rounded-xl border bg-panel p-2", m.tone(s) === "bad" ? "border-bad/50" : "border-line")}
              >
                <div className="flex items-baseline justify-between px-1 text-[11px]">
                  <span className="tracking-wide text-faint uppercase">{m.label}</span>
                  <span className={clsx("font-mono", m.tone(s) === "bad" ? "text-bad" : "text-muted")}>{m.value(s)}</span>
                </div>
                <MetricChart m={m} states={states} shocks={sim.shocks} />
              </div>
            ))}
          </div>
          <p className="text-xs text-faint">
            Experimente: rode o status quo até o fim e veja a dívida passar de 90%; depois reinicie, aperte “Crise de confiança” no 2º ano e compare;
            por fim carregue “BC leniente” e acompanhe as expectativas desancorando.
          </p>
        </div>

        <div className="min-w-0 space-y-4">
          <Panel title={quarterLabel(s.t)} right={<span className="font-mono text-xs text-faint">ano {year} de {QUARTERS / 4}</span>}>
            <div className="grid grid-cols-2 gap-2">
              {METRICS.map((m) => (
                <MetricStat key={m.id} m={m} s={s} />
              ))}
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded bg-panel-2">
              <div className="h-full bg-accent transition-[width]" style={{ width: `${(s.t / QUARTERS) * 100}%` }} />
            </div>
          </Panel>
          <Panel title="Diário de bordo" right={<span className="font-mono text-xs text-faint">{sim.events.length}</span>} bodyClassName="p-0">
            <ol className="max-h-[420px] overflow-y-auto px-4 py-3 text-[13px] leading-snug">
              {sim.events.length === 0 && <li className="text-faint">Nenhum alarme ainda. Aperte ▶ Rodar.</li>}
              {[...sim.events].reverse().map((e, i) => (
                <li key={`${e.t}-${i}`} className="flex gap-2 border-b border-line/60 py-1.5 last:border-0">
                  <span className="shrink-0 font-mono text-[11px] text-faint">{quarterLabel(e.t)}</span>
                  <span className={clsx(e.tone === "bad" && "text-bad", e.tone === "warn" && "text-warn", e.tone === "ok" && "text-ok", e.tone === "info" && "text-info")}>
                    {e.text}
                  </span>
                </li>
              ))}
            </ol>
          </Panel>
          {problems.length >= 3 && (
            <Callout tone="bad">
              {problems.length} indicadores no vermelho ao mesmo tempo: {problems.map((m) => m.label).join(", ")}. É o tipo de quadro que o noticiário chama de
              crise.
            </Callout>
          )}
        </div>
      </div>
    </div>
  );
}
