"use client";

import { useState } from "react";
import { Callout, Controls, Panel, Segmented, Slider, Stat } from "@/components/ui";
import { DecileBars } from "./DecileBars";
import { CADUNICO_SHARE, GLP_SHARE, porDomicilio, somaBaixo } from "./decis";
import { brl, num, pct } from "./fmt";

/** consumo nacional de botijões P13, aproximado */
const Q0 = 400e6; // botijões/ano

type Modo = "dinheiro" | "botijao";

/** desconto por botijão que esgota `orc` (R$) com demanda Q = Q0·(1 + e·d/P) */
function descontoGeral(orc: number, preco: number, e: number) {
  let d = orc / Q0;
  for (let i = 0; i < 30; i++) d = orc / (Q0 * (1 + (e * d) / preco));
  return { d, q: Q0 * (1 + (e * d) / preco) };
}

export function ValeGas() {
  const [preco, setPreco] = useState(110);
  const [modo, setModo] = useState<Modo>("dinheiro");
  const [valor, setValor] = useState(108); // R$ por bimestre (Auxílio Gás)
  const [quota, setQuota] = useState(6); // botijões/ano (Gás do Povo, aprox.)
  const [consumo, setConsumo] = useState(0.6); // botijões/mês da família
  const [elast, setElast] = useState(0.15);

  const familias = modo === "dinheiro" ? 5.5e6 : 15e6;
  const benefAnual = modo === "dinheiro" ? valor * 6 : Math.min(quota, consumo * 12) * preco;
  const gastoAnual = preco * consumo * 12;
  const cobertura = benefAnual / gastoAnual;
  const custo = familias * benefAnual; // R$/ano
  const custoBi = custo / 1e9;

  const geral = descontoGeral(custo, preco, elast);
  const focal = porDomicilio(custoBi, CADUNICO_SHARE);
  // no subsídio geral a demanda extra também custa; a distribuição segue o consumo
  const geralDist = porDomicilio(custoBi, GLP_SHARE);
  const baixoFocal = somaBaixo(CADUNICO_SHARE, 2);
  const baixoGeral = somaBaixo(GLP_SHARE, 2);

  return (
    <div className="space-y-3">
      <Controls>
        <Segmented
          value={modo}
          onChange={setModo}
          options={[
            { value: "dinheiro", label: "Auxílio Gás (dinheiro)" },
            { value: "botijao", label: "Gás do Povo (botijão)" },
          ]}
        />
        <Slider className="min-w-52 flex-1" label="Preço do botijão 13 kg" value={preco} min={80} max={160} onChange={setPreco} format={(v) => brl(v, 0)} />
        {modo === "dinheiro" ? (
          <Slider className="min-w-52 flex-1" label="Benefício bimestral" value={valor} min={0} max={200} step={2} onChange={setValor} format={(v) => brl(v, 0)} />
        ) : (
          <Slider className="min-w-52 flex-1" label="Botijões grátis por ano" value={quota} min={2} max={8} onChange={setQuota} format={(v) => num(v, 0)} />
        )}
        <Slider className="min-w-52 flex-1" label="Consumo da família" value={consumo} min={0.3} max={1} step={0.05} onChange={setConsumo} format={(v) => `${num(v, 2)}/mês`} />
      </Controls>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Panel title="Quanto do gás da família o benefício paga (um ano)">
          <svg viewBox="0 0 640 120" className="w-full">
            {Array.from({ length: 12 }, (_, i) => {
              const cheio = Math.max(0, Math.min(1, cobertura * 12 - i));
              const x = 14 + i * 52;
              return (
                <g key={i}>
                  <rect x={x} y={20} width={40} height={70} rx={10} fill="#171b24" stroke="#242a38" />
                  <rect x={x} y={Math.round((20 + 70 * (1 - cheio)) * 100) / 100} width={40} height={Math.round(70 * cheio * 100) / 100} rx={10} fill="#c084fc" opacity={0.85} style={{ transition: "all 250ms" }} />
                  <text x={x + 20} y={108} textAnchor="middle" fontSize={10.5} fill="#5a6275">
                    {["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"][i]}
                  </text>
                </g>
              );
            })}
          </svg>
          <p className="mt-1 text-[11px] text-faint">cada barra = gasto de um mês com gás ({brl(preco * consumo, 0)}); a parte roxa é paga pelo programa</p>
          <div className="mt-4">
            <div className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
              O mesmo dinheiro ({brl(custoBi, 1)} bi/ano) gasto de duas formas — R$ por domicílio/mês
            </div>
            <DecileBars
              format={(v) => num(v, 0)}
              series={[
                { id: "f", label: "Transferência focalizada (CadÚnico)", color: "#34d399", values: focal.map((d) => d.mensal) },
                { id: "g", label: "Subsídio no preço para todos", color: "#f87171", values: geralDist.map((d) => d.mensal) },
              ]}
            />
          </div>
          <div className="mt-3">
            <Slider label="Elasticidade-preço da demanda de GLP" value={elast} min={0} max={0.6} step={0.05} onChange={setElast} format={(v) => num(v, 2)} />
          </div>
        </Panel>
        <div className="grid content-start gap-2">
          <Stat label="Cobertura do gasto com gás" value={pct(Math.min(cobertura, 9.99) * 100, 0)} tone={cobertura >= 0.9 ? "good" : cobertura >= 0.5 ? "warn" : "bad"} hint={modo === "dinheiro" ? "valor fixo: se o preço sobe, cobre menos" : "em espécie: o risco de preço fica com o governo"} />
          <Stat label="Benefício por família" value={`${brl(benefAnual / 12, 0)}/mês`} />
          <Stat label="Famílias" value={`${num(familias / 1e6, 1)} mi`} hint="valores aproximados" />
          <Stat label="Custo fiscal" value={`R$ ${num(custoBi, 1)} bi/ano`} tone={custoBi > 8 ? "warn" : "neutral"} />
          <Stat label="Mesmo valor como desconto geral" value={`${brl(geral.d, 2)}/botijão`} tone="bad" hint={`${pct((geral.d / preco) * 100, 1)} do preço — quase imperceptível`} />
          <Stat label="Vai aos 20% mais pobres" value={`${pct(baixoFocal * 100, 0)} × ${pct(baixoGeral * 100, 0)}`} hint="focalizado × subsídio geral" />
          <Stat label="Botijões extras (subsídio geral)" value={`+${num((geral.q - Q0) / 1e6, 1)} mi/ano`} hint="efeito demanda: o subsídio paga também o consumo novo" />
        </div>
      </div>
      <Callout tone="info">
        O Auxílio Gás (desde 2021) paga em dinheiro, a cada dois meses, um valor próximo ao preço médio de um botijão. O Gás do
        Povo, anunciado em 2025, troca o dinheiro por recargas gratuitas retiradas em revendas credenciadas, para um público
        maior. Regras, valores e alcance aqui são aproximados. A troca de dinheiro por benefício em espécie garante o uso no gás e
        protege a família de altas de preço, mas tira liberdade de escolha e transfere ao governo o risco de preço e o custo de
        credenciar e fiscalizar revendas.
      </Callout>
      <p className="font-mono text-[11px] text-faint">
        cobertura = benefício anual ÷ (preço × consumo × 12) · subsídio geral: d · Q₀ · (1 + ε·d/P) = mesmo orçamento
      </p>
      <p className="text-xs text-faint">
        Experimente: no modo dinheiro, suba o preço do botijão para R$ 150 sem mexer no benefício — a cobertura cai. Troque para
        Gás do Povo e repita: a cobertura não muda, mas o custo fiscal sobe. Depois compare as barras: o desconto para todos
        espalha o dinheiro quase igualmente entre ricos e pobres.
      </p>
    </div>
  );
}
