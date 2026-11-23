/**
 * Collaudo SMTP reale su Railway.
 * Destinatario cliente/admin di test: simoncinidiego10@gmail.com
 * Non usare BOOKING_ADMIN_EMAILS di produzione (UWT) durante questo script.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const base =
  process.env.PLATFORM_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://web-production-f3beeaff.up.railway.app";
const cronSecret = process.env.CRON_SECRET;
const staffEmail = process.env.STAFF_EMAIL || "diego.simoncini@webbitz.it";
const staffPassword = process.env.STAFF_PASSWORD;
const testEmail = process.env.SMTP_TEST_TO || "simoncinidiego10@gmail.com";
const tourSlug = process.env.SMTP_TEST_TOUR || "castello-praga-mala-strana";

assert.ok(cronSecret, "CRON_SECRET richiesto");
assert.ok(staffPassword, "STAFF_PASSWORD richiesto");

let cookie = "";
async function call(path, body, method = body ? "POST" : "GET", headers = {}) {
  const res = await fetch(`${base}/api/platform/${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const set = res.headers.getSetCookie?.() || [];
  for (const c of set) {
    const part = c.split(";")[0];
    if (part.startsWith("ftp_session=")) cookie = part;
  }
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${text.slice(0, 500)}`);
  }
  return json;
}

async function flushJobs(rounds = 6) {
  const results = [];
  for (let i = 0; i < rounds; i++) {
    const out = await fetch(`${base}/api/platform/cron?task=jobs`, {
      method: "POST",
      headers: { authorization: `Bearer ${cronSecret}` },
    });
    const text = await out.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }
    assert.equal(out.status, 200, `cron jobs failed: ${text}`);
    results.push(json);
    const pending = json?.queued ?? json?.remaining;
    if (Array.isArray(json?.results) && json.results.length === 0 && !pending)
      break;
    await new Promise((r) => setTimeout(r, 1500));
  }
  return results;
}

const login = await call("login", { email: staffEmail, password: staffPassword });
assert.ok(login?.ok || login?.user || cookie, "login staff fallito");

const health = await call("health");
assert.ok(health, "health vuoto");
const adminProbe = await call("admin/state", undefined, "GET");
assert.equal(adminProbe.integrations?.smtp, true, "SMTP non attivo su Railway");

const catalog = await call("catalog");
const tour = catalog.tours.find((t) => t.slug === tourSlug && t.published !== false);
assert.ok(tour, `tour ${tourSlug} non trovato`);
const slot = (tour.slots || []).find(
  (s) =>
    new Date(s.startsAt).getTime() > Date.now() + 48 * 3600_000 &&
    (s.capacity ?? 99) - (s.reserved ?? 0) >= 3,
);
assert.ok(slot, "nessuna partenza futura con posti");

const categories = tour.priceCategories || [];
const adultCat =
  categories.find((c) => /adult/i.test(`${c.id} ${c.label || c.name || ""}`)) ||
  categories[0];
const childCat = categories.find((c) =>
  /minori|bambin|niñ|child|kid|ninos/i.test(`${c.id} ${c.label || c.name || ""}`),
);
const item = {
  tourSlug: tour.slug,
  slotId: slot.id,
  adults: 2,
  children: 1,
  infants: 0,
};
if (categories.length) {
  assert.ok(adultCat, "manca categoria adulti");
  item.participants = [
    { categoryId: adultCat.id, quantity: 2 },
    ...(childCat ? [{ categoryId: childCat.id, quantity: 1 }] : []),
  ];
  item.adults = 0;
  item.children = 0;
}

const checkout = await call(
  "checkout",
  {
    items: [item],
    name: "Diego SMTP Test",
    email: testEmail,
    phone: "+393312744277",
    notes: "Collaudo SMTP D07 — ignorare",
    paymentMethod: "cash",
    termsAccepted: true,
    whatsappConsent: false,
  },
  "POST",
  { "Idempotency-Key": randomUUID() },
);

assert.ok(checkout.receiptProof, "manca receiptProof");
assert.ok(checkout.order?.pnrs?.[0], "manca PNR checkout");
const pnr = checkout.order.pnrs[0];

await flushJobs();

const state = await call("admin/state", undefined, "GET");
const jobs = (state.jobs || []).filter((j) => j.bookingPnr === pnr);
const customerJobs = jobs.filter(
  (j) => j.type === "email" && j.key.startsWith(`email:${pnr}:`),
);
const adminJobs = jobs.filter((j) => j.key.startsWith(`email-admin:${pnr}:`));

assert.ok(customerJobs.length >= 1, "manca email cliente");
assert.ok(adminJobs.length >= 1, "manca email admin UWT");
for (const j of [...customerJobs, ...adminJobs]) {
  assert.equal(
    j.status,
    "sent",
    `job ${j.key} status=${j.status} error=${j.error}`,
  );
}

const admin = adminJobs.at(-1);
assert.equal(admin.to, testEmail);
assert.equal(admin.subject, "Reserva freetourpraga.com italiano");
assert.match(admin.text, /Tour: Tour del Castillo en italiano/);
assert.match(admin.text, /Teléfono: \+393312744277/);
assert.match(admin.text, /Cantidad de personas: 2/);
assert.match(admin.text, /Niños: 1/);
assert.match(admin.text, /Total a pagar:/);
assert.match(admin.text, /Idioma del Tour: italiano/);
assert.doesNotMatch(admin.text, /Stato:/);

const customer = customerJobs.at(-1);
assert.equal(customer.to, testEmail);
assert.equal(customer.subject, "Tour del Castello di Praga in Italiano");
assert.match(customer.html || customer.text, /Dettagli della prenotazione|Gestisci/);

await call(
  "admin/booking",
  {
    pnr,
    action: "cancel",
    reason: "Collaudo SMTP cancellazione",
  },
  "PATCH",
);

await flushJobs();
const state2 = await call("admin/state", undefined, "GET");
const cancelJobs = (state2.jobs || []).filter(
  (j) =>
    j.bookingPnr === pnr &&
    j.key.startsWith(`email:${pnr}:`) &&
    /cancell/i.test(`${j.subject || ""} ${j.text || ""}`),
);
assert.ok(
  cancelJobs.some((j) => j.status === "sent"),
  "email cancellazione non inviata",
);
const cancelAdmin = (state2.jobs || []).find(
  (j) =>
    j.bookingPnr === pnr &&
    j.key.startsWith(`email-admin:${pnr}:`) &&
    /Cancellazione freetourpraga/.test(j.subject || ""),
);
assert.ok(
  cancelAdmin && cancelAdmin.status === "sent",
  "email admin cancellazione non inviata",
);
assert.notEqual(cancelAdmin.subject, "Reserva freetourpraga.com italiano");

console.log(
  JSON.stringify(
    {
      ok: true,
      base,
      pnr,
      tour: tour.slug,
      testEmail,
      customerSubject: customer.subject,
      adminSubject: admin.subject,
      cancelSubject: cancelJobs.at(-1)?.subject,
      cancelAdminSubject: cancelAdmin.subject,
      jobsSent: (state2.jobs || []).filter(
        (j) => j.bookingPnr === pnr && j.status === "sent",
      ).length,
    },
    null,
    2,
  ),
);
