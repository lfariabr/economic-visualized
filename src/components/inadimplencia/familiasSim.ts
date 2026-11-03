/**
 * Simulação de ~300 famílias endividadas, mês a mês.
 * Modelo didático e simplificado: calibrado só para dar ordens de grandeza
 * parecidas com as do Brasil (CNC/Peic, BCB, Serasa) — não é previsão.
 */
import { clamp, rng } from "@/lib/random";

export const SM = 1518; // salário mínimo 2025 (aprox.)
export const COLS = 20;
export const ROWS = 15;
export const N_FAM = COLS * ROWS;
/** cada ponto representa ~250 mil famílias (300 × 250 mil ≈ 75 mi de famílias) */
export const ESCALA = 250_000;
const BURN_IN = 72;
const SALARIO_REAL = 0.045; // reajuste nominal de renda ≈ IPCA (a.a.)
const PESO_ALIMENTOS = 0.35; // fatia de comida nas despesas essenciais
const ACHAR_EMPREGO = 0.15; // probabilidade mensal de achar emprego

export type Tipo = "rotativo" | "cheque" | "pessoal" | "consignado" | "financiamento";

export const LINHAS: Record<Tipo, { label: string; spread: number; amort: number; sens: number; color: string }> = {
  // spread em % a.m. acima da Selic mensal; amort = fração do saldo amortizada por mês
  rotativo: { label: "cartão rotativo", spread: 0.11, amort: 0.08, sens: 1, color: "#f87171" },
  cheque: { label: "cheque especial", spread: 0.063, amort: 0.08, sens: 1, color: "#fb923c" },
  pessoal: { label: "crédito pessoal", spread: 0.033, amort: 1 / 24, sens: 1, color: "#fbbf24" },
  consignado: { label: "consignado", spread: 0.006, amort: 1 / 60, sens: 0.2, color: "#34d399" },
  financiamento: { label: "financiamento", spread: 0.009, amort: 1 / 48, sens: 0.5, color: "#60a5fa" },
};
export const TIPOS = Object.keys(LINHAS) as Tipo[];

export type Status = "semdivida" | "emdia" | "atrasado" | "negativado" | "renegociado";
export const STATUS_COR: Record<Status, string> = {
  semdivida: "#242a38",
  emdia: "#34d399",
  atrasado: "#fbbf24",
  negativado: "#f87171",
  renegociado: "#60a5fa",
};
export const STATUS_LABEL: Record<Status, string> = {
  semdivida: "sem dívida",
  emdia: "em dia",
  atrasado: "atrasado (até 90 dias)",
  negativado: "negativado (> 90 dias)",
  renegociado: "renegociado, em dia",
};
const STATUS_CODE: Status[] = ["semdivida", "emdia", "atrasado", "negativado", "renegociado"];

export type Familia = {
  renda0: number;
  ess: number; // fração da renda gasta com o essencial
  peso: number; // risco de desemprego relativo (renda baixa → maior)
  toma: boolean; // usa crédito
  cartao: boolean; // tem limite de cartão para tapar buracos
  mult: number; // multiplicador do comprometimento-alvo
  tipo: Tipo;
  D: number; // saldo do contrato principal
  C: number; // saldo do cartão (rotativo)
  emp: boolean;
  atraso: number; // meses em atraso
  // renegociação
  reneg: boolean;
  renegTaxa: number;
  parcela: number;
  renegMes: number; // mês em que renegociou (−1 = nunca)
  garantido: boolean;
  reincidiu: boolean;
  estrategico: boolean;
  limpo: boolean;
  rodadaReneg: number; // última rodada em que renegociou (0 = nenhuma)
};

export type SimParams = {
  selic: number; // % a.a.
  desemprego: number; // %
  dsr: number; // comprometimento-alvo médio, % da renda
  alimentos: number; // inflação de alimentos, % a.a.
  rotativo: number; // % dos endividados com dívida principal no rotativo
  feedback: boolean; // inadimplência → spread
};

export const SIM_DEFAULT: SimParams = { selic: 15, desemprego: 6, dsr: 28, alimentos: 5, rotativo: 15, feedback: false };

export type Programa = {
  desconto: number; // % médio
  jurosMax: number; // % a.m.
  faixaSM: number; // renda até N salários mínimos
  tetoDivida: number; // R$
  fgo: number; // R$ bi
  limpeza: number; // R$ — dívidas até esse valor têm o nome limpo
  rodadas: number; // 1, 2 ou 3
  expectativa: number; // 0–100: crença de que haverá nova rodada
};

export const PROGRAMA_DEFAULT: Programa = {
  desconto: 80,
  jurosMax: 1.99,
  faixaSM: 2,
  tetoDivida: 5000,
  fgo: 8,
  limpeza: 100,
  rodadas: 1,
  expectativa: 30,
};

export const RODADA_MES = [6, 30, 54];
export const JANELA = 4; // meses de cada rodada

export type Macro = {
  t: number;
  alimIdx: number;
  spreadExtra: number; // % a.m. (fração)
  creditMult: number;
  inadRef: number;
  custoFgo: number; // R$ (escala real)
  usoFgo: number; // R$ de exposição garantida (escala real)
  expect: number; // 0–1
  rodadasFeitas: number;
};

export type Agg = {
  t: number;
  endividados: number; // % das famílias
  atraso: number; // % das famílias com conta em atraso (qualquer)
  negativados: number; // % das famílias
  inad: number; // % dos endividados com atraso > 90 dias
  renegociados: number; // % das famílias
  dsr: number; // comprometimento médio dos endividados, % da renda
  spreadExtra: number; // p.p. a.m.
  estrategicos: number; // nº de famílias
};

export type SimState = { fams: Familia[]; macro: Macro; seed: number };

const selicM = (s: number) => (1 + s / 100) ** (1 / 12) - 1;

function taxa(f: Familia, tipo: Tipo, p: SimParams, m: Macro) {
  const l = LINHAS[tipo];
  // spread também sobe com a Selic (custo de captação e risco percebido)
  return selicM(p.selic) + l.spread * (1 + 0.06 * (p.selic - 15)) + m.spreadExtra * l.sens;
}

function devido(f: Familia, p: SimParams, m: Macro) {
  const iD = f.reneg ? f.renegTaxa : taxa(f, f.tipo, p, m);
  const iC = taxa(f, "rotativo", p, m);
  const dueD = f.D < 1 ? 0 : f.reneg ? Math.min(f.parcela, f.D * (1 + iD)) : f.D * (iD + LINHAS[f.tipo].amort);
  const dueC = f.C < 1 ? 0 : f.C * (iC + LINHAS.rotativo.amort);
  return { iD, iC, dueD, dueC };
}

export function status(f: Familia): Status {
  if (f.D + f.C < 1) return "semdivida";
  if (f.atraso >= 3) return "negativado";
  if (f.atraso >= 1) return "atrasado";
  if (f.reneg || f.limpo) return "renegociado";
  return "emdia";
}

export const statusCode = (f: Familia) => STATUS_CODE.indexOf(status(f));
export const codeStatus = (c: number) => STATUS_CODE[c];

/** saldo-alvo do contrato principal dado o comprometimento-alvo */
function saldoAlvo(f: Familia, tipo: Tipo, p: SimParams, m: Macro, limitado = false) {
  let c = clamp((p.dsr / 100) * f.mult, 0.02, 0.7);
  // análise de crédito: parcela nova até ~90% da renda livre de uma família típica
  if (limitado) c = Math.min(c, 0.9 * (1 - f.ess * (1 + PESO_ALIMENTOS * (m.alimIdx - 1))));
  const i = taxa(f, tipo, p, m);
  return (c * f.renda0) / (i + LINHAS[tipo].amort);
}

export function criarFamilias(p: SimParams, seed = 13): Familia[] {
  const r = rng(seed);
  const m = macroInicial();
  const fams: Familia[] = [];
  for (let k = 0; k < N_FAM; k++) {
    const renda0 = clamp(2800 * Math.exp(r.normal(0, 0.7)), 900, 40000);
    const ess = clamp(0.6 - 0.12 * Math.log(renda0 / 2800) + r.normal(0, 0.06), 0.3, 0.9);
    let peso = renda0 < 2 * SM ? 1.6 : renda0 < 5 * SM ? 1 : 0.45;
    const toma = r.next() < 0.8;
    const cartao = r.next() < 0.55;
    const mult = clamp(Math.exp(r.normal(-0.06, 0.35)), 0.25, 2.5);
    const uR = r.next();
    const uT = r.next();
    const tipo: Tipo =
      uR < p.rotativo / 100
        ? "rotativo"
        : uT < 0.12
          ? "cheque"
          : uT < 0.47
            ? "pessoal"
            : uT < 0.75
              ? "consignado"
              : renda0 > 2.5 * SM
                ? "financiamento"
                : "pessoal";
    if (tipo === "consignado") peso *= 0.3; // muitos são aposentados do INSS e servidores
    const emp = r.next() >= (p.desemprego / 100) * peso;
    const f: Familia = {
      renda0,
      ess,
      peso,
      toma,
      cartao,
      mult,
      tipo,
      D: 0,
      C: 0,
      emp,
      atraso: 0,
      reneg: false,
      renegTaxa: 0,
      parcela: 0,
      renegMes: -1,
      garantido: false,
      reincidiu: false,
      estrategico: false,
      limpo: false,
      rodadaReneg: 0,
    };
    if (toma) {
      if (tipo === "rotativo") f.C = saldoAlvo(f, "rotativo", p, m);
      else f.D = saldoAlvo(f, tipo, p, m);
    }
    fams.push(f);
  }
  return fams;
}

function macroInicial(): Macro {
  return { t: 0, alimIdx: 1, spreadExtra: 0, creditMult: 1, inadRef: 0, custoFgo: 0, usoFgo: 0, expect: 0, rodadasFeitas: 0 };
}

/** um mês na vida de uma família; u = 8 sorteios uniformes fixos (números aleatórios comuns entre cenários) */
function passoFamilia(f: Familia, p: SimParams, m: Macro, u: number[], prog: Programa | null) {
  // emprego
  const sep = ((ACHAR_EMPREGO * p.desemprego) / 100 / (1 - p.desemprego / 100)) * f.peso;
  if (f.emp) {
    if (u[0] < sep) f.emp = false;
  } else if (u[0] < ACHAR_EMPREGO) f.emp = true;

  const ruido = (u[1] + u[2] - 1) * 0.2; // ≈ N(0; 0,08)
  const renda = f.renda0 * (f.emp ? 1 : 0.4) * (1 + ruido);
  const imprevisto = u[6] < 0.14 ? 0.3 * f.renda0 : 0; // remédio, conserto, funeral…
  const squeeze = 1 + PESO_ALIMENTOS * (m.alimIdx - 1);
  let cap = Math.max(0, renda - f.renda0 * f.ess * squeeze - imprevisto);

  if (f.D + f.C < 1) {
    f.D = 0;
    f.C = 0;
    f.atraso = 0;
    f.reneg = false;
    f.estrategico = false;
    f.limpo = false;
    if (f.toma && u[3] < 0.08) f.D = saldoAlvo(f, f.tipo, p, m, true) * 0.6;
    return;
  }

  const { iD, iC, dueD: dD, dueC } = devido(f, p, m);
  let dueD = dD;
  // consignado: parcela descontada em folha enquanto há emprego
  if (f.tipo === "consignado" && !f.reneg && f.emp) {
    cap = Math.max(0, cap - dueD);
    f.D = Math.max(0, f.D * (1 + iD) - dueD);
    dueD = 0;
  }
  const due = dueD + dueC;

  // risco moral: quem espera nova rodada de renegociação para de pagar de propósito
  if (prog && m.expect > 0 && !f.estrategico && f.atraso === 0 && f.renda0 <= prog.faixaSM * SM && f.D <= prog.tetoDivida && f.C <= prog.tetoDivida) {
    if (due / Math.max(renda, 1) > 0.15 && u[5] < 0.06 * m.expect) f.estrategico = true;
  }

  const temAcesso = f.atraso === 0 && f.cartao;
  let pago: number;
  if (f.estrategico) {
    pago = 0;
  } else if (cap >= due) {
    pago = due;
  } else if (temAcesso && f.C + (due - cap) <= f.renda0 * 1.2 * m.creditMult) {
    // tapa o buraco no cartão: fica em dia, mas a dívida cara cresce
    f.C += due - cap;
    pago = due;
  } else {
    pago = cap * 0.85;
  }

  const phi = due > 0 ? Math.min(1, pago / due) : 1;
  const mora = phi < 0.999 ? 0.01 : 0;
  // inadimplente: encargos limitados (aprox.; o rotativo tem teto desde 2024)
  const jD = f.atraso >= 3 ? Math.min(iD, 0.03) : iD;
  const jC = f.atraso >= 3 ? Math.min(iC, 0.03) : iC;
  if (dueD > 0 || f.tipo !== "consignado" || f.reneg || !f.emp) f.D = Math.max(0, f.D * (1 + jD + mora) - phi * dueD);
  f.C = Math.max(0, f.C * (1 + jC + mora) - phi * dueC);

  if (phi >= 0.999) {
    // folga para pôr o atraso em dia
    const folga = cap - due;
    if (f.atraso > 0 && folga > 0.3 * due) {
      const extra = Math.min(folga, 0.8 * due);
      const tot = f.D + f.C;
      if (tot > 0) {
        f.D = Math.max(0, f.D - (extra * f.D) / tot);
        f.C = Math.max(0, f.C - (extra * f.C) / tot);
      }
      f.atraso = Math.max(0, f.atraso - 1);
    }
  } else {
    f.atraso += 1;
  }

  // reincidência de renegociado
  if (f.reneg && f.atraso >= 3 && !f.reincidiu) {
    f.reincidiu = true;
    if (f.garantido) m.custoFgo += (f.D + f.C) * ESCALA;
  }

  // acordo com o próprio banco (feirão): desconto modesto, juro alto
  if (f.atraso >= 3 && !f.reneg && !f.estrategico && u[4] < 0.045 && cap > 0) {
    const B = (f.D + f.C) * 0.7;
    const j = 0.035;
    const n = 24;
    const parcela = (B * j) / (1 - (1 + j) ** -n);
    if (parcela <= cap) renegociar(f, B, j, parcela, m.t, false);
  }
  // depois de 5 anos a negativação cai (e o banco já lançou a perda)
  if (f.atraso >= 60) {
    f.D = 0;
    f.C = 0;
    f.atraso = 0;
  }

  // novos empréstimos para voltar ao comprometimento-alvo (só nome limpo; banco limita à renda livre)
  if (f.toma && f.atraso === 0 && !f.reneg && u[3] < 0.12 * m.creditMult * clamp(1 - 0.03 * (p.selic - 15), 0.4, 1.3)) {
    const alvo = saldoAlvo(f, f.tipo, p, m, true);
    if (f.D < alvo * 0.8) f.D = alvo;
  }
  if (f.limpo && f.atraso === 0 && f.D + f.C < 1) f.limpo = false;
}

function renegociar(f: Familia, B: number, j: number, parcela: number, t: number, garantido: boolean) {
  f.D = B;
  f.C = 0;
  f.reneg = true;
  f.renegTaxa = j;
  f.parcela = parcela;
  f.atraso = 0;
  f.renegMes = t;
  f.garantido = garantido;
  f.reincidiu = false;
  f.estrategico = false;
}

/** ações do programa de renegociação no mês m.t (antes do passo das famílias) */
function passoPrograma(fams: Familia[], p: SimParams, m: Macro, prog: Programa, r: ReturnType<typeof rng>) {
  const rodada = RODADA_MES.slice(0, prog.rodadas).findIndex((s) => m.t >= s && m.t < s + JANELA);
  if (rodada < 0) {
    // após a primeira rodada, cresce a crença de que virá outra
    if (m.rodadasFeitas > 0) m.expect = clamp((prog.expectativa / 100) * (0.6 + 0.4 * m.rodadasFeitas), 0, 1);
    return;
  }
  const nRodada = rodada + 1;
  if (m.t === RODADA_MES[rodada]) {
    m.rodadasFeitas = nRodada;
    // limpeza de nome para dívidas pequenas
    for (const f of fams) {
      if (f.atraso >= 3 && f.D + f.C <= prog.limpeza) {
        f.atraso = 0;
        f.limpo = true;
        f.estrategico = false;
      }
    }
  }
  const SMv = prog.faixaSM * SM;
  const j = prog.jurosMax / 100;
  const n = 60;
  const alav = 5; // R$ de dívida garantida por R$ do FGO (aprox.)
  for (const f of fams) {
    if (f.rodadaReneg === nRodada) continue;
    if (f.atraso < 3 && !f.estrategico) continue;
    if (f.renda0 > SMv) continue;
    const saldo = f.D + f.C;
    if (f.D > prog.tetoDivida || f.C > prog.tetoDivida || saldo < 1) continue; // teto vale por dívida
    const desc = clamp(prog.desconto / 100 + (r.next() - 0.5) * 0.3, 0, 0.98);
    const B = saldo * (1 - desc);
    const parcela = (B * j) / (1 - (1 + j) ** -n);
    const renda = f.renda0 * (f.emp ? 1 : 0.4);
    const cap = Math.max(0, renda - f.renda0 * f.ess * (1 + PESO_ALIMENTOS * (m.alimIdx - 1)));
    const cabe = parcela <= cap;
    const adesao = f.estrategico ? 0.6 : cabe ? 0.45 : 0.08;
    if (r.next() >= adesao) continue;
    if (m.usoFgo + B * ESCALA > prog.fgo * 1e9 * alav) continue; // garantia esgotada
    m.usoFgo += B * ESCALA;
    renegociar(f, B, j, parcela, m.t, true);
    f.rodadaReneg = nRodada;
  }
}

export function agregados(fams: Familia[], m: Macro, p: SimParams): Agg {
  let end = 0;
  let atr = 0;
  let neg = 0;
  let ren = 0;
  let dsr = 0;
  let est = 0;
  let pag = 0;
  for (const f of fams) {
    const s = status(f);
    if (s === "semdivida") continue;
    end++;
    if (f.atraso >= 1) atr++;
    if (f.atraso >= 3) neg++;
    if (s === "renegociado") ren++;
    if (f.estrategico) est++;
    if (f.atraso >= 3) continue;
    pag++;
    const { dueD, dueC } = devido(f, p, m);
    dsr += Math.min(1.5, (dueD + dueC) / f.renda0);
  }
  const N = fams.length;
  return {
    t: m.t,
    endividados: (100 * end) / N,
    atraso: (100 * atr) / N,
    negativados: (100 * neg) / N,
    inad: end ? (100 * neg) / end : 0,
    renegociados: (100 * ren) / N,
    dsr: pag ? (100 * dsr) / pag : 0,
    spreadExtra: m.spreadExtra * 100,
    estrategicos: est,
  };
}

/** avança um mês o estado inteiro (muta) */
export function passo(s: SimState, p: SimParams, prog: Programa | null = null) {
  const m = s.macro;
  const r = rng((s.seed * 7919 + (m.t + BURN_IN + 1) * 104729) >>> 0);
  const rp = rng((s.seed * 31 + (m.t + 1) * 6151) >>> 0);
  m.alimIdx *= ((1 + p.alimentos / 100) / (1 + SALARIO_REAL)) ** (1 / 12);
  if (prog) passoPrograma(s.fams, p, m, prog, rp);
  const u = [0, 0, 0, 0, 0, 0, 0, 0];
  for (const f of s.fams) {
    for (let k = 0; k < 8; k++) u[k] = r.next();
    passoFamilia(f, p, m, u, prog);
  }
  // realimentação macro: mais calote → bancos sobem spread e cortam limites
  const a = agregados(s.fams, m, p);
  const exc = Math.max(0, (a.inad - m.inadRef) / 100);
  const alvoSpread = p.feedback ? 0.2 * exc : 0;
  m.spreadExtra += 0.3 * (alvoSpread - m.spreadExtra);
  m.creditMult = p.feedback ? clamp(1 - 4 * exc, 0.25, 1) : 1;
  m.t += 1;
}

/** estado inicial: cria famílias e roda um período de aquecimento (descartado) */
export function iniciar(p: SimParams, seed = 13): SimState {
  const fams = criarFamilias(p, seed);
  const s: SimState = { fams, macro: macroInicial(), seed };
  s.macro.t = -BURN_IN;
  // aquecimento com o Brasil "de hoje"; choques dos sliders valem a partir do mês 0
  const pq: SimParams = { ...SIM_DEFAULT, dsr: p.dsr, rotativo: p.rotativo, alimentos: SALARIO_REAL * 100 };
  for (let k = 0; k < BURN_IN; k++) passo(s, pq);
  s.macro.t = 0;
  s.macro.alimIdx = 1;
  s.macro.inadRef = agregados(s.fams, s.macro, p).inad;
  return s;
}

export function clonar(s: SimState): SimState {
  return { seed: s.seed, macro: { ...s.macro }, fams: s.fams.map((f) => ({ ...f })) };
}

export type Cenario = {
  aggs: Agg[];
  codes: Uint8Array[]; // status de cada família, por mês
  reneg: number; // famílias que renegociaram pelo programa (soma das rodadas)
  renegUnicas: number;
  reinc12: number; // % dos renegociados que voltaram a ficar negativados em até 12 meses
  reinc24: number;
  custoFgo: number; // R$
  usoFgo: number; // R$
  limpos: number;
};

/** roda um cenário inteiro (com ou sem programa), com números aleatórios comuns */
export function rodarCenario(p: SimParams, prog: Programa | null, meses: number, seed = 13): Cenario {
  const s = iniciar(p, seed);
  const aggs: Agg[] = [agregados(s.fams, s.macro, p)];
  const codes: Uint8Array[] = [Uint8Array.from(s.fams.map(statusCode))];
  // rastreia reincidência por família a partir da 1ª renegociação do programa
  const primeira = new Array<number>(s.fams.length).fill(-1);
  const reinc = new Array<number>(s.fams.length).fill(-1);
  let renegTotal = 0;
  let limpos = 0;
  for (let k = 0; k < meses; k++) {
    const antes = s.fams.map((f) => f.rodadaReneg);
    const limpoAntes = s.fams.map((f) => f.limpo);
    passo(s, p, prog);
    s.fams.forEach((f, i) => {
      if (f.rodadaReneg !== antes[i]) {
        renegTotal++;
        if (primeira[i] < 0) primeira[i] = f.renegMes;
      }
      if (f.limpo && !limpoAntes[i]) limpos++;
      if (primeira[i] >= 0 && reinc[i] < 0 && f.reneg && f.atraso >= 3) reinc[i] = s.macro.t - primeira[i];
    });
    aggs.push(agregados(s.fams, s.macro, p));
    codes.push(Uint8Array.from(s.fams.map(statusCode)));
  }
  const elig12 = primeira.filter((m) => m >= 0 && m + 12 <= meses);
  const elig24 = primeira.filter((m) => m >= 0 && m + 24 <= meses);
  const r12 = primeira.filter((m, i) => m >= 0 && m + 12 <= meses && reinc[i] >= 0 && reinc[i] <= 12).length;
  const r24 = primeira.filter((m, i) => m >= 0 && m + 24 <= meses && reinc[i] >= 0 && reinc[i] <= 24).length;
  return {
    aggs,
    codes,
    reneg: renegTotal,
    renegUnicas: primeira.filter((m) => m >= 0).length,
    reinc12: elig12.length ? (100 * r12) / elig12.length : 0,
    reinc24: elig24.length ? (100 * r24) / elig24.length : 0,
    custoFgo: s.macro.custoFgo,
    usoFgo: s.macro.usoFgo,
    limpos,
  };
}
