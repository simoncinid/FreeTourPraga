import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
const base = process.env.TEST_URL || "http://localhost:3101";
assert.match(base, /^http:\/\/(?:localhost|127\.0\.0\.1):3101$/);
const browser = await chromium.launch(),
  context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    timezoneId: "Europe/Rome",
  });
await context.addInitScript(() =>
  localStorage.setItem("ftp-consent", "essential"),
);
context.setDefaultTimeout(18000);
const page = await context.newPage(),
  errors = [],
  checks = [];
page.on("pageerror", (e) => errors.push(e.message));
const pass = (s) => {
  checks.push(s);
  console.log("PASS COMPLETION " + s);
};
async function call(path, body, method = body ? "POST" : "GET", status = 200) {
  const r = await context.request.fetch(`${base}/api/platform/${path}`, {
    method,
    data: body,
    headers: { Origin: base, "Idempotency-Key": randomUUID() },
  });
  const txt = await r.text();
  assert.equal(r.status(), status, `${method} ${path}: ${txt.slice(0, 600)}`);
  return txt ? JSON.parse(txt) : null;
}
async function capture(name) {
  await page.evaluate(async () => {
    window.dispatchEvent(new Event("beforeprint"));
    await document.fonts.ready;
  });
  await page.screenshot({
    path: `tmp/completion-qa/${name}.png`,
    fullPage: true,
    animations: "disabled",
    caret: "initial",
  });
}
const block = (heading) => ({
  type: "text",
  heading,
  text: `Contenuto pubblicato ${heading}`,
});
try {
  await mkdir("tmp/completion-qa", { recursive: true });
  await call("login", {
    email: "admin@freetourpraga.local",
    password: "PragaLocale!2026",
  });
  let state = await call("admin/state");
  assert.ok(state.tours.find((t) => t.slug === "interni-castello-praga"));
  await import("./visual-content-e2e.mjs");
  state = await call("admin/state");
  // New tour calendar cannot accidentally edit another tour.
  await page.goto(base + "/admin/tour/nuovo");
  await expect(
    page.getByText("Salva il nuovo tour per attivare il suo calendario.", {
      exact: true,
    }),
  ).toBeVisible();
  assert.equal(
    await page.getByLabel("Tour selezionati", { exact: true }).count(),
    0,
  );
  pass("C14: calendario protetto prima del primo salvataggio");
  const date = new Date(Date.now() + 40 * 86400000).toISOString().slice(0, 10),
    weekday = new Date(date + "T12:00Z").getUTCDay();
  const template = state.tours[0];
  let t = {
    ...template,
    id: "completion-tour",
    slug: "completion-tour",
    title: "QA calendario completo",
    canonicalPath: undefined,
    importedFromWordpress: false,
    operationalReviewRequired: false,
    published: true,
    isFreeTour: false,
    currency: "EUR",
    priceLabel: "",
    priceCategories: [{ id: "adults", label: "Adulti", priceCents: 1000 }],
    basePriceCents: 1000,
    onlineDiscounts: false,
    slots: [],
    calendarRules: [],
    closures: [{ date, times: ["10:00"] }],
    schedule: {
      enabled: true,
      from: date,
      to: date,
      weekdays: [weekday],
      times: ["10:00", "14:00"],
      capacity: 20,
    },
    commissionRules: [],
    commissionPackageWith: [],
    paymentMethods: ["cash"],
  };
  await call("admin/tour", t, "PUT");
  await page.goto(base + "/admin/tour/" + t.slug);
  await page
    .getByLabel("Titolo", { exact: true })
    .fill("QA bozza editor conservata");
  await page
    .getByLabel("Mese calendario", { exact: true })
    .fill(date.slice(0, 7));
  await page
    .getByRole("button", { name: `Giorno ${date}`, exact: true })
    .click();
  const reopened = page.waitForResponse(
    (r) =>
      r.url().endsWith("/calendar/operation") &&
      r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Riapri", exact: true }).click();
  assert.equal((await reopened).status(), 200);
  await expect(
    page.getByText(
      "Calendario aggiornato. Le prenotazioni esistenti sono conservate.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.getByLabel("Titolo", { exact: true })).toHaveValue(
    "QA bozza editor conservata",
  );
  const savedTour = page.waitForResponse(
    (r) => r.url().endsWith("/admin/tour") && r.request().method() === "PUT",
  );
  await page
    .getByRole("button", { name: "Salva tour e programmazione", exact: true })
    .click();
  const tourResponse = await savedTour;
  assert.equal(tourResponse.status(), 200, await tourResponse.text());
  state = await call("admin/state");
  t = state.tours.find((v) => v.id === t.id);
  assert.equal(t.title, "QA bozza editor conservata");
  assert.equal(t.calendarRules.at(-1).action, "open");
  for (let i = 0; i < 3; i++) {
    const catalog = await call("catalog");
    const live = catalog.tours.find((v) => v.id === t.id);
    assert.equal(live.slots.length, 2);
    assert.equal(live.departureTime, "10:00, 14:00");
  }
  await capture("tour-calendar-reopen-and-save");
  pass(
    "R5/R6: riapertura closure legacy, tre rigenerazioni e salvataggio scheda senza perdere la bozza o le regole",
  );
  await page.goto(base + "/admin/calendario");
  await page.getByLabel("Tour selezionati", { exact: true }).selectOption(t.id);
  await page.getByLabel("Mese calendario", { exact: true }).fill("2030-12");
  await page.getByRole("button", { name: "Questo mese", exact: true }).click();
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Europe/Prague",
  });
  await expect(page.getByLabel("Mese calendario", { exact: true })).toHaveValue(
    today.slice(0, 7),
  );
  const rangeStart = date.slice(0, 7) + "-28",
    rangeEnd = new Date(Date.parse(rangeStart + "T12:00Z") + 5 * 86400000)
      .toISOString()
      .slice(0, 10);
  await page.getByLabel("Dal", { exact: true }).fill(rangeStart);
  await page.getByLabel("Al", { exact: true }).fill(rangeEnd);
  await page
    .getByRole("button", { name: "Filtra vista dal/al", exact: true })
    .click();
  assert.equal(await page.getByRole("button", { name: /^Giorno / }).count(), 6);
  await expect(
    page.getByRole("button", { name: `Giorno ${rangeEnd}`, exact: true }),
  ).toBeVisible();
  await capture("calendar-filtered-range");
  pass(
    "R4: scorciatoie ancorate al mese attuale e vista filtrata su intervallo che attraversa due mesi",
  );
  // Custom affiliate + explicit package classification + bank instructions frozen at sale.
  const other = {
    ...t,
    id: "completion-other",
    slug: "completion-other",
    title: "QA secondo tour",
    slots: [],
    closures: [],
    calendarRules: [],
    commissionRules: [],
    commissionPackageWith: [],
    paymentMethods: ["cash"],
  };
  await call("admin/tour", other, "PUT");
  t = {
    ...t,
    paymentMethods: ["cash", "bank_transfer"],
    paymentInstructions: "QA SOLO TEST: beneficiario e IBAN di esempio",
    commissionPackageWith: [other.slug],
    commissionRules: [
      {
        affiliateType: "associazione culturale",
        product: "paid",
        mode: "fixed",
        value: 150,
      },
      {
        affiliateType: "associazione culturale",
        product: "package",
        mode: "fixed",
        value: 225,
      },
    ],
  };
  await call("admin/tour", { ...t, paymentInstructions: "" }, "PUT", 400);
  await call("admin/tour", t, "PUT");
  await call(
    "admin/affiliate",
    {
      code: "COMPLETION",
      name: "QA associazione",
      email: "qa@example.com",
      type: "associazione culturale",
      commissionPercent: 0,
      active: true,
    },
    "PUT",
  );
  let catalog = await call("catalog"),
    live = catalog.tours.find((v) => v.id === t.id),
    companion = catalog.tours.find((v) => v.id === other.id);
  const item = (slot) => ({
    tourSlug: t.slug,
    slotId: slot.id,
    adults: 1,
    children: 0,
    infants: 0,
    participants: [{ categoryId: "adults", quantity: 1 }],
  });
  const customer = {
    name: "QA cliente",
    email: "qa@example.com",
    phone: "+393331234567",
    notes: "",
    paymentMethod: "cash",
    affiliateCode: "COMPLETION",
    termsAccepted: true,
  };
  await call("checkout", {
    ...customer,
    items: [item(live.slots[0]), item(live.slots[1])],
  });
  state = await call("admin/state");
  let sold = state.bookings.filter((b) => b.affiliateCode === "COMPLETION");
  assert.equal(sold.length, 2);
  assert.ok(sold.every((b) => b.commissionCents === 150));
  await call("checkout", {
    ...customer,
    items: [
      item(live.slots[0]),
      { ...item(companion.slots[0]), tourSlug: other.slug },
    ],
  });
  state = await call("admin/state");
  sold = state.bookings.filter((b) => b.affiliateCode === "COMPLETION");
  assert.equal(
    sold.filter((b) => b.commissionRuleSnapshot?.product === "package").length,
    1,
  );
  await page.goto(base + "/checkout");
  await page.evaluate(
    ({ t, slot }) => {
      localStorage.setItem(
        "ftp-cart",
        JSON.stringify([
          {
            id: "completion-cart",
            tourSlug: t.slug,
            tourTitle: t.title,
            slotId: slot.id,
            startsAt: slot.startsAt,
            adults: 1,
            children: 0,
            infants: 0,
            unitAdultCents: 1000,
            unitChildCents: 0,
            currency: "EUR",
            participants: [{ categoryId: "adults", quantity: 1 }],
          },
        ]),
      );
    },
    { t, slot: live.slots[0] },
  );
  await page.reload();
  await page.getByLabel("Bonifico bancario", { exact: true }).check();
  await page
    .getByLabel("Nome e cognome", { exact: true })
    .fill("QA cliente bonifico");
  await page.getByLabel("Email", { exact: true }).fill("qa@example.com");
  await page
    .getByLabel("Telefono con prefisso internazionale")
    .fill("+393331234567");
  await page.locator('input[name="terms"]').check();
  await page
    .locator('button[type="submit"]:visible')
    .filter({ hasText: "Conferma prenotazione" })
    .click();
  await page.waitForURL("**/prenotazione/confermata");
  await expect(
    page.getByText(/Bonifico · In attesa del pagamento/),
  ).toBeVisible();
  state = await call("admin/state");
  const bank = state.bookings.find((b) => b.name === "QA cliente bonifico");
  assert.equal(bank.paymentStatus, "pending");
  assert.equal(bank.paymentMethod, "bank_transfer");
  assert.equal(bank.paymentInstructions, t.paymentInstructions);
  await call(
    "admin/booking",
    { pnr: bank.pnr, action: "update", paymentStatus: "paid", notify: false },
    "PATCH",
  );
  state = await call("admin/state");
  assert.equal(
    state.bookings.find((b) => b.pnr === bank.pnr).paymentStatus,
    "paid",
  );
  await call(
    "admin/booking",
    { pnr: bank.pnr, action: "cancel", reason: "QA annullamento bonifico" },
    "PATCH",
  );
  state = await call("admin/state");
  const cancelledBank = state.bookings.find((b) => b.pnr === bank.pnr);
  assert.equal(cancelledBank.status, "cancelled");
  assert.equal(cancelledBank.refundCents, 1000);
  assert.equal(cancelledBank.commissionCents, 0);
  await call(
    "admin/booking",
    { pnr: bank.pnr, action: "refund-record", confirmRefund: true },
    "PATCH",
  );
  state = await call("admin/state");
  assert.equal(
    state.bookings.find((b) => b.pnr === bank.pnr).paymentStatus,
    "refunded",
  );
  pass(
    "A04/A09/T21: categorie affiliate personalizzate, singolo vs pacchetto esplicito, checkout bonifico e registrazione incasso",
  );
  const beforeCastle = state.siteContent,
    castle = state.tours.find((v) => v.slug === "interni-castello-praga");
  await call(
    "admin/site-content",
    {
      ...beforeCastle,
      globals: {
        ...beforeCastle.globals,
        castleMeetingAddress: "QA indirizzo Castello solo per test locale",
      },
    },
    "PUT",
  );
  state = await call("admin/state");
  const updatedCastle = state.tours.find((v) => v.id === castle.id);
  assert.equal(updatedCastle.operationalReviewRequired, false);
  assert.equal(
    updatedCastle.meetingAddress,
    "QA indirizzo Castello solo per test locale",
  );
  assert.equal(
    updatedCastle.mapUrl,
    "https://maps.app.goo.gl/W3UdjsUfZNNMmhKF7",
  );
  await call(
    "admin/site-content",
    {
      ...beforeCastle,
      globals: { ...beforeCastle.globals, castleMeetingAddress: "" },
    },
    "PUT",
  );
  state = await call("admin/state");
  assert.equal(
    state.tours.find((v) => v.id === castle.id).operationalReviewRequired,
    true,
  );
  pass(
    "H18: salvataggio indirizzo globale sincronizza punto Castello, mappa e abilitazione; campo vuoto blocca le vendite",
  );
  assert.deepEqual(errors, []);
  await writeFile(
    "tmp/completion-qa/results.json",
    JSON.stringify({ checks, errors }, null, 2),
  );
} finally {
  await browser.close();
}
