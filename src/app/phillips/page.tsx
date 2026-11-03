import { PageHeader } from "@/components/ui";
import { ConceptList } from "@/components/ConceptList";
import { CHAPTER_COLOR } from "@/components/shell/nav";
import { phillips } from "@/content/phillips";

const TITLE = "Phillips & desemprego";
export const metadata = {
  title: TITLE,
  openGraph: { title: `${TITLE} · Economia, visualizada` },
  twitter: { title: `${TITLE} · Economia, visualizada` },
};

export default function Page() {
  return (
    <>
      <PageHeader n="Capítulo 06" title={TITLE} color={CHAPTER_COLOR.phillips}>
        Em construção.
      </PageHeader>
      <ConceptList chapter={phillips} />
    </>
  );
}
