/**
 * Toy model: an external shock (capital flight) under two regimes.
 *  - "ancora": câmbio fixo/banda (Brasil 1995–98) — o BC vende reservas e sobe a Selic para defender a paridade.
 *  - "tripe": câmbio flutuante + metas de inflação + superávit primário (1999+) — o câmbio absorve o choque,
 *    a Selic reage à inflação (regra de Taylor).
 * Without primary surplus the risk premium decays more slowly and adds to the Selic.
 * Quarterly, illustrative parameters — not calibrated.
 */

export type Regime = "ancora" | "tripe";
export type TripeQ = { t: number; fuga: number; reservas: number; cambio: number; selic: number; ipca: number; pib: number; rompeu: boolean };

export const META = 4;

export function simulaTripe(regime: Regime, choque: number, primario: boolean, n = 16): TripeQ[] {
  const decay = primario ? 0.55 : 0.8;
  const out: TripeQ[] = [];
  let reservas = 60;
  let cambio = 100;
  let rompeu = false;
  let selic = regime === "ancora" ? 20 : 12;
  for (let t = 0; t <= n; t++) {
    const fuga = t >= 2 ? choque * decay ** (t - 2) : 0;
    const premio = primario ? 0 : 3;
    let ipca: number;
    if (regime === "ancora" && !rompeu) {
      // defend the peg: sell reserves and jack up rates
      reservas -= 0.75 * fuga;
      selic = 20 + 0.7 * fuga + premio;
      if (reservas < 12) {
        rompeu = true;
        cambio = 165; // forced maxi-devaluation
      }
      ipca = 3 + (rompeu ? 0.15 * (cambio - 100) : 0);
    } else {
      // floating: exchange rate absorbs, then partially reverts
      const alvo = rompeu ? 140 : 100 + (primario ? 0 : 8);
      cambio = cambio * (1 + 0.006 * fuga) + 0.15 * (alvo - cambio);
      ipca = META + 0.12 * (cambio - 100);
      selic = 12 + premio + 1.5 * (ipca - META);
      reservas -= 0.05 * fuga;
    }
    const pib = 3 - 0.18 * (selic - 12) - 0.02 * fuga;
    out.push({ t, fuga, reservas, cambio, selic, ipca, pib, rompeu });
  }
  return out;
}
