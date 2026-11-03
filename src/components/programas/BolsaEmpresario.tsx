"use client";

import { useState } from "react";
import { Bars } from "@/components/viz/Chart";
import { Button, Callout, Controls, Panel, Slider, Stat } from "@/components/ui";
import { num, pct } from "./fmt";

type Linha = { id: string; label: string; v: number; color: string; quem: string; credito?: boolean };

/** Valores aproximados, R$ bi/ano (~2025), inspirados no DGT/Receita Federal e relatórios do Tesouro. */
const LINHAS: Linha[] = [
  { id: "simples", label: "Simples Nacional", v: 125, color: "#60a5fa", quem: "pequenas empresas" },
  { id: "agro", label: "Agricultura e agroindústria", v: 75, color: "#34d399", quem: "agro e cesta básica" },
  { id: "irpf", label: "IRPF: deduções e isenções", v: 75, color: "#fbbf24", quem: "pessoas físicas" },
  { id: "entidades", label: "Entidades sem fins lucrativos", v: 45, color: "#a3e635", quem: "filantrópicas, igrejas, etc." },
  { id: "zfm", label: "Zona Franca de Manaus", v: 40, color: "#f472b6", quem: "indústria regional" },
  { id: "saude", label: "Saúde e medicamentos", v: 30, color: "#22d3ee", quem: "setor de saúde" },
  { id: "regional", label: "Sudene/Sudam e informática", v: 25, color: "#fb923c", quem: "regional e setorial" },
  { id: "folha", label: "Desoneração da folha", v: 18, color: "#f87171", quem: "17 setores + municípios" },
  { id: "perse", label: "Perse", v: 15, color: "#e879f9", quem: "eventos e turismo" },
  { id: "mover", label: "Rota 2030 / Mover", v: 3, color: "#94a3b8", quem: "montadoras" },
  { id: "rouanet", label: "Lei Rouanet", v: 2, color: "#c4b5fd", quem: "cultura" },
  { id: "outros", label: "Outros gastos tributários", v: 90, color: "#5a6275", quem: "dezenas de regimes" },
  { id: "credito", label: "Subsídios financeiros e creditícios", v: 80, color: "#8a93a8", quem: "Plano Safra, fundos, Fies, BNDES", credito: true },
];

const BF = 168;
const PIB = 12700;
const GAP_PRIMARIO = 0.024 * PIB; // de ~−0,4% para ~+2,0% do PIB, aprox.

export function BolsaEmpresario() {
  const [corte, setCorte] = useState<Record<string, number>>(() => Object.fromEntries(LINHAS.map((l) => [l.id, 0])));
  const [conv, setConv] = useState(0.6);

  const all = (p: number) => setCorte(Object.fromEntries(LINHAS.map((l) => [l.id, p])));
  const total = LINHAS.reduce((a, l) => a + l.v, 0);
  const tributarios = LINHAS.filter((l) => !l.credito).reduce((a, l) => a + l.v, 0);
  const bruto = LINHAS.reduce((a, l) => a + l.v * (corte[l.id] ?? 0), 0);
  const efetivo = bruto * conv;

  const W = 640;
  let acc = 0;
  const r2 = (v: number) => Math.round(v * 100) / 100;

  return (
    <div className="space-y-3">
      <Controls>
        <span className="text-muted">Cortar todas as linhas em</span>
        {[0, 10, 25, 50].map((p) => (
          <Button key={p} onClick={() => all(p / 100)}>
            {p}%
          </Button>
        ))}
        <Slider className="min-w-60 flex-1" label="Quanto do corte vira receita" value={conv * 100} min={20} max={100} step={5} onChange={(v) => setConv(v / 100)} format={(v) => pct(v, 0)} />
      </Controls>
      <Panel title={`Gastos tributários federais ≈ R$ ${num(tributarios, 0)} bi/ano (~${num((tributarios / PIB) * 100, 1)}% do PIB) + subsídios creditícios`}>
        <svg viewBox={`0 0 ${W} 54`} className="w-full">
          {LINHAS.map((l) => {
            const x = r2((acc / total) * W);
            const w = r2((l.v / total) * W);
            acc += l.v;
            const cut = corte[l.id] ?? 0;
            return (
              <g key={l.id}>
                <rect x={x} y={6} width={Math.max(0, w - 1)} height={34} fill={l.color} opacity={0.25} />
                <rect x={x} y={6} width={Math.max(0, r2(w * (1 - cut)) - 1)} height={34} fill={l.color} opacity={0.9} style={{ transition: "width 250ms" }}>
                  <title>{`${l.label}: R$ ${l.v} bi`}</title>
                </rect>
                {w > 44 && (
                  <text x={x + 4} y={27} fontSize={10} fill="#0a0c11">
                    {l.label.split(" ")[0]}
                  </text>
                )}
              </g>
            );
          })}
          <line x1={r2((tributarios / total) * W)} x2={r2((tributarios / total) * W)} y1={2} y2={52} stroke="#e7e9f0" strokeDasharray="3 3" />
        </svg>
        <p className="text-[11px] text-faint">largura ∝ custo anual · parte apagada = cortada · à direita da linha tracejada: subsídios fora dos gastos tributários</p>
        <div className="mt-4 grid gap-x-6 gap-y-2 md:grid-cols-2">
          {LINHAS.map((l) => (
            <div key={l.id} className="min-w-0">
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className="inline-flex min-w-0 items-center gap-1.5 truncate text-ink">
                  <span className="size-2.5 shrink-0 rounded-sm" style={{ background: l.color }} />
                  {l.label}
                </span>
                <span className="shrink-0 font-mono text-faint">R$ {l.v} bi</span>
              </div>
              <Slider
                label={<span className="block w-28 truncate text-[11px] text-faint">{l.quem}</span>}
                value={(corte[l.id] ?? 0) * 100}
                min={0}
                max={100}
                step={5}
                onChange={(v) => setCorte((c) => ({ ...c, [l.id]: v / 100 }))}
                format={(v) => `−${num(v, 0)}%`}
              />
            </div>
          ))}
        </div>
      </Panel>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Panel title="O que o corte compra (R$ bi/ano)">
          <Bars
            max={Math.max(GAP_PRIMARIO, BF, efetivo) * 1.05}
            format={(v) => num(v, 0)}
            rows={[
              { label: "Receita efetiva do corte", value: efetivo, color: "#4ade80", note: `bruto ${num(bruto, 0)}` },
              { label: "Bolsa Família inteiro", value: BF, color: "#c084fc" },
              { label: "Ajuste p/ estabilizar a dívida", value: GAP_PRIMARIO, color: "#f87171", note: "~2,4% do PIB" },
            ]}
          />
          <p className="mt-3 text-[11px] text-faint">
            Ajuste estimado para levar o primário de ~−0,4% a ~+2% do PIB, nível que estabiliza a dívida com juros reais altos
            (veja <a className="text-accent underline" href="/divida">/divida</a>). Valores aproximados.
          </p>
        </Panel>
        <div className="grid content-start gap-2">
          <Stat label="Corte bruto" value={`R$ ${num(bruto, 0)} bi`} />
          <Stat label="Receita efetiva" value={`R$ ${num(efetivo, 0)} bi`} tone={efetivo >= GAP_PRIMARIO ? "good" : efetivo > 50 ? "warn" : "neutral"} hint="parte da base some: empresas mudam de regime, fecham ou vão para a informalidade" />
          <Stat label="Em tamanhos de Bolsa Família" value={num(efetivo / BF, 2)} hint="quantos programas do tamanho do BF" />
          <Stat label="Do ajuste necessário" value={pct(Math.min(999, (efetivo / GAP_PRIMARIO) * 100), 0)} tone={efetivo >= GAP_PRIMARIO ? "good" : "warn"} />
        </div>
      </div>
      <Callout tone="accent">
        Um real de isenção custa o mesmo que um real de gasto — mas não aparece do mesmo jeito. Despesas passam todo ano pelo
        Orçamento, disputam espaço no arcabouço e são cortadas quando falta dinheiro. Gastos tributários, em geral, não: muitos
        não têm prazo de validade nem avaliação de resultado, e o custo só aparece como receita que deixou de entrar. A EC
        109/2021 mandou reduzi-los a 2% do PIB; eles continuam perto de 4–5%. Isso não diz que todos são ruins (o Simples, por
        exemplo, reduz custo de conformidade e incentiva formalização) — diz que merecem a mesma avaliação que o Bolsa Família.
      </Callout>
      <p className="font-mono text-[11px] text-faint">receita efetiva = Σ (valorᵢ × corteᵢ) × conversão · gasto tributário = receita renunciada em relação à regra geral</p>
      <p className="text-xs text-faint">
        Experimente: clique em “10%” — um corte linear pequeno já paga uma fração grande do Bolsa Família. Agora tente fechar o
        ajuste necessário só com desoneração da folha, Perse e Rouanet: não dá. Os grandes são Simples, agro, IRPF e “outros”.
      </p>
    </div>
  );
}
