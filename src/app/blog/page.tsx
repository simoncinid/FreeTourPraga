import { publicPage } from "@/lib/platform/public";
import { BlogHashRedirect } from "@/components/BlogHashRedirect";
import ui from "@/components/public-ui.module.css";
import { guideImage } from "@/lib/guide-media";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { publicSiteContent } from "@/lib/platform/public";
import { guidePath } from "@/lib/public-paths";

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
        <div className="grid gap-8">
          {c.gallery.map((guide) => {
            const path = guidePath(guide);
            return (
              <Link
                key={guide.title}
                href={path}
                className="card grid overflow-hidden no-underline text-inherit md:grid-cols-[280px_1fr]"
              >
                <div className="relative min-h-48">
                  <Image
                    src={guideImage(guide)}
                    alt={guide.title}
                    fill
                    sizes="(min-width: 768px) 280px, 100vw"
                    className="object-cover"
                  />
                </div>
                <div>
                  <h2 className="display-md">{guide.title}</h2>
                  <p className="body-md mt-4">{guide.caption}</p>
                  <span className="mt-6 inline-flex items-center gap-3 text-sm font-semibold text-ink underline underline-offset-4">
                    Leggi la guida <ArrowUpRight size={15} />
                  </span>
                </div>
              </Link>
            );
          })}
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
