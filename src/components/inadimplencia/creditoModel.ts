/**
 * Modelos pequenos do capítulo: bola de neve do rotativo, comprometimento de
 * renda (DSR), seleção adversa (Stiglitz–Weiss), cadastro positivo e ciclo do
 * crédito. Todos simplificados, para fins didáticos.
 */
import { clamp, rng } from "@/lib/random";

/* ───────────────────────── bola de neve do rotativo ───────────────────────── */

export type BolaParams = {
  saldo0: number; // R$
  juros: number; // % a.m.
  rombo: number; // R$/mês que vai para o cartão
  capacidade: number; // R$/mês disponível para pagar dívidas
  minimo: number; // % do saldo
  modo: "minimo" | "maximo";
  teto: boolean; // encargos ≤ 100% do principal (regra de 2024)
};

export type BolaMes = {
  t: number;
  saldo: number;
  minimo: number;
  pago: number;
  encargos: number; // juros + mora cobrados, acumulado
  totalPago: number;
  atraso: number; // meses sem pagar o mínimo
  negativado: boolean;
};

export function bolaDeNeve(p: BolaParams, meses = 36): BolaMes[] {
  const i = p.juros / 100;
  let S = p.saldo0;
  let principal = p.saldo0;
  let encargos = 0;
  let totalPago = 0;
  let atraso = 0;
  let negativado = false;
  const out: BolaMes[] = [];
  for (let t = 0; t <= meses; t++) {
    const minimo = Math.min(S, (p.minimo / 100) * S);
    const pago = p.modo === "minimo" ? Math.min(minimo, p.capacidade) : Math.min(S, p.capacidade);
    if (pago + 0.5 < minimo) atraso += 1;
    else atraso = 0;
    if (atraso >= 3) negativado = true;
    out.push({ t, saldo: S, minimo, pago, encargos, totalPago, atraso, negativado });
    totalPago += pago;
    const resto = Math.max(0, S - pago);
    const taxa = i + (atraso > 0 ? 0.01 : 0) + (atraso === 1 ? 0.02 : 0); // mora 1% a.m. + multa 2%
    let j = resto * taxa;
    if (p.teto) j = Math.max(0, Math.min(j, principal - encargos));
    encargos += j;
    principal += p.rombo;
    S = resto + j + p.rombo;
  }
  return out;
}

/* ───────────────────────── comprometimento de renda (DSR) ───────────────────────── */

export type DsrParams = {
  selic: number; // % a.a.
  endividamento: number; // dívida / renda anual, %
  spread: number; // p.p. a.a. sobre a Selic (média da carteira)
  prazo: number; // meses
  repactua: number; // % da carteira com taxa que já acompanha a Selic nova
};

export const SELIC_REF = 15;

export function taxaMediaAA(p: DsrParams) {
  const nova = p.selic + p.spread;
  const velha = SELIC_REF + p.spread;
  return (p.repactua / 100) * nova + (1 - p.repactua / 100) * velha;
}

export const aaParaAm = (aa: number) => (1 + aa / 100) ** (1 / 12) - 1;

/** DSR = (E·12) · i / (1 − (1+i)^−n): parcela Price da dívida como % da renda mensal */
export function dsr(p: DsrParams) {
  const i = aaParaAm(taxaMediaAA(p));
  const D = (p.endividamento / 100) * 12; // dívida em meses de renda
  const pmt = (D * i) / (1 - (1 + i) ** -p.prazo);
  const juros = D * i;
  return { total: 100 * pmt, juros: 100 * juros, amort: 100 * (pmt - juros), iam: i * 100 };
}

/** distribuição (log-normal) do DSR entre famílias endividadas, média = m */
export function dsrDistribuicao(m: number, sigma = 0.55) {
  const mu = Math.log(Math.max(0.1, m)) - (sigma * sigma) / 2;
  const dens = (x: number) => (x <= 0 ? 0 : Math.exp(-((Math.log(x) - mu) ** 2) / (2 * sigma * sigma)) / (x * sigma * Math.sqrt(2 * Math.PI)));
  const cdf = (x: number) => (x <= 0 ? 0 : 0.5 * (1 + erf((Math.log(x) - mu) / (sigma * Math.SQRT2))));
  return { dens, cdf };
}

function erf(x: number) {
  // Abramowitz–Stegun 7.1.26
  const s = Math.sign(x);
  const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a);
  return s * y;
}

/* ───────────────────────── seleção adversa (Stiglitz–Weiss) ───────────────────────── */

export type TipoTomador = "bom" | "medio" | "ruim";
export type Tomador = { tipo: TipoTomador; p0: number; kappa: number; rmax: number };

export const TOMADOR_COR: Record<TipoTomador, string> = { bom: "#34d399", medio: "#fbbf24", ruim: "#f87171" };
export const TOMADOR_LABEL: Record<TipoTomador, string> = { bom: "bom pagador", medio: "médio", ruim: "arriscado" };

export function criarTomadores(n = 200, seed = 7): Tomador[] {
  const r = rng(seed);
  const out: Tomador[] = [];
  for (let k = 0; k < n; k++) {
    const u = r.next();
    if (u < 0.45) out.push({ tipo: "bom", p0: clamp(r.normal(0.97, 0.01), 0.9, 0.995), kappa: 0.02, rmax: clamp(r.normal(38, 10), 12, 80) });
    else if (u < 0.8) out.push({ tipo: "medio", p0: clamp(r.normal(0.9, 0.02), 0.8, 0.97), kappa: 0.06, rmax: clamp(r.normal(75, 15), 30, 140) });
    else out.push({ tipo: "ruim", p0: clamp(r.normal(0.72, 0.05), 0.55, 0.85), kappa: 0.3, rmax: 999 });
  }
  return out;
}

/** probabilidade de pagar à taxa r (% a.a.): juro alto aperta o orçamento (risco moral) */
export const pPagar = (t: Tomador, r: number) => clamp(t.p0 - t.kappa * (r / 100), 0.05, 1);

export type Carteira = { candidatos: number; pd: number; retorno: number; lucro: number; porTipo: Record<TipoTomador, number> };

/** retorno esperado do banco por R$ 1 emprestado, com recuperação ρ e custo de captação c (% a.a.) */
export function carteira(ts: Tomador[], r: number, rho: number, custo: number): Carteira {
  const ap = ts.filter((t) => t.rmax >= r);
  const porTipo: Record<TipoTomador, number> = { bom: 0, medio: 0, ruim: 0 };
  for (const t of ap) porTipo[t.tipo]++;
  if (!ap.length) return { candidatos: 0, pd: 0, retorno: 0, lucro: -custo, porTipo };
  let pd = 0;
  let ret = 0;
  for (const t of ap) {
    const p = pPagar(t, r);
    pd += 1 - p;
    ret += p * (1 + r / 100) + (1 - p) * rho;
  }
  pd /= ap.length;
  ret /= ap.length;
  return { candidatos: ap.length, pd: pd * 100, retorno: (ret - 1) * 100, lucro: (ret - 1) * 100 - custo, porTipo };
}

/* ───────────────────────── cadastro positivo / score ───────────────────────── */

export type ScoreParams = { qualidade: number; pdBom: number; pdRuim: number; fatiaRuim: number; custo: number; rho: number };

const normPdf = (x: number, m: number) => Math.exp(-((x - m) ** 2) / 2) / Math.sqrt(2 * Math.PI);
const normCdf = (x: number) => 0.5 * (1 + erf(x / Math.SQRT2));

/** taxa que zera o lucro esperado: (1+r)(1−PD) + PD·ρ = 1 + c */
export const taxaJusta = (pd: number, custo: number, rho: number) => (100 * (1 + custo / 100 - pd * rho)) / (1 - pd) - 100;

export function scoreModelo(p: ScoreParams) {
  const d = 3.2 * (p.qualidade / 100); // separação entre as distribuições de score
  const mb = d / 2;
  const mr = -d / 2;
  const pr = p.fatiaRuim / 100;
  const pdB = p.pdBom / 100;
  const pdR = p.pdRuim / 100;
  const post = (s: number) => {
    const fr = pr * normPdf(s, mr);
    const fb = (1 - pr) * normPdf(s, mb);
    return fr / (fr + fb);
  };
  const pdScore = (s: number) => post(s) * pdR + (1 - post(s)) * pdB;
  const taxaScore = (s: number) => taxaJusta(pdScore(s), p.custo, p.rho);
  // taxa média paga por cada tipo (integra numericamente sobre o score)
  let tb = 0;
  let tr = 0;
  let wb = 0;
  let wr = 0;
  for (let s = -6; s <= 6; s += 0.05) {
    const x = taxaScore(s);
    const fb = normPdf(s, mb);
    const fr = normPdf(s, mr);
    tb += x * fb;
    tr += x * fr;
    wb += fb;
    wr += fr;
  }
  return {
    mb,
    mr,
    dens: (s: number) => ({ bom: (1 - pr) * normPdf(s, mb), ruim: pr * normPdf(s, mr) }),
    taxaScore,
    taxaBons: tb / wb,
    taxaRuins: tr / wr,
    justaBons: taxaJusta(pdB, p.custo, p.rho),
    justaRuins: taxaJusta(pdR, p.custo, p.rho),
    pooled: taxaJusta(pr * pdR + (1 - pr) * pdB, p.custo, p.rho),
    acerto: 100 * normCdf(d / 2), // chance de um bom ter score acima do ponto médio
  };
}

/* ───────────────────────── ciclo do crédito (estilizado) ───────────────────────── */

// valores anuais aproximados (Selic média, desemprego PNAD/aprox., PIB real) — só para dar forma ao ciclo
export const ANOS = [2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019];
const SELIC_ANO = [12.5, 10.0, 10.0, 11.7, 8.5, 8.4, 11.0, 13.6, 14.1, 10.1, 6.6, 6.0];
const DESEMP_ANO = [8.0, 8.6, 7.7, 7.0, 7.4, 7.2, 6.9, 8.9, 11.6, 12.8, 12.4, 12.0];
const PIB_ANO = [5.1, -0.1, 7.5, 4.0, 1.9, 3.0, 0.5, -3.5, -3.3, 1.3, 1.8, 1.2];

const interp = (xs: number[], t: number) => {
  const k = clamp(Math.floor(t), 0, xs.length - 1);
  const f = t - k;
  return k >= xs.length - 1 ? xs[xs.length - 1] : xs[k] * (1 - f) + xs[k + 1] * f;
};

export type CicloParams = { otimismo: number; reacao: number; publicos: boolean; prazo: number };
export type CicloTri = { ano: number; selic: number; desemp: number; pib: number; credito: number; dsr: number; inad: number; publico: number };

export const TRIMESTRES = (ANOS.length - 1) * 4;

export function ciclo(p: CicloParams): CicloTri[] {
  const out: CicloTri[] = [];
  let E = 30; // crédito às famílias, % da renda anual
  let inad = 4;
  for (let q = 0; q <= TRIMESTRES; q++) {
    const t = q / 4;
    const ano = ANOS[0] + t;
    const selic = interp(SELIC_ANO, t);
    const desemp = interp(DESEMP_ANO, t);
    const pib = interp(PIB_ANO, t);
    // bancos públicos aceleram em 2009–2014 e recuam depois
    const publico = p.publicos ? (ano >= 2009 && ano < 2014.5 ? 0.6 : ano >= 2015 && ano < 2017 ? -0.5 : 0) : 0;
    const aa = selic + 22; // taxa média aproximada da carteira PF (a.a.)
    const i = aaParaAm(aa);
    const D = (E / 100) * 12;
    const dsrT = (100 * D * i) / (1 - (1 + i) ** -p.prazo);
    out.push({ ano, selic, desemp, pib, credito: E, dsr: dsrT, inad, publico });
    // crescimento real trimestral do crédito (%): otimismo com a economia, freio do juro e da inadimplência
    const g = 0.4 + (p.otimismo / 100) * 0.9 * Math.max(0, pib) - 0.12 * (selic - 10) - (p.reacao / 100) * 1.6 * Math.max(0, inad - 5) + publico;
    E = clamp(E * (1 + g / 100) / (1 + pib / 400), 10, 90);
    const alvo = 3 + 0.3 * Math.max(0, dsrT - 16) + 0.3 * (desemp - 7);
    inad = inad + 0.3 * (alvo - inad);
  }
  return out;
}
