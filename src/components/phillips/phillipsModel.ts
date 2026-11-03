/**
 * Educational Phillips-curve models (Brazil-flavoured, approximate values).
 * Linear expectations-augmented curve: π = πᵉ − β·(u − u*).
 */
import { clamp, rng } from "@/lib/random";

export const NAIRU = 8;
export const META = 3;

// ---------------------------------------------------------------------------
// 1. Curva original
// ---------------------------------------------------------------------------

/** convex Phillips curve as in Phillips (1958) / Samuelson–Solow (1960) */
export const original = (u: number, k: number, pie = 3, un = 7) => pie + k * (un / u - 1);

export type Pt = { u: number; pi: number; year: number };

export function phillipsCloud(kind: "estavel" | "choques", k: number, seed = 7): Pt[] {
  const r = rng(seed);
  const out: Pt[] = [];
  let pie = 3;
  for (let i = 0; i < 24; i++) {
    const u = r.uniform(4, 11);
    if (kind === "choques") pie = clamp(pie + r.normal(0.6, 1.4), 2, 16);
    out.push({ u, pi: original(u, k, pie) + r.normal(0, 0.6), year: 1960 + (kind === "choques" ? 14 : 0) + i / 2 });
  }
  return out;
}

// ---------------------------------------------------------------------------
// 2. Aceleracionista (Friedman–Phelps) + expectativas racionais
// ---------------------------------------------------------------------------

export type AccelYear = { t: number; u: number; pi: number; pie: number; surprise: boolean };

export function accelStep(
  hist: AccelYear[],
  {
    uTarget,
    beta,
    nairu,
    mode,
    surprise,
  }: { uTarget: number; beta: number; nairu: number; mode: "adaptativas" | "racionais"; surprise: boolean },
): AccelYear {
  const prev = hist[hist.length - 1];
  // política de demanda: a inflação que seria preciso gerar para levar u ao alvo, se πᵉ = π₋₁
  const planned = prev.pi + beta * (nairu - uTarget);
  const extra = surprise ? 2 : 0;
  const pi = planned + extra;
  // racionais: a política anunciada é antecipada; só a surpresa engana
  const pie = mode === "adaptativas" ? prev.pi : planned;
  const u = clamp(nairu - (pi - pie) / beta, 0.5, 25);
  return { t: prev.t + 1, u, pi, pie, surprise };
}

// ---------------------------------------------------------------------------
// 3. NAIRU — componentes e reformas
// ---------------------------------------------------------------------------

export type NairuInputs = { qualif: number; intermed: number; custos: number; seguro: number };

export function nairuParts(x: NairuInputs) {
  return [
    { id: "fric", label: "friccional (busca)", value: 2.6 - 0.8 * x.intermed + 0.7 * x.seguro, color: "#60a5fa" },
    { id: "estr", label: "estrutural (qualificação)", value: 3.2 - 1.3 * x.qualif, color: "#a78bfa" },
    { id: "inst", label: "institucional (custos de contratar)", value: 2.2 - 0.9 * x.custos, color: "#fbbf24" },
  ];
}

// ---------------------------------------------------------------------------
// 4. Taxa de sacrifício
// ---------------------------------------------------------------------------

export type SacYear = { t: number; pi: number; pie: number; u: number; nairu: number; target: number };

export function sacrifice({
  strategy,
  cred,
  hysteresis,
  beta = 0.5,
  pi0 = 10,
  years = 10,
}: {
  strategy: "gradual" | "choque";
  cred: number;
  hysteresis: boolean;
  beta?: number;
  pi0?: number;
  years?: number;
}) {
  const out: SacYear[] = [{ t: 0, pi: pi0, pie: pi0, u: NAIRU, nairu: NAIRU, target: pi0 }];
  let un = NAIRU;
  for (let t = 1; t <= years; t++) {
    const prev = out[t - 1];
    const target = strategy === "choque" ? META : Math.max(META, pi0 - ((pi0 - META) * t) / 5);
    const pie = cred * target + (1 - cred) * prev.pi;
    // BC escolhe a recessão necessária para entregar o alvo do ano
    const u = un + (pie - target) / beta;
    out.push({ t, pi: target, pie, u, nairu: un, target });
    // histerese: desemprego alto e longo eleva a NAIRU, que só volta devagar
    if (hysteresis) un = un + 0.2 * (u - un) - 0.15 * (un - NAIRU);
  }
  const excess = out.reduce((a, p) => a + Math.max(0, p.u - NAIRU), 0);
  return { path: out, excess, ratio: excess / (pi0 - META), peak: Math.max(...out.map((p) => p.u)) };
}

// ---------------------------------------------------------------------------
// 5. Lei de Okun — dados aproximados (IBGE: PIB e PNAD Contínua, média anual)
// ---------------------------------------------------------------------------

export const BR_YEARS: { year: number; g: number; u: number }[] = [
  { year: 2012, g: 1.9, u: 7.4 },
  { year: 2013, g: 3.0, u: 7.2 },
  { year: 2014, g: 0.5, u: 7.0 },
  { year: 2015, g: -3.5, u: 8.6 },
  { year: 2016, g: -3.3, u: 11.6 },
  { year: 2017, g: 1.3, u: 12.7 },
  { year: 2018, g: 1.8, u: 12.3 },
  { year: 2019, g: 1.2, u: 11.9 },
  { year: 2020, g: -3.3, u: 13.8 },
  { year: 2021, g: 4.8, u: 13.2 },
  { year: 2022, g: 3.0, u: 9.3 },
  { year: 2023, g: 3.2, u: 7.8 },
  { year: 2024, g: 3.4, u: 6.6 },
  { year: 2025, g: 2.3, u: 5.8 },
];

export const okunPoints = () =>
  BR_YEARS.slice(1).map((d, i) => ({ year: d.year, g: d.g, du: d.u - BR_YEARS[i].u }));

export function okunFit() {
  const pts = okunPoints();
  const n = pts.length;
  const mg = pts.reduce((a, p) => a + p.g, 0) / n;
  const md = pts.reduce((a, p) => a + p.du, 0) / n;
  const b = pts.reduce((a, p) => a + (p.g - mg) * (p.du - md), 0) / pts.reduce((a, p) => a + (p.g - mg) ** 2, 0);
  const a = md - b * mg;
  return { k: -b, gStar: a / -b };
}

export function okunRmse(k: number, gStar: number) {
  const pts = okunPoints();
  return Math.sqrt(pts.reduce((a, p) => a + (p.du + k * (p.g - gStar)) ** 2, 0) / pts.length);
}

// ---------------------------------------------------------------------------
// 6. Mercado de trabalho (PNAD Contínua, valores aproximados 2025)
// ---------------------------------------------------------------------------

export const PIT = 176; // milhões de pessoas com 14 anos ou mais

export function labor({
  part,
  unemp,
  informal,
  subocup,
  desalent,
  returnFrac,
}: {
  part: number;
  unemp: number;
  informal: number;
  subocup: number;
  desalent: number;
  returnFrac: number;
}) {
  const ft0 = PIT * part;
  const desoc0 = ft0 * unemp;
  const ocup = ft0 - desoc0;
  const back = desalent * returnFrac;
  const ft = ft0 + back;
  const desoc = desoc0 + back;
  const desal = desalent - back;
  const potencial = desal * 1.8; // força de trabalho potencial ≈ desalentados + outros disponíveis
  const informais = ocup * informal;
  const formais = ocup - informais;
  const subo = ocup * subocup;
  const fora = PIT - ft - desal;
  return {
    ft,
    ocup,
    formais,
    informais,
    subo,
    desoc,
    desal,
    fora,
    rate: (desoc / ft) * 100,
    partRate: (ft / PIT) * 100,
    subutil: ((desoc + subo + potencial) / (ft + potencial)) * 100,
  };
}
