import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  if (process.env.SITE_PREVIEW === "true") return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/api/media/"],
      disallow: ["/admin", "/self-service", "/gestisci-prenotazione", "/api/", "/account", "/accesso", "/checkout", "/carrello", "/prenotazione/"],
    },
    sitemap: `${site.url}/sitemap_index.xml`,
    host: site.url,
  };
}
