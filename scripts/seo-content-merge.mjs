/** Merge into the existing app models. Never replace bookings, orders, calendars or global layout content. */
export function mergeSeoContent(current, payload) {
  const next = structuredClone(current);
  const summary = { toursAdded: 0, toursLinked: 0, articlesAdded: 0, pagesAdded: 0 };
  for (const source of payload.tours) {
    const existing = next.tours.find((tour) => tour.id === source.id || tour.slug === source.slug || tour.sourceUrl === source.sourceUrl);
    if (existing) {
      // Preserve operational configuration, custom content, sold departures and prices.
      existing.canonicalPath ||= source.canonicalPath;
      existing.sourceUrl ||= source.sourceUrl;
      summary.toursLinked++;
    } else {
      next.tours.push(structuredClone(source));
      summary.toursAdded++;
    }
  }
  next.siteContent ||= { gallery: [] };
  next.siteContent.gallery ||= [];
  for (const article of payload.articles) {
    const existing = next.siteContent.gallery.find((item) => item.id === article.id || item.canonicalPath === article.canonicalPath || item.sourceUrl === article.sourceUrl);
    if (existing) {
      if (payload.unavailableSourceImages?.includes(existing.imageUrl)) existing.imageUrl = article.imageUrl;
      continue;
    }
    next.siteContent.gallery.push(structuredClone(article));
    summary.articlesAdded++;
  }
  next.pages ||= {};
  for (const [key, page] of Object.entries(payload.pages)) {
    if (next.pages[key]) continue;
    next.pages[key] = structuredClone(page);
    summary.pagesAdded++;
  }
  // SEO metadata does not alter the homepage hero, sections or CMS design fields.
  if (next.pages.homepage && !next.pages.homepage.published) {
    next.pages.homepage.seoTitle = payload.homepageSeo.title;
    next.pages.homepage.seoDescription = payload.homepageSeo.description;
  }
  next.pages['legacy-homepage-seo'] ||= {
    title: payload.homepageSeo.title, subtitle: '', body: '', published: true,
    seoTitle: payload.homepageSeo.title, seoDescription: payload.homepageSeo.description,
  };
  return { state: next, summary };
}
