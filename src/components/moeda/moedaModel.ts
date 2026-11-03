import { rng } from "@/lib/random";

/* ───────────────────────── Teoria quantitativa ───────────────────────── */

/** Exact annual inflation implied by MV = PY in growth rates (all in %). */
export function qtmInflation(mu: number, v: number, y: number) {
  return ((1 + mu / 100) * (1 + v / 100)) / (1 + y / 100) * 100 - 100;
}

export type QtmYear = { t: number; M: number; V: number; Y: number; P: number; pi: number };

export function qtmPath(mu: number, v: number, y: number, years: number): QtmYear[] {
  const out: QtmYear[] = [];
  let M = 100,
    V = 100,
    Y = 100;
  for (let t = 0; t <= years; t++) {
    if (t > 0) {
      M *= 1 + mu / 100;
      V *= 1 + v / 100;
      Y *= 1 + y / 100;
    }
    // base 100: P = M·V/Y with M0 = V0 = Y0 = 100
    out.push({ t, M, V, Y, P: (M * V) / Y, pi: t === 0 ? 0 : qtmInflation(mu, v, y) });
  }
  return out;
}

/* ───────────────────────── Senhoriagem (Cagan) ───────────────────────── */

/** base monetária real desejada (% do PIB) com inflação mensal π (fração): m = m0·e^(−απ) */
export const caganDemand = (pi: number, alpha: number, m0 = 6) => m0 * Math.exp(-alpha * pi);

/** senhoriagem em estado estacionário (% do PIB ao ano) = 12·π·m(π) */
export const seigniorage = (pi: number, alpha: number, m0 = 6) => 12 * pi * caganDemand(pi, alpha, m0);

/** roots of seigniorage(π) = deficit on [0, 3] (monthly fraction). */
export function seigniorageRoots(deficit: number, alpha: number, m0 = 6): number[] {
  const roots: number[] = [];
  const f = (p: number) => seigniorage(p, alpha, m0) - deficit;
  const N = 3000;
  let prev = f(0);
  for (let i = 1; i <= N; i++) {
    const p = (i / N) * 3;
    const cur = f(p);
    if (prev === 0 || prev * cur < 0) {
      let lo = ((i - 1) / N) * 3,
        hi = p;
      for (let k = 0; k < 40; k++) {
        const mid = (lo + hi) / 2;
        if (f(lo) * f(mid) <= 0) hi = mid;
        else lo = mid;
      }
      roots.push((lo + hi) / 2);
    }
    prev = cur;
  }
  return roots;
}

/* ───────────────────────── Espiral hiperinflacionária ───────────────────────── */

export type HyperParams = { deficit: number; alpha: number; lambda: number; iota0: number };
export type HyperState = {
  t: number;
  pi: number; // observed monthly inflation (fraction)
  pe: number; // expected
  mu: number; // money growth
  V: number; // velocity relative to zero-inflation
  iota: number; // effective indexation
  gap: number; // repressed inflation (log)
  freeze: number; // months of freeze left
  deficit: number;
  iota0: number;
  reformed: boolean;
  seed: number;
  history: { t: number; pi: number; mu: number; V: number; gap: number; frozen: boolean }[];
};

export const HYPER_M0 = 0.06; // base real / PIB at zero inflation
export const HYPER_CAP = 1.5; // display/numerics cap: 150% a.m.

export function hyperInit(p: HyperParams, seed = 7): HyperState {
  return {
    t: 0,
    pi: 0.08,
    pe: 0.08,
    mu: 0.08,
    V: 1,
    iota: p.iota0,
    gap: 0,
    freeze: 0,
    deficit: p.deficit,
    iota0: p.iota0,
    reformed: false,
    seed,
    history: [],
  };
}

/** one month of the spiral; random supply shocks are seeded by (seed, t). */
export function hyperStep(s: HyperState, p: HyperParams, shock = 0): HyperState {
  const deficit = s.reformed ? 0.5 : p.deficit;
  const iota0 = s.reformed ? 0.1 : p.iota0;
  // expectativas adaptativas
  const pe = s.pe + p.lambda * (s.pi - s.pe);
  // indexação aumenta com a inflação (reajustes ficam mais frequentes)
  const iota = iota0 + (0.97 - iota0) * (1 - Math.exp(-6 * pe));
  // velocidade sobe quando se espera inflação: V = e^(α·πe); emissão para financiar o déficit μ = d·V/m0
  const V = Math.exp(p.alpha * pe);
  const mu = Math.min((deficit / 100 / (12 * HYPER_M0)) * V, 5);
  const r = rng(s.seed * 1009 + s.t * 31 + 1);
  const noise = Math.max(-0.02, r.normal(0.004, 0.02)) * (1 + 2 * s.pi);
  const under = iota * s.pi + (1 - iota) * mu + noise + shock;
  let freeze = s.freeze;
  let gap = s.gap;
  let obs: number;
  if (freeze > 0) {
    freeze -= 1;
    gap += Math.log(1 + Math.max(under, 0));
    obs = 0;
  } else {
    const rel = 0.3 * gap;
    gap -= rel;
    obs = (1 + under) * Math.exp(rel) - 1;
  }
  const pi = Math.max(0, Math.min(obs, HYPER_CAP));
  return {
    ...s,
    t: s.t + 1,
    pi,
    pe,
    mu,
    V,
    iota,
    gap,
    freeze,
    deficit,
    iota0,
    history: [...s.history, { t: s.t, pi, mu, V, gap, frozen: s.freeze > 0 }],
  };
}

/* ───────────────────────── Plano Real / URV ───────────────────────── */

export const REAL_ITEMS = [
  { id: "salario", label: "Salário", k: 2, phase: 0, color: "#facc15" },
  { id: "aluguel", label: "Aluguel", k: 4, phase: 1, color: "#60a5fa" },
  { id: "pao", label: "Pão", k: 1, phase: 0, color: "#34d399" },
  { id: "onibus", label: "Ônibus", k: 3, phase: 2, color: "#f472b6" },
] as const;

// background items for the index (periods 1–4, all phases)
const BG = [1, 2, 2, 3, 3, 3, 4, 4, 4, 4].map((k, i) => ({ k, phase: i % k }));

export const URV_START = 14; // mar/1994 (t=0 é jan/1993)
export const REAL_START = 18; // jul/1994
export const REAL_MONTHS = 36;

export type RealMonth = {
  t: number;
  pi: number; // % a.m.
  real: number[]; // real value (in index units, 100 = pico) of visible items
  dispersion: number; // desvio-padrão dos preços relativos (%)
};

/**
 * Inércia pura com contratos escalonados: cada preço, quando chega sua vez,
 * é reajustado pela inflação acumulada desde o último reajuste. O índice é a
 * média geométrica dos preços. Isso perpetua qualquer taxa de inflação.
 */
export function realSim(mode: "urv" | "corte"): RealMonth[] {
  const all = [...REAL_ITEMS.map((i) => ({ k: i.k, phase: i.phase })), ...BG];
  const pi0 = 0.3;
  const n = all.length;
  // log price & log index at last reset; initialize as if inertia had been going on forever
  const logP = new Array<number>(n);
  const lastIdx = new Array<number>(n); // log I_{reset-1}
  const hist: number[] = []; // log I by t (t ≥ -6)
  const L = (t: number) => (t < 0 ? t * Math.log(1 + pi0) : hist[t]);
  for (let i = 0; i < n; i++) {
    const { k, phase } = all[i];
    // last reset at the most recent t ≤ -1 with (t - phase) % k == 0
    let tr = -1;
    while (((tr - phase) % k + k) % k !== 0) tr--;
    lastIdx[i] = L(tr - 1);
    // after reset, price = index at (tr - 1) + k·π (recovering k months) ≈ peak real at tr
    logP[i] = L(tr - 1) + Math.log(1 + pi0) * k * 1;
  }
  // calibrate so that index at t=-1 equals L(-1)
  const off = L(-1) - logP.reduce((a, b) => a + b, 0) / n;
  for (let i = 0; i < n; i++) logP[i] += off;

  const urvLog: { v: number } = { v: 0 };
  const urvPrice = new Array<number>(n).fill(0);
  const avgReal = new Array<number>(n).fill(0);
  const realHist: number[][] = Array.from({ length: n }, () => []);
  let frozen = 0;
  let residual = 0.04;
  const out: RealMonth[] = [];
  let prevIdx = L(-1);

  for (let t = 0; t < REAL_MONTHS; t++) {
    if (mode === "urv" && t === URV_START) {
      // conversão: cada preço vira URV pela média do seu valor real dos últimos 4 meses
      urvLog.v = prevIdx;
      for (let i = 0; i < n; i++) {
        const h = realHist[i].slice(-4);
        avgReal[i] = h.reduce((a, b) => a + b, 0) / h.length;
        urvPrice[i] = Math.log(avgReal[i]);
      }
      // renormalize so the index starts from the URV level
      const m = urvPrice.reduce((a, b) => a + b, 0) / n;
      for (let i = 0; i < n; i++) urvPrice[i] -= m;
    }
    if (mode === "corte" && t === REAL_START) frozen = 4;

    if (mode === "urv" && t >= URV_START && t < REAL_START) {
      // URV corrigida diariamente pela inflação: todos os preços andam juntos
      urvLog.v += Math.log(1.4);
      for (let i = 0; i < n; i++) logP[i] = urvPrice[i] + urvLog.v;
    } else if (mode === "urv" && t >= REAL_START) {
      // 1 URV = 1 real: preços em R$ = preços em URV; sobra uma inflação residual que cai
      if (t === REAL_START) for (let i = 0; i < n; i++) lastIdx[i] = prevIdx;
      residual *= 0.75;
      for (let i = 0; i < n; i++) logP[i] += Math.log(1 + residual + 0.004);
    } else if (frozen > 0) {
      frozen--;
    } else {
      for (let i = 0; i < n; i++) {
        const { k, phase } = all[i];
        if (((t - phase) % k + k) % k === 0) {
          logP[i] += prevIdx - lastIdx[i];
          lastIdx[i] = prevIdx;
        }
      }
    }
    const idx = logP.reduce((a, b) => a + b, 0) / n;
    const pi = (Math.exp(idx - prevIdx) - 1) * 100;
    hist[t] = idx;
    const reals = logP.map((lp) => Math.exp(lp - idx));
    reals.forEach((r, i) => realHist[i].push(r));
    // instabilidade dos preços relativos: desvio-padrão da variação mensal do valor relativo de cada item
    const prevR = realHist.map((h) => h[h.length - 2] ?? h[h.length - 1]);
    const disp = Math.sqrt(reals.reduce((a, b, i) => a + Math.log(b / prevR[i]) ** 2, 0) / n) * 100;
    out.push({ t, pi, real: reals.slice(0, REAL_ITEMS.length).map((r) => r * 100), dispersion: disp });
    prevIdx = idx;
  }
  return out;
}

/* ───────────────────────── Multiplicador monetário ───────────────────────── */

/** m = (1 + c) / (c + r + e) */
export const multiplier = (c: number, r: number, e: number) => (1 + c) / (c + r + e);

export type LendingRound = { k: number; deposit: number; reserves: number; loan: number; cash: number; m1: number };

/** rounds of deposit → reserves → loan → (cash leak) → redeposit, from an initial injection of base B */
export function lendingRounds(B: number, c: number, r: number, e: number, rounds: number): LendingRound[] {
  const out: LendingRound[] = [];
  // B splits into cash and deposits: C = c·D
  let deposit = B / (1 + c);
  let cash = B - deposit;
  let m1 = B;
  for (let k = 0; k < rounds; k++) {
    const reserves = deposit * (r + e);
    const loan = deposit - reserves;
    const newCash = (loan * c) / (1 + c);
    out.push({ k, deposit, reserves, loan, cash, m1 });
    m1 += loan;
    deposit = loan - newCash;
    cash = newCash;
  }
  return out;
}

/* ───────────────────────── Expectativas e credibilidade ───────────────────────── */

export type CredQuarter = { t: number; pi: number; pe: number; y: number };

/**
 * AD em taxas: y_t = y_{t−1} + (μ − π_t)  (crescimento real da moeda aquece a demanda)
 * Phillips:    π_t = πe_t + κ·y_t
 * Expectativas: πe_t = c·μ_anunciado + (1−c)·π_{t−1}
 */
export function credPath(mu0: number, mu1: number, cred: number, kappa = 0.4, T = 24, changeAt = 4): CredQuarter[] {
  const out: CredQuarter[] = [];
  let pi = mu0,
    y = 0;
  for (let t = 0; t < T; t++) {
    const mu = t >= changeAt ? mu1 : mu0;
    const pe = t >= changeAt ? cred * mu + (1 - cred) * pi : pi;
    const piN = (pe + kappa * (y + mu)) / (1 + kappa);
    y = y + mu - piN;
    pi = piN;
    out.push({ t, pi, pe, y });
  }
  return out;
}
