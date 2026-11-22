import { publicPage } from "@/lib/platform/public";
import { collaborationDefaults } from "@/lib/collaboration-content";
import { SectionBlocks } from "@/components/SectionBlocks";
import { CollaborationPage } from "@/components/CollaborationPage";

const baseMetadata = {
  title: "Diventa un partner",
  description:
    "Hai un hotel, un’attività turistica o una community di viaggiatori? Proponi una collaborazione con FreeTourPraga.",
  alternates: { canonical: "/diventa-un-partner" },
};

export const dynamic = "force-dynamic";
export default async function Page() {
  const page = await publicPage("diventa-un-partner");
  const data = page || collaborationDefaults["diventa-un-partner"];
  return (
    <>
      <CollaborationPage
        eyebrow={data.subtitle}
        title={data.title}
        titleLines={page ? [page.title] : ["Collaboriamo.", "Insieme a Praga."]}
        body={data.body}
        formVariant="affiliate"
        benefits={data.benefits ?? []}
      />
      <div className="container-page mb-12">
        <SectionBlocks blocks={page?.contentBlocks} />
      </div>
    </>
  );
}

export async function generateMetadata() {
  const page = await publicPage("diventa-un-partner");
  return {
    ...baseMetadata,
    ...(page?.seoTitle ? { title: page.seoTitle } : {}),
    ...(page?.seoDescription ? { description: page.seoDescription } : {}),
  };
}
