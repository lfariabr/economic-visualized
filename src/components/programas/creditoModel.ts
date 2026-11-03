/**
 * Empréstimos do Tesouro ao BNDES e o subsídio implícito — valores aproximados.
 * selic: média anual (%); tjlp: média anual (%); ipca: ano (%); saldo: créditos do Tesouro no BNDES (R$ bi, fim de ano).
 */
export const BNDES_HIST = [
  { ano: 2007, selic: 12.0, tjlp: 6.4, ipca: 4.5, saldo: 10 },
  { ano: 2008, selic: 12.4, tjlp: 6.25, ipca: 5.9, saldo: 23 },
  { ano: 2009, selic: 10.1, tjlp: 6.1, ipca: 4.3, saldo: 105 },
  { ano: 2010, selic: 9.9, tjlp: 6.0, ipca: 5.9, saldo: 235 },
  { ano: 2011, selic: 11.7, tjlp: 6.0, ipca: 6.5, saldo: 300 },
  { ano: 2012, selic: 8.5, tjlp: 5.75, ipca: 5.8, saldo: 365 },
  { ano: 2013, selic: 8.4, tjlp: 5.0, ipca: 5.9, saldo: 410 },
  { ano: 2014, selic: 11.0, tjlp: 5.0, ipca: 6.4, saldo: 480 },
  { ano: 2015, selic: 13.6, tjlp: 6.25, ipca: 10.7, saldo: 525 },
  { ano: 2016, selic: 14.0, tjlp: 7.5, ipca: 6.3, saldo: 500 },
  { ano: 2017, selic: 10.0, tjlp: 7.0, ipca: 2.9, saldo: 420 },
  { ano: 2018, selic: 6.4, tjlp: 6.7, ipca: 3.7, saldo: 300 },
  { ano: 2019, selic: 6.0, tjlp: 6.0, ipca: 4.3, saldo: 220 },
  { ano: 2020, selic: 2.8, tjlp: 4.9, ipca: 4.5, saldo: 160 },
  { ano: 2021, selic: 4.8, tjlp: 4.8, ipca: 10.1, saldo: 110 },
  { ano: 2022, selic: 12.4, tjlp: 7.0, ipca: 5.8, saldo: 80 },
  { ano: 2023, selic: 13.2, tjlp: 6.8, ipca: 4.6, saldo: 55 },
  { ano: 2024, selic: 10.9, tjlp: 7.3, ipca: 4.8, saldo: 40 },
];

/** TLP ≈ IPCA + juro real da NTN-B de 5 anos (aprox. 5% a.a.). */
export const tlpAprox = (ipca: number, realNtnb = 5) => ipca + realNtnb;

export type Regime = "tjlp" | "tlp";

export function subsidioAnual(h: (typeof BNDES_HIST)[number], regime: Regime) {
  const taxa = regime === "tjlp" ? h.tjlp : tlpAprox(h.ipca);
  return (Math.max(-5, h.selic - taxa) / 100) * h.saldo; // R$ bi
}

/** investimento financiado pelo funding do Tesouro: soma dos aumentos do saldo */
export const financiado = BNDES_HIST.reduce(
  (a, h, i) => a + (i ? Math.max(0, h.saldo - BNDES_HIST[i - 1].saldo) : h.saldo),
  0,
);
