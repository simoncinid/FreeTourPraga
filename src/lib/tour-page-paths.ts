import tourPages from "@/content/tour-pages.json";

const tourUrlAliases = new Map(
  tourPages.flatMap(({ slug, canonicalPath, previousPaths }) =>
    [...previousPaths, `/tour/${slug}`].map(
      (path) => [path.replace(/\/$/, ""), canonicalPath] as const,
    ),
  ),
);
const tourSlugs = new Map(
  tourPages.map(({ canonicalPath, slug }) => [canonicalPath, slug]),
);

export function updatedTourPath(path: string) {
  return tourUrlAliases.get(path.replace(/\/$/, ""));
}

export function tourSlugForPath(path: string) {
  return tourSlugs.get(path);
}
