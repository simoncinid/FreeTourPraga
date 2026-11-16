/** Replace the mismatched seed thumbnail, while preserving custom CMS imagery. */
export function guideImage(guide: { title: string; imageUrl: string }) {
  return guide.title === "Cambio, pagamenti e assistenza" &&
    guide.imageUrl.includes("photo-1600788886242-5c96aabe3757")
    ? "/images/prague-currency.webp"
    : guide.imageUrl;
}
