import { site } from "@/lib/site";
export const dynamic = "force-dynamic";
export function GET() {
  const sitemap = process.env.SITE_PREVIEW === "true" ? "" : `<sitemap><loc>${site.url}/sitemap.xml</loc></sitemap>`;
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemap}</sitemapindex>`, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=300" },
  });
}
