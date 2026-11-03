import { PageHeader } from "@/components/ui";
import { ConceptList } from "@/components/ConceptList";
import { CHAPTER_COLOR } from "@/components/shell/nav";
import { juros } from "@/content/juros";

const TITLE = "CDI, juros & crédito";
export const metadata = {
  title: TITLE,
  openGraph: { title: `${TITLE} · Economia, visualizada` },
  twitter: { title: `${TITLE} · Economia, visualizada` },
};

export default function Page() {
  return (
    <>
      <PageHeader n="Capítulo 05" title={TITLE} color={CHAPTER_COLOR.juros}>
        Em construção.
      </PageHeader>
      <ConceptList chapter={juros} />
    </>
  );
}
