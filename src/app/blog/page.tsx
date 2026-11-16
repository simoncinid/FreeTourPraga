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
      <div className="container-page">
        <p className={`${ui.eyebrow} uppercase-tag mb-4 text-primary`}>
          {c.home.galleryEyebrow}
        </p>
        <h1 className="display-xl mb-4">{c.home.galleryTitle}</h1>
        <p className="body-md mb-10 whitespace-nowrap max-[899px]:whitespace-normal">
          {c.home.galleryBody}
        </p>
        <BlogGuideList items={c.gallery} />
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
