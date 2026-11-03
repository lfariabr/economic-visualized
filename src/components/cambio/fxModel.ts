/* Modelos do capítulo de câmbio. Todos simplificados e educativos; valores aproximados de 2025–26. */

export const E0 = 5.4;

/* ───────────── 1. Mercado de câmbio: oferta e demanda de dólares (US$ bi/mês) ─────────────
 * Oferta de US$:  S(E) = s0 + σ·(E − 5,40)   (s0 = exportações + IDP + portfólio + remessas recebidas)
 * Demanda de US$: D(E) = d0 − δ·(E − 5,40)   (d0 = importações + lucros e dividendos + turismo + saída de capital)
 * ⇒ E* = 5,40 + (d0 − s0)/(σ + δ)
 */
export type FxFlows = {
  exports: number;
  fdi: number;
  portfolio: number;
  remitIn: number;
  imports: number;
  profits: number;
  tourism: number;
  outflow: number;
};
export const FX_BASE: FxFlows = { exports: 29, fdi: 6, portfolio: 2, remitIn: 0.5, imports: 23, profits: 5.5, tourism: 1.5, outflow: 7.5 };
export const FX_SLOPE = { sigma: 7, delta: 7 };
export function fxMarket(f: FxFlows) {
  const s0 = f.exports + f.fdi + f.portfolio + f.remitIn;
  const d0 = f.imports + f.profits + f.tourism + f.outflow;
  const E = Math.max(2.5, E0 + (d0 - s0) / (FX_SLOPE.sigma + FX_SLOPE.delta));
  const Q = s0 + FX_SLOPE.sigma * (E - E0);
  return { s0, d0, E, Q };
}

/* ───────────── 2. Paridade descoberta de juros + fluxo de capital ─────────────
 * carry = i − i* − ρ (diferencial de juros menos risco-país)
 * UIP com expectativas regressivas: investidor exige carry_req = c0 + γ·100·(ln Ē − ln E)
 *   (quanto mais apreciado o real, maior a depreciação esperada e maior o carry exigido)
 * fluxo f = κ·(carry − carry_req) (US$ bi/mês);  ln E(t+1) = ln E(t) − η·f
 * ⇒ equilíbrio: E* = Ē·exp(−(carry − c0)/(100γ)), depreciação esperada = i − i* − ρ
 */
export const UIP = { c0: 9, gamma: 0.4, kappa: 2, eta: 0.004, Ebar: E0 };
export function uipTarget(carry: number) {
  return UIP.Ebar * Math.exp(-(carry - UIP.c0) / (100 * UIP.gamma));
}
export function uipStep(E: number, carry: number) {
  const req = UIP.c0 + UIP.gamma * 100 * (Math.log(UIP.Ebar) - Math.log(E));
  const flow = UIP.kappa * (carry - req);
  return { flow, E: Math.exp(Math.log(E) - UIP.eta * flow) };
}

/* ───────────── 3. Repasse cambial ao IPCA ─────────────
 * choque no câmbio de x% no mês t0; repasse de longo prazo aos comercializáveis = φ;
 * distribuição de defasagem geométrica com média L meses: w(k) = (1 − λ)·λ^k, λ = L/(1 + L)
 * IPCA mensal = base + peso_comercializáveis·φ·x·w(t − t0) + inércia·(IPCA do mês anterior − base)
 */
export type PassParams = { shock: number; phi: number; lag: number; weight: number; inertia: number; base12: number };
export const PASS_MONTHS = 30;
export const PASS_T0 = 3;
export function passThrough(p: PassParams) {
  const lambda = p.lag / (1 + p.lag);
  const base = ((1 + p.base12 / 100) ** (1 / 12) - 1) * 100;
  const months: { t: number; m: number; mBase: number; fx: number }[] = [];
  let prevExtra = 0;
  for (let t = 0; t <= PASS_MONTHS; t++) {
    const k = t - PASS_T0;
    const direct = k >= 0 ? p.weight * p.phi * p.shock * (1 - lambda) * lambda ** k : 0;
    const extra = direct + p.inertia * prevExtra;
    prevExtra = extra;
    months.push({ t, m: base + extra, mBase: base, fx: E0 * (k >= 0 ? 1 + p.shock / 100 : 1) });
  }
  return months.map((r, i) => {
    let acc = 1;
    let accB = 1;
    for (let j = Math.max(0, i - 11); j <= i; j++) {
      acc *= 1 + months[j].m / 100;
      accB *= 1 + months[j].mBase / 100;
    }
    // antes de completar 12 meses, completa a janela com a inflação-base
    const missing = Math.max(0, 11 - i);
    acc *= (1 + base / 100) ** missing;
    accB *= (1 + base / 100) ** missing;
    return { ...r, ipca12: (acc - 1) * 100, ipca12Base: (accB - 1) * 100 };
  });
}

/* ───────────── 4. Paridade do poder de compra (Big Mac) ─────────────
 * câmbio implícito = preço em R$ ÷ preço em US$;  sobre/subvalorização = implícito/real − 1
 * PPC relativa: E(t) = E(0)·[(1 + π_BR)/(1 + π_EUA)]^t
 */
export const BIGMAC = { brl: 23.9, usd: 5.79 };

/* ───────────── 5. Ataque especulativo: câmbio fixo × flutuante ─────────────
 * pressão p_t (US$ bi/mês) = déficit básico + choque_t + pânico
 * fixo: BC vende reservas = p_t; pânico = 10·max(0, 0,75 − R/R0) (cresce quando as reservas somem: aposta de mão única)
 *       câmbio-sombra: ln Es += k·p_t; se R < R_min → a âncora quebra, E salta para Es·1,15
 * flutuante: ln E += k·(p_t − absorvido); câmbio mais fraco atrai fluxo: p_t = choque − 13,5·ln(E/E_ref)
 *       leilão à vista usa reservas; swap cambial não usa reservas (hedge liquidado em reais)
 */
export type AttackParams = {
  regime: "fixo" | "flutuante";
  tool: "nenhuma" | "swaps" | "spot";
  absorb: number; // fração da pressão absorvida pelo BC no flutuante
  R0: number;
  peg: number;
  deficit: number;
  shocks: number[];
  shockSize: number;
};
export type AttackRow = { t: number; R: number; E: number; shadow: number; pressure: number; swaps: number; broke: boolean };
export const ATTACK_MONTHS = 36;
const K = 0.006; // Δ ln E por US$ 1 bi de pressão não absorvida
export function attack(p: AttackParams): AttackRow[] {
  const rows: AttackRow[] = [];
  let R = p.R0;
  let lnE = Math.log(p.peg);
  let lnS = lnE;
  let swaps = 0;
  let broke = false;
  let lnS0 = lnS;
  let floating = p.regime === "flutuante";
  const Rmin = Math.max(5, p.R0 * 0.15);
  for (let t = 0; t <= ATTACK_MONTHS; t++) {
    let shock = 0;
    for (const s of p.shocks) {
      const k = t - s;
      if (k >= 0 && k < 8) shock += p.shockSize * 0.8 ** k;
    }
    if (!floating) {
      const panic = 10 * Math.max(0, 0.75 - R / p.R0);
      const pr = p.deficit + shock + panic;
      R -= pr;
      lnS += K * pr;
      if (R < Rmin) {
        broke = true;
        floating = true;
        lnS0 = lnS;
        lnE = lnS + Math.log(1.15);
        R = Math.max(R, 0);
      }
      rows.push({ t, R: Math.max(0, R), E: Math.exp(lnE), shadow: Math.exp(lnS), pressure: pr, swaps, broke });
    } else {
      // flutuante desde o início: o câmbio já equilibra o fluxo normal (déficit financiado);
      // depois da quebra: o câmbio converge para o câmbio-sombra (fundamentos)
      const lnRef = broke ? lnS0 : Math.log(p.peg);
      const pr = Math.max(-10, shock - 13.5 * (lnE - lnRef));
      const useTool = !broke && p.tool !== "nenhuma";
      let absorbed = useTool ? Math.max(0, pr) * p.absorb : 0;
      if (useTool && p.tool === "spot") {
        absorbed = Math.min(absorbed, Math.max(0, R - Rmin));
        R -= absorbed;
      }
      if (useTool && p.tool === "swaps") swaps += absorbed;
      lnE += K * (pr - absorbed);
      rows.push({ t, R, E: Math.exp(lnE), shadow: Math.exp(lnE), pressure: pr, swaps, broke });
    }
  }
  return rows;
}

/* ───────────── 6. Curva J e Marshall-Lerner ─────────────
 * depreciação d no trimestre 1; ajuste de volumes a(t) = 1 − λ^t
 * Qx = (1+d)^(εx·a),  Qm = (1+d)^(−εm·a)
 * manufaturas (preço em R$): valor das exportações em US$ = Qx·X0/(1+d)
 * commodities (preço em US$): valor = Qx·X0
 * saldo (US$) = X − M
 */
export type JParams = { d: number; ex: number; em: number; speed: number; pricing: "reais" | "dolar"; X0: number; M0: number };
export const J_QUARTERS = 16;
export function jCurve(p: JParams) {
  const out: { t: number; tb: number; X: number; M: number }[] = [];
  const lam = 1 - p.speed;
  for (let t = 0; t <= J_QUARTERS; t++) {
    const on = t >= 1;
    const dd = on ? p.d : 0;
    const a = on ? 1 - lam ** (t - 1 + 0.0001) : 0;
    const qx = (1 + dd) ** (p.ex * a);
    const qm = (1 + dd) ** (-p.em * a);
    const X = p.X0 * qx * (p.pricing === "reais" ? 1 / (1 + dd) : 1);
    const M = p.M0 * qm;
    out.push({ t, tb: X - M, X, M });
  }
  return out;
}

/* ───────────── 7. Termos de troca e doença holandesa ─────────────
 * ln E_real(t) = ln E_ref − β·(1 − poupança)·ln(ToT_t/100)
 * indústria (% PIB): ind(t+1) = ind(t) + κ·ln(E_real/E_ref)·(ind > piso)  — com histerese: perde rápido, recupera devagar
 */
export const TOT_PATH: [number, number][] = [
  [2000, 100], [2001, 96], [2002, 98], [2003, 108], [2004, 122], [2005, 132], [2006, 145], [2007, 160], [2008, 190],
  [2009, 150], [2010, 185], [2011, 215], [2012, 195], [2013, 185], [2014, 165], [2015, 125], [2016, 118], [2017, 132],
  [2018, 135], [2019, 130], [2020, 125], [2021, 170], [2022, 185], [2023, 160], [2024, 155],
];
export function dutch(beta: number, save: number) {
  const Eref = 3.0; // câmbio real "neutro" em R$ de 2000 (estilizado)
  let ind = 17;
  return TOT_PATH.map(([year, tot]) => {
    const Er = Eref * Math.exp(-beta * (1 - save) * Math.log(tot / 100));
    const gap = Math.log(Er / Eref);
    // perde capacidade rápido com real forte; recupera a 1/3 da velocidade
    ind += gap < 0 ? 1.2 * gap : 0.5 * gap;
    ind = Math.max(8, Math.min(20, ind));
    return { year, tot, Er, ind };
  });
}

/* ───────────── 8. Quem ganha e quem perde com o dólar ─────────────
 * variações (%) em relação a E = 5,40, cada agente com sua exposição
 */
export function winners(E: number) {
  const r = E / E0;
  const pct = (x: number) => (x - 1) * 100;
  // exportador de soja: receita em US$, 35% do custo dolarizado; margem base 20%
  const expRev = r;
  const expCost = 0.8 * (0.65 + 0.35 * r);
  const expMargin = ((expRev - expCost) / 0.2 - 1) * 100;
  // importador de eletrônicos: custo em US$ = 70% do preço; preço de venda repassa só metade no curto prazo
  const impPrice = 1 + 0.5 * (r - 1) * 0.7;
  const impCost = 0.7 * r + 0.15;
  const impMargin = ((impPrice - impCost) / 0.15 - 1) * 100;
  // turista em Orlando: US$ 3.000 de viagem
  const tourist = pct(r);
  // turista estrangeiro no Brasil: R$ 10.000 de gastos, em US$
  const foreign = pct(1 / r);
  // empresa com dívida em US$ sem hedge: serviço em R$
  const debt = pct(r);
  // trabalhador: poder de compra do salário (repasse ≈ 0,1 ao IPCA)
  const worker = pct(1 / (1 + 0.1 * (r - 1)));
  // BC: reservas (US$ 340 bi) em reais
  const bc = pct(r);
  return [
    { id: "exportador", label: "Exportador de soja", value: expMargin, note: "margem", goodWhenUp: true },
    { id: "importador", label: "Importador de eletrônicos", value: impMargin, note: "margem", goodWhenUp: true },
    { id: "turista-br", label: "Turista brasileiro em Orlando", value: tourist, note: "custo da viagem em R$", goodWhenUp: false },
    { id: "turista-ext", label: "Turista estrangeiro no Brasil", value: foreign, note: "custo em US$", goodWhenUp: false },
    { id: "divida", label: "Empresa com dívida em US$", value: debt, note: "parcela em R$", goodWhenUp: false },
    { id: "trabalhador", label: "Trabalhador (salário em R$)", value: worker, note: "poder de compra", goodWhenUp: true },
    { id: "bc", label: "Reservas do BC em reais", value: bc, note: "valor patrimonial", goodWhenUp: true },
  ];
}
