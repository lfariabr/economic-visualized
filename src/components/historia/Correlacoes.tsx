"use client";

import { useState } from "react";
import { Callout, Controls, Panel, Slider, Stat } from "@/components/ui";
import { ANO0, ANO1, DATA, FONTE, SERIE, SERIES, type SerieId } from "./historiaData";
import { fmtValor } from "./histFmt";
import { br } from "./fmtBR";

const W = 640;
const H = 380;
const P = { l: 52, r: 16, t: 14, b: 40 };
const r2 = (v: number) => Math.round(v * 100) / 100;

const DECADAS = [
  { de: 1980, cor: "#f87171", label: "anos 80" },
  { de: 1990, cor: "#fbbf24", label: "anos 90" },
  { de: 2000, cor: "#34d399", label: "anos 2000" },
  { de: 2010, cor: "#60a5fa", label: "anos 2010" },
  { de: 2020, cor: "#a78bfa", label: "anos 2020" },
];
const corAno = (a: number) => [...DECADAS].reverse().find((d) => a >= d.de)?.cor ?? "#8a93a8";

function Select({ value, onChange, label }: { value: SerieId; onChange: (v: SerieId) => void; label: string }) {
  return (
    <label className="flex items-center gap-2 text-muted">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SerieId)}
        className="rounded-md border border-line bg-panel-2 px-2 py-1 text-sm text-ink"
      >
        {SERIES.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function pearson(xs: number[], ys: number[]) {
  const n = xs.length;
  if (n < 3) return NaN;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
    syy += (ys[i] - my) ** 2;
  }
  return { r: sxy / Math.sqrt(sxx * syy), b: sxy / sxx, a: my - (sxy / sxx) * mx };
}

export function Correlacoes() {
  const [xs, setXs] = useState<SerieId>("selic");
  const [ys, setYs] = useState<SerieId>("ipca");
  const [de, setDe] = useState(1996);
  const [lag, setLag] = useState(false);
  const [log, setLog] = useState(true);
  const [hov, setHov] = useState<number | null>(null);

  const tf = (id: SerieId, v: number) => (id === "ipca" && log ? Math.log10(Math.max(v, 0.5)) : v);
  const pts: { ano: number; x: number; y: number; vx: number; vy: number }[] = [];
  for (let a = de; a <= ANO1; a++) {
    const vx = DATA[xs][a];
    const vy = DATA[ys][lag ? a + 1 : a];
    if (vx !== undefined && vy !== undefined) pts.push({ ano: a, x: tf(xs, vx), y: tf(ys, vy), vx, vy });
  }
  const fit = pearson(
    pts.map((p) => p.x),
    pts.map((p) => p.y),
  );
  const r = typeof fit === "number" ? NaN : fit.r;
  const xl = Math.min(...pts.map((p) => p.x));
  const xh = Math.max(...pts.map((p) => p.x));
  const yl = Math.min(...pts.map((p) => p.y));
  const yh = Math.max(...pts.map((p) => p.y));
  const padx = (xh - xl || 1) * 0.08;
  const pady = (yh - yl || 1) * 0.08;
  const X = (v: number) => r2(P.l + ((v - (xl - padx)) / (xh - xl + 2 * padx || 1)) * (W - P.l - P.r));
  const Y = (v: number) => r2(P.t + (1 - (v - (yl - pady)) / (yh - yl + 2 * pady || 1)) * (H - P.t - P.b));
  const tickVals = (lo: number, hi: number) => [0, 0.25, 0.5, 0.75, 1].map((f) => lo + f * (hi - lo));
  const lab = (id: SerieId, v: number) => (id === "ipca" && log ? br(10 ** v, 0) : br(v, id === "dolar" ? 1 : 0));
  const hp = pts.find((p) => p.ano === hov);
  const forte = Number.isFinite(r) && Math.abs(r) > 0.6;

  return (
    <div className="space-y-3">
      <Controls>
        <Select label="X" value={xs} onChange={setXs} />
        <Select label="Y" value={ys} onChange={setYs} />
        <Slider label="A partir de" value={de} min={ANO0} max={2015} step={1} onChange={setDe} format={(v) => String(v)} className="w-full sm:w-64" />
        <label className="flex items-center gap-2 text-muted">
          <input type="checkbox" checked={lag} onChange={(e) => setLag(e.target.checked)} /> Y no ano seguinte (t+1)
        </label>
        <label className="flex items-center gap-2 text-muted">
          <input type="checkbox" checked={log} onChange={(e) => setLog(e.target.checked)} /> IPCA em log
        </label>
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Panel title={`${SERIE[ys].short}${lag ? " (t+1)" : ""} × ${SERIE[xs].short} · cada ponto é um ano`} right={<span className="text-[11px] text-faint">{FONTE}</span>}>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none" onMouseLeave={() => setHov(null)}>
            {tickVals(xl - padx, xh + padx).map((t) => (
              <g key={`x${t}`}>
                <line x1={X(t)} x2={X(t)} y1={P.t} y2={H - P.b} stroke="#242a38" />
                <text x={X(t)} y={H - P.b + 15} textAnchor="middle" fontSize={10.5} fill="#5a6275">
                  {lab(xs, t)}
                </text>
              </g>
            ))}
            {tickVals(yl - pady, yh + pady).map((t) => (
              <g key={`y${t}`}>
                <line x1={P.l} x2={W - P.r} y1={Y(t)} y2={Y(t)} stroke="#242a38" />
                <text x={P.l - 6} y={Y(t) + 3.5} textAnchor="end" fontSize={10.5} fill="#5a6275">
                  {lab(ys, t)}
                </text>
              </g>
            ))}
            <text x={(P.l + W - P.r) / 2} y={H - 6} textAnchor="middle" fontSize={11} fill="#8a93a8">
              {SERIE[xs].label}
            </text>
            <text transform={`translate(13 ${(P.t + H - P.b) / 2}) rotate(-90)`} textAnchor="middle" fontSize={11} fill="#8a93a8">
              {SERIE[ys].label}
              {lag ? " no ano seguinte" : ""}
            </text>
            {typeof fit !== "number" && Number.isFinite(fit.b) && (
              <line
                x1={X(xl)}
                x2={X(xh)}
                y1={Y(fit.a + fit.b * xl)}
                y2={Y(fit.a + fit.b * xh)}
                stroke="#e7e9f0"
                strokeDasharray="5 4"
                opacity={0.5}
              />
            )}
            <path
              d={pts.map((p, i) => `${i ? "L" : "M"}${X(p.x)},${Y(p.y)}`).join("")}
              fill="none"
              stroke="#5a6275"
              strokeWidth={0.8}
              opacity={0.5}
            />
            {pts.map((p) => (
              <g key={p.ano} onMouseEnter={() => setHov(p.ano)}>
                <circle cx={X(p.x)} cy={Y(p.y)} r={hov === p.ano ? 7 : 5} fill={corAno(p.ano)} stroke="#0a0c11" strokeWidth={1.5} />
                <text x={X(p.x) + 6} y={Y(p.y) - 6} fontSize={9} fill="#8a93a8">
                  {String(p.ano).slice(2)}
                </text>
              </g>
            ))}
          </svg>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            {DECADAS.map((d) => (
              <span key={d.de} className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-full" style={{ background: d.cor }} />
                {d.label}
              </span>
            ))}
          </div>
        </Panel>
        <div className="grid content-start gap-3">
          <Stat label="Correlação (Pearson r)" value={Number.isFinite(r) ? br(r, 2) : "—"} tone={forte ? (r > 0 ? "warn" : "good") : "neutral"} hint={`${pts.length} anos com as duas séries`} />
          <Stat
            label="Leitura"
            value={!Number.isFinite(r) ? "poucos dados" : Math.abs(r) > 0.6 ? "forte" : Math.abs(r) > 0.3 ? "moderada" : "fraca"}
            hint={Number.isFinite(r) ? (r > 0 ? "andam juntas" : "andam em sentidos opostos") : "escolha outro período"}
          />
          <Stat
            label={hp ? `Ano ${hp.ano}` : "Passe o mouse num ponto"}
            value={hp ? `${fmtValor(xs, hp.vx)} · ${fmtValor(ys, hp.vy)}` : "—"}
            hint={hp ? `${SERIE[xs].short} · ${SERIE[ys].short}${lag ? ` (${hp.ano + 1})` : ""}` : undefined}
          />
        </div>
      </div>
      <Callout tone="info">
        Correlação não é causalidade: Selic e IPCA andam juntos porque o Copom <em>reage</em> à inflação (sobe os juros quando ela sobe), mesmo que juros altos ajudem a derrubá-la depois. Ligue &quot;Y no ano seguinte&quot; para olhar a defasagem.
      </Callout>
      <p className="font-mono text-xs text-faint">r = Σ(x − x̄)(y − ȳ) / √(Σ(x − x̄)²·Σ(y − ȳ)²) · reta tracejada: mínimos quadrados</p>
      <p className="text-xs text-faint">
        Experimente: escolha X = Dólar e Y = IPCA a partir de 1999; depois X = PIB e Y = Desemprego (lei de Okun). Mude &quot;a partir de&quot; para 1980 com IPCA × PIB e veja a hiperinflação dominar.
      </p>
    </div>
  );
}
