"use client";

import { useRef, useState } from "react";
import { Button, Callout, Controls, Panel, Slider, Stat } from "@/components/ui";
import { useTicker } from "@/lib/useTicker";
import { CEIL, ceiling } from "./foodModel";
import { brl, nf, pct } from "./fmtBR";

const W = 420;
const H = 300;
const PAD = { l: 44, r: 14, t: 12, b: 34 };
const QD: [number, number] = [40, 160];
const PD: [number, number] = [0, 20];
const r2 = (v: number) => Math.round(v * 100) / 100;
const sx = (q: number) => r2(PAD.l + ((q - QD[0]) / (QD[1] - QD[0])) * (W - PAD.l - PAD.r));
const sy = (p: number) => r2(H - PAD.b - ((Math.min(PD[1] + 10, Math.max(PD[0] - 10, p)) - PD[0]) / (PD[1] - PD[0])) * (H - PAD.t - PAD.b));

export function PriceCeiling() {
  const [pBar, setPBar] = useState(7.5);
  const [black, setBlack] = useState(false);
  const month = useRef(0);
  const ticker = useTicker(
    () => {
      if (month.current >= 12) return ticker.pause();
      month.current += 1;
    },
    { speed: 1 / 40 },
  );
  const m = month.current;
  const c = ceiling(pBar, m);
  const { pStar, qStar } = CEIL;

  const shelf = Math.round((c.qt / c.Qd(Math.min(pBar, pStar))) * 100);
  const queue = Math.min(40, Math.round(c.shortage / 2));

  // triângulo do peso morto entre Qt e Q*
  const dwl = c.binding
    ? `M${sx(c.qt)},${sy(c.Pd(c.qt))}L${sx(qStar)},${sy(pStar)}L${sx(c.qt)},${sy(c.Ps(c.qt))}Z`
    : "";

  return (
    <div className="space-y-3">
      <Controls>
        <Slider label="Preço tabelado (R$/kg)" value={pBar} min={4} max={13} step={0.25} onChange={setPBar} format={(v) => brl(v, 2)} className="w-full sm:w-80" />
        <Button variant="primary" onClick={() => (m >= 12 ? ((month.current = 0), ticker.play()) : ticker.toggle())}>
          {ticker.running ? "Pausar" : "Congelar por 12 meses"}
        </Button>
        <Button onClick={() => (m < 12 ? ticker.tick() : undefined)}>+1 mês</Button>
        <Button variant="ghost" onClick={() => ((month.current = 0), ticker.refresh())}>
          Mês 0
        </Button>
        <label className="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" checked={black} onChange={(e) => setBlack(e.target.checked)} />
          mostrar mercado paralelo (ágio)
        </label>
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,420px)_1fr_220px]">
        <Panel title={`Carne bovina · mês ${m} de congelamento`}>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
            <defs>
              <clipPath id="ceil-clip">
                <rect x={PAD.l} y={PAD.t} width={W - PAD.l - PAD.r} height={H - PAD.t - PAD.b} />
              </clipPath>
            </defs>
            {[0, 5, 10, 15, 20].map((p) => (
              <g key={p}>
                <line x1={PAD.l} x2={W - PAD.r} y1={sy(p)} y2={sy(p)} stroke="#242a38" />
                <text x={PAD.l - 5} y={sy(p) + 3.5} textAnchor="end" fontSize={10} fill="#5a6275">
                  {p}
                </text>
              </g>
            ))}
            {[60, 80, 100, 120, 140].map((q) => (
              <text key={q} x={sx(q)} y={H - PAD.b + 14} textAnchor="middle" fontSize={10} fill="#5a6275">
                {q}
              </text>
            ))}
            <text x={(PAD.l + W - PAD.r) / 2} y={H - 4} textAnchor="middle" fontSize={10.5} fill="#8a93a8">
              quantidade (mil t/mês)
            </text>
            {dwl && <path d={dwl} fill="#f87171" opacity={0.3} />}
            {c.binding && (
              <line x1={sx(c.qt)} x2={sx(c.Qd(pBar))} y1={sy(pBar)} y2={sy(pBar)} stroke="#f87171" strokeWidth={6} opacity={0.45} />
            )}
            <g clipPath="url(#ceil-clip)">
            <line x1={sx(QD[0])} y1={sy(c.Pd(QD[0]))} x2={sx(QD[1])} y2={sy(c.Pd(QD[1]))} stroke="#60a5fa" strokeWidth={2} />
            <line x1={sx(QD[0])} y1={sy(c.Ps(QD[0]))} x2={sx(QD[1])} y2={sy(c.Ps(QD[1]))} stroke="#f59e0b" strokeWidth={2} />
            </g>
            <line x1={PAD.l} x2={W - PAD.r} y1={sy(pBar)} y2={sy(pBar)} stroke="#e7e9f0" strokeDasharray="5 4" />
            <text x={W - PAD.r - 4} y={sy(pBar) - 5} textAnchor="end" fontSize={10.5} fill="#e7e9f0">
              teto {brl(pBar, 2)}
            </text>
            <circle cx={sx(qStar)} cy={sy(pStar)} r={4} fill="#8a93a8" />
            {c.binding && (
              <>
                <circle cx={sx(c.qt)} cy={sy(pBar)} r={5} fill="#f59e0b" stroke="#0a0c11" />
                <circle cx={sx(c.Qd(pBar))} cy={sy(pBar)} r={5} fill="#60a5fa" stroke="#0a0c11" />
                <text x={(sx(c.qt) + sx(c.Qd(pBar))) / 2} y={sy(pBar) + 16} textAnchor="middle" fontSize={10.5} fill="#f87171">
                  escassez
                </text>
                {black && (
                  <>
                    <line x1={sx(c.qt)} x2={sx(c.qt)} y1={sy(pBar)} y2={sy(c.blackPrice)} stroke="#fbbf24" strokeDasharray="3 3" />
                    <circle cx={sx(c.qt)} cy={sy(c.blackPrice)} r={5} fill="#fbbf24" stroke="#0a0c11" />
                    <text x={sx(c.qt) - 7} y={sy(c.blackPrice) - 6} textAnchor="end" fontSize={10.5} fill="#fbbf24">
                      paralelo {brl(c.blackPrice, 2)}
                    </text>
                  </>
                )}
              </>
            )}
            <text x={sx(QD[0]) + 4} y={sy(c.Pd(QD[0])) + 14} fontSize={10.5} fill="#60a5fa">
              demanda
            </text>
            <text x={sx(QD[1]) - 4} y={Math.max(PAD.t + 12, sy(c.Ps(QD[1])) + 14)} textAnchor="end" fontSize={10.5} fill="#f59e0b">
              oferta
            </text>
          </svg>
        </Panel>
        <Panel title="No supermercado">
          <div className="text-xs text-faint">prateleira · {Math.min(100, shelf)}% abastecida</div>
          <div className="mt-2 grid grid-cols-10 gap-1">
            {Array.from({ length: 30 }, (_, i) => (
              <div key={i} className="h-5 rounded-sm" style={{ background: i < Math.round((Math.min(100, shelf) / 100) * 30) ? "#f59e0b" : "#171b24", border: "1px solid #242a38" }} />
            ))}
          </div>
          <div className="mt-4 text-xs text-faint">fila no açougue · {queue === 0 ? "ninguém esperando" : "cada ponto = 2 mil t de demanda não atendida"}</div>
          <div className="mt-2 flex flex-wrap gap-1">
            {Array.from({ length: queue }, (_, i) => (
              <span key={i} className="inline-block size-3 rounded-full bg-bad/70" />
            ))}
          </div>
          <p className="mt-4 font-mono text-[11px] text-faint">
            Qd = 100 − 6·(P − 10) · Qs = 100 + d·(P − 10), d = 4·(1 + meses/4) · peso morto = ½·(Q* − Qt)·(Pd − Ps)
          </p>
        </Panel>
        <div className="grid grid-cols-2 content-start gap-3 lg:grid-cols-1">
          <Stat label="Escassez" value={`${nf(c.shortage, 0)} mil t`} tone={c.shortage > 20 ? "bad" : c.shortage > 0 ? "warn" : "good"} hint={c.binding ? pct((c.shortage / c.Qd(pBar)) * 100, 0) + " da demanda" : "teto não está ativo"} />
          <Stat label="Quantidade vendida" value={`${nf(c.qt, 0)} mil t`} tone={c.qt < 90 ? "bad" : "neutral"} hint={`equilíbrio: ${qStar}`} />
          <Stat label="Peso morto" value={`R$ ${nf(c.dwl, 0)} mi`} tone={c.dwl > 50 ? "bad" : c.dwl > 0 ? "warn" : "good"} hint="trocas que deixaram de acontecer" />
          <Stat label="Ágio no paralelo" value={c.binding ? pct((c.blackPrice / pBar - 1) * 100, 0) : "—"} tone={c.binding ? "bad" : "neutral"} hint="quanto acima da tabela" />
        </div>
      </div>
      {c.binding && m >= 6 && (
        <Callout tone="bad">
          Plano Cruzado (1986): preços congelados abaixo do equilíbrio. No começo o produtor ainda entregava; com os meses, segurou o boi no pasto,
          reduziu a produção e vendeu “por fora” com ágio. A fila e a prateleira vazia não são falha de fiscalização — são a escassez que o teto cria.
        </Callout>
      )}
      <p className="text-xs text-faint">
        Experimente: tabele a carne em R$ 7,50 e clique em “Congelar por 12 meses” — a oferta fica mais elástica com o tempo, e a escassez e o peso morto
        crescem mês a mês.
      </p>
    </div>
  );
}
