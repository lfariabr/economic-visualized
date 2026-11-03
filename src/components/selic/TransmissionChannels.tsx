"use client";

import { useRef, useState } from "react";
import { Button, Controls, Panel, Slider, Stat } from "@/components/ui";
import { Bars } from "@/components/viz/Chart";
import { useTicker } from "@/lib/useTicker";
import { channels } from "./selicModel";
import { br, pct, pp } from "./num";

const SKY = "#38bdf8";
const W = 720;
const H = 360;
const SRC = { x: 80, y: 180 };
const MID_X = 290;
const OUT1_X = 480;
const DEST = { x: 650, y: 180 };
const ROWS = [58, 140, 220, 302];
const COLORS: Record<string, string> = { credito: "#38bdf8", cambio: "#fbbf24", ativos: "#a78bfa", expect: "#34d399" };
const OUTS: Record<string, string> = {
  credito: "consumo e investimento",
  cambio: "preço dos importados",
  ativos: "riqueza das famílias",
  expect: "reajustes e preços",
};

type P = { x: number; y: number };
type Curve = [P, P, P, P];
const curve = (a: P, b: P): Curve => [a, { x: (a.x + b.x) / 2, y: a.y }, { x: (a.x + b.x) / 2, y: b.y }, b];
const at = ([p0, p1, p2, p3]: Curve, t: number): P => {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  };
};
const d = ([p0, p1, p2, p3]: Curve) => `M${p0.x},${p0.y} C${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`;
const r1 = (v: number) => Math.round(v * 10) / 10;

export function TransmissionChannels() {
  const [dSelic, setDSelic] = useState(1);
  const [dir, setDir] = useState(0.4);
  const [cred, setCred] = useState(0.6);
  const [open, setOpen] = useState(0.17);
  const prog = useRef(3);
  const ticker = useTicker(
    () => {
      prog.current = Math.min(3, prog.current + 0.025);
      if (prog.current >= 3) ticker.pause();
    },
    { speed: 1 },
  );
  const fire = () => {
    prog.current = 0;
    ticker.play();
  };

  const ch = channels(dSelic, dir, cred, open);
  const total = ch.reduce((a, c) => a + c.effect, 0);
  const maxAbs = 0.15 * 3;
  const t = prog.current;

  return (
    <div className="space-y-3">
      <Controls>
        <Slider className="min-w-56 flex-1" label="variação da Selic" value={dSelic} min={-3} max={3} step={0.25} onChange={setDSelic} format={(v) => pp(v, 2)} />
        <Button variant="primary" onClick={fire}>
          ▶ Copom decide
        </Button>
      </Controls>
      <Controls>
        <Slider className="min-w-56 flex-1" label="crédito direcionado" value={dir} min={0} max={0.7} step={0.05} onChange={setDir} format={(v) => pct(v * 100, 0)} />
        <Slider className="min-w-56 flex-1" label="credibilidade do BC" value={cred} min={0} max={1} step={0.05} onChange={setCred} format={(v) => pct(v * 100, 0)} />
        <Slider className="min-w-56 flex-1" label="importações / PIB" value={open} min={0.08} max={0.4} step={0.01} onChange={setOpen} format={(v) => pct(v * 100, 0)} />
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Panel title="Do Copom aos preços: quatro canais">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
            {ch.map((c, k) => {
              const y = ROWS[k];
              const a = curve({ x: SRC.x + 44, y: SRC.y }, { x: MID_X - 70, y });
              const b = curve({ x: MID_X + 70, y }, { x: OUT1_X - 70, y });
              const e = curve({ x: OUT1_X + 70, y }, { x: DEST.x - 44, y: DEST.y });
              const strength = Math.min(1, Math.abs(c.effect) / maxAbs);
              const col = COLORS[c.id];
              const lit = t > 0 && t < 3 ? 0.25 + 0.75 * strength : 0.2 + 0.5 * strength;
              const segs: [Curve, number][] = [
                [a, 0],
                [b, 1],
                [e, 2],
              ];
              return (
                <g key={c.id}>
                  {segs.map(([cv, s]) => (
                    <path key={s} d={d(cv)} fill="none" stroke={col} strokeWidth={1 + 5 * strength} opacity={lit} strokeLinecap="round" />
                  ))}
                  {segs.map(([cv, s]) => {
                    const local = t - s;
                    if (local <= 0 || local >= 1 || strength < 0.02) return null;
                    const p = at(cv, local);
                    return <circle key={`p${s}`} cx={r1(p.x)} cy={r1(p.y)} r={3 + 4 * strength} fill={col} />;
                  })}
                  <rect x={MID_X - 70} y={y - 20} width={140} height={40} rx={8} fill="#171b24" stroke={col} strokeOpacity={0.3 + 0.7 * strength} />
                  <text x={MID_X} y={y - 3} textAnchor="middle" fontSize={13} fill="#e7e9f0" fontWeight={600}>
                    {c.label}
                  </text>
                  <text x={MID_X} y={y + 12} textAnchor="middle" fontSize={10.5} fill={col}>
                    {pp(c.effect, 2)}
                  </text>
                  <rect x={OUT1_X - 70} y={y - 16} width={140} height={32} rx={8} fill="#11141b" stroke="#242a38" />
                  <text x={OUT1_X} y={y + 4} textAnchor="middle" fontSize={11} fill="#8a93a8">
                    {OUTS[c.id]}
                  </text>
                </g>
              );
            })}
            <circle cx={SRC.x} cy={SRC.y} r={44} fill="#171b24" stroke={SKY} strokeWidth={2} />
            <text x={SRC.x} y={SRC.y - 4} textAnchor="middle" fontSize={13} fill="#e7e9f0" fontWeight={600}>
              Selic
            </text>
            <text x={SRC.x} y={SRC.y + 13} textAnchor="middle" fontSize={11} fill={SKY}>
              {pp(dSelic, 2)}
            </text>
            <circle cx={DEST.x} cy={DEST.y} r={44} fill="#171b24" stroke={total < 0 ? "#34d399" : total > 0 ? "#f87171" : "#5a6275"} strokeWidth={2} />
            <text x={DEST.x} y={DEST.y - 4} textAnchor="middle" fontSize={13} fill="#e7e9f0" fontWeight={600}>
              IPCA
            </text>
            <text x={DEST.x} y={DEST.y + 13} textAnchor="middle" fontSize={11} fill={total < 0 ? "#34d399" : "#f87171"}>
              {t >= 2.6 || t === 0 ? pp(total, 2) : "…"}
            </text>
          </svg>
          <p className="mt-1 font-mono text-[11px] text-faint">
            Δπ ≈ Δi·[0,15·(1 − direcionado) + 0,1·(imp/PIB ÷ 0,2) + 0,04 + 0,12·credibilidade] · efeito em 12–18 meses (ilustrativo)
          </p>
        </Panel>
        <div className="space-y-3">
          <Panel title="Contribuição por canal">
            <Bars
              max={maxAbs}
              format={(v) => br(v, 2)}
              rows={ch.map((c) => ({ label: c.label, value: Math.abs(c.effect), color: COLORS[c.id] }))}
            />
          </Panel>
          <Stat
            label="efeito total no IPCA"
            value={pp(total, 2)}
            tone={dSelic > 0 ? "good" : dSelic < 0 ? "warn" : "neutral"}
            hint="em 12–18 meses, por esta decisão"
          />
          <Stat
            label="potência por 1 p.p."
            value={br(dSelic !== 0 ? Math.abs(total / dSelic) : 0, 2)}
            tone={dSelic !== 0 && Math.abs(total / dSelic) < 0.2 ? "bad" : "neutral"}
            hint="p.p. de inflação por p.p. de Selic"
          />
        </div>
      </div>
      <p className="text-xs text-faint">
        Experimente: suba o crédito direcionado para 70% e zere a credibilidade — o mesmo aumento da Selic passa a mover muito menos a
        inflação, e o BC precisa de doses maiores. Clique em “Copom decide” para ver o pulso percorrer os canais.
      </p>
    </div>
  );
}
