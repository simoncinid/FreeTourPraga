/** Read-only UI fixtures: every booking/quote response is intercepted in this browser. */
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const [scenario = "cart", revision = "current-before", width = "1440"] =
  process.argv.slice(2);
const mode = scenario.startsWith("confirmation")
  ? "confirmation"
  : scenario.startsWith("manage")
    ? "manage"
    : scenario;
const browser = await chromium.launch();
await mkdir("output/ui-audit", { recursive: true });
try {
  const page = await browser.newPage({
    viewport: { width: Number(width), height: 1000 },
    reducedMotion: "reduce",
    locale: "it-IT",
  });
  const catalog = await (
    await page.request.get("http://localhost:3100/api/platform/catalog")
  ).json();
  const tour = catalog.tours[0];
  const departure = new Date(Date.now() + 7 * 86400000);
  departure.setUTCHours(9, 0, 0, 0);
  const startsAt = departure.toISOString();
  const item = {
    id: "ui-fixture",
    tourSlug: tour.slug,
    tourTitle: tour.title,
    slotId: "ui-slot",
    startsAt,
    adults: 2,
    children: 0,
    infants: 0,
    unitAdultCents: tour.basePriceCents,
    unitChildCents: tour.childPriceCents,
    unitInfantCents: tour.infantPriceCents,
    imageUrl: tour.imageUrl,
  };
  const total = item.adults * item.unitAdultCents;
  const booking = {
    pnr: "DEMO-UI",
    ...item,
    status: scenario.includes("pending") ? "pending" : "confirmed",
    tourTitle: tour.title,
    totalCents: total,
    totalGuests: 2,
    meetingPoint: tour.meetingPoint,
    meetingAddress: tour.meetingAddress,
    mapUrl: tour.mapUrl,
    paymentStatus: "unpaid",
    paymentMethod: "cash",
    calendarUrl: "#",
    canMove: true,
    canCancel: true,
    cancellationHours: 24,
    whatsappConsent: false,
    slots: [
      { id: "ui-slot", startsAt, available: 10 },
      {
        id: "ui-slot-next",
        startsAt: new Date(Date.now() + 8 * 86400000).toISOString(),
        available: 8,
      },
    ],
  };
  await page.addInitScript(
    ({ item }) => {
      localStorage.setItem("ftp-cart", JSON.stringify([item]));
      sessionStorage.setItem(
        "ftp-checkout-receipt",
        JSON.stringify({ proof: "ui-fixture-only" }),
      );
    },
    { item },
  );
  await page.route("**/api/platform/quote", (r) =>
    r.fulfill({
      json: {
        items: [{ subtotalCents: total, discountCents: 0, totalCents: total }],
      },
    }),
  );
  await page.route("**/api/platform/confirmation", (r) =>
    r.fulfill({
      json: {
        bookings: [booking],
        order: {
          id: "ui-order",
          totalCents: total,
          paymentMethod: scenario.includes("pending") ? "stripe" : "cash",
          paymentUrl: scenario.includes("pending") ? "#" : undefined,
        },
        settings: catalog.settings,
      },
    }),
  );
  await page.route("**/api/platform/manage/**", (r) =>
    r.fulfill(
      scenario.includes("invalid")
        ? { status: 403, json: { error: "Link non valido o scaduto." } }
        : { json: booking },
    ),
  );
  // Never allow a UI fixture run to submit a real mutation.
  await page.route("**/api/platform/checkout", (r) => r.abort());
  const paths = {
    cart: "/carrello",
    checkout: "/checkout",
    confirmation: "/prenotazione/confermata",
    manage: "/gestisci-prenotazione/DEMO-UI/ui-fixture-only",
  };
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://localhost:3100" + paths[mode]);
  const consent = page.getByRole("button", {
    name: "Solo necessari",
    exact: true,
  });
  if (await consent.isVisible()) await consent.click();
  if (mode === "cart")
    await page.getByText("Il tuo riepilogo", { exact: true }).waitFor();
  if (mode === "checkout")
    await page
      .getByRole("button", { name: "Conferma prenotazione", exact: true })
      .waitFor({ state: "visible" });
  if (mode === "confirmation")
    await page
      .getByText(
        scenario.includes("pending") ? "Pagamento da completare" : "Confermata",
        { exact: true },
      )
      .waitFor();
  if (mode === "manage") {
    if (scenario.includes("invalid"))
      await page.locator("main").getByRole("alert").waitFor();
    else
      await page.getByText("Cambia data o orario", { exact: true }).waitFor();
  }
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      [...document.images].map((i) => i.decode().catch(() => {})),
    );
  });
  await page.mouse.move(0, 0);
  let name = {
    cart: "17-carrello-filled",
    checkout: "18-checkout-filled",
    confirmation: "19-conferma-filled",
    manage: "20-gestione-filled",
  }[mode];
  if (scenario.includes("pending")) name = name.replace("filled", "pending");
  if (scenario.includes("invalid")) name = name.replace("filled", "invalid");
  await page.screenshot({
    path: `output/ui-audit/${name}-${revision}.png`,
    fullPage: true,
  });
  const report = await page.evaluate(() => ({
    h1Count: document.querySelectorAll("h1").length,
    overflow: document.documentElement.scrollWidth > innerWidth,
    brokenImages: [...document.images]
      .filter((i) => i.naturalWidth === 0)
      .map((i) => i.src),
  }));
  assert.equal(report.h1Count, 1);
  assert.equal(report.overflow, false);
  assert.deepEqual(report.brokenImages, []);
  assert.deepEqual(errors, []);
  const result = {
    mode,
    fixture: true,
    route: paths[mode],
    width: Number(width),
    ...report,
    errors,
  };
  await writeFile(
    `output/ui-audit/${name}-${revision}.json`,
    JSON.stringify(result, null, 2),
  );
  console.log(result);
} finally {
  await browser.close();
}
