# Economia, visualizada

Modelos econômicos interativos com foco no Brasil. Cada capítulo é uma página de simulações que você mexe: sliders, choques, play/pause por trimestre ou ano, e indicadores que ficam vermelhos quando algo dá errado.

| # | Página | O que dá para mexer |
|---|--------|---------------------|
| 00 | [Visão geral](/) | Mapa de transmissão: dê um choque na Selic, gasto, impostos, safra ou risco-país e veja o efeito se espalhar |
| 01 | [Moeda & inflação](/moeda) | MV = PY, senhoriagem, hiperinflação, URV e Plano Real |
| 02 | [IPCA & inércia](/inflacao) | Cesta do IPCA, meta e bandas, indexação, núcleos, IGP-M |
| 03 | [Preço dos alimentos](/alimentos) | Safra e elasticidade, teia de aranha, dólar e commodities, cesta básica, tabelamento |
| 04 | [Selic & Copom](/selic) | Seja o Copom, regra de Taylor, defasagens, dominância fiscal |
| 05 | [CDI, juros & crédito](/juros) | CDI × poupança × Tesouro, spread, rotativo, Price × SAC, curva de juros |
| 06 | [Phillips & desemprego](/phillips) | Phillips aceleracionista, NAIRU, taxa de sacrifício, Okun |
| 07 | [Dólar & câmbio](/cambio) | Carry trade, repasse cambial, PPC, reservas, ataque especulativo, curva J |
| 08 | [Curva de Laffer & impostos](/laffer) | Alíquota × arrecadação, peso morto, regressividade, IVA × cascata |
| 09 | [Dívida pública](/divida) | d = d(1+r)/(1+g) − s, primário de equilíbrio, arcabouço fiscal |
| 10 | [PIB & crescimento](/pib) | Multiplicador, IS-LM, Solow, bônus demográfico, Gini |
| 11 | [Simulador Brasil](/simulador) | Você é o governo e o BC: 10 anos, choques e cenários |
| 12 | [Brasil 1980–2026](/historia) | Séries históricas, planos econômicos, crises |
| 13 | [Glossário](/glossario) | Todos os conceitos, pesquisáveis |

## Rodar

```bash
pnpm install
pnpm dev
```

## Stack

Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · TypeScript. Gráficos em SVG feitos à mão, sem bibliotecas de chart. Simulações com PRNG com semente (render determinístico).

## Aviso

Projeto educativo e independente, sem vínculo com BCB, IBGE, Tesouro ou qualquer governo/partido. Números aproximados; modelos simplificados de livro-texto. Não é previsão nem recomendação de investimento.
