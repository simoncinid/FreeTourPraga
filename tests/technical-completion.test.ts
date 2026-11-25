import { test } from "node:test";
import assert from "node:assert/strict";
import { initialState } from "../src/lib/platform/store";
import { calendarOperation } from "../src/lib/platform/calendar-operations";
import {
  generateScheduledSlots,
  isTourClosed,
  publicTour,
} from "../src/lib/platform/scheduling";
import { pragueInstant } from "../src/lib/platform/time";
import {
  contentEditorSection,
  contentEditorTarget,
  pageEditorId,
  pageEditorKey,
} from "../src/lib/content-routing";
import { guidePath } from "../src/lib/public-paths";
import { siteNavigation } from "../src/lib/navigation";
import {
  isCommissionPackage,
  commissionFor,
} from "../src/lib/platform/commissions";
import {
  affiliateSchema,
  commissionRuleSchema,
  tourImageUrlSchema,
} from "../src/lib/platform/validation";
import { paymentMethodsFor } from "../src/lib/tour-payments";
const day = "2027-07-01",
  now = Date.parse("2027-06-30T00:00:00Z");
function fixture() {
  const s = initialState(),
    t = s.tours[0];
  t.slots = [];
  t.schedule = {
    enabled: true,
    from: day,
    to: day,
    weekdays: [4],
    times: ["10:00", "14:00"],
    capacity: 20,
  };
  generateScheduledSlots(t, now);
  return { s, t };
}
test("R1 structured CMS routes take precedence over seeded generic pages", () => {
  const s = initialState();
  for (const key of ["homepage", "blog", "faq"])
    assert.equal(contentEditorSection(key, s.pages), key);
  assert.equal(contentEditorSection("informazioni-utili", s.pages), "pagine");
});
test("R2 historical page keys survive URL-safe editor routing and tree resolves canonical tours/articles", () => {
  const s = initialState(),
    c = s.siteContent!;
  const key = "legacy:/foo/bar/";
  s.pages[key] = { ...s.pages.privacy, canonicalPath: "/foo/bar/" };
  assert.equal(pageEditorKey(pageEditorId(key)), key);
  assert.equal(contentEditorSection(pageEditorId(key), s.pages), "pagine");
  assert.equal(
    contentEditorTarget("/foo/bar/", s.tours, s.pages, c),
    `/admin/contenuti/${pageEditorId(key)}`,
  );
  s.tours[0].canonicalPath = "/tour-storico/";
  assert.equal(
    contentEditorTarget("/tour-storico/", s.tours, s.pages, c),
    `/admin/tour/${s.tours[0].slug}`,
  );
  assert.equal(
    siteNavigation(c, s.tours).find((n) => n.href === "/tour")!.children!
      .length,
    s.tours.length,
  );
  const a = c.gallery[0];
  assert.match(
    contentEditorTarget(guidePath(a), s.tours, s.pages, c),
    /\/blog#articolo-/,
  );
});
test("R5 explicit reopening supersedes a legacy partial closure and survives repeated generation", () => {
  const { s, t } = fixture();
  t.closures = [{ date: day, times: ["10:00"] }];
  generateScheduledSlots(t, now);
  assert.equal(t.slots[0].closed, true);
  calendarOperation(s, {
    tourIds: [t.id],
    from: day,
    to: day,
    weekdays: [4],
    times: ["10:00"],
    action: "open",
    capacity: 21,
  });
  for (let i = 0; i < 3; i++) generateScheduledSlots(t, now);
  assert.equal(t.slots[0].closed, false);
  assert.equal(isTourClosed(t, t.slots[0].startsAt), false);
  assert.equal(t.slots[0].capacity, 21);
  assert.equal(
    publicTour(s, t).slots.some((x) => x.id === t.slots[0].id),
    true,
  );
});
test("R5 reopening one time on a legacy whole-day closure preserves all other closures", () => {
  const { s, t } = fixture();
  t.closures = [{ date: day, times: [] }];
  calendarOperation(s, {
    tourIds: [t.id],
    from: day,
    to: day,
    weekdays: [4],
    times: ["10:00"],
    action: "open",
    capacity: 20,
  });
  assert.equal(isTourClosed(t, pragueInstant(day + "T10:00")), false);
  assert.equal(isTourClosed(t, pragueInstant(day + "T14:00")), true);
});
test("R5 generation preserves bare manual closures/capacity and reserved inventory", () => {
  const { t } = fixture();
  const a = t.slots[0];
  a.closed = true;
  a.capacity = 11;
  a.reserved = 7;
  for (let i = 0; i < 3; i++) generateScheduledSlots(t, now);
  assert.equal(a.closed, true);
  assert.equal(a.capacity, 11);
  assert.equal(a.reserved, 7);
});
test("calendar ordered overrides survive regeneration and do not alter reservations", () => {
  const { s, t } = fixture();
  t.slots[0].reserved = 5;
  const op = {
    tourIds: [t.id],
    from: day,
    to: day,
    weekdays: [4],
    times: ["10:00"],
  };
  calendarOperation(s, { ...op, action: "close" });
  calendarOperation(s, { ...op, action: "open", capacity: 8 });
  calendarOperation(s, { ...op, action: "capacity", capacity: 9 });
  generateScheduledSlots(t, now);
  assert.equal(t.slots[0].closed, false);
  assert.equal(t.slots[0].capacity, 9);
  assert.equal(t.slots[0].reserved, 5);
  const low = calendarOperation(s, { ...op, action: "capacity", capacity: 4 });
  assert.equal(t.slots[0].reserved, 5);
  assert.equal(t.slots[0].capacity, 5);
  assert.match(low.warnings.join(" "), /prenotati/);
});
test("restore drops the period exception and reapplies the base schedule", () => {
  const { s, t } = fixture();
  const op = {
    tourIds: [t.id],
    from: day,
    to: day,
    weekdays: [4],
    times: ["15:00"],
  };
  calendarOperation(s, { ...op, action: "open", capacity: 12 });
  calendarOperation(s, {
    tourIds: [t.id],
    from: day,
    to: day,
    weekdays: [4],
    times: ["10:00"],
    action: "close",
  });
  calendarOperation(s, { ...op, times: [], action: "restore" });
  assert.equal(isTourClosed(t, pragueInstant(day + "T10:00")), false);
  assert.equal(
    t.slots.find((slot) => pragueLocalTime(slot.startsAt) === "10:00")?.capacity,
    20,
  );
  assert.equal(
    t.slots.some((slot) => pragueLocalTime(slot.startsAt) === "15:00"),
    false,
  );
});
test("restoring an exception keeps a manually configured departure and its capacity", () => {
  const { s, t } = fixture();
  t.schedule = undefined;
  const slot = { ...t.slots[0], id: "manual-base", capacity: 17, reserved: 3 };
  t.slots = [slot];
  const op = {
    tourIds: [t.id],
    from: day,
    to: day,
    weekdays: [4],
    times: ["10:00"],
  };
  calendarOperation(s, { ...op, action: "capacity", capacity: 9 });
  calendarOperation(s, { ...op, action: "remove" });
  assert.equal(slot.closed, true);
  assert.equal(slot.removed, true);
  calendarOperation(s, { ...op, action: "restore" });
  assert.equal(t.slots[0], slot);
  assert.equal(slot.capacity, 17);
  assert.equal(slot.closed, false);
  assert.equal(slot.reserved, 3);
});
test("editing a saved rule recalculates its former scope and preserves overlapping rules", () => {
  const { s, t } = fixture();
  const op = { tourIds: [t.id], from: day, to: day, weekdays: [4] };
  calendarOperation(s, { ...op, times: [], action: "capacity", capacity: 25 });
  calendarOperation(s, { ...op, times: ["10:00"], action: "close" });
  const ruleId = t.calendarRules!.at(-1)!.id;
  t.slots[0].reserved = 5;
  calendarOperation(s, { ...op, ruleId, times: ["14:00"], action: "close" });
  assert.equal(t.calendarRules!.length, 2);
  assert.equal(t.calendarRules!.at(-1)!.id, ruleId);
  assert.equal(t.slots[0].closed, false);
  assert.equal(t.slots[0].capacity, 25);
  assert.equal(t.slots[0].reserved, 5);
  assert.equal(t.slots[1].closed, true);
});
function pragueLocalTime(startsAt: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Prague",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(startsAt));
}
test("T22 public schedule copy follows actual openings rather than obsolete marketing strings", () => {
  const { s, t } = fixture();
  t.operatingDays = "Testo obsoleto";
  t.departureTime = "09:99";
  let p = publicTour(s, t);
  assert.equal(p.operatingDays, "Giovedì");
  assert.equal(p.departureTime, "10:00, 14:00");
  calendarOperation(s, {
    tourIds: [t.id],
    from: day,
    to: day,
    weekdays: [4],
    times: ["14:00"],
    action: "close",
  });
  p = publicTour(s, t);
  assert.equal(p.departureTime, "10:00");
  s.closedDates = [day];
  assert.equal(publicTour(s, t).operatingDays, "Nessuna partenza disponibile");
});
test("A04 multiple lines and two departures of one tour never implicitly create a commission package", () => {
  const { t } = fixture();
  assert.equal(
    isCommissionPackage(t, [{ tourSlug: t.slug }, { tourSlug: "other" }]),
    false,
  );
  t.commissionPackageWith = ["other"];
  assert.equal(
    isCommissionPackage(t, [{ tourSlug: t.slug }, { tourSlug: t.slug }]),
    false,
  );
  assert.equal(
    isCommissionPackage(t, [{ tourSlug: t.slug }, { tourSlug: "other" }]),
    true,
  );
  assert.equal(isCommissionPackage(t, [{ tourSlug: "other" }]), false);
});
test("A09 custom affiliate types validate and select matching commission snapshots", () => {
  const { t } = fixture();
  const a = affiliateSchema.parse({
    code: "CUSTOM",
    name: "Associazione",
    email: "test@example.com",
    type: "associazione culturale",
    commissionPercent: 0,
    active: true,
  });
  t.commissionRules = [
    commissionRuleSchema.parse({
      affiliateType: a.type,
      product: "paid",
      mode: "fixed",
      value: 150,
    }),
  ];
  t.isFreeTour = false;
  assert.equal(commissionFor(t, a, 10000, 3, false).commissionCents, 450);
  assert.equal(
    commissionFor(t, a, 10000, 3, false).commissionRuleSnapshot?.affiliateType,
    a.type,
  );
});
test("T21 payment configuration defaults to cash and does not advertise unconfigured bank transfers", () => {
  assert.deepEqual(paymentMethodsFor({}), ["cash"]);
  assert.deepEqual(
    paymentMethodsFor({ paymentMethods: ["bank_transfer"] }),
    [],
  );
  assert.deepEqual(
    paymentMethodsFor({
      paymentMethods: ["cash", "bank_transfer"],
      paymentInstructions: "IBAN e beneficiario confermati",
    }),
    ["cash", "bank_transfer"],
  );
});
test("CMS local images validate without allowing traversal, query parameters or executable formats", () => {
  assert.equal(
    tourImageUrlSchema.safeParse("/images/hero-prague-dusk.png").success,
    true,
  );
  for (const path of [
    "/images/../secrets.png",
    "/images/x.svg",
    "//evil.test/x.png",
    "/images/x.png?foo=1",
  ])
    assert.equal(tourImageUrlSchema.safeParse(path).success, false);
});

test("bank-transfer commissions mature only after collection, without changing cash semantics", async () => {
  const { commissionMatured } = await import("../src/lib/platform/commissions");
  const { s, t } = fixture();
  const b = {
    tourSlug: t.slug,
    slotId: t.slots[0].id,
    paymentMethod: "bank_transfer",
    totalCents: 1000,
    paymentStatus: "pending",
    status: "confirmed",
  } as import("../src/lib/platform/model").Reservation;
  const after = Date.parse(t.slots[0].endsAt) + 1;
  assert.equal(commissionMatured(s, b, after), false);
  b.paymentStatus = "paid";
  assert.equal(commissionMatured(s, b, after), true);
  b.paymentMethod = "cash";
  b.paymentStatus = "not_required";
  assert.equal(commissionMatured(s, b, after), true);
});

test("JSONB key order does not create false calendar conflicts or schedule edits", async () => {
  const { jsonEqual } = await import("../src/lib/json-equal");
  assert.equal(
    jsonEqual(
      [{ id: "r", action: "open", capacity: 20 }],
      [{ capacity: 20, action: "open", id: "r" }],
    ),
    true,
  );
  assert.equal(
    jsonEqual(
      { enabled: true, times: ["10:00"], weekdays: [1, 2] },
      { weekdays: [1, 2], times: ["10:00"], enabled: true },
    ),
    true,
  );
  assert.equal(jsonEqual({ capacity: 20 }, { capacity: 21 }), false);
  assert.equal(
    jsonEqual({ times: ["10:00", "14:00"] }, { times: ["14:00", "10:00"] }),
    false,
  );
});

test("public catalogue does not expose commission configuration or inactive bank instructions", () => {
  const { s, t } = fixture();
  t.commissionRules = [
    { affiliateType: "agency", product: "paid", mode: "fixed", value: 200 },
  ];
  t.commissionPackageWith = ["private"];
  t.paymentInstructions = "Bank details still in draft";
  t.paymentMethods = ["cash"];
  const p = publicTour(s, t);
  assert.equal("commissionRules" in p, false);
  assert.equal("commissionPackageWith" in p, false);
  assert.equal("paymentInstructions" in p, false);
});

test("manual departures and cutoff drive the same public schedule and bookable times", async()=>{
 const {pragueLocal}=await import("../src/lib/platform/time");
 const {s,t}=fixture();t.schedule=undefined;t.calendarRules=[];t.closures=[];t.bookingCutoffHours=2;t.departureTime="obsoleto";
 t.slots.forEach((slot,i)=>{slot.startsAt=new Date(Date.now()+(i===0?1:5)*3600000).toISOString();slot.endsAt=new Date(Date.parse(slot.startsAt)+3600000).toISOString();});
 const p=publicTour(s,t);assert.equal(p.slots.length,1);assert.equal(p.departureTime,pragueLocal(p.slots[0].startsAt).slice(11,16));
});
