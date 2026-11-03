/** pt-BR number formatting with fixed digits (identical on server and client). */
export const nf = (x: number, d = 1) =>
  Number.isFinite(x) ? x.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d }) : "∞";
export const pct = (x: number, d = 1) => `${nf(x, d)}%`;
/** signed percent: +3,2% / −1,0% */
export const spct = (x: number, d = 1) => `${x > 0.00001 ? "+" : x < -0.00001 ? "−" : ""}${nf(Math.abs(x), d)}%`;
export const brl = (x: number, d = 2) => `${x < 0 ? "−" : ""}R$ ${nf(Math.abs(x), d)}`;
export const r1 = (v: number) => Math.round(v * 10) / 10;
