import { notFound } from "next/navigation";
import { BlogArticle } from "@/components/BlogArticle";
import { ContentBlock } from "@/components/ContentBlock";
import TourDetailPage, {
  generateMetadata as tourMetadata,
} from "@/app/tour/[slug]/page";
import { catalog, publicPage, publicSiteContent } from "@/lib/platform/public";
import { guidePath, tourPath } from "@/lib/public-paths";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ legacy: string[] }> };
async function resolve(params: Props["params"]) {
  const path = `/${(await params).legacy.join("/")}/`;
  const [tours, content, page] = await Promise.all([
    catalog(),
    publicSiteContent(),
    publicPage(`legacy:${path}`),
  ]);
  return {
    path,
    tour: tours.find((tour) => tourPath(tour) === path),
    article: content.gallery.find((article) => guidePath(article) === path),
    page,
  };
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { path, tour, article, page } = await resolve(params);
  if (tour)
    return tourMetadata({ params: Promise.resolve({ slug: tour.slug }) });
  if (article)
    return {
      title: { absolute: article.seoTitle || article.title },
      description: article.seoDescription || article.caption,
      alternates: { canonical: path },
      openGraph: {
        type: "article",
        title: article.title,
        description: article.caption,
        url: path,
        locale: "it_IT",
        images: [
          { url: article.imageUrl, alt: article.imageAlt || article.title },
        ],
      },
    };
  if (page)
    return {
      title: { absolute: page.seoTitle || page.title },
      description: page.seoDescription,
      alternates: { canonical: path },
    };
  return {};
}
export default async function Page({ params }: Props) {
  const { tour, article, page } = await resolve(params);
  if (tour)
    return <TourDetailPage params={Promise.resolve({ slug: tour.slug })} />;
  if (article) return <BlogArticle guide={article} />;
  if (page)
    return (
      <ContentBlock pageKey={`legacy:${page.canonicalPath}`} page={page} />
    );
  notFound();
}
