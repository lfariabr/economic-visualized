/** pt-BR number formatting with fixed digits (identical on server and client). */
export function br(x: number, d = 1): string {
  if (!Number.isFinite(x)) return "∞";
  return x.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
}
export const pct = (x: number, d = 1) => `${br(x, d)}%`;
export const brl = (x: number, d = 2) => `R$ ${br(x, d)}`;
export const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
/** month index (0 = jan of `y0`) → "mar/90" */
export const mesAno = (t: number, y0: number) => {
  const tt = Math.round(t);
  const y = y0 + Math.floor(tt / 12);
  return `${MESES[((tt % 12) + 12) % 12]}/${String(y).slice(2)}`;
};
