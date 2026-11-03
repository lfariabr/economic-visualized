import { rng } from "@/lib/random";

/* ───────────── Dinâmica básica ───────────── */

/** d_{t+1} = d_t·(1+r)/(1+g) − s  (todas as taxas em fração; d e s em % do PIB) */
export const stepDebt = (d: number, r: number, g: number, s: number) => (d * (1 + r)) / (1 + g) - s;

export function debtPath(d0: number, r: number, g: number, s: number, years: number) {
  const out: [number, number][] = [[0, d0]];
  let d = d0;
  for (let k = 1; k <= years; k++) {
    d = stepDebt(d, r, g, s);
    out.push([k, d]);
  }
  return out;
}

/** primário que estabiliza a dívida: s* = d·(r−g)/(1+g) */
export const sStar = (d: number, r: number, g: number) => (d * (r - g)) / (1 + g);

/* ───────────── Bola de neve: prêmio de risco endógeno ───────────── */

/** r(d) = r0 + κ·max(0, d − limiar)  (κ em p.p. de juro por p.p. de dívida) */
export const rOfD = (d: number, r0: number, kappa: number, thr: number, on: boolean) =>
  r0 + (on ? (kappa / 100) * Math.max(0, d - thr) : 0);

export function snowballPath(
  d0: number,
  r0: number,
  g: number,
  s: number,
  kappa: number,
  thr: number,
  on: boolean,
  years: number,
  shockYear: number | null,
  shockSize: number,
) {
  const debt: [number, number][] = [[0, d0]];
  const rate: [number, number][] = [[0, rOfD(d0, r0, kappa, thr, on) * 100]];
  let d = d0;
  for (let k = 1; k <= years; k++) {
    const r = rOfD(d, r0, kappa, thr, on);
    d = stepDebt(d, r, g, s);
    if (shockYear !== null && k === shockYear) d += shockSize;
    d = Math.min(d, 400);
    debt.push([k, d]);
    rate.push([k, rOfD(d, r0, kappa, thr, on) * 100]);
  }
  return { debt, rate };
}

/** ponto de não retorno: menor d onde a dívida passa a crescer sozinha (f(d) = d(1+r(d))/(1+g) − s − d > 0 e segue positiva) */
export function tippingPoint(r0: number, g: number, s: number, kappa: number, thr: number, on: boolean) {
  const f = (d: number) => (d * (1 + rOfD(d, r0, kappa, thr, on))) / (1 + g) - s - d;
  // procura a última mudança de sinal de − para + entre 0 e 300
  let tip: number | null = null;
  let prev = f(0);
  for (let d = 0.5; d <= 300; d += 0.5) {
    const v = f(d);
    if (prev <= 0 && v > 0) tip = d;
    if (prev > 0 && v <= 0) tip = null;
    prev = v;
  }
  if (tip === null && f(0) > 0) return 0;
  return tip;
}

/* ───────────── Composição da DPMFi ───────────── */

export type Composition = { selic: number; pre: number; ipca: number; cambio: number };
export const COMP_2025: Composition = { selic: 0.47, pre: 0.21, ipca: 0.27, cambio: 0.05 };
/** DPMFi ≈ R$ 7,9 tri; PIB ≈ R$ 12,7 tri (valores aproximados) */
export const DPMFI = 7900;
export const PIB = 12700;
/** fração dos prefixados que vence em 12 meses e é rolada à nova taxa */
export const PRE_ROLL = 0.35;

export type Shocks = { selic: boolean; ipca: boolean; dolar: boolean };

export function shockImpact(c: Composition, sh: Shocks) {
  const selic = sh.selic ? DPMFI * (c.selic + c.pre * PRE_ROLL) * 0.03 : 0;
  const ipca = sh.ipca ? DPMFI * c.ipca * 0.05 : 0;
  const dolar = sh.dolar ? DPMFI * c.cambio * 0.3 : 0;
  const total = selic + ipca + dolar;
  return { selic, ipca, dolar, total, pctPib: (total / PIB) * 100 };
}

/* ───────────── Arcabouço fiscal × teto ───────────── */

export type FiscalYear = {
  year: number;
  revGrowth: number;
  receita: number; // % PIB
  despesaArc: number;
  despesaTeto: number;
  primArc: number;
  primTeto: number;
  meta: number;
  limiteArc: number; // crescimento real permitido (%)
  punido: boolean;
};

/** metas de primário (% PIB) a partir de 2025 — valores aproximados da LDO */
export const METAS = [0, 0.25, 0.5, 1, 1.25, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5];

export function fiscalSim(opts: { g: number; revTrend: number; sd: number; seed: number; shockYear: number | null; years: number }) {
  const r = rng(opts.seed);
  const out: FiscalYear[] = [];
  let pib = 100;
  let receita = 18.6; // R$ "reais" em unidades de PIB-base
  let despArc = 19.0;
  let despTeto = 19.0;
  let lastRevGrowth = opts.revTrend;
  let punido = false;
  for (let k = 0; k <= opts.years; k++) {
    if (k > 0) {
      const shock = r.normal(0, opts.sd) + (opts.shockYear === k ? -6 : 0);
      const revGrowth = opts.revTrend + shock;
      const fator = punido ? 0.5 : 0.7;
      const limite = Math.min(2.5, Math.max(0.6, fator * lastRevGrowth));
      despArc *= 1 + limite / 100;
      // teto: despesa real congelada
      receita *= 1 + revGrowth / 100;
      pib *= 1 + (opts.g + (opts.shockYear === k ? -3 : 0)) / 100;
      lastRevGrowth = revGrowth;
      const meta = METAS[Math.min(k, METAS.length - 1)];
      const primArc = ((receita - despArc) / pib) * 100;
      punido = primArc < meta - 0.25;
      out.push({
        year: 2025 + k,
        revGrowth,
        receita: (receita / pib) * 100,
        despesaArc: (despArc / pib) * 100,
        despesaTeto: (despTeto / pib) * 100,
        primArc,
        primTeto: ((receita - despTeto) / pib) * 100,
        meta,
        limiteArc: limite,
        punido,
      });
    } else {
      out.push({
        year: 2025,
        revGrowth: 0,
        receita: receita,
        despesaArc: despArc,
        despesaTeto: despTeto,
        primArc: receita - despArc,
        primTeto: receita - despTeto,
        meta: METAS[0],
        limiteArc: 0,
        punido: false,
      });
    }
  }
  return out;
}

/* ───────────── Rigidez orçamentária ───────────── */

export type Rubrica = { id: string; label: string; v0: number; color: string };
/** despesa primária federal aproximada, R$ bi de 2025 */
export const RUBRICAS: Rubrica[] = [
  { id: "prev", label: "Previdência (RGPS)", v0: 1000, color: "#f87171" },
  { id: "pessoal", label: "Pessoal", v0: 390, color: "#fb923c" },
  { id: "bpc", label: "BPC e assistência", v0: 120, color: "#fbbf24" },
  { id: "saude", label: "Saúde (piso)", v0: 230, color: "#60a5fa" },
  { id: "educ", label: "Educação (piso)", v0: 130, color: "#818cf8" },
  { id: "outras", label: "Outras obrigatórias", v0: 330, color: "#8a93a8" },
];
export const DISCR0 = 200;
export const SHUTDOWN = 120;

export function rigidity(opts: { sm: number; receita: number; years: number; demog: number; pisos: boolean; smLink: boolean }) {
  const sm = opts.smLink ? opts.sm : 0;
  const piso = opts.pisos ? opts.receita : 0.6;
  const total0 = RUBRICAS.reduce((s, r) => s + r.v0, 0) + DISCR0;
  const limite = Math.min(2.5, Math.max(0.6, 0.7 * opts.receita));
  const rows: { year: number; parts: Record<string, number>; discr: number; limite: number }[] = [];
  for (let k = 0; k <= opts.years; k++) {
    const gr: Record<string, number> = {
      prev: opts.demog + 0.8 * sm,
      pessoal: 1,
      bpc: 2.5 + sm,
      saude: piso,
      educ: piso,
      outras: 1.5,
    };
    const parts: Record<string, number> = {};
    for (const r of RUBRICAS) parts[r.id] = r.v0 * Math.pow(1 + gr[r.id] / 100, k);
    const lim = total0 * Math.pow(1 + limite / 100, k);
    const obrig = Object.values(parts).reduce((a, b) => a + b, 0);
    rows.push({ year: 2025 + k, parts, discr: lim - obrig, limite: lim });
  }
  return { rows, limite };
}

/* ───────────── Rolagem ───────────── */

export function rolloverSim(opts: {
  short: number; // fração vincendo em 12 meses (prefixada/IPCA de curto prazo)
  selic: number; // fração pós-fixada (reprecifica imediatamente)
  spike: number; // p.p. de alta nos juros durante a crise
  duration: number; // anos de crise
  cushion: number; // meses de vencimentos cobertos pelo colchão
  years: number;
  base: number; // juro nominal médio de partida (%)
  debt: number; // % PIB
}) {
  const out: { year: number; avg: number; cost: number }[] = [];
  let avgFixed = opts.base;
  const fixedShare = 1 - opts.selic;
  const roll = opts.short / Math.max(1e-9, fixedShare); // fração do estoque fixo que vence por ano
  for (let k = 0; k <= opts.years; k++) {
    const inCrisis = k >= 1 && k <= opts.duration;
    const market = opts.base + (inCrisis ? opts.spike : 0);
    if (k >= 1) {
      // o colchão evita emitir no pior momento: cobre parte dos vencimentos do 1º ano de crise
      const covered = k === 1 ? Math.min(1, opts.cushion / 12) : 0;
      const rolled = Math.min(1, roll) * (1 - covered);
      avgFixed = avgFixed * (1 - rolled) + market * rolled;
    }
    const selicRate = market;
    const avg = fixedShare * avgFixed + opts.selic * selicRate;
    out.push({ year: k, avg, cost: (avg / 100) * opts.debt });
  }
  return out;
}

/* ───────────── Inflação e dívida ───────────── */

/** variação da dívida/PIB (p.p.) em 1 ano por efeito da inflação, por indexador */
export function inflationEffect(d: number, c: Composition, pi: number, piE: number, surprise: boolean) {
  // dívida nominal fixa: corroída pela inflação não antecipada (se antecipada, o juro já embutiu)
  const unexpected = surprise ? pi - piE : 0;
  const pre = -d * c.pre * (unexpected / (100 + pi));
  // IPCA+: o principal acompanha a inflação — nenhuma corrosão
  const ipca = 0;
  // Selic: o BC reage à inflação subindo juros (Taylor ~1,5): custo real sobe
  const selic = d * c.selic * ((0.5 * Math.max(0, unexpected)) / 100);
  const cambio = 0;
  return { pre, ipca, selic, cambio, total: pre + ipca + selic + cambio };
}
