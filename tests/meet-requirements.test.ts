import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import {
  initialState,
  transaction,
  readState,
} from "../src/lib/platform/store";
import {
  generateScheduledSlots,
  isClosed,
  publicTour,
} from "../src/lib/platform/scheduling";
import {
  quote,
  createOrder,
  cancelReservation,
  moveReservation,
} from "../src/lib/platform/booking";
import {
  checkoutSchema,
  tourSchema,
  localDateSchema,
} from "../src/lib/platform/validation";
import { pragueLocal } from "../src/lib/platform/time";

let dir: string;
before(async () => {
  dir = await mkdtemp(join(tmpdir(), "ftp-meet-"));
  process.env.PLATFORM_STORAGE = "local";
  process.env.PLATFORM_DATA_FILE = join(dir, "state.json");
});
after(async () => {
  await rm(dir, { recursive: true, force: true });
});
function fixture() {
  const state = initialState();
  const tour = state.tours[0];
  tour.maxGuests = 25;
  tour.slots.forEach((slot, index) => {
    slot.startsAt = new Date(Date.now() + (7 + index) * 86400000).toISOString();
    slot.endsAt = new Date(Date.parse(slot.startsAt) + 7200000).toISOString();
    slot.capacity = 25;
    slot.reserved = 0;
  });
  return state;
}
function input(state: ReturnType<typeof fixture>, adults = 1) {
  return checkoutSchema.parse({
    items: [
      {
        tourSlug: state.tours[0].slug,
        slotId: state.tours[0].slots[0].id,
        adults,
      },
    ],
    name: "Ospite",
    email: "guest@example.com",
    phone: "+393331234567",
    paymentMethod: "cash",
    termsAccepted: true,
  });
}
test("weekly schedules use Prague wall time through DST, deduplicate reads and respect weekdays", () => {
  const tour = fixture().tours[0];
  tour.slots = [];
  tour.schedule = {
    enabled: true,
    from: "2027-03-27",
    to: "2027-03-29",
    weekdays: [6, 0],
    times: ["10:00", "14:00"],
    capacity: 25,
  };
  generateScheduledSlots(tour, Date.parse("2027-03-26T00:00:00Z"));
  assert.equal(tour.slots.length, 4);
  assert.equal(tour.slots[0].startsAt, "2027-03-27T09:00:00.000Z");
  assert.equal(tour.slots[2].startsAt, "2027-03-28T08:00:00.000Z");
  tour.slots[0].reserved = 3;
  generateScheduledSlots(tour, Date.parse("2027-03-26T00:00:00Z"));
  assert.equal(tour.slots.length, 4);
  assert.equal(tour.slots[0].reserved, 3);
});
test("global closures are based on Prague dates and block public inventory, checkout and moves", async () => {
  const state = fixture();
  const tour = state.tours[0];
  const bookingInput = input(state);
  state.closedDates = [pragueLocal(tour.slots[0].startsAt).slice(0, 10)];
  assert.ok(isClosed(state, tour.slots[0].startsAt));
  assert.ok(
    !publicTour(state, tour).slots.some((s) => s.id === tour.slots[0].id),
  );
  assert.throws(() => quote(state, bookingInput), /chiusa/);
  state.closedDates = [];
  await transaction((s) => Object.assign(s, state));
  const order = await createOrder(bookingInput, randomUUID());
  await transaction((s) => {
    s.closedDates = [pragueLocal(tour.slots[1].startsAt).slice(0, 10)];
  });
  await assert.rejects(
    () => moveReservation(order.pnrs[0], tour.slots[1].id, "staff"),
    /non disponibile/,
  );
  assert.equal((await readState()).bookings[0].slotId, tour.slots[0].id);
});
test("six free-tour participants stay free, seven cost exactly 12 euros each with no multi-tour discount", () => {
  const state = fixture();
  const tour = state.tours[0];
  tour.isFreeTour = true;
  assert.equal(quote(state, input(state, 6))[0].totalCents, 0);
  const seven = input(state, 7);
  seven.items.push({
    ...seven.items[0],
    tourSlug: state.tours[1].slug,
    slotId: state.tours[1].slots[0].id,
    adults: 1,
  });
  state.tours[1].slots[0].startsAt = tour.slots[0].startsAt;
  const q = quote(state, seven)[0];
  assert.equal(q.totalCents, 8400);
  assert.equal(q.discountCents, 0);
  assert.equal(q.unitChildCents, 1200);
  assert.match(q.bookingNote, /12.00 EUR/);
});
test("server enforces configured departure capacity and per-tour booking limit", () => {
  const state = fixture();
  const tour = state.tours[0];
  tour.slots[0].capacity = 100;
  assert.throws(() => quote(state, input(state, 26)), /Massimo/);
  tour.slots[0].capacity = 25;
  tour.slots[0].reserved = 24;
  assert.throws(() => quote(state, input(state, 2)), /Posti insufficienti/);
  tour.slots[0].reserved = 0;
  tour.maxGuests = 4;
  assert.throws(() => quote(state, input(state, 5)), /Massimo 4/);
});
test("per-tour policies are frozen and confirmation uses editable templates then cancel", async () => {
  const state = fixture();
  const tour = state.tours[0];
  tour.cancellationHours = 48;
  tour.lateRefundPercent = 35;
  state.settings.emailTemplates.confirmed.text =
    "TEST_TEMPLATE {nome} {tour} {pnr} {mappa}";
  await transaction((s) => Object.assign(s, state));
  const order = await createOrder(input(state), randomUUID());
  let saved = await readState();
  const b = saved.bookings[0];
  assert.equal(b.policy!.cancellationHours, 48);
  assert.equal(b.policy!.lateRefundPercent, 35);
  assert.ok(b.policy!.cancellationClause.trim().length > 0);
  const mail = saved.jobs.find(
    (j) => j.type === "email" && j.bookingPnr === b.pnr && j.to === b.email,
  )!;
  assert.match(mail.text!, /TEST_TEMPLATE/);
  assert.ok(mail.text!.includes(b.name));
  assert.ok(mail.text!.includes(tour.mapUrl));
  assert.equal(
    saved.jobs.filter((j) => j.key.startsWith("reminder-email:")).length,
    0,
  );
  await transaction((s) => {
    s.tours[0].cancellationHours = 1;
  });
  assert.equal((await readState()).bookings[0].policy!.cancellationHours, 48);
  await cancelReservation(order.pnrs[0], "Non posso partecipare", "staff");
  saved = await readState();
  assert.equal(saved.bookings[0].status, "cancelled");
});
test("admin validates calendar dates, capacity, scheduling and per-tour policies", () => {
  assert.equal(localDateSchema.safeParse("2026-02-30").success, false);
  const tour = fixture().tours[0];
  assert.equal(tourSchema.safeParse({ ...tour, maxGuests: 26 }).success, true);
  assert.equal(tourSchema.safeParse({ ...tour, maxGuests: 0 }).success, false);
  assert.equal(
    tourSchema.safeParse({ ...tour, lateRefundPercent: 101 }).success,
    false,
  );
  assert.equal(
    tourSchema.safeParse({
      ...tour,
      schedule: {
        enabled: true,
        from: "2027-01-02",
        to: "2027-01-01",
        weekdays: [1],
        times: ["10:00"],
        capacity: 25,
      },
    }).success,
    false,
  );
});
