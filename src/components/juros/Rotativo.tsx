"use client";

import { useMemo, useState } from "react";
import { Button, Callout, Controls, Panel, Segmented, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { useTicker } from "@/lib/useTicker";
import { aaToAm, divida, type Pagamento } from "./jurosModel";
import { br, brl, brlK, pct } from "./fmtBR";

const N = 36;
const LINHAS = [
  { id: "rot", label: "Rotativo do cartão", aa: 430, color: "#f87171", teto: true },
  { id: "che", label: "Cheque especial (teto 8% a.m.)", aa: 150, color: "#fbbf24", teto: false },
  { id: "con", label: "Consignado", aa: 25, color: "#34d399", teto: false },
];

export function Rotativo() {
  const [p0, setP0] = useState(2000);
  const [pag, setPag] = useState<Pagamento>("minimo");
  const [fixo, setFixo] = useState(250);
  const [teto, setTeto] = useState(true);
  const [mes, setMes] = useState(N);
  const t = useTicker(
    () => {
      setMes((m) => {
        if (m >= N) {
          t.pause();
          return N;
        }
        return m + 1;
      });
    },
    { speed: 0.12 },
  );

  const res = useMemo(
    () => LINHAS.map((l) => ({ l, r: divida(p0, aaToAm(l.aa), N, pag, fixo, 15, l.teto && teto) })),
    [p0, pag, fixo, teto],
  );
  const rot = res[0];
  const con = res[2];
  const saldoRot = rot.r.saldo[mes][1];
  const jurosMes1 = (p0 * aaToAm(430)) / 100;

  return (
    <div className="space-y-3">
      <Controls>
        <Button variant="primary" onClick={() => (mes >= N ? (setMes(0), t.play()) : t.toggle())}>
          {t.running ? "❚❚ pausar" : "▶ mês a mês"}
        </Button>
        <Button onClick={() => (t.pause(), setMes((m) => Math.min(N, m + 1)))}>+1 mês</Button>
        <Button variant="ghost" onClick={() => (t.pause(), setMes(0))}>
          zerar
        </Button>
        <Slider label="Dívida" value={p0} min={500} max={10000} step={100} onChange={setP0} format={(v) => brlK(v)} className="w-full sm:w-60" />
        <Segmented
          value={pag}
          onChange={setPag}
          options={[
            { value: "minimo", label: "paga o mínimo (15%)" },
            { value: "fixo", label: "parcela fixa" },
            { value: "nada", label: "não paga" },
          ]}
        />
        {pag === "fixo" && (
          <Slider label="Pagamento" value={fixo} min={50} max={1500} step={10} onChange={setFixo} format={(v) => brlK(v)} className="w-full sm:w-60" />
        )}
        <label className="flex items-center gap-2 text-muted">
          <input type="checkbox" checked={teto} onChange={(e) => setTeto(e.target.checked)} />
          teto de juros de 100% do principal (Lei 14.690, desde jan/2024)
        </label>
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Panel title={`Saldo devedor · mês ${mes} de ${N}`}>
          <LineChart
            series={res.map(({ l, r }) => ({ id: l.id, label: `${l.label} · ${br(l.aa, 0)}% a.a.`, color: l.color, points: r.saldo.slice(0, mes + 1), width: 2.4 }))}
            xDomain={[0, N]}
            yDomain={[0, Math.max(p0 * 1.2, ...res.map(({ r }) => Math.max(...r.saldo.map((s) => s[1])))) * 1.05]}
            xLabel="mês"
            xFormat={(v) => br(v, 0)}
            yFormat={(v) => brlK(v)}
            hMarkers={[
              { y: p0, label: "dívida original", color: "#5a6275" },
              ...(teto && pag === "nada" ? [{ y: 2 * p0, label: "teto: principal + 100%", color: "#f87171" }] : []),
            ]}
          />
        </Panel>
        <div className="grid content-start gap-3">
          <Stat label="Rotativo: taxa mensal" value={pct(aaToAm(430), 1)} tone="bad" hint={`juros do 1º mês: ${brl(jurosMes1, 0)}`} />
          <Stat
            label={`Rotativo: saldo no mês ${mes}`}
            value={brl(saldoRot, 0)}
            tone={saldoRot > p0 ? "bad" : saldoRot > 0 ? "warn" : "good"}
            hint={rot.r.quitou ? `quitado no mês ${rot.r.quitou}` : "não quitou em 36 meses"}
          />
          <Stat label="Rotativo: juros cobrados (36m)" value={brl(rot.r.juros, 0)} tone="bad" hint={`pagou ${brl(rot.r.pago, 0)} no total`} />
          <Stat
            label="Consignado: juros (36m)"
            value={brl(con.r.juros, 0)}
            tone="good"
            hint={con.r.quitou ? `quitado no mês ${con.r.quitou}` : `saldo final ${brl(con.r.saldo[N][1], 0)}`}
          />
          <Stat label="Trocar de dívida economiza" value={brl(rot.r.juros - con.r.juros, 0)} tone="good" hint="portabilidade / crédito mais barato" />
        </div>
      </div>
      {pag === "minimo" && (
        <Callout tone="bad">
          A armadilha do mínimo: pagando 15% de uma fatura que cresce ~{br(aaToAm(430), 0)}% ao mês, o saldo cai só{" "}
          {br((1 - 0.85 * (1 + aaToAm(430) / 100)) * 100, 1)}% por mês — e a maior parte do que você paga é juro.
          {teto ? " O teto de 2024 limita o total de juros e encargos a 100% do valor original." : " Sem teto, os juros podem somar várias vezes o principal."}
        </Callout>
      )}
      <p className="font-mono text-xs text-faint">
        saldoₜ₊₁ = (saldoₜ + jurosₜ) − pagamentoₜ · jurosₜ = saldoₜ·i · com teto: Σ juros ≤ principal · i_mensal = (1 + i_anual)^(1/12) − 1
      </p>
      <p className="text-xs text-faint">
        Experimente: escolha &quot;não paga&quot; e desligue o teto — a dívida do rotativo explode; religue o teto e veja ela parar em 2× o principal. Taxas médias aproximadas (BCB).
      </p>
    </div>
  );
}
