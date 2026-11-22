import { publicPage } from "@/lib/platform/public";
import { collaborationDefaults } from "@/lib/collaboration-content";
import { SectionBlocks } from "@/components/SectionBlocks";
import { CollaborationPage } from "@/components/CollaborationPage";

const baseMetadata = {
  title: "Agenzie B2B",
  description:
    "Organizza visite guidate in italiano a Praga per i tuoi clienti. Raccontaci le esigenze del gruppo e costruiamo insieme una proposta.",
  alternates: { canonical: "/agenzie-b2b" },
};

export const dynamic = "force-dynamic";
export default async function Page() {
  const page = await publicPage("agenzie-b2b");
  const data = page || collaborationDefaults["agenzie-b2b"];
  return (
    <>
      <CollaborationPage
        eyebrow={data.subtitle}
        title={data.title}
        titleLines={
          page ? [page.title] : ["Visite guidate.", "Per i tuoi clienti."]
        }
        body={data.body}
        formVariant="agency"
        benefits={data.benefits ?? []}
      />
      <div className="container-page mb-12">
        <SectionBlocks blocks={page?.contentBlocks} />
      </div>
    </>
  );
}

export async function generateMetadata() {
  const page = await publicPage("agenzie-b2b");
  return {
    ...baseMetadata,
    ...(page?.seoTitle ? { title: page.seoTitle } : {}),
    ...(page?.seoDescription ? { description: page.seoDescription } : {}),
  };
}
