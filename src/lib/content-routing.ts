import { contentSections, pageLabels } from "./content-sections";
import { tourPath, guidePath, guideSlug } from "./public-paths";
import type { Tour } from "./types";
import type { ContentPage } from "./platform/model";
import type { SiteContent } from "./platform/content";
export const pageEditorId = (key: string) =>
  `page-${Array.from(key)
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("")}`;
export function pageEditorKey(id: string) {
  if (!/^page-(?:[0-9a-f]{2})+$/.test(id)) return id;
  return (id.slice(5).match(/../g) ?? [])
    .map((c) => String.fromCharCode(parseInt(c, 16)))
    .join("");
}
export function contentEditorSection(
  detail: string | undefined,
  pages: Record<string, ContentPage>,
) {
  if (detail && Object.hasOwn(contentSections, detail))
    return detail as keyof typeof contentSections;
  const key = detail ? pageEditorKey(detail) : "";
  return key && (Object.hasOwn(pages, key) || Object.hasOwn(pageLabels, key))
    ? "pagine"
    : "homepage";
}
export function contentEditorTarget(
  href: string,
  tours: Pick<Tour, "slug" | "canonicalPath">[],
  pages: Record<string, ContentPage>,
  content: SiteContent,
) {
  const path = href.split(/[?#]/)[0].replace(/\/$/, "") || "/";
  if (path === "/") return "/admin/contenuti/homepage";
  if (path === "/tour") return "/admin/tour";
  const tour = tours.find(
    (t) =>
      tourPath(t).replace(/\/$/, "") === path || `/tour/${t.slug}` === path,
  );
  if (tour) return `/admin/tour/${tour.slug}`;
  const article = content.gallery.find(
    (a) => guidePath(a).replace(/\/$/, "") === path,
  );
  if (article) return `/admin/contenuti/blog#articolo-${guideSlug(article)}`;
  const key = path.slice(1);
  if (["blog", "faq"].includes(key)) return `/admin/contenuti/${key}`;
  if (Object.hasOwn(pages, key)) return `/admin/contenuti/${key}`;
  const legacy = Object.keys(pages).find(
    (k) => pages[k].canonicalPath?.replace(/\/$/, "") === path,
  );
  return legacy
    ? `/admin/contenuti/${pageEditorId(legacy)}`
    : "/admin/contenuti/navigazione";
}
