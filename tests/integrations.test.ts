import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import {
  createOrder,
  cancelReservation,
  managedBooking,
  moveReservation,
} from "../src/lib/platform/booking";
import { readState, transaction, initialState } from "../src/lib/platform/store";
import { bookingManagementProof } from "../src/lib/platform/security";
import { checkoutSchema } from "../src/lib/platform/validation";
import { reservationIcs } from "../src/lib/platform/calendar";
let temp: string;
before(async () => {
  temp = await mkdtemp(join(tmpdir(), "ftp-integrations-"));
  process.env.PLATFORM_STORAGE = "local";
  process.env.PLATFORM_DATA_FILE = join(temp, "state.json");
  process.env.SESSION_SECRET =
    "local-test-session-secret-with-at-least-32-characters";
  process.env.BOOKING_LINK_SECRET =
    "local-test-booking-link-secret-with-32chars";
  await transaction((s) => {
    Object.assign(s, initialState());
    for (const t of s.tours)
      for (const slot of t.slots) {
        slot.startsAt = new Date(Date.now() + 7 * 86400000).toISOString();
        slot.endsAt = new Date(
          Date.now() + 7 * 86400000 + 7200000,
        ).toISOString();
      }
  });
});
after(async () => {
  await rm(temp, { recursive: true, force: true });
});
const input = () =>
  checkoutSchema.parse({
    items: [
      {
        tourSlug: "citta-vecchia-ponte-carlo",
        slotId: "old-town-4",
        adults: 1,
      },
    ],
    name: "Cliente Test",
    email: "cliente@example.com",
    phone: "+393331234567",
    paymentMethod: "cash",
    termsAccepted: true,
  });
test("cash checkout queues editable confirmation email and ICS", async () => {
  const order = await createOrder(input(), randomUUID());
  const state = await readState();
  const booking = state.bookings.find((b) => b.orderId === order.id)!;
  assert.equal(booking.status, "confirmed");
  assert.equal(booking.paymentMethod, "cash");
  const emails = state.jobs.filter(
    (j) => j.type === "email" && j.bookingPnr === booking.pnr && j.to === booking.email,
  );
  assert.equal(emails.length, 1);
  assert.match(emails[0].subject!, /Confermata/);
  assert.match(emails[0].html!, /Gestisci modifica o cancellazione/);
  assert.match(emails[0].calendar!, /STATUS:CONFIRMED/);
  assert.match(reservationIcs(state, booking), /STATUS:CONFIRMED/);
  assert.equal(
    state.jobs.filter((j) => j.key.startsWith("reminder-email:")).length,
    0,
  );
});
test("customer manage link can move and cancel safely", async () => {
  const state = await readState();
  const tour = state.tours.find((t) => t.slug === "citta-vecchia-ponte-carlo")!;
  const current = state.bookings.find((b) => b.status === "confirmed")!;
  const alt = tour.slots.find((s) => s.id !== current.slotId)!;
  await transaction((s) => {
    const t = s.tours.find((x) => x.slug === tour.slug)!;
    const slot = t.slots.find((x) => x.id === alt.id)!;
    slot.startsAt = new Date(Date.now() + 10 * 86400000).toISOString();
    slot.endsAt = new Date(Date.now() + 10 * 86400000 + 7200000).toISOString();
    slot.closed = false;
    slot.reserved = 0;
  });
  const proof = bookingManagementProof(current.id, current.pnr);
  const view = await managedBooking(current.pnr, proof);
  assert.equal(view.canCancel, true);
  assert.equal(view.canMove, true);
  await moveReservation(current.pnr, alt.id, "customer-link", proof);
  let saved = await readState();
  assert.equal(
    saved.bookings.find((b) => b.pnr === current.pnr)!.slotId,
    alt.id,
  );
  await cancelReservation(
    current.pnr,
    "Non posso più venire",
    "customer-link",
    proof,
  );
  saved = await readState();
  const cancelled = saved.bookings.find((b) => b.pnr === current.pnr)!;
  assert.equal(cancelled.status, "cancelled");
  const again = await cancelReservation(
    current.pnr,
    "ancora",
    "customer-link",
    proof,
  );
  assert.equal(again.status, "cancelled");
  const after = await managedBooking(current.pnr, proof);
  assert.equal(after.canCancel, false);
  assert.equal(after.canMove, false);
});
test("checkout rejects stripe payment method", () => {
  assert.throws(() =>
    checkoutSchema.parse({
      ...input(),
      paymentMethod: "stripe",
    }),
  );
});
