/** Incidência por décimo de renda — números ilustrativos, próximos da POF/PNAD (aprox.). */

/** renda domiciliar per capita mensal (R$) por décimo */
export const RENDA = [180, 420, 620, 820, 1030, 1300, 1700, 2300, 3600, 9500];
/** consumo / renda: os mais pobres consomem tudo (ou mais, via transferências e dívida) */
export const CONSUMO_RENDA = [1.3, 1.05, 0.98, 0.94, 0.9, 0.86, 0.82, 0.76, 0.68, 0.5];
/** fatia de alimentos no consumo */
export const FATIA_ALIM = [0.34, 0.31, 0.29, 0.27, 0.25, 0.22, 0.2, 0.17, 0.14, 0.09];
/** IR efetivo sobre a renda total (%), aprox. */
export const IR_EFETIVO = [0, 0, 0, 0, 0, 0, 0.3, 1.2, 3.5, 9];

export type Policy = { aliq: number; isentaCesta: boolean; cashback: number };

export function incidence(p: Policy) {
  return RENDA.map((y, i) => {
    const c = y * CONSUMO_RENDA[i];
    const alim = c * FATIA_ALIM[i];
    const resto = c - alim;
    const aliqAlim = p.isentaCesta ? 0 : p.aliq;
    let consumoTax = alim * aliqAlim + resto * p.aliq;
    const devol = i < 3 ? consumoTax * p.cashback : 0;
    consumoTax -= devol;
    const ir = (y * IR_EFETIVO[i]) / 100;
    const semPolitica = c * p.aliq;
    return {
      decil: i + 1,
      renda: y,
      consumoTax,
      ir,
      pctConsumo: (consumoTax / y) * 100,
      pctIr: (ir / y) * 100,
      pctTotal: ((consumoTax + ir) / y) * 100,
      /** R$/mês economizados vs. sem isenção/cashback */
      beneficio: semPolitica - consumoTax,
    };
  });
}

export function policyCost(p: Policy) {
  const rows = incidence(p);
  const full = incidence({ aliq: p.aliq, isentaCesta: false, cashback: 0 });
  const arrec = rows.reduce((s, r) => s + r.consumoTax, 0);
  const arrecFull = full.reduce((s, r) => s + r.consumoTax, 0);
  const benef = rows.map((r) => r.beneficio);
  const totalBenef = benef.reduce((a, b) => a + b, 0);
  const pobres = benef.slice(0, 3).reduce((a, b) => a + b, 0);
  return {
    custoPct: ((arrecFull - arrec) / arrecFull) * 100,
    /** fração do benefício que vai para os 30% mais pobres */
    focoPobres: totalBenef > 0 ? (pobres / totalBenef) * 100 : 0,
    /** alíquota que repõe a arrecadação */
    aliqNeutra: p.aliq * (arrecFull / Math.max(1e-9, arrec)),
  };
}
