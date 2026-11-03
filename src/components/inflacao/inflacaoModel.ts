import { rng } from "@/lib/random";

/* ───────────────────────── Cesta do IPCA ───────────────────────── */

/** 9 grupos do IPCA com pesos aproximados (IBGE, ~2025) e variação em 12 meses ilustrativa. */
export const IPCA_GROUPS = [
  { id: "alim", label: "Alimentação e bebidas", w: 21.5, v: 6.5, color: "#34d399" },
  { id: "hab", label: "Habitação", w: 15.2, v: 5.5, color: "#60a5fa" },
  { id: "res", label: "Artigos de residência", w: 3.8, v: 0.5, color: "#a78bfa" },
  { id: "vest", label: "Vestuário", w: 4.6, v: 4.0, color: "#f472b6" },
  { id: "transp", label: "Transportes", w: 20.6, v: 3.5, color: "#fb923c" },
  { id: "saude", label: "Saúde e cuidados pessoais", w: 13.6, v: 5.0, color: "#f87171" },
  { id: "desp", label: "Despesas pessoais", w: 10.2, v: 5.5, color: "#facc15" },
  { id: "edu", label: "Educação", w: 6.0, v: 6.0, color: "#22d3ee" },
  { id: "com", label: "Comunicação", w: 4.5, v: 1.0, color: "#8a93a8" },
] as const;

export type GroupId = (typeof IPCA_GROUPS)[number]["id"];

/** subitens de peso grande dentro de cada grupo (participação no IPCA total, %) */
export const SUBITEMS = { gasolina: 5.0, energia: 4.0 } as const;

export const headline = (vars: Record<GroupId, number>) => {
  const tw = IPCA_GROUPS.reduce((a, g) => a + g.w, 0);
  return IPCA_GROUPS.reduce((a, g) => a + (g.w * vars[g.id]) / tw, 0);
};

/* ───────────────────────── Meta com bandas ───────────────────────── */

export type MetaMonth = { t: number; m: number; y12: number; out: boolean; carta: boolean; streak: number };

export const META = 3;
export const BAND = 1.5;

/**
 * IPCA mensal com reversão à meta: π_t = π* + ρ(π_{t−1} − π*) + ε_t, onde ρ cai com a força da reação do BC.
 * Choques de oferta ocasionais (seca, combustível, câmbio) — tudo semeado.
 */
export function metaSim(seed: number, sigma: number, strength: number, T: number, extraShocks: Record<number, number> = {}): MetaMonth[] {
  const r = rng(seed);
  const target = (1 + META / 100) ** (1 / 12) - 1;
  const rho = 0.92 - 0.4 * strength;
  // começa com IPCA 12m ~4,8% (acima do teto), como em 2025
  const hist: number[] = Array.from({ length: 12 }, () => (1.048 ** (1 / 12) - 1) * 100);
  let prev = hist[11] / 100;
  let streak = 0;
  const out: MetaMonth[] = [];
  let persistent = 0;
  for (let t = 0; t < T; t++) {
    if (r.bernoulli(0.06)) persistent += r.normal(0, 0.12) / 100;
    persistent *= 0.75;
    const shock = (extraShocks[t] ?? 0) / 100;
    const eps = r.normal(0, sigma) / 100 + persistent + shock;
    const m = target + rho * (prev - target) + eps;
    prev = m;
    hist.push(m * 100);
    const y12 = (hist.slice(-12).reduce((a, x) => a * (1 + x / 100), 1) - 1) * 100;
    const isOut = y12 > META + BAND || y12 < META - BAND;
    streak = isOut ? streak + 1 : 0;
    const carta = isOut && streak > 0 && streak % 6 === 0;
    out.push({ t, m: m * 100, y12, out: isOut, carta, streak });
  }
  return out;
}

/* ───────────────────────── Inércia / indexação ───────────────────────── */

/** π_t = ι·π_{t−1} + (1−ι)·π* + choque_t   (trimestral, % anualizado) */
export function inertiaPath(iota: number, shock: number, base = 3, T = 24, at = 2): number[] {
  const out: number[] = [];
  let pi = base;
  for (let t = 0; t < T; t++) {
    pi = iota * pi + (1 - iota) * base + (t === at ? shock : 0);
    out.push(pi);
  }
  return out;
}

/* ───────────────────────── AS-AD ───────────────────────── */

export type Eq = { Y: number; P: number };
export const YN = 100;
/** AD: P = 100 + d − (Y − Yn) · SRAS: P = Pe + z + 0,5(Y − Yn) */
export function asad(d: number, z: number, longRun: boolean): Eq {
  if (longRun) {
    // expectativas se ajustam: Y volta ao potencial (choque de oferta temporário se dissipa)
    return { Y: YN, P: 100 + d };
  }
  const gap = (d - z) / 1.5;
  return { Y: YN + gap, P: 100 + d - gap };
}
export const adCurve = (Y: number, d: number) => 100 + d - (Y - YN);
export const srasCurve = (Y: number, pe: number, z: number) => pe + z + 0.5 * (Y - YN);

/* ───────────────────────── Núcleos ───────────────────────── */

export const CORE_ITEMS = [
  // [nome, peso, volátil?, monitorado?]
  ["Tomate", 0.5, "alim"],
  ["Batata", 0.4, "alim"],
  ["Carnes", 2.6, "alim"],
  ["Leite", 0.8, "alim"],
  ["Arroz", 0.5, "alim"],
  ["Café", 0.5, "alim"],
  ["Frutas", 1.0, "alim"],
  ["Pão francês", 0.8, "alim"],
  ["Alimentação fora", 6.0, "livre"],
  ["Gasolina", 5.0, "monit"],
  ["Energia elétrica", 4.0, "monit"],
  ["Plano de saúde", 4.0, "monit"],
  ["Ônibus urbano", 1.0, "monit"],
  ["Remédios", 3.2, "monit"],
  ["Passagem aérea", 0.6, "livre"],
  ["Aluguel", 3.8, "livre"],
  ["Condomínio", 1.2, "livre"],
  ["Automóvel novo", 2.6, "livre"],
  ["Roupas", 3.0, "livre"],
  ["Calçados", 1.4, "livre"],
  ["Eletrodomésticos", 1.5, "livre"],
  ["Cursos e escolas", 4.6, "livre"],
  ["Higiene pessoal", 3.0, "livre"],
  ["Serviços pessoais", 4.0, "livre"],
  ["Recreação", 2.5, "livre"],
  ["Telefonia/internet", 3.0, "livre"],
  ["Empregado doméstico", 2.4, "livre"],
  ["Mobiliário", 1.0, "livre"],
  ["Seguro de veículo", 0.8, "livre"],
  ["Conserto de veículo", 1.0, "livre"],
] as const;

export type CoreItem = { name: string; w: number; kind: "alim" | "monit" | "livre"; v: number };

/** variações do mês: núcleo comum + ruído do item + choques ocasionais grandes (mais em alimentos) */
export function coreMonth(seed: number, t: number, core = 0.35): CoreItem[] {
  const r = rng(seed * 7919 + t * 104729 + 3);
  return CORE_ITEMS.map(([name, w, kind]) => {
    const vol = kind === "alim" ? 1.6 : kind === "monit" ? 0.8 : 0.35;
    let v = core + r.normal(0, vol);
    if (r.bernoulli(kind === "livre" ? 0.03 : 0.12)) v += (r.bernoulli(0.6) ? 1 : -1) * r.uniform(3, kind === "alim" ? 14 : 7);
    return { name, w, kind, v: Math.round(v * 100) / 100 };
  });
}

export const weightedMean = (items: CoreItem[]) => {
  const tw = items.reduce((a, i) => a + i.w, 0);
  return items.reduce((a, i) => a + i.w * i.v, 0) / tw;
};

/** média aparada: ordena por variação e corta `trim` (%) do peso em cada cauda */
export function trimmedMean(items: CoreItem[], trim: number): { value: number; kept: Set<string> } {
  const sorted = [...items].sort((a, b) => a.v - b.v);
  const tw = sorted.reduce((a, i) => a + i.w, 0);
  const lo = (tw * trim) / 100,
    hi = tw - lo;
  let acc = 0,
    sw = 0,
    sv = 0;
  const kept = new Set<string>();
  for (const it of sorted) {
    const a0 = acc,
      a1 = acc + it.w;
    acc = a1;
    const part = Math.max(0, Math.min(a1, hi) - Math.max(a0, lo));
    if (part > 0) {
      sw += part;
      sv += part * it.v;
      if (part / it.w > 0.5) kept.add(it.name);
    }
  }
  return { value: sw ? sv / sw : weightedMean(items), kept };
}

export const exMean = (items: CoreItem[]) => weightedMean(items.filter((i) => i.kind === "livre"));

/* ───────────────────────── IPCA × IGP-M × INPC ───────────────────────── */

/**
 * Choque combinado de câmbio e commodities em US$: Δ = (1+dólar)(1+commodities) − 1.
 * IPA (atacado) repassa muito; preços ao consumidor repassam pouco.
 * IGP-M = 60% IPA + 30% IPC + 10% INCC.
 */
export function indices(dolar: number, cmd: number, domestic: number) {
  const delta = ((1 + dolar / 100) * (1 + cmd / 100) - 1) * 100;
  const ipca = domestic + 0.08 * delta;
  const inpc = domestic + 0.1 * delta; // mais peso em alimentos (commodities)
  const ipa = 0.75 * delta + 0.25 * domestic;
  const incc = domestic + 0.15 * delta;
  const ipc = ipca;
  const igpm = 0.6 * ipa + 0.3 * ipc + 0.1 * incc;
  return { delta, ipca, inpc, ipa, incc, igpm };
}

/* ───────────────────────── Inflação por faixa de renda ───────────────────────── */

export const INCOME_GROUPS = [
  { id: "alim", label: "Alimentos", pobre: 30, rico: 14 },
  { id: "hab", label: "Habitação e energia", pobre: 25, rico: 16 },
  { id: "transp", label: "Transporte e combustível", pobre: 14, rico: 22 },
  { id: "saude", label: "Saúde e educação", pobre: 13, rico: 22 },
  { id: "serv", label: "Serviços e lazer", pobre: 18, rico: 26 },
] as const;
export type IncomeId = (typeof INCOME_GROUPS)[number]["id"];

export const basketInflation = (vars: Record<IncomeId, number>, who: "pobre" | "rico") =>
  INCOME_GROUPS.reduce((a, g) => a + (g[who] * vars[g.id]) / 100, 0);

/* ───────────────────────── Fisher ───────────────────────── */
export const realRate = (nominal: number, pi: number) => ((1 + nominal / 100) / (1 + pi / 100) - 1) * 100;
