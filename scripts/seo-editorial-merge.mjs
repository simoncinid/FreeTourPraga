import { createHash } from 'node:crypto';
const digest = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

/** Apply a reviewed copy revision once. Re-running preserves subsequent CMS edits. */
export function mergeSeoEditorial(current, patch) {
  const revision = digest({ formatVersion: 2, patch });
  if (current.seoEditorialRevision === revision) return { state: structuredClone(current), applied: false, revision };
  const next = structuredClone(current);
  if (!next.siteContent?.home) throw Error('Contenuto strutturato della home assente');
  // Match the existing CMS normalization before retiring legacy page overrides.
  if (next.siteContent.contentVersion !== 2) {
    const mappings = { homepage: ['heroTitle','heroEyebrow','heroBody'], blog: ['galleryTitle','galleryEyebrow','galleryBody'], faq: ['faqTitle','faqEyebrow','faqBody'] };
    for (const [key, fields] of Object.entries(mappings)) {
      const page = next.pages?.[key];
      if (!page?.published) continue;
      for (const [index, field] of fields.entries()) {
        const value = [page.title, page.subtitle, page.body][index]?.trim();
        if (value) next.siteContent.home[field] = value;
      }
    }
  }
  next.siteContent.contentVersion = 2;
  Object.assign(next.siteContent.home, patch.home);
  next.siteContent.answers = structuredClone(patch.answers);
  if (patch.homeSeo && next.pages?.homepage) Object.assign(next.pages.homepage, patch.homeSeo);
  const castle = next.tours.find((tour) => tour.canonicalPath === patch.castle.canonicalPath || tour.slug === 'castello-praga-mala-strana');
  if (!castle) throw Error('Scheda Castello non trovata');
  Object.assign(castle, patch.castle);
  next.seoEditorialRevision = revision;
  return { state: next, applied: true, revision };
}
