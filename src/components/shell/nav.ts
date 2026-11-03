export type ChapterKey =
  | "moeda"
  | "inflacao"
  | "alimentos"
  | "selic"
  | "juros"
  | "phillips"
  | "cambio"
  | "laffer"
  | "divida"
  | "pib"
  | "simulador"
  | "historia";

export const CHAPTER_COLOR: Record<ChapterKey, string> = {
  // I — Moeda e preços: amarelos/laranjas
  moeda: "#facc15",
  inflacao: "#fb923c",
  alimentos: "#f59e0b",
  // II — Juros: azuis
  selic: "#38bdf8",
  juros: "#22d3ee",
  phillips: "#818cf8",
  // III — Setor externo
  cambio: "#2dd4bf",
  // IV — Estado: vermelhos/rosas
  laffer: "#f87171",
  divida: "#fb7185",
  pib: "#e879f9",
  // V — Juntando tudo: verdes/violeta
  simulador: "#4ade80",
  historia: "#a78bfa",
};

export type NavItem = {
  href: string;
  label: string;
  blurb: string;
  n: string;
  group: string;
  chapter: ChapterKey | null;
};

export const NAV: NavItem[] = [
  { href: "/", label: "Visão geral", blurb: "O mapa da economia", n: "00", group: "Início", chapter: null },
  { href: "/moeda", label: "Moeda & inflação", blurb: "MV = PY, senhoriagem, hiperinflação", n: "01", group: "I · Moeda e preços", chapter: "moeda" },
  { href: "/inflacao", label: "IPCA & inércia", blurb: "Cesta, indexação, meta", n: "02", group: "I · Moeda e preços", chapter: "inflacao" },
  { href: "/alimentos", label: "Preço dos alimentos", blurb: "Safra, clima, dólar, cesta básica", n: "03", group: "I · Moeda e preços", chapter: "alimentos" },
  { href: "/selic", label: "Selic & Copom", blurb: "Regra de Taylor, transmissão", n: "04", group: "II · Juros", chapter: "selic" },
  { href: "/juros", label: "CDI, juros & crédito", blurb: "Spread, rotativo, investimentos", n: "05", group: "II · Juros", chapter: "juros" },
  { href: "/phillips", label: "Phillips & desemprego", blurb: "Inflação × emprego, expectativas", n: "06", group: "II · Juros", chapter: "phillips" },
  { href: "/cambio", label: "Dólar & câmbio", blurb: "Carry trade, repasse, reservas", n: "07", group: "III · Setor externo", chapter: "cambio" },
  { href: "/laffer", label: "Curva de Laffer & impostos", blurb: "Alíquota × arrecadação", n: "08", group: "IV · Estado", chapter: "laffer" },
  { href: "/divida", label: "Dívida pública", blurb: "r − g, primário, bola de neve", n: "09", group: "IV · Estado", chapter: "divida" },
  { href: "/pib", label: "PIB & crescimento", blurb: "IS-LM, multiplicador, Solow", n: "10", group: "IV · Estado", chapter: "pib" },
  { href: "/simulador", label: "Simulador Brasil", blurb: "Você é o governo e o BC", n: "11", group: "V · Juntando tudo", chapter: "simulador" },
  { href: "/historia", label: "Brasil 1980–2026", blurb: "Planos, crises, números", n: "12", group: "V · Juntando tudo", chapter: "historia" },
  { href: "/glossario", label: "Glossário", blurb: "Todos os conceitos", n: "13", group: "Referência", chapter: null },
];
