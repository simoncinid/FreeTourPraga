import { BlogArticle } from "@/components/BlogArticle";
import { guideImage } from "@/lib/guide-media";
import { findGuide } from "@/lib/guides";
import { publicSiteContent } from "@/lib/platform/public";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = await publicSiteContent();
  const guide = findGuide(c.gallery, slug);
  if (!guide) return {};
  return {
    title: guide.title,
    description: guide.caption,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      type: "article",
      title: guide.title,
      description: guide.caption,
      images: [{ url: guideImage(guide), alt: guide.imageAlt || guide.title }],
    },
  };
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const c = await publicSiteContent();
  const guide = findGuide(c.gallery, slug);
  if (!guide) notFound();
  return <BlogArticle guide={guide} />;
}
