import type { Tour, TourPhoto } from "./types";

// Existing catalog photos stay the cover. These are additional real views of
// the Old Town itinerary, also used by catalogs created before galleries existed.
export const oldTownGallery: TourPhoto[] = [
  {
    url: "https://images.unsplash.com/photo-1600623471616-8c1966c91ff6?auto=format&fit=crop&w=1800&q=85",
    alt: "Ponte Carlo e Castello di Praga al tramonto",
  },
  {
    url: "https://images.unsplash.com/photo-1580852710598-96912fc48065?auto=format&fit=crop&w=1800&q=85",
    alt: "Le torri del Ponte Carlo e i tetti di Praga",
  },
  {
    url: "https://images.unsplash.com/photo-1715388302950-6ad4ad794d07?auto=format&fit=crop&w=1800&q=85",
    alt: "L’Orologio Astronomico e la chiesa di Týn in Piazza della Città Vecchia",
  },
  {
    url: "https://images.unsplash.com/photo-1581200309617-836d0d7f9c04?auto=format&fit=crop&w=1800&q=85",
    alt: "I tetti e le torri della Città Vecchia al tramonto",
  },
  {
    url: "https://images.unsplash.com/photo-1581525046703-e553ee7b3de9?auto=format&fit=crop&w=1800&q=85",
    alt: "Piazza della Città Vecchia e le guglie della chiesa di Týn",
  },
];

type GalleryTour = Pick<Tour, "id" | "title" | "imageUrl" | "galleryImages">;

export function tourGalleryImages(tour: GalleryTour): TourPhoto[] {
  if (tour.galleryImages !== undefined) return tour.galleryImages;
  // Never add stock photos to a customized tour or restore deliberately removed photos.
  return tour.id === "old-town" &&
    tour.imageUrl.startsWith(
      "https://images.unsplash.com/photo-1519677100203-a0e668c92439?",
    )
    ? oldTownGallery.map((photo) => ({ ...photo }))
    : [];
}

export function tourPhotos(tour: GalleryTour): TourPhoto[] {
  const seen = new Set<string>();
  return [{ url: tour.imageUrl, alt: tour.title }, ...tourGalleryImages(tour)]
    .filter((photo) => {
      if (!photo.url || seen.has(photo.url)) return false;
      seen.add(photo.url);
      return true;
    })
    .map((photo) => ({ ...photo, alt: photo.alt.trim() || tour.title }));
}
