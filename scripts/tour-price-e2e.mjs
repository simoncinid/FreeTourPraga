import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
const base = process.env.TEST_URL || "http://localhost:3101";
if (!/^http:\/\/(localhost|127\.0\.0\.1):3101$/.test(base))
  throw Error("Use the isolated QA server on localhost:3101");
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
await context.addInitScript(() => {
  if (window === window.top) localStorage.setItem("ftp-consent", "essential");
});
context.setDefaultTimeout(15000);
await context.route(/^https:\/\/www\.google\.com\/maps/, (route) =>
  route.abort(),
);
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
async function call(path, body, method = body ? "POST" : "GET") {
  const response = await context.request.fetch(`${base}/api/platform/${path}`, {
    method,
    data: body,
    headers: { Origin: base, "Idempotency-Key": randomUUID() },
  });
  const text = await response.text();
  assert.equal(response.status(), 200, `${path}: ${text}`);
  return JSON.parse(text);
}
const money = (cents, currency) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency })
    .format(cents / 100)
    .replace(/\s+/g, " ");
async function verify(priceCents, currency) {
  const exposed = (await call("catalog")).tours.find(
    (t) => t.id === "qa-t12-price",
  );
  assert.equal(exposed.basePriceCents, priceCents);
  assert.equal(exposed.currency, currency);
  assert.equal(exposed.priceLabel, "");
  await page.goto(base + "/tour");
  const card = page.locator("article").filter({
    has: page.getByRole("link", {
      name: "QA T12 prezzo categorie",
      exact: true,
    }),
  });
  assert.equal(
    (
      await card
        .getByLabel("Prezzo per persona")
        .locator("strong")
        .textContent()
    ).replace(/\s+/g, " "),
    money(priceCents, currency),
  );
  await page.goto(base + "/tour/qa-t12-price", {
    waitUntil: "domcontentloaded",
  });
  const offer = page
    .getByText("Tariffa intera adulti", { exact: true })
    .locator("..");
  assert.equal(
    (await offer.locator("strong").textContent()).replace(/\s+/g, " "),
    money(priceCents, currency),
  );
  const jsonld = (
    await page.locator('script[type="application/ld+json"]').allTextContents()
  ).flatMap((text) => JSON.parse(text));
  const seo = jsonld.find((item) => item["@type"] === "TouristTrip");
  assert.equal(seo.offers.price, (priceCents / 100).toFixed(2));
  assert.equal(seo.offers.priceCurrency, currency);
  const quote = await call("quote", {
    items: [
      {
        tourSlug: exposed.slug,
        slotId: exposed.slots[0].id,
        adults: 1,
        participants: [{ categoryId: "adults", quantity: 1 }],
      },
    ],
    affiliateCode: "",
  });
  assert.equal(quote.items[0].totalCents, priceCents);
}
try {
  await call("login", {
    email: "admin@freetourpraga.local",
    password: "PragaLocale!2026",
  });
  const state = await call("admin/state");
  const template = state.tours[0];
  const startsAt = new Date(Date.now() + 7 * 86400000).toISOString();
  const tour = {
    ...template,
    id: "qa-t12-price",
    slug: "qa-t12-price",
    title: "QA T12 prezzo categorie",
    canonicalPath: undefined,
    importedFromWordpress: false,
    operationalReviewRequired: false,
    published: true,
    isFreeTour: false,
    currency: "CZK",
    basePriceCents: 2900,
    priceLabel: "Vecchio listino 29 euro",
    maxGuests: 25,
    priceCategories: [
      { id: "infants", label: "Minori di 6 anni", priceCents: 0 },
      { id: "adults", label: "Adulti", priceCents: 40000 },
      { id: "students", label: "Studenti", priceCents: 35000 },
    ],
    calendarRules: [],
    closures: [],
    schedule: undefined,
    slots: [
      {
        id: "qa-t12-price-slot",
        tourId: "qa-t12-price",
        startsAt,
        endsAt: new Date(Date.parse(startsAt) + 7200000).toISOString(),
        capacity: 25,
        reserved: 0,
      },
    ],
  };
  await call("admin/tour", tour, "PUT");
  await verify(40000, "CZK");
  const oldOrder = await call("checkout", {
    items: [
      {
        tourSlug: tour.slug,
        slotId: "qa-t12-price-slot",
        adults: 1,
        participants: [{ categoryId: "adults", quantity: 1 }],
      },
    ],
    name: "Cliente test T12",
    email: "qa-t12@example.com",
    phone: "+393331234567",
    notes: "",
    affiliateCode: "",
    paymentMethod: "cash",
    termsAccepted: true,
  });
  await page.goto(base + "/admin/tour/qa-t12-price", {
    waitUntil: "domcontentloaded",
  });
  await page
    .getByRole("button", { name: "Prezzi", exact: true })
    .click();
  await page
    .getByRole("group", { name: "Categoria 2", exact: true })
    .getByLabel(/^Prezzo \(CZK\)/)
    .fill("999");
  let saved = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/platform/admin/tour") &&
      r.request().method() === "PUT",
  );
  await page
    .getByRole("button", { name: "Salva tour e programmazione", exact: true })
    .click();
  assert.equal((await saved).status(), 200);
  await verify(99900, "CZK");
  await page.goto(base + "/admin/tour/qa-t12-price", {
    waitUntil: "domcontentloaded",
  });
  await page
    .getByRole("button", { name: "Prezzi", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Categorie e prezzi", exact: true })
    .locator("..")
    .locator("select")
    .first()
    .selectOption("EUR");
  saved = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/platform/admin/tour") &&
      r.request().method() === "PUT",
  );
  await page
    .getByRole("button", { name: "Salva tour e programmazione", exact: true })
    .click();
  assert.equal((await saved).status(), 200);
  await verify(99900, "EUR");
  const after = await call("admin/state");
  const booking = after.bookings.find((b) => b.pnr === oldOrder.order.pnrs[0]);
  assert.equal(booking.totalCents, 40000);
  assert.equal(booking.currency, "CZK");
  assert.equal(
    booking.categorySnapshot.find((c) => c.id === "adults").unitPriceCents,
    40000,
  );
  assert.equal(
    after.tours.find((t) => t.id === tour.id).basePriceCents,
    2900,
    "display derives from categories without rewriting the old scalar",
  );
  assert.deepEqual(errors, []);
  await mkdir("tmp/tour-price-qa", { recursive: true });
  await writeFile(
    "tmp/tour-price-qa/evidence.json",
    JSON.stringify(
      {
        at: new Date().toISOString(),
        checks: [
          "Categoria adulti preferita alla tariffa minori gratuita",
          "Prezzo e valuta allineati in card, testata, API catalogo, SEO e preventivo",
          "Prezzo modificato da 400 a 999 CZK tramite editor amministrativo",
          "Cambio valuta a EUR verificato tramite editor",
          "Prenotazione precedente conservata a 400 CZK",
        ],
        browserErrors: errors,
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS T12: editor prezzo/valuta → card, testata, catalogo, SEO, preventivo; prenotazioni precedenti conservate.",
  );
} finally {
  await context.close();
  await browser.close();
}
