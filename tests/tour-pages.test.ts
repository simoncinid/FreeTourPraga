import assert from "node:assert/strict";
import { test } from "node:test";
import records from "../src/content/tour-pages.json";
import { selectedPrices } from "../src/lib/participant-pricing";
import { applySpecifications } from "../src/lib/platform/specifications";
import { generateScheduledSlots } from "../src/lib/platform/scheduling";
import { initialState } from "../src/lib/platform/store";
import { applyTourPages } from "../src/lib/platform/tour-pages";
import { tourSchema } from "../src/lib/platform/validation";
import { bookingDeadlineNote, cancellationNote } from "../src/lib/tour-rules";

test("the eight tour records migrate once and keep committed departures and bookings", () => {
  const now = Date.parse("2026-11-25T09:00:00Z");
  const state = initialState();
  for (const record of records) {
    if (state.tours.some(({ slug }) => slug === record.slug)) continue;
    state.tours.push({
      ...structuredClone(state.tours[0]),
      slug: record.slug,
      id: record.slug,
      slots: [],
    });
  }
  applySpecifications(state, now);
  const free = state.tours.find(({ slug }) => slug === "free-tour-praga")!;
  const committedSlot = free.slots.find(({ startsAt }) =>
    startsAt.startsWith("2026-11-26"),
  )!;
  const endsAt = committedSlot.endsAt;
  state.bookings.push({
    id: "legacy-booking",
    slotId: committedSlot.id,
  } as (typeof state.bookings)[number]);
  const originalBooking = structuredClone(state.bookings[0]);

  assert.equal(applyTourPages(state, now).updated.length, 8);
  assert.deepEqual(state.bookings[0], originalBooking);
  assert.equal(committedSlot.endsAt, endsAt);
  assert.deepEqual(free.schedule?.times, ["10:00", "14:30"]);
  assert.match(
    cancellationNote(free, state.settings),
    /Cancellazione gratuita|prima dell’inizio/,
  );
  assert.equal(applyTourPages(state, now).applied, false);

  for (const record of records) {
    const tour = state.tours.find(({ slug }) => slug === record.slug)!;
    assert.equal(tourSchema.safeParse(tour).success, true, record.slug);
    assert.equal(tour.canonicalPath, record.canonicalPath);
    assert.equal(
      selectedPrices(tour, [{ categoryId: "adults", quantity: 1 }])
        .subtotalCents,
      record.priceCategories[0].priceCents,
    );
  }

  const inside = state.tours.find(
    ({ slug }) => slug === "interni-castello-praga",
  )!;
  assert.match(bookingDeadlineNote(inside), /24 ore.*12 ore/);
  assert.equal(
    inside.priceCategories?.find(({ id }) => id === "infants")?.maxAge,
    6,
  );
  const ter = state.tours.find(({ slug }) => slug === "terezin")!;
  assert.equal(ter.durationMinutes, 420);
  assert.equal(ter.bookingCutoffHours, 24);
  assert.equal(ter.cancellationHours, 48);
  assert.equal(
    ter.priceCategories?.find(({ id }) => id === "infants")?.maxAge,
    3,
  );
  const bunker = state.tours.find(({ slug }) => slug === "comunismo")!;
  generateScheduledSlots(bunker, now);
  assert.ok(bunker.slots.every(({ capacity }) => capacity <= 10));
});
