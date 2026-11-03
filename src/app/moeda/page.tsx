import { PageHeader } from "@/components/ui";
import { ConceptList } from "@/components/ConceptList";
import { CHAPTER_COLOR } from "@/components/shell/nav";
import { moeda } from "@/content/moeda";

const TITLE = "Moeda & inflação";
export const metadata = {
  title: TITLE,
  openGraph: { title: `${TITLE} · Economia, visualizada` },
  twitter: { title: `${TITLE} · Economia, visualizada` },
};

export default function Page() {
  return (
    <>
      <PageHeader n="Capítulo 01" title={TITLE} color={CHAPTER_COLOR.moeda}>
        Em construção.
      </PageHeader>
      <ConceptList chapter={moeda} />
    </>
  );
}
