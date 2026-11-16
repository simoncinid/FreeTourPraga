import routes from "@/content/wordpress-routes.json";

const historicPaths = new Set<string>([...routes.paths, ...routes.gone]);

/** Preserve the slash convention of published WordPress URLs. */
export function canonicalPath(path: string) {
  const url = new URL(path, "https://it.freetourpraga.com");
  const candidate = url.pathname === "/" ? "/" : `${url.pathname.replace(/\/+$/, "")}/`;
  const pathname = historicPaths.has(candidate)
    ? candidate
    : url.pathname.replace(/\/+$/, "") || "/";
  return `${pathname}${url.search}${url.hash}`;
}

export function guideSlug(guide: { title: string; slug?: string }) {
  return guide.slug || guide.title.toLocaleLowerCase("it").normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function guidePath(guide: { title: string; slug?: string; canonicalPath?: string }) {
  return guide.canonicalPath || `/blog/${guideSlug(guide)}`;
}

export function tourPath(tour: { slug: string; canonicalPath?: string }) {
  return tour.canonicalPath || `/tour/${tour.slug}`;
}
