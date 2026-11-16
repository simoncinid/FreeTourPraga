import { tourGalleryImages } from "../tour-gallery";
import { cache } from "react";
import { readState } from "./store";
import { siteContent } from "./content";
const publicState = cache(readState);
export const publicSiteContent = cache(async () => {
  const state = await publicState();
  const content = siteContent(state.siteContent, state.pages);
  return {
    ...content,
    globals: {
      ...content.globals,
      // Also suppress saved CMS links while the private-tour page is hidden.
      navigation: content.globals.navigation.filter(
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
    .map((t) => ({
      ...t,
      galleryImages: tourGalleryImages(t),
      slots: t.slots.filter(
        (s) =>
          new Date(s.startsAt).getTime() >
          Date.now() + t.bookingCutoffHours * 3600000,
      ),
    }));
});
export const publicPage = cache(async (key: string) => {
  const s = await publicState();
  return s.pages[key]?.published ? s.pages[key] : null;
});
export const publicLegacyPages = cache(async () => {
  const s = await publicState();
  return Object.entries(s.pages).filter(([key, page]) => key.startsWith("legacy:") && page.published && page.canonicalPath).map(([, page]) => page);
});
