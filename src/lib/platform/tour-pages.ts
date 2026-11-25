import records from "@/content/tour-pages.json";
import { audit } from "./store";
import { generateScheduledSlots } from "./scheduling";
import { pragueLocal } from "./time";
import type { PlatformState } from "./model";

export const tourPagesRevision = "tour-pages-2026-11-25";

export function applyTourPages(state: PlatformState, now = Date.now()) {
  if (state.events.includes(tourPagesRevision))
    return { applied: false, updated: [] };
  const missing = records.filter(
    ({ slug }) => !state.tours.some((tour) => tour.slug === slug),
  );
  if (missing.length)
    throw new Error(
      `Importa prima il catalogo: mancano ${missing.map(({ slug }) => slug).join(", ")}`,
    );

  const today = pragueLocal(new Date(now).toISOString()).slice(0, 10);
  const nextYear = new Date(`${today}T12:00:00Z`);
  nextYear.setUTCDate(nextYear.getUTCDate() + 365);
  const horizon = nextYear.toISOString().slice(0, 10);
  const bookedSlots = new Set(state.bookings.map(({ slotId }) => slotId));

  for (const {
    slug,
    previousPaths,
    times,
    weekdays,
    additionalPhotos,
    ...copy
  } of records) {
    const tour = state.tours.find((item) => item.slug === slug)!;
    if (
      state.tours.some(
        (item) =>
          item.id !== tour.id && item.canonicalPath === copy.canonicalPath,
      )
    )
      throw new Error(`URL già assegnato: ${copy.canonicalPath}`);
    if (
      tour.canonicalPath &&
      ![...previousPaths, copy.canonicalPath].includes(tour.canonicalPath)
    )
      throw new Error(`URL del tour modificato nel gestionale: ${slug}`);
    const oldHighlights = tour.highlights;
    const oldGalleries = tour.highlightGalleries;
    const priceCategories = copy.priceCategories;
    const mostRecentEnd = tour.schedule?.to;
    const activeDays = weekdays ?? tour.schedule?.weekdays ?? [1, 3, 5, 0];
    if (!activeDays.length)
      throw new Error(`Giorni di partenza mancanti: ${slug}`);

    Object.assign(tour, copy, {
      currency: "CZK",
      basePriceCents: priceCategories[0].priceCents,
      childPriceCents:
        priceCategories.find(({ id }) => id === "children")?.priceCents ?? 0,
      infantPriceCents: 0,
      adultMinAge: priceCategories[0].minAge ?? tour.adultMinAge,
      childMinAge:
        priceCategories.find(({ id }) => id === "children")?.minAge ??
        tour.childMinAge,
      isFreeTour: slug === "free-tour-praga",
      priceLabel: slug === "free-tour-praga" ? "Offerta libera" : "",
      lateRefundPercent: 0,
      onlineDiscounts: false,
      operationalReviewRequired: false,
    });

    const castle = slug === "interni-castello-praga";
    tour.meetingPoint = castle
      ? "Ingresso della Cattedrale di San Vito (Katedrála svatého Víta)"
      : "Teatro degli Stati (Stavovské divadlo)";
    tour.meetingAddress = castle
      ? "Terzo cortile del Castello di Praga, 119 00 Praha 1-Hradčany"
      : "Rytířská 22, 110 00 Staré Město, Praga";
    [tour.latitude, tour.longitude] = castle
      ? [50.0909, 14.4005]
      : [50.0858, 14.4239];
    const query = encodeURIComponent(
      `${tour.meetingPoint}, ${tour.meetingAddress}`,
    );
    tour.mapUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
    tour.mapEmbedUrl = `https://www.google.com/maps?q=${query}&output=embed`;

    if (
      additionalPhotos?.length ||
      oldGalleries?.some((photos) => photos.length)
    ) {
      const previousGalleries = oldGalleries ?? [];
      tour.highlightGalleries = tour.highlights.map(
        (text) => previousGalleries[oldHighlights.indexOf(text)] ?? [],
      );
      const unmatchedPhotos = previousGalleries.flatMap((photos, index) =>
        tour.highlights.includes(oldHighlights[index])
          ? []
          : photos.map((url) => ({
              url,
              alt: oldHighlights[index] ?? tour.title,
            })),
      );
      const gallery = new Map(
        (tour.galleryImages ?? []).map((photo) => [photo.url, photo]),
      );
      for (const photo of [...unmatchedPhotos, ...(additionalPhotos ?? [])])
        if (
          !gallery.has(photo.url) &&
          photo.url !== tour.imageUrl &&
          gallery.size < 20
        )
          gallery.set(photo.url, photo);
      tour.galleryImages = [...gallery.values()];
    }

    if (slug === "comunismo") {
      tour.maxGuests = 10;
      for (const rule of tour.calendarRules ?? [])
        if (rule.to >= today && rule.capacity !== undefined)
          rule.capacity = Math.min(rule.capacity, 10);
    }
    tour.schedule = {
      enabled: true,
      from: today,
      to: mostRecentEnd && mostRecentEnd > horizon ? mostRecentEnd : horizon,
      weekdays: activeDays,
      times,
      capacity:
        slug === "comunismo" ? 10 : (tour.schedule?.capacity ?? tour.maxGuests),
    };
    for (const slot of tour.slots) {
      if (
        Date.parse(slot.startsAt) <= now ||
        bookedSlots.has(slot.id) ||
        slot.id.startsWith("extra:") ||
        slot.reserved
      )
        continue;
      const local = pragueLocal(slot.startsAt);
      if (
        !times.includes(local.slice(11, 16)) ||
        !activeDays.includes(
          new Date(`${local.slice(0, 10)}T12:00:00Z`).getUTCDay(),
        )
      )
        slot.closed = true;
    }
    generateScheduledSlots(tour, now, bookedSlots);
    if (slug === "comunismo")
      for (const slot of tour.slots)
        if (Date.parse(slot.startsAt) > now)
          slot.capacity = Math.max(slot.reserved, Math.min(slot.capacity, 10));
  }
  state.events.push(tourPagesRevision);
  audit(state, "deployment", "catalog.tour-pages", tourPagesRevision);
  return { applied: true, updated: records.map(({ slug }) => slug) };
}
