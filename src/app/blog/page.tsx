import { SiteInlineText, SiteRichText, siteInlineEdit } from "@/components/SiteRichText";
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
          {...siteInlineEdit("home.galleryEyebrow")}
          className={`${ui.eyebrow} uppercase-tag text-primary`}
        >
          <SiteInlineText content={c} path="home.galleryEyebrow">{c.home.galleryEyebrow}</SiteInlineText>
        </p>
        <h1
          {...siteInlineEdit("home.galleryTitle")}
          className={`display-xl ${ui.blogTitle}`}
        >
          <SiteInlineText content={c} path="home.galleryTitle">{c.home.galleryTitle}</SiteInlineText>
        </h1>
        <SiteRichText content={c} path="home.galleryBody" text={c.home.galleryBody} className={`body-md ${ui.blogLead}`} />
        <div className={ui.blogList}>
          <BlogGuideList
            items={c.gallery.filter((item) => item.channel !== "useful")}
            layout="list"
          />
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
