import type { SerieId } from "./historiaData";
import { br } from "./fmtBR";

/** format a value of a given series for display */
export function fmtValor(id: SerieId, v: number): string {
  switch (id) {
    case "dolar":
      return `R$ ${br(v, 2)}`;
    case "salario":
      return br(v, 0);
    case "divida":
      return `${br(v, 1)}% PIB`;
    case "selic":
      return `${br(v, 2)}%`;
    default:
      return `${br(v, 1)}%`;
  }
}
