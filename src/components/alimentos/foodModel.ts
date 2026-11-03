import { rng } from "@/lib/random";

/* ───────────── 1. Oferta × demanda inelástica (elasticidade constante) ─────────────
 * Demanda:  Qd = P^(−εd)          (P e Q normalizados: equilíbrio-base P = 1, Q = 1)
 * Oferta:   Qs = (1 − s)·P^(εs)   (s = perda de safra; s < 0 é supersafra)
 * ⇒ P* = (1 − s)^(−1/(εd+εs)),  Q* = P*^(−εd),  receita = P*·Q* = P*^(1−εd)
 */
export function shockEquilibrium(s: number, ed: number, es: number) {
  const P = (1 - s) ** (-1 / (ed + es));
  const Q = P ** -ed;
  return { P, Q, revenue: P * Q };
}
export const demandQ = (P: number, ed: number) => P ** -ed;
export const supplyQ = (P: number, es: number, s: number) => (1 - s) * P ** es;

/* ───────────── 2. Teia de aranha (cobweb) ─────────────
 * Demanda:  Qt = 100 − β·(Pt − 100)        ⇒ Pt = 100 − (Qt − 100)/β
 * Oferta:   Qt = 100 + δ·(P(t−1) − 100)    (planta olhando o preço da safra passada)
 * ⇒ Pt − 100 = −(δ/β)·(P(t−1) − 100): converge se δ/β < 1, explode se > 1.
 */
export type CobwebPoint = { t: number; P: number; Q: number };
export function cobweb(delta: number, beta: number, p0: number, n: number): CobwebPoint[] {
  const out: CobwebPoint[] = [{ t: 0, P: p0, Q: 100 }];
  let p = p0;
  for (let t = 1; t <= n; t++) {
    const q = Math.max(0, 100 + delta * (p - 100));
    p = Math.max(0, 100 - (q - 100) / beta);
    out.push({ t, P: p, Q: q });
  }
  return out;
}

/* ───────────── 3. Dólar & commodities: paridade de exportação ─────────────
 * preço interno (R$/t) ≈ preço internacional (US$/t) × câmbio (R$/US$) − custo de levar ao porto
 */
export type Commodity = {
  id: string;
  label: string;
  unit: string;
  /** US$ por unidade, mercado internacional (aprox. 2025) */
  usd: number;
  /** quantos "unit" por tonelada (para mostrar R$/saca etc.) */
  perTon: number;
  /** custo de frete/porto em R$ por unidade */
  freight: number;
  /** peso da matéria-prima no preço ao consumidor (0–1) */
  retailShare: number;
  retailName: string;
};
export const COMMODITIES: Commodity[] = [
  { id: "soja", label: "Soja", unit: "saca 60 kg", usd: 23, perTon: 16.67, freight: 12, retailShare: 0.6, retailName: "óleo de soja" },
  { id: "milho", label: "Milho", unit: "saca 60 kg", usd: 11.5, perTon: 16.67, freight: 10, retailShare: 0.35, retailName: "frango (ração)" },
  { id: "cafe", label: "Café arábica", unit: "saca 60 kg", usd: 380, perTon: 16.67, freight: 40, retailShare: 0.65, retailName: "café torrado" },
  { id: "carne", label: "Carne bovina", unit: "arroba 15 kg", usd: 60, perTon: 66.7, freight: 15, retailShare: 0.7, retailName: "carne no açougue" },
  { id: "arroz", label: "Arroz", unit: "saca 50 kg", usd: 22, perTon: 20, freight: 14, retailShare: 0.55, retailName: "arroz 5 kg" },
];
export const exportParity = (usd: number, fx: number, freight: number) => usd * fx - freight;

/* ───────────── 4. Cesta básica DIEESE ─────────────
 * Quantidades da Região 1 (SP), Decreto-Lei 399/1938; preços aproximados de 2025.
 * horas = cesta / SM × 220;  % SM líquido = cesta / (SM × (1 − 7,5% INSS))
 * SM necessário (DIEESE) = 3 × cesta / 0,3571 (família 2 adultos + 2 crianças)
 */
export type BasketItem = { id: string; label: string; qty: number; unit: string; price: number; max: number };
export const BASKET: BasketItem[] = [
  { id: "carne", label: "Carne", qty: 6, unit: "kg", price: 50, max: 90 },
  { id: "leite", label: "Leite", qty: 7.5, unit: "L", price: 5.5, max: 12 },
  { id: "feijao", label: "Feijão", qty: 4.5, unit: "kg", price: 8, max: 18 },
  { id: "arroz", label: "Arroz", qty: 3, unit: "kg", price: 6, max: 14 },
  { id: "farinha", label: "Farinha", qty: 1.5, unit: "kg", price: 6, max: 12 },
  { id: "batata", label: "Batata", qty: 6, unit: "kg", price: 5, max: 12 },
  { id: "tomate", label: "Tomate", qty: 9, unit: "kg", price: 7, max: 16 },
  { id: "pao", label: "Pão francês", qty: 6, unit: "kg", price: 19, max: 30 },
  { id: "cafe", label: "Café em pó", qty: 0.6, unit: "kg", price: 60, max: 120 },
  { id: "banana", label: "Banana", qty: 7.5, unit: "dz", price: 8, max: 16 },
  { id: "acucar", label: "Açúcar", qty: 3, unit: "kg", price: 5, max: 10 },
  { id: "oleo", label: "Óleo", qty: 0.75, unit: "L", price: 9, max: 18 },
  { id: "manteiga", label: "Manteiga", qty: 0.75, unit: "kg", price: 60, max: 110 },
];
export const HOURS_PER_MONTH = 220;
export const INSS = 0.075;
export function basketStats(prices: Record<string, number>, wage: number) {
  const items = BASKET.map((b) => ({ ...b, cost: b.qty * (prices[b.id] ?? b.price) }));
  const total = items.reduce((a, b) => a + b.cost, 0);
  return {
    items,
    total,
    hours: (total / wage) * HOURS_PER_MONTH,
    shareNet: total / (wage * (1 - INSS)),
    needed: (3 * total) / 0.3571,
  };
}

/* ───────────── 5. Tabelamento (preço máximo) ─────────────
 * Demanda: Qd = 100 − 6·(P − 10);   Oferta: Qs = 100 + d·(P − 10), d cresce com o tempo de congelamento
 * (no curto prazo o produtor não consegue sair; no longo prazo abate a matriz, deixa de plantar).
 * Com teto P̄ < 10: quantidade negociada = Qs(P̄); escassez = Qd(P̄) − Qs(P̄);
 * peso morto = ½·(Q* − Qt)·(Pd(Qt) − Ps(Qt)); ágio no paralelo = Pd(Qt) − P̄.
 */
export const CEIL = { pStar: 10, qStar: 100, b: 6 };
export function ceiling(pBar: number, months: number, d0 = 4) {
  const d = d0 * (1 + months / 4);
  const { pStar, qStar, b } = CEIL;
  const Qd = (p: number) => qStar - b * (p - pStar);
  const Qs = (p: number) => Math.max(0, qStar + d * (p - pStar));
  const Pd = (q: number) => pStar - (q - qStar) / b;
  const Ps = (q: number) => pStar + (q - qStar) / d;
  const binding = pBar < pStar;
  const qt = binding ? Qs(pBar) : qStar;
  const shortage = binding ? Qd(pBar) - Qs(pBar) : 0;
  const dwl = binding ? 0.5 * (qStar - qt) * (Pd(qt) - Ps(qt)) : 0;
  const blackPrice = binding ? Pd(qt) : pStar;
  return { d, Qd, Qs, Pd, Ps, binding, qt, shortage, dwl, blackPrice };
}

/* ───────────── 6. Cadeia de custos, do campo à gôndola ─────────────
 * custo do produtor = fixo + fertilizante·(E/E0)·(índice fert.) + diesel no campo·(diesel/diesel0)
 * + frete·(0,4 + 0,6·diesel/diesel0) + indústria/embalagem
 * preço final = custo·(1 + margem) / (1 − impostos)     (tributo "por dentro")
 */
export type ChainProfile = {
  id: string;
  label: string;
  unit: string;
  farmFixed: number;
  fert: number;
  dieselFarm: number;
  freight: number;
  industry: number;
};
export const CHAIN_PROFILES: ChainProfile[] = [
  { id: "arroz", label: "Arroz 5 kg", unit: "pacote", farmFixed: 6.2, fert: 3.2, dieselFarm: 1.4, freight: 2.4, industry: 3.6 },
  { id: "pao", label: "Pão francês", unit: "kg", farmFixed: 1.0, fert: 2.4, dieselFarm: 0.5, freight: 1.0, industry: 7.8 },
  { id: "leite", label: "Leite longa vida", unit: "litro", farmFixed: 1.6, fert: 0.6, dieselFarm: 0.3, freight: 0.5, industry: 1.0 },
];
export const CHAIN_BASE = { fx: 5.4, fertIdx: 100, diesel: 6.2, margin: 0.3, tax: 0.12 };
export type ChainInputs = typeof CHAIN_BASE;
export function chain(p: ChainProfile, x: ChainInputs) {
  const dr = x.diesel / CHAIN_BASE.diesel;
  const fert = p.fert * (x.fx / CHAIN_BASE.fx) * (x.fertIdx / 100);
  const diesel = p.dieselFarm * dr;
  const freight = p.freight * (0.4 + 0.6 * dr);
  const cost = p.farmFixed + fert + diesel + freight + p.industry;
  const margin = cost * x.margin;
  const price = (cost + margin) / (1 - x.tax);
  const tax = price - cost - margin;
  return {
    parts: [
      { id: "campo", label: "Terra, mão de obra, sementes", value: p.farmFixed },
      { id: "fert", label: "Insumos dolarizados (adubo, trigo)", value: fert },
      { id: "diesel", label: "Diesel no campo", value: diesel },
      { id: "frete", label: "Frete rodoviário", value: freight },
      { id: "industria", label: "Indústria e embalagem", value: p.industry },
      { id: "margem", label: "Margem atacado + varejo", value: margin },
      { id: "impostos", label: "Impostos (ICMS, PIS/Cofins)", value: tax },
    ],
    price,
  };
}

/* ───────────── 7. Choque climático mensal + estoques reguladores (Conab) ─────────────
 * oferta colhida h_t = 1 + ruído·N(0,1) − choque_t;   tendência de preço 0,35%/mês
 * preço livre:  P_t = 100·(1,0035)^t·X_t^(−1/εd),  X_t = oferta que chega ao mercado
 * política: se P > teto, Conab vende estoque até P = teto; se P < piso, compra até P = piso
 * custo de carregamento = estoque × custo mensal (armazenagem + juros);  IPCA: peso ≈ 21%
 */
export const FOOD_WEIGHT = 0.21;
export type BufferParams = {
  ed: number;
  band: number; // banda ± em % em torno da tendência
  capacity: number; // capacidade de estoque (fração da oferta mensal)
  policy: boolean;
  shocks: number[]; // meses em que começa um choque climático
  shockSize: number; // perda de safra no pico (fração)
  seed: number;
};
export type BufferRow = {
  t: number;
  pFree: number;
  p: number;
  stock: number;
  cost: number;
  ipca12Free: number;
  ipca12: number;
};
export const BUFFER_MONTHS = 48;
export function buffer(params: BufferParams): BufferRow[] {
  const r = rng(params.seed);
  const noise = Array.from({ length: BUFFER_MONTHS + 1 }, () => r.normal(0, 0.025));
  const rows: BufferRow[] = [];
  let stock = params.capacity * 0.5;
  let cost = 0;
  const trend = (t: number) => 100 * 1.0035 ** t;
  const priceOf = (x: number, t: number) => trend(t) * Math.max(0.3, x) ** (-1 / params.ed);
  const xFor = (p: number, t: number) => (p / trend(t)) ** -params.ed;
  for (let t = 0; t <= BUFFER_MONTHS; t++) {
    let shock = 0;
    for (const s of params.shocks) {
      const k = t - s;
      // perfil do choque: sobe em 2 meses, dura ~4, desfaz em ~4
      if (k >= 0 && k < 10) shock += params.shockSize * (k < 2 ? (k + 1) / 2 : k < 6 ? 1 : (10 - k) / 4);
    }
    const harvest = 1 + noise[t] - shock;
    const pFree = priceOf(harvest, t);
    let x = harvest;
    if (params.policy) {
      const hi = trend(t) * (1 + params.band / 100);
      const lo = trend(t) * (1 - params.band / 100);
      if (pFree > hi && stock > 0) {
        const release = Math.min(stock, xFor(hi, t) - harvest);
        stock -= release;
        x += release;
      } else if (pFree < lo && stock < params.capacity) {
        const buy = Math.min(params.capacity - stock, harvest - xFor(lo, t));
        stock += buy;
        x -= buy;
      }
      // custo mensal de carregar estoque: ~1,2% do valor ao mês (armazenagem + juros a Selic alta)
      cost += stock * 0.012 * 100;
    }
    const p = priceOf(x, t);
    rows.push({ t, pFree, p, stock, cost, ipca12Free: 0, ipca12: 0 });
  }
  for (const row of rows) {
    const prev = rows[row.t - 12];
    // nos primeiros 12 meses, compara com a tendência
    const baseFree = prev ? prev.pFree : trend(row.t - 12);
    const base = prev ? prev.p : trend(row.t - 12);
    row.ipca12Free = (row.pFree / baseFree - 1) * 100;
    row.ipca12 = (row.p / base - 1) * 100;
  }
  return rows;
}
export function volatility(xs: number[]) {
  const ch: number[] = [];
  for (let i = 1; i < xs.length; i++) ch.push(Math.log(xs[i] / xs[i - 1]) * 100);
  if (!ch.length) return 0;
  const m = ch.reduce((a, b) => a + b, 0) / ch.length;
  return Math.sqrt(ch.reduce((a, b) => a + (b - m) ** 2, 0) / ch.length);
}
