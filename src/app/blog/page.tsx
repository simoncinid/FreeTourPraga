import { siteEdit } from "@/lib/visual-content";
import { SectionBlocks } from "@/components/SectionBlocks";
import { publicPage } from "@/lib/platform/public";
import { BlogHashRedirect } from "@/components/BlogHashRedirect";
import { BlogGuideList } from "@/components/BlogGuideList";
import ui from "@/components/public-ui.module.css";
import { publicSiteContent } from "@/lib/platform/public";

export const dynamic = "force-dynamic";

export default async function Page() {
  const c = await publicSiteContent();
  const editorial = await publicPage("blog");
  return (
    <section className={`${ui.page} ${ui.blog} section`}>
      <BlogHashRedirect />
      <div className={`container-page ${ui.blogInner}`}>
        <p
          {...siteEdit("home.galleryEyebrow")}
          className={`${ui.eyebrow} uppercase-tag text-primary`}
        >
          {c.home.galleryEyebrow}
        </p>
        <h1
          {...siteEdit("home.galleryTitle")}
          className={`display-xl ${ui.blogTitle}`}
        >
          {c.home.galleryTitle}
        </h1>
        <p
          {...siteEdit("home.galleryBody")}
          className={`body-md ${ui.blogLead} whitespace-nowrap max-[899px]:whitespace-normal`}
        >
          {c.home.galleryBody}
        </p>
        <div className={ui.blogList}>
          <BlogGuideList items={c.gallery} />
        </div>
        <SectionBlocks
          binding={{ scope: "page", key: "blog", path: ["contentBlocks"] }}
          blocks={editorial?.contentBlocks}
        />
      </div>
    </section>
  );
}

const baseMetadata = {
  title: "Guide e consigli di viaggio",
  description:
    "Consigli locali e informazioni pratiche prima di un tour in italiano a Praga.",
  alternates: { canonical: "/blog" },
};

export async function generateMetadata() {
  const page = await publicPage("blog");
  return {
    ...baseMetadata,
    ...(page?.seoTitle ? { title: page.seoTitle } : {}),
    ...(page?.seoDescription ? { description: page.seoDescription } : {}),
  };
}
