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
        <h1 {...pageEdit("social", "title")} className="display-xl mb-5">
          {page?.title || "Praga, anche sui social"}
        </h1>
        <p {...pageEdit("social", "body")} className="body-md mb-8">
          {page?.body ||
            "Scopri scorci della città, racconti dai tour e idee per il tuo prossimo viaggio. Seguici sui canali ufficiali di FreeTourPraga."}
        </p>
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
