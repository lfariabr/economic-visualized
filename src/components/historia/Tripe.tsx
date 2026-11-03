"use client";

import { useMemo, useState } from "react";
import { Callout, Controls, Panel, Segmented, Slider, Stat } from "@/components/ui";
import { Bars, LineChart } from "@/components/viz/Chart";
import { mean } from "@/lib/random";
import { DATA, FONTE, type SerieId } from "./historiaData";
import { META, simulaTripe, type Regime } from "./tripeModel";
import { br, pct } from "./fmtBR";

const PERIODOS = [
  { id: "a", label: "1995–98 · âncora cambial", de: 1995, ate: 1998, color: "#fbbf24" },
  { id: "b", label: "1999–2010 · tripé", de: 1999, ate: 2010, color: "#34d399" },
  { id: "c", label: "2011–16 · tripé flexibilizado", de: 2011, ate: 2016, color: "#f87171" },
  { id: "d", label: "2017–25 · teto/arcabouço", de: 2017, ate: 2025, color: "#60a5fa" },
];

function media(id: SerieId, de: number, ate: number) {
  const xs: number[] = [];
  for (let a = de; a <= ate; a++) if (DATA[id][a] !== undefined) xs.push(DATA[id][a]);
  return mean(xs);
}
function desvio(id: SerieId, de: number, ate: number) {
  const xs: number[] = [];
  for (let a = de; a <= ate; a++) if (DATA[id][a] !== undefined) xs.push(DATA[id][a]);
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
}

export function Tripe() {
  const [regime, setRegime] = useState<Regime>("ancora");
  const [primario, setPrimario] = useState(true);
  const [choque, setChoque] = useState(35);
  const sim = useMemo(() => simulaTripe(regime, choque, primario), [regime, choque, primario]);
  const outro = useMemo(() => simulaTripe(regime === "ancora" ? "tripe" : "ancora", choque, primario), [regime, choque, primario]);
  const pico = (k: "selic" | "ipca" | "cambio") => Math.max(...sim.map((q) => q[k]));
  const pibMin = Math.min(...sim.map((q) => q.pib));
  const rompeu = sim.some((q) => q.rompeu);
  const rompeuEm = sim.find((q) => q.rompeu)?.t;
  const pt = (k: "selic" | "ipca" | "pib" | "cambio" | "reservas", s = sim) => s.map((q) => [q.t, q[k]] as [number, number]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Panel title="Antes e depois de 1999 · médias anuais" right={<span className="text-[11px] text-faint">{FONTE}</span>}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="mb-2 text-xs text-faint">IPCA médio (% a.a.)</div>
              <Bars rows={PERIODOS.map((p) => ({ label: p.label, value: media("ipca", p.de, p.ate), color: p.color }))} format={(v) => br(v, 1)} />
            </div>
            <div>
              <div className="mb-2 text-xs text-faint">Selic média (% a.a.)</div>
              <Bars rows={PERIODOS.map((p) => ({ label: p.label, value: media("selic", Math.max(1996, p.de), p.ate), color: p.color }))} format={(v) => br(v, 1)} />
            </div>
            <div>
              <div className="mb-2 text-xs text-faint">PIB, crescimento médio (%)</div>
              <Bars rows={PERIODOS.map((p) => ({ label: p.label, value: Math.max(0, media("pib", p.de, p.ate)), color: p.color, note: br(media("pib", p.de, p.ate), 1) }))} format={(v) => br(v, 1)} />
            </div>
            <div>
              <div className="mb-2 text-xs text-faint">Volatilidade do IPCA (desvio-padrão, p.p.)</div>
              <Bars rows={PERIODOS.map((p) => ({ label: p.label, value: desvio("ipca", p.de, p.ate), color: p.color }))} format={(v) => br(v, 1)} />
            </div>
          </div>
        </Panel>
        <div className="grid content-start gap-3">
          <Stat label="1º pilar · metas de inflação" value="jun/1999" hint="CMN fixa a meta, Copom persegue com a Selic" tone="good" />
          <Stat label="2º pilar · câmbio flutuante" value="jan/1999" hint="fim da banda cambial; o dólar absorve choques" tone="good" />
          <Stat label="3º pilar · superávit primário" value="1999 (FMI) · LRF 2000" hint="metas de primário para estabilizar a dívida" tone="good" />
        </div>
      </div>

      <Controls>
        <Segmented
          value={regime}
          onChange={setRegime}
          options={[
            { value: "ancora", label: "âncora cambial (1995–98)" },
            { value: "tripe", label: "tripé (1999+)" },
          ]}
        />
        <Slider label="Fuga de capitais" value={choque} min={5} max={60} step={1} onChange={setChoque} format={(v) => `US$ ${v} bi`} className="w-full sm:w-72" />
        <label className="flex items-center gap-2 text-muted">
          <input type="checkbox" checked={primario} onChange={(e) => setPrimario(e.target.checked)} /> superávit primário crível
        </label>
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="grid min-w-0 gap-4">
          <Panel title="Choque externo no trimestre 2 · juros, inflação e PIB">
            <LineChart
              height={220}
              series={[
                { id: "selic", label: "Selic", color: "#60a5fa", points: pt("selic"), width: 2.4 },
                { id: "ipca", label: "IPCA (anualizado)", color: "#f87171", points: pt("ipca"), width: 2.4 },
                { id: "pib", label: "PIB (anualizado)", color: "#fbbf24", points: pt("pib") },
                { id: "selic2", label: "Selic no outro regime", color: "#60a5fa", points: pt("selic", outro), dashed: true, width: 1.2 },
              ]}
              xDomain={[0, 16]}
              xLabel="trimestre"
              xFormat={(v) => br(v, 0)}
              yFormat={(v) => `${br(v, 0)}%`}
              hMarkers={[{ y: META, label: "meta", color: "#5a6275" }]}
              markers={rompeuEm !== undefined ? [{ x: rompeuEm, label: "paridade rompida", color: "#f87171" }] : [{ x: 2, label: "choque", color: "#8a93a8" }]}
            />
          </Panel>
          <Panel title="Câmbio (índice, início = 100) e reservas (US$ bi)">
            <LineChart
              height={180}
              series={[
                { id: "cambio", label: "câmbio R$/US$ (índice)", color: "#34d399", points: pt("cambio"), width: 2.4 },
                { id: "res", label: "reservas", color: "#a78bfa", points: pt("reservas"), width: 2.4 },
              ]}
              xDomain={[0, 16]}
              yDomain={[0, Math.max(180, pico("cambio") * 1.05)]}
              xFormat={(v) => br(v, 0)}
              hMarkers={[{ y: 12, label: "reservas mínimas", color: "#f87171" }]}
            />
          </Panel>
        </div>
        <div className="grid content-start gap-3">
          <Stat label="Pico da Selic" value={pct(pico("selic"), 1)} tone={pico("selic") > 30 ? "bad" : pico("selic") > 18 ? "warn" : "neutral"} />
          <Stat label="Pico do IPCA" value={pct(pico("ipca"), 1)} tone={pico("ipca") > 8 ? "bad" : pico("ipca") > 5.5 ? "warn" : "good"} />
          <Stat label="Pior PIB (anualizado)" value={pct(pibMin, 1)} tone={pibMin < 0 ? "bad" : "neutral"} />
          <Stat label="Câmbio" value={rompeu ? "rompido" : regime === "ancora" ? "defendido" : `pico ${br(pico("cambio"), 0)}`} tone={rompeu ? "bad" : "neutral"} hint={rompeu ? `maxidesvalorização no tri ${rompeuEm}` : "índice, início = 100"} />
        </div>
      </div>
      {rompeu ? (
        <Callout tone="bad">
          Defender o câmbio fixo exigiu juros altíssimos e queimou reservas até a paridade cair de uma vez — como em janeiro de 1999. Ajuste brusco: inflação e juros sobem juntos, PIB afunda.
        </Callout>
      ) : regime === "tripe" ? (
        <Callout tone="ok">
          Com câmbio flutuante o choque vira depreciação, parte dela passa para a inflação e o Copom reage com a Selic — sem queimar reservas. {primario ? "" : "Sem primário crível, o prêmio de risco mantém juros e câmbio mais altos por mais tempo."}
        </Callout>
      ) : null}
      <p className="font-mono text-xs text-faint">
        âncora: reservasₜ = reservasₜ₋₁ − 0,75·fugaₜ, Selic = 20 + 0,7·fuga · tripé: eₜ = eₜ₋₁·(1 + 0,006·fuga) + 0,15·(ē − eₜ₋₁), π = meta + 0,12·(e − 100), Selic = r* + 1,5·(π − meta)
      </p>
      <p className="text-xs text-faint">
        Experimente: no regime de âncora, suba a fuga de capitais até a paridade romper; troque para o tripé com o mesmo choque e depois desligue o superávit primário. Modelo de brinquedo, parâmetros ilustrativos.
      </p>
    </div>
  );
}
