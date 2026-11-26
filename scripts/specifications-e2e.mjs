import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
const base = process.env.TEST_URL || "http://localhost:3101";
if (!/^http:\/\/(localhost|127\.0\.0\.1):3101$/.test(base))
  throw Error("Only isolated localhost:3101 is supported");
const browser = await chromium.launch();
await mkdir("tmp/specifications-qa", { recursive: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  timezoneId: "America/Los_Angeles",
});
await context.addInitScript(() => {
  if (window === window.top) localStorage.setItem("ftp-consent", "essential");
});
context.setDefaultTimeout(12000);
const errors = [];
const page = await context.newPage();
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (message) => {
  if (
    message.type() === "error" &&
    /hydrat|didn't match|server rendered HTML/i.test(message.text())
  )
    errors.push(message.text());
});
async function call(
  path,
  body,
  method = body ? "POST" : "GET",
  expected = 200,
  ctx = context,
) {
  const r = await ctx.request.fetch(`${base}/api/platform/${path}`, {
    method,
    data: body,
    headers: { Origin: base, "Idempotency-Key": randomUUID() },
  });
  const text = await r.text();
  assert.equal(
    r.status(),
    expected,
    `${method} ${path}: ${text.slice(0, 500)}`,
  );
  return text ? JSON.parse(text) : null;
}
async function capture(target, options) {
  await target.evaluate(async () => {
    window.dispatchEvent(new Event("beforeprint"));
    for (const img of document.images) img.loading = "eager";
    await document.fonts.ready;
    await Promise.race([
      Promise.allSettled(Array.from(document.images, (img) => img.decode())),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);
  });
  await target.screenshot({ ...options, animations: "disabled" });
}
const evidence = [];
const pass = (message) => {
  evidence.push(message);
  console.log("PASS " + message);
};
try {
  await call("login", {
    email: "admin@freetourpraga.local",
    password: "PragaLocale!2026",
  });
  const state = await call("admin/state");
  const template = state.tours[0];
  const tomorrow = new Date(Date.now() + 7 * 86400000)
    .toISOString()
    .slice(0, 10);
  const startsAt = tomorrow + "T09:00:00.000Z";
  let tour = {
    ...template,
    id: "qa-v2-tour",
    slug: "qa-v2-tour",
    canonicalPath: undefined,
    sourceUrl: undefined,
    importedFromWordpress: false,
    operationalReviewRequired: false,
    published: true,
    isFreeTour: false,
    title: "QA categorie sovrapposte",
    currency: "CZK",
    basePriceCents: 125000,
    childPriceCents: 50000,
    infantPriceCents: 0,
    maxGuests: 80,
    priceLabel: "",
    adultMinAge: 17,
    childMinAge: 7,
    onlineDiscounts: false,
    arrivalMinutes: 15,
    operatingDays: "Tutti i giorni",
    departureTime: "10:00",
    priceCategories: [
      { id: "adults", label: "Adulti", priceCents: 125000, minAge: 17 },
      { id: "senior", label: "Over 65", priceCents: 112500, minAge: 65 },
      {
        id: "students",
        label: "Studenti fino a 26 anni",
        priceCents: 112500,
        maxAge: 26,
      },
      {
        id: "children",
        label: "Ridotto 7–16 anni",
        priceCents: 50000,
        minAge: 7,
        maxAge: 16,
      },
    ],
    contentBlocks: [
      {
        type: "text",
        heading: "Blocco aggiuntivo QA",
        text: "Contenuto pubblicato dal gestionale.",
      },
    ],
    commissionRules: [
      { affiliateType: "guide", product: "paid", mode: "fixed", value: 200 },
    ],
    calendarRules: [],
    schedule: undefined,
    closures: [],
    slots: [
      {
        id: "qa-v2-slot",
        tourId: "qa-v2-tour",
        startsAt,
        endsAt: new Date(Date.parse(startsAt) + 7200000).toISOString(),
        capacity: 80,
        reserved: 0,
      },
    ],
  };
  await call("admin/tour", tour, "PUT");
  const content = state.siteContent;
  content.globals.navigationVersion = 2;
  content.globals.navigation = [
    { label: "I nostri tour", href: "/tour", children: [] },
    { label: "Chi siamo", href: "/chi-siamo" },
    { label: "Informazioni utili", href: "/informazioni-utili" },
    { label: "Contatti", href: "/contatti" },
    {
      label: "Altro",
      href: "/partner-europa",
      children: [
        { label: "Partner Europa", href: "/partner-europa" },
        { label: "Blog", href: "/blog" },
        { label: "FAQ", href: "/faq" },
        { label: "Aiuto", href: "/aiuto" },
      ],
    },
  ];
  content.globals.officeAddress = "Ufficio QA";
  content.globals.castleMeetingAddress = "Ritrovo Castello QA";
  content.globals.googleReviewUrl = "https://www.google.com/";
  content.globals.instagramDirectUrl = "https://ig.me/m/freetours_praga";
  await call("admin/site-content", content, "PUT");
  const operator = await browser.newContext();
  await call(
    "login",
    { email: "operator@freetourpraga.local", password: "PragaLocale!2026" },
    "POST",
    200,
    operator,
  );
  const partner = {
    id: "qa-v2-partner",
    name: "Partner Roma QA",
    description: "Tour italiani a Roma",
    imageUrl: template.imageUrl,
    email: "partner@example.com",
    phone: "+390612345678",
    website: "https://example.com/",
    published: true,
  };
  // Peer model: ogni account staff può gestire partner e contenuti.
  await call("admin/partner", partner, "PUT", 200, operator);
  await call(
    "admin/page",
    {
      key: "chi-siamo",
      page: {
        ...state.pages["chi-siamo"],
        title: "Chi siamo QA",
        published: true,
        contentBlocks: [
          {
            type: "text",
            heading: "Pagina modificabile QA",
            text: "Testo a blocchi salvato.",
          },
        ],
      },
    },
    "PUT",
  );
  pass(
    "Account staff peer, tour con quattro categorie e blocchi, menu gerarchico e partner persistiti",
  );
  for (const path of [
    "/",
    "/tour",
    "/contatti",
    "/partner-europa",
    "/chi-siamo",
    "/informazioni-utili",
    "/admin/calendario",
    "/admin/partner-europa",
    "/admin/contenuti/navigazione",
    "/admin/tour/qa-v2-tour",
  ]) {
    await page.goto(base + path);
    await page.locator("h1").first().waitFor();
    assert.equal(await page.locator("h1").count(), 1, `${path}: one h1`);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      `${path}: no overflow`,
    );
    await capture(page, {
      path: `tmp/specifications-qa/desktop-${path.replaceAll("/", "-") || "home"}.png`,
      fullPage: true,
      caret: "initial",
    });
  }
  await page.goto(base + "/chi-siamo");
  await page.getByRole("heading", { name: "Pagina modificabile QA" }).waitFor();
  await page.goto(base + "/contatti");
  await page.getByText("Altri punti d’incontro", { exact: true }).click();
  await page
    .getByText("Sede ufficio — previo appuntamento", { exact: true })
    .waitFor();
  await page.getByLabel("Telefono", { exact: true }).fill("+39 333 1234567");
  await call("inquiry", {
    name: "Test telefono",
    email: "qa@example.com",
    phone: "+39 333 1234567",
    message: "Richiesta di informazioni completa",
    type: "Contatto",
    privacy: true,
  });
  assert.equal(
    (await call("admin/state")).inquiries.at(-1).phone,
    "+39 333 1234567",
  );
  await page.goto(base + "/tour");
  assert.equal(
    await page.getByRole("textbox", { name: "Cerca un tour" }).count(),
    0,
  );
  await page
    .getByRole("button", { name: "Aumenta partecipanti", exact: true })
    .click();
  assert.equal(
    await page.getByLabel("Numero partecipanti", { exact: true }).textContent(),
    "2",
  );
  await page.goto(base + "/tour/qa-v2-tour");
  await page.getByRole("heading", { name: "Blocco aggiuntivo QA" }).waitFor();
  await page
    .getByRole("button", { name: "Aumenta Studenti fino a 26 anni" })
    .click();
  await page.getByRole("button", { name: "Aumenta Over 65" }).click();
  assert.equal(
    await page.getByLabel("Quantità Studenti fino a 26 anni").textContent(),
    "1",
  );
  await page.locator(".quick-booking-inline .slot-date-trigger").click();
  const italianDay = new Date(`${tomorrow}T12:00:00Z`).toLocaleDateString(
    "it-IT",
    {
      timeZone: "UTC",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );
  await page.getByRole("button", { name: italianDay, exact: true }).click();
  await page.getByRole("button", { name: "Orario", exact: true }).click();
  const hour = new Date(startsAt).toLocaleTimeString("it-IT", {
    timeZone: "Europe/Prague",
    hour: "2-digit",
    minute: "2-digit",
  });
  await page.getByRole("option", { name: hour, exact: true }).click();
  await capture(page, {
    path: "tmp/specifications-qa/desktop-prenotazione-categorie.png",
    fullPage: true,
    caret: "initial",
  });
  await page.getByRole("button", { name: "Prenota ora", exact: true }).click();
  await page.waitForURL("**/checkout", { waitUntil: "commit" });
  await page
    .getByLabel("Nome e cognome", { exact: true })
    .fill("Cliente QA V2");
  await page.getByLabel("Email", { exact: true }).fill("qa@example.com");
  await page
    .getByLabel("Telefono con prefisso internazionale")
    .fill("+393331234567");
  await page.locator('input[name="terms"]').check();
  await page
    .getByRole("button", { name: "Conferma prenotazione", exact: true })
    .click();
  await page.waitForURL("**/prenotazione/confermata", { waitUntil: "commit" });
  const paymentDialog = page.getByRole("dialog", { name: "Completa il pagamento" });
  await paymentDialog.waitFor();
  const cardLink = await paymentDialog.getByRole("link", { name: /pagare con carta/ }).getAttribute("href");
  assert.match(new URL(cardLink).searchParams.get("text"), /Cliente QA V2.+Studenti fino a 26 anni/);
  await paymentDialog.getByRole("button", { name: "Chiudi" }).click();
  await page.getByText(/Studenti fino a 26 anni/).waitFor();
  let after = await call("admin/state");
  const booking = after.bookings.find((b) => b.tourSlug === tour.slug);
  assert.equal(booking.totalGuests, 3);
  assert.equal(booking.totalCents, 350000);
  assert.equal(booking.currency, "CZK");
  assert.equal(booking.categorySnapshot.length, 4);
  assert.equal(booking.status, "pending");
  await call("admin/booking", { pnr: booking.pnr, action: "settle-order" }, "PATCH");
  after = await call("admin/state");
  const mail = after.jobs.find(
    (j) => j.bookingPnr === booking.pnr && j.to === booking.email,
  );
  assert.match(mail.text, /CZK/);
  assert.doesNotMatch(mail.text, /EUR/);
  pass(
    "Browser checkout CZK con adulti, studenti e over 65, prezzi server, email e snapshot delle categorie",
  );
  const date = tomorrow;
  const reduced = await call(
    "admin/calendar/operation",
    {
      tourIds: [tour.id],
      from: date,
      to: date,
      times: [],
      action: "capacity",
      capacity: 2,
    },
  );
  assert.match(reduced.warnings.join(" "), /3 posti prenotati/);
  const protectedSlot = reduced.tours[0].slots.find((slot) => slot.id === "qa-v2-slot");
  assert.equal(protectedSlot.capacity, 3);
  assert.equal(protectedSlot.reserved, 3);
  await call("admin/calendar/operation", {
    tourIds: [tour.id],
    from: date,
    to: date,
    times: [],
    action: "capacity",
    capacity: 60,
  });
  await call("admin/calendar/operation", {
    tourIds: [tour.id],
    from: date,
    to: date,
    times: ["16:00"],
    action: "open",
    capacity: 45,
  });
  await call("admin/calendar/operation", {
    tourIds: [tour.id],
    from: date,
    to: date,
    times: ["16:00"],
    action: "close",
  });
  after = await call("admin/state");
  const saved = after.tours.find((t) => t.id === tour.id);
  assert.equal(saved.slots.find((s) => s.id === "qa-v2-slot").reserved, 3);
  assert.equal(saved.slots.find((s) => s.id === "qa-v2-slot").capacity, 60);
  assert.ok(saved.slots.some((s) => s.closed));
  assert.ok(saved.calendarLog[0].actor);
  const publicTour = (await call("catalog")).tours.find((entry) => entry.id === tour.id);
  assert.equal(publicTour.calendarLog, undefined);
  assert.equal(publicTour.calendarRules, undefined);
  assert.equal(
    after.bookings.find((b) => b.pnr === booking.pnr).status,
    "confirmed",
  );
  await page.goto(base + "/admin/calendario");
  const tourFilter = page.locator(".calendar-tour-menu");
  await tourFilter.locator("summary").click();
  await tourFilter
    .getByRole("checkbox", { name: "Tutti i tour", exact: true })
    .uncheck();
  await tourFilter
    .getByRole("checkbox", { name: tour.title, exact: true })
    .check();
  await tourFilter.locator("summary").click();
  await capture(page, {
    path: "tmp/specifications-qa/admin-calendario-operativo.png",
    fullPage: true,
    caret: "initial",
  });
  await page.goto(base + "/admin/tour/qa-v2-tour");
  const toolbar = page.getByRole("navigation", {
    name: "Sezioni del tour",
    exact: true,
  });
  const calendarTab = toolbar.getByRole("button", {
    name: "Calendario",
    exact: true,
  });
  await calendarTab.click();
  await expect(page).toHaveURL(/\/admin\/calendario\?tour=qa-v2-tour$/);
  await expect(page.locator(".operational-calendar")).toBeVisible();
  await tourFilter.locator("summary").click();
  await expect(
    tourFilter.getByRole("checkbox", { name: tour.title, exact: true }),
  ).toBeChecked();
  pass(
    "API calendario: limite prenotati, modifica capienza, orario extra e chiusura senza cancellare prenotazioni; calendario dentro tour",
  );
  await page.goto(base + "/admin/supporto");
  await page.getByRole("button", { name: "Apri ticket" }).click();
  const compose = page.getByRole("dialog");
  await page.getByLabel("Oggetto").fill("Verifica calendario QA");
  await page.getByLabel("Descrizione").fill("Controllo del flusso di assistenza del gestionale.");
  await compose.getByRole("button", { name: "Apri ticket" }).click();
  const ticket = page.getByRole("article").filter({ hasText: "Verifica calendario QA" });
  const statusOptions = page.getByRole("listbox");
  await ticket.getByRole("button", { name: "Aperto", exact: true }).click();
  await statusOptions.getByRole("option", { name: "In lavorazione" }).click();
  await ticket.getByRole("button", { name: "In lavorazione" }).click();
  await statusOptions.getByRole("option", { name: "Risolto" }).click();
  await expect(ticket.getByRole("button", { name: "Risolto" })).toBeVisible();
  pass("Ticket salvato e aggiornato fino alla risoluzione");
  // Reuse a visitor cookie for the same partner twice, plus an independent visitor.
  await context.addCookies([
    { name: "ftp_consent", value: "statistics", url: base },
  ]);
  await operator.addCookies([
    { name: "ftp_consent", value: "statistics", url: base },
  ]);
  let r = await context.request.get(
    base + "/api/platform/partner/qa-v2-partner",
    { maxRedirects: 0 },
  );
  assert.equal(r.status(), 303);
  assert.equal(r.headers().location, "https://example.com/");
  await context.request.get(base + "/api/platform/partner/qa-v2-partner", {
    maxRedirects: 0,
  });
  await operator.request.get(base + "/api/platform/partner/qa-v2-partner", {
    maxRedirects: 0,
  });
  const from = new Date().toISOString().slice(0, 10);
  const stats = await call(`admin/partners/stats?from=${from}&to=${from}`);
  const partnerStats = stats.rows.find((r) => r.id === partner.id);
  assert.equal(partnerStats.clicks, 3);
  assert.equal(partnerStats.uniqueVisitorDays, 2);
  const csv = await context.request.get(
    base +
      `/api/platform/admin/partners/stats?from=${from}&to=${from}&format=csv`,
  );
  assert.match(await csv.text(), /Partner Roma QA/);
  await call("admin/partner", { id: partner.id }, "DELETE");
  const deleted = await call(`admin/partners/stats?from=${from}&to=${from}`);
  assert.equal(deleted.rows.find((r) => r.id === partner.id).clicks, 3);
  pass(
    "Partner: redirect reale, tre click/due visitatori, CSV e storico conservato dopo eliminazione",
  );
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    timezoneId: "America/Los_Angeles",
  });
  const phone = await mobile.newPage();
  phone.on("pageerror", (e) => errors.push(e.message));
  await phone.addInitScript(() => {
    if (window === window.top) localStorage.setItem("ftp-consent", "essential");
  });
  for (const path of [
    "/",
    "/tour",
    "/contatti",
    "/partner-europa",
    "/tour/qa-v2-tour",
  ]) {
    await phone.goto(base + path);
    await phone.locator("h1").waitFor();
    assert.equal(
      await phone.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      `mobile ${path}: no overflow`,
    );
    await capture(phone, {
      path: `tmp/specifications-qa/mobile-${path.replaceAll("/", "-") || "home"}.png`,
      fullPage: true,
      caret: "initial",
    });
  }
  await phone.goto(base + "/");
  await phone.locator(".site-mobile-menu-toggle").click();
  await phone
    .getByRole("navigation", { name: "Navigazione mobile", exact: true })
    .getByRole("link", { name: "Contatti", exact: true })
    .click();
  await phone.waitForURL("**/contatti/");
  assert.equal(
    await phone.locator(".site-mobile-menu").getAttribute("open"),
    null,
  );
  assert.equal((await phone.request.get(base + "/account")).status(), 404);
  pass(
    "Browser desktop/mobile: nessun overflow, blocchi pubblici, filtri, form telefono, menu che si richiude, nessun account cliente",
  );
  assert.deepEqual(errors, []);
  await writeFile(
    "tmp/specifications-qa/evidence.json",
    JSON.stringify(
      { at: new Date().toISOString(), checks: evidence, browserErrors: errors },
      null,
      2,
    ),
  );
  await mobile.close();
  await operator.close();
} finally {
  await context.close();
  await browser.close();
}
