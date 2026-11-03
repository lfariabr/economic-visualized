"use client";

import { useMemo, useRef, useState } from "react";
import { Button, Callout, Controls, Panel, Segmented, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { useTicker } from "@/lib/useTicker";
import { ATTACK_MONTHS, attack, type AttackParams } from "./fxModel";
import { nf, spct } from "./fmtBR";

type Regime = AttackParams["regime"];
type Tool = AttackParams["tool"];

const PRESETS = {
  "1999": { regime: "fixo" as Regime, tool: "nenhuma" as Tool, R0: 45, peg: 1.21, deficit: 1 },
  hoje: { regime: "flutuante" as Regime, tool: "swaps" as Tool, R0: 340, peg: 5.4, deficit: 2 },
};

export function SpeculativeAttack() {
  const [regime, setRegime] = useState<Regime>("fixo");
  const [tool, setTool] = useState<Tool>("nenhuma");
  const [absorb, setAbsorb] = useState(0.5);
  const [R0, setR0] = useState(45);
  const [peg, setPeg] = useState(1.21);
  const [deficit, setDeficit] = useState(1);
  const [shockSize, setShockSize] = useState(10);
  const [shocks, setShocks] = useState<number[]>([]);
  const t = useRef(0);
  const ticker = useTicker(
    () => {
      if (t.current >= ATTACK_MONTHS) return ticker.pause();
      t.current += 1;
    },
    { speed: 1 / 14 },
  );
  const now = t.current;
  const rows = useMemo(() => attack({ regime, tool, absorb, R0, peg, deficit, shocks, shockSize }), [regime, tool, absorb, R0, peg, deficit, shocks, shockSize]);
  const shown = rows.slice(0, now + 1);
  const cur = shown[shown.length - 1];
  const breakMonth = rows.find((r) => r.broke)?.t;
  const brokeNow = breakMonth !== undefined && breakMonth <= now;
  const dE = (cur.E / peg - 1) * 100;
  const maxE = Math.max(...rows.map((r) => r.E), ...rows.map((r) => r.shadow));

  const load = (k: keyof typeof PRESETS) => {
    const p = PRESETS[k];
    setRegime(p.regime);
    setTool(p.tool);
    setR0(p.R0);
    setPeg(p.peg);
    setDeficit(p.deficit);
    setShockSize(k === "1999" ? 10 : 20);
    setShocks([]);
    t.current = 0;
    ticker.pause();
    ticker.refresh();
  };

  return (
    <div className="space-y-3">
      <Controls>
        <Button onClick={() => load("1999")}>Cenário 1998–99</Button>
        <Button onClick={() => load("hoje")}>Cenário hoje (US$ 340 bi)</Button>
        <Button variant="primary" onClick={() => (now >= ATTACK_MONTHS ? ((t.current = 0), ticker.play()) : ticker.toggle())}>
          {ticker.running ? "Pausar" : "Rodar meses"}
        </Button>
        <Button onClick={() => (now < ATTACK_MONTHS ? ticker.tick() : undefined)}>+1 mês</Button>
        <Button onClick={() => setShocks((s) => (s.includes(now) ? s : [...s, now]))}>Ataque especulativo agora</Button>
        <Button variant="ghost" onClick={() => ((t.current = 0), setShocks([]), ticker.pause(), ticker.refresh())}>
          Reiniciar
        </Button>
      </Controls>
      <Controls>
        <Segmented value={regime} options={[{ value: "fixo", label: "Câmbio fixo (âncora)" }, { value: "flutuante", label: "Câmbio flutuante" }]} onChange={(v) => setRegime(v)} />
        {regime === "flutuante" && (
          <Segmented
            value={tool}
            options={[
              { value: "nenhuma", label: "BC parado" },
              { value: "swaps", label: "Swaps cambiais" },
              { value: "spot", label: "Leilões à vista" },
            ]}
            onChange={(v) => setTool(v)}
          />
        )}
        {regime === "flutuante" && tool !== "nenhuma" && (
          <Slider label="Pressão absorvida pelo BC" value={absorb} min={0.1} max={0.9} step={0.05} onChange={setAbsorb} format={(v) => `${nf(v * 100, 0)}%`} className="w-full sm:w-64" />
        )}
        <Slider label="Reservas iniciais" value={R0} min={20} max={400} step={5} onChange={setR0} format={(v) => `US$ ${v} bi`} className="w-full sm:w-64" />
        <Slider label="Câmbio de partida" value={peg} min={1} max={7} step={0.01} onChange={setPeg} format={(v) => `R$ ${nf(v, 2)}`} className="w-full sm:w-64" />
        <Slider label="Déficit externo" value={deficit} min={0} max={6} step={0.5} onChange={setDeficit} format={(v) => `US$ ${nf(v, 1)} bi/mês`} className="w-full sm:w-64" />
        <Slider label="Tamanho do ataque" value={shockSize} min={2} max={40} step={1} onChange={setShockSize} format={(v) => `US$ ${v} bi`} className="w-full sm:w-64" />
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-4">
          <Panel title={`Reservas internacionais (US$ bi) · mês ${now}`}>
            <LineChart
              series={[
                { id: "r", label: "reservas", color: "#2dd4bf", area: true, points: shown.map((r) => [r.t, r.R]), width: 2.5 },
                ...(tool === "swaps" && regime === "flutuante" ? [{ id: "sw", label: "estoque de swaps", color: "#a78bfa", dashed: true, points: shown.map((r) => [r.t, r.swaps] as [number, number]) }] : []),
              ]}
              xDomain={[0, ATTACK_MONTHS]}
              yDomain={[0, R0 * 1.1]}
              height={190}
              xLabel="mês"
              hMarkers={regime === "fixo" ? [{ y: Math.max(5, R0 * 0.15), label: "mínimo para defender", color: "#f87171" }] : []}
              markers={[...shocks.map((s) => ({ x: s, label: "ataque", color: "#fbbf24" })), ...(brokeNow && breakMonth !== undefined ? [{ x: breakMonth, label: "âncora quebra", color: "#f87171" }] : [])]}
              xFormat={(v) => String(Math.round(v))}
              yFormat={(v) => nf(v, 0)}
            />
          </Panel>
          <Panel title="Câmbio (R$/US$)">
            <LineChart
              series={[
                { id: "e", label: "câmbio oficial/mercado", color: "#e7e9f0", points: shown.map((r) => [r.t, r.E]), width: 2.5 },
                ...(regime === "fixo" ? [{ id: "s", label: "câmbio-sombra (sem defesa)", color: "#f87171", dashed: true, points: shown.map((r) => [r.t, r.shadow] as [number, number]) }] : []),
              ]}
              xDomain={[0, ATTACK_MONTHS]}
              yDomain={[peg * 0.8, Math.max(peg * 1.5, maxE * 1.1)]}
              height={190}
              xLabel="mês"
              xFormat={(v) => String(Math.round(v))}
              yFormat={(v) => nf(v, 2)}
            />
          </Panel>
        </div>
        <div className="grid grid-cols-2 content-start gap-3 lg:grid-cols-1">
          <Stat label="Reservas" value={`US$ ${nf(cur.R, 0)} bi`} tone={cur.R < R0 * 0.3 ? "bad" : cur.R < R0 * 0.6 ? "warn" : "good"} hint={`partida: US$ ${R0} bi`} />
          <Stat label="Dólar" value={`R$ ${nf(cur.E, 2)}`} tone={dE > 30 ? "bad" : dE > 10 ? "warn" : "neutral"} hint={spct(dE) + " vs. partida"} />
          <Stat label="Pressão no mês" value={`US$ ${nf(cur.pressure, 1)} bi`} tone={cur.pressure > 5 ? "bad" : "neutral"} />
          <Stat label="Regime" value={brokeNow ? "quebrou" : regime === "fixo" ? "âncora mantida" : "flutuando"} tone={brokeNow ? "bad" : "neutral"} hint={brokeNow ? `no mês ${breakMonth}` : undefined} />
        </div>
      </div>
      {brokeNow && (
        <Callout tone="bad">
          Com câmbio fixo, cada dólar que sai é pago com reservas — e quanto menos reservas, maior o incentivo para sair antes (aposta de mão única). Quando o
          estoque chega ao mínimo, o BC desiste: o câmbio salta de uma vez para o câmbio-sombra, e ainda passa do ponto. Foi o que aconteceu em janeiro de
          1999, quando o real saiu de R$ 1,21 para mais de R$ 2.
        </Callout>
      )}
      {regime === "flutuante" && shocks.length > 0 && (
        <Callout tone="ok">
          No câmbio flutuante o ataque vira desvalorização, não colapso: o dólar mais caro atrai comprador de real e freia a saída. Swaps cambiais oferecem
          proteção (hedge) sem gastar reservas — o custo é fiscal, liquidado em reais, se o dólar continuar subindo.
        </Callout>
      )}
      <p className="font-mono text-[11px] text-faint">
        fixo: reservas −= déficit + ataque + 10·máx(0; 0,75 − R/R₀) · câmbio-sombra = âncora·e^(k·Σpressão) · flutuante: Δln E = k·(pressão − absorção BC),
        pressão = ataque − 13,5·ln(E/E_ref)
      </p>
      <p className="text-xs text-faint">
        Experimente: no cenário 1998–99, rode e dispare um ataque no mês 3 — veja as reservas sangrarem até a âncora quebrar. Depois carregue “Cenário
        hoje”, dispare um ataque de US$ 20 bi e compare “BC parado”, “Swaps cambiais” e “Leilões à vista”. Modelo educativo, não previsão.
      </p>
    </div>
  );
}
