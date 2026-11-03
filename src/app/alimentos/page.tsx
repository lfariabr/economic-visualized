import { PageHeader } from "@/components/ui";
import { ConceptList } from "@/components/ConceptList";
import { CHAPTER_COLOR } from "@/components/shell/nav";
import { alimentos } from "@/content/alimentos";

const TITLE = "Preço dos alimentos";
export const metadata = {
  title: TITLE,
  openGraph: { title: `${TITLE} · Economia, visualizada` },
  twitter: { title: `${TITLE} · Economia, visualizada` },
};

export default function Page() {
  return (
    <>
      <PageHeader n="Capítulo 03" title={TITLE} color={CHAPTER_COLOR.alimentos}>
        Em construção.
      </PageHeader>
      <ConceptList chapter={alimentos} />
    </>
  );
}
