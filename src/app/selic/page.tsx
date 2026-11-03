import { PageHeader } from "@/components/ui";
import { ConceptList } from "@/components/ConceptList";
import { CHAPTER_COLOR } from "@/components/shell/nav";
import { selic } from "@/content/selic";

const TITLE = "Selic & Copom";
export const metadata = {
  title: TITLE,
  openGraph: { title: `${TITLE} · Economia, visualizada` },
  twitter: { title: `${TITLE} · Economia, visualizada` },
};

export default function Page() {
  return (
    <>
      <PageHeader n="Capítulo 04" title={TITLE} color={CHAPTER_COLOR.selic}>
        Em construção.
      </PageHeader>
      <ConceptList chapter={selic} />
    </>
  );
}
