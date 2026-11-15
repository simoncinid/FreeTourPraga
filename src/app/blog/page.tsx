import { publicPage } from "@/lib/platform/public";
import { ContentBlock } from "@/components/ContentBlock";
import Image from "next/image";
import Link from "next/link";
import { publicSiteContent } from "@/lib/platform/public";
import { guideAnchor } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Page() {
  const page = await publicPage("blog");
  if (page) return <ContentBlock page={page} />;
  const c = await publicSiteContent();
  return (
    <section className="section">
      <div className="container-page">
        <p className="uppercase-tag mb-4 text-primary">
          {c.home.galleryEyebrow}
        </p>
        <h1 className="display-xl mb-4">{c.home.galleryTitle}</h1>
        <p className="body-md mb-10 max-w-3xl">{c.home.galleryBody}</p>
        <div className="grid gap-8">
          {c.gallery.map((guide) => (
            <article
              key={guide.title}
              id={guideAnchor(guide.title)}
              className="card grid overflow-hidden md:grid-cols-[280px_1fr]"
            >
              <div className="relative min-h-48">
                <Image
                  src={guide.imageUrl}
                  alt={guide.title}
                  fill
                  sizes="(min-width: 768px) 280px, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h2 className="display-md">{guide.title}</h2>
                <p className="body-md mt-4">{guide.caption}</p>
                <Link href="/tour" className="mt-6 inline-block font-semibold text-ink underline">
                  Vedi i tour
                </Link>
              </div>
            </article>
          ))}
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
  return { ...baseMetadata, ...(page?.seoTitle ? { title: page.seoTitle } : {}), ...(page?.seoDescription ? { description: page.seoDescription } : {}) };
}
