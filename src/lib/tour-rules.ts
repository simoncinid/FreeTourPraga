import type { Tour } from "./types";

export const FREE_GROUP_LIMIT = 6;
export const FREE_GROUP_PRICE_CENTS = 1200;

export function isFreeTour(tour: Pick<Tour, "basePriceCents" | "isFreeTour">) {
  return tour.isFreeTour ?? tour.basePriceCents === 0;
}
export function tourPrices(tour: Tour, guests: number) {
  const group =
    isFreeTour(tour) &&
    (tour.freeGroupMode ?? "fixed") === "fixed" &&
    guests > (tour.freeGroupLimit ?? FREE_GROUP_LIMIT);
  return {
    adult: group
      ? (tour.freeGroupPriceCents ?? FREE_GROUP_PRICE_CENTS)
      : isFreeTour(tour)
        ? 0
        : tour.basePriceCents,
    child: group
      ? (tour.freeGroupPriceCents ?? FREE_GROUP_PRICE_CENTS)
      : isFreeTour(tour)
        ? 0
        : tour.childPriceCents,
    infant: group
      ? (tour.freeGroupPriceCents ?? FREE_GROUP_PRICE_CENTS)
      : isFreeTour(tour)
        ? 0
        : tour.infantPriceCents,
    fixedGroup: group,
  };
}
export function cancellationNote(
  tour: Pick<Tour, "cancellationHours" | "lateRefundPercent">,
  defaults = { cancellationHours: 24, lateRefundPercent: 0 },
) {
  return `Cancellazione gratuita fino a ${tour.cancellationHours ?? defaults.cancellationHours} ore prima della partenza. Dopo il termine: rimborso del ${tour.lateRefundPercent ?? defaults.lateRefundPercent}% dell’importo pagato.`;
}

export function freeTourNote(tour: Tour) {
  const limit = tour.freeGroupLimit ?? FREE_GROUP_LIMIT;
  if (tour.freeGroupMode === "none")
    return "Tour a offerta libera: scegli il contributo da riconoscere alla guida al termine della visita.";
  if (tour.freeGroupMode === "contact")
    return `Per gruppi superiori a ${limit} persone contattaci per concordare un pagamento minimo o organizzare un tour privato.`;
  return `Tour a offerta libera. Per gruppi superiori a ${limit} persone: ${((tour.freeGroupPriceCents ?? FREE_GROUP_PRICE_CENTS) / 100).toFixed(2)} ${tour.currency ?? "EUR"} a persona.`;
}
