/**
 * Small, educational models for the Selic & Copom chapter. Every equation here is
 * a deliberately simplified textbook relation (Novo-Keynesiano de pequena escala),
 * calibrated to look roughly like Brazil ~2025/2026. Not a forecast.
 */
import { clamp, rng } from "@/lib/random";

export const META = 3;
export const TOL = 1.5;
export const R_STAR = 5;

// ---------------------------------------------------------------------------
// 1. Você é o Copom — jogo trimestral
// ---------------------------------------------------------------------------

export type CopomEvent = { q: number; label: string; supply: number; demand: number; cred: number };

export type CopomPoint = {
  q: number;
  /** Selic decidida neste trimestre (% a.a.) */
  selic: number;
  /** IPCA acumulado em 12 meses (aprox., % a.a.) */
  pi: number;
  /** expectativa Focus 12 meses à frente */
  pie: number;
  /** hiato do produto (% do PIB potencial) */
  gap: number;
  /** credibilidade do BC, 0–1 */
  cred: number;
  /** desemprego via Okun */
  u: number;
  event?: string;
};

export const COPOM_QUARTERS = 20;
export const NAIRU_BR = 7;

export const quarterLabel = (q: number) => `${2026 + Math.floor(q / 4)}T${(q % 4) + 1}`;

export function copomEvents(seed: number): CopomEvent[] {
  const r = rng(seed * 7919 + 13);
  const pool: Omit<CopomEvent, "q">[] = [
    { label: "choque do petróleo", supply: 1.4, demand: -0.2, cred: 0 },
    { label: "seca / alimentos", supply: 1.1, demand: 0, cred: 0 },
    { label: "crise de confiança", supply: 0.4, demand: -0.8, cred: -0.15 },
    { label: "boom de crédito", supply: 0, demand: 1.0, cred: 0 },
    { label: "safra recorde", supply: -0.9, demand: 0.2, cred: 0 },
    { label: "estímulo fiscal", supply: 0.2, demand: 0.9, cred: -0.08 },
  ];
  const q1 = r.int(3, 6);
  const q2 = r.int(9, 12);
  const q3 = r.int(14, 17);
  const picks = [...pool].sort(() => r.next() - 0.5).slice(0, 3);
  return [q1, q2, q3].map((q, i) => ({ q, ...picks[i] }));
}

export function copomInitial(): CopomPoint {
  const gap = 0.6;
  return { q: 0, selic: 15, pi: 5.2, pie: 4.6, gap, cred: 0.5, u: NAIRU_BR - 0.5 * gap - 0.6 };
}

/** One quarter of the small NK model given the Selic chosen at the current quarter. */
export function copomStep(hist: CopomPoint[], newSelic: number, seed: number, events: CopomEvent[]): CopomPoint {
  const now = hist[hist.length - 1];
  const prev = hist.length > 1 ? hist[hist.length - 2] : now;
  const q = now.q + 1;
  const r = rng(seed * 104729 + q * 31);
  const ev = events.find((e) => e.q === q);
  const sShock = r.normal(0, 0.3) + (ev?.supply ?? 0);
  const dShock = r.normal(0, 0.2) + (ev?.demand ?? 0);
  // juro real ex-ante decidido agora e no trimestre anterior (defasagem)
  const rNow = newSelic - now.pie - R_STAR;
  const rPrev = prev.selic - prev.pie - R_STAR;
  // IS: hiato depende do juro real defasado
  const gap = 0.72 * now.gap - 0.09 * rNow - 0.07 * rPrev + dShock;
  // Phillips: inflação depende de inércia, expectativas, hiato e choques
  const pi = 0.45 * now.pi + 0.55 * now.pie + 0.3 * now.gap + sShock;
  // expectativas: âncora (credibilidade) + adaptativa
  const pie = now.cred * META + (1 - now.cred) * (0.55 * now.pie + 0.45 * pi);
  const miss = Math.abs(pi - META);
  const cred = clamp(now.cred + (miss <= TOL ? 0.04 : -0.05 * (miss - TOL)) + (ev?.cred ?? 0), 0.05, 0.9);
  return {
    q,
    selic: newSelic,
    pi,
    pie,
    gap,
    cred,
    u: clamp(NAIRU_BR - 0.5 * gap - 0.6, 3, 20),
    event: ev?.label,
  };
}

export function copomLoss(p: CopomPoint) {
  return (p.pi - META) ** 2 + 0.5 * p.gap ** 2;
}

// ---------------------------------------------------------------------------
// 2. Regra de Taylor + princípio de Taylor
// ---------------------------------------------------------------------------

export function taylor(rStar: number, pi: number, gap: number, aPi = 0.5, aY = 0.5, meta = META) {
  return rStar + pi + aPi * (pi - meta) + aY * gap;
}

/**
 * Inflation response to a +2 p.p. shock when the BC follows
 * i = r* + π* + φ(π − π*) + 0,5·hiato, with adaptive expectations (πe = π).
 * φ < 1 → real rate falls as inflation rises → spiral.
 */
export function taylorPrinciple(phi: number, quarters = 32) {
  let pi = META + 2;
  let y = 0;
  const out: { q: number; pi: number; i: number; real: number; y: number }[] = [];
  for (let q = 0; q <= quarters; q++) {
    const i = Math.max(0, R_STAR + META + phi * (pi - META) + 0.5 * y);
    out.push({ q, pi, i, real: i - pi, y });
    const yN = 0.7 * y - 0.25 * (i - pi - R_STAR);
    const piN = pi + 0.25 * y;
    y = yN;
    pi = piN;
  }
  return out;
}

// ---------------------------------------------------------------------------
// 3. Defasagens
// ---------------------------------------------------------------------------

/** hump-shaped lag kernel that equals 1 at `peak` months */
export function hump(t: number, peak: number, a = 2) {
  if (t <= 0) return 0;
  const x = t / peak;
  return x ** a * Math.exp(a * (1 - x));
}

export function impulse(hike: number, piPeak: number, months = 36) {
  const yPeak = Math.max(3, piPeak * 0.6);
  const cPeak = Math.max(1.5, piPeak * 0.25);
  return Array.from({ length: months + 1 }, (_, t) => ({
    t,
    credito: -1.6 * hike * hump(t, cPeak, 1.6),
    pib: -0.3 * hike * hump(t, yPeak),
    inflacao: -0.22 * hike * hump(t, piPeak),
  }));
}

/**
 * Monthly BC that looks only at today's inflation, while policy hits inflation
 * with a distributed lag. Impatient (high φ, no smoothing) → overshoot & oscillation.
 */
export function lagGame(phi: number, smooth: number, piPeak: number, months = 72) {
  const L = 48;
  const w = Array.from({ length: L }, (_, j) => hump(j + 1, piPeak));
  const ws = w.reduce((a, b) => a + b, 0);
  const wn = w.map((v) => v / ws);
  const neutral = R_STAR + META;
  const beta = 0.6;
  const iHist: number[] = [];
  const out: { t: number; pi: number; i: number }[] = [];
  for (let t = 0; t <= months; t++) {
    const shock = 3 * 0.975 ** t;
    let pol = 0;
    for (let j = 0; j < L; j++) {
      const k = t - 1 - j;
      pol += wn[j] * ((k >= 0 ? iHist[k] : neutral) - neutral);
    }
    const gapPi = shock - beta * pol;
    const target = neutral + phi * gapPi;
    const prevI = t > 0 ? iHist[t - 1] : neutral;
    const i = clamp(smooth * prevI + (1 - smooth) * target, 2, 40);
    iHist.push(i);
    out.push({ t, pi: META + gapPi, i });
  }
  return out;
}

// ---------------------------------------------------------------------------
// 4. Canais de transmissão
// ---------------------------------------------------------------------------

export type Channel = { id: string; label: string; via: string; effect: number };

export function channels(dSelic: number, direcionado: number, cred: number, abertura: number): Channel[] {
  return [
    { id: "credito", label: "Crédito", via: "crédito mais caro → menos consumo e investimento", effect: -0.15 * (1 - direcionado) * dSelic },
    { id: "cambio", label: "Câmbio", via: "real se aprecia → importados mais baratos", effect: -0.1 * (abertura / 0.2) * dSelic },
    { id: "ativos", label: "Preços de ativos", via: "ações e imóveis valem menos → efeito riqueza", effect: -0.04 * dSelic },
    { id: "expect", label: "Expectativas", via: "Focus converge para a meta → reajustes menores", effect: -0.12 * cred * dSelic },
  ];
}

// ---------------------------------------------------------------------------
// 5. Juro real
// ---------------------------------------------------------------------------

export const fisher = (i: number, pie: number) => ((1 + i / 100) / (1 + pie / 100) - 1) * 100;

/** valores aproximados (2025), juro básico e expectativa de inflação 12m */
export const COUNTRIES: { name: string; i: number; pie: number }[] = [
  { name: "Rússia", i: 17, pie: 6.5 },
  { name: "Turquia", i: 39.5, pie: 25 },
  { name: "México", i: 7.5, pie: 3.7 },
  { name: "Colômbia", i: 9.25, pie: 4.5 },
  { name: "África do Sul", i: 7, pie: 3.6 },
  { name: "Índia", i: 5.5, pie: 3.5 },
  { name: "Chile", i: 4.75, pie: 3.4 },
  { name: "EUA", i: 4.25, pie: 2.7 },
  { name: "Zona do Euro", i: 2, pie: 2 },
  { name: "Japão", i: 0.5, pie: 2 },
];

// ---------------------------------------------------------------------------
// 6. Credibilidade
// ---------------------------------------------------------------------------

export type CredPoint = { q: number; pi: number; pie: number; i: number; y: number; cred: number };

export function credSim(cred0: number, breakAt: number | null, quarters = 24): CredPoint[] {
  let pi = 8;
  let pie = 6;
  let y = 0;
  let cred = cred0;
  let anchor = META;
  const out: CredPoint[] = [];
  for (let q = 0; q <= quarters; q++) {
    if (breakAt !== null && q === breakAt) {
      cred = Math.min(cred, 0.15);
      anchor = META + 2; // mercado passa a desconfiar de uma "meta implícita" maior
    }
    const i = Math.max(2, R_STAR + pie + 1.5 * (pi - META) + 0.5 * y);
    out.push({ q, pi, pie, i, y, cred });
    const pieN = cred * anchor + (1 - cred) * pi;
    const piN = 0.5 * pi + 0.5 * pieN + 0.3 * y;
    const yN = 0.7 * y - 0.15 * (i - pie - R_STAR);
    pi = piN;
    pie = pieN;
    y = yN;
  }
  return out;
}

// ---------------------------------------------------------------------------
// 7. Dominância fiscal
// ---------------------------------------------------------------------------

export type FiscalPoint = { q: number; pi: number; i: number; debt: number; fx: number; prem: number; y: number };

/**
 * Selic, debt, risk premium, exchange rate and inflation interact. With fiscal
 * dominance on, the market reads a higher Selic as a higher debt path, so the
 * risk premium rises more than the rate itself → real depreciates → inflation.
 */
export function fiscalSim({
  hike,
  debt0,
  primary,
  dominance,
  quarters = 16,
}: {
  hike: number;
  debt0: number;
  primary: number;
  dominance: boolean;
  quarters?: number;
}): FiscalPoint[] {
  const i0 = 15;
  const prem0 = 2.5;
  const g = 2.5;
  let pi = 5;
  let pie = 4.6;
  let y = 0;
  let debt = debt0;
  let fx = 5.4;
  let prem = prem0;
  // fragilidade fiscal: maior com dívida alta, menor com primário positivo
  const fragility = dominance ? clamp((debt0 - 45) / 33 - 0.35 * primary, 0, 2) : 0;
  const theta = 0.01 + 0.25 * fragility;
  const eta = 0.05 + 1.2 * fragility;
  const out: FiscalPoint[] = [];
  for (let q = 0; q <= quarters; q++) {
    const i = q >= 1 ? i0 + hike : i0;
    // prêmio de risco: sobe com a dívida e, sob dominância, com o próprio custo da dívida
    prem = prem0 + theta * (debt - debt0) + eta * (i - i0) * (debt / 100);
    // paridade descoberta: juro maior aprecia; prêmio de risco (persistente) deprecia
    const fxN = 5.4 * Math.exp(-0.03 * (i - i0) + 0.045 * (prem - prem0));
    const dep = (fxN / fx - 1) * 100;
    out.push({ q, pi, i, debt, fx, prem, y });
    fx = fxN;
    const real = i - pie;
    // Phillips com repasse cambial
    const piN = 0.5 * pi + 0.5 * pie + 0.25 * y + 0.09 * dep;
    const yN = 0.7 * y - 0.08 * (real - R_STAR) - 0.03 * (prem - prem0);
    // expectativas: adaptativas + medo fiscal (prêmio de risco contamina o Focus)
    const pieN = 0.7 * pie + 0.3 * piN + 0.06 * (prem - prem0);
    // metade da dívida pós-fixada (Selic), metade com custo real ~5% já contratado
    const rEff = 0.5 * real + 0.5 * 5;
    debt = (debt * (1 + rEff / 400)) / (1 + g / 400) - primary / 4;
    pi = piN;
    pie = pieN;
    y = yN;
  }
  return out;
}
