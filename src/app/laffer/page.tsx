import { PageHeader } from "@/components/ui";
import { ConceptList } from "@/components/ConceptList";
import { CHAPTER_COLOR } from "@/components/shell/nav";
import { laffer } from "@/content/laffer";

const TITLE = "Curva de Laffer & impostos";
export const metadata = {
  title: TITLE,
  openGraph: { title: `${TITLE} · Economia, visualizada` },
  twitter: { title: `${TITLE} · Economia, visualizada` },
};

export default function Page() {
  return (
    <>
      <PageHeader n="Capítulo 08" title={TITLE} color={CHAPTER_COLOR.laffer}>
        Em construção.
      </PageHeader>
      <ConceptList chapter={laffer} />
    </>
  );
}
