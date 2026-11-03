/**
 * Alocador estilizado de R$ 100 bi. Coeficientes ilustrativos, inspirados na ordem de grandeza
 * da literatura (multiplicadores Ipea, avaliações do Bolsa Família, estudos sobre desoneração e
 * crédito subsidiado). Não são estimativas oficiais.
 */
export const PIB = 12700; // R$ bi
export const POP = 213; // milhões
export const POBREZA_BASE = 27; // % da população, aprox. (linha ~US$ 6,85 PPC)
export const GINI_BASE = 0.518;
export const DIVIDA_BASE = 78; // % do PIB
const CARGA = 0.33;

export type Uso = "bf" | "gas" | "deson" | "cred" | "inv" | "divida";

export const USOS: { id: Uso; label: string; color: string }[] = [
  { id: "bf", label: "Bolsa Família", color: "#34d399" },
  { id: "gas", label: "Vale-gás", color: "#c084fc" },
  { id: "deson", label: "Desoneração da folha", color: "#f87171" },
  { id: "cred", label: "Crédito subsidiado", color: "#fbbf24" },
  { id: "inv", label: "Investimento público", color: "#60a5fa" },
  { id: "divida", label: "Abater dívida", color: "#8a93a8" },
];

/** pessoas (mil) que deixam a pobreza, côncavo: P·(1 − e^(−x/s)) ou linear */
const pobrezaMil: Record<Uso, (x: number) => number> = {
  bf: (x) => 5000 * (1 - Math.exp(-x / 80)),
  gas: (x) => 1200 * (1 - Math.exp(-x / 15)),
  deson: (x) => 4 * x, // empregos preservados, poucos entre os mais pobres
  cred: (x) => 2 * x,
  inv: (x) => 10 * x,
  divida: () => 0,
};
/** multiplicador de curto prazo (R$ PIB por R$) */
const MULT: Record<Uso, number> = { bf: 1.78, gas: 1.4, deson: 0.6, cred: 0.5, inv: 1.3, divida: 0 };
/** pontos de Gini (×100) por R$ 1 bi, côncavo para o BF */
const gini: Record<Uso, (x: number) => number> = {
  bf: (x) => -2.2 * (1 - Math.exp(-x / 120)),
  gas: (x) => -0.6 * (1 - Math.exp(-x / 25)),
  deson: (x) => 0.002 * x,
  cred: (x) => 0.004 * x,
  inv: (x) => -0.001 * x,
  divida: () => 0,
};

export function efeito(uso: Uso, x: number) {
  const dPib = x * MULT[uso]; // R$ bi
  const pobreza = pobrezaMil[uso](x); // mil pessoas
  // R$ 100 bi de receita extra: "abater dívida" reduz o estoque e poupa ~2 anos de juros (~12% a.a.);
  // os demais usos só ajudam via PIB maior, cujo efeito é transitório (~30% persiste após 2 anos).
  const persiste = 0.3;
  const dDivida =
    (-(uso === "divida" ? x * 1.25 : 0) - CARGA * dPib * persiste) / PIB * 100 - (DIVIDA_BASE * dPib * persiste) / PIB;
  return { dPib, pobreza, dDivida, dGini: gini[uso](x) };
}

export function total(aloc: Record<Uso, number>) {
  let dPib = 0;
  let pobreza = 0;
  let dDivida = 0;
  let dGini = 0;
  for (const u of USOS) {
    const e = efeito(u.id, aloc[u.id]);
    dPib += e.dPib;
    pobreza += e.pobreza;
    dDivida += e.dDivida;
    dGini += e.dGini;
  }
  return { dPib, pobreza, dDivida, dGini };
}
