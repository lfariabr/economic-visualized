"use client";

import { useState } from "react";
import { Button, Callout, Controls, Panel, Slider, Stat } from "@/components/ui";
import { PIT, labor } from "./phillipsModel";
import { br, pct } from "./num";

const W = 680;

export function LaborMarket() {
  const [part, setPart] = useState(0.62);
  const [unemp, setUnemp] = useState(0.06);
  const [informal, setInformal] = useState(0.38);
  const [subocup, setSubocup] = useState(0.045);
  const [desalent, setDesalent] = useState(3);
  const [back, setBack] = useState(0);
  const L = labor({ part, unemp, informal, subocup, desalent, returnFrac: back });
  const base = labor({ part, unemp, informal, subocup, desalent, returnFrac: 0 });

  const segs = [
    { id: "formais", label: "ocupados formais", value: L.formais, color: "#34d399" },
    { id: "informais", label: "ocupados informais", value: L.informais, color: "#fbbf24" },
    { id: "desoc", label: "desocupados", value: L.desoc, color: "#f87171" },
    { id: "desal", label: "desalentados", value: L.desal, color: "#a78bfa" },
    { id: "fora", label: "outros fora da força", value: L.fora, color: "#3a4256" },
  ];
  const sc = (v: number) => (v / PIT) * (W - 20);
  let acc = 0;
  // subocupados: parte dos ocupados (desenhados sobre o fim dos informais/formais)
  const suboX = 10 + sc(L.ocup - L.subo);

  return (
    <div className="space-y-3">
      <Controls>
        <Slider className="min-w-52 flex-1" label="taxa de participação" value={part} min={0.55} max={0.68} step={0.005} onChange={setPart} format={(v) => pct(v * 100)} />
        <Slider className="min-w-52 flex-1" label="desemprego" value={unemp} min={0.04} max={0.15} step={0.001} onChange={setUnemp} format={(v) => pct(v * 100)} />
        <Slider className="min-w-52 flex-1" label="informalidade" value={informal} min={0.2} max={0.5} step={0.005} onChange={setInformal} format={(v) => pct(v * 100)} />
      </Controls>
      <Controls>
        <Slider className="min-w-52 flex-1" label="subocupados (% ocupados)" value={subocup} min={0} max={0.1} step={0.005} onChange={setSubocup} format={(v) => pct(v * 100)} />
        <Slider className="min-w-52 flex-1" label="desalentados" value={desalent} min={1} max={6} step={0.1} onChange={setDesalent} format={(v) => `${br(v, 1)} mi`} />
        <Button onClick={() => setBack(back > 0 ? 0 : 1)} variant={back > 0 ? "primary" : "default"}>
          {back > 0 ? "↺ desalentados desistem de novo" : "desalentados voltam a procurar"}
        </Button>
      </Controls>
      <Panel title={`População em idade de trabalhar: ${br(PIT, 0)} milhões`} right={<span className="font-mono text-[11px] text-faint">estilo PNAD Contínua · aproximado</span>}>
        <svg viewBox={`0 0 ${W} 120`} className="w-full">
          {segs.map((s) => {
            const x = 10 + sc(acc);
            acc += s.value;
            return (
              <rect key={s.id} x={Math.round(x * 10) / 10} y={20} width={Math.max(0, Math.round(sc(s.value) * 10) / 10)} height={44} fill={s.color} opacity={0.85} />
            );
          })}
          <rect x={Math.round(suboX * 10) / 10} y={20} width={Math.round(sc(L.subo) * 10) / 10} height={44} fill="url(#subo-hatch)" />
          <defs>
            <pattern id="subo-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" stroke="#0a0c11" strokeWidth="2.5" />
            </pattern>
          </defs>
          <line x1={10} x2={10 + sc(L.ft)} y1={12} y2={12} stroke="#8a93a8" />
          <text x={10} y={9} fontSize={11} fill="#8a93a8">
            força de trabalho {br(L.ft, 1)} mi
          </text>
          <line x1={10} x2={10 + sc(L.ocup)} y1={74} y2={74} stroke="#8a93a8" />
          <text x={10} y={88} fontSize={11} fill="#8a93a8">
            ocupados {br(L.ocup, 1)} mi
          </text>
          <text x={Math.min(suboX, W - 150)} y={104} fontSize={11} fill="#e7e9f0">
            ▧ subocupados {br(L.subo, 1)} mi
          </text>
        </svg>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          {segs.map((s) => (
            <span key={s.id} className="inline-flex items-center gap-1.5">
              <span className="inline-block size-2.5 rounded-sm" style={{ background: s.color }} />
              {s.label}: {br(s.value, 1)} mi
            </span>
          ))}
        </div>
      </Panel>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Stat label="taxa de desemprego" value={pct(L.rate)} tone={L.rate > base.rate + 0.1 ? "bad" : L.rate > 9 ? "bad" : "neutral"} hint="desocupados / força de trabalho" />
        <Stat label="subutilização" value={pct(L.subutil)} tone={L.subutil > 20 ? "bad" : "warn"} hint="desoc. + subocup. + potencial" />
        <Stat label="participação" value={pct(L.partRate)} />
        <Stat label="informais" value={`${br(L.informais, 1)} mi`} tone={informal > 0.4 ? "warn" : "neutral"} hint="sem carteira, conta própria sem CNPJ…" />
        <Stat label="formais" value={`${br(L.formais, 1)} mi`} />
      </div>
      {back > 0 && (
        <Callout tone="accent">
          Nada mudou na economia — só {br(desalent, 1)} milhão(ões) de pessoas voltaram a procurar emprego. Mesmo assim a taxa de
          desemprego subiu de {pct(base.rate)} para {pct(L.rate)}. Por isso olhar só a taxa de desemprego engana: na recuperação,
          desemprego pode subir porque o mercado melhorou.
        </Callout>
      )}
      <p className="font-mono text-[11px] text-faint">
        desemprego = desocupados / (ocupados + desocupados) · subutilização = (desocupados + subocupados + força potencial) / força
        ampliada
      </p>
      <p className="text-xs text-faint">
        Experimente: clique em “desalentados voltam a procurar” e veja a taxa de desemprego subir sem nenhum emprego perdido; depois
        suba a informalidade para 45% — a taxa de desemprego não muda, mas a qualidade do emprego sim.
      </p>
    </div>
  );
}
