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
/** Testo standard usato come default globale e fallback. */
export const DEFAULT_CANCELLATION_CLAUSE =
  "Cancellazione gratuita fino a 24 ore prima della partenza, con rimborso integrale degli importi pagati. Dopo il termine o in caso di mancata presentazione, non è previsto alcun rimborso.";

type CancellationSource = {
  cancellationClause?: string | null;
};

/** Tour (se valorizzato) → globale → testo standard. */
export function resolveCancellationClause(
  source?: CancellationSource | null,
  settings?: CancellationSource | null,
) {
  const tourText = source?.cancellationClause?.trim();
  if (tourText) return tourText;
  const globalText = settings?.cancellationClause?.trim();
  if (globalText) return globalText;
  return DEFAULT_CANCELLATION_CLAUSE;
}

export function cancellationNote(
  source?: CancellationSource | null,
  settings?: CancellationSource | null,
) {
  return resolveCancellationClause(source, settings);
}

export function bookingLeadMs(tour: {
  bookingCutoffHours?: number;
  bookingCutoffMinutes?: number;
}) {
  return (
    (tour.bookingCutoffHours ?? 0) * 3600000 +
    (tour.bookingCutoffMinutes ?? 0) * 60000
  );
}
export function bookingDeadlineNote(tour: Tour) {
  const cutoff = tour.bookingCutoffHours;
  const minutes = tour.bookingCutoffMinutes ?? 0;
  if (cutoff === undefined && !minutes) return "";
  const hours = cutoff ?? 0;
  const label = minutes ? `${hours} ore e ${minutes} minuti` : `${hours} ore`;
  if (tour.advanceBookingHours && tour.advanceBookingHours * 60 > hours * 60 + minutes)
    return `Prenota con almeno ${tour.advanceBookingHours} ore di anticipo. Se ci sono ancora posti, puoi prenotare fino a ${label} prima della partenza.`;
  if (hours === 0 && minutes === 0)
    return "Puoi prenotare prima dell’inizio del tour, salvo disponibilità.";
  return `Prenotazioni online fino a ${label} prima della partenza, salvo disponibilità.`;
}

export function freeTourNote(tour: Tour) {
  const limit = tour.freeGroupLimit ?? FREE_GROUP_LIMIT;
  if (tour.freeGroupMode === "none")
    return "Tour a offerta libera: scegli il contributo da riconoscere alla guida al termine della visita.";
  if (tour.freeGroupMode === "contact")
    return `Per gruppi superiori a ${limit} persone contattaci per concordare un pagamento minimo o organizzare un tour privato.`;
  return `Tour a offerta libera. Per gruppi superiori a ${limit} persone: ${((tour.freeGroupPriceCents ?? FREE_GROUP_PRICE_CENTS) / 100).toFixed(2)} ${tour.currency ?? "EUR"} a persona.`;
}
