import { randomUUID } from "node:crypto";
import { site } from "../site";
import { siteContent } from "./content";
import {
  customerTemplateForKind,
  normalizeSettings,
  renderEmailTemplate,
} from "./email-templates";
import type { PlatformState, Reservation } from "./model";

function enqueueExpiredEmail(state: PlatformState, booking: Reservation) {
  const settings = normalizeSettings(state.settings);
  state.settings = settings;
  const tour = state.tours.find((item) => item.slug === booking.tourSlug);
  const slot = tour?.slots.find((item) => item.id === booking.slotId);
  const contact = siteContent(state.siteContent).globals;
  const starts = slot ? new Date(slot.startsAt) : new Date(booking.createdAt);
  const fecha = new Intl.DateTimeFormat("it-IT", {
    timeZone: "Europe/Prague",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(starts);
  const hora = new Intl.DateTimeFormat("it-IT", {
    timeZone: "Europe/Prague",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(starts);
  const persone = booking.categorySnapshot
    ? booking.categorySnapshot
        .filter((c) => c.quantity)
        .map((c) => `${c.quantity} ${c.label}`)
        .join("; ")
    : `${booking.adults} adulti + ${booking.children} minori (+ ${booking.infants} infants)`;
  const vars: Record<string, string> = {
    kind: "Scaduta",
    nome: booking.name,
    pnr: booking.pnr,
    tour: tour?.title || booking.tourSlug,
    data: `${fecha} ${hora}`,
    fecha,
    hora,
    persone,
    totale: `${(booking.totalCents / 100).toFixed(2)} ${booking.currency ?? "EUR"}`,
    incontro: tour?.meetingPoint || "",
    indirizzo: tour?.meetingAddress || "",
    mappa: tour?.mapUrl || "",
    assistenza: `${contact.email} · ${contact.phone || ""}`.trim(),
    telefonoContatto: contact.phone || "",
    firma: settings.emailFooter,
    brand: contact.brandName || "freetourpraga.com",
    siteUrl: site.url,
    email: booking.email,
    telefono: booking.phone,
    manageUrl: `${site.url}/gestisci-prenotazione/${booking.pnr}`,
    calendarUrl: "",
    pagamento:
      "La prenotazione è scaduta perché non abbiamo ricevuto il tuo messaggio WhatsApp entro i tempi indicati.",
    nota: "",
    cancellazione: "",
    rimborso: "0.00 EUR",
    customerSubject: "Prenotazione scaduta",
    uwtTour: tour?.title || booking.tourSlug,
    cantidad: String(booking.adults),
    ninos: String(booking.children),
    totalPagar: `${(booking.totalCents / 100).toFixed(2)} ${booking.currency ?? "EUR"}`,
    affiliate: booking.affiliateCode || "—",
    afiliado: booking.affiliateCode || "",
    adulti: String(booking.adults),
    minori: String(booking.children),
    note: booking.notes || "",
  };
  const escape = (value: string) =>
    value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  const htmlVars = Object.fromEntries(
    Object.entries(vars).map(([key, value]) => [key, escape(value)]),
  );
  const template = customerTemplateForKind(settings.emailTemplates, "Scaduta");
  const key = `email:${booking.pnr}:Scaduta:${randomUUID()}`;
  if (state.jobs.some((job) => job.key === key)) return;
  state.jobs.push({
    id: randomUUID(),
    key,
    type: "email",
    bookingPnr: booking.pnr,
    to: booking.email,
    subject: renderEmailTemplate(template.subject, vars),
    text: renderEmailTemplate(template.text, vars),
    html: renderEmailTemplate(template.html, htmlVars),
    status: "queued",
    attempts: 0,
    runAt: new Date().toISOString(),
  });
}

/** Scade solo lo stato iniziale WhatsApp (`pending`), non `awaiting_payment`. */
export function releaseExpired(state: PlatformState, now = Date.now()) {
  const expired = new Set(
    state.orders
      .filter((order) => Date.parse(order.expiresAt) <= now)
      .map((order) => order.id),
  );
  if (!expired.size) return;
  const cancelled = new Set<string>();
  for (const booking of state.bookings) {
    if (
      booking.status !== "pending" ||
      booking.paymentMethod !== "whatsapp" ||
      booking.paymentStatus === "paid" ||
      !expired.has(booking.orderId)
    )
      continue;
    const slot = state.tours
      .find((tour) => tour.slug === booking.tourSlug)
      ?.slots.find(({ id }) => id === booking.slotId);
    if (slot) slot.reserved = Math.max(0, slot.reserved - booking.totalGuests);
    booking.status = "cancelled";
    booking.paymentStatus = "failed";
    booking.cancellationReason =
      "Prenotazione scaduta: messaggio WhatsApp non ricevuto entro i tempi";
    cancelled.add(booking.pnr);
    enqueueExpiredEmail(state, booking);
  }
  for (const job of state.jobs) {
    if (
      job.bookingPnr &&
      cancelled.has(job.bookingPnr) &&
      job.status === "queued" &&
      !job.key.includes(":Scaduta:")
    )
      job.status = "failed";
  }
}
