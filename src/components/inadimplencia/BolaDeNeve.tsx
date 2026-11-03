"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button, Callout, Controls, Panel, Segmented, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { useTicker } from "@/lib/useTicker";
import { bolaDeNeve, type BolaParams } from "./creditoModel";
import { br, brl, brlK, pct } from "./fmt";

const N = 36;

export function BolaDeNeve() {
  const [saldo0, setSaldo0] = useState(2000);
  const [juros, setJuros] = useState(13);
  const [rombo, setRombo] = useState(150);
  const [capacidade, setCapacidade] = useState(450);
  const [modo, setModo] = useState<BolaParams["modo"]>("minimo");
  const [teto, setTeto] = useState(false);
  const [mes, setMes] = useState(N);
  const t = useTicker(
    () =>
      setMes((m) => {
        if (m >= N) {
          t.pause();
          return N;
        }
        return m + 1;
      }),
    { speed: 0.12 },
  );

  const serie = useMemo(
    () => bolaDeNeve({ saldo0, juros, rombo, capacidade, minimo: 15, modo, teto }, N),
    [saldo0, juros, rombo, capacidade, modo, teto],
  );
  const vis = serie.slice(0, mes + 1);
  const cur = serie[mes];
  const primeiroAtraso = serie.find((m) => m.atraso > 0)?.t;
  const negMes = serie.find((m) => m.negativado)?.t;
  const aa = ((1 + juros / 100) ** 12 - 1) * 100;
  const ymax = Math.max(...serie.map((m) => m.saldo), saldo0) * 1.1;

  return (
    <div className="space-y-3">
      <Controls>
        <Button variant="primary" onClick={() => (mes >= N ? (setMes(0), t.play()) : t.toggle())}>
          {t.running ? "❚❚ pausar" : "▶ fatura a fatura"}
        </Button>
        <Button onClick={() => (t.pause(), setMes((m) => Math.min(N, m + 1)))}>+1 mês</Button>
        <Segmented
          value={modo}
          onChange={setModo}
          options={[
            { value: "minimo", label: "paga só o mínimo (15%)" },
            { value: "maximo", label: "paga tudo o que pode" },
          ]}
        />
        <Segmented
          value={teto ? "sim" : "nao"}
          onChange={(v) => setTeto(v === "sim")}
          options={[
            { value: "nao", label: "sem teto" },
            { value: "sim", label: "teto de 100% (2024)" },
          ]}
        />
      </Controls>
      <Controls>
        <Slider label="Fatura inicial" value={saldo0} min={500} max={8000} step={100} onChange={setSaldo0} format={(v) => brlK(v)} className="w-full sm:w-64" />
        <Slider label="Juros do rotativo" value={juros} min={2} max={18} step={0.5} onChange={setJuros} format={(v) => `${br(v, 1)}% a.m.`} className="w-full sm:w-72" />
        <Slider label="Rombo mensal no orçamento" value={rombo} min={0} max={600} step={10} onChange={setRombo} format={(v) => brl(v)} className="w-full sm:w-72" />
        <Slider label="Quanto sobra para pagar" value={capacidade} min={100} max={1500} step={10} onChange={setCapacidade} format={(v) => brl(v)} className="w-full sm:w-72" />
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Panel title={`Uma família no cartão · mês ${mes}`}>
          <LineChart
            height={280}
            series={[
              { id: "saldo", label: "saldo da fatura", color: "#f87171", points: vis.map((m) => [m.t, m.saldo]), width: 2.6, area: true },
              { id: "min", label: "pagamento mínimo exigido", color: "#fbbf24", points: vis.map((m) => [m.t, m.minimo]) },
              { id: "pago", label: "pago de fato", color: "#34d399", points: vis.map((m) => [m.t, m.pago]), dashed: true },
            ]}
            xDomain={[0, N]}
            yDomain={[0, ymax]}
            xLabel="mês"
            xFormat={(v) => br(v, 0)}
            yFormat={(v) => brlK(v)}
            hMarkers={[{ y: capacidade, label: "o que sobra no orçamento", color: "#34d399" }]}
            markers={[
              ...(primeiroAtraso !== undefined && primeiroAtraso <= mes ? [{ x: primeiroAtraso, label: "1º atraso", color: "#fbbf24" }] : []),
              ...(negMes !== undefined && negMes <= mes ? [{ x: negMes, label: "negativado", color: "#f87171" }] : []),
            ]}
          />
        </Panel>
        <div className="grid content-start gap-3">
          <Stat label="Taxa equivalente" value={`${br(aa, 0)}% a.a.`} tone={aa > 200 ? "bad" : aa > 60 ? "warn" : "neutral"} hint={`${br(juros, 1)}% ao mês, composto`} />
          <Stat label="Saldo agora" value={brl(cur.saldo)} tone={cur.saldo > saldo0 * 1.5 ? "bad" : "neutral"} hint={`começou em ${brl(saldo0)}`} />
          <Stat label="Encargos cobrados (acum.)" value={brl(cur.encargos)} tone={cur.encargos > saldo0 ? "bad" : "neutral"} hint={`já pagou ${brl(cur.totalPago)} no total`} />
          <Stat
            label="Status"
            value={cur.negativado ? "negativado" : cur.atraso > 0 ? `${cur.atraso} mês(es) em atraso` : "em dia"}
            tone={cur.negativado ? "bad" : cur.atraso > 0 ? "warn" : "good"}
            hint={negMes !== undefined ? `negativação no mês ${negMes}` : "não chega a 90 dias de atraso"}
          />
          <Stat label="Mínimo ÷ o que sobra" value={pct((100 * cur.minimo) / capacidade, 0)} tone={cur.minimo > capacidade ? "bad" : cur.minimo > 0.8 * capacidade ? "warn" : "good"} />
        </div>
      </div>
      {negMes !== undefined && negMes <= mes && (
        <Callout tone="bad">
          Pagando o mínimo, os juros comem quase todo o pagamento e o rombo do mês entra por cima: o saldo cresce, o mínimo (15% do saldo) cresce
          junto e um dia passa do que sobra no orçamento. Três faturas sem pagar o mínimo e o nome vai para o Serasa/SPC. O teto de 2024 freia a
          explosão, mas não impede a inadimplência se o rombo continua.
        </Callout>
      )}
      <p className="font-mono text-xs text-faint">
        Sₜ₊₁ = (Sₜ − Pₜ)·(1 + i + mora) + rombo · Pₜ = min(15%·Sₜ, sobra) · Pₜ &lt; mínimo ⇒ atraso; 3 meses ⇒ negativado · teto: encargos ≤ 100% do
        principal
      </p>
      <p className="text-xs text-faint">
        Experimente: dê play com rombo de R$ 150; depois troque para “paga tudo o que pode” e zere o rombo. Compare as três linhas de crédito no
        capítulo de{" "}
        <Link href="/juros#rotativo" className="text-info underline-offset-2 hover:underline">
          juros
        </Link>
        . Valores ilustrativos.
      </p>
    </div>
  );
}
