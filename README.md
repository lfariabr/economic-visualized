# Economia, visualizada

**Site:** https://economic-visualized.vercel.app

Modelos econômicos interativos com foco no Brasil. Cada capítulo é uma página de simulações que você mexe: sliders, choques, play/pause por trimestre ou ano, e indicadores que ficam vermelhos quando algo dá errado.

| # | Página | O que dá para mexer |
|---|--------|---------------------|
| 00 | [Visão geral](https://economic-visualized.vercel.app/) | Mapa de transmissão: dê um choque na Selic, gasto, impostos, safra ou risco-país e veja o efeito se espalhar |
| 01 | [Moeda & inflação](https://economic-visualized.vercel.app/moeda) | MV = PY, senhoriagem, hiperinflação, URV e Plano Real |
| 02 | [IPCA & inércia](https://economic-visualized.vercel.app/inflacao) | Cesta do IPCA, meta e bandas, indexação, núcleos, IGP-M |
| 03 | [Preço dos alimentos](https://economic-visualized.vercel.app/alimentos) | Safra e elasticidade, teia de aranha, dólar e commodities, cesta básica, tabelamento |
| 04 | [Selic & Copom](https://economic-visualized.vercel.app/selic) | Seja o Copom, regra de Taylor, defasagens, dominância fiscal |
| 05 | [CDI, juros & crédito](https://economic-visualized.vercel.app/juros) | CDI × poupança × Tesouro, spread, rotativo, Price × SAC, curva de juros |
| 06 | [Phillips & desemprego](https://economic-visualized.vercel.app/phillips) | Phillips aceleracionista, NAIRU, taxa de sacrifício, Okun |
| 07 | [Dólar & câmbio](https://economic-visualized.vercel.app/cambio) | Carry trade, repasse cambial, PPC, reservas, ataque especulativo, curva J |
| 08 | [Curva de Laffer & impostos](https://economic-visualized.vercel.app/laffer) | Alíquota × arrecadação, peso morto, regressividade, IVA × cascata |
| 09 | [Dívida pública](https://economic-visualized.vercel.app/divida) | d = d(1+r)/(1+g) − s, primário de equilíbrio, arcabouço fiscal |
| 10 | [PIB & crescimento](https://economic-visualized.vercel.app/pib) | Multiplicador, IS-LM, Solow, bônus demográfico, Gini |
| 11 | [Simulador Brasil](https://economic-visualized.vercel.app/simulador) | Você é o governo e o BC: 10 anos, choques e cenários |
| 12 | [Brasil 1980–2026](https://economic-visualized.vercel.app/historia) | Séries históricas, planos econômicos, crises |
| 13 | [Inadimplência & Desenrola](https://economic-visualized.vercel.app/inadimplencia) | Simulador de inadimplência com famílias, rodadas do Desenrola, risco moral, seleção adversa |
| 14 | [Programas sociais & subsídios](https://economic-visualized.vercel.app/programas) | Bolsa Família, vale-gás, gastos tributários ("bolsa empresário"), BNDES, subsídio a combustível, alocador de orçamento |
| 15 | [Glossário](https://economic-visualized.vercel.app/glossario) | Todos os conceitos, pesquisáveis |

## Rodar

```bash
pnpm install
pnpm dev
```

## Stack

Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · TypeScript. Gráficos em SVG feitos à mão, sem bibliotecas de chart. Simulações com PRNG com semente (render determinístico).

## Contribuir

PRs são bem-vindos: correções de dados, novos modelos, melhorias nas visualizações. Cada capítulo vive em `src/app/<rota>/page.tsx`, `src/components/<capítulo>/` e `src/content/<capítulo>.ts`.

## Licença

[MIT](LICENSE)

## Aviso

Projeto educativo e independente, sem vínculo com BCB, IBGE, Tesouro ou qualquer governo/partido. Números aproximados; modelos simplificados de livro-texto. Não é previsão nem recomendação de investimento.
