import type { Tour } from "./types";

export const MAX_TOUR_CAPACITY = 25;
export const FREE_GROUP_LIMIT = 6;
export const FREE_GROUP_PRICE_CENTS = 1200;
export const FREE_TOUR_NOTE =
  "Per il free tour consigliamo un contributo di almeno 10 € a persona, da riconoscere alla guida. Per gruppi superiori a 6 persone la tariffa è fissa: 12 € a persona.";

export function isFreeTour(tour: Pick<Tour, "basePriceCents" | "isFreeTour">) {
  return tour.isFreeTour ?? tour.basePriceCents === 0;
}
export function tourPrices(tour: Tour, guests: number) {
  const group = isFreeTour(tour) && guests > FREE_GROUP_LIMIT;
  return {
    adult: group
      ? FREE_GROUP_PRICE_CENTS
      : isFreeTour(tour)
        ? 0
        : tour.basePriceCents,
    child: group
      ? FREE_GROUP_PRICE_CENTS
      : isFreeTour(tour)
        ? 0
        : tour.childPriceCents,
    infant: group
      ? FREE_GROUP_PRICE_CENTS
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
