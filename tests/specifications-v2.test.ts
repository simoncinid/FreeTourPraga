import { test } from "node:test";
import assert from "node:assert/strict";
import { initialState } from "../src/lib/platform/store";
import { quote } from "../src/lib/platform/booking";
import { applySpecifications } from "../src/lib/platform/specifications";
import {
  commissionFor,
  commissionMatured,
} from "../src/lib/platform/commissions";
import { calendarOperation } from "../src/lib/platform/calendar-operations";
import { generateScheduledSlots } from "../src/lib/platform/scheduling";
import { categoriesFor, selectedPrices } from "../src/lib/participant-pricing";
import {
  recordPartnerClick,
  partnerSchema,
} from "../src/lib/platform/partners";
import { partnerStats } from "../src/lib/partner-statistics";
import {
  tourSchema,
  calendarOperationSchema,
  pageSchema,
} from "../src/lib/platform/validation";
import { siteContentSchema } from "../src/lib/platform/content-validation";
import { defaultSiteContent } from "../src/lib/platform/content";
import { siteNavigation } from "../src/lib/navigation";
import type { Reservation, Affiliate } from "../src/lib/platform/model";
function fixture() {
  const s = initialState(),
    t = s.tours[0];
  t.isFreeTour = false;
  t.maxGuests = 80;
  t.currency = "CZK";
  t.onlineDiscounts = false;
  t.slots = [
    {
      id: "slot",
      tourId: t.id,
      startsAt: "2027-07-01T08:00:00.000Z",
      endsAt: "2027-07-01T10:00:00.000Z",
      capacity: 80,
      reserved: 3,
    },
  ];
  t.priceCategories = [
    { id: "adults", label: "Adulti", priceCents: 125000, minAge: 17 },
    {
      id: "students",
      label: "Studenti fino a 26 anni",
      priceCents: 112500,
      maxAge: 26,
    },
    { id: "senior", label: "Over 65", priceCents: 112500, minAge: 65 },
  ];
  return { s, t };
}
test("overlapping categories remain visible; server counts each selected person once at its current price", () => {
  const { s, t } = fixture();
  const participants = [
    { categoryId: "adults", quantity: 1 },
    { categoryId: "students", quantity: 2 },
  ];
  const input = {
    items: [
      {
        tourSlug: t.slug,
        slotId: "slot",
        adults: 999,
        children: 0,
        infants: 0,
        participants,
      },
    ],
    affiliateCode: "",
  };
  const q = quote(s, input)[0];
  assert.equal(q.totalGuests, 3);
  assert.equal(q.adults, 3);
  assert.equal(q.totalCents, 350000);
  assert.equal(q.currency, "CZK");
  assert.equal(q.discountCents, 0);
  assert.equal(q.categorySnapshot!.length, 2);
  assert.equal(categoriesFor(t).length, 3);
  assert.equal(tourSchema.safeParse(t).success, true);
});
test("unknown, duplicated, fractional, negative and empty category selections fail", () => {
  const { t } = fixture();
  for (const p of [
    [{ categoryId: "missing", quantity: 1 }],
    [
      { categoryId: "adults", quantity: 1 },
      { categoryId: "adults", quantity: 1 },
    ],
    [{ categoryId: "adults", quantity: 1.5 }],
    [{ categoryId: "adults", quantity: -1 }],
    [],
  ])
    assert.throws(() => selectedPrices(t, p));
});
test("missing dynamic categories and mixed currency carts cannot reach checkout", () => {
  const { s, t } = fixture();
  const item = {
    tourSlug: t.slug,
    slotId: "slot",
    adults: 1,
    children: 0,
    infants: 0,
  };
  assert.throws(
    () => quote(s, { items: [item], affiliateCode: "" }),
    /categorie/,
  );
  assert.throws(
    () =>
      quote(s, {
        items: [
          { ...item, participants: [{ categoryId: "adults", quantity: 1 }] },
          { ...item, tourSlug: s.tours[1].slug },
        ],
        affiliateCode: "",
      }),
    /valute diverse/,
  );
});
test("free group contact, fixed amount and threshold are configurable", () => {
  const { t } = fixture();
  t.isFreeTour = true;
  t.freeGroupLimit = 8;
  t.freeGroupMode = "contact";
  assert.equal(
    selectedPrices(t, [{ categoryId: "adults", quantity: 8 }]).subtotalCents,
    0,
  );
  assert.throws(
    () => selectedPrices(t, [{ categoryId: "adults", quantity: 9 }]),
    /8 persone/,
  );
  t.freeGroupMode = "fixed";
  t.freeGroupPriceCents = 1500;
  assert.equal(
    selectedPrices(t, [{ categoryId: "adults", quantity: 9 }]).subtotalCents,
    13500,
  );
  t.freeGroupMode = "none";
  assert.equal(
    selectedPrices(t, [{ categoryId: "adults", quantity: 20 }]).subtotalCents,
    0,
  );
});
test("commission rule specificity, fixed per person and package percentages are calculated independently", () => {
  const { t } = fixture();
  const a: Affiliate = {
    code: "GUIDA",
    name: "Test",
    email: "g@example.com",
    type: "guide",
    active: true,
    commissionPercent: 3,
  };
  t.commissionRules = [
    { affiliateType: "guide", product: "paid", mode: "fixed", value: 200 },
    {
      affiliateType: "guide",
      affiliateCode: "GUIDA",
      product: "paid",
      mode: "fixed",
      value: 350,
    },
    { affiliateType: "guide", product: "package", mode: "percent", value: 12 },
  ];
  assert.equal(commissionFor(t, a, 10000, 3, false).commissionCents, 1050);
  assert.equal(commissionFor(t, a, 10000, 3, true).commissionCents, 1200);
  const snapshot = commissionFor(t, a, 10000, 3, true).commissionRuleSnapshot!;
  t.commissionRules[2].value = 50;
  assert.equal(snapshot.value, 12);
});
test("commissions mature only after the end of a valid tour, including confirmed attendance by default", () => {
  const { s, t } = fixture();
  const b = {
    tourSlug: t.slug,
    slotId: "slot",
    status: "confirmed",
    paymentStatus: "not_required",
  } as Reservation;
  assert.equal(commissionMatured(s, b, Date.parse("2027-07-01T09:00Z")), false);
  assert.equal(commissionMatured(s, b, Date.parse("2027-07-01T11:00Z")), true);
  for (const status of ["cancelled", "no_show", "pending"] as const) {
    b.status = status;
    assert.equal(
      commissionMatured(s, b, Date.parse("2027-07-01T11:00Z")),
      false,
    );
  }
});
test("period capacity, closures and extra slots survive schedule regeneration without changing reserved seats", () => {
  const { s, t } = fixture();
  t.schedule = {
    enabled: true,
    from: "2027-07-01",
    to: "2027-07-10",
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    times: ["10:00"],
    capacity: 25,
  };
  const base = {
    tourIds: [t.id],
    from: "2027-07-01",
    to: "2027-07-03",
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    times: ["10:00"],
  };
  calendarOperation(s, { ...base, action: "capacity", capacity: 40 });
  calendarOperation(s, {
    ...base,
    from: "2027-07-02",
    to: "2027-07-02",
    action: "close",
  });
  calendarOperation(s, {
    ...base,
    action: "open",
    times: ["16:00"],
    capacity: 50,
  });
  generateScheduledSlots(t, Date.parse("2027-07-01T00:00Z"));
  assert.equal(t.slots.find((x) => x.id === "slot")!.capacity, 40);
  assert.equal(t.slots.find((x) => x.id === "slot")!.reserved, 3);
  assert.equal(
    t.slots.find((x) => x.startsAt === "2027-07-02T08:00:00.000Z")!.closed,
    true,
  );
  assert.equal(
    t.slots.filter((x) => x.startsAt === "2027-07-01T14:00:00.000Z").length,
    1,
  );
});
test("bulk calendar operation validates every tour before touching any target", () => {
  const { s, t } = fixture();
  t.slots[0].reserved = 12;
  const before = JSON.stringify(s.tours);
  assert.throws(
    () =>
      calendarOperation(s, {
        tourIds: [s.tours[1].id, t.id],
        from: "2027-07-01",
        to: "2027-07-01",
        weekdays: [0, 1, 2, 3, 4, 5, 6],
        times: [],
        action: "capacity",
        capacity: 10,
      }),
    /prenotati/,
  );
  assert.equal(JSON.stringify(s.tours), before);
  assert.equal(
    calendarOperationSchema.safeParse({
      tourIds: [t.id],
      from: "2027-02-30",
      to: "2027-03-01",
      action: "open",
      capacity: 10,
    }).success,
    false,
  );
});
test("partner statistics preserve totals and daily unique visitor counts for deleted partners", () => {
  const s = initialState();
  s.partners = [
    {
      id: "roma",
      name: "Roma",
      description: "",
      imageUrl: "",
      email: "",
      phone: "",
      website: "https://example.com",
      published: false,
      deleted: true,
    },
  ];
  recordPartnerClick(s, "roma", "a", "2027-07-01T08:00Z");
  recordPartnerClick(s, "roma", "a", "2027-07-01T09:00Z");
  recordPartnerClick(s, "roma", "b", "2027-07-01T10:00Z");
  recordPartnerClick(s, "roma", "a", "2027-07-02T08:00Z");
  const stats = partnerStats(s, "2027-07-01", "2027-07-02")[0];
  assert.equal(stats.clicks, 4);
  assert.equal(stats.uniqueVisitorDays, 3);
  assert.equal(stats.daily.length, 2);
  assert.equal(partnerStats(s, "2027-07-02", "2027-07-02")[0].clicks, 1);
  assert.equal(
    partnerSchema.safeParse({
      ...s.partners[0],
      website: "javascript:alert(1)",
    }).success,
    false,
  );
});
test("menu ordering and children persist, customer accounts stay excluded", () => {
  const c = defaultSiteContent();
  c.globals.navigation = [
    { label: "Contatti", href: "/contatti" },
    {
      label: "Altro",
      href: "/blog",
      children: [
        { label: "FAQ", href: "/faq" },
        { label: "Account", href: "/account" },
      ],
    },
    { label: "Account", href: "/account" },
  ];
  assert.equal(siteContentSchema.safeParse(c).success, true);
  assert.deepEqual(
    siteNavigation(c).map((n) => n.label),
    ["Contatti", "Altro"],
  );
  assert.equal(siteNavigation(c)[1].children!.length, 1);
});
test("new page and tour blocks reject unsafe image URLs and preserve ordered sections", () => {
  const { t } = fixture();
  const contentBlocks = [
    { type: "text", heading: "Itinerario", text: "Un percorso" },
    {
      type: "image",
      imageUrl: "https://images.unsplash.com/photo-1519677100203-a0e668c92439",
      alt: "Praga",
      caption: "Vista",
    },
  ];
  assert.equal(tourSchema.safeParse({ ...t, contentBlocks }).success, true);
  assert.equal(
    pageSchema.safeParse({
      title: "Test",
      subtitle: "",
      body: "",
      seoTitle: "",
      seoDescription: "",
      published: true,
      contentBlocks: [
        {
          type: "image",
          imageUrl: "javascript:alert(1)",
          alt: "",
          caption: "",
        },
      ],
    }).success,
    false,
  );
});
test("official brochure import updates seven records once, retains bookings and later editorial changes", () => {
  const s = initialState();
  const slugs = [
    "free-tour-praga",
    "citta-nuova-di-praga",
    "comunismo",
    "petrin-monastero-strahov",
    "tour-praga-esoterica",
    "interni-castello-praga",
  ];
  for (const slug of slugs)
    s.tours.push({ ...structuredClone(s.tours[0]), id: slug, slug });
  const before = s.tours[0].slots.map((x) => ({ ...x }));
  const result = applySpecifications(s, Date.parse("2026-11-22T12:00Z"));
  assert.equal(result.tours, 7);
  const castle = s.tours.find((t) => t.slug === "castello-praga-mala-strana")!;
  assert.equal(castle.currency, "CZK");
  assert.equal(castle.priceCategories![1].priceCents, 35000);
  assert.equal(castle.durationMinutes, 150);
  assert.equal(castle.onlineDiscounts, false);
  assert.equal(
    s.tours.find((t) => t.slug === "interni-castello-praga")!
      .operationalReviewRequired,
    true,
  );
  assert.deepEqual(s.tours[0].slots, before);
  castle.description = "Edited later";
  assert.equal(applySpecifications(s).applied, false);
  assert.equal(castle.description, "Edited later");
  assert.equal(siteContentSchema.safeParse(s.siteContent).success, true);
});

test("reopening one tour from a legacy global closure keeps other tours closed", () => {
  const { s, t } = fixture();
  s.closedDates = ["2027-07-01"];
  calendarOperation(s, {
    tourIds: [t.id],
    from: "2027-07-01",
    to: "2027-07-01",
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    times: ["10:00"],
    action: "open",
    capacity: 40,
  });
  assert.deepEqual(s.closedDates, []);
  assert.equal(t.slots.find((x) => x.id === "slot")!.closed, false);
  assert.equal(s.tours[1].calendarRules!.at(-1)!.action, "close");
});

test("clicks without statistics consent count in totals without inventing unique visitors", () => {
  const s = initialState();
  s.partners = [
    {
      id: "test",
      name: "Test",
      description: "",
      imageUrl: "",
      email: "",
      phone: "",
      website: "https://example.com",
      published: true,
    },
  ];
  recordPartnerClick(s, "test", "", "2027-07-01T08:00Z");
  recordPartnerClick(s, "test", "", "2027-07-01T09:00Z");
  const result = partnerStats(s, "2027-07-01", "2027-07-01")[0];
  assert.equal(result.clicks, 2);
  assert.equal(result.uniqueVisitorDays, 0);
  assert.equal(result.unmeasuredClicks, 2);
});
