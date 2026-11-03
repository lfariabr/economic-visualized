/** Deterministic pt-BR number formatting (same output on server and client). */
export function br(x: number, d = 1): string {
  if (!Number.isFinite(x)) return "—";
  const neg = x < 0;
  const [int, frac] = Math.abs(x).toFixed(d).split(".");
  const withSep = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const s = frac ? `${withSep},${frac}` : withSep;
  return neg && Number(s.replace(/\./g, "").replace(",", ".")) !== 0 ? `−${s}` : s;
}

export const pct = (x: number, d = 1) => `${br(x, d)}%`;
export const brl = (x: number, d = 2) => `R$ ${br(x, d)}`;
export const signed = (x: number, d = 1) => (x > 0 ? `+${br(x, d)}` : br(x, d));
