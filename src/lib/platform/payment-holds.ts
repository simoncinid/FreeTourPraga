import type { PlatformState } from "./model";

export function releaseExpired(state: PlatformState, now = Date.now()) {
  const expired = new Set(
    state.orders
      .filter((order) => Date.parse(order.expiresAt) <= now)
      .map((order) => order.id),
  );
  if (!expired.size) return;
  const cancelled = new Set<string>();
  for (const booking of state.bookings) {
    if (
      booking.status !== "pending" ||
      booking.paymentStatus === "paid" ||
      !expired.has(booking.orderId)
    )
      continue;
    const slot = state.tours
      .find((tour) => tour.slug === booking.tourSlug)
      ?.slots.find(({ id }) => id === booking.slotId);
    if (slot) slot.reserved = Math.max(0, slot.reserved - booking.totalGuests);
    booking.status = "cancelled";
    booking.paymentStatus = "failed";
    booking.cancellationReason = "Pagamento non completato entro la scadenza";
    cancelled.add(booking.pnr);
  }
  for (const job of state.jobs) {
    if (
      job.bookingPnr &&
      cancelled.has(job.bookingPnr) &&
      job.status === "queued"
    )
      job.status = "failed";
  }
}
