import { applyVisualPatches, visualPatchSchema } from "./visual-content";
import { jsonEqual } from "../json-equal";
import {
  partnerSchema,
  partnerStats,
  partnerPeriodSchema,
  recordPartnerClick,
  csvCell,
} from "./partners";
import { createHash } from "node:crypto";
import { calendarOperation } from "./calendar-operations";
import { commissionMatured } from "./commissions";
import { calendarOperationSchema } from "./validation";
import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { tourGalleryImages } from "../tour-gallery";
import QRCode from "qrcode";
import { audit, localMode, readState, transaction } from "./store";
import {
  bearer,
  checkOrigin,
  checkPassword,
  HttpError,
  jsonBody,
  rateLimit,
  requireStaff,
  sessionToken,
} from "./security";
import {
  affiliateSchema,
  checkoutSchema,
  pageSchema,
  settingsSchema,
  tourSchema,
  localDateSchema,
} from "./validation";
import { affiliatePublicLink } from "./affiliates-wp";
import {
  slotFor,
  cancelReservation,
  createOrder,
  orderConfirmation,
  managedBooking,
  enqueue,
  moveReservation,
  notification,
  quote,
  releaseExpired,
} from "./booking";
import { runJobs } from "./providers";
import type { Session } from "./security";
import { maintainPrivacy } from "./maintenance";
import { uploadMedia } from "./media";
import { mergeContentPages, siteContent } from "./content";
import { siteContentSchema } from "./content-validation";
import { prepareArticles } from "../article-urls";
import wordpressRoutes from "@/content/wordpress-routes.json";
import { site } from "../site";
import {
  generateScheduledSlots,
  isClosed,
  isTourClosed,
  publicTour,
} from "./scheduling";
import { isFreeTour, tourPrices } from "../tour-rules";
import { normalizeSettings } from "./email-templates";
const ok = (data: unknown) =>
  NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
export async function platformApi(request: Request, path: string[]) {
  try {
    checkOrigin(request);
    const url = new URL(request.url);
    const route = path.join("/");
    const method = request.method;
    if (route === "health") {
      await readState();
      return ok({
        status: "ok",
        storage: localMode() ? "local-preview" : "postgresql",
      });
    }
    if (route === "catalog" && method === "GET") {
      const s = await readState();
      return ok({
        tours: s.tours
          .filter((t) => t.published)
          .map((t) => ({
            ...publicTour(s, t),
            galleryImages: tourGalleryImages(t),
          })),
        settings: {
          multiTourPercent: s.settings.multiTourPercent,
          minimumTours: s.settings.minimumTours,
          cancellationHours: s.settings.cancellationHours,
          lastMinuteEnabled: s.settings.lastMinuteEnabled,
          lastMinuteHours: s.settings.lastMinuteHours,
          lastMinuteDiscountPercent: s.settings.lastMinuteDiscountPercent,
        },
        payments: { cash: true, stripe: false },
        features: { whatsapp: false },
      });
    }
    if (path[0] === "partner" && path.length === 2 && method === "GET") {
      const id = path[1];
      const visitorCookie = request.headers
        .get("cookie")
        ?.match(/(?:^|;\s*)ftp_partner_visitor=([a-f0-9-]{36})(?:;|$)/)?.[1];
      const statisticsAllowed = /(?:^|;\s*)ftp_consent=statistics(?:;|$)/.test(
        request.headers.get("cookie") || "",
      );
      const visitor = statisticsAllowed ? visitorCookie || randomUUID() : "";
      const destination = await transaction((s) => {
        const p = s.partners?.find(
          (p) => p.id === id && p.published && !p.deleted,
        );
        if (!p) throw new HttpError(404, "Partner non disponibile");
        const website = partnerSchema.shape.website.parse(p.website);
        if (
          !/bot|crawler|spider|preview/i.test(
            request.headers.get("user-agent") || "",
          ) &&
          request.headers.get("purpose") !== "prefetch"
        )
          recordPartnerClick(
            s,
            id,
            visitor ? createHash("sha256").update(visitor).digest("hex") : "",
          );
        return website;
      });
      const response = NextResponse.redirect(destination, 303);
      response.headers.set("Cache-Control", "no-store");
      if (statisticsAllowed)
        response.cookies.set("ftp_partner_visitor", visitor, {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: 86400,
        });
      return response;
    }
    if (route === "login" && method === "POST") {
      await rateLimit(request, "login", 5);
      const body = z
        .object({ email: z.string().email(), password: z.string().max(200) })
        .parse(await jsonBody(request));
      let users: {
        email: string;
        passwordHash: string;
        role: Session["role"];
      }[] = [];
      try {
        users = JSON.parse(process.env.STAFF_USERS || "[]");
      } catch {
        throw new HttpError(503, "Configurazione utenti non valida");
      }
      const user = users.find(
        (u) => u.email.toLowerCase() === body.email.toLowerCase(),
      );
      const validPassword = checkPassword(
        body.password,
        user?.passwordHash || `${"0".repeat(32)}:${"0".repeat(128)}`,
      );
      if (!user || !["admin", "operator"].includes(user.role) || !validPassword)
        throw new HttpError(401, "Email o password non validi");
      const response = ok({ ok: true });
      response.cookies.set("ftp_session", sessionToken(user.email, user.role), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 28800,
        path: "/",
      });
      return response;
    }
    if (route === "logout" && method === "POST") {
      const response = ok({ ok: true });
      response.cookies.delete("ftp_session");
      return response;
    }
    if (route === "quote" && method === "POST") {
      await rateLimit(request, "quote", 60);
      const body = checkoutSchema
        .pick({ items: true, affiliateCode: true })
        .parse(await jsonBody(request));
      const s = await transaction((s) => {
        releaseExpired(s);
        return s;
      });
      return ok({ items: quote(s, body) });
    }
    if (route === "checkout" && method === "POST") {
      await rateLimit(request, "checkout", 15);
      const body = checkoutSchema.parse(await jsonBody(request));
      const key = request.headers.get("idempotency-key");
      if (!key || key.length > 100)
        throw new HttpError(400, "Idempotency-Key richiesta");
      const order = await createOrder(body, key);
      return ok({
        order: { pnrs: order.pnrs, totalCents: order.totalCents },
        confirmationUrl: "/prenotazione/confermata",
        receiptProof: order.token,
      });
    }
    if (path[0] === "manage" && path.length === 2 && method === "POST") {
      await rateLimit(request, "manage-booking", 60);
      const body = z
        .object({
          proof: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
          action: z.enum(["view", "move", "cancel"]).default("view"),
          slotId: z.string().max(200).optional(),
          reason: z.string().trim().min(2).max(1000).optional(),
        })
        .parse(await jsonBody(request));
      const pnr = decodeURIComponent(path[1]);
      if (body.action === "move") {
        if (!body.slotId) throw new HttpError(400, "Seleziona una partenza");
        await moveReservation(pnr, body.slotId, "customer-link", body.proof);
      }
      if (body.action === "cancel") {
        if (!body.reason) throw new HttpError(400, "Indica il motivo");
        await cancelReservation(pnr, body.reason, "customer-link", body.proof);
      }
      return ok(await managedBooking(pnr, body.proof));
    }
    if (route === "lookup" || path[0] === "customer")
      throw new HttpError(410, "Area cliente non prevista");
    if (route === "confirmation" && method === "POST") {
      await rateLimit(request, "confirmation", 60);
      const { proof } = z
        .object({ proof: z.string().regex(/^[A-Za-z0-9_-]{43}$/) })
        .parse(await jsonBody(request));
      return ok(await orderConfirmation(proof));
    }
    if (route === "inquiry" && method === "POST") {
      await rateLimit(request, "inquiry", 5);
      const body = z
        .object({
          name: z.string().trim().min(2).max(120),
          email: z.string().email(),
          phone: z
            .string()
            .trim()
            .max(40)
            .regex(/^[+\d\s().-]*$/)
            .optional(),
          message: z.string().min(10).max(5000),
          type: z.string().max(80),
          privacy: z.literal(true),
          website: z.string().max(0).optional(),
        })
        .parse(await jsonBody(request));
      await transaction((s) => {
        const inquiry = {
          ...body,
          id: randomUUID(),
          createdAt: new Date().toISOString(),
          status: "new",
        };
        s.inquiries.push(inquiry);
        enqueue(s, {
          key: `inquiry:${inquiry.id}`,
          type: "email",
          to:
            process.env.ADMIN_EMAIL || siteContent(s.siteContent).globals.email,
          subject: `Richiesta ${body.type}`,
          text: `${body.name}\n${body.email}\n${body.phone || ""}\n${body.message}`,
          runAt: new Date().toISOString(),
        });
      });
      return ok({ ok: true });
    }
    if (route === "cron" && (method === "POST" || method === "GET")) {
      bearer(request, "CRON_SECRET");
      const task = url.searchParams.get("task") || "jobs";
      if (task === "mailbox")
        throw new HttpError(410, "Canali OTA non attivi in Fase 1");
      if (task === "maintenance") return ok(await maintainPrivacy());
      return ok({ jobs: await runJobs() });
    }
    if (route === "ota/inbound" && method === "POST")
      throw new HttpError(410, "Canali OTA non attivi in Fase 1");
    if (path[0] === "admin") {
      const user = await requireStaff();
      const section = path[1];
      if (route === "admin/media" && method === "POST")
        return ok(await uploadMedia(request));
      if (route === "admin/state" && method === "GET") {
        const s = await readState();
        const content = siteContent(s.siteContent, s.pages);
        return ok({
          ...s,
          rateLimits: undefined,
          events: undefined,
          orders: undefined,
          bookings: s.bookings.map(({ tokenHash, ...b }) => b),
          role: user.role,
          siteContent: content,
          pages: mergeContentPages(s.pages, content),
          integrations: {
            database: !localMode(),
            stripe: false,
            smtp: !!process.env.SMTP_HOST,
            whatsapp: false,
            imap: false,
          },
        });
      }
      if (route === "admin/partners/stats" && method === "GET") {
        const period = partnerPeriodSchema.parse({
          from: url.searchParams.get("from"),
          to: url.searchParams.get("to"),
        });
        const rows = partnerStats(await readState(), period.from, period.to);
        if (url.searchParams.get("format") !== "csv") return ok({ rows });
        const data = [
          [
            "Partner",
            "Dal",
            "Al",
            "Click totali",
            "Visitatori unici per giorno",
          ],
          ...rows.map((r) => [
            r.name,
            period.from,
            period.to,
            r.clicks,
            r.uniqueVisitorDays,
          ]),
        ];
        return new NextResponse(
          "\uFEFF" + data.map((row) => row.map(csvCell).join(";")).join("\r\n"),
          {
            headers: {
              "Content-Type": "text/csv; charset=utf-8",
              "Content-Disposition": 'attachment; filename="partner-click.csv"',
              "Cache-Control": "no-store",
            },
          },
        );
      }
      if (route === "admin/export" && method === "GET") {
        const s = await readState();
        const cell = (v: unknown) =>
          `"${String(v ?? "")
            .replace(/^[=+@-]/, "'")
            .replaceAll('"', '""')}"`;
        const rows = [
          [
            "PNR",
            "Cliente",
            "Email",
            "Tour",
            "Partenza",
            "Partecipanti",
            "Totale",
            "Valuta",
            "Stato",
            "Pagamento",
            "Canale",
            "Affiliato",
          ],
          ...s.bookings.map((b) => [
            b.pnr,
            b.name,
            b.email,
            b.tourSlug,
            b.slotId,
            b.totalGuests,
            (b.totalCents / 100).toFixed(2),
            b.currency ?? "EUR",
            b.status,
            b.paymentStatus,
            b.source,
            b.affiliateCode,
          ]),
        ];
        return new NextResponse(
          "\uFEFF" + rows.map((r) => r.map(cell).join(";")).join("\r\n"),
          {
            headers: {
              "Content-Type": "text/csv; charset=utf-8",
              "Content-Disposition": 'attachment; filename="prenotazioni.csv"',
              "Cache-Control": "no-store",
            },
          },
        );
      }
      if (route === "admin/calendar/operation" && method === "POST") {
        const body = calendarOperationSchema.parse(await jsonBody(request));
        const tours = await transaction((s) => {
          calendarOperation(s, body);
          audit(s, user.email, "calendar.operation", JSON.stringify(body));
          return s.tours.filter((t) => body.tourIds.includes(t.id));
        });
        return ok({ ok: true, tours });
      }
      if (route === "admin/calendar/closure" && method === "POST") {
        const body = z
          .object({
            from: localDateSchema,
            to: localDateSchema,
            closed: z.boolean(),
          })
          .refine(
            (v) =>
              v.from <= v.to &&
              Date.parse(v.to) - Date.parse(v.from) <= 366 * 86400000,
            "Intervallo massimo: un anno",
          )
          .parse(await jsonBody(request));
        await transaction((s) => {
          const dates = new Set(s.closedDates ?? []);
          const cursor = new Date(`${body.from}T12:00:00Z`);
          while (cursor.toISOString().slice(0, 10) <= body.to) {
            const date = cursor.toISOString().slice(0, 10);
            if (body.closed) dates.add(date);
            else dates.delete(date);
            cursor.setUTCDate(cursor.getUTCDate() + 1);
          }
          s.closedDates = [...dates].sort();
          audit(
            s,
            user.email,
            body.closed ? "calendar.close" : "calendar.open",
            `${body.from}/${body.to}`,
          );
        });
        return ok({ ok: true });
      }
      if (route === "admin/manual" && method === "POST") {
        const input = checkoutSchema.parse(await jsonBody(request));
        return ok(
          await createOrder(
            input,
            `manual:${request.headers.get("idempotency-key") || randomUUID()}`,
            `manual:${user.email}`,
          ),
        );
      }
      if (section === "booking" && method === "PATCH") {
        const body = z
          .object({
            pnr: z.string(),
            name: z.string().trim().min(2).max(120).optional(),
            email: z.string().email().max(254).optional(),
            phone: z
              .string()
              .regex(/^\+[1-9]\d{6,14}$/)
              .optional(),
            adults: z.number().int().min(1).max(100).optional(),
            children: z.number().int().min(0).max(100).optional(),
            infants: z.number().int().min(0).max(100).optional(),
            action: z.enum(["cancel", "move", "update", "refund-record"]),
            confirmRefund: z.boolean().optional(),
            reason: z.string().max(1000).optional(),
            slotId: z.string().optional(),
            notes: z.string().max(2000).optional(),
            status: z.enum(["confirmed", "present", "no_show"]).optional(),
            paymentStatus: z
              .enum(["paid", "pending", "not_required"])
              .optional(),
            notify: z.boolean().default(false),
          })
          .parse(await jsonBody(request));
        if (body.action === "refund-record") {
          if (body.confirmRefund !== true)
            throw new HttpError(
              400,
              "Conferma il rimborso effettivamente eseguito",
            );
          await transaction((s) => {
            const b = s.bookings.find((b) => b.pnr === body.pnr);
            if (
              !b ||
              b.status !== "cancelled" ||
              b.paymentMethod === "stripe" ||
              !b.refundCents
            )
              throw new HttpError(409, "Nessun rimborso manuale da registrare");
            if (b.refundStatus === "succeeded") return;
            b.refundStatus = "succeeded";
            b.paymentStatus = "refunded";
            notification(s, b, "Rimborso effettuato");
            audit(s, user.email, "refund.manual-recorded", b.pnr);
          });
          return ok({ ok: true });
        }
        if (body.action === "cancel")
          return ok(
            await cancelReservation(
              body.pnr,
              body.reason || "Cancellazione staff",
              user.email,
            ),
          );
        if (body.action === "move")
          return ok(
            await moveReservation(body.pnr, body.slotId || "", user.email),
          );
        return ok(
          await transaction((s) => {
            const b = s.bookings.find((x) => x.pnr === body.pnr);
            if (!b) throw new HttpError(404, "Prenotazione non trovata");
            if (b.status === "cancelled")
              throw new HttpError(409, "Prenotazione cancellata");
            if (
              b.categorySnapshot &&
              [body.adults, body.children, body.infants].some(
                (v) => v !== undefined,
              )
            )
              throw new HttpError(
                409,
                "Per cambiare categorie di una prenotazione esistente crea una sostituzione concordata con il cliente",
              );
            const nextAdults = body.adults ?? b.adults,
              nextChildren = body.children ?? b.children,
              nextInfants = body.infants ?? b.infants;
            const changed =
              nextAdults !== b.adults ||
              nextChildren !== b.children ||
              nextInfants !== b.infants;
            if (changed) {
              if (
                !["cash", "bank_transfer"].includes(b.paymentMethod) ||
                b.paymentStatus === "paid"
              )
                throw new HttpError(
                  409,
                  "Per cambiare i partecipanti di prenotazioni già pagate o OTA, gestisci prima l’adeguamento con il cliente e il provider.",
                );
              const { tour, slot } = slotFor(s, b);
              const guests = nextAdults + nextChildren + nextInfants;
              const delta = guests - b.totalGuests;
              if (
                guests > tour.maxGuests ||
                (delta > 0 &&
                  (slot.closed ||
                    isClosed(s, slot.startsAt) ||
                    isTourClosed(tour, slot.startsAt)))
              )
                throw new HttpError(
                  409,
                  "Limite partecipanti superato o giornata chiusa",
                );
              if (delta > slot.capacity - slot.reserved)
                throw new HttpError(409, "Posti insufficienti");
              const rate = b.subtotalCents
                ? b.discountCents / b.subtotalCents
                : 0;
              const commission = b.totalCents
                ? b.commissionCents / b.totalCents
                : 0;
              const originallyFree =
                b.bookingNote !== undefined
                  ? Boolean(b.bookingNote)
                  : isFreeTour(tour);
              const units = originallyFree
                ? tourPrices({ ...tour, isFreeTour: true }, guests)
                : {
                    adult: b.unitAdultCents ?? tour.basePriceCents,
                    child: b.unitChildCents ?? tour.childPriceCents,
                    infant: b.unitInfantCents ?? tour.infantPriceCents,
                    fixedGroup: false,
                  };
              b.unitAdultCents = units.adult;
              b.unitChildCents = units.child;
              b.unitInfantCents = units.infant;
              b.subtotalCents =
                nextAdults * units.adult +
                nextChildren * units.child +
                nextInfants * units.infant;
              b.discountCents = units.fixedGroup
                ? 0
                : Math.round(b.subtotalCents * rate);
              b.totalCents = b.subtotalCents - b.discountCents;
              b.commissionCents = b.commissionRuleSnapshot
                ? Math.round(
                    b.commissionRuleSnapshot.mode === "fixed"
                      ? b.commissionRuleSnapshot.value * guests
                      : (b.totalCents * b.commissionRuleSnapshot.value) / 100,
                  )
                : Math.round(b.totalCents * commission);
              slot.reserved += delta;
              b.adults = nextAdults;
              b.children = nextChildren;
              b.infants = nextInfants;
              b.totalGuests = guests;
              const order = s.orders.find((o) => o.id === b.orderId)!;
              order.totalCents = s.bookings
                .filter((x) => x.orderId === order.id)
                .reduce((n, x) => n + x.totalCents, 0);
            }
            const contactChanged =
              (body.email && body.email.toLowerCase() !== b.email) ||
              (body.name && body.name !== b.name);
            if (contactChanged)
              for (const job of s.jobs.filter(
                (j) =>
                  j.bookingPnr === b.pnr &&
                  j.type === "email" &&
                  j.status === "queued",
              )) {
                job.status = "failed";
                job.error =
                  "Contatti corretti dallo staff; vecchio destinatario invalidato";
              }
            if (body.name) b.name = body.name;
            if (body.email) b.email = body.email.toLowerCase();
            if (body.phone) b.phone = body.phone;
            if (body.notes !== undefined) b.notes = body.notes;
            if (body.status) b.status = body.status;
            if (body.paymentStatus) b.paymentStatus = body.paymentStatus;
            if (body.notify) notification(s, b, "Aggiornata");
            audit(s, user.email, "booking.update", b.pnr);
            return b;
          }),
        );
      }
      if (
        route === "admin/ota/close" ||
        route === "admin/ota" ||
        route === "admin/ota/approve"
      )
        throw new HttpError(410, "Canali OTA non attivi in Fase 1");
      if (route === "admin/jobs/retry" && method === "POST") {
        const { id } = z
          .object({ id: z.string() })
          .parse(await jsonBody(request));
        await transaction((s) => {
          const j = s.jobs.find((j) => j.id === id);
          if (j && (j.status === "failed" || j.status === "queued")) {
            j.status = "queued";
            j.attempts = 0;
            j.error = undefined;
            j.leaseUntil = undefined;
            j.runAt = new Date().toISOString();
            audit(s, user.email, "job.retry", id);
          }
        });
        return ok({ ok: true });
      }
      if (route === "admin/jobs/run" && method === "POST")
        return ok({ results: await runJobs() });
      if (route === "admin/smtp/test" && method === "POST") {
        if (user.role !== "admin") throw new HttpError(403, "Solo admin");
        let to = "simoncinidiego10@gmail.com";
        try {
          const body = z
            .object({ to: z.string().email().optional() })
            .parse(await jsonBody(request));
          if (body.to) to = body.to;
        } catch {
          /* body opzionale */
        }
        if (!process.env.SMTP_HOST)
          throw new HttpError(503, "SMTP non configurato");
        const { sendSmtpTest } = await import("./providers");
        return ok(await sendSmtpTest(to));
      }
      if (route === "admin/inquiry" && method === "PATCH") {
        const body = z
          .object({ id: z.string(), status: z.enum(["new", "handled"]) })
          .parse(await jsonBody(request));
        await transaction((s) => {
          const i = s.inquiries.find((i) => i.id === body.id);
          if (i) i.status = body.status;
        });
        return ok({ ok: true });
      }
      if (section === "affiliate" && path[2] === "qr" && method === "GET") {
        const code = url.searchParams.get("code") || "";
        const s = await readState();
        if (!s.affiliates.some((a) => a.code === code))
          throw new HttpError(404, "Affiliato non trovato");
        const affiliate = s.affiliates.find((a) => a.code === code)!;
        return new NextResponse(
          await QRCode.toString(affiliatePublicLink(site.url, affiliate), {
            type: "svg",
            width: 400,
            margin: 2,
          }),
          {
            headers: {
              "Content-Type": "image/svg+xml",
              "Cache-Control": "private, no-store",
            },
          },
        );
      }
      // Commercial configuration and content publishing are restricted to administrators.
      await requireStaff(["admin"]);
      if (route === "admin/partner" && method === "PUT") {
        const partner = partnerSchema.parse(await jsonBody(request));
        await transaction((s) => {
          s.partners ??= [];
          const old = s.partners.findIndex((p) => p.id === partner.id);
          if (old < 0) s.partners.push(partner);
          else s.partners[old] = partner;
          audit(s, user.email, "partner.save", partner.id);
        });
        return ok({ ok: true });
      }
      if (route === "admin/partner" && method === "DELETE") {
        const { id } = z
          .object({ id: z.string() })
          .parse(await jsonBody(request));
        await transaction((s) => {
          const p = s.partners?.find((p) => p.id === id);
          if (p) {
            p.deleted = true;
            p.published = false;
          }
          audit(s, user.email, "partner.delete", id);
        });
        return ok({ ok: true });
      }
      if (route === "admin/visual-content" && method === "POST") {
        await requireStaff(["admin"]);
        const input = visualPatchSchema.parse(await jsonBody(request));
        const result = await transaction((s) => {
          const result = applyVisualPatches(s, input);
          audit(
            s,
            user.email,
            "content.visual.publish",
            JSON.stringify(result),
          );
          return result;
        });
        return ok({ ok: true, ...result });
      }
      if (route === "admin/site-content" && method === "PUT") {
        const content = siteContentSchema.parse(await jsonBody(request));
        await transaction((s) => {
          try {
            content.gallery = prepareArticles(
              siteContent(s.siteContent, s.pages).gallery,
              content.gallery,
            );
          } catch (error) {
            throw new HttpError(
              409,
              error instanceof Error
                ? error.message
                : "Indirizzi articolo non validi",
            );
          }
          const castle = s.tours.find(
            (t) => t.slug === "interni-castello-praga",
          );
          if (
            castle &&
            content.globals.castleMeetingAddress !==
              siteContent(s.siteContent, s.pages).globals.castleMeetingAddress
          ) {
            const address = content.globals.castleMeetingAddress?.trim() || "";
            castle.meetingAddress = address;
            castle.mapUrl = address
              ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
              : "";
            castle.mapEmbedUrl = address
              ? `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`
              : "";
            castle.operationalReviewRequired = !address;
          }
          s.siteContent = content;
          audit(s, user.email, "site-content.publish", "global");
        });
        return ok({ ok: true });
      }

      if (section === "tour" && method === "PUT") {
        const input = tourSchema.parse(await jsonBody(request));
        if (
          input.paymentMethods?.includes("bank_transfer") &&
          !input.paymentInstructions?.trim()
        )
          throw new HttpError(
            400,
            "Inserisci beneficiario, IBAN e istruzioni per attivare il bonifico",
          );
        return ok(
          await transaction((s) => {
            if (input.childMinAge >= input.adultMinAge)
              throw new HttpError(400, "Fasce di età non valide");
            if (s.tours.some((t) => t.id !== input.id && t.slug === input.slug))
              throw new HttpError(409, "Slug già in uso");
            const old = s.tours.find((t) => t.id === input.id);
            if (
              old &&
              !jsonEqual(old.calendarRules ?? [], input.calendarRules ?? [])
            )
              throw new HttpError(
                409,
                "Il calendario è cambiato: ricarica il tour prima di salvare per conservare le nuove regole",
              );
            if (
              !old &&
              wordpressRoutes.paths.includes(`/tour/${input.slug}/`) &&
              input.canonicalPath !== `/tour/${input.slug}/`
            )
              throw new HttpError(
                409,
                "Indirizzo riservato a una pagina storica pubblicata",
              );
            if (old?.canonicalPath && old.canonicalPath !== input.canonicalPath)
              throw new HttpError(
                409,
                "Conserva l'indirizzo storico del tour pubblicato",
              );
            if (
              input.canonicalPath &&
              s.tours.some(
                (tour) =>
                  tour.id !== input.id &&
                  tour.canonicalPath === input.canonicalPath,
              )
            )
              throw new HttpError(
                409,
                "Indirizzo canonico già assegnato a un altro tour",
              );
            if (
              old &&
              (old.meetingAddress !== input.meetingAddress ||
                old.mapUrl !== input.mapUrl)
            )
              input.mapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(input.meetingAddress)}&output=embed`;
            if (
              old &&
              input.basePriceCents !== old.basePriceCents &&
              !input.isFreeTour
            )
              input.priceLabel = "";
            if (old && input.description !== old.description)
              input.descriptionHtml = undefined;
            if (
              old &&
              old.slug !== input.slug &&
              (old.published || s.bookings.some((b) => b.tourSlug === old.slug))
            )
              throw new HttpError(
                409,
                "Conserva lo slug del tour pubblicato o con prenotazioni esistenti",
              );
            if (
              new Set(input.slots.map((x) => x.id)).size !== input.slots.length
            )
              throw new HttpError(400, "ID partenza duplicati");
            for (const slot of input.slots) {
              if (
                s.tours.some(
                  (t) =>
                    t.id !== input.id && t.slots.some((x) => x.id === slot.id),
                )
              )
                throw new HttpError(409, "ID partenza già usato");
              const previous = old?.slots.find((x) => x.id === slot.id);
              slot.reserved = previous?.reserved || 0;
              if (slot.capacity < slot.reserved)
                throw new HttpError(
                  409,
                  "Capienza inferiore ai posti già prenotati",
                );
              if (new Date(slot.endsAt) <= new Date(slot.startsAt))
                throw new HttpError(400, "Fine partenza non valida");
              if (
                previous &&
                previous.reserved &&
                previous.startsAt !== slot.startsAt
              )
                throw new HttpError(
                  409,
                  "Crea una nuova partenza e sposta le prenotazioni prima di cambiare orario",
                );
            }
            if (
              old?.slots.some(
                (x) =>
                  x.reserved > 0 && !input.slots.some((n) => n.id === x.id),
              )
            )
              throw new HttpError(
                409,
                "Non puoi eliminare partenze con prenotazioni",
              );
            if (input.galleryImages === undefined && old?.galleryImages)
              input.galleryImages = old.galleryImages;
            if (
              input.highlightGalleries === undefined &&
              old?.highlightGalleries
            )
              input.highlightGalleries = old.highlightGalleries;
            if (!jsonEqual(old?.schedule, input.schedule)) {
              input.slots = input.slots.filter(
                (slot) =>
                  slot.id.startsWith("extra:") ||
                  (!input.schedule?.enabled &&
                    !slot.id.startsWith("schedule:")) ||
                  s.bookings.some((b) => b.slotId === slot.id) ||
                  Date.parse(slot.startsAt) < Date.now(),
              );
              for (const slot of input.slots)
                if (
                  Date.parse(slot.startsAt) > Date.now() &&
                  !slot.id.startsWith("extra:")
                )
                  slot.closed = true;
            }
            generateScheduledSlots(input);
            const index = s.tours.findIndex((t) => t.id === input.id);
            if (index < 0) s.tours.push(input);
            else s.tours[index] = input;
            audit(s, user.email, "tour.save", input.slug);
            return input;
          }),
        );
      }
      if (section === "settings" && method === "PUT") {
        const input = settingsSchema.parse(await jsonBody(request));
        await transaction((s) => {
          s.settings = normalizeSettings(input);
          audit(s, user.email, "settings.save", "commercial");
        });
        return ok({ ok: true });
      }
      if (section === "page" && method === "PUT") {
        const body = z
          .object({
            key: z
              .string()
              .regex(/^(?:[a-z0-9-]+|legacy:\/[a-zA-Z0-9/_-]*\/)$/),
            page: pageSchema,
          })
          .parse(await jsonBody(request));
        await transaction((s) => {
          if (["homepage", "blog", "faq"].includes(body.key)) {
            // These routes own structured content; this endpoint only edits their SEO.
            s.siteContent = siteContent(s.siteContent, s.pages);
            const previous = s.pages[body.key] || body.page;
            s.pages[body.key] = {
              ...previous,
              contentBlocks: body.page.contentBlocks,
              seoTitle: body.page.seoTitle,
              seoDescription: body.page.seoDescription,
              published: true,
            };
          } else {
            const previous = s.pages[body.key];
            if (
              previous?.canonicalPath &&
              previous.canonicalPath !== body.page.canonicalPath
            )
              throw new HttpError(
                409,
                "Conserva l'indirizzo storico della pagina pubblicata",
              );
            if (previous && previous.body !== body.page.body)
              body.page.bodyHtml = undefined;
            s.pages[body.key] = body.page;
          }
          audit(s, user.email, "page.save", body.key);
        });
        return ok({ ok: true });
      }
      if (section === "affiliate" && method === "PUT") {
        const a = affiliateSchema.parse(await jsonBody(request));
        await transaction((s) => {
          s.affiliates = s.affiliates.filter((x) => x.code !== a.code);
          s.affiliates.push(a);
          audit(s, user.email, "affiliate.save", a.code);
        });
        return ok({ ok: true });
      }
      if (route === "admin/commissions/pay" && method === "POST") {
        const { code } = z
          .object({ code: z.string() })
          .parse(await jsonBody(request));
        await transaction((s) => {
          for (const b of s.bookings.filter(
            (b) =>
              b.affiliateCode === code &&
              commissionMatured(s, b) &&
              !b.commissionPaid &&
              (b.paymentStatus === "paid" || b.paymentMethod === "cash"),
          ))
            b.commissionPaid = true;
          audit(s, user.email, "commissions.paid", code);
        });
        return ok({ ok: true });
      }
    }
    throw new HttpError(404, "Operazione non trovata");
  } catch (e) {
    if (e instanceof z.ZodError)
      return NextResponse.json(
        {
          error: e.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; "),
        },
        { status: 400 },
      );
    if (e instanceof HttpError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("Platform error", e instanceof Error ? e.name : "unknown");
    return NextResponse.json(
      { error: "Operazione non riuscita. Riprova o contatta lo staff." },
      { status: 500 },
    );
  }
}
