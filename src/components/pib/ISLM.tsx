"use client";

import { useRef, useState } from "react";
import { Button, Callout, Controls, Panel, Segmented, Slider, Stat } from "@/components/ui";
import { br } from "./num";
import { equilibrium, IS_A, isY, LM_E, lmR, R0, Y0, type ISLMParams } from "./pibModel";

const W = 640;
const H = 360;
const pad = { l: 50, r: 16, t: 16, b: 40 };
const XD: [number, number] = [84, 122];
const YD: [number, number] = [0, 22];
const r2 = (v: number) => Math.round(v * 100) / 100;
const sx = (y: number) => r2(pad.l + ((y - XD[0]) / (XD[1] - XD[0])) * (W - pad.l - pad.r));
const sy = (r: number) => r2(pad.t + (1 - (r - YD[0]) / (YD[1] - YD[0])) * (H - pad.t - pad.b));
const ux = (px: number) => XD[0] + ((px - pad.l) / (W - pad.l - pad.r)) * (XD[1] - XD[0]);
const uy = (py: number) => YD[0] + (1 - (py - pad.t) / (H - pad.t - pad.b)) * (YD[1] - YD[0]);

const BASE: ISLMParams = { dG: 0, conf: 0, dM: 0, selic: R0, fixa: false };

function isPath(p: ISLMParams) {
  // r as function of Y: r = R0 + (Y0 + A − Y)/b ; draw by sampling r
  const pts: string[] = [];
  for (let r = YD[0] - 2; r <= YD[1] + 2; r += 0.5) pts.push(`${sx(isY(r, p))},${sy(r)}`);
  return `M${pts.join("L")}`;
}
function lmPath(p: ISLMParams) {
  const pts: string[] = [];
  for (let y = XD[0] - 5; y <= XD[1] + 5; y += 1) pts.push(`${sx(y)},${sy(lmR(y, p))}`);
  return `M${pts.join("L")}`;
}

/** IS-LM with draggable curves; toggle "BC fixa a Selic" (horizontal LM). */
export function ISLM() {
  const [p, setP] = useState<ISLMParams>(BASE);
  const drag = useRef<null | { kind: "is" | "lm"; y0: number; r0: number; p0: ISLMParams }>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const set = (patch: Partial<ISLMParams>) => setP((q) => ({ ...q, ...patch }));

  const eq = equilibrium(p);
  const base = equilibrium({ ...BASE, fixa: p.fixa, selic: p.fixa ? p.selic : R0 });
  // crowding out: output if the rate had stayed where it was before the fiscal change
  const baseRef = equilibrium({ ...p, dG: 0 });
  const yNoCrowd = isY(baseRef.r, p);
  const multEf = p.dG !== 0 ? (eq.Y - baseRef.Y) / p.dG : null;
  const crowd = yNoCrowd - eq.Y;
  const showCrowd = !p.fixa && Math.abs(crowd) > 0.3 && Math.abs(p.dG) > 0.05;

  const toData = (e: React.PointerEvent) => {
    const svg = svgRef.current;
    if (!svg) return { y: 0, r: 0 };
    const b = svg.getBoundingClientRect();
    return { y: ux(((e.clientX - b.left) / b.width) * W), r: uy(((e.clientY - b.top) / b.height) * H) };
  };
  const onDown = (kind: "is" | "lm") => (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const d = toData(e);
    drag.current = { kind, y0: d.y, r0: d.r, p0: p };
  };
  const onMove = (e: React.PointerEvent) => {
    const g = drag.current;
    if (!g) return;
    const d = toData(e);
    if (g.kind === "is") {
      const dG = Math.max(-6, Math.min(6, g.p0.dG + (d.y - g.y0) / IS_A));
      set({ dG: Math.round(dG * 10) / 10 });
    } else if (p.fixa) {
      set({ selic: Math.max(2, Math.min(20, Math.round((g.p0.selic + (d.r - g.r0)) * 4) / 4)) });
    } else {
      const dM = Math.max(-6, Math.min(6, g.p0.dM - (d.r - g.r0) / LM_E));
      set({ dM: Math.round(dM * 10) / 10 });
    }
  };
  const onUp = () => {
    drag.current = null;
  };

  const ticksX = [85, 90, 95, 100, 105, 110, 115, 120];
  const ticksY = [0, 5, 10, 15, 20];

  return (
    <div className="space-y-3">
      <Controls>
        <Segmented
          value={p.fixa ? "fixa" : "classico"}
          options={[
            { value: "classico", label: "LM clássica (BC fixa a moeda)" },
            { value: "fixa", label: "BC fixa a Selic (LM horizontal)" },
          ]}
          onChange={(v) => set({ fixa: v === "fixa", selic: v === "fixa" ? Math.round(eq.r * 4) / 4 : p.selic })}
        />
        <Button variant="ghost" onClick={() => setP({ ...BASE, fixa: p.fixa })}>
          Restaurar
        </Button>
      </Controls>
      <Controls>
        <Slider label="Gasto público ΔG" value={p.dG} min={-6} max={6} step={0.1} onChange={(v) => set({ dG: v })} format={(v) => `${v > 0 ? "+" : ""}${br(v, 1)}`} className="min-w-[220px] flex-1" />
        <Slider label="Confiança" value={p.conf} min={-10} max={10} step={0.5} onChange={(v) => set({ conf: v })} format={(v) => `${v > 0 ? "+" : ""}${br(v, 1)}`} className="min-w-[220px] flex-1" />
        {p.fixa ? (
          <Slider label="Selic" value={p.selic} min={2} max={20} step={0.25} onChange={(v) => set({ selic: v })} format={(v) => `${br(v, 2)}%`} className="min-w-[220px] flex-1" />
        ) : (
          <Slider label="Oferta de moeda ΔM" value={p.dM} min={-6} max={6} step={0.1} onChange={(v) => set({ dM: v })} format={(v) => `${v > 0 ? "+" : ""}${br(v, 1)}`} className="min-w-[220px] flex-1" />
        )}
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <Panel title="Juros × produto">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="w-full touch-none select-none"
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerLeave={onUp}
          >
            <defs>
              <clipPath id="islm-clip">
                <rect x={pad.l} y={pad.t} width={W - pad.l - pad.r} height={H - pad.t - pad.b} />
              </clipPath>
              <marker id="islm-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M0,0L10,5L0,10z" fill="#f87171" />
              </marker>
            </defs>
            {ticksY.map((t) => (
              <g key={`y${t}`}>
                <line x1={pad.l} x2={W - pad.r} y1={sy(t)} y2={sy(t)} stroke="#242a38" />
                <text x={pad.l - 6} y={sy(t) + 3.5} textAnchor="end" fontSize={10.5} fill="#5a6275">
                  {t}%
                </text>
              </g>
            ))}
            {ticksX.map((t) => (
              <text key={`x${t}`} x={sx(t)} y={H - pad.b + 15} textAnchor="middle" fontSize={10.5} fill="#5a6275">
                {t}
              </text>
            ))}
            <text x={(pad.l + W - pad.r) / 2} y={H - 6} textAnchor="middle" fontSize={11} fill="#8a93a8">
              produto Y (PIB, índice: 100 = potencial)
            </text>
            <text transform={`translate(13 ${(pad.t + H - pad.b) / 2}) rotate(-90)`} textAnchor="middle" fontSize={11} fill="#8a93a8">
              juro r (% a.a.)
            </text>
            <line x1={sx(100)} x2={sx(100)} y1={pad.t} y2={H - pad.b} stroke="#5a6275" strokeDasharray="2 4" />
            <text x={sx(100) + 4} y={H - pad.b - 6} fontSize={10} fill="#5a6275">
              potencial
            </text>
            <g clipPath="url(#islm-clip)">
              <path d={isPath({ ...BASE })} fill="none" stroke="#e879f9" strokeOpacity={0.3} strokeDasharray="5 4" strokeWidth={1.5} />
              <path d={lmPath({ ...BASE, fixa: p.fixa, selic: p.fixa ? base.r : R0 })} fill="none" stroke="#38bdf8" strokeOpacity={0.3} strokeDasharray="5 4" strokeWidth={1.5} />
              <path d={isPath(p)} fill="none" stroke="#e879f9" strokeWidth={2.5} />
              <path d={lmPath(p)} fill="none" stroke="#38bdf8" strokeWidth={2.5} />
              <path d={isPath(p)} fill="none" stroke="transparent" strokeWidth={32} className="cursor-ew-resize" onPointerDown={onDown("is")} />
              <path d={lmPath(p)} fill="none" stroke="transparent" strokeWidth={32} className="cursor-ns-resize" onPointerDown={onDown("lm")} />
              {showCrowd && (
                <g>
                  <circle cx={sx(yNoCrowd)} cy={sy(baseRef.r)} r={4} fill="none" stroke="#f87171" strokeWidth={1.5} />
                  <line
                    x1={sx(yNoCrowd)}
                    y1={sy(baseRef.r)}
                    x2={sx(eq.Y)}
                    y2={sy(baseRef.r)}
                    stroke="#f87171"
                    strokeWidth={1.5}
                    markerEnd="url(#islm-arrow)"
                  />
                  <text x={(sx(yNoCrowd) + sx(eq.Y)) / 2} y={sy(baseRef.r) + 16} textAnchor="middle" fontSize={10.5} fill="#f87171">
                    crowding out
                  </text>
                </g>
              )}
              <line x1={sx(eq.Y)} x2={sx(eq.Y)} y1={sy(eq.r)} y2={H - pad.b} stroke="#e7e9f0" strokeDasharray="2 3" strokeOpacity={0.5} />
              <line x1={pad.l} x2={sx(eq.Y)} y1={sy(eq.r)} y2={sy(eq.r)} stroke="#e7e9f0" strokeDasharray="2 3" strokeOpacity={0.5} />
              <circle cx={sx(eq.Y)} cy={sy(eq.r)} r={6} fill="#e7e9f0" stroke="#0a0c11" strokeWidth={2} />
            </g>
            <text x={Math.min(W - 40, sx(isY(YD[0] + 1.2, p)) + 6)} y={sy(YD[0] + 1.2)} fontSize={12} fontWeight={600} fill="#e879f9">
              IS
            </text>
            <text x={W - pad.r - 8} y={Math.max(pad.t + 12, Math.min(H - pad.b - 6, sy(lmR(XD[1] - 1, p)) - 6))} textAnchor="end" fontSize={12} fontWeight={600} fill="#38bdf8">
              LM
            </text>
          </svg>
          <div className="mt-1 text-[11px] text-faint">arraste a curva IS para os lados e a LM para cima/baixo · tracejadas = posição inicial</div>
          <div className="mt-2 font-mono text-[11px] text-faint">
            IS: Y = 100 + {br(IS_A, 1)}·ΔG + confiança − 1,6·(r − 10) · LM: {p.fixa ? `r = Selic = ${br(p.selic, 2)}%` : "r = 10 + 0,45·(Y − 100) − 1,2·ΔM"}
          </div>
        </Panel>
        <div className="grid content-start gap-2">
          <Stat label="Produto Y" value={br(eq.Y, 1)} tone={eq.Y < 97 ? "bad" : eq.Y > 104 ? "warn" : "good"} hint={eq.Y > 104 ? "acima do potencial: inflação" : eq.Y < 97 ? "recessão" : "perto do potencial"} />
          <Stat label="Juro de equilíbrio" value={`${br(eq.r, 2)}%`} />
          <Stat label="Multiplicador efetivo" value={multEf === null ? "—" : br(multEf, 2)} hint={`ΔY / ΔG · sem reação do juro seria ${br(IS_A, 1)}`} />
          <Stat
            label="Crowding out"
            value={p.fixa ? "0 (juro fixo)" : br(crowd, 1)}
            tone={!p.fixa && crowd > 1 ? "warn" : "neutral"}
            hint={p.fixa ? "até o Copom reagir" : "produto perdido porque o juro subiu"}
          />
        </div>
      </div>
      <Callout tone="info">
        No livro-texto clássico o BC fixa a quantidade de moeda: mais gasto público eleva a demanda por moeda, o juro sobe sozinho e expulsa
        parte do investimento privado (<em>crowding out</em>). No Brasil de hoje o Copom fixa a Selic — a LM é horizontal e o gasto tem efeito
        cheio no curto prazo. Mas se a economia passar do potencial e a inflação subir, o Copom eleva a Selic: o crowding out volta, só que por
        decisão do BC.
      </Callout>
      <p className="text-xs text-faint">
        Experimente: arraste a IS para a direita (mais gasto) e veja a seta vermelha de crowding out; depois troque para “BC fixa a Selic” e repita —
        o produto anda o deslocamento inteiro da IS.
      </p>
    </div>
  );
}
