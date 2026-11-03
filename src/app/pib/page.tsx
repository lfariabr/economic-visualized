import { PageHeader } from "@/components/ui";
import { ConceptList } from "@/components/ConceptList";
import { CHAPTER_COLOR } from "@/components/shell/nav";
import { pib } from "@/content/pib";

const TITLE = "PIB & crescimento";
export const metadata = {
  title: TITLE,
  openGraph: { title: `${TITLE} · Economia, visualizada` },
  twitter: { title: `${TITLE} · Economia, visualizada` },
};

export default function Page() {
  return (
    <>
      <PageHeader n="Capítulo 10" title={TITLE} color={CHAPTER_COLOR.pib}>
        Em construção.
      </PageHeader>
      <ConceptList chapter={pib} />
    </>
  );
}
