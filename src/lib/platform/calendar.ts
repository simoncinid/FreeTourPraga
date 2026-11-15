import { createEvent } from "ics";
import type { PlatformState, Reservation } from "./model";
import { siteContent } from "./content";

export function reservationIcs(state: PlatformState, booking: Reservation) {
  const tour = state.tours.find((t) => t.slug === booking.tourSlug);
  const slot = tour?.slots.find((s) => s.id === booking.slotId);
  if (!tour || !slot) throw Error("Partenza non disponibile");
  const date = (value: string): [number, number, number, number, number] => {
    const d = new Date(value);
    return [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes()];
  };
  const contact = siteContent(state.siteContent).globals;
  const result = createEvent({
    uid: `${booking.pnr}@freetourpraga.com`,
    sequence: booking.calendarSequence || 0,
    start: date(slot.startsAt), end: date(slot.endsAt),
    startInputType: "utc", endInputType: "utc",
    title: tour.title,
    description: `Prenotazione ${booking.pnr}. ${booking.totalGuests} partecipanti. Orario locale: Europe/Prague.`,
    location: tour.meetingAddress,
    url: tour.mapUrl,
    organizer: { name: contact.brandName, email: contact.email },
    status: booking.status === "cancelled" ? "CANCELLED" : booking.status === "pending" ? "TENTATIVE" : "CONFIRMED",
  });
  if (result.error || !result.value) throw result.error || Error("Calendario non disponibile");
  return result.value;
}
