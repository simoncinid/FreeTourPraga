import type { MetadataRoute } from "next";
import { catalog, publicSiteContent } from "@/lib/platform/public";
export const dynamic = "force-dynamic";
import { absoluteUrl } from "@/lib/site";
import { guideAnchor } from "@/lib/format";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [tours, content] = await Promise.all([catalog(), publicSiteContent()]);
  const now = new Date();
  const routes = [
    "",
    "/tour",
    "/partner-europa",
    "/contatti",
    "/chi-siamo",
    "/blog",
    "/faq",
    "/privacy",
    "/termini",
  ].map((path) => ({
    url: absoluteUrl(path || "/"),
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  const tourRoutes = tours.map((tour) => ({
    url: absoluteUrl(`/tour/${tour.slug}`),
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  const guideRoutes = content.gallery.map((guide) => ({
    url: absoluteUrl(`/blog/${guideAnchor(guide.title)}`),
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...routes, ...tourRoutes, ...guideRoutes];
}
