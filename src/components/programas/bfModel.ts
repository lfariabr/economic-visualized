/**
 * Bolsa Família — regras aproximadas de 2023 em diante (Lei 14.601/2023).
 * Valores aproximados; o modelo é educacional, não substitui o cálculo oficial.
 */

export const LINHA_ELEGIBILIDADE = 218; // R$ por pessoa por mês
export const BRC = 142; // Benefício de Renda de Cidadania, por pessoa
export const MINIMO_FAMILIA = 600; // Benefício Complementar garante o mínimo
export const BPI = 150; // Benefício Primeira Infância, por criança 0–6
export const BVF = 50; // Benefício Variável Familiar: 7–17, gestante, nutriz
export const SALARIO_MINIMO = 1518; // 2025, aproximado
export const LIMITE_PROTECAO = SALARIO_MINIMO / 2; // meio salário mínimo per capita

export type Familia = {
  adultos: number;
  criancas06: number;
  criancas717: number;
  gestantes: number;
  nutrizes: number;
};

export const pessoas = (f: Familia) => f.adultos + f.criancas06 + f.criancas717;

/** Benefício cheio (sem considerar a renda), com a decomposição. */
export function beneficioCheio(f: Familia) {
  const n = pessoas(f);
  const brc = BRC * n;
  const complementar = Math.max(0, MINIMO_FAMILIA - brc);
  const bpi = BPI * f.criancas06;
  const bvf = BVF * (f.criancas717 + f.gestantes + f.nutrizes);
  return { brc, complementar, bpi, bvf, total: brc + complementar + bpi + bvf };
}

export type Desenho = "seco" | "protecao" | "gradual";

/**
 * Benefício pago dada a renda do trabalho familiar mensal.
 * - seco: perde tudo quando a renda per capita passa de R$ 218.
 * - protecao: entre R$ 218 e meio salário mínimo per capita mantém 50%.
 * - gradual: retira `taxa` centavos por real acima da linha (phase-out).
 */
export function beneficioPago(f: Familia, renda: number, desenho: Desenho, taxa: number, limiteProtecao = LIMITE_PROTECAO) {
  const n = Math.max(1, pessoas(f));
  const pc = renda / n;
  const b = beneficioCheio(f).total;
  if (pc <= LINHA_ELEGIBILIDADE) return b;
  if (desenho === "seco") return 0;
  if (desenho === "protecao") return pc <= limiteProtecao ? b * 0.5 : 0;
  const excesso = renda - LINHA_ELEGIBILIDADE * n;
  return Math.max(0, b - taxa * excesso);
}

/** Até que renda familiar a família ainda recebe algo. */
export function rendaMaximaComBeneficio(f: Familia, desenho: Desenho, taxa: number, limiteProtecao = LIMITE_PROTECAO) {
  const n = Math.max(1, pessoas(f));
  const b = beneficioCheio(f).total;
  if (desenho === "seco") return LINHA_ELEGIBILIDADE * n;
  if (desenho === "protecao") return limiteProtecao * n;
  return LINHA_ELEGIBILIDADE * n + (taxa > 0 ? b / taxa : Infinity);
}

/** Taxa marginal efetiva sobre um ganho de `delta` reais a partir de `renda`. */
export function tmge(f: Familia, renda: number, delta: number, desenho: Desenho, taxa: number) {
  const t0 = renda + beneficioPago(f, renda, desenho, taxa);
  const t1 = renda + delta + beneficioPago(f, renda + delta, desenho, taxa);
  return 1 - (t1 - t0) / delta;
}

/** Maior TMgE encontrada entre 0 e rMax, com um ganho de `delta` (ex.: um bico de R$ 100). */
export function piorTmge(f: Familia, rMax: number, delta: number, desenho: Desenho, taxa: number) {
  let worst = 0;
  let at = 0;
  for (let r = 0; r <= rMax; r += 10) {
    const t = tmge(f, r, delta, desenho, taxa);
    if (t > worst) {
      worst = t;
      at = r;
    }
  }
  return { worst, at };
}
