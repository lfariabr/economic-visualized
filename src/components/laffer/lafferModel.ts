import { rng } from "@/lib/random";

/* ───────────── Curva de Laffer estática ───────────── */

/** base tributária B(t) = B0·(1−t)^ε, B0 = 100 */
export const base = (t: number, eps: number) => 100 * Math.pow(Math.max(0, 1 - t), eps);
/** arrecadação R(t) = t·B(t) */
export const revenue = (t: number, eps: number) => t * base(t, eps);
/** alíquota que maximiza a arrecadação: t* = 1/(1+ε) */
export const peakRate = (eps: number) => 1 / (1 + eps);

/* ───────────── População de agentes ───────────── */

export type Choice = "formal" | "informal" | "sonega" | "inativo";
export const CHOICES: Choice[] = ["formal", "informal", "sonega", "inativo"];
export const CHOICE_LABEL: Record<Choice, string> = {
  formal: "Formal (paga)",
  informal: "Informal",
  sonega: "Sonega",
  inativo: "Não trabalha",
};
export const CHOICE_COLOR: Record<Choice, string> = {
  formal: "#34d399",
  informal: "#fbbf24",
  sonega: "#f87171",
  inativo: "#5a6275",
};

export type Agent = {
  /** renda potencial (1 = mediana) */
  w: number;
  /** perda de produtividade ao operar na informalidade (sem crédito, sem escala) */
  phi: number;
  /** custo moral/reputacional de sonegar, em fração da renda */
  moral: number;
  /** valor de não trabalhar (lazer, bicos, benefícios) */
  reserv: number;
};

export function makeAgents(n: number, seed = 7): Agent[] {
  const r = rng(seed);
  return Array.from({ length: n }, () => ({
    w: Math.exp(r.normal(0, 0.5)),
    phi: r.uniform(0.2, 0.95),
    moral: r.uniform(0.02, 0.9),
    reserv: r.uniform(0.1, 0.55),
  }));
}

/** multa de ofício sobre o imposto sonegado (75%) */
export const MULTA = 0.75;

/** each agent picks the option with the highest payoff */
export function choose(a: Agent, t: number, fisc: number): Choice {
  const formal = a.w * (1 - t);
  const informal = a.w * (1 - a.phi);
  const sonega = a.w * (1 - fisc * t * (1 + MULTA) - a.moral);
  const inativo = a.reserv;
  let best: Choice = "formal";
  let v = formal;
  if (informal > v) (best = "informal"), (v = informal);
  if (sonega > v) (best = "sonega"), (v = sonega);
  if (inativo > v) best = "inativo";
  return best;
}

export function population(agents: Agent[], t: number, fisc: number) {
  const counts: Record<Choice, number> = { formal: 0, informal: 0, sonega: 0, inativo: 0 };
  let rev = 0;
  for (const a of agents) {
    const c = choose(a, t, fisc);
    counts[c]++;
    if (c === "formal") rev += t * a.w;
    if (c === "sonega") rev += fisc * t * a.w * (1 + MULTA);
  }
  return { counts, rev };
}

/* ───────────── Peso morto (Harberger) ───────────── */

export const DEM_A = 90; // intercepto da demanda
export const SUP_C = 10; // intercepto da oferta

export function harberger(T: number, b: number, d: number) {
  const q0 = (DEM_A - SUP_C) / (b + d);
  const qt = Math.max(0, (DEM_A - SUP_C - T) / (b + d));
  const p0 = DEM_A - b * q0;
  const pc = DEM_A - b * qt;
  const ps = pc - T;
  const rev = T * qt;
  const dwl = 0.5 * Math.min(T, DEM_A - SUP_C) * (q0 - qt);
  return { q0, qt, p0, pc, ps, rev, dwl };
}

/* ───────────── Laffer dinâmica ───────────── */

/** log-base after k years of a change t0 → t1, with short- and long-run elasticities and partial adjustment λ */
export function dynamicPath(t0: number, t1: number, eSR: number, eLR: number, lambda: number, years: number) {
  const ratio = Math.log((1 - t1) / (1 - t0));
  const lnLR = eLR * ratio;
  const ln1 = eSR * ratio;
  const out: { year: number; base: number; rev: number; revBase: number }[] = [];
  for (let k = 0; k <= years; k++) {
    if (k === 0) {
      out.push({ year: 0, base: 100, rev: 100, revBase: 100 });
      continue;
    }
    const ln = lnLR + (ln1 - lnLR) * Math.pow(1 - lambda, k - 1);
    const b = 100 * Math.exp(ln);
    out.push({ year: k, base: b, rev: (t1 / t0) * b, revBase: 100 });
  }
  return out;
}

/* ───────────── Cascata vs IVA ───────────── */

export function cascade(nStages: number, totalVA: number, rateCum: number, rateVat: number) {
  const va = totalVA / nStages;
  const rows: { stage: number; priceCum: number; taxCum: number; pricePre: number; taxVat: number }[] = [];
  let priceCum = 0;
  let pre = 0;
  for (let i = 0; i < nStages; i++) {
    const gross = priceCum + va;
    const taxCum = rateCum * gross;
    priceCum = gross + taxCum;
    const prevPre = pre;
    pre = pre + va;
    const taxVat = rateVat * pre - rateVat * prevPre; // débito − crédito
    rows.push({ stage: i, priceCum, taxCum, pricePre: pre, taxVat });
  }
  const totalCum = priceCum - totalVA;
  const totalVat = rateVat * totalVA;
  return { rows, totalCum, totalVat, effCum: totalCum / totalVA, va };
}

/* ───────────── Alíquota de referência e exceções ───────────── */

export type Exception = { id: string; label: string; share: number; red: number; note: string };
/** participação na base de consumo (aprox.) e redução de alíquota (EC 132/2023, LC 214/2025) */
export const EXCEPTIONS: Exception[] = [
  { id: "cesta", label: "Cesta básica nacional", share: 0.08, red: 1, note: "alíquota zero" },
  { id: "saude", label: "Serviços de saúde", share: 0.09, red: 0.6, note: "−60%" },
  { id: "educacao", label: "Educação", share: 0.06, red: 0.6, note: "−60%" },
  { id: "remedios", label: "Medicamentos", share: 0.03, red: 0.6, note: "−60% (alguns zero)" },
  { id: "agro", label: "Insumos e produtos agropecuários", share: 0.05, red: 0.6, note: "−60%" },
  { id: "transporte", label: "Transporte público coletivo", share: 0.02, red: 1, note: "isento" },
  { id: "liberais", label: "Profissionais liberais", share: 0.06, red: 0.3, note: "−30%" },
];
/** alíquota que arrecadaria o mesmo sem nenhuma exceção (aprox.) */
export const RATE_NO_EXC = 21;

export function referenceRate(active: Set<string>) {
  const lost = EXCEPTIONS.filter((e) => active.has(e.id)).reduce((s, e) => s + e.share * e.red, 0);
  return RATE_NO_EXC / (1 - lost);
}

/* ───────────── IRPF 2026 ───────────── */

/** tabela progressiva mensal (vigente desde maio/2025): [limite superior, alíquota, parcela a deduzir] */
export const TABELA: [number, number, number][] = [
  [2428.8, 0, 0],
  [2826.65, 0.075, 182.16],
  [3751.05, 0.15, 394.16],
  [4664.68, 0.225, 675.49],
  [Infinity, 0.275, 908.73],
];
export const DESCONTO_SIMPLIFICADO = 607.2;
export const FAIXA_TRANSICAO = 2350;

export function irTabela(renda: number) {
  const b = Math.max(0, renda - DESCONTO_SIMPLIFICADO);
  for (const [lim, a, ded] of TABELA) if (b <= lim) return Math.max(0, b * a - ded);
  return 0;
}

/** IR com isenção até `isencao` e redução decrescente até isencao + 2.350 (Lei 15.270/2025 usa 5.000 → 7.350) */
export function irNovo(renda: number, isencao = 5000) {
  const old = irTabela(renda);
  if (renda <= isencao) return 0;
  if (renda < isencao + FAIXA_TRANSICAO) {
    const red = irTabela(isencao) * (1 - (renda - isencao) / FAIXA_TRANSICAO);
    return Math.max(0, old - red);
  }
  return old;
}

/** contribuintes por renda tributável mensal (milhões, aproximado e simplificado) */
export const CONTRIBUINTES: [number, number][] = [
  [2500, 9],
  [3250, 3.5],
  [3750, 3],
  [4250, 2.5],
  [4750, 2],
  [5500, 2],
  [6500, 1.8],
  [7250, 1.2],
  [8500, 2],
  [10000, 1.6],
  [12000, 1.4],
  [16000, 1.2],
  [25000, 1.3],
  [60000, 0.4],
];

/** custo anual (R$ bi) da isenção: 13 salários */
export function custoIsencao(isencao: number) {
  let s = 0;
  for (const [r, n] of CONTRIBUINTES) s += (irTabela(r) - irNovo(r, isencao)) * n * 1e6;
  return (s * 13) / 1e9;
}

/** alta renda (> R$ 600 mil/ano): [renda anual média, pessoas, alíquota efetiva atual] */
export const ALTA_RENDA: [number, number, number][] = [
  [850_000, 90_000, 0.015],
  [4_500_000, 55_000, 0.015],
];

/** imposto mínimo: alíquota sobe linearmente de 0 (R$ 600 mil) até `aliqMax` (R$ 1,2 mi ou mais) */
export function compensacao(aliqMax: number) {
  let s = 0;
  for (const [r, n, eff] of ALTA_RENDA) {
    const min = aliqMax * Math.min(1, Math.max(0, (r - 600_000) / 600_000));
    s += Math.max(0, min - eff) * r * n;
  }
  return s / 1e9;
}
