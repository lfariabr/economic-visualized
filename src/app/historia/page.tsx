import { PageHeader } from "@/components/ui";
import { ConceptList } from "@/components/ConceptList";
import { CHAPTER_COLOR } from "@/components/shell/nav";
import { historia } from "@/content/historia";

const TITLE = "Brasil 1980–2026";
export const metadata = {
  title: TITLE,
  openGraph: { title: `${TITLE} · Economia, visualizada` },
  twitter: { title: `${TITLE} · Economia, visualizada` },
};

export default function Page() {
  return (
    <>
      <PageHeader n="Capítulo 12" title={TITLE} color={CHAPTER_COLOR.historia}>
        Em construção.
      </PageHeader>
      <ConceptList chapter={historia} />
    </>
  );
}
