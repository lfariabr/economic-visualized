/**
 * Brasil 1980–2025 — séries anuais APROXIMADAS, digitadas à mão para fins didáticos.
 * Fontes de referência: IBGE (IPCA, PIB, PNAD), BCB (Selic, câmbio, DBGG), Ipeadata (salário mínimo real).
 * Não use para pesquisa: arredondamentos e mudanças de metodologia não estão tratados.
 */

export const FONTE = "dados aproximados, fontes: IBGE, BCB, Ipeadata";

export type SerieId = "ipca" | "selic" | "dolar" | "pib" | "desemprego" | "divida" | "salario";

export type SerieMeta = { id: SerieId; label: string; short: string; unit: string; color: string; note?: string };

export const SERIES: SerieMeta[] = [
  { id: "ipca", label: "IPCA anual (%)", short: "IPCA", unit: "%", color: "#f87171", note: "dez/dez" },
  { id: "selic", label: "Selic, fim de ano (% a.a.)", short: "Selic", unit: "%", color: "#60a5fa", note: "a partir de 1996" },
  { id: "dolar", label: "Dólar médio (R$/US$)", short: "Dólar", unit: "R$", color: "#34d399", note: "a partir de 1995" },
  { id: "pib", label: "PIB, crescimento real (%)", short: "PIB", unit: "%", color: "#fbbf24" },
  { id: "desemprego", label: "Desemprego (%)", short: "Desemprego", unit: "%", color: "#f472b6", note: "PME até 2011, PNAD Contínua 2012+" },
  { id: "divida", label: "Dívida bruta (DBGG, % PIB)", short: "Dívida", unit: "% PIB", color: "#a78bfa", note: "a partir de 2006" },
  { id: "salario", label: "Salário mínimo real (2000 = 100)", short: "Sal. mín.", unit: "índice", color: "#22d3ee" },
];

export const SERIE = Object.fromEntries(SERIES.map((s) => [s.id, s])) as Record<SerieId, SerieMeta>;

export const ANO0 = 1980;
export const ANO1 = 2025;

const ipca: number[] = [
  // 1980–1989
  99.3, 95.6, 104.8, 164.0, 215.3, 242.2, 79.7, 363.4, 980.2, 1972.9,
  // 1990–1999
  1621.0, 472.7, 1119.1, 2477.2, 916.5, 22.4, 9.6, 5.2, 1.7, 8.9,
  // 2000–2009
  6.0, 7.7, 12.5, 9.3, 7.6, 5.7, 3.1, 4.5, 5.9, 4.3,
  // 2010–2019
  5.9, 6.5, 5.8, 5.9, 6.4, 10.7, 6.3, 2.9, 3.7, 4.3,
  // 2020–2025
  4.5, 10.1, 5.8, 4.6, 4.8, 4.3,
];

const pib: number[] = [
  9.2, -4.3, 0.8, -2.9, 5.4, 7.8, 7.5, 3.5, -0.1, 3.2,
  -4.3, 1.0, -0.5, 4.9, 5.9, 4.2, 2.2, 3.4, 0.3, 0.5,
  4.4, 1.4, 3.1, 1.1, 5.8, 3.2, 4.0, 6.1, 5.1, -0.1,
  7.5, 4.0, 1.9, 3.0, 0.5, -3.5, -3.3, 1.3, 1.8, 1.2,
  -3.3, 4.8, 3.0, 3.2, 3.4, 2.3,
];

const salario: number[] = [
  175, 168, 170, 148, 138, 140, 135, 105, 108, 112,
  85, 88, 82, 88, 80, 88, 90, 92, 96, 96,
  100, 108, 110, 112, 116, 126, 143, 150, 155, 166,
  175, 175, 189, 193, 196, 196, 198, 200, 200, 201,
  200, 196, 197, 204, 210, 214,
];

const selic: Record<number, number> = {
  1996: 23.9, 1997: 38.0, 1998: 29.0, 1999: 19.0, 2000: 15.75, 2001: 19.0, 2002: 25.0, 2003: 16.5, 2004: 17.75,
  2005: 18.0, 2006: 13.25, 2007: 11.25, 2008: 13.75, 2009: 8.75, 2010: 10.75, 2011: 11.0, 2012: 7.25, 2013: 10.0,
  2014: 11.75, 2015: 14.25, 2016: 13.75, 2017: 7.0, 2018: 6.5, 2019: 4.5, 2020: 2.0, 2021: 9.25, 2022: 13.75,
  2023: 11.75, 2024: 12.25, 2025: 15.0,
};

const dolar: Record<number, number> = {
  1995: 0.92, 1996: 1.01, 1997: 1.08, 1998: 1.16, 1999: 1.81, 2000: 1.83, 2001: 2.35, 2002: 2.92, 2003: 3.08,
  2004: 2.93, 2005: 2.43, 2006: 2.18, 2007: 1.95, 2008: 1.83, 2009: 2.0, 2010: 1.76, 2011: 1.67, 2012: 1.95,
  2013: 2.16, 2014: 2.35, 2015: 3.33, 2016: 3.49, 2017: 3.19, 2018: 3.65, 2019: 3.94, 2020: 5.16, 2021: 5.4,
  2022: 5.16, 2023: 5.0, 2024: 5.39, 2025: 5.58,
};

const desemprego: Record<number, number> = {
  2002: 11.7, 2003: 12.3, 2004: 11.5, 2005: 9.9, 2006: 10.0, 2007: 9.3, 2008: 7.9, 2009: 8.1, 2010: 6.7, 2011: 6.0,
  2012: 7.4, 2013: 7.2, 2014: 7.0, 2015: 8.9, 2016: 12.0, 2017: 12.9, 2018: 12.4, 2019: 12.0, 2020: 13.8,
  2021: 13.2, 2022: 9.6, 2023: 7.8, 2024: 6.6, 2025: 5.8,
};

const divida: Record<number, number> = {
  2006: 55.5, 2007: 56.7, 2008: 56.0, 2009: 59.2, 2010: 51.8, 2011: 51.3, 2012: 53.7, 2013: 51.5, 2014: 56.3,
  2015: 65.5, 2016: 69.8, 2017: 73.7, 2018: 75.3, 2019: 74.4, 2020: 86.9, 2021: 77.3, 2022: 71.7, 2023: 73.8,
  2024: 76.5, 2025: 78.5,
};

const fromArray = (xs: number[]) => Object.fromEntries(xs.map((v, i) => [ANO0 + i, v])) as Record<number, number>;

export const DATA: Record<SerieId, Record<number, number>> = {
  ipca: fromArray(ipca),
  pib: fromArray(pib),
  salario: fromArray(salario),
  selic,
  dolar,
  desemprego,
  divida,
};

/** [ano, valor][] for a series, only years with data */
export function pontos(id: SerieId, de = ANO0, ate = ANO1): [number, number][] {
  const out: [number, number][] = [];
  for (let a = de; a <= ate; a++) {
    const v = DATA[id][a];
    if (v !== undefined) out.push([a, v]);
  }
  return out;
}

export const valor = (id: SerieId, ano: number): number | undefined => DATA[id][ano];

/* ------------------------------------------------------------------ */
/* Presidentes / eras (bandas)                                         */
/* ------------------------------------------------------------------ */

export const GOVERNOS = [
  { nome: "Figueiredo", de: 1980, ate: 1985 },
  { nome: "Sarney", de: 1985, ate: 1990 },
  { nome: "Collor", de: 1990, ate: 1992.75 },
  { nome: "Itamar", de: 1992.75, ate: 1995 },
  { nome: "FHC", de: 1995, ate: 2003 },
  { nome: "Lula", de: 2003, ate: 2011 },
  { nome: "Dilma", de: 2011, ate: 2016.4 },
  { nome: "Temer", de: 2016.4, ate: 2019 },
  { nome: "Bolsonaro", de: 2019, ate: 2023 },
  { nome: "Lula", de: 2023, ate: 2026 },
];

/* ------------------------------------------------------------------ */
/* Planos econômicos                                                    */
/* ------------------------------------------------------------------ */

export type Plano = {
  id: string;
  nome: string;
  ano: number;
  /** fractional year for the timeline marker */
  x: number;
  quando: string;
  governo: string;
  moeda: string;
  medidas: string[];
  resultado: string;
  /** IPCA mensal aproximado (%), de 6 meses antes até 12 meses depois; índice 6 = 1º mês sob o plano */
  mensal: number[];
  /** label of month index 6 */
  mes0: string;
  ok: boolean;
};

export const PLANOS: Plano[] = [
  {
    id: "cruzado",
    nome: "Plano Cruzado",
    ano: 1986,
    x: 1986.16,
    quando: "fevereiro de 1986",
    governo: "Sarney · ministro Dilson Funaro",
    moeda: "Cruzeiro → Cruzado (corte de 3 zeros)",
    medidas: ["Congelamento geral de preços (fiscais do Sarney)", "Congelamento do câmbio", "Gatilho salarial quando a inflação passasse de 20%", "Fim da correção monetária generalizada"],
    resultado: "A inflação caiu a quase zero por alguns meses, mas a demanda aquecida e os preços congelados geraram desabastecimento e ágio. Após as eleições de 1986 veio o descongelamento (Cruzado II) e a inflação voltou mais forte.",
    mensal: [9.0, 9.0, 13.4, 15.0, 13.2, 14.4, -0.1, 0.8, 1.4, 1.3, 1.2, 1.7, 1.7, 1.9, 3.3, 7.3, 16.8, 13.9, 14.4],
    mes0: "mar/1986",
    ok: false,
  },
  {
    id: "bresser",
    nome: "Plano Bresser",
    ano: 1987,
    x: 1987.45,
    quando: "junho de 1987",
    governo: "Sarney · ministro Bresser-Pereira",
    moeda: "Cruzado (mantido)",
    medidas: ["Congelamento de preços e salários por 90 dias", "Criação da URP (Unidade de Referência de Preços) para reajustes", "Tentativa de ajuste fiscal"],
    resultado: "Alívio curto: a inflação caiu de mais de 20% para um dígito ao mês, mas voltou a subir em poucos meses sem ajuste fiscal efetivo.",
    mensal: [16.8, 13.9, 14.4, 15.0, 20.1, 23.2, 3.1, 6.4, 5.7, 9.2, 12.8, 14.1, 16.5, 17.9, 16.0, 19.3, 17.8, 19.5, 20.8],
    mes0: "jul/1987",
    ok: false,
  },
  {
    id: "verao",
    nome: "Plano Verão",
    ano: 1989,
    x: 1989.04,
    quando: "janeiro de 1989",
    governo: "Sarney · ministro Maílson da Nóbrega",
    moeda: "Cruzado → Cruzado Novo (corte de 3 zeros)",
    medidas: ["Novo congelamento de preços", "Extinção da OTN e desindexação", "Juros reais altos e promessa de corte de gastos"],
    resultado: "O congelamento durou pouco; em 1989 a inflação mensal escalou para mais de 50% e o país entrou em hiperinflação no fim do governo Sarney.",
    mensal: [20.0, 24.0, 27.0, 26.9, 26.9, 28.8, 3.6, 6.1, 7.3, 9.9, 24.8, 28.8, 29.3, 35.9, 37.6, 41.4, 53.6, 56.1, 72.8],
    mes0: "fev/1989",
    ok: false,
  },
  {
    id: "collor1",
    nome: "Plano Collor I",
    ano: 1990,
    x: 1990.21,
    quando: "março de 1990",
    governo: "Collor · ministra Zélia Cardoso de Mello",
    moeda: "Cruzado Novo → Cruzeiro (sem corte de zeros)",
    medidas: ["Bloqueio (\"confisco\") por 18 meses de depósitos e aplicações acima de NCz$ 50 mil, inclusive poupança", "Congelamento de preços e salários", "Abertura comercial e início das privatizações", "Aumento de impostos (IOF)"],
    resultado: "Ao retirar boa parte da moeda de circulação, derrubou a inflação e o PIB (−4,3% em 1990). Com a devolução gradual dos recursos e sem âncora duradoura, a inflação voltou a subir.",
    mensal: [41.4, 53.6, 56.1, 72.8, 75.7, 82.4, 15.5, 7.6, 9.6, 12.3, 11.8, 12.7, 14.2, 15.6, 17.4, 18.3, 20.8, 7.0, 7.0],
    mes0: "abr/1990",
    ok: false,
  },
  {
    id: "collor2",
    nome: "Plano Collor II",
    ano: 1991,
    x: 1991.08,
    quando: "janeiro de 1991",
    governo: "Collor · ministra Zélia Cardoso de Mello",
    moeda: "Cruzeiro (mantido)",
    medidas: ["Novo congelamento de preços e salários", "Fim do overnight e criação da TR (Taxa Referencial)", "Fundos de aplicação financeira (FAF)"],
    resultado: "Efeito ainda mais curto. Em 1992 a inflação anual passava de 1.000% e Collor sofreu impeachment.",
    mensal: [12.0, 14.2, 15.6, 17.4, 18.3, 20.8, 7.0, 5.0, 6.5, 7.7, 8.9, 12.6, 12.5, 15.5, 20.0, 25.8, 24.8, 24.0, 25.0],
    mes0: "fev/1991",
    ok: false,
  },
  {
    id: "real",
    nome: "Plano Real",
    ano: 1994,
    x: 1994.5,
    quando: "fev–jul de 1994 (URV em mar, Real em 1º de julho)",
    governo: "Itamar · ministro FHC, depois Rubens Ricupero",
    moeda: "Cruzeiro Real → URV → Real (1 R$ = 2.750 CR$)",
    medidas: ["Ajuste fiscal prévio (Fundo Social de Emergência)", "URV: unidade de conta diária que sincronizou preços e salários sem congelamento", "Conversão para o Real com âncora cambial e juros altos", "Abertura comercial como disciplina de preços"],
    resultado: "Sem congelamento nem confisco, a URV quebrou a inércia inflacionária. A inflação mensal caiu de ~45% para ~2% e o IPCA anual chegou a um dígito em 1996. O custo veio depois: câmbio sobrevalorizado, juros muito altos e a crise de 1999.",
    mensal: [41.3, 42.8, 42.7, 42.7, 44.0, 47.4, 6.8, 1.9, 1.5, 2.6, 2.8, 1.7, 1.7, 1.0, 1.6, 2.4, 2.7, 2.3, 1.0],
    mes0: "jul/1994",
    ok: true,
  },
];

/* ------------------------------------------------------------------ */
/* Crises                                                               */
/* ------------------------------------------------------------------ */

export type Crise = {
  id: string;
  nome: string;
  de: number;
  ate: number;
  series: SerieId[];
  resumo: string;
  eventos: { x: number; label: string }[];
  numeros: string[];
};

export const CRISES: Crise[] = [
  {
    id: "1999",
    nome: "1999 · desvalorização",
    de: 1995,
    ate: 2002,
    series: ["dolar", "selic", "ipca"],
    resumo: "Depois das crises asiática (1997) e russa (1998), o Brasil perdeu reservas defendendo a banda cambial com juros altíssimos. Em janeiro de 1999 o câmbio passou a flutuar: o dólar saltou de R$ 1,21 para mais de R$ 2 em semanas. Em seguida veio o tripé macroeconômico.",
    eventos: [
      { x: 1997.8, label: "Ásia: Selic ~43%" },
      { x: 1998.7, label: "Rússia" },
      { x: 1999.05, label: "câmbio flutua" },
      { x: 1999.5, label: "metas de inflação" },
    ],
    numeros: ["Selic chegou a ~45% (mar/1999)", "Dólar médio: R$ 1,16 (1998) → R$ 1,81 (1999)", "IPCA ficou em 8,9% — bem menos que o temido"],
  },
  {
    id: "2002",
    nome: "2002 · eleição e risco-país",
    de: 2000,
    ate: 2005,
    series: ["dolar", "selic", "ipca"],
    resumo: "O medo de ruptura na política econômica com a eleição de 2002 levou o risco-país (EMBI+) acima de 2.000 pontos e o dólar perto de R$ 4. A Carta ao Povo Brasileiro e a manutenção do tripé, com Selic de 26,5% em 2003, devolveram a confiança.",
    eventos: [
      { x: 2002.5, label: "risco-país > 2.000" },
      { x: 2002.8, label: "eleição" },
      { x: 2003.2, label: "Selic 26,5%" },
    ],
    numeros: ["Dólar chegou a ~R$ 3,95 (out/2002)", "IPCA 2002: 12,5%", "Superávit primário elevado para 4,25% do PIB"],
  },
  {
    id: "2008",
    nome: "2008 · crise financeira global",
    de: 2006,
    ate: 2011,
    series: ["pib", "selic", "dolar"],
    resumo: "A quebra do Lehman Brothers secou o crédito externo. O dólar saltou, o PIB recuou no fim de 2008 e início de 2009. O BCB liberou compulsórios e cortou a Selic; bancos públicos expandiram crédito. A recuperação de 2010 (+7,5%) foi rápida.",
    eventos: [
      { x: 2008.7, label: "Lehman" },
      { x: 2009.0, label: "cortes da Selic" },
      { x: 2010.5, label: "PIB +7,5%" },
    ],
    numeros: ["PIB 2009: −0,1%", "Selic: 13,75% → 8,75%", "Reservas de ~US$ 200 bi amorteceram o choque"],
  },
  {
    id: "2015",
    nome: "2015–16 · grande recessão",
    de: 2012,
    ate: 2019,
    series: ["pib", "desemprego", "ipca", "divida"],
    resumo: "Fim do ciclo de commodities, deterioração fiscal, represamento e depois realinhamento de preços administrados, crise política e Lava Jato. O PIB caiu cerca de 7% em dois anos, o desemprego dobrou e a dívida bruta disparou. Em 2016 veio o teto de gastos.",
    eventos: [
      { x: 2014.8, label: "eleição" },
      { x: 2015.5, label: "Selic 14,25%" },
      { x: 2016.4, label: "impeachment" },
      { x: 2016.95, label: "teto de gastos" },
    ],
    numeros: ["PIB: −3,5% (2015) e −3,3% (2016)", "IPCA 2015: 10,7%", "Desemprego: 7% → 13%"],
  },
  {
    id: "2020",
    nome: "2020 · pandemia",
    de: 2018,
    ate: 2023,
    series: ["pib", "selic", "divida", "dolar"],
    resumo: "A covid-19 derrubou a atividade no 2º trimestre de 2020. O governo lançou o auxílio emergencial e a dívida bruta foi a ~87% do PIB. O BCB cortou a Selic para a mínima histórica de 2% e o dólar passou de R$ 5.",
    eventos: [
      { x: 2020.2, label: "pandemia" },
      { x: 2020.6, label: "Selic 2%" },
      { x: 2021.3, label: "início das altas" },
    ],
    numeros: ["PIB 2020: −3,3%", "Dívida bruta: 74% → 87% do PIB", "Dólar médio: R$ 3,94 → R$ 5,16"],
  },
  {
    id: "2021",
    nome: "2021–22 · inflação e Selic 13,75%",
    de: 2019,
    ate: 2024,
    series: ["ipca", "selic", "pib"],
    resumo: "Reabertura, gargalos globais, crise hídrica (energia), alta de commodities e câmbio depreciado levaram o IPCA a 10,1% em 2021. O Copom subiu a Selic de 2% para 13,75% em 18 meses — um dos ciclos mais fortes do mundo. Cortes de impostos sobre combustíveis em 2022 ajudaram a derrubar o índice.",
    eventos: [
      { x: 2021.2, label: "Copom começa a subir" },
      { x: 2022.6, label: "Selic 13,75%" },
      { x: 2023.6, label: "início dos cortes" },
    ],
    numeros: ["IPCA 2021: 10,1% (meta 3,75%)", "Selic: 2% → 13,75% (mar/21 a ago/22)", "Carta aberta do BCB por estourar a meta"],
  },
  {
    id: "2024",
    nome: "2024–25 · Selic 15%",
    de: 2021,
    ate: 2025,
    series: ["selic", "dolar", "ipca", "divida"],
    resumo: "Com economia aquecida, desemprego na mínima da série e dúvidas sobre o arcabouço fiscal, as expectativas de inflação se afastaram da meta (agora contínua, 3%). O dólar passou de R$ 6 no fim de 2024 e o Copom retomou as altas até 15% em 2025, o maior nível em quase 20 anos.",
    eventos: [
      { x: 2024.7, label: "retomada das altas" },
      { x: 2024.95, label: "dólar > R$ 6" },
      { x: 2025.45, label: "Selic 15%" },
    ],
    numeros: ["Selic: 10,5% → 15%", "Desemprego 2025: ~5,8% (mínima da série)", "Dívida bruta ~78% do PIB"],
  },
];

/* ------------------------------------------------------------------ */
/* Moedas (para "quanto valia R$ 100")                                  */
/* ------------------------------------------------------------------ */

/** currency in force at year end, and how many units of it equal R$ 1 */
export function moedaDoAno(ano: number): { nome: string; simbolo: string; porReal: number } {
  if (ano >= 1994) return { nome: "Real", simbolo: "R$", porReal: 1 };
  if (ano === 1993) return { nome: "Cruzeiro Real", simbolo: "CR$", porReal: 2750 };
  if (ano >= 1990) return { nome: "Cruzeiro", simbolo: "Cr$", porReal: 2750 * 1000 };
  if (ano === 1989) return { nome: "Cruzado Novo", simbolo: "NCz$", porReal: 2750 * 1000 };
  if (ano >= 1986) return { nome: "Cruzado", simbolo: "Cz$", porReal: 2750 * 1000 * 1000 };
  return { nome: "Cruzeiro", simbolo: "Cr$", porReal: 2750 * 1000 * 1000 * 1000 };
}

/** price level at end of `ano` (IPCA index, end of 1979 = 1) */
export function nivelPrecos(ano: number) {
  let p = 1;
  for (let a = ANO0; a <= ano; a++) p *= 1 + (DATA.ipca[a] ?? 0) / 100;
  return p;
}
