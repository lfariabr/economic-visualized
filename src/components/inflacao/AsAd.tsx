"use client";

import { useState } from "react";
import { Button, Callout, Controls, Panel, Segmented, Slider, Stat } from "@/components/ui";
import { YN, adCurve, asad, srasCurve } from "./inflacaoModel";
import { br } from "./num";

type Horizon = "curto" | "longo";
const W = 640,
  H = 340,
  PAD = { l: 48, r: 16, t: 14, b: 38 };
const YMIN = 84,
  YMAX = 116,
  PMIN = 80,
  PMAX = 125;
const r2 = (v: number) => Math.round(v * 100) / 100;
const sx = (y: number) => r2(PAD.l + ((y - YMIN) / (YMAX - YMIN)) * (W - PAD.l - PAD.r));
const sy = (p: number) => r2(PAD.t + (1 - (p - PMIN) / (PMAX - PMIN)) * (H - PAD.t - PAD.b));
const line = (f: (y: number) => number) => `M${sx(YMIN)},${sy(f(YMIN))}L${sx(YMAX)},${sy(f(YMAX))}`;

export function AsAd() {
  const [d, setD] = useState(0);
  const [z, setZ] = useState(0);
  const [hz, setHz] = useState<Horizon>("curto");
  const lr = hz === "longo";
  const eq = asad(d, z, lr);
  const pe = lr ? 100 + d : 100;
  const zz = lr ? 0 : z;
  const dP = eq.P - 100;
  const dY = eq.Y - YN;
  const kind =
    Math.abs(dP) < 0.05 && Math.abs(dY) < 0.05
      ? "neutro"
      : lr
        ? "longo"
        : Math.sign(dP) === Math.sign(dY) || Math.abs(dY) < 0.05 || Math.abs(dP) < 0.05
          ? dP > 0
            ? "demanda+"
            : "demanda-"
          : dP > 0
            ? "estagflacao"
            : "oferta+";
  const msg: Record<string, string> = {
    neutro: "Economia no potencial, preços estáveis.",
    "demanda+": "Choque de demanda: preços e produção sobem juntos. É o caso clássico para o BC subir juros.",
    "demanda-": "Demanda caindo: preços e produção caem juntos — recessão com desinflação.",
    estagflacao: "Estagflação: preços sobem e produção cai. O BC enfrenta um dilema — subir juros combate a inflação, mas aprofunda a queda do PIB.",
    "oferta+": "Choque de oferta favorável: mais produção com preços menores.",
    longo: "No longo prazo, as expectativas se ajustam e o choque de oferta se dissipa: o produto volta ao potencial e só sobra o efeito da demanda nos preços.",
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0 space-y-3">
        <Controls>
          <Slider label="Demanda agregada (deslocamento)" value={d} min={-15} max={15} step={0.5} onChange={setD} format={(x) => br(x)} className="w-full sm:w-[48%]" />
          <Slider label="Choque de custos (oferta)" value={z} min={-15} max={15} step={0.5} onChange={setZ} format={(x) => br(x)} className="w-full sm:w-[48%]" />
          <Segmented<Horizon>
            value={hz}
            onChange={setHz}
            options={[
              { value: "curto", label: "Curto prazo" },
              { value: "longo", label: "Longo prazo" },
            ]}
          />
          <div className="flex flex-wrap gap-2">
            <Button className="text-xs" onClick={() => setD(d + 6)}>
              💸 Estímulo fiscal
            </Button>
            <Button className="text-xs" onClick={() => setD(d - 6)}>
              📉 Crise de confiança
            </Button>
            <Button className="text-xs" onClick={() => setZ(z + 8)}>
              🛢️ Petróleo / seca
            </Button>
            <Button className="text-xs" onClick={() => setZ(z - 6)}>
              🌾 Supersafra
            </Button>
            <Button
              variant="ghost"
              className="text-xs"
              onClick={() => {
                setD(0);
                setZ(0);
              }}
            >
              Zerar
            </Button>
          </div>
        </Controls>
        <Panel title="Oferta e demanda agregadas">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
            <defs>
              <clipPath id="asad-clip">
                <rect x={PAD.l} y={PAD.t} width={W - PAD.l - PAD.r} height={H - PAD.t - PAD.b} />
              </clipPath>
            </defs>
            {[85, 90, 95, 100, 105, 110, 115].map((y) => (
              <text key={y} x={sx(y)} y={H - PAD.b + 15} fontSize={10.5} fill="#5a6275" textAnchor="middle">
                {y}
              </text>
            ))}
            {[80, 90, 100, 110, 120].map((p) => (
              <g key={p}>
                <line x1={PAD.l} x2={W - PAD.r} y1={sy(p)} y2={sy(p)} stroke="#242a38" />
                <text x={PAD.l - 6} y={sy(p) + 3.5} fontSize={10.5} fill="#5a6275" textAnchor="end">
                  {p}
                </text>
              </g>
            ))}
            <text x={(W + PAD.l) / 2} y={H - 6} fontSize={11} fill="#8a93a8" textAnchor="middle">
              produto real (Y, potencial = 100)
            </text>
            <text transform={`translate(13 ${(H - PAD.b) / 2}) rotate(-90)`} fontSize={11} fill="#8a93a8" textAnchor="middle">
              nível de preços (P)
            </text>
            <g clipPath="url(#asad-clip)">
              <line x1={sx(YN)} x2={sx(YN)} y1={PAD.t} y2={H - PAD.b} stroke="#8a93a8" strokeDasharray="4 4" />
              <path d={line((y) => adCurve(y, 0))} stroke="#60a5fa" strokeWidth={1.5} opacity={0.35} fill="none" strokeDasharray="5 4" />
              <path d={line((y) => srasCurve(y, 100, 0))} stroke="#fb923c" strokeWidth={1.5} opacity={0.35} fill="none" strokeDasharray="5 4" />
              <path d={line((y) => adCurve(y, d))} stroke="#60a5fa" strokeWidth={2.5} fill="none" />
              <path d={line((y) => srasCurve(y, pe, zz))} stroke="#fb923c" strokeWidth={2.5} fill="none" />
              <line x1={sx(eq.Y)} x2={sx(eq.Y)} y1={sy(eq.P)} y2={H - PAD.b} stroke="#e7e9f0" strokeDasharray="2 3" opacity={0.5} />
              <line x1={PAD.l} x2={sx(eq.Y)} y1={sy(eq.P)} y2={sy(eq.P)} stroke="#e7e9f0" strokeDasharray="2 3" opacity={0.5} />
            </g>
            <text x={sx(YN) + 5} y={PAD.t + 12} fontSize={10.5} fill="#8a93a8">
              OA longo prazo
            </text>
            <text x={sx(YMIN + 1.5)} y={sy(adCurve(YMIN + 1.5, d)) - 6} fontSize={10.5} fill="#60a5fa">
              DA
            </text>
            <text x={sx(YMAX - 3)} y={sy(srasCurve(YMAX - 3, pe, zz)) - 6} fontSize={10.5} fill="#fb923c">
              OA curto prazo
            </text>
            <circle cx={sx(100)} cy={sy(100)} r={4} fill="#5a6275" />
            <circle cx={sx(eq.Y)} cy={sy(eq.P)} r={6} fill="#facc15" stroke="#0a0c11" strokeWidth={1.5} />
          </svg>
        </Panel>
        <p className="font-mono text-xs text-muted">DA: P = 100 + d − (Y − Yₙ) · OA: P = Pe + z + 0,5·(Y − Yₙ)</p>
        <p className="text-xs text-faint">
          Experimente: clique em “Estímulo fiscal” e depois em “Petróleo / seca”. No primeiro, preço e produto andam juntos; no segundo,
          em sentidos opostos. Mude para “Longo prazo” para ver o que resta quando as expectativas se ajustam.
        </p>
      </div>
      <div className="grid content-start gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <Stat label="Variação de preços" value={`${dP >= 0 ? "+" : ""}${br(dP)}%`} tone={dP > 2 ? "bad" : dP < -2 ? "warn" : "neutral"} />
        <Stat label="Hiato do produto" value={`${dY >= 0 ? "+" : ""}${br(dY)}%`} tone={dY < -1 ? "bad" : dY > 1 ? "warn" : "neutral"} />
        <Callout tone={kind === "estagflacao" ? "bad" : kind === "neutro" ? "info" : "accent"}>{msg[kind]}</Callout>
      </div>
    </div>
  );
}
