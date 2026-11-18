import type { CatalogTour, PlatformState } from "./model";
import { pragueInstant, pragueLocal } from "./time";

export function isClosed(
  state: Pick<PlatformState, "closedDates">,
  startsAt: string,
) {
  return (state.closedDates ?? []).includes(pragueLocal(startsAt).slice(0, 10));
}
export function isTourClosed(tour: CatalogTour, startsAt: string) {
  const local = pragueLocal(startsAt);
  return (tour.closures ?? []).some(
    (closure) =>
      closure.date === local.slice(0, 10) &&
      (!closure.times.length || closure.times.includes(local.slice(11, 16))),
  );
}
/** Deterministic IDs keep reservations stable across reads and schedule refreshes. */
export function generateScheduledSlots(tour: CatalogTour, now = Date.now()) {
  const schedule = tour.schedule;
  if (!schedule?.enabled) return;
  const today = pragueLocal(new Date(now).toISOString()).slice(0, 10);
  const start = schedule.from > today ? schedule.from : today;
  const cursor = new Date(`${start}T12:00:00Z`);
  const existing = new Map(tour.slots.map((slot) => [slot.id, slot]));
  const byStart = new Map(tour.slots.map((slot) => [slot.startsAt, slot]));
  for (
    let offset = 0;
    offset < 90;
    offset++, cursor.setUTCDate(cursor.getUTCDate() + 1)
  ) {
    const date = cursor.toISOString().slice(0, 10);
    if (date > schedule.to) break;
    if (!schedule.weekdays.includes(cursor.getUTCDay())) continue;
    for (const time of schedule.times) {
      const id = `schedule:${tour.id}:${date}:${time}`;
      let startsAt: string;
      try {
        startsAt = pragueInstant(`${date}T${time}`);
      } catch {
        continue;
      }
      const previous = existing.get(id) ?? byStart.get(startsAt);
      if (previous) {
        previous.closed = false;
        previous.capacity = Math.max(previous.reserved, schedule.capacity);
        if (!previous.reserved) previous.endsAt = new Date(Date.parse(startsAt) + tour.durationMinutes * 60000).toISOString();
        continue;
      }
      tour.slots.push({
        id,
        tourId: tour.id,
        startsAt,
        endsAt: new Date(
          Date.parse(startsAt) + tour.durationMinutes * 60000,
        ).toISOString(),
        capacity: schedule.capacity,
        reserved: 0,
      });
    }
  }
  tour.slots.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}
export function publicTour(state: PlatformState, tour: CatalogTour) {
  return {
    ...tour,
    cancellationHours:
      tour.cancellationHours ?? state.settings.cancellationHours,
    lateRefundPercent:
      tour.lateRefundPercent ?? state.settings.lateRefundPercent,
    slots: tour.operationalReviewRequired
      ? []
      : tour.slots
          .filter(
            (slot) =>
              !slot.closed &&
              !isTourClosed(tour, slot.startsAt) &&
              !isClosed(state, slot.startsAt) &&
              Date.parse(slot.startsAt) >
                Date.now() + tour.bookingCutoffHours * 3600000,
          )
          .map((slot) => ({ ...slot, capacity: Math.min(slot.capacity, 25) })),
  };
}
