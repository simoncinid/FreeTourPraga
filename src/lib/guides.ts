import { guideSlug } from "@/lib/public-paths";
import type { SiteContent } from "@/lib/platform/content";

export type GuideItem = SiteContent["gallery"][number];

export function findGuide(
  gallery: GuideItem[],
  slug: string,
): GuideItem | undefined {
  return gallery.find((guide) => guideSlug(guide) === slug || guide.slugAliases?.includes(slug));
}

/** Only an explicit admin choice can add a call to action to an article. */
export function guideCta(
  guide: GuideItem,
): { href: string; label: string } | null {
  if (!guide.ctaEnabled || !guide.ctaLabel?.trim() || !guide.ctaHref?.trim())
    return null;
  const href = guide.ctaHref.trim();
  const local = /^\/(?!\/)[a-zA-Z0-9/_?=&#.%+-]*$/.test(href);
  let external = false;
  try {
    external = new URL(href).protocol === "https:";
  } catch {
    /* Local path. */
  }
  if (!local && !external) return null;
  return { href, label: guide.ctaLabel.trim() };
}
