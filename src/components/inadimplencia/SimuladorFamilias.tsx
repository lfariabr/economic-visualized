"use client";

import { useRef, useState } from "react";
import { Button, Callout, Controls, Panel, Segmented, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { useTicker } from "@/lib/useTicker";
import { FamiliasGrid } from "./FamiliasGrid";
import { LINHAS, SIM_DEFAULT, SM, agregados, iniciar, passo, status, statusCode, STATUS_LABEL, type Agg, type SimParams, type SimState } from "./familiasSim";
import { br, brl, pct, pp } from "./fmt";

const HORIZ = 96;
const FAMILIAS_BR = 75; // milhões de famílias (aprox.)

type Run = { sim: SimState; hist: Agg[] };

function novoRun(p: SimParams): Run {
  const sim = iniciar(p);
  return { sim, hist: [agregados(sim.fams, sim.macro, p)] };
}

export function SimuladorFamilias() {
  const [selic, setSelic] = useState(SIM_DEFAULT.selic);
  const [desemprego, setDesemprego] = useState(SIM_DEFAULT.desemprego);
  const [alimentos, setAlimentos] = useState(SIM_DEFAULT.alimentos);
  const [feedback, setFeedback] = useState(false);
  const [dsr, setDsr] = useState(SIM_DEFAULT.dsr);
  const [rotativo, setRotativo] = useState(SIM_DEFAULT.rotativo);
  const [sel, setSel] = useState<number | null>(null);
  const params: SimParams = { selic, desemprego, dsr, alimentos, rotativo, feedback };
  const pRef = useRef(params);
  pRef.current = params;

  const run = useRef<Run | null>(null);
  if (run.current === null) run.current = novoRun(params);

  const t = useTicker(
    () => {
      const r = run.current;
      if (!r) return;
      if (r.sim.macro.t >= HORIZ) {
        t.pause();
        return;
      }
      passo(r.sim, pRef.current);
      r.hist.push(agregados(r.sim.fams, r.sim.macro, pRef.current));
    },
    { speed: 0.08 },
  );

  const reset = (over: Partial<SimParams> = {}) => {
    t.pause();
    run.current = novoRun({ ...params, ...over });
    t.refresh();
  };

  const { sim, hist } = run.current;
  const a = hist[hist.length - 1];
  const a0 = hist[0];
  const codes = sim.fams.map(statusCode);
  const desemp = sim.fams.map((f) => !f.emp);
  const pts = (f: (x: Agg) => number) => hist.map((x) => [x.t, f(x)] as [number, number]);
  const dInad = a.inad - a0.inad;
  const ymax = Math.max(40, ...hist.map((x) => x.atraso)) * 1.08;
  const fam = sel !== null ? sim.fams[sel] : null;

  return (
    <div className="space-y-3">
      <Controls>
        <Button variant="primary" onClick={() => (a.t >= HORIZ ? (reset(), t.play()) : t.toggle())}>
          {t.running ? "❚❚ pausar" : a.t >= HORIZ ? "↺ de novo" : "▶ mês a mês"}
        </Button>
        <Button onClick={t.tick} disabled={a.t >= HORIZ}>
          +1 mês
        </Button>
        <Button variant="ghost" onClick={() => reset()}>
          reiniciar
        </Button>
        <Button onClick={() => setDesemprego(14)}>choque: desemprego (pandemia)</Button>
        <Button onClick={() => setAlimentos(16)}>choque: comida cara</Button>
        <div className="flex items-center gap-2 text-xs text-muted">
          bancos:
          <Segmented
            value={feedback ? "reagem" : "fixo"}
            onChange={(v) => setFeedback(v === "reagem")}
            options={[
              { value: "fixo", label: "spread fixo" },
              { value: "reagem", label: "calote → spread ↑" },
            ]}
          />
        </div>
      </Controls>
      <Controls>
        <span className="w-full text-[11px] tracking-wide text-faint uppercase">valem na hora (mexa com o filme rodando)</span>
        <Slider label="Selic" value={selic} min={2} max={25} step={0.25} onChange={setSelic} format={(v) => pct(v, 2)} className="w-full sm:w-64" />
        <Slider label="Desemprego" value={desemprego} min={3} max={18} step={0.5} onChange={setDesemprego} format={(v) => pct(v, 1)} className="w-full sm:w-64" />
        <Slider label="Inflação de alimentos" value={alimentos} min={0} max={25} step={0.5} onChange={setAlimentos} format={(v) => `${pct(v, 1)} a.a.`} className="w-full sm:w-72" />
        <span className="w-full text-[11px] tracking-wide text-faint uppercase">estruturais (reiniciam a população)</span>
        <Slider
          label="Comprometimento de renda (alvo)"
          value={dsr}
          min={10}
          max={50}
          step={1}
          onChange={(v) => {
            setDsr(v);
            reset({ dsr: v });
          }}
          format={(v) => pct(v, 0)}
          className="w-full sm:w-80"
        />
        <Slider
          label="Endividados no rotativo"
          value={rotativo}
          min={0}
          max={60}
          step={5}
          onChange={(v) => {
            setRotativo(v);
            reset({ rotativo: v });
          }}
          format={(v) => pct(v, 0)}
          className="w-full sm:w-72"
        />
      </Controls>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="grid min-w-0 gap-4">
          <div className="grid min-w-0 gap-4 xl:grid-cols-[1.05fr_1fr]">
            <Panel title={`300 famílias · mês ${a.t} de ${HORIZ}`} right={<span className="text-[11px] text-faint">clique numa família</span>}>
              <FamiliasGrid codes={codes} desempregados={desemp} selected={sel} onSelect={setSel} />
              {fam && (
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 rounded-lg border border-line bg-panel-2/60 px-3 py-2 text-xs text-muted">
                  <span>
                    renda: <b className="font-mono text-ink">{brl(fam.renda0)}</b> ({br(fam.renda0 / SM, 1)} SM)
                  </span>
                  <span>{fam.emp ? "empregada" : <b className="text-warn">desempregada</b>}</span>
                  <span>
                    dívida principal: <b className="font-mono text-ink">{brl(fam.D)}</b>
                  </span>
                  <span>{fam.reneg ? "contrato renegociado" : LINHAS[fam.tipo].label}</span>
                  <span>
                    cartão/rotativo: <b className="font-mono text-ink">{brl(fam.C)}</b>
                  </span>
                  <span>
                    {STATUS_LABEL[status(fam)]}
                    {fam.atraso > 0 ? ` · ${fam.atraso} ${fam.atraso === 1 ? "mês" : "meses"}` : ""}
                  </span>
                </div>
              )}
            </Panel>
            <Panel title="Atraso e inadimplência (% )">
              <LineChart
                height={330}
                width={440}
                series={[
                  { id: "atr", label: "famílias com conta em atraso", color: "#fbbf24", points: pts((x) => x.atraso) },
                  { id: "inad", label: "inadimplência (> 90 dias, % dos endividados)", color: "#f87171", points: pts((x) => x.inad), width: 2.6, area: true },
                  { id: "ren", label: "renegociadas", color: "#60a5fa", points: pts((x) => x.renegociados), dashed: true },
                ]}
                xDomain={[0, HORIZ]}
                yDomain={[0, ymax]}
                xLabel="mês"
                xFormat={(v) => br(v, 0)}
                yFormat={(v) => `${br(v, 0)}%`}
                hMarkers={[{ y: a0.inad, label: "inadimplência no mês 0", color: "#5a6275" }]}
              />
              {feedback && (
                <div className="mt-2">
                  <LineChart
                    height={120}
                    width={440}
                    legend={false}
                    series={[{ id: "sp", label: "spread extra", color: "#f472b6", points: pts((x) => x.spreadExtra), area: true }]}
                    xDomain={[0, HORIZ]}
                    yDomain={[0, Math.max(1, ...hist.map((x) => x.spreadExtra)) * 1.1]}
                    xFormat={(v) => br(v, 0)}
                    yFormat={(v) => br(v, 1)}
                    yLabel="p.p. a.m."
                  />
                </div>
              )}
            </Panel>
          </div>
        </div>
        <div className="grid content-start gap-3">
          <Stat label="Famílias endividadas" value={pct(a.endividados, 0)} hint="Peic/CNC: ≈ 78–79% (inclui cartão à vista)" />
          <Stat
            label="Com conta em atraso"
            value={pct(a.atraso, 1)}
            tone={a.atraso > 30 ? "bad" : a.atraso > 22 ? "warn" : "neutral"}
            hint="Peic: ≈ 30% (inclui luz, água, aluguel)"
          />
          <Stat
            label="Inadimplência (> 90 dias)"
            value={pct(a.inad, 1)}
            tone={dInad > 5 ? "bad" : dInad > 2 ? "warn" : "good"}
            hint={`dos endividados · ${pp(dInad)} desde o mês 0`}
          />
          <Stat
            label="Negativadas"
            value={pct(a.negativados, 1)}
            tone={a.negativados > 18 ? "bad" : "neutral"}
            hint={`≈ ${br((a.negativados / 100) * FAMILIAS_BR, 1)} mi de famílias · Serasa: ~70 mi de CPFs`}
          />
          <Stat label="Comprometimento (quem paga)" value={pct(a.dsr, 1)} hint="parcelas ÷ renda; BCB ≈ 28% (média nacional)" />
          {feedback && (
            <Stat
              label="Spread extra dos bancos"
              value={`+${br(a.spreadExtra, 2)} p.p. a.m.`}
              tone={a.spreadExtra > 1 ? "bad" : a.spreadExtra > 0.3 ? "warn" : "neutral"}
              hint="e limites de cartão cortados"
            />
          )}
        </div>
      </div>
      {dInad > 4 && (
        <Callout tone="bad">
          A inadimplência subiu {br(dInad, 1)} p.p. Quem perde renda primeiro tapa o buraco no cartão; quando o limite acaba, atrasa; com 90
          dias de atraso, é negativado e perde o acesso a crédito novo — o próximo imprevisto já não tem colchão.
          {feedback && a.spreadExtra > 0.3 && " E os bancos, vendo mais calote, sobem o spread e cortam limites: a parcela de quem ainda paga sobe e a espiral se alimenta."}
        </Callout>
      )}
      <p className="font-mono text-xs text-faint">
        renda livre = renda·(desempregado ? 0,4 : 1)·(1+ε) − essenciais·(1 + 0,35·Δalimentos) · parcela = saldo·(i + amortização), i = Selic/12 + spread
        · paga &lt; parcela ⇒ atraso; atraso ≥ 3 meses ⇒ negativado (sem crédito novo){feedback ? " · spreadₜ₊₁ += 0,3·(0,2·Δinad − spreadₜ)" : ""}
      </p>
      <p className="text-xs text-faint">
        Experimente: dê play, e no mês ~20 aperte “choque: desemprego”; depois reinicie com “calote → spread ↑” ligado e repita. Teste também
        comida cara com comprometimento de 40%. Modelo ilustrativo: cada ponto ≈ 250 mil famílias, valores aproximados.
      </p>
    </div>
  );
}
