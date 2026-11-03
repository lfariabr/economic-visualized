/** Pure model code for the "PIB & crescimento" chapter. Educational, simplified. */

export const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

// ── Multiplicador keynesiano ───────────────────────────────────────────────
/** fração de cada real de renda que volta a virar demanda doméstica */
export const leakRate = (c: number, t: number, m: number) => clamp(c * (1 - t) - m, 0, 0.98);
export const multiplier = (c: number, t: number, m: number) => 1 / (1 - leakRate(c, t, m));

/** Rounds of spending: round 0 = first injection; each next = previous·α. */
export function spendingRounds(first: number, alpha: number, n: number) {
  const out: number[] = [];
  let v = first;
  for (let i = 0; i < n; i++) {
    out.push(v);
    v *= alpha;
  }
  return out;
}

// ── IS-LM ─────────────────────────────────────────────────────────────────
/** IS:  Y = Y0 + a·(G − G0) + conf − b·(r − r0)   (Y = PIB índice, r = juro %) */
export const IS_B = 1.6;
export const IS_A = 2.2;
/** LM:  r = r0 + λ·(Y − Y0) − η·(M − M0) */
export const LM_L = 0.45;
export const LM_E = 1.2;
export const Y0 = 100;
export const R0 = 10;

export type ISLMParams = { dG: number; conf: number; dM: number; selic: number; fixa: boolean };

export const isY = (r: number, p: ISLMParams) => Y0 + IS_A * p.dG + p.conf - IS_B * (r - R0);
export const lmR = (Y: number, p: ISLMParams) => (p.fixa ? p.selic : R0 + LM_L * (Y - Y0) - LM_E * p.dM);

export function equilibrium(p: ISLMParams) {
  if (p.fixa) {
    const r = p.selic;
    return { Y: isY(r, p), r };
  }
  // Y = Y0 + A − b(r − r0), r = r0 + λ(Y−Y0) − ηΔM  ⇒  (Y−Y0)(1+bλ) = A + bηΔM
  const A = IS_A * p.dG + p.conf;
  const dY = (A + IS_B * LM_E * p.dM) / (1 + IS_B * LM_L);
  const Y = Y0 + dY;
  return { Y, r: lmR(Y, p) };
}

// ── Ciclo econômico e hiato ───────────────────────────────────────────────
export type CycleState = { t: number; pot: number; hiato: number; pib: number; qoq: number; neg: number; recession: boolean };

export function cycleInit(): CycleState {
  return { t: 0, pot: 100, hiato: 0, pib: 100, qoq: 0.5, neg: 0, recession: false };
}

export function cycleStep(s: CycleState, z: number, p: { persist: number; vol: number; potG: number; shock: number }): CycleState {
  const pot = s.pot * (1 + p.potG / 400);
  const hiato = clamp(p.persist * s.hiato + p.vol * z + p.shock, -15, 10);
  const pib = pot * (1 + hiato / 100);
  const qoq = (pib / s.pib - 1) * 100;
  const neg = qoq < 0 ? s.neg + 1 : 0;
  return { t: s.t + 1, pot, hiato, pib, qoq, neg, recession: neg >= 2 };
}

// ── Solow ─────────────────────────────────────────────────────────────────
export type SolowParams = { s: number; delta: number; n: number; g: number; alpha: number };

/** y = A·k^α ; k' = k + s·y − (δ+n)·k ; A' = A·(1+g) */
export function solowPath(p: SolowParams, years: number, k0 = 1, A0 = 1) {
  const out: { t: number; k: number; y: number; A: number; growth: number }[] = [];
  let k = k0;
  let A = A0;
  let yPrev = A * k ** p.alpha;
  for (let t = 0; t <= years; t++) {
    const y = A * k ** p.alpha;
    out.push({ t, k, y, A, growth: t === 0 ? 0 : (y / yPrev - 1) * 100 });
    yPrev = y;
    k = Math.max(1e-6, k + p.s * y - (p.delta + p.n) * k);
    A *= 1 + p.g;
  }
  return out;
}

/** steady-state k for A fixed: s·A·k^α = (δ+n)·k */
export const solowKStar = (p: SolowParams, A = 1) => ((p.s * A) / (p.delta + p.n)) ** (1 / (1 - p.alpha));

// ── Armadilha da renda média: PIB per capita (PPC) como % do dos EUA, estilizado ──
export const RELATIVE_INCOME: { id: string; label: string; color: string; pts: [number, number][] }[] = [
  { id: "brasil", label: "Brasil", color: "#4ade80", pts: [[1960, 20], [1970, 24], [1980, 36], [1990, 27], [2000, 24], [2010, 27], [2014, 27], [2017, 24], [2020, 23], [2024, 23]] },
  { id: "coreia", label: "Coreia do Sul", color: "#60a5fa", pts: [[1960, 8], [1970, 12], [1980, 20], [1990, 36], [2000, 47], [2010, 60], [2017, 66], [2024, 68]] },
  { id: "chile", label: "Chile", color: "#fbbf24", pts: [[1960, 26], [1970, 25], [1980, 23], [1990, 22], [2000, 30], [2010, 36], [2017, 37], [2024, 37]] },
  { id: "mexico", label: "México", color: "#f87171", pts: [[1960, 30], [1970, 32], [1980, 38], [1990, 30], [2000, 30], [2010, 27], [2017, 28], [2024, 27]] },
  { id: "china", label: "China", color: "#e879f9", pts: [[1960, 3], [1970, 3], [1980, 3], [1990, 4], [2000, 8], [2010, 16], [2017, 23], [2024, 28]] },
];

// ── Bônus demográfico (Brasil, estilizado a partir das projeções do IBGE) ──
/** share of population aged 15–64 (%) and 65+ (%) */
export const DEMOGRAFIA: { year: number; pia: number; idosos: number }[] = [
  { year: 1960, pia: 54, idosos: 2.7 },
  { year: 1970, pia: 54, idosos: 3.1 },
  { year: 1980, pia: 58, idosos: 4.0 },
  { year: 1990, pia: 61, idosos: 4.5 },
  { year: 2000, pia: 65, idosos: 5.5 },
  { year: 2010, pia: 68, idosos: 7.0 },
  { year: 2020, pia: 69.6, idosos: 9.5 },
  { year: 2025, pia: 70, idosos: 11.0 },
  { year: 2030, pia: 69.6, idosos: 13.0 },
  { year: 2035, pia: 68.5, idosos: 15.2 },
  { year: 2040, pia: 66.5, idosos: 17.5 },
  { year: 2050, pia: 63.5, idosos: 22.0 },
  { year: 2060, pia: 61, idosos: 25.5 },
  { year: 2070, pia: 59, idosos: 28.5 },
];

export function interp(pts: { year: number }[], key: "pia" | "idosos", year: number) {
  const arr = pts as { year: number; pia: number; idosos: number }[];
  if (year <= arr[0].year) return arr[0][key];
  for (let i = 1; i < arr.length; i++) {
    if (year <= arr[i].year) {
      const a = arr[i - 1];
      const b = arr[i];
      const f = (year - a.year) / (b.year - a.year);
      return a[key] + f * (b[key] - a[key]);
    }
  }
  return arr[arr.length - 1][key];
}

// ── Lorenz & Gini ─────────────────────────────────────────────────────────
/** decile income shares (%), poorest first; approximate */
export const DISTRIBUICOES: Record<string, { label: string; deciles: number[] }> = {
  brasil: { label: "Brasil", deciles: [1.0, 2.3, 3.3, 4.3, 5.3, 6.5, 8.0, 10.6, 16.0, 42.7] },
  suecia: { label: "Suécia", deciles: [3.6, 5.5, 6.6, 7.6, 8.6, 9.6, 10.7, 12.1, 14.2, 21.5] },
  eua: { label: "EUA", deciles: [1.8, 3.2, 4.4, 5.5, 6.7, 8.0, 9.6, 11.8, 15.5, 33.5] },
  africaSul: { label: "África do Sul", deciles: [0.7, 1.2, 1.6, 2.1, 2.8, 3.8, 5.4, 8.5, 16.4, 57.5] },
};

/** Gini from (sorted) shares via trapezoidal area under the Lorenz curve. */
export function gini(shares: number[]) {
  const total = shares.reduce((a, b) => a + b, 0) || 1;
  const n = shares.length;
  let cum = 0;
  let area = 0;
  for (const s of shares) {
    const prev = cum;
    cum += s / total;
    area += (prev + cum) / (2 * n);
  }
  return clamp(1 - 2 * area, 0, 1);
}

export function lorenz(shares: number[]): [number, number][] {
  const total = shares.reduce((a, b) => a + b, 0) || 1;
  const pts: [number, number][] = [[0, 0]];
  let cum = 0;
  shares.forEach((s, i) => {
    cum += s / total;
    pts.push([((i + 1) / shares.length) * 100, cum * 100]);
  });
  return pts;
}

/** Move `pct`% of the top decile's income to the bottom `k` deciles equally. */
export function redistribute(deciles: number[], pct: number, k = 5) {
  const out = [...deciles];
  const moved = (out[9] * pct) / 100;
  out[9] -= moved;
  for (let i = 0; i < k; i++) out[i] += moved / k;
  return out.sort((a, b) => a - b);
}

// ── PIB, per capita, PPC (aprox. 2024, FMI) ───────────────────────────────
export const PAISES: { id: string; label: string; pibUsd: number; pop: number; ppcPc: number; idh: number }[] = [
  { id: "eua", label: "EUA", pibUsd: 29.2, pop: 340, ppcPc: 86, idh: 0.927 },
  { id: "china", label: "China", pibUsd: 18.7, pop: 1410, ppcPc: 26, idh: 0.788 },
  { id: "alemanha", label: "Alemanha", pibUsd: 4.66, pop: 84, ppcPc: 68, idh: 0.95 },
  { id: "india", label: "Índia", pibUsd: 3.91, pop: 1440, ppcPc: 11, idh: 0.644 },
  { id: "brasil", label: "Brasil", pibUsd: 2.17, pop: 212, ppcPc: 22, idh: 0.76 },
  { id: "mexico", label: "México", pibUsd: 1.85, pop: 130, ppcPc: 25, idh: 0.781 },
  { id: "coreia", label: "Coreia do Sul", pibUsd: 1.87, pop: 52, ppcPc: 62, idh: 0.929 },
  { id: "chile", label: "Chile", pibUsd: 0.33, pop: 20, ppcPc: 33, idh: 0.86 },
  { id: "noruega", label: "Noruega", pibUsd: 0.48, pop: 5.5, ppcPc: 106, idh: 0.966 },
];
