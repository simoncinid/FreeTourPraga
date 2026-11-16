import { BlogArticle } from "@/components/BlogArticle";
import { guideImage } from "@/lib/guide-media";
import { findGuide } from "@/lib/guides";
import { publicSiteContent } from "@/lib/platform/public";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { guidePath } from "@/lib/public-paths";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = await publicSiteContent();
  const guide = findGuide(c.gallery, slug);
  if (!guide) return {};
  return {
    title: guide.seoTitle ? { absolute: guide.seoTitle } : guide.title,
    description: guide.seoDescription || guide.caption,
    alternates: { canonical: guidePath(guide) },
    openGraph: {
      type: "article",
      title: guide.title,
      description: guide.caption,
      url: guidePath(guide),
      locale: "it_IT",
      images: [{ url: guideImage(guide), alt: guide.imageAlt || guide.title }],
    },
  };
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const c = await publicSiteContent();
  const guide = findGuide(c.gallery, slug);
  if (!guide) notFound();
  if (guidePath(guide) !== `/blog/${slug}`) permanentRedirect(guidePath(guide));
  return <BlogArticle guide={guide} />;
}
