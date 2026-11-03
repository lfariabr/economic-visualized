/**
 * Simulador Brasil — um modelo macro trimestral pequeno, integrado e
 * educacional (NÃO é previsão). Valores iniciais aproximados do Brasil ~2025.
 *
 * Elos:
 *   Selic → juro real ex-ante (Selic − expectativa) → hiato do produto (curva IS)
 *   hiato → desemprego (lei de Okun)
 *   inflação = inércia + expectativas + κ·hiato + repasse cambial + choques (Phillips)
 *   câmbio → paridade de juros (diferencial real − risco-país) + tendência de PPC
 *   risco-país → dívida, resultado primário, inflação
 *   dívida: d' = d·(1+i)/(1+g) − primário   (i = juro implícito da dívida)
 *   arrecadação: carga·(1 − ½(carga/70)²)·atividade  (Laffer suave, pico ~57%)
 */

export const META = 3;
export const TETO = 4.5;
export const PISO = 1.5;
/** juro real neutro aproximado (% a.a.) com risco-país "normal" */
export const R_NEUTRO = 5;
export const RISCO_BASE = 170;
export const GASTO_BASE = 33.5;
export const CARGA_BASE = 33;
export const U_NATURAL = 6.4;
export const POT_GROWTH = 2.0;
export const QUARTERS = 40;

export type Controls = {
  /** Selic (% a.a.) — usada quando o Copom está no manual */
  selic: number;
  /** gasto primário do governo geral, % do PIB */
  gasto: number;
  /** carga tributária média, % do PIB */
  carga: number;
  /** venda de reservas pelo BC, US$ bi por trimestre */
  intervencao: number;
  /** Copom automático (regra de Taylor) */
  taylor: boolean;
};

export type Opts = {
  /** escala do ruído aleatório (0 = determinístico) */
  noise?: number;
  /** coeficiente de reação da regra de Taylor à inflação */
  taylorPeso?: number;
  /** regra de Taylor olha o núcleo (sem alimentos) em vez do índice cheio */
  taylorNucleo?: boolean;
  /** força do elo dívida → risco-país → juros (1 = padrão, 0 = desligado) */
  feedback?: number;
};

export const DEFAULT_CONTROLS: Controls = {
  selic: 15,
  gasto: GASTO_BASE,
  carga: CARGA_BASE,
  intervencao: 0,
  taylor: true,
};

export type ShockKind = "seca" | "petroleo" | "pandemia" | "confianca" | "commodities";

export const SHOCKS: { kind: ShockKind; label: string; blurb: string }[] = [
  { kind: "seca", label: "Seca / alimentos", blurb: "quebra de safra: alimentos disparam por alguns trimestres" },
  { kind: "petroleo", label: "Petróleo", blurb: "choque de custos: combustíveis e fretes sobem" },
  { kind: "pandemia", label: "Pandemia", blurb: "PIB despenca, governo gasta com auxílio emergencial" },
  { kind: "confianca", label: "Crise de confiança", blurb: "risco-país salta, dólar dispara, investimento trava" },
  { kind: "commodities", label: "Boom de commodities", blurb: "exportações em alta: real valoriza, arrecadação sobe" },
];

type Shocks = {
  demanda: number;
  custo: number;
  alimentos: number;
  risco: number;
  cambio: number;
  gastoExtra: number;
  receitaExtra: number;
};

const NO_SHOCKS: Shocks = { demanda: 0, custo: 0, alimentos: 0, risco: 0, cambio: 0, gastoExtra: 0, receitaExtra: 0 };

export type State = {
  t: number;
  hiato: number;
  piQ: number;
  piHist: number[];
  coreQ: number;
  coreHist: number[];
  ipca12: number;
  core12: number;
  expect: number;
  cred: number;
  selic: number;
  juroReal: number;
  dolar: number;
  ppp: number;
  risco: number;
  divida: number;
  ieff: number;
  receita: number;
  gastoEf: number;
  primario: number;
  desemprego: number;
  pot: number;
  pib: number;
  pibQoQ: number;
  pib12: number;
  pibHist: number[];
  reservas: number;
  cesta: number;
  cestaHist: number[];
  cesta12: number;
  negQuarters: number;
  shocks: Shocks;
  flags: Record<string, boolean>;
};

export type SimEvent = { t: number; text: string; tone: "bad" | "warn" | "ok" | "info" };

export const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const fin = (x: number, fallback: number) => (Number.isFinite(x) ? x : fallback);

export function quarterLabel(t: number) {
  return `T${((t + 3) % 4) + 1} ${2025 + Math.floor((t + 3) / 4)}`;
}
/** x-axis value in years for charts */
export const quarterYear = (t: number) => 2025.75 + t / 4;

export function initialState(): State {
  return {
    t: 0,
    hiato: 0.6,
    piQ: 5,
    piHist: [5, 5, 5, 5],
    coreQ: 5,
    coreHist: [5, 5, 5, 5],
    ipca12: 5,
    core12: 5,
    expect: 4.8,
    cred: 0.45,
    selic: 15,
    juroReal: 15 - 4.8,
    dolar: 5.4,
    ppp: 5.4,
    risco: RISCO_BASE,
    divida: 78,
    ieff: 11,
    receita: 33.2,
    gastoEf: GASTO_BASE,
    primario: -0.3,
    desemprego: 6.1,
    pot: 100,
    pib: 100.6,
    pibQoQ: 0.5,
    pib12: 2.2,
    pibHist: [98.4, 98.9, 99.5, 100.1, 100.6],
    reservas: 345,
    cesta: 800,
    cestaHist: [762, 771, 781, 790, 800],
    cesta12: 5,
    negQuarters: 0,
    shocks: { ...NO_SHOCKS },
    flags: {},
  };
}

/** Laffer suave: arrecadação potencial (% PIB) para uma carga média. */
export function arrecadacaoPotencial(carga: number) {
  const f = (c: number) => c * (1 - 0.5 * (c / 70) ** 2);
  return (f(carga) / f(CARGA_BASE)) * CARGA_BASE;
}

export function neutralRate(risco: number, feedback = 1) {
  return R_NEUTRO + 0.5 * feedback * (risco - RISCO_BASE) / 100;
}

export function taylorSelic(s: State, opts: Opts = {}) {
  const peso = opts.taylorPeso ?? 1.5;
  const infl = opts.taylorNucleo ? s.core12 : s.ipca12;
  return neutralRate(s.risco, opts.feedback ?? 1) + s.expect + peso * (infl - META) + 0.5 * s.hiato;
}

const compound12 = (qs: number[]) => (qs.reduce((a, q) => a * (1 + q / 400), 1) - 1) * 100;

export function applyShock(s: State, kind: ShockKind, scale = 1): State {
  const k0 = { ...s.shocks };
  const k: Shocks = { ...NO_SHOCKS };
  switch (kind) {
    case "seca":
      k.alimentos += 22;
      k.demanda -= 0.25;
      break;
    case "petroleo":
      k.custo += 3;
      k.demanda -= 0.4;
      k.cambio += 0.03;
      break;
    case "pandemia":
      k.demanda -= 7;
      k.gastoExtra += 5;
      k.custo -= 1;
      k.receitaExtra -= 1;
      k.risco += 90;
      break;
    case "confianca":
      k.risco += 260;
      k.cambio += 0.13;
      k.demanda -= 1;
      break;
    case "commodities":
      k.cambio -= 0.12;
      k.demanda += 0.7;
      k.receitaExtra += 0.9;
      k.risco -= 45;
      k.alimentos -= 3;
      break;
  }
  const out = { ...k0 };
  for (const key of Object.keys(k) as (keyof Shocks)[]) out[key] += scale * k[key];
  return { ...s, shocks: out };
}

/** Advance one quarter. `rand` must return a standard normal draw. */
export function step(s: State, c: Controls, rand: () => number, opts: Opts = {}): { state: State; events: SimEvent[] } {
  const nz = opts.noise ?? 1;
  const fb = opts.feedback ?? 1;
  const e = () => fin(rand(), 0) * nz;
  const sh = s.shocks;

  // 1 · política monetária
  const rN = neutralRate(s.risco, fb);
  let selic: number;
  if (c.taylor) {
    const target = taylorSelic(s, opts);
    selic = Math.round((0.7 * s.selic + 0.3 * target) * 4) / 4;
  } else {
    selic = c.selic;
  }
  selic = clamp(fin(selic, s.selic), 2, 30);
  const juroReal = selic - s.expect;

  // 2 · fiscal (Laffer suave + estabilizador automático)
  const gastoEf = clamp(c.gasto + sh.gastoExtra, 15, 60);
  const receita = clamp(arrecadacaoPotencial(c.carga) * (1 + 0.012 * s.hiato) + sh.receitaExtra, 5, 60);
  const primario = receita - gastoEf;

  // 3 · IS: hiato do produto
  const hiato = clamp(
    0.78 * s.hiato -
      0.09 * (juroReal - rN) +
      0.12 * (gastoEf - GASTO_BASE) -
      0.05 * (c.carga - CARGA_BASE) -
      0.001 * (s.risco - RISCO_BASE) +
      sh.demanda +
      0.25 * e(),
    -15,
    10,
  );

  // 4 · câmbio: paridade de juros + risco + tendência de PPC
  const diff = juroReal - 1.8 - s.risco / 100;
  const D0 = 15 - 4.8 - 1.8 - RISCO_BASE / 100;
  const reservasDisp = Math.max(0, s.reservas - 40);
  const interv = clamp(c.intervencao, 0, reservasDisp);
  const eTarget = s.ppp * Math.exp(-0.016 * (diff - D0) + sh.cambio - 0.006 * interv);
  const dolar = clamp(s.dolar + 0.4 * (eTarget - s.dolar) + s.dolar * 0.018 * e(), 1.5, 25);
  const dep = Math.log(dolar / s.dolar);

  // 5 · Phillips com expectativas + repasse cambial + choques de oferta
  const coreQ = clamp(
    0.6 * s.expect + 0.4 * s.coreQ + 0.3 * s.hiato + 0.08 * 400 * dep + sh.custo + 0.4 * e(),
    -10,
    80,
  );
  const piQ = clamp(coreQ + 0.22 * sh.alimentos, -10, 90);
  const piHist = [...s.piHist.slice(1), piQ];
  const coreHist = [...s.coreHist.slice(1), coreQ];
  const ipca12 = clamp(compound12(piHist), -10, 150);
  const core12 = clamp(compound12(coreHist), -10, 150);

  // credibilidade do BC e expectativas (Focus)
  let cred = s.cred;
  if (ipca12 >= PISO && ipca12 <= TETO) cred += 0.015;
  else cred -= 0.012 * Math.min(5, Math.abs(ipca12 - (ipca12 > TETO ? TETO : PISO)));
  if (!c.taylor && selic < taylorSelic(s, opts) - 3) cred -= 0.02; // BC leniente
  cred = clamp(cred, 0.05, 0.9);
  const expect = clamp(0.7 * s.expect + 0.3 * (cred * META + (1 - cred) * ipca12), -2, 60);

  // 6 · Okun
  const desemprego = clamp(s.desemprego + 0.45 * (U_NATURAL - 0.45 * hiato - s.desemprego), 2.5, 25);

  // 7 · PIB
  const potG = POT_GROWTH - 0.05 * (c.carga - CARGA_BASE);
  const pot = s.pot * (1 + potG / 400);
  const pib = pot * (1 + hiato / 100);
  const pibQoQ = (pib / s.pib - 1) * 100;
  const pibHist = [...s.pibHist.slice(1), pib];
  const pib12 = (pib / pibHist[0] - 1) * 100;

  // 8 · dívida: d' = d·(1+i)/((1+g)(1+π)) − primário
  const ieff = clamp(
    0.88 * s.ieff + 0.12 * (0.35 * selic + 0.65 * (ipca12 + 2.5) + 0.35 * fb * (s.risco - RISCO_BASE) / 100),
    0,
    80,
  );
  const divida = clamp(
    fin((s.divida * (1 + ieff / 400)) / ((1 + pibQoQ / 100) * (1 + piQ / 400)) - primario / 4, s.divida),
    0,
    400,
  );

  // 9 · risco-país
  const riscoTarget =
    RISCO_BASE +
    fb * (4 * (divida - 78) + 0.08 * Math.max(0, divida - 90) ** 2) -
    25 * (primario + 0.3) +
    25 * Math.max(0, ipca12 - TETO) +
    sh.risco;
  const risco = clamp(s.risco + 0.35 * (riscoTarget - s.risco), 50, 3000);

  // 10 · cesta básica (alimentos)
  const foodQ = coreQ + sh.alimentos;
  const cesta = clamp(s.cesta * (1 + foodQ / 400), 100, 100000);
  const cestaHist = [...s.cestaHist.slice(1), cesta];
  const cesta12 = (cesta / cestaHist[0] - 1) * 100;

  const negQuarters = pibQoQ < 0 ? s.negQuarters + 1 : 0;

  const shocks: Shocks = {
    demanda: sh.demanda * 0.35,
    custo: sh.custo * 0.55,
    alimentos: sh.alimentos * 0.6,
    risco: sh.risco * 0.82,
    cambio: sh.cambio * 0.85,
    gastoExtra: sh.gastoExtra * 0.7,
    receitaExtra: sh.receitaExtra * 0.75,
  };

  const next: State = {
    t: s.t + 1,
    hiato,
    piQ,
    piHist,
    coreQ,
    coreHist,
    ipca12,
    core12,
    expect,
    cred,
    selic,
    juroReal,
    dolar,
    ppp: s.ppp * (1 + (piQ - 2.5) / 400),
    risco,
    divida,
    ieff,
    receita,
    gastoEf,
    primario,
    desemprego,
    pot,
    pib,
    pibQoQ,
    pib12,
    pibHist,
    reservas: s.reservas - interv,
    cesta,
    cestaHist,
    cesta12,
    negQuarters,
    shocks,
    flags: { ...s.flags },
  };
  const events = detect(s, next);
  return { state: next, events };
}

function detect(p: State, s: State): SimEvent[] {
  const ev: SimEvent[] = [];
  const f = s.flags;
  const once = (key: string, cond: boolean, text: string, tone: SimEvent["tone"] = "bad") => {
    if (cond && !f[key]) {
      f[key] = true;
      ev.push({ t: s.t, text, tone });
    }
  };
  const latch = (key: string, on: boolean, off: boolean, textOn: string, textOff: string | null, tone: SimEvent["tone"] = "bad") => {
    if (on && !f[key]) {
      f[key] = true;
      ev.push({ t: s.t, text: textOn, tone });
    } else if (off && f[key]) {
      f[key] = false;
      if (textOff) ev.push({ t: s.t, text: textOff, tone: "ok" });
    }
  };
  latch(
    "teto",
    s.ipca12 > TETO && p.ipca12 > TETO,
    s.ipca12 <= TETO,
    `inflação estourou o teto da meta (${s.ipca12.toFixed(1).replace(".", ",")}%) — BC escreve carta aberta`,
    "IPCA voltou para dentro do intervalo da meta",
  );
  latch(
    "piso",
    s.ipca12 < PISO && p.ipca12 < PISO,
    s.ipca12 >= PISO,
    "inflação abaixo do piso da meta — carta aberta também (juro alto demais?)",
    "IPCA voltou para dentro do intervalo da meta",
    "warn",
  );
  once("dois-digitos", s.ipca12 >= 10, "inflação de dois dígitos — corrói salários e poupança");
  if (s.negQuarters === 2) ev.push({ t: s.t, text: "recessão técnica: dois trimestres seguidos de PIB em queda", tone: "bad" });
  latch("desemprego", s.desemprego > 9, s.desemprego < 8, "desemprego passou de 9%", "desemprego voltou para baixo de 8%");
  once("div90", s.divida > 90, "dívida bruta passou de 90% do PIB");
  once("div100", s.divida > 100, "dívida bruta passou de 100% do PIB");
  once("div120", s.divida > 120, "dívida passou de 120% do PIB — risco de dominância fiscal");
  latch("risco", s.risco > 400, s.risco < 300, "risco-país acima de 400 pontos — mercado cobra prêmio por medo fiscal", "risco-país voltou para baixo de 300 pontos");
  latch("dolar", s.dolar > 6.5, s.dolar < 6, "dólar passou de R$ 6,50 — repasse cambial pressiona preços", null, "warn");
  once("selic20", s.selic > 20, "Selic acima de 20% — juro real asfixia crédito e investimento");
  once("reservas", s.reservas < 200, "reservas internacionais abaixo de US$ 200 bi — munição do BC acabando", "warn");
  latch("cesta", s.cesta12 > 15, s.cesta12 < 8, "cesta básica subiu mais de 15% em 12 meses — fome volta ao noticiário", null);
  if (p.primario < 0 && s.primario >= 0) ev.push({ t: s.t, text: "governo voltou a ter superávit primário", tone: "ok" });
  if (p.primario >= 0 && s.primario < 0 && s.t > 1) ev.push({ t: s.t, text: "contas voltaram ao déficit primário", tone: "warn" });
  return ev;
}

export type Run = { states: State[]; events: SimEvent[] };

/** Run a full scenario (used by presets, reduced visualizations and the frontier). */
export function runScenario(
  c: Controls | ((s: State) => Controls),
  {
    quarters = QUARTERS,
    shocks = [],
    rand = () => 0,
    opts = {},
  }: { quarters?: number; shocks?: { t: number; kind: ShockKind; scale?: number }[]; rand?: () => number; opts?: Opts } = {},
): Run {
  let s = initialState();
  const states = [s];
  const events: SimEvent[] = [];
  for (let i = 0; i < quarters; i++) {
    for (const k of shocks) if (k.t === s.t) s = applyShock(s, k.kind, k.scale ?? 1);
    const ctl = typeof c === "function" ? c(s) : c;
    const r = step(s, ctl, rand, opts);
    s = r.state;
    states.push(s);
    events.push(...r.events);
  }
  return { states, events };
}

export type Preset = { id: string; label: string; blurb: string; controls: Controls };

export const PRESETS: Preset[] = [
  {
    id: "status-quo",
    label: "Status quo",
    blurb: "Copom segue a regra, déficit primário pequeno: a dívida sobe devagar.",
    controls: { ...DEFAULT_CONTROLS },
  },
  {
    id: "populismo",
    label: "Populismo fiscal",
    blurb: "Gasto +4 p.p. do PIB sem imposto. Cresce no começo; depois juros, risco e dívida cobram a conta.",
    controls: { ...DEFAULT_CONTROLS, gasto: 37.5 },
  },
  {
    id: "austeridade",
    label: "Austeridade dura",
    blurb: "Corte de 4 p.p. no gasto de uma vez: dívida e risco caem, mas a recessão vem junto antes de o juro cair.",
    controls: { ...DEFAULT_CONTROLS, gasto: 29.5 },
  },
  {
    id: "bc-leniente",
    label: "BC leniente",
    blurb: "Selic derrubada para 8% na marra. Pouco desemprego por um tempo, inflação desancorada depois.",
    controls: { ...DEFAULT_CONTROLS, taylor: false, selic: 8 },
  },
  {
    id: "equilibrado",
    label: "Pacote equilibrado",
    blurb: "Primário de ~1,5% do PIB (corte gradual de gasto + leve ajuste de receita) e Copom na regra.",
    controls: { ...DEFAULT_CONTROLS, gasto: 32, carga: 34 },
  },
];
