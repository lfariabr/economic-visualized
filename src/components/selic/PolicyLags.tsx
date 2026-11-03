"use client";

import { useMemo, useState } from "react";
import { Callout, Controls, Panel, Segmented, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { META, impulse, lagGame } from "./selicModel";
import { br, pct, pp } from "./num";

const SKY = "#38bdf8";
type Preset = "paciente" | "impaciente" | "custom";

export function PolicyLags() {
  const [hike, setHike] = useState(1);
  const [peak, setPeak] = useState(12);
  const [preset, setPreset] = useState<Preset>("paciente");
  const [phi, setPhi] = useState(1.5);
  const [smooth, setSmooth] = useState(0.7);

  const irf = useMemo(() => impulse(hike, peak), [hike, peak]);
  const argmin = (k: "credito" | "pib" | "inflacao") =>
    irf.reduce((best, p) => (p[k] < best[k] ? p : best), irf[0]);
  const pk = { credito: argmin("credito"), pib: argmin("pib"), inflacao: argmin("inflacao") };

  const game = useMemo(() => lagGame(phi, smooth, peak), [phi, smooth, peak]);
  const crossings = game.reduce((n, p, i) => (i > 0 && (game[i - 1].pi - META) * (p.pi - META) < 0 ? n + 1 : n), 0);
  const minPi = Math.min(...game.map((p) => p.pi));
  const maxI = Math.max(...game.map((p) => p.i));
  const minI = Math.min(...game.map((p) => p.i));
  const oscill = crossings >= 3;

  const choose = (p: Preset) => {
    setPreset(p);
    if (p === "paciente") {
      setPhi(1.5);
      setSmooth(0.7);
    } else if (p === "impaciente") {
      setPhi(6);
      setSmooth(0);
    }
  };

  return (
    <div className="space-y-4">
      <Controls>
        <Slider className="min-w-60 flex-1" label="alta da Selic" value={hike} min={0.25} max={3} step={0.25} onChange={setHike} format={(v) => pp(v, 2)} />
        <Slider className="min-w-60 flex-1" label="pico na inflação" value={peak} min={6} max={18} step={1} onChange={setPeak} format={(v) => `${v} meses`} />
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Panel title="Resposta a um aumento da Selic (função impulso-resposta)">
          <LineChart
            height={240}
            xDomain={[0, 36]}
            xLabel="meses depois da decisão"
            yFormat={(v) => `${br(v, 1)}`}
            yDomain={[Math.min(-1.7 * hike, -0.5), 0.2]}
            series={[
              { id: "c", label: "concessões de crédito (%)", color: SKY, points: irf.map((p) => [p.t, p.credito]) },
              { id: "y", label: "PIB (p.p.)", color: "#a78bfa", points: irf.map((p) => [p.t, p.pib]), width: 2.5 },
              { id: "pi", label: "IPCA (p.p.)", color: "#f87171", points: irf.map((p) => [p.t, p.inflacao]), width: 2.5 },
            ]}
            markers={[
              { x: pk.pib.t, color: "#a78bfa", label: `PIB: ${pk.pib.t}m` },
              { x: pk.inflacao.t, color: "#f87171", label: `IPCA: ${pk.inflacao.t}m` },
            ]}
            hMarkers={[{ y: 0, color: "#5a6275" }]}
          />
          <p className="mt-2 font-mono text-[11px] text-faint">
            efeito(t) = β·Δi·(t/pico)²·e^(2·(1 − t/pico)) · pico crédito ≈ {br(peak * 0.25, 0)}m, PIB ≈ {br(peak * 0.6, 0)}m, IPCA = {peak}m
          </p>
        </Panel>
        <div className="grid grid-cols-2 content-start gap-2 lg:grid-cols-1">
          <Stat label="crédito: pico" value={pct(pk.credito.credito)} hint={`aos ${pk.credito.t} meses`} />
          <Stat label="PIB: pico" value={pp(pk.pib.pib, 2)} hint={`aos ${pk.pib.t} meses`} />
          <Stat label="IPCA: pico" value={pp(pk.inflacao.inflacao, 2)} tone="good" hint={`aos ${pk.inflacao.t} meses`} />
          <Stat label="horizonte relevante" value={`${Math.round(peak * 0.75)}–${Math.round(peak * 1.5)}m`} hint="por isso o Copom mira 18 meses à frente" />
        </div>
      </div>

      <Panel
        title="BC que olha só a inflação de hoje"
        right={
          <Segmented
            value={preset}
            onChange={choose}
            options={[
              { value: "paciente", label: "BC paciente" },
              { value: "impaciente", label: "BC impaciente" },
              { value: "custom", label: "ajustar" },
            ]}
          />
        }
      >
        <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          <Slider label="reação φ" value={phi} min={0.5} max={10} step={0.25} onChange={(v) => { setPreset("custom"); setPhi(v); }} format={(v) => br(v, 2)} />
          <Slider label="suavização ρ" value={smooth} min={0} max={0.95} step={0.05} onChange={(v) => { setPreset("custom"); setSmooth(v); }} format={(v) => br(v, 2)} />
        </div>
        <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_260px]">
          <LineChart
            height={230}
            xDomain={[0, 72]}
            yDomain={[0, Math.max(22, Math.ceil(maxI + 1))]}
            xLabel="meses"
            yFormat={(v) => `${br(v, 0)}%`}
            series={[
              { id: "i", label: "Selic", color: SKY, points: game.map((p) => [p.t, p.i]), step: true },
              { id: "pi", label: "IPCA", color: oscill ? "#f87171" : "#34d399", points: game.map((p) => [p.t, p.pi]), width: 2.5 },
            ]}
            hMarkers={[{ y: META, label: "meta", color: "#34d399" }]}
          />
          <div className="grid grid-cols-2 content-start gap-2 lg:grid-cols-1">
            <Stat label="cruzamentos da meta" value={crossings} tone={oscill ? "bad" : "good"} hint={oscill ? "oscilação" : "convergência suave"} />
            <Stat label="inflação mínima" value={pct(minPi)} tone={minPi < META - 1.5 ? "bad" : "neutral"} />
            <Stat label="Selic: faixa" value={`${br(minI, 1)}–${br(maxI, 1)}%`} tone={maxI - minI > 12 ? "bad" : "neutral"} />
          </div>
        </div>
        <p className="mt-2 font-mono text-[11px] text-faint">
          iₜ = ρ·iₜ₋₁ + (1−ρ)·[8% + φ·(πₜ − 3%)] · πₜ = 3% + choqueₜ − 0,6·Σ wⱼ·(iₜ₋ⱼ − 8%) · w = defasagem com pico em {peak} meses
        </p>
      </Panel>
      {oscill && (
        <Callout tone="bad">
          O BC reage à inflação de hoje, mas o juro só age daqui a {peak} meses. Quando o efeito chega, ele ainda está apertando — a
          inflação afunda abaixo da meta, ele corta com força, e o ciclo se repete. Como ajustar o chuveiro: girar a torneira toda
          antes da água mudar de temperatura.
        </Callout>
      )}
      <p className="text-xs text-faint">
        Experimente: escolha “BC impaciente” e aumente o pico da defasagem para 18 meses — a oscilação piora. Volte ao “BC paciente”
        e veja a inflação convergir sem cruzar a meta várias vezes.
      </p>
    </div>
  );
}
