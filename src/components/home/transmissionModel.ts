/** Mapa causal simplificado da economia brasileira. Sinal +: as duas variáveis andam juntas; −: em sentidos opostos. */

export type NodeId =
  | "selic"
  | "gasto"
  | "impostos"
  | "safra"
  | "cdi"
  | "dolar"
  | "arrecadacao"
  | "alimentos"
  | "credito"
  | "risco"
  | "consumo"
  | "pib"
  | "divida"
  | "inflacao"
  | "desemprego";

export type MapNode = { id: NodeId; label: string; x: number; y: number; href: string; lever?: boolean };

export const NODES: MapNode[] = [
  { id: "selic", label: "Selic", x: 90, y: 80, href: "/selic", lever: true },
  { id: "gasto", label: "Gasto público", x: 90, y: 215, href: "/divida", lever: true },
  { id: "impostos", label: "Impostos", x: 90, y: 335, href: "/laffer", lever: true },
  { id: "safra", label: "Safra / clima", x: 90, y: 460, href: "/alimentos", lever: true },
  { id: "cdi", label: "CDI e juros", x: 300, y: 40, href: "/juros" },
  { id: "dolar", label: "Dólar (R$/US$)", x: 300, y: 165, href: "/cambio" },
  { id: "arrecadacao", label: "Arrecadação", x: 300, y: 335, href: "/laffer" },
  { id: "alimentos", label: "Alimentos", x: 300, y: 460, href: "/alimentos" },
  { id: "credito", label: "Crédito", x: 500, y: 40, href: "/juros" },
  { id: "risco", label: "Risco-país", x: 500, y: 215, href: "/divida", lever: true },
  { id: "consumo", label: "Consumo + invest.", x: 500, y: 335, href: "/pib" },
  { id: "pib", label: "PIB", x: 710, y: 120, href: "/pib" },
  { id: "divida", label: "Dívida / PIB", x: 710, y: 300, href: "/divida" },
  { id: "inflacao", label: "Inflação (IPCA)", x: 710, y: 460, href: "/inflacao" },
  { id: "desemprego", label: "Desemprego", x: 890, y: 230, href: "/phillips" },
];

export type Edge = { from: NodeId; to: NodeId; sign: 1 | -1; why: string };

export const EDGES: Edge[] = [
  { from: "selic", to: "cdi", sign: 1, why: "o CDI acompanha a Selic quase 1 para 1; bancos captam mais caro" },
  { from: "selic", to: "dolar", sign: -1, why: "juro alto atrai capital estrangeiro (carry trade) e o real se valoriza" },
  { from: "selic", to: "divida", sign: 1, why: "cerca de 40% da dívida é pós-fixada, corrigida pela Selic" },
  { from: "cdi", to: "credito", sign: -1, why: "crédito mais caro: famílias e empresas tomam menos" },
  { from: "credito", to: "consumo", sign: 1, why: "menos crédito, menos compras a prazo e menos investimento" },
  { from: "impostos", to: "consumo", sign: -1, why: "imposto maior tira renda disponível e encarece produtos" },
  { from: "impostos", to: "arrecadacao", sign: 1, why: "até o pico da curva de Laffer, alíquota maior arrecada mais" },
  { from: "gasto", to: "consumo", sign: 1, why: "o gasto do governo vira renda de alguém (multiplicador)" },
  { from: "gasto", to: "divida", sign: 1, why: "gastar mais que arrecada gera déficit primário" },
  { from: "consumo", to: "pib", sign: 1, why: "demanda maior puxa a produção no curto prazo" },
  { from: "pib", to: "desemprego", sign: -1, why: "lei de Okun: economia crescendo contrata mais" },
  { from: "pib", to: "arrecadacao", sign: 1, why: "mais atividade, mais base tributária" },
  { from: "pib", to: "divida", sign: -1, why: "a dívida é medida em % do PIB: o denominador cresce" },
  { from: "arrecadacao", to: "divida", sign: -1, why: "mais receita melhora o resultado primário" },
  { from: "desemprego", to: "inflacao", sign: -1, why: "curva de Phillips: mercado de trabalho frouxo segura salários e preços" },
  { from: "dolar", to: "inflacao", sign: 1, why: "repasse cambial: importados, combustíveis e insumos encarecem" },
  { from: "dolar", to: "alimentos", sign: 1, why: "soja, milho, carne e trigo são cotados em dólar" },
  { from: "safra", to: "alimentos", sign: -1, why: "colheita maior, mais oferta, preço menor (demanda é inelástica)" },
  { from: "alimentos", to: "inflacao", sign: 1, why: "alimentação e bebidas pesam cerca de 21% do IPCA" },
  { from: "divida", to: "risco", sign: 1, why: "dívida subindo eleva o medo de calote ou de inflação futura" },
  { from: "risco", to: "dolar", sign: 1, why: "investidores saem do país: demanda por dólar sobe" },
  { from: "risco", to: "cdi", sign: 1, why: "juros futuros e prêmio de risco sobem, mesmo com a Selic parada" },
];

export type Effect = { signs: Set<1 | -1>; depth: number; via: Edge[] };

/** Propaga um choque (lever, dir) pelo grafo até o ponto fixo. Cada nó acumula os sinais possíveis. */
export function propagate(lever: NodeId, dir: 1 | -1): Map<NodeId, Effect> {
  const out = new Map<NodeId, Effect>();
  out.set(lever, { signs: new Set([dir]), depth: 0, via: [] });
  let changed = true;
  let guard = 0;
  while (changed && guard++ < 50) {
    changed = false;
    for (const e of EDGES) {
      const src = out.get(e.from);
      if (!src || e.to === lever) continue;
      let dst = out.get(e.to);
      if (!dst) {
        dst = { signs: new Set(), depth: src.depth + 1, via: [] };
        out.set(e.to, dst);
        changed = true;
      }
      if (!dst.via.includes(e)) {
        dst.via.push(e);
        changed = true;
      }
      for (const s of src.signs) {
        const v = (s * e.sign) as 1 | -1;
        if (!dst.signs.has(v)) {
          dst.signs.add(v);
          changed = true;
        }
      }
      if (src.depth + 1 < dst.depth) {
        dst.depth = src.depth + 1;
        changed = true;
      }
    }
  }
  return out;
}

export const net = (e?: Effect): 1 | -1 | 0 | null =>
  !e ? null : e.signs.size === 2 ? 0 : e.signs.has(1) ? 1 : -1;
