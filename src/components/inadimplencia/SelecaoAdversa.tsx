"use client";

import { useMemo, useState } from "react";
import { Button, Callout, Controls, Panel, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { rng } from "@/lib/random";
import { TOMADOR_COR, TOMADOR_LABEL, carteira, criarTomadores, pPagar, type TipoTomador } from "./creditoModel";
import { br, pct } from "./fmt";

const COLS = 20;
const ROWS = 10;
const RHO = 0.25;

export function SelecaoAdversa() {
  const [r, setR] = useState(30);
  const [custo, setCusto] = useState(20);
  const [fundos, setFundos] = useState(100);
  const [safra, setSafra] = useState(0);
  const ts = useMemo(() => criarTomadores(COLS * ROWS), []);

  const grid = useMemo(() => Array.from({ length: 141 }, (_, i) => 10 + i), []);
  const curvas = useMemo(() => grid.map((x) => ({ x, c: carteira(ts, x, RHO, custo) })), [grid, ts, custo]);
  const otimo = curvas.reduce((b, k) => (k.c.lucro > b.c.lucro ? k : b), curvas[0]);
  const c = carteira(ts, r, RHO, custo);
  const recusados = Math.max(0, c.candidatos - fundos);
  const recusadosOtimo = Math.max(0, otimo.c.candidatos - fundos);

  // safra: quem pede, quem é atendido (até os fundos), quem dá calote
  const res = useMemo(() => {
    const g = rng(1000 + safra * 17 + r);
    const pede = ts.map((t) => t.rmax >= r);
    const idx = ts.map((_, i) => i).filter((i) => pede[i]);
    // racionamento: o banco sorteia quem atende quando falta dinheiro
    for (let k = idx.length - 1; k > 0; k--) {
      const j = Math.floor(g.next() * (k + 1));
      [idx[k], idx[j]] = [idx[j], idx[k]];
    }
    const atendido = new Array<boolean>(ts.length).fill(false);
    idx.slice(0, fundos).forEach((i) => (atendido[i] = true));
    const calote = ts.map((t, i) => atendido[i] && g.next() > pPagar(t, r));
    const n = atendido.filter(Boolean).length;
    const nc = calote.filter(Boolean).length;
    const ganho = n ? ((n - nc) * (1 + r / 100) + nc * RHO) / n - 1 - custo / 100 : 0;
    return { pede, atendido, calote, n, nc, lucro: ganho * 100 };
  }, [ts, r, fundos, safra, custo]);

  const tipos: TipoTomador[] = ["bom", "medio", "ruim"];
  const cell = 400 / COLS;
  const bonsSairam = c.porTipo.bom < ts.filter((t) => t.tipo === "bom").length * 0.5;

  return (
    <div className="space-y-3">
      <Controls>
        <Slider label="Sua taxa de juros" value={r} min={10} max={150} step={1} onChange={setR} format={(v) => `${br(v, 0)}% a.a.`} className="w-full sm:w-80" />
        <Slider label="Custo de captação + operação" value={custo} min={5} max={35} step={1} onChange={setCusto} format={(v) => `${br(v, 0)}% a.a.`} className="w-full sm:w-80" />
        <Slider label="Dinheiro para emprestar" value={fundos} min={30} max={200} step={5} onChange={setFundos} format={(v) => `${v} contratos`} className="w-full sm:w-80" />
        <Button variant="primary" onClick={() => setSafra((s) => s + 1)}>
          ▶ rodar safra
        </Button>
        <Button onClick={() => setR(otimo.x)}>ir para a taxa ótima</Button>
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="grid min-w-0 gap-4 xl:grid-cols-2">
          <Panel title={`200 candidatos · safra ${safra + 1}`}>
            <svg viewBox={`0 0 400 ${ROWS * cell}`} className="w-full select-none" role="img" aria-label="Candidatos a crédito">
              {ts.map((t, i) => {
                const cx = Math.round(((i % COLS) + 0.5) * cell * 100) / 100;
                const cy = Math.round((Math.floor(i / COLS) + 0.5) * cell * 100) / 100;
                const fora = !res.pede[i];
                return (
                  <g key={i}>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={6.5}
                      fill={fora ? "none" : TOMADOR_COR[t.tipo]}
                      stroke={fora ? TOMADOR_COR[t.tipo] : res.atendido[i] ? "none" : "#e7e9f0"}
                      strokeWidth={fora ? 1 : 1.4}
                      strokeDasharray={!fora && !res.atendido[i] ? "2 2" : undefined}
                      opacity={fora ? 0.35 : res.atendido[i] ? 0.95 : 0.4}
                    />
                    {res.calote[i] && (
                      <path d={`M${cx - 4},${cy - 4}L${cx + 4},${cy + 4}M${cx + 4},${cy - 4}L${cx - 4},${cy + 4}`} stroke="#0a0c11" strokeWidth={2.2} />
                    )}
                  </g>
                );
              })}
            </svg>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
              {tipos.map((k) => (
                <span key={k} className="inline-flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: TOMADOR_COR[k] }} />
                  {TOMADOR_LABEL[k]}: {c.porTipo[k]}
                </span>
              ))}
              <span>vazio = desistiu · tracejado = recusado (sem dinheiro) · ✕ = calote</span>
            </div>
          </Panel>
          <Panel title="Lucro esperado do banco × taxa">
            <LineChart
              height={300}
              width={440}
              series={[
                { id: "luc", label: "lucro esperado (p.p. sobre o custo)", color: "#f472b6", points: curvas.map((k) => [k.x, k.c.lucro]), width: 2.6 },
                { id: "pd", label: "calote esperado (%)", color: "#f87171", points: curvas.map((k) => [k.x, k.c.pd]), dashed: true },
                { id: "dem", label: "candidatos (÷ 4)", color: "#60a5fa", points: curvas.map((k) => [k.x, k.c.candidatos / 4]) },
              ]}
              xDomain={[10, 150]}
              yDomain={[-30, 75]}
              xLabel="taxa (% a.a.)"
              xFormat={(v) => br(v, 0)}
              yFormat={(v) => br(v, 0)}
              hMarkers={[
                { y: 0, color: "#5a6275" },
                { y: fundos / 4, label: "fundos ÷ 4", color: "#60a5fa" },
              ]}
              markers={[{ x: otimo.x, label: `ótimo ${br(otimo.x, 0)}%`, color: "#34d399" }]}
              dots={[{ x: r, y: c.lucro, color: "#f472b6" }]}
            />
          </Panel>
        </div>
        <div className="grid content-start gap-3">
          <Stat label="Candidatos" value={`${c.candidatos}`} hint={`bons: ${c.porTipo.bom} · médios: ${c.porTipo.medio} · arriscados: ${c.porTipo.ruim}`} />
          <Stat label="Calote esperado" value={pct(c.pd, 1)} tone={c.pd > 30 ? "bad" : c.pd > 18 ? "warn" : "good"} />
          <Stat label="Lucro esperado" value={`${br(c.lucro, 1)} p.p.`} tone={c.lucro < 0 ? "bad" : c.lucro >= otimo.c.lucro - 0.5 ? "good" : "warn"} hint={`máximo: ${br(otimo.c.lucro, 1)} p.p. a ${br(otimo.x, 0)}% a.a.`} />
          <Stat
            label="Safra realizada"
            value={`${res.nc} calotes em ${res.n}`}
            tone={res.lucro < 0 ? "bad" : "neutral"}
            hint={`lucro realizado: ${br(res.lucro, 1)} p.p.`}
          />
          <Stat
            label="Racionamento na taxa ótima"
            value={recusadosOtimo > 0 ? `${recusadosOtimo} recusados` : "não há"}
            tone={recusadosOtimo > 0 ? "warn" : "neutral"}
            hint={recusados > 0 ? `na sua taxa: ${recusados} sem crédito` : "demanda cabe nos fundos"}
          />
        </div>
      </div>
      {r > otimo.x + 5 && (
        <Callout tone="bad">
          Acima de ~{br(otimo.x, 0)}% a.a. subir o juro <strong>reduz</strong> o lucro: os bons pagadores {bonsSairam ? "já foram embora" : "vão embora"}{" "}
          (têm consignado, FGTS ou simplesmente desistem), sobram os que aceitam qualquer taxa — e a própria parcela alta aumenta o calote. Por isso o
          banco prefere recusar gente (racionar) a cobrar mais.
        </Callout>
      )}
      <p className="font-mono text-xs text-faint">
        pede crédito se r ≤ r̄ᵢ (bons: r̄ ≈ 38%, médios ≈ 75%, arriscados: qualquer) · P(pagar) = p₀ − κ·r · retorno = média[P·(1+r) + (1−P)·ρ] − (1+c), ρ = 25%
      </p>
      <p className="text-xs text-faint">
        Experimente: suba a taxa de 30% para 60% e veja os verdes sumirem; depois clique em “ir para a taxa ótima” com só 60 contratos de dinheiro
        — há fila de recusados e mesmo assim o banco não sobe o juro (Stiglitz–Weiss, 1981). Modelo ilustrativo.
      </p>
    </div>
  );
}
