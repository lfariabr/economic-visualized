"use client";

import { useMemo, useState } from "react";
import { Callout, Controls, Panel, Segmented, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { original, phillipsCloud } from "./phillipsModel";
import { br, pct } from "./num";

const INDIGO = "#818cf8";

export function OriginalCurve() {
  const [kind, setKind] = useState<"estavel" | "choques">("estavel");
  const [k, setK] = useState(6);
  const [u, setU] = useState(6);
  const cloud = useMemo(() => phillipsCloud(kind, k), [kind, k]);
  const curve = useMemo(
    () => Array.from({ length: 71 }, (_, i) => 3.5 + i * 0.1).map((x) => [x, original(x, k)] as [number, number]),
    [k],
  );
  const pi = original(u, k);
  const corr = useMemo(() => {
    const n = cloud.length;
    const mu = cloud.reduce((a, p) => a + p.u, 0) / n;
    const mp = cloud.reduce((a, p) => a + p.pi, 0) / n;
    const cov = cloud.reduce((a, p) => a + (p.u - mu) * (p.pi - mp), 0);
    const su = Math.sqrt(cloud.reduce((a, p) => a + (p.u - mu) ** 2, 0));
    const sp = Math.sqrt(cloud.reduce((a, p) => a + (p.pi - mp) ** 2, 0));
    return cov / (su * sp);
  }, [cloud]);
  const broken = kind === "choques";

  return (
    <div className="space-y-3">
      <Controls>
        <Segmented
          value={kind}
          onChange={setKind}
          options={[
            { value: "estavel", label: "expectativas estáveis (anos 60)" },
            { value: "choques", label: "choques e expectativas subindo (anos 70)" },
          ]}
        />
        <Slider className="min-w-52 flex-1" label="inclinação k" value={k} min={2} max={12} step={0.5} onChange={setK} format={(v) => br(v, 1)} />
        <Slider className="min-w-52 flex-1" label="desemprego escolhido" value={u} min={3.5} max={10.5} step={0.1} onChange={setU} format={(v) => pct(v)} />
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Panel title="Inflação × desemprego (dados simulados)">
          <LineChart
            height={280}
            xDomain={[3.5, 11]}
            yDomain={[-2, 18]}
            xLabel="desemprego (%)"
            yLabel="inflação (% a.a.)"
            xFormat={(v) => br(v, 0)}
            yFormat={(v) => br(v, 0)}
            hover={false}
            series={[{ id: "c", label: "curva de Phillips (πᵉ = 3%)", color: INDIGO, points: curve, width: 2.5 }]}
            dots={[
              ...cloud.map((p) => ({ x: p.u, y: p.pi, color: broken ? "#fbbf24" : "#5a6275", r: 3.5 })),
              { x: u, y: pi, color: INDIGO, r: 7, label: `${pct(u)} → ${pct(pi)}` },
            ]}
          />
          <p className="mt-2 font-mono text-[11px] text-faint">π = πᵉ + k·(u_n/u − 1) · u_n = 7% · πᵉ = 3%</p>
        </Panel>
        <div className="grid grid-cols-2 content-start gap-2 lg:grid-cols-1">
          <Stat label="desemprego escolhido" value={pct(u)} />
          <Stat label="inflação no menu" value={pct(pi)} tone={pi > 4.5 ? "warn" : pi < 1.5 ? "warn" : "good"} />
          <Stat
            label="correlação dos dados"
            value={br(corr, 2)}
            tone={corr < -0.5 ? "good" : "bad"}
            hint={corr < -0.5 ? "trade-off visível" : "a curva sumiu"}
          />
        </div>
      </div>
      {broken ? (
        <Callout tone="bad">
          Nos anos 70, com choques do petróleo e expectativas subindo ano a ano, a nuvem deixou de seguir a curva: inflação alta com
          desemprego alto (estagflação). A curva não era um menu fixo — ela se desloca quando as expectativas mudam.
        </Callout>
      ) : (
        <Callout tone="info">
          Com expectativas paradas, a relação parece um cardápio: aceite um pouco mais de inflação e compre menos desemprego. Foi
          assim que a curva foi lida nos anos 60.
        </Callout>
      )}
      <p className="text-xs text-faint">
        Experimente: escolha 4% de desemprego na curva e veja o preço em inflação; depois troque para “anos 70” — os pontos se espalham
        para cima e a correlação desaparece.
      </p>
    </div>
  );
}
