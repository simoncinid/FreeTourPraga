import { randomUUID } from "node:crypto";
import { z } from "zod";
import { checkoutSchema } from "./validation";
import { audit, readState, transaction } from "./store";
import {
  hash,
  HttpError,
  secretToken,
  bookingManagementProof,
  verifyBookingManagementProof,
} from "./security";
import type { Job, Order, PlatformState, Reservation } from "./model";
import { siteContent } from "./content";
import { site } from "../site";
import { reservationIcs } from "./calendar";
import {
  bookingAdminRecipients,
  resolveAffiliate,
} from "./affiliates-wp";
import { isClosed, isTourClosed } from "./scheduling";
import { cancellationNote, FREE_TOUR_NOTE, isFreeTour, tourPrices } from "../tour-rules";
import {
  customerTemplateForKind,
  normalizeSettings,
  renderEmailTemplate,
} from "./email-templates";
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export function enqueue(
  s: PlatformState,
  job: Omit<Job, "id" | "status" | "attempts">,
) {
  if (!s.jobs.some((j) => j.key === job.key))
    s.jobs.push({ ...job, id: randomUUID(), status: "queued", attempts: 0 });
}
export function getReservation(s: PlatformState, pnr: string, token: string) {
  const b = s.bookings.find((b) => b.pnr === pnr);
  if (
    !b ||
    !token ||
    b.tokenHash !== hash(token) ||
    new Date(b.expiresAt).getTime() < Date.now()
  )
    throw new HttpError(404, "Prenotazione non trovata o link scaduto");
  return b;
}
export function slotFor(
  s: PlatformState,
  b: Pick<Reservation, "tourSlug" | "slotId">,
) {
  const tour = s.tours.find((t) => t.slug === b.tourSlug);
  const slot = tour?.slots.find((x) => x.id === b.slotId);
  if (!tour || !slot) throw new HttpError(404, "Partenza non disponibile");
  return { tour, slot };
}
export function notification(s: PlatformState, b: Reservation, kind: string) {
  const settings = normalizeSettings(s.settings);
  s.settings = settings;
  const { tour, slot } = slotFor(s, b);
  const contact = siteContent(s.siteContent).globals;
  const order = s.orders.find((o) => o.id === b.orderId)!;
  const when = new Date(slot.startsAt).toLocaleString("it-IT", {
    timeZone: "Europe/Prague",
  });
  const manageUrl = `${site.url}/gestisci-prenotazione/${b.pnr}/${bookingManagementProof(b.id, b.pnr)}`;
  const calendarUrl = `${site.url}/api/calendar/booking/${b.pnr}?manage=${bookingManagementProof(b.id, b.pnr)}`;
  const paymentLine =
    order.totalCents === 0
      ? "Nessun pagamento richiesto."
      : b.paymentMethod === "ota"
        ? "Pagamento gestito dal provider esterno."
        : "Pagamento in contanti sul posto.";
  const affiliate = resolveAffiliate(s, b.affiliateCode, false);
  const vars: Record<string, string> = {
    kind,
    nome: b.name,
    pnr: b.pnr,
    tour: tour.title,
    data: when,
    persone: `${b.adults} adulti + ${b.children} minori (+ ${b.infants} infants)`,
    totale: (b.totalCents / 100).toFixed(2),
    incontro: tour.meetingPoint,
    indirizzo: tour.meetingAddress,
    mappa: tour.mapUrl,
    pagamento: paymentLine,
    nota: b.bookingNote ?? (isFreeTour(tour) ? FREE_TOUR_NOTE : ""),
    cancellazione: cancellationNote(b.policy ?? tour, settings),
    manageUrl,
    calendarUrl,
    assistenza: `${contact.email} · ${contact.phone || ""}`.trim(),
    telefonoContatto: contact.phone || "",
    firma: settings.emailFooter,
    brand: contact.brandName || "freetourpraga.com",
    siteUrl: site.url,
    affiliate: affiliate
      ? `${affiliate.name} (${affiliate.code}${affiliate.wpId != null ? ` / wp#${affiliate.wpId}` : ""})`
      : b.affiliateCode || "—",
    email: b.email,
    telefono: b.phone,
    note: b.notes || "—",
    adulti: String(b.adults),
    minori: String(b.children),
  };
  const htmlVars = Object.fromEntries(
    Object.entries(vars).map(([k, v]) => [
      k,
      ["manageUrl", "calendarUrl", "mappa", "siteUrl"].includes(k)
        ? escapeHtml(v)
        : escapeHtml(v),
    ]),
  );
  const template = customerTemplateForKind(settings.emailTemplates, kind);
  const text = renderEmailTemplate(template.text, vars);
  const html = renderEmailTemplate(template.html, htmlVars);
  b.calendarSequence = (b.calendarSequence ?? -1) + 1;
  enqueue(s, {
    key: `email:${b.pnr}:${kind}:${randomUUID()}`,
    type: "email",
    bookingPnr: b.pnr,
    to: b.email,
    subject: renderEmailTemplate(template.subject, vars),
    text,
    html,
    calendar: reservationIcs(s, b),
    runAt: new Date().toISOString(),
  });
  const adminKinds = new Set([
    "Confermata",
    "Cancellata",
    "Cancellata e rimborso richiesto",
  ]);
  const adminTo = bookingAdminRecipients();
  if (adminTo && adminKinds.has(kind)) {
    enqueue(s, {
      key: `email-admin:${b.pnr}:${kind}:${randomUUID()}`,
      type: "email",
      bookingPnr: b.pnr,
      to: adminTo,
      subject: renderEmailTemplate(settings.emailTemplates.admin.subject, vars),
      text: renderEmailTemplate(settings.emailTemplates.admin.text, vars),
      runAt: new Date().toISOString(),
    });
  }
  for (const j of s.jobs) {
    if (
      j.bookingPnr === b.pnr &&
      j.status === "queued" &&
      (j.type === "whatsapp" || j.key.startsWith("reminder-email:"))
    ) {
      j.status = "failed";
      j.error = "Reminder disattivati in Fase 1";
    }
  }
}
function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
export function releaseExpired(s: PlatformState) {
  for (const o of s.orders) {
    if (new Date(o.expiresAt).getTime() > Date.now()) continue;
    for (const b of s.bookings.filter(
      (b) =>
        b.orderId === o.id &&
        b.status === "pending" &&
        b.paymentStatus !== "paid",
    )) {
      const { slot } = slotFor(s, b);
      slot.reserved -= b.totalGuests;
      b.status = "cancelled";
      b.cancellationReason = "Pagamento non completato entro 30 minuti";
      for (const j of s.jobs)
        if (j.bookingPnr === b.pnr && j.status === "queued")
          j.status = "failed";
    }
  }
}
export function quote(
  s: PlatformState,
  input: Pick<CheckoutInput, "items" | "affiliateCode">,
) {
  const settings = normalizeSettings(s.settings);
  const discount =
    new Set(input.items.map((x) => x.tourSlug)).size >= settings.minimumTours
      ? settings.multiTourPercent
      : 0;
  if (
    input.affiliateCode &&
    !resolveAffiliate(s, input.affiliateCode)
  )
    throw new HttpError(400, "Codice affiliato non valido");
  return input.items.map((item) => {
    const { tour, slot } = slotFor(s, item);
    const startsAt = new Date(slot.startsAt).getTime();
    if (
      !tour.published ||
      slot.closed ||
      isTourClosed(tour, slot.startsAt) ||
      isClosed(s, slot.startsAt) ||
      tour.operationalReviewRequired ||
      startsAt < Date.now() + tour.bookingCutoffHours * 3600000
    )
      throw new HttpError(409, "Partenza chiusa alle prenotazioni");
    if (tour.childMinAge === 0 && item.infants > 0)
      throw new HttpError(
        400,
        "Per questo tour i più piccoli rientrano nella fascia bambini",
      );
    const guests = item.adults + item.children + item.infants;
    if (guests > Math.min(tour.maxGuests, 25)) throw new HttpError(400, `Massimo ${Math.min(tour.maxGuests, 25)} partecipanti per ${tour.title}`);
    if (guests > Math.min(slot.capacity, 25) - slot.reserved)
      throw new HttpError(409, `Posti insufficienti per ${tour.title}`);
    const units = tourPrices(tour, guests);
    let unitAdult = units.adult;
    let unitChild = units.child;
    let unitInfant = units.infant;
    const lastMinuteApplied =
      settings.lastMinuteEnabled &&
      settings.lastMinuteDiscountPercent > 0 &&
      !units.fixedGroup &&
      startsAt - Date.now() <= settings.lastMinuteHours * 3600000;
    if (lastMinuteApplied) {
      const factor = 1 - settings.lastMinuteDiscountPercent / 100;
      unitAdult = Math.round(unitAdult * factor);
      unitChild = Math.round(unitChild * factor);
      unitInfant = Math.round(unitInfant * factor);
    }
    const subtotalCents =
      item.adults * unitAdult +
      item.children * unitChild +
      item.infants * unitInfant;
    const multiTourDiscount = units.fixedGroup
      ? 0
      : Math.round((subtotalCents * discount) / 100);
    return {
      ...item,
      subtotalCents,
      discountCents: multiTourDiscount,
      totalCents: subtotalCents - multiTourDiscount,
      totalGuests: guests,
      unitAdultCents: unitAdult,
      unitChildCents: unitChild,
      unitInfantCents: unitInfant,
      lastMinuteApplied,
      cancellationHours: tour.cancellationHours ?? settings.cancellationHours,
      lateRefundPercent: tour.lateRefundPercent ?? settings.lateRefundPercent,
      bookingNote: isFreeTour(tour)
        ? FREE_TOUR_NOTE
        : lastMinuteApplied
          ? `Tariffa last-minute attiva (−${settings.lastMinuteDiscountPercent}% entro ${settings.lastMinuteHours} ore dalla partenza).`
          : "",
    };
  });
}
export async function createOrder(
  input: CheckoutInput,
  key: string,
  source = "site",
) {
  if (input.paymentMethod !== "cash")
    throw new HttpError(400, "In Fase 1 è disponibile solo il pagamento in contanti sul posto.");
  return transaction((s) => {
    releaseExpired(s);
    const fingerprint = hash(JSON.stringify(input));
    const previous = s.orders.find((o) => o.key === key);
    if (previous) {
      if (previous.fingerprint !== fingerprint)
        throw new HttpError(409, "Chiave richiesta già utilizzata");
      return { ...previous };
    }
    if (new Set(input.items.map((x) => x.slotId)).size !== input.items.length)
      throw new HttpError(
        400,
        "Unisci i partecipanti della stessa partenza in una sola voce",
      );
    const prices = quote(s, input);
    const token = secretToken();
    const now = new Date().toISOString();
    const order: Order = {
      id: randomUUID(),
      key,
      fingerprint,
      pnrs: [],
      token,
      totalCents: prices.reduce((n, x) => n + x.totalCents, 0),
      createdAt: now,
      expiresAt: new Date(Date.now() + 31 * 60000).toISOString(),
    };
    s.orders.push(order);
    const affiliate = resolveAffiliate(s, input.affiliateCode);
    for (const item of prices) {
      const { slot } = slotFor(s, item);
      slot.reserved += item.totalGuests;
      const b: Reservation = {
        ...item,
        id: randomUUID(),
        pnr: `FTP-${secretToken().slice(0, 10).toUpperCase()}`,
        orderId: order.id,
        name: input.name,
        email: input.email,
        phone: input.phone,
        notes: input.notes,
        paymentMethod: "cash",
        paymentStatus: "not_required",
        status: "confirmed",
        source,
        affiliateCode: affiliate?.code || "",
        commissionCents: Math.round(
          (item.totalCents * (affiliate?.commissionPercent || 0)) / 100,
        ),
        commissionPaid: false,
        tokenHash: hash(token),
        expiresAt: new Date(
          new Date(slot.startsAt).getTime() + 30 * 86400000,
        ).toISOString(),
        createdAt: now,
        whatsappConsent: false,
        consentAt: now,
        lastMinuteApplied: item.lastMinuteApplied,
        policy: {
          cancellationHours: item.cancellationHours,
          lateRefundPercent: item.lateRefundPercent,
        },
        termsVersion: `2026-11-06:${hash(JSON.stringify({ terms: s.pages.termini || null, cancellationHours: item.cancellationHours, lateRefundPercent: item.lateRefundPercent })).slice(0, 16)}`,
      };
      s.bookings.push(b);
      order.pnrs.push(b.pnr);
      if (!["civitatis", "getyourguide"].includes(source))
        notification(s, b, "Confermata");
    }
    audit(s, source, "booking.create", order.id);
    return { ...order };
  });
}
export async function cancelReservation(
  pnr: string,
  reason: string,
  actor: string,
  proof?: string,
) {
  return transaction((s) => {
    if (!actor) throw new HttpError(401, "Operatore autorizzato richiesto");
    const trimmed = reason.trim();
    if (trimmed.length < 2)
      throw new HttpError(400, "Indica un motivo di cancellazione");
    const b = s.bookings.find((x) => x.pnr === pnr);
    if (!b) throw new HttpError(404, "Prenotazione non trovata");
    if (proof !== undefined) requireBookingManagement(s, pnr, proof);
    if (b.status === "cancelled") return b;
    if (["present", "no_show"].includes(b.status))
      throw new HttpError(
        409,
        "La prenotazione è già stata registrata in presenza: contatta lo staff.",
      );
    const { slot } = slotFor(s, b);
    if (proof !== undefined && new Date(slot.startsAt).getTime() <= Date.now())
      throw new HttpError(409, "Il tour è già iniziato: contatta lo staff.");
    if (
      proof !== undefined &&
      !["confirmed", "pending"].includes(b.status)
    )
      throw new HttpError(409, "Questa prenotazione non è più cancellabile.");
    const settings = normalizeSettings(s.settings);
    const free =
      new Date(slot.startsAt).getTime() - Date.now() >=
      (b.policy?.cancellationHours ?? settings.cancellationHours) * 3600000;
    b.refundCents =
      b.paymentStatus === "paid"
        ? Math.round(
            b.totalCents *
              (free
                ? 1
                : (b.policy?.lateRefundPercent ??
                    settings.lateRefundPercent) / 100),
          )
        : 0;
    slot.reserved = Math.max(0, slot.reserved - b.totalGuests);
    b.status = "cancelled";
    b.cancellationReason = trimmed.slice(0, 1000);
    b.commissionCents = 0;
    for (const j of s.jobs) {
      if (
        j.bookingPnr === b.pnr &&
        j.status === "queued" &&
        (j.type !== "email" ||
          j.key.startsWith("reminder-email:") ||
          j.key.startsWith("wa:"))
      ) {
        j.status = "failed";
        j.error = "Prenotazione cancellata";
      }
    }
    if (b.refundCents) {
      b.refundStatus = "manual";
      enqueue(s, {
        key: `manual-refund:${b.pnr}`,
        type: "email",
        to:
          process.env.ADMIN_EMAIL || siteContent(s.siteContent).globals.email,
        subject: `Rimborso da gestire: ${b.pnr}`,
        text: `Gestire manualmente il rimborso di EUR ${(b.refundCents / 100).toFixed(2)} per ${b.pnr} (${b.paymentMethod}).`,
        runAt: new Date().toISOString(),
      });
    }
    notification(s, b, "Cancellata");
    audit(s, actor, "booking.cancel", b.pnr);
    return b;
  });
}
export async function moveReservation(
  pnr: string,
  slotId: string,
  actor: string,
  proof?: string,
) {
  return transaction((s) => {
    if (!actor) throw new HttpError(401, "Operatore autorizzato richiesto");
    if (!slotId?.trim())
      throw new HttpError(400, "Seleziona una partenza");
    const b = s.bookings.find((x) => x.pnr === pnr);
    if (!b) throw new HttpError(404, "Prenotazione non trovata");
    if (proof !== undefined) requireBookingManagement(s, pnr, proof);
    if (b.status !== "confirmed")
      throw new HttpError(409, "La prenotazione non è modificabile");
    const { tour, slot: old } = slotFor(s, b);
    const settings = normalizeSettings(s.settings);
    const hours =
      b.policy?.cancellationHours ?? settings.cancellationHours;
    if (new Date(old.startsAt).getTime() <= Date.now())
      throw new HttpError(
        409,
        "Il tour è già iniziato: contatta lo staff.",
      );
    if (
      proof !== undefined &&
      (!tour.published ||
        tour.operationalReviewRequired ||
        new Date(old.startsAt).getTime() - Date.now() < hours * 3600000)
    )
      throw new HttpError(
        409,
        "Il termine per cambiare partenza è scaduto: contatta lo staff.",
      );
    const next = tour.slots.find((x) => x.id === slotId);
    if (
      !next ||
      next.closed ||
      isTourClosed(tour, next.startsAt) ||
      isClosed(s, next.startsAt) ||
      tour.operationalReviewRequired ||
      !tour.published ||
      new Date(next.startsAt).getTime() <
        Date.now() + tour.bookingCutoffHours * 3600000
    )
      throw new HttpError(409, "Partenza non disponibile");
    if (next.id === old.id) return b;
    if (Math.min(next.capacity, 25) - next.reserved < b.totalGuests)
      throw new HttpError(409, "Posti insufficienti");
    old.reserved = Math.max(0, old.reserved - b.totalGuests);
    next.reserved += b.totalGuests;
    b.slotId = next.id;
    b.expiresAt = new Date(
      new Date(next.startsAt).getTime() + 30 * 86400000,
    ).toISOString();
    notification(s, b, "Modificata");
    audit(s, actor, "booking.move", b.pnr);
    return b;
  });
}
// Anonymous checkout receipt: read-only, proof stays in this browser tab.
// No customer account, recovery link or booking management endpoint.
export async function orderConfirmation(proof: string) {
  if (!proof || proof.length > 200)
    throw new HttpError(404, "Conferma non disponibile");
  const s = await readState();
  const o = s.orders.find((o) => o.token && hash(o.token) === hash(proof));
  if (!o || Date.now() - new Date(o.createdAt).getTime() > 24 * 3600000)
    throw new HttpError(404, "Consulta la conferma ricevuta via email");
  return {
    order: {
      id: o.id,
      pnrs: o.pnrs,
      totalCents: o.totalCents,
    },
    bookings: o.pnrs.map((p) => {
      const b = getReservation(s, p, proof);
      const { tour, slot } = slotFor(s, b);
      return {
        pnr: b.pnr,
        status: b.status,
        paymentStatus: b.paymentStatus,
        paymentMethod: b.paymentMethod,
        adults: b.adults,
        children: b.children,
        infants: b.infants,
        totalCents: b.totalCents,
        tourTitle: tour.title,
        startsAt: slot.startsAt,
        meetingPoint: tour.meetingPoint,
        meetingAddress: tour.meetingAddress,
        mapUrl: tour.mapUrl,
        bookingNote: b.bookingNote ?? (isFreeTour(tour) ? FREE_TOUR_NOTE : ""),
        cancellationNote: cancellationNote(
          b.policy ?? tour,
          normalizeSettings(s.settings),
        ),
      };
    }),
    settings: {},
  };
}

export function requireBookingManagement(
  s: PlatformState,
  pnr: string,
  proof: string,
) {
  const b = s.bookings.find((b) => b.pnr === pnr);
  if (
    !b ||
    !verifyBookingManagementProof(proof, b.id, b.pnr) ||
    new Date(b.expiresAt).getTime() < Date.now()
  )
    throw new HttpError(404, "Link prenotazione non valido o scaduto");
  return b;
}
export async function managedBooking(pnr: string, proof: string) {
  const s = await readState();
  const b = requireBookingManagement(s, pnr, proof);
  const { tour, slot } = slotFor(s, b);
  const settings = normalizeSettings(s.settings);
  const hours = b.policy?.cancellationHours ?? settings.cancellationHours;
  const late = b.policy?.lateRefundPercent ?? settings.lateRefundPercent;
  const beforeStart = new Date(slot.startsAt).getTime() > Date.now();
  const free =
    new Date(slot.startsAt).getTime() - Date.now() >= hours * 3600000;
  const order = s.orders.find((o) => o.id === b.orderId);
  return {
    pnr: b.pnr,
    tourTitle: tour.title,
    name: b.name,
    startsAt: slot.startsAt,
    slotId: b.slotId,
    adults: b.adults,
    children: b.children,
    infants: b.infants,
    totalGuests: b.totalGuests,
    totalCents: b.totalCents,
    status: b.status,
    paymentStatus: b.paymentStatus,
    paymentMethod: b.paymentMethod,
    meetingPoint: tour.meetingPoint,
    meetingAddress: tour.meetingAddress,
    mapUrl: tour.mapUrl,
    canMove:
      b.status === "confirmed" &&
      free &&
      beforeStart &&
      tour.published &&
      !tour.operationalReviewRequired,
    canCancel:
      ["confirmed", "pending"].includes(b.status) && beforeStart,
    cancellationHours: hours,
    refundPreviewCents:
      b.paymentStatus === "paid"
        ? Math.round(b.totalCents * (free ? 1 : late / 100))
        : 0,
    refundCents: b.refundCents,
    refundStatus: b.refundStatus,
    cancellationReason: b.cancellationReason,
    calendarUrl: `/api/calendar/booking/${b.pnr}?manage=${encodeURIComponent(proof)}`,
    paymentAmountCents: order?.totalCents ?? b.totalCents,
    slots: tour.slots
      .filter(
        (x) =>
          x.id === b.slotId ||
          (!x.closed &&
            !isTourClosed(tour, x.startsAt) &&
            !isClosed(s, x.startsAt) &&
            !tour.operationalReviewRequired &&
            tour.published &&
            new Date(x.startsAt).getTime() >
              Date.now() + tour.bookingCutoffHours * 3600000 &&
            Math.min(x.capacity, 25) - x.reserved >= b.totalGuests),
      )
      .map((x) => ({
        id: x.id,
        startsAt: x.startsAt,
        available: Math.max(0, Math.min(x.capacity, 25) - x.reserved),
      }))
      .sort((a, c) => a.startsAt.localeCompare(c.startsAt)),
  };
}
