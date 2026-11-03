import Link from "next/link";
import { Section } from "@/components/ui";
import { CHAPTER_COLOR, NAV } from "@/components/shell/nav";
import { CHAPTERS } from "@/content";
import { TransmissionMap } from "@/components/home/TransmissionMap";
import { MiniSimulador } from "@/components/simulador/MiniSimulador";

export default function Home() {
  const groups = [...new Set(NAV.filter((n) => n.chapter).map((n) => n.group))];
  return (
    <>
      <header className="mb-10 max-w-3xl animate-rise">
        <div className="mb-2 font-mono text-xs text-accent">economia brasileira · 12 capítulos interativos</div>
        <h1 className="text-4xl font-semibold tracking-tight text-balance">Economia, visualizada</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted text-pretty">
          Selic, dólar, inflação, preço dos alimentos, CDI, dívida pública, curva de Laffer. Em vez de explicar com
          texto, cada capítulo é um modelo que você mexe: arraste a alíquota e veja a arrecadação cair do outro lado
          da curva, segure a Selic baixa e veja as expectativas se desancorarem, deixe o primário negativo e veja a
          dívida virar bola de neve.
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-muted text-pretty">
          Os modelos são simplificações de livro-texto, calibrados com valores aproximados do Brasil (2025–2026).
          Servem para entender mecanismos e trade-offs, não para fazer previsões.
        </p>
      </header>

      <div id="mapa">
        <Section
          title="Tudo está ligado"
          intro={
            <>
              A economia é um sistema de feedbacks. Escolha uma alavanca, dê um choque e acompanhe, rodada a rodada,
              como ele se espalha. Repare nos ciclos: dívida → risco-país → dólar → inflação → Selic → dívida.
            </>
          }
        >
          <TransmissionMap />
        </Section>
      </div>

      <div id="mini-simulador">
        <Section
          title="Experimente ser o Banco Central"
          intro={
            <>
              Uma versão compacta do <Link href="/simulador" className="text-ink underline decoration-faint underline-offset-2">Simulador Brasil</Link>.
              Baixe a Selic na marra, aumente o gasto, provoque uma crise de confiança e veja inflação, dólar e dívida
              reagirem trimestre a trimestre.
            </>
          }
        >
          <MiniSimulador />
        </Section>
      </div>

      <div id="capitulos">
        <Section title="Os capítulos">
          <div className="space-y-8">
            {groups.map((g) => (
              <div key={g}>
                <div className="mb-3 text-[11px] font-semibold tracking-widest text-faint uppercase">{g}</div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {NAV.filter((n) => n.group === g).map((n) => {
                    const ch = CHAPTERS.find((c) => c.key === n.chapter)!;
                    const color = CHAPTER_COLOR[n.chapter!];
                    return (
                      <Link
                        key={n.href}
                        href={n.href}
                        className="group min-w-0 rounded-xl border border-line bg-panel p-4 transition hover:border-faint"
                      >
                        <div className="flex items-baseline gap-2">
                          <span className="font-mono text-xs" style={{ color }}>
                            {n.n}
                          </span>
                          <span className="font-medium">{n.label}</span>
                        </div>
                        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{ch.thesis}</p>
                        <div className="mt-3 flex items-center justify-between text-xs text-faint">
                          <span>{ch.concepts.length} conceitos</span>
                          <span className="transition group-hover:translate-x-0.5" style={{ color }}>
                            abrir →
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <p className="mt-16 max-w-3xl text-xs leading-relaxed text-faint">
        Projeto educativo e independente. Não tem vínculo com o Banco Central, IBGE, Tesouro Nacional ou qualquer
        governo ou partido. Números são aproximados (fontes de referência: IBGE, BCB, Tesouro, Ipeadata, DIEESE) e os
        modelos são deliberadamente simples. Nada aqui é recomendação de investimento. Código aberto (MIT) em{" "}
        <a href="https://github.com/sibelius/economic-visualized" className="text-muted underline decoration-faint underline-offset-2 hover:text-ink">
          github.com/sibelius/economic-visualized
        </a>
        . Correções e novos modelos são bem-vindos.
      </p>
    </>
  );
}
