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
page.on("pageerror", (e) => {
  errors.push(e.message);
  console.error("Browser page error", page.url(), page.frames().map((frame) => frame.url()), e.stack);
});
await context.addInitScript(() => {
  window.addEventListener("error", (event) => {
    console.error("Browser frame error", location.href, event.message);
  });
});
page.on("console", (message) => {
  if (message.text().startsWith("Browser frame error"))
    console.error(message.text());
});
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
async function openTourCalendar() {
  const trigger = page.getByRole("button", {
    name: "Calendario",
    exact: true,
  });
  const dialog = page.locator(".tour-calendar-popup");
  await expect(async () => {
    if ((await trigger.getAttribute("aria-pressed")) !== "true") await trigger.click();
    await expect(dialog).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 12000 });
  return dialog;
}
async function showCalendarMonth(calendar, date) {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Prague" });
  const [year, month] = date.split("-").map(Number);
  const [currentYear, currentMonth] = today.split("-").map(Number);
  const delta = (year - currentYear) * 12 + month - currentMonth;
  const arrow = calendar.getByRole("button", {
    name: delta < 0 ? "Mese precedente" : "Mese successivo",
    exact: true,
  });
  for (let index = 0; index < Math.abs(delta); index++) await arrow.click();
}
try {
  await mkdir("tmp/completion-qa", { recursive: true });
  await call("login", {
    email: "admin@freetourpraga.local",
    password: "PragaLocale!2026",
  });
  let state = await call("admin/state");
  assert.ok(state.tours.find((t) => t.slug === "interni-castello-praga"));
  // New tour calendar cannot accidentally edit another tour.
  await page.goto(base + "/admin/tour/nuovo");
  await openTourCalendar();
  await expect(
    page.getByText("Salva il nuovo tour per attivare il suo calendario.", {
      exact: true,
    }),
  ).toBeVisible();
  assert.equal(
    await page.locator(".tour-calendar-popup .calendar-tour-menu").count(),
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
  await page.getByRole("button", { name: "SEO", exact: true }).click();
  const tourTitle = page.getByLabel("Titolo *", { exact: true });
  await tourTitle.fill("QA bozza editor conservata");
  const tourCalendar = await openTourCalendar();
  await showCalendarMonth(tourCalendar, date);
  await page
    .getByRole("button", { name: `Giorno ${date}`, exact: true })
    .click();
  const reopened = page.waitForResponse(
    (r) =>
      r.url().endsWith("/calendar/operation") &&
      r.request().method() === "POST",
  );
  await page.getByRole("button", { name: /^Riapri(?: partenza)?$/ }).click();
  assert.equal((await reopened).status(), 200);
  await expect(
    page.getByText(
      "Calendario aggiornato. Le prenotazioni esistenti sono conservate.",
      { exact: true },
    ),
  ).toBeVisible();
  const dayDialog = tourCalendar.locator("dialog[open]");
  if (await dayDialog.count()) await page.keyboard.press("Escape");
  await expect(dayDialog).toHaveCount(0);
  if (await tourCalendar.isVisible()) await page.keyboard.press("Escape");
  await expect(tourCalendar).toBeHidden();
  await expect(tourTitle).toHaveValue("QA bozza editor conservata");
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
  const calendar = page.locator(".operational-calendar");
  const menu = calendar.locator(".calendar-tour-menu");
  await menu.locator("summary").click();
  await menu.getByRole("checkbox", { name: "Tutti i tour", exact: true }).uncheck();
  await menu.getByRole("checkbox", { name: t.title, exact: true }).check();
  await menu.locator("summary").click();
  await showCalendarMonth(calendar, date);
  await expect(calendar.getByRole("button", { name: `Giorno ${date}`, exact: true })).toBeVisible();
  pass("R4: navigazione mensile del calendario dalla data operativa di Praga");
  const savedRule = t.calendarRules.at(-1);
  await calendar.getByRole("button", { name: "Programmazione", exact: true }).click();
  await page.getByLabel("Regole salvate").selectOption(savedRule.id);
  const [ruleResponse] = await Promise.all([
    page.waitForResponse((response) =>
      response.url().endsWith("/calendar/operation") && response.request().method() === "POST",
    ),
    page.locator('.calendar-program-panel button[type="submit"]').click(),
  ]);
  assert.equal(ruleResponse.status(), 200, await ruleResponse.text());
  const editedRule = (await ruleResponse.json()).tours[0].calendarRules.at(-1);
  assert.equal(editedRule.id, savedRule.id);
  t = (await call("admin/state")).tours.find((tour) => tour.id === t.id);
  pass("Una regola salvata si modifica dal calendario mantenendo il suo identificativo");
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
  await call("admin/manual", {
    ...customer,
    name: "QA cliente bonifico",
    paymentMethod: "bank_transfer",
    items: [item(live.slots[0])],
  });
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
    "A04/A09/T21: categorie affiliate personalizzate, singolo vs pacchetto esplicito, prenotazione staff con bonifico e registrazione incasso",
  );
  const beforeSchedule = state.tours.find((tour) => tour.id === t.id);
  const retained = beforeSchedule.slots.find((slot) => slot.id.endsWith(":14:00"));
  assert.ok(retained?.reserved);
  await call("admin/tour", {
    ...beforeSchedule,
    schedule: { ...beforeSchedule.schedule, times: ["14:00"], capacity: 30 },
  }, "PUT");
  const updatedSchedule = (await call("admin/state")).tours.find((tour) => tour.id === t.id);
  const sameDeparture = updatedSchedule.slots.find((slot) => slot.id === retained.id);
  assert.equal(sameDeparture.reserved, retained.reserved);
  assert.equal(sameDeparture.capacity, 30);
  assert.equal(sameDeparture.closed, false);
  pass("Una modifica alla programmazione aggiorna le capienze senza chiudere le partenze ancora previste");
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
    new URL(updatedCastle.mapUrl).searchParams.get("query"),
    updatedCastle.meetingAddress,
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
