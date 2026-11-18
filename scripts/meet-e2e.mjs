import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const base = process.env.TEST_URL;
if (base !== "http://localhost:3101")
  throw Error("Usa il server QA isolato su 3101");
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
await context.addInitScript(() => localStorage.setItem("ftp-consent", "essential"));
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const output = "tmp/meet-qa";
await mkdir(output, { recursive: true });
async function call(path, body, method = "POST", expected = 200) {
  const response = await context.request.fetch(base + "/api/platform/" + path, {
    method,
    headers: { Origin: base, "Idempotency-Key": crypto.randomUUID() },
    ...(body === undefined ? {} : { data: body }),
  });
  const data = await response.json();
  assert.equal(response.status(), expected, `${path}: ${JSON.stringify(data)}`);
  return data;
}
try {
  console.log("Meet QA: configurazione API e inventario");
  await call("login", {
    email: "admin@freetourpraga.local",
    password: "PragaLocale!2026",
  });
  let state = await call("admin/state", undefined, "GET");
  const tour = state.tours[0];
  const from = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);
  const to = new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10);
  Object.assign(tour, {
    isFreeTour: true,
    maxGuests: 25,
    priceLabel: "Offerta libera",
    basePriceCents: 0,
    childPriceCents: 0,
    infantPriceCents: 0,
    cancellationHours: 48,
    lateRefundPercent: 20,
    reminderHours: 12,
    reminderTemplate:
      "Ciao {nome}, cerca l’ombrello arancione per {tour}. {incontro}",
    schedule: {
      enabled: true,
      from,
      to,
      weekdays: [0, 1, 2, 3, 4, 5, 6],
      times: ["10:00", "14:00"],
      capacity: 25,
    },
  });
  await call("admin/tour", tour, "PUT");
  let catalog = (await call("catalog", undefined, "GET")).tours;
  const fresh = catalog.find((t) => t.id === tour.id);
  assert.equal(fresh.slots.length, 32);
  await call("admin/calendar/closure", { from, to: from, closed: true });
  catalog = (await call("catalog", undefined, "GET")).tours;
  assert.equal(catalog.find((t) => t.id === tour.id).slots.length, 30);
  const payload = {
    items: [{ tourSlug: tour.slug, slotId: fresh.slots[0].id, adults: 7 }],
  };
  await call("quote", payload, "POST", 409);
  await call("admin/calendar/closure", { from, to: from, closed: false });
  assert.equal((await call("quote", payload)).items[0].totalCents, 8400);
  state = await call("admin/state", undefined, "GET");
  const editable = state.tours.find((t) => t.id === tour.id);
  editable.closures = [{ date: from, times: ["14:00"] }];
  await call("admin/tour", editable, "PUT");
  catalog = (await call("catalog", undefined, "GET")).tours;
  assert.equal(catalog.find((t) => t.id === tour.id).slots.length, 31);
  await call(
    "admin/affiliate",
    {
      code: "QAMEET",
      name: "Hotel Meet",
      email: "qa@example.com",
      type: "hotel",
      commissionPercent: 0,
      active: true,
    },
    "PUT",
  );
  const qr = await context.request.get(
    base + "/api/platform/admin/affiliate/qr?code=QAMEET",
  );
  assert.equal(qr.status(), 200);
  assert.match(await qr.text(), /<svg/);
  for (const [route, shot, text] of [
    ["/admin/calendario", "calendar", "Calendario delle chiusure"],
    [`/admin/tour/${tour.slug}`, "tour-settings", "Programmazione settimanale"],
    ["/admin/affiliati", "affiliates", "Hotel Meet"],
  ]) {
    await page.goto(base + route);
    await expect(page.getByText(text, { exact: true }).first()).toBeVisible();
    await expect(page.locator(".consent-banner")).toBeHidden();
    await page.screenshot({ path: `${output}/${shot}.png`, fullPage: true });
  }
  console.log("Meet QA: homepage, caroselli e prenotazione mobile");
  await page.goto(base + "/?ref=QAMEET");
  await expect(page.locator(".consent-banner")).toBeHidden();
  await expect(page.locator("a.header-whatsapp")).toHaveCount(0);
  const shownTours = await page
    .locator('[role="tabpanel"] .card-carousel-slide')
    .count();
  assert.ok(shownTours > 0 && shownTours <= 3);
  await page.mouse.move(0, 0);
  const originalTab = await page
    .locator('[role="tab"][aria-selected="true"]')
    .innerText();
  await page.waitForTimeout(5300);
  assert.notEqual(
    await page.locator('[role="tab"][aria-selected="true"]').innerText(),
    originalTab,
  );
  await page.getByRole("tab").first().click();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(5300);
  await expect(page.getByRole("tab").first()).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.screenshot({ path: `${output}/home-desktop.png`, fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  const track = page.locator('[role="tabpanel"] .card-carousel-track');
  const slide = page.locator('[role="tabpanel"] .card-carousel-slide').first();
  assert.ok(
    Math.abs(
      (await track.boundingBox()).width - (await slide.boundingBox()).width,
    ) < 2,
  );
  await page.screenshot({ path: `${output}/home-mobile.png`, fullPage: true });
  await page
    .locator('[role="tabpanel"]')
    .getByRole("button", { name: "Prenota", exact: true })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByText("Numero di persone", { exact: true }),
  ).toBeVisible();
  await dialog.getByLabel("Data del tour").selectOption(from);
  await dialog
    .getByLabel("Orario", { exact: true })
    .selectOption(fresh.slots[0].id);
  await dialog.getByRole("spinbutton").first().fill("7");
  await expect(dialog.locator(".quick-booking-total")).toContainText("84,00");
  await page.screenshot({ path: `${output}/quick-booking-mobile.png` });
  await dialog
    .getByRole("button", { name: "Prenota ora", exact: true })
    .click();
  await page.waitForURL("**/checkout");
  console.log("Meet QA: checkout");
  await expect(
    page.getByText(/Cancellazione gratuita fino a 48/).first(),
  ).toBeVisible();
  await page.getByLabel("Nome e cognome").fill("Cliente Meet");
  await page.getByLabel("Email", { exact: true }).fill("qa@example.com");
  await page
    .getByLabel("Telefono con prefisso internazionale")
    .fill("+393331234567");
  await page.locator('input[name="terms"]').check();
  await page
    .getByRole("button", { name: "Conferma prenotazione", exact: true })
    .click();
  await page.waitForURL("**/prenotazione/confermata");
  await expect(
    page.getByText("Grazie per aver scelto i nostri tour.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/contributo di almeno 10/)).toBeVisible();
  await page.screenshot({
    path: `${output}/confirmation-mobile.png`,
    fullPage: true,
  });
  state = await call("admin/state", undefined, "GET");
  const booking = state.bookings.at(-1);
  assert.equal(booking.totalCents, 8400);
  assert.equal(booking.affiliateCode, "QAMEET");
  assert.equal(booking.policy.cancellationHours, 48);
  assert.equal(
    state.jobs.filter(
      (j) => j.key.startsWith("reminder-email:") && j.status === "queued",
    ).length,
    1,
  );
  await page.goto(base + `/tour/${tour.slug}`);
  await page.locator(".tour-mobile-booking").click();
  await expect(page.locator("#prenota")).toBeInViewport();
  await page.screenshot({ path: `${output}/tour-mobile.png`, fullPage: true });
  await expect(
    page.getByRole("button", { name: "Torna in alto", exact: true }),
  ).toBeVisible();
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  // Participant changes on a paid booking retain the originally agreed unit prices.
  const paidTour = state.tours[1];
  const paidSlot = paidTour.slots.find((slot) => Date.parse(slot.startsAt) > Date.now() + 86400000);
  const paidOrder = await call("checkout", { items: [{ tourSlug: paidTour.slug, slotId: paidSlot.id, adults: 1 }], name: "Cliente tariffa", email: "qa@example.com", phone: "+393331234567", paymentMethod: "cash", termsAccepted: true });
  await call("admin/tour", { ...paidTour, basePriceCents: paidTour.basePriceCents + 1000 }, "PUT");
  const updated = await call("admin/booking", { pnr: paidOrder.order.pnrs[0], action: "update", adults: 2 }, "PATCH");
  assert.equal(updated.totalCents, paidTour.basePriceCents * 2);
  assert.deepEqual(errors, []);
  await writeFile(
    `${output}/results.json`,
    JSON.stringify(
      {
        status: "passed",
        scenarios: [
          "weekly schedule",
          "global closure",
          "tour closure",
          "group price",
          "affiliate QR",
          "category auto-rotation and pause",
          "single mobile card",
          "one-screen booking",
          "checkout and confirmation",
          "per-tour reminder",
          "sticky tour CTA",
        ],
        pageErrors: errors,
      },
      null,
      2,
    ),
  );
  console.log(
    "Meet E2E: API, admin, caroselli, mobile, checkout, QR e reminder verificati.",
  );
} finally {
  await browser.close();
}
