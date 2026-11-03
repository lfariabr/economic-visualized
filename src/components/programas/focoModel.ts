import { rng } from "@/lib/random";

/** Família estilizada para a simulação de focalização via CadÚnico. */
export type Domicilio = {
  /** renda per capita verdadeira (R$/mês) */
  renda: number;
  /** fração da renda que a família deixaria de declarar se não houvesse checagem */
  sub: number;
  /** sorteio para ser pego no cruzamento de bases (CNIS, RAIS, etc.) */
  uCheck: number;
  /** "conhecimento" do programa; quanto menor, mais fácil de alcançar */
  uAcesso: number;
  /** sorteio para desistir por exigência de documentos/recadastramento */
  uBurocracia: number;
};

export const LINHA = 218;

export function makeDomicilios(n: number, seed = 11): Domicilio[] {
  const r = rng(seed);
  return Array.from({ length: n }, () => {
    // renda per capita lognormal com mediana ~R$ 520 (estilizado)
    const renda = Math.round(Math.exp(r.normal(Math.log(520), 0.95)));
    const subdeclara = r.bernoulli(0.35);
    return {
      renda,
      sub: subdeclara ? r.uniform(0.3, 0.8) : 0,
      uCheck: r.next(),
      uAcesso: r.next(),
      uBurocracia: r.next(),
    };
  });
}

export type Status = "acerto" | "inclusao" | "exclusao" | "fora";

/**
 * fisc ∈ [0,1]: intensidade de averiguação/cruzamento de dados.
 * busca ∈ [0,1]: busca ativa (ir atrás de quem não está cadastrado).
 */
export function classificar(d: Domicilio, fisc: number, busca: number): Status {
  const pobre = d.renda <= LINHA;
  const cadastrado = d.uAcesso < 0.6 + 0.38 * busca;
  const pego = d.uCheck < fisc;
  const declarada = pego ? d.renda : d.renda * (1 - d.sub);
  // exigências mais duras fazem parte das famílias (inclusive pobres) desistir
  const desiste = d.uBurocracia < (pobre ? 0.45 : 0.15) * fisc * fisc;
  const selecionado = cadastrado && !desiste && declarada <= LINHA;
  if (selecionado) return pobre ? "acerto" : "inclusao";
  return pobre ? "exclusao" : "fora";
}

export function avaliar(ds: Domicilio[], fisc: number, busca: number) {
  const c: Record<Status, number> = { acerto: 0, inclusao: 0, exclusao: 0, fora: 0 };
  for (const d of ds) c[classificar(d, fisc, busca)]++;
  const benef = c.acerto + c.inclusao;
  const pobres = c.acerto + c.exclusao;
  const erroInclusao = benef ? c.inclusao / benef : 0;
  const erroExclusao = pobres ? c.exclusao / pobres : 0;
  // escala Brasil: população estilizada representa ~77 mi de domicílios
  const escala = 77e6 / ds.length;
  const custoBeneficio = (benef * escala * 670 * 12) / 1e9; // R$ bi/ano
  const vazamento = (c.inclusao * escala * 670 * 12) / 1e9;
  const custoAdm = 2 + 14 * fisc * fisc + 5 * busca * busca; // R$ bi/ano, estilizado e convexo
  // custo social da exclusão: benefício que deixou de chegar a quem é pobre
  const custoExclusao = (c.exclusao * escala * 670 * 12) / 1e9;
  return { c, benef, pobres, erroInclusao, erroExclusao, custoBeneficio, vazamento, custoAdm, custoExclusao };
}
