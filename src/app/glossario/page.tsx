import { PageHeader } from "@/components/ui";
import { GlossaryBrowser } from "@/components/glossary/GlossaryBrowser";

const TITLE = "Glossário";
export const metadata = {
  title: TITLE,
  openGraph: { title: `${TITLE} · Economia, visualizada` },
  twitter: { title: `${TITLE} · Economia, visualizada` },
};

export default function Page() {
  return (
    <>
      <PageHeader n="Referência" title="Glossário">
        Todos os conceitos dos capítulos, pesquisáveis. Cada verbete leva à visualização que o demonstra.
      </PageHeader>
      <GlossaryBrowser />
    </>
  );
}
