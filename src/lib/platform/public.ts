import { tourGalleryImages } from "../tour-gallery";
import { cache } from "react";
import { readState } from "./store";
import { siteContent } from "./content";
import { generateScheduledSlots, publicTour } from "./scheduling";
// Informational pages and the shared header do not need booking calendars.
const publicState = cache(() => readState({ generateSlots: false }));
export const navigationTours = cache(async () => {
  const state = await publicState();
  return state.tours.filter((tour) => tour.published).map(({ title, slug, canonicalPath }) => ({ title, slug, canonicalPath }));
});
export const publicSiteContent = cache(async () => {
  const state = await publicState();
  const content = siteContent(state.siteContent, state.pages);
  return {
    ...content,
    globals: {
      ...content.globals,
      // Also suppress saved CMS links while the private-tour page is hidden.
      navigation: content.globals.navigation.map((link) => ({ ...link, href: link.href === "/#informazioni-utili" ? "/informazioni-utili" : link.href })).filter(
        (link) =>
          link.href.split(/[?#]/)[0].replace(/\/$/, "") !== "/tour-privati",
      ),
    },
  };
});
export const catalog = cache(async () => {
  const s = await publicState();
  return s.tours
    .filter((t) => t.published)
    .map((t) => {
      generateScheduledSlots(t);
      return {
        ...publicTour(s, t),
        galleryImages: tourGalleryImages(t),
      };
    });
});
export const publicPage = cache(async (key: string) => {
  const s = await publicState();
  return s.pages[key]?.published ? s.pages[key] : null;
});
export const publicLegacyPages = cache(async () => {
  const s = await publicState();
  return Object.entries(s.pages).filter(([key, page]) => key.startsWith("legacy:") && page.published && page.canonicalPath).map(([, page]) => page);
});
