"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Button, Controls, Panel, Segmented } from "@/components/ui";
import { EDGES, NODES, net, propagate, type NodeId } from "./transmissionModel";

const W = 150;
const H = 42;
const COLOR = { up: "#f87171", down: "#60a5fa", mixed: "#fbbf24", idle: "#5a6275" };
const LEVERS = NODES.filter((n) => n.lever);

function clip(ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.min(W / 2 / Math.abs(dx || 1e-9), H / 2 / Math.abs(dy || 1e-9));
  const pad = 4 / Math.hypot(dx, dy);
  return {
    x1: Math.round(ax + dx * (t + pad)),
    y1: Math.round(ay + dy * (t + pad)),
    x2: Math.round(bx - dx * (t + pad * 2)),
    y2: Math.round(by - dy * (t + pad * 2)),
  };
}

const arrow = (s: 1 | -1 | 0 | null | undefined) => (s === 1 ? "↑" : s === -1 ? "↓" : s === 0 ? "↕" : "");
const tone = (s: 1 | -1 | 0 | null | undefined) =>
  s === 1 ? COLOR.up : s === -1 ? COLOR.down : s === 0 ? COLOR.mixed : COLOR.idle;

export function TransmissionMap() {
  const [lever, setLever] = useState<NodeId>("selic");
  const [dir, setDir] = useState<"1" | "-1">("1");
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(true);

  const effects = useMemo(() => propagate(lever, Number(dir) as 1 | -1), [lever, dir]);
  const maxDepth = Math.max(...[...effects.values()].map((e) => e.depth));

  useEffect(() => {
    if (!auto) return;
    if (step >= maxDepth) {
      setAuto(false);
      return;
    }
    const t = setTimeout(() => setStep((s) => s + 1), 700);
    return () => clearTimeout(t);
  }, [auto, step, maxDepth]);

  const choose = (id: NodeId) => {
    setLever(id);
    setStep(0);
    setAuto(true);
  };

  const shown = (id: NodeId) => {
    const e = effects.get(id);
    return e && e.depth <= step ? e : undefined;
  };

  const activeEdges = EDGES.filter((e) => {
    const src = effects.get(e.from);
    return src && src.depth + 1 <= step && e.to !== lever;
  });
  const newest = activeEdges.filter((e) => effects.get(e.from)!.depth + 1 === step);
  const leverLabel = NODES.find((n) => n.id === lever)!.label;

  return (
    <div className="space-y-3">
      <Controls>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted">Choque em</span>
          <Segmented
            value={lever}
            options={LEVERS.map((n) => ({ value: n.id, label: n.label }))}
            onChange={choose}
          />
        </div>
        <Segmented
          value={dir}
          options={[
            { value: "1", label: "↑ sobe" },
            { value: "-1", label: "↓ cai" },
          ]}
          onChange={(v) => {
            setDir(v);
            setStep(0);
            setAuto(true);
          }}
        />
        <div className="flex gap-2">
          <Button onClick={() => setStep((s) => Math.min(maxDepth, s + 1))} disabled={step >= maxDepth}>
            Próxima rodada
          </Button>
          <Button variant="ghost" onClick={() => { setStep(0); setAuto(true); }}>
            Repetir
          </Button>
        </div>
      </Controls>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Panel title="Mapa de transmissão" right={<span className="font-mono text-xs text-faint">rodada {step}/{maxDepth}</span>}>
          <svg viewBox="0 0 980 500" className="w-full">
            <defs>
              {Object.entries(COLOR).map(([k, c]) => (
                <marker key={k} id={`arr-${k}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M0 0 L10 5 L0 10 z" fill={c} />
                </marker>
              ))}
            </defs>
            {EDGES.map((e, i) => {
              const a = NODES.find((n) => n.id === e.from)!;
              const b = NODES.find((n) => n.id === e.to)!;
              const { x1, y1, x2, y2 } = clip(a.x, a.y, b.x, b.y);
              const on = activeEdges.includes(e);
              const srcSign = net(effects.get(e.from));
              const s = on ? (srcSign === 0 ? 0 : ((srcSign! * e.sign) as 1 | -1)) : null;
              const key = s === 1 ? "up" : s === -1 ? "down" : s === 0 ? "mixed" : "idle";
              const mx = Math.round((x1 + x2) / 2);
              const my = Math.round((y1 + y2) / 2);
              return (
                <g key={i} opacity={on ? 1 : 0.28}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={tone(s)}
                    strokeWidth={newest.includes(e) ? 3 : on ? 2 : 1.2}
                    markerEnd={`url(#arr-${key})`}
                    strokeDasharray={on ? undefined : "4 4"}
                  />
                  <circle cx={mx} cy={my} r={8} fill="#11141b" stroke={on ? tone(s) : "#242a38"} />
                  <text x={mx} y={my + 4} textAnchor="middle" fontSize={12} fontFamily="monospace" fill={on ? "#e7e9f0" : "#5a6275"}>
                    {e.sign === 1 ? "+" : "−"}
                  </text>
                </g>
              );
            })}
            {NODES.map((n) => {
              const e = shown(n.id);
              const s = net(e);
              const isLever = n.id === lever;
              return (
                <g
                  key={n.id}
                  className={clsx(n.lever && "cursor-pointer")}
                  onClick={n.lever ? () => choose(n.id) : undefined}
                >
                  <rect
                    x={n.x - W / 2}
                    y={n.y - H / 2}
                    width={W}
                    height={H}
                    rx={9}
                    fill={e ? `${tone(s)}22` : "#171b24"}
                    stroke={isLever ? "#e7e9f0" : e ? tone(s) : "#242a38"}
                    strokeWidth={isLever ? 2 : 1.5}
                  />
                  <text x={n.x - (e ? 9 : 0)} y={n.y + 5} textAnchor="middle" fontSize={15} fill="#e7e9f0">
                    {n.label}
                  </text>
                  {e && (
                    <text x={n.x + W / 2 - 13} y={n.y + 6} textAnchor="middle" fontSize={17} fontWeight={700} fill={tone(s)}>
                      {arrow(s)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
          <p className="mt-2 text-xs text-faint">
            Experimente: escolha <b>Gasto público ↑</b> e veja a dívida ficar amarela (↕): o gasto aumenta o déficit, mas
            também o PIB, que é o denominador. Qual efeito vence depende dos números, e é isso que os capítulos medem.
          </p>
        </Panel>

        <div className="space-y-3">
          <Panel title={`${leverLabel} ${dir === "1" ? "sobe" : "cai"}: o que acontece`}>
            {step === 0 ? (
              <p className="text-sm text-muted">Clique em “Próxima rodada” para ver o choque se espalhar.</p>
            ) : (
              <ul className="space-y-2 text-[13px] leading-snug">
                {newest.map((e, i) => {
                  const a = NODES.find((n) => n.id === e.from)!;
                  const b = NODES.find((n) => n.id === e.to)!;
                  const ss = net(effects.get(e.from));
                  const s = ss === 0 ? 0 : ((ss! * e.sign) as 1 | -1);
                  return (
                    <li key={i} className="animate-rise">
                      <span className="font-medium" style={{ color: tone(ss) }}>
                        {a.label} {arrow(ss)}
                      </span>
                      <span className="text-faint"> → </span>
                      <span className="font-medium" style={{ color: tone(s) }}>
                        {b.label} {arrow(s)}
                      </span>
                      <div className="text-muted">{e.why}</div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
          <div className="flex flex-wrap gap-3 rounded-xl border border-line bg-panel px-4 py-3 text-xs text-muted">
            <span><b style={{ color: COLOR.up }}>↑</b> sobe</span>
            <span><b style={{ color: COLOR.down }}>↓</b> cai</span>
            <span><b style={{ color: COLOR.mixed }}>↕</b> efeitos opostos</span>
            <span><b className="text-ink">+ / −</b> sinal da relação</span>
          </div>
          <div className="rounded-xl border border-line bg-panel px-4 py-3 text-xs text-muted">
            Vá a fundo:{" "}
            {[...new Set(NODES.filter((n) => shown(n.id)).map((n) => n.href))].slice(0, 6).map((h, i) => (
              <Link key={h} href={h} className="text-ink hover:underline">
                {i > 0 && " · "}
                {h.slice(1)}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
