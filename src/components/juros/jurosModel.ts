/**
 * Pure model code for chapter 05 (CDI, juros & crédito).
 * Every function is deterministic and simplified for teaching — not a forecast.
 */

/** annual rate (%) → equivalent monthly rate (%) */
export const aaToAm = (aa: number) => ((1 + aa / 100) ** (1 / 12) - 1) * 100;
/** monthly rate (%) → equivalent annual rate (%) */
export const amToAa = (am: number) => ((1 + am / 100) ** 12 - 1) * 100;

/* ------------------------------------------------------------------ */
/* 1. Selic → CDI → investimentos                                      */
/* ------------------------------------------------------------------ */

/** CDI (taxa DI) anda colada na Selic Over, ~0,10 p.p. abaixo da meta. */
export const cdiFromSelic = (selic: number) => Math.max(0, selic - 0.1);

/** IR regressivo da renda fixa (alíquota sobre o rendimento) por prazo em meses. */
export function irRegressivo(meses: number) {
  const dias = meses * 30;
  if (dias <= 180) return 22.5;
  if (dias <= 360) return 20;
  if (dias <= 720) return 17.5;
  return 15;
}

/** TR aproximada (% a.m.): positiva quando a Selic é alta, ~0 quando baixa. */
export const trAprox = (selic: number) => Math.max(0, (selic - 8.5) * 0.028);

/** Poupança (regra de 2012): Selic > 8,5% → 0,5% a.m. + TR; senão 70% da Selic + TR. Retorna % a.m. */
export function poupancaAm(selic: number) {
  const tr = trAprox(selic);
  if (selic > 8.5) return ((1.005 * (1 + tr / 100)) - 1) * 100;
  return ((1 + aaToAm(selic * 0.7) / 100) * (1 + tr / 100) - 1) * 100;
}

export type Produto = {
  id: string;
  label: string;
  color: string;
  /** gross monthly rate (%) given the inputs */
  am: number;
  isento: boolean;
  /** custódia B3 % a.a. sobre o saldo */
  custodia?: number;
  nota: string;
};

export function produtos(p: {
  selic: number;
  ipca: number;
  cdbPct: number;
  lciPct: number;
  pre: number;
  ipcaReal: number;
}): Produto[] {
  const cdi = cdiFromSelic(p.selic);
  return [
    { id: "poup", label: "Poupança", color: "#8a93a8", am: poupancaAm(p.selic), isento: true, nota: p.selic > 8.5 ? "0,5% a.m. + TR" : "70% da Selic + TR" },
    { id: "cdb", label: `CDB ${p.cdbPct}% do CDI`, color: "#22d3ee", am: aaToAm((cdi * p.cdbPct) / 100), isento: false, nota: "IR regressivo, FGC" },
    { id: "lci", label: `LCI/LCA ${p.lciPct}% do CDI`, color: "#34d399", am: aaToAm((cdi * p.lciPct) / 100), isento: true, nota: "isento de IR p/ PF" },
    { id: "tsel", label: "Tesouro Selic", color: "#fbbf24", am: aaToAm(p.selic + 0.05), isento: false, custodia: 0.2, nota: "Selic + ~0,05%, custódia 0,2%" },
    { id: "tpre", label: `Prefixado ${p.pre.toFixed(1).replace(".", ",")}%`, color: "#f472b6", am: aaToAm(p.pre), isento: false, custodia: 0.2, nota: "levado ao vencimento" },
    {
      id: "tipca",
      label: `IPCA+ ${p.ipcaReal.toFixed(1).replace(".", ",")}%`,
      color: "#a78bfa",
      am: (((1 + p.ipcaReal / 100) * (1 + p.ipca / 100)) ** (1 / 12) - 1) * 100,
      isento: false,
      custodia: 0.2,
      nota: "juro real + inflação",
    },
  ];
}

/** Net value path of R$ `v0` invested for `meses`, redeemed at each month (IR by elapsed time). */
export function caminhoLiquido(prod: Produto, v0: number, meses: number) {
  const pts: [number, number][] = [[0, v0]];
  let bruto = v0;
  for (let m = 1; m <= meses; m++) {
    bruto *= 1 + prod.am / 100;
    bruto *= 1 - (prod.custodia ?? 0) / 100 / 12;
    const ganho = bruto - v0;
    const ir = prod.isento || ganho <= 0 ? 0 : (ganho * irRegressivo(m)) / 100;
    pts.push([m, bruto - ir]);
  }
  return pts;
}

/* ------------------------------------------------------------------ */
/* 2. Juros compostos                                                  */
/* ------------------------------------------------------------------ */

export function compostos(v0: number, am: number, meses: number) {
  const comp: [number, number][] = [];
  const simp: [number, number][] = [];
  for (let m = 0; m <= meses; m++) {
    comp.push([m, v0 * (1 + am / 100) ** m]);
    simp.push([m, v0 * (1 + (am / 100) * m)]);
  }
  return { comp, simp };
}

/** months to double at monthly rate am (%) */
export const mesesParaDobrar = (am: number) => (am <= 0 ? Infinity : Math.log(2) / Math.log(1 + am / 100));

/* ------------------------------------------------------------------ */
/* 3. Spread bancário                                                  */
/* ------------------------------------------------------------------ */

export type SpreadIn = {
  selic: number;
  /** perda esperada da carteira, % a.a. */
  inad: number;
  /** custo administrativo, % da carteira a.a. */
  admin: number;
  /** compulsório efetivo (fração não remunerada da captação), % */
  compuls: number;
  /** margem líquida desejada, p.p. */
  margem: number;
  /** IR + CSLL + PIS/Cofins sobre o resultado, % */
  imposto: number;
};

/**
 * Taxa ao tomador por "preço de equilíbrio" do banco:
 *   (1 − L)·(1 + i) = 1 + f + compulsório  → cobre captação e perdas
 *   i += custo administrativo + margem/(1 − t)
 */
export function spread(p: SpreadIn) {
  const f = cdiFromSelic(p.selic) / 100;
  const c = p.compuls / 100;
  const L = p.inad / 100;
  const compPP = (c / (1 - c)) * f * 100; // captação extra p/ compensar a parte parada no BC
  const baseComPerda = ((1 + f + compPP / 100) / (1 - L) - 1) * 100;
  const inadPP = baseComPerda - f * 100 - compPP;
  const impostoPP = (p.margem / (1 - p.imposto / 100)) - p.margem;
  const taxa = baseComPerda + p.admin + p.margem + impostoPP;
  return {
    captacao: f * 100,
    compulsorio: compPP,
    inadimplencia: inadPP,
    admin: p.admin,
    impostos: impostoPP,
    margem: p.margem,
    taxa,
    spread: taxa - f * 100,
  };
}

/* ------------------------------------------------------------------ */
/* 4. Rotativo vs consignado                                           */
/* ------------------------------------------------------------------ */

export type Pagamento = "minimo" | "fixo" | "nada";

export type DividaPath = { saldo: [number, number][]; pago: number; juros: number; quitou: number | null };

/**
 * Month-by-month debt. Each month: juros = saldo·i (capped so that cumulative
 * juros ≤ principal when `teto`), then pays (mínimo = pct of fatura, or fixed).
 */
export function divida(p0: number, am: number, meses: number, pag: Pagamento, fixo: number, minPct: number, teto: boolean): DividaPath {
  let s = p0;
  let jurosAcum = 0;
  let pago = 0;
  let quitou: number | null = null;
  const saldo: [number, number][] = [[0, p0]];
  for (let m = 1; m <= meses; m++) {
    if (s > 0.005) {
      let j = (s * am) / 100;
      if (teto) j = Math.max(0, Math.min(j, p0 - jurosAcum));
      jurosAcum += j;
      s += j;
      const pay = pag === "nada" ? 0 : pag === "minimo" ? Math.min(s, Math.max(50, (s * minPct) / 100)) : Math.min(s, fixo);
      s -= pay;
      pago += pay;
      if (s <= 0.005 && quitou === null) {
        s = 0;
        quitou = m;
      }
    }
    saldo.push([m, s]);
  }
  return { saldo, pago, juros: jurosAcum, quitou };
}

/* ------------------------------------------------------------------ */
/* 5. Tabela Price vs SAC                                              */
/* ------------------------------------------------------------------ */

export type Parcela = { m: number; parcela: number; juros: number; amort: number; saldo: number };

export function price(pv: number, im: number, n: number): Parcela[] {
  const i = im / 100;
  const pmt = i === 0 ? pv / n : (pv * i) / (1 - (1 + i) ** -n);
  const out: Parcela[] = [];
  let s = pv;
  for (let m = 1; m <= n; m++) {
    const j = s * i;
    const a = pmt - j;
    s = Math.max(0, s - a);
    out.push({ m, parcela: pmt, juros: j, amort: a, saldo: s });
  }
  return out;
}

export function sac(pv: number, im: number, n: number): Parcela[] {
  const i = im / 100;
  const a = pv / n;
  const out: Parcela[] = [];
  let s = pv;
  for (let m = 1; m <= n; m++) {
    const j = s * i;
    s = Math.max(0, s - a);
    out.push({ m, parcela: a + j, juros: j, amort: a, saldo: s });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* 6. Curva de juros (expectativas + prêmio)                           */
/* ------------------------------------------------------------------ */

export type CurvaIn = { s0: number; sLongo: number; kappa: number; premio: number };

/** expected Selic at horizon t (years): converges exponentially to sLongo */
export const selicEsperada = (c: CurvaIn, t: number) => c.sLongo + (c.s0 - c.sLongo) * Math.exp(-t / c.kappa);

/** premium grows with maturity and saturates */
export const premioTermo = (c: CurvaIn, tau: number) => c.premio * (1 - Math.exp(-tau / 2.5));

/** yield for maturity tau = average expected Selic over [0, tau] + term premium */
export function taxaVertice(c: CurvaIn, tau: number) {
  const t = Math.max(tau, 1e-3);
  const media = c.sLongo + ((c.s0 - c.sLongo) * c.kappa * (1 - Math.exp(-t / c.kappa))) / t;
  return media + premioTermo(c, t);
}

/* ------------------------------------------------------------------ */
/* 7. Marcação a mercado                                               */
/* ------------------------------------------------------------------ */

/** price of a zero-coupon bond (LTN / NTN-B Principal), face 1000, yield y% a.a., T years */
export const precoZero = (y: number, T: number) => 1000 / (1 + y / 100) ** Math.max(0, T);

/** Macaulay duration of a zero = T; modified = T/(1+y) */
export const durationMod = (y: number, T: number) => T / (1 + y / 100);

/* ------------------------------------------------------------------ */
/* 8. Crédito e inadimplência (feedback)                               */
/* ------------------------------------------------------------------ */

export type CreditoState = { t: number; selic: number; inad: number; spread: number; taxa: number; credito: number };
export type CreditoParams = { selicAlvo: number; gamma: number; beta: number };

export const CREDITO0 = { selic: 10.5, inad: 3.5, spread: 18, credito: 100 };
const TAXA0 = CREDITO0.selic + CREDITO0.spread;

export function creditoInicial(): CreditoState {
  return { t: 0, ...CREDITO0, taxa: TAXA0 };
}

/**
 * One quarter:
 *   Selic anda até 0,75 p.p./tri rumo ao alvo do Copom
 *   inadimplência converge (25%/tri) para L0 + β·(taxa − taxa0)
 *   spread = S0 + γ·(inad − L0)  → taxa = Selic + spread
 *   crédito real cresce 2%/tri − 0,15·(taxa − taxa0)
 */
export function creditoStep(s: CreditoState, p: CreditoParams): CreditoState {
  const d = p.selicAlvo - s.selic;
  const selic = s.selic + Math.sign(d) * Math.min(Math.abs(d), 0.75);
  const alvoInad = CREDITO0.inad + p.beta * (s.taxa - TAXA0);
  const inad = Math.min(60, Math.max(0.5, s.inad + 0.25 * (alvoInad - s.inad)));
  const spreadV = Math.max(2, CREDITO0.spread + p.gamma * (inad - CREDITO0.inad));
  const taxa = selic + spreadV;
  const g = 2 - 0.15 * (taxa - TAXA0);
  return { t: s.t + 1, selic, inad, spread: spreadV, taxa, credito: s.credito * (1 + g / 100) };
}
