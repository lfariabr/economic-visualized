/**
 * Perfil estilizado dos domicílios brasileiros por décimo de renda (valores aproximados,
 * inspirados na POF/IBGE e PNAD). Cada décimo ≈ 7,7 milhões de domicílios.
 */
export const DOMICILIOS_POR_DECIL = 7.7e6;

/** renda média domiciliar mensal (R$) por décimo */
export const RENDA_DECIL = [700, 1400, 2000, 2600, 3200, 3900, 4900, 6400, 9600, 25000];

/** participação de cada décimo no consumo de GLP (botijão P13) — quase plana */
export const GLP_SHARE = [0.085, 0.095, 0.1, 0.105, 0.105, 0.105, 0.105, 0.105, 0.1, 0.095];

/** participação no consumo direto de gasolina — muito concentrada no topo */
export const GASOLINA_SHARE = [0.015, 0.025, 0.035, 0.045, 0.06, 0.075, 0.095, 0.12, 0.18, 0.35];

/** participação no consumo indireto de diesel (frete embutido nos preços) */
export const DIESEL_SHARE = [0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.095, 0.115, 0.15, 0.31];

/** onde estão os beneficiários de programas focalizados no CadÚnico (aprox.) */
export const CADUNICO_SHARE = [0.55, 0.3, 0.12, 0.03, 0, 0, 0, 0, 0, 0];

export const DECIL_LABEL = ["D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9", "D10"];

/** Distribui um valor anual (R$ bi) pelos décimos e devolve R$/domicílio/mês e % da renda. */
export function porDomicilio(totalBi: number, shares: number[]) {
  return shares.map((s, i) => {
    const mensal = (totalBi * 1e9 * s) / DOMICILIOS_POR_DECIL / 12;
    return { mensal, pctRenda: (mensal / RENDA_DECIL[i]) * 100 };
  });
}

export const somaBaixo = (shares: number[], k: number) => shares.slice(0, k).reduce((a, b) => a + b, 0);
