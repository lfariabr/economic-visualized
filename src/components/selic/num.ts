/** pt-BR number formatting without relying on ICU (identical on server and client). */
export function br(x: number, d = 1): string {
  if (!Number.isFinite(x)) return "∞";
  const neg = x < 0 && Math.abs(x) >= 0.5 * 10 ** -d;
  const s = Math.abs(x).toFixed(d);
  const [int, frac] = s.split(".");
  const withDots = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return (neg ? "−" : "") + withDots + (frac ? "," + frac : "");
}

export const pct = (x: number, d = 1) => `${br(x, d)}%`;
export const pp = (x: number, d = 1) => `${x > 0 ? "+" : ""}${br(x, d)} p.p.`;
export const brl = (x: number, d = 2) => `R$ ${br(x, d)}`;
