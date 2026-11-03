"use client";

import { useMemo, useState } from "react";
import { Controls, Panel, Segmented, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import {
  beneficioCheio,
  beneficioPago,
  LIMITE_PROTECAO,
  LINHA_ELEGIBILIDADE,
  pessoas,
  piorTmge,
  rendaMaximaComBeneficio,
  tmge,
  type Desenho,
  type Familia,
} from "./bfModel";
import { brl, num, pct } from "./fmt";

const COLORS: Record<Desenho, string> = { seco: "#f87171", protecao: "#fbbf24", gradual: "#34d399" };
const LABEL: Record<Desenho, string> = {
  seco: "Corte seco em R$ 218",
  protecao: "Com regra de proteção",
  gradual: "Retirada gradual",
};
const BICO = 100; // ganho extra usado para medir a taxa marginal efetiva

export function BolsaFamiliaSim() {
  const [fam, setFam] = useState<Familia>({ adultos: 1, criancas06: 1, criancas717: 2, gestantes: 0, nutrizes: 0 });
  const [renda, setRenda] = useState(600);
  const [desenho, setDesenho] = useState<Desenho>("protecao");
  const [taxa, setTaxa] = useState(0.5);

  const set = (k: keyof Familia) => (v: number) => setFam((f) => ({ ...f, [k]: v }));
  const n = pessoas(fam);
  const xMax = Math.max(2000, Math.ceil((LIMITE_PROTECAO * n * 1.35) / 500) * 500);
  const r = Math.min(renda, xMax);
  const cheio = beneficioCheio(fam);
  const pago = beneficioPago(fam, r, desenho, taxa);
  const total = r + pago;
  const marg = tmge(fam, r, BICO, desenho, taxa);
  const pior = piorTmge(fam, xMax, BICO, desenho, taxa);
  const teto = rendaMaximaComBeneficio(fam, desenho, taxa);

  const { series, bands, tm } = useMemo(() => {
    const xs: number[] = [];
    for (let x = 0; x <= xMax; x += 5) xs.push(x);
    const mk = (d: Desenho) => ({
      id: d,
      label: LABEL[d],
      color: COLORS[d],
      width: d === desenho ? 3 : 1.5,
      dashed: d !== desenho,
      points: xs.map((x) => [x, x + beneficioPago(fam, x, d, taxa)] as [number, number]),
    });
    const s = [
      { id: "sem", label: "Só a renda do trabalho", color: "#5a6275", dashed: true, width: 1.2, points: [[0, 0], [xMax, xMax]] as [number, number][] },
      ...(["seco", "protecao", "gradual"] as Desenho[]).map(mk),
    ];
    // faixas onde ganhar R$ 100 a mais não aumenta (ou reduz) a renda total
    const b: { from: number; to: number; color: string; label?: string }[] = [];
    let start: number | null = null;
    for (const x of xs) {
      const hit = tmge(fam, x, BICO, desenho, taxa) >= 0.999;
      if (hit && start === null) start = x;
      if (!hit && start !== null) {
        b.push({ from: start, to: x, color: "#f87171" });
        start = null;
      }
    }
    const tmPts = xs.map((x) => [x, Math.min(250, tmge(fam, x, BICO, desenho, taxa) * 100)] as [number, number]);
    return { series: s, bands: b, tm: tmPts };
  }, [fam, desenho, taxa, xMax]);

  const yMax = Math.ceil((xMax + cheio.total) / 500) * 500;

  return (
    <div className="space-y-3">
      <div className="grid gap-x-6 gap-y-3 rounded-xl border border-line bg-panel px-4 py-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
        <Slider className="[&>span:first-child]:shrink-0" label="Adultos" value={fam.adultos} min={1} max={4} onChange={set("adultos")} />
        <Slider className="[&>span:first-child]:shrink-0" label="Crianças 0–6" value={fam.criancas06} min={0} max={4} onChange={set("criancas06")} />
        <Slider className="[&>span:first-child]:shrink-0" label="Crianças/adolesc. 7–17" value={fam.criancas717} min={0} max={5} onChange={set("criancas717")} />
        <Slider className="[&>span:first-child]:shrink-0" label="Gestantes" value={fam.gestantes} min={0} max={1} onChange={set("gestantes")} />
        <Slider className="[&>span:first-child]:shrink-0" label="Nutrizes" value={fam.nutrizes} min={0} max={1} onChange={set("nutrizes")} />
      </div>
      <Controls>
        <Slider className="min-w-60 flex-1" label="Renda do trabalho (família, R$/mês)" value={r} min={0} max={xMax} step={10} onChange={setRenda} format={(v) => brl(v, 0)} />
        <Segmented
          value={desenho}
          onChange={setDesenho}
          options={[
            { value: "seco", label: "corte seco" },
            { value: "protecao", label: "regra de proteção" },
            { value: "gradual", label: "retirada gradual" },
          ]}
        />
        <Slider
          className="min-w-52 flex-1"
          label="Taxa de retirada"
          value={taxa * 100}
          min={10}
          max={100}
          step={5}
          onChange={(v) => {
            setTaxa(v / 100);
            setDesenho("gradual");
          }}
          format={(v) => `${num(v, 0)}¢/R$`}
        />
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Panel title={`Renda do trabalho → renda total · família de ${n} ${n === 1 ? "pessoa" : "pessoas"}`}>
          <LineChart
            height={290}
            xDomain={[0, xMax]}
            yDomain={[0, yMax]}
            xLabel="renda do trabalho (R$/mês)"
            yLabel="renda total (R$/mês)"
            xFormat={(v) => num(v, 0)}
            yFormat={(v) => num(v, 0)}
            series={series}
            bands={bands}
            markers={[
              { x: LINHA_ELEGIBILIDADE * n, label: "R$ 218 per capita", color: "#8a93a8" },
              ...(desenho === "protecao" ? [{ x: LIMITE_PROTECAO * n, label: "½ SM per capita", color: "#fbbf24" }] : []),
            ]}
            dots={[{ x: r, y: total, color: COLORS[desenho] }]}
          />
          <div className="mt-3 text-[11px] text-faint">Taxa marginal efetiva de um bico de R$ 100 (desenho selecionado)</div>
          <LineChart
            height={130}
            xDomain={[0, xMax]}
            yDomain={[0, 250]}
            xFormat={(v) => num(v, 0)}
            yFormat={(v) => `${v}%`}
            legend={false}
            series={[{ id: "tm", label: "TMgE", color: COLORS[desenho], area: true, points: tm }]}
            hMarkers={[{ y: 100, label: "100%: trabalhar mais não compensa", color: "#f87171" }]}
            markers={[{ x: r, color: "#8a93a8" }]}
          />
        </Panel>
        <div className="grid content-start gap-2">
          <Stat label="Renda per capita" value={brl(r / n, 0)} tone={r / n <= LINHA_ELEGIBILIDADE ? "good" : "neutral"} hint={r / n <= LINHA_ELEGIBILIDADE ? "elegível (≤ R$ 218)" : "acima da linha de entrada"} />
          <Stat
            label="Benefício cheio"
            value={brl(cheio.total, 0)}
            hint={`cidadania ${brl(cheio.brc, 0)}${cheio.complementar ? ` + compl. ${brl(cheio.complementar, 0)}` : ""} + 1ª inf. ${brl(cheio.bpi, 0)} + variável ${brl(cheio.bvf, 0)}`}
          />
          <Stat label="Benefício pago agora" value={brl(pago, 0)} tone={pago === 0 ? "warn" : "good"} />
          <Stat label="Renda total" value={brl(total, 0)} />
          <Stat
            label="TMgE de +R$ 100 aqui"
            value={pct(marg * 100, 0)}
            tone={marg >= 1 ? "bad" : marg > 0.6 ? "warn" : "good"}
            hint={marg >= 1 ? "ganhar mais deixa a família igual ou pior" : "parte do ganho que o programa retira"}
          />
          <Stat
            label="Pior TMgE do desenho"
            value={pct(pior.worst * 100, 0)}
            tone={pior.worst >= 1 ? "bad" : pior.worst > 0.6 ? "warn" : "good"}
            hint={`perto de ${brl(pior.at, 0)} de renda`}
          />
          <Stat label="Recebe algo até" value={Number.isFinite(teto) ? brl(teto, 0) : "∞"} hint="renda familiar — quanto maior, mais gente no programa" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Famílias atendidas" value="~21 mi" hint="valores aproximados (2024–25)" />
        <Stat label="Custo anual" value="~R$ 168 bi" hint="~1,4% do PIB" />
        <Stat label="Benefício médio" value="~R$ 670" hint="por família/mês" />
        <Stat label="Pessoas alcançadas" value="~55 mi" hint="cerca de 1 em cada 4 brasileiros" />
      </div>
      <p className="font-mono text-[11px] text-faint">
        B = max(142·n, 600) + 150·c₀₋₆ + 50·(c₇₋₁₇ + gest + nutr) · pago = B se y/n ≤ 218 · TMgE = 1 − Δ(renda total)/Δ(renda do trabalho)
      </p>
      <p className="text-xs text-faint">
        Experimente: no “corte seco”, arraste a renda até passar de R$ 218 por pessoa — a renda total despenca e a TMgE passa de
        1.000%. Ligue a regra de proteção: o degrau vira dois degraus menores. Na retirada gradual, baixe a taxa para 30¢ e veja
        o degrau sumir, mas o “recebe algo até” subir (programa maior e mais caro).
      </p>
    </div>
  );
}
