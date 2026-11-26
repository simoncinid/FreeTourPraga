import { RichContent } from "@/components/RichContent";
import { InlineCopy } from "@/components/RichInline";
import { pageEdit } from "@/lib/visual-content";
import { SocialLinks } from "@/components/SocialLinks";
import { publicPage } from "@/lib/platform/public";
import { SectionBlocks } from "@/components/SectionBlocks";
export const dynamic = "force-dynamic";
const baseMetadata = {
  title: "Social",
  description: "Segui FreeTourPraga sui canali social ufficiali.",
  alternates: { canonical: "/social" },
};
export default async function Page() {
  const page = await publicPage("social");
  return (
    <section className="section">
      <div className="container-page max-w-3xl">
        <h1 {...pageEdit("social", "titleHtml", "inline")} className="display-xl mb-5">
          <InlineCopy html={page?.titleHtml}>{page?.title || "Praga, anche sui social"}</InlineCopy>
        </h1>
        <div {...pageEdit("social", "bodyHtml", "html")} className="body-md mb-8">
            {page?.bodyHtml ? <RichContent html={page.bodyHtml} /> : page?.body ||
            "Scopri scorci della città, racconti dai tour e idee per il tuo prossimo viaggio. Seguici sui canali ufficiali di FreeTourPraga."}
          </div>
        <SocialLinks />
        <SectionBlocks
          binding={{ scope: "page", key: "social", path: ["contentBlocks"] }}
          blocks={page?.contentBlocks}
        />
      </div>
    </section>
  );
}

export async function generateMetadata() {
  const page = await publicPage("social");
  return {
    ...baseMetadata,
    ...(page?.seoTitle ? { title: page.seoTitle } : {}),
    ...(page?.seoDescription ? { description: page.seoDescription } : {}),
  };
}
