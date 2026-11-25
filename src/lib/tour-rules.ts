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
  const hours = tour.cancellationHours ?? defaults.cancellationHours;
  const refund = tour.lateRefundPercent ?? defaults.lateRefundPercent;
  if (hours === 0)
    return "Puoi cancellare o modificare gratuitamente la prenotazione prima dell’inizio del tour.";
  return `Cancellazione gratuita fino a ${hours} ore prima della partenza, con rimborso integrale degli importi pagati. Dopo il termine o in caso di mancata presentazione, ${refund ? `il rimborso è del ${refund}% dell’importo pagato` : "non è previsto alcun rimborso"}.`;
}

export function bookingDeadlineNote(tour: Tour) {
  const cutoff = tour.bookingCutoffHours;
  if (cutoff === undefined) return "";
  if (tour.advanceBookingHours && tour.advanceBookingHours > cutoff)
    return `Prenota con almeno ${tour.advanceBookingHours} ore di anticipo. Se ci sono ancora posti, puoi prenotare fino a ${cutoff} ore prima della partenza.`;
  if (cutoff === 0)
    return "Puoi prenotare prima dell’inizio del tour, salvo disponibilità.";
  return `Prenotazioni online fino a ${cutoff} ore prima della partenza, salvo disponibilità.`;
}

export function freeTourNote(tour: Tour) {
  const limit = tour.freeGroupLimit ?? FREE_GROUP_LIMIT;
  if (tour.freeGroupMode === "none")
    return "Tour a offerta libera: scegli il contributo da riconoscere alla guida al termine della visita.";
  if (tour.freeGroupMode === "contact")
    return `Per gruppi superiori a ${limit} persone contattaci per concordare un pagamento minimo o organizzare un tour privato.`;
  return `Tour a offerta libera. Per gruppi superiori a ${limit} persone: ${((tour.freeGroupPriceCents ?? FREE_GROUP_PRICE_CENTS) / 100).toFixed(2)} ${tour.currency ?? "EUR"} a persona.`;
}
