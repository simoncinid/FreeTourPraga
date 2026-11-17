import type { MetadataRoute } from "next";
import { catalog, publicSiteContent, publicLegacyPages } from "@/lib/platform/public";
import { absoluteUrl } from "@/lib/site";
import { guidePath, tourPath } from "@/lib/public-paths";
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (process.env.SITE_PREVIEW === "true") return [];
  const [tours, content, pages] = await Promise.all([catalog(), publicSiteContent(), publicLegacyPages()]);
  const entries: MetadataRoute.Sitemap = [
    ...pages.map((page) => ({
      url: absoluteUrl(page.canonicalPath!), ...(page.updatedAt ? { lastModified: page.updatedAt } : {}),
    })),
    ...["/", "/tour/", "/partner-europa", "/informazioni-utili", "/agenzie-b2b", "/social", "/lavora-con-noi", "/diventa-un-partner", "/contatti/", "/chi-siamo", "/blog", "/faq", "/privacy", "/termini"].map((path) => ({ url: absoluteUrl(path) })),
    ...tours.map((tour) => ({ url: absoluteUrl(tourPath(tour)), ...(tour.sourceUpdatedAt ? { lastModified: tour.sourceUpdatedAt } : {}) })),
    ...content.gallery.map((guide) => ({
      url: absoluteUrl(guidePath(guide)), ...(guide.updatedAt ? { lastModified: guide.updatedAt } : {}),
    })),
  ];
  return [...new Map(entries.map((entry) => [entry.url, entry])).values()];
}
