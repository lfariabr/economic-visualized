"use client";

import { useMemo, useState } from "react";
import { Button, Callout, Controls, Panel, Segmented, Slider, Stat } from "@/components/ui";
import { LineChart } from "@/components/viz/Chart";
import { useTicker } from "@/lib/useTicker";
import { FamiliasGrid } from "./FamiliasGrid";
import { ESCALA, JANELA, PROGRAMA_DEFAULT, RODADA_MES, SIM_DEFAULT, SM, rodarCenario, type Programa, type SimParams } from "./familiasSim";
import { br, brl, brlK, pct, pp } from "./fmt";

const MESES = 72;

const MACRO: Record<string, { label: string; p: Partial<SimParams> }> = {
  hoje: { label: "Brasil hoje", p: {} },
  aperto: { label: "desemprego 10% + Selic 20%", p: { desemprego: 10, selic: 20 } },
  folga: { label: "desemprego 5% + Selic 10%", p: { desemprego: 5, selic: 10 } },
};

export function DesenrolaSim() {
  const [ligado, setLigado] = useState(true);
  const [macro, setMacro] = useState("hoje");
  const [desconto, setDesconto] = useState(PROGRAMA_DEFAULT.desconto);
  const [jurosMax, setJurosMax] = useState(PROGRAMA_DEFAULT.jurosMax);
  const [faixaSM, setFaixaSM] = useState(PROGRAMA_DEFAULT.faixaSM);
  const [tetoDivida, setTetoDivida] = useState(PROGRAMA_DEFAULT.tetoDivida);
  const [fgo, setFgo] = useState(PROGRAMA_DEFAULT.fgo);
  const [limpeza, setLimpeza] = useState(PROGRAMA_DEFAULT.limpeza);
  const [rodadas, setRodadas] = useState(PROGRAMA_DEFAULT.rodadas);
  const [expectativa, setExpectativa] = useState(PROGRAMA_DEFAULT.expectativa);
  const [mes, setMes] = useState(MESES);

  const p: SimParams = { ...SIM_DEFAULT, ...MACRO[macro].p };
  const prog: Programa = { desconto, jurosMax, faixaSM, tetoDivida, fgo, limpeza, rodadas, expectativa };
  const pk = JSON.stringify(p);
  const gk = JSON.stringify(prog);
  const sem = useMemo(() => rodarCenario(JSON.parse(pk) as SimParams, null, MESES), [pk]);
  const com = useMemo(() => rodarCenario(JSON.parse(pk) as SimParams, JSON.parse(gk) as Programa, MESES), [pk, gk]);

  const t = useTicker(
    () =>
      setMes((m) => {
        if (m >= MESES) {
          t.pause();
          return MESES;
        }
        return m + 1;
      }),
    { speed: 0.15 },
  );

  const cen = ligado ? com : sem;
  const a = cen.aggs[mes];
  const a0 = sem.aggs[mes];
  const rodadasMes = RODADA_MES.slice(0, rodadas);
  const ultima = rodadasMes[rodadasMes.length - 1] + JANELA;
  const fimSem = sem.aggs[MESES].inad;
  const fimCom = com.aggs[MESES].inad;
  const melhor = Math.min(...com.aggs.slice(rodadasMes[0], rodadasMes[0] + 12).map((x) => x.inad));
  const pessoas = (n: number) => `${br((n * ESCALA) / 1e6, 1)} mi`;
  const fgoEsgotado = com.usoFgo >= fgo * 1e9 * 5 * 0.97;
  const estMax = Math.max(...com.aggs.map((x) => x.estrategicos));
  const ymax = Math.max(25, ...sem.aggs.map((x) => x.inad), ...com.aggs.map((x) => x.inad)) * 1.1;

  return (
    <div className="space-y-3">
      <Controls>
        <Button variant={ligado ? "default" : "primary"} onClick={() => setLigado((l) => !l)}>
          {ligado ? "✕ desligar o Desenrola" : "▶ lançar Desenrola"}
        </Button>
        <Button onClick={() => (mes >= MESES ? (setMes(0), t.play()) : t.toggle())}>{t.running ? "❚❚ pausar" : "▶ mês a mês"}</Button>
        <Button variant="ghost" onClick={() => (t.pause(), setMes(0))}>
          zerar
        </Button>
        <div className="flex items-center gap-2 text-xs text-muted">
          rodadas:
          <Segmented
            value={String(rodadas)}
            onChange={(v) => setRodadas(Number(v))}
            options={[
              { value: "1", label: "Desenrola 1" },
              { value: "2", label: "1 + 2" },
              { value: "3", label: "1 + 2 + 3" },
            ]}
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          economia:
          <Segmented value={macro} onChange={setMacro} options={Object.entries(MACRO).map(([value, m]) => ({ value, label: m.label }))} />
        </div>
      </Controls>
      <Controls>
        <Slider label="Desconto médio (leilão)" value={desconto} min={0} max={95} step={5} onChange={setDesconto} format={(v) => pct(v, 0)} className="w-full sm:w-72" />
        <Slider label="Juros máx. da renegociação" value={jurosMax} min={0.5} max={6} step={0.01} onChange={setJurosMax} format={(v) => `${br(v, 2)}% a.m.`} className="w-full sm:w-80" />
        <Slider label="Renda elegível (Faixa 1)" value={faixaSM} min={1} max={6} step={0.5} onChange={setFaixaSM} format={(v) => `${br(v, 1)} SM`} className="w-full sm:w-72" />
        <Slider label="Teto por dívida" value={tetoDivida} min={1000} max={20000} step={500} onChange={setTetoDivida} format={(v) => brlK(v)} className="w-full sm:w-64" />
        <Slider label="Garantia do governo (FGO)" value={fgo} min={0} max={20} step={0.5} onChange={setFgo} format={(v) => `R$ ${br(v, 1)} bi`} className="w-full sm:w-72" />
        <Slider label="Limpar nome de dívidas até" value={limpeza} min={0} max={2000} step={50} onChange={setLimpeza} format={(v) => brl(v)} className="w-full sm:w-72" />
        <Slider
          label="Expectativa de nova rodada (risco moral)"
          value={expectativa}
          min={0}
          max={100}
          step={5}
          onChange={setExpectativa}
          format={(v) => pct(v, 0)}
          className="w-full sm:w-96"
        />
      </Controls>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="grid min-w-0 gap-4 xl:grid-cols-[1fr_1.1fr]">
          <Panel title={`${ligado ? "Com" : "Sem"} programa · mês ${mes}`}>
            <FamiliasGrid codes={cen.codes[mes]} />
          </Panel>
          <Panel title="Inadimplência: com × sem programa">
            <LineChart
              height={330}
              width={460}
              series={[
                { id: "sem", label: "sem programa", color: "#8a93a8", points: sem.aggs.map((x) => [x.t, x.inad]), dashed: true },
                ...(ligado
                  ? [
                      { id: "com", label: "com Desenrola", color: "#f472b6", points: com.aggs.map((x) => [x.t, x.inad] as [number, number]), width: 2.6 },
                      { id: "est", label: "pararam de pagar à espera (%)", color: "#fbbf24", points: com.aggs.map((x) => [x.t, (100 * x.estrategicos) / 300] as [number, number]) },
                    ]
                  : []),
              ]}
              xDomain={[0, MESES]}
              yDomain={[0, ymax]}
              xLabel="mês"
              xFormat={(v) => br(v, 0)}
              yFormat={(v) => `${br(v, 0)}%`}
              bands={ligado ? rodadasMes.map((s, i) => ({ from: s, to: s + JANELA, color: "#60a5fa", label: `D${i + 1}` })) : []}
              markers={[{ x: mes, color: "#e7e9f0" }]}
            />
          </Panel>
        </div>
        <div className="grid content-start gap-3">
          <Stat
            label={`Inadimplência no mês ${mes}`}
            value={pct(a.inad, 1)}
            tone={ligado ? (a.inad < a0.inad - 0.5 ? "good" : a.inad > a0.inad + 0.5 ? "bad" : "neutral") : "neutral"}
            hint={ligado ? `${pp(a.inad - a0.inad)} vs. sem programa` : "cenário sem programa"}
          />
          <Stat
            label="Renegociaram pelo programa"
            value={`${com.renegUnicas} famílias`}
            hint={`≈ ${pessoas(com.renegUnicas)} de famílias${com.limpos ? ` · ${com.limpos} com nome limpo (dívida pequena)` : ""}`}
          />
          <Stat
            label="Reincidência"
            value={`${br(com.reinc12, 0)}% · ${br(com.reinc24, 0)}%`}
            tone={com.reinc24 > 30 ? "bad" : com.reinc24 > 15 ? "warn" : "good"}
            hint="renegociados negativados de novo em 12 · 24 meses"
          />
          <Stat
            label="Custo fiscal (FGO)"
            value={brlK(com.custoFgo)}
            tone={com.custoFgo > fgo * 1e9 * 0.6 ? "bad" : "neutral"}
            hint={`garantia usada: ${brlK(com.usoFgo)} de ${brlK(fgo * 1e9 * 5)}${fgoEsgotado ? " — esgotada" : ""}`}
          />
          <Stat
            label="Pararam de pagar à espera"
            value={`${a.estrategicos} famílias`}
            tone={a.estrategicos > 8 ? "bad" : a.estrategicos > 3 ? "warn" : "neutral"}
            hint={`pico: ${estMax} · risco moral`}
          />
        </div>
      </div>
      {ligado && fimCom > fimSem + 1 && (
        <Callout tone="bad">
          Depois de {rodadas === 1 ? "uma rodada" : `${rodadas} rodadas`}, a inadimplência no mês {MESES} ficou <strong>acima</strong> do cenário
          sem programa ({pct(fimCom, 1)} vs. {pct(fimSem, 1)}). A queda inicial (mínimo de {pct(melhor, 1)}) foi real, mas quem passou a esperar a
          próxima rodada parou de pagar: o desconto vira um prêmio para atrasar. Baixe a expectativa ou limite as rodadas e compare.
        </Callout>
      )}
      {ligado && fimCom <= fimSem + 1 && mes >= ultima && (
        <Callout tone="ok">
          A renegociação tirou famílias da negativação e devolveu acesso a crédito. Repare que parte volta a atrasar (reincidência): desconto
          resolve o estoque de dívida, não a renda que faltou — desemprego e imprevistos continuam lá.
        </Callout>
      )}
      {ligado && fgoEsgotado && (
        <Callout tone="info">
          A garantia acabou antes de atender todos os elegíveis: com FGO de R$ {br(fgo, 1)} bi, os bancos só renegociam até ~5× esse valor em
          dívidas garantidas. Mais garantia = mais adesão, mas também mais custo fiscal se houver reincidência.
        </Callout>
      )}
      <p className="font-mono text-xs text-faint">
        elegível: negativado, renda ≤ {br(faixaSM, 1)} SM ({brl(faixaSM * SM)}), cada dívida ≤ {brl(tetoDivida)} · saldo novo = saldo·(1 − desconto) ·
        parcela = B·j/(1 − (1+j)⁻⁶⁰), j ≤ {br(jurosMax, 2)}% a.m. · custo FGO = saldo de quem reincide · P(parar de pagar) ∝ expectativa × rodadas já
        feitas
      </p>
      <p className="text-xs text-faint">
        Experimente: com Desenrola 1 e expectativa 0%, veja a curva rosa cair abaixo da cinza; depois escolha “1 + 2 + 3” e suba a expectativa
        para 70%. Rodadas 2 e 3 são hipotéticas — parâmetros ajustáveis, não regras legais. Mesmo sorteio de choques nos dois cenários.
      </p>
    </div>
  );
}
