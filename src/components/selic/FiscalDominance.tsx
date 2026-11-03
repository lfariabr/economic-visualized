"use client";

import { useMemo, useState } from "react";
import { Callout, Controls, Panel, Segmented, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { META, fiscalSim } from "./selicModel";
import { br, brl, pct, pp } from "./num";

const SKY = "#38bdf8";
const Q = 16;
const xFmt = (v: number) => `${2026 + Math.floor(v / 4)}`;

export function FiscalDominance() {
  const [dominance, setDominance] = useState(false);
  const [hike, setHike] = useState(3);
  const [debt0, setDebt0] = useState(78);
  const [primary, setPrimary] = useState(0);

  const withHike = useMemo(() => fiscalSim({ hike, debt0, primary, dominance, quarters: Q }), [hike, debt0, primary, dominance]);
  const base = useMemo(() => fiscalSim({ hike: 0, debt0, primary, dominance, quarters: Q }), [debt0, primary, dominance]);
  const at = 8;
  const dPi = withHike[at].pi - base[at].pi;
  const dFx = withHike[at].fx - base[at].fx;
  const dDebt = withHike[Q].debt - base[Q].debt;
  const dPrem = withHike[at].prem - base[at].prem;
  const backfire = hike > 0 && dPi > 0.05;

  return (
    <div className="space-y-3">
      <Controls>
        <Segmented
          value={dominance ? "on" : "off"}
          onChange={(v) => setDominance(v === "on")}
          options={[
            { value: "off", label: "dominância monetária" },
            { value: "on", label: "dominância fiscal" },
          ]}
        />
        <Slider className="min-w-52 flex-1" label="aperto na Selic" value={hike} min={0} max={5} step={0.25} onChange={setHike} format={(v) => pp(v, 2)} />
      </Controls>
      <Controls>
        <Slider className="min-w-52 flex-1" label="dívida bruta inicial" value={debt0} min={50} max={110} step={1} onChange={setDebt0} format={(v) => `${v}% PIB`} />
        <Slider className="min-w-52 flex-1" label="resultado primário" value={primary} min={-2} max={3} step={0.25} onChange={setPrimary} format={(v) => `${br(v, 2)}% PIB`} />
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="grid min-w-0 gap-4 md:grid-cols-2">
          <Panel title="IPCA" className="md:col-span-2">
            <LineChart
              height={210}
              xDomain={[0, Q]}
              xFormat={xFmt}
              yDomain={[-1, 10]}
              yFormat={(v) => `${br(v, 0)}%`}
              series={[
                { id: "h", label: `com aperto de ${br(hike, 2)} p.p.`, color: backfire ? "#f87171" : "#34d399", points: withHike.map((p) => [p.q, p.pi]), width: 2.5 },
                { id: "b", label: "sem aperto", color: "#8a93a8", points: base.map((p) => [p.q, p.pi]), dashed: true },
              ]}
              hMarkers={[{ y: META, label: "meta", color: "#34d399" }]}
              markers={[{ x: at, label: "2 anos", color: "#5a6275" }]}
            />
          </Panel>
          <Panel title="Câmbio (R$/US$)">
            <LineChart
              height={170}
              xDomain={[0, Q]}
              xFormat={xFmt}
              yDomain={[4, Math.max(9, Math.ceil(Math.max(...withHike.map((p) => p.fx))))]}
              yFormat={(v) => br(v, 1)}
              series={[
                { id: "h", label: "com aperto", color: "#fbbf24", points: withHike.map((p) => [p.q, p.fx]), width: 2.5 },
                { id: "b", label: "sem aperto", color: "#8a93a8", points: base.map((p) => [p.q, p.fx]), dashed: true },
              ]}
            />
          </Panel>
          <Panel title="Dívida bruta (% PIB) e prêmio de risco">
            <LineChart
              height={170}
              xDomain={[0, Q]}
              xFormat={xFmt}
              yDomain={[0, Math.max(140, Math.ceil(Math.max(...withHike.map((p) => Math.max(p.debt, p.prem * 10)))))]}
              yFormat={(v) => br(v, 0)}
              series={[
                { id: "d", label: "dívida, com aperto", color: SKY, points: withHike.map((p) => [p.q, p.debt]), width: 2.5 },
                { id: "db", label: "dívida, sem aperto", color: "#8a93a8", points: base.map((p) => [p.q, p.debt]), dashed: true },
                { id: "p", label: "prêmio ×10", color: "#f87171", points: withHike.map((p) => [p.q, p.prem * 10]) },
              ]}
            />
          </Panel>
        </div>
        <div className="grid grid-cols-2 content-start gap-2 lg:grid-cols-1">
          <Stat label="efeito na inflação (2 anos)" value={pp(dPi, 2)} tone={backfire ? "bad" : "good"} hint={backfire ? "o aperto saiu pela culatra" : "o aperto funcionou"} />
          <Stat label="efeito no câmbio" value={`${dFx > 0 ? "+" : ""}${brl(dFx)}`} tone={dFx > 0 ? "bad" : "good"} hint={`dólar em ${brl(withHike[at].fx)}`} />
          <Stat label="efeito no prêmio de risco" value={pp(dPrem, 2)} tone={dPrem > hike ? "bad" : "neutral"} hint="maior que o aperto? deprecia" />
          <Stat label="dívida a mais (4 anos)" value={pp(dDebt)} tone={dDebt > 5 ? "bad" : "warn"} hint={`chega a ${pct(withHike[Q].debt, 0)} do PIB`} />
        </div>
      </div>
      {backfire ? (
        <Callout tone="bad">
          Sob dominância fiscal, cada ponto de Selic aumenta o custo da dívida; o mercado lê isso como risco maior de insolvência, o
          prêmio sobe mais que o próprio juro, o real se deprecia e o repasse cambial e o Focus empurram a inflação para cima. A política
          monetária sozinha não resolve: é preciso ajuste fiscal crível (primário maior) para o juro voltar a funcionar.
        </Callout>
      ) : (
        <Callout tone="ok">
          Com dominância monetária, o aperto aprecia o câmbio e esfria a demanda: a inflação cai. A dívida sobe um pouco com o juro mais
          alto, mas o mercado não muda sua avaliação de solvência.
        </Callout>
      )}
      <p className="font-mono text-[11px] text-faint">
        dívida′ = dívida·(1 + r_ef/4)/(1 + g/4) − primário/4 · r_ef = ½·(Selic − πᵉ) + ½·5% · prêmio = 2,5 + θ·Δdívida + η·Δi·dívida · câmbio = 5,40·e^(−0,03·Δi + 0,045·Δprêmio) ·
        π′ = … + 0,09·depreciação
      </p>
      <p className="text-xs text-faint">
        Experimente: ligue “dominância fiscal” com dívida em 78% e veja o aperto elevar a inflação; depois suba o primário para +2% ou
        baixe a dívida para 50% — o mecanismo enfraquece e o juro volta a funcionar.
      </p>
    </div>
  );
}
