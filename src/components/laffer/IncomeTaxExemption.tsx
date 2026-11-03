"use client";

import { useState } from "react";
import { Callout, Controls, Panel, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { range } from "@/lib/random";
import { compensacao, custoIsencao, irNovo, irTabela } from "./lafferModel";
import { brl, num, pct } from "./fmt";

export function IncomeTaxExemption() {
  const [renda, setRenda] = useState(6000);
  const [isencao, setIsencao] = useState(5000);
  const [aliqMin, setAliqMin] = useState(10);

  const antes = irTabela(renda);
  const depois = irNovo(renda, isencao);
  const custo = custoIsencao(isencao);
  const comp = compensacao(aliqMin / 100);
  const saldo = comp - custo;

  const xs = range(61).map((i) => 1000 + i * 250);
  const effOld: [number, number][] = xs.map((r) => [r, (irTabela(r) / r) * 100]);
  const effNew: [number, number][] = xs.map((r) => [r, (irNovo(r, isencao) / r) * 100]);

  return (
    <div className="space-y-3">
      <Controls>
        <Slider className="min-w-52 flex-1" label="Sua renda mensal" value={renda} min={1500} max={16000} step={50} onChange={setRenda} format={(v) => brl(v, 0)} />
        <Slider className="min-w-52 flex-1" label="Isenção até" value={isencao} min={2500} max={10000} step={100} onChange={setIsencao} format={(v) => brl(v, 0)} />
        <Slider className="min-w-52 flex-1" label="Imposto mínimo (alta renda)" value={aliqMin} min={0} max={15} step={0.5} onChange={setAliqMin} format={(v) => pct(v, 1)} />
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <Panel title="Alíquota efetiva do IRPF × renda mensal">
          <LineChart
            height={270}
            xDomain={[1000, 16000]}
            yDomain={[0, 25]}
            xLabel="renda tributável mensal (R$)"
            xFormat={(v) => `${num(v / 1000, 0)} mil`}
            yFormat={(v) => `${v}%`}
            series={[
              { id: "old", label: "Tabela 2025", color: "#8a93a8", dashed: true, points: effOld },
              { id: "new", label: `Com isenção até ${brl(isencao, 0)}`, color: "#f87171", width: 2.5, points: effNew },
            ]}
            bands={[{ from: isencao, to: isencao + 2350, color: "#fbbf24", label: "transição" }]}
            dots={[{ x: renda, y: (depois / renda) * 100, color: "#f87171", label: brl(depois, 0) }]}
          />
          <div className="mt-1 font-mono text-[11px] text-faint">
            imposto = tabela(renda − R$ 607,20) − redução · redução zera o IR até a isenção e cai linearmente nos R$ 2.350 seguintes
          </div>
        </Panel>
        <div className="grid content-start gap-2">
          <Stat label="IR mensal antes" value={brl(antes, 2)} />
          <Stat label="IR mensal depois" value={brl(depois, 2)} tone={depois < antes ? "good" : "neutral"} hint={`economia de ${brl((antes - depois) * 13, 0)}/ano`} />
          <Stat label="Custo da isenção" value={`R$ ${num(custo, 1)} bi/ano`} tone="warn" />
          <Stat label="Compensação (imposto mínimo)" value={`R$ ${num(comp, 1)} bi/ano`} />
          <Stat label="Saldo fiscal" value={`R$ ${num(saldo, 1)} bi`} tone={saldo < -3 ? "bad" : saldo > 3 ? "good" : "neutral"} hint={Math.abs(saldo) <= 3 ? "aproximadamente neutro" : saldo < 0 ? "abre buraco no orçamento" : "aumenta a arrecadação"} />
        </div>
      </div>
      <Callout tone="info">
        A Lei 15.270/2025 zerou o IR de quem ganha até R$ 5 mil a partir de 2026 (custo estimado perto de R$ 26 bi/ano) e criou
        um imposto mínimo de até 10% para rendas acima de R$ 600 mil/ano, além de retenção sobre dividendos altos. Repare como
        o custo cresce rápido ao subir a faixa: há muito mais gente ganhando R$ 5–10 mil do que milionários para compensar.
      </Callout>
      <p className="text-xs text-faint">
        Experimente: suba a isenção para R$ 10 mil e veja o saldo ficar vermelho; depois tente fechar a conta só com o imposto
        mínimo — mesmo 15% não basta. Valores aproximados, contribuintes agrupados em faixas.
      </p>
    </div>
  );
}
