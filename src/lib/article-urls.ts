import type { SiteContent } from "./platform/content";
import { guideSlug, guidePath } from "./public-paths";

type Article = SiteContent["gallery"][number];

/** Stable identities retain old slugs through renames and reordering in the CMS. */
export function prepareArticles<T extends Article>(previous: Article[], incoming: T[], now = new Date().toISOString()): T[] {
  const result = incoming.map((article) => {
    const old = previous.find((item) => article.id && (item.id || `guide:${guideSlug(item)}`) === article.id)
      || previous.find((item) => guideSlug(item) === guideSlug(article));
    const slug = article.slug || (old ? guideSlug(old) : guideSlug(article));
    if (old?.canonicalPath && article.canonicalPath !== old.canonicalPath)
      throw Error("Conserva l'indirizzo storico dell'articolo pubblicato");
    const aliases = [...new Set([...(old?.slugAliases || []), ...(old && guideSlug(old) !== slug ? [guideSlug(old)] : [])])].filter((alias) => alias !== slug);
    const next = { ...article, id: old?.id || article.id || `guide:${slug}`, slug, slugAliases: aliases };
    const comparable = (item: Article) => JSON.stringify(Object.entries({ ...item, slugAliases: item.slugAliases || [] }).filter(([key]) => key !== "updatedAt").sort(([a], [b]) => a.localeCompare(b)));
    return { ...next, updatedAt: old && comparable(next) === comparable(old) ? old.updatedAt : now };
  });
  const paths = new Set<string>();
  const ids = new Set<string>();
  const canonicalPaths = new Set<string>();
  for (const article of result) {
    if (ids.has(article.id!)) throw Error("Identificativo articolo duplicato");
    ids.add(article.id!);
    if (canonicalPaths.has(guidePath(article))) throw Error("Indirizzo canonico articolo già in uso");
    canonicalPaths.add(guidePath(article));
    for (const slug of [article.slug!, ...(article.slugAliases || [])]) {
      if (paths.has(slug)) throw Error(`Indirizzo articolo già in uso: ${slug}`);
      paths.add(slug);
    }
  }
  return result;
}
