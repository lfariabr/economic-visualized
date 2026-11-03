import { PageHeader } from "@/components/ui";
import { ConceptList } from "@/components/ConceptList";
import { CHAPTER_COLOR } from "@/components/shell/nav";
import { simulador } from "@/content/simulador";

const TITLE = "Simulador Brasil";
export const metadata = {
  title: TITLE,
  openGraph: { title: `${TITLE} · Economia, visualizada` },
  twitter: { title: `${TITLE} · Economia, visualizada` },
};

export default function Page() {
  return (
    <>
      <PageHeader n="Capítulo 11" title={TITLE} color={CHAPTER_COLOR.simulador}>
        Em construção.
      </PageHeader>
      <ConceptList chapter={simulador} />
    </>
  );
}
