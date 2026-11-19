import { publicPage } from "@/lib/platform/public";
import { BlogHashRedirect } from "@/components/BlogHashRedirect";
import { BlogGuideList } from "@/components/BlogGuideList";
import ui from "@/components/public-ui.module.css";
import { publicSiteContent } from "@/lib/platform/public";

export const dynamic = "force-dynamic";

export default async function Page() {
  const c = await publicSiteContent();
  return (
    <section className={`${ui.page} ${ui.blog} section`}>
      <BlogHashRedirect />
      <div className={`container-page ${ui.blogInner}`}>
        <p className={`${ui.eyebrow} uppercase-tag text-primary`}>
          {c.home.galleryEyebrow}
        </p>
        <h1 className={`display-xl ${ui.blogTitle}`}>{c.home.galleryTitle}</h1>
        <p className={`body-md ${ui.blogLead} whitespace-nowrap max-[899px]:whitespace-normal`}>
          {c.home.galleryBody}
        </p>
        <div className={ui.blogList}>
          <BlogGuideList items={c.gallery} />
        </div>
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
