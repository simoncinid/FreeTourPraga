import { paymentMethodsFor } from "../tour-payments";
import { isCommissionPackage } from "./commissions";
import { selectedPrices } from "../participant-pricing";
import { commissionFor } from "./commissions";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { checkoutSchema, publicCheckoutSchema } from "./validation";
import { audit, readState, transaction } from "./store";
import {
  hash,
  HttpError,
  secretToken,
  bookingManagementProof,
  verifyBookingManagementProof,
} from "./security";
import type { Job, Order, PlatformState, Reservation } from "./model";
import { contentWhatsapp, siteContent } from "./content";
import { formatMoney } from "../format";
import { site } from "../site";
import { reservationIcs } from "./calendar";
import { bookingAdminRecipients, resolveAffiliate } from "./affiliates-wp";
import { isClosed, isTourClosed } from "./scheduling";
import { pragueLocal } from "./time";
import {
  bookingLeadMs,
  cancellationNote,
  freeTourNote,
  isFreeTour,
  tourPrices,
} from "../tour-rules";
import {
  customerTemplateForKind,
  normalizeSettings,
  renderEmailTemplate,
} from "./email-templates";
import { cf7MailForSlug, UWT_ADMIN_SUBJECT } from "./cf7-mail-map";
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export function enqueue(
  s: PlatformState,
  job: Omit<Job, "id" | "status" | "attempts">,
) {
  if (!s.jobs.some((j) => j.key === job.key))
    s.jobs.push({ ...job, id: randomUUID(), status: "queued", attempts: 0 });
}
export function noteLowSeats(s: PlatformState, lines: string[]) {
  const fresh = lines.filter(Boolean).slice(0, 20);
  if (!fresh.length) return;
  s.notices ??= [];
  const now = new Date().toISOString();
  for (const text of fresh) {
    if (s.notices.some((notice) => notice.text === text)) continue;
    s.notices.unshift({ id: randomUUID(), text, at: now });
  }
  s.notices = s.notices.slice(0, 80);
  const to = bookingAdminRecipients();
  if (!to) return;
  enqueue(s, {
    key: `low-seats:${fresh[0]}`,
    type: "email",
    to,
    subject: "Posti in esaurimento",
    text: fresh.join("\n"),
    html: `<p>${fresh.map((line) => line.replaceAll("&", "&amp;").replaceAll("<", "&lt;")).join("<br>")}</p>`,
    runAt: now,
  });
}
function lowSeatLine(
  title: string,
  slot: {
    capacity: number;
    reserved: number;
    closed?: boolean;
    startsAt: string;
  },
) {
  if (slot.closed) return "";
  const left = slot.capacity - slot.reserved;
  if (left <= 0 || left > Math.max(2, Math.ceil(slot.capacity * 0.25)))
    return "";
  return `${title}: restano ${left} posti su ${slot.capacity} il ${pragueLocal(slot.startsAt).replace("T", " ").slice(0, 16)}`;
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
function pragueDateParts(iso: string) {
  const starts = new Date(iso);
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
  return { fecha, hora, when: `${fecha} ${hora}` };
}
function formatTotalPagar(b: Reservation) {
  const currency = b.currency ?? "EUR";
  const amount = b.totalCents / 100;
  const formatted =
    currency === "CZK"
      ? String(Math.round(amount))
      : amount.toFixed(2).replace(/\.00$/, "");
  return `${formatted} ${currency}`;
}
/** Allinea CF7: Cantidad ≈ adulti/fasce paganti, Niños ≈ minori. */
function cantidadNinos(b: Reservation) {
  if (!b.categorySnapshot?.length) {
    return { cantidad: String(b.adults), ninos: String(b.children) };
  }
  let ninos = 0;
  let cantidad = 0;
  for (const c of b.categorySnapshot) {
    if (
      /minori|bambin|niñ|child|kid|infant|ninos/i.test(`${c.id} ${c.label}`)
    ) {
      ninos += c.quantity;
    } else {
      cantidad += c.quantity;
    }
  }
  return { cantidad: String(cantidad), ninos: String(ninos) };
}
export function notification(s: PlatformState, b: Reservation, kind: string) {
  const settings = normalizeSettings(s.settings);
  s.settings = settings;
  const { tour, slot } = slotFor(s, b);
  const contact = siteContent(s.siteContent).globals;
  const { fecha, hora, when } = pragueDateParts(slot.startsAt);
  const cf7 = cf7MailForSlug(tour.slug, tour.title);
  const manageUrl = `${site.url}/gestisci-prenotazione/${b.pnr}/${bookingManagementProof(b.id, b.pnr)}`;
  const calendarUrl = `${site.url}/api/calendar/booking/${b.pnr}?manage=${bookingManagementProof(b.id, b.pnr)}`;
  const paymentLine =
    b.status === "cancelled"
      ? b.paymentStatus === "refunded"
        ? "Rimborso effettuato."
        : b.refundCents
          ? "Prenotazione cancellata. Il team gestirà il rimborso previsto."
          : "Prenotazione cancellata: nessun pagamento da effettuare."
      : b.paymentStatus === "paid"
        ? "Pagamento ricevuto."
        : b.totalCents === 0
          ? "Nessun pagamento richiesto."
          : b.paymentMethod === "ota"
            ? "Pagamento gestito dal provider esterno."
            : b.paymentMethod === "bank_transfer"
              ? `Pagamento tramite bonifico. Causale: ${b.pnr}. ${b.paymentInstructions || ""}`
              : b.paymentMethod === "whatsapp"
                ? "Saldo da concordare su WhatsApp."
                : "Pagamento in contanti sul posto.";
  const affiliate = resolveAffiliate(s, b.affiliateCode, false);
  const afiliado =
    affiliate?.wpId != null
      ? String(affiliate.wpId)
      : affiliate?.code || b.affiliateCode || "";
  const pax = cantidadNinos(b);
  const vars: Record<string, string> = {
    kind,
    nome: b.name,
    pnr: b.pnr,
    tour: tour.title,
    uwtTour: cf7.uwtTourName,
    customerSubject: cf7.customerSubject,
    data: when,
    fecha,
    hora,
    persone: b.categorySnapshot
      ? b.categorySnapshot
          .filter((c) => c.quantity)
          .map((c) => `${c.quantity} ${c.label}`)
          .join("; ")
      : `${b.adults} adulti + ${b.children} minori (+ ${b.infants} infants)`,
    cantidad: pax.cantidad,
    ninos: pax.ninos,
    totale: `${(b.totalCents / 100).toFixed(2)} ${b.currency ?? "EUR"}`,
    rimborso: formatMoney(b.refundCents ?? 0, b.currency ?? "EUR"),
    totalPagar: formatTotalPagar(b),
    incontro: tour.meetingPoint,
    indirizzo: tour.meetingAddress,
    mappa: tour.mapUrl,
    pagamento: paymentLine,
    nota: b.bookingNote ?? (isFreeTour(tour) ? freeTourNote(tour) : ""),
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
    afiliado,
    email: b.email,
    telefono: b.phone,
    note: b.notes || "",
    adulti: pax.cantidad,
    minori: pax.ninos,
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
  const presenceNotice =
    "Il nostro team ti contatterà via WhatsApp per chiederti di confermare la tua presenza.";
  const presenceHtml = `<p style="padding:12px;background:#edf5f8"><strong>${presenceNotice}</strong></p>`;
  const text = renderEmailTemplate(
    template.text.replaceAll("EUR {totale}", "{totale}"),
    vars,
  );
  const html = renderEmailTemplate(
    template.html.replaceAll("EUR {totale}", "{totale}"),
    htmlVars,
  );
  b.calendarSequence = (b.calendarSequence ?? -1) + 1;
  enqueue(s, {
    key: `email:${b.pnr}:${kind}:${randomUUID()}`,
    type: "email",
    bookingPnr: b.pnr,
    to: b.email,
    subject: renderEmailTemplate(template.subject, vars),
    text: kind === "Confermata" ? `${presenceNotice}\n\n${text}` : text,
    html:
      kind === "Confermata"
        ? /<body\b[^>]*>/i.test(html)
          ? html.replace(/<body\b[^>]*>/i, (tag) => tag + presenceHtml)
          : presenceHtml + html
        : html,
    calendar: reservationIcs(s, b),
    runAt: new Date().toISOString(),
  });
  const adminTo = bookingAdminRecipients();
  if (adminTo && kind === "Confermata") {
    // Oggetto/corpo dal gestionale (default CF7/UWT). Non hardcodare: altrimenti «Salva testi email» non ha effetto.
    enqueue(s, {
      key: `email-admin:${b.pnr}:${kind}:${randomUUID()}`,
      type: "email",
      bookingPnr: b.pnr,
      to: adminTo,
      subject: renderEmailTemplate(
        settings.emailTemplates.admin.subject || UWT_ADMIN_SUBJECT,
        vars,
      ),
      text: renderEmailTemplate(
        settings.emailTemplates.admin.text.replaceAll(
          "EUR {totale}",
          "{totale}",
        ),
        vars,
      ),
      runAt: new Date().toISOString(),
    });
  } else if (
    adminTo &&
    (kind === "Cancellata" || kind === "Cancellata e rimborso richiesto")
  ) {
    const cancelAdminSubject = `Cancellazione freetourpraga.com italiano · ${b.pnr}`;
    const cancelAdminText = settings.emailTemplates.admin.text.includes(
      "{uwtTour}",
    )
      ? renderEmailTemplate(
          [
            `Cancellazione: ${kind}`,
            settings.emailTemplates.admin.text,
            `--`,
            `Nota: oggetto «${cancelAdminSubject}» (diverso da conferma UWT).`,
          ].join("\n\n"),
          vars,
        )
      : [
          `Cancellazione prenotazione ${b.pnr}`,
          `Stato: ${kind}`,
          `Tour: ${cf7.uwtTourName}`,
          `De: ${b.name}`,
          `Email: ${b.email}`,
          `Teléfono: ${b.phone}`,
          `Fecha: ${fecha}`,
          `Hora: ${hora}`,
          `Cantidad de personas: ${pax.cantidad}`,
          `Niños: ${pax.ninos}`,
          `Total a pagar: ${formatTotalPagar(b)}`,
          `Idioma del Tour: italiano`,
          `Afiliado: ${afiliado}`,
          `Mensaje: ${b.notes || ""}`,
          `--`,
          `Nota operativa: oggetto diverso da «${UWT_ADMIN_SUBJECT}» per non creare una nuova prenotazione in UWT.`,
        ].join("\n");
    enqueue(s, {
      key: `email-admin:${b.pnr}:${kind}:${randomUUID()}`,
      type: "email",
      bookingPnr: b.pnr,
      to: adminTo,
      subject: cancelAdminSubject,
      text: cancelAdminText,
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
export { releaseExpired } from "./payment-holds";
export function quote(
  s: PlatformState,
  input: Pick<CheckoutInput, "items" | "affiliateCode">,
) {
  const settings = normalizeSettings(s.settings);
  if (
    new Set(
      input.items.map(
        (i) => s.tours.find((t) => t.slug === i.tourSlug)?.currency ?? "EUR",
      ),
    ).size > 1
  )
    throw new HttpError(400, "Prenota separatamente i tour con valute diverse");
  if (input.affiliateCode && !resolveAffiliate(s, input.affiliateCode))
    throw new HttpError(400, "Codice affiliato non valido");
  const prices = input.items.map((item) => {
    const { tour, slot } = slotFor(s, item);
    const startsAt = new Date(slot.startsAt).getTime();
    if (
      !tour.published ||
      tour.archivedAt ||
      slot.closed ||
      isTourClosed(tour, slot.startsAt) ||
      isClosed(s, slot.startsAt) ||
      tour.operationalReviewRequired ||
      startsAt < Date.now() + bookingLeadMs(tour)
    )
      throw new HttpError(409, "Partenza chiusa alle prenotazioni");
    if (!item.participants && tour.childMinAge === 0 && item.infants > 0)
      throw new HttpError(
        400,
        "Per questo tour i più piccoli rientrano nella fascia bambini",
      );
    let categoryPrices;
    try {
      categoryPrices = item.participants
        ? selectedPrices(tour, item.participants)
        : undefined;
    } catch (error) {
      throw new HttpError(
        400,
        error instanceof Error ? error.message : "Categorie non valide",
      );
    }
    if (tour.priceCategories?.length && !item.participants)
      throw new HttpError(400, "Seleziona le categorie del tour");
    const guests =
      categoryPrices?.totalGuests ?? item.adults + item.children + item.infants;
    if (
      isFreeTour(tour) &&
      tour.freeGroupMode === "contact" &&
      guests > (tour.freeGroupLimit ?? 6)
    )
      throw new HttpError(400, freeTourNote(tour));
    if (guests < 1)
      throw new HttpError(400, "Seleziona almeno un partecipante");
    if (guests > tour.maxGuests)
      throw new HttpError(
        400,
        `Massimo ${tour.maxGuests} partecipanti per ${tour.title}`,
      );
    if (guests > slot.capacity - slot.reserved)
      throw new HttpError(409, `Posti insufficienti per ${tour.title}`);
    const units = tourPrices(tour, guests);
    let unitAdult = units.adult;
    let unitChild = units.child;
    let unitInfant = units.infant;
    const date = pragueLocal(slot.startsAt).slice(0, 10);
    const seasonal = (tour.seasonalOffers ?? []).reduce(
      (best, offer) =>
        date >= offer.from && date <= offer.to
          ? Math.max(best, offer.percent)
          : best,
      0,
    );
    const lastMinutePercent =
      tour.onlineDiscounts !== false &&
      settings.lastMinuteEnabled &&
      settings.lastMinuteDiscountPercent > 0 &&
      !units.fixedGroup &&
      startsAt - Date.now() <= settings.lastMinuteHours * 3600000
        ? settings.lastMinuteDiscountPercent
        : 0;
    const percent = Math.max(seasonal, lastMinutePercent);
    const lastMinuteApplied =
      lastMinutePercent > 0 && lastMinutePercent >= seasonal;
    if (percent > 0 && !units.fixedGroup) {
      const factor = 1 - percent / 100;
      unitAdult = Math.round(unitAdult * factor);
      unitChild = Math.round(unitChild * factor);
      unitInfant = Math.round(unitInfant * factor);
    }
    if (categoryPrices && percent > 0 && !units.fixedGroup)
      for (const c of categoryPrices.snapshot)
        c.unitPriceCents = Math.round(c.unitPriceCents * (1 - percent / 100));
    const subtotalCents = categoryPrices
      ? categoryPrices.snapshot.reduce(
          (n, c) => n + c.quantity * c.unitPriceCents,
          0,
        )
      : item.adults * unitAdult +
        item.children * unitChild +
        item.infants * unitInfant;
    return {
      ...item,
      adults: categoryPrices ? guests : item.adults,
      children: categoryPrices ? 0 : item.children,
      infants: categoryPrices ? 0 : item.infants,
      currency: tour.currency ?? "EUR",
      categorySnapshot: categoryPrices?.snapshot,
      subtotalCents,
      fixedGroup: units.fixedGroup,
      paymentMethods: paymentMethodsFor(tour),
      paymentInstructions: paymentMethodsFor(tour).includes("bank_transfer")
        ? tour.paymentInstructions
        : undefined,
      totalGuests: guests,
      unitAdultCents: unitAdult,
      unitChildCents: unitChild,
      unitInfantCents: unitInfant,
      lastMinuteApplied,
      cancellationHours: tour.cancellationHours ?? settings.cancellationHours,
      lateRefundPercent: tour.lateRefundPercent ?? settings.lateRefundPercent,
      bookingNote: isFreeTour(tour)
        ? freeTourNote(tour)
        : lastMinuteApplied
          ? `Tariffa last-minute attiva (−${settings.lastMinuteDiscountPercent}% entro ${settings.lastMinuteHours} ore dalla partenza).`
          : "",
    };
  });
  const paidTours = new Set(
    prices
      .filter((item) => item.subtotalCents > 0 && !item.fixedGroup)
      .map((item) => item.tourSlug),
  );
  return prices.map(({ fixedGroup, ...item }) => {
    const discountCents =
      !fixedGroup && paidTours.size >= settings.minimumTours
        ? Math.round((item.subtotalCents * settings.multiTourPercent) / 100)
        : 0;
    return {
      ...item,
      discountCents,
      totalCents: item.subtotalCents - discountCents,
    };
  });
}
export async function createOrder(
  input: CheckoutInput | z.infer<typeof publicCheckoutSchema>,
  key: string,
  source = "site",
) {
  return transaction((s) => {
    const method = "paymentMethod" in input ? input.paymentMethod : undefined;
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
    if (new Set(prices.map((p) => p.currency)).size > 1)
      throw new HttpError(
        400,
        "Prenota separatamente i tour con valute diverse",
      );
    for (const item of prices) {
      const { tour } = slotFor(s, item);
      if (method && !paymentMethodsFor(tour).includes(method))
        throw new HttpError(
          400,
          `Metodo di pagamento non disponibile per ${tour.title}. Prenota separatamente tour senza metodi in comune.`,
        );
    }
    const token = secretToken();
    const createdAt = Date.now();
    const now = new Date(createdAt).toISOString();
    const totalCents = prices.reduce((n, x) => n + x.totalCents, 0);
    const whatsapp = method === undefined && totalCents > 0;
    const order: Order = {
      id: randomUUID(),
      currency: prices[0].currency,
      key,
      fingerprint,
      pnrs: [],
      token,
      totalCents,
      createdAt: now,
      expiresAt: new Date(
        whatsapp
          ? Math.min(
              createdAt + s.settings.paymentHoldMinutes * 60000,
              ...prices
                .filter((item) => item.totalCents > 0)
                .map((item) => Date.parse(slotFor(s, item).slot.startsAt)),
            )
          : createdAt + 31 * 60000,
      ).toISOString(),
    };
    s.orders.push(order);
    const affiliate = resolveAffiliate(s, input.affiliateCode);
    for (const item of prices) {
      const { slot, tour } = slotFor(s, item);
      slot.reserved += item.totalGuests;
      noteLowSeats(s, [lowSeatLine(tour.title, slot)]);
      const pending = whatsapp && item.totalCents > 0;
      const b: Reservation = {
        ...item,
        id: randomUUID(),
        pnr: `FTP-${secretToken().slice(0, 10).toUpperCase()}`,
        orderId: order.id,
        name: input.name,
        email: input.email,
        phone: input.phone,
        notes: input.notes,
        notesHtml: "notesHtml" in input ? input.notesHtml : undefined,
        paymentMethod: pending ? "whatsapp" : (method ?? "cash"),
        paymentInstructions:
          method === "bank_transfer" ? tour.paymentInstructions : undefined,
        paymentStatus:
          pending || (method === "bank_transfer" && item.totalCents > 0)
            ? "pending"
            : "not_required",
        status: pending ? "pending" : "confirmed",
        source,
        affiliateCode: affiliate?.code || "",
        ...commissionFor(
          tour,
          affiliate,
          item.totalCents,
          item.totalGuests,
          isCommissionPackage(tour, input.items),
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
      if (!pending && !["civitatis", "getyourguide"].includes(source))
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
    if (proof !== undefined && ["present", "no_show"].includes(b.status))
      throw new HttpError(
        409,
        "La prenotazione è già stata registrata in presenza: contatta lo staff.",
      );
    const { slot } = slotFor(s, b);
    if (proof !== undefined && new Date(slot.startsAt).getTime() <= Date.now())
      throw new HttpError(409, "Il tour è già iniziato: contatta lo staff.");
    if (proof !== undefined && !["confirmed", "pending"].includes(b.status))
      throw new HttpError(409, "Questa prenotazione non è più cancellabile.");
    const settings = normalizeSettings(s.settings);
    const free =
      new Date(slot.startsAt).getTime() - Date.now() >=
      (b.policy?.cancellationHours ?? settings.cancellationHours) * 3600000;
    b.commissionCents = 0;
    b.refundCents =
      b.paymentStatus === "paid"
        ? Math.round(
            b.totalCents *
              (free
                ? 1
                : (b.policy?.lateRefundPercent ?? settings.lateRefundPercent) /
                  100),
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
        to: process.env.ADMIN_EMAIL || siteContent(s.siteContent).globals.email,
        subject: `Rimborso da gestire: ${b.pnr}`,
        text: `Gestire manualmente il rimborso di ${b.currency ?? "EUR"} ${(b.refundCents / 100).toFixed(2)} per ${b.pnr} (${b.paymentMethod}).`,
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
    if (!slotId?.trim()) throw new HttpError(400, "Seleziona una partenza");
    const b = s.bookings.find((x) => x.pnr === pnr);
    if (!b) throw new HttpError(404, "Prenotazione non trovata");
    if (proof !== undefined) requireBookingManagement(s, pnr, proof);
    if (b.status !== "confirmed")
      throw new HttpError(409, "La prenotazione non è modificabile");
    const { tour, slot: old } = slotFor(s, b);
    const settings = normalizeSettings(s.settings);
    const hours = b.policy?.cancellationHours ?? settings.cancellationHours;
    if (new Date(old.startsAt).getTime() <= Date.now())
      throw new HttpError(409, "Il tour è già iniziato: contatta lo staff.");
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
      new Date(next.startsAt).getTime() < Date.now() + bookingLeadMs(tour)
    )
      throw new HttpError(409, "Partenza non disponibile");
    if (next.id === old.id) return b;
    if (next.capacity - next.reserved < b.totalGuests)
      throw new HttpError(409, "Posti insufficienti");
    old.reserved = Math.max(0, old.reserved - b.totalGuests);
    next.reserved += b.totalGuests;
    noteLowSeats(s, [lowSeatLine(tour.title, next)]);
    b.slotId = next.id;
    b.expiresAt = new Date(
      new Date(next.startsAt).getTime() + 30 * 86400000,
    ).toISOString();
    notification(s, b, "Modificata");
    audit(s, actor, "booking.move", b.pnr);
    return b;
  });
}
function whatsappPayment(state: PlatformState, order: Order) {
  const bookings = state.bookings.filter(
    (booking) =>
      booking.orderId === order.id &&
      booking.status === "pending" &&
      booking.paymentMethod === "whatsapp",
  );
  if (!bookings.length) return null;
  const visits = bookings.map((booking) => {
    const { tour, slot } = slotFor(state, booking);
    const { fecha, hora } = pragueDateParts(slot.startsAt);
    const people = booking.categorySnapshot
      ? booking.categorySnapshot
          .filter(({ quantity }) => quantity > 0)
          .map(({ quantity, label }) => `${quantity} ${label}`)
      : [
          [booking.adults, "adulto", "adulti"],
          [booking.children, "bambino", "bambini"],
          [booking.infants, "infante", "infanti"],
        ]
          .filter(([quantity]) => Number(quantity) > 0)
          .map(
            ([quantity, singular, plural]) =>
              `${quantity} ${quantity === 1 ? singular : plural}`,
          );
    return `il ${tour.title} per il giorno ${fecha} alle ore ${hora} per ${people.join(", ")} (${booking.pnr})`;
  });
  const amount = formatMoney(
    bookings.reduce((sum, booking) => sum + booking.totalCents, 0),
    order.currency,
  );
  const greeting = `Ciao sono ${bookings[0].name}, ho prenotato ${visits.join("; ")}.`;
  const content = siteContent(state.siteContent, state.pages);
  return {
    expiresAt: order.expiresAt,
    amount,
    card: contentWhatsapp(
      content,
      `${greeting} Richiedo un link di pagamento online di ${amount} per saldare ${visits.length === 1 ? "il tour" : "i tour"}.`,
    ),
    office: contentWhatsapp(
      content,
      `${greeting} Richiedo un appuntamento presso il vostro ufficio per saldare il pagamento di ${amount}.`,
    ),
  };
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
        paymentInstructions: b.paymentInstructions,
        adults: b.adults,
        children: b.children,
        infants: b.infants,
        totalCents: b.totalCents,
        currency: b.currency ?? "EUR",
        categorySnapshot: b.categorySnapshot,
        tourTitle: tour.title,
        startsAt: slot.startsAt,
        meetingPoint: tour.meetingPoint,
        meetingAddress: tour.meetingAddress,
        mapUrl: tour.mapUrl,
        bookingNote:
          b.bookingNote ?? (isFreeTour(tour) ? freeTourNote(tour) : ""),
        cancellationNote: cancellationNote(
          b.policy ?? tour,
          normalizeSettings(s.settings),
        ),
      };
    }),
    payment: whatsappPayment(s, o),
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
    currency: b.currency ?? "EUR",
    categorySnapshot: b.categorySnapshot,
    status: b.status,
    paymentStatus: b.paymentStatus,
    paymentMethod: b.paymentMethod,
    paymentInstructions: b.paymentInstructions,
    meetingPoint: tour.meetingPoint,
    meetingAddress: tour.meetingAddress,
    mapUrl: tour.mapUrl,
    canMove:
      b.status === "confirmed" &&
      free &&
      beforeStart &&
      tour.published &&
      !tour.operationalReviewRequired,
    canCancel: ["confirmed", "pending"].includes(b.status) && beforeStart,
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
            new Date(x.startsAt).getTime() > Date.now() + bookingLeadMs(tour) &&
            x.capacity - x.reserved >= b.totalGuests),
      )
      .map((x) => ({
        id: x.id,
        startsAt: x.startsAt,
        available: Math.max(0, x.capacity - x.reserved),
      }))
      .sort((a, c) => a.startsAt.localeCompare(c.startsAt)),
  };
}
