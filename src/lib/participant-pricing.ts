import { formatMoney } from "./format";
import type { ParticipantSelection, Tour } from "./types";
import { freeTourNote, isFreeTour, tourPrices } from "./tour-rules";
export function categoriesFor(tour: Tour) {
  return tour.priceCategories?.length
    ? tour.priceCategories
    : [
        {
          id: "adults",
          label: `Adulti (da ${tour.adultMinAge ?? 12} anni)`,
          priceCents: tour.basePriceCents,
        },
        {
          id: "children",
          label: `Bambini (${tour.childMinAge ?? 4}–${(tour.adultMinAge ?? 12) - 1} anni)`,
          priceCents: tour.childPriceCents,
        },
        ...((tour.childMinAge ?? 4) > 0
          ? [
              {
                id: "infants",
                label: `Minori di ${tour.childMinAge ?? 4} anni`,
                priceCents: tour.infantPriceCents,
              },
            ]
          : []),
      ];
}
/** Use the adult category as the headline reference, never a free infant tariff.
 * For custom lists without an adults ID the first configured category is the reference.
 * Legacy scalar prices are a fallback only when no categories are configured.
 */
export function tourHeadlinePrice(tour: Tour) {
  const free = isFreeTour(tour);
  const category =
    tour.priceCategories?.find((c) => c.id === "adults") ??
    tour.priceCategories?.[0];
  const priceCents = free ? 0 : (category?.priceCents ?? tour.basePriceCents);
  const customLabel = free
    ? tour.priceLabel || "Offerta libera"
    : category
      ? ""
      : tour.priceLabel || "";
  return {
    priceCents,
    text: customLabel || formatMoney(priceCents, tour.currency),
    showFrom: !customLabel,
    isFree: free,
  };
}

export function selectedPrices(
  tour: Tour,
  participants: ParticipantSelection[],
) {
  const categories = categoriesFor(tour);
  if (
    new Set(participants.map((p) => p.categoryId)).size !== participants.length
  )
    throw Error("Categoria duplicata");
  const totalGuests = participants.reduce((n, p) => n + p.quantity, 0);
  if (
    !Number.isSafeInteger(totalGuests) ||
    totalGuests < 1 ||
    totalGuests > tour.maxGuests
  )
    throw Error("Numero partecipanti non valido");
  const units = tourPrices(tour, totalGuests);
  if (
    isFreeTour(tour) &&
    tour.freeGroupMode === "contact" &&
    totalGuests > (tour.freeGroupLimit ?? 6)
  )
    throw Error(freeTourNote(tour));
  const snapshot = participants.map((p) => {
    const category = categories.find((c) => c.id === p.categoryId);
    if (!category || !Number.isSafeInteger(p.quantity) || p.quantity < 0)
      throw Error("Categoria o quantità non valida");
    return {
      id: category.id,
      label: category.label,
      quantity: p.quantity,
      unitPriceCents: isFreeTour(tour) ? units.adult : category.priceCents,
    };
  });
  return {
    snapshot,
    totalGuests,
    subtotalCents: snapshot.reduce(
      (n, p) => n + p.quantity * p.unitPriceCents,
      0,
    ),
    fixedGroup: units.fixedGroup,
  };
}
