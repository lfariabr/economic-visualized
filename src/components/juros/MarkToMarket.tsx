"use client";

import { useMemo, useState } from "react";
import { Button, Callout, Controls, Panel, Segmented, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { rng } from "@/lib/random";
import { useTicker } from "@/lib/useTicker";
import { durationMod, precoZero } from "./jurosModel";
import { br, brl, pct, pp } from "./fmtBR";

type Tipo = "pre" | "ipca";
const IPCA = 4.8;

export function MarkToMarket() {
  const [tipo, setTipo] = useState<Tipo>("pre");
  const [T, setT] = useState(6);
  const [seed, setSeed] = useState(7);
  const [choques, setChoques] = useState<{ m: number; d: number }[]>([]);
  const [mes, setMes] = useState(0);
  const y0 = tipo === "pre" ? 13.5 : 7.5;
  const N = T * 12;
  const t = useTicker(
    () =>
      setMes((m) => {
        if (m >= N) {
          t.pause();
          return N;
        }
        return m + 1;
      }),
    { speed: 0.15 },
  );

  // deterministic noisy path of market yields, plus user shocks
  const taxas = useMemo(() => {
    const r = rng(seed);
    const out: number[] = [];
    let y = y0;
    for (let m = 0; m <= N; m++) {
      if (m > 0) y += r.normal(0, 0.12) + (y0 - y) * 0.02;
      const s = choques.filter((c) => c.m <= m).reduce((a, c) => a + c.d, 0);
      out.push(Math.max(1, y + s));
    }
    return out;
  }, [seed, y0, N, choques]);

  const vna = (m: number) => (tipo === "ipca" ? (1 + IPCA / 100) ** (m / 12) : 1);
  const mercado = taxas.map((y, m) => [m, vna(m) * precoZero(y, T - m / 12)] as [number, number]);
  const curva = taxas.map((_, m) => [m, vna(m) * precoZero(y0, T - m / 12)] as [number, number]);
  const pCompra = vna(0) * precoZero(y0, T);
  const yNow = taxas[mes];
  const pNow = mercado[mes][1];
  const ganho = pNow / pCompra - 1;
  const dmod = durationMod(yNow, T - mes / 12);
  const choque = (d: number) => setChoques((cs) => [...cs, { m: mes, d }]);

  // price-yield curve at current remaining maturity
  const rest = T - mes / 12;
  const pyPts = Array.from({ length: 61 }, (_, i) => {
    const y = (tipo === "pre" ? 6 : 2) + i * 0.25;
    return [y, precoZero(y, rest)] as [number, number];
  });
  const pAtTaxa = precoZero(yNow, rest);
  const tangente = [-3, 3].map((dy) => [yNow + dy, pAtTaxa * (1 - dmod * (dy / 100))] as [number, number]);

  return (
    <div className="space-y-3">
      <Controls>
        <Segmented
          value={tipo}
          onChange={(v) => {
            setTipo(v);
            setChoques([]);
            setMes(0);
            t.pause();
          }}
          options={[
            { value: "pre", label: "Tesouro Prefixado (LTN) 13,5%" },
            { value: "ipca", label: "Tesouro IPCA+ 7,5% (principal)" },
          ]}
        />
        <Slider
          label="Vencimento"
          value={T}
          min={1}
          max={20}
          step={1}
          onChange={(v) => {
            setT(v);
            setMes(0);
            setChoques([]);
            t.pause();
          }}
          format={(v) => `${v} anos`}
          className="w-full sm:w-60"
        />
        <Button variant="primary" onClick={() => {
            if (mes >= N) setMes(0);
            t.toggle();
          }}
        >
          {t.running ? "❚❚ pausar" : "▶ passar os meses"}
        </Button>
        <Button onClick={() => choque(3)} className="text-bad">
          choque fiscal: +3 p.p.
        </Button>
        <Button onClick={() => choque(-2)} className="text-ok">
          Copom corta: −2 p.p.
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            t.pause();
            setMes(0);
            setChoques([]);
            setSeed((s) => s + 1);
          }}
        >
          nova trajetória
        </Button>
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="grid min-w-0 gap-4">
          <Panel title={`Preço unitário ao longo do tempo · mês ${mes} de ${N}`}>
            <LineChart
              series={[
                { id: "mk", label: "preço de mercado (marcação a mercado)", color: tipo === "pre" ? "#f472b6" : "#a78bfa", points: mercado.slice(0, mes + 1), width: 2.4 },
                { id: "cv", label: "curva do papel (taxa contratada)", color: "#8a93a8", points: curva, dashed: true },
              ]}
              xDomain={[0, N]}
              yDomain={[Math.min(...mercado.map((p) => p[1]), pCompra) * 0.85, Math.max(...curva.map((p) => p[1]), ...mercado.map((p) => p[1])) * 1.04]}
              xLabel="mês"
              xFormat={(v) => br(v, 0)}
              yFormat={(v) => `R$ ${br(v, 0)}`}
              markers={choques.map((c) => ({ x: c.m, label: `${c.d > 0 ? "+" : ""}${c.d} p.p.`, color: c.d > 0 ? "#f87171" : "#34d399" }))}
              hMarkers={[{ y: pCompra, label: "preço de compra", color: "#5a6275" }]}
              dots={[{ x: mes, y: pNow, color: ganho < 0 ? "#f87171" : "#34d399" }]}
            />
          </Panel>
          <Panel title="Preço × taxa (no prazo restante) · duration é a inclinação">
            <LineChart
              height={200}
              series={[
                { id: "py", label: "P(y) = 1000/(1+y)^T", color: "#22d3ee", points: pyPts, width: 2.2 },
                { id: "tg", label: "aproximação pela duration", color: "#fbbf24", points: tangente, dashed: true },
              ]}
              xLabel="taxa (% a.a.)"
              xFormat={(v) => `${br(v, 0)}%`}
              yFormat={(v) => `R$ ${br(v, 0)}`}
              dots={[{ x: yNow, y: pAtTaxa, color: "#e7e9f0", label: pct(yNow, 2) }]}
            />
          </Panel>
        </div>
        <div className="grid content-start gap-3">
          <Stat label="Taxa de mercado agora" value={pct(yNow, 2)} hint={`${pp(yNow - y0, 2)} vs taxa contratada`} tone={yNow > y0 + 0.5 ? "bad" : yNow < y0 - 0.5 ? "good" : "neutral"} />
          <Stat label="Se vender hoje" value={brl(pNow, 2)} tone={ganho < 0 ? "bad" : "good"} hint={`${ganho >= 0 ? "+" : ""}${pct(ganho * 100, 1)} desde a compra (${brl(pCompra, 2)})`} />
          <Stat label="Duration modificada" value={`${br(dmod, 2)} anos`} hint={`+1 p.p. na taxa ≈ ${pct(-dmod, 1)} no preço`} />
          <Stat
            label="Se levar ao vencimento"
            value={tipo === "pre" ? `${pct(y0, 1)} a.a.` : `IPCA + ${pct(y0, 1)}`}
            tone="good"
            hint={tipo === "pre" ? "recebe R$ 1.000 no fim, aconteça o que acontecer" : "recebe o VNA corrigido pelo IPCA"}
          />
        </div>
      </div>
      {ganho < -0.03 && (
        <Callout tone="bad">
          Os juros de mercado subiram depois da compra: o título &quot;vale menos&quot; hoje porque novos títulos pagam mais. A perda só se realiza se você vender antes do vencimento — quem leva até o fim recebe a taxa contratada.
        </Callout>
      )}
      <p className="font-mono text-xs text-faint">
        P = VNA·1000 / (1 + y)^(T − t) · ΔP/P ≈ −D_mod·Δy · D_mod = T/(1 + y) (título sem cupom)
      </p>
      <p className="text-xs text-faint">
        Experimente: com vencimento de 10 anos, aperte &quot;choque fiscal&quot; no início — o preço cai ~{br(durationMod(y0, 10) * 3, 0)}%. Depois aperte play e veja o preço convergir para a curva do papel até o vencimento.
      </p>
    </div>
  );
}
