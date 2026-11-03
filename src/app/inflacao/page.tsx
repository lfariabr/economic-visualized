import { PageHeader } from "@/components/ui";
import { ConceptList } from "@/components/ConceptList";
import { CHAPTER_COLOR } from "@/components/shell/nav";
import { inflacao } from "@/content/inflacao";

const TITLE = "IPCA & inércia";
export const metadata = {
  title: TITLE,
  openGraph: { title: `${TITLE} · Economia, visualizada` },
  twitter: { title: `${TITLE} · Economia, visualizada` },
};

export default function Page() {
  return (
    <>
      <PageHeader n="Capítulo 02" title={TITLE} color={CHAPTER_COLOR.inflacao}>
        Em construção.
      </PageHeader>
      <ConceptList chapter={inflacao} />
    </>
  );
}
