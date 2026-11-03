/** Deterministic pt-BR number formatting (identical on server and client). */
export function num(x: number, d = 1): string {
  if (!Number.isFinite(x)) return "∞";
  const s = Math.abs(x).toFixed(d);
  const [i, f] = s.split(".");
  const ii = i.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const neg = x < 0 && Number(s) !== 0;
  return (neg ? "−" : "") + ii + (f ? "," + f : "");
}
export const pct = (x: number, d = 1) => `${num(x, d)}%`;
export const brl = (x: number, d = 2) => (x < 0 ? "−R$ " : "R$ ") + num(Math.abs(x), d);
/** signed: +1,2 / −0,4 */
export const sgn = (x: number, d = 1) => (x > 0 && Number(Math.abs(x).toFixed(d)) !== 0 ? "+" : "") + num(x, d);
