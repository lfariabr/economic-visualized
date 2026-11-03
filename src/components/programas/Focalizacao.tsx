"use client";

import { useMemo, useState } from "react";
import { Controls, Panel, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { range } from "@/lib/random";
import { avaliar, classificar, makeDomicilios, type Status } from "./focoModel";
import { num, pct } from "./fmt";

const COLS = 25;
const ROWS = 16;
const N = COLS * ROWS;

const COLOR: Record<Status, string> = { acerto: "#34d399", inclusao: "#fbbf24", exclusao: "#f87171", fora: "#242a38" };
const LABEL: Record<Status, string> = {
  acerto: "pobre e recebe",
  inclusao: "erro de inclusão (não pobre recebe)",
  exclusao: "erro de exclusão (pobre fica de fora)",
  fora: "não pobre, fora",
};

export function Focalizacao() {
  const doms = useMemo(() => makeDomicilios(N, 11).sort((a, b) => a.renda - b.renda), []);
  const [fisc, setFisc] = useState(0.35);
  const [busca, setBusca] = useState(0.4);

  const ev = avaliar(doms, fisc, busca);
  const curves = useMemo(() => {
    const pts = range(51).map((i) => ({ f: i / 50, ...avaliar(doms, i / 50, busca) }));
    const totalPts = pts.map((p) => [p.f * 100, p.custoAdm + p.vazamento + p.custoExclusao] as [number, number]);
    const best = totalPts.reduce((a, b) => (b[1] < a[1] ? b : a));
    return {
      err: [
        { id: "inc", label: "Erro de inclusão", color: "#fbbf24", points: pts.map((p) => [p.f * 100, p.erroInclusao * 100] as [number, number]) },
        { id: "exc", label: "Erro de exclusão", color: "#f87171", points: pts.map((p) => [p.f * 100, p.erroExclusao * 100] as [number, number]) },
      ],
      cost: [
        { id: "adm", label: "Custo administrativo", color: "#60a5fa", points: pts.map((p) => [p.f * 100, p.custoAdm] as [number, number]) },
        { id: "vaz", label: "Vazamento p/ não pobres", color: "#fbbf24", points: pts.map((p) => [p.f * 100, p.vazamento] as [number, number]) },
        { id: "exc", label: "Benefício que não chega a pobres", color: "#f87171", points: pts.map((p) => [p.f * 100, p.custoExclusao] as [number, number]) },
        { id: "tot", label: "Soma", color: "#e7e9f0", width: 2.5, points: totalPts },
      ],
      best,
    };
  }, [doms, busca]);

  const cellW = 20;
  return (
    <div className="space-y-3">
      <Controls>
        <Slider className="min-w-60 flex-1" label="Fiscalização / cruzamento de dados" value={fisc * 100} min={0} max={100} onChange={(v) => setFisc(v / 100)} format={(v) => pct(v, 0)} />
        <Slider className="min-w-60 flex-1" label="Busca ativa" value={busca * 100} min={0} max={100} onChange={(v) => setBusca(v / 100)} format={(v) => pct(v, 0)} />
      </Controls>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={`${N} domicílios, ordenados da menor para a maior renda real`}>
          <svg viewBox={`0 0 ${COLS * cellW} ${ROWS * cellW}`} className="w-full">
            {doms.map((d, i) => {
              const s = classificar(d, fisc, busca);
              return (
                <rect
                  key={i}
                  x={(i % COLS) * cellW + 2}
                  y={Math.floor(i / COLS) * cellW + 2}
                  width={cellW - 4}
                  height={cellW - 4}
                  rx={4}
                  fill={COLOR[s]}
                  opacity={s === "fora" ? 1 : 0.9}
                  style={{ transition: "fill 250ms" }}
                />
              );
            })}
          </svg>
          <div className="mt-3 grid gap-1 text-xs text-muted sm:grid-cols-2">
            {(Object.keys(COLOR) as Status[]).map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm" style={{ background: COLOR[s] === "#242a38" ? "#5a6275" : COLOR[s] }} />
                {LABEL[s]} · {ev.c[s]}
              </span>
            ))}
          </div>
        </Panel>
        <div className="grid min-w-0 gap-4">
          <Panel title="Erros × fiscalização">
            <LineChart
              height={170}
              xDomain={[0, 100]}
              yDomain={[0, 60]}
              xLabel="fiscalização (%)"
              xFormat={(v) => `${v}%`}
              yFormat={(v) => `${v}%`}
              series={curves.err}
              markers={[{ x: fisc * 100 }]}
            />
          </Panel>
          <Panel title="Custo dos erros × custo de evitá-los (R$ bi/ano)">
            <LineChart
              height={170}
              xDomain={[0, 100]}
              xLabel="fiscalização (%)"
              xFormat={(v) => `${v}%`}
              yFormat={(v) => num(v, 0)}
              series={curves.cost}
              markers={[{ x: fisc * 100 }]}
              dots={[{ x: curves.best[0], y: curves.best[1], color: "#34d399", label: "mínimo" }]}
            />
          </Panel>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Stat label="Erro de inclusão" value={pct(ev.erroInclusao * 100, 0)} tone={ev.erroInclusao > 0.3 ? "bad" : ev.erroInclusao > 0.15 ? "warn" : "good"} hint="dos beneficiários" />
        <Stat label="Erro de exclusão" value={pct(ev.erroExclusao * 100, 0)} tone={ev.erroExclusao > 0.3 ? "bad" : ev.erroExclusao > 0.15 ? "warn" : "good"} hint="dos pobres" />
        <Stat label="Vazamento" value={`R$ ${num(ev.vazamento, 0)} bi`} tone={ev.vazamento > 40 ? "bad" : "neutral"} hint="pago a não pobres" />
        <Stat label="Custo administrativo" value={`R$ ${num(ev.custoAdm, 1)} bi`} tone={ev.custoAdm > 8 ? "warn" : "neutral"} />
        <Stat label="Beneficiários (escala BR)" value={`${num((ev.benef / N) * 77, 1)} mi`} hint="domicílios" />
      </div>
      <p className="font-mono text-[11px] text-faint">
        declarada = renda·(1 − sub) se não checada · seleciona se cadastrado ∧ não desistiu ∧ declarada ≤ 218 · custo adm ∝ fisc² · ótimo = mín(adm + vazamento + exclusão)
      </p>
      <p className="text-xs text-faint">
        Experimente: zere a fiscalização — os quadrados amarelos se espalham para a direita (famílias que subdeclaram renda). Suba
        para 100%: o amarelo some, mas aparecem vermelhos à esquerda (pobres que desistem da burocracia) e o custo dispara. Depois
        mexa na busca ativa e veja o vermelho de “quem nunca se cadastrou” diminuir.
      </p>
    </div>
  );
}
