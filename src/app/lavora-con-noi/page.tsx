import { publicPage } from "@/lib/platform/public";
import { collaborationDefaults } from "@/lib/collaboration-content";
import { SectionBlocks } from "@/components/SectionBlocks";
import { CollaborationPage } from "@/components/CollaborationPage";

const baseMetadata = {
  title: "Lavora con noi",
  description:
    "Ti piace raccontare Praga e accompagnare i viaggiatori alla scoperta della città? Presentati al nostro team.",
  alternates: { canonical: "/lavora-con-noi" },
};

export const dynamic = "force-dynamic";
export default async function Page() {
  const page = await publicPage("lavora-con-noi");
  const data = page || collaborationDefaults["lavora-con-noi"];
  return (
    <>
      <CollaborationPage
        pageKey="lavora-con-noi"
        eyebrow={data.subtitle}
        title={data.title}
        titleLines={
          page ? [page.title] : ["Racconta Praga.", "Unisciti al team."]
        }
        body={data.body}
        formVariant="jobs"
        benefits={data.benefits ?? []}
      />
      <div className="container-page mb-12">
        <SectionBlocks
          binding={{
            scope: "page",
            key: "lavora-con-noi",
            path: ["contentBlocks"],
          }}
          blocks={page?.contentBlocks}
        />
      </div>
    </>
  );
}

export async function generateMetadata() {
  const page = await publicPage("lavora-con-noi");
  return {
    ...baseMetadata,
    ...(page?.seoTitle ? { title: page.seoTitle } : {}),
    ...(page?.seoDescription ? { description: page.seoDescription } : {}),
  };
}
