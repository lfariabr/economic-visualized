import { PageHeader } from "@/components/ui";
import { ConceptList } from "@/components/ConceptList";
import { CHAPTER_COLOR } from "@/components/shell/nav";
import { divida } from "@/content/divida";

const TITLE = "Dívida pública";
export const metadata = {
  title: TITLE,
  openGraph: { title: `${TITLE} · Economia, visualizada` },
  twitter: { title: `${TITLE} · Economia, visualizada` },
};

export default function Page() {
  return (
    <>
      <PageHeader n="Capítulo 09" title={TITLE} color={CHAPTER_COLOR.divida}>
        Em construção.
      </PageHeader>
      <ConceptList chapter={divida} />
    </>
  );
}
